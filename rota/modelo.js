// ============================================================
// modelo.js
// Busca e parseia documentos-modelo criados dentro do PJE.
//
// O modelo é um documento HTML criado pelo administrador
// diretamente no PJE (Configuração → Modelos de Documentos).
// Serve como base de dados interna para informações relacionais
// que não estão disponíveis via API direta, por exemplo:
//
//   JUIZ | UNIDADE | FINAL DO PROCESSO | SECRETÁRIO | ASSISTENTE
//
// Vantagem: sem Google Sheets, sem API Key externa, sem CORS.
// O modelo é buscado via API do próprio PJE e cacheado por 7 dias.
//
// Uso:
//   await modelo_carregar(ID_DO_MODELO)
//   const juiz = modelo_consultar('juiz', '0089')
// ============================================================


// ── Configuração ──────────────────────────────────────────────
//
// ID do modelo de documento criado no PJE.
// Ajuste conforme o ID gerado no seu PJE.
// Pode ser sobrescrito via CONFIGURACAO no storage.

const MODELO_TTL_DIAS = 7


// ── Carregar modelo ───────────────────────────────────────────
//
// Busca o modelo pelo ID, usando cache quando disponível.
// Parseia o HTML e armazena os dados em memória.
// Retorna o objeto de dados parseado ou null em caso de falha.

async function modelo_carregar(idModelo = '') {
    if (!idModelo) {
        console.error('[Rota PJE] modelo_carregar: ID do modelo não informado.')
        return null
    }

    const chaveCache = CACHE_CHAVES.modelo(idModelo)

    // Tenta o cache primeiro
    const cached = await cache_obter(chaveCache)
    if (cached) {
        modelo_armazenarEmMemoria(cached)
        return cached
    }

    // Busca via API do PJE
    const conteudo = await modelo_buscarAPI(idModelo)
    if (!conteudo) return null

    // Parseia o HTML do modelo
    const dados = modelo_parsear(conteudo)
    if (!dados) return null

    // Salva no cache por 7 dias
    await cache_salvar(chaveCache, dados, MODELO_TTL_DIAS)

    modelo_armazenarEmMemoria(dados)
    return dados
}


// ── Buscar via API ────────────────────────────────────────────
//
// Usa o endpoint de modelos de documentos do PJE.
// Requer autenticação — usa as credenciais da sessão ativa.

async function modelo_buscarAPI(idModelo = '') {
    let url = location.origin + '/pje-comum-api/api/modelosdocumentos/modelos/' + idModelo + '/corpo'
    return await rota_fetchPost(url)
}

async function modelo_buscarJuizesNoModelo(){
    let dados = await modelo_buscarAPI('1213484') || []
    if (!dados) return null
    return modelo_parsear(dados?.conteudo)
}

async function modelo_definirJuizPeloNumeroCNJ(numeroDoProcessoPadraoCNJ) {
  let idBusca = await buscarIdPeloNumeroCNJ(numeroDoProcessoPadraoCNJ) || null
  if (!idBusca) return null
  let historico = await rota_fetch(location.origin + '/pje-comum-api/api/processos/id/' + idBusca.id + '/historicodeslocamentos') || null
  if (!historico) return null
  let origem= historico[0]?.orgaoJulgadorOrigem?.descricao || null
  if (!origem) return null
  let ano = numeroDoProcessoPadraoCNJ.split('.')[1].slice(0,4)
  let final = ''
  if (ano < 2010){
    final = numeroDoProcessoPadraoCNJ.slice(4,5)
  } else {
    final = numeroDoProcessoPadraoCNJ.slice(6,7)
  }
  let juizesNoModelo = await modelo_buscarJuizesNoModelo() || null
  if (juizesNoModelo){
    console.log('%c[Rota PJE]%c juiz: ' + JSON.stringify(juizesNoModelo.find(d=> d.vara.trim() === origem.trim())?.juiz), LOG.rosa, 'color:inherit')
    return juizesNoModelo.find(d => d.vara.trim() === origem.trim())?.juiz ?? null
  }
  return null
}

// ── Parsear HTML do modelo ────────────────────────────────────
//
// O modelo é um documento HTML com uma tabela estruturada assim:
//
//   <table>
//     <thead>
//       <tr><th>juiz</th><th>unidade</th><th>final</th><th>secretario</th><th>assistente</th></tr>
//     </thead>
//     <tbody>
//       <tr><td>Dr. João</td><td>1ª Vara</td><td>0089</td><td>Maria</td><td>Pedro</td></tr>
//       ...
//     </tbody>
//   </table>
//
// Retorna um array de objetos com as colunas como chaves.

function modelo_parsear(htmlConteudo = '') {
    if (!htmlConteudo) return null
    try {
        const parser = new DOMParser()
        const doc    = parser.parseFromString(htmlConteudo, 'text/html')

        // Tenta tabela primeiro
        const tabela = doc.querySelector('table')
        if (tabela) {
            const cabecalhos = Array.from(
                tabela.querySelectorAll('thead th, thead td')
            ).map(th => th.textContent.trim().toLowerCase())
            if (!cabecalhos.length) return null
            return Array.from(tabela.querySelectorAll('tbody tr'))
                .map(linha => {
                    const celulas = Array.from(linha.querySelectorAll('td'))
                    const obj = {}
                    cabecalhos.forEach((chave, idx) => {
                        obj[chave] = celulas[idx]?.textContent?.trim() || ''
                    })
                    return obj
                })
                .filter(obj => Object.values(obj).some(v => v !== ''))
        }

        // Fallback: JSON embutido no texto
        const texto = doc.body.innerText.trim()
        return JSON.parse(texto)

    } catch (erro) {
        console.error('[Rota PJE] modelo_parsear:', erro)
        return null
    }
}


// ── Armazenamento em memória ──────────────────────────────────
//
// Mantém os dados do modelo em variável global para consultas
// síncronas após o carregamento inicial.

let _modelo_dados = null

function modelo_armazenarEmMemoria(dados) {
    _modelo_dados = Array.isArray(dados) ? dados : null
}


// ── Consultar ─────────────────────────────────────────────────
//
// Busca uma linha do modelo por coluna + valor.
// Retorna o objeto da linha ou null.
//
// Exemplos:
//   modelo_consultar('final', '0089')
//   → { juiz: 'Dr. João', unidade: '1ª Vara', final: '0089', ... }
//
//   modelo_consultar('juiz', 'João')   ← busca parcial (case-insensitive)

function modelo_consultar(coluna = '', valor = '') {
    if (!_modelo_dados || !coluna || valor === '') return null

    const valorNorm = String(valor).toLowerCase().trim()

    return _modelo_dados.find(linha => {
        const celula = String(linha[coluna] || '').toLowerCase().trim()
        return celula === valorNorm || celula.includes(valorNorm)
    }) || null
}


// ── Consultar por final do número ─────────────────────────────
//
// Atalho mais comum: identificar o juiz pelo final do processo.
// O "final" são os últimos 4 dígitos do número de ordem.

function modelo_consultarPorFinal(finalDoNumero = '') {
    return modelo_consultar('final', String(finalDoNumero).padStart(4, '0'))
}


// ── Listar todos os juízes ────────────────────────────────────
//
// Retorna array de strings com os nomes dos juízes disponíveis.
// Usado para popular o seletor de juiz no painel assistente.

function modelo_listarJuizes() {
    if (!_modelo_dados) return []
    return [...new Set(
        _modelo_dados
            .map(linha => linha['juiz'] || '')
            .filter(Boolean)
    )]
}


// ── Obter token XSRF ─────────────────────────────────────────
//
// Lê o token do cookie para autenticar a requisição POST.

function modelo_obterToken() {
    const match = document.cookie.match(/(?:^|;\s*)Xsrf-Token=([^;]+)/)
    return match ? match[1] : ''
}


// ── Forçar recarga ────────────────────────────────────────────
//
// Invalida o cache e recarrega o modelo da API.
// Útil quando o administrador atualiza o modelo no PJE.

async function modelo_recarregar(idModelo = '') {
    if (!idModelo) return null
    await cache_remover(CACHE_CHAVES.modelo(idModelo))
    _modelo_dados = null
    return await modelo_carregar(idModelo)
}
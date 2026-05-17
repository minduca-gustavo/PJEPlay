// =============================================================================
// seletores.js — Rota PJE
// Centraliza todos os seletores do DOM organizados por versão do PJE.
// Toda busca de elemento deve passar por sel() ou aguardarElemento().
// =============================================================================


// -----------------------------------------------------------------------------
// 1. CONFIGURAÇÃO DE VERSÕES
// -----------------------------------------------------------------------------

const VERSAO_FALLBACK = '2.18'

// Seletores que nunca mudaram entre versões.
// Cada entrada pode ter:
//   seletor     {string}   — seletor CSS (obrigatório)
//   propriedade {string}   — propriedade do elemento a verificar (opcional)
//   valor       {string}   — valor esperado da propriedade          (opcional)
// Se propriedade/valor ausentes: aguardarElemento resolve só com presença no DOM.

const SELETORES_BASE = {
  // Exemplo — preencha conforme mapeamento real:
  // menuPrincipal: {
  //   seletor: '#menu-principal',
  // },
}

const SELETORES = {
  '2.18': {
    ...SELETORES_BASE,
    // Exemplo:
    // botaoFinalizar: {
    //   seletor:     '#btn-finalizar-antigo',
    //   propriedade: 'value',
    //   valor:       'Finalizar',
    // },
  },
  '2.19': {
    ...SELETORES_BASE,
    // Exemplo:
    // botaoFinalizar: {
    //   seletor:     '#btn-finalizar',
    //   propriedade: 'textContent',
    //   valor:       'Finalizar',
    // },
  },
}


// -----------------------------------------------------------------------------
// 2. REGISTRO DE ERROS
// -----------------------------------------------------------------------------

// Acumulador silencioso — alimentado por sel() e aguardarElemento().
// Consultado pelo painel da extensão para exibir badge e relatório.
const errosDetectados = []

function registrarErro(chave, versao) {
  errosDetectados.push({
    chave,
    versao,
    url:  location.href,
    data: new Date().toISOString(),
  })
  // relatar() deve estar disponível globalmente via utilitarios.js ou similar
  if (typeof relatar === 'function')
    relatar(`sel(): chave "${chave}" não mapeada para v${versao}`, '', 'erro')
}

// Retorna cópia dos erros acumulados (para o painel de relatório).
function obterErros() {
  return [...errosDetectados]
}

// Limpa o acumulador (chamar após envio do relatório).
function limparErros() {
  errosDetectados.length = 0
}


// -----------------------------------------------------------------------------
// 3. RESOLUÇÃO DE ENTRADAS DO MAPA
// -----------------------------------------------------------------------------

// Retorna a entrada {seletor, propriedade?, valor?} para uma chave na versão
// atual, com fallback para VERSAO_FALLBACK. Retorna null se não encontrada.
function resolverEntrada(chave) {
  const versao  = obterArmazenamento('rota-versao') ?? VERSAO_FALLBACK
  const mapa    = SELETORES[versao] ?? SELETORES[VERSAO_FALLBACK]
  const entrada = mapa?.[chave] ?? null

  if (!entrada) registrarErro(chave, versao)

  return entrada
}


// -----------------------------------------------------------------------------
// 4. FUNÇÕES DE SELEÇÃO
// -----------------------------------------------------------------------------

// Função base — busca pelo seletor CSS diretamente.
// Mantida para uso pontual quando não é necessário passar pelo mapa.
function selecionar(seletor = '', ancestral = '', todos = false) {
  if (!seletor) return ''
  if (!ancestral || typeof ancestral !== 'object') ancestral = document
  try {
    return todos
      ? ancestral.querySelectorAll(seletor) || ''
      : ancestral.querySelector(seletor)    || ''
  } catch(e) {
    if (typeof relatar === 'function') relatar('selecionar erro:', e, 'erro')
    return ''
  }
}

// Função principal — resolve chave no mapa da versão e busca o elemento.
// Usar em todos os scripts no lugar de selecionar() direto.
function sel(chave, ancestral = '', todos = false) {
  const entrada = resolverEntrada(chave)
  if (!entrada) return ''
  return selecionar(entrada.seletor, ancestral, todos)
}


// -----------------------------------------------------------------------------
// 5. CONDIÇÃO DE "PRONTO"
// -----------------------------------------------------------------------------

// Verifica se o elemento satisfaz a condição de prontidão definida no mapa.
// Se a entrada não tem propriedade/valor, qualquer presença no DOM é suficiente.
function pronto(el, entrada) {
  if (!entrada.propriedade) return true
  const valorAtual = el[entrada.propriedade]
  if (typeof valorAtual === 'string')
    return valorAtual.trim() === entrada.valor
  return valorAtual === entrada.valor
}


// -----------------------------------------------------------------------------
// 6. AGUARDAR ELEMENTO
// -----------------------------------------------------------------------------

// Aguarda um elemento pelo mapa de seletores, respeitando a condição de pronto.
// chave    {string} — chave no mapa SELETORES
// timeout  {number} — ms até desistir (0 = sem limite)
// Retorna Promise<Element|null>
async function aguardarElementoNovo(chave, timeout = 0) {
  const entrada = resolverEntrada(chave)
  if (!entrada) return null

  return new Promise(resolver => {
    const checar = () => {
      const el = selecionar(entrada.seletor)
      if (el && pronto(el, entrada)) return el
      return null
    }

    // Verifica presença imediata antes de observar
    const elImediato = checar()
    if (elImediato) { resolver(elImediato); return }

    let timer = null

    const obs = new MutationObserver(() => {
      const el = checar()
      if (el) {
        if (timer) clearTimeout(timer)
        obs.disconnect()
        resolver(el)
      }
    })

    obs.observe(document, { childList: true, subtree: true })

    if (timeout > 0)
      timer = setTimeout(() => {
        obs.disconnect()
        registrarErro(`${chave} [timeout]`, obterArmazenamento('rota-versao') ?? VERSAO_FALLBACK)
        resolver(null)
      }, timeout)
  })
}
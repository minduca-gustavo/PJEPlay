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
    retificacaoAutuacaoPrimeirosBotoes:{
        seletor:  '.mat-step-text-label',

      },
    numeroProcessoJanelaDetalhesComTipo:{
      seletor: '.texto-numero-processo',
    },
    dataDoProcessoNaTarefa:{
      seletor: 'span[processo\\.caixa]',

    },
    botoesDeOrdenarNoPainelGlobal:{
      seletor: '.th-elemento-class',

    },
    tabelaDeProcessosNoPainelGlobal:{
      seletor: '[name*="Tabela de Processos"]',

    },
    botaoFiltroDePrioridadesNoPainelGlobal:{
      seletor: '[aria-label="Processos com Prioridade Processual"]',

    },
    botaoDesconsiderarFiltrosSelecionadosNoPainelGlobal:{
      seletor: '[aria-label="Desconsiderar Filtros Selecionados"]',

    },
    abrirTarefaDoProcessoNoPainelGlobal:{
      seletor: 'pje-descricao-processo'
    },
    barraSuperiorDetalhesDoProcesso:{
      seletor: 'mat-toolbar'
    },
    celulaDaTabelaDaPautaDeAudiencias:{
      seletor: 'span.cal-day-cell',
    },
    seletorDeJuizDaPautaDeAudiencias:{
      seletor: '#mat-select-0'
    }
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
async function resolverEntrada(chave) {
  const resultado = await obterArmazenamento('rota_versao')
  const versao = resultado?.rota_versao ?? VERSAO_FALLBACK
  //console.log('%c[Rota PJE]%c procurando agora versao: ' + versao, LOG.teste, 'color:inherit')
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
async function sel(chave, ancestral = '', todos = false) {
  //console.log('%c[Rota PJE]%c procurando agora sel: ' + chave, LOG.teste, 'color:inherit')
  const entrada = await resolverEntrada(chave)
  //console.log('%c[Rota PJE]%c procurando agora entrada: ' + JSON.stringify(entrada), LOG.teste, 'color:inherit')
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
  const v = typeof valorAtual === 'string' ? valorAtual.trim() : valorAtual
  if (entrada.valor instanceof RegExp) return entrada.valor.test(v)
  return v === entrada.valor
}


// -----------------------------------------------------------------------------
// 6. AGUARDAR ELEMENTO
// -----------------------------------------------------------------------------

// Aguarda um elemento pelo mapa de seletores, respeitando a condição de pronto.
// chave    {string} — chave no mapa SELETORES
// timeout  {number} — ms até desistir (0 = sem limite)
// Retorna Promise<Element|null>
async function aguardarElementoNovo(chave, timeout = 0) {
  const entrada = await resolverEntrada(chave)
  if (!entrada) return null
  console.log('%c[Rota PJE]%c procurando agora entrada do aguardarElementoNovo: ' + JSON.stringify(entrada), LOG.teste, 'color:inherit')
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
        registrarErro(`${chave} [timeout]`, obterArmazenamento('rota_versao') ?? VERSAO_FALLBACK)
        resolver(null)
      }, timeout)
  })
}


// Inicializado por detectarVersao() — disponível sincronamente depois disso.
let _rotaVersaoAtual = null

async function detectarVersao() {
  const el = document.querySelector('#modulo-versao')
  const texto = el?.textContent?.trim() ?? ''
  const versao = texto.match(/\d+\.\d+/)?.[0] ?? VERSAO_FALLBACK
  const versaoFinal = versao || VERSAO_FALLBACK
  _rotaVersaoAtual = versaoFinal          // ← linha nova
  armazenar({ rota_versao: versaoFinal })
  console.log('%c[Rota PJE]%c versão detectada: ' + versaoFinal, LOG.info, 'color:inherit')
}

detectarVersao()

// Retorna o seletor CSS de uma chave para a versão atual (síncrono).
// Usa a versão já armazenada em memória — não faz await.
// Retorna '' se a chave não existir no mapa.
function seletorPorVersao(chave) {
  const versao = _rotaVersaoAtual ?? VERSAO_FALLBACK
  const mapa   = SELETORES[versao] ?? SELETORES[VERSAO_FALLBACK]
  const entrada = mapa?.[chave] ?? null

  if (!entrada) {
    registrarErro(chave, versao)
    return ''
  }

  return entrada.seletor
}
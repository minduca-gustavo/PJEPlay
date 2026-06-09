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
    cabecalhoDosDocumentosDetalhes:{
      seletor: '.cabecalho-conteudo',
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
    containerDosGigsNoPainelGlobal:{
      seletor: '.tipo-atividade-container',
    },
    observacaoDosGigsNaTelaDosGigs:{
      seletor: '.texto-descricao',
    },
    descricaoDaPeticaoNoEscaninho:{
      seletor: '[mattooltip="Visualizar documento"]',
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
      seletor: 'mat-select',
      ancestral: '.cabecalho-pauta-audiencias'
    },
    seletorDeJuizDaPautaDeAudienciasAberto:{
      seletor: '#mat-select-0-panel'
    },
    seletorDeJuizDaPautaDeAudienciasOpcoes:{
      seletor: 'mat-option',
      ancestral: '#mat-select-0-panel'
    },
    botaoDesignarAudiencia:{
      seletor: '[aria-label*="Designar Audiência"]'
    },
    inputNumeroProcessoDesignarAudiencia:{
      seletor: '#inputNumeroProcesso',
      ancestral: 'mat-dialog-container'
    },
    inputLinkDesignarAudiencia:{
      seletor: '[name="url"]',
      ancestral: 'mat-dialog-container'
    },
    inputDataDesignarAudiencia:{
      seletor: '[name="dataAudiencia"]',
      ancestral: 'mat-dialog-container'
    },
    inputHorarioDesignarAudiencia:{
      seletor: '#horario',
      ancestral: 'mat-dialog-container'
    },
    inputTipoDesignarAudiencia:{
      seletor: '[name="Filtro Tipo da audiência"]',
      ancestral: 'mat-dialog-container'
    },
    opcoesTipoAudienciaDesignarAudienciaAberto:{
      seletor: 'mat-option',
      ancestral: '.mat-select-panel-wrap'
    },
    botoesConfirmarCancelarDesignarAudiencia:{
      seletor: 'button',
      ancestral: 'mat-dialog-container'
    },
    tituloDaTarefaNaJanelaDeTarefa:{
      seletor: '.texto-tarefa-processo',
    },
    botoesDeTarefaNaJanelaDeTarefa:{
      seletor: 'button',
      ancestral: 'pje-transicao-tarefa'
    },
    botoesDeTipoDeDespachoNaJanelaDeConclusao:{
      seletor: 'button',
      ancestral: 'pje-concluso-tarefa'
    },
    selecaoDeMagistradosNaTelaDaConclusao:{
      seletor: '.magistrado',
      ancestral: 'pje-concluso-tarefa-magistrado'
    },
    opcoesDeMagistradosNaTelaDaConclusao:{
      seletor: 'mat-option',
      ancestral: '.mat-select-panel-wrap'
    },
    botaoFecharDesignacaoDeAudiencia:{
      seletor: 'button',
      ancestral: '.container-conteudo'
    },
    corpoDoDocumentoNaTelaDeElaborarFundamentacao:{
      seletor: '.corpo',
      ancestral: '[aria-label*="Fundamentação"]'
    },
    corpoDoDocumentoNaTelaDeElaborarFundamentacaoFocar:{
      seletor: '[aria-label*="Fundamentação"]'
    },
    buscarModelosNaTelaDeElaborar:{
      seletor: '#inputFiltro',
      ancestral: 'pje-arvore-modelo-documento'
    },
    opcaoDeModeloNaTelaDeElaborarDespacho:{
      seletor: '.nodo-filtrado',
      ancestral: 'arvore-container'
    },
    botaoInserirModeloDeDespacho:{
      seletor: '[aria-label*="Inserir modelo de documento"]',
    },
    botaoEnviarParaAssinatura:{
      seletor: '[aria-label*="Enviar para assinatura"]',
      ancestral: 'botoes-acoes'
    },
    botaoNovaAtividadeGigsNaJanelaDetalhesDoProcesso:{
      seletor: '#nova-atividade',
      ancestral: 'pje-gigs-ficha-processo'
    },
    botaoSalvarGigsNaJanelaDetalhesDoProcesso:{
      seletor: '[aria-label="Salva as alterações"]',
      ancestral: 'pje-gigs-cadastro-atividades'
    },
    inputDataPrazoGigsNaJanelaDetalhesDoProcesso:{
      seletor: '[formcontrolname="dataPrazo"]',
      ancestral: 'pje-gigs-cadastro-atividades'
    },
    inputTipoAtividadeGigsNaJanelaDetalhesDoProcesso:{
      seletor: '[formcontrolname="tipoAtividade"]',
      ancestral: 'pje-gigs-cadastro-atividades'
    },
    inputResponsavelGigsNaJanelaDetalhesDoProcesso:{
      seletor: '[formcontrolname="responsavel"]',
      ancestral: 'pje-gigs-cadastro-atividades'
    },
    inputObservacaoGigsNaJanelaDetalhesDoProcesso:{
      seletor: '[formcontrolname="observacao"]',
      ancestral: 'pje-gigs-cadastro-atividades'
    },
    inputDiasGigsNaJanelaDetalhesDoProcesso:{
      seletor: '[formcontrolname="dias"]',
      ancestral: 'pje-gigs-cadastro-atividades'
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
async function sel(chave, ancestralExterno = '', todos = false) {
  const entrada = await resolverEntrada(chave)
  if (!entrada) return ''

  let ancestral = ancestralExterno
  if (!ancestral && entrada.ancestral) {
    ancestral = document.querySelector(entrada.ancestral) || document
  }

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
async function aguardarElementoNovo(chave, { modo = 'ou', timeout = 0 } = {}) {
  const chaves = Array.isArray(chave) ? chave : [chave]
  const entradas = await Promise.all(chaves.map(c => resolverEntrada(c)))
  if (entradas.some(e => !e)) return null

  const checar = () => {
    if (modo === 'e') {
      // todos precisam estar prontos — retorna o último
      const elementos = entradas.map(entrada => {
        let ancestral = document
        if (entrada.ancestral) ancestral = document.querySelector(entrada.ancestral) || document
        const el = selecionar(entrada.seletor, ancestral)
        return (el && pronto(el, entrada)) ? el : null
      })
      return elementos.every(Boolean) ? elementos[elementos.length - 1] : null
    } else {
      // qualquer um serve — retorna o primeiro encontrado
      for (const entrada of entradas) {
        let ancestral = document
        if (entrada.ancestral) ancestral = document.querySelector(entrada.ancestral) || document
        const el = selecionar(entrada.seletor, ancestral)
        if (el && pronto(el, entrada)) return el
      }
      return null
    }
  }

  return new Promise(resolver => {
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
        registrarErro(`${chaves.join(` ${modo.toUpperCase()} `)} [timeout]`, obterArmazenamento('rota_versao') ?? VERSAO_FALLBACK)
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
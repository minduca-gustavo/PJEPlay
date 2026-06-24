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

const SELETORES_218 = {
    ...SELETORES_BASE,
    retificacaoAutuacaoPrimeirosBotoes:{
        seletor:  '.mat-step-text-label',

      },
    detalhesDoProcessoNumeroProcessoComTipo:{
      seletor: '.texto-numero-processo',
    },
    detalhesDoProcessoCabecalhoDosDocumentos:{
      seletor: '.cabecalho-conteudo',
    },
    painelGlobalDataDoProcessoNaTarefa:{
      seletor: 'span[processo\\.caixa]',
    },
    painelGlogalBotoesDeOrdenar:{
      seletor: '.th-elemento-class',
    },
    painelGlobalTabelaDeProcessos:{
      seletor: '[name*="Tabela de Processos"]',
    },
    painelGlobalContainerDosGigs:{
      seletor: '.tipo-atividade-container',
    },
    relatoriosDoGigsObservacaoDosGigs:{
      seletor: '.texto-descricao',
    },
    escaninhoDescricaoDaPeticao:{
      seletor: '[mattooltip="Visualizar documento"]',
    },
    painelGlobalBotaoFiltroDePrioridades:{
      seletor: '[aria-label="Processos com Prioridade Processual"]',

    },
    painelGlobalBotaoDesconsiderarFiltrosSelecionados:{
      seletor: '[aria-label="Desconsiderar Filtros Selecionados"]',

    },
    painelGlobalAbrirTarefaDoProcesso:{
      seletor: 'pje-descricao-processo'
    },
    detalhesDoProcessoBarraSuperior:{
      seletor: 'mat-toolbar'
    },
    pautaDeAudienciaCelulaDaTabela:{
      seletor: 'span.cal-day-cell',
    },
    pautaDeAudienciaSeletorDeJuiz:{
      seletor: 'mat-select',
      ancestral: '.cabecalho-pauta-audiencias'
    },
    pautaDeAudienciaSeletorDeJuizAberto:{
      seletor: '.mat-select-panel-wrap'
    },
    pautaDeAudienciaSeletorDeJuizOpcoes:{
      seletor: 'mat-option',
      ancestral: '.mat-select-panel-wrap'
    },
    pautaDeAudienciaBotaoDesignarAudiencia:{
      seletor: '[aria-label*="Designar Audiência"]'
    },
    pautaDeAudienciaInputNumeroProcessoDesignarAudiencia:{
      seletor: '#inputNumeroProcesso',
      ancestral: 'mat-dialog-container'
    },
    pautaDeAudienciaInputLinkDesignarAudiencia:{
      seletor: '[name="url"]',
      ancestral: 'mat-dialog-container'
    },
    pautaDeAudienciaInputDataDesignarAudiencia:{
      seletor: '[name="dataAudiencia"]',
      ancestral: 'mat-dialog-container'
    },
    pautaDeAudienciaInputHorarioDesignarAudiencia:{
      seletor: '#horario',
      ancestral: 'mat-dialog-container'
    },
    pautaDeAudienciaInputTipoDesignarAudiencia:{
      seletor: '[name="Filtro Tipo da audiência"]',
      ancestral: 'mat-dialog-container'
    },
    pautaDeAudienciaOpcoesTipoAudienciaDesignarAudienciaAberto:{
      seletor: 'mat-option',
      ancestral: '.mat-select-panel-wrap'
    },
    pautaDeAudienciaBotoesConfirmarCancelarDesignarAudiencia:{
      seletor: 'button',
      ancestral: 'mat-dialog-container'
    },
    tarefaDoProcessoTituloDaTarefa:{
      seletor: '.texto-tarefa-processo',
    },
    tarefaDoProcessoBotoesDeTarefa:{
      seletor: 'button',
      ancestral: 'pje-transicao-tarefa'
    },
    conclusaoAoMagistradoBotoesDeTipoDeDespacho:{
      seletor: 'button',
      ancestral: 'pje-concluso-tarefa'
    },
    conclusaoAoMagistradoSelecaoDeMagistrados:{
      seletor: '.magistrado',
      ancestral: 'pje-concluso-tarefa-magistrado'
    },
    conclusaoAoMagistradoOpcoesDeMagistrados:{
      seletor: 'mat-option',
      ancestral: '.mat-select-panel-wrap'
    },
    pautaDeAudienciaBotaoFecharDesignacaoDeAudiencia:{
      seletor: 'button',
      ancestral: '.container-conteudo'
    },
    elaborarDespachoCorpoDoDocumentoFundamentacao:{
      seletor: '.corpo',
      ancestral: '[aria-label*="Fundamentação"]'
    },
    elaborarDespachoCorpoDoDocumentoFundamentacaoFocar:{
      seletor: '[aria-label*="Fundamentação"]'
    },
    elaborarDespachoBuscarModelos:{
      seletor: '#inputFiltro',
      ancestral: 'pje-arvore-modelo-documento'
    },
    elaborarDespachoOpcaoDeModelo:{
      seletor: '.nodo-filtrado',
      ancestral: 'arvore-container'
    },
    elaborarDespachoInserirModelo:{
      seletor: '[aria-label*="Inserir modelo de documento"]',
    },
    elaborarDespachoBotaoEnviarParaAssinatura:{
      seletor: '[aria-label*="Enviar para assinatura"]',
      ancestral: 'botoes-acoes'
    },
    detalhesDoProcessoBotaoNovaAtividadeGigs:{
      seletor: '#nova-atividade',
      ancestral: 'pje-gigs-ficha-processo'
    },
    detalhesDoProcessoBotaoSalvarGigs:{
      seletor: '[aria-label="Salva as alterações"]',
      ancestral: 'pje-gigs-cadastro-atividades'
    },
    detalhesDoProcessoInputDataPrazoGigs:{
      seletor: '[formcontrolname="dataPrazo"]',
      ancestral: 'pje-gigs-cadastro-atividades'
    },
    detalhesDoProcessoInputTipoAtividadeGigs:{
      seletor: '[formcontrolname="tipoAtividade"]',
      ancestral: 'pje-gigs-cadastro-atividades'
    },
    detalhesDoProcessoInputResponsavelGigs:{
      seletor: '[formcontrolname="responsavel"]',
      ancestral: 'pje-gigs-cadastro-atividades'
    },
    detalhesDoProcessoInputObservacaoGigs:{
      seletor: '[formcontrolname="observacao"]',
      ancestral: 'pje-gigs-cadastro-atividades'
    },
    detalhesDoProcessoInputDiasGigs:{
      seletor: '[formcontrolname="dias"]',
      ancestral: 'pje-gigs-cadastro-atividades'
    },
    detalhesDoProcessoInputTipoDeDocumento:{
      seletor: '[aria-label="Tipo de Documento"]',
      ancestral: 'pje-anexar-tipo-documento'
    },
    detalhesDoProcessoInputDescricaoDeDocumento:{
      seletor: '[aria-label="Descrição"]'
      /*ancestral: '.mat-form-field'*/
    },
    anexarDocumentosBuscarModelos:{
      seletor: '#inputFiltro',
      ancestral: 'pje-arvore-modelo-documento'
    },
    anexarDocumentosBotaoAssinar:{
      seletor: '[aria-label="Assinar documento e juntar ao processo"]',
      ancestral: '.botoes-acoes'
    },
    prepararExpedientesSeletorTipoDeExpediente:{
      seletor: 'mat-select',
      ancestral: 'pje-pec-ato-agrupado'
    },
    prepararExpedientesBotaoConfeccionarAtoAgrupado:{
      seletor: '[name="btn-confeccionar-ato-agrupado"]',
      ancestral: '.pec-ato-agrupado'
    },
    prepararExpedientesSeletorTipoDeExpedienteAberto:{
      seletor: 'mat-option',
      ancestral: '.mat-select-panel-wrap'
    },
    elaborarAtoNaTelaDePrepararExpedientes:{
      seletor: 'pje-anexar-documento',
      ancestral: 'pje-pec-dialogo-ato'
    },
    prepararExpedientesAtoConfeccionado:{
      seletor: '[aria-label="Ato confeccionado"]',
      ancestral: '.pec-coluna-confeccionar-ato-individual-tabela-destinatarios'
    },
    prepararExpedientesBotaoPoloAtivo:{
      seletor: '[name="btnIntimarSomentePoloAtivo"]',
      ancestral: '.pec-painel-expansivel-partes-processo'
    },
    prepararExpedientesBotaoSalvar:{
      seletor: '[aria-label="Salva os expedientes"]',
      ancestral: '.pec-botoes-acoes-expedientes'
    },
    prepararExpedientesBotaoAssinar:{
      seletor: '[aria-label="Assinar ato(s)"]',
      ancestral: '.pec-botoes-acoes-expedientes'
    },
    elaborarAtoSeletorTipoDeDocumento:{
      seletor: '[aria-label="Tipo de Documento"]',
      ancestral: 'pje-anexar-tipo-documento'
    },
    elaborarAtoInputDescricao:{
      seletor: '[aria-label="Descrição"]',
      //ancestral: '.mat-form-field'
    },
    elaborarAtoFinalizarMinuta:{
      seletor: '[aria-label="Finalizar minuta"]',
      ancestral: '.botoes-acoes'
    },
    elaborarAtoCampoAssinaturaOpcional:{
      seletor: '[aria-label*="Assinatura (opcional)"]',
    },
    elaborarAtoConteudoPrincipalDaMinuta:{
      seletor: '[aria-label*="Conteúdo principal"]',
    },
    prepararExpedientesMensagemModeloInserido:{
      seletor: 'snack-bar-container',
      //ancestral: '.cdk-overlay-pane'
    },
    prepararExpedientesRodinhaGirando:{
      seletor: 'mat-progress-spinner',
      //ancestral: '.cdk-overlay-pane'
    },
    prepararExpedientesMensagemAguarde:{
      seletor: 'mat-dialog-container',
      ancestral: '.cdk-overlay-pane'
    },
    prepararExpedientesVerificarCarregamentoDestinatario:{
      seletor: 'mat-form-field',
    }
    
    
    // Exemplo:
    // botaoFinalizar: {
    //   seletor:     '#btn-finalizar-antigo',
    //   propriedade: 'value',
    //   valor:       'Finalizar',
    // },
}

const SELETORES = {
  '2.18': SELETORES_218,
  '2.19': {
    ...SELETORES_218,  // herda tudo — só sobrescreva o que quebrou
    detalhesDoProcessoBotaoAbrirAnexos:{
      seletor: '.botao-anexos',
      ancestral: 'pje-timeline-anexos'
    },
    detalhesDoProcessoMostrarOuEsconderGigs:{
      seletor: '[name="Mostrar ou Esconder o GIGS"]',
    },
    detalhesDoProcessoOJDoProcesso:{
      seletor: '.oj-cargo'
    },
    pautaDeAudienciaConfirmacaoSala:{
      seletor: '[name="sala"]',
    },
    pautaDeAudienciaConfirmacaoJuizSelecionado:{
      seletor: '.mat-focused',
    },
    pautaDeAudienciaMetaQuadroHorariosVagos:{
      seletor: 'meta[name="rota-horarios_vagos"]',
    },
    tarefaDoProcessoTituloDaTarefa:{
      seletor: '.texto-tarefa-processo',
    },
    //detalhesDoProcessoBarraSuperior:{
    //  seletor: 'mat-toolbar'
    //},
    // Exemplo:
    // botaoFinalizar: {
    //   seletor:     '#btn-finalizar',
    //   propriedade: 'textContent',
    //   valor:       'Finalizar',
    // },
  },
  '2.20': {
    ...SELETORES_218,  // herda tudo — só sobrescreva o que quebrou
    detalhesDoProcessoBotaoAbrirAnexos:{
      seletor: '.botao-anexos',
      ancestral: 'pje-timeline-anexos'
    },
    detalhesDoProcessoOJDoProcesso:{
      seletor: '.oj-cargo'
    },
    pautaDeAudienciaConfirmacaoSala:{
      seletor: '[name="sala"]',
    },
    pautaDeAudienciaConfirmacaoJuizSelecionado:{
      seletor: '.mat-focused',
    },
    pautaDeAudienciaMetaQuadroHorariosVagos:{
      seletor: 'meta[name="rota-horarios_vagos"]',
    },
    detalhesDoProcessoMostrarOuEsconderGigs:{
      seletor: '[name="Mostrar ou Esconder o GIGS"]',
    },
    tarefaDoProcessoTituloDaTarefa:{
      seletor: '.texto-tarefa-processo',
    },
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
  if (entrada.texto) {
    const textoEl = el.textContent?.trim() ?? '';
    if (entrada.texto instanceof RegExp) {
      if (!entrada.texto.test(textoEl)) return false;
    } else {
      if (!textoEl.includes(entrada.texto)) return false;
    }
  }

  if (!entrada.propriedade) return true;
  const valorAtual = el[entrada.propriedade];
  const v = typeof valorAtual === 'string' ? valorAtual.trim() : valorAtual;
  if (entrada.valor instanceof RegExp) return entrada.valor.test(v);
  return v === entrada.valor;
}


// -----------------------------------------------------------------------------
// 6. AGUARDAR ELEMENTO
// -----------------------------------------------------------------------------

// Aguarda um elemento pelo mapa de seletores, respeitando a condição de pronto.
// chave    {string} — chave no mapa SELETORES
// timeout  {number} — ms até desistir (0 = sem limite)
// Retorna Promise<Element|null>
async function aguardarElementoNovo(chave, { modo = 'ou', timeout = 0, texto } = {}) {
  const chaves = Array.isArray(chave) ? chave : [chave]
  const entradas = await Promise.all(
    chaves.map(async c => {
      const entrada = await resolverEntrada(c)
      return entrada ? { ...entrada, texto } : null
    })
  )
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
  let versao = await obterArmazenamento('rota_versao')
  versao = versao?.rota_versao ?? VERSAO_FALLBACK
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

        registrarErro(`${chaves.join(` ${modo.toUpperCase()} `)} [timeout]`, versao)
        resolver(null)
      }, timeout)
  })
}

function aguardarElementoMudar(elemento, atributo) {
  return new Promise((resolve) => {
    const obs = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.attributeName === atributo) {
          obs.disconnect();
          resolve(elemento.getAttribute(atributo));
        }
      }
    });
    obs.observe(elemento, { attributes: true, attributeFilter: [atributo] });
  });
}
// Inicializado por detectarVersao() — disponível sincronamente depois disso.
let _rotaVersaoAtual = null

async function detectarVersao() {
  const el = document.querySelector('#modulo-versao')
  const texto = el?.textContent?.trim() ?? ''
  const versaoDetectada = texto.match(/\d+\.\d+/)?.[0]

  if (versaoDetectada) {
    _rotaVersaoAtual = versaoDetectada
    armazenar({ rota_versao: versaoDetectada })
    console.log('%c[Rota PJE]%c versão detectada: ' + versaoDetectada, LOG.info, 'color:inherit')
  } else {
    // Usa o que já está no storage, sem sobrescrever
    const resultado = await obterArmazenamento('rota_versao')
    _rotaVersaoAtual = resultado?.rota_versao ?? VERSAO_FALLBACK
    console.log('%c[Rota PJE]%c versão não detectada, usando: ' + _rotaVersaoAtual, LOG.info, 'color:inherit')
  }
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
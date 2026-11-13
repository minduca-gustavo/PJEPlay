/* FUNÇÃO DE BUSCA NO CONSOLE.
function rota_movimentar_lerBotoesDisponiveis() {
  const botoes = [...document.querySelectorAll('.botao-app, .botao-skinny')]
  const textos = [...document.querySelectorAll('.texto-botao-skinny')]
    .map(t => t.closest('button'))
    .filter(b => b && !b.classList.contains('botao-app') && !b.classList.contains('botao-skinny'))

  const todos = [...botoes, ...textos]
  const nomes = todos
    .map(b =>
      b.querySelector('.texto-botao-app')?.textContent?.trim()
      ?? b.querySelector('.texto-botao-skinny')?.textContent?.trim()
    )
    .filter(Boolean)

  const resultado = { alcanca: nomes }
  console.log(JSON.stringify(resultado, null, 2))
  return resultado
}
rota_movimentar_lerBotoesDisponiveis()

*/
// ============================================================
// movimentar.js
// ============================================================


// ------------------------------------------------------------
// MAPA DE ROTAS
// ------------------------------------------------------------
const MAPA_ROTAS = {
  'Análise': {
    alcanca: [
      "Aguardando audiência",
      "Aguardando prazo",
      "Arquivar o processo",
      "Comunicações e expedientes",
      "Conclusão ao magistrado",
      "Controle de acordo",
      "Cumprimento de providências",
      "Devolver processo para vara de origem",
      "Encaminhar ao CEJUSC",
      "Encaminhar ao posto avançado",
      "Finalizar plantão",
      "Iniciar execução",
      "Iniciar liquidação",
      "Redistribuir",
      "Remeter ao 2o Grau",
      "Sobrestamento",
      "Trânsito em Julgado",
      "Controle de Parcelamento",
      "Carta precatória",
    ]
  },
  'Aguardando audiência': {
    alcanca: [
      "Análise",
    ]
  },
  'Aguardando cumprimento de acordo':{
    alcanca: [
      "Acordo QUITADO",
      "Análise",
      "Acordo NÃO quitado",
    ]
  },
  'Aguardando final do sobrestamento':{
    alcanca: [
      { nome: 'Análise', ariaLabel: 'Encerrar sobrestamento' },
    ]
  },
  'Aguardando prazo': {
    alcanca: [
      "Análise",
    ]
  },
  'Cumprimento de Providências': {
    alcanca: [
      "Análise",
    ]
  },
  'Escolher tipo de arquivamento':{
    alcanca: [
      "Arquivar carta",
      "Arquivo definitivo",
      "Análise",
    ]
  },
  'Escolher tipo de sobrestamento':{
    alcanca: [
      "Análise",
      "Gravar os movimentos a serem lançados"
    ]
  },
  'Prazos Vencidos':{
    alcanca: [
      "Análise",
    ]
  },
  'Conclusão ao magistrado': {
    alcanca: [
      { nome: 'Análise', ariaLabel: 'Cancelar Conclusão' },
      "Despacho", 
      "Sentença",
      "Sentença Parcial", 
      "Extinção da Execução", 
      "Sentença Geral",
      "Embargos de Declaração",
      "Embargos à Execução / Impugnação à Sentença de Liquidação",
      "Homologação de Acordo",
      "Homologação de Cálculos",
      "Homologação de Arrematação / Adjudicação",
      "Pedido de Tutela",
      "Admissibilidade de Recursos", 
      "Sobrestamento / Suspensão", 
      "BACEN / BNDT / Sigilo Fiscal / Indisponibilidade de Bens",
      "IDPJ",
      "Exceção de Incompetência",
      "Prevenção",
      "Decisão Geral",
      "Exceção de Pré-executividade"
    ]
  },
  'Arquivo': {
    alcanca: [
      {nome: 'Análise', ariaLabel: 'Desarquivar'}
    ]
  },
  'Triagem Inicial':{
    alcanca: [
      "Análise",
    ]
  },
  'Preparar expedientes e comunicações':{
    alcanca: [
      { nome: 'Análise', ariaLabel: 'Cancelar expedientes e comunicações' },
      "Carta precatória"
    ]
  }
}

const HUB = 'Análise'

// ------------------------------------------------------------
// EXECUTORES
// ------------------------------------------------------------
const EXECUTORES = {
  'Conclusão ao magistrado':      rota_movimentar_executarConclusaoMagistrado,
  'Elaborar despacho':            rota_movimentar_executarElaborarDespachoSentencaDecisao,
  'Elaborar decisão':             rota_movimentar_executarElaborarDespachoSentencaDecisao,
  'Elaborar sentença':            rota_movimentar_executarElaborarDespachoSentencaDecisao,
  'Análise':                      rota_movimentar_listenersTrocaOJ,
  'Encaminhar ao posto avançado': rota_movimentar_listenersTrocaOJ,
}


// ------------------------------------------------------------
// rota_movimentar_lerTarefaAtual
// ------------------------------------------------------------
async function rota_movimentar_lerTarefaAtual() {
  await suspender(200)
  await aguardarElemento('.texto-tarefa-processo')
  await suspender(200)
  return document.querySelector('.texto-tarefa-processo')?.textContent?.trim() ?? null
}



// ------------------------------------------------------------
// rota_movimentar_encontrarCaminho
// ------------------------------------------------------------
function rota_movimentar_encontrarCaminho(atual, destino) {
  if (atual === destino) return []

  const resolverNome = (item) => typeof item === 'string' ? item : item.nome

  // BFS
  const fila    = [[atual, []]]
  const visitados = new Set([atual])

  while (fila.length > 0) {
    const [no, caminho] = fila.shift()
    const noAtual = MAPA_ROTAS[no]
    if (!noAtual) continue

    for (const item of noAtual.alcanca) {
      const nome = resolverNome(item)
      if (nome === destino) return [...caminho, nome]
      if (!visitados.has(nome)) {
        visitados.add(nome)
        fila.push([nome, [...caminho, nome]])
      }
    }
  }

  return null
}


// ------------------------------------------------------------
// rota_movimentar_resolverAriaLabel
// ------------------------------------------------------------
function rota_movimentar_resolverAriaLabel(tarefaAtual, nomeTarefaDestino) {
  const no = MAPA_ROTAS[tarefaAtual]
  if (!no) return nomeTarefaDestino
  const entrada = no.alcanca.find(item =>
    typeof item === 'string' ? item === nomeTarefaDestino : item.nome === nomeTarefaDestino
  )
  if (!entrada) return nomeTarefaDestino
  return typeof entrada === 'string' ? entrada : (entrada.ariaLabel ?? entrada.nome)
}


// ------------------------------------------------------------
// rota_movimentar_aguardarMudancaTarefa
// ------------------------------------------------------------
async function rota_movimentar_aguardarMudancaTarefa(tarefaAnterior, timeoutEmSegundos = 30) {
  for (let i = 0; i < timeoutEmSegundos * 2; i++) {
    const atual = await rota_movimentar_lerTarefaAtual()
    if (atual !== tarefaAnterior) return
    await suspender(500)
  }

}


// ------------------------------------------------------------
// rota_movimentar_selecionarOpcao
// ------------------------------------------------------------
//async function rota_movimentar_selecionarOpcao(seletor, valor) {
//  const campo = document.querySelector(seletor)
//  if (!campo) throw new Error(`Campo não encontrado: "${seletor}"`)
//
//  campo.click()
//  await rota_movimentar_aguardarElemento('mat-option')
//
//  const opcoes = [...document.querySelectorAll('mat-option')]
//  const opcao  = opcoes.find(o => o.textContent.trim() === valor)
//
//  if (!opcao) throw new Error(`Opção "${valor}" não encontrada em "${seletor}"`)
//
//  opcao.click()
//}

// ------------------------------------------------------------
// rota_movimentar_encontrarBotao
// Busca o botão pelo aria-label. Se não encontrar, tenta
// pelo texto visível em .texto-botao-app como fallback.
// ------------------------------------------------------------
async function rota_movimentar_encontrarBotao(label, timeoutEmSegundos = 30) {
  for (let i = 0; i < timeoutEmSegundos * 2; i++) {
    await aguardarElementoNovo(['tarefaDoProcessoBotoesDeTarefa', 'conclusaoAoMagistradoBotoesDeTipoDeDespacho'], {modo: 'ou'})

    const porAriaLabel = document.querySelector(`[aria-label="${label}"]`)
      ?? document.querySelector(`[aria-label*="${label}"]`)
    if (porAriaLabel) return porAriaLabel

    const botoes = [...document.querySelectorAll('.botao-app, .botao-skinny, button')]
    const textos = [...document.querySelectorAll('.texto-botao-skinny')]
      .map(t => t.closest('button'))
      .filter(b => b && !b.classList.contains('botao-app') && !b.classList.contains('botao-skinny'))
    if (botoes){
    }
    const encontrado = [...botoes, ...textos].find(b =>
      b.querySelector('.texto-botao-app')?.textContent?.trim() === label
      || b.querySelector('.texto-botao-skinny')?.textContent?.trim() === label 
      || b.textContent?.trim() === label 
    )
    if (encontrado) return encontrado

    await suspender(500)
  }
  return null
}

// ------------------------------------------------------------
// rota_movimentar_executarTransicaoSimples
// ------------------------------------------------------------
async function rota_movimentar_executarTransicaoSimples(tarefaAtual, nomeTarefaDestino, _params) {
  await aguardarElementoNovo(['tarefaDoProcessoBotoesDeTarefa', 'conclusaoAoMagistradoBotoesDeTipoDeDespacho'], {modo: 'ou'})
  const label = rota_movimentar_resolverAriaLabel(tarefaAtual, nomeTarefaDestino)
  const botao = await rota_movimentar_encontrarBotao(label)
  await suspender(500)
  if (!botao) throw new Error(`Botão não encontrado para: "${label}"`)
  monitorarBody(6000, 1)
  clicar (botao)
  await rota_movimentar_aguardarMudancaTarefa(tarefaAtual)
}

async function rota_movimentar_listenersTrocaOJ() {
  await aguardarElemento('meta[id="rotapje-listenerTrocaOJ"]')
  await suspender()
  
  return
}


// ------------------------------------------------------------
// rota_movimentar_executarConclusaoMagistrado
// ------------------------------------------------------------
async function rota_movimentar_executarConclusaoMagistrado(tarefaAtual, parametros) {
  // fase 1 — entra na tarefa Conclusão ao magistrado
  let idMagistrado = idg('escolheMagistrado', 'botao')
  let armazenamento = await obterArmazenamento(idMagistrado) || {}
  let opcao = armazenamento[idMagistrado] || ''
  if (opcao){
    console.log('%c[Rota PJE]%c 293 movimentar: ' + JSON.stringify(293), LOG.info, 'color:inherit')
    await aguardarElemento('meta[id="rotapje-juiz_escolhido"]')
    console.log('%c[Rota PJE]%c 295 movimentar: ' + JSON.stringify(295), LOG.info, 'color:inherit')
    return
  }
  await aguardarElemento('#rotapje_escolheMagistrado_botao_botao_planilha')
  opcao = document.querySelector('#' + idMagistrado + '_botao_' + 'simetria') ? 'simetria' : 'planilha'
  if(!document.querySelector('#' + idMagistrado + '_botao_' + opcao)) return
  if(opcao) clicar('#' + idMagistrado + '_botao_' + opcao)
  return
}


// ------------------------------------------------------------
// rota_movimentar_executarElaborarDespachoSentencaDecisao
// ------------------------------------------------------------
async function rota_movimentar_executarElaborarDespachoSentencaDecisao(tarefaAtual, parametros = null) {
  // fase 1 — entra na tarefa Conclusão ao magistrado
  if (!parametros) return
  let elemento = await aguardarElementoNovo(['elaborarDespachoCorpoDoDocumentoFundamentacao', 'elaborarDespachoBuscarModelos'], {modo: 'e', timeout: 60000})
  if (!elemento) return
  let campoTexto = [...selecionar('.editor-container', '', true)]
  if (!campoTexto) return null
  let campoFundamentacao = campoTexto
    .find(e => e.querySelector('.placeholder-conteudo')?.textContent.includes('Fundamentação'))
    ?.querySelector('[contenteditable]')
  await focar(campoFundamentacao)
  await suspender(2000)
  if (parametros.modelo){
    await digitarNoInput(await sel('elaborarDespachoBuscarModelos'), parametros.modelo)
    let opcaoModelo = await selecionarOpcaoDeModelo(parametros.modelo)
    if (!opcaoModelo) return
    let botaoInserir = await esperarEClicar('elaborarDespachoInserirModelo')
    await pje_aguardarMensagem('Modelo de documento inserido')
  }
  await suspender(500)
  if (parametros.texto){
    inserirTextoNoEditor('despacho', parametros.texto)
    await suspender(500)
  }
  if (parametros.descricao){
    await aguardarElemento('input[data-placeholder="Descrição"]')
    await suspender(500)
    preencher('input[data-placeholder="Descrição"]', parametros.descricao)
  }
  await suspender(500)
  if (parametros?.movimentos?.length){
    let movimentos = parametros?.movimentos
    clicar('button[aria-label="Salvar"]')
    await pje_aguardarMensagem('Minuta salva')
    await aguardarElemento('.mat-tab-labels')
    await suspender(500)
    while(![...document.querySelector('.mat-tab-labels').children].find(d=> d?.textContent.includes('Movimentos'))){
        await suspender()
    }
    let movimentoBotao = [...document.querySelector('.mat-tab-labels').children].find(d=> d?.textContent.includes('Movimentos'))
    clicar(movimentoBotao)
    await aguardarElemento('pje-movimento mat-checkbox')
    console.log('%c[Rota PJE]%c movimentos: ' + JSON.stringify(movimentos), LOG.info, 'color:inherit', movimentos)
    let opcaoElemento
    for (let movimento of movimentos){
      console.log('%c[Rota PJE]%c movimento: ' + JSON.stringify(movimento), LOG.info, 'color:inherit', movimento)
      let i = 0
      if (!opcoesIncluirExcluir([...document.querySelectorAll('pje-movimento')], movimento?.checkbox?.incluir, movimento?.checkbox?.naoIncluir)?.querySelector('mat-expansion-panel')){
        let opcoes = [...document.querySelectorAll('pje-movimento')] || []
        if (!opcoes.length) continue
        opcaoElemento = opcoesIncluirExcluir(opcoes, movimento?.checkbox?.incluir, movimento?.checkbox?.naoIncluir)
        let opcaoElementoClicar = opcaoElemento?.querySelector('input')
        if(!opcaoElemento || !opcaoElementoClicar) continue
        clicar(opcaoElementoClicar)
        
        while(!opcoesIncluirExcluir([...document.querySelectorAll('pje-movimento')], movimento?.checkbox?.incluir, movimento?.checkbox?.naoIncluir)?.querySelector('mat-expansion-panel')){
          await suspender()
          console.log(i++)
        }
        if (!movimento?.opcoes?.length) continue
      }
      for (let opcao of movimento?.opcoes){
        console.log('%c[Rota PJE]%c opcaoElemento: ' + JSON.stringify(opcaoElemento), LOG.info, 'color:inherit', opcaoElemento)
        console.log('%c[Rota PJE]%c opcao?.nomeDoCampo: ' + JSON.stringify(opcao?.nomeDoCampo), LOG.info, 'color:inherit')
        console.log('%c[Rota PJE]%c opcaoElemento.querySelectorAll: ' + JSON.stringify(!!opcaoElemento.querySelectorAll('mat-select')), LOG.info, 'color:inherit')
        let elemento = opcoesIncluirExcluir([...opcaoElemento.querySelectorAll('mat-select')], opcao?.nomeDoCampo)
        console.log('%c[Rota PJE]%c elemento: ' + JSON.stringify(elemento), LOG.info, 'color:inherit')
        await suspender(500)
        await preencherCampoComEscolhaDeOpcao(elemento, opcao?.selecionar)
      }
      while(
        !movimento?.opcoes?.some(m => [...document.querySelectorAll('.cartao-movimento')].some(d => normalizar(d?.textContent).includes(normalizar(m?.selecionar))))
      ){
        await suspender()
        console.log('%c[Rota PJE]%c i++: ' + JSON.stringify(i++), LOG.info, 'color:inherit')
      }
    }
    await aguardarElemento('button[mattooltip^="Gravar os movimentos"]')
    clicar('button[mattooltip^="Gravar os movimentos"]')
    await pje_aguardarMensagem('Movimentos gravados com sucesso')
  }
  await aguardarElemento('button[aria-label^="Salvar"]')
  clicar('button[aria-label^="Salvar"]')
  await pje_aguardarMensagem('Minuta salva')
  return
}

/* 
while(![...document.querySelectorAll('pje-movimento')].find(d => normalizar(d.textContent).includes('recebido') && !normalizar(d.textContent).includes('nao'))?.querySelector('mat-expansion-panel')){
  await suspender()
  console.log(i++)
}
*/

function opcoesIncluirExcluir(array, incluir = null, excluir = null){
  console.log('%c[Rota PJE]%c array: ' + JSON.stringify(array), LOG.info, 'color:inherit', array)
  console.log('%c[Rota PJE]%c incluir: ' + JSON.stringify(incluir), LOG.info, 'color:inherit')
  console.log('%c[Rota PJE]%c excluir: ' + JSON.stringify(excluir), LOG.info, 'color:inherit')
  if (!Array.isArray(array)) return null
  let elemento = null
  for (let opcao of array){
    let incluirTF = incluir && normalizar(opcao?.textContent).includes(normalizar(incluir)) ? true : false
    let excluirTF = !excluir || !normalizar(opcao?.textContent).includes(normalizar(excluir)) ? true : false
    if (incluirTF && excluirTF) elemento = opcao
  }
  return elemento
}

async function esperarEClicar(elementoSeletorNovo, tempoEmSegundos = 30) {
  let botao = null
  for(let i = 0; i < tempoEmSegundos * 2; i++){
    await suspender(500)
    botao = await sel(elementoSeletorNovo)
    if (botao) {
      break
    }
    await suspender(500)
  }
  if (!botao) return null
  clicar(botao)
  return botao
  
}

async function selecionarOpcaoDeModelo(modelo, tempoEmSegundos = 30){
  let opcaoModelo = null
  for(let i = 0; i < tempoEmSegundos * 2; i++){
    await suspender(500)
    let opcoesModelo = [...(await sel('elaborarDespachoOpcaoDeModelo', '', true))]
    opcaoModelo = opcoesModelo.find(o => normalizar(o.textContent).includes(normalizar(modelo)))
    
    if (opcaoModelo) {
      break
    }
    
  }
  if (!opcaoModelo) return null
  clicar(opcaoModelo)
  return opcaoModelo
}
// ------------------------------------------------------------
// rota_movimentar_limparEstado
// Remove do armazenamento tudo que foi salvo pela movimentar.
// ------------------------------------------------------------
function rota_movimentar_limparEstado() {
  removerArmazenamento('rota_movimentar_destinoPendente')
  removerArmazenamento('rota_movimentar_params')
}


// ------------------------------------------------------------
// rota_movimentar_retomar
// Chamada no início de cada página. Se houver uma navegação
// em curso (destinoPendente no armazenamento), retoma de onde
// parou — a tarefa atual já reflete a posição real no grafo.
// ------------------------------------------------------------
async function rota_movimentar_retomar() {
  let janela = confereJanela(JANELA.tarefa)
  if (!janela) return
  let armazenamento = await obterArmazenamento(['rotaExecucaoAtual'])
  let execucao = String(armazenamento?.rotaExecucaoAtual || '')
  if (!armazenamento) return
  let nomeJanela = window.name
  if (!nomeJanela.includes('rotapje_')) return
  if(execucao !== nomeJanela.split('_').pop()) return
  registrarListenerFechar(execucao)
  let armazenamentoDestino = await obterArmazenamento('rota_movimentar_destinoPendente')
  let destino = armazenamentoDestino?.rota_movimentar_destinoPendente
  if (!destino) return

  let armazenamentoParams = await obterArmazenamento('rota_movimentar_params')
  let params = armazenamentoParams?.rota_movimentar_params ?? {}
  //if (!params) return
  
  await movimentar(destino.rota_movimentar_params, params.rota_movimentar_params)
}

// ------------------------------------------------------------
// movimentar
// ------------------------------------------------------------
async function movimentar(destino, params = {}) {
  console.log('%c[Rota PJE]%c destino' + JSON.stringify(destino), LOG.aviso, 'color:inherit')
  await aguardarElementoNovo('tarefaDoProcessoTituloDaTarefa')
  await armazenar({rota_movimentar_destinoPendente: destino})
  await armazenar({rota_movimentar_params: params})
  let tarefaAtual = await rota_movimentar_lerTarefaAtual()
  console.log('%c[Rota PJE]%c tarefaAtual' + JSON.stringify(tarefaAtual), LOG.aviso, 'color:inherit')
  if (!tarefaAtual) throw new Error('Não foi possível identificar a tarefa atual.')
    // se houver executor para a tarefa atual, roda antes de qualquer coisa
  console.log('%c[Rota PJE]%c EXECUTORES: ' + JSON.stringify(EXECUTORES), LOG.info, 'color:inherit', EXECUTORES)
  let executorAtual = EXECUTORES[tarefaAtual]
  console.log('%c[Rota PJE]%c executorAtual' + JSON.stringify(executorAtual), LOG.aviso, 'color:inherit', executorAtual)
  if (executorAtual) {
    let parametros = params[tarefaAtual] || null
    await executorAtual(tarefaAtual, parametros)
  }
  console.log('%c[Rota PJE]%c 507' + JSON.stringify(507), LOG.aviso, 'color:inherit')
  const caminho = rota_movimentar_encontrarCaminho(tarefaAtual, destino)
  if (caminho === null) throw new Error(`Caminho não encontrado: "${tarefaAtual}" → "${destino}"`)
  if (caminho.length === 0) {
    console.log('%c[Rota PJE]%c 511' + JSON.stringify(511), LOG.aviso, 'color:inherit')
    rota_movimentar_limparEstado()
    return
  }
  for (const proximaTarefa of caminho) {
    await rota_movimentar_executarTransicaoSimples(tarefaAtual, proximaTarefa)
    tarefaAtual = await rota_movimentar_lerTarefaAtual()
    const executorProximo = EXECUTORES[tarefaAtual]
    if (executorProximo && params[tarefaAtual]) {
      await executorProximo(tarefaAtual, params[tarefaAtual])
    }
    
  }
  
  rota_movimentar_limparEstado()
}

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
  'Prazos vencidos':{
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
  'Conclusão ao magistrado':  rota_movimentar_executarConclusaoMagistrado,
  'Elaborar despacho':        rota_movimentar_executarElaborarDespachoSentencaDecisao,
  'Elaborar decisão':         rota_movimentar_executarElaborarDespachoSentencaDecisao,
  'Elaborar sentença':        rota_movimentar_executarElaborarDespachoSentencaDecisao,
}


// ------------------------------------------------------------
// rota_movimentar_lerTarefaAtual
// ------------------------------------------------------------
async function rota_movimentar_lerTarefaAtual() {
  let elemento = await aguardarElementoNovo('tituloDaTarefaNaJanelaDeTarefa')
  return elemento?.textContent?.trim() ?? null
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
    await aguardarElementoNovo(['botoesDeTarefaNaJanelaDeTarefa', 'botoesDeTipoDeDespachoNaJanelaDeConclusao'], {modo: 'ou'})

    const porAriaLabel = document.querySelector(`[aria-label="${label}"]`)
      ?? document.querySelector(`[aria-label*="${label}"]`)
    if (porAriaLabel) return porAriaLabel

    const botoes = [...document.querySelectorAll('.botao-app, .botao-skinny, button')]
    const textos = [...document.querySelectorAll('.texto-botao-skinny')]
      .map(t => t.closest('button'))
      .filter(b => b && !b.classList.contains('botao-app') && !b.classList.contains('botao-skinny'))
    if (botoes){
      console.log('%c[Rota PJE]%c 254: ' + JSON.stringify(botoes), LOG.teste, 'color:inherit')
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
  await aguardarElementoNovo(['botoesDeTarefaNaJanelaDeTarefa', 'botoesDeTipoDeDespachoNaJanelaDeConclusao'], {modo: 'ou'})
  const label = rota_movimentar_resolverAriaLabel(tarefaAtual, nomeTarefaDestino)
  const botao = await rota_movimentar_encontrarBotao(label)
  
  if (!botao) throw new Error(`Botão não encontrado para: "${label}"`)

  await clicar (botao)
  await rota_movimentar_aguardarMudancaTarefa(tarefaAtual)
}

// ------------------------------------------------------------
// rota_movimentar_executarConclusaoMagistrado
// ------------------------------------------------------------
async function rota_movimentar_executarConclusaoMagistrado(tarefaAtual, parametros) {
  // fase 1 — entra na tarefa Conclusão ao magistrado
  let selecao = await aguardarElementoNovo('selecaoDeMagistradosNaTelaDaConclusao')
  await clicar(selecao)
  let juiz = parametros.juiz.toUpperCase()
  await aguardarElementoNovo('opcoesDeMagistradosNaTelaDaConclusao')
  let juizes = [...(await sel ('opcoesDeMagistradosNaTelaDaConclusao', '', true))]
  let juizSelecionado = juizes.find(j => j.textContent?.trim().includes(juiz))
  await clicar(juizSelecionado)

  return
  await armazenar({rota_movimentar_executarConclusaoMagistrado: juiz})
  const botaoEntrada = await rota_movimentar_encontrarBotao('Conclusão ao magistrado')
  if (!botaoEntrada) throw new Error('Botão "Conclusão ao magistrado" não encontrado.')
  await clicar(botaoEntrada)
  let juizArmazenado = await obterArmazenamento('rota_movimentar_executarConclusaoMagistrado')
  let juizEscolher = juizArmazenado?.rota_movimentar_executarConclusaoMagistrado
  await removerArmazenamento('rota_movimentar_executarConclusaoMagistrado')
  
  return
  // fase 2 — preenche e segue para o destino (ex: Despacho, Sentença...)
  if (params.juiz) await rota_movimentar_selecionarOpcao('.magistrado', params.juiz)

  const botaoDestino = await rota_movimentar_encontrarBotao(nomeTarefaDestino)
  if (!botaoDestino) throw new Error(`Botão não encontrado para: "${nomeTarefaDestino}"`)
  await clicar(botaoDestino)
  await rota_movimentar_aguardarMudancaTarefa(tarefaAtual)
}


// ------------------------------------------------------------
// rota_movimentar_executarElaborarDespachoSentencaDecisao
// ------------------------------------------------------------
async function rota_movimentar_executarElaborarDespachoSentencaDecisao(tarefaAtual, parametros) {
  // fase 1 — entra na tarefa Conclusão ao magistrado

  let elementos = await aguardarElementoNovo(['corpoDoDocumentoNaTelaDeElaborarFundamentacao', 'buscarModelosNaTelaDeElaborar'], {modo: 'e'})
  console.log('%c[Rota PJE]%c parametros: ' + JSON.stringify(parametros), LOG.rosa, 'color:inherit')
  
  return

  let selecao = await aguardarElementoNovo('selecaoDeMagistradosNaTelaDaConclusao')
  await clicar(selecao)
  let juiz = parametros.juiz.toUpperCase()
  await aguardarElementoNovo('opcoesDeMagistradosNaTelaDaConclusao')
  let juizes = [...(await sel ('opcoesDeMagistradosNaTelaDaConclusao', '', true))]
  let juizSelecionado = juizes.find(j => j.textContent?.trim().includes(juiz))
  await clicar(juizSelecionado)

  return
  await armazenar({rota_movimentar_executarConclusaoMagistrado: juiz})
  const botaoEntrada = await rota_movimentar_encontrarBotao('Conclusão ao magistrado')
  if (!botaoEntrada) throw new Error('Botão "Conclusão ao magistrado" não encontrado.')
  await clicar(botaoEntrada)
  let juizArmazenado = await obterArmazenamento('rota_movimentar_executarConclusaoMagistrado')
  let juizEscolher = juizArmazenado?.rota_movimentar_executarConclusaoMagistrado
  await removerArmazenamento('rota_movimentar_executarConclusaoMagistrado')
  
  return
  // fase 2 — preenche e segue para o destino (ex: Despacho, Sentença...)
  if (params.juiz) await rota_movimentar_selecionarOpcao('.magistrado', params.juiz)

  const botaoDestino = await rota_movimentar_encontrarBotao(nomeTarefaDestino)
  if (!botaoDestino) throw new Error(`Botão não encontrado para: "${nomeTarefaDestino}"`)
  await clicar(botaoDestino)
  await rota_movimentar_aguardarMudancaTarefa(tarefaAtual)
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
  if (!nomeJanela.includes('rota_pje_')) return
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

rota_movimentar_retomar()

// ------------------------------------------------------------
// movimentar
// ------------------------------------------------------------
async function movimentar(destino, params = {}) {
  await aguardarElementoNovo('tituloDaTarefaNaJanelaDeTarefa')
  await armazenar({rota_movimentar_destinoPendente: destino})
  await armazenar({rota_movimentar_params: params})
  let tarefaAtual = await rota_movimentar_lerTarefaAtual()
  if (!tarefaAtual) throw new Error('Não foi possível identificar a tarefa atual.')
    // se houver executor para a tarefa atual, roda antes de qualquer coisa
  let executorAtual = EXECUTORES[tarefaAtual]
  if (executorAtual && params[tarefaAtual]) {
    await executorAtual(tarefaAtual, params[tarefaAtual])
  }
  
  const caminho = rota_movimentar_encontrarCaminho(tarefaAtual, destino)
  if (caminho === null) throw new Error(`Caminho não encontrado: "${tarefaAtual}" → "${destino}"`)
  if (caminho.length === 0) {
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

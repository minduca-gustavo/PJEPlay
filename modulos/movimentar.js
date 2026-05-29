/* FUNÇÃO DE BUSCA NO CONSOLE.
function rota_lerBotoesDisponiveis() {
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
rota_lerBotoesDisponiveis()

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

async function movimentar(tarefaDestino) {
  
}
/*

// ------------------------------------------------------------
// EXECUTORES
// ------------------------------------------------------------
const EXECUTORES = {
  'Conclusão ao magistrado': rota_executarConclusaoMagistrado,
}


// ------------------------------------------------------------
// rota_lerTarefaAtual
// ------------------------------------------------------------
function rota_lerTarefaAtual() {
  return document.querySelector('.texto-tarefa-processo')?.textContent?.trim() ?? null
}


// ------------------------------------------------------------
// rota_encontrarCaminho
// ------------------------------------------------------------
function rota_encontrarCaminho(atual, destino) {
  if (atual === destino) return []

  const noAtual = MAPA_ROTAS[atual]
  if (!noAtual) return null

  const resolverNome = (item) => typeof item === 'string' ? item : item.nome
  const alcancaveis  = noAtual.alcanca.map(resolverNome)

  if (alcancaveis.includes(destino)) return [destino]

  if (atual !== HUB && alcancaveis.includes(HUB)) {
    const noHub = MAPA_ROTAS[HUB]
    if (!noHub) return null
    const alcancaveisDoHub = noHub.alcanca.map(resolverNome)
    if (alcancaveisDoHub.includes(destino)) return [HUB, destino]
  }

  return null
}


// ------------------------------------------------------------
// rota_resolverAriaLabel
// ------------------------------------------------------------
function rota_resolverAriaLabel(tarefaAtual, nomeTarefaDestino) {
  const no = MAPA_ROTAS[tarefaAtual]
  if (!no) return nomeTarefaDestino
  const entrada = no.alcanca.find(item =>
    typeof item === 'string' ? item === nomeTarefaDestino : item.nome === nomeTarefaDestino
  )
  if (!entrada) return nomeTarefaDestino
  return typeof entrada === 'string' ? entrada : (entrada.ariaLabel ?? entrada.nome)
}


// ------------------------------------------------------------
// rota_aguardarMudancaTarefa
// ------------------------------------------------------------
function rota_aguardarMudancaTarefa(tarefaAnterior, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const inicio = Date.now()
    const intervalo = setInterval(() => {
      const atual = rota_lerTarefaAtual()
      if (atual && atual !== tarefaAnterior) {
        clearInterval(intervalo)
        resolve(atual)
      }
      if (Date.now() - inicio > timeoutMs) {
        clearInterval(intervalo)
        reject(new Error(`Timeout aguardando saída de "${tarefaAnterior}"`))
      }
    }, 300)
  })
}


// ------------------------------------------------------------
// rota_aguardarElemento
// ------------------------------------------------------------
function rota_aguardarElemento(seletor, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const el = document.querySelector(seletor)
    if (el) return resolve(el)

    const observer = new MutationObserver(() => {
      const el = document.querySelector(seletor)
      if (el) {
        observer.disconnect()
        resolve(el)
      }
    })

    observer.observe(document.body, { childList: true, subtree: true })

    setTimeout(() => {
      observer.disconnect()
      reject(new Error(`Timeout aguardando elemento: "${seletor}"`))
    }, timeoutMs)
  })
}


// ------------------------------------------------------------
// rota_selecionarOpcao
// ------------------------------------------------------------
async function rota_selecionarOpcao(seletor, valor) {
  const campo = document.querySelector(seletor)
  if (!campo) throw new Error(`Campo não encontrado: "${seletor}"`)

  campo.click()
  await rota_aguardarElemento('mat-option')

  const opcoes = [...document.querySelectorAll('mat-option')]
  const opcao  = opcoes.find(o => o.textContent.trim() === valor)

  if (!opcao) throw new Error(`Opção "${valor}" não encontrada em "${seletor}"`)

  opcao.click()
}

// ------------------------------------------------------------
// rota_encontrarBotao
// Busca o botão pelo aria-label. Se não encontrar, tenta
// pelo texto visível em .texto-botao-app como fallback.
// ------------------------------------------------------------
async function rota_encontrarBotao(label) {
  await aguardarElementoNovo('botoesDeTarefaNaJanelaDeTarefa')
  const porAriaLabel = document.querySelector(`[aria-label="${label}"]`)
    ?? document.querySelector(`[aria-label*="${label}"]`)
  if (porAriaLabel) return porAriaLabel

  const botoes = [...document.querySelectorAll('.botao-app, .botao-skinny')]
  const textos = [...document.querySelectorAll('.texto-botao-skinny')]
    .map(t => t.closest('button'))
    .filter(b => b && !b.classList.contains('botao-app') && !b.classList.contains('botao-skinny'))

  return [...botoes, ...textos].find(b =>
    b.querySelector('.texto-botao-app')?.textContent?.trim() === label
    || b.querySelector('.texto-botao-skinny')?.textContent?.trim() === label
  ) ?? null
}

// ------------------------------------------------------------
// rota_executarTransicaoSimples
// ------------------------------------------------------------
async function rota_executarTransicaoSimples(tarefaAtual, nomeTarefaDestino, _params) {
  const label = rota_resolverAriaLabel(tarefaAtual, nomeTarefaDestino)
  const botao = await rota_encontrarBotao(label)
  if (!botao) throw new Error(`Botão não encontrado para: "${label}"`)

  botao.click()
  await rota_aguardarMudancaTarefa(tarefaAtual)
}

// ------------------------------------------------------------
// rota_executarConclusaoMagistrado
// ------------------------------------------------------------
async function rota_executarConclusaoMagistrado(tarefaAtual, nomeTarefaDestino, juiz) {
  // fase 1 — entra na tarefa Conclusão ao magistrado
  console.log('%c[Rota PJE]%c 304 movimentar juiz: ' + JSON.stringify(tarefaAtual), LOG.teste, 'color:inherit')
  console.log('%c[Rota PJE]%c 304 movimentar juiz: ' + JSON.stringify(nomeTarefaDestino), LOG.teste, 'color:inherit')
  console.log('%c[Rota PJE]%c 304 movimentar juiz: ' + JSON.stringify(juiz), LOG.teste, 'color:inherit')
  return
  await armazenar({rota_executarConclusaoMagistrado: juiz})
  const botaoEntrada = await rota_encontrarBotao('Conclusão ao magistrado')
  if (!botaoEntrada) throw new Error('Botão "Conclusão ao magistrado" não encontrado.')
  await clicar(botaoEntrada)
  await rota_aguardarElemento('.cancelar-conclusao')
  let juizArmazenado = await obterArmazenamento('rota_executarConclusaoMagistrado')
  let juizEscolher = juizArmazenado?.rota_executarConclusaoMagistrado
  await removerArmazenamento('rota_executarConclusaoMagistrado')
  console.log('%c[Rota PJE]%c será que ele passa daqui com o juiz? ' + JSON.stringify(juizEscolher), LOG.teste, 'color:inherit')
  
  return
  // fase 2 — preenche e segue para o destino (ex: Despacho, Sentença...)
  if (params.juiz) await rota_selecionarOpcao('.magistrado', params.juiz)

  const botaoDestino = await rota_encontrarBotao(nomeTarefaDestino)
  if (!botaoDestino) throw new Error(`Botão não encontrado para: "${nomeTarefaDestino}"`)
  botaoDestino.click()
  await rota_aguardarMudancaTarefa(tarefaAtual)
}


// ------------------------------------------------------------
// rota_limparEstado
// Remove do armazenamento tudo que foi salvo pela movimentar.
// ------------------------------------------------------------
function rota_limparEstado() {
  armazenar({rota_destinoPendente: null})
  armazenar({rota_params: null})
}


// ------------------------------------------------------------
// rota_retomar
// Chamada no início de cada página. Se houver uma navegação
// em curso (destinoPendente no armazenamento), retoma de onde
// parou — a tarefa atual já reflete a posição real no grafo.
// ------------------------------------------------------------
async function rota_retomar() {
  const destino = obterArmazenamento('rota_destinoPendente')
  if (!destino) return

  const params = obterArmazenamento('rota_params') ?? {}
  await movimentar(destino, params)
}


// ------------------------------------------------------------
// movimentar
// ------------------------------------------------------------
async function movimentar(destino, params = {}) {
  console.log('%c[Rota PJE]%c movimentar ON', LOG.teste, 'color:inherit')
  armazenar({rota_destinoPendente: destino})
  armazenar({rota_params: params})

  let tarefaAtual = rota_lerTarefaAtual()
  if (!tarefaAtual) throw new Error('Não foi possível identificar a tarefa atual.')

  const caminho = rota_encontrarCaminho(tarefaAtual, destino)
  if (caminho === null) throw new Error(`Caminho não encontrado: "${tarefaAtual}" → "${destino}"`)
  if (caminho.length === 0) {
    rota_limparEstado()
    return
  }

  for (const proximaTarefa of caminho) {
    const executor = EXECUTORES[tarefaAtual] ?? rota_executarTransicaoSimples
    await executor(tarefaAtual, proximaTarefa, params[tarefaAtual] ?? {})
    tarefaAtual = rota_lerTarefaAtual()
  }

  rota_limparEstado()
}
  */
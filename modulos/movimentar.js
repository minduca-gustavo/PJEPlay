// ============================================================
// movimentar.js
// ============================================================


// ------------------------------------------------------------
// MAPA DE ROTAS
// ------------------------------------------------------------
const MAPA_ROTAS = {
  'Análise': {
    alcanca: ['Aguardando prazo', 'Cumprimento de Providências', 'Conclusão ao magistrado', 'Arquivo']
  },
  'Aguardando prazo': {
    alcanca: ['Análise']
  },
  'Cumprimento de Providências': {
    alcanca: ['Análise']
  },
  'Conclusão ao magistrado': {
    alcanca: ['Análise']
  },
  'Arquivo': {
    alcanca: ['Análise']
  },
}

const HUB = 'Análise'


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
// rota_executarTransicaoSimples
// ------------------------------------------------------------
async function rota_executarTransicaoSimples(tarefaAtual, nomeTarefaDestino, _params) {
  const ariaLabel = rota_resolverAriaLabel(tarefaAtual, nomeTarefaDestino)

  const botao = document.querySelector(`[aria-label="${ariaLabel}"]`)
    ?? document.querySelector(`[aria-label*="${ariaLabel}"]`)

  if (!botao) throw new Error(`Botão não encontrado para: "${ariaLabel}"`)

  botao.click()
  await rota_aguardarMudancaTarefa(tarefaAtual)
}


// ------------------------------------------------------------
// rota_executarConclusaoMagistrado
// ------------------------------------------------------------
async function rota_executarConclusaoMagistrado(tarefaAtual, nomeTarefaDestino, params = {}) {
  const ariaLabel = rota_resolverAriaLabel(tarefaAtual, nomeTarefaDestino)

  const botao = document.querySelector(`[aria-label="${ariaLabel}"]`)
    ?? document.querySelector(`[aria-label*="${ariaLabel}"]`)

  if (!botao) throw new Error(`Botão não encontrado para: "${ariaLabel}"`)

  botao.click()

  await rota_aguardarElemento('[aria-label="Magistrado"]')

  if (params.juiz) {
    await rota_selecionarOpcao('[aria-label="Magistrado"]', params.juiz)
  }

  if (params.tipo) {
    await rota_selecionarOpcao('[aria-label="Tipo de conclusão"]', params.tipo)
  }

  const botaoConfirmar = document.querySelector('[aria-label="Salvar"]')
    ?? document.querySelector('[aria-label="Confirmar"]')

  if (!botaoConfirmar) throw new Error('Botão de confirmação não encontrado.')

  botaoConfirmar.click()
  await rota_aguardarMudancaTarefa(tarefaAtual)
}


// ------------------------------------------------------------
// rota_limparEstado
// Remove do armazenamento tudo que foi salvo pela movimentar.
// ------------------------------------------------------------
function rota_limparEstado() {
  armazenar('rota_destinoPendente', null)
  armazenar('rota_params', null)
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
  armazenar('rota_destinoPendente', destino)
  armazenar('rota_params', params)

  let tarefaAtual = rota_lerTarefaAtual()
  if (!tarefaAtual) throw new Error('Não foi possível identificar a tarefa atual.')

  const caminho = rota_encontrarCaminho(tarefaAtual, destino)
  if (caminho === null) throw new Error(`Caminho não encontrado: "${tarefaAtual}" → "${destino}"`)
  if (caminho.length === 0) {
    rota_limparEstado()
    return
  }

  for (const proximaTarefa of caminho) {
    const executor = EXECUTORES[proximaTarefa] ?? rota_executarTransicaoSimples
    await executor(tarefaAtual, proximaTarefa, params[proximaTarefa] ?? {})
    tarefaAtual = rota_lerTarefaAtual()
  }

  rota_limparEstado()
}
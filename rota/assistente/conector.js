// ============================================================
// conector.js
// Lê o roteiro da tarefa ativa e monta os componentes
// no painel assistente em tempo real.
//
// Fluxo:
//   1. Lê a tarefa ativa do storage
//   2. Busca o roteiro correspondente no catálogo
//   3. Lê a etapa atual da sessão
//   4. Monta os blocos da etapa no #aba-roteiro
//   5. Reage a mudanças no storage (etapa avança, dados chegam)
// ============================================================


// ── Leitura de dados do PJE via storage ───────────────────────
//
// No contexto do assistente (janela separada), as metatags da página
// do PJE não são acessíveis. O interceptador.js espelha os dados
// interceptados no storage.local sob as chaves rotaDados_*.
// Estas funções substituem as interceptador_ler*() do PJE,
// expondo a mesma interface para que os roteiros funcionem
// sem distinção de contexto.
//
// ATENÇÃO: são síncronas por compatibilidade com infoPJE() dos roteiros,
// mas dependem de _con_dadosCache abastecido assincronamente.

let _con_dadosCache = {}

async function conector_atualizarCache() {
    const cfg = await obterArmazenamento([
        'rotaDados_processo',
        'rotaDados_processo_partes',
        'rotaDados_audiencias',
        'rotaDados_responsaveis',
        'rotaDados_documentos',
    ])
    _con_dadosCache = cfg || {}
}

function interceptador_lerProcesso()     { return _con_dadosCache['rotaDados_processo']         || null }
function interceptador_lerPartes()       { return _con_dadosCache['rotaDados_processo_partes']   || null }
function interceptador_lerAudiencias()   { return _con_dadosCache['rotaDados_audiencias']        || null }
function interceptador_lerResponsaveis() { return _con_dadosCache['rotaDados_responsaveis']      || null }
function interceptador_lerDocumentos()   { return _con_dadosCache['rotaDados_documentos']        || null }


// ── Mapa de roteiros ──────────────────────────────────────────
//
// Cada ID de tarefa do catálogo aponta para seu roteiro.
// Adicionar aqui quando criar novas tarefas.

const ROTA_ROTEIROS = {
    'triagem-inicial': typeof ROTEIRO_TRIAGEM_INICIAL !== 'undefined'
        ? ROTEIRO_TRIAGEM_INICIAL : null,
    'pos-triagem': typeof ROTEIRO_POS_TRIAGEM !== 'undefined'
        ? ROTEIRO_POS_TRIAGEM : null,
}


// ── Estado do conector ────────────────────────────────────────

let _con_tarefaAtual = null
let _con_etapaAtual  = null
let _con_montando    = false


// ── Inicializar ───────────────────────────────────────────────
//
// Chamado pelo assistente.js após DOMContentLoaded.
// Monta o painel e ouve mudanças de sessão.

async function conector_iniciar() {
    // Registra listener primeiro
    browser.storage.onChanged.addListener(async (mudancas) => {
        // Tarefa mudou → remonta
        const tarefaMudou = !!mudancas['tarefaAtiva'] || !!mudancas['tarefaAtivaIsSistema']
        if (tarefaMudou) {
            await conector_montar()
            return
        }

        // Dados do PJE chegaram → atualiza cache e remonta infoPJE
        const chavesDados = ['rotaDados_processo', 'rotaDados_processo_partes', 'rotaDados_audiencias', 'rotaDados_responsaveis', 'rotaDados_documentos']
        if (chavesDados.some(c => !!mudancas[c])) {
            await conector_atualizarCache()
            // Remonta apenas a infoPJE da etapa atual, sem remontar o painel inteiro
            document.dispatchEvent(new CustomEvent('RotaMetaTagAtualizada'))
            return
        }

        // Cursor avançou → remonta
        const sessaoMudou = mudancas[ROTA_CHAVES.sessao]
        if (sessaoMudou) {
            const antes  = sessaoMudou.oldValue
            const depois = sessaoMudou.newValue
            if (antes?.cursor !== depois?.cursor) {
                await conector_montar()
            }
        }
    })

    // Tenta montar — se sessão já está no storage, monta imediatamente
    // Se não está, fica tentando a cada 500ms até 15 segundos
    let montou = false
    for (let i = 0; i < 30 && !montou; i++) {
        const cfg     = await obterArmazenamento([ROTA_CHAVES.sessao, 'tarefaAtiva', 'tarefaAtivaIsSistema'])
        const sessao  = cfg?.[ROTA_CHAVES.sessao]
        const isSistema = cfg?.['tarefaAtivaIsSistema'] === true
        if (sessao?.ativa && isSistema) {
            await conector_montar()
            montou = true
        } else {
            await new Promise(r => setTimeout(r, 500))
        }
    }

    // Reage ao evento de avanço de etapa (disparado por acao_painel_proximaEtapa)
    document.addEventListener('RotaAvancarEtapa', async (e) => {
        await conector_montarEtapa(e.detail?.idEtapa)
    })
}


// ── Montar painel completo ────────────────────────────────────


async function conector_aguardarSessaoEMontar(tentativas = 20, intervalo = 500) {
    for (let i = 0; i < tentativas; i++) {
        const cfg    = await obterArmazenamento([ROTA_CHAVES.sessao, 'tarefaAtiva', 'tarefaAtivaIsSistema'])
        const sessao = cfg?.[ROTA_CHAVES.sessao]
        if (sessao?.ativa && cfg?.tarefaAtivaIsSistema === true) {
            await conector_montar()
            return
        }
        await new Promise(r => setTimeout(r, intervalo))
    }
    // Após timeout, monta mesmo assim (pode exibir painel padrão)
    await conector_montar()
}

async function conector_montar() {
    if (_con_montando) { console.log("[Conector] bloqueado - já montando"); return }
    _con_montando = true
    console.log("[Conector] iniciando montar")

    try {
        await conector_atualizarCache()
        const cfg     = await obterArmazenamento([ROTA_CHAVES.sessao, 'tarefaAtiva', 'tarefaAtivaIsSistema'])
        const sessao  = cfg?.[ROTA_CHAVES.sessao]
        const idTarefa = cfg?.['tarefaAtiva']

        // Sem sessão ativa ou tarefa de sistema → painel padrão
        const isSistema = cfg?.['tarefaAtivaIsSistema'] === true
        if (!sessao?.ativa || !idTarefa || !isSistema) {
            conector_exibirPainelPadrao()
            return
        }

        const roteiro = ROTA_ROTEIROS[idTarefa]
        if (!roteiro) {
            // Tarefa do usuário (👤) — não tem roteiro guiado
            conector_exibirPainelPadrao()
            return
        }

        _con_tarefaAtual = idTarefa

        // Determina a etapa atual
        const idEtapa = sessao.etapaAtual || roteiro.etapaInicial
        console.log('[Conector] etapa:', idEtapa, 'roteiro:', !!roteiro)
        await conector_montarEtapa(idEtapa, roteiro, sessao)

    } finally {
        _con_montando = false
    }
}


// ── Montar etapa específica ───────────────────────────────────

async function conector_montarEtapa(idEtapa, roteiro, sessao) {

    // Se não recebeu roteiro, busca novamente
    if (!roteiro) {
        const cfg      = await obterArmazenamento([ROTA_CHAVES.sessao, 'tarefaAtiva', 'tarefaAtivaIsSistema'])
        sessao         = cfg?.[ROTA_CHAVES.sessao]
        const idTarefa = cfg?.['tarefaAtiva']
        roteiro        = ROTA_ROTEIROS[idTarefa]
        if (!roteiro) return
        idEtapa = idEtapa || sessao?.etapaAtual || roteiro.etapaInicial
    }

    const etapa = roteiro.etapas[idEtapa]
    if (!etapa) {
        console.error('[Rota PJE] conector: etapa não encontrada:', idEtapa)
        return
    }

    _con_etapaAtual = idEtapa

    // Monta os elementos no container
    const container = document.getElementById('aba-roteiro')
    if (!container) return

    // Limpa o container mantendo só a navegação de processos
    conector_limparContainer(container)

    // ── Bloco principal da etapa
    const bloco = criarBloco({ titulo: etapa.titulo })

    // Info PJE (assíncrona)
    if (etapa.infoPJE) {
        const infoEl = criarInfoPJE({
            rotulo:  '📋 Dados extraídos do PJE — passe o mouse',
            detalhe: '',
        })
        bloco.corpo.appendChild(infoEl)

        // Carrega os dados assincronamente e atualiza
        etapa.infoPJE().then(detalhe => {
            if (detalhe) infoEl.atualizarDetalhe(detalhe)
        }).catch(() => {})
    }

    // Instrução rápida
    if (etapa.instrucaoRapida) {
        bloco.corpo.appendChild(
            criarInstrucaoRapida({ texto: etapa.instrucaoRapida })
        )
    }

    // Instrução longa
    if (etapa.instrucaoLonga) {
        bloco.corpo.appendChild(
            criarInstrucaoLonga({ texto: etapa.instrucaoLonga })
        )
    }

    // Divisor
    if (etapa.acoes?.length) {
        bloco.corpo.appendChild(criarDivisor())
    }

    // Tabela de ações
    if (etapa.acoes?.length) {
        bloco.corpo.appendChild(criarTabelaAcoes(etapa.acoes))
    }

    container.appendChild(bloco.el)

    // ── Botões de navegação da etapa
    conector_montarNavegacaoEtapa(container, etapa, roteiro, sessao)
}


// ── Navegação entre etapas ────────────────────────────────────

function conector_montarNavegacaoEtapa(container, etapa, roteiro, sessao) {

    const temProxima = !!etapa.proximo
    const total      = sessao?.processos?.length || 0
    const cursor     = sessao?.cursor || 0
    const ultimo     = (cursor + 1) >= total

    const rodape = criarRodape({
        aoProximo: async () => {
            await estado_marcarEtapa(etapa.id)

            if (temProxima) {
                // Avança para próxima etapa do roteiro
                await conector_montarEtapa(etapa.proximo)
            } else {
                // Última etapa — avança processo
                await acao_painel_proximoProcesso()
            }
        },
        aoEncerrar: async () => {
            await acao_painel_encerrar()
        },
    })

    // Personaliza texto do botão conforme contexto
    const btnProximo = rodape.btnProximo
    if (btnProximo) {
        if (!temProxima && ultimo) {
            btnProximo.textContent = '■ Encerrar sessão'
        } else if (!temProxima) {
            btnProximo.textContent = 'Próximo processo →'
        } else {
            btnProximo.textContent = `Próximo: ${roteiro.etapas[etapa.proximo]?.titulo || '→'}`
        }
    }

    container.appendChild(rodape)
}


// ── Painel padrão (sem roteiro guiado) ───────────────────────
//
// Exibido para tarefas do usuário (👤) ou sem sessão ativa.
// Mantém o layout original do assistente.html.

function conector_exibirPainelPadrao() {
    const container = document.getElementById('aba-roteiro')
    if (!container) return
    conector_limparContainer(container)
    // O HTML original já tem os elementos do painel padrão —
    // basta garantir que estão visíveis
}


// ── Limpar container ──────────────────────────────────────────
//
// Remove apenas os blocos do roteiro, preservando
// nav-processos, anotacao-bloco, btn-avancar e aviso-roteiro.

function conector_limparContainer(container) {
    const preservar = new Set([
        'nav-processos',
        'card-processo',
        'params-bloco',
        'anotacao-bloco',
        'temporizador-bloco',
        'btn-avancar',
        'aviso-roteiro',
    ])

    Array.from(container.children).forEach(filho => {
        if (!preservar.has(filho.id) && !filho.classList.contains('nav-processos')) {
            filho.remove()
        }
    })
}


// ── Atualizar info PJE em tempo real ─────────────────────────
//
// Chamado quando o interceptador sinaliza novos dados.
// Atualiza os blocos de info sem remontar tudo.

document.addEventListener('RotaMetaTagAtualizada', async (e) => {
    if (!_con_etapaAtual || !_con_tarefaAtual) return

    const roteiro = ROTA_ROTEIROS[_con_tarefaAtual]
    if (!roteiro) return

    const etapa = roteiro.etapas[_con_etapaAtual]
    if (!etapa?.infoPJE) return

    const infoEl = document.querySelector('#aba-roteiro .info-pje-label')?.closest('div')
    if (!infoEl?.atualizarDetalhe) return

    const detalhe = await etapa.infoPJE().catch(() => null)
    if (detalhe) infoEl.atualizarDetalhe(detalhe)
})
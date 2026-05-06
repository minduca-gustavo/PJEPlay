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
    await conector_montar()

    // Reage a mudanças no storage
    browser.storage.onChanged.addListener(async (mudancas) => {
        const sessaoMudou  = !!mudancas[ROTA_CHAVES.sessao]
        const tarefaMudou  = !!mudancas[ROTA_CHAVES.tarefaAtiva]

        if (sessaoMudou || tarefaMudou) {
            await conector_montar()
        }
    })

    // Reage ao evento de avanço de etapa (disparado por acao_painel_proximaEtapa)
    document.addEventListener('RotaAvancarEtapa', async (e) => {
        await conector_montarEtapa(e.detail?.idEtapa)
    })
}


// ── Montar painel completo ────────────────────────────────────

async function conector_montar() {
    if (_con_montando) return
    _con_montando = true

    try {
        const cfg     = await obterArmazenamento([ROTA_CHAVES.sessao, ROTA_CHAVES.tarefaAtiva])
        const sessao  = cfg?.[ROTA_CHAVES.sessao]
        const idTarefa = cfg?.[ROTA_CHAVES.tarefaAtiva]

        // Sem sessão ativa ou tarefa de sistema → painel padrão
        if (!sessao?.ativa || !idTarefa) {
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
        await conector_montarEtapa(idEtapa, roteiro, sessao)

    } finally {
        _con_montando = false
    }
}


// ── Montar etapa específica ───────────────────────────────────

async function conector_montarEtapa(idEtapa, roteiro, sessao) {

    // Se não recebeu roteiro, busca novamente
    if (!roteiro) {
        const cfg      = await obterArmazenamento([ROTA_CHAVES.sessao, ROTA_CHAVES.tarefaAtiva])
        sessao         = cfg?.[ROTA_CHAVES.sessao]
        const idTarefa = cfg?.[ROTA_CHAVES.tarefaAtiva]
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

    // Salva etapa atual na sessão
    await estado_avancarEtapa(idEtapa)

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
    const btnProximo = rodape.querySelector('.btn-avancar, button:last-child')
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

// ============================================================
// assistente.js
// Lógica da janela assistente do Rota PJE.
//
// Esta janela é aberta como popup separado (20% da tela).
// Comunica com o PJE via browser.storage.local.
// ============================================================


// ── Estado local ──────────────────────────────────────────────

let _ass_sessao       = null   // sessão ativa lida do storage
let _ass_tmrIntervalo = null   // intervalo do temporizador
let _ass_tmrPausado   = false
let _ass_historico    = []


// ── Inicialização ─────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {

    // Inicializa abas
    ass_iniciarAbas()

    // Lê sessão e monta interface
    await ass_atualizar()

    // Inicia o conector do roteiro guiado
    if (typeof conector_iniciar === 'function') {
        conector_iniciar()
    }

    // Ouve mudanças no storage (pipeline avança, dados chegam)
    browser.storage.onChanged.addListener(async (mudancas) => {
        // Sessão avançou — atualiza painel principal E conector
        if (mudancas[ROTA_CHAVES.sessao]) {
            await ass_atualizar()
            await conector_montar()
            return
        }

        // Tarefa mudou — remonta o conector
        if (mudancas['tarefaAtiva'] || mudancas['tarefaAtivaIsSistema']) {
            await conector_montar()
            return
        }

        // Dados do processo chegaram — só atualiza o card, não remonta o roteiro
        const chavesProcesso = ['rotaDados_processo', 'rotaDados_processo_partes', 'rotaDados_audiencias']
        if (chavesProcesso.some(c => mudancas[c])) {
            await ass_atualizarInfoProcesso()
        }
    })

    // Botão fechar
    document.getElementById('btn-fechar-assistente')
        ?.addEventListener('click', () => window.close())

    // Botão avançar
    document.getElementById('btn-avancar')
        ?.addEventListener('click', ass_avancar)

    // Botões de navegação entre processos (só leitura — não avança o pipeline)
    document.getElementById('btn-anterior')
        ?.addEventListener('click', () => ass_navegarHistorico(-1))
    document.getElementById('btn-proximo')
        ?.addEventListener('click', ass_avancar)
})


// ── Abas ──────────────────────────────────────────────────────

function ass_iniciarAbas() {
    document.querySelectorAll('.assistente-aba').forEach(btn => {
        btn.addEventListener('click', () => {
            const aba = btn.dataset.aba
            document.querySelectorAll('.assistente-aba').forEach(b => b.classList.remove('ativa'))
            document.querySelectorAll('.assistente-pagina').forEach(p => p.classList.remove('ativa'))
            btn.classList.add('ativa')
            document.getElementById('aba-' + aba)?.classList.add('ativa')
        })
    })
}


// ── Atualização principal ─────────────────────────────────────

async function ass_atualizar() {
    const cfg    = await obterArmazenamento([ROTA_CHAVES.sessao])
    const sessao = cfg?.[ROTA_CHAVES.sessao]

    _ass_sessao = sessao

    if (!sessao?.ativa) {
        ass_exibirSemSessao()
        return
    }

    ass_exibirSessaoAtiva(sessao)
}


// ── Sem sessão ────────────────────────────────────────────────

function ass_exibirSemSessao() {
    document.getElementById('assistente-subtitulo').textContent = 'Aguardando…'
    document.getElementById('nav-posicao').textContent          = '— / —'
    document.getElementById('nav-tarefa').textContent           = 'nenhuma tarefa ativa'
    document.getElementById('card-processo').style.display      = 'none'
    document.getElementById('temporizador-bloco').style.display = 'none'
    document.getElementById('rodape-status').textContent        = 'Nenhuma sessão ativa'

    const btnAvancar = document.getElementById('btn-avancar')
    if (btnAvancar) {
        btnAvancar.textContent = '▶ Avançar processo'
        btnAvancar.disabled    = true
        btnAvancar.style.opacity = '0.4'
    }

    ass_pararTemporizador()
}


// ── Sessão ativa ──────────────────────────────────────────────

function ass_exibirSessaoAtiva(sessao) {
    const { tarefa, cursor, processos, etapaAtual, checklist } = sessao
    const total   = processos?.length || 0
    const atual   = (cursor || 0) + 1
    const numProc = processos?.[cursor || 0] || '—'

    // Cabeçalho
    document.getElementById('assistente-subtitulo').textContent =
        tarefa ? `Tarefa: ${tarefa}` : 'Sessão ativa'

    // Navegação
    document.getElementById('nav-posicao').textContent = `${atual} / ${total}`
    document.getElementById('nav-tarefa').textContent  = tarefa || '—'

    document.getElementById('btn-anterior').disabled =
        (cursor || 0) === 0
    document.getElementById('btn-proximo').disabled  = false

    // Card do processo
    const card = document.getElementById('card-processo')
    card.style.display = 'block'
    document.getElementById('processo-numero').textContent = numProc
    document.getElementById('processo-badge').textContent  =
        etapaAtual ? `Etapa: ${etapaAtual}` : 'Em andamento'

    // Botão avançar
    const btnAvancar = document.getElementById('btn-avancar')
    if (btnAvancar) {
        const ultimo = atual >= total
        btnAvancar.textContent  = ultimo ? '■ Encerrar sessão' : '▶ Avançar processo'
        btnAvancar.disabled     = false
        btnAvancar.style.opacity = '1'
        btnAvancar.className    = 'btn-avancar' + (ultimo ? ' encerrar' : '')
    }

    // Rodapé
    document.getElementById('rodape-status').textContent =
        `${atual} de ${total} processos`

    // Histórico
    ass_atualizarHistorico(sessao)
}


// ── Avançar / Encerrar ────────────────────────────────────────

async function ass_avancar() {
    if (!_ass_sessao?.ativa) return

    const sessao  = _ass_sessao
    const total   = sessao.processos?.length || 0
    const cursor  = sessao.cursor || 0
    const ultimo  = (cursor + 1) >= total

    // Salva anotação atual
    const anotacao = document.getElementById('input-anotacao')?.value?.trim() || ''
    if (anotacao) {
        const etapa = sessao.etapaAtual || 'manual'
        await estado_marcarEtapa(etapa, anotacao)
        document.getElementById('input-anotacao').value = ''
    }

    ass_pararTemporizador()

    if (ultimo) {
        // Encerrar sessão
        await estado_encerrar()
        ass_exibirSemSessao()
        document.getElementById('rodape-status').textContent = 'Sessão encerrada.'
    } else {
        // Próximo processo
        await estado_avancarProcesso()
    }
}


// ── Histórico ─────────────────────────────────────────────────

function ass_atualizarHistorico(sessao) {
    const lista = document.getElementById('historico-lista')
    if (!lista) return

    const checklist = sessao.checklist || {}
    const itens     = Object.entries(checklist)

    if (!itens.length) {
        lista.innerHTML = ''
        lista.textContent = 'Nenhum processo percorrido ainda.'
        return
    }

    lista.innerHTML = ''
    itens.forEach(([etapa, dados]) => {
        const item = document.createElement('div')
        item.className = 'historico-item'

        const num  = document.createElement('span')
        num.className   = 'historico-num'
        num.textContent = etapa

        const nota = document.createElement('span')
        nota.className   = 'historico-nota'
        nota.textContent = dados.nota || '—'

        item.appendChild(num)
        item.appendChild(nota)
        lista.appendChild(item)
    })
}

function ass_navegarHistorico(direcao) {
    // Por enquanto apenas scroll visual — pipeline não é afetado
    const lista = document.getElementById('historico-lista')
    if (lista) lista.scrollBy({ top: direcao * 60, behavior: 'smooth' })
}


// ── Temporizador ──────────────────────────────────────────────

function ass_iniciarTemporizador(segundosTotal, opcoes = [], sessao) {
    ass_pararTemporizador()

    const bloco    = document.getElementById('temporizador-bloco')
    const display  = document.getElementById('temporizador-display')
    const opcoesEl = document.getElementById('temporizador-opcoes')

    if (!bloco || !display) return

    bloco.style.display  = 'flex'
    display.className    = 'temporizador-display'
    display.textContent  = segundosTotal
    _ass_tmrPausado      = false

    // Botões de opção
    opcoesEl.innerHTML = ''
    opcoes.forEach(opcao => {
        const btn = document.createElement('button')
        btn.className   = 'tmr-opcao-btn'
        btn.textContent = opcao
        btn.addEventListener('click', () => {
            opcoesEl.querySelectorAll('.tmr-opcao-btn').forEach(b => b.classList.remove('ativa'))
            btn.classList.add('ativa')
            localStorage.setItem('pjerota_nota_' + sessao, opcao)
        })
        opcoesEl.appendChild(btn)
    })

    // Pause ao clicar no display
    display.addEventListener('click', () => {
        if (_ass_tmrPausado) return
        _ass_tmrPausado = true
        ass_pararTemporizador()
        display.className   = 'temporizador-display pausado'
        display.textContent = 'Pausado.\nClique em Avançar para continuar.'
    })

    let restante = segundosTotal
    _ass_tmrIntervalo = setInterval(() => {
        restante--
        display.textContent = restante
        if (restante <= 5) display.className = 'temporizador-display urgente'
        if (restante <= 0) {
            ass_pararTemporizador()
            ass_avancar()
        }
    }, 1000)
}

function ass_pararTemporizador() {
    if (_ass_tmrIntervalo) {
        clearInterval(_ass_tmrIntervalo)
        _ass_tmrIntervalo = null
    }
}


// ── Aviso inline ──────────────────────────────────────────────

function ass_exibirAviso(msg = '', tipo = 'info', ms = 4000) {
    const el = document.getElementById('aviso-roteiro')
    if (!el) return

    el.textContent  = msg
    el.className    = `aviso aviso-${tipo}`
    el.style.display = 'block'

    if (ms > 0) {
        setTimeout(() => { el.style.display = 'none' }, ms)
    }
}


// ── Atualizar info do processo (via metatags) ─────────────────
//
// Chamado quando a janela do PJE sinaliza que dados chegaram.
// A janela do PJE não tem acesso direto a esta janela, mas
// ambas compartilham o storage — a comunicação é indireta.

async function ass_atualizarInfoProcesso() {
    const infoEl = document.getElementById('processo-info')
    if (!infoEl || !_ass_sessao?.ativa) return

    // Tenta ler dados básicos do storage (salvos pelo interceptador via background)
    const cfg = await obterArmazenamento(['rotaDados_processo', 'rotaDados_processo_partes'])
    const dados   = cfg?.rotaDados_processo
    const partes  = cfg?.rotaDados_processo_partes

    if (!dados) {
        infoEl.textContent = ''
        return
    }

    // Extrai reclamante e reclamada das partes
    let nomeReclamante = '', nomeReclamada = ''
    if(Array.isArray(partes)){
        const rec  = partes.find(p => (p.tipoParte||p.polo||'').toLowerCase().includes('reclamante') || (p.tipoParte||p.polo||'').toLowerCase().includes('ativo'))
        const reda = partes.find(p => (p.tipoParte||p.polo||'').toLowerCase().includes('reclamada') || (p.tipoParte||p.polo||'').toLowerCase().includes('passivo'))
        nomeReclamante = rec?.nome  || rec?.pessoaFisica?.nome  || rec?.pessoaJuridica?.nome  || ''
        nomeReclamada  = reda?.nome || reda?.pessoaFisica?.nome || reda?.pessoaJuridica?.nome || ''
    }

    const linhas = [
        nomeReclamante ? `👤 ${nomeReclamante}` : null,
        nomeReclamada  ? `🏢 ${nomeReclamada}`  : null,
        dados?.valorDaCausa ? `💰 R$ ${Number(dados.valorDaCausa).toLocaleString('pt-BR', {minimumFractionDigits:2})}` : null,
        dados?.justicaGratuita ? '✅ Justiça gratuita' : null,
        dados?.tutelaOuLiminar ? '⚠️ Tutela/Liminar pendente' : null,
    ].filter(Boolean).join('\n')

    infoEl.textContent = linhas
}
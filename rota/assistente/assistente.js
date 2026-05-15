// ============================================================
// assistente.js
// Bootstrap da janela assistente do Rota PJE.
//
// Responsabilidades:
//   1. Ler parâmetros da URL (execucao, tarefa)
//   2. Validar execucao contra o storage — fecha se não bater
//   3. Preencher cabeçalho fixo (tarefa, processo, posição)
//   4. Criar rodapé fixo com criaBotaoProximoEEncerrar
//   5. Expor 'rota-corpo' limpo para o roteiro da tarefa
//
// O que NÃO faz:
//   - Não monta conteúdo da área rolável (responsabilidade do roteiro)
//   - Não reage a mudanças de storage após a montagem inicial
//     (o assistente é recriado a cada processo)
// ============================================================


// ── Humanização do nome da tarefa ─────────────────────────────

const _ASS_NOMES_TAREFA = {
    'triagem-inicial':   'Triagem Inicial',
    'pos-triagem':       'Pós-Triagem',
    'balcao-virtual':    'Balcão Virtual',
    'audiencia':         'Audiência',
    'cumprimento':       'Cumprimento de Sentença',
    'execucao':          'Execução',
    'sentenca':          'Sentença',
    'instrucao':         'Instrução',
    'julgamento':        'Julgamento',
}

function _ass_nomeTarefa(id) {
    if (!id) return '—'
    if (_ASS_NOMES_TAREFA[id]) return _ASS_NOMES_TAREFA[id]
    // Fallback: kebab-case → Title Case
    return id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}


// ── Parâmetros da URL ─────────────────────────────────────────

function _ass_params() {
    const p = new URL(location.href).searchParams
    return {
        execucao: p.get('pjerota_execucao') || '',
        tarefa:   p.get('pjerota_tarefa')   || '',
    }
}


// ── Inicialização ─────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {

    const { execucao, tarefa } = _ass_params()

    // ── Valida execucao contra o storage ──────────────────────
    // Se não bater, esta janela é resquício de execução anterior.
    // Fecha silenciosamente.
    if (execucao) {
        const cfg = await obterArmazenamento(['rotaExecucaoAtual'])
        const execucaoAtual = String(cfg?.rotaExecucaoAtual || '')
        if (execucaoAtual && execucaoAtual !== execucao) {
            window.close()
            return
        }
    }

    // ── Preenche cabeçalho fixo ───────────────────────────────
    await _ass_preencherCabecalho(tarefa)

    // ── Cria rodapé com Próximo/Encerrar ─────────────────────
    // O rodapé do HTML original tem só um span de status.
    // Substituímos pelo par de botões via ui.js.
    const rodape = document.querySelector('.assistente-rodape')
    if (rodape) {
        rodape.innerHTML = ''
        rodape.id = 'rota-rodape'
        criaBotaoProximoEEncerrar({ id: 'rota-btn-nav', ancestral: 'rota-rodape' })
    }

    // ── Botão fechar ──────────────────────────────────────────
    document.getElementById('btn-fechar-assistente')
        ?.addEventListener('click', () => window.close())

    // ── Exibe carregando na área rolável ─────────────────────
    // O roteiro da tarefa chamará removerCarregando() quando
    // os dados chegarem e a interface estiver pronta.
    criarCarregando('rota-corpo')

    // Os roteiros das tarefas se auto-iniciam pelos próprios
    // scripts declarados no assistente.html, filtrando pelo
    // parâmetro pjerota_tarefa da URL.
})


// ── Preencher cabeçalho ───────────────────────────────────────

async function _ass_preencherCabecalho(idTarefa) {

    // Nome da tarefa
    const elTarefa = document.getElementById('assistente-tarefa')
    if (elTarefa) elTarefa.textContent = _ass_nomeTarefa(idTarefa)

    // Processo atual e posição — lidos da sessão no storage
    const cfg    = await obterArmazenamento([ROTA_CHAVES.sessao])
    const sessao = cfg?.[ROTA_CHAVES.sessao]

    const elProcesso = document.getElementById('assistente-processo')
    const elPosicao  = document.getElementById('nav-posicao')

    if (!sessao?.ativa) {
        if (elProcesso) elProcesso.textContent = '—'
        if (elPosicao)  elPosicao.textContent  = '— / —'
        return
    }

    const cursor  = sessao.cursor  || 0
    const total   = sessao.processos?.length || 0
    const numProc = sessao.processos?.[cursor] || '—'

    if (elProcesso) elProcesso.textContent = numProc
    if (elPosicao)  elPosicao.textContent  = `${cursor + 1} / ${total}`
}


// ── Limpar área rolável ───────────────────────────────────────
//
// Chamado pelo roteiro antes de remontar a interface.
// Remove tudo dentro de #rota-corpo, incluindo o carregando.

function ass_limparCorpo() {
    const corpo = document.getElementById('rota-corpo')
    if (corpo) corpo.innerHTML = ''
}
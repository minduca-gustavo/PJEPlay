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

    // Valida execucao
    if (execucao) {
        const cfg = await obterArmazenamento(['rotaExecucaoAtual'])
        const execucaoAtual = String(cfg?.rotaExecucaoAtual || '')
        if (execucaoAtual && execucaoAtual !== execucao) {
            window.close()
            return
        }
    }

    // Ouve fechamento por nova execução
    browser.storage.onChanged.addListener(function ouvirExecucao(mudancas) {
        if (mudancas['rotaExecucaoAtual']?.newValue) {
            const novoExecucao = String(mudancas['rotaExecucaoAtual'].newValue)
            const meuExecucao  = new URL(location.href).searchParams.get('pjerota_execucao')
            if (novoExecucao !== meuExecucao) {
                browser.storage.onChanged.removeListener(ouvirExecucao)
                window.close()
            }
        }
    })

    // Cria rodapé imediatamente
    const rodape = document.querySelector('.assistente-rodape')
    if (rodape) {
        rodape.innerHTML = ''
        rodape.id = 'rota-rodape'
        criaBotaoProximoEEncerrar({ id: 'rota-btn-nav', ancestral: 'rota-rodape' })
    }

    document.getElementById('btn-fechar-assistente')
        ?.addEventListener('click', () => window.close())

    // Mostra carregando enquanto aguarda dados prontos
    criarCarregando('rota-corpo')

    // Aguarda sinal de dados prontos ANTES de preencher o cabeçalho
    await new Promise(resolver => {
        browser.storage.onChanged.addListener(function ouvirDados(mudancas) {
            if (mudancas['rota_dadosProntos']?.newValue === true) {
                browser.storage.onChanged.removeListener(ouvirDados)
                resolver()
            }
        })
    })

    // Agora o pipeline já atualizou o cursor — cabeçalho correto
    await _ass_preencherCabecalho(tarefa)
})


// ── Preencher cabeçalho ───────────────────────────────────────

async function _ass_preencherCabecalho(idTarefa) {
    const elTarefa   = document.getElementById('assistente-tarefa')
    const elProcesso = document.getElementById('assistente-processo')
    const elPosicao  = document.getElementById('nav-posicao')

    if (elTarefa) elTarefa.textContent = _ass_nomeTarefa(idTarefa)

    const cfg = await obterArmazenamento(['rotaProcessoAtual', 'rotaPosicaoAtual', 'rotaTotalProcessos'])
    if (elProcesso) elProcesso.textContent = cfg?.rotaProcessoAtual  || '—'
    if (elPosicao)  elPosicao.textContent  = (cfg?.rotaPosicaoAtual || '—') + ' / ' + (cfg?.rotaTotalProcessos || '—')
}

// Fecha sozinho quando uma nova execução começar
browser.storage.onChanged.addListener(function ouvirExecucao(mudancas) {
    if (mudancas['rotaExecucaoAtual']?.newValue) {
        const novoExecucao = String(mudancas['rotaExecucaoAtual'].newValue)
        const meuExecucao  = new URL(location.href).searchParams.get('pjerota_execucao')
        if (novoExecucao !== meuExecucao) {
            browser.storage.onChanged.removeListener(ouvirExecucao)
            window.close()
        }
    }
})

browser.storage.onChanged.addListener(function ouvirFechar(mudancas) {
    if (mudancas['rotaAssistenteFechar']?.newValue === true) {
        browser.storage.onChanged.removeListener(ouvirFechar)
        armazenar({ rotaAssistenteFechar: false })
        window.close()
    }
})
// ── Limpar área rolável ───────────────────────────────────────
//
// Chamado pelo roteiro antes de remontar a interface.
// Remove tudo dentro de #rota-corpo, incluindo o carregando.

function ass_limparCorpo() {
    const corpo = document.getElementById('rota-corpo')
    if (corpo) corpo.innerHTML = ''
}
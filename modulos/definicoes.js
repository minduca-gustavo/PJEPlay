// ── Variáveis e definições globais ───────────────────────────
// No topo do content script (ex: index.js ou onde MODO_DEV é usado)

const
	LOCAL		= (typeof window !== 'undefined') ? window.location.href : '',
	NAVEGADOR	= _definirNavegador(),
	EXTENSAO	= _definirExtensao()

var CONFIGURACAO = {}
var MODO_DEV = false

// Lê o valor salvo no storage ao iniciar
obterArmazenamento(['modoDev']).then(cfg => {
    MODO_DEV = cfg?.modoDev === true
})



// Reage a mudanças em tempo real (popup alterando o valor)
NAVEGADOR.storage.onChanged.addListener((changes) => {
    if ('modoDev' in changes) {
        MODO_DEV = changes.modoDev.newValue === true
    }
})   // ativado via popup página 4 — controla o relatar()
var JANELA = {
    meuPainel:          	/\/pjekz\/gigs\/meu-painel/,
    painelGlobal:      		/\/pjekz\/painel\/global/,
	painelGlobalTarefas:	/\/pjekz\/painel\/global\/\d*\/lista-processos/,
    painelGlobalTodos: 		/\/pjekz\/painel\/global\/todos\/lista-processos/,
    detalhes:          		/\/pjekz\/processo\/\d*\/detalhe/,
    tarefa:          		/\/pjekz\/processo\/\d*\/tarefa\/\d*\/*/,
	documentosConteudo:		/\/pjekz\/processo\/\d*\/detalhe\/documento\/\d*\/conteudo*/,
	escaninho: 				/\/pjekz\/escaninho/,
	retificar:				/\/pjekz\/processo\/\d*\/retificar/,
	certificar:				/\/pjekz\/processo\/\d*\/documento\/anexar/,
	processoTarefa: 		/\/pjekz\/processo\/\d*\/tarefa\/\d*\/*/,
	pautaAudiencias: 		/\/pjekz\/pauta-audiencias/,
}



function _definirNavegador(){
	if(typeof browser === 'undefined' && typeof chrome !== 'undefined') return chrome
	return browser
}

function _definirExtensao(){
	let ext = NAVEGADOR.runtime.getManifest()
	ext.prefixo = ext.short_name.toLowerCase().replace(/[-]/g, '')
	return ext
}


// ── Storage ───────────────────────────────────────────────────

function armazenar(chave){
	try{ return NAVEGADOR.storage.local.set(chave) }
	catch(e){ console.error('[RotaPJE] armazenar:', e); throw e }
}

async function obterArmazenamento(chave = null){
	try{ return await NAVEGADOR.storage.local.get(chave) }
	catch(e){ return chave === null ? {} : null }
}

async function removerArmazenamento(chave) {
    await NAVEGADOR.storage.local.remove(chave)
}

// ── Humanização do nome da tarefa ─────────────────────────────

const _ASS_NOMES_TAREFA = {
    'triagem_inicial':   'Triagem Inicial',
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
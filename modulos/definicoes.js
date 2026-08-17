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
    gigsRelatorios:         /\/pjekz\/gigs\/relatorios\/atividades/,
    painelGlobal:      		/\/pjekz\/painel\/global/,
	painelGlobalTarefas:	/\/pjekz\/painel\/global\/\d*\/lista-processos/,
	analisarEAssinar:	/\/pjekz\/painel\/global\/2\/lista-processos/,
    painelGlobalTodos: 		/\/pjekz\/painel\/global\/todos\/lista-processos/,
    detalhes:          		/\/pjekz\/processo\/\d*\/detalhe/,
    tarefa:          		/\/pjekz\/processo\/\d*\/tarefa\/\d*\/*/,
	documentosConteudo:		/\/pjekz\/processo\/\d*\/detalhe\/documento\/\d*\/conteudo*/,
	escaninho: 				/\/pjekz\/escaninho/,
	retificar:				/\/pjekz\/processo\/\d*\/retificar/,
	certificar:				/\/pjekz\/processo\/\d*\/documento\/anexar/,
	pec:				    /\/pjekz\/processo\/\d*\/comunicacoesprocessuais\/minutas/,
	processoTarefa: 		/\/pjekz\/processo\/\d*\/tarefa\/\d*\/*/,
	pautaAudiencias: 		/\/pjekz\/pauta-audiencias/,
	atasAudiencias: 		/\/pjekz\/atas-audiencias/,
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

function buscaEmTextoMalFormatado(textoABuscar, termo, antes = 0, depois = 0){
    console.log('%c[Rota PJE]%c chamou buscaEm ' + JSON.stringify(123), LOG.rosa, 'color:inherit')
    let texto = normalizar(textoABuscar).toLowerCase()
    let mapa = []
    let espacos = []
    let limpo = ''
    for (let i=0; i < texto.length; i++){
        let c = texto[i];
        if (/\s/.test(c)) {
            espacos.push(i);
            continue; // pula espaços/quebras de linha
        }
        limpo += c;
        mapa.push(i);
    }
    console.log('termo: ' + JSON.stringify(termo))
    //let d = termo.map(e => !/\s/.test(e)).join('')
    //console.log('%c[Rota PJE]%c d: ' + JSON.stringify(d), LOG.aviso, 'color:inherit')
    let busca = normalizar(termo).toLowerCase().replace(/\s+/g, '')
    console.log('busca: ' + JSON.stringify(busca))
    let posicao = limpo.indexOf(busca)
    if (posicao === -1) return null
    let inicio = mapa[posicao]
    let fim = mapa[posicao + busca.length - 1] + 1
    let espacoInicio = espacos[espacos.findIndex(d=> d > Math.max(0, inicio - antes)) - 1]
    let espacoFim = espacos[espacos.findIndex(d=> d > Math.min(textoABuscar.length, fim + depois))]
    let resultado = textoABuscar.slice(espacoInicio, espacoFim)
    return {trechos: resultado, termo: termo, inicio: inicio, fim: fim}
    
}
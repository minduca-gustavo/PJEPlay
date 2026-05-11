// ── Variáveis e definições globais ───────────────────────────

const
	LOCAL		= (typeof window !== 'undefined') ? window.location.href : '',
	NAVEGADOR	= _definirNavegador(),
	EXTENSAO	= _definirExtensao()

var CONFIGURACAO = {}
var MODO_DEV     = false   // ativado via popup página 4 — controla o relatar()
var JANELA = {
    meuPainel:          /\/pjekz\/gigs\/meu-painel/,
    painelGlobal:      	/\/pjekz\/painel\/global/,
    painelGlobalTodos: 	/\/pjekz\/painel\/global\/todos\/lista-processos/,
    detalhes:          	/\/pjekz\/processo\/\d*\/detalhe/,
	escaninho: 			/\/pjekz\/escaninho/,
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
	catch(e){ console.error('[PJEPlay] armazenar:', e); throw e }
}

async function obterArmazenamento(chave = null){
	try{ return await NAVEGADOR.storage.local.get(chave) }
	catch(e){ return chave === null ? {} : null }
}

async function removerArmazenamento(chave) {
    await NAVEGADOR.storage.local.remove(chave)
}
// ============================================================
// iniciar.js — ponto de entrada dos content scripts
// ============================================================

obterArmazenamento().then(async armazenamento => {
	CONFIGURACAO = armazenamento
	MODO_DEV     = armazenamento?.modoDev === true

	relatar('Rota PJE iniciando…', '', 'execucao')

	// [ALTERAÇÃO 4] Verifica se a extensão está habilitada
	let habilitado = CONFIGURACAO?.habilitado !== false  // padrão: habilitado

	if(location.search.includes('pjerota_sessao=')){
		// Janelas filhas sempre funcionam (já foram abertas pelo pipeline)
		pintura_iniciar().catch(e => relatar('Pintura: ' + e.message, '', 'erro'))
		rota_injetarWidget().catch(e => relatar('Widget: ' + e.message, '', 'erro'))
	} else {
		// Telas de listagem: respeita o toggle
		if(habilitado){
			pintura_iniciar().catch(e => relatar('Pintura: ' + e.message, '', 'erro'))
			botaoRota_iniciar()
		}
	}
})

// Detecta navegação SPA
let _urlAnterior = location.href
new MutationObserver(() => {
	if(location.href !== _urlAnterior){
		_urlAnterior = location.href
		remover('#pjerota-widget')
		pintura_iniciar().catch(()=>{})

		if(location.search.includes('pjerota_sessao=')){
			// Janela filha — remonta o widget após navegação interna
			rota_injetarWidget().catch(e => relatar('Widget (SPA): ' + e.message, '', 'erro'))
		} else {
			obterArmazenamento(['habilitado']).then(cfg => {
				let habilitado = cfg?.habilitado !== false
				if(habilitado){
					botaoRota_atualizarUrl()
					window.dispatchEvent(new CustomEvent('pjerota:url-mudou'))
				}
			})
		}
	}
}).observe(document.body, { childList:true, subtree:true })
// ============================================================
// iniciar.js — ponto de entrada dos content scripts
// ============================================================

obterArmazenamento().then(async armazenamento => {
	CONFIGURACAO = armazenamento

	relatar('PJE Play iniciando…', '', 'execucao')

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
			botaoPlay_iniciar()
		}
	}
})

// Detecta navegação SPA
let _urlAnterior = location.href
new MutationObserver(() => {
	if(location.href !== _urlAnterior){
		_urlAnterior = location.href
		remover('#pjerota-widget')
		obterArmazenamento(['habilitado']).then(cfg => {
			let habilitado = cfg?.habilitado !== false
			pintura_iniciar().catch(()=>{})
			if(habilitado){
				botaoPlay_atualizarUrl()
				window.dispatchEvent(new CustomEvent('pjerota:url-mudou'))
			}
		})
	}
}).observe(document.body, { childList:true, subtree:true })

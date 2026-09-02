// ============================================================
// documento/paginas/pje/pje.js
// Substitui o antigo pje/iniciar.js.
//
// Mesmo desenho do pje() do SISE: uma guarda de contexto no
// topo e, abaixo, a orquestração do que roda na página.
// A lógica de janela-filha / janela-normal / navegação SPA é a
// original do Rota, sem alteração de comportamento.
// ============================================================

async function rota(){

	// Guarda deliberadamente ampla: o Rota atua não só no host do
	// PJe, mas também em sigeo, exe-pje, gigs e /aud. O escopo real
	// continua sendo o do manifest (*.jus.br), igual ao de antes —
	// esta guarda só existe para o caso de o content script ser
	// injetado programaticamente em outro lugar.
	if(!LOCAL.includes('.jus.br')){
		relatar('Fora do domínio da Justiça — Rota não atua aqui.', LOCAL, 'contexto')
		return
	}

	relatar('Otimizando o PJe…', CONTEXTO, 'execucao')

	// nucleo/rota-nucleo.js
	identificaUsuario()

	await rota_aoAbrir()

	rota_observarNavegacaoSPA()

}


async function rota_aoAbrir(){

	let habilitado = CONFIGURACAO?.habilitado !== false   // padrão: habilitado

	// ── Janela filha aberta pelo fluxo (traz a sessão na URL) ──
	if(location.search.includes('rotapje_sessao=')){
		pinturaInicio().catch(e => relatar('Pintura:', e, 'erro'))
		rota_injetarWidget().catch(e => relatar('Widget:', e, 'erro'))
		return
	}

	// ── Janela filha que recarregou ────────────────────────────
	// sessionStorage sobrevive ao recarregamento e morre ao fechar a aba.
	const chaveJanela = sessionStorage.getItem('rotapje_chave_janela')
	if(chaveJanela){
		const ctx      = await obterArmazenamento(chaveJanela)
		const ctxSalvo = ctx?.[chaveJanela]
		if(ctxSalvo){
			relatar('Janela filha recarregada — restaurando widget…', '', 'execucao')
			pinturaInicio().catch(e => relatar('Pintura:', e, 'erro'))
			rota_injetarWidget(ctxSalvo).catch(e => relatar('Widget (restaurado):', e, 'erro'))
			return
		}
	}

	// ── Telas normais: respeita o interruptor ──────────────────
	if(!habilitado) return

	pinturaInicio().catch(e => relatar('Pintura:', e, 'erro'))
	botaoRota_iniciar()

}


/**
 * O PJe é uma SPA: a URL muda sem recarregar o documento.
 * Este observador é o que dispara a remontagem dos widgets e o
 * evento 'rotapje:url-mudou' que os assistentes flutuantes ouvem.
 */
function rota_observarNavegacaoSPA(){

	let urlAnterior = LOCAL

	new MutationObserver(() => {

		if(location.href === urlAnterior) return
		urlAnterior = location.href

		relatar('Navegação SPA:', urlAnterior, 'mutacao')

		remover('#rotapje-widget')
		pinturaInicio().catch(() => {})

		if(location.search.includes('rotapje_sessao=')){
			rota_injetarWidget().catch(e => relatar('Widget (SPA):', e, 'erro'))
			return
		}

		const chaveJanela = sessionStorage.getItem('rotapje_chave_janela')

		if(chaveJanela){
			obterArmazenamento(chaveJanela).then(ctx => {
				const ctxSalvo = ctx?.[chaveJanela]
				if(!ctxSalvo) return
				relatar('Widget (SPA sem parâmetros) — restaurando…', '', 'execucao')
				rota_injetarWidget(ctxSalvo).catch(e => relatar('Widget (SPA restaurado):', e, 'erro'))
			})
			return
		}

		obterArmazenamento(['habilitado']).then(cfg => {
			if(cfg?.habilitado === false) return
			botaoRota_atualizarUrl()
			window.dispatchEvent(new CustomEvent('rotapje:url-mudou'))
		})

	}).observe(document.body, { childList:true, subtree:true })

}

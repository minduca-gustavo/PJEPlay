// ============================================================
// iniciar.js — ponto de entrada dos content scripts
// ============================================================

obterArmazenamento().then(async armazenamento => {
	CONFIGURACAO = armazenamento
	MODO_DEV     = armazenamento?.modoDev === true

	relatar('Rota PJE iniciando…', '', 'execucao')

	let habilitado = CONFIGURACAO?.habilitado !== false  // padrão: habilitado

	if(location.search.includes('rotapje_sessao=')){
		// Janelas filhas sempre funcionam (já foram abertas pelo fluxo)
		pinturaInicio().catch(e => relatar('Pintura: ' + e.message, '', 'erro'))
		rota_injetarWidget().catch(e => relatar('Widget: ' + e.message, '', 'erro'))
	} else {
		// ── Verifica se esta aba é uma janela filha que recarregou ─
		// sessionStorage sobrevive a recarregamentos mas morre ao fechar a aba.
		const chaveJanela = sessionStorage.getItem('rotapje_chave_janela')
		if(chaveJanela){
			const ctx = await obterArmazenamento(chaveJanela)
			const ctxSalvo = ctx?.[chaveJanela]
			if(ctxSalvo){
				relatar('Janela filha recarregada — restaurando widget…', '', 'execucao')
				pinturaInicio().catch(e => relatar('Pintura: ' + e.message, '', 'erro'))
				rota_injetarWidget(ctxSalvo).catch(e => relatar('Widget (restaurado): ' + e.message, '', 'erro'))
				return
			}
		}
		// Telas de listagem normais: respeita o toggle
		if(habilitado){
			pinturaInicio().catch(e => relatar('Pintura: ' + e.message, '', 'erro'))
			botaoRota_iniciar()
		}
	}
})

// Detecta navegação SPA
let _urlAnterior = location.href
new MutationObserver(() => {
	if(location.href !== _urlAnterior){
		_urlAnterior = location.href
		remover('#rotapje-widget')
		pinturaInicio().catch(()=>{})

		if(location.search.includes('rotapje_sessao=')){
			// Janela filha — remonta o widget após navegação interna (URL ainda tem params)
			rota_injetarWidget().catch(e => relatar('Widget (SPA): ' + e.message, '', 'erro'))
		} else {
			// ── Verifica se perdemos os params mas ainda somos janela filha ─
			const chaveJanela = sessionStorage.getItem('rotapje_chave_janela')
			if(chaveJanela){
				obterArmazenamento(chaveJanela).then(ctx => {
					const ctxSalvo = ctx?.[chaveJanela]
					if(ctxSalvo){
						relatar('Widget (SPA sem params) — restaurando…', '', 'execucao')
						rota_injetarWidget(ctxSalvo).catch(e => relatar('Widget (SPA restaurado): ' + e.message, '', 'erro'))
					}
				})
			} else {
				obterArmazenamento(['habilitado']).then(cfg => {
					let habilitado = cfg?.habilitado !== false
					if(habilitado){
						botaoRota_atualizarUrl()
						window.dispatchEvent(new CustomEvent('rotapje:url-mudou'))
					}
				})
			}
		}
	}
}).observe(document.body, { childList:true, subtree:true })


// registro_mutacoes.js
let ROTA_MUTACOES = [];
/*
rotaRegistrarMutacao({
  seletor: '.assistente-assinatura-alvo',
  callback: (el) => montarAssistenteAssinatura(el)
});
*/

function rotaRegistrarMutacao({ seletor, callback, umaVez = false }) {
  ROTA_MUTACOES.push({ seletor, callback, umaVez });
}

function rotaIniciarObservadorCentral(raiz = document.body) {
  let observer = new MutationObserver((mutations) => {
	for (let mutation of mutations) {
      for (let node of mutation.addedNodes) {
        if (node.nodeType !== 1) continue; // só elementos
        for (let regra of [...ROTA_MUTACOES]) {
          let alvo = node.matches?.(regra.seletor)
            ? node
            : node.querySelector?.(regra.seletor);
          if (alvo) {
            regra.callback(alvo);
            if (regra.umaVez) {
              let i = ROTA_MUTACOES.indexOf(regra);
              if (i > -1) ROTA_MUTACOES.splice(i, 1);
            }
          }
        }
      }
    }
  });
  observer.observe(raiz, { childList: true, subtree: true });
  return observer;
}
rotaIniciarObservadorCentral()
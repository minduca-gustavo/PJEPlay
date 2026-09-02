// ============================================================
// requisicoes/xhr.js — mundo MAIN
//
// Roda fora do sandbox do content script, logo NÃO tem acesso a
// modulos/. Tudo aqui é JS puro, de propósito.
//
// Antes eram dois monkey-patches encadeados sobre
// XMLHttpRequest.prototype no mesmo arquivo (um geral, um só de
// documento). Agora é um só, que dispara os dois eventos:
//
//   RotaRequisicaoInterceptada  → requisicoes/interceptador.js
//   RotaDocumentoInterceptado   → requisicoes/documento.js
//
// O filtro de responseType continua sendo feito ANTES de tocar em
// responseText: ler responseText de resposta binária lança, e é
// justamente em resposta binária (PDF do documento) que o segundo
// evento precisa sair.
// ============================================================

rota_interceptador_xhr()

function rota_interceptador_xhr(){

	if(window._rota_interceptando) return
	window._rota_interceptando = true

	const REGEX_DOCUMENTO = /\/pje-comum-api\/api\/processos\/id\/\d+\/documentos\/id\/\d+\/conteudo/i

	let abrir  = XMLHttpRequest.prototype.open
	let enviar = XMLHttpRequest.prototype.send

	XMLHttpRequest.prototype.open = function(metodo, url){
		this._u      = url
		this._method = metodo
		return abrir.apply(this, arguments)
	}

	XMLHttpRequest.prototype.send = function(dados){
		let requisicao = this
		let url        = requisicao._u

		requisicao.addEventListener('load', () => {

			if(!url || requisicao.readyState !== 4) return

			// ── Documento: só url e status, nunca responseText ──
			if(REGEX_DOCUMENTO.test(url)){
				document.dispatchEvent(
					new CustomEvent('RotaDocumentoInterceptado', {
						detail: { url, status: requisicao.status }
					})
				)
			}

			// ── Geral: exige resposta textual ───────────────────
			let tipo = requisicao.responseType
			if(tipo && tipo !== '' && tipo !== 'text') return

			document.dispatchEvent(
				new CustomEvent('RotaRequisicaoInterceptada', {
					detail: {
						url,
						resposta: requisicao.responseText,
						status:   requisicao.status,
						metodo:   requisicao._method,
					}
				})
			)

		})

		return enviar.call(this, dados)
	}

	let estilo = 'border-radius:3px;color:hsla(0,100%,100%,1);display:inline-block;font-weight:600;padding:0 3px;'
	console.log(
		'%cRota PJE%c interceptador XHR ativo',
		estilo + 'background:hsla(198,100%,33%,1);',
		estilo + 'background:hsla(36,100%,45%,1);margin:0 0 0 3px;'
	)

}

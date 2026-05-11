interceptador_xhr()

function interceptador_xhr(){
	if(window._rota_interceptando)
		return
	window._rota_interceptando = true

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
			if(requisicao.responseType && requisicao.responseType !== '' && requisicao.responseType !== 'text') return
			let detail     = {}
			detail.url     = url
			detail.resposta = requisicao.responseText
			detail.status  = requisicao.status
			detail.metodo  = requisicao._method
			if(requisicao.readyState === 4 && url){
				document.dispatchEvent(
					new CustomEvent('RotaRequisicaoInterceptada', { detail })
				)
			}
		})
		return enviar.call(this, dados)
	}

	let estilo = 'border-radius:3px;color:hsla(0,100%,100%,1);display:inline-block;font-weight:600;padding:0 3px;'
	console.log(
		'%cRota PJE%c✅ interceptador_xhr() executado com sucesso!',
		estilo + 'background:hsla(204,100%,40%,1);',
		estilo + 'background:hsla(24,100%,40%,1);margin:0 0 0 3px;'
	)
}
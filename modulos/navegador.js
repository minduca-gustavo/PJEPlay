function extensao_raiz(arquivo = ''){
	return NAVEGADOR.runtime.getURL(arquivo)
}

function rota_cookie(nome = ''){
	let todos  = `; ${document.cookie}`
	let pref   = `; ${nome}=`
	let idx    = todos.indexOf(pref)
	if(idx === -1) return ''
	let ini = idx + pref.length
	let fim = todos.indexOf(';', ini)
	return decodeURIComponent(fim === -1 ? todos.substring(ini) : todos.substring(ini, fim))
}

function rota_idempotencia(){
	return `"${Math.random().toString().slice(2,20)}${Date.now()}"`
}

async function rota_fetch(url = ''){
	let token    = rota_cookie('Xsrf-Token') || rota_cookie('XSRF-TOKEN')
	let instancia = CONFIGURACAO?.pessoa?.instancia || '1'
	try{
		relatar('GET ' + url, '', 'requisicao')
		let r = await fetch(url, {
			method: 'GET', mode: 'cors', credentials: 'include',
			headers:{
				'Idempotency-Key':  rota_idempotencia(),
				'X-Grau-Instancia': instancia,
				'X-XSRF-TOKEN':     token,
				'Content-Type':     'application/json',
				'Accept':           'application/json, text/plain, */*',
			}
		})
		if(!r.ok){ relatar('HTTP ' + r.status, url, 'erro'); return null }
		return await r.json()
	} catch(e){ relatar('fetch erro: ' + e.message, '', 'erro'); return null }
}

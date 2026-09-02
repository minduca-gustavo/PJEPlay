// ============================================================
// api/consultas.js
// Camada de requisição às APIs do PJe usada pelo Rota.
//
// Substitui rota/modulos/navegador.js. O que era genérico saiu
// daqui e vem de modulos/: cookie_obter() no lugar de
// rota_cookie(), criarChaveDeIdempotencia() no lugar de
// rota_idempotencia(), url_parametro_obter() onde a URL é comum,
// extensao_raiz(), armazenar(), relatar().
// ============================================================


/**
 * Token XSRF do PJe, lido dos cookies pelo módulo do SISE.
 */
function rota_token(){
	return cookie_obter('Xsrf-Token') || cookie_obter('XSRF-TOKEN')
}


/**
 * Lê parâmetro tanto da query quanto do hash.
 * url_parametro_obter() (modulos/url.js) só lê da query; o PJe
 * usa hash em várias telas, por isso a variante fica aqui.
 */
function rota_buscarParametros(nome = ''){
	return url_parametro_obter(nome)
		|| new URLSearchParams(location.hash.split('?')[1] ?? '').get(nome)
		|| null
}


function rota_cabecalhos(aceita = 'application/json, text/plain, */*'){
	return {
		'Idempotency-Key':  criarChaveDeIdempotencia(),
		'X-Grau-Instancia': CONFIGURACAO?.pessoa?.instancia || '1',
		'X-XSRF-TOKEN':     rota_token(),
		'Content-Type':     'application/json',
		'Accept':           aceita,
	}
}


async function rota_fetch(url = ''){
	try{
		relatar('GET ' + url, '', 'requisicao')
		let r = await fetch(url, {
			method: 'GET', mode: 'cors', credentials: 'include',
			headers: rota_cabecalhos()
		})
		if(!r.ok){ relatar('HTTP ' + r.status, url, 'erro'); return null }
		let dados = await r.json()
		relatar('Resposta de ' + url, dados, 'resposta')
		return dados
	} catch(e){ relatar('fetch erro: ' + e.message, url, 'erro'); return null }
}


async function rota_fetchPost(url = ''){
	try{
		relatar('POST ' + url, '', 'requisicao')
		let r = await fetch(url, {
			method: 'POST', mode: 'cors', credentials: 'include',
			headers: rota_cabecalhos()
		})
		if(!r.ok){ relatar('HTTP ' + r.status, url, 'erro'); return null }
		let dados = await r.json()
		relatar('Resposta de ' + url, dados, 'resposta')
		return dados
	} catch(e){ relatar('fetch erro: ' + e.message, url, 'erro'); return null }
}


async function post(url, corpo){
	relatar('POST (com corpo) ' + url, corpo, 'requisicao')
	return fetch(url, {
		method: 'POST',
		mode: 'cors',
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json',
			'Accept': 'application/json, text/plain, */*',
			'X-XSRF-TOKEN': rota_token(),
		},
		body: JSON.stringify(corpo)
	})
}


async function rota_download(url = ''){
	try{
		relatar('DOWNLOAD ' + url, '', 'requisicao')
		let r = await fetch(url, {
			method: 'GET', mode: 'cors', credentials: 'include',
			headers: {
				'Idempotency-Key':  criarChaveDeIdempotencia(),
				'X-Grau-Instancia': CONFIGURACAO?.pessoa?.instancia || '1',
				'X-XSRF-TOKEN':     rota_token(),
				'Accept':           '*/*',
			}
		})
		if(!r.ok){ relatar('HTTP ' + r.status, url, 'erro'); return null }
		return await r.blob()
	} catch(e){ relatar('download erro: ' + e.message, url, 'erro'); return null }
}


async function blobParaBase64(blob){
	return new Promise(r => {
		const leitor = new FileReader()
		leitor.onloadend = () => r(leitor.result.split(',')[1])
		leitor.readAsDataURL(blob)
	})
}

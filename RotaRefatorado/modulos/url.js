/**
 * Retorna o valor de um parametro de URL:
 * @param {string}	parametro
 */
function url_parametro_obter(
	parametro	= '',
	endereco	= window.location.href
){
	relatar('Instanciando objeto…','','navegador')
	let url = new URL(endereco)
	if(!url)
		return ''
	relatar('-> url:',url,'navegador')
	let parametros = new URLSearchParams(url.search)
	relatar('-> parametros:',parametros,'navegador')
	let valor = parametros.get(parametro) || ''
	relatar('-> valor:',valor,'navegador')
	return valor || ''
}

/**
 * Obtém a URL e retorna adicionando um parâmetro:
 * @param {string}	parametro
 */
function url_parametro_adicionar(parametro=''){
	relatar('Instanciando objeto…','','navegador')
	let local = window.location.href
	if(!parametro)
		return local
	let url		= new URL(local)
	if(!url)
		return local
	relatar('-> url:',url,'navegador')
	url.searchParams.set(parametro,'true')
	return url.toString()
}
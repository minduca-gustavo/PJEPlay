async function capturarImagemDeElemento(
	elemento	= document.body,
	copiar		= true
){
	relatar('Capturando imagem de elemento:',elemento,'execucao')
	let retangulo = obterRetangulo(elemento)
	relatar('Retângulo:',retangulo,'execucao')
	let imagem = await NAVEGADOR.runtime.sendMessage({
		capturar:	'imagem',
		retangulo,
		copiar,
	}) || ''
	relatar('Imagem capturada do elemento:',imagem,'execucao')
	return imagem || ''
}
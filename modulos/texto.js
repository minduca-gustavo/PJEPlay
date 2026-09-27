/**
 * Prefixa uma string passada pelo parâmetro ${texto} com o prefixo passado pelo parâmetro ${prefixo}.
 * Se o parâmetro ${prefixo} estyiver vazio, será preenchido com ${EXTENSAO.prefixo} (/modulos/definicoes.js)
 * @param {string} prefixo
 * @param {string} texto
 * @returns
 */
function prefixar(
	texto		= '',
	prefixo	= EXTENSAO?.prefixo
){
	relatar('Prefixando texto:',{prefixo,texto},'texto')
	let prefixado = prefixo + '-' + texto
	relatar('Texto prefixado:',prefixado,'texto')
	return prefixado
}


/**
 * Conta os caracterer no texto passado pelo parâmetro ${texto}.
 * @param {string} texto
 * @returns ${caracteres}
 */
function contarCaracteres(texto=''){
	let caracteres = Number(0)
	if(!texto)
		return Number(caracteres)
	if(texto?.length){
		caracteres = texto.length || 0
		if(caracteres > 0)
			return Number(caracteres)
	}
	else return Number(caracteres)
}


/**
 * Retorna o valor em pixels arredondado para cima do número passado pelo parâmetro ${numero}.
 * @param {number} numero 
 * @returns 
 */
function pixels(numero){
	return Math.ceil(numero).toString() + 'px'
}


/**
 * Converte o texto passado pelo parâmetro ${texto} para maiúsculas.
 * @param {string} texto 
 * @returns 
 */
function maiusculas(texto=''){
	if(!texto)
		return ''
	return texto.toString().toUpperCase() || ''
}


/**
 * Converte o texto passado pelo parâmetro ${texto} para minúsculas.
 * @param {string} texto 
 * @returns 
 */
function minusculas(texto){
	if(!texto)
		return ''
	return texto.toString().toLowerCase() || ''
}


/**
 * Converte o texto passado pelo parâmetro ${texto} para o formato titularizado.
 * @param {string} texto 
 * @returns 
 */
function titularizar(texto=''){

	if(!texto)
		return ''

	let textoEmMinusculas = minusculas(texto)

	let titulo = textoEmMinusculas.toString().split(' ').map(
		palavra => {
			if(palavra)
				return palavra.replace(
					palavra[0],
					maiusculas(palavra[0])
				)
		}
	).join(' ')

	return titulo.replace(
		/\s(E|(A|O)(s)|D(e|a|as|o|os))\s/g,
		correspondencia => minusculas(correspondencia)
	)

}

/**
 * Hifeniza o texto.
 * @param {string} texto 
 * @returns 
 */
function textoParaId(texto=''){
	if(!texto)
		return ''
	texto = String(texto)
	return texto
		.trim()
		.normalize('NFD')									
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-zA-Z0-9\s\-]/g, '')
		.replace(/[\s\-\/\\.,]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.toLowerCase()
}



/**
 * Obtém o trecho equivalente ao padrão CPF do texto passado pelo parâmetro ${texto}.
 * @param {string} texto
 * @returns ${cpf}
 */
function obterCPF(texto=''){
	let expressao = new RegExp(/\d{3}[.]\d{3}[.]\d{3}[-]\d{2}/g)
	let cpf = texto.match(expressao) || ''
	if(!cpf)
		return ''
	return cpf[0]
}


/**
 * Obtém os números do texto passado pelo parâmetro ${texto} e formata no padão CPF.
 * @param {string} texto
 * @returns ${cpf}
 */
function formatarCPF(texto=''){
	let numeros = apenasNumeros(texto)
	let onzePrimeirosCaracteres = numeros.substring(0,11)
	let cpf = onzePrimeirosCaracteres.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
	return cpf || ''
}


/**
 * Obtém o trecho equivalente ao padrão CNPJ do texto passado pelo parâmetro ${texto}.
 * @param {string} texto
 * @returns ${cnpj}
 */
function obterCNPJ(texto=''){
	let expressao = new RegExp(/\d{2}[.]\d{3}[.]\d{3}[/]\d{4}[-]\d{2}/g)
	let cnpj = texto.match(expressao) || ''
	if(!cnpj)
		return ''
	return cnpj[0]
}


/**
 * Obtém o trecho equivalente à raiz do padrão CNPJ do texto passado pelo parâmetro ${cnpj}.
 * @param {string} texto
 * @returns ${cnpj}
 */
function obterRaizCNPJ(cnpj=''){
	let expressao = new RegExp(/[/].*/gi)
	let raiz = cnpj.replace(expressao,'') || ''
	return raiz
}


/**
 * Obtém o documento (CNPJ, CPF) contido no texto passado pelo parâmetro ${documento}.
 * @param {string} documento
 * @returns ${cnpj}
 */
function obterDocumento(documento=''){
	let cnpj = obterCNPJ(documento)
	let cpf = obterCPF(documento)
	return cnpj+cpf
}


function obterDocumentos(texto=''){
	let expressao		= new RegExp(/(\d{2}[.]\d{3}[.]\d{3}[/]\d{4}[-]\d{2}|\d{3}[.]\d{3}[.]\d{3}[-]\d{2})/g)
	let documentos	= texto.match(expressao) || []
	return documentos
}


/**
 * Obtém o valor monetário contido no texto passado pelo parâmetro ${texto}.
 * @param {string} texto 
 * @returns 
 */
function obterValorMonetario(texto=''){
	let expressao = new RegExp(/\d.*?[,]\d{2}/gi)
	let valor = texto.match(expressao) || ''
	if(!valor)
		return ''
	return valor[0]
}


/**
 * Obtém o valor monetário contido no texto passado pelo parâmetro ${texto}.
 * @param {string} texto 
 * @returns 
 */
function numeroParaValorMonetario(texto=''){
	return texto.toLocaleString('pt-BR',{minimumFractionDigits:2})
}


function valorMonetarioParaNumero(valor='R$ 0,00') {
	let texto	= String(valor)
	return parseFloat(texto
		.replace(/[^0-9,]/g, '')
		.replace(',','.')
	)
}


/**
 * Retorna uma saudação geral para mensagens.
 * @returns 
 */
function saudacao(){
	let data = new Date()
	let hora = data.getHours()
	let texto = 'Bo'
	switch(true){
		case(hora < 12):
			texto += 'm dia'
			break
		case(hora >= 12 && hora < 18):
			texto += 'a tarde'
			break
		case(hora >= 18 && hora < 24):
			texto += 'a noite'
			break
	}
	return texto + '!'
}


/**
 * Retorna apenas os números de uma string:
 * @param {string} texto
 * @returns ${numeros}
 */
function apenasNumeros(texto=''){
	relatar('Obtendo números de:',texto,'texto')
	if(!texto)
		return ''
	let numeros = texto.toString().replace(/\D/g,'').toString() || ''
	relatar('Números extraídos:',numeros,'texto')
	return numeros
}


/**
 * Obtém o número do processo no padrão CNJ do texto passado pelo parâmetro ${texto}.
 * @param {string} texto
 * @returns
 */
function obterNumeroDoProcessoPadraoCNJ(texto){
	let numero = texto.match(EXPRESSAO.processo.numero) || ''
	if(!numero)
		return ''
	return numero[0] || ''
}

/**
 * Obtém o número do processo sem separadores do texto passado pelo parâmetro ${texto}.
 * @param {string} texto
 * @returns
 */
function obterNumeroDoProcessoSemSeparadores(texto){
	let numero = texto.match(EXPRESSAO.processo.numeros) || ''
	if(!numero)
		return ''
	return numero[0] || ''
}


function numeroDoProcessoSemSeparadoresParaPadraoCNJ(numero){
	if(obterNumeroDoProcessoSemSeparadores(numero)){
		numero = numero.
			replace(/^(\d{7})(\d+)/g,"$1-$2").
			replace(/^(\d{7}[-]\d{2})(\d+)/g,"$1.$2").
			replace(/^(\d{7}[-]\d{2}[.]\d{4})(\d+)/g,"$1.$2").
			replace(/^(\d{7}[-]\d{2}[.]\d{4}[.]\d)(\d+)/g,"$1.$2").
			replace(/^(\d{7}[-]\d{2}[.]\d{4}[.]\d[.]\d{2})(\d+)/g,"$1.$2")
	}
	return numero || ''
}

/**
 * * Converte o número do processo sem separadores (20 dígitos) para o padrão CNJ.
 * @param {string} numero
 * @returns
 */
function converterNumeroDoProcessoSemSeparadoresParaPadraoCNJ(numero){
	if(obterNumeroDoProcessoSemSeparadores(numero))
		numero = numero.replace(/(\d{7})(\d{2})(\d{4})(\d{1})(\d{2})(\d{4})/g, '$1-$2.$3.$4.$5.$6')
	return numero || ''
}


/**
 * Retorna os dados do número do processo.
 * @param {string} texto 
 * @returns 
 */
function obterDadosDoNumeroDoProcesso(texto=''){
	let numeroDoProcessoPadraoCNJ	= obterNumeroDoProcessoPadraoCNJ(texto)
	if(!numeroDoProcessoPadraoCNJ)
		return ''
	let processo						= {}
	processo.numero					= numeroDoProcessoPadraoCNJ
	processo.numeros				= apenasNumeros(numeroDoProcessoPadraoCNJ)
	let campos							= numeroDoProcessoPadraoCNJ.replace(/\D/g,'.').split('.')
	processo.sequencial 		= campos[0]
	processo.digito					= campos[1]
	processo.ano						= campos[2]
	processo.segmento 			= campos[3]
	processo.tribunal				= campos[4]
	processo.origem					= campos[5]
	processo.final					= processo.sequencial.slice(-1)
	if(Number(processo.ano) <= 2009)
		processo.final				= processo.sequencial.slice(-3,-2)
	let	paridade = Number(processo.final) % 2
	if(paridade === 1)
		processo.paridade			= 'ímpar'
	if(paridade === 0)
		processo.paridade			= 'par'
	return processo
}


function textoParaDOM(html=''){
	if(typeof html !== 'string')
		html = String(html)
	let dom = new DOMParser()
	return dom.parseFromString(html,'text/html')
}


function texto_ou_json(texto=''){

	if(typeof texto !== 'string')
		texto = String(texto)

	if(texto.charCodeAt(0) === 0xFEFF)
		texto = texto.slice(1)
	
	texto = texto.trim()
	if(!texto)
		return ''

	if(
		!(
			texto.startsWith('{')
			&&
			texto.endsWith('}')
		)
		&&
		!(
			texto.startsWith('[')
			&&
			texto.endsWith(']')
		)		
	)
		return texto || ''

	try{
		let sanitizado = texto.replace(/:,/g, '"",')
		return JSON.parse(sanitizado)
	}
	catch(erro){
		return texto || ''
	}
}

function json_textificado_sanitizar(texto=''){
	texto	= texto
		.replace(/\u00A0/g,' ')
		.replace(/&nbsp;/gi,' ')
		.replace(/[\u2000-\u200B]/g,'')
		.replace(/&#(\d+);/g, (match, decodificado) =>
			String.fromCodePoint(Number(decodificado))
		)
		.trim() || ''
	return texto
}


function removerAcentuacao(texto){
	if(!texto)
		return ''
	let acentos = {
		a:/[\xE0-\xE6]/g,
		e:/[\xE8-\xEB]/g,
		i:/[\xEC-\xEF]/g,
		o:/[\xF2-\xF6]/g,
		u:/[\xF9-\xFC]/g,
		A:/[\xC0-\xC6]/g,
		E:/[\xC8-\xCB]/g,
		I:/[\xCC-\xCF]/g,
		O:/[\xD2-\xD6]/g,
		U:/[\xD9-\xDC]/g,
		c:/\xE7/g,
		n:/\xF1/g,
		C:/\xC7/g,
		N:/\xD1/g,
	}
	for(let letra in acentos){
		let expressao = acentos[letra]
		texto = texto.replace(expressao,letra)
	}
	return texto
}


function truncar(
	texto		= '',
	tamanho	= 99
){
	if(typeof texto !== 'string')
		return ''
	
	if(texto.length <= tamanho)
		return texto
	
	return texto.substring(0, (tamanho - 5)) + '[...]'
}


function tabular(itens=['']){

	if(!Array.isArray(itens))
		itens = ['']

	let lista = itens
		.filter(item => item !== undefined && item !== null)
		.map(item => String(item))

	if(lista.length === 0)
		return '\n'

	return lista.join('\t') + '\n'

}
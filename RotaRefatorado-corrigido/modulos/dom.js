/**
 * Define os seletores XPath para exclusão de tags irrelevantes.
 * @returns 
 */
function seletorXpathExcluirTags(){
	return [
		'base',
		'head',
		'link',
		'meta',
		'noscript',
		'script',
		'style',
		'template',
		'title',
	]
}


/**
 * Obtém o valor de um cookie pelo nome.
 * @param {string} nome 
 * @returns 
 */
function cookie_obter(nome = ''){
	relatar('🔎 Procurando cookie:', nome, 'dom')

	let todos					= `; ${document.cookie}`
	let prefixo				= `; ${nome}=`
	let indiceInicio	= todos.indexOf(prefixo)

	if(indiceInicio === -1)
		return ''

	let inicioValor		= indiceInicio + prefixo.length
	let indiceFim			= todos.indexOf(';', inicioValor)

	let valor					= indiceFim === -1
		? todos.substring(inicioValor)
		: todos.substring(inicioValor, indiceFim)

	if(valor)
		relatar(`🍪 Cookie ${nome} encontrado:`,valor,'dom')

	return decodeURIComponent(valor)

}


/**
 * Retorna elemento(s) com base no seletor CSS:
 * @param {string}	seletor		- Seletor CSS.
 * @param {object}	ancestral	- Elemento ancestral (se vazio, utilizará ${document}).
 * @return elemento
*/
function selecionar(
	seletor		= '',
	ancestral	= '',
	todos			= false
){

	relatar('🔎 Procurando elemento…',seletor,'dom')
	seletor	= seletor.trim()
	if(!seletor){
		relatar('Seletor vazio:',seletor,'dom')
		return ''
	}

	let elemento = ''

	if(!ancestral || typeof ancestral != 'object'){
		ancestral = document
		relatar('🔎 Procurando elemento relativo ao ancestral:',ancestral,'dom')
	}

	try{
		if(todos)
			elemento = ancestral.querySelectorAll(seletor) || ''
		else	
			elemento = ancestral.querySelector(seletor) || ''
		if(!elemento)
			relatar('Não encontrado:',seletor,'dom')
		else
			relatar('Selecionado: ',elemento,'dom')
		return elemento
	}
	catch(erro){
		relatar('Erro:',erro,'erro')
		return ''
	}

}


function selecionarElementoPorXpath(seletor=''){

	if(!seletor){
		relatar('Seletor vazio:',seletor,'dom')
		return ''
	}

	try{
		let elemento = document.evaluate(
			seletor,
			document,
			null,
			XPathResult.FIRST_ORDERED_NODE_TYPE,
			null
		).singleNodeValue || ''
		if(!elemento)
			relatar('Não encontrado:',seletor,'dom')
		else
			relatar('Selecionado: ',elemento,'dom')
		return elemento
	}
	catch(erro){
		relatar('Erro:',erro,'erro')
		return ''
	}

}


/**
 * Remove o elemento pelo seletor.
 * @param {string} seletor
 * @returns
 */
function remover(seletor=''){

	let elemento = ''

	if(typeof seletor == 'object')
		elemento = seletor
	if(typeof seletor == 'string')
		elemento = selecionar(seletor)

	if(!elemento){
		relatar('Elemento não encontrado para remoção:',seletor,'dom')
		return seletor
	}

	relatar('Removendo…',elemento,'dom')
	elemento.remove()
	relatar('Elemento removido!',seletor,'dom')
	return seletor

}


/**
 * Cria um elemento HTML e insere em ${document.body} ou em um ancestral específico:
 * @param {object} configuracao
 * @return ${elemento}
 * @example
 * let elemento = criar({})
 */
function criar(configuracao={}){

	let {
		prefixo			= true,
		tag					= '',
		id					= '',
		classe			= '',
		ancestral		= '',
		antesDe			= '',
		texto				= '',
		href				= '',
		target			= '',
		download		= '',
		title				= '',
		type				= '',
		accept			= '',
		value				= '',
		placeholder	= '',
		list				= '',
		datalist		= '',
		max					= '',
		min					= '',
		opcoes			= '',
		style				= '',
		atributos		= {},
		aoClicar		= '',
		aoAlterar		= '',
		aoDigitar		= '',
	} 						= configuracao	

	relatar('Criando elemento com configuração:',configuracao,'dom')

	let tagsPadrao = [
		'a',
		'br',
		'button',
		'caption',
		'datalist',
		'details',
		'funcionalidades',
		'guia',
		'h1',
		'h2',
		'h3',
		'hr',
		'input',
		'label',
		'legend',
		'li',
		'meta',
		'noscript',
		'ol',
		'option',
		'p',
		'progress',
		'select',
		'span',
		'summary',
		'script',
		'style',
		'table',
		'thead',
		'tbody',
		'tr',
		'td',
		'textarea',
		'ul',
	]

	if(!tag)
		tag	= 'extensao'

	if(datalist)
		id	= 'datalist-campo-' + id

	if(prefixo){
		if(!tagsPadrao.includes(tag))
			tag	= prefixar(tag)
		id = prefixar(id)
	}

	if(id)
		remover('#'+id)

	relatar('Criando elemento: ',tag + ' #' + id,'dom')

	let elemento = document.createElement(tag)

	if(classe)
		elemento.className = classe

	if(!ancestral)
		ancestral = document.body

	if(texto)
		elemento.textContent = texto

	if(href)
		elemento.href = href

	if(accept)
		elemento.accept = accept

	if(download)
		elemento.download = download

	if(style)
		elemento.style = style

	if(target)
		elemento.target = target

	if(title)
		elemento.title = title

	if(type){
		elemento.type = type
		if(type==='text')
			elemento.autocomplete	= true
	}

	if(placeholder)
		elemento.placeholder = placeholder

	if(value)
		elemento.value = value

	if(list)
		elemento.setAttribute('list',prefixar('datalist-campo-' + list))

	if(datalist){
		datalist.forEach(item => {
			let opcao = document.createElement('option')
			let valor = sanitizar(item)
			if(valor){
				opcao.value = valor
				elemento.appendChild(opcao)
			}
		})
	}

	if(opcoes){
		opcoes.forEach(item => {
			let opcao = document.createElement('option')
			let texto = sanitizar(item?.texto)
			let valor = sanitizar(item?.valor)
			if(texto)
				opcao.innerText = texto
			opcao.value = valor || texto || ''
			elemento.appendChild(opcao)
		})
	}

	if(max)
		elemento.setAttribute('max',max)

	if(min)
		elemento.setAttribute('min',min)

	if(aoAlterar)
		elemento.addEventListener('change',aoAlterar)

	if(aoClicar)
		elemento.addEventListener('click',aoClicar)

	if(aoDigitar)
		elemento.addEventListener('keydown',aoDigitar)

	if(atributos)
		Object.entries(atributos).forEach(([chave,valor]) => {elemento.setAttribute(chave, valor)})

	elemento.id = id

	if(antesDe)
		ancestral.insertBefore(elemento,antesDe)
	else
		ancestral.appendChild(elemento)

	relatar('Elemento inserido:',elemento,'dom')

	return elemento || ''

	function sanitizar(texto=''){
		if(!texto)
			return ''
		return texto?.toString()?.trim() || ''		
	}

}


/** Cria <meta> e insere no <head> do documento.
 * @param {string} nome
 * @param {string} conteudo
 * @returns
 */
function criar_metaTag(
	name		= '',
	content	= ''
){
	if(!name)
		return ''
	relatar('Criando elemento <meta>: ' + name,content,'dom')
	if(typeof content == 'object')
		content = JSON.stringify(content)
	let elemento	= criar({
		tag:				'meta',
		id:					name,
		ancestral:	document.head,
		atributos:	{
			name:			prefixar(name),
			content
		}
	})
	relatar('Elemento <meta> criado:', elemento, 'dom')
	return elemento
}


/** Cria <script> e insere no <head> do documento.
 * @param {string} texto
 * @returns
 */
function criar_script(configuracoes={}){
	let {
		texto				= '',
		id					= 'script',
		ancestral		= document.head,
		temporario	=	false,
	} = configuracoes
	if(!texto)
		return ''
	let tag = 'script'
	relatar('Criando elemento <'+tag+'>:',texto,'dom')
	let elemento	= criar({
		tag,
		id,
		texto,
		ancestral,
	})
	if(temporario)
		remover(elemento)
	relatar('Elemento <'+tag+'> criado:', elemento, 'dom')
	return elemento || ''
}


/**
 * Cria um fragmento de texto e insere em ${document.body} ou em um ancestral específico:
 * @param {object} configuracao
 * @return ${elemento}
 * @example
 * let elemento = criar({})
 */
function criar_texto(configuracao={}){

	let {
		texto			= '',
		ancestral	= '',
		antesDe		= '',
	} = configuracao	

	relatar('Criando texto:',configuracao,'dom')

	let fragmento = document.createTextNode(texto)

	if(!ancestral)
		ancestral = document.body

	if(antesDe)
		ancestral.insertBefore(fragmento,antesDe)

	else
		ancestral.appendChild(fragmento)

	relatar('Texto inserido em:',ancestral,'dom')

	return fragmento || ''

}


/**
 * Verifica a existência de um elemento no momento da chamada; se não existir, inicia um ${MutationObserver} no ${document.body}:
 * @param {string}	seletor			Seletor  CSS
 * @param {boolean}	atributos		Verifica os atributos dos elementos
 * @param {boolean}	caracteres	Verifica mudança nos caracteres
 * @return elemento
 * @example
 * esperar('#id').then(elemento => console.info(elemento))
 */
async function aguardarElemento(
	seletor				= '',
	configuracao	= {}
){
	let {
		atributos		= false,
		caracteres	= false,
		desconectar = true,
		xpath				= false,
	} = configuracao

	let elemento	= ''
	
	return new Promise(
		resolver => {
			if(xpath)
				elemento	= selecionarElementoPorXpath(seletor)
			else
				elemento	= selecionar(seletor)
			if(elemento){
				relatar('Elemento encontrado: ',elemento,'mutacao')
				resolver(elemento)
			}
			let observador = new MutationObserver(
				mudanca => {
					relatar('Mudança: ',mudanca,'mutacao')
					relatar('Aguardando elemento "'+seletor+'"...','mutacao')
					if(xpath)
						elemento	= selecionarElementoPorXpath(seletor)
					else
						elemento	= selecionar(seletor)
					if(elemento){
						relatar('Elemento encontrado: ',elemento,'mutacao')
						if(desconectar)
							observador.disconnect()
						resolver(elemento)
					}
				}
			)
			observador.observe(
				document,
				{
					childList:			true,
					subtree:				true,
					attributes:			atributos,
					characterData:	caracteres
				}
			)
		}
	)
}




/**
 * Cria um <style scoped> e insere em ${document.head} ou em um ancestral específico:
 * @param {string} id
 * @param {object} ancestral
 * @param {string} css
 * @return elemento
 * @example
 * const estilo = estilizar(
 *  '',
 *  document.querySelector('#id'),
 *  `
 *   #id{
 *    color:black;
 *   }
 *  `
 * )
 */
function estilizar(configuracao = {}){

	let {
		ancestral = '',
		css				= '',
		id				= ''
	} = configuracao

	if(!ancestral)
		ancestral = document.head

	let elemento	= criar({
		tag:	'style',
		id:		'estilo-' + id
	})
	elemento.textContent	= css

	return elemento || ''

}


function extrairTexto(seletor=''){
	let elemento = ''
	if(typeof seletor == 'object')
		elemento = seletor
	if(typeof seletor == 'string')
		elemento = selecionar(seletor)
	if(!elemento)
		return ''
	let texto	= elemento?.innerText || ''
	return texto.trim()
}


function obterRetangulo(elemento=''){
	if(!elemento)
		elemento = document.body
	return elemento.getBoundingClientRect()
}


function campo_obterValor(seletor=''){
	let campo	= selecionar(seletor)
	if(!campo)
		return ''
	return campo?.value || ''	
}


async function classe_adicionarEsperarRemover(
	elemento			=	'',
	classe				=	'',
	milissegundos	= 1000
){
	if(!elemento)
		return
	elemento.classList.add(classe)
	await suspender(milissegundos)
	elemento.classList.remove(classe)
}

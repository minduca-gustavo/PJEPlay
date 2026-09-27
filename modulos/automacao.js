/**
 * Chama o próximo quadro de animação do navegador (para resolver problemas relacionados).
*/
function proximoQuadroDeAnimacao(){
	relatar('Chamando próximo quadro de animação…','','execucao')
  return new Promise(resolver => requestAnimationFrame(resolver))
}


/**
 * Suspende a execução por um tempo definido no parâmetro ${milissegundos}.
 * @param {number} milissegundos
 * @returns
 */
async function suspender(milissegundos=1000){
	relatar('Aguardando ' + milissegundos + ' milissegundos…','','automacao')
	return new Promise(
		resolver => setTimeout(resolver,milissegundos)
	)
}


function evento(
	tipo			= '',
	elemento	= '',
	opcoes		= {}
){

	if(typeof elemento == 'string')
		elemento = selecionar(elemento)

	if(!elemento || typeof tipo !== 'string' || !(elemento instanceof Element))
		return

	let {
		bubbles = true,
		cancelable = true,
		composed = false,
		dados,
		...outras
	} = opcoes

	let configuracoes = {
		bubbles,
		cancelable,
		composed,
		...outras
	}

	try{
		let evento = dados !== undefined
		? new CustomEvent(
			tipo,
			{
				...configuracoes,
				detail: dados
			}
		)
		: new Event(
			tipo,
			configuracoes
		)
		esforcosPoupados({
			movimentos:	1,
			cliques:		0,
			teclas:			0,
			segundos:		1
		})
		return elemento.dispatchEvent(evento)
	} catch (erro) {
		relatar(`Erro ao disparar evento "${tipo}":`, erro, 'erro')
		return false
	}

}


/**
 *
 * @param {string||object} seletor
 * @param {string} texto
 * @returns
 */
function clicar(elemento = ''){

	if(typeof elemento == 'string')
		elemento = selecionar(elemento)

	if(!elemento)
		return ''

	elemento.click()

	esforcosPoupados({
		movimentos:	1,
		cliques:		1,
		teclas:			0,
		segundos:		2
	})

	return elemento

}


/**
 *
 * @param {string||object} seletor
 * @param {string} texto
 * @returns
 */
function focar(
	seletor	= '',
	rolar		= true
){

	let elemento = ''

	if(typeof seletor == 'object')
		elemento = seletor

	if(typeof seletor == 'string')
		elemento = selecionar(seletor)

	if(!elemento)
		return ''

	if(rolar)
		elemento.scrollIntoView({
			block:'center',
			behavior:'smooth'
		})

	elemento.focus()

	esforcosPoupados({
		movimentos:	1,
		cliques:		0,
		teclas:			0,
		segundos:		1
	})

	return elemento

}


async function focarEsperarClicar(
	seletor	= '',
	tempo		= 500,
	rolar		= true,
){
	if(!seletor)
		return
	let elemento = focar(seletor,rolar)
	await suspender(tempo)
	clicar(elemento)
}


/**
 * Copia o texto passado pelo parâmetro ${texto}.
 * @param {string} texto
 * @returns
 */
async function copiar_texto(texto){

	relatar('Copiando texto…', texto, 'automacao')

	return new Promise(
		resolver => {
			navigator.clipboard.writeText(texto).then(
				() => {
					relatar('Texto copiado:',texto,'texto')
					esforcosPoupados({
						movimentos:	2,
						cliques:		0,
						teclas:			2,
						segundos:		2
					})
					resolver(texto)
				},
				erro => {
					relatar('x Não foi possível copiar: ',erro,'erro')
					return
				}
			)
		}
	)

}


async function obter_memoria_texto(){
	let texto = await navigator.clipboard.readText() || ''
	return texto || ''
}


/**
 * Fecha a janela atual.
 */
function janela_fechar(){
	relatar('Fechando a janela...','','execucao')
	window.close()
	esforcosPoupados({
		movimentos:	1,
		cliques:		1,
		teclas:			0,
		segundos:		2
	})
	relatar('Janela fechada!','','execucao')
}


/**
 * Fecha a aba atual.
 */
function aba_fechar(){
	relatar('Fechando a aba...','','execucao')
	NAVEGADOR.runtime.sendMessage({acao:"FecharEstaAba"})
	esforcosPoupados({
		movimentos:	1,
		cliques:		1,
		teclas:			0,
		segundos:		2
	})
	relatar('Aba fechada!','','execucao')
}


async function digitar(
	elemento,
	texto='',
	velocidade=50,
	classe=''
){
	let caracteres = contarCaracteres(texto)
  elemento.focus()
  elemento.value = ''
	if(classe)
		elemento.classList.add(classe)
  for (let caractere of texto) {
    elemento.value += caractere
    elemento.dispatchEvent(
			new InputEvent(
				'input',
				{bubbles:true}
			)
		)
    await new Promise(resolve => setTimeout(resolve, velocidade))
  }
  elemento.dispatchEvent(
		new KeyboardEvent(
			'keydown',
			{
				key:texto.at(-1),
				bubbles:true
			}
		)
	)
	if(classe)
		elemento.classList.add(classe)
	esforcosPoupados({
		movimentos:	1,
		cliques:		0,
		teclas:			caracteres,
		segundos:		caracteresParaSegundos(caracteres)
	})
}


function pressionarTecla(tecla=''){

	let eventoTecla = new KeyboardEvent('keydown', {
		key:				tecla,
		code:				obterTeclaCode(tecla),
		keyCode:		obterTeclaKeyCode(tecla),
		which:			obterTeclaKeyCode(tecla),
		bubbles:		true,
		cancelable:	true
	})

	return document.activeElement?.dispatchEvent(eventoTecla) || false

	function obterTeclaKeyCode(tecla=''){
		let keyCodes = {
			'Tab':				9,
			'Enter':			13,
			'Escape':			27,
			' ':					32,
			'ArrowLeft':	37,
			'ArrowUp':		38,
			'ArrowRight':	39,
			'ArrowDown':	40
		};
		return keyCodes[tecla] || tecla.charCodeAt(0) || 0
	}
	
	function obterTeclaCode(tecla){
		if(tecla.length === 1 && /[a-z]/i.test(tecla))
			return `Key${tecla.toUpperCase()}`
		if(tecla.length === 1 && /[0-9]/.test(tecla))
			return `Digit${tecla}`
		return tecla
	}

}


async function copiar_conteudoFormatado(html=''){
	try{
		let textoHtml		= new Blob(
			[html],
			{type:'text/html'	}
		)
		let textoPlano	= new Blob(
			[html.replace(/<[^>]*>/g,'')],
			{type:'text/plain'}
		)
		let item				= new ClipboardItem({
			'text/html':	textoHtml,
			'text/plain':	textoPlano
		})
		await navigator.clipboard.write([item])
		return true
	}
	catch(erro){
		relatar('Clipboard API falhou, usando fallback:',erro,'erro')
	}
}


function preencher(
	campo		= '',
	texto		= '',
	eventos	= []
){
	//Aplicável a campos gerados por React e Ajax
	if(!campo)
		return
	if(typeof campo == 'string')
		campo = selecionar(campo)
	if(!campo)
		return
	focar(campo)
	let propriedade = Object.getOwnPropertyDescriptor(
		window.HTMLInputElement.prototype,
		'value'
	).set
	propriedade.call(campo,texto)
	esforcosPoupados({
		movimentos:	1,
		cliques:		1,
		teclas:			contarCaracteres(texto),
		segundos:		3
	})
	if(!eventos)
		return
	['input','change'].forEach(item => evento(item,campo))
	eventos.forEach(item => evento(item,campo))
}
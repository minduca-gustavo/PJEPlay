async function suspender(ms = 1000){
	return new Promise(r => setTimeout(r, ms))
}

function clicar(el = ''){
	console.log('clicar')
	if(typeof el === 'string') el = selecionar(el)
	if(!el) return ''
	el.click(); return el
}

function focar(el = ''){
	if(typeof el === 'string') el = selecionar(el)
	if(!el) return ''
	el.focus(); return el
}

function preencher(campo = '', texto = '', eventos = ['input','change']){
	if(typeof campo === 'string') campo = selecionar(campo)
	if(!campo) return
	focar(campo)
	let desc = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')
	if(desc && desc.set) desc.set.call(campo, texto)
	else campo.value = texto
	if(eventos) eventos.forEach(t => campo.dispatchEvent(new Event(t, { bubbles:true })))
}

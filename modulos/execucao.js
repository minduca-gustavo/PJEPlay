async function suspender(ms = 1000){
	return new Promise(r => setTimeout(r, ms))
}

//function clicar(el = ''){
//  let descricao = el?.textContent || el?.innerText || el?.getAttribute('aria-label') || ''
//	console.log('%c[Rota PJE]%c clicar: ' + JSON.stringify(descricao), LOG.info, 'color:inherit')
//	if(typeof el === 'string') el = selecionar(el)
//	if(!el) return ''
//	el.click(); return el
//}

function clicar(el = ''){
  if(typeof el === 'string') el = selecionar(el)
  if(!el) return ''
  el.click()
  let descricao = el?.textContent?.trim() || el?.getAttribute?.('aria-label') || ''
  console.log('%c[Rota PJE]%c clicar: ' + JSON.stringify(descricao), LOG.info, 'color:inherit')
  return el
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

function preencherComAutoComplete(campo, texto) {
  if (typeof campo === 'string') campo = selecionar(campo)
  if (!campo) return

  focar(campo)

  // Usa o descriptor do prototype nativo correto
  let desc = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')
  desc.set.call(campo, texto)

  // Angular Material com autocomplete precisa desses eventos nessa ordem
  campo.dispatchEvent(new Event('focus', { bubbles: true }))
  campo.dispatchEvent(new Event('input', { bubbles: true }))
  campo.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }))
  campo.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }))
}

async function digitarNoInput(campo, texto) {
  if (typeof campo === 'string') campo = selecionar(campo)
  if (!campo) return

  focar(campo)
  campo.value = ''

  for (let char of texto) {
    campo.dispatchEvent(new KeyboardEvent('keydown', { key: char, bubbles: true }))
    
    let desc = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')
    desc.set.call(campo, campo.value + char)
    
    campo.dispatchEvent(new Event('input', { bubbles: true }))
    campo.dispatchEvent(new KeyboardEvent('keyup', { key: char, bubbles: true }))
    
    await suspender(30)
  }
}



//function clicar(el = ''){
//  let descricao = el?.textContent || el?.innerText || el?.getAttribute('aria-label') || ''
//	console.log('%c[Rota PJE]%c clicar: ' + JSON.stringify(descricao), LOG.info, 'color:inherit')
//	if(typeof el === 'string') el = selecionar(el)
//	if(!el) return ''
//	el.click(); return el
//}

async function clicar(el = ''){
  await suspender(300)
  if(typeof el === 'string') {
    el = selecionar(el)
    console.log('%c[Rota PJE]%c string 125: ' + JSON.stringify(125), LOG.rosa, 'color:inherit')
  }
  if(!el) return ''
  let descricao = el?.textContent?.trim() || el?.getAttribute?.('aria-label') || ''
  console.log('%c[Rota PJE]%c clicar: ' + JSON.stringify(descricao), LOG.info, 'color:inherit')
  el.click()
  return el
}

function focar(el = ''){
	if(typeof el === 'string') el = selecionar(el)
	if(!el) return ''
	el.focus(); return el
}

function _getValueDescriptor(el) {
  const proto = (el instanceof HTMLTextAreaElement)
    ? window.HTMLTextAreaElement.prototype
    : (el instanceof HTMLSelectElement)
      ? window.HTMLSelectElement.prototype
      : window.HTMLInputElement.prototype
  return Object.getOwnPropertyDescriptor(proto, 'value')
}

function preencher(campo = '', texto = '', eventos = ['input','change']){
  if(typeof campo === 'string') campo = selecionar(campo)
  if(!campo) return
  focar(campo)
  const desc = _getValueDescriptor(campo)
  if(desc && desc.set) desc.set.call(campo, texto)
  else campo.value = texto
  if(eventos) eventos.forEach(t => campo.dispatchEvent(new Event(t, { bubbles:true })))
}

async function preencherCampoComEscolhaDeOpcao(elemento, valor) {
  await preencher(elemento, valor)
  /*
  const desc = _getValueDescriptor(elemento)
  desc.set.call(elemento, valor)
  elemento.dispatchEvent(new Event('input',  { bubbles: true }))
  elemento.dispatchEvent(new Event('change', { bubbles: true }))
  */
  let opcao = await aguardarElemento('mat-option')
  await clicar(opcao)
}

function preencherComAutoComplete(campo, texto) {
  if (typeof campo === 'string') campo = selecionar(campo)
  if (!campo) return
  focar(campo)
  const desc = _getValueDescriptor(campo)
  desc.set.call(campo, texto)
  campo.dispatchEvent(new Event('focus',  { bubbles: true }))
  campo.dispatchEvent(new Event('input',  { bubbles: true }))
  campo.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }))
  campo.dispatchEvent(new KeyboardEvent('keyup',   { bubbles: true }))
}

async function digitarNoInput(campo, texto) {
  if (typeof campo === 'string') campo = selecionar(campo)
  if (!campo) return
  focar(campo)
  campo.value = ''
  for (let char of texto) {
    campo.dispatchEvent(new KeyboardEvent('keydown', { key: char, bubbles: true }))
    const desc = _getValueDescriptor(campo)
    desc.set.call(campo, campo.value + char)
    campo.dispatchEvent(new Event('input', { bubbles: true }))
    campo.dispatchEvent(new KeyboardEvent('keyup', { key: char, bubbles: true }))
    await suspender(30)
  }
}

async function preencherCKEditorExecCommand(seletor, texto) {
  console.log('%c[Rota PJE]%c preencherCKEditorExecCommand, seletor: ' + JSON.stringify(seletor), LOG.rosa, 'color:inherit')
  const el = typeof seletor === 'string' ? document.querySelector(seletor) : seletor
  if (!el) return

  await focar(el)
  await suspender(200)

  // Seleciona tudo e substitui
  //document.execCommand('selectAll', false, null)
  document.execCommand('insertText', false, texto)
}
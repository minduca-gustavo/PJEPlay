function selecionar(seletor = '', ancestral = '', todos = false){
	if(!seletor) return ''
	if(!ancestral || typeof ancestral !== 'object') ancestral = document
	try{
		return todos
			? ancestral.querySelectorAll(seletor) || ''
			: ancestral.querySelector(seletor)    || ''
	} catch(e){ relatar('selecionar erro:', e, 'erro'); return '' }
}

async function aguardarElemento(seletor = '', timeout = 0){
	return new Promise(resolver => {
		let el = selecionar(seletor)
		if(el){ resolver(el); return }

		let timer = null
		let obs = new MutationObserver(() => {
			let el2 = selecionar(seletor)
			if(el2){ if(timer) clearTimeout(timer); obs.disconnect(); resolver(el2) }
		})
		obs.observe(document, { childList:true, subtree:true })
		if(timeout > 0)
			timer = setTimeout(() => { obs.disconnect(); resolver(null) }, timeout)
	})
}

function remover(seletor = ''){
	let el = typeof seletor === 'string' ? selecionar(seletor) : seletor
	if(el && el.parentNode) el.parentNode.removeChild(el)
}

function estilizar({ css = '', id = '' } = {}){
	if(id) remover('#pjerota-estilo-' + id)
	let s = document.createElement('style')
	if(id) s.id = 'pjerota-estilo-' + id
	s.textContent = css
	document.head.appendChild(s)
	return s
}

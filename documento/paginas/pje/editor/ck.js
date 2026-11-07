document.addEventListener('rotapje_EditorInserirRodape', (evento) => {
	let {
		seletor	= '',
		rodape	= ''
	} = JSON.parse(evento.detail)
	let editavel	= document.querySelector(seletor)
	if(!editavel)
		return
	let editor		= editavel.ckeditorInstance
	if(!editor)
		return
	try{
		editavel.scrollIntoView({
			block:'center',
			behavior:'smooth'
		})
		let conteudo	= editor.getData()
		editor.setData(conteudo + rodape)
	} catch(erro){
		console.error('❌ Erro ao inserir rodapé:', erro)
	}
})


document.addEventListener('rotapje_EditorSubstituirTexto', (evento) => {
	let {
		substituicoes = {}
	} = JSON.parse(evento.detail)
	let editavel			= document.querySelector('.area-conteudo[contenteditable="true"]')
	if(!editavel)
		return
	let editor				= editavel.ckeditorInstance
	if(!editor)
		return
	try {
		let conteudo = editor.getData()
		for(let [buscar, substituir] of Object.entries(substituicoes))
			conteudo = conteudo.replace(buscar, substituir)
		editor.setData(conteudo)
	} catch(erro){
		console.error('❌ Erro ao substituir:', erro)
	}
})

document.addEventListener('rotapje_EditorInserirComSeletor', async (evento) => {
	let {seletor, inserir} = JSON.parse(evento.detail) || {}
	let editavel = document.querySelector(seletor)
	if(!editavel)
		return
	let editor = editavel.ckeditorInstance
	if(!editor)
		return
	try {
		let conteudo	= editor.getData()
		let texto		= inserir  || ''
		editor.setData(conteudo + texto)
	} catch(erro){
		console.error('❌ Erro ao inserir conteúdo:', erro)
	}
})

document.addEventListener('rotapje_EditorInserirConteudo', async (evento) => {
	let editavel = document.querySelector('pje-editor-documento [contenteditable="true"]')
	if(!editavel)
		return
	let editor = editavel.ckeditorInstance
	if(!editor)
		return
	try {
		let conteudo	= editor.getData()
		let detalhes	= JSON.parse(evento?.detail) || {}
		let texto			= detalhes?.conteudo  || ''
		editor.setData(conteudo + texto)
	} catch(erro){
		console.error('❌ Erro ao inserir conteúdo:', erro)
	}
})
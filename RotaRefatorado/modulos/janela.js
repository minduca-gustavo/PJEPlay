async function janela(){
	if(!CONTEXTO)
		return
	await suspender()
	janela_criarBotaoMemorizarDimensoes()
}

async function janela_criarBotaoMemorizarDimensoes(){

	let extensao	= criar({
		id:'extensao-botao-armazenar-dimensoes-da-janela'
	})

	let botao	= criar({
		tag:				'botao',
		id:					'armazenar-dimensoes-da-janela',
		ancestral:	extensao,
		title:			'Salvar Dimensões da Janela',
	})

	botao.addEventListener(
		'click',
		async () => {
			botao.classList.remove('informacoes')
			botao.classList.add('encolher-crescer')
			await suspender()
			botao.classList.remove('encolher-crescer')
			botao.classList.add('informacoes')
			definir(CONTEXTO)
		}
	)
		
	async function definir(chave=''){

		relatar('Armazenando dimensões da janela:',CONTEXTO,'execucao')

		if(!chave) return

		let janela			= CONFIGURACAO?.janela				|| {}
		let altura			= window.outerHeight					|| TELA.height
		let largura			= window.outerWidth						|| TELA.width
		let horizontal	= Math.max((window.screenLeft || 0), 0)
		let vertical		= Math.max((window.screenTop 	|| 0), 0)

		let dimensoes		= {
			a:altura,
			l:largura,
			h:horizontal,
			v:vertical
		}
		
		janela[chave]		= dimensoes

		await armazenar({janela})

	}	
	
}


function janela_recarregar(){
	window.location.reload()
}


function janela_id(){
	return NAVEGADOR.windows.WINDOW_ID_CURRENT
}
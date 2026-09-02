function assistenteDeContexto_criar(
	contexto	= '',
	posicao		= ''
){

	relatar('Criando Assistente de Contexto…')

	let prefixo = 'assistente-de-contexto-'
	let sufixo 	= prefixo + contexto

	let extensao		= criar({
		id:						'extensao-' + sufixo,
	})
	let puxador		= criar({
		tag:					'puxador',
		id:						'puxador-assistente-de-contexto-' + sufixo,
		ancestral:		extensao,
	})
	let assistente	= criar({
		tag:					'assistente-de-contexto',
		id:						sufixo,
		ancestral:		extensao,
		atributos:		{
			contexto,
			posicao,
		}
	})
	criar({
		tag:					'botao',
		id:						`${prefixo}botao-salvar`,
		classe:				'sombra-escura',
		ancestral:		assistente,
		texto:				'💾',
		aoClicar:			salvarConfiguracoes,
	})

	puxador.addEventListener(
		'click',
		() => {
			assistente.classList.toggle('expandido')
			puxador.classList.toggle('expandido')
			let expandido = ativado()
			let assistenteDeContexto = CONFIGURACAO?.assistenteDeContexto || {}
			assistenteDeContexto[contexto] = {expandido}
			armazenar({assistenteDeContexto})
		}
	)

	let painel = CONFIGURACAO?.assistenteDeContexto[contexto] || {}

	if(painel?.expandido){
		suspender(100).then(() => {
			assistente.classList.add('expandido')
			puxador.classList.add('expandido')
			esforcosPoupados({
				movimentos:	1,
				cliques:		1,
				teclas:			0,
				segundos:		2
			})
		})
	}

	return assistente

	function ativado(){
		let ativado	= selecionar('sisejt-puxador.expandido') || false
		if(ativado)
			ativado		= true
		return ativado
	}

	async function salvarConfiguracoes(){
		salvarConfiguracoesDaExtensao()
		let texto	= this.innerText
		this.innerText	= '✔️'
		await suspender()
		this.innerText	= texto
	}

}


function assistenteDeContexto_criarFuncionalidades(
	chave			= '',
	titulo		= '',
	ancestral	= '',
	itens			= []
){

	let funcionalidades = criar({
		tag:				'funcionalidades',
		id:					'extensao-assistente-de-contexto-' + chave,
		ancestral,
		atributos:	{
			chave,
			titulo
		},
	})

	ancestral = funcionalidades

	itens.forEach(
		item => {
			if(item?.tag == 'botao'){
				assistenteDeContexto_criarBotao({
					...item,
					ancestral,
				})
			}
			else{
				if(item?.ativada)
					if(!item?.type)
						item.type	= 'checkbox'
				let campo = assistenteDeContexto_criarCampo({
					...item,
					ancestral,
				})
				if(item?.ativada)
					criar({
						tag:'guia',
						id:prefixar(item.id,'guia'),
						atributos:{
							ativada:item.ativada,
							desativada:item.desativada
						},
						ancestral:campo.parentElement,
					})
			}

		}
	)

	return funcionalidades

}


function assistenteDeContexto_criarCampo(configuracao = {}){

	relatar('Obtendo configuracoes para criar campo:', configuracao)

	let {
		ancestral		= '',
		antesDe			= '',
		aoAlterar		= '',
		aoClicar		= '',
		aoDigitar		= '',
		classe			= '',
		chave				= '',
		datalist		= '',
		id					= '',
		label				= {},
		list				= '',
		max					= '',
		min					= '',
		opcoes			= '',
		placeholder	= '',
		tag					= 'input',
		titulo			= '',
		type				= 'text',
		value				= '',
	} = configuracao

	let rotulo 		= ''
	let texto			= label?.texto || ''

	if(typeof label == 'object'){
		rotulo	= criar({
			tag:				'label',
			id:					'rotulo-campo-' + id,
			classe,
			atributos:	{titulo},
			texto,
			antesDe,
			ancestral,
		})
	}

	if(datalist){
		criar({
			tag:	'datalist',
			id:		id,
			ancestral,
			datalist,
		})
	}

	if(rotulo)
		ancestral	= rotulo

	let atributos = {}
	if(!chave)
		atributos.chave = id

	let	campo	= criar({
		atributos,
		id:			'campo-' + id,
		ancestral,
		antesDe,
		aoAlterar,
		aoClicar,
		aoDigitar,
		classe,
		list,
		max,
		min,
		opcoes,
		placeholder,
		tag,
		type,
		value,
	})

	campo.addEventListener('change',salvarConfiguracoesDaExtensao)

	return campo || ''

}


function assistenteDeContexto_criarBotao(configuracao = {}){

	relatar('Obtendo configurações para criar botão:', configuracao)

	let {
		id				= '',
		classe		= '',
		texto			= '',
		title			= '',
		ancestral	= '',
		aoClicar	= '',
	} = configuracao

	let botao		= criar({
		tag:		'botao',
		id:			'botao-assistente-de-contexto-' + id,
		texto,
		title,
		classe,
		aoClicar,
		ancestral,
	})

	return botao

}


async function assistenteDeContexto_obterConfiguracoes_porParametroDeUrl(ancestral=''){

	let parametro = url_parametro_obter('SISEJT_Assistente_de_Contexto')
	if(!parametro)
		return false

	let configuracoes = JSON.parse(decodeURIComponent(parametro) || '{}') || {}

	if(!configuracoes?.acao)
		return false

	CONFIGURACAO.assistenteDeContexto = configuracoes

	let funcionalidades = await criar({
		tag:				'funcionalidades',
		id:					'extensao-assistente-de-contexto-acao-automatizada',
		ancestral,
		atributos:	{titulo:'Executando:'},
	})

	Object.entries(configuracoes).forEach(([especificacao, valor]) => {

		let rotulo = criar({
			tag:				'label',
			id:					'assistente-de-contexto-acao-automatizada-rotulo-campo-' + especificacao,
			texto:			especificacao,
			ancestral:	funcionalidades,
		})
		criar({
			ancestral:	rotulo,
			tag:				'input',
			id:					'assistente-de-contexto-acao-automatizada-campo-' + especificacao,
			type:				'text',
			value:			valor,
			atributos:	{
				especificacao,
				disabled:true,
			},
		})
	})

	return true

}


function assistenteDeContexto_obterEspecificacoes(){

	let especificacoes_assistenteDeContexto = selecionar('input[especificacao]','',true)

	relatar('acoes_assistenteDeContexto:', especificacoes_assistenteDeContexto, 'automacao')

	let especificacoes = {}

	especificacoes_assistenteDeContexto.forEach(campo => {
		let nome = campo.getAttribute('especificacao')
		especificacoes[nome] = campo.value
	})

	return especificacoes

}


function assistenteDeContexto_desativarAlternadoresConflitantes(alternadores=[]){
	
	alternadores.forEach(alternador => alternador.addEventListener(
		'click',
		() => {
			if(alternador.checked)
				alternadores.forEach(outro => {
					if(outro !== alternador)
						outro.checked = false
					}
				)
			}
		)
	)

}


async function assistenteDeContexto_areaDeTexto_copiarConteudo(){
	this.select()
	await suspender(500)
	evento('mouseup','#copiar-selecao-texto')
}
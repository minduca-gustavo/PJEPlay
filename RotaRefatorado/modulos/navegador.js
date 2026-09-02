/**
 * Abre a página de opções da extensão
 */
function extensao_opcoes(){
	NAVEGADOR.runtime.openOptionsPage()
}

/**
 * Abre a página de configurações da extensão, com parâmetros de URL
 */
function extensao_configuracoes(parametros=''){
	let url	= extensao_raiz(`navegador/paginas/configuracoes/pagina.htm${parametros}`)
	abrirURL({
		url,
		chave:'extensao.configuracoes'
	})
}


/**
 * Recarrega a extensão.
 * Função alias para NAVEGADOR.runtime.reload()
 */
async function extensao_recarregar(){
	relatar('🔄 Recarregando a extensão…','','navegador')
	NAVEGADOR.runtime.sendMessage({acao:'RecarregarExtensao'})
}


/**
 * Monta um caminho absoluto para um arquivo de uma string com um caminho partindo do manifest.json:
 * @param {string}	arquivo
 */
function extensao_raiz(arquivo=''){
	return NAVEGADOR.runtime.getURL(arquivo)
}


/**
 * Armazena chaves na memória local da extensão no navegador.
 * Função alias para NAVEGADOR.storage.local.set()
 * @param {string} chave
 * @returns NAVEGADOR.storage.local.set(chave)
 */
async function armazenar(
	dados	= {},
	tipo	= 'local'
){
	relatar('Armazenando:',dados,'armazenamento')
	try{
		let resultado = await NAVEGADOR.storage[tipo].set(dados)
		relatar('✅ Armazenamento realizado com sucesso!','','armazenamento')
		return resultado
	}
	catch(erro){
		relatar('Erro ao tentar armazenar:',erro,'erro')
		throw erro
	}
}


/**
 * Obtém chaves da memória local da extensão no navegador.
 * Função alias para NAVEGADOR.storage.local.get()
 * @param {string} chave - Padrão null
 * @returns ${armazenamento}
 */
async function obterArmazenamento(
	chave = null,
	tipo	= 'local'
){
	try{
		relatar('Obtendo Armazenamento…',tipo,'armazenamento')
		let armazenamento = await NAVEGADOR.storage[tipo].get(chave)
		relatar('Obtido:',armazenamento,'armazenamento')
		return armazenamento
	}
	catch(erro){
		relatar('Erro ao acessar o storage:',erro,'erro')
		return chave === null ? {} : null
	}
}



/**
 * Define o ícone da extensão na barra de menu.
 * @param {boolean} ativa
 */
async function definirIconeDaExtensaoPeloEstado(ativa){

	let navegador = NAVEGADOR.action

	relatar('Definindo ícone da extensão pelo estado…',ativa,'navegador')

	if(ativa === undefined){
		ativa = true
		await armazenar({ativa:ativa})
	}

	if(ativa)
		definirIcone('1')
	else
		definirIcone('0')

	function definirIcone(arquivo = '1'){
		relatar('Ícone da extensão:',arquivo,'navegador')
		navegador.setIcon({path:{
			'16':  '/imagens/' + arquivo + '-16.png',
			'24':  '/imagens/' + arquivo + '-24.png',
			'32':  '/imagens/' + arquivo + '-32.png',
		}})
	}

}


/**
 * Define o estado da extensão na memória local da extensão no navegador.
 * Obtém o estado checked pelo alternador contido no menu da extensão (/navegador/paginas/menu/pagina.htm).
 */
async function definirEstadoDaExtensao(){

	let ativador = selecionar('#extensao')

	ativador.addEventListener('change', salvarEstadoDaExtensao)

	let armazenamento	= await obterArmazenamento('ativa')
	ativador.checked	= armazenamento.ativa

	function salvarEstadoDaExtensao(){
		let ativo = ativador.checked || false
		armazenar({ ativa: ativo })
		definirIconeDaExtensaoPeloEstado(ativo)
	}

}


/**
 * Define a chave da configuração conforme a classe do elemento na página html correspondente.
 * @param {object} configuracoes
 * @returns ${destino}
 */
function definirDestinoDasConfiguracoes(configuracoes){

	relatar('Definindo a chave de destino…','','configuracao')
	let destino = configuracoes.getAttribute('chave') || ''
	if(!destino){
		relatar('Chave de destino não encontrada em ${configuracoes.getAttribute("chave")}','','configuracao')
		return ''
	}

	if(CONFIGURACAO[destino] === undefined){
		relatar(`${CONFIGURACAO[destino]} não definda.`,'','configuracao')
		CONFIGURACAO[destino] = {}
		relatar(`${CONFIGURACAO[destino]} definda para {}.`,'','configuracao')
	}

	relatar('Chave de destino definida:',destino,'configuracao')
	return destino || ''

}


/**
 * Obtém as configurações da extensão pelos inputs e seus respectivos valores na página html correspondente.
 */
function obterConfiguracoesDaExtensao(){

	relatar('Selecionando elementos <funcionalidades>…','','configuracao')

	selecionar('funcionalidades','',true).forEach(
		configuracoes => {
			let destino = definirDestinoDasConfiguracoes(configuracoes)
			relatar('Selecionando campos…','','configuracao')
			relatar('Definindo estados e valores dos campos…','','configuracao')
			configuracoes.querySelectorAll('input,select,textarea').forEach(
				configuracao => {
					let chave = configuracao.getAttribute('chave') || ''
					relatar('Chave obtida:',chave,'configuracao')
					if(!chave)
						return
					let dados = CONFIGURACAO[destino] || ''
					if(!dados){
						relatar('dados não encontrados em CONFIGURACAO[destino]:',dados,'erro')
						return
					}
					
					relatar('DADOS:',dados,'configuracao')
					let dado = dados[chave]
					relatar('Dado:',dado,'configuracao')
					let tag = configuracao.tagName
					relatar('Tag:',tag,'configuracao')
					let tipo = configuracao.type
					relatar('Tipo:',tipo,'configuracao')
					let valor = configuracao.value
					relatar('Valor:',valor,'configuracao')
					if(
						tag.includes('SELECT') ||
						tag.includes('TEXTAREA')
					)
						configuracao.value = dado || ''
					if(tipo === 'checkbox')
						configuracao.checked = dado || false
					if(tipo === 'number')
						configuracao.value = dado || valor || 0
					if(['date', 'email', 'password', 'text'].includes(tipo))
						configuracao.value = dado || valor || ''
				}
			)
		}
	)

	relatar('Estados e valores dos campos definidos!','','configuracao')

}

/**
 * Salva as configurações da extensão conforme os inputs e seus respectivos valores na página html correspondente.
 */
async function salvarConfiguracoesDaExtensao(){

	relatar('Salvandos as configuracões da extensão…','','configuracao')
	await salvar()

	async function salvar(){
		relatar('Selecionando elementos <funcionalidades>…','','configuracao')
		selecionar('funcionalidades','',true).forEach(
			async (configuracoes) => {
				relatar('Selecionando campos…','','configuracao')
				relatar('Obtendo estados e valores dos campos…','','configuracao')
				let destino	= definirDestinoDasConfiguracoes(configuracoes)
				if(!destino)
					return
				let dados		= CONFIGURACAO[destino]
				configuracoes.querySelectorAll('input,select,textarea').forEach(
					configuracao => {
						let chave = configuracao.getAttribute('chave') || ''
						relatar('Chave obtida:',chave,'configuracao')
						let tag			= configuracao.tagName
						let tipo		= configuracao.type
						let valor		= configuracao.value
						let marcado	= configuracao.checked
						if(
							tag.includes('SELECT') ||
							tag.includes('TEXTAREA')
						)
							dados[chave] = valor || ''
						if(tipo === 'checkbox')
							dados[chave] = marcado || false
						if(tipo === 'number')
							dados[chave] = valor || 0
						if(['date', 'email', 'password', 'text'].includes(tipo))
							dados[chave] = valor.trim() || ''
					}
				)
				await armazenar({[destino]:dados})
			}
		)
		relatar('Configuracões salvas!','','configuracao')
	}

}


/**
 * Abre uma URL, por meio do ${NAVEGADOR.runtime} (navegador/segundo-plano.js), utilizando o método ${criarJanela()} (modulos/navegador.js).
 * @param  {object}		configuracao
 * @param  {string} 	tipo				
 */
function abrirURL(configuracao={}){

	let {
		url						= 'about:blank',
		centralizada	= false,
		largura				= 0,
		altura				= 0,
		horizontal		= 0,
		vertical			= 0,
		chave					= '',
		tipo					= 'normal',
		incognito			= false,
		ativa					= true,
	} = configuracao

	if(centralizada){
		horizontal	= Math.round((screen.width  - largura) / 2)
    vertical		= Math.round((screen.height - altura) / 2)
	}

	if(CONFIGURACAO?.extensao?.abrirUrlsEmAbas){
		if(tipo === 'normal')
			tipo = 'aba'
	}

	let opcoes = {
		chave:			chave,
		url:				url,
		largura:		largura,
		altura:			altura,
		horizontal:	horizontal,
		vertical:		vertical,
		tipo:				tipo,
		incognito:	incognito,
		ativa:			ativa,
	}

	relatar('Mensagem para o navegador:',opcoes,'navegador')

	NAVEGADOR.runtime.sendMessage(opcoes)

}

async function capturarImagem(configuracoes={}){

	relatar('Capturando imagem…',configuracoes,'navegador')

	try{
		let definicoes			= {}
		definicoes.format		= configuracoes?.formato		|| 'png'
		definicoes.quality	= configuracoes?.qualidade	|| 100
		let opcoes = {
			format: definicoes.format,
			quality: definicoes.quality
		}
		let imagem = await NAVEGADOR.tabs.captureVisibleTab(null, opcoes)
		relatar('Imagem:',imagem,'navegador')
		if(configuracoes?.copiar)
			fetch(imagem).then(
				resposta => resposta.arrayBuffer()
			).then(
				imagem => {
					let blob = new Blob([imagem], { type: 'image/' + definicoes.format });
					let item = new ClipboardItem({ ['image/' + definicoes.format]: blob });
					navigator.clipboard.write([item])
					let audio = new Audio(extensao_raiz('audios/captura.mp3'))
					audio.play()
				}
			)
		return imagem
	}	catch(erro){
		relatar('Erro ao capturar a imagem:',erro,'erro')
		throw erro
	}

}


function ativarBotao(
	seletor	= '',
	funcao	= ''
){
	selecionar(seletor).addEventListener(
		'click',
		funcao
	)
}

function recarregarAba(){
	NAVEGADOR.runtime.sendMessage({
		acao:					'RecarregarAba',
		bypassCache:	true,
	})
}
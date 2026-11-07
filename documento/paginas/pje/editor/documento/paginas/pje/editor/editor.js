/*
As funções neste arquivo permitem abrir o editor de documentos do PJe com um texto pré-montado de documento a partir do contexto em que a função é chamada.
Embora a execução seja orientada por parâmetros de URL, tudo é feito no frontend, às vistas de quem está utilizando.
Mesmo no cenário de máxima automação do texto, com a ativação do botão "Assinar", a assinatura efetiva do documento depende de ação consciente do usuário do sistema, que terá de digitar seu PIN do Certificado Digital no assinador (devendo, portanto, conferir o texto antes de assinar).
*/


async function pje_processo_anexar_editor_expandirArvoreDeModelosDeDocumentos(){

	let ativa = CONFIGURACAO?.pje_processo_anexar_editor_aoAbrir?.expandirArvoreDeModelosDeDocumentos || ''
	if(!ativa)
		return

	pje_processo_editor_expandirArvoreDeModelosDeDocumentos(ativa)
	
}


async function pje_processo_comunicacoes_editor_expandirArvoreDeModelosDeDocumentos(){

	let ativa = CONFIGURACAO?.pje_processo_comunicacoes_editor_aoAbrir?.expandirArvoreDeModelosDeDocumentos || ''
	if(!ativa)
		return

	pje_processo_editor_expandirArvoreDeModelosDeDocumentos(ativa)
	
}


async function pje_processo_tarefa_editor_expandirArvoreDeModelosDeDocumentos(){

	let ativa = CONFIGURACAO?.pje_processo_tarefa_editor_aoAbrir?.expandirArvoreDeModelosDeDocumentos || ''
	if(!ativa)
		return

	pje_processo_editor_expandirArvoreDeModelosDeDocumentos(ativa)
	
}


async function pje_processo_editor_expandirArvoreDeModelosDeDocumentos(texto=''){

	await aguardarElemento('tree-node-children')

	await suspender()

	let itens = texto.split(EXPRESSAO.quebraDeLinha)

	for(let item of itens)
		await pje_processo_editor_arvoreDeModelos_acionarItem(item,true)
	
}


async function pje_processo_editor_arvoreDeModelos_acionarItem(
	texto	= '',
	pasta	= ''
){
	let atributos	= '@role="treeitem"'
	if(pasta)
		atributos = '@role="treeitem group" and @aria-expanded="false"'
	let item = await aguardarElemento(
			'//div[' + atributos + '][.//span[text()="' + texto.trim() + '"]]',
			{xpath:true}
		)
	if(!item)
		return
	await suspender(100)
	clicar(item)
}


async function pje_processo_editor_documento_alterarDescricaoAoClicarNoModelo(){

	let ativa = CONFIGURACAO?.pje_processo_tarefa_editor_aoAbrir?.alterarDescricaoAoClicarNoModelo || ''
	if(!ativa)
		return
	
	let arvore = await aguardarElemento('tree-node')
	arvore.addEventListener('click',evento => {
		let elemento	= evento.target.parentElement.parentElement || ''
		if(!elemento)
			return
		let modelo		= selecionar('i.fa-file',elemento)
		if(!modelo)
			return
		let pasta 		= elemento.closest('tree-node-children').previousSibling
		let local	 		= extrairTexto(pasta)
		let arquivo		= extrairTexto(elemento)
		let descricao	= descrever(local,arquivo)
		preencher('[aria-label="Descrição"]',descricao)
	})

	function descrever(
		local		= '',
		arquivo	= ''
	){
		let descricao = ''
		if(!local.match(/Meus Modelos|Compartilhados Comigo|Despachos|ões$/g))
			descricao = local.replace(/^(.*?[.])/g,'').trim() + ' - '

		descricao += arquivo.replace(/^(.*?[.])/g,'').trim()

		return truncar(descricao)
	}

}


async function pje_processo_tarefa_editor_desmarcarEnviarParaPEC(){

	let ativa = CONFIGURACAO?.pje_processo_tarefa_editor_aoAbrir?.desmarcarEnviarParaPEC || ''
	if(!ativa)
		return

	let campo = await aguardarElemento('.enviarPec input')
	await suspender()
	if(campo.checked)
		clicar(campo)

}


async function pje_processo_tarefa_editor_criarBotoesDeNotificacaoDePartesPorCorreios(){

	await aguardarElemento('.desabilitado span[class^="destina"')

	let partes 			= selecionar('.desabilitado span[class^="destina"','',true)
	let processoId	= PROCESSO.id || ''
	let opcoes			= assistenteDeContexto_obterEspecificacoes()
	let documento		= opcoes?.modelo || ''
	let expediente	= 'Notificação inicial'
	let meio				= 'Correios'
	let tipo				= 'E-Carta com AR'
	let modelo			= `Por ${tipo} - Audiência - ${documento}`

	partes.forEach((parte,indice) => {
		let nome = extrairTexto(parte)
		let ancestral = parte.parentElement.nextElementSibling
		criar({
			ancestral,
			tag:			'botao',
			id:				'pje-notificar-parte-por-correios-'+indice,
			classe:		'rotapje-botao rotapje-editor-notificacao',
			texto:		'✉️',
			title:		`Preparar ${expediente} de Parte sem Representante via ${meio} por ${tipo} para ${parte}`,
			aoClicar:	() => pje_processo_tarefa_notificar({
				acao:'NOTIFICAR',
				processoId,
				parte:nome,
				expediente,
				meio,
				tipo,
				modelo,
			}),
		})
	})

}


async function pje_processo_tarefa_editor_criarBotoesDeNotificacaoDePartesPorDomicilioEletronico(){

	let seletor = 'pje-intimacao-automatica tr mat-select'
	await aguardarElemento(seletor)
	let partes	= selecionar(seletor,'',true)
	let processoId	= PROCESSO.id || ''
	let opcoes			= assistenteDeContexto_obterEspecificacoes()
	let documento		= opcoes?.modelo || ''
	let expediente	= 'Notificação inicial'
	let meio				= 'Domicílio Eletrônico'
	let tipo				= meio
	let modelo			= `Por ${tipo} - Audiência - ${documento}`

	partes.forEach((parte,indice) => {
		let linha					= parte.closest('tr')
		let textoMeio			= extrairTexto(parte)
		let textoLinha		= extrairTexto(linha)
		if(
			!textoMeio.includes(meio)
			||
			textoLinha.includes('Procuradoria')
		)
			return
		let destinatario	= selecionar('span[class^="destina"',linha)
		let nome					= extrairTexto(destinatario)
		let ancestral			= destinatario.parentElement.nextElementSibling
		criar({
			ancestral,
			tag:			'botao',
			id:				'pje-notificar-parte-por-domicilio-eletronico-'+indice,
			classe:		'rotapje-botao rotapje-editor-notificacao',
			texto:		'✉️',
			title:		`Preparar ${expediente} de Parte sem Representante via ${meio} por ${tipo} para ${parte}`,
			aoClicar:	() => pje_processo_tarefa_notificar({
				acao:'NOTIFICAR',
				processoId,
				parte:nome,
				expediente,
				meio,
				tipo,
				modelo,
			}),
		})
	})

}


async function pje_processo_editor_acionarBotao_incluirModelo(){
	let botao = await aguardarElemento('[aria-label="Inserir modelo de documento"]')
	focarEsperarClicar(botao,750)
	await suspender()
}

async function pje_processo_editor_preencherPreambuloDoDocumento(){
	await pje_aguardarMensagem('Modelo de documento inserido')
	let processoOrigem	= PROCESSO?.orgaoJulgador?.origem	|| ''
	pje_processo_editor_substituirTexto({
		'#{processo.orgaojulgador.origem}':processoOrigem,
	})
}


async function pje_processo_editor_preencherDadosDaAudiencia(){
	await pje_aguardarMensagem('Modelo de documento inserido')
	let audienciaId			= CONFIGURACAO?.pje_pauta_aoAbrir?.preencher_idDaAudiencia		|| ''
	let audienciaSenha	= CONFIGURACAO?.pje_pauta_aoAbrir?.preencher_senhaDaAudiencia	|| ''
	let audienciaLink		= CONFIGURACAO?.pje_pauta_aoAbrir?.preencher_linkDaAudiencia	|| ''

	pje_processo_editor_substituirTexto({
		'#{zoom.audiencia.id}':audienciaId,
		'#{zoom.audiencia.senha}':audienciaSenha,
		'Próxima audiência designada não possui link para audiência virtual':audienciaLink,
	})
}

async function pje_processo_editor_acionarBotao_salvarMinuta(){
	await pje_aguardarMensagem('Modelo de documento inserido')
	await suspender()
	focarEsperarClicar('button[aria-label="Salvar"]')
}


async function pje_processo_editor_acionarBotao_finalizarMinuta(){
	await suspender()
	focarEsperarClicar('button[aria-label="Finalizar minuta"]')
}

async function pje_processo_editor_acionarBotao_salvarExpedientes(){
	await pje_aguardarMensagem('Ato elaborado com sucesso')
	await suspender()
	let salvar = await aguardarElemento('button[aria-label="Salva os expedientes"]:not([disabled])')
	await suspender()
	focarEsperarClicar(salvar)
}

async function pje_processo_editor_acionarBotao_assinarAtos(){
	let salvar = await aguardarElemento('button[aria-label="Assinar ato(s)"]:not([disabled])')
	await suspender()
	focarEsperarClicar(salvar)
}


async function pje_processo_editor_notificacao_inserir_assinadoPorOrdemDoJuizo(){
	await pje_aguardarMensagem('Modelo de documento inserido')
	document.dispatchEvent(
		new CustomEvent(
			'rotapje_EditorInserirRodape',
			{
				detail: JSON.stringify({
					seletor: '.area-conteudo[contenteditable="true"][aria-label^="Assinatura (opcional)"]',
					rodape:  '<footer class="rodape" style="font-size:10pt;line-height:1;text-align:justify;">*Assinada por ordem do Meritíssimo Juízo do Trabalho, nos termos do artigo 250, VI, do Código de Processo Civil.</footer>'
				})
			}
		)
	)
}


function pje_processo_editor_substituirTexto(substituicoes){
	document.dispatchEvent(
		new CustomEvent(
			'rotapje_EditorSubstituirTexto',
			{
				detail: JSON.stringify({
					substituicoes
				})
			}
		)
	)
}




async function pje_processo_tarefa_editor_acionarBotoesDeNotificacaoDePartes(){
	let ativa = CONFIGURACAO?.pje_processo_tarefa_editor_aoSalvarDecisao?.notificarPartesSemRepresentante || ''
	if(!ativa)
		return
	await pje_aguardarMensagem('Movimentos gravados com sucesso')
	await aguardarElemento('.rotapje-editor-notificacao')
	await suspender()
	let botoes = selecionar('.rotapje-editor-notificacao','',true)
	botoes.forEach(botao => focarEsperarClicar(botao,500))
}

function inserirTextoNoEditor(seletor, texto){
	document.dispatchEvent(
		new CustomEvent(
			'rotapje_EditorInserirConteudoSeletor',
			{
				detail: JSON.stringify({
					seletor: seletor,
					inserir:  texto
				})
			}
		)
	)
}
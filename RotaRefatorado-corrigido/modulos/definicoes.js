// VARIÁVEIS E DEFINIÇÕES GLOBAIS E DINÂMICAS, DISPONÍVEIS PARA TODAS OS ESCOPOS:

const
	NAVEGADOR			= definirNavegador()
	
var
	CONFIGURACAO	= {},													//-> Preenchida com NAVEGADOR.storage.local.get() pela função await definirChavesPrimariasDasConfiguracoes().
	CONTEXTO			= {},													//-> Para rotular com uma expressão única, por meio de fragmentos e expressões regulares derivados da global LOCAL, em que "domínio" o script está rodando.
	DATA					= definirDatas(),							//-> Obtém as datas utilizadas com frequência.
	DOCUMENTO			= {},													//-> Reservada para receber dados do documento.
	EXTENSAO			= definirDadosDaExtensao(),		//-> Obtém as chaves do arquivo manifest.json.
	EXPRESSAO			= {},													//-> Obtém as expressões regulares utilizadas com frequência.
	LINK					= {},													//-> Reservada para receber links comuns.
	LOCAL					= definirLocal(),							//-> Obtém a URL.
	PJE						= {},													//-> Reservada para receber os dados do PJe.
	PROCESSO			= {},													//-> Reservada para receber os dados do processo.
	TELA					= definirTela()								//-> Informações da tela.


/**
 * Deve ser executada após o preenchimento do objeto ${CONFIGURACAO} com as chaves obtidas do objeto NAVEGADOR.storage.local.
 * Define configurações primárias da extensão, preenchendo o objeto NAVEGADOR.storage.local com os padrões definidos.
 * Recarrega a extensão, se necessário.
 */
async function definicoesGlobais(){

	relatar('Definições Globais:', '', 'configuracao')

	await definirChavesPrimariasDasConfiguracoes()

	LINK			= definirLinks()
	EXPRESSAO	= definirExpressoesRegulares()
	CONTEXTO	= definirContexto()

	async function definirChavesPrimariasDasConfiguracoes(){

		relatar('Verificando chaves primárias das configurações…',CONFIGURACAO,'configuracao')

		let recarregar = ''

		if(CONFIGURACAO?.ativa === undefined){
			relatar('Defindo estado inicial da extensão…','','configuracao')
			await armazenar({ativa:true})
			recarregar = true
		}

		if(CONFIGURACAO?.assistenteDeContexto === undefined){
			relatar('Defindo estado inicial das configurações do Assistente de Contexto…','','configuracao')
			await armazenar({
				assistenteDeContexto:{
					pje_autenticacao:	{expandido:true},
					siscondj:	{expandido:true},
				}
			})
			recarregar = true
		}

		if(CONFIGURACAO?.assistenteDeSelecao === undefined){
			relatar('Defindo estado inicial das configurações do Assistente de Seleção…','','configuracao')
			await armazenar({
				assistenteDeSelecao:{
					ativado:					true,
					abrirUrlsEmAbas:	false
				}
			})
			recarregar = true
		}

		if(CONFIGURACAO?.janela === undefined){
			relatar('Defindo estado inicial das configurações de dimensões de janelas…','','configuracao')
			await armazenar({
				janela:{}
			})
			recarregar = true
		}

		if(CONFIGURACAO?.extensao === undefined){
			await armazenar({
				extensao:{
					abrirUrlsEmAbas:	false
				}
			})
			recarregar = true
		}

		if(CONFIGURACAO?.pessoa === undefined){
			relatar('Defindo estado inicial das configurações individuais…','','configuracao')
			await armazenar({
				pessoa:{
					instancia:	'1',
					regiao:			'15'
				}
			})
			recarregar = true
		}

		if(
			CONFIGURACAO?.sistemasSatelites === undefined
			||
			!CONFIGURACAO?.sistemasSatelites?.ecartaUrlConsultaProcessos
			||
			!CONFIGURACAO?.sistemasSatelites?.zoomSubdominio
		){
			relatar('Defindo estado inicial das configurações de Sistemas Satélites…','','configuracao')
			await armazenar({
				sistemasSatelites:{
					ecartaUrlConsultaProcessos:	'https://ecarta.trt15.jus.br/consultarProcesso.xhtml',
					zoomSubdominio:	'trt15-jus-br'
				}
			})
			recarregar = true
		}

		if(CONFIGURACAO?.diagnostico === undefined){
			relatar('Defindo estado inicial das configurações de Diagnóstico…','','configuracao')
			await armazenar({
				diagnostico:{
					armazenamento:	false,
					automacao:			false,
					configuracao:		false,
					contexto:				false,
					dom:						false,
					erro:						false,
					execucao:				false,
					mutacao:				false,
					navegador:			false,
					requisicao:			false,
					resposta:				false,
					selecao:				false,
					teste:					false,
					texto:					false,
					xhr:						false,
				}
			})
			recarregar = true
		}

		if(CONFIGURACAO?.esforcos === undefined){
			relatar('Defindo estado inicial das configurações de Esforços Repetitivos Poupados…','','configuracao')
			await armazenar({
				esforcos:{
					desde:			DATA.hoje.curta,
					cliques:		1,
					movimentos:	1,
					teclas:			1,
					segundos:		1
				}
			})
			recarregar = true
		}

		if(CONFIGURACAO?.pje_processo_tarefa_conclusaoAoMagistrado_aoAbrir?.sugerirNomesDosJuizosConfigurados === undefined){
			relatar('Defindo estado inicial das configurações de Escolha de Juízo…','','configuracao')
			await armazenar({
				pje_processo_tarefa_conclusaoAoMagistrado_aoAbrir:{
					sugerirNomesDosJuizosConfigurados:	true
				}
			})
			recarregar = true
		}

		if(CONFIGURACAO?.autoGIGS?.compartilhados){
			relatar('Limpando autoGIGS.compartilhados…','','configuracao')
			let autoGIGS	= CONFIGURACAO?.autoGIGS
			relatar('autoGIGS',autoGIGS,'configuracao')
			autoGIGS.compartilhados	= ''
			autoGIGS.urlConfiguracoesCompartilhadas	= 'https://scpiracicaba-trt15-jus-br.github.io/pje-dashboard/sise-jt/gigs.json'
			await armazenar({autoGIGS})
			recarregar = true
		}

		if(CONFIGURACAO?.selecionarJuizo?.documentoModeloId){
			relatar('Limpando selecionarJuizo.documentoModeloId…','','configuracao')
			let selecionarJuizo	= CONFIGURACAO?.selecionarJuizo
			relatar('selecionarJuizo',selecionarJuizo,'configuracao')
			selecionarJuizo.documentoModeloId	= ''
			selecionarJuizo.urlConfiguracoesCompartilhadas	= 'https://scpiracicaba-trt15-jus-br.github.io/pje-dashboard/sise-jt/juizos.json'
			await armazenar({selecionarJuizo})
			recarregar = true
		}

		if(recarregar){
			if(NAVEGADOR?.runtime?.reload)
				NAVEGADOR.runtime.reload()
		}

	}

}


function definirLocal(){
	return  (typeof window !== 'undefined') ? window.location.href : ''
}


function definirNavegador(){
	let navegador = ''
	if(typeof browser === 'undefined' && typeof chrome !== 'undefined')
		navegador = chrome
	else
		navegador = browser
	return navegador
}


function definirTela(){
	return  (typeof window !== 'undefined') ? window.screen : {}
}


/**
 * Define os dados da extensão, obtendo do arquivo manifest.json.
 * @returns 
 */
function definirDadosDaExtensao(){

	let extensao = NAVEGADOR.runtime.getManifest()
	extensao.prefixo = extensao.short_name.toLowerCase().replace(/[-]/g,'')

	return extensao

}


function definirIcones(){
	let raiz = extensao_raiz()
	let icones = [
		'0',
		'1',
		'bb',
		'dimensoes',
		'engrenagem',
		'google',
		'google-tradutor',
		'lista',
		'maiusculas',
		'minusculas',
		'pje',
		'prancheta',
		'recarregar',
		't',
		'tique',
		'trt',
		'tst',
		'whatsapp'
	]
	icones.forEach(icone => {
		document.documentElement.style.setProperty(
			`--extensao-sisejt-icone-${icone}`,
			`url("${raiz}imagens/${icone}.svg")`
		)
	})
}
/**
 * Define links comuns.
 * @returns 
 */
function definirLinks(){

	relatar('Definindo links…','','configuracao')
	
	let link			= {}
	
	link.correios	= link_correios()
	link.ecarta		= link_ecarta()
	link.google		= link_google()
	link.pje			= link_pje()
	link.siscondj	= link_siscondj()
	link.trt15		= link_trt15()
	link.tst			= link_tst()
	link.whatsapp	= link_whatsapp()
	link.zoom			= link_zoom()
	
	relatar('Links definidos:',link,'configuracao')
	
	return link
	
	function link_correios(){
		let url				= {}
		url.dominio 	= 'correios.com.br'
		url.raiz			= montarUrl(url)
		url.ar				= montarUrl(url,'apps3','arc/areletronico/')
		url.relatorio	= url.ar + 'relatorio'
		url.pesquisar	= url.ar + 'pesquisar.html?SISEJT_correios_pesquisar_objeto='
		url.objeto		= url.relatorio + '?codigo='
		return url
	}
	
	function link_ecarta(){
		let url									= {}
		let consultarProcesso 	= CONFIGURACAO?.sistemasSatelites?.ecartaUrlConsultaProcessos || ''
		url.raiz								= consultarProcesso.replace(/[.]br[/].*/g,'.br/')
		url.consultarProcesso 	= consultarProcesso + '?codigo='
		url.detalhesObjeto			= url.raiz + '/impressaoDetalhesObjeto.xhtml?codigo='
		return url 
	}
	
	function link_google(){
		let url				= {}
		let pessoa		= CONFIGURACAO?.profissional?.pessoa || '0'
		url.dominio 	= 'google.com'
		url.raiz			= montarUrl(url)
		url.agenda		= montarUrl(url,'calendar')
		url.documents	= montarUrl(url,'docs','document')
		url.drive			= montarUrl(url,'drive')
		url.mail			= montarUrl(url,'mail','mail/u/' + pessoa)
		url.meet			= montarUrl(url,'meet')
		url.ogs				= montarUrl(url,'ogs')
		url.pesquisa	= montarUrl(url,'www','search?q=')
		url.planilhas	= montarUrl(url,'docs','spreadsheets')
		url.tradutor	= montarUrl(url,'translate')
		return url
	}
	
	function link_pje(){
		let url								= {}
		url.api								= {}
		url.painel						= {}
		url.aud								= {}
		url.exe								= {}
		let raiz							= CONFIGURACAO?.diagnostico?.pjeUrlRaiz || ''
		url.dominio 					=	'pje.' + obterDominioDoTribunal()
		url.raiz							= montarUrl(url)
		if(raiz)
			url.raiz						= raiz + '/'

		url.aud.raiz 					= url.raiz + 'aud/#/'
		url.kz 								= url.raiz + 'pjekz/'
		url.painel.raiz				= url.kz + 'painel/'
		url.painel.global 		= url.painel.raiz + 'global/'
		
		url.processo					= url.kz + 'processo/'
		url.consulta					= url.raiz + 'administracao/consulta/processo/index?tamanhoPagina=10000&'
		url.sif								= url.raiz + 'sif/consultar/'
		url.atas							= url.kz + 'atas-audiencias'
		url.pauta							= url.kz + 'pauta-audiencias'
		url.modelos						= url.kz + 'configuracao/modelos-documentos'
		
		url.grau1 						= url.raiz + 'primeirograu/'
		url.grau2 						= url.raiz + 'segundograu/'
		
		url.api.administracao	= url.raiz + 'pje-administracao-api/api/'
		url.api.comum					= url.raiz + 'pje-comum-api/api/'
		url.api.consulta			= url.raiz + 'pje-consulta-api/api/'
		url.api.gigs					= url.raiz + 'pje-gigs-api/api/'
		url.api.seguranca			= url.raiz + 'pje-seguranca/api/'
		url.api.sif						= url.raiz + 'sif-financeiro-api/api/'
		url.api.exe						= url.raiz + 'exe-backend-api/api/'
		url.api.diligencias		= url.api.exe + 'bancopenhora/diligenciaapi/'
		url.api.processos			= url.api.comum + 'processos/'
		url.api.pauta					= url.api.comum + 'pautasaudiencias?codigosSituacao=M&idSala='
		url.api.tarefas				= {
			ativas:							url.api.comum + 'tarefas/ativas?',
			grupos:							url.api.comum + 'agrupamentotarefas/',
		},
		url.exe.raiz					=	url.raiz + 'exe-pje/'
		url.exe.diligencias		= url.exe.raiz + 'execucao/banco-penhora/cadastro-bem/listar-diligencias?'

		return url
	}

	function link_siscondj(){

		let url				= {}

		let regiao = CONFIGURACAO?.pessoa?.regiao || ''
		if(regiao == '3')
			regiao = 'mg'
		if(regiao == '24')
			regiao = 'ms'
		url.instalacao = 'portaltrt' + regiao
		url.subdominio = 'siscondj'
		if(regiao == '1' || regiao == '8' || regiao == '11' || regiao == '16' || regiao == '21'){
			url.subdominio = 'pje'
			url.instalacao = 'siscondj'
		}
		if(regiao == '2'){
			url.subdominio = 'alvaraeletronico'
			url.instalacao = 'portaltrtsp'
		}
		if(regiao == '4'){
			url.subdominio = 'siscondj'
			url.instalacao = 'portaltrtrs'
		}
		if(regiao == '6'){
			url.subdominio = 'pje'
			url.instalacao = 'siscondj'
		}
		if(regiao == '7'){
			url.subdominio = 'pje'
			url.instalacao = 'siscondj'
		}
		if(regiao == '5' || regiao == '12' || regiao == '23' || regiao == '24'){
			url.subdominio = 'siscondj'
			url.instalacao = 'siscondj'
		}
		if(regiao == '13'){
			url.subdominio = 'www'
			url.instalacao = 'siscondj'
		}
		if(regiao == '14'){
			url.subdominio = 'pje'
			url.instalacao = 'siscondj'
		}
		if(regiao == '18'){
			url.subdominio = 'sistemas'
			url.instalacao = 'siscondj'
		}
		if(regiao == '22'){
			url.subdominio = 'aplicacoes'
			url.instalacao = 'siscondj'
		}
		url.dominio						=	obterDominioDoTribunal()
		url.raiz							= montarUrl(url,url.subdominio,url.instalacao)
		url.consulta					= {}
		url.paginas						= url.raiz						+ '/pages/'
		url.mandados					= url.paginas					+ 'mandado/'
		url.movimentacao			= url.paginas					+ 'movimentacao/'
		url.pagamento					= url.mandados				+ 'pagamento/'
		url.acompanhamento		= url.mandados				+ 'acompanhamento/'
		url.mandado						= url.pagamento				+ 'exibirAcionadoPelaGrid/'
		url.download					= url.acompanhamento	+ 'downloadPdf/'
		url.conta							= url.movimentacao		+ 'conta/'
		url.saldo							= url.paginas					+ 'relatorios/extrato/conta/obterSaldo/'
		url.consulta.contas		= url.conta						+ 'new?SISEJT_siscondj_consultar_contas='
		url.consulta.processo	= url.acompanhamento	+ 'new?SISEJT_siscondj_consultar_mandados='
		url.api								= {
			jurisdicao:	url.paginas + 'comarca_ativa_alocacao/'
		}
		return url
	}

	function link_trt15(){
		let url							= {}
		url.dominio 				= 'trt15.jus.br'
		url.raiz						= montarUrl(url)
		url.autenticacao		= montarUrl(url,'auth')
		url.satelites				= montarUrl(url,'satelites')
		url.intranet				= url.satelites + 'aplicacoesExtranet'
		url.designacoes			= url.satelites + 'designacoes/'
		return url
	}
	
	function link_tst(){
		let url							= {}
		url.dominio 				= 'tst.jus.br'
		url.raiz						= montarUrl(url)
		url.jurisprudencia	= montarUrl(url,'jurisprudencia')
		return url
	}

	function link_whatsapp(){
		let url = {}
		url.dominio		= 'whatsapp.com'
		url.protocolo	= 'whatsapp://send?phone='
		url.raiz			= montarUrl(url)
		url.api				= montarUrl(url,'api','send?phone=')
		url.chat			= montarUrl(url,'chat')
		url.grupo			= montarUrl(url,'chat','/FSBJFsBEX8y2YmGGIqM35A')
		url.web				= montarUrl(url,'web')
		return url
	}
	
	function link_zoom(){
		let url = {}
		let subdominio 	= CONFIGURACAO?.sistemasSatelites?.zoomSubdominio || ''
		url.dominio			= 'zoom.us'
		url.raiz				= montarUrl(url,subdominio)
		url.reunioes		= url.raiz + '/meeting'
		return url
	}
	
	function obterDominioDoTribunal(){
		let regiao	= CONFIGURACAO?.pessoa?.regiao || ''
		let sigla		= 'T'
		if(regiao === '0')
			sigla += 'ST'
		else
			sigla += 'RT' + regiao
		return minusculas(sigla) + '.jus.br'
	}

	function montarUrl(
		url					= {},
		subdominio	= '',
		caminho			= '',
		protocolo		= 'https'
	){
		if(subdominio) subdominio = subdominio + '.'
		return encodeURI(protocolo + '://' + subdominio + url.dominio + '/' + caminho)
	}

}


function abrirPagina_pje_grau1(incognito=false){
	abrirURL({
		url:		LINK.pje.kz,
		chave:	'pje.painel',
		incognito
	})
}

function abrirPagina_pje_grau2(){
	abrirURL({
		url:		LINK.pje.grau2,
		chave:	'pje.grau2'
	})
}

function abrirPagina_pje_aud(){
	abrirURL({
		url:		LINK.pje.aud.raiz,
		chave:	'pje.aud'
	})
}

function abrirPagina_pje_painel_global(){
	abrirURL({
		url:		LINK.pje.painel.global + 'todos/lista-processos',
		chave:	'pje.painel',
	})	
}	

function abrirPagina_pje_pauta(parametro=''){
	abrirURL({
		url:		LINK.pje.pauta + '?' + parametro,
		chave:	'pje.pauta',
	})	
}	

function abrirPagina_pje_atas(){
	abrirURL({
		url:		LINK.pje.atas,
		chave:	'pje.atas',
	})	
}	

function abrirPagina_pje_exe(){
	abrirURL({
		url:		LINK.pje.exe.raiz,
		chave:	'exe.pje.consulta.diligencias',
	})
}	

function abrirPagina_pje_modelos(){
	abrirURL({
		url:		LINK.pje.modelos,
		chave:	'pje.modelos',
	})	
}	

async function abrirPagina_pje_processo_tarefa(
	processoId 	= '',
	parametros	= '',
){
	if(!processoId)
		return
	let tarefa	= await pje_processo_tarefa_obterMaisRecente(processoId)
	let url			= tarefa?.caminho || ''
	if(!url)
		return	
	if(parametros)
		url += parametros
	abrirURL({
		url,
		chave:	'pje.processo.tarefa',
	})	
}	

function abrirPagina_siscondj(){
	abrirURL({
		url:		LINK.siscondj.raiz,
		chave:	'siscondj'
	})
}

function abrirPagina_ecarta(){
	abrirURL({
		url:		LINK.ecarta.raiz,
		chave:	'ecarta'
	})
}

function abrirPagina_intranet(){
	abrirURL({
		url:		LINK.trt15.intranet,
		chave:	'trt15.intranet'
	})
}

function abrirPagina_zoom(){
	abrirURL({
		url:		LINK.zoom.reunioes,
		chave:	'zoom'
	})
}

function abrirPagina_extensao_pje_listas(){
	abrirURL({
		url:		extensao_raiz('navegador/paginas/pje-listas/pagina.htm'),
		chave:	'extensao.pje.listas',
		tipo:		'popup'
	})
}


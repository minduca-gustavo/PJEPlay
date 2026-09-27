/**
 * Define o contexto de exeecução da extensão.
 * @returns 
 */
function definirContexto(){

	relatar('Definindo contexto…','','contexto')
	relatar('LOCAL:',LOCAL,'contexto')
	
	let contexto = ''

	if(LOCAL.includes(LINK.correios.dominio))
		contexto = 'correios'
	if(LOCAL.includes(LINK.ecarta.raiz))
		contexto = 'ecarta'
	if(LOCAL.includes(LINK.google.dominio))
		contexto = 'google.dominio'
	if(LOCAL.includes(LINK.google.pesquisa))
		contexto = 'google.pesquisa'
	if(LOCAL.includes(LINK.google.tradutor))
		contexto = 'google.tradutor'
	if(LOCAL.includes(LINK.google.planilhas))
		contexto = 'google.planilhas'
	if(LOCAL.includes(LINK.siscondj.raiz))
		contexto = 'siscondj'
	if(
		LOCAL.includes(LINK.siscondj.acompanhamento)
		||
		LOCAL.includes(LINK.siscondj.mandado)
		||
		LOCAL.includes(LINK.siscondj.movimentacao)
	)
		contexto = 'siscondj.mandado'
	if(LOCAL.includes(LINK.tst.dominio))
		contexto = 'tst.dominio'
	if(LOCAL.includes(LINK.tst.jurisprudencia))
		contexto = 'tst.jurisprudencia'
	if(LOCAL.includes(LINK.tst.jurisprudencia))
		contexto = 'tst.jurisprudencia'
	if(LOCAL.includes(LINK.zoom.dominio))
		contexto = 'zoom'
	if(LOCAL.match(EXPRESSAO.pje.url.aud))
		contexto = 'pje.aud'
	if(LOCAL.match(EXPRESSAO.pje.url.grau2))
		contexto = 'pje.grau2'
	if(LOCAL.match(EXPRESSAO.pje.url.painel))
		contexto = 'pje.painel'
	if(LOCAL.match(EXPRESSAO.pje.url.atas))
		contexto = 'pje.atas'
	if(LOCAL.match(EXPRESSAO.pje.url.exe))
		contexto = 'exe.pje.consulta.diligencias'
	if(LOCAL.match(EXPRESSAO.pje.url.consulta))
		contexto = 'pje.consulta.processos'
	if(LOCAL.match(EXPRESSAO.pje.url.pauta))
		contexto = 'pje.pauta'
	if(LOCAL.match(EXPRESSAO.pje.processo.anexar))
		contexto = 'pje.processo.anexar'
	if(LOCAL.match(EXPRESSAO.pje.processo.detalhes))
		contexto = 'pje.processo.detalhes'
	if(LOCAL.match(EXPRESSAO.pje.processo.tarefa))
		contexto = 'pje.processo.tarefa'
	if(LOCAL.match(EXPRESSAO.pje.processo.conclusao))
		contexto = 'pje.processo.conclusao'
	if(LOCAL.match(EXPRESSAO.pje.processo.pericias))
		contexto = 'pje.processo.pericias'
	if(LOCAL.match(EXPRESSAO.pje.processo.pagar))
		contexto = 'pje.processo.pagar'
	if(LOCAL.match(EXPRESSAO.pje.processo.pagamento))
		contexto = 'pje.processo.pagamento'
	if(LOCAL.match(EXPRESSAO.pje.processo.retificar))
		contexto = 'pje.processo.retificar'
	if(LOCAL.match(EXPRESSAO.pje.processo.terceiros))
		contexto = 'pje.processo.acesso-terceiros'
	if(LOCAL.match(EXPRESSAO.pje.processo.sigilo))
		contexto = 'pje.processo.historico-visibilidade-sigilo'
	if(LOCAL.match(EXPRESSAO.pje.processo.retificacao))
		contexto = 'pje.processo.historico-retificacao-autuacao'
	if(LOCAL.match(EXPRESSAO.pje.processo.audiencias))
		contexto = 'pje.processo.audiencias-sessoes'
	if(LOCAL.match(EXPRESSAO.pje.processo.recursos))
		contexto = 'pje.processo.quadro-recursos'
	if(LOCAL.match(EXPRESSAO.pje.processo.copiar))
		contexto = 'pje.processo.copiar-documento'
	if(LOCAL.match(EXPRESSAO.pje.processo.tarefas))
		contexto = 'pje.processo.historicotarefa'
	if(LOCAL.match(EXPRESSAO.pje.processo.bndt))
		contexto = 'pje.processo.bndt'
	if(LOCAL.match(EXPRESSAO.pje.processo.calculos))
		contexto = 'pje.processo.calculos'
	if(LOCAL.match(EXPRESSAO.pje.processo.gigs))
		contexto = 'pje.processo.gigs'
	if(LOCAL.match(EXPRESSAO.pje.processo.sif))
		contexto = 'pje.processo.sif'
	if(LOCAL.match(EXPRESSAO.pje.processo.comunicacoes.consulta))
		contexto = 'pje.processo.comunicacoes.consulta'
	if(LOCAL.match(EXPRESSAO.pje.processo.comunicacoes.elaboracao))
		contexto = 'pje.processo.comunicacoes.elaboracao'
	if(LOCAL.includes('navegador/paginas/pdpj-autenticacao/pagina.htm'))
		contexto = 'extensao.pje.pdpj.autenticacao'
	if(LOCAL.includes('navegador/paginas/pje-processo-dados/pagina.htm'))
		contexto = 'extensao.pje.processo.dados'
	if(LOCAL.includes('navegador/paginas/pje-listas/pagina.htm'))
		contexto = 'extensao.pje.listas'
	
	relatar('Contexto definido:',contexto,'contexto')

	return contexto

}
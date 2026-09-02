/**
 * Define expressões regulares utilizadas com frequência.
 * @returns
 */
function definirExpressoesRegulares(){

	relatar('Definindo expressões regulares…','','configuracao')
	
	let expressao	= {
		data:								new RegExp(/\d{1,2}[/]\d{1,2}[/]\d{4}/,'g'),
		hora:								new RegExp(/\d{1,2}[:]\d{2}/,'g'),
		quebraDeLinha:			new RegExp(/\r\n|\r|\n/,'g'),
		siscondj:{
			consulta:					new RegExp(/pages[/]mandado[/]acompanhamento[/]consultar/,'gi'),
			mandado:					new RegExp(/pages[/]mandado[/]pagamento[/]exibir/,'gi'),
			conta:						new RegExp(/pages[/]movimentacao[/]conta[/]buscar/,'gi'),
		},
		processo:{			
			numero:						new RegExp(/\d{7}\D\d{2}\D\d{4}\D\d{1}\D\d{2}\D\d{4}/,'g'),
			numeros: 					new RegExp(/\d{20}/,'g'),
			variavel:					new RegExp(/PROCESSO[.].*/)
		},
		pje:{
			processo:{
				anexar:					new RegExp(/pjekz[/]processo[/].*?[/]documento[/]anexar/,'gi'),
				comunicacoes:{
					consulta:			new RegExp(/pjekz[/]processo[/].*?[/]comunicacoesprocessuais/,'gi'),
					elaboracao:		new RegExp(/pjekz[/]processo[/].*?[/]comunicacoesprocessuais[/]minutas/,'gi'),
				},
				audiencias:			new RegExp(/pjekz[/]processo[/].*?[/]audiencias[-]sessoes/,'gi'),
				bndt:						new RegExp(/pjekz[/]processo[/].*?[/]bndt/,'gi'),
				copiar:					new RegExp(/pjekz[/]processo[/].*?[/]copiar[-]documento/,'gi'),
				retificar:			new RegExp(/pjekz[/]processo[/].*?[/]retificar/,'gi'),
				calculos:				new RegExp(/pjekz[/]processo[/].*?[/]detalhe[/]calculo/,'gi'),
				detalhes:				new RegExp(/pjekz[/]processo[/].*?[/]detalhe/,'gi'),
				pericias:				new RegExp(/pjekz[/]processo[/].*?[/]pericias/,'gi'),
				tarefa:					new RegExp(/pjekz[/]processo[/].*?[/]tarefa[/]/,'gi'),
				minutar:				new RegExp(/pjekz[/]processo[/].*?[/]tarefa[/].*?[/]minutar/,'gi'),
				pagamento:			new RegExp(/pjekz[/]pagamento[/].*/,'gi'),
				pagar:					new RegExp(/pjekz[/]obrigacao[-]pagar[/].*/,'gi'),
				terceiros:			new RegExp(/pjekz[/]processo[/].*?[/]acesso[-]terceiros/,'gi'),
				recursos:				new RegExp(/pjekz[/]processo[/].*?[/]quadro[-]recursos/,'gi'),
				retificacao:		new RegExp(/pjekz[/]processo[/].*?[/]historico[-]retificacao[-]autuacao/,'gi'),
				sigilo:					new RegExp(/pjekz[/]processo[/].*?[/]historico[-]visibilidade[-]sigilo/,'gi'),
				tarefas:				new RegExp(/pjekz[/]processo[/].*?[/]historicotarefa/,'gi'),
				conclusao:			new RegExp(/pjekz[/]processo[/].*?[/]tarefa[/].*?[/]conclusao/,'gi'),
				gigs:						new RegExp(/pjekz[/]gigs[/]abrir-gigs[/]\d+/,'gi'),
				sif:						new RegExp(/[/]sif[/]consultar[/]\d+[/]saldo/,'gi'),
			},
			url:{
				api:{
					perfis:				new RegExp(/[/]api[/]token[/]perfis/,'gi'),
					recursos:			new RegExp(/[/]api[/]token[/]permissoes[/]recursos/,'gi'),
					processos:		new RegExp(/[/]pje-comum-api[/]api[/]processos[/]id[/]\d+$/,'gi'),
					deslocamentos:new RegExp(/[/]pje-comum-api[/]api[/]processos[/]id[/].*?[/]historicodeslocamentos/,'gi'),
					pauta:				new RegExp(/[/]pje-comum-api[/]api[/]pautasaudiencias/,'gi'),
					orgaos:				new RegExp(/[/]pje-comum-api[/]api[/]orgaosjulgadores/,'gi'),
					orgao:				new RegExp(/[/]pje-comum-api[/]api[/]orgaosjulgadores[/]\d+/,'gi'),
					tarefas:{
						grupos:			new RegExp(/[/]pje-comum-api[/]api[/]agrupamentotarefas$/,'gi'),
						ativas:			new RegExp(/[/]pje-comum-api[/]api[/]tarefas[/]ativas/,'gi'),
					}
				},
				raiz:						new RegExp(/pje.*?[.]jus[.]br/,'gi'),
				auth:						new RegExp(/pje.*?[.]jus[.]br.*?[/]auth[/]/,'gi'),
				aud:						new RegExp(/pje.*?[.]jus[.]br[/]aud/,'gi'),
				exe:						new RegExp(/pje.*?[.]jus[.]br[/]exe-pje[/]/,'gi'),
				acessoNegado:		new RegExp(/pje.*?[.]jus[.]br.*?acesso-negado/,'gi'),
				grau2:					new RegExp(/pje.*?[.]jus[.]br.*?segundograu/,'gi'),
				paginaInicial:	new RegExp(/pje.*?[.]jus[.]br.*?login[.]seam/,'gi'),
				painel:					new RegExp(/pje.*?[.]jus[.]br[/]pjekz[/]($|.*?(painel|quadro-avisos[/]))/,'gi'),
				pauta:					new RegExp(/pje.*?[.]jus[.]br[/]pjekz[/]pauta-audiencias/,'gi'),
				atas:						new RegExp(/pje.*?[.]jus[.]br[/]pjekz[/]atas-audiencias/,'gi'),
				consulta:				new RegExp(/pje.*?[.]jus[.]br[/]administracao[/]consulta[/]processo/,'gi'),
				consulta:				new RegExp(/pje.*?[.]jus[.]br[/]administracao[/]consulta[/]processo/,'gi'),
				consulta:				new RegExp(/pje.*?[.]jus[.]br[/]administracao[/]consulta[/]processo/,'gi'),
				processos:{
					todos:				new RegExp(/pjekz[/]painel[/]global[/]todos[/]lista-processos/,'gi'),
				},
			},

		}
	}
	
	relatar('Expressões regulares definidas',expressao,'configuracao')
	
	return expressao

}
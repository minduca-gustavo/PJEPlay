// ============================================================
// sf-botoes.js
// Define os botões que aparecem no widget Super Filtros.
//
// Cada botão tem:
//   nome   → texto exibido no botão
//   funcao → async (contexto) => resultado
//
// O objeto `contexto` contém:
//   contexto.modo       → 'Tarefa' | 'Sala' | 'Lista'
//   contexto.valor      → texto digitado no input do widget
//   contexto.lista      → array de números CNJ (modo Lista)
//   contexto.progresso  → callback(feitos, total) — atualiza o widget
//
// Funções disponíveis:
//   filtrarPorTarefa(contexto) / filtrarPorSala / filtrarPorLista
//     → { ids, t }  (t = objeto já buscado, paralelo a ids)
//   sf_pool(itens, fn, { concorrencia, tentativas, pausaMs, onProgresso })
//     → array de resultados na mesma ordem de itens
//   buscarProcesso(id, path) / buscarDocumentos(id) / buscarMovimentos(id)
//   buscarIdPeloNumeroCNJ(id) / buscarCalculos(id) / buscarChips(id) / buscarGigs(numProc)
//
// O retorno da funcao pode ser:
//   string         → exibida diretamente
//   array de strings/números → lista
//   array de objetos → tabela (chaves viram colunas)
//   null/undefined → "(sem resultado)"
// ============================================================

const SF_BOTOES = [

	// ── Passivos da tarefa ────────────────────────────────────
	// Para cada processo da tarefa, busca as partes passivas
	// e retorna documento + número do processo.
	{
		nome: 'Lista processos por CNPJ/CPF',
		modo: ['Tarefa'],  // ← este botão só aparece no modo Tarefa
		funcao: async (contexto) => {
			if (contexto.modo !== 'Tarefa') return 'Este botão só funciona no modo Tarefa.'
			let { ids, t } = await filtrarPorTarefa(contexto)
			if (!ids.length) return 'Nenhum processo encontrado.'

			let d = []

			let resultados = await sf_pool(ids, async (id, idx) => {
				return await buscarProcesso(id, '/partes')
			}, {
				concorrencia: contexto.concorrencia,
				tentativas:   contexto.tentativas,
				pausaMs:      contexto.pausaMs,
				onProgresso:  contexto.progresso,
			})

			for (let idx = 0; idx < ids.length; idx++) {
				

				let r      = resultados[idx]
				let numero = t[idx]?.numero || ''
				let autor  = t[idx]?.autor  || ''

				for (let j of r?.PASSIVO || []) {
					let maisReclamadas = r?.PASSIVO.length === 1 ? 'Não' : 'Sim'  // ← fora do if
					d.push({
						documento:        j?.documento || '',
						processo:         numero,
						reclamada:        j?.nome,
						reclamante:       autor,
						Outras_Reclamadas: maisReclamadas,  // ← agora acessível
					})
				}
			}

			return d
		}
	},
	{
		nome: 'Lista número, partes, autuação, tarefa.',
		modo: ['Lista'],  // ← este botão só aparece no modo Tarefa
		funcao: async (contexto) => {
			let { ids, t } = await filtrarPorLista(contexto)
			console.log('%c[Rota PJE]%c ids: ' + JSON.stringify(ids), LOG.rosa, 'color:inherit')
			console.log('%c[Rota PJE]%c t: ' + JSON.stringify(t), LOG.rosa, 'color:inherit')
			if (!ids.length) return 'Nenhum processo encontrado.'

			let d = []

			//let resultados = await sf_pool(ids, async (id, idx) => {
			//	return await buscarProcesso(id, '/partes')
			//}, {
			//	concorrencia: contexto.concorrencia,
			//	tentativas:   contexto.tentativas,
			//	pausaMs:      contexto.pausaMs,
			//	onProgresso:  contexto.progresso,
			//})

			for (let idx = 0; idx < ids.length; idx++) {
				

				let numero 		= t[idx]?.numero || ''
				let tipo		= t[idx]?.descricaoClasseJudicial || ''
				let autor  		= t[idx]?.autor  || ''
				let reu			= t[idx]?.reu || ''
				let autuacao	= (new Date(t[idx]?.autuadoEm).toLocaleDateString('pt-BR')) || ''
				d.push({
					Processo:         	numero,
					Tipo:				tipo,
					Reclamada:        	reu,
					Reclamante:       	autor,
					Autuado_em: 		autuacao,
				})
				
			}

			return d
		}
	},
	{
    nome: 'Simetria sem GIG Gabinete',
	modo: ['Tarefa', 'Lista'],
		funcao: async (contexto) => {
			let ids = [], t = []
			if (contexto.modo === 'Tarefa') {
				;({ ids, t } = await filtrarPorTarefa(contexto, '&idEtiqueta=316'))
			} else if (contexto.modo === 'Lista') {
				;({ ids, t } = await filtrarPorLista(contexto))	
			}		
			//let { ids, t } = await filtrarPorTarefa(contexto, '&idEtiqueta=316')
			if (!ids.length) return 'Nenhum processo encontrado.'
/*
modo: ['Tarefa', 'Sala', 'Lista'],
		funcao: async (contexto) => {
			let ids = [], t = []

			if (contexto.modo === 'Tarefa') {
				;({ ids, t } = await filtrarPorTarefa(contexto))
			} else if (contexto.modo === 'Sala') {
				;({ ids, t } = await filtrarPorSala(contexto))
			} else if (contexto.modo === 'Lista') {
				;({ ids, t } = await filtrarPorLista(contexto))
			}
*/
			let d = []
			let numeros = t.map(tt => tt.numero)  // extrai os números dos processos para usar na nova API
			
			await sf_pool(numeros, async (numero, idx) => {
// ESTOU AQUI. a função nova do gig não está pronta. tem que conferir se t.numProcesso é a variável certa.
				
				let gigs = await buscarGigs(numero)  // nova API que traz tudo junto
				let ativos     = gigs.filter(gig => gig.statusAtividade !== 'Concluído')
				let concluidos = gigs.filter(gig => gig.statusAtividade === 'Concluído')

				let temAtivoGab = ativos.some(gig => /GAB.*JU.*/i.test(gig?.tipoAtividade?.descricao || ''))
				if (temAtivoGab) return  // tem ativo — não interessa

				// Não tem ativo — procura no concluído
				let gigConcluido = concluidos
					.find(gig => /GAB.*JU.*/i.test(gig?.tipoAtividade?.descricao || ''))
					?.tipoAtividade?.descricao ?? 'Não foi encontrado GIG de Gabinete concluído.'
				
				d.push({
					processo: numero,
					gig_concluido_encontrado:      gigConcluido,
					
				})
				
			}, {
				concorrencia: contexto.concorrencia,
				tentativas:   contexto.tentativas,
				pausaMs:      contexto.pausaMs,
				onProgresso:  contexto.progresso,
			})

			return d.length ? d : 'Nenhum processo encontrado sem GIG de Gabinete ativo.'
		}
	},
	// PROCESSOS SEM .PJC NA TAREFA
	{
    nome: 'Processos sem .pjc na tarefa',
	modo: ['Tarefa', 'Lista'],
		funcao: async (contexto) => {
			let ids = [], t = []

			if (contexto.modo === 'Tarefa') {
				;({ ids, t } = await filtrarPorTarefa(contexto))
			} else if (contexto.modo === 'Lista') {
				;({ ids, t } = await filtrarPorLista(contexto))
			}
			
			console.log('%c[Rota PJE]%c ids: ' + t, LOG.teste, 'color:inherit')
			//await suspender (5*60*1000)

			if (!ids.length) return 'Nenhum processo encontrado.'

			let d = []

			await sf_pool(ids, async (id, idx) => {
				// ... seu código aqui, com ids e t acessíveis
			
// ESTOU AQUI. a função nova do gig não está pronta. tem que conferir se t.numProcesso é a variável certa.
				relatar('ids: ' + JSON.stringify(ids), '', 'teste')
				let calculos = await buscarCalculos(id)  // nova API que traz tudo junto
				relatar('calculos: ' + JSON.stringify(calculos), '', 'teste')
				if (calculos?.totalRegistros === 0) {
					d.push({
						processo: 	t[idx]?.numero || '',
						autor:    	t[idx]?.autor  || '',
						reu:		t[idx]?.reu    || '',
						oj:			t[idx]?.descricaoOrgaoJulgador || '',
						tarefa:		t[idx]?.nomeTarefa || '',

						//pode adicionar mais campos aqui se quiser
					})
				}
				//await suspender(5*60*1000)  // pausa para ler os relatos
				//let temAtivoGab = ativos.some(gig => /GAB.*JU.*/i.test(gig?.tipoAtividade?.descricao || ''))
				//if (temAtivoGab) return  // tem ativo — não interessa

				// Não tem ativo — procura no concluído
				//let gigConcluido = concluidos
				//	.find(gig => /GAB.*JU.*/i.test(gig?.tipoAtividade?.descricao || ''))
				//	?.tipoAtividade?.descricao ?? 'Não foi encontrado GIG de Gabinete concluído.'
				
				//d.push({
				//	processo: numero,
				//	gig_concluido_encontrado:      gigConcluido,
				//	
				//})
				
			}, {
				concorrencia: contexto.concorrencia,
				tentativas:   contexto.tentativas,
				pausaMs:      contexto.pausaMs,
				onProgresso:  contexto.progresso,
			})

			return d.length ? d : 'Nenhum processo encontrado sem PJC.'
		}
	},
	// RECEBIMENTO DO TRT - Acordo, Sentença Anulada, Improcedência mantida
	{
    nome: 'Recebimento do TRT - Acordo, Sentença Anulada, Improcedência mantida',
	modo: [],
		funcao: async (contexto) => {
			let ids = [], t = []

			if (contexto.modo === 'Tarefa') {
				;({ ids, t } = await filtrarPorTarefa(contexto))
			} else if (contexto.modo === 'Lista') {
				;({ ids, t } = await filtrarPorLista(contexto))
			}
			relatar('ids', t, 'teste')
			//await suspender (5*60*1000)

			if (!ids.length) return 'Nenhum processo encontrado.'

			let d = []

			await sf_pool(ids, async (id, idx) => {

				let acordo_ou_improcedencia = ''  // ← declaração no topo

				let documentosemovimentos = await buscarDocumentosEMovimentos(id)

				// Improcedência
				if (documentosemovimentos.some(doc => /julgado\(s\) improcedente/i.test(doc.titulo))) {
					acordo_ou_improcedencia = 'Improcedência'
				}

				// Acordo
				if (!acordo_ou_improcedencia) {
					if (documentosemovimentos.some(doc =>
						/acordo(?!\s*coletivo)/i.test(doc.titulo) ||
						/acordo(?!\s*coletivo)/i.test(doc.tipo)
					)) {
						acordo_ou_improcedencia = 'Acordo'
					}
				}

				// Anulação via acórdão
				if (!acordo_ou_improcedencia) {
					let processaRecurso = documentosemovimentos.find(d => /para processar /i.test(d.titulo))
					if (processaRecurso) {
						let acordaos = documentosemovimentos.filter(d =>
							(/acórdão/i.test(d.tipo) || /decisão/i.test(d.tipo)) &&
							d.data >= processaRecurso.data &&
							d.documento === true
						)
						if (acordaos.length) {
							let termos = [
								'anular a sentenca',
								'anular a decisao',
								'tornar sem efeito a sentenca',
								'tornar sem efeito a decisao',
								'declarar a nulidade da sentenca',
								'declarar a nulidade da decisao',
								'tornar nula a sentenca',
								'tornar nula a decisao',
								'determinar a reabertura da instrucao',
								'reconheco a nulidade',
							]
							let regexAnulacao = new RegExp(termos.join('|'), 'i')
							let resultados = []
							for (let a of acordaos.slice(0, 3)) {
								resultados.push(await extrairTexto(id, a.id))
								await suspender(1000)
							}
							if (resultados.some(texto => regexAnulacao.test(normalizar(texto)))) {
								acordo_ou_improcedencia = 'Possível anulação da sentença'
							}
						}
					}
				}

				if (acordo_ou_improcedencia !== '') {
					d.push({
						processo: t[idx]?.numero || '',
						autor:    t[idx]?.autor  || '',
						reu:      t[idx]?.reu    || '',
						oj:       t[idx]?.descricaoOrgaoJulgador || '',
						tarefa:   t[idx]?.nomeTarefa || '',
						encontrado: acordo_ou_improcedencia
					})
				}

			}, {
				concorrencia: contexto.concorrencia,
				tentativas:   contexto.tentativas,
				pausaMs:      contexto.pausaMs,
				onProgresso:  contexto.progresso,
			})

			return d.length ? d : 'Nenhum processo encontrado.'
		}
	},
	{
		nome: 'Recebimento do TRT - Acordo, Improcedência.',
		modo: ['Tarefa', 'Lista'],
		funcao: async (contexto) => {
			let ids = [], t = []

			if (contexto.modo === 'Tarefa') {
				;({ ids, t } = await filtrarPorTarefa(contexto))
			} else if (contexto.modo === 'Lista') {
				;({ ids, t } = await filtrarPorLista(contexto))
			}
			relatar('ids', t, 'teste')
			//await suspender (5*60*1000)

			if (!ids.length) return 'Nenhum processo encontrado.'

			let d = []

			await sf_pool(ids, async (id, idx) => {

				let acordo_ou_improcedencia = ''  // ← declaração no topo

				let documentosemovimentos = await buscarDocumentosEMovimentos(id)

				// Improcedência
				if (documentosemovimentos.some(doc => /julgado\(s\) improcedente/i.test(doc.titulo))) {
					acordo_ou_improcedencia = 'Improcedência'
				}

				// Acordo
				if (!acordo_ou_improcedencia) {
					if (documentosemovimentos.some(doc =>
						/acordo(?!\s*coletivo)/i.test(doc.titulo) ||
						/acordo(?!\s*coletivo)/i.test(doc.tipo)
					)) {
						acordo_ou_improcedencia = 'Acordo'
					}
				}

				if (!acordo_ou_improcedencia) acordo_ou_improcedencia = 'Não'

				// Anulação via acórdão
				

				if (acordo_ou_improcedencia !== '') {
					d.push({
						processo: t[idx]?.numero || '',
						autor:    t[idx]?.autor  || '',
						reu:      t[idx]?.reu    || '',
						oj:       t[idx]?.descricaoOrgaoJulgador || '',
						tarefa:   t[idx]?.nomeTarefa || '',
						encontrado: acordo_ou_improcedencia
					})
				}

			}, {
				concorrencia: contexto.concorrencia,
				tentativas:   contexto.tentativas,
				pausaMs:      contexto.pausaMs,
				onProgresso:  contexto.progresso,
			})

			return d.length ? d : 'Nenhum processo encontrado.'
		}
	},
	{
		nome: 'Listar audiências na sala até a data escolhida. Exemplo: "NOME DA SALA, 31/12/2024".',
		modo: ['Sala'],
		funcao: async (contexto) => {
			let ids = [], t = []
			let juiz = contexto.valor.split(',')[0]?.trim() || ''
			let data = contexto.valor.split(',')[1]?.trim() || ''
			let dataTransformada = sf_botoesDataPraJS(data)
			console.log('%c[Rota PJE]%c Data transformada: ' + dataTransformada, LOG.teste, 'color:inherit')
			let hoje = new Date()
			let dias = parseInt((dataTransformada - hoje) / (1000 * 60 * 60 * 24))
			console.log('%c[Rota PJE]%c Dias até a data: ' + dias, LOG.teste, 'color:inherit')
			if (!juiz || !data || !dataTransformada) return 'Por favor, insira o nome do juiz e a data, separados por vírgula. Exemplo: "FULANO DE TAL, 31/12/2024".'
			if (contexto.modo === 'Sala') {
				;({ ids, t } = await buscarProcessosPorSala(juiz, dias))
			}
			console.log('%c[Rota PJE]%c ids: ' + t, LOG.teste, 'color:inherit')
			//return
			//await suspender (5*60*1000)

			if (!ids.length) return 'Nenhum processo encontrado.'

			let d = []
			
			const formatarHora = h => h ? h.slice(0, 5).replace(':', 'h') : '';
			const formatarData = d => d ? d.slice(0, 10).split('-').reverse().join('/') : '';
			const limiteSimet = new Date('2025-10-19');

			for (let id in t) {
				const horarioRaw = t[id]?.pautaAudienciaHorario?.horaInicial || '';
				const dataRaw = t[id]?.data || '';
				const autuacaoRaw = t[id]?.processo?.autuadoEm || '';
				const autuacaoDate = new Date(autuacaoRaw.slice(0, 10));
				const processo = t[id]?.nrProcesso || '';

				d.push({
					processo: processo,
					horario: formatarHora(horarioRaw),
					data: formatarData(dataRaw),
					autuacao: formatarData(autuacaoRaw),
					simetriaOuLegado: processo === '' ? '' : autuacaoDate > limiteSimet ? 'SIMETRIA' : 'LEGADO',				});
			}

			return d.length ? d : 'Nenhum processo encontrado.'
		}
	},
	// ── Adicione seus botões abaixo ───────────────────────────
	// {
	// 	nome: 'Nome do botão',
	// 	funcao: async (contexto) => {
	// 		let { ids, t } = await filtrarPorTarefa(contexto)
	// 		if (!ids.length) return 'Nenhum processo encontrado.'
	//
	// 		let resultados = await sf_pool(ids, async (id, idx) => {
	// 			return await buscarProcesso(id, '/partes')  // ou qualquer outra função
	// 		}, {
	// 			concorrencia: 5,
	// 			onProgresso:  contexto.progresso,
	// 		})
	//
	// 		// monte e retorne o array de resultados
	// 	}
	// },

]

function sf_botoesDataPraJS(str) {
  const [d, m, a] = str.split('/');
  return new Date(a, m - 1, d);
}
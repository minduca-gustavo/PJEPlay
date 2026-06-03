// ============================================================
// porta-de-entrada.js
//
// Funções que recebem o contexto do superfiltro (modo + valor)
// e retornam { ids, t } onde:
//   ids → array de IDs internos do processo
//   t   → array paralelo de objetos já buscados (evita requisição extra
//          no funcoes-da-planilha quando o dado já veio junto)
//
// O `i` nos scripts da planilha é o ID interno do processo.
// O `t` nos scripts da planilha é o objeto correspondente ao processo.
// ============================================================


// ── BUSCAR POR TAREFA ─────────────────────────────────────────

async function buscarProcessosPorTarefa(nomeTarefa, param = '', opcoes = {}) {
    let tarefasAtivas = await rota_fetch(
        location.origin + '/pje-comum-api/api/agrupamentotarefas/tarefas/todos'
    )
    let tarefa = tarefasAtivas.filter(t => t.nome === nomeTarefa)
    if (!tarefa[0]) {
        relatar('Tarefa não encontrada: ' + nomeTarefa, '', 'erro')
        return { ids: [], t: [] }
    }

    relatar('Tarefa encontrada: ' + JSON.stringify(tarefa[0].id), '', 'resposta')

    // Página 1 para descobrir quantas páginas existem
    let loop = await _idPorPaginaTarefa(1, tarefa[0].id, param)
    let nloop = loop.paginas
    let ids = loop.ids
    let t   = loop.t

    if (nloop > 1) {
        let paginas = []
        for (let i = 2; i <= nloop; i++) paginas.push(i)

        let resultados = await sf_pool(paginas, async (pagina) => {
            return await _idPorPaginaTarefa(pagina, tarefa[0].id, param)
        }, {
            concorrencia: opcoes.concorrencia ?? 10,
            tentativas:   opcoes.tentativas   ?? 2,
            pausaMs:      opcoes.pausaMs       ?? 100,
        })

        resultados.forEach(r => {
            if (!r) return
            r.ids.forEach(n => ids.push(n))
            r.t.forEach(n => t.push(n))
        })
    }

    return { ids, t }
}

async function _idPorPaginaTarefa(pagina, idTarefa, param = '') {
	let paginacao = await rota_fetch(
		location.origin + '/pje-administracao-api/api/consultaprocessosadm?pagina=' + pagina +
		'&idTarefa=' + idTarefa + param + '&tamanhoPagina=100'
	)
	let paginas  = paginacao?.qtdPaginas || 1
	let resultado = paginacao?.resultado || []
	let ids = resultado.map(j => j.id)
	return { paginas, ids, t: resultado }
}


// ── BUSCAR POR SALA ───────────────────────────────────────────

async function buscarProcessosPorSala(nomeSala, qtdeDias = 30, opcoes = {}) {
    let ojAguarda = await aguardarElemento('[class*="papel-usuario"]', 12000)
    let ojAtivo = ojAguarda?.innerText || ''
    relatar('OJ ativo: ' + ojAtivo, '', 'resposta')

    let orgaosJulgadores = await rota_fetch(
        location.origin + '/pje-comum-api/api/orgaosjulgadores/'
    )
    let orgaoJulgadorAtivo = orgaosJulgadores.filter(o => o.descricao === ojAtivo)
    if (!orgaoJulgadorAtivo[0]) {
        relatar('Órgão julgador não encontrado: ' + ojAtivo, '', 'erro')
        return { ids: [], t: [] }
    }

    let salasExistentes = await rota_fetch(
        location.origin + '/pje-comum-api/api/salasaudiencias?idOrgaoJulgador=' + orgaoJulgadorAtivo[0].id
    )
    let salaRequerida = salasExistentes.filter(o => o.nome === nomeSala)
    if (!salaRequerida[0]) {
        relatar('Sala não encontrada: ' + nomeSala, '', 'erro')
        return { ids: [], t: [] }
    }
    relatar('Sala encontrada: ' + JSON.stringify(salaRequerida[0]), '', 'resposta')

    const datas = []
    for (let i = 0; i < qtdeDias; i++) {
        const d = new Date()
        d.setDate(d.getDate() + i)
        datas.push(d.toISOString().slice(0, 10))
    }

    const ids = []
    const t   = []

    let resultados = await sf_pool(datas, async (data) => {
        return await _idNaSalaPorData(salaRequerida[0].id, data)
    }, {
        concorrencia: opcoes.concorrencia ?? 5,
        tentativas:   opcoes.tentativas   ?? 2,
        pausaMs:      opcoes.pausaMs       ?? 100,
    })

    resultados.forEach(r => {
        if (!r) return
        r.ids.forEach(n => ids.push(n))
        r.t.forEach(n => t.push(n))
    })

    return { ids, t }
}

async function _idNaSalaPorData(idSala, data) {
	let pautas = await rota_fetch(
		location.origin + '/pje-comum-api/api/pautasaudiencias/classificacoes/dia?idSalaAudiencia=' + idSala + '&data=' + data
	)
	let pautasDoDia = pautas?.pautasDoDia || []
	let ids = []
	let t   = []
	for (let k of pautasDoDia) {
		t.push(k)
		if (k.idProcesso != null) ids.push(k.idProcesso)
	}
	relatar('Sala/data ' + data + ': ' + ids.length + ' processo(s)', '', 'teste')
	return { ids, t }
}


// ── BUSCAR POR LISTA ──────────────────────────────────────────

async function buscarProcessosPorLista(lista, opcoes = {}) {
    const ids = []
    const t   = []

    let resultados = await sf_pool(lista, async (numero) => {
        return await _rota_buscarIdProcessoEDados(numero)
    }, {
        concorrencia: opcoes.concorrencia ?? 5,
        tentativas:   opcoes.tentativas   ?? 2,
        pausaMs:      opcoes.pausaMs       ?? 500,
    })

    resultados.forEach(r => {
        if (!r) return
        let { id, ...resto } = r
        ids.push(id)
        t.push(resto)
    })

    return { ids, t }
}


// ── FILTROS POR MODO ──────────────────────────────────────────
// Todos retornam { ids, t } padronizado.

// ── FILTROS POR MODO ──────────────────────────────────────────

async function filtrarPorTarefa(contexto, param = '') {
    if (contexto.modo !== 'Tarefa' || !contexto.valor) return { ids: [], t: [] }
    let opcoes = {
        concorrencia: contexto.concorrencia,
        tentativas:   contexto.tentativas,
        pausaMs:      contexto.pausaMs,
    }
    return await buscarProcessosPorTarefa(contexto.valor, param, opcoes)
}

async function filtrarPorSala(contexto) {
    if (contexto.modo !== 'Sala' || !contexto.valor) return { ids: [], t: [] }
    let opcoes = {
        concorrencia: contexto.concorrencia,
        tentativas:   contexto.tentativas,
        pausaMs:      contexto.pausaMs,
    }
    return await buscarProcessosPorSala(contexto.valor, 30, opcoes)
}

// ── FILTROS POR MODO ──────────────────────────────────────────

async function filtrarPorLista(contexto) {
    if (!contexto.lista || !contexto.lista.length) return { ids: [], t: [] }
    let opcoes = {
        concorrencia: contexto.concorrencia,
        tentativas:   contexto.tentativas,
        pausaMs:      contexto.pausaMs,
    }
    return await buscarProcessosPorLista(contexto.lista, opcoes)
}


// ── EXECUTAR COM PLANILHA ─────────────────────────────────────
//
// Recebe o contexto do superfiltro e um array de scripts (células B).
// Passa tanto o id quanto o objeto t correspondente para cada script.
// Retorna linhas TSV para exibição.

async function entradaComPlanilha(contexto, scripts) {
	let resultado = { ids: [], t: [] }

	if (contexto.modo === 'Tarefa')      resultado = await filtrarPorTarefa(contexto)
	else if (contexto.modo === 'Sala')   resultado = await filtrarPorSala(contexto)
	else if (contexto.modo === 'Lista')  resultado = await filtrarPorLista(contexto)

	if (!resultado.ids.length) return []

	return await planilha_executar(scripts, resultado.ids, resultado.t)
}

async function _rota_buscarIdProcessoEDados(numero){
	
	let dados = await buscarIdPeloNumeroCNJ(numero)
	
	return dados || null
	
}
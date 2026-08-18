// ============================================================
// porta-de-entrada.js
//
// Funções de busca "página única": cada função aqui faz UMA
// requisição ao servidor. Quem decide quantas páginas existem
// e roda o loop sequencial (com await, sem concorrência) é
// quem chama — normalmente filtros-novos.js.
//
// O `i` nos scripts da planilha é o ID interno do processo.
// O `t` nos scripts da planilha é o objeto correspondente ao processo.
//
// Os wrappers antigos (buscarProcessosPorTarefa/PorGig/PorSala/PorLista
// e filtrarPorTarefa/PorSala/PorLista) continuam existindo no fim do
// arquivo — usados por entradaComPlanilha — mas agora também fazem o
// loop com await sequencial em vez de sf_pool, para não haver mais
// requisições simultâneas em lugar nenhum deste arquivo.
// ============================================================


// ── TAREFA ─────────────────────────────────────────────────────

// Resolve o nome da tarefa para o objeto da tarefa (1 requisição).
async function resolverTarefa(nomeTarefa) {
    let tarefasAtivas = await rota_fetch(
        location.origin + '/pje-comum-api/api/agrupamentotarefas/tarefas/todos'
    )
    let tarefa = tarefasAtivas.filter(t => t.nome === nomeTarefa)
    if (!tarefa[0]) {
        relatar('Tarefa não encontrada: ' + nomeTarefa, '', 'erro')
        return null
    }
    relatar('Tarefa encontrada: ' + JSON.stringify(tarefa[0].id), '', 'resposta')
    return tarefa[0]
}

// Busca uma única página de processos de uma tarefa (1 requisição).
async function buscarProcessosPorTarefaPagina(idTarefa, pagina, param = '') {
    let paginacao = await rota_fetch(
        location.origin + '/pje-administracao-api/api/consultaprocessosadm?pagina=' + pagina +
        '&idTarefa=' + idTarefa + param + '&tamanhoPagina=100'
    )
    let paginas   = paginacao?.qtdPaginas || 1
    let resultado = paginacao?.resultado || []
    let ids = resultado.map(j => j.id)
    return { paginas, ids, t: resultado }
}


// ── GIG ────────────────────────────────────────────────────────

// Resolve o nome do gig para a lista de gigs correspondentes (1 requisição).
async function resolverGigs(nomeGig = '') {
    let gigsAtivos = await rota_fetch(
        location.origin + '/pje-gigs-api/api/relatorioatividades/tiposatividades'
    )
    let gigs = gigsAtivos.filter(g => g.descricao.includes(nomeGig))
    if (!gigs.length) {
        relatar('Gig não encontrada: ' + nomeGig, '', 'erro')
        return []
    }
    relatar('Gig encontrada: ' + JSON.stringify(gigs[0].id), '', 'resposta')
    return gigs
}

// Busca uma única página de processos de um gig (1 requisição).
async function buscarProcessosPorGigPagina(idGig, pagina) {
    let paginacao = await rota_fetch(
        location.origin + '/pje-gigs-api/api/relatorioatividades/?tipo=' + idGig + '&pagina=' + pagina + '&tamanhoPagina=100&ordenacaoCrescente=true&filtrarPorDestinatario=false&filtrarPorLocalizacao=false'
    )
    let paginas   = paginacao?.qtdPaginas || 1
    let resultado = paginacao?.resultado || []
    let ids = resultado.map(j => j.id)
    return { paginas, ids, t: resultado }
}


// ── SALA ───────────────────────────────────────────────────────

// Resolve o nome da sala (a partir do OJ ativo na tela) para o objeto
// da sala (2 requisições: órgãos julgadores + salas — é resolução,
// não paginação, então roda uma vez só por busca).
async function resolverSala(nomeSala) {
    let ojAguarda = await aguardarElemento('[class*="papel-usuario"]', 12000)
    let ojAtivo = ojAguarda?.innerText || ''
    relatar('OJ ativo: ' + ojAtivo, '', 'resposta')

    let orgaosJulgadores = await rota_fetch(
        location.origin + '/pje-comum-api/api/orgaosjulgadores/'
    )
    let orgaoJulgadorAtivo = orgaosJulgadores.filter(o => o.descricao === ojAtivo)
    if (!orgaoJulgadorAtivo[0]) {
        relatar('Órgão julgador não encontrado: ' + ojAtivo, '', 'erro')
        return null
    }

    let salasExistentes = await rota_fetch(
        location.origin + '/pje-comum-api/api/salasaudiencias?idOrgaoJulgador=' + orgaoJulgadorAtivo[0].id
    )
    let salaRequerida = salasExistentes.filter(o => o.nome === nomeSala)
    if (!salaRequerida[0]) {
        relatar('Sala não encontrada: ' + nomeSala, '', 'erro')
        return null
    }
    relatar('Sala encontrada: ' + JSON.stringify(salaRequerida[0]), '', 'resposta')
    return salaRequerida[0]
}

// Monta a lista de datas (AAAA-MM-DD) a partir de hoje. Não faz requisição.
function listarDatasParaSala(qtdeDias = 30) {
    const datas = []
    for (let i = 0; i < qtdeDias; i++) {
        const d = new Date()
        d.setDate(d.getDate() + i)
        datas.push(d.toISOString().slice(0, 10))
    }
    return datas
}

// Busca os processos de uma sala em uma única data (1 requisição).
async function buscarProcessosNaSalaPorData(idSala, data) {
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


// ── LISTA (por número CNJ) ────────────────────────────────────

// Busca um único processo pelo número CNJ (1 requisição).
async function buscarProcessoDaLista(numero) {
    let dados = await buscarIdPeloNumeroCNJ(numero)
    return dados || null
}

// Mantido por compatibilidade — mesma função de antes, chamada de
// dentro de um loop (uma requisição por chamada).
async function _rota_buscarIdProcessoEDados(numero) {
    let dados = await buscarIdPeloNumeroCNJ(numero)
    return dados || null
}


// ============================================================
// A partir daqui: wrappers "agregadores" — mantidos para quem
// ainda depende do contrato antigo { ids, t } com todas as páginas
// já reunidas (entradaComPlanilha / superfiltro). Por dentro, agora
// rodam em série com await, nunca em paralelo.
// ============================================================

async function buscarProcessosPorTarefa(nomeTarefa, param = '') {
    let tarefa = await resolverTarefa(nomeTarefa)
    if (!tarefa) return { ids: [], t: [] }

    let r = await buscarProcessosPorTarefaPagina(tarefa.id, 1, param)
    let ids = r.ids
    let t   = r.t
    for (let pagina = 2; pagina <= r.paginas; pagina++) {
        let rp = await buscarProcessosPorTarefaPagina(tarefa.id, pagina, param)
        ids.push(...rp.ids)
        t.push(...rp.t)
    }
    return { ids, t }
}

async function buscarProcessosPorGig(nomeGig = '') {
    let gigs = await resolverGigs(nomeGig)
    if (!gigs.length) return { ids: [], t: [] }

    let ids = []
    let t   = []
    for (let gig of gigs) {
        let r = await buscarProcessosPorGigPagina(gig.id, 1)
        ids.push(...r.ids)
        t.push(...r.t)
        for (let pagina = 2; pagina <= r.paginas; pagina++) {
            let rp = await buscarProcessosPorGigPagina(gig.id, pagina)
            ids.push(...rp.ids)
            t.push(...rp.t)
        }
    }
    return { ids, t }
}

async function buscarProcessosPorSala(nomeSala, qtdeDias = 30) {
    let sala = await resolverSala(nomeSala)
    if (!sala) return { ids: [], t: [] }

    let ids = []
    let t   = []
    for (let data of listarDatasParaSala(qtdeDias)) {
        let r = await buscarProcessosNaSalaPorData(sala.id, data)
        ids.push(...r.ids)
        t.push(...r.t)
    }
    return { ids, t }
}

async function buscarProcessosPorLista(lista) {
    let ids = []
    let t   = []
    for (let numero of lista) {
        let r = await _rota_buscarIdProcessoEDados(numero)
        if (!r) continue
        let { id, ...resto } = r
        ids.push(id)
        t.push(resto)
    }
    return { ids, t }
}


// ── FILTROS POR MODO ──────────────────────────────────────────
// Todos retornam { ids, t } padronizado. Mantidos para entradaComPlanilha.

async function filtrarPorTarefa(contexto, param = '') {
    if (contexto.modo !== 'Tarefa' || !contexto.valor) return { ids: [], t: [] }
    return await buscarProcessosPorTarefa(contexto.valor, param)
}

async function filtrarPorSala(contexto) {
    if (contexto.modo !== 'Sala' || !contexto.valor) return { ids: [], t: [] }
    return await buscarProcessosPorSala(contexto.valor, 30)
}

async function filtrarPorLista(contexto) {
    if (!contexto.lista || !contexto.lista.length) return { ids: [], t: [] }
    return await buscarProcessosPorLista(contexto.lista)
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
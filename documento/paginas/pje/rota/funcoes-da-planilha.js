// ============================================================
// funcoes-da-planilha.js
//
// Funções-base disponíveis nos scripts das células da planilha.
// Cada célula (coluna B da planilha) contém um "script" em JS
// executado com as seguintes variáveis no escopo:
//
//   i → ID interno do processo (número)
//   t → objeto já buscado pela porta-de-entrada (pode ser null
//       quando o modo for Lista — verifique antes de usar)
//
// Funções disponíveis:
//   buscarIdPeloNumeroCNJ(i)             → dados básicos do processo (pje-consulta-api)
//   buscarCalculos(i)                 → cálculos do processo
//   buscarDocumentos(i)               → documentos da timeline (documento===true)
//   buscarDocumentosEMovimentos(i)    → toda a timeline (documentos + movimentos)
//   buscarChips(i)                    → etiquetas/chips do processo
//   buscarGigs(numProc)               → gigs do processo (recebe número, ex: '0011486-22...')
//   buscarMovimentos(i)               → movimentos da timeline (documento===false)
//   buscarProcesso(i, path)           → endpoint genérico: /pje-comum-api/api/processos/id/:i + path
//
// O script deve retornar string, número, array ou null/undefined.
// Arrays são joinados com tab. Objetos genéricos têm seus valores joinados.
//
// Exemplo de script em célula (aproveita t vindo da tarefa):
//   if(t) return t.numeroProcesso + '\t' + t.nomeTarefa
//   let base = await b(i)
//   return base?.numeroProcesso || ''
// ============================================================


// ── BUSCA DADOS BÁSICOS ───────────────────────────────────────

async function buscarIdPeloNumeroCNJ(qualquerFormatoDeNumero) {
    let numLimpo = qualquerFormatoDeNumero.replace(/[.\-]/g, '')
    if (numLimpo.length !== 20) return null
    let numero = numLimpo.replace(
        /^(\d{7})(\d{2})(\d{4})(\d{1})(\d{2})(\d{4})$/,
        '$1-$2.$3.$4.$5.$6'
    )
    let dados = (await rota_fetch(
        location.origin + '/pje-administracao-api/api/consultaprocessosadm?pagina=1&numero=' + numero
    ))?.resultado || await rota_fetch(
        location.origin + '/pje-consulta-api/api/processos/dadosbasicos/' + numero
    )
    if (Array.isArray(dados?.resultado)) return dados.resultado[0] || null
    if (Array.isArray(dados))            return dados[0] || null
    return dados || null
}

// https://pje-web-hm.trt15.jus.br/pje-comum-api/api/agrupamentotarefas/processos?numero=0010001-50.2026.5.15.0144

// Abre a tarefa mais recente do processo
async function buscarTarefaMaisRecente(idProcesso = '') {
    const id = idProcesso || _acao_idProcesso()
    if (!id) return

    const url     = `${location.origin}/pje-comum-api/api/processos/id/${id}/tarefas?maisRecente=true`
    const dados   = await rota_fetch(url)
    const tarefa  = Array.isArray(dados) ? dados[0] : dados
    const idTarefa = tarefa?.idTarefa

    if (!idTarefa) return relatar('acao_navegacao_tarefa: tarefa não encontrada', '', 'erro')

    return dados
}

// ── BUSCA CÁLCULOS ────────────────────────────────────────────

async function buscarCalculos(i) {
	let dados = await rota_fetch(
		location.origin + '/pje-comum-api/api/calculos/processo?pagina=1&tamanhoPagina=10' +
		'&ordenacaoCrescente=true&idProcesso=' + i + '&incluirCalculosHomologados=true'
	)
	if (!Array.isArray(dados)) dados = dados || []
	relatar('dados de cálculos: ' + JSON.stringify(dados), '', 'teste')
	return dados
}


// ── BUSCA DOCUMENTOS ─────────────────────────────────────────

async function buscarDocumentos(i) {
	let dados = await rota_fetch(
		location.origin + '/pje-comum-api/api/processos/id/' + i + '/timeline?somenteDocumentosAssinados=true&buscarMovimentos=false&buscarDocumentos=true'
	)
	if (!Array.isArray(dados)) dados = dados?.conteudo || dados?.content || []
	return dados.filter(entry => entry.documento === true)
}

// ── BUSCA DOCUMENTOS E MOVIMENTOS ─────────────────────────────────────────

async function buscarDocumentosEMovimentos(i) {
	let dados = await rota_fetch(
		location.origin + '/pje-comum-api/api/processos/id/' + i + '/timeline'
	)
	if (!Array.isArray(dados)) dados = dados?.conteudo || dados?.content || []
	return dados
}


// ── BUSCA ETIQUETAS/CHIPS ────────────────────────────────────

async function buscarChips(i) {
	let dados = await rota_fetch(
		location.origin + '/pje-etiquetas-api/api/processos/' + i + '/etiquetas'
	)
	if (!Array.isArray(dados)) dados = dados?.conteudo || dados?.content || []
	return dados
}

//async function extrairTexto(idProcesso, idDocumento) {
//    let url = `${location.origin}/pje-comum-api/api/processos/id/${idProcesso}/documentos/id/${idDocumento}/conteudo?incluirCapa=false&incluirAssinatura=true`
//    
//    let res = await fetch(url, { credentials: 'include' })
//    if (!res.ok) throw new Error(`HTTP ${res.status}`)
//    relatar('res', res, 'teste')
//    let buf  = await res.arrayBuffer()
//    let resp = await NAVEGADOR.runtime.sendMessage({
//        tipo: 'EXTRAIR_PDF', bytes: Array.from(new Uint8Array(buf))
//    })
//	relatar('resp', resp, 'teste')
//    if (!resp.ok) throw new Error(resp.erro)
//    return resp.texto
//}

async function extrairTexto(idProcesso, idDocumento) {
    let url  = `${location.origin}/pje-comum-api/api/processos/id/${idProcesso}/documentos/id/${idDocumento}/conteudo?incluirCapa=false&incluirAssinatura=true`
    let res  = await fetch(url, { credentials: 'include' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    let contentType = res.headers.get('content-type') || ''

    if (contentType.includes('application/pdf')) {
        let bytes = Array.from(new Uint8Array(await res.arrayBuffer()))
        let resp  = await NAVEGADOR.runtime.sendMessage({ tipo: 'EXTRAIR_PDF', bytes })
        if (!resp.ok) throw new Error(resp.erro)
        return resp.texto
    }

    if (contentType.includes('application/json')) {
		let json  = await res.json()
		let b64   = json.conteudoBase64.trim()
		let bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
		let html  = new TextDecoder('iso-8859-1').decode(bytes)

		if (html.startsWith('%PDF')) {
			let resp = await NAVEGADOR.runtime.sendMessage({
				tipo: 'EXTRAIR_PDF', bytes: Array.from(bytes)
			})
			if (!resp.ok) throw new Error(resp.erro)
			return resp.texto
		}

		let doc = new DOMParser().parseFromString(html, 'text/html')
		return doc.body.innerText
	}

    // Fallback: texto puro
    return res.text()
}

async function extrairTextoTeste(idProcesso, idDocumento) {
    let url = `${location.origin}/pje-comum-api/api/processos/id/${idProcesso}/documentos/id/${idDocumento}/conteudo?incluirCapa=false&incluirAssinatura=true`
    let res  = await fetch(url, { credentials: 'include' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    let contentType = res.headers.get('content-type') || ''
    let bytes

    if (contentType.includes('application/pdf')) {
        bytes = Array.from(new Uint8Array(await res.arrayBuffer()))
    } else if (contentType.includes('application/json')) {
        let json   = await res.json()
        // Loga pra ver a estrutura uma vez só
        let b64    = json.conteudo ?? json.content ?? json.data ?? json
        let binStr = atob(b64.trim())
        bytes      = Array.from({ length: binStr.length }, (_, i) => binStr.charCodeAt(i))
    } else {
        // Fallback: tenta base64 puro
        let b64    = (await res.text()).trim()
        let binStr = atob(b64)
        bytes      = Array.from({ length: binStr.length }, (_, i) => binStr.charCodeAt(i))
    }

    let resp = await NAVEGADOR.runtime.sendMessage({ tipo: 'EXTRAIR_PDF', bytes })
    if (!resp.ok) throw new Error(resp.erro)
    return resp.texto
}


// ── BUSCA GIGS ───────────────────────────────────────────────
// concluida=false → gigs abertas; concluida=true → gigs concluídas
// https://pje.trt15.jus.br/pje-gigs-api/api/relatorioatividades/?&numeroProcesso=0011486-22.2023.5.15.0005
/*
pagina	1
tamanhoPagina	20
qtdPaginas	1
totalRegistros	2
resultado	
0	
id	10624191
idProcesso	3802090
processo	
id	3802090
numero	"0011486-22.2023.5.15.0005"
classeJudicial	
descricao	"ATSum"
segredoDeJustica	false
temComentario	false
temOcorrenciaImpedimento	false
ocorrenciaImpedimentoVisivelOj	false
orgaoJulgador	
id	75
descricao	"1ª Vara do Trabalho de Bauru"
sigla	"VT005"
orgaoJulgadorColegiado	{}
nomeTarefa	"Arquivo"
idTarefa	552
tarefaVisivelOj	true
tarefaVisivelOjc	false
faseProcessual	"ARQUIVADO"
nomeParteAutora	"ANA LAURA ROCHA DE CARVALHO"
nomeParteRe	"CORPOREOS - SERVICOS TERAPEUTICOS S.A."
juizoDigital	true
tipoAtividade	
id	24
descricao	"Prazo"
descricaoConsulta	"PRAZO"
dataPrazo	"2000-01-01T00:00:00"
observacao	"ACORDO CEJUSC"
idUsuarioDestinatario	201725
nomeUsuarioDestinatario	"FRANCINE CASEMIRO"
statusAtividade	"Vencido"
usuarioCriacao	"MATHEUS DE ALMEIDA PERNAMBUCO"
dataCriacao	"2025-08-22T12:18:07.95044"
usuarioAlteracao	"MATHEUS DE ALMEIDA PERNAMBUCO"
dataAlteracao	"2025-09-24T14:24:52.973495"
destaque	false
idOrgaoJulgador	75
1	
id	7638163
idProcesso	3802090
processo	
id	3802090
numero	"0011486-22.2023.5.15.0005"
classeJudicial	
descricao	"ATSum"
segredoDeJustica	false
temComentario	false
temOcorrenciaImpedimento	false
ocorrenciaImpedimentoVisivelOj	false
orgaoJulgador	
id	75
descricao	"1ª Vara do Trabalho de Bauru"
sigla	"VT005"
orgaoJulgadorColegiado	{}
nomeTarefa	"Arquivo"
idTarefa	552
tarefaVisivelOj	true
tarefaVisivelOjc	false
faseProcessual	"ARQUIVADO"
nomeParteAutora	"ANA LAURA ROCHA DE CARVALHO"
nomeParteRe	"CORPOREOS - SERVICOS TERAPEUTICOS S.A."
juizoDigital	true
tipoAtividade	
id	27
descricao	"Recurso Autor"
descricaoConsulta	"RECURSO AUTOR"
dataTermino	"2024-09-10T00:00:00"
statusAtividade	"Concluído"
usuarioCriacao	"DANIELA MORETTO VARGAS"
dataCriacao	"2024-09-02T12:06:13.478724"
usuarioAlteracao	"SANDRA KAORI TSUJI"
dataAlteracao	"2024-09-10T16:57:14.57807"
destaque	false
idOrgaoJulgador	75
*/

async function buscarGigs(numProc) {
	
	let dados = await rota_fetch(
		location.origin + '/pje-gigs-api/api/relatorioatividades/?&numeroProcesso=' + numProc
	)
	if (!Array.isArray(dados)) dados = dados?.resultado || []
	return dados
}



// ── BUSCA AUDIENCIAS ─────────────────────────────────────────

async function buscarAudienciasMarcadas(id) {
	
	let dados = await rota_fetch(
		location.origin + '/pje-comum-api/api/processos/id/' + id + '/audiencias?status=M'
	)
	if (Array.isArray(dados)) dados = dados[0] || {}
	return dados
}
//pje-comum-api/api/processos/id/4696341/audiencias?status=M

// ── BUSCA MOVIMENTOS ─────────────────────────────────────────

async function buscarMovimentos(i) {
	let dados = await rota_fetch(
		location.origin + '/pje-comum-api/api/processos/id/' + i + '/timeline?somenteDocumentosAssinados=true&buscarMovimentos=true&buscarDocumentos=false'
	)
	if (!Array.isArray(dados)) dados = dados?.conteudo || dados?.content || []
	return dados.filter(entry => entry.documento === false)
}


// ── ENDPOINT GENÉRICO DE PROCESSO ────────────────────────────
// p(i)         → /pje-comum-api/api/processos/id/:i
// p(i, '/partes') → /pje-comum-api/api/processos/id/:i/partes

async function buscarProcesso(i, path = '') {
	let dados = await rota_fetch(
		location.origin + '/pje-comum-api/api/processos/id/' + i + path
	)
	if (Array.isArray(dados)) return dados[0] || null
	return dados || null
}

async function buscarSalas(idOrgaoJulgador) {
	let dados = await rota_fetch(
		location.origin + '/pje-comum-api/api/salasaudiencias?idOrgaoJulgador=' + idOrgaoJulgador
	)
	return dados || null
}

async function buscarSalasHorariosVagos(idSala) {
	let url = location.origin + '/pje-comum-api/api/pautasaudiencias/horariosvagos?idSalaFisica=' + idSala
	let dados = await rota_fetch(
		url
	)
	return dados || null
}


// ── POOL DE CONCORRÊNCIA ──────────────────────────────────────
//
// Executa uma lista de tarefas async com no máximo `concorrencia`
// simultâneas, com retry automático e callback de progresso.
//
// Uso:
//   let resultados = await sf_pool(ids, async (id, idx, total) => {
//       return await p(id, '/partes')
//   }, { concorrencia: 5, tentativas: 2, pausaMs: 200 })

async function sf_pool(itens, fn, opcoes = {}) {
	let {
		concorrencia = 5,
		tentativas   = 2,
		pausaMs      = 100,
		onProgresso  = null,   // callback(feitos, total, item)
	} = opcoes

	let total      = itens.length
	let feitos     = 0
	let resultados = new Array(total)
	let fila       = itens.map((item, idx) => ({ item, idx }))
	let ativas     = 0
	let posicao    = 0

	async function _executar({ item, idx }) {
		let tentativa = 0
		while (true) {
			try {
				let r = await fn(item, idx, total)
				resultados[idx] = r
				break
			} catch (err) {
				tentativa++
				if (tentativa >= tentativas) {
					relatar('sf_pool erro [' + idx + ']: ' + err.message, '', 'erro')
					resultados[idx] = null
					break
				}
				await suspender(500 * tentativa)
			}
		}
		feitos++
		if (onProgresso) onProgresso(feitos, total, item)
		console.log('[SF] ' + feitos + ' / ' + total)
	}

	// Processa com pool de concorrência
	await new Promise(resolver => {
		function proxima() {
			while (ativas < concorrencia && posicao < fila.length) {
				let tarefa = fila[posicao++]
				ativas++
				suspender(pausaMs).then(() => _executar(tarefa)).then(() => {
					ativas--
					if (posicao < fila.length) {
						proxima()
					} else if (ativas === 0) {
						resolver()
					}
				})
			}
			if (fila.length === 0) resolver()
		}
		proxima()
	})

	return resultados
}

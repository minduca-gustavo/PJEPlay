// ============================================================
// janelas.js
// Pipeline de janelas do PJE Play.
// ============================================================


// ── Z-index ───────────────────────────────────────────────────
const ROTA_Z = { btn: 9000, widget: 9100, aviso: 9300, modal: 9400, painel: 9500 }


// ── Estado global do pipeline ─────────────────────────────────
let _rota_fila         = []
let _rota_cursor       = 0
let _rota_ativo        = false
let _rota_relatorio    = []
let _rota_janelasMundo = []

// ── Chave de persistência do pipeline (sobrevive ao reload) ──
const ROTA_KEY_PIPELINE = 'pjerota_pipeline_retomar'

// Contexto do processarCursor em execução — acessível por _rota_garantirOJCorreta
let _rota_slots_ativos        = []
let _rota_tarefaUnica_ativa   = ''
let _rota_temporizador_ativo  = { ativo: false, segundos: 30, opcoes: '' }

// Salva fila + cursor + config da tarefa no storage antes de recarregar
async function rota_pipeline_salvar(slots, tarefaUnica, temporizador){
	let cfg = await obterArmazenamento(['tarefaAtiva', 'tarefas', 'tarefaAtivaIsSistema'])
	await armazenar({
		[ROTA_KEY_PIPELINE]: {
			fila:        _rota_fila,
			cursor:      _rota_cursor,
			relatorio:   _rota_relatorio,
			slots:       slots,
			tarefaUnica: tarefaUnica,
			temporizador:temporizador,
			tarefaAtiva: cfg?.tarefaAtiva || '',
			isSistema:   cfg?.tarefaAtivaIsSistema === true,
		}
	})
}

// Tenta retomar pipeline persistido após reload
async function rota_pipeline_retomar(){
	let cfg = await obterArmazenamento(ROTA_KEY_PIPELINE)
	let dados = cfg?.[ROTA_KEY_PIPELINE]
	if(!dados || !dados.fila?.length) return
	// Limpa imediatamente para não retomar duas vezes
	await armazenar({ [ROTA_KEY_PIPELINE]: null })
	_rota_fila      = dados.fila
	_rota_cursor    = dados.cursor ?? 0
	_rota_relatorio = dados.relatorio || []
	_rota_ativo     = true
	rota_avisoTemporario('🔄 Retomando pipeline após atualização…', 'info', 3000)
	await rota_processarCursor(dados.slots, dados.tarefaUnica, dados.temporizador)
}


// ── Definições de tipos de janela ────────────────────────────

const ROTA_TIPOS_JANELA = {
	'tarefa': {
		label:    'Tarefa do Processo',
		requerTarefa: true,
		montarUrl: (id, idTarefa) =>
			location.origin + '/pjekz/processo/' + id + '/tarefa/' + idTarefa,
	},
	'detalhes': {
		label:    'Detalhes do Processo',
		requerTarefa: false,
		montarUrl: (id) =>
			location.origin + '/pjekz/processo/' + id + '/detalhe',
	},
	'pericias': {
		label:    'Perícias',
		requerTarefa: false,
		montarUrl: (id) =>
			location.origin + '/pjekz/processo/' + id + '/pericias',
	},
	'gigs': {
		label:    'GIGS do Processo',
		requerTarefa: false,
		montarUrl: (id) =>
			location.origin + '/pjekz/gigs/abrir-gigs/' + id,
	},
	'anexar_documentos': {
		label:    'Anexar Documentos',
		requerTarefa: false,
		montarUrl: (id) =>
			location.origin + '/pjekz/processo/' + id + '/documento/anexar',
	},
	'audiencias_e_sessoes': {
		label:    'Audiências e Sessões',
		requerTarefa: false,
		montarUrl: (id) =>
			location.origin + '/pjekz/processo/' + id + '/audiencias-sessoes',
	},
	'bndt': {
		label:    'BNDT',
		requerTarefa: false,
		montarUrl: (id) =>
			location.origin + '/pjekz/processo/' + id + '/bndt',
	},
	'calculo': {
		label:    'Cálculos do Processo',
		requerTarefa: false,
		montarUrl: (id) =>
			location.origin + '/pjekz/processo/' + id + '/detalhe/calculo',
	},
	'comunicacoes_e_expedientes': {
		label:    'Comunicações e Expedientes',
		requerTarefa: false,
		montarUrl: (id) =>
			location.origin + '/pjekz/processo/' + id + '/comunicacoesprocessuais/minutas',
	},
	'homologacaoAcordo': {
		label:    'Homologação do Acordo',
		requerTarefa: false,
		montarUrl: (id, docId) =>
			location.origin + '/pjekz/processo/' + id + '/documento/' + docId + '/conteudo',
	},
	'obrigacao_de_pagar': {
		label:    'Obrigações de Pagar',
		requerTarefa: false,
		montarUrl: (id) =>
			location.origin + '/pjekz/obrigacao-pagar/' + id,
	},
	'retificaAutuacao': {
		label:    'Retificação da Autuação',
		requerTarefa: false,
		montarUrl: (id) =>
			location.origin + '/pjekz/processo/' + id + '/retificar',
	},
	'sif': {
		label:    'SIF',
		requerTarefa: false,
		montarUrl: (numProc) =>
			location.origin + '/sif/consultar/' + numProc + '/saldo'
	},
	'siscondj': {
		label:    'SISCONDJ',
		requerTarefa: false,
		montarUrl: (numProc) =>
			'https://siscondj.trt15.jus.br/portaltrt15/pages/movimentacao/conta/new?numeroDoProcesso=' + numProc
	},
	'documento': {
		label:    'Documento do Processo',
		requerTarefa: false,
		montarUrl: (id, _idTarefa, extra, docs) => {
			if(!docs || !docs.length) return null
			return docs.map(d =>
				location.origin + '/pjekz/processo/' + id + '/documento/' + d.id + '/conteudo'
			)
		},
	},
	'nao_apreciados': {
		label:    'Petições não apreciadas',
		requerTarefa: false,
		montarUrl: (id, docs) => {
			if(!docs || !docs.length) return null
			return docs.map(d =>
				location.origin + '/pjekz/processo/' + id + '/documento/' + d + '/conteudo'
			)
		},
	},
}


// ── Busca de documentos por tipo ─────────────────────────────

async function rota_buscarDocumentos(idProcesso, tipoDoc, selecao){
	let dados = await buscarDocumentos(idProcesso)

	let filtrados = dados.filter(d => {
		let texto = [d.titulo, d.tipo].filter(Boolean).map(normalizar).join(' ')
		return texto.includes(normalizar(tipoDoc))
	})
	console.log('%c[Rota PJE]%c dados: ' + JSON.stringify(dados), LOG.rosa, 'color:inherit')
	console.log('%c[Rota PJE]%c filtrados: ' + JSON.stringify(filtrados), LOG.rosa, 'color:inherit')
	if(!filtrados.length) return []

	filtrados.sort((a, b) => new Date(a.data || 0) - new Date(b.data || 0))
	
	if(selecao === 'recente')   return [filtrados[filtrados.length - 1]]
	if(selecao === 'antigo')    return [filtrados[0]]
	if(selecao === 'ultimos5')  return filtrados.slice(-5)
	return [filtrados[filtrados.length - 1]]
}

// ── Busca homologação de acordo ─────────────────────────────

async function rota_buscarDocumentoHomologatorio(idProcesso) {
	let dados = await rota_fetch(
		location.origin + '/pje-comum-api/api/processos/id/' + idProcesso + '/acordos/?codigoAcordoJudicialTipo=A'
	)

	if (!Array.isArray(dados)) dados = []

	const idAcordoJudicial = dados[0]?.idAcordoJudicial
	if (!idAcordoJudicial) return null

	let resposta = await rota_fetch(
		location.origin + '/pje-comum-api/api/processos/id/' + idProcesso + '/acordos/id/' + idAcordoJudicial + '/documentohomologatorio'
	)

	// A API pode retornar o id como { id: X }, como número direto, ou como string
	let docId = null
	if (resposta && typeof resposta === 'object') docId = resposta.id ?? null
	else if (typeof resposta === 'number' || typeof resposta === 'string') docId = resposta

	// Só retorna se for um valor utilizável (não vazio, não zero)
	if (!docId && docId !== 0) return null
	return docId
}

async function rota_buscarDocumentosNaoApreciados(idProcesso){
	let dados = await rota_fetch(
		location.origin + '/pje-comum-api/api/processos/id/' + idProcesso + '/timeline'
	)
	if(!Array.isArray(dados)) dados = dados?.conteudo || dados?.content || []

	//relatar('Chamou, pelo menos?', '', 'teste')
	// Considera apenas entradas que são documentos de fato (não movimentos)
	dados = dados.filter(d => d.documento === true)

	let naoApreciados = dados.filter(d => d.documentoApreciavel === true)
	let docNao= []
	for (let p of naoApreciados){
		docNao.push(p.id)
	}
	return docNao


	/* Alterar aqui pra documentos que não foram apreciados
	
	let filtrados = dados.filter(d => {
		let texto = [d.titulo, d.tipo].filter(Boolean).map(normalizar).join(' ')
		return texto.includes(normalizar(tipoDoc))
	})

	if(!filtrados.length) return []

	filtrados.sort((a, b) => new Date(a.dataDocumento || 0) - new Date(b.dataDocumento || 0))

	if(selecao === 'recente')   return [filtrados[filtrados.length - 1]]
	if(selecao === 'antigo')    return [filtrados[0]]
	if(selecao === 'ultimos5')  return filtrados.slice(-5)
	return [filtrados[filtrados.length - 1]]
	*/
}

// ── Busca tarefa mais recente do processo ─────────────────────

async function rota_buscarTarefa(idProcesso){
	let dados = await rota_fetch(
		location.origin + '/pje-comum-api/api/processos/id/' + idProcesso + '/tarefas?maisRecente=true'
	)
	if(!dados) return null
	let tarefa = Array.isArray(dados) ? dados[0] : dados

	if(!tarefa?.nomeRecurso) return tarefa?.idTarefa ? String(tarefa.idTarefa) : null

	try{
		let resp = await fetch(
			location.origin + '/pje-seguranca/api/token/permissoes/recursos/' + tarefa.nomeRecurso
		)
		let rota  = await resp.text()
		let parts = rota.split('{idTarefa}')
		return tarefa.idTarefa + parts[parts.length - 1]
	} catch(_){
		return String(tarefa.idTarefa)
	}
}


// ── Montagem das URLs a partir dos slots ──────────────────────

async function rota_montarUrls(idProcesso, slots, numProc = ''){
	let urls = []

	let idTarefa = null
	if(slots.some(s => ROTA_TIPOS_JANELA[s.tipo]?.requerTarefa)){
		idTarefa = await rota_buscarTarefa(idProcesso)
	}

	for(let slot of slots){
		let def = ROTA_TIPOS_JANELA[slot.tipo]
		if(!def) continue

		if(slot.tipo === 'documento'){
			let docs = await rota_buscarDocumentos(idProcesso, slot.tipoDoc || '', slot.selecao || 'recente')
			let resultado = def.montarUrl(idProcesso, idTarefa, slot, docs)
			console.log('%c[Rota PJE]%c resultado: ' + JSON.stringify(resultado), LOG.rosa, 'color:inherit')
			let urlsDoc   = Array.isArray(resultado) ? resultado : (resultado ? [resultado] : [])
			urlsDoc.filter(Boolean).forEach(u => {
				urls.push({
					url:         u,
					posicao:     slot.posicao,
					ordem:       slot.ordem,
					orientacao:  slot.orientacao || 'horizontal',
					slotIndex:   slot.ordem,
				})
			})
		}
		else if(slot.tipo === 'homologacaoAcordo'){
			const docId = await rota_buscarDocumentoHomologatorio(idProcesso)
			if(docId === null) continue

			let u = def.montarUrl(idProcesso, docId)
			if(u) urls.push({
				url:        u,
				posicao:    slot.posicao,
				ordem:      slot.ordem,
				orientacao: slot.orientacao || 'horizontal',
				slotIndex:  slot.ordem,
			})
		}
		else if(slot.tipo === 'sif' || slot.tipo === 'siscondj'){
			
			let u = def.montarUrl(numProc)
			if(u) urls.push({
				url:        u,
				posicao:    slot.posicao,
				ordem:      slot.ordem,
				orientacao: slot.orientacao || 'horizontal',
				slotIndex:  slot.ordem,
			})
		}
		else if(slot.tipo === 'nao_apreciados'){
			let docs = await rota_buscarDocumentosNaoApreciados(idProcesso)
			let resultado = def.montarUrl(idProcesso, docs)
			let urlsDoc   = Array.isArray(resultado) ? resultado : (resultado ? [resultado] : [])
			urlsDoc.filter(Boolean).forEach(u => {
				urls.push({
					url:         u,
					posicao:     slot.posicao,
					ordem:       slot.ordem,
					orientacao:  slot.orientacao || 'horizontal',
					slotIndex:   slot.ordem,
				})
			})
		}
		else {
			let u = def.montarUrl(idProcesso, idTarefa)
			if(u) urls.push({
				url:         u,
				posicao:     slot.posicao,
				ordem:       slot.ordem,
				orientacao:  slot.orientacao || 'horizontal',
				slotIndex:   slot.ordem,
			})
		}
	}

	urls.sort((a, b) => a.ordem - b.ordem)
	return urls
}


// ── Posicionamento de janelas ─────────────────────────────────

function rota_calcularGeometria(posicao) {
    // ✅ Sempre o monitor inteiro — ignora onde a janela atual está
    const sw = window.screen.width
    const sh = window.screen.height
    const sl = 0   // origem fixa no monitor, não na janela
    const st = 0

    const PROP_TOPO    = 0.15
    const PROP_LATERAL = 0.05

    const topoH    = Math.round(sh * 1.1 * PROP_TOPO)
    const lateralW = Math.round(sw * PROP_LATERAL)

    if (posicao === 'esquerda') {
        return {
            width:  Math.floor(sw / 2.1),
            height: sh - topoH,
            left:   0,              // ← sempre a borda real do monitor
            top:    topoH
        }
    }

	if (posicao === 'esquerdaAssistida') {
		const geo = rota_geometriaModoAssistido()
		return geo.pje
	}

    if (posicao === 'direita') {
        return {
            width:  Math.ceil(sw / 2.1),
            height: sh - topoH,
            left:   Math.floor(sw / 2),   // ← metade exata do monitor
            top:    topoH
        }
    }

    // centro / fullscreen
    return {
        width:  sw - (lateralW * 2),
        height: sh - topoH,
        left:   lateralW,
        top:    0
    }
}

// ── Geometria do modo assistido ───────────────────────────────
//
// Calcula PJE (80%) e assistente (20%) de forma coordenada,
// garantindo que as duas janelas se encostem sem gap ou sobreposição.
//
// Substitui rota_calcularGeometria para o tipo 'esquerdaAssistida'.

function rota_geometriaModoAssistido() {
    const sw   = window.screen.availWidth
    const sh   = window.screen.availHeight
    const topo = Math.round(sh * 0.15 * 1.1)  // mesmo cálculo do original
	let espacoDev = 0
	if(MODO_DEV){ 
		espacoDev = 200
		
	}

    const largAssistente = Math.round(sw * ROTA_LARGURA_ASSISTENTE)  // 20%
    const GAP = 20
	const largPJE        = sw - largAssistente - GAP                     // 80% exato
	
    return {
        pje: {
            width:  largPJE,
            height: sh - espacoDev,
            left:   0,
            top:    0 + espacoDev,  // deixa espaço para o modo dev, se ativo
        },
        assistente: {
            width:  largAssistente,
            height: sh - espacoDev,          // assistente ocupa altura total
            left:   largPJE + GAP,     // cola exatamente onde o PJE termina
            top:    0,
        },
    }
}


// ── Abertura do assistente no modo guiado ─────────────────────

function rota_abrirAssistente(idTarefa = '', execucao = '') {
    const geo = rota_geometriaModoAssistido()

    let url = extensao_raiz('rota/assistente/assistente.html')
    url += '?pjerota_execucao=' + encodeURIComponent(execucao)
    url += '&pjerota_tarefa='   + encodeURIComponent(idTarefa)

    // Nome único por execucao — garante janela nova a cada processo
    const nome = 'rota-assistente-' + execucao

    const assistente = window.open(
        url, nome,
        'width='   + geo.assistente.width  +
        ',height=' + geo.assistente.height +
        ',left='   + geo.assistente.left   +
        ',top='    + geo.assistente.top    +
        ',toolbar=0,menubar=0,resizable=1'
    )
    armazenar({ rotaGeometria: geo.assistente })
    if (assistente) _rota_janelasMundo.push(assistente)
    return assistente
}

function rota_nomeJanela(tipo, execucao) {
    return 'rota-' + tipo + '-' + execucao
}

function abrirUrl(url, posicao = 'esquerdaAssistida', nomeJanela) {
    
	const geo = rota_calcularGeometria(posicao)
	console.log('%c[Rota PJE]%c geo: ' + JSON.stringify(geo), LOG.teste, 'color:inherit')
    const w = window.open(
        url,
        nomeJanela,
        'width='   + geo.width  +
        ',height=' + geo.height +
        ',left='   + geo.left   +
        ',top='    + geo.top    +
        ',toolbar=0,menubar=0,resizable=1'
    )
    if (w) _rota_janelasMundo.push(w)
    return w
}



//armazenar({ rotaGeometria: geo.assistente })

// ── Comunicação entre janelas ─────────────────────────────────

const ROTA_KEY_BASE      = 'pjerota_sinal_'
const ROTA_KEY_FECHAR    = 'pjerota_fechar_'
const ROTA_KEY_INICIAR   = 'pjerota_iniciar_'   // timestamp de início do timer (escrito só pelo slot 0)
const ROTA_KEY_REINICIAR = 'pjerota_reiniciar_'  // qualquer janela pede reinício ao slot 0

function rota_sinalizar(sessao, acao){
	localStorage.setItem(ROTA_KEY_BASE + sessao, acao)
}

function rota_aguardarSinal(sessao, timeout = 28800000){
    return new Promise(resolver => {
        let inicio = Date.now()
        let tick = setInterval(async () => {
            // Sinal das janelas PJe via localStorage
            let sinal = localStorage.getItem(ROTA_KEY_BASE + sessao)
            if(sinal && sinal !== 'pausado'){
                clearInterval(tick)
                localStorage.removeItem(ROTA_KEY_BASE + sessao)
                resolver(sinal)
                return
            }

            // Sinal do assistente via browser.storage
            let cfg = await obterArmazenamento(['rotaSinalAssistente'])
            let sinalAssistente = cfg?.rotaSinalAssistente
            if(sinalAssistente && sinalAssistente !== 'pausado'){
                clearInterval(tick)
                await armazenar({ rotaSinalAssistente: null })
                resolver(sinalAssistente)
                return
            }

            if(Date.now() - inicio > timeout){ clearInterval(tick); resolver('timeout') }
        }, 300)
    })
}

function rota_fecharJanelas(sessao){
	localStorage.setItem(ROTA_KEY_FECHAR + sessao, '1')
}

function rota_monitorarFechamento(sessao){
	let tick = setInterval(() => {
		if(localStorage.getItem(ROTA_KEY_FECHAR + sessao)){
			clearInterval(tick)
			localStorage.removeItem(ROTA_KEY_FECHAR + sessao)
			window.close()
		}
	}, 300)
}


// ── Cancelar pipeline ativo ───────────────────────────────────

function rota_cancelarPipelineAtivo(){
    if(!_rota_ativo) return
    _rota_ativo       = false
    _rota_processando = false   // ← ADICIONAR esta linha
    _rota_cursor      = 0
    _rota_fila        = []
    _rota_fecharTodasJanelas()
    Object.keys(localStorage)
        .filter(k =>
            k.startsWith(ROTA_KEY_BASE)      ||
            k.startsWith(ROTA_KEY_FECHAR)    ||
            k.startsWith(ROTA_KEY_INICIAR)   ||
            k.startsWith(ROTA_KEY_REINICIAR)
        )
        .forEach(k => localStorage.removeItem(k))
}

function _rota_fecharTodasJanelas(){
	_rota_janelasMundo.forEach(w => { try{ w.close() } catch(_){} })
	_rota_janelasMundo = []
}


// ── Pipeline principal ────────────────────────────────────────

async function rota_iniciarPipeline({ fila }){
    if(_rota_ativo){
        rota_avisoTemporario('Pipeline anterior cancelado. Iniciando novo…', 'info', 3000)
        rota_cancelarPipelineAtivo()
        await suspender(500)
    }

    let cfg          = await obterArmazenamento(['tarefaAtiva', 'tarefas'])
	let nomeAtivo    = cfg?.tarefaAtiva || ''
	let itemCatalogo = typeof catalogo_obter === 'function' ? catalogo_obter(nomeAtivo) : null
	let isSistema    = itemCatalogo !== null
    let tarefa       = null

    if(isSistema){
		let itemCatalogo = typeof catalogo_obter === 'function'
			? catalogo_obter(nomeAtivo) : null

		if(!itemCatalogo){
			rota_avisoTemporario('Tarefa do sistema não encontrada.', 'erro', 4000)
			return
		}

		tarefa = {
			slots:        [{ tipo: 'detalhes', posicao: 'esquerdaAssistida', ordem: 0, slotIndex: 0 }],
			tarefaUnica:  '',
			temporizador: { ativo: false, segundos: 30, opcoes: '' },
		}
	} else {
        // Tarefa 👤 do usuário — busca no storage
        tarefa = cfg?.tarefas?.[nomeAtivo]
    }

    if(!tarefa){
        rota_avisoTemporario('Nenhuma tarefa configurada. Configure no popup.', 'erro', 4000)
        return
    }

    let slots        = tarefa.slots || []
    let tarefaUnica  = tarefa.tarefaUnica || ''
    let temporizador = tarefa.temporizador || { ativo: false, segundos: 30, opcoes: '' }

    if(!slots.length){
        rota_avisoTemporario('A tarefa "' + nomeAtivo + '" não tem janelas configuradas.', 'erro', 4000)
        return
    }

    _rota_fila      = fila
    _rota_cursor    = 0
    _rota_ativo     = true
    _rota_relatorio = []

    // Se for tarefa do sistema: inicia sessão guiada + abre assistente
    if(isSistema){
		const processos = fila.map(item => item.numProc || item.id || '')
		await estado_iniciar(nomeAtivo, processos)
		await suspender(200)
		// execucao será gerado em processarCursor — não abre assistente aqui
	}

    await rota_processarCursor(slots, tarefaUnica, temporizador)
}


// ── Processa o processo no cursor atual ───────────────────────

let _rota_processando = false


async function rota_processarCursor(slots, tarefaUnica, temporizador){
    if(!_rota_ativo) return
    if(_rota_processando) return   // ← trava
    _rota_processando = true
	// Mantém contexto acessível para persistência em caso de reload por troca de OJ
	_rota_slots_ativos       = slots
	_rota_tarefaUnica_ativa  = tarefaUnica
	_rota_temporizador_ativo = temporizador

	if(_rota_cursor >= _rota_fila.length){
		_rota_ativo       = false
		_rota_processando = false   // ← ADICIONAR esta linha
		rota_exibirRelatorio()
		return
	}

	let item = _rota_fila[_rota_cursor]
	rota_avisoTemporario('▶ ' + (item.numProc || 'processo ' + (_rota_cursor+1)), 'info', 5000)

	if(!item.id){
		item.id = await _rota_buscarIdProcesso(item.numProc)
		if(!item.id){
			rota_avisoTemporario('ID não encontrado: ' + item.numProc, 'erro', 4000)
			_rota_processando = false   // ← adiciona
			_rota_cursor++
			await rota_processarCursor(slots, tarefaUnica, temporizador)
			return
		}
	}

	let urlSlots = await rota_montarUrls(item.id, slots, item.numProc)
	if(!urlSlots.length){
		_rota_processando = false   // ← adiciona
		_rota_cursor++
		await rota_processarCursor(slots, tarefaUnica, temporizador)
		return
	}

	_rota_fecharTodasJanelas()  // fecha tudo, inclusive assistente anterior
	await suspender(300)

	const novoExecucao = String(Date.now())
	console.log('%c[Rota PJE]%c 683:' + novoExecucao, LOG.info, 'color:inherit')
	let execucao = novoExecucao   // ← adiciona isso
	let sessao   = novoExecucao   // ← adiciona isso
	await armazenar({
		rotaExecucaoAtual:    novoExecucao,
		rotaProcessoAtual:    item.numProc,   // ← número do processo
		rotaPosicaoAtual:     _rota_cursor + 1,
		rotaTotalProcessos:   _rota_fila.length,
		rota_dadosProntos:    false,          // ← reseta o sinal
	})

	// Reabre assistente se for tarefa do sistema
	let cfgTarefa = await obterArmazenamento(['tarefaAtiva'])
	let _isSistema = typeof catalogo_obter === 'function'
		&& catalogo_obter(cfgTarefa?.tarefaAtiva) !== null
	if(_isSistema){
		await rota_abrirAssistente(cfgTarefa.tarefaAtiva, execucao)
		await suspender(500)
	}


	localStorage.removeItem(ROTA_KEY_BASE    + sessao)
	localStorage.removeItem(ROTA_KEY_FECHAR  + sessao)
	localStorage.removeItem(ROTA_KEY_INICIAR + sessao)
	localStorage.removeItem(ROTA_KEY_REINICIAR + sessao)

	// Carrega posições salvas por slot para esta tarefa
	let cfgPos   = await obterArmazenamento(['tarefaAtiva', 'widgetPosSlot'])
	let nomeAtivo = cfgPos?.tarefaAtiva || ''
	let widgetPosSlot = cfgPos?.widgetPosSlot || {}

	// Serializa config do temporizador para passar pela URL
	let tmrJson = temporizador && temporizador.ativo
		? encodeURIComponent(JSON.stringify(temporizador))
		: ''

	// Passa o total de janelas na URL para que o slot 0 saiba quantas coordenar
	let totalJanelas = urlSlots.length

	urlSlots.forEach((slot, i) => {
		let geo = rota_calcularGeometria(slot.posicao)
		// Recupera posição salva para este slotIndex nesta tarefa
		let posSalva = widgetPosSlot?.[nomeAtivo]?.[slot.slotIndex] || null

		// Recupera parâmetros salvos para este processo
		let mapaParamsStr = localStorage.getItem('pjerota_params') || '{}'
		let mapaParams = {}
		try { mapaParams = JSON.parse(mapaParamsStr) } catch(_) {}
		let params = mapaParams[item.numProc] || []

		let urlFinal = slot.url
			+ (slot.url.includes('?') ? '&' : '?')
			+ 'pjerota_sessao='    + sessao
			+ '&pjerota_tarefaunica=' + encodeURIComponent(tarefaUnica)
			+ '&pjerota_num='      + encodeURIComponent(item.numProc)
			+ '&pjerota_slot='     + slot.slotIndex
			+ '&pjerota_tarefa='   + encodeURIComponent(nomeAtivo)
			+ '&pjerota_total='    + totalJanelas
			+ (posSalva ? '&pjerota_pos=' + encodeURIComponent(JSON.stringify(posSalva)) : '')
			+ (params.length ? '&pjerota_params=' + encodeURIComponent(JSON.stringify(params)) : '')
			+ (tmrJson ? '&pjerota_tmr=' + tmrJson : '')

		let nomeW = /\/documento\/\d+\/conteudo/.test(slot.url)
			? rota_nomeJanela(slot.slotIndex + '-' + i, execucao)
			: rota_nomeJanela(slot.slotIndex, execucao)
		let w = window.open(
			urlFinal, nomeW,   // ← aqui
			'width='  + geo.width  + ',height=' + geo.height +
			',left='  + geo.left   + ',top='    + geo.top    +
			',toolbar=0,menubar=0,resizable=1'
		)
		if(w) _rota_janelasMundo.push(w)
	})

	let sinal = await rota_aguardarSinal(sessao)

	// Fecha todas as janelas e limpa chaves de sincronização
	_rota_fecharTodasJanelas()
	rota_fecharJanelas(sessao)
	localStorage.removeItem(ROTA_KEY_INICIAR   + sessao)
	localStorage.removeItem(ROTA_KEY_REINICIAR + sessao)
	await suspender(400)

	let nota = localStorage.getItem('pjerota_nota_' + sessao) || ''
	localStorage.removeItem('pjerota_nota_' + sessao)

	_rota_relatorio.push({
		numProc:    item.numProc,
		nota:       nota,
		dadosLinha: item.dadosLinha,
	})

	if(sinal === 'encerrar' || sinal === 'timeout'){
		_rota_ativo = false
		_rota_processando = false   // ← adiciona
		rota_exibirRelatorio()
		return
	}

	_rota_processando = false      // ← libera antes de chamar recursivo
    _rota_cursor++
    await rota_processarCursor(slots, tarefaUnica, temporizador)
}


// ── Widget nota+botões injetado nas janelas filhas ─────────────

async function rota_injetarWidget(ctxSalvo = null){
	let sessao, tarefaUnica, numProc, slotIndex, nomeTarefa,
	    totalJanelas, widgetParams, temporizador, posSalva
	
	if(ctxSalvo){
	    if(window.name.split('-').pop() !== ctxSalvo.sessao) return	
		// ── Contexto recuperado do storage após recarregamento ────
		;({ sessao, tarefaUnica, numProc, slotIndex, nomeTarefa,
		    totalJanelas, widgetParams, temporizador, posSalva } = ctxSalvo)
	} else {
		// ── Contexto vindo da URL (primeira abertura da janela) ───
		let params = new URL(location.href).searchParams
		sessao     = params.get('pjerota_sessao')
		if(!sessao) return

		tarefaUnica  = decodeURIComponent(params.get('pjerota_tarefaunica') || '')
		numProc      = decodeURIComponent(params.get('pjerota_num') || '')
		slotIndex    = parseInt(params.get('pjerota_slot') || '0')
		nomeTarefa   = decodeURIComponent(params.get('pjerota_tarefa') || '')
		totalJanelas = parseInt(params.get('pjerota_total') || '1')

		// Parâmetros extras (botões de clipboard)
		widgetParams = []
		let paramsParam = params.get('pjerota_params')
		if(paramsParam){
			try{ widgetParams = JSON.parse(decodeURIComponent(paramsParam)) } catch(_){}
		}

		// Configuração do temporizador
		temporizador = null
		let tmrParam = params.get('pjerota_tmr')
		if(tmrParam){
			try{ temporizador = JSON.parse(decodeURIComponent(tmrParam)) } catch(_){}
		}

		// Recupera posição salva para este slot específico
		posSalva = null
		let posParam = params.get('pjerota_pos')
		if(posParam){
			try{ posSalva = JSON.parse(decodeURIComponent(posParam)) } catch(_){}
		}

		// ── Persiste contexto no storage + sessionStorage ─────────
		// Garante que, após qualquer recarregamento, esta aba consiga
		// se reidentificar como janela filha e remontar o widget.
		const chaveJanela = 'rotaJanela_' + sessao + '_' + slotIndex
		await armazenar({ [chaveJanela]: {
			sessao, tarefaUnica, numProc, slotIndex,
			nomeTarefa, totalJanelas, widgetParams,
			temporizador, posSalva,
		}})
		sessionStorage.setItem('pjerota_chave_janela', chaveJanela)
	}

	rota_monitorarFechamento(sessao)

	// ── Primeira montagem: aguarda estabilização + mínimo garantido ──
	_rota_aguardarEstabilizacao(async () => {
		if(temporizador && temporizador.ativo){
			// Slot 0 coordena o timestamp inicial — inicia antes do check-in
			if(slotIndex === 0) _rota_coordenarTimer(sessao, totalJanelas)
			// Sinaliza check-in e aguarda timestamp do slot 0
			localStorage.setItem(ROTA_KEY_REINICIAR + sessao + '_' + slotIndex, '1')
			_rota_aguardarInicioTimer(sessao, async (tsInicio) => {
				let cfg = await obterArmazenamento(['widgetPosSlot', 'tarefaAtiva'])
				let nome = cfg?.tarefaAtiva || nomeTarefa
				let pos  = cfg?.widgetPosSlot?.[nome]?.[slotIndex] || posSalva
				_rota_montarWidget(sessao, tarefaUnica, numProc, pos, slotIndex, nomeTarefa, widgetParams, temporizador, tsInicio)
				// Após primeira montagem, observa remoção do widget
				_obsWidget.observe(document.body, { childList: true, subtree: true })
			})
		} else {
			_rota_montarWidget(sessao, tarefaUnica, numProc, posSalva, slotIndex, nomeTarefa, widgetParams, temporizador)
		}
	})

	// ── Observer pós-montagem (modo temporizador) ─────────────────
	// Se o DOM mudar e o widget sumir após o timer já ter iniciado,
	// pausa o timer em todas as janelas e remonta no estado cancelado.
	// O usuário vê o widget, entende que precisa clicar em Próximo.
	let _obsWidget = new MutationObserver(() => {
		if(document.getElementById('pjerota-widget')) return
		_obsWidget.disconnect()
		// Pausa em todas as janelas via localStorage
		rota_sinalizar(sessao, 'pausado')
		// Remonta localmente já no estado cancelado
		;(async () => {
			let cfg = await obterArmazenamento(['widgetPosSlot', 'tarefaAtiva'])
			let nome = cfg?.tarefaAtiva || nomeTarefa
			let pos  = cfg?.widgetPosSlot?.[nome]?.[slotIndex] || posSalva
			let ts   = parseInt(localStorage.getItem(ROTA_KEY_INICIAR + sessao) || '0') || Date.now()
			_rota_montarWidget(sessao, tarefaUnica, numProc, pos, slotIndex, nomeTarefa, widgetParams, temporizador, ts)
			_obsWidget.observe(document.body, { childList: true, subtree: true })
		})()
	})
	// Inicia desconectado — ativado após primeira montagem (acima)
}


// ── Slot 0: coordena o início/reinício do timer ───────────────
//
// Fica em loop permanente enquanto a sessão estiver ativa.
// Quando qualquer janela escreve ROTA_KEY_REINICIAR, o slot 0
// lê quem pediu, limpa a chave e grava um novo timestamp em
// ROTA_KEY_INICIAR — imediatamente, sem esperar as demais.
// Todas as janelas (inclusive as que ainda estão carregando)
// detectam o novo timestamp no seu próprio loop de espera.

function _rota_coordenarTimer(sessao, totalJanelas){
	// Aguarda check-in de todas as janelas antes de liberar o timestamp inicial.
	// Cada janela usa chave individual por slot para evitar colisão.
	// Timeout de segurança: 60s — libera mesmo que nem todas cheguem.
	let liberado = false

	function liberar(){
		if(liberado) return
		liberado = true
		clearInterval(tick)
		for(let i = 0; i < totalJanelas; i++)
			localStorage.removeItem(ROTA_KEY_REINICIAR + sessao + '_' + i)
		localStorage.setItem(ROTA_KEY_INICIAR + sessao, String(Date.now()))
	}

	let tick = setInterval(() => {
		if(localStorage.getItem(ROTA_KEY_FECHAR + sessao)){ liberar(); return }
		let prontas = 0
		for(let i = 0; i < totalJanelas; i++){
			if(localStorage.getItem(ROTA_KEY_REINICIAR + sessao + '_' + i)) prontas++
		}
		if(prontas >= totalJanelas) liberar()
	}, 300)

	setTimeout(liberar, 60000)
}


// ── Aguarda o timestamp de início publicado pelo slot 0 ───────
//
// Cada janela chama esta função após sinalizar o reinício.
// Quando o timestamp aparece no localStorage, chama o callback
// com o valor para que o widget seja montado com o tempo correto.

function _rota_aguardarInicioTimer(sessao, callback, timeout = 90000){
	// Guarda o timestamp que estava antes de sinalizar para ignorar
	// um valor antigo que ainda não foi substituído pelo slot 0.
	let tsAntes = localStorage.getItem(ROTA_KEY_INICIAR + sessao)
	let inicio  = Date.now()

	let tick = setInterval(() => {
		let ts = localStorage.getItem(ROTA_KEY_INICIAR + sessao)
		// Só aceita se for um timestamp diferente do que havia antes
		if(ts && ts !== tsAntes){
			clearInterval(tick)
			callback(parseInt(ts))
			return
		}
		if(Date.now() - inicio > timeout){
			clearInterval(tick)
			// Fallback: inicia com timestamp atual para não travar
			callback(Date.now())
		}
	}, 300)
}


function _rota_aguardarEstabilizacao(callback, minimoMs = 5000) {
    let inicio = Date.now()

    function comDebounce() {
        let timer = null
        let seguranca = setTimeout(disparar, 8000)
        let obs = new MutationObserver(() => {
            clearTimeout(timer)
            timer = setTimeout(disparar, 2000)
        })
        obs.observe(document.body, { childList: true, subtree: true })
        // disparo inicial caso o DOM já esteja quieto desde o início
        timer = setTimeout(disparar, 2000)

        function disparar() {
            clearTimeout(timer)
            clearTimeout(seguranca)
            obs.disconnect()
            let restante = minimoMs - (Date.now() - inicio)
            if(restante > 0){
                // DOM quieto mas mínimo ainda não atingido — espera a diferença
                setTimeout(callback, restante)
            } else {
                callback()
            }
        }
    }

    if(document.readyState === 'complete') {
        comDebounce()
    } else {
        window.addEventListener('load', comDebounce, { once: true })
    }
}

// Fora de _rota_montarWidget, no escopo do módulo:
let _rota_geracao = 0  // variável de módulo

function _rota_montarWidget(sessao, tarefaUnica, numProc, posSalva, slotIndex, nomeTarefa, widgetParams, temporizador, tsInicio = 0){
	_rota_geracao++
	let minhaGeracao = _rota_geracao  // capturada no closure
	
	remover('#pjerota-widget')

	let widget = document.createElement('div')
	widget.id  = 'pjerota-widget'
	Object.assign(widget.style, {
		position:     'fixed',
		zIndex:       String(ROTA_Z.widget),
		background:   '#0078aa',
		border:       '1px solid rgba(255,167,38,0.4)',
		borderRadius: '12px',
		padding:      '10px',
		boxShadow:    '0 4px 16px rgba(0,0,0,0.12)',
		fontFamily:   "'Segoe UI', system-ui, sans-serif",
		cursor:       'default',
		width:        '220px',
	})

	let posInicial = posSalva || { bottom:'20px', right:'20px', top:'auto', left:'auto' }
	Object.assign(widget.style, posInicial)

	// ── Header (arrasto) ──────────────────────────────────────
	let header = document.createElement('div')
	Object.assign(header.style, {
		display:        'flex',
		alignItems:     'center',
		justifyContent: 'space-between',
		cursor:         'move',
		userSelect:     'none',
		gap:            '6px',
		marginBottom:   '6px',
	})

	let titulo = document.createElement('span')
	Object.assign(titulo.style, { color:'#f9f9fa', fontWeight:'700', fontSize:'11px' })
	titulo.textContent = '▶ PJE ROTA'

	let numEl = document.createElement('span')
	Object.assign(numEl.style, {
		color:'#f9f9fa', fontSize:'10px', flex:'1',
		textAlign:'right', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
	})
	numEl.textContent = numProc
	numEl.title = numProc

	header.appendChild(titulo)
	header.appendChild(numEl)
	widget.appendChild(header)

	// ════════════════════════════════════════════════════════
	// MODO TEMPORIZADOR
	// ════════════════════════════════════════════════════════
	if(temporizador && temporizador.ativo){
		let segundosTotal = parseInt(temporizador.segundos) || 30
		let opcoes = (temporizador.opcoes || '').split(',').map(s => s.trim()).filter(Boolean)

		// Calcula tempo restante a partir do timestamp de início sincronizado
		let elapsed = tsInicio > 0 ? Math.floor((Date.now() - tsInicio) / 1000) : 0
		let contadorAtual = Math.max(0, segundosTotal - elapsed)

		let pausado       = false
		let intervalo     = null
		let opcaoEscolhida = null
		let sinalInicial = localStorage.getItem(ROTA_KEY_BASE + sessao)
		if (sinalInicial == 'pausado') pausado = true

		// Se o tempo já esgotou antes de montar (janela muito lenta), avança logo
		if(contadorAtual <= 0 && !pausado){
			if(minhaGeracao === _rota_geracao){
				let nota = opcaoEscolhida || ''
				localStorage.setItem('pjerota_nota_' + sessao, nota)
				rota_sinalizar(sessao, 'proximo')
			}
			return
		}

		// ── Disrota do contador ───────────────────────────────
		let divContador = document.createElement('div')
		Object.assign(divContador.style, {
			textAlign:    'center',
			fontSize:     '36px',
			fontWeight:   '800',
			color:        '#ffa726',
			padding:      '6px 0 8px',
			cursor:       'pointer',
			userSelect:   'none',
			letterSpacing:'-1px',
			lineHeight:   '1',
			transition:   'color 0.2s',
		})
		divContador.title = 'Clique para pausar'
		divContador.textContent = contadorAtual

		function atualizarContador(){
			let sinal = localStorage.getItem(ROTA_KEY_BASE + sessao)
			if (sinal == 'pausado') pausado = true
			if(!pausado) divContador.textContent = contadorAtual
			if(pausado){
				pausarContadorDiv()
			} else if(contadorAtual <= 5){
				divContador.style.color = '#c62828'
			} else {
				divContador.style.color = '#ffa726'
			}
		}

		function pausarContadorDiv(){
			divContador.style.color = '#6b7c93'
			divContador.innerText = 'Contador Cancelado.\nClique em PRÓXIMO para continuar.'
			divContador.style.fontSize = '15px'
			divContador.style.fontWeight = '500'
			divContador.style.lineHeight = '1.2'
		}

		function iniciarContagem(){
			if(intervalo) clearInterval(intervalo)
			intervalo = setInterval(() => {
				let sinal = localStorage.getItem(ROTA_KEY_BASE + sessao)
				if (sinal == 'pausado') pausado = true
				if(pausado) {
					pausarContadorDiv()
					return
				}
				contadorAtual--
				atualizarContador()
				if(contadorAtual <= 0){
					clearInterval(intervalo)
					if(pausado){
						pausarContadorDiv()
						return
					}
					if(minhaGeracao !== _rota_geracao) return
					let nota = opcaoEscolhida || ''
					localStorage.setItem('pjerota_nota_' + sessao, nota)
					rota_sinalizar(sessao, 'proximo')
				}
			}, 1000)
		}

		divContador.addEventListener('click', () => {
			if(pausado) return
			pausado = true
			clearInterval(intervalo)
			pausarContadorDiv()
			rota_sinalizar(sessao, 'pausado')
		})

		widget.appendChild(divContador)

		// ── Botões de opção ───────────────────────────────────
		if(opcoes.length){
			let divOpcoes = document.createElement('div')
			Object.assign(divOpcoes.style, {
				display:       'flex',
				flexDirection: 'column',
				gap:           '4px',
				marginBottom:  '6px',
			})

			opcoes.forEach(opcao => {
				let btn = document.createElement('button')
				let textoExibido = opcao.length > 28 ? opcao.slice(0, 26) + '…' : opcao

				Object.assign(btn.style, {
					background:   '#f9f9fa',
					border:       '1px solid #dcdcdc',
					borderRadius: '6px',
					color:        '#2c3e50',
					padding:      '6px 8px',
					fontSize:     '12px',
					cursor:       'pointer',
					textAlign:    'left',
					width:        '100%',
					overflow:     'hidden',
					textOverflow: 'ellipsis',
					whiteSpace:   'nowrap',
					fontFamily:   "'Segoe UI', system-ui, sans-serif",
					fontWeight:   '600',
					transition:   'all 0.1s',
				})
				btn.textContent = textoExibido
				btn.title = opcao

				function setAtivo(ativo){
					if(ativo){
						btn.style.background  = 'rgba(255,167,38,0.15)'
						btn.style.borderColor = 'rgba(255,167,38,0.6)'
						btn.style.color       = '#ffa726'
					} else {
						btn.style.background  = '#f9f9fa'
						btn.style.borderColor = '#dcdcdc'
						btn.style.color       = '#2c3e50'
					}
				}

				btn.addEventListener('mouseenter', () => { if(opcaoEscolhida !== opcao) btn.style.background = 'rgba(0,0,0,0.02)' })
				btn.addEventListener('mouseleave', () => { if(opcaoEscolhida !== opcao) btn.style.background = '#f9f9fa' })

				btn.addEventListener('click', () => {
					clearInterval(intervalo)
					opcaoEscolhida = opcao
					localStorage.setItem('pjerota_nota_' + sessao, opcao)
					rota_sinalizar(sessao, 'proximo')
				})

				divOpcoes.appendChild(btn)
			})

			widget.appendChild(divOpcoes)
		}

		// ── Botão Próximo (manual) e Encerrar ────────────────
		let btnProximo  = document.createElement('button')
		let btnEncerrar = document.createElement('button')

		_rota_estilizarBtnProximo(btnProximo)
		_rota_estilizarBtnEncerrar(btnEncerrar)

		btnProximo.textContent  = '▶ Próximo'
		btnEncerrar.textContent = '■ Encerrar'

		btnProximo.addEventListener('click', () => {
			clearInterval(intervalo)
			let nota = opcaoEscolhida || ''
			localStorage.setItem('pjerota_nota_' + sessao, nota)
			rota_sinalizar(sessao, 'proximo')
		})
		btnEncerrar.addEventListener('click', () => {
			clearInterval(intervalo)
			let nota = opcaoEscolhida || ''
			localStorage.setItem('pjerota_nota_' + sessao, nota)
			rota_sinalizar(sessao, 'encerrar')
		})

		let linhaBotoes = document.createElement('div')
		Object.assign(linhaBotoes.style, { display:'flex', gap:'6px', marginTop:'4px' })
		linhaBotoes.appendChild(btnEncerrar)
		linhaBotoes.appendChild(btnProximo)
		widget.appendChild(linhaBotoes)

		document.body.appendChild(widget)
		_rota_tornarArrastavel(widget, header, slotIndex, nomeTarefa)
		if(!pausado){
			iniciarContagem()
		} else {
			pausarContadorDiv()
		}
		return
	}

	// ════════════════════════════════════════════════════════
	// MODO NORMAL (anotação + próximo/encerrar + params)
	// ════════════════════════════════════════════════════════

	// ── Input de nota ─────────────────────────────────────────
	let input = document.createElement('input')
	input.type        = 'text'
	input.placeholder = tarefaUnica || 'Anotação…'
	input.value       = tarefaUnica
	Object.assign(input.style, {
		width:'100%', background:'rgba(0,0,0,0.04)',
		border:'1px solid #dcdcdc', borderRadius:'7px',
		color:'#f9f9fa', padding:'7px 10px', fontSize:'12px',
		outline:'none', marginBottom:'6px', boxSizing:'border-box',
	})
	input.addEventListener('input', () => {
		localStorage.setItem('pjerota_nota_' + sessao, input.value)
	})
	localStorage.setItem('pjerota_nota_' + sessao, input.value)
	widget.appendChild(input)

	// ── Botões Encerrar / Próximo ─────────────────────────────
	let btnProximo  = document.createElement('button')
	let btnEncerrar = document.createElement('button')

	_rota_estilizarBtnProximo(btnProximo)
	_rota_estilizarBtnEncerrar(btnEncerrar)

	btnProximo.textContent  = '▶ Próximo'
	btnEncerrar.textContent = '■ Encerrar'

	btnProximo.addEventListener('click',  () => rota_sinalizar(sessao, 'proximo'))
	btnEncerrar.addEventListener('click', () => rota_sinalizar(sessao, 'encerrar'))

	let linhaBotoes = document.createElement('div')
	Object.assign(linhaBotoes.style, { display:'flex', gap:'6px', marginBottom:'6px' })
	linhaBotoes.appendChild(btnEncerrar)
	linhaBotoes.appendChild(btnProximo)
	widget.appendChild(linhaBotoes)

	// ── Botões de parâmetros (clipboard) ──────────────────────
	// Aparecem apenas quando a lista foi enviada "com parâmetros".

	if(widgetParams && widgetParams.length){
		let divParams = document.createElement('div')
		Object.assign(divParams.style, {
			display:       'flex',
			flexDirection: 'column',
			gap:           '4px',
			borderTop:     '1px solid #dcdcdc',
			paddingTop:    '6px',
			marginTop:     '2px',
		})

		widgetParams.forEach((param, idx) => {
			let btn = document.createElement('button')

			// Trunca o texto para caber no botão (máx 28 chars)
			let textoExibido = param.length > 28 ? param.slice(0, 26) + '…' : param

			Object.assign(btn.style, {
				background:   '#f9f9fa',
				border:       '1px solid #dcdcdc',
				borderRadius: '6px',
				color:        '#2c3e50',
				padding:      '5px 8px',
				fontSize:     '11px',
				cursor:       'pointer',
				textAlign:    'left',
				width:        '100%',
				overflow:     'hidden',
				textOverflow: 'ellipsis',
				whiteSpace:   'nowrap',
				fontFamily:   "'Segoe UI', system-ui, sans-serif",
			})
			btn.textContent = textoExibido
			btn.title = param  // tooltip com texto completo

			btn.addEventListener('mouseenter', () => {
				btn.style.background  = 'rgba(255,167,38,0.1)'
				btn.style.borderColor = 'rgba(255,167,38,0.4)'
				btn.style.color       = '#ffa726'
			})
			btn.addEventListener('mouseleave', () => {
				btn.style.background  = '#f9f9fa'
				btn.style.borderColor = '#dcdcdc'
				btn.style.color       = '#2c3e50'
			})

			btn.addEventListener('click', () => {
				navigator.clipboard.writeText(param).then(() => {
					let orig = btn.textContent
					btn.textContent = '✅ Copiado!'
					btn.style.color = '#2e7d32'
					setTimeout(() => {
						btn.textContent = textoExibido
						btn.style.color = '#2c3e50'
					}, 1500)
				}).catch(() => {
					// Fallback: cria textarea temporário
					let t = document.createElement('textarea')
					t.value = param
					document.body.appendChild(t)
					t.select()
					document.execCommand('copy')
					t.remove()
					btn.textContent = '✅ Copiado!'
					setTimeout(() => { btn.textContent = textoExibido }, 1500)
				})
			})

			divParams.appendChild(btn)
		})

		widget.appendChild(divParams)
	}

	document.body.appendChild(widget)
	_rota_tornarArrastavel(widget, header, slotIndex, nomeTarefa)
}

// [ALTERAÇÃO 1] Vertical usa metade da largura do widget horizontal
function _rota_montarConteudo(orientacao, input, btnProximo, btnEncerrar){
	let div = document.createElement('div')
	if(orientacao === 'horizontal'){
		Object.assign(div.style, { display:'flex', flexDirection:'column', gap:'6px' })
		Object.assign(input.style, {
			width:'100%', background:'rgba(0,0,0,0.04)',
			border:'1px solid #dcdcdc', borderRadius:'7px',
			color:'#2c3e50', padding:'7px 10px', fontSize:'12px',
			outline:'none', marginBottom:'0', boxSizing:'border-box', minWidth:'200px',
		})
		let linha = document.createElement('div')
		Object.assign(linha.style, { display:'flex', gap:'6px' })
		linha.appendChild(btnProximo)
		linha.appendChild(btnEncerrar)
		div.appendChild(input)
		div.appendChild(linha)
	} else {
		// Vertical: layout estreito — caixa compacta em coluna
		Object.assign(div.style, { display:'flex', flexDirection:'column', gap:'6px', width:'110px' })
		Object.assign(input.style, {
			width:'100%', background:'rgba(0,0,0,0.04)',
			border:'1px solid #dcdcdc', borderRadius:'7px',
			color:'#2c3e50', padding:'5px 7px', fontSize:'11px',
			outline:'none', marginBottom:'0', boxSizing:'border-box', minWidth:'0',
		})
		Object.assign(btnProximo.style,  { flex:'', width:'100%', padding:'6px 4px', fontSize:'11px' })
		Object.assign(btnEncerrar.style, { flex:'', width:'100%', padding:'6px 4px', fontSize:'11px' })
		div.appendChild(input)
		div.appendChild(btnProximo)
		div.appendChild(btnEncerrar)
	}
	return div
}

function _rota_estilizarBtnProximo(btn){
	Object.assign(btn.style, {
		flex:'1', background:'#ffa726', color:'#ffffff',
		border:'none', borderRadius:'7px', padding:'7px 12px',
		fontWeight:'700', fontSize:'12px', cursor:'pointer',
		fontFamily:"'Segoe UI', system-ui, sans-serif",
	})
}
function _rota_estilizarBtnEncerrar(btn){
	Object.assign(btn.style, {
		flex:'1', background:'#f9f9fa', color:'#2c3e50',
		border:'1px solid #dcdcdc', borderRadius:'7px',
		padding:'7px 12px', fontWeight:'700', fontSize:'12px',
		cursor:'pointer', fontFamily:"'Segoe UI', system-ui, sans-serif",
	})
}
function _rota_estilizarBtnSecundario(btn){
	Object.assign(btn.style, {
		background:'#f9f9fa', color:'#6b7c93',
		border:'1px solid #dcdcdc', borderRadius:'5px',
		padding:'3px 7px', fontSize:'13px', cursor:'pointer',
		fontFamily:"'Segoe UI', system-ui, sans-serif",
	})
}


// ── Arrastar widget e salvar posição por slot ─────────────────
// [ALTERAÇÃO 2] Posição salva por slotIndex dentro da tarefa

function _rota_tornarArrastavel(el, alca, slotIndex, nomeTarefa){
	let ox=0, oy=0, mx=0, my=0
	alca.addEventListener('mousedown', e => {
		e.preventDefault()
		ox = el.offsetLeft; oy = el.offsetTop
		mx = e.clientX;     my = e.clientY
		el.style.right  = 'auto'
		el.style.bottom = 'auto'

		let mover = ev => {
			el.style.left = (ox + ev.clientX - mx) + 'px'
			el.style.top  = (oy + ev.clientY - my) + 'px'
		}
		let soltar = () => {
			document.removeEventListener('mousemove', mover)
			document.removeEventListener('mouseup',   soltar)
			_rota_salvarPosicaoSlot(
				{ top: el.style.top, left: el.style.left, right:'auto', bottom:'auto' },
				slotIndex, nomeTarefa
			)
		}
		document.addEventListener('mousemove', mover)
		document.addEventListener('mouseup',   soltar)
	})
}

async function _rota_salvarPosicaoSlot(pos, slotIndex, nomeTarefa){
	let cfg          = await obterArmazenamento(['widgetPosSlot'])
	let widgetPosSlot = cfg?.widgetPosSlot || {}
	if(!widgetPosSlot[nomeTarefa]) widgetPosSlot[nomeTarefa] = {}
	widgetPosSlot[nomeTarefa][slotIndex] = pos
	await armazenar({ widgetPosSlot })
}

async function _rota_salvarOrientacaoWidget(orientacao, slotIndex, nomeTarefa){
	let cfg  = await obterArmazenamento(['tarefas'])
	let tarefas = cfg?.tarefas || {}
	if(!tarefas[nomeTarefa]) return
	let slots = tarefas[nomeTarefa].slots || []
	if(slots[slotIndex]) slots[slotIndex].orientacao = orientacao
	tarefas[nomeTarefa].slots = slots
	await armazenar({ tarefas })
}


// ── Avisos visuais ────────────────────────────────────────────

function rota_avisoTemporario(msg = '', tipo = 'info', ms = 3000){
	let c = document.getElementById('pjerota-avisos')
	if(!c){
		c = document.createElement('div')
		c.id = 'pjerota-avisos'
		Object.assign(c.style, {
			position:'fixed', top:'16px', left:'50%',
			transform:'translateX(-50%)',
			zIndex: String(ROTA_Z.aviso),
			display:'flex', flexDirection:'column', gap:'6px',
			maxWidth:'420px', width:'max-content',
			fontFamily:"'Segoe UI', system-ui, sans-serif",
			pointerEvents:'none',
		})
		document.body.appendChild(c)
	}
	let el = document.createElement('div')
	Object.assign(el.style, {
		background: tipo==='erro'?'#fdecea': tipo==='sucesso'?'#e8f5e9':'#ffffff',
		color:'#2c3e50',
		borderLeft: '4px solid ' + (tipo==='erro'?'#c62828':tipo==='sucesso'?'#2e7d32':'#ffa726'),
		borderRadius:'8px', padding:'10px 16px',
		fontSize:'13px', lineHeight:'1.4',
		boxShadow:'0 4px 16px rgba(0,0,0,0.08)',
		opacity:'1', transition:'opacity 0.35s', whiteSpace:'pre-wrap',
	})
	el.textContent = msg
	c.appendChild(el)
	setTimeout(() => { el.style.opacity='0'; setTimeout(()=>el.remove(), 380) }, ms)
}


// ── Relatório final ───────────────────────────────────────────

function rota_exibirRelatorio(){
	armazenar({ rotaAssistenteFechar: true })
    if(!_rota_relatorio.length){
        rota_avisoTemporario('Nenhum processo revisado.', 'info', 4000)
        return
    }
    remover('#pjerota-relatorio')

    let painel = document.createElement('div')
    painel.id  = 'pjerota-relatorio'
    Object.assign(painel.style, {
        position:      'fixed',
        inset:         '0',
        background:    'rgba(0,0,0,0.5)',
        zIndex:        String(ROTA_Z.modal),
        display:       'flex',
        alignItems:    'center',
        justifyContent:'center',
        fontFamily:    "'Segoe UI', system-ui, sans-serif",
    })

    let caixa = document.createElement('div')
    Object.assign(caixa.style, {
        background:   '#ffffff',
        border:       '1px solid #dcdcdc',
        borderRadius: '10px',
        padding:      '24px',
        maxWidth:     '90vw',
        maxHeight:    '80vh',
        display:      'flex',
        flexDirection:'column',
        gap:          '14px',
        boxShadow:    '0 8px 32px rgba(0,0,0,0.18)',
        overflow:     'hidden',
    })

    // ── Cabeçalho
    let cab = document.createElement('div')
    Object.assign(cab.style, { display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px' })

    let tit = document.createElement('span')
    Object.assign(tit.style, { color:'#0078aa', fontWeight:'700', fontSize:'15px' })
    tit.textContent = '▶ PJE ROTA — Relatório (' + _rota_relatorio.length + ' processo' + (_rota_relatorio.length > 1 ? 's' : '') + ')'

    let btnX = document.createElement('button')
    Object.assign(btnX.style, {
        background:'transparent', border:'none', color:'#6b7c93',
        fontSize:'22px', cursor:'pointer', lineHeight:'1', padding:'0 4px', flexShrink:'0',
    })
    btnX.textContent = '×'
    btnX.addEventListener('click', () => painel.remove())

    cab.appendChild(tit)
    cab.appendChild(btnX)

    // ── Tabela
    let area = document.createElement('div')
    Object.assign(area.style, { overflowY:'auto', overflowX:'auto', flex:'1' })

    let tabela = document.createElement('table')
    Object.assign(tabela.style, {
        width:'100%', borderCollapse:'collapse',
        fontSize:'12px', color:'#2c3e50',
    })

    let thead = document.createElement('thead')
    let trH   = document.createElement('tr')
    let cabCols = ['Processo', 'Anotação / Opção']
    cabCols.forEach(c => {
        let th = document.createElement('th')
        Object.assign(th.style, {
            padding:     '8px 12px',
            textAlign:   'left',
            background:  '#0078aa',
            color:       '#ffffff',
            borderBottom:'1px solid #dcdcdc',
            whiteSpace:  'nowrap',
            fontWeight:  '700',
        })
        th.textContent = c
        trH.appendChild(th)
    })
    thead.appendChild(trH)
    tabela.appendChild(thead)

    let tbody = document.createElement('tbody')
    _rota_relatorio.forEach((item, idx) => {
        let tr = document.createElement('tr')
        tr.style.background = idx % 2 === 0 ? '#ffffff' : '#f9f9fa'

        let cellNum = document.createElement('td')
        Object.assign(cellNum.style, {
            padding:     '7px 12px',
            borderBottom:'1px solid #dcdcdc',
            whiteSpace:  'nowrap',
            color:       '#0078aa',
            fontWeight:  '500',
        })
        cellNum.textContent = item.numProc

        let cellNota = document.createElement('td')
        Object.assign(cellNota.style, {
            padding:     '7px 12px',
            borderBottom:'1px solid #dcdcdc',
            color:       '#2c3e50',
        })
        cellNota.textContent = item.nota || ''

        tr.appendChild(cellNum)
        tr.appendChild(cellNota)
        tbody.appendChild(tr)
    })
    tabela.appendChild(tbody)
    area.appendChild(tabela)

    // ── Botão copiar
    let btnCopiar = document.createElement('button')
    Object.assign(btnCopiar.style, {
        background:  '#ffa726',
        color:       '#ffffff',
        border:      'none',
        borderRadius:'6px',
        padding:     '9px 20px',
        fontWeight:  '700',
        fontSize:    '13px',
        cursor:      'pointer',
        alignSelf:   'flex-end',
        transition:  'background 0.15s',
    })
    btnCopiar.textContent = '📋 Copiar como tabela'
    btnCopiar.addEventListener('mouseenter', () => btnCopiar.style.background = '#D68C20')
    btnCopiar.addEventListener('mouseleave', () => btnCopiar.style.background = '#ffa726')
    btnCopiar.addEventListener('click', () => {
        let linhas = _rota_relatorio.map(item => [item.numProc, item.nota || ''].join('\t'))
        let tsv    = cabCols.join('\t') + '\n' + linhas.join('\n')
        navigator.clipboard.writeText(tsv)
            .then(() => {
                btnCopiar.textContent = '✅ Copiado!'
                setTimeout(() => { btnCopiar.textContent = '📋 Copiar como tabela' }, 2000)
            })
            .catch(() => rota_avisoTemporario('Erro ao copiar.', 'erro', 3000))
    })

    caixa.appendChild(cab)
    caixa.appendChild(area)
    caixa.appendChild(btnCopiar)
    painel.appendChild(caixa)
    document.body.appendChild(painel)
}

// ── Retomada automática após reload por troca de OJ ──────────
// Executa assim que o script carrega. Se houver pipeline persistido
// no storage (salvo antes do reload), retoma do ponto exato.
rota_pipeline_retomar()
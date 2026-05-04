// ============================================================
// janelas.js
// Pipeline de janelas do PJE Play.
// ============================================================


// ── Z-index ───────────────────────────────────────────────────
const PLAY_Z = { btn: 9000, widget: 9100, aviso: 9300, modal: 9400, painel: 9500 }


// ── Estado global do pipeline ─────────────────────────────────
let _play_fila         = []
let _play_cursor       = 0
let _play_ativo        = false
let _play_relatorio    = []
let _play_janelasMundo = []


// ── Definições de tipos de janela ────────────────────────────

const PLAY_TIPOS_JANELA = {
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

async function play_buscarDocumentos(idProcesso, tipoDoc, selecao){
	let dados = await d(idProcesso)

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
}

// ── Busca homologação de acordo ─────────────────────────────

async function play_buscarDocumentoHomologatorio(idProcesso) {
	let dados = await play_fetch(
		location.origin + '/pje-comum-api/api/processos/id/' + idProcesso + '/acordos/?codigoAcordoJudicialTipo=A'
	)

	if (!Array.isArray(dados)) dados = []

	const idAcordoJudicial = dados[0]?.idAcordoJudicial
	if (!idAcordoJudicial) return null

	let resposta = await play_fetch(
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

async function play_buscarDocumentosNaoApreciados(idProcesso){
	let dados = await play_fetch(
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

async function play_buscarTarefa(idProcesso){
	let dados = await play_fetch(
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

async function play_montarUrls(idProcesso, slots, numProc = ''){
	let urls = []

	let idTarefa = null
	if(slots.some(s => PLAY_TIPOS_JANELA[s.tipo]?.requerTarefa)){
		idTarefa = await play_buscarTarefa(idProcesso)
	}

	for(let slot of slots){
		let def = PLAY_TIPOS_JANELA[slot.tipo]
		if(!def) continue

		if(slot.tipo === 'documento'){
			let docs = await play_buscarDocumentos(idProcesso, slot.tipoDoc || '', slot.selecao || 'recente')
			let resultado = def.montarUrl(idProcesso, idTarefa, slot, docs)
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
			const docId = await play_buscarDocumentoHomologatorio(idProcesso)
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
			let docs = await play_buscarDocumentosNaoApreciados(idProcesso)
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

function play_calcularGeometria(posicao) {
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


// ── Comunicação entre janelas ─────────────────────────────────

const PLAY_KEY_BASE   = 'pjeplay_sinal_'
const PLAY_KEY_FECHAR = 'pjeplay_fechar_'

function play_sinalizar(sessao, acao){
	localStorage.setItem(PLAY_KEY_BASE + sessao, acao)
}

function play_aguardarSinal(sessao, timeout = 28800000){
	return new Promise(resolver => {
		let inicio = Date.now()
		let tick = setInterval(() => {
			let sinal = localStorage.getItem(PLAY_KEY_BASE + sessao)
			if(sinal && sinal !== 'pausado'){
				clearInterval(tick)
				localStorage.removeItem(PLAY_KEY_BASE + sessao)
				resolver(sinal)
				return
			}
			if(Date.now() - inicio > timeout){ clearInterval(tick); resolver('timeout') }
		}, 300)
	})
}

function play_fecharJanelas(sessao){
	localStorage.setItem(PLAY_KEY_FECHAR + sessao, '1')
}

function play_monitorarFechamento(sessao){
	let tick = setInterval(() => {
		if(localStorage.getItem(PLAY_KEY_FECHAR + sessao)){
			clearInterval(tick)
			localStorage.removeItem(PLAY_KEY_FECHAR + sessao)
			window.close()
		}
	}, 300)
}


// ── Cancelar pipeline ativo ───────────────────────────────────

function play_cancelarPipelineAtivo(){
	if(!_play_ativo) return
	_play_ativo  = false
	_play_cursor = 0
	_play_fila   = []
	_play_fecharTodasJanelas()
	Object.keys(localStorage)
		.filter(k => k.startsWith(PLAY_KEY_BASE) || k.startsWith(PLAY_KEY_FECHAR))
		.forEach(k => localStorage.removeItem(k))
}

function _play_fecharTodasJanelas(){
	_play_janelasMundo.forEach(w => { try{ w.close() } catch(_){} })
	_play_janelasMundo = []
}


// ── Pipeline principal ────────────────────────────────────────

async function play_iniciarPipeline({ fila }){
	if(_play_ativo){
		play_avisoTemporario('Pipeline anterior cancelado. Iniciando novo…', 'info', 3000)
		play_cancelarPipelineAtivo()
		await suspender(500)
	}

	let cfg       = await obterArmazenamento(['tarefaAtiva','tarefas'])
	let nomeAtivo = cfg?.tarefaAtiva || ''
	let tarefa    = cfg?.tarefas?.[nomeAtivo]

	if(!tarefa){
		play_avisoTemporario('Nenhuma tarefa configurada. Configure no popup.', 'erro', 4000)
		return
	}

	let slots       = tarefa.slots || []
	let tarefaUnica = tarefa.tarefaUnica || ''
	let temporizador = tarefa.temporizador || { ativo: false, segundos: 30, opcoes: '' }

	if(!slots.length){
		play_avisoTemporario('A tarefa "' + nomeAtivo + '" não tem janelas configuradas.', 'erro', 4000)
		return
	}

	_play_fila      = fila
	_play_cursor    = 0
	_play_ativo     = true
	_play_relatorio = []

	await play_processarCursor(slots, tarefaUnica, temporizador)
}


// ── Processa o processo no cursor atual ───────────────────────

async function play_processarCursor(slots, tarefaUnica, temporizador){
	if(!_play_ativo) return

	if(_play_cursor >= _play_fila.length){
		_play_ativo = false
		play_exibirRelatorio()
		return
	}

	let item = _play_fila[_play_cursor]
	play_avisoTemporario('▶ ' + (item.numProc || 'processo ' + (_play_cursor+1)), 'info', 5000)

	if(!item.id){
		item.id = await _play_buscarIdProcesso(item.numProc)
		if(!item.id){
			play_avisoTemporario('ID não encontrado: ' + item.numProc, 'erro', 4000)
			_play_cursor++
			await play_processarCursor(slots, tarefaUnica, temporizador)
			return
		}
	}

	let urlSlots = await play_montarUrls(item.id, slots, item.numProc)
	if(!urlSlots.length){
		_play_cursor++
		await play_processarCursor(slots, tarefaUnica, temporizador)
		return
	}

	_play_fecharTodasJanelas()
	await suspender(300)

	let sessao = 'play_' + Date.now()

	localStorage.removeItem(PLAY_KEY_BASE  + sessao)
	localStorage.removeItem(PLAY_KEY_FECHAR + sessao)

	// Carrega posições salvas por slot para esta tarefa
	let cfgPos   = await obterArmazenamento(['tarefaAtiva', 'widgetPosSlot'])
	let nomeAtivo = cfgPos?.tarefaAtiva || ''
	let widgetPosSlot = cfgPos?.widgetPosSlot || {}

	// Serializa config do temporizador para passar pela URL
	let tmrJson = temporizador && temporizador.ativo
		? encodeURIComponent(JSON.stringify(temporizador))
		: ''

	urlSlots.forEach(slot => {
		let geo = play_calcularGeometria(slot.posicao)
		// Recupera posição salva para este slotIndex nesta tarefa
		let posSalva = widgetPosSlot?.[nomeAtivo]?.[slot.slotIndex] || null

		// Recupera parâmetros salvos para este processo
		let mapaParamsStr = localStorage.getItem('pjeplay_params') || '{}'
		let mapaParams = {}
		try { mapaParams = JSON.parse(mapaParamsStr) } catch(_) {}
		let params = mapaParams[item.numProc] || []

		let urlFinal = slot.url
			+ (slot.url.includes('?') ? '&' : '?')
			+ 'pjeplay_sessao=' + sessao
			+ '&pjeplay_tarefaunica=' + encodeURIComponent(tarefaUnica)
			+ '&pjeplay_num='  + encodeURIComponent(item.numProc)
			+ '&pjeplay_slot=' + slot.slotIndex
			+ '&pjeplay_tarefa=' + encodeURIComponent(nomeAtivo)
			+ (posSalva ? '&pjeplay_pos=' + encodeURIComponent(JSON.stringify(posSalva)) : '')
			+ (params.length ? '&pjeplay_params=' + encodeURIComponent(JSON.stringify(params)) : '')
			+ (tmrJson ? '&pjeplay_tmr=' + tmrJson : '')

		let w = window.open(
			urlFinal, '_blank',
			'width='  + geo.width  + ',height=' + geo.height +
			',left='  + geo.left   + ',top='    + geo.top    +
			',toolbar=0,menubar=0,resizable=1'
		)
		if(w) _play_janelasMundo.push(w)
	})

	let sinal = await play_aguardarSinal(sessao)

	// [ALTERAÇÃO 3] Ao encerrar: fecha TODAS as janelas abertas pela extensão
	// antes de sinalizar o fechamento individual (que também fecha).
	// Isso garante que todas as janelas filhas sejam fechadas, não só a atual.
	_play_fecharTodasJanelas()
	play_fecharJanelas(sessao)
	await suspender(400)

	let nota = localStorage.getItem('pjeplay_nota_' + sessao) || ''
	localStorage.removeItem('pjeplay_nota_' + sessao)

	_play_relatorio.push({
		numProc:    item.numProc,
		nota:       nota,
		dadosLinha: item.dadosLinha,
	})

	if(sinal === 'encerrar' || sinal === 'timeout'){
		_play_ativo = false
		play_exibirRelatorio()
		return
	}

	_play_cursor++
	await play_processarCursor(slots, tarefaUnica, temporizador)
}


// ── Widget nota+botões injetado nas janelas filhas ─────────────

async function play_injetarWidget(){
	let params      = new URL(location.href).searchParams
	let sessao      = params.get('pjeplay_sessao')
	if(!sessao) return

	let tarefaUnica = decodeURIComponent(params.get('pjeplay_tarefaunica') || '')
	let numProc     = decodeURIComponent(params.get('pjeplay_num') || '')
	let slotIndex   = parseInt(params.get('pjeplay_slot') || '0')
	let nomeTarefa  = decodeURIComponent(params.get('pjeplay_tarefa') || '')

	// Parâmetros extras (botões de clipboard)
	let widgetParams = []
	let paramsParam = params.get('pjeplay_params')
	if(paramsParam){
		try{ widgetParams = JSON.parse(decodeURIComponent(paramsParam)) } catch(_){}
	}

	// Configuração do temporizador
	let temporizador = null
	let tmrParam = params.get('pjeplay_tmr')
	if(tmrParam){
		try{ temporizador = JSON.parse(decodeURIComponent(tmrParam)) } catch(_){}
	}

	// Recupera posição salva para este slot específico
	let posSalva = null
	let posParam = params.get('pjeplay_pos')
	if(posParam){
		try{ posSalva = JSON.parse(decodeURIComponent(posParam)) } catch(_){}
	}

	play_monitorarFechamento(sessao)

	_play_aguardarEstabilizacao(() => {
		_play_montarWidget(sessao, tarefaUnica, numProc, posSalva, slotIndex, nomeTarefa, widgetParams, temporizador)
	})
	// logo após o _play_montarWidget(...)
	setInterval(async () => {
    if (!document.getElementById('pjeplay-widget')) {
        let cfg = await obterArmazenamento(['widgetPosSlot', 'tarefaAtiva'])
        let nomeAtivo = cfg?.tarefaAtiva || nomeTarefa
        let posSalvaAtual = cfg?.widgetPosSlot?.[nomeAtivo]?.[slotIndex] || null
        _play_montarWidget(sessao, tarefaUnica, numProc, posSalvaAtual, slotIndex, nomeTarefa, widgetParams, temporizador)
    }
}, 1000)
}

function _play_aguardarEstabilizacao(callback) {
    function comDebounce() {
        let timer = setTimeout(callback, 2000)
        let seguranca = setTimeout(() => { obs.disconnect(); callback() }, 8000)
        let obs = new MutationObserver(() => {
            clearTimeout(timer)
            timer = setTimeout(() => { clearTimeout(seguranca); obs.disconnect(); callback() }, 2000)
        })
        obs.observe(document.body, { childList: true, subtree: true })
    }

    if (document.readyState === 'complete') {
        comDebounce()
    } else {
        window.addEventListener('load', comDebounce, { once: true })
    }
}

// Fora de _play_montarWidget, no escopo do módulo:
let _play_geracao = 0  // variável de módulo

function _play_montarWidget(sessao, tarefaUnica, numProc, posSalva, slotIndex, nomeTarefa, widgetParams, temporizador){
	_play_geracao++
	let minhaGeracao = _play_geracao  // capturada no closure
	
	remover('#pjeplay-widget')

	let widget = document.createElement('div')
	widget.id  = 'pjeplay-widget'
	Object.assign(widget.style, {
		position:     'fixed',
		zIndex:       String(PLAY_Z.widget),
		background:   '#0d1b2a',
		border:       '1px solid rgba(249,183,63,0.4)',
		borderRadius: '12px',
		padding:      '10px',
		boxShadow:    '0 6px 24px rgba(0,0,0,0.55)',
		fontFamily:   "'Segoe UI', system-ui, sans-serif",
		cursor:       'default',
		width:        '220px',
	})

	// Valida se a posição salva ainda cabe dentro da janela atual.
	// Uma posição salva na janela da esquerda pode ficar fora dos limites
	// na janela da direita (que é menor ou está em outra posição).
	let posInicial = { bottom:'20px', right:'20px', top:'auto', left:'auto' }
	if(posSalva){
		let t = parseInt(posSalva.top)
		let l = parseInt(posSalva.left)
		let dentroV = !isNaN(t) && t >= 0 && t < window.innerHeight - 60
		let dentroH = !isNaN(l) && l >= 0 && l < window.innerWidth  - 60
		if(dentroV && dentroH) posInicial = posSalva
	}
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
	Object.assign(titulo.style, { color:'#F9B73F', fontWeight:'700', fontSize:'11px' })
	titulo.textContent = '▶ PJE PLAY'

	let numEl = document.createElement('span')
	Object.assign(numEl.style, {
		color:'#5e84a8', fontSize:'10px', flex:'1',
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

		let contadorAtual = segundosTotal
		let pausado       = false
		let intervalo     = null
		let opcaoEscolhida = null
		let sinalInicial = localStorage.getItem(PLAY_KEY_BASE + sessao)
		if (sinalInicial == 'pausado') pausado = true

		// ── Display do contador ───────────────────────────────
		let divContador = document.createElement('div')
		Object.assign(divContador.style, {
			textAlign:    'center',
			fontSize:     '36px',
			fontWeight:   '800',
			color:        '#F9B73F',
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
			let sinal = localStorage.getItem(PLAY_KEY_BASE + sessao)
			if (sinal == 'pausado') pausado = true
			if(!pausado) divContador.textContent = contadorAtual
			if(pausado){
				pausarContadorDiv()
			} else if(contadorAtual <= 5){
				divContador.style.color = '#e74c3c'
			} else {
				divContador.style.color = '#F9B73F'
			}
		}

		function pausarContadorDiv(){
			divContador.style.color = '#5e84a8'
			divContador.innerText = 'Contador Cancelado.\nClique em PRÓXIMO para continuar.'
			divContador.style.fontSize = '15px'
			divContador.style.fontWeight = '500'
			divContador.style.lineHeight = '1.2'
		}

		function iniciarContagem(){
			
			if(intervalo) clearInterval(intervalo)
			intervalo = setInterval(() => {
				let sinal = localStorage.getItem(PLAY_KEY_BASE + sessao)
				if (sinal == 'pausado') pausado = true
				if(pausado) {
					pausarContadorDiv()
					return          // ← pausa o decremento E o disparo do sinal
				}
				contadorAtual--
				atualizarContador()
				if(contadorAtual <= 0){
					clearInterval(intervalo)
					if(pausado){
						pausarContadorDiv()
						return
					}     // ← segurança extra (não deve ocorrer, mas garante)
					if(minhaGeracao !== _play_geracao) return
					let nota = opcaoEscolhida || ''
					localStorage.setItem('pjeplay_nota_' + sessao, nota)
					play_sinalizar(sessao, 'proximo')
				}
			}, 1000)
		}

		divContador.addEventListener('click', () => {
			if(pausado) return          // já pausado, ignora cliques adicionais
			pausado = true
			clearInterval(intervalo)   // encerra o timer definitivamente
    		pausarContadorDiv()                          // direto, sem passar por atualizarContador
			play_sinalizar(sessao, 'pausado') // sinaliza para outras janelas
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
					background:   '#112235',
					border:       '1px solid rgba(255,255,255,0.1)',
					borderRadius: '6px',
					color:        '#cce0f5',
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
						btn.style.background  = 'rgba(249,183,63,0.2)'
						btn.style.borderColor = 'rgba(249,183,63,0.6)'
						btn.style.color       = '#F9B73F'
					} else {
						btn.style.background  = '#112235'
						btn.style.borderColor = 'rgba(255,255,255,0.1)'
						btn.style.color       = '#cce0f5'
					}
				}

				btn.addEventListener('mouseenter', () => { if(opcaoEscolhida !== opcao) btn.style.background = 'rgba(255,255,255,0.05)' })
				btn.addEventListener('mouseleave', () => { if(opcaoEscolhida !== opcao) btn.style.background = '#112235' })

				btn.addEventListener('click', () => {
					clearInterval(intervalo)
					opcaoEscolhida = opcao
					localStorage.setItem('pjeplay_nota_' + sessao, opcao)
					play_sinalizar(sessao, 'proximo')
				})

				divOpcoes.appendChild(btn)
			})

			widget.appendChild(divOpcoes)
		}

		// ── Botão Próximo (manual) e Encerrar ────────────────
		let btnProximo  = document.createElement('button')
		let btnEncerrar = document.createElement('button')

		_play_estilizarBtnProximo(btnProximo)
		_play_estilizarBtnEncerrar(btnEncerrar)

		btnProximo.textContent  = '▶ Próximo'
		btnEncerrar.textContent = '■ Encerrar'

		btnProximo.addEventListener('click', () => {
			clearInterval(intervalo)
			let nota = opcaoEscolhida || ''
			localStorage.setItem('pjeplay_nota_' + sessao, nota)
			play_sinalizar(sessao, 'proximo')
		})
		btnEncerrar.addEventListener('click', () => {
			clearInterval(intervalo)
			let nota = opcaoEscolhida || ''
			localStorage.setItem('pjeplay_nota_' + sessao, nota)
			play_sinalizar(sessao, 'encerrar')
		})

		let linhaBotoes = document.createElement('div')
		Object.assign(linhaBotoes.style, { display:'flex', gap:'6px', marginTop:'4px' })
		linhaBotoes.appendChild(btnEncerrar)
		linhaBotoes.appendChild(btnProximo)
		widget.appendChild(linhaBotoes)

		document.body.appendChild(widget)
		_play_tornarArrastavel(widget, header, slotIndex, nomeTarefa)
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
		width:'100%', background:'rgba(255,255,255,0.06)',
		border:'1px solid rgba(255,255,255,0.12)', borderRadius:'7px',
		color:'#cce0f5', padding:'7px 10px', fontSize:'12px',
		outline:'none', marginBottom:'6px', boxSizing:'border-box',
	})
	input.addEventListener('input', () => {
		localStorage.setItem('pjeplay_nota_' + sessao, input.value)
	})
	localStorage.setItem('pjeplay_nota_' + sessao, input.value)
	widget.appendChild(input)

	// ── Botões Encerrar / Próximo ─────────────────────────────
	let btnProximo  = document.createElement('button')
	let btnEncerrar = document.createElement('button')

	_play_estilizarBtnProximo(btnProximo)
	_play_estilizarBtnEncerrar(btnEncerrar)

	btnProximo.textContent  = '▶ Próximo'
	btnEncerrar.textContent = '■ Encerrar'

	btnProximo.addEventListener('click',  () => play_sinalizar(sessao, 'proximo'))
	btnEncerrar.addEventListener('click', () => play_sinalizar(sessao, 'encerrar'))

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
			borderTop:     '1px solid rgba(255,255,255,0.08)',
			paddingTop:    '6px',
			marginTop:     '2px',
		})

		widgetParams.forEach((param, idx) => {
			let btn = document.createElement('button')

			// Trunca o texto para caber no botão (máx 28 chars)
			let textoExibido = param.length > 28 ? param.slice(0, 26) + '…' : param

			Object.assign(btn.style, {
				background:   '#112235',
				border:       '1px solid rgba(255,255,255,0.1)',
				borderRadius: '6px',
				color:        '#cce0f5',
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
				btn.style.background  = 'rgba(249,183,63,0.15)'
				btn.style.borderColor = 'rgba(249,183,63,0.4)'
				btn.style.color       = '#F9B73F'
			})
			btn.addEventListener('mouseleave', () => {
				btn.style.background  = '#112235'
				btn.style.borderColor = 'rgba(255,255,255,0.1)'
				btn.style.color       = '#cce0f5'
			})

			btn.addEventListener('click', () => {
				navigator.clipboard.writeText(param).then(() => {
					let orig = btn.textContent
					btn.textContent = '✅ Copiado!'
					btn.style.color = '#2ecc71'
					setTimeout(() => {
						btn.textContent = textoExibido
						btn.style.color = '#cce0f5'
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
	_play_tornarArrastavel(widget, header, slotIndex, nomeTarefa)
}

// [ALTERAÇÃO 1] Vertical usa metade da largura do widget horizontal
function _play_montarConteudo(orientacao, input, btnProximo, btnEncerrar){
	let div = document.createElement('div')
	if(orientacao === 'horizontal'){
		Object.assign(div.style, { display:'flex', flexDirection:'column', gap:'6px' })
		Object.assign(input.style, {
			width:'100%', background:'rgba(255,255,255,0.06)',
			border:'1px solid rgba(255,255,255,0.12)', borderRadius:'7px',
			color:'#cce0f5', padding:'7px 10px', fontSize:'12px',
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
			width:'100%', background:'rgba(255,255,255,0.06)',
			border:'1px solid rgba(255,255,255,0.12)', borderRadius:'7px',
			color:'#cce0f5', padding:'5px 7px', fontSize:'11px',
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

function _play_estilizarBtnProximo(btn){
	Object.assign(btn.style, {
		flex:'1', background:'#F9B73F', color:'#072B57',
		border:'none', borderRadius:'7px', padding:'7px 12px',
		fontWeight:'700', fontSize:'12px', cursor:'pointer',
		fontFamily:"'Segoe UI', system-ui, sans-serif",
	})
}
function _play_estilizarBtnEncerrar(btn){
	Object.assign(btn.style, {
		flex:'1', background:'#1a3350', color:'#cce0f5',
		border:'1px solid rgba(255,255,255,0.15)', borderRadius:'7px',
		padding:'7px 12px', fontWeight:'700', fontSize:'12px',
		cursor:'pointer', fontFamily:"'Segoe UI', system-ui, sans-serif",
	})
}
function _play_estilizarBtnSecundario(btn){
	Object.assign(btn.style, {
		background:'#112235', color:'#5e84a8',
		border:'1px solid rgba(255,255,255,0.08)', borderRadius:'5px',
		padding:'3px 7px', fontSize:'13px', cursor:'pointer',
		fontFamily:"'Segoe UI', system-ui, sans-serif",
	})
}


// ── Arrastar widget e salvar posição por slot ─────────────────
// [ALTERAÇÃO 2] Posição salva por slotIndex dentro da tarefa

function _play_tornarArrastavel(el, alca, slotIndex, nomeTarefa){
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
			_play_salvarPosicaoSlot(
				{ top: el.style.top, left: el.style.left, right:'auto', bottom:'auto' },
				slotIndex, nomeTarefa
			)
		}
		document.addEventListener('mousemove', mover)
		document.addEventListener('mouseup',   soltar)
	})
}

async function _play_salvarPosicaoSlot(pos, slotIndex, nomeTarefa){
	let cfg          = await obterArmazenamento(['widgetPosSlot'])
	let widgetPosSlot = cfg?.widgetPosSlot || {}
	if(!widgetPosSlot[nomeTarefa]) widgetPosSlot[nomeTarefa] = {}
	widgetPosSlot[nomeTarefa][slotIndex] = pos
	await armazenar({ widgetPosSlot })
}

async function _play_salvarOrientacaoWidget(orientacao, slotIndex, nomeTarefa){
	let cfg  = await obterArmazenamento(['tarefas'])
	let tarefas = cfg?.tarefas || {}
	if(!tarefas[nomeTarefa]) return
	let slots = tarefas[nomeTarefa].slots || []
	if(slots[slotIndex]) slots[slotIndex].orientacao = orientacao
	tarefas[nomeTarefa].slots = slots
	await armazenar({ tarefas })
}


// ── Avisos visuais ────────────────────────────────────────────

function play_avisoTemporario(msg = '', tipo = 'info', ms = 3000){
	let c = document.getElementById('pjeplay-avisos')
	if(!c){
		c = document.createElement('div')
		c.id = 'pjeplay-avisos'
		Object.assign(c.style, {
			position:'fixed', top:'16px', left:'50%',
			transform:'translateX(-50%)',
			zIndex: String(PLAY_Z.aviso),
			display:'flex', flexDirection:'column', gap:'6px',
			maxWidth:'420px', width:'max-content',
			fontFamily:"'Segoe UI', system-ui, sans-serif",
			pointerEvents:'none',
		})
		document.body.appendChild(c)
	}
	let el = document.createElement('div')
	Object.assign(el.style, {
		background: tipo==='erro'?'#7b1c1c': tipo==='sucesso'?'#1a4d2e':'#0d1b2a',
		color:'#fff',
		borderLeft: '4px solid ' + (tipo==='erro'?'#e74c3c':tipo==='sucesso'?'#2ecc71':'#F9B73F'),
		borderRadius:'8px', padding:'10px 16px',
		fontSize:'13px', lineHeight:'1.4',
		boxShadow:'0 4px 16px rgba(0,0,0,0.5)',
		opacity:'1', transition:'opacity 0.35s', whiteSpace:'pre-wrap',
	})
	el.textContent = msg
	c.appendChild(el)
	setTimeout(() => { el.style.opacity='0'; setTimeout(()=>el.remove(), 380) }, ms)
}


// ── Relatório final ───────────────────────────────────────────

function play_exibirRelatorio(){
	if(!_play_relatorio.length){
		play_avisoTemporario('Nenhum processo revisado.', 'info', 4000)
		return
	}

	remover('#pjeplay-relatorio')

	let painel = document.createElement('div')
	painel.id  = 'pjeplay-relatorio'
	Object.assign(painel.style, {
		position:     'fixed',
		inset:        '0',
		background:   'rgba(0,0,0,0.65)',
		zIndex:       String(PLAY_Z.modal),
		display:      'flex',
		alignItems:   'center',
		justifyContent:'center',
		fontFamily:   "'Segoe UI', system-ui, sans-serif",
	})

	let caixa = document.createElement('div')
	Object.assign(caixa.style, {
		background:   '#0d1b2a',
		border:       '1px solid rgba(249,183,63,0.3)',
		borderRadius: '14px',
		padding:      '24px',
		maxWidth:     '90vw',
		maxHeight:    '80vh',
		display:      'flex',
		flexDirection:'column',
		gap:          '14px',
		boxShadow:    '0 12px 40px rgba(0,0,0,0.7)',
		overflow:     'hidden',
	})

	let cab = document.createElement('div')
	Object.assign(cab.style, { display:'flex', alignItems:'center', justifyContent:'space-between' })
	let tit = document.createElement('span')
	Object.assign(tit.style, { color:'#F9B73F', fontWeight:'700', fontSize:'15px' })
	tit.textContent = '▶ PJE PLAY — Relatório (' + _play_relatorio.length + ' processos)'
	let btnX = document.createElement('button')
	Object.assign(btnX.style, {
		background:'transparent', border:'none', color:'#5e84a8',
		fontSize:'22px', cursor:'pointer', lineHeight:'1', padding:'0 4px',
	})
	btnX.textContent = '×'
	btnX.addEventListener('click', () => painel.remove())
	cab.appendChild(tit); cab.appendChild(btnX)

	let area = document.createElement('div')
	Object.assign(area.style, { overflowY:'auto', overflowX:'auto', flex:'1' })

	let tabela = document.createElement('table')
	Object.assign(tabela.style, {
		width:'100%', borderCollapse:'collapse',
		fontSize:'12px', color:'#cce0f5',
	})

	let thead = document.createElement('thead')
	let trH   = document.createElement('tr')
	let cabCols = ['Processo', 'Anotação / Opção']

	cabCols.forEach(c => {
		let th = document.createElement('th')
		Object.assign(th.style, {
			padding:'8px 12px', textAlign:'left',
			background:'#112235', color:'#F9B73F',
			borderBottom:'1px solid rgba(255,255,255,0.1)',
			whiteSpace:'nowrap', fontWeight:'700',
		})
		th.textContent = c
		trH.appendChild(th)
	})
	thead.appendChild(trH); tabela.appendChild(thead)

	let tbody = document.createElement('tbody')
	_play_relatorio.forEach((item, idx) => {
		let tr = document.createElement('tr')
		tr.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.03)'

		let cellNum = document.createElement('td')
		Object.assign(cellNum.style, { padding:'7px 12px', borderBottom:'1px solid rgba(255,255,255,0.05)', whiteSpace:'nowrap' })
		cellNum.textContent = item.numProc
		tr.appendChild(cellNum)

		let cellNota = document.createElement('td')
		Object.assign(cellNota.style, { padding:'7px 12px', borderBottom:'1px solid rgba(255,255,255,0.05)' })
		cellNota.textContent = item.nota || ''
		tr.appendChild(cellNota)

		tbody.appendChild(tr)
	})
	tabela.appendChild(tbody)
	area.appendChild(tabela)

	let btnCopiar = document.createElement('button')
	Object.assign(btnCopiar.style, {
		background:'#F9B73F', color:'#072B57', border:'none',
		borderRadius:'8px', padding:'9px 20px', fontWeight:'700',
		fontSize:'13px', cursor:'pointer', alignSelf:'flex-end',
	})
	btnCopiar.textContent = '📋 Copiar como tabela'
	btnCopiar.addEventListener('click', () => {
		let linhas = _play_relatorio.map(item => {
			return [item.numProc, item.nota || ''].join('\t')
		})
		let tsv = cabCols.join('\t') + '\n' + linhas.join('\n')
		navigator.clipboard.writeText(tsv)
			.then(() => { btnCopiar.textContent = '✅ Copiado!'; setTimeout(()=>{ btnCopiar.textContent='📋 Copiar como tabela' }, 2000) })
			.catch(() => play_avisoTemporario('Erro ao copiar.', 'erro', 3000))
	})

	caixa.appendChild(cab)
	caixa.appendChild(area)
	caixa.appendChild(btnCopiar)
	painel.appendChild(caixa)
	document.body.appendChild(painel)
}

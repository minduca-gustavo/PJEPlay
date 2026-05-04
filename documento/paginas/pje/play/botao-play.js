// ============================================================
// botao-play.js
// Botão ▶ PJE PLAY — dividido em TELA e LISTA.
//
// TELA → varre o body e coleta processos visíveis (comportamento original)
// LISTA → abre painel de input para colar/digitar lista de processos.
//         Tem opção "com parâmetros": o usuário cola uma tabela com
//         número do processo + colunas extras. As colunas extras ficam
//         salvas e aparecem como botões de clipboard no widget.
// ============================================================


// ── Configuração de telas ─────────────────────────────────────

const PLAY_BOTOES_CONFIG = [
	{ url: '/pjekz/painel/',                   ancora: '#brasao-republica', x: 28, y: 0 },
	{ url: '/pjekz/escaninho',                 ancora: '#brasao-republica', x: 28, y: 0 },
	{ url: '/pjekz/pauta-audiencias',          ancora: '#brasao-republica', x: 28, y: 0 },
	{ url: '/pjekz/gigs/relatorios',           ancora: '#brasao-republica', x: 28, y: 0 },
	{ url: '/pjekz/comunicacoesprocessuais',   ancora: '#brasao-republica', x: 28, y: 0 },
	{ url: '/pjekz/atas-audiencias',           ancora: '#brasao-republica', x: 28, y: 0 },
	{ url: '/gigs/meu-painel',                 ancora: '#brasao-republica', x: 28, y: 0 },
]


// ── Regex CNJ ─────────────────────────────────────────────────

const PLAY_REGEX_CNJ = /\d{7}[-\.]\d{2}[-\.]\d{4}[-\.]\d[-\.]\d{2}[-\.]\d{4}/g


// ── Parser de lista: extrai números CNJ de qualquer texto ─────

function play_parsearListaProcessos(texto){
	if(!texto) return []
	let matches = [...texto.matchAll(PLAY_REGEX_CNJ)]
	let vistos  = new Set()
	let lista   = []
	for(let m of matches){
		let num = m[0]
		if(!vistos.has(num)){ vistos.add(num); lista.push(num) }
	}
	return lista
}


// ── Parser de lista com parâmetros ───────────────────────────
//
// Entrada: texto tabulado onde a 1ª coluna é o número CNJ
// e as demais colunas são informações extras.
//
// Retorna:
//   {
//     fila: [{ numProc, id: null, dadosLinha: [], params: ['info X', 'info Y', ...] }],
//   }

function play_parsearListaComParametros(texto){
	if(!texto) return { fila: [] }

	let linhas = texto.split(/\r?\n/).filter(l => l.trim())
	let fila   = []
	let vistos = new Set()

	for(let linha of linhas){
		let partes = linha.split('\t')
		// Encontra número CNJ em qualquer coluna (geralmente a 1ª)
		let numProc = null
		let idxNum  = -1
		for(let i = 0; i < partes.length; i++){
			let match = partes[i].match(/\d{7}[-\.]\d{2}[-\.]\d{4}[-\.]\d[-\.]\d{2}[-\.]\d{4}/)
			if(match){ numProc = match[0]; idxNum = i; break }
		}
		if(!numProc || vistos.has(numProc)) continue
		vistos.add(numProc)

		// Colunas extras = todas exceto a do número CNJ
		let params = partes.filter((_, i) => i !== idxNum).map(p => p.trim()).filter(Boolean)
		fila.push({ numProc, id: null, dadosLinha: [], params })
	}

	return { fila }
}


// ── Estado ────────────────────────────────────────────────────

const _play_registros = []
let   _play_painelLista = null


// ── Inicialização ─────────────────────────────────────────────

function botaoPlay_iniciar(){
	PLAY_BOTOES_CONFIG.forEach(cfg => {
		let reg = { config: cfg, btn: null, posAnterior: null }
		_play_registros.push(reg)
		_play_rastrear(reg)
	})
}

function botaoPlay_atualizarUrl(){
	_play_registros.forEach(reg => _play_sincronizar(reg))
}


// ── Loop de rastreamento ──────────────────────────────────────

function _play_rastrear(reg){
	function frame(){ _play_sincronizar(reg); requestAnimationFrame(frame) }
	requestAnimationFrame(frame)
}

function _play_sincronizar(reg){
	let { config } = reg
	let { url, ancora, x, y } = config

	let urls  = Array.isArray(url) ? url : (url ? [url] : [])
	let urlOk = urls.length === 0 || urls.some(u => location.href.includes(u))
	if(!urlOk){
		if(reg.btn) reg.btn.style.display = 'none'
		return
	}

	let ancoraEl = document.querySelector(ancora)
	if(!ancoraEl){
		if(reg.btn) reg.btn.style.display = 'none'
		return
	}

	if(!reg.btn){
		reg.btn = _play_criarBotaoDOM()
		document.body.appendChild(reg.btn)
	}

	_play_posicionar(reg, ancoraEl, x, y)
}

function _play_posicionar(reg, ancoraEl, x, y){
	let btn = reg.btn
	let r   = ancoraEl.getBoundingClientRect()
	let vH  = window.innerHeight, vW = window.innerWidth

	if(r.bottom <= 0 || r.top >= vH || r.right <= 0 || r.left >= vW){
		btn.style.display = 'none'; return
	}

	// Layout sempre vertical (horizontal descontinuado)
	let cy   = r.top + r.height / 2
	let left = x >= 0 ? Math.round(r.right + x) : Math.round(r.left + x - btn.offsetWidth)
	let top  = Math.round(cy - btn.offsetHeight / 2 - y)

	let chave = top + ',' + left
	if(reg.posAnterior !== chave){
		btn.style.top    = top  + 'px'
		btn.style.left   = left + 'px'
		btn.style.right  = 'auto'
		btn.style.bottom = 'auto'
		reg.posAnterior  = chave
	}
	btn.style.display = 'flex'
}


// ════════════════════════════════════════════════════════════
// BOTÃO DIVIDIDO: TELA | LISTA
// ════════════════════════════════════════════════════════════

function _play_criarBotaoDOM(){
	let btn = document.createElement('div')
	btn.id  = 'pjeplay-btn-play'
	Object.assign(btn.style, {
		position:       'fixed',
		zIndex:         '9000',
		display:        'none',
		flexDirection:  'column',
		alignItems:     'center',
		gap:            '0',
		background:     '#F9B73F',
		color:          '#072B57',
		border:         '2.5px solid rgba(7,43,87,0.3)',
		borderRadius:   '12px',
		cursor:         'default',
		fontFamily:     "'Segoe UI', system-ui, sans-serif",
		fontWeight:     '800',
		boxShadow:      '0 3px 14px rgba(0,0,0,0.35)',
		userSelect:     'none',
		overflow:       'hidden',
		minWidth:       '96px',
	})

	// ── Linha superior: dois lados clicáveis ─────────────────
	let linha = document.createElement('div')
	Object.assign(linha.style, {
		display:    'flex',
		alignItems: 'stretch',
		width:      '100%',
	})

	// Lado TELA
	let ladoTela = _play_criarLado('TELA')
	ladoTela.addEventListener('click', e => { e.stopPropagation(); _play_aoClicarTela() })

	// Divisória
	let div = document.createElement('div')
	Object.assign(div.style, {
		width:      '2px',
		background: 'rgba(7,43,87,0.25)',
		flexShrink: '0',
	})

	// Lado LISTA
	let ladoLista = _play_criarLado('LISTA')
	ladoLista.addEventListener('click', e => { e.stopPropagation(); _play_aoClicarLista(btn) })

	linha.appendChild(ladoTela)
	linha.appendChild(div)
	linha.appendChild(ladoLista)

	// ── Label inferior ────────────────────────────────────────
	let label = document.createElement('div')
	label.textContent = 'PJE  PLAY'
	Object.assign(label.style, {
		fontSize:      '8px',
		letterSpacing: '1.5px',
		fontWeight:    '800',
		padding:       '1px 0 2px',
		width:         '100%',
		textAlign:     'center',
		borderTop:     '1.5px solid rgba(7,43,87,0.18)',
		pointerEvents: 'none',
	})

	btn.appendChild(linha)
	btn.appendChild(label)

	return btn
}

function _play_criarLado(texto){
	let lado = document.createElement('div')
	Object.assign(lado.style, {
		display:        'flex',
		flexDirection:  'column',
		alignItems:     'center',
		justifyContent: 'center',
		padding:        '5px 8px 2px',
		cursor:         'pointer',
		transition:     'background 0.12s',
		flex:           '1',
		gap:            '3px',
	})

	let icone = document.createElement('span')
	icone.textContent = '▶'
	Object.assign(icone.style, { fontSize: '16px', lineHeight: '1' })

	let lbl = document.createElement('span')
	lbl.textContent = texto
	Object.assign(lbl.style, { fontSize: '8px', letterSpacing: '0.8px', fontWeight: '800' })

	lado.appendChild(icone)
	lado.appendChild(lbl)

	lado.addEventListener('mouseenter', () => { lado.style.background = 'rgba(7,43,87,0.1)' })
	lado.addEventListener('mouseleave', () => { lado.style.background = 'transparent' })
	lado.addEventListener('mousedown',  () => { lado.style.background = 'rgba(7,43,87,0.2)' })
	lado.addEventListener('mouseup',    () => { lado.style.background = 'rgba(7,43,87,0.1)' })

	return lado
}


// ── Ação: TELA ────────────────────────────────────────────────

async function _play_aoClicarTela(){
	let fila = _play_coletarFilaDaTela()

	if(!fila.length){
		play_avisoTemporario('Nenhum número de processo encontrado na tela.', 'erro', 4000)
		return
	}

	play_avisoTemporario('▶ ' + fila.length + ' processo(s) encontrado(s). Iniciando…', 'info', 4000)
	play_iniciarPipeline({ fila })
}


// ── Ação: LISTA ───────────────────────────────────────────────
// Abre painel flutuante. Tem checkbox "com parâmetros".
// Com parâmetros: salva as colunas extras mapeadas por número CNJ.

function _play_aoClicarLista(btnRef){
	if(_play_painelLista){
		_play_painelLista.remove()
		_play_painelLista = null
		return
	}

	let painel = document.createElement('div')
	_play_painelLista = painel

	let r = btnRef.getBoundingClientRect()
	Object.assign(painel.style, {
		position:    'fixed',
		top:         (r.bottom + 8) + 'px',
		left:        r.left + 'px',
		zIndex:      '9001',
		width:       '300px',
		background:  '#0d1b2a',
		border:      '1px solid rgba(249,183,63,0.4)',
		borderRadius:'10px',
		boxShadow:   '0 8px 28px rgba(0,0,0,0.55)',
		padding:     '10px',
		fontFamily:  "'Segoe UI', system-ui, sans-serif",
		display:     'flex',
		flexDirection:'column',
		gap:         '8px',
	})

	// Cabeçalho
	let cab = document.createElement('div')
	Object.assign(cab.style, { display:'flex', justifyContent:'space-between', alignItems:'center' })

	let titPainel = document.createElement('span')
	titPainel.textContent = '▶ Play por lista'
	Object.assign(titPainel.style, { color:'#F9B73F', fontWeight:'700', fontSize:'12px' })

	let btnX = document.createElement('button')
	btnX.textContent = '×'
	Object.assign(btnX.style, {
		background:'transparent', border:'none', color:'#5e84a8',
		fontSize:'18px', cursor:'pointer', lineHeight:'1', padding:'0',
	})
	btnX.addEventListener('click', () => { painel.remove(); _play_painelLista = null })

	cab.appendChild(titPainel)
	cab.appendChild(btnX)

	// ── Checkbox "com parâmetros" ─────────────────────────────
	let wrapCheck = document.createElement('label')
	Object.assign(wrapCheck.style, {
		display: 'flex', alignItems: 'center', gap: '6px',
		cursor: 'pointer', userSelect: 'none',
	})

	let checkbox = document.createElement('input')
	checkbox.type = 'checkbox'
	Object.assign(checkbox.style, { accentColor: '#F9B73F', cursor: 'pointer', width:'14px', height:'14px' })

	let checkLabel = document.createElement('span')
	checkLabel.textContent = 'com parâmetros'
	Object.assign(checkLabel.style, { fontSize: '11px', color: '#cce0f5' })

	wrapCheck.appendChild(checkbox)
	wrapCheck.appendChild(checkLabel)

	// Instrução (muda conforme checkbox)
	let instrucao = document.createElement('p')
	Object.assign(instrucao.style, { fontSize:'10px', color:'#5e84a8', margin:'0', lineHeight:'1.4' })

	function atualizarInstrucao(){
		if(checkbox.checked){
			instrucao.innerHTML =
				'Cole uma tabela tabulada: <b style="color:#F9B73F">1ª coluna = nº processo</b>, ' +
				'demais colunas = parâmetros que aparecerão como botões no widget.'
		} else {
			instrucao.textContent = 'Cole os números de processo em qualquer formato:'
		}
	}
	atualizarInstrucao()
	checkbox.addEventListener('change', atualizarInstrucao)

	// Textarea
	let area = document.createElement('textarea')
	area.placeholder = 'Cole aqui…'
	area.rows = 5
	Object.assign(area.style, {
		width:       '100%',
		resize:      'vertical',
		minHeight:   '90px',
		maxHeight:   '220px',
		background:  'rgba(255,255,255,0.05)',
		border:      '1px solid rgba(255,255,255,0.1)',
		borderRadius:'7px',
		color:       '#cce0f5',
		fontSize:    '12px',
		padding:     '7px 9px',
		outline:     'none',
		fontFamily:  'inherit',
		lineHeight:  '1.4',
		boxSizing:   'border-box',
	})
	area.addEventListener('focus', () => area.style.borderColor = 'rgba(249,183,63,0.45)')
	area.addEventListener('blur',  () => area.style.borderColor = 'rgba(255,255,255,0.1)')

	// Preview
	let preview = document.createElement('span')
	Object.assign(preview.style, { fontSize:'10px', color:'#5e84a8', minHeight:'14px' })

	area.addEventListener('input', () => {
		if(checkbox.checked){
			let { fila } = play_parsearListaComParametros(area.value)
			if(!fila.length){
				preview.textContent = area.value.trim() ? '⚠ Nenhum número CNJ reconhecido.' : ''
				preview.style.color = '#e74c3c'
			} else {
				let temParams = fila.some(f => f.params.length > 0)
				preview.textContent = '✓ ' + fila.length + ' processo(s)' +
					(temParams ? ' · ' + fila[0].params.length + ' parâmetro(s)/linha' : '')
				preview.style.color = '#2ecc71'
			}
		} else {
			let nums = play_parsearListaProcessos(area.value)
			if(!nums.length){
				preview.textContent = area.value.trim() ? '⚠ Nenhum número CNJ reconhecido.' : ''
				preview.style.color = '#e74c3c'
			} else {
				preview.textContent = '✓ ' + nums.length + ' processo(s) reconhecido(s)'
				preview.style.color = '#2ecc71'
			}
		}
	})

	// Rodapé: botão Play
	let rodape = document.createElement('div')
	Object.assign(rodape.style, { display:'flex', justifyContent:'flex-end', gap:'6px' })

	let btnPlay = document.createElement('button')
	btnPlay.textContent = '▶ Iniciar'
	Object.assign(btnPlay.style, {
		background:   '#F9B73F',
		color:        '#072B57',
		border:       'none',
		borderRadius: '7px',
		padding:      '7px 16px',
		fontSize:     '12px',
		fontWeight:   '800',
		cursor:       'pointer',
		letterSpacing:'0.5px',
	})
	btnPlay.addEventListener('mouseenter', () => btnPlay.style.background = '#ffc85a')
	btnPlay.addEventListener('mouseleave', () => btnPlay.style.background = '#F9B73F')

	btnPlay.addEventListener('click', async () => {
		let fila = []

		if(checkbox.checked){
			let parsed = play_parsearListaComParametros(area.value)
			fila = parsed.fila
		} else {
			let nums = play_parsearListaProcessos(area.value)
			fila = nums.map(numProc => ({ numProc, id: null, dadosLinha: [], params: [] }))
		}

		if(!fila.length){
			play_avisoTemporario('Nenhum número de processo reconhecido na lista.', 'erro', 4000)
			return
		}

		// Salva o mapa de parâmetros no localStorage para o widget recuperar
		if(checkbox.checked){
			let mapaParams = {}
			fila.forEach(item => { mapaParams[item.numProc] = item.params })
			localStorage.setItem('pjeplay_params', JSON.stringify(mapaParams))
		} else {
			localStorage.removeItem('pjeplay_params')
		}

		painel.remove()
		_play_painelLista = null

		play_avisoTemporario('▶ ' + fila.length + ' processo(s) na lista. Iniciando…', 'info', 4000)
		play_iniciarPipeline({ fila })
	})

	rodape.appendChild(btnPlay)

	painel.appendChild(cab)
	painel.appendChild(wrapCheck)
	painel.appendChild(instrucao)
	painel.appendChild(area)
	painel.appendChild(preview)
	painel.appendChild(rodape)

	document.body.appendChild(painel)
	area.focus()

	// Fecha ao clicar fora
	setTimeout(() => {
		document.addEventListener('click', function fecharFora(e){
			if(!painel.contains(e.target) && !btnRef.contains(e.target)){
				painel.remove()
				_play_painelLista = null
				document.removeEventListener('click', fecharFora)
			}
		})
	}, 50)
}


// ── Coleta todos os processos visíveis no body ────────────────

function _play_coletarFilaDaTela(){
	let texto   = document.body.innerText || ''
	let matches = [...texto.matchAll(PLAY_REGEX_CNJ)]

	let vistos = new Set()
	let fila   = []

	for(let m of matches){
		let numProc = m[0]
		if(vistos.has(numProc)) continue
		vistos.add(numProc)

		let dadosLinha = _play_capturarDadosDoProcesso(numProc)
		fila.push({ numProc, id: null, dadosLinha, params: [] })
	}

	return fila
}


// ── Localiza o card/linha do processo no DOM ──────────────────

function _play_capturarDadosDoProcesso(numProc){
	let xpath  = `//*[contains(text(),'${numProc.slice(0,7)}')]`
	let result = document.evaluate(xpath, document.body, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)

	for(let i = 0; i < result.snapshotLength; i++){
		let no = result.snapshotItem(i)
		if(!no.textContent.includes(numProc)) continue

		let conteiner = _play_encontrarConteiner(no)
		if(!conteiner) continue

		let celulas = conteiner.querySelectorAll('td, [role="cell"], [role="gridcell"]')
		if(celulas.length)
			return Array.from(celulas).map(c => c.innerText?.trim() || '').filter(Boolean)

		return [conteiner.innerText?.trim() || '']
	}

	return []
}


// ── Sobe na árvore para encontrar o contêiner da linha/card ───

function _play_encontrarConteiner(el){
	let tagsCandidatas    = ['TR', 'LI', 'MAT-ROW']
	let rolesCandidatos   = ['row', 'listitem']
	let classesCandidatas = ['card', 'processo', 'item', 'linha', 'row']

	let atual = el
	for(let i = 0; i < 8; i++){
		if(!atual || atual === document.body) break
		if(tagsCandidatas.includes(atual.tagName))                                    return atual
		if(rolesCandidatos.some(r => atual.getAttribute('role') === r))               return atual
		if(classesCandidatas.some(c => atual.className?.toLowerCase?.().includes(c))) return atual
		atual = atual.parentElement
	}
	return el
}


// ── Busca ID do processo via API ──────────────────────────────

async function _play_buscarIdProcesso(numero){
	let numLimpo = numero.replace(/[.\-]/g, '')
	let dados = await play_fetch(
		location.origin + '/pje-consulta-api/api/processos/dadosbasicos/' + numLimpo
	)
	if(Array.isArray(dados) && dados.length) return dados[0].id || dados[0].idProcesso || null
	if(dados?.id)         return dados.id
	if(dados?.idProcesso) return dados.idProcesso
	return null
}

// ============================================================
// superfiltro.js — Widget flutuante de Super Filtros no PJE
// ============================================================

;(async function iniciarSuperFiltro(){

	if(window._superfiltro_iniciado) return
	window._superfiltro_iniciado = true

	const NAV         = (typeof browser !== 'undefined') ? browser : chrome
	const WIDGET_ID   = 'pjeplay-superfiltro-widget'
	const STORAGE_POS = 'superfiltro_widget_pos'

	// ── Estado do widget ─────────────────────────────────────
	let _expandido     = false   // acordeão aberto/fechado
	let _modoAtivo     = null    // 'Tarefa' | 'Sala' | 'Lista'
	let _arrastando    = false   // flag para distinguir click de drag

	// ── Carrega storage ──────────────────────────────────────
	let store = await NAV.storage.local.get([
		'superfiltro_ativo',
		STORAGE_POS,
	])

	window._superfiltro_ativo = store.superfiltro_ativo === true

	// Só opera se a sessão estiver autenticada (válida por 8h)
	let _authStore = await NAV.storage.local.get(['superfiltro_auth_ts'])
	let _authTs    = _authStore.superfiltro_auth_ts || 0
	if ((Date.now() - _authTs) >= 8 * 60 * 60 * 1000) {
		// Não autenticado — aguarda evento de autenticação para reiniciar
		window.addEventListener('pjeplay:superfiltro-atualizado', () => {
			window._superfiltro_iniciado = false
			iniciarSuperFiltro()
		}, { once: true })
		return
	}

	// ── Sincronização com popup ──────────────────────────────
	const URLS_SUPERFILTRO = ['pjekz/painel', 'pjekz/pauta-audiencias', 'pjekz/escaninho', 'pjekz/gigs/meu-painel']
	function sincronizarWidget(){
		let urlOk = URLS_SUPERFILTRO.some(u => location.href.includes(u))
		if(window._superfiltro_ativo && urlOk) _montarWidget()
		else _removerWidget()
	}

	window.addEventListener('pjeplay:url-mudou', sincronizarWidget)

	window.addEventListener('pjeplay:superfiltro-atualizado', (e) => {
		let d = e.detail || {}
		window._superfiltro_ativo = d.ativo
		sincronizarWidget()
	})

	sincronizarWidget()


	// ════════════════════════════════════════════════════════
	// MONTAGEM DO WIDGET
	// ════════════════════════════════════════════════════════

	function _montarWidget(){
		if(document.getElementById(WIDGET_ID)) return

		let pos = store[STORAGE_POS] || { top: 80, left: 20 }

		// ── Raiz ─────────────────────────────────────────────
		let widget = document.createElement('div')
		widget.id = WIDGET_ID
		_s(widget, {
			position:    'fixed',
			top:         pos.top + 'px',
			left:        pos.left + 'px',
			zIndex:      '999999',
			width:       '230px',
			background:  '#0d1b2a',
			border:      '1px solid rgba(249,183,63,0.35)',
			borderRadius:'12px',
			boxShadow:   '0 8px 32px rgba(0,0,0,0.6)',
			fontFamily:  "'Segoe UI', system-ui, sans-serif",
			fontSize:    '12px',
			color:       '#cce0f5',
			userSelect:  'none',
			overflow:    'hidden',
			transition:  'box-shadow 0.15s',
		})

		// ── Barra de título (sempre visível, arrastável) ──────
		let barra = document.createElement('div')
		_s(barra, {
			display:         'flex',
			alignItems:      'center',
			gap:             '0',
			padding:         '0',
			background:      'rgba(249,183,63,0.09)',
			borderBottom:    '1px solid rgba(249,183,63,0.0)',  // sem borda quando fechado
			cursor:          'grab',
			height:          '30px',
			transition:      'border-color 0.15s',
		})

		// Ícone ⚡
		let icone = document.createElement('span')
		icone.textContent = '⚡'
		_s(icone, {
			padding:    '0 6px 0 10px',
			fontSize:   '13px',
			lineHeight: '1',
			flexShrink: '0',
		})

		// Título
		let titulo = document.createElement('span')
		titulo.textContent = 'Super Filtros'
		_s(titulo, {
			flex:          '1',
			fontWeight:    '700',
			fontSize:      '11px',
			color:         '#F9B73F',
			letterSpacing: '0.4px',
		})

		// Seta acordeão
		let seta = document.createElement('button')
		seta.id = WIDGET_ID + '-seta'
		seta.textContent = '▾'
		_s(seta, {
			background:  'transparent',
			border:      'none',
			color:       '#F9B73F',
			fontSize:    '14px',
			cursor:      'pointer',
			padding:     '0 6px',
			lineHeight:  '1',
			transition:  'transform 0.2s',
			flexShrink:  '0',
		})
		seta.title = 'Expandir / recolher'

		// Botão fechar
		let btnFechar = document.createElement('button')
		btnFechar.textContent = '×'
		_s(btnFechar, {
			background:  'transparent',
			border:      'none',
			color:       '#5e84a8',
			fontSize:    '17px',
			cursor:      'pointer',
			padding:     '0 8px 0 2px',
			lineHeight:  '1',
			flexShrink:  '0',
		})
		btnFechar.title = 'Fechar widget'
		btnFechar.addEventListener('mouseover', () => btnFechar.style.color = '#e74c3c')
		btnFechar.addEventListener('mouseout',  () => btnFechar.style.color = '#5e84a8')
		btnFechar.addEventListener('click', (e) => { e.stopPropagation(); _removerWidget() })

		barra.appendChild(icone)
		barra.appendChild(titulo)
		barra.appendChild(seta)
		barra.appendChild(btnFechar)

		// ── Corpo acordeão (oculto por padrão) ───────────────
		let corpo = document.createElement('div')
		corpo.id = WIDGET_ID + '-corpo'
		_s(corpo, {
			display:       'none',
			flexDirection: 'column',
			overflow:      'hidden',
		})

		// ── Menu de modos: Tarefa | Sala | Lista ──────────────
		let menuModos = document.createElement('div')
		_s(menuModos, {
			display:         'flex',
			gap:             '4px',
			padding:         '8px 8px 0',
		})

		const MODOS = ['Tarefa', 'Sala', 'Lista']
		let botoesMenu = {}

		MODOS.forEach(modo => {
			let btn = document.createElement('button')
			btn.textContent = modo
			btn.dataset.modo = modo
			_s(btn, {
				flex:         '1',
				padding:      '5px 4px',
				fontSize:     '10px',
				fontWeight:   '700',
				background:   '#112235',
				color:        '#5e84a8',
				border:       '1px solid rgba(255,255,255,0.08)',
				borderRadius: '6px',
				cursor:       'pointer',
				transition:   'all 0.12s',
				letterSpacing:'0.3px',
			})
			btn.addEventListener('click', () => _selecionarModo(modo))
			btn.addEventListener('mouseover', () => {
				if(_modoAtivo !== modo) btn.style.color = '#cce0f5'
			})
			btn.addEventListener('mouseout', () => {
				if(_modoAtivo !== modo) btn.style.color = '#5e84a8'
			})
			botoesMenu[modo] = btn
			menuModos.appendChild(btn)
		})

		// ── Input de contexto ─────────────────────────────────
		let wrapInput = document.createElement('div')
		_s(wrapInput, { padding: '6px 8px 0' })

		let inputContexto = document.createElement('textarea')
		inputContexto.id          = WIDGET_ID + '-input'
		inputContexto.placeholder = 'Selecione um modo acima…'
		inputContexto.rows        = 1
		inputContexto.disabled    = true
		_s(inputContexto, {
			width:       '100%',
			resize:      'none',
			background:  'rgba(255,255,255,0.05)',
			border:      '1px solid rgba(255,255,255,0.1)',
			borderRadius:'7px',
			color:       '#cce0f5',
			fontSize:    '12px',
			padding:     '6px 8px',
			outline:     'none',
			lineHeight:  '1.4',
			maxHeight:   '72px',   // ~4 linhas
			overflowY:   'auto',
			transition:  'border-color 0.15s, opacity 0.15s',
			boxSizing:   'border-box',
			fontFamily:  'inherit',
			opacity:     '0.45',
		})

		// Cresce até 4 linhas ao digitar
		inputContexto.addEventListener('input', () => {
			inputContexto.style.height = 'auto'
			inputContexto.style.height = Math.min(inputContexto.scrollHeight, 72) + 'px'
		})
		inputContexto.addEventListener('focus', () => {
			inputContexto.style.borderColor = 'rgba(249,183,63,0.45)'
		})
		inputContexto.addEventListener('blur', () => {
			inputContexto.style.borderColor = 'rgba(255,255,255,0.1)'
		})

		wrapInput.appendChild(inputContexto)

		// ── Preview de parse (modo Lista) ─────────────────────
		let wrapPreview = document.createElement('div')
		_s(wrapPreview, { padding: '2px 8px 0' })
		let previewParse = document.createElement('span')
		previewParse.id = WIDGET_ID + '-preview'
		_s(previewParse, { fontSize:'10px', display:'block', minHeight:'13px', color:'#5e84a8' })
		wrapPreview.appendChild(previewParse)

		inputContexto.addEventListener('input', () => {
			if(!inputContexto.dataset.parseMode){ previewParse.textContent = ''; return }
			// Usa o parser do botão play (global) se disponível
			let parseFn = typeof play_parsearListaProcessos === 'function'
				? play_parsearListaProcessos
				: (txt) => { let m = [...txt.matchAll(/\d{7}[-.\.]\d{2}[-.\.]\d{4}[-.\.]\d[-.\.]\d{2}[-.\.]\d{4}/g)]; return [...new Set(m.map(x=>x[0]))] }
			let nums = parseFn(inputContexto.value)
			if(!inputContexto.value.trim()){
				previewParse.textContent = ''
			} else if(!nums.length){
				previewParse.textContent = '⚠ Nenhum nº CNJ reconhecido'
				previewParse.style.color = '#e74c3c'
			} else {
				previewParse.textContent = '✓ ' + nums.length + ' processo(s)'
				previewParse.style.color = '#2ecc71'
			}
		})

		// ── Parâmetros de pool ────────────────────────────────
		let wrapParams = document.createElement('div')
		_s(wrapParams, {
			display:             'grid',
			gridTemplateColumns: '1fr 1fr 1fr',
			gap:                 '4px',
			padding:             '6px 8px 0',
		})

		const PARAMS_DEF = [
			{ id: 'concorrencia', label: 'Conc.',    placeholder: '5',   min: 1, max: 500  },
			{ id: 'tentativas',   label: 'Tent.',    placeholder: '2',   min: 1, max: 10   },
			{ id: 'pausaMs',      label: 'Pausa ms', placeholder: '500', min: 0, max: 9999 },
		]

		PARAMS_DEF.forEach(({ id, label, placeholder, min, max }) => {
			let wrap = document.createElement('div')
			_s(wrap, { display:'flex', flexDirection:'column', gap:'2px' })

			let lbl = document.createElement('label')
			lbl.textContent = label
			_s(lbl, { fontSize:'9px', color:'#5e84a8', letterSpacing:'0.3px' })

			let inp = document.createElement('input')
			inp.type        = 'number'
			inp.id          = WIDGET_ID + '-param-' + id
			inp.placeholder = placeholder
			inp.min         = min
			inp.max         = max
			_s(inp, {
				width:       '100%',
				background:  'rgba(255,255,255,0.05)',
				border:      '1px solid rgba(255,255,255,0.1)',
				borderRadius:'6px',
				color:       '#cce0f5',
				fontSize:    '11px',
				padding:     '4px 6px',
				outline:     'none',
				boxSizing:   'border-box',   // ← corrigido
				fontFamily:  'inherit',
				textAlign:   'center',
			})
			inp.addEventListener('focus', () => inp.style.borderColor = 'rgba(249,183,63,0.45)')
			inp.addEventListener('blur',  () => inp.style.borderColor = 'rgba(255,255,255,0.1)')

			wrap.appendChild(lbl)
			wrap.appendChild(inp)
			wrapParams.appendChild(wrap)
		})

		// ── Divisor ───────────────────────────────────────────
		let divisor = document.createElement('div')
		_s(divisor, {
			height:     '1px',
			margin:     '8px 8px 0',
			background: 'rgba(255,255,255,0.07)',
		})

		// ── Botões de funcionalidades ─────────────────────────
		let areaFuncs = document.createElement('div')
		areaFuncs.id = WIDGET_ID + '-funcs'
		_s(areaFuncs, {
			padding:       '6px 8px 6px',
			display:       'flex',
			flexDirection: 'column',
			gap:           '4px',
			maxHeight:     '220px',
			overflowY:     'auto',
		})

		// ── Área de resultado ─────────────────────────────────
		let areaResultado = document.createElement('div')
		areaResultado.id = WIDGET_ID + '-resultado'
		areaResultado.style.display = 'none'
		_s(areaResultado, {
			borderTop: '1px solid rgba(255,255,255,0.07)',
			padding:   '8px',
		})

		let tabelaResultado = document.createElement('div')
		tabelaResultado.id = WIDGET_ID + '-tabela'
		_s(tabelaResultado, {
			maxHeight:   '150px',
			overflowY:   'auto',
			fontSize:    '11px',
			lineHeight:  '1.5',
			color:       '#cce0f5',
			marginBottom:'6px',
			whiteSpace:  'pre-wrap',
			wordBreak:   'break-word',
		})

		let rodapeRes = document.createElement('div')
		_s(rodapeRes, { display:'flex', justifyContent:'flex-end', gap:'6px' })

		let btnCopiar = _btnAcao('📋 Copiar', '#1a3350', '#cce0f5')
		btnCopiar.addEventListener('click', () => {
			navigator.clipboard.writeText(tabelaResultado.innerText || tabelaResultado.textContent)
				.then(() => {
					btnCopiar.textContent = '✅ Copiado!'
					setTimeout(() => { btnCopiar.textContent = '📋 Copiar' }, 1800)
				}).catch(()=>{})
		})

		let btnFecharRes = _btnAcao('Fechar', '#1a3350', '#5e84a8')
		btnFecharRes.addEventListener('click', () => {
			areaResultado.style.display = 'none'
			tabelaResultado.innerHTML   = ''
		})

		rodapeRes.appendChild(btnCopiar)
		rodapeRes.appendChild(btnFecharRes)
		areaResultado.appendChild(tabelaResultado)
		areaResultado.appendChild(rodapeRes)

		// ── Montagem do corpo ─────────────────────────────────
		corpo.appendChild(menuModos)
		corpo.appendChild(wrapInput)
		corpo.appendChild(wrapPreview)
		corpo.appendChild(wrapParams)    // ← novo, após declaração de todas as variáveis
		corpo.appendChild(divisor)
		corpo.appendChild(areaFuncs)
		corpo.appendChild(areaResultado)

		// ── Montagem final do widget ──────────────────────────
		widget.appendChild(barra)
		widget.appendChild(corpo)
		document.body.appendChild(widget)

		// ── Toggle acordeão via seta ──────────────────────────
		function _toggleExpansao(){
			if(_arrastando) return
			_expandido = !_expandido
			corpo.style.display       = _expandido ? 'flex'     : 'none'
			seta.style.transform      = _expandido ? 'rotate(180deg)' : ''
			barra.style.borderBottom  = _expandido
				? '1px solid rgba(249,183,63,0.2)'
				: '1px solid rgba(249,183,63,0.0)'
		}

		seta.addEventListener('click', (e) => { e.stopPropagation(); _toggleExpansao() })
		// Clicar na barra (exceto nos botões) também abre
		barra.addEventListener('click', (e) => {
			if(e.target === btnFechar || e.target === seta) return
			_toggleExpansao()
		})

		// ── Selecionar modo ───────────────────────────────────
		function _selecionarModo(modo){
			_modoAtivo = modo
			Object.values(botoesMenu).forEach(b => {
				let ativo = b.dataset.modo === modo
				b.style.background  = ativo ? 'rgba(249,183,63,0.18)' : '#112235'
				b.style.color       = ativo ? '#F9B73F'               : '#5e84a8'
				b.style.borderColor = ativo ? 'rgba(249,183,63,0.4)'  : 'rgba(255,255,255,0.08)'
			})

			inputContexto.disabled      = false
			inputContexto.style.opacity = '1'

			const placeholders = {
				Tarefa: 'Digite o nome da tarefa…',
				Sala:   'Digite o nome da sala…',
				Lista:  'Cole os números de processo…',
			}
			inputContexto.placeholder  = placeholders[modo] || ''
			inputContexto.value        = ''
			inputContexto.style.height = ''
			inputContexto.focus()
			_atualizarBotoesFunc()
		}

		// ── Arrastar ──────────────────────────────────────────
		_ativarArrasto(widget, barra, btnFechar, seta)
	}


	// ── Atualizar botões de funcionalidades ──────────────────
	// Os botões são definidos no arquivo sf-botoes.js via SF_BOTOES
	function _atualizarBotoesFunc(){
		let area = document.getElementById(WIDGET_ID + '-funcs')
		if(!area) return
		area.innerHTML = ''

		let botoes = (typeof SF_BOTOES !== 'undefined') ? SF_BOTOES : []

		if(!botoes.length){
			let aviso = document.createElement('p')
			aviso.textContent = 'Nenhum botão configurado em sf-botoes.js.'
			_s(aviso, { fontSize:'11px', color:'#5e84a8', textAlign:'center', padding:'4px 0 6px' })
			area.appendChild(aviso)
			return
		}

		botoes.forEach(({ nome, modo, funcao }) => {
			if (modo && (Array.isArray(modo) ? !modo.includes(_modoAtivo) : modo !== _modoAtivo)) return
			let btn = document.createElement('button')
			btn.textContent = nome
			_s(btn, {
				background:   '#112235',
				border:       '1px solid rgba(255,255,255,0.08)',
				borderRadius: '7px',
				color:        '#cce0f5',
				padding:      '6px 9px',
				fontSize:     '11px',
				fontWeight:   '600',
				cursor:       'pointer',
				textAlign:    'left',
				transition:   'all 0.12s',
				width:        '100%',
			})
			btn.addEventListener('mouseover', () => {
				btn.style.background  = 'rgba(249,183,63,0.12)'
				btn.style.borderColor = 'rgba(249,183,63,0.3)'
				btn.style.color       = '#F9B73F'
			})
			btn.addEventListener('mouseout', () => {
				btn.style.background  = '#112235'
				btn.style.borderColor = 'rgba(255,255,255,0.08)'
				btn.style.color       = '#cce0f5'
			})
			btn.addEventListener('click', () => _executarFuncionalidade(nome, funcao))
			area.appendChild(btn)
		})
	}


	// ── Executar funcionalidade ───────────────────────────────
	async function _executarFuncionalidade(nome, funcao){
		let tabelaEl = document.getElementById(WIDGET_ID + '-tabela')
		let resultEl = document.getElementById(WIDGET_ID + '-resultado')
		let inputEl  = document.getElementById(WIDGET_ID + '-input')
		if(!tabelaEl || !resultEl) return

		let valorBruto = inputEl ? inputEl.value.trim() : ''
		let listaProcessos = []
		if(_modoAtivo === 'Lista'){
			let parseFn = typeof play_parsearListaProcessos === 'function'
				? play_parsearListaProcessos
				: (txt) => { let m = [...txt.matchAll(/\d{7}[-.\.]\d{2}[-.\.]\d{4}[-.\.]\d[-.\.]\d{2}[-.\.]\d{4}/g)]; return [...new Set(m.map(x=>x[0]))] }
			listaProcessos = parseFn(valorBruto)
		}

		function _lerParam(id, fallback){
			let el  = document.getElementById(WIDGET_ID + '-param-' + id)
			let val = el ? parseInt(el.value) : NaN
			return isNaN(val) ? fallback : val
		}

		// Expõe callback de progresso para os botões usarem via sf_pool
		let contexto = {
			modo:         _modoAtivo,
			valor:        valorBruto,
			lista:        listaProcessos,
			concorrencia: _lerParam('concorrencia', 5),
			tentativas:   _lerParam('tentativas',   2),
			pausaMs:      _lerParam('pausaMs',      500),
			progresso: (feitos, total) => {
				tabelaEl.textContent = '⏳ ' + feitos + ' / ' + total + ' processos…'
			},
		}

		tabelaEl.textContent   = '⏳ Iniciando…'
		resultEl.style.display = 'block'

		try {
			let resultado = await funcao(contexto)

			if(resultado === undefined || resultado === null){
				tabelaEl.textContent = '(sem resultado)'
				return
			}
			if(Array.isArray(resultado)){
				if(!resultado.length){ tabelaEl.textContent = '(nenhum resultado encontrado)'; return }
				_renderizarTabela(tabelaEl, resultado)
			} else {
				tabelaEl.textContent = String(resultado)
			}
		} catch(err){
			tabelaEl.textContent = '❌ Erro: ' + err.message
		}
	}


	// ── Renderizar tabela ─────────────────────────────────────
	function _renderizarTabela(el, dados){
		el.innerHTML = ''
		if(typeof dados[0] === 'string' || typeof dados[0] === 'number'){
			el.textContent = dados.join('\n'); return
		}
		let chaves = Object.keys(dados[0])
		let tabela = document.createElement('table')
		_s(tabela, { width:'100%', borderCollapse:'collapse', fontSize:'11px' })

		let thead = tabela.createTHead()
		let trH   = thead.insertRow()
		chaves.forEach(c => {
			let th = document.createElement('th')
			th.textContent = c
			_s(th, { textAlign:'left', padding:'3px 5px', color:'#F9B73F', fontWeight:'700', borderBottom:'1px solid rgba(249,183,63,0.2)' })
			trH.appendChild(th)
		})

		let tbody = tabela.createTBody()
		dados.forEach((linha, i) => {
			let tr = tbody.insertRow()
			tr.style.background = i%2===0 ? 'transparent' : 'rgba(255,255,255,0.03)'
			chaves.forEach(c => {
				let td = document.createElement('td')
				td.textContent = linha[c] ?? ''
				_s(td, { padding:'3px 5px', color:'#cce0f5' })
				tr.appendChild(td)
			})
		})
		el.appendChild(tabela)
	}


	// ── Remover widget ────────────────────────────────────────
	function _removerWidget(){
		let w = document.getElementById(WIDGET_ID)
		if(w) w.remove()
		_expandido = false
		_modoAtivo = null
	}


	// ── Arrastar (com flag para separar de click) ─────────────
	function _ativarArrasto(widget, alca, ...excluidos){
		let ox = 0, oy = 0
		let moveu = false

		alca.addEventListener('mousedown', (e) => {
			if(excluidos.some(el => el.contains(e.target))) return
			_arrastando = false
			moveu       = false
			ox = e.clientX - widget.getBoundingClientRect().left
			oy = e.clientY - widget.getBoundingClientRect().top
			alca.style.cursor = 'grabbing'
			e.preventDefault()

			function onMove(e){
				let dx = Math.abs(e.clientX - ox - widget.getBoundingClientRect().left + ox)
				if(!moveu && (Math.abs(e.clientX - (ox + widget.getBoundingClientRect().left - ox)) > 3 ||
				               Math.abs(e.clientY - (oy + widget.getBoundingClientRect().top  - oy)) > 3)){
					moveu = true; _arrastando = true
				}
				let novoLeft = Math.max(0, Math.min(e.clientX - ox, window.innerWidth  - widget.offsetWidth))
				let novoTop  = Math.max(0, Math.min(e.clientY - oy, window.innerHeight - widget.offsetHeight))
				widget.style.left = novoLeft + 'px'
				widget.style.top  = novoTop  + 'px'
			}

			function onUp(){
				alca.style.cursor = 'grab'
				document.removeEventListener('mousemove', onMove)
				document.removeEventListener('mouseup',  onUp)
				NAV.storage.local.set({
					[STORAGE_POS]: {
						top:  parseInt(widget.style.top),
						left: parseInt(widget.style.left),
					}
				})
				// Reseta a flag após um tick para o click não disparar
				setTimeout(() => { _arrastando = false }, 0)
			}

			document.addEventListener('mousemove', onMove)
			document.addEventListener('mouseup',  onUp)
		})
	}


	// ── Utilitários ───────────────────────────────────────────
	function _s(el, styles){ Object.assign(el.style, styles) }

	function _btnAcao(texto, bg, cor){
		let btn = document.createElement('button')
		btn.textContent = texto
		_s(btn, {
			background: bg, border:'1px solid rgba(255,255,255,0.1)',
			borderRadius:'6px', color:cor, padding:'5px 10px',
			fontSize:'11px', fontWeight:'600', cursor:'pointer',
		})
		return btn
	}

})()
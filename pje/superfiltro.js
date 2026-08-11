// ============================================================
// superfiltro.js — Widget flutuante de Super Filtros no PJE
// ============================================================

;(async function iniciarSuperFiltro(){

	const NAV       = (typeof browser !== 'undefined') ? browser : chrome
	const WIDGET_ID = 'pjerota-superfiltro-widget'

	// Se uma instância anterior deste script já rodou nesta mesma página
	// (reinjeção do content script sem navegação, reload da extensão em
	// modo dev etc.), o widget velho pode ter ficado no DOM com closures
	// mortas. O guard antigo (`if(window._superfiltro_iniciado) return`)
	// abortava a reinicialização inteira nesse cenário — não removia o
	// widget órfão nem montava um novo. Aqui, em vez de abortar, remove
	// o resquício e segue o fluxo normal, que decide se remonta com base
	// no estado atual (storage + URL).
	if (window._superfiltro_iniciado) {
		document.getElementById(WIDGET_ID)?.remove()
	}
	window._superfiltro_iniciado = true

	// ── Paleta institucional ─────────────────────────────────
	const C = {
		azul:        '#0078aa',
		azulClaro:   '#2a5a8c',
		laranja:     '#ffa726',
		laranjaEsc:  '#D68C20',
		branco:      '#ffffff',
		fundo:       '#f9f9fa',
		borda:       '#dcdcdc',
		texto:       '#2c3e50',
		textoSuave:  '#6b7c93',
		infoBg:      '#eaf2fb',
		infoBorda:   '#add8e6',
		infoTexto:   '#1a3a5c',
		okBg:        '#e8f8ef',
		okBorda:     '#82dda8',
		okTexto:     '#1e8449',
		erroBg:      '#fbeaea',
		erroBorda:   '#f5c6c6',
		erroTexto:   '#c0392b',
	}

	// ── Estado do widget ─────────────────────────────────────
	let _modoAtivo = null

	// ── Carrega storage ──────────────────────────────────────
	let store = await NAV.storage.local.get(['superfiltro_ativo'])

	window._superfiltro_ativo = store.superfiltro_ativo === true

	// Só opera se a sessão estiver autenticada (válida por 8h)
	let _authStore = await NAV.storage.local.get(['superfiltro_auth_ts'])
	let _authTs    = _authStore.superfiltro_auth_ts || 0
	if ((Date.now() - _authTs) >= 8 * 60 * 60 * 1000) {
		window.addEventListener('pjerota:superfiltro-atualizado', () => {
			window._superfiltro_iniciado = false
			iniciarSuperFiltro()
		}, { once: true })
		return
	}

	// ── Sincronização com popup ──────────────────────────────
	const URLS_SUPERFILTRO = ['pjekz/painel', 'pjekz/pauta-audiencias', 'pjekz/escaninho', 'pjekz/gigs/meu-painel']
	async function sincronizarWidget(){
		let urlOk = URLS_SUPERFILTRO.some(u => location.href.includes(u))
		if(window._superfiltro_ativo && urlOk) await _montarWidget()
		else _removerWidget()
	}

	window.addEventListener('pjerota:url-mudou', sincronizarWidget)

	window.addEventListener('pjerota:superfiltro-atualizado', (e) => {
		let d = e.detail || {}
		window._superfiltro_ativo = d.ativo
		sincronizarWidget()
	})

	sincronizarWidget()


	// ════════════════════════════════════════════════════════
	// MONTAGEM DO WIDGET
	// ════════════════════════════════════════════════════════

	async function _montarWidget(){
		if(document.getElementById(WIDGET_ID)) return

		// ── Raiz + barra + arrasto + clamp de tela + posição ───
		// tudo isso já vem pronto do criaDivFlutuante, no mesmo
		// mecanismo usado pelos outros widgets flutuantes.
		let widget = await criaDivFlutuante({
			id:                 WIDGET_ID,
			titulo:             'Super Filtros',
			largura:            '240px',
			armazenarRecolhido: true,
		})

		let corpo = document.getElementById(WIDGET_ID + '-corpo')
		_s(corpo, { background: C.fundo })

		// O botão de fechar embutido no criaDivFlutuante só remove o
		// wrapper do DOM — ele não conhece o estado interno do super
		// filtro, então reseta o modo selecionado à parte.
		let btnFechar = Array.from(widget.querySelectorAll('button')).find(b => b.title === 'Fechar')
		btnFechar?.addEventListener('click', () => { _modoAtivo = null })

		// ── Menu de modos: Tarefa | Sala | Lista ──────────────
		let menuModos = document.createElement('div')
		_s(menuModos, {
			display:    'flex',
			gap:        '4px',
			padding:    '8px 8px 0',
		})

		const MODOS = ['Tarefa', 'Sala', 'Lista']
		let botoesMenu = {}

		MODOS.forEach(modo => {
			let btn = document.createElement('button')
			btn.textContent = modo
			btn.dataset.modo = modo
			_s(btn, {
				flex:          '1',
				padding:       '5px 4px',
				fontSize:      '10px',
				fontWeight:    '700',
				background:    C.branco,
				color:         C.textoSuave,
				border:        '1px solid ' + C.borda,
				borderRadius:  '6px',
				cursor:        'pointer',
				transition:    'all 0.12s',
				letterSpacing: '0.3px',
				fontFamily:    'inherit',
			})
			btn.addEventListener('click', () => _selecionarModo(modo))
			btn.addEventListener('mouseover', () => {
				if(_modoAtivo !== modo){
					btn.style.background  = C.infoBg
					btn.style.borderColor = C.infoBorda
					btn.style.color       = C.azul
				}
			})
			btn.addEventListener('mouseout', () => {
				if(_modoAtivo !== modo){
					btn.style.background  = C.branco
					btn.style.borderColor = C.borda
					btn.style.color       = C.textoSuave
				}
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
			width:        '100%',
			resize:       'none',
			background:   C.branco,
			border:       '1px solid ' + C.borda,
			borderRadius: '7px',
			color:        C.texto,
			fontSize:     '12px',
			padding:      '6px 8px',
			outline:      'none',
			lineHeight:   '1.4',
			maxHeight:    '72px',
			overflowY:    'auto',
			transition:   'border-color 0.15s, opacity 0.15s',
			boxSizing:    'border-box',
			fontFamily:   'inherit',
			opacity:      '0.45',
		})

		inputContexto.addEventListener('input', () => {
			inputContexto.style.height = 'auto'
			inputContexto.style.height = Math.min(inputContexto.scrollHeight, 72) + 'px'
		})
		inputContexto.addEventListener('focus', () => {
			inputContexto.style.borderColor = C.azul
			inputContexto.style.boxShadow   = '0 0 0 3px rgba(0,120,170,0.1)'
		})
		inputContexto.addEventListener('blur', () => {
			inputContexto.style.borderColor = C.borda
			inputContexto.style.boxShadow   = 'none'
		})

		wrapInput.appendChild(inputContexto)

		// ── Preview de parse (modo Lista) ─────────────────────
		let wrapPreview = document.createElement('div')
		_s(wrapPreview, { padding: '2px 8px 0' })
		let previewParse = document.createElement('span')
		previewParse.id = WIDGET_ID + '-preview'
		_s(previewParse, { fontSize: '10px', display: 'block', minHeight: '13px', color: C.textoSuave })
		wrapPreview.appendChild(previewParse)

		inputContexto.addEventListener('input', () => {
			if(!inputContexto.dataset.parseMode){ previewParse.textContent = ''; return }
			let parseFn = typeof rota_parsearListaProcessos === 'function'
				? rota_parsearListaProcessos
				: (txt) => { let m = [...txt.matchAll(/\d{7}[-.]\d{2}[-.]\d{4}[-.]\d[-.]\d{2}[-.]\d{4}/g)]; return [...new Set(m.map(x=>x[0]))] }
			let nums = parseFn(inputContexto.value)
			if(!inputContexto.value.trim()){
				previewParse.textContent = ''
			} else if(!nums.length){
				previewParse.textContent = '⚠ Nenhum nº CNJ reconhecido'
				previewParse.style.color = C.erroTexto
			} else {
				previewParse.textContent = '✓ ' + nums.length + ' processo(s)'
				previewParse.style.color = C.okTexto
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
			_s(wrap, { display: 'flex', flexDirection: 'column', gap: '2px' })

			let lbl = document.createElement('label')
			lbl.textContent = label
			_s(lbl, { fontSize: '9px', color: C.textoSuave, letterSpacing: '0.3px' })

			let inp = document.createElement('input')
			inp.type        = 'number'
			inp.id          = WIDGET_ID + '-param-' + id
			inp.placeholder = placeholder
			inp.min         = min
			inp.max         = max
			_s(inp, {
				width:        '100%',
				background:   C.branco,
				border:       '1px solid ' + C.borda,
				borderRadius: '6px',
				color:        C.texto,
				fontSize:     '11px',
				padding:      '4px 6px',
				outline:      'none',
				boxSizing:    'border-box',
				fontFamily:   'inherit',
				textAlign:    'center',
			})
			inp.addEventListener('focus', () => {
				inp.style.borderColor = C.azul
				inp.style.boxShadow   = '0 0 0 3px rgba(0,120,170,0.1)'
			})
			inp.addEventListener('blur', () => {
				inp.style.borderColor = C.borda
				inp.style.boxShadow   = 'none'
			})

			wrap.appendChild(lbl)
			wrap.appendChild(inp)
			wrapParams.appendChild(wrap)
		})

		// ── Divisor ───────────────────────────────────────────
		let divisor = document.createElement('div')
		_s(divisor, {
			height:     '1px',
			margin:     '8px 8px 0',
			background: C.borda,
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
			borderTop:  '1px solid ' + C.borda,
			padding:    '8px',
			background: C.fundo,
		})

		let tabelaResultado = document.createElement('div')
		tabelaResultado.id = WIDGET_ID + '-tabela'
		_s(tabelaResultado, {
			maxHeight:    '150px',
			overflowY:    'auto',
			fontSize:     '11px',
			lineHeight:   '1.5',
			color:        C.texto,
			marginBottom: '6px',
			whiteSpace:   'pre-wrap',
			wordBreak:    'break-word',
		})

		let rodapeRes = document.createElement('div')
		_s(rodapeRes, { display: 'flex', justifyContent: 'flex-end', gap: '6px' })

		let btnCopiar = _btnAcao('📋 Copiar', C.infoBg, C.azul, C.infoBorda)
		btnCopiar.addEventListener('click', () => {
			navigator.clipboard.writeText(tabelaResultado.innerText || tabelaResultado.textContent)
				.then(() => {
					btnCopiar.textContent = '✅ Copiado!'
					btnCopiar.style.background  = C.okBg
					btnCopiar.style.borderColor = C.okBorda
					btnCopiar.style.color       = C.okTexto
					setTimeout(() => {
						btnCopiar.textContent       = '📋 Copiar'
						btnCopiar.style.background  = C.infoBg
						btnCopiar.style.borderColor = C.infoBorda
						btnCopiar.style.color       = C.azul
					}, 1800)
				}).catch(()=>{})
		})

		let btnFecharRes = _btnAcao('Fechar', C.branco, C.textoSuave, C.borda)
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
		corpo.appendChild(wrapParams)
		corpo.appendChild(divisor)
		corpo.appendChild(areaFuncs)
		corpo.appendChild(areaResultado)

		// ── Selecionar modo ───────────────────────────────────
		function _selecionarModo(modo){
			_modoAtivo = modo
			Object.values(botoesMenu).forEach(b => {
				let ativo = b.dataset.modo === modo
				b.style.background  = ativo ? C.azul    : C.branco
				b.style.color       = ativo ? '#ffffff'  : C.textoSuave
				b.style.borderColor = ativo ? C.azulClaro : C.borda
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
	}


	// ── Atualizar botões de funcionalidades ──────────────────
	function _atualizarBotoesFunc(){
		let area = document.getElementById(WIDGET_ID + '-funcs')
		if(!area) return
		area.innerHTML = ''

		let botoes = (typeof SF_BOTOES !== 'undefined') ? SF_BOTOES : []

		if(!botoes.length){
			let aviso = document.createElement('p')
			aviso.textContent = 'Nenhum botão configurado em sf-botoes.js.'
			_s(aviso, { fontSize: '11px', color: C.textoSuave, textAlign: 'center', padding: '4px 0 6px' })
			area.appendChild(aviso)
			return
		}

		botoes.forEach(({ nome, modo, funcao }) => {
			if(modo && (Array.isArray(modo) ? !modo.includes(_modoAtivo) : modo !== _modoAtivo)) return

			let btn = document.createElement('button')
			btn.textContent = nome
			_s(btn, {
				background:   C.branco,
				border:       '1px solid ' + C.infoBorda,
				borderRadius: '7px',
				color:        C.azul,
				padding:      '6px 9px',
				fontSize:     '11px',
				fontWeight:   '600',
				cursor:       'pointer',
				textAlign:    'left',
				transition:   'all 0.12s',
				width:        '100%',
				fontFamily:   'inherit',
			})
			btn.addEventListener('mouseover', () => {
				btn.style.background  = C.infoBg
				btn.style.borderColor = C.azul
				btn.style.color       = C.azulClaro
			})
			btn.addEventListener('mouseout', () => {
				btn.style.background  = C.branco
				btn.style.borderColor = C.infoBorda
				btn.style.color       = C.azul
			})
			btn.addEventListener('mousedown', () => {
				btn.style.background = C.infoBorda
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
			let parseFn = typeof rota_parsearListaProcessos === 'function'
				? rota_parsearListaProcessos
				: (txt) => { let m = [...txt.matchAll(/\d{7}[-.]\d{2}[-.]\d{4}[-.]\d[-.]\d{2}[-.]\d{4}/g)]; return [...new Set(m.map(x=>x[0]))] }
			listaProcessos = parseFn(valorBruto)
			
		}

		function _lerParam(id, fallback){
			let el  = document.getElementById(WIDGET_ID + '-param-' + id)
			let val = el ? parseInt(el.value) : NaN
			return isNaN(val) ? fallback : val
		}

		let contexto = {
			valorBruto: 	valorBruto,
			modo:         	_modoAtivo,
			valor:        	valorBruto,
			lista:        	listaProcessos,
			concorrencia: 	_lerParam('concorrencia', 5),
			tentativas:   	_lerParam('tentativas',   2),
			pausaMs:      	_lerParam('pausaMs',      500),
			progresso: 		(feitos, total) => {
				tabelaEl.textContent = '⏳ ' + feitos + ' / ' + total + ' processos…'
				tabelaEl.style.color = C.textoSuave
			},
		}

		tabelaEl.textContent    = '⏳ Iniciando…'
		tabelaEl.style.color    = C.textoSuave
		resultEl.style.display  = 'block'

		try {
			let resultado = await funcao(contexto)

			if(resultado === undefined || resultado === null){
				tabelaEl.textContent = '(sem resultado)'
				tabelaEl.style.color = C.textoSuave
				return
			}
			if(Array.isArray(resultado)){
				if(!resultado.length){
					tabelaEl.textContent = '(nenhum resultado encontrado)'
					tabelaEl.style.color = C.textoSuave
					return
				}
				_renderizarTabela(tabelaEl, resultado)
			} else {
				tabelaEl.textContent = String(resultado)
				tabelaEl.style.color = C.texto
			}
		} catch(err){
			tabelaEl.textContent = '❌ Erro: ' + err.message
			tabelaEl.style.color = C.erroTexto
		}
	}


	// ── Renderizar tabela ─────────────────────────────────────
	function _renderizarTabela(el, dados){
		el.innerHTML = ''
		if(typeof dados[0] === 'string' || typeof dados[0] === 'number'){
			el.textContent = dados.join('\n')
			el.style.color = C.texto
			return
		}
		let chaves = Object.keys(dados[0])
		let tabela = document.createElement('table')
		_s(tabela, { width: '100%', borderCollapse: 'collapse', fontSize: '11px' })

		let thead = tabela.createTHead()
		let trH   = thead.insertRow()
		chaves.forEach(c => {
			let th = document.createElement('th')
			th.textContent = c
			_s(th, {
				textAlign:    'left',
				padding:      '4px 6px',
				color:        C.infoTexto,
				fontWeight:   '700',
				background:   C.infoBg,
				borderBottom: '1px solid ' + C.infoBorda,
				whiteSpace:   'nowrap',
			})
			trH.appendChild(th)
		})

		let tbody = tabela.createTBody()
		dados.forEach((linha, i) => {
			let tr = tbody.insertRow()
			tr.style.background = i % 2 === 0 ? C.branco : C.fundo
			tr.addEventListener('mouseover', () => tr.style.background = C.infoBg)
			tr.addEventListener('mouseout',  () => tr.style.background = i % 2 === 0 ? C.branco : C.fundo)
			chaves.forEach(c => {
				let td = document.createElement('td')
				td.textContent = linha[c] ?? ''
				_s(td, {
					padding:     '4px 6px',
					color:       C.texto,
					borderBottom:'1px solid ' + C.fundo,
					verticalAlign:'top',
					wordBreak:   'break-word',
				})
				tr.appendChild(td)
			})
		})
		el.appendChild(tabela)
	}


	// ── Remover widget ────────────────────────────────────────
	function _removerWidget(){
		let w = document.getElementById(WIDGET_ID)
		if(w) w.remove()
		_modoAtivo = null
	}


	// ── Utilitários ───────────────────────────────────────────
	function _s(el, styles){ Object.assign(el.style, styles) }

	function _btnAcao(texto, bg, cor, borda){
		let btn = document.createElement('button')
		btn.textContent = texto
		_s(btn, {
			background:   bg,
			border:       '1px solid ' + (borda || C.borda),
			borderRadius: '6px',
			color:        cor,
			padding:      '5px 10px',
			fontSize:     '11px',
			fontWeight:   '600',
			cursor:       'pointer',
			fontFamily:   'inherit',
			transition:   'background 0.12s',
		})
		return btn
	}

})()
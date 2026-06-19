// ============================================================
// botao-rota.js
// Botão Rota PJE — dividido em TELA e LISTA.
//
// TELA → varre o body e coleta processos visíveis
// LISTA → abre painel de input para colar/digitar lista de processos.
//         Tem opção "com parâmetros": o usuário cola uma tabela com
//         número do processo + colunas extras. As colunas extras ficam
//         salvas e aparecem como botões de clipboard no widget.
// ============================================================


// ── Paleta institucional ──────────────────────────────────────

const ROTA_C = {
	azul:       '#0078aa',
	azulEsc:    '#005f88',
	azulClaro:  '#1a85be',
	azulBorda:  '#6ac0e0',
	laranja:    '#ffa726',
	laranjaEsc: '#D68C20',
	laranjaClr: '#ffcd6e',
	branco:     '#ffffff',
	fundo:      '#f9f9fa',
	borda:      '#dcdcdc',
	texto:      '#2c3e50',
	suave:      '#6b7c93',
	infoBg:     '#eaf2fb',
	infoBorda:  '#add8e6',
	okTexto:    '#1e8449',
	erroTexto:  '#c0392b',
}


// ── Configuração de telas ─────────────────────────────────────

const ROTA_BOTOES_CONFIG = [
	{ url: '/pjekz/painel/',                   ancora: '#brasao-republica', x: 128, y: 0 },
	{ url: '/pjekz/escaninho',                 ancora: '#brasao-republica', x: 128, y: 0 },
	{ url: '/pjekz/pauta-audiencias',          ancora: '#brasao-republica', x: 128, y: 0 },
	{ url: '/pjekz/gigs/relatorios',           ancora: '#brasao-republica', x: 128, y: 0 },
	{ url: '/pjekz/comunicacoesprocessuais',   ancora: '#brasao-republica', x: 128, y: 0 },
	{ url: '/pjekz/atas-audiencias',           ancora: '#brasao-republica', x: 128, y: 0 },
	{ url: '/gigs/meu-painel',                 ancora: '#brasao-republica', x: 128, y: 0 },
]


// ── Regex CNJ ─────────────────────────────────────────────────

const ROTA_REGEX_CNJ = /\d{7}[-.]\d{2}[-.]\d{4}[-.]\d[-.]\d{2}[-.]\d{4}/g
const ROTA_REGEX_CNJ_SEM_DIVISOR = /\d{20}/g

// ── Parser de lista ───────────────────────────────────────────

function rota_parsearListaProcessos(texto){
	if(!texto) return []
	let matches = [...texto.matchAll(ROTA_REGEX_CNJ)]
	let vistos  = new Set()
	let lista   = []
	for(let m of matches){
		let num = m[0]
		if(!vistos.has(num)){ vistos.add(num); lista.push(num) }
	}
	return lista
}


// ── Parser de lista com parâmetros ───────────────────────────

function rota_parsearListaComParametros(texto){
	if(!texto) return { fila: [] }
	let linhas = texto.split(/\r?\n/).filter(l => l.trim())
	let fila   = []
	let vistos = new Set()
	for(let linha of linhas){
		let partes  = linha.split('\t')
		let numProc = null
		let idxNum  = -1
		for(let i = 0; i < partes.length; i++){
			let match = partes[i].match(/\d{7}[-.]\d{2}[-.]\d{4}[-.]\d[-.]\d{2}[-.]\d{4}/)
			if(match){ numProc = match[0]; idxNum = i; break }
		}
		if(!numProc || vistos.has(numProc)) continue
		vistos.add(numProc)
		let params = partes.filter((_, i) => i !== idxNum).map(p => p.trim()).filter(Boolean)
		fila.push({ numProc, id: null, dadosLinha: [], params })
	}
	return { fila }
}


// ── Estado ────────────────────────────────────────────────────

const _rota_registros = []
let   _rota_painelLista  = null
let   _rota_menuTarefa   = null


// ── Inicialização ─────────────────────────────────────────────

function botaoRota_iniciar(){
	ROTA_BOTOES_CONFIG.forEach(cfg => {
		let reg = { config: cfg, btn: null, posAnterior: null }
		_rota_registros.push(reg)
		_rota_rastrear(reg)
	})
}

function botaoRota_atualizarUrl(){
	_rota_registros.forEach(reg => _rota_sincronizar(reg))
}


// ── Loop de rastreamento ──────────────────────────────────────

function _rota_rastrear(reg){
	function frame(){ _rota_sincronizar(reg); requestAnimationFrame(frame) }
	requestAnimationFrame(frame)
}

function _rota_sincronizar(reg){
	let { config } = reg
	let { url, ancora, x, y } = config

	let urls  = Array.isArray(url) ? url : (url ? [url] : [])
	let urlOk = urls.length === 0 || urls.some(u => location.href.includes(u))
	if(!urlOk){
		if(reg.btn) reg.btn.style.display = 'opacity: 1'
		return
	}

	let ancoraEl = document.querySelector(ancora)
	if(!ancoraEl){
		if(reg.btn) reg.btn.style.display = 'opacity: 1'
		return
	}

	// _rota_sincronizar — bloco de criação (linhas 138–160)
	if(!reg.btn || !document.body.contains(reg.btn)){
		document.getElementById('pjerota-btn-rota')?.remove()
		reg.btn = _rota_criarBotaoDOM()
		document.body.appendChild(reg.btn)

		// Flex no próprio btn para alinhar o SVG + botão tutorial lado a lado
		Object.assign(reg.btn.style, {
			display:        'flex',
			flexDirection:  'row',
			alignItems:     'center',
			gap:            '6px',
			width:          'fit-content',   // deixa o btn encolher/crescer conforme o conteúdo
		})

		// divTutorial como FILHO do btn (não irmão)
		let divTutorial = criaDiv({
			id:        'rota_rota_tutorial_div',
			ancestral: 'pjerota-btn-rota'    // se criaDiv já appenda no ancestral, ok
		})
		divTutorial.style.width = 'fit-content'
		// NÃO chame insertAdjacentElement — criaDiv já inseriu dentro do btn

		let botaoTutorial = document.createElement('button')
		botaoTutorial.id          = 'rota_rota_tutorial_botao'
		botaoTutorial.textContent = '❓'
		Object.assign(botaoTutorial.style, {
			background:   	`linear-gradient(to bottom, ${ROTA_C.laranjaClr}, #e8920a)`,
			color:        	'#2a3a00',
			border:       	'1.5px solid #7a5000',
			borderRadius: 	'50%',          // redondo
			width:        	'22px',
			height:       	'22px',
			lineHeight:   	'22px',
			padding:      	'0',
			fontSize:     	'11px',
			textAlign:    	'center',
			cursor:       	'pointer',
			zIndex:       	'9999999',
			fontFamily:   	"system-ui, 'Arial Black', Arial, sans-serif",
			fontWeight:   	'900',
			boxShadow:    	'0 1px 4px rgba(0,0,0,0.22)',
			display:      	'flex',
			alignItems:   	'center',
			justifyContent:	'center',
		})
		let tooltip = document.createElement('span')
		tooltip.textContent = 'Clique para ter acesso aos tutoriais do ROTA.'
		Object.assign(tooltip.style, {
			position:       'absolute',
			top:          	'calc(100% + 6px)',  // aparece acima do botão
			left:           '50%',
			transform:      'translateX(-50%)',
			background:     ROTA_C.texto,
			color:          ROTA_C.branco,
			fontSize:       '11px',
			fontFamily:     'system-ui, Arial, sans-serif',
			padding:        '3px 8px',
			borderRadius:   '4px',
			whiteSpace:     'nowrap',
			pointerEvents:  'none',
			opacity:        '0',
			transition:     'opacity 0.15s',
			zIndex:         '9999999',
		})

		// O botão precisa de position:relative para o tooltip se ancorar nele
		botaoTutorial.style.position = 'relative'
		botaoTutorial.appendChild(tooltip)

		botaoTutorial.addEventListener('mouseenter', () => tooltip.style.opacity = '1')
		botaoTutorial.addEventListener('mouseleave', () => tooltip.style.opacity = '0')
		divTutorial.appendChild(botaoTutorial)
		
	}

	_rota_posicionar(reg, ancoraEl, x, y)
}

function _rota_posicionar(reg, ancoraEl, x, y){
	let btn = reg.btn
	let r   = ancoraEl.getBoundingClientRect()
	let vH  = window.innerHeight, vW = window.innerWidth

	if(r.bottom <= 0 || r.top >= vH || r.right <= 0 || r.left >= vW){
		btn.style.display = 'none'; return
	}

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
// BOTÃO: SETA DUPLA (SVG) + PLACA TAREFA
// ════════════════════════════════════════════════════════════

function _rota_criarBotaoDOM(){
	let btn = document.createElement('div')
	btn.id  = 'pjerota-btn-rota'
	Object.assign(btn.style, {
		position:   'fixed',
		zIndex:     '10000',
		display:    'none',
		cursor:     'default',
		userSelect: 'none',
		width:      '180px',
		filter:     'drop-shadow(0 3px 8px rgba(0,0,0,0.22))',
		opacity:    '1',
    	isolation:  'isolate', 
	})

	// ── SVG principal ─────────────────────────────────────────
	let svgNS = 'http://www.w3.org/2000/svg'
	let svg   = document.createElementNS(svgNS, 'svg')
	svg.setAttribute('viewBox', '0 0 180 90')
	svg.setAttribute('width',   '130')
	svg.setAttribute('height',  '65')
	svg.setAttribute('xmlns',   svgNS)

	svg.innerHTML = `
		<defs>
			<linearGradient id="rotaGSeta" x1="0%" y1="0%" x2="0%" y2="100%">
				<stop offset="0%"   stop-color="${ROTA_C.azulClaro}"/>
				<stop offset="100%" stop-color="${ROTA_C.azulEsc}"/>
			</linearGradient>
			<linearGradient id="rotaGBorda" x1="0%" y1="0%" x2="0%" y2="100%">
				<stop offset="0%"   stop-color="${ROTA_C.azulBorda}"/>
				<stop offset="100%" stop-color="#003f60"/>
			</linearGradient>
			<linearGradient id="rotaGLaranja" x1="0%" y1="0%" x2="0%" y2="100%">
				<stop offset="0%"   stop-color="${ROTA_C.laranjaClr}"/>
				<stop offset="100%" stop-color="#e8920a"/>
			</linearGradient>
			<filter id="rotaSombra">
				<feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-opacity="0.2"/>
			</filter>
		</defs>

		<!-- Seta dupla — borda/sombra -->
		<path d="
			M4,28  L38,4  L38,11 L142,11 L142,4  L176,28
			L142,52 L142,44 L38,44 L38,52 Z
		" fill="url(#rotaGBorda)" filter="url(#rotaSombra)"/>

		<!-- Seta dupla — corpo -->
		<path id="rota-seta-corpo" d="
			M8,28  L38,7  L38,14 L142,14 L142,7  L172,28
			L142,49 L142,41 L38,41 L38,49 Z
		" fill="url(#rotaGSeta)"/>

		<!-- Divisor central -->
		<line x1="90" y1="18" x2="90" y2="38"
		      stroke="rgba(255,255,255,0.35)" stroke-width="1"
		      stroke-dasharray="3,2"/>

		<!-- TELA -->
		<text id="rota-txt-tela" x="55" y="34" text-anchor="middle"
		      font-family="system-ui,'Arial Black',Arial,sans-serif"
		      font-size="13" font-weight="900" fill="#ffffff" letter-spacing="0.5">TELA</text>

		<!-- LISTA -->
		<text id="rota-txt-lista" x="125" y="34" text-anchor="middle"
		      font-family="system-ui,'Arial Black',Arial,sans-serif"
		      font-size="13" font-weight="900" fill="#ffffff" letter-spacing="0.5">LISTA</text>

		<!-- Conector poste -->
		<rect x="78" y="43" width="24" height="6" rx="2"
		      fill="${ROTA_C.azul}" opacity="0.5"/>

		<!-- Placa TAREFA — borda -->
		<rect x="26" y="49" width="128" height="34" rx="7"
		      fill="#7a5000" filter="url(#rotaSombra)"/>
		<!-- Placa TAREFA — corpo -->
		<rect x="28" y="51" width="124" height="30" rx="6"
		      fill="url(#rotaGLaranja)"/>

		<!-- Nome da tarefa -->
		<text id="rota-txt-tarefa" x="87" y="71" text-anchor="middle"
		      font-family="system-ui,'Arial Black',Arial,sans-serif"
		      font-size="11" font-weight="900" fill="#2a3a00" letter-spacing="0.5">—</text>

		<!-- Seta dropdown -->
		<text x="144" y="70" text-anchor="middle"
		      font-family="system-ui,Arial,sans-serif"
		      font-size="10" fill="#5a3a00" opacity="0.8">▾</text>
	`

	btn.appendChild(svg)

	// ── Zonas clicáveis (divs sobre o SVG) ───────────────────
	function _hitZone(top, left, width, height){
		let z = document.createElement('div')
		Object.assign(z.style, {
			position: 'absolute', cursor: 'pointer',
			top: top, left: left, width: width, height: height,
		})
		btn.style.position = 'fixed'  // já está fixed
		return z
	}

	// Para as zonas funcionar, o btn precisa ser position:fixed
	// e o SVG position:relative — usamos um wrapper
	let wrap = document.createElement('div')
	Object.assign(wrap.style, { position: 'relative', width: '130px', height: '65px' })

	wrap.appendChild(svg)
	btn.innerHTML = ''
	btn.appendChild(wrap)

	// Zonas
	let zTela   = document.createElement('div')
	let zLista  = document.createElement('div')
	let zTarefa = document.createElement('div')

	Object.assign(zTela.style, {
		position: 'absolute', cursor: 'pointer',
		top: '0', left: '0', width: '46%', height: '60%',
	})
	Object.assign(zLista.style, {
		position: 'absolute', cursor: 'pointer',
		top: '0', right: '0', width: '46%', height: '60%',
	})
	Object.assign(zTarefa.style, {
		position: 'absolute', cursor: 'pointer',
		bottom: '2%', left: '14%', right: '14%', height: '36%',
	})

	// Hover na seta
	function _hoverSeta(on){
		let corpo = wrap.querySelector('#rota-seta-corpo')
		if(corpo) corpo.setAttribute('fill', on ? ROTA_C.azul : 'url(#rotaGSeta)')
	}
	zTela.addEventListener('mouseenter',  () => _hoverSeta(true))
	zTela.addEventListener('mouseleave',  () => _hoverSeta(false))
	zLista.addEventListener('mouseenter', () => _hoverSeta(true))
	zLista.addEventListener('mouseleave', () => _hoverSeta(false))

	// Hover na placa
	function _hoverTarefa(on){
		let placa = wrap.querySelectorAll('rect')[2]  // 3ª rect = corpo laranja
		if(placa) placa.setAttribute('fill', on ? ROTA_C.laranja : 'url(#rotaGLaranja)')
	}
	zTarefa.addEventListener('mouseenter', () => _hoverTarefa(true))
	zTarefa.addEventListener('mouseleave', () => _hoverTarefa(false))

	// Cliques
	zTela.addEventListener('click',   e => { e.stopPropagation(); _rota_aoClicarTela() })
	zLista.addEventListener('click',  e => { e.stopPropagation(); _rota_aoClicarLista(btn) })
	zTarefa.addEventListener('click', e => { e.stopPropagation(); _rota_aoClicarTarefa(btn) })

	wrap.appendChild(zTela)
	wrap.appendChild(zLista)
	wrap.appendChild(zTarefa)

	// Atualiza o nome da tarefa ativa no SVG
	_rota_atualizarNomeTarefa(btn)

	return btn
}


// ── Atualiza label da tarefa no SVG ──────────────────────────

async function _rota_atualizarNomeTarefa(btn){
	let cfg       = await obterArmazenamento('tarefaAtiva')
	let nomeAtivo = _ass_nomeTarefa(cfg?.tarefaAtiva) || cfg?.tarefaAtiva || '—'
	// Abrevia se necessário (máx ~14 chars no espaço disponível)
	let abrev = nomeAtivo.length > 14 ? nomeAtivo.slice(0, 13) + '…' : nomeAtivo
	let el = btn?.querySelector('#rota-txt-tarefa')
	if(el) el.textContent = abrev.toUpperCase()
}


// ── Ação: TELA ────────────────────────────────────────────────

async function _rota_aoClicarTela(){
	let fila = _rota_coletarFilaDaTela()
	if(!fila.length){
		rota_avisoTemporario('Nenhum número de processo encontrado na tela.', 'erro', 4000)
		return
	}
	rota_avisoTemporario('▶ ' + fila.length + ' processo(s) encontrado(s). Iniciando…', 'info', 4000)
	rota_iniciarPipeline({ fila })
}


// ── Ação: TAREFA (menu de seleção) ───────────────────────────

async function _rota_aoClicarTarefa(btnRef){
	// Fecha se já está aberto
	if(_rota_menuTarefa){
		_rota_menuTarefa.remove()
		_rota_menuTarefa = null
		return
	}
	// Fecha painel lista se aberto
	if(_rota_painelLista){ _rota_painelLista.remove(); _rota_painelLista = null }

	let store = await obterArmazenamento(['tarefas', 'tarefaAtiva'])
	let tarefas   = store?.tarefas   || {}
	let nomeAtivo = store?.tarefaAtiva || ''
	if (nomeAtivo) await armazenar({ tarefaAtiva: nomeAtivo })
	let nomes     = Object.keys(tarefas)
	

	let menu = document.createElement('div')
	_rota_menuTarefa = menu

	let r = btnRef.getBoundingClientRect()
	Object.assign(menu.style, {
		position:     'fixed',
		top:          (r.bottom + 6) + 'px',
		left:         r.left + 'px',
		zIndex:       '9002',
		width:        '200px',
		background:   ROTA_C.branco,
		border:       '1px solid ' + ROTA_C.borda,
		borderRadius: '8px',
		boxShadow:    '0 4px 16px rgba(0,0,0,0.15)',
		overflow:     'hidden',
		fontFamily:   "system-ui, -apple-system, 'Segoe UI', Arial, sans-serif",
	})

	// Header
	let header = document.createElement('div')
	Object.assign(header.style, {
		background: ROTA_C.azul,
		padding:    '6px 10px',
		fontSize:   '9px',
		fontWeight: '700',
		color:      'rgba(255,255,255,0.8)',
		letterSpacing: '0.5px',
		textTransform: 'uppercase',
	})
	header.textContent = 'Selecionar tarefa'
	menu.appendChild(header)

	// ── Tarefas do sistema (🤖) ───────────────────────────────
    const tarefasSistema = typeof catalogo_listar === 'function' ? catalogo_listar() : []

    if (tarefasSistema.length) {
        tarefasSistema.forEach(tarefa => {
            let item  = document.createElement('div')
            let ativo = tarefa.id === nomeAtivo
            Object.assign(item.style, {
                padding:      '8px 10px',
                fontSize:     '11px',
                fontWeight:   '600',
                color:        ativo ? ROTA_C.azul : ROTA_C.texto,
                cursor:       'pointer',
                borderBottom: '1px solid ' + ROTA_C.fundo,
                display:      'flex',
                alignItems:   'center',
                gap:          '7px',
                background:   ativo ? ROTA_C.infoBg : ROTA_C.branco,
                borderLeft:   ativo ? '3px solid ' + ROTA_C.laranja : '3px solid transparent',
                transition:   'background 0.1s',
            })

            let emoji = document.createElement('span')
            emoji.textContent = '🤖'
            Object.assign(emoji.style, { fontSize: '12px', flexShrink: '0' })

            item.appendChild(emoji)
            item.appendChild(document.createTextNode(tarefa.label))

            item.addEventListener('mouseenter', () => {
                if (!ativo) item.style.background = ROTA_C.infoBg
            })
            item.addEventListener('mouseleave', () => {
                if (!ativo) item.style.background = ROTA_C.branco
            })
            item.addEventListener('click', async () => {
                await armazenar({ tarefaAtiva: tarefa.id, tarefaAtivaIsSistema: true })
                menu.remove()
                _rota_menuTarefa = null
                _rota_registros.forEach(r => {
                    if (r.btn) _rota_atualizarNomeTarefa(r.btn)
                })
            })

            menu.appendChild(item)
        })

        // Divisor entre sistema e usuário
        if (nomes.length) {
            let divisor = document.createElement('div')
            Object.assign(divisor.style, {
                height:     '1px',
                background: ROTA_C.borda,
                margin:     '4px 0',
            })
            menu.appendChild(divisor)
        }
    }

    // ── Tarefas do usuário (👤) ───────────────────────────────
    if (!nomes.length && !tarefasSistema.length) {
        let vazio = document.createElement('div')
        Object.assign(vazio.style, { padding:'10px', fontSize:'11px', color: ROTA_C.suave, textAlign:'center' })
        vazio.textContent = 'Nenhuma tarefa cadastrada.'
        menu.appendChild(vazio)
    } else {
        nomes.forEach(nome => {
            let item = document.createElement('div')
            let ativo = nome === nomeAtivo
            Object.assign(item.style, {
                padding:      '8px 10px',
                fontSize:     '11px',
                fontWeight:   '600',
                color:        ativo ? ROTA_C.azul : ROTA_C.texto,
                cursor:       'pointer',
                borderBottom: '1px solid ' + ROTA_C.fundo,
                display:      'flex',
                alignItems:   'center',
                gap:          '7px',
                background:   ativo ? ROTA_C.infoBg : ROTA_C.branco,
                borderLeft:   ativo ? '3px solid ' + ROTA_C.laranja : '3px solid transparent',
                transition:   'background 0.1s',
            })

            let emoji = document.createElement('span')
            emoji.textContent = '👤'
            Object.assign(emoji.style, { fontSize: '12px', flexShrink: '0' })

            item.appendChild(emoji)
            item.appendChild(document.createTextNode(nome))

            item.addEventListener('mouseenter', () => {
                if (!ativo) item.style.background = ROTA_C.infoBg
            })
            item.addEventListener('mouseleave', () => {
                if (!ativo) item.style.background = ROTA_C.branco
            })
            item.addEventListener('click', async () => {
                await armazenar({ tarefaAtiva: nome, tarefaAtivaIsSistema: false })
                menu.remove()
                _rota_menuTarefa = null
                _rota_registros.forEach(r => {
                    if (r.btn) _rota_atualizarNomeTarefa(r.btn)
                })
            })
            menu.appendChild(item)
        })
    }

    document.body.appendChild(menu)
    // Fecha ao clicar fora
    setTimeout(() => {
        document.addEventListener('click', function fecharFora(e){
            if (!menu.contains(e.target) && !btnRef.contains(e.target)){
                menu.remove()
                _rota_menuTarefa = null
                document.removeEventListener('click', fecharFora)
            }
        })
    }, 50)
}


// ── Ação: LISTA ───────────────────────────────────────────────

function _rota_aoClicarLista(btnRef){
	if(_rota_painelLista){
		_rota_painelLista.remove()
		_rota_painelLista = null
		return
	}
	// Fecha menu tarefa se aberto
	if(_rota_menuTarefa){ _rota_menuTarefa.remove(); _rota_menuTarefa = null }

	let painel = document.createElement('div')
	_rota_painelLista = painel

	let r = btnRef.getBoundingClientRect()
	Object.assign(painel.style, {
		position:      'fixed',
		top:           (r.bottom + 6) + 'px',
		left:          r.left + 'px',
		zIndex:        '9001',
		width:         '300px',
		background:    ROTA_C.branco,
		border:        '1px solid ' + ROTA_C.borda,
		borderRadius:  '10px',
		boxShadow:     '0 6px 22px rgba(0,0,0,0.15)',
		fontFamily:    "system-ui, -apple-system, 'Segoe UI', Arial, sans-serif",
		display:       'flex',
		flexDirection: 'column',
		overflow:      'hidden',
	})

	// Cabeçalho
	let cab = document.createElement('div')
	Object.assign(cab.style, {
		background:  ROTA_C.azul,
		padding:     '8px 10px',
		display:     'flex',
		alignItems:  'center',
		gap:         '6px',
	})

	let titPainel = document.createElement('span')
	titPainel.textContent = 'Executar por lista'
	Object.assign(titPainel.style, {
		color: '#fff', fontWeight: '700', fontSize: '12px', flex: '1',
	})

	let btnX = document.createElement('button')
	btnX.textContent = '×'
	Object.assign(btnX.style, {
		background: 'transparent', border: 'none',
		color: 'rgba(255,255,255,0.65)', fontSize: '18px',
		cursor: 'pointer', lineHeight: '1', padding: '0',
	})
	btnX.addEventListener('mouseenter', () => btnX.style.color = '#fff')
	btnX.addEventListener('mouseleave', () => btnX.style.color = 'rgba(255,255,255,0.65)')
	btnX.addEventListener('click', () => { painel.remove(); _rota_painelLista = null })

	cab.appendChild(titPainel)
	cab.appendChild(btnX)

	// Corpo
	let corpo = document.createElement('div')
	Object.assign(corpo.style, {
		padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px',
	})

	// Checkbox com parâmetros
	let wrapCheck = document.createElement('label')
	Object.assign(wrapCheck.style, {
		display: 'flex', alignItems: 'center', gap: '6px',
		cursor: 'pointer', userSelect: 'none',
	})

	let checkbox = document.createElement('input')
	checkbox.type = 'checkbox'
	Object.assign(checkbox.style, {
		accentColor: ROTA_C.azul, cursor: 'pointer', width: '14px', height: '14px',
	})

	let checkLabel = document.createElement('span')
	checkLabel.textContent = 'com parâmetros'
	Object.assign(checkLabel.style, { fontSize: '11px', color: ROTA_C.texto })

	wrapCheck.appendChild(checkbox)
	wrapCheck.appendChild(checkLabel)

	// Instrução
	let instrucao = document.createElement('p')
	Object.assign(instrucao.style, {
		fontSize: '10px', color: ROTA_C.suave, margin: '0', lineHeight: '1.4',
	})

	function atualizarInstrucao(){
		if(checkbox.checked){
			instrucao.innerHTML =
				'Cole uma tabela tabulada: <b style="color:' + ROTA_C.azul + '">1ª coluna = nº processo</b>, ' +
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
		width:        '100%',
		resize:       'vertical',
		minHeight:    '90px',
		maxHeight:    '220px',
		background:   ROTA_C.fundo,
		border:       '1px solid ' + ROTA_C.borda,
		borderRadius: '7px',
		color:        ROTA_C.texto,
		fontSize:     '12px',
		padding:      '7px 9px',
		outline:      'none',
		fontFamily:   'inherit',
		lineHeight:   '1.4',
		boxSizing:    'border-box',
		transition:   'border-color 0.15s',
	})
	area.addEventListener('focus', () => {
		area.style.borderColor = ROTA_C.azul
		area.style.boxShadow   = '0 0 0 3px rgba(0,120,170,0.1)'
	})
	area.addEventListener('blur', () => {
		area.style.borderColor = ROTA_C.borda
		area.style.boxShadow   = 'none'
	})

	// Preview
	let preview = document.createElement('span')
	Object.assign(preview.style, { fontSize: '10px', color: ROTA_C.suave, minHeight: '14px' })

	area.addEventListener('input', () => {
		if(checkbox.checked){
			let { fila } = rota_parsearListaComParametros(area.value)
			if(!fila.length){
				preview.textContent = area.value.trim() ? '⚠ Nenhum número CNJ reconhecido.' : ''
				preview.style.color = ROTA_C.erroTexto
			} else {
				let temParams = fila.some(f => f.params.length > 0)
				preview.textContent = '✓ ' + fila.length + ' processo(s)' +
					(temParams ? ' · ' + fila[0].params.length + ' parâmetro(s)/linha' : '')
				preview.style.color = ROTA_C.okTexto
			}
		} else {
			let nums = rota_parsearListaProcessos(area.value)
			if(!nums.length){
				preview.textContent = area.value.trim() ? '⚠ Nenhum número CNJ reconhecido.' : ''
				preview.style.color = ROTA_C.erroTexto
			} else {
				preview.textContent = '✓ ' + nums.length + ' processo(s) reconhecido(s)'
				preview.style.color = ROTA_C.okTexto
			}
		}
	})

	corpo.appendChild(wrapCheck)
	corpo.appendChild(instrucao)
	corpo.appendChild(area)
	corpo.appendChild(preview)

	// Rodapé
	let rodape = document.createElement('div')
	Object.assign(rodape.style, {
		display: 'flex', justifyContent: 'flex-end', gap: '6px',
		padding: '0 10px 10px',
	})

	let btnPlay = document.createElement('button')
	btnPlay.textContent = '▶ Iniciar'
	Object.assign(btnPlay.style, {
		background:    ROTA_C.laranja,
		color:         ROTA_C.azulEsc,
		border:        'none',
		borderRadius:  '7px',
		padding:       '7px 16px',
		fontSize:      '12px',
		fontWeight:    '800',
		cursor:        'pointer',
		letterSpacing: '0.3px',
		fontFamily:    'inherit',
		transition:    'background 0.12s',
	})
	btnPlay.addEventListener('mouseenter', () => { btnPlay.style.background = ROTA_C.laranjaEsc; btnPlay.style.color = '#fff' })
	btnPlay.addEventListener('mouseleave', () => { btnPlay.style.background = ROTA_C.laranja;    btnPlay.style.color = ROTA_C.azulEsc })

	btnPlay.addEventListener('click', async () => {
		let fila = []
		if(checkbox.checked){
			let parsed = rota_parsearListaComParametros(area.value)
			fila = parsed.fila
		} else {
			let nums = rota_parsearListaProcessos(area.value)
			fila = nums.map(numProc => ({ numProc, id: null, dadosLinha: [], params: [] }))
		}

		if(!fila.length){
			rota_avisoTemporario('Nenhum número de processo reconhecido na lista.', 'erro', 4000)
			return
		}

		if(checkbox.checked){
			let mapaParams = {}
			fila.forEach(item => { mapaParams[item.numProc] = item.params })
			localStorage.setItem('pjerota_params', JSON.stringify(mapaParams))
		} else {
			localStorage.removeItem('pjerota_params')
		}

		painel.remove()
		_rota_painelLista = null

		rota_avisoTemporario('▶ ' + fila.length + ' processo(s) na lista. Iniciando…', 'info', 4000)
		rota_iniciarPipeline({ fila })
	})

	rodape.appendChild(btnPlay)

	painel.appendChild(cab)
	painel.appendChild(corpo)
	painel.appendChild(rodape)

	document.body.appendChild(painel)
	area.focus()

	// Fecha ao clicar fora
	setTimeout(() => {
		document.addEventListener('click', function fecharFora(e){
			if(!painel.contains(e.target) && !btnRef.contains(e.target)){
				painel.remove()
				_rota_painelLista = null
				document.removeEventListener('click', fecharFora)
			}
		})
	}, 50)
}


// ── Coleta processos visíveis na tela ─────────────────────────

const SELETORES_A_EXCLUIR = [
    'painelGlobalcontainerDosGigs',
    'relatoriosDoGigsObservacaoDosGigs',
	'escaninhoDescricaoDaPeticao'
    // ...
]

function _rota_coletarFilaDaTela(){
    let texto   = document.body.innerText || ''
    let matches = [...texto.matchAll(ROTA_REGEX_CNJ)]

    let elementosAExcluir = new Set()
    for (let chave of SELETORES_A_EXCLUIR){
		const seletor = seletorPorVersao(chave)
		if (!seletor) continue  // ← guarda contra '' ou null
		for (let el of document.querySelectorAll(seletor)){
			let numero = el.innerText.match(ROTA_REGEX_CNJ)
			if(!numero) continue
			elementosAExcluir.add(numero[0])
		}
	}

    let vistos = new Set()
    let fila   = []
    for(let m of matches){
        let numProc = m[0]
        if(elementosAExcluir.has(numProc)) continue
        if(vistos.has(numProc)) continue
        vistos.add(numProc)
        let dadosLinha = _rota_capturarDadosDoProcesso(numProc)
        fila.push({ numProc, id: null, dadosLinha, params: [] })
    }
    return fila
}

// ── Localiza o card/linha do processo no DOM ──────────────────

function _rota_capturarDadosDoProcesso(numProc){
	let xpath  = `//*[contains(text(),'${numProc.slice(0,7)}')]`
	let result = document.evaluate(xpath, document.body, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
	for(let i = 0; i < result.snapshotLength; i++){
		let no = result.snapshotItem(i)
		if(!no.textContent.includes(numProc)) continue
		let conteiner = _rota_encontrarConteiner(no)
		if(!conteiner) continue
		let celulas = conteiner.querySelectorAll('td, [role="cell"], [role="gridcell"]')
		if(celulas.length)
			return Array.from(celulas).map(c => c.innerText?.trim() || '').filter(Boolean)
		return [conteiner.innerText?.trim() || '']
	}
	return []
}


// ── Sobe na árvore para encontrar o contêiner ────────────────

function _rota_encontrarConteiner(el){
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


// ── Busca ID do processo via API (+ garante OJ correta) ──────
//
// Ponto único de entrada antes de qualquer navegação de processo.
// Verifica e corrige a OJ da sessão se necessário — sem que o
// pipeline externo precise saber disso.
//
async function _rota_buscarIdProcesso(numero){
	let numLimpo = numero.replace(/[.\-]/g, '')
	let dados = await buscarIdPeloNumeroCNJ(numero)
	//console.log('%c[Rota PJE]%c Possível erro relatado pelo Heber: ' + JSON.stringify(dados?.resultado[0]?.id), LOG.teste, 'color:inherit')
	//console.log('%c[Rota PJE]%c Possível erro relatado pelo Heber: ' + JSON.stringify(id), LOG.teste, 'color:inherit')
	console.log('%c[Rota PJE]%c dados: ' + JSON.stringify(dados), LOG.rosa, 'color:inherit')
	let id = dados?.id
	if(!id) return null

	// Verifica e corrige a OJ antes de qualquer navegação
	let ojCheck = await _rota_garantirOJCorreta(numero)
	if(!ojCheck.ok){
		let msg = _ROTA_OJ_ERROS[ojCheck.motivo] || 'Erro ao verificar OJ.'
		rota_avisoTemporario('⚠ ' + msg, 'erro', 6000)
		return null  // sinaliza ao pipeline para pular/abortar este processo
	}
	if(ojCheck.recarregar){
		// Pipeline salvo — recarrega para corrigir o Angular após troca de OJ
		location.href = location.href
		return null  // interrompe este tick; retomada acontece após reload
	}
	if(ojCheck.trocou){
		rota_avisoTemporario('🔄 OJ ajustada automaticamente.', 'info', 3000)
	}

	return id
}


// ── Garante que o usuário está na OJ correta antes de abrir ──
//
// Fluxo:
//   1. Busca dados básicos do processo
//   2. Busca dados completos para obter orgaoJulgador.id
//   3. Compara com a OJ atual do usuário
//   4. Se diferente → salva pipeline + POST + sinaliza reload
//   5. Retorna { ok, trocou, recarregar }
//
async function _rota_garantirOJCorreta(numero){
    try {
        let dadosBasicos = await buscarIdPeloNumeroCNJ(numero)
		console.log('%c[Rota PJE]%c dadosBasicos: ' + JSON.stringify(dadosBasicos), LOG.rosa, 'color:inherit')
        if(!dadosBasicos) return { ok: false, motivo: 'nao_encontrado' }
        let idProcesso = dadosBasicos.id || dadosBasicos.idProcesso
        if(!idProcesso) return { ok: false, motivo: 'sem_id' }
        let dadosProcesso = typeof buscarProcesso === 'function'
            ? await buscarProcesso(idProcesso)
            : await rota_fetch(location.origin + '/pje-consulta-api/api/processos/' + idProcesso)
        let idOJProcesso = dadosProcesso?.orgaoJulgador?.id
        if(!idOJProcesso) return { ok: true }
        let ojAtual = typeof interceptador_lerOrgaosJulgadores === 'function'
            ? interceptador_lerOrgaosJulgadores()
            : null
        if(!ojAtual || ojAtual.id === idOJProcesso) return { ok: true }
		let perfis = await rota_fetch(location.origin + '/pje-seguranca/api/token/perfis')
		if(!Array.isArray(perfis)) return { ok: false, motivo: 'erro_perfis' }

		let perfil = perfis.find(p => p.idOrgaoJulgador === idOJProcesso)
		if(!perfil) return { ok: false, motivo: 'sem_perfil_oj' }

		// Persiste o pipeline ANTES do POST (o reload vai apagar a memória)
		if(typeof rota_pipeline_salvar === 'function'){
			await rota_pipeline_salvar(
				_rota_slots_ativos,
				_rota_tarefaUnica_ativa,
				_rota_temporizador_ativo
			)
		}

		await fetch(location.origin + '/pje-seguranca/api/token/perfis/trocar', {
			method:      'POST',
			mode:        'cors',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
				'Accept':       'application/json, text/plain, */*',
				'X-XSRF-TOKEN': rota_cookie('Xsrf-Token') || rota_cookie('XSRF-TOKEN'),
			},
			body: JSON.stringify({ id_perfil: perfil.idPerfil }),
		})

		relatar('_rota_garantirOJCorreta: perfil trocado para OJ', idOJProcesso, 'rota')
		return { ok: true, trocou: true, recarregar: true, ojAnterior: ojAtual.id, ojNova: idOJProcesso }

	} catch(e) {
		relatar('_rota_garantirOJCorreta: erro inesperado', e, 'rota')
		return { ok: false, motivo: 'excecao', erro: e }
	}
}


// ── Mensagens de erro de OJ ───────────────────────────────────

const _ROTA_OJ_ERROS = {
	nao_encontrado: 'Processo não encontrado na base.',
	sem_id:         'Não foi possível identificar o processo.',
	erro_perfis:    'Erro ao consultar perfis de OJ.',
	sem_perfil_oj:  'Você não possui perfil nesta OJ.',
	excecao:        'Erro ao verificar OJ do processo.',
}

// _____________________________________________________________
//                 TUTORIAIS
// _____________________________________________________________


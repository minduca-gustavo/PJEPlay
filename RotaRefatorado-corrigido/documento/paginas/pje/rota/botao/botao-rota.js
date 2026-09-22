// ============================================================
// botao-rota.js
// Botão Rota PJE — dividido em TELA e LISTA.
//
// TELA  → varre o body e coleta processos visíveis
// LISTA → abre painel de input para colar/digitar lista de processos.
//         Tem opção "com parâmetros": o usuário cola uma tabela com
//         número do processo + colunas extras. As colunas extras ficam
//         salvas e aparecem como botões de clipboard no widget.
//
// Quem chama: pje.js → rota_aoAbrir() e rota_observarNavegacaoSPA().
// Este arquivo só DECLARA; nada aqui se auto-executa.
// ============================================================


// ── letantes ────────────────────────────────────────────────

let ROTA_ID_BOTAO = id('botaoRota')

// Telas em que o botão aparece
let ROTA_JANELAS_BOTAO = [
	/pjekz\/painel/,
	/pjekz\/escaninho/,
	/pjekz\/pauta-audiencias/,
	/pjekz\/gigs\/relatorios/,
	/pjekz\/comunicacoesprocessuais/,
	/pjekz\/atas-audiencias/,
	/gigs\/meu-painel/,
]

let ROTA_SELETOR_BRASAO = 'pje-cabecalho #brasao-republica'

// Paleta institucional
let ROTA_C = {
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

// Número CNJ. Guardado como texto e transformado em RegExp a cada uso:
// assim ninguém herda o lastIndex de uma regex /g usada antes.
// (Se o ROTA_REGEX_CNJ global existir em outro arquivo, dá para trocar.)
let _ROTA_CNJ_PADRAO = '\\d{7}[-.]\\d{2}[-.]\\d{4}[-.]\\d[-.]\\d{2}[-.]\\d{4}'

function _rota_regexCNJ(flags = 'g'){
	return new RegExp(_ROTA_CNJ_PADRAO, flags)
}

// Elementos cujo texto NÃO conta como processo da tela
let SELETORES_A_EXCLUIR = [
	'painelGlobalcontainerDosGigs',
	'relatoriosDoGigsObservacaoDosGigs',
	'escaninhoDescricaoDaPeticao',
]

// Mensagens de erro de OJ
let _ROTA_OJ_ERROS = {
	nao_encontrado: 'Processo não encontrado na base.',
	sem_id:         'Não foi possível identificar o processo.',
	erro_perfis:    'Erro ao consultar perfis de OJ.',
	sem_perfil_oj:  'Você não possui perfil nesta OJ.',
	erro_troca:     'Não foi possível trocar para a OJ do processo.',
	excecao:        'Erro ao verificar OJ do processo.',
}


// ── Estado dos popups ─────────────────────────────────────────

let _rota_painelLista = null
let _rota_menuTarefa  = null

function _rota_fecharPainelLista(){
	_rota_painelLista?.remove()
	_rota_painelLista = null
}

function _rota_fecharMenuTarefa(){
	_rota_menuTarefa?.remove()
	_rota_menuTarefa = null
}

// Fecha o popup ao clicar fora dele e do botão.
// O listener se desliga sozinho se o popup já tiver sido fechado por
// outro caminho (× , toggle, navegação) — sem isso, um listener velho
// anulava a referência do popup novo.
function _rota_fecharAoClicarFora(el, btnRef, aoFechar){
	setTimeout(() => {
		function fecharFora(e){
			if(!el.isConnected){
				document.removeEventListener('click', fecharFora)
				return
			}
			if(el.contains(e.target) || btnRef.contains(e.target)) return
			document.removeEventListener('click', fecharFora)
			aoFechar()
		}
		document.addEventListener('click', fecharFora)
	}, 50)
}


// ════════════════════════════════════════════════════════════
// INICIALIZAÇÃO
// ════════════════════════════════════════════════════════════
//
// Chamada na abertura e a cada navegação SPA. Sempre remove o botão
// antigo primeiro: se a nova URL não estiver na lista, ele some.

async function botaoRotaIniciar(){

	document.getElementById(ROTA_ID_BOTAO)?.remove()
	_rota_fecharMenuTarefa()
	_rota_fecharPainelLista()

	if(!confereJanela(...ROTA_JANELAS_BOTAO)) return

	await aguardarElemento(ROTA_SELETOR_BRASAO)
	let brasao = document.querySelector(ROTA_SELETOR_BRASAO)
	if(!brasao) return

	// Abertura + SPA podem chamar em sequência e as duas chamadas
	// passarem pelo await: remove de novo para não duplicar.
	document.getElementById(ROTA_ID_BOTAO)?.remove()

	let botaoRota = _rota_criarBotaoDOM(ROTA_ID_BOTAO)
	botaoRota.style.left = 'max(15%, 120px)'
	botaoRota.style.top = '-4px'
	botaoRota.appendChild(_rota_criarBotoesAjuda())

	brasao.insertAdjacentElement('afterend', botaoRota)

}


// ════════════════════════════════════════════════════════════
// BOTÃO: SETA DUPLA (SVG) + PLACA TAREFA
// ════════════════════════════════════════════════════════════

function _rota_criarBotaoDOM(id){

	let btn = document.createElement('div')
	btn.id  = id
	Object.assign(btn.style, {
		position:      'absolute',
		zIndex:        '10000',
		display:       'flex',
		flexDirection: 'row',
		alignItems:    'center',
		gap:           '6px',
		width:         'fit-content',
		cursor:        'default',
		userSelect:    'none',
		filter:        'drop-shadow(0 3px 8px rgba(0,0,0,0.22))',
		isolation:     'isolate',
	})

	// Wrapper relativo: as zonas clicáveis se posicionam sobre o SVG
	let wrap = document.createElement('div')
	Object.assign(wrap.style, { position: 'relative', width: '130px', height: '65px' })

	// ── SVG ───────────────────────────────────────────────────
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
		<rect id="rota-placa-corpo" x="28" y="51" width="124" height="30" rx="6"
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

	wrap.appendChild(svg)

	// ── Zonas clicáveis (divs sobre o SVG) ────────────────────
	function zona(posicao){
		let z = document.createElement('div')
		Object.assign(z.style, { position: 'absolute', cursor: 'pointer' }, posicao)
		wrap.appendChild(z)
		return z
	}

	let zTela   = zona({ top: '0',     left: '0',   width: '46%',  height: '60%' })
	let zLista  = zona({ top: '0',     right: '0',  width: '46%',  height: '60%' })
	let zTarefa = zona({ bottom: '2%', left: '14%', right: '14%',  height: '36%' })

	// Hover na seta
	function hoverSeta(on){
		wrap.querySelector('#rota-seta-corpo')
			?.setAttribute('fill', on ? ROTA_C.azul : 'url(#rotaGSeta)')
	}
	for(let z of [zTela, zLista]){
		z.addEventListener('mouseenter', () => hoverSeta(true))
		z.addEventListener('mouseleave', () => hoverSeta(false))
	}

	// Hover na placa
	function hoverTarefa(on){
		wrap.querySelector('#rota-placa-corpo')
			?.setAttribute('fill', on ? ROTA_C.laranja : 'url(#rotaGLaranja)')
	}
	zTarefa.addEventListener('mouseenter', () => hoverTarefa(true))
	zTarefa.addEventListener('mouseleave', () => hoverTarefa(false))

	// Cliques
	zTela.addEventListener('click',   e => { e.stopPropagation(); _rota_aoClicarTela() })
	zLista.addEventListener('click',  e => { e.stopPropagation(); _rota_aoClicarLista(btn) })
	zTarefa.addEventListener('click', e => { e.stopPropagation(); _rota_aoClicarTarefa(btn) })

	btn.appendChild(wrap)

	_rota_atualizarNomeTarefa(btn)

	return btn

}


// ── Botões redondos ❓ / ⚙️ ao lado da seta ───────────────────

function _rota_criarBotoesAjuda(){

	let div = document.createElement('div')
	div.id  = 'rota_rota_tutorial_div'
	Object.assign(div.style, {
		display:    'flex',
		gap:        '6px',
		width:      'fit-content',
		position:   'relative',
		top:        '2px',
		flexDirection: 'column',
	})

	let botoes = [
		{
			id:          'rota_tutorial_botao',
			textContent: '❓',
			url:         'https://drive.google.com/drive/u/0/folders/1kfZ6tCIIyv6RVeCG_S6eIoE9qF_oARn4',
			tooltip:     '▶️ Clique para ver os vídeos tutoriais do ROTA.\nDeve estar logado na conta do TRT15 para obter acesso.',
		},
		{
			id:          'rota_gestao_botao',
			textContent: '⚙️',
			url:         extensao_raiz('navegador/paginas/menu/menu-gestor.htm'),
			tooltip:     '⚙️ Clique para ver informações de gestão -\nQuadro de juízes/perícias/tabela de assistentes/secretários, etc.',
		},
	]

	for(let botao of botoes){

		let el = document.createElement('button')
		el.id          = botao.id
		el.textContent = botao.textContent
		Object.assign(el.style, {
			position:       'relative',   // âncora do tooltip
			background:     `linear-gradient(to bottom, ${ROTA_C.laranjaClr}, #e8920a)`,
			color:          '#2a3a00',
			border:         '1.5px solid #7a5000',
			borderRadius:   '50%',
			width:          '22px',
			height:         '22px',
			lineHeight:     '22px',
			padding:        '0',
			fontSize:       '11px',
			textAlign:      'center',
			cursor:         'pointer',
			fontFamily:     "system-ui, 'Arial Black', Arial, sans-serif",
			fontWeight:     '900',
			boxShadow:      '0 1px 4px rgba(0,0,0,0.22)',
			display:        'flex',
			alignItems:     'center',
			justifyContent: 'center',
		})
		
		let tooltip = document.createElement('span')
		tooltip.textContent = botao.tooltip
		Object.assign(tooltip.style, {
			position:      'absolute',
			top:           'calc(100% + 6px)',   // abaixo do botão
			left:          '50%',
			transform:     'translateX(-50%)',
			background:    ROTA_C.texto,
			color:         ROTA_C.branco,
			fontSize:      '11px',
			fontFamily:    'system-ui, Arial, sans-serif',
			fontWeight:    '400',
			padding:       '3px 8px',
			borderRadius:  '4px',
			whiteSpace:    'pre-line',
			width:         '350px',
			pointerEvents: 'none',
			opacity:       '0',
			transition:    'opacity 0.15s',
			zIndex:        '1',
		})
		el.appendChild(tooltip)

		el.addEventListener('mouseenter', () => tooltip.style.opacity = '1')
		el.addEventListener('mouseleave', () => tooltip.style.opacity = '0')
		el.addEventListener('click',      () => window.open(botao.url))

		div.appendChild(el)

	}

	return div

}


// ── Atualiza label da tarefa no SVG ──────────────────────────

async function _rota_atualizarNomeTarefa(btn){
	if(!btn) return
	let cfg       = await obterArmazenamento('tarefaAtiva')
	let nomeAtivo = _ass_nomeTarefa(cfg?.tarefaAtiva) || cfg?.tarefaAtiva || '—'
	// Abrevia se necessário (máx ~14 chars no espaço disponível)
	let abrev = nomeAtivo.length > 14 ? nomeAtivo.slice(0, 13) + '…' : nomeAtivo
	let el = btn.querySelector('#rota-txt-tarefa')
	if(el) el.textContent = abrev.toUpperCase()
}


// ════════════════════════════════════════════════════════════
// PARSERS DE LISTA
// ════════════════════════════════════════════════════════════

// Texto livre → array de números CNJ, sem repetição, na ordem em que aparecem.

function rota_parsearListaProcessos(texto){
	if(!texto) return []
	let vistos = new Set()
	let lista  = []
	for(let m of texto.matchAll(_rota_regexCNJ())){
		let num = m[0]
		if(!vistos.has(num)){ vistos.add(num); lista.push(num) }
	}
	return lista
}


// Tabela tabulada → { fila: [{ numProc, id, dadosLinha, params }] }.
// A coluna do número pode estar em qualquer posição; as demais viram params.

function rota_parsearListaComParametros(texto){
	if(!texto) return { fila: [] }
	let regex  = _rota_regexCNJ('')
	let linhas = texto.split(/\r?\n/).filter(l => l.trim())
	let fila   = []
	let vistos = new Set()
	for(let linha of linhas){
		let partes  = linha.split('\t')
		let numProc = null
		let idxNum  = -1
		for(let i = 0; i < partes.length; i++){
			let match = partes[i].match(regex)
			if(match){ numProc = match[0]; idxNum = i; break }
		}
		if(!numProc || vistos.has(numProc)) continue
		vistos.add(numProc)
		let params = partes.filter((_, i) => i !== idxNum).map(p => p.trim()).filter(Boolean)
		fila.push({ numProc, id: null, dadosLinha: [], params })
	}
	return { fila }
}


// ════════════════════════════════════════════════════════════
// AÇÃO: TELA
// ════════════════════════════════════════════════════════════

async function _rota_aoClicarTela(){
	let fila = _rota_coletarFilaDaTela()
	if(!fila.length){
		rota_avisoTemporario('Nenhum número de processo encontrado na tela.', 'erro', 4000)
		return
	}
	rota_avisoTemporario('▶ ' + fila.length + ' processo(s) encontrado(s). Iniciando…', 'info', 4000)
	rota_iniciarFluxo({ fila })
}


// ── Coleta processos visíveis na tela ─────────────────────────
//
// Um número só é descartado se TODAS as suas ocorrências na tela
// estiverem dentro de áreas excluídas (observação de GIGS etc.).
// Se ele aparece também na lista principal, entra na fila.

function _rota_coletarFilaDaTela(){

	let texto = document.body.innerText || ''

	// Elementos excluídos, sem contar duas vezes um que está dentro de outro
	let excluidos = []
	for(let chave of SELETORES_A_EXCLUIR){
		let seletor = seletorPorVersao(chave)
		if(!seletor) continue
		for(let el of document.querySelectorAll(seletor)) excluidos.push(el)
	}
	excluidos = excluidos.filter(el => !excluidos.some(outro => outro !== el && outro.contains(el)))

	// Quantas vezes cada número aparece dentro das áreas excluídas
	let ocorrenciasExcluidas = new Map()
	for(let el of excluidos){
		for(let m of (el.innerText || '').matchAll(_rota_regexCNJ())){
			ocorrenciasExcluidas.set(m[0], (ocorrenciasExcluidas.get(m[0]) || 0) + 1)
		}
	}

	let vistos = new Set()
	let fila   = []
	for(let m of texto.matchAll(_rota_regexCNJ())){
		let numProc = m[0]

		// Consome uma ocorrência excluída antes de aceitar o número
		let restantes = ocorrenciasExcluidas.get(numProc) || 0
		if(restantes > 0){
			ocorrenciasExcluidas.set(numProc, restantes - 1)
			continue
		}

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


// ════════════════════════════════════════════════════════════
// AÇÃO: TAREFA (menu de seleção)
// ════════════════════════════════════════════════════════════

async function _rota_aoClicarTarefa(btnRef){

	// Toggle: fecha se já está aberto
	if(_rota_menuTarefa){ _rota_fecharMenuTarefa(); return }
	_rota_fecharPainelLista()

	let store     = await obterArmazenamento(['tarefas', 'tarefaAtiva'])
	let tarefas   = store?.tarefas     || {}
	let nomeAtivo = store?.tarefaAtiva || ''
	let nomes     = Object.keys(tarefas)

	let tarefasSistema = typeof catalogo_listar === 'function' ? catalogo_listar() : []

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
		background:    ROTA_C.azul,
		padding:       '6px 10px',
		fontSize:      '9px',
		fontWeight:    '700',
		color:         'rgba(255,255,255,0.8)',
		letterSpacing: '0.5px',
		textTransform: 'uppercase',
	})
	header.textContent = 'Selecionar tarefa'
	menu.appendChild(header)

	async function selecionar(tarefaAtiva, tarefaAtivaIsSistema){
		await armazenar({ tarefaAtiva, tarefaAtivaIsSistema })
		_rota_fecharMenuTarefa()
		_rota_atualizarNomeTarefa(document.getElementById(ROTA_ID_BOTAO))
	}

	// ── Tarefas do sistema (🤖) ───────────────────────────────
	for(let tarefa of tarefasSistema){
		menu.appendChild(_rota_itemMenuTarefa(
			'🤖', tarefa.label, tarefa.id === nomeAtivo,
			() => selecionar(tarefa.id, true)
		))
	}

	// Divisor entre sistema e usuário
	if(tarefasSistema.length && nomes.length){
		let divisor = document.createElement('div')
		Object.assign(divisor.style, { height: '1px', background: ROTA_C.borda, margin: '4px 0' })
		menu.appendChild(divisor)
	}

	// ── Tarefas do usuário (👤) ───────────────────────────────
	for(let nome of nomes){
		menu.appendChild(_rota_itemMenuTarefa(
			'👤', nome, nome === nomeAtivo,
			() => selecionar(nome, false)
		))
	}

	if(!tarefasSistema.length && !nomes.length){
		let vazio = document.createElement('div')
		Object.assign(vazio.style, { padding: '10px', fontSize: '11px', color: ROTA_C.suave, textAlign: 'center' })
		vazio.textContent = 'Nenhuma tarefa cadastrada.'
		menu.appendChild(vazio)
	}

	document.body.appendChild(menu)

	_rota_fecharAoClicarFora(menu, btnRef, () => {
		menu.remove()
		if(_rota_menuTarefa === menu) _rota_menuTarefa = null
	})

}


function _rota_itemMenuTarefa(emoji, rotulo, ativo, aoClicar){

	let item = document.createElement('div')
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

	let icone = document.createElement('span')
	icone.textContent = emoji
	Object.assign(icone.style, { fontSize: '12px', flexShrink: '0' })

	item.appendChild(icone)
	item.appendChild(document.createTextNode(rotulo))

	item.addEventListener('mouseenter', () => { if(!ativo) item.style.background = ROTA_C.infoBg })
	item.addEventListener('mouseleave', () => { if(!ativo) item.style.background = ROTA_C.branco })
	item.addEventListener('click', aoClicar)

	return item

}


// ════════════════════════════════════════════════════════════
// AÇÃO: LISTA
// ════════════════════════════════════════════════════════════

function _rota_aoClicarLista(btnRef){

	// Toggle: fecha se já está aberto
	if(_rota_painelLista){ _rota_fecharPainelLista(); return }
	_rota_fecharMenuTarefa()

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

	// ── Cabeçalho ─────────────────────────────────────────────
	let cab = document.createElement('div')
	Object.assign(cab.style, {
		background: ROTA_C.azul,
		padding:    '8px 10px',
		display:    'flex',
		alignItems: 'center',
		gap:        '6px',
	})

	let titPainel = document.createElement('span')
	titPainel.textContent = 'Executar por lista'
	Object.assign(titPainel.style, { color: '#fff', fontWeight: '700', fontSize: '12px', flex: '1' })

	let btnX = document.createElement('button')
	btnX.textContent = '×'
	Object.assign(btnX.style, {
		background: 'transparent', border: 'none',
		color: 'rgba(255,255,255,0.65)', fontSize: '18px',
		cursor: 'pointer', lineHeight: '1', padding: '0',
	})
	btnX.addEventListener('mouseenter', () => btnX.style.color = '#fff')
	btnX.addEventListener('mouseleave', () => btnX.style.color = 'rgba(255,255,255,0.65)')
	btnX.addEventListener('click', () => _rota_fecharPainelLista())

	cab.appendChild(titPainel)
	cab.appendChild(btnX)

	// ── Corpo ─────────────────────────────────────────────────
	let corpo = document.createElement('div')
	Object.assign(corpo.style, { padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' })

	// Checkbox com parâmetros
	let wrapCheck = document.createElement('label')
	Object.assign(wrapCheck.style, {
		display: 'flex', alignItems: 'center', gap: '6px',
		cursor: 'pointer', userSelect: 'none',
	})

	let checkbox = document.createElement('input')
	checkbox.type = 'checkbox'
	Object.assign(checkbox.style, { accentColor: ROTA_C.azul, cursor: 'pointer', width: '14px', height: '14px' })

	let checkLabel = document.createElement('span')
	checkLabel.textContent = 'com parâmetros'
	Object.assign(checkLabel.style, { fontSize: '11px', color: ROTA_C.texto })

	wrapCheck.appendChild(checkbox)
	wrapCheck.appendChild(checkLabel)

	// Instrução
	let instrucao = document.createElement('p')
	Object.assign(instrucao.style, { fontSize: '10px', color: ROTA_C.suave, margin: '0', lineHeight: '1.4' })

	function atualizarInstrucao(){
		if(checkbox.checked){
			instrucao.innerHTML =
				'Cole uma tabela tabulada: <b style="color:' + ROTA_C.azul + '">1ª coluna = nº processo</b>, ' +
				'demais colunas = parâmetros que aparecerão como botões no widget.'
		} else {
			instrucao.textContent = 'Cole os números de processo em qualquer formato:'
		}
	}

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

	function atualizarPreview(){
		let vazio = !area.value.trim()
		if(checkbox.checked){
			let { fila } = rota_parsearListaComParametros(area.value)
			if(!fila.length){
				preview.textContent = vazio ? '' : '⚠ Nenhum número CNJ reconhecido.'
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
				preview.textContent = vazio ? '' : '⚠ Nenhum número CNJ reconhecido.'
				preview.style.color = ROTA_C.erroTexto
			} else {
				preview.textContent = '✓ ' + nums.length + ' processo(s) reconhecido(s)'
				preview.style.color = ROTA_C.okTexto
			}
		}
	}

	atualizarInstrucao()
	checkbox.addEventListener('change', () => { atualizarInstrucao(); atualizarPreview() })
	area.addEventListener('input', atualizarPreview)

	corpo.appendChild(wrapCheck)
	corpo.appendChild(instrucao)
	corpo.appendChild(area)
	corpo.appendChild(preview)

	// ── Rodapé ────────────────────────────────────────────────
	let rodape = document.createElement('div')
	Object.assign(rodape.style, { display: 'flex', justifyContent: 'flex-end', gap: '6px', padding: '0 10px 10px' })

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

	btnPlay.addEventListener('click', () => {

		let fila = checkbox.checked
			? rota_parsearListaComParametros(area.value).fila
			: rota_parsearListaProcessos(area.value)
				.map(numProc => ({ numProc, id: null, dadosLinha: [], params: [] }))

		if(!fila.length){
			rota_avisoTemporario('Nenhum número de processo reconhecido na lista.', 'erro', 4000)
			return
		}

		if(checkbox.checked){
			let mapaParams = {}
			fila.forEach(item => { mapaParams[item.numProc] = item.params })
			localStorage.setItem('rotapje_params', JSON.stringify(mapaParams))
		} else {
			localStorage.removeItem('rotapje_params')
		}

		_rota_fecharPainelLista()

		rota_avisoTemporario('▶ ' + fila.length + ' processo(s) na lista. Iniciando…', 'info', 4000)
		rota_iniciarFluxo({ fila })

	})

	rodape.appendChild(btnPlay)

	painel.appendChild(cab)
	painel.appendChild(corpo)
	painel.appendChild(rodape)

	document.body.appendChild(painel)
	area.focus()

	_rota_fecharAoClicarFora(painel, btnRef, () => {
		painel.remove()
		if(_rota_painelLista === painel) _rota_painelLista = null
	})

}


// ════════════════════════════════════════════════════════════
// ID DO PROCESSO + OJ CORRETA
// ════════════════════════════════════════════════════════════

// ── Busca ID do processo via API (+ garante OJ correta) ──────
//
// Ponto único de entrada antes de qualquer navegação de processo.
// Verifica e corrige a OJ da sessão se necessário — sem que o
// fluxo externo precise saber disso.

async function _rota_buscarIdProcesso(numero){

	let dadosBasicos = await buscarIdPeloNumeroCNJ(numero)
	let id = dadosBasicos?.id || dadosBasicos?.idProcesso
	if(!id) return null

	// Reaproveita dadosBasicos: evita uma segunda consulta à API
	let ojCheck = await _rota_garantirOJCorreta(numero, dadosBasicos)

	if(!ojCheck.ok){
		let msg = _ROTA_OJ_ERROS[ojCheck.motivo] || 'Erro ao verificar OJ.'
		rota_avisoTemporario('⚠ ' + msg, 'erro', 6000)
		return null   // sinaliza ao fluxo para pular/abortar este processo
	}

	if(ojCheck.recarregar){
		// Fluxo já salvo — recarrega para o Angular assumir a nova OJ
		location.reload()
		return null   // interrompe este tick; retomada acontece após o reload
	}

	if(ojCheck.trocou){
		rota_avisoTemporario('🔄 OJ ajustada automaticamente.', 'info', 3000)
	}

	return id

}


// ── Garante que o usuário está na OJ correta antes de abrir ──
//
// Fluxo:
//   1. Dados básicos do processo (recebidos ou buscados)
//   2. Dados completos para obter orgaoJulgador.id
//   3. Compara com a OJ atual do usuário
//   4. Se diferente → POST de troca; SÓ SE der certo, salva o fluxo
//   5. Retorna { ok, trocou, recarregar }
//
// O fluxo é salvo DEPOIS do POST de propósito: o POST não recarrega
// a página (o reload é feito por quem chama), então a memória ainda
// está intacta. E se a troca falhar, nada fica salvo — sem isso,
// uma troca recusada gerava reload → retomada → nova tentativa → loop.

async function _rota_garantirOJCorreta(numero, dadosBasicos = null){

	try {

		dadosBasicos ??= await buscarIdPeloNumeroCNJ(numero)
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

		let resposta = await fetch(location.origin + '/pje-seguranca/api/token/perfis/trocar', {
			method:      'POST',
			mode:        'cors',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
				'Accept':       'application/json, text/plain, */*',
				'X-XSRF-TOKEN': cookie_obter('Xsrf-Token') || cookie_obter('XSRF-TOKEN'),
			},
			body: JSON.stringify({ id_perfil: perfil.idPerfil }),
		})

		if(!resposta.ok){
			relatar('_rota_garantirOJCorreta: troca de perfil recusada', resposta.status, 'rota')
			return { ok: false, motivo: 'erro_troca' }
		}

		// Troca confirmada — agora sim persiste o fluxo para o reload
		if(typeof rota_fluxo_salvar === 'function'){
			await rota_fluxo_salvar(
				_rota_slots_ativos,
				_rota_tarefaUnica_ativa,
				_rota_temporizador_ativo
			)
		}

		relatar('_rota_garantirOJCorreta: perfil trocado para OJ', idOJProcesso, 'rota')
		return { ok: true, trocou: true, recarregar: true, ojAnterior: ojAtual.id, ojNova: idOJProcesso }

	} catch(e) {
		relatar('_rota_garantirOJCorreta: erro inesperado', e, 'rota')
		return { ok: false, motivo: 'excecao', erro: e }
	}

}
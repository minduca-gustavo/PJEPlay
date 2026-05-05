Y// ============================================================
// pintura.js
// Coloração de cabeçalhos de documentos no PJE.
//
// Atua em duas páginas:
//   1. /pjekz/processo/:id/detalhe  — lê texto do PDF
//   2. /pjekz/processo/:id/documento/:docId/conteudo — HTML ou PDF
//
// Mostra o TERMO encontrado no cabeçalho que foi pintado.
// ============================================================

// ── Detecção de página ────────────────────────────────────────

function pintura_ehDetalhe(){
	return /\/pjekz\/processo\/\d+\/detalhe(\/.*)?/.test(location.pathname)
}

function pintura_ehConteudo(){
	return /\/pjekz\/processo\/\d+\/documento\/\d+\/conteudo/.test(location.pathname)
}


// ── Regras ────────────────────────────────────────────────────

async function pintura_carregarRegras(){
	// Regras estão dentro da tarefa ativa
	let cfg = await obterArmazenamento('tarefaAtiva')
	let nomeAtivo = cfg?.tarefaAtiva || ''
	if(!nomeAtivo) return []
	let store = await obterArmazenamento('tarefas')
	let tarefa = store?.tarefas?.[nomeAtivo]
	return tarefa?.regras || []
}

// ── Regras ────────────────────────────────────────────────────

function pintura_resolverTodos(textoNormalizado = '', regras = []){
	let principal = null
	let extras    = []  // { termo, cor } dos demais encontrados

	for(let regra of regras){
		if(!regra.cor || !regra.termos) continue
		let termos = regra.termos.split(/[,;]/)
			.map(t => normalizar(t.trim())).filter(t => t)
		for(let termo of termos){
			if(!textoNormalizado.includes(termo)) continue
			if(!principal){
				principal = { cor: regra.cor, termo }
			} else {
				// Só adiciona se ainda não está na lista
				if(!extras.some(e => e.termo === termo))
					extras.push({ cor: regra.cor, termo })
			}
		}
	}

	if(!principal) return null
	return { cor: principal.cor, termo: principal.termo, extras }
}


// ── Aplicação visual ─────────────────────────────────────────

function pintura_aplicar(cabecalho, cor, termo, extras = []){
	if(!cabecalho) return
	cabecalho.style.backgroundColor = cor
	cabecalho.style.borderLeft      = `6px solid ${escurecerCor(cor)}`

	remover('#pjerota-termo-badge')

	let badge = document.createElement('span')
	badge.id = 'pjerota-termo-badge'
	Object.assign(badge.style, {
		disrota:       'inline-block',
		marginLeft:    '12px',
		padding:       '2px 10px',
		background:    'rgba(0,0,0,0.25)',
		borderRadius:  '20px',
		fontSize:      '11px',
		fontWeight:    '700',
		color:         '#fff',
		letterSpacing: '0.5px',
		verticalAlign: 'middle',
		textTransform: 'uppercase',
		position:      'relative',
		cursor:        extras.length ? 'default' : 'auto',
	})
	badge.textContent = (extras.length ? '💡 ' : '💡 ') + termo
	if(extras.length) badge.textContent += ` (+${extras.length})`

	// ── Tooltip ────────────────────────────────────────────────
	if(extras.length){
		let tip = document.createElement('span')
		Object.assign(tip.style, {
			disrota:       'none',
			position:      'absolute',
			bottom:        'calc(100% + 6px)',
			left:          '50%',
			transform:     'translateX(-50%)',
			background:    '#222',
			color:         '#fff',
			borderRadius:  '8px',
			padding:       '6px 10px',
			fontSize:      '11px',
			whiteSpace:    'nowrap',
			boxShadow:     '0 2px 8px rgba(0,0,0,0.4)',
			zIndex:        '999999',
			pointerEvents: 'none',
			lineHeight:    '1.6',
		})

		tip.innerHTML = '<b style="opacity:.6;font-size:10px">TAMBÉM ENCONTRADO</b><br>'
			+ extras.map(e =>
				`<span style="disrota:inline-block;width:10px;height:10px;border-radius:50%;background:${e.cor};margin-right:5px;vertical-align:middle"></span>${e.termo.toUpperCase()}`
			).join('<br>')

		badge.appendChild(tip)
		badge.addEventListener('mouseenter', () => tip.style.disrota = 'block')
		badge.addEventListener('mouseleave', () => tip.style.disrota = 'none')
	}

	let alvo = cabecalho.querySelector('.cabecalho-direita') || cabecalho
	alvo.appendChild(badge)
}

function pintura_limpar(cabecalho){
	if(!cabecalho) return
	cabecalho.style.removeProperty('background-color')
	cabecalho.style.removeProperty('border-left')
	remover('#pjerota-termo-badge')
}


// ── Extração de texto — PDF ───────────────────────────────────

function pintura_extrairBlobUrl(dataAttr = ''){
	if(dataAttr.startsWith('blob:')) return dataAttr
	try{
		let f = new URL(dataAttr).searchParams.get('file')
		if(f && f.startsWith('blob:')) return f
	} catch(_){}
	let m = dataAttr.match(/[?&]file=(blob:[^#&]+)/)
	return m ? decodeURIComponent(m[1]) : null
}

async function pintura_textoPDF(blobUrl){
	let res = await fetch(blobUrl)
	if(!res.ok) throw new Error('fetch blob: ' + res.status)
	let buf  = await res.arrayBuffer()
	let resp = await NAVEGADOR.runtime.sendMessage({
		tipo: 'EXTRAIR_PDF', bytes: Array.from(new Uint8Array(buf))
	})
	if(!resp.ok) throw new Error(resp.erro)
	return resp.texto
}

function pintura_aguardarPDF(timeout = 10000){
	return new Promise(resolver => {
		function tentar(){
			let obj = document.querySelector('object[data*="pdf"]')
			if(obj){
				let b = pintura_extrairBlobUrl(obj.getAttribute('data') || '')
				if(b){ resolver(b); return true }
			}
			return false
		}
		if(tentar()) return
		let timer = setTimeout(() => { obs.disconnect(); resolver(null) }, timeout)
		let obs = new MutationObserver(() => {
			if(tentar()){ clearTimeout(timer); obs.disconnect() }
		})
		obs.observe(document.body, {
			childList:true, subtree:true,
			attributes:true, attributeFilter:['data']
		})
	})
}


// ── Extração de texto — HTML inline ──────────────────────────
// Usado na página /conteudo quando o documento é HTML

function pintura_textoHTML(){
	// Remove scripts/styles e pega innerText do body ou do iframe
	let corpo = document.querySelector('body')
		?.contentDocument?.body
		|| document.body
	return normalizar(corpo?.innerHTML || '')
}


// ── Aguarda cabeçalho ─────────────────────────────────────────

async function pintura_aguardarCabecalho(){
	// Detalhe: mat-card.cabecalho
	// Conteúdo: .mat-card-title ou pje-cabecalho ou header
	let seletor = pintura_ehDetalhe()
		? 'mat-card.cabecalho'
		: '.mat-card-header, pje-cabecalho-conteudo, mat-toolbar, header'
	return await aguardarElemento(seletor, 12000)
}


// ── Processamento principal ───────────────────────────────────

async function pintura_processar(regras){
	if(!regras.length) return

	let cabecalho = await pintura_aguardarCabecalho()
	if(!cabecalho){ relatar('Cabeçalho não encontrado.', '', 'erro'); return }

	// Indicador de carregamento
	cabecalho.style.borderLeft = '6px solid #5e84a8'
	cabecalho.style.opacity    = '0.75'

	let texto = ''

	// Tenta PDF primeiro (presente em ambas as páginas)
	let blobUrl = await pintura_aguardarPDF(6000)
	if(blobUrl){
		try{
			texto = await pintura_textoPDF(blobUrl)
		} catch(e){
			relatar('Erro PDF: ' + e.message, '', 'erro')
		}
	}

	// Se não achou PDF (página /conteudo com HTML), usa texto do DOM
	if(!texto && pintura_ehConteudo()){
		// Aguarda um pouco o conteúdo renderizar
		await suspender(800)
		texto = pintura_textoHTML()
	}

	cabecalho.style.opacity = '1'
	pintura_limpar(cabecalho)

	if(!texto){ relatar('Sem texto para classificar.', '', 'execucao'); return }

	let resultado = pintura_resolverTodos(normalizar(texto), regras)
	if(resultado) pintura_aplicar(cabecalho, resultado.cor, resultado.termo, resultado.extras)
	else          relatar('Nenhum termo encontrado.', '', 'execucao')
}


// ── Escuta cliques na timeline ────────────────────────────────

function pintura_registrarEscuta(){
	document.addEventListener('click', async e => {
		let alvo = e.target.closest('a.tl-documento[role="button"]')
		if(!alvo) return
		await suspender(600)
		let regras = await pintura_carregarRegras()
		if(!regras.length) return
		pintura_processar(regras).catch(err => relatar('Pintura reprocessar: ' + err.message, '', 'erro'))
	}, true)
}


// ── Ponto de entrada ─────────────────────────────────────────

async function pintura_iniciar(){
	if(!pintura_ehDetalhe() && !pintura_ehConteudo()) return
	relatar('Pintura iniciando…', '', 'execucao')
	if(pintura_ehDetalhe()) pintura_registrarEscuta()
	let regras = await pintura_carregarRegras()
	if(!regras.length){ relatar('Sem regras de pintura.', '', 'execucao'); return }
	pintura_processar(regras).catch(e => relatar('Pintura erro: ' + e.message, '', 'erro'))
}

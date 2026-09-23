// ============================================================
// rota-nucleo.js
// Substitui a antiga pasta rota/modulos/.
//
// REGRA DESTE ARQUIVO: só entra aqui o que a pasta modulos/ do
// SISE NÃO oferece. Tudo que existe lá é consumido direto:
//
//   suspender, clicar, focar, preencher, evento, digitar,
//   copiar_texto, pressionarTecla ......... modulos/automacao.js
//   selecionar, remover, estilizar, criar,
//   aguardarElemento, extrairTexto,
//   cookie_obter, criar_metaTag .......... modulos/dom.js
//   armazenar, obterArmazenamento,
//   extensao_raiz, abrirURL .............. modulos/navegador.js
//   relatar .............................. modulos/relatar.js
//   NAVEGADOR, EXTENSAO, LOCAL,
//   CONFIGURACAO, CONTEXTO, TELA ......... modulos/definicoes.js
//   normalização de texto, CNJ, truncar,
//   tabular, prefixar .................... modulos/texto.js
//   url_parametro_obter .................. modulos/url.js
//   criarChaveDeIdempotencia ............. modulos/apis.js
//
// A pasta modulos/ é atualizada por git e não deve ser tocada.
// ============================================================


// ── Log de tela do Rota ───────────────────────────────────────
// Independente do relatar(): é o log colorido de bancada, usado
// em centenas de pontos dos roteiros. Fica, mas silencia junto
// com o diagnóstico (ver rota_nucleo_definirModoDev()).

const LOG = {
	info:   'background:#0D47A1;color:white;padding:2px 4px;border-radius:3px',
	erro:   'background:#B71C1C;color:white;padding:2px 4px;border-radius:3px',
	aviso:  'background:#F57C00;color:white;padding:2px 4px;border-radius:3px',
	teste:  'background:#2E7D32;color:white;padding:2px 4px;border-radius:3px',
	rosa:   'background:#FF10D7;color:white;padding:2px 4px;border-radius:3px',
	mb:     'background:#ddf500;color:black;padding:2px 4px;border-radius:3px',
}

var MODO_DEV = false


/**
 * Traduz o antigo booleano `modoDev` do Rota para o diagnóstico
 * por tipo do SISE (CONFIGURACAO.diagnostico.*), que é o que o
 * relatar() de modulos/relatar.js consulta.
 *
 * Chamada por rota() depois de definicoesGlobais().
 */
/**
 * Define apenas MODO_DEV — o booleano que janelas.js usa para a
 * geometria da janela assistente.
 *
 * NÃO mexe em CONFIGURACAO.diagnostico. Quem manda no que o
 * relatar() imprime é exclusivamente o checklist "Log por módulo"
 * do popup, que grava CONFIGURACAO.diagnostico direto no storage.
 *
 * Amarrar os dois foi o bug: como modoDev fica `true` no storage,
 * esta função reescrevia todas as chaves de diagnostico como true
 * a cada carregamento de página, apagando silenciosamente o que o
 * usuário tinha desmarcado no checklist.
 */
function rota_nucleo_definirModoDev(ligado = false){
	MODO_DEV = ligado === true
}


// ── Padrões de janela do PJe ──────────────────────────────────
// Mantidos separados do EXPRESSAO.pje do SISE: as chaves do Rota
// são usadas por nome em dezenas de confereJanela(JANELA.x).

var JANELA = {
	meuPainel:              /\/pjekz\/gigs\/meu-painel/,
	gigsRelatorios:         /\/pjekz\/gigs\/relatorios\/atividades/,
	painelGlobal:           /\/pjekz\/painel\/global/,
	painelGlobalTarefas:    /\/pjekz\/painel\/global\/\d*\/lista-processos/,
	analisarEAssinar:       /\/pjekz\/painel\/global\/2\/lista-processos/,
	painelGlobalTodos:      /\/pjekz\/painel\/global\/todos\/lista-processos/,
	detalhes:               /\/pjekz\/processo\/\d*\/detalhe/,
	tarefaAssinar:          /\/pjekz\/processo\/\d*\/tarefa\/\d*\/assinar/,
	tarefa:                 /\/pjekz\/processo\/\d*\/tarefa\/\d*\/*/,
	documentosConteudo:     /\/pjekz\/processo\/\d*\/detalhe\/documento\/\d*\/conteudo*/,
	escaninho:              /\/pjekz\/escaninho/,
	retificar:              /\/pjekz\/processo\/\d*\/retificar/,
	certificar:             /\/pjekz\/processo\/\d*\/documento\/anexar/,
	pec:                    /\/pjekz\/processo\/\d*\/comunicacoesprocessuais\/minutas/,
	processoTarefa:         /\/pjekz\/processo\/\d*\/tarefa\/\d*\/*/,
	pautaAudiencias:        /\/pjekz\/pauta-audiencias/,
	atasAudiencias:         /\/pjekz\/atas-audiencias/,
	aud:                    /\/aud\/#\/audiencia/,
	gim:					/\/pjekz\/painel\/gim\/?$/i,
	gimAssinarTodos: 		/\/pjekz\/painel\/gim\/todos\/oj\/\d*\/lista-processos\?assinarTodos=true/
}

const ROTA_REGEX_CNJ = /\d{7}[-.]\d{2}[-.]\d{4}[-.]\d[-.]\d{2}[-.]\d{4}/g


// ── Armazenamento — só o que falta no SISE ────────────────────

async function removerArmazenamento(chave){
	await NAVEGADOR.storage.local.remove(chave)
}

function rota_normalizaHtml(valor) {
    if (!valor) return ''
    if (typeof valor === 'string') return valor
    if (Array.isArray(valor)) return valor.map(rota_normalizaHtml).filter(Boolean).join('')
    for (let chave of ['html', 'conteudo', 'texto', 'documento', 'teor', 'minuta', 'valor']){
        let v = valor?.[chave]
        if (typeof v === 'string' && v.trim() !== '') return v
    }
    return ''
}


// ── Espera com timeout ────────────────────────────────────────
//
// O aguardarElemento() do SISE não tem timeout e a assinatura do
// 2º parâmetro é um objeto de configuração. As automações do Rota
// dependem de desistir depois de N ms, então esta função embrulha
// a do módulo em vez de reimplementá-la.
//
//   rota_aguardarElemento('#id')          → espera indefinidamente
//   rota_aguardarElemento('#id', 12000)   → null depois de 12 s

async function rota_aguardarElemento(
	seletor       = '',
	timeout       = 0,
	configuracao  = {}
){
	if(!timeout || timeout <= 0)
		return await aguardarElemento(seletor, configuracao)

	let encerrado = false
	let temporizador = null

	let desistencia = new Promise(resolver => {
		temporizador = setTimeout(() => {
			encerrado = true
			relatar('Tempo esgotado aguardando elemento:', seletor, 'mutacao')
			resolver(null)
		}, timeout)
	})

	let busca = aguardarElemento(seletor, configuracao).then(elemento => {
		if(encerrado) return null
		clearTimeout(temporizador)
		return elemento
	})

	return await Promise.race([busca, desistencia])
}

function aguardarMetaAtualizar(rotulo, timeout = 8000){
    return new Promise(resolver => {
        const handler = evento => {
            if(evento.detail.rotulo !== rotulo) return
            document.removeEventListener('RotaMetaTagAtualizada', handler)
            clearTimeout(timer)
            resolver(interceptador_ler(rotulo))
        }
        document.addEventListener('RotaMetaTagAtualizada', handler)
        const timer = setTimeout(() => {
            document.removeEventListener('RotaMetaTagAtualizada', handler)
            resolver(null)
        }, timeout)
    })
}

function aguardarElementoMudar(elemento, atributo){
    const seletor = '#' + elemento.id
    const valorAnterior = elemento.getAttribute(atributo)
    return new Promise(resolver => {
        const obs = new MutationObserver(() => {
            const atual = document.querySelector(seletor)
            if(atual && (atual !== elemento || atual.getAttribute(atributo) !== valorAnterior)){
                obs.disconnect()
                resolver(atual.getAttribute(atributo))
            }
        })
        obs.observe(document.head, { childList: true, subtree: true, attributes: true, attributeFilter: [atributo] })
    })
}


// ── Preenchimento — variantes que o SISE não cobre ────────────
//
// preencher() do modulos/automacao.js resolve o caso comum
// (input controlado por React/Angular). Estas três tratam casos
// que ele não cobre: autocomplete com mat-option, digitação
// caractere a caractere com keydown/keyup, e CKEditor.

function _getValueDescriptor(el){
	const proto = (el instanceof HTMLTextAreaElement)
		? window.HTMLTextAreaElement.prototype
		: (el instanceof HTMLSelectElement)
			? window.HTMLSelectElement.prototype
			: window.HTMLInputElement.prototype
	return Object.getOwnPropertyDescriptor(proto, 'value')
}


async function preencherCampoComEscolhaDeOpcao(elemento, valor){
	preencher(elemento, valor)
	let opcao = await aguardarElemento('mat-option')
	await suspender(300)
	clicar(opcao)
}


function preencherComAutoComplete(campo, texto){
	if(typeof campo === 'string') campo = selecionar(campo)
	if(!campo) return
	focar(campo, false)
	const desc = _getValueDescriptor(campo)
	desc.set.call(campo, texto)
	campo.dispatchEvent(new Event('focus',  { bubbles: true }))
	campo.dispatchEvent(new Event('input',  { bubbles: true }))
	campo.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }))
	campo.dispatchEvent(new KeyboardEvent('keyup',   { bubbles: true }))
}


async function digitarNoInput(campo, texto){
	if(typeof campo === 'string') campo = selecionar(campo)
	if(!campo) return
	focar(campo, false)
	campo.value = ''
	for(let caractere of texto){
		campo.dispatchEvent(new KeyboardEvent('keydown', { key: caractere, bubbles: true }))
		const desc = _getValueDescriptor(campo)
		desc.set.call(campo, campo.value + caractere)
		campo.dispatchEvent(new Event('input', { bubbles: true }))
		campo.dispatchEvent(new KeyboardEvent('keyup', { key: caractere, bubbles: true }))
		await suspender(30)
	}
	esforcosPoupados({
		movimentos: 1,
		cliques:    0,
		teclas:     contarCaracteres(texto),
		segundos:   caracteresParaSegundos(texto)
	})
}


async function preencherCKEditorExecCommand(seletor, texto){
	const el = typeof seletor === 'string' ? selecionar(seletor) : seletor
	if(!el) return
	focar(el, false)
	await suspender(200)
	document.execCommand('insertText', false, texto)
}


// ── Texto — semânticas próprias do Rota ───────────────────────
//
// normalizar() NÃO é removerAcentuacao() do SISE: além de tirar
// acento, ela minúscula e usa NFD (cobre acentos fora da faixa
// latin-1 tratada lá). A busca em texto mal formatado depende
// desse contrato, por isso fica.

function normalizar(texto){
	return String(texto ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}


function rgbParaHex(cor = ''){
	if(!cor) return '#000000'
	if(cor.startsWith('#')) return cor
	let m = cor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
	if(!m) return cor
	return '#' + [m[1],m[2],m[3]].map(n => parseInt(n).toString(16).padStart(2,'0')).join('')
}


function escurecerCor(hex = ''){
	let n = parseInt(hex.replace('#',''), 16)
	let r = Math.max(0,(n>>16)-40), g = Math.max(0,((n>>8)&0xff)-40), b = Math.max(0,(n&0xff)-40)
	return '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('')
}

async function lerGit(arquivo) {
	let url = 'https://raw.githubusercontent.com/minduca-gustavo/rotaPJEd/main/' + arquivo
	let resultado = await fetch(url, { cache: 'no-store', referrerPolicy: 'no-referrer' })
	if (!resultado.ok) throw new Error(`HTTP ${resultado.status}`)
    let dados = await resultado.json()
	return dados
}

function preencherRota(campo = '', texto = '', eventos = ['input','change']){
  if(typeof campo === 'string') campo = selecionar(campo)
  if(!campo) return
  focar(campo)
  const desc = _getValueDescriptor(campo)
  if(desc && desc.set) desc.set.call(campo, texto)
  else campo.value = texto
  if(eventos) eventos.forEach(t => campo.dispatchEvent(new Event(t, { bubbles:true })))
}

function buscaEmTextoMalFormatado(textoABuscar, termo, antes = 0, depois = 0){
	let texto = normalizar(textoABuscar).toLowerCase()
	let mapa = []
	let espacos = []
	let limpo = ''
	for(let i = 0; i < texto.length; i++){
		let c = texto[i]
		if(/\s/.test(c)){
			espacos.push(i)
			continue
		}
		limpo += c
		mapa.push(i)
	}
	let busca = normalizar(termo).toLowerCase().replace(/\s+/g, '')
	let posicao = limpo.indexOf(busca)
	if(posicao === -1) return null
	let inicio = mapa[posicao]
	let fim = mapa[posicao + busca.length - 1] + 1
	let espacoInicio = espacos[espacos.findIndex(d => d > Math.max(0, inicio - antes)) - 1]
	let espacoFim = espacos[espacos.findIndex(d => d > Math.min(textoABuscar.length, fim + depois))]
	let resultado = textoABuscar.slice(espacoInicio, espacoFim)
	return { trechos: resultado, termo: termo, inicio: inicio, fim: fim }
}


// ── Nome humano das tarefas ───────────────────────────────────

const _ASS_NOMES_TAREFA = {
	'triagem_inicial':   'Triagem Inicial',
	'pos-triagem':       'Pós-Triagem',
	'balcao-virtual':    'Balcão Virtual',
	'audiencia':         'Audiência',
	'cumprimento':       'Cumprimento de Sentença',
	'execucao':          'Execução',
	'sentenca':          'Sentença',
	'instrucao':         'Instrução',
	'julgamento':        'Julgamento',
}

function _ass_nomeTarefa(id){
	if(!id) return '—'
	if(_ASS_NOMES_TAREFA[id]) return _ASS_NOMES_TAREFA[id]
	return id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}


// ── Usuário logado ────────────────────────────────────────────

let USUARIO = {
	nome: null,
	idPerfil: null,
}

let paginasConfereUSUARIO = [
	'.jus.br/pjekz/painel',
	'.jus.br/pjekz/pdpj',
	'.jus.br/pjekz/comunicacoesprocessuais',
	'.jus.br/pjekz/configuracao',
	'.jus.br/pjekz/escaninho',
	'.jus.br/pjekz/atas-audiencias',
	'.jus.br/pjekz/pauta-audiencias',
	'.jus.br/gigs/meu-painel',
	'.jus.br/gigs/relatorios',
	'.jus.br/exe-pje'
]

async function identificaUsuario(){
	if(!paginasConfereUSUARIO.some(p => LOCAL.includes(p))) return

	for(let i = 0; i < 20; i++){
		const el = selecionar('.nome-usuario')
		if(el?.textContent?.trim()){
			USUARIO.nome = el.textContent.trim()
			break
		}
		await suspender(500)
	}

	await armazenar({ rota_usuario: USUARIO })
}

// ── Avisos visuais ────────────────────────────────────────────

function rota_avisoTemporario(msg = '', tipo = 'info', ms = 3000){
	let c = document.getElementById('rotapje-avisos')
	if(!c){
		c = document.createElement('div')
		c.id = 'rotapje-avisos'
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

// ── Conferência de janela / execução ──────────────────────────

function confereJanela(...janelas){
	return janelas.some(regex => regex.test(location.href))
}

function confereJanelaNome(nome){
	return window.name === nome
}

async function conferenciaCompletaJanela(tarefaEsperada, tipoJanela = JANELA.detalhes){
	const janela = confereJanela(tipoJanela)
	if(!janela) return null

	const execucao = window.name.split('-').pop()
	const cfg      = await obterArmazenamento(['rotaExecucaoAtual'])
	const atual    = String(cfg?.rotaExecucaoAtual || '')
	if(execucao !== atual) return null

	let tarefa = rota_buscarParametros('rotapje_tarefa')
	if(!tarefa){
		const salvo = await obterArmazenamento('rotapje_tarefa')
		tarefa = salvo?.rotapje_tarefa
	} else {
		await armazenar({ rotapje_tarefa: tarefa })
	}

	if(tarefa !== tarefaEsperada) return null

	return atual
}


// ── Comunicação entre janelas (comandar / obedecer) ───────────

function comandar(acoes, parametros){
	relatar('comandar: ' + acoes, parametros, 'execucao')
	armazenar({ rota_comando: { acoes, parametros } })
}

async function obedecer(mudancas){
	const comando = mudancas['rota_comando']?.newValue
	if(!comando) return
	armazenar({ rota_comando: null })
	const { acoes, parametros } = comando
	relatar('obedecer: ' + acoes[0], parametros, 'execucao')
	for(let i = 0; i < acoes.length; i++){
		const fn = rota_acoes[acoes[i]]
		if(fn) await fn(parametros?.[i])
		else relatar('Ação desconhecida: ' + acoes[i], '', 'erro')
	}
}

const rota_acoes = {
	'rota_proximo': async () => {
		let cfg = await obterArmazenamento(['rotaExecucaoAtual'])
		let sessao = cfg?.rotaExecucaoAtual
		if(sessao) rota_sinalizar(sessao, 'proximo')
	},
	'rota_encerrar': async () => {
		let cfg = await obterArmazenamento(['rotaExecucaoAtual'])
		let sessao = cfg?.rotaExecucaoAtual
		if(sessao) rota_sinalizar(sessao, 'encerrar')
	},

}

function rotaRegistrarAcoes(acoes){
	for(let chave of Object.keys(acoes)){
		if(rota_acoes[chave]) relatar('Ação registrada duas vezes: ' + chave, '', 'erro')
		rota_acoes[chave] = acoes[chave]
	}
}

function registrarListenerFechar(sessao){
	NAVEGADOR.storage.onChanged.addListener(function ouvirExecucao(mudancas){
		if(mudancas['rotaExecucaoAtual']?.newValue){
			if(String(mudancas['rotaExecucaoAtual'].newValue) !== sessao){
				NAVEGADOR.storage.onChanged.removeListener(ouvirExecucao)
				janela_fechar()
			}
		}
	})
	NAVEGADOR.storage.onChanged.addListener(function ouvirFechar(mudancas){
		if(mudancas['rotaAssistenteFechar']?.newValue === true){
			NAVEGADOR.storage.onChanged.removeListener(ouvirFechar)
			armazenar({ rotaAssistenteFechar: false })
			janela_fechar()
		}
	})
}


function id(...partes){
	return ['rotapje', ...partes].filter(Boolean).join('_')
}


// ── Instrumentação de bancada ─────────────────────────────────

async function monitorarBody(duracaoMs = 5000, intervaloMs = 300, filtro = {}){
	const mudancas = []
	const marca = Date.now() % 100000

	const { incluir, excluir } = filtro

	const passarFiltro = el => {
		const d = {
			tag:       el.tagName,
			id:        el.id,
			name:      el.getAttribute('name'),
			ariaLabel: el.getAttribute('aria-label'),
			classes:   typeof el.className === 'string' ? el.className : (el.className?.baseVal ?? ''),
			texto:     el.textContent?.trim().slice(0, 80),
		}
		if(incluir)
			return Object.entries(incluir).some(([campo, valores]) =>
				valores.some(v => d[campo] && d[campo].includes(v)))
		if(excluir)
			return !Object.entries(excluir).some(([campo, valores]) =>
				valores.some(v => d[campo] && d[campo].includes(v)))
		return true
	}

	const descrever = el => ({
		tag:       el.tagName,
		id:        el.id || undefined,
		name:      el.getAttribute('name') || undefined,
		ariaLabel: el.getAttribute('aria-label') || undefined,
		classes:   el.className || undefined,
		texto:     el.textContent?.trim().slice(0, 80) || undefined,
	})

	const capturar = () =>
		new Map(
			[...document.body.querySelectorAll('*')]
				.filter(passarFiltro)
				.map(el => {
					const d = descrever(el)
					return [`${d.tag}|${d.id}|${d.name}|${d.ariaLabel}|${d.classes}`, d]
				})
		)

	let anterior = capturar()
	const inicio = Date.now()
	relatar(`monitorarBody#${marca} iniciando`, { duracaoMs, intervaloMs, elementos: anterior.size }, 'mutacao')

	const fim = Date.now() + duracaoMs

	while(Date.now() < fim){
		await suspender(intervaloMs)
		const atual = capturar()
		const apareceram = [...atual.entries()].filter(([k]) => !anterior.has(k)).map(([, d]) => d)
		const sumiram    = [...anterior.entries()].filter(([k]) => !atual.has(k)).map(([, d]) => d)
		if(apareceram.length || sumiram.length){
			const ts = `+${Date.now() - inicio}ms`
			relatar(`monitorarBody#${marca} ${ts}`, { apareceram, sumiram }, 'mutacao')
			mudancas.push({ ts, apareceram, sumiram })
		}
		anterior = atual
	}

	relatar(`monitorarBody#${marca} fim`, mudancas.length + ' evento(s)', 'mutacao')
	armazenar({ rota_mudancasNoBody: mudancas })
	return mudancas
}

/**
 * Boundary fixo para o multipart do Chat JT. Arbitrário: só
 * precisa ser igual no header e no corpo. Não precisa mudar nunca.
 */
const ROTA_IA_BOUNDARY = '----rotaboundary0001'


/**
 * Tools padrão da conversa. Sobrescreva por parâmetro quando
 * a conversa usar outro conjunto.
 */
const ROTA_IA_TOOLS_PADRAO = [
	'68dfe85f4e08d7bbdaf52bab',
	'000000000000000000000002',
	'000000000000000000000010',
]


/**
 * Cria uma conversa nova no Chat JT e devolve o conversationId.
 * Retorna null em caso de erro.
 */
async function rota_fetch_IACriaConversa(
	assistantId = '',
	modelo = 'modelo_rapido'
){
	let url = 'https://ia.jt.jus.br/chat/conversation'
	try{
		relatar('POST ' + url, assistantId, 'requisicao')
		let r = await fetch(url, {
			method: 'POST', mode: 'cors', credentials: 'include',
			headers: { 'Content-Type': 'application/json', 'Accept': '*/*' },
			body: JSON.stringify({
				model: modelo,
				assistantId: assistantId,
				metadata: { _isCorisco: false }
			})
		})
		if(!r.ok){ relatar('HTTP ' + r.status, url, 'erro'); return null }
		let dados = await r.json()
		let id = dados.conversationId || dados.id || null
		relatar('Conversa criada: ' + id, dados, 'resposta')
		let urlGet = 'https://ia.jt.jus.br/chat/conversation/' + id + '/__data.json'
		let s = await fetch(urlGet, {
			method: 'GET', credentials: 'include'
		});
		let intermediario = await s.json()
		if (!intermediario) return
		console.log('%c[Rota PJE]%c intermediario: ' + JSON.stringify(intermediario), LOG.teste, 'color:inherit')
		let data = intermediario?.nodes?.[1]?.data
		let aut = data?.[data?.find(d => d?.id)?.id]
		console.log('%c[Rota PJE]%c aut' + JSON.stringify(aut), LOG.aviso, 'color:inherit')
		return {id: id, aut: aut}
		
	} catch(e){ relatar('fetch erro: ' + e.message, url, 'erro'); return null }
}


/**
 * Envia um texto para uma conversa do Chat JT e devolve o
 * finalAnswer (texto completo da resposta). Retorna null em erro.
 *
 * O id da mensagem é sempre um UUID novo — reutilizar id de
 * mensagem é o que causava o erro 500 genérico.
 */
async function rota_fetch_IAEnviaRequisicao(
	texto = '',
	conversationId = '',
	aut = '',
	tools = ROTA_IA_TOOLS_PADRAO,
	boundary = ROTA_IA_BOUNDARY
){
	let url = 'https://ia.jt.jus.br/chat/conversation/' + conversationId
	let payload = {
		inputs: texto,
		id: aut,
		is_retry: false,
		is_continue: false,
		web_search: false,
		tools: tools
	}
	let corpo = `--${boundary}\r\n`
		+ 'Content-Disposition: form-data; name="data"\r\n\r\n'
		+ JSON.stringify(payload) + '\r\n'
		+ `--${boundary}--\r\n`

	try{
		relatar('POST ' + url, texto.slice(0, 200), 'requisicao')
		let r = await fetch(url, {
			method: 'POST', mode: 'cors', credentials: 'include',
			headers: {
				'Content-Type': `multipart/form-data; boundary=${boundary}`,
				'Accept': '*/*',
			},
			body: corpo
		})
		if(!r.ok){ relatar('HTTP ' + r.status, url, 'erro'); return null }

		// A resposta é um stream de eventos (uma linha JSON por
		// evento: status / keepAlive / stream / finalAnswer)
		let linhas = (await r.text()).split('\n')
		let parciais = []
		for(let linha of linhas){
			if(!linha.trim()) continue
			let evento
			try{ evento = JSON.parse(linha) } catch(e){ continue }
			if(evento.type === 'stream') parciais.push(evento.token)
			if(evento.type === 'finalAnswer') return evento.text
		}
		// Se não veio finalAnswer, devolve o que juntou dos tokens
		return parciais.join('') || null
	} catch(e){ relatar('fetch erro: ' + e.message, url, 'erro'); return null }
}
function selecionar(seletor = '', ancestral = '', todos = false){
	if(!seletor) return ''
	if(!ancestral || typeof ancestral !== 'object') ancestral = document
	try{
		return todos
			? ancestral.querySelectorAll(seletor) || ''
			: ancestral.querySelector(seletor)    || ''
	} catch(e){ relatar('selecionar erro:', e, 'erro'); return '' }
}

// capturar nome do usuário

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

async function identificaUsuario() {
    if (!paginasConfereUSUARIO.some(p => location.href.includes(p))) return

    for (let i = 0; i < 10 * 2; i++) {
        const el = document.querySelector('.nome-usuario')
        if (el?.textContent?.trim()) {
            USUARIO.nome = el.textContent.trim()
            break
        }
        await suspender(500)
    }

    await armazenar({ rota_usuario: USUARIO })
}

identificaUsuario()

function confereJanela(...janelas) {
	console.log('dentro do confereJanela, procurando agora: ' + location.href)
    return janelas.some(regex => regex.test(location.href))
}

function confereJanelaNome(nome) {
    return window.name === nome
}

async function aguardarElemento(seletor = '', timeout = 0){
	return new Promise(resolver => {
		let el = selecionar(seletor)
		if(el){ resolver(el); return }

		let timer = null
		let obs = new MutationObserver(() => {
			let el2 = selecionar(seletor)
			if(el2){ if(timer) clearTimeout(timer); obs.disconnect(); resolver(el2) }
		})
		obs.observe(document, { childList:true, subtree:true })
		if(timeout > 0)
			timer = setTimeout(() => { obs.disconnect(); resolver(null) }, timeout)
	})
}

function remover(seletor = ''){
	let el = typeof seletor === 'string' ? selecionar(seletor) : seletor
	if(el && el.parentNode) el.parentNode.removeChild(el)
}

function estilizar({ css = '', id = '' } = {}){
	if(id) remover('#pjerota-estilo-' + id)
	let s = document.createElement('style')
	if(id) s.id = 'pjerota-estilo-' + id
	s.textContent = css
	document.head.appendChild(s)
	return s
}

async function conferenciaCompletaJanela(tarefaEsperada, tipoJanela = JANELA.detalhes) {
    const janela = confereJanela(tipoJanela)
	console.log('%c[Rota PJE]%c URL CONFERE: ' + tipoJanela, LOG.teste, 'color:inherit')
    if (!janela) return null

    const execucao = window.name.split('-').pop()
    const cfg      = await obterArmazenamento(['rotaExecucaoAtual'])
    const atual    = String(cfg?.rotaExecucaoAtual || '')
	console.log('%c[Rota PJE]%c execucao: ' + execucao, LOG.teste, 'color:inherit')
	console.log('%c[Rota PJE]%c atual: ' + atual, LOG.teste, 'color:inherit')
    if (execucao !== atual) return null  // execução antiga, ignora
	console.log('%c[Rota PJE]%c EXECUCAO CONFERE', LOG.teste, 'color:inherit')
    let tarefa = rota_buscarParametros('pjerota_tarefa')
    if (!tarefa) {
        const salvo = await obterArmazenamento('pjerota_tarefa')
        tarefa = salvo?.pjerota_tarefa
    } else {
        await armazenar({ pjerota_tarefa: tarefa })
    }

    if (tarefa !== tarefaEsperada) return null

    return atual  // ✅ execucaoAtual confirmada
}

// roteiro-assistente.js
function comandar(acoes, parametros) {
	console.log('%c[Rota PJE]%c comando: ' + acoes + JSON.stringify(parametros), LOG.info, 'color:inherit')
    armazenar({ rota_comando: { acoes, parametros } })
}

// roteiro.js

async function obedecer(mudancas) {
    const comando = mudancas['rota_comando']?.newValue
    console.log('%c[Rota PJE]%c OBEDECER chamado: ' + JSON.stringify(comando), LOG.rosa, 'color:inherit')
    if (!comando) return
    armazenar({ rota_comando: null })
    const { acoes, parametros } = comando
    console.log('%c[Rota PJE]%c OBEDECER executando: ' + acoes[0], LOG.rosa, 'color:inherit')
    for (let i = 0; i < acoes.length; i++) {
        const fn = rota_acoes[acoes[i]]
        if (fn) await fn(parametros?.[i])
        else console.log('%c[Rota PJE]%c Ação desconhecida: ' + acoes[i], LOG.teste, 'color:inherit')
    }
}


function id(...partes) {
    return ['rota_pje', ...partes].filter(Boolean).join('_')
}

// em dom.js ou utils.js
function registrarListenerFechar(sessao) {
    browser.storage.onChanged.addListener(function ouvirExecucao(mudancas) {
        if (mudancas['rotaExecucaoAtual']?.newValue) {
            if (String(mudancas['rotaExecucaoAtual'].newValue) !== sessao) {
                browser.storage.onChanged.removeListener(ouvirExecucao)
                window.close()
            }
        }
    })
    browser.storage.onChanged.addListener(function ouvirFechar(mudancas) {
        if (mudancas['rotaAssistenteFechar']?.newValue === true) {
            browser.storage.onChanged.removeListener(ouvirFechar)
            armazenar({ rotaAssistenteFechar: false })
            window.close()
        }
    })
}

const rota_acoes = {
    'rota_proximo': async () => {
        let cfg = await obterArmazenamento(['rotaExecucaoAtual'])
        let sessao = cfg?.rotaExecucaoAtual
        if (sessao) rota_sinalizar(sessao, 'proximo')
    },
    'rota_encerrar': async () => {
        let cfg = await obterArmazenamento(['rotaExecucaoAtual'])
        let sessao = cfg?.rotaExecucaoAtual
        if (sessao) rota_sinalizar(sessao, 'encerrar')
    },
}
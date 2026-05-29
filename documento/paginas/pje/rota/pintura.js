
// ============================================================
// pintura.js
// Coloração de cabeçalhos de documentos no PJE.
//
// Depende de interceptador-documento.js para ter o conteúdo
// disponível na metatag rota-documentos_conteudo.
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
    let cfg = await obterArmazenamento('tarefaAtiva')
    let nomeAtivo = cfg?.tarefaAtiva || ''
    if(!nomeAtivo) return []
    let store = await obterArmazenamento('tarefas')
    let tarefa = store?.tarefas?.[nomeAtivo]
    return tarefa?.regras || []
}

function pintura_resolverTodos(textoNormalizado = '', regras = []){
    let principal = null
    let extras    = []

    for(let regra of regras){
        if(!regra.cor || !regra.termos) continue
        let termos = regra.termos.split(/[,;]/)
            .map(t => normalizar(t.trim())).filter(t => t)
        for(let termo of termos){
            if(!textoNormalizado.includes(termo)) continue
            if(!principal){
                principal = { cor: regra.cor, termo }
            } else {
                if(!extras.some(e => e.termo === termo))
                    extras.push({ cor: regra.cor, termo })
            }
        }
    }

    if(!principal) return null
    return { cor: principal.cor, termo: principal.termo, extras }
}


// ── Aplicação visual ──────────────────────────────────────────

function pintura_aplicar(cabecalho, cor, termo, extras = []){
    if(!cabecalho) return
    cabecalho.style.backgroundColor = cor
    cabecalho.style.borderLeft      = `6px solid ${escurecerCor(cor)}`

    remover('#pjerota-termo-badge')

    let badge = document.createElement('span')
    badge.id = 'pjerota-termo-badge'
    Object.assign(badge.style, {
        display:       'inline-block',
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
    badge.textContent = '💡 ' + termo
    if(extras.length) badge.textContent += ` (+${extras.length})`

    if(extras.length){
        let tip = document.createElement('span')
        Object.assign(tip.style, {
            display:       'none',
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
                `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${e.cor};margin-right:5px;vertical-align:middle"></span>${e.termo.toUpperCase()}`
            ).join('<br>')

        badge.appendChild(tip)
        badge.addEventListener('mouseenter', () => tip.style.display = 'block')
        badge.addEventListener('mouseleave', () => tip.style.display = 'none')
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


// ── Aguarda cabeçalho ─────────────────────────────────────────

async function pintura_aguardarCabecalho(){
    let seletor = pintura_ehDetalhe()
        ? 'mat-card.cabecalho'
        : '.mat-card-header, pje-cabecalho-documento, mat-toolbar, header'
    return await aguardarElemento(seletor, 12000)
}


// ── Extração de texto via metatag ─────────────────────────────

async function pintura_obterTexto(urlAlvo = null){
    // Aguarda a metatag ser preenchida (pelo interceptador-documento.js)
    // Aceita tanto a chegada imediata quanto via evento
    let payload = await pintura_aguardarMetatag(urlAlvo)
    if(!payload) return null

    let { tipo, conteudo, url } = payload

    // JSON com base64 — HTML ou PDF embutido
    if(tipo === 'json' && conteudo){
        try{
            let json = typeof conteudo === 'string' ? JSON.parse(conteudo) : conteudo
            let b64  = json.conteudoBase64?.trim()
            if(!b64) return normalizar(JSON.stringify(json))

            let bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
            let html  = new TextDecoder('iso-8859-1').decode(bytes)

            if(html.startsWith('%PDF')){
                let resp = await NAVEGADOR.runtime.sendMessage({
                    tipo: 'EXTRAIR_PDF', bytes: Array.from(bytes)
                })
                if(!resp.ok) throw new Error(resp.erro)
                return normalizar(resp.texto)
            }

            let doc = new DOMParser().parseFromString(html, 'text/html')
            return normalizar(doc.body.innerText)

        } catch(e){
            relatar('pintura json/base64 erro: ' + e.message, '', 'erro')
            return null
        }
    }

    // HTML direto
    if(tipo === 'html' && conteudo){
        let doc = new DOMParser().parseFromString(conteudo, 'text/html')
        return normalizar(doc.body.innerText)
    }

    // PDF binário — só temos a URL, buscamos nós mesmos
    if(conteudo === null && url){
        try{
            let res   = await fetch(url, { credentials: 'include' })
            if(!res.ok) throw new Error('HTTP ' + res.status)
            let bytes = Array.from(new Uint8Array(await res.arrayBuffer()))
            let resp  = await NAVEGADOR.runtime.sendMessage({ tipo: 'EXTRAIR_PDF', bytes })
            if(!resp.ok) throw new Error(resp.erro)
            return normalizar(resp.texto)
        } catch(e){
            relatar('pintura pdf-fetch erro: ' + e.message, '', 'erro')
            return null
        }
    }

    return null
}

// Aguarda a metatag rota-documentos_conteudo ser preenchida
// e, se urlAlvo for passada, aguarda especificamente aquela URL
function pintura_aguardarMetatag(urlAlvo = null, timeout = 12000){
    return new Promise(resolver => {

        function ler(){
            let meta = document.head.querySelector('meta[name="rota-documentos_conteudo"]')
            if(!meta) return null
            try{
                let payload = JSON.parse(meta.getAttribute('content'))
                if(urlAlvo && payload.url !== urlAlvo) return null
                return payload
            } catch{ return null }
        }

        let existente = ler()
        if(existente) return resolver(existente)

        let handler = (e) => {
            if(e.detail.rotulo !== 'documentos_conteudo') return
            let payload = ler()
            if(!payload) return
            clearTimeout(timer)
            document.removeEventListener('RotaMetaTagAtualizada', handler)
            resolver(payload)
        }
        document.addEventListener('RotaMetaTagAtualizada', handler)

        let timer = setTimeout(() => {
            document.removeEventListener('RotaMetaTagAtualizada', handler)
            resolver(null)
        }, timeout)
    })
}


// ── Processamento principal ───────────────────────────────────

async function pintura_processar(urlDocumento = null){
    let regras = await pintura_carregarRegras()
    if(!regras.length) return

    let cabecalho = await pintura_aguardarCabecalho()
    if(!cabecalho){ console.log('%c[Rota PJE]%c Pintura: Cabeçalho não encontrado', LOG.erro, 'color:inherit'); return }

    cabecalho.style.borderLeft = '6px solid #5e84a8'
    cabecalho.style.opacity    = '0.75'

    let texto = await pintura_obterTexto(urlDocumento)

    cabecalho.style.opacity = '1'
    pintura_limpar(cabecalho)

    if(!texto){ relatar('Sem texto para classificar.', '', 'execucao'); return }

    let resultado = pintura_resolverTodos(texto, regras)
    if(resultado) pintura_aplicar(cabecalho, resultado.cor, resultado.termo, resultado.extras)
    else          relatar('Nenhum termo encontrado.', '', 'execucao')
}


// ── Escuta cliques na timeline ────────────────────────────────
// Captura a URL do documento clicado para filtrar a metatag certa

function pintura_registrarEscuta(){
    document.addEventListener('click', async e => {
        let alvo = e.target.closest('a.tl-documento[role="button"]')
        if(!alvo) return
        let urlDocumento = alvo.href || null
        await suspender(300)
        pintura_processar(urlDocumento)
            .catch(err => relatar('Pintura reprocessar: ' + err.message, '', 'erro'))
    }, true)
}


// ── Ponto de entrada ──────────────────────────────────────────

async function pintura_iniciar(){
    if(!pintura_ehDetalhe() && !pintura_ehConteudo()) return
    console.log('%c[Rota PJE]%c pintura iniciando', LOG.teste, 'color:inherit')
    if(pintura_ehDetalhe()) pintura_registrarEscuta()
    pintura_processar()
        .catch(e => relatar('Pintura erro: ' + e.message, '', 'erro'))
}
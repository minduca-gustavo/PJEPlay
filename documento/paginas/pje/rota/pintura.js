
// ============================================================
// pintura.js
// Coloração de cabeçalhos de documentos no PJE.
//
// Depende de interceptador-documento.js para ter o conteúdo
// disponível na metatag rota-documentos_conteudo.
// ============================================================


// ── Detecção de página ────────────────────────────────────────
function pinturaAoAbrir(){
    let janela = confereJanela(JANELA.detalhes, JANELA.documentosConteudo)
    if (!janela) return
    pinturaInicio()
}

pinturaAoAbrir()

async function pinturaInicio(){
    let metaEl = await aguardarElemento('meta[name="rota-documentos_conteudo"]', 12000)
    if(!metaEl) return

    function processar(){
        let meta = interceptador_lerDocumentosConteudo()
        if(meta?.conteudo) pintura_processar(meta.conteudo)
    }

    processar()

    document.addEventListener('RotaMetaTagAtualizada', e => {
        if(e.detail.rotulo !== 'documentos_conteudo') return
        processar()
    })
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
    let seletor = seletorPorVersao('cabecalhoDosDocumentosDetalhes')
    return await aguardarElemento(seletor, 12000)
}



// ── Processamento principal ───────────────────────────────────

async function pintura_processar(texto){
    console.log('%c[Rota PJE]%c 264 processar: ' + JSON.stringify(texto), LOG.teste, 'color:inherit')
    let regras = await pintura_carregarRegras()
    if(!regras.length) return
    console.log('%c[Rota PJE]%c 265 regras: ' + JSON.stringify(regras), LOG.teste, 'color:inherit')
    let cabecalho = await pintura_aguardarCabecalho()
    if(!cabecalho){ console.log('%c[Rota PJE]%c Pintura: Cabeçalho não encontrado', LOG.erro, 'color:inherit'); return }

    cabecalho.style.borderLeft = '6px solid #5e84a8'
    cabecalho.style.opacity    = '0.75'

    cabecalho.style.opacity = '1'
    pintura_limpar(cabecalho)

    if(!texto){ relatar('Sem texto para classificar.', '', 'execucao'); return }

    let resultado = pintura_resolverTodos(normalizar(texto), regras)
    if(resultado) pintura_aplicar(cabecalho, resultado.cor, resultado.termo, resultado.extras)
    else          relatar('Nenhum termo encontrado.', '', 'execucao')
}


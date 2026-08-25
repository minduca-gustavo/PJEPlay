async function visualizaQuadroDeJuizes() {
    let janela = location.href.includes('trt15.jus.br/pjekz')
    if (!janela) return
    await criaVisualizador()
}

async function criaVisualizador() {
    let banner = await aguardarElemento('pje-cabecalho div[role="banner"]')
    banner.style.position = 'relative'
    let AJUSTE_TOPO = [
        { trecho: 'minutar', topo: 25},
        { trecho: 'conclusao', topo: 25},
        { trecho: 'pjekz/processo', topo: 36 },
    ]
    let ajuste = AJUSTE_TOPO.find(d => location.href.includes(d.trecho))?.topo ?? 0

    let idPlaquinha = id('visualizadorJuizes', 'plaquinha')
    document.querySelectorAll('#' + idPlaquinha).forEach(d => d.remove())
    
    let plaquinha = criaPlaquinha({
        id: idPlaquinha,
        texto: 'Quadro de\nJuízes',
    })
    Object.assign(plaquinha.style, {
        position: 'absolute',
        left: '0px',
        top: `calc(100% + ${ajuste}px)`,
        zIndex: '999999999',
        whiteSpace: 'pre-line',
        textAlign: 'center',
        color: '#ffffff',
        background: '#0078aa',
        textAlign: 'center',
        padding: '1px 2px 1px 2px',
        fontSize: '9px'
    })
    banner.appendChild(plaquinha)
    plaquinha.addEventListener('mouseenter', () => mostraQuadroDeJuizes('mostrar', plaquinha))
    plaquinha.addEventListener('mouseleave', () => mostraQuadroDeJuizes('remover', plaquinha))

    return plaquinha
}

visualizaQuadroDeJuizes()

async function mostraQuadroDeJuizes(parametro, banner){
    console.log('%c[Rota PJE]%c parametro: ' + JSON.stringify(parametro), LOG.teste, 'color:inherit')
    let divId = id('visualizadorJuizes', 'quadro')
    if (parametro === 'mostrar'){
        let div = criaDiv({
            id: divId,
            ancestral: 'ffff'
        })
        conteudoQuadro(divId)
        Object.assign(div.style,{
            position:       'absolute',
            top:            '0%',
            left:           '100%',
            width:          '80%',
            height:         '80%',
            background:     UI_CORES.branco,
            border:         '1px solid ' + UI_CORES.azul,
            borderRadius:   '8px',
            boxShadow:      '0 4px 16px rgba(0,0,0,0.15)',
            zIndex:         String(ROTA_Z.flutuante ?? 9000),
            display:        'flex',
            padding:        '4px 4px 4px 4px'
        })
        banner.appendChild(div)
    } else {
        document.getElementById(divId)?.remove()
    }
    async function conteudoQuadro(elemento){
        let url = 'https://raw.githubusercontent.com/minduca-gustavo/rotaPJEd/main/rota_pje_finais.json'
        let resposta = await fetch(url, { cache: 'no-store', referrerPolicy: 'no-referrer' })
        if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`)
        let armazenamento = await resposta.json()
        console.log('%c[Rota PJE]%c armazenamento:', LOG.info, 'color:inherit', armazenamento)
    }
    
}
async function visualizaQuadroDeJuizes() {
    let janela = location.href.includes('trt15.jus.br/pjekz')
    if (!janela) return
    await criaVisualizador()
}

async function criaVisualizador() {
    let banner = await rota_aguardarElemento('pje-cabecalho div[role="banner"]')
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
        border: '1px solid ' + UI_CORES.texto,
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
        let elementoPresente = document.getElementById(divId)
        if (elementoPresente){
            elementoPresente.style.display = 'flex'
            return
        }
        let div = criaDiv({
            id: divId,
            ancestral: 'ffff'
        })
        
        Object.assign(div.style,{
            position:       'absolute',
            top:            '0%',
            left:           '100%',
            width:          (window.screen.availWidth - 100)* 0.28 +'px',
            height:         (window.screen.availHeight)* 0.4 +'px',
            background:     UI_CORES.branco,
            border:         '1px solid ' + UI_CORES.azul,
            borderRadius:   '8px',
            boxShadow:      '0 4px 16px rgba(0,0,0,0.15)',
            //zIndex:         String(ROTA_Z.flutuante ?? 9000),
            display:        'flex',
            padding:        '4px 4px 4px 4px'
        })
        await conteudoQuadro(divId)
        banner.appendChild(div)
    } else {
        let todos = [...document.querySelectorAll('#' + divId)].map(d=> d.style.display = 'none')
    }
    async function conteudoQuadro(elemento){
        let url = 'https://raw.githubusercontent.com/minduca-gustavo/rotaPJEd/main/rotapje_finais.json'
        let resposta = await fetch(url, { cache: 'no-store', referrerPolicy: 'no-referrer' })
        if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`)
        let armazenamento = await resposta.json()
        console.log('%c[Rota PJE]%c armazenamento:', LOG.info, 'color:inherit', armazenamento)
        let varas = [...new Set(armazenamento.map(d=> d?.Vara))]
        console.log('%c[Rota PJE]%c varas: ' + JSON.stringify(varas), LOG.info, 'color:inherit')
        for (let i = 0; i < varas.length; i++){
            let dados = armazenamento.filter(d => d?.Vara === varas[i]) || []
            divId = id('visualizadorJuizes', 'linha')
            // CABEÇALHO
            if (i === 0){
                let div = criaDiv({
                    id: divId + '_cabecalho',
                    ancestral: elemento,
                    rowColumn: 'row'
                })
                div.style.marginBottom = '0px'
                div.style.marginTop = '0px'
                div.style.gap = '0px'
                div.style.lineHeight = 'fit-content'
                div.style.padding = '0px 0px 0px 0px'
            }
            if (i === 0){
                let k = 0
                for (let [chave, valor] of Object.entries(dados[i])){
                    k++
                    let texto = Object.keys(dados[i])
                    let celula = criaDiv({
                        id: divId + '_cabecalho' + '_celula' + k,
                        ancestral: divId + '_cabecalho'
                    })
                    celula.style.marginBottom = '0px'
                    celula.style.marginTop = '0px'
                    celula.style.gap = '0px'
                    celula.style.lineHeight = 'fit-content'
                    celula.style.padding = '0px 0px 0px 0px'
                    celula.style.width = '33%'
                    criaTitulo({
                        id: divId + '_titulo',
                        texto: chave,
                        ancestral: divId + '_cabecalho' + '_celula' + k
                    })
                }
            }
            // DIV ROLANTE
            let idRolante = divId + '_divRolante'
            if (i === 0){
                let divRolante = criaDiv({
                    id: idRolante,
                    ancestral: elemento
                })
                divRolante.style.overflowY = 'auto'
            }
            let linha = divId + i
            let div = criaDiv({
                id: linha,
                ancestral: idRolante
            })
            div.style.marginBottom = '0px'
            div.style.marginTop = '0px'
            div.style.gap = '0px'
            div.style.lineHeight = 'fit-content'
            div.style.padding = '0px 0px 0px 0px'
            for (let j = 0; j < dados.length; j++){
                let div = criaDiv({
                    id: linha + '_sub_' + j,
                    ancestral: linha,
                    rowColumn: 'row'
                })
                if (j % 2 ===0){
                    div.style.background = '#add8e6'
                }
                div.style.marginBottom = '0px'
                div.style.marginTop = '0px'
                div.style.gap = '0px'
                div.style.lineHeight = 'fit-content'
                div.style.padding = '0px 0px 0px 0px'
                let k = 0
                for (let [chave, valor] of Object.entries(dados[j])){
                    k++
                    let texto = ''
                    let par = '0,2,4,6,8'
                    let impar = '1,3,5,7,9'
                    if (valor === par) {texto = 'PAR'}
                    else if (valor === impar) {texto = 'ÍMPAR'}
                    else if (valor.includes('Vara do Trabalho')) {texto = valor.split('Vara do Trabalho de ').pop() + (/\d/.test(valor) ? ' - ' + valor.split(' ')[0] : '')}
                    else { texto = valor.split(' ')[0] + ' ' + valor.split(' ').pop()}
                    let celula = criaDiv({
                        id: linha + j + '_celula_' + k,
                        ancestral: linha + '_sub_' +j,
                        
                    })
                    celula.style.marginBottom = '0px'
                    celula.style.marginTop = '0px'
                    celula.style.gap = '0px'
                    celula.style.lineHeight = 'fit-content'
                    celula.style.padding = '0px 0px 0px 0px'
                    celula.style.width = '33%'
                    criaTexto({
                        id: divId + '_texto',
                        texto: texto,
                        ancestral: linha + j + '_celula_' + k
                    })
                }
            }
        }
    }
}
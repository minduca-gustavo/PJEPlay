// ============================================================
// Rota PJE — Quadro de Juízes
// ============================================================
// Duas alterações em relação à versão anterior:
//   1. O banner do PJe não é mais tocado (position:relative removido).
//      A plaquinha é fixed e ancorada por coordenada calculada do banner;
//      o quadro passa a ser filho da plaquinha, que vira o bloco contentor.
//   2. Hover controlado por mouseenter/mouseleave na plaquinha. Como o
//      quadro é filho dela, o hover propaga; a plaquinha de origem saiu de
//      dentro da plaquinha e vai direto no body, então não propaga.
// ============================================================

const QJ_URL_DADOS = 'https://raw.githubusercontent.com/minduca-gustavo/rotaPJEd/main/rota_pje_finais.json'

const QJ_AJUSTE_TOPO = [
    { trecho: 'minutar',        topo: 25 },
    { trecho: 'conclusao',      topo: 36 },
    { trecho: 'pjekz/processo', topo: 36 },
]

const QJ_ESTILO_COMPACTO = {
    marginTop:    '0px',
    marginBottom: '0px',
    gap:          '0px',
    lineHeight:   'fit-content',
    padding:      '0px 0px 0px 0px'
}

function qjEstiloPlaquinha() {
    return {
        zIndex:     '999999999',
        textAlign:  'center',
        color:      '#ffffff',
        background: '#0078aa',
        border:     '1px solid ' + UI_CORES.texto,
        padding:    '1px 2px 1px 2px',
        fontSize:   '9px'
    }
}

function qjAjusteTopo() {
    return QJ_AJUSTE_TOPO.find(d => location.href.includes(d.trecho))?.topo ?? 0
}

// ------------------------------------------------------------
// Entrada
// ------------------------------------------------------------

async function visualizaQuadroDeJuizes() {
    if (!location.href.includes('trt15.jus.br/pjekz')) return

    let banner = await aguardarElemento('pje-cabecalho div[role="banner"]')

    await criaVisualizador(banner)

    if (location.href.includes('pjekz/processo')) {
        await mostraVaraDeOrigem(banner)
    }
}

visualizaQuadroDeJuizes()

// ------------------------------------------------------------
// Ancoragem — substitui o position:relative no banner
// ------------------------------------------------------------
// O banner do PJe não pode receber position:relative (quebra função nativa).
// Em vez de posicionar por absolute dentro dele, o elemento é fixed e recebe
// coordenadas calculadas a partir do getBoundingClientRect do banner.
// Devolve uma função de limpeza; os listeners também se removem sozinhos
// assim que o elemento sai do DOM.

function ancorarEm(elemento, referencia, { ajuste = 0, alinhaEsquerda = true } = {}) {
    let controle = new AbortController()
    let observador = null

    let posicionar = () => {
        if (!elemento.isConnected) return limpar()
        let r = referencia.getBoundingClientRect()
        elemento.style.top = (r.bottom + ajuste) + 'px'
        if (alinhaEsquerda) elemento.style.left = r.left + 'px'
    }

    let limpar = () => {
        controle.abort()
        observador?.disconnect()
    }

    observador = new ResizeObserver(posicionar)
    observador.observe(referencia)
    window.addEventListener('resize', posicionar, { signal: controle.signal })
    window.addEventListener('scroll', posicionar, { capture: true, signal: controle.signal })

    posicionar()
    return limpar
}

// ------------------------------------------------------------
// Plaquinha "Quadro de Juízes"
// ------------------------------------------------------------

async function criaVisualizador(banner) {
    let idPlaquinha = id('visualizadorJuizes', 'plaquinha')
    document.querySelectorAll('#' + idPlaquinha).forEach(d => d.remove())

    let plaquinha = criaPlaquinha({
        id: idPlaquinha,
        texto: 'Quadro de\nJuízes',
    })
    Object.assign(plaquinha.style, qjEstiloPlaquinha(), {
        position:      'fixed',
        whiteSpace:    'pre-line'
    })
    document.body.appendChild(plaquinha)

    ancorarEm(plaquinha, banner, { ajuste: qjAjusteTopo() })

    // O quadro é filho da plaquinha, então mouseleave só dispara quando o
    // ponteiro deixa os dois. A plaquinha de origem não é mais filha daqui.
    plaquinha.addEventListener('mouseenter', () => mostraQuadroDeJuizes('mostrar', plaquinha))
    plaquinha.addEventListener('mouseleave', () => mostraQuadroDeJuizes('remover', plaquinha))

    return plaquinha
}

// ------------------------------------------------------------
// Plaquinha "Vara de Origem"
// ------------------------------------------------------------

async function mostraVaraDeOrigem(banner) {
    let idProcesso = location.href.match(/pjekz\/processo\/(\d+)/)?.[1]
    if (!idProcesso) return

    let historico = await buscarHistoricoDeslocamentos(idProcesso) || []
    let vara = historico
        .find(h => h?.orgaoJulgadorOrigem?.descricao?.includes('Vara do Trabalho'))
        ?.orgaoJulgadorOrigem?.descricao || ''

    let idOrigem = id('origem', 'plaquinha')
    document.querySelectorAll('#' + idOrigem).forEach(d => d.remove())

    let plaquinha = criaPlaquinha({
        id: idOrigem,
        texto: 'Vara de Origem: ' + vara
    })
    Object.assign(plaquinha.style, qjEstiloPlaquinha(), {
        position: 'fixed',
        right:    '0px'
    })
    document.body.appendChild(plaquinha)

    // Fica no body, fora da plaquinha do quadro — por isso o hover não propaga.
    // O topo vem da mesma âncora, para manter o alinhamento de antes.
    ancorarEm(plaquinha, banner, { ajuste: qjAjusteTopo(), alinhaEsquerda: false })

    console.log('%c[Rota PJE]%c vara de origem: ' + JSON.stringify(vara), LOG.info, 'color:inherit')

    return plaquinha
}

// ------------------------------------------------------------
// Quadro
// ------------------------------------------------------------

async function mostraQuadroDeJuizes(acao, plaquinha) {
    let idQuadro = id('visualizadorJuizes', 'quadro')

    if (acao !== 'mostrar') {
        document.querySelectorAll('#' + idQuadro).forEach(d => d.style.display = 'none')
        return
    }

    let existente = document.getElementById(idQuadro)
    if (existente) {
        existente.style.display = 'flex'
        return
    }

    let quadro = criaDiv({
        id: idQuadro,
        ancestral: plaquinha.id
    })
    Object.assign(quadro.style, {
        position:     'absolute',   // resolve contra a plaquinha, que é fixed
        top:          '0%',
        left:         '100%',
        width:        (window.screen.availWidth - 100) * 0.28 + 'px',
        height:       window.screen.availHeight * 0.4 + 'px',
        background:   UI_CORES.branco,
        border:       '1px solid ' + UI_CORES.azul,
        borderRadius: '8px',
        boxShadow:    '0 4px 16px rgba(0,0,0,0.15)',
        display:      'flex',
        padding:      '4px 4px 4px 4px'
    })

    await preencheQuadro(idQuadro)
}

async function preencheQuadro(idQuadro) {
    let resposta = await fetch(QJ_URL_DADOS, { cache: 'no-store', referrerPolicy: 'no-referrer' })
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`)

    let armazenamento = await resposta.json()
    let varas = [...new Set(armazenamento.map(d => d?.Vara))]
    let colunas = Object.keys(armazenamento[0] ?? {})

    console.log('%c[Rota PJE]%c varas: ' + JSON.stringify(varas), LOG.info, 'color:inherit')

    let idBase = id('visualizadorJuizes', 'linha')

    montaCabecalho(idQuadro, idBase, colunas)

    let idRolante = idBase + '_divRolante'
    let divRolante = criaDiv({ id: idRolante, ancestral: idQuadro })
    divRolante.style.overflowY = 'auto'

    varas.forEach((vara, i) => {
        let dados = armazenamento.filter(d => d?.Vara === vara) || []
        montaGrupo(idRolante, idBase + i, dados, colunas)
    })
}

function montaCabecalho(idQuadro, idBase, colunas) {
    let idLinha = idBase + '_cabecalho'
    let linha = criaDiv({ id: idLinha, ancestral: idQuadro, rowColumn: 'row' })
    Object.assign(linha.style, QJ_ESTILO_COMPACTO)

    colunas.forEach((chave, k) => {
        let idCelula = idLinha + '_celula' + (k + 1)
        let celula = criaDiv({ id: idCelula, ancestral: idLinha })
        Object.assign(celula.style, QJ_ESTILO_COMPACTO, { width: '33%' })
        criaTitulo({ id: idCelula + '_titulo', texto: chave, ancestral: idCelula })
    })
}

function montaGrupo(idRolante, idGrupo, dados, colunas) {
    let grupo = criaDiv({ id: idGrupo, ancestral: idRolante })
    Object.assign(grupo.style, QJ_ESTILO_COMPACTO)

    dados.forEach((registro, j) => {
        let idLinha = idGrupo + '_sub_' + j
        let linha = criaDiv({ id: idLinha, ancestral: idGrupo, rowColumn: 'row' })
        Object.assign(linha.style, QJ_ESTILO_COMPACTO)
        if (j % 2 === 0) linha.style.background = '#add8e6'

        colunas.forEach((chave, k) => {
            let idCelula = idLinha + '_celula_' + (k + 1)
            let celula = criaDiv({ id: idCelula, ancestral: idLinha })
            Object.assign(celula.style, QJ_ESTILO_COMPACTO, { width: '33%' })
            criaTexto({
                id: idCelula + '_texto',
                texto: formataValor(registro[chave]),
                ancestral: idCelula
            })
        })
    })
}

function formataValor(valor) {
    const PAR = '0,2,4,6,8'
    const IMPAR = '1,3,5,7,9'

    let texto = String(valor ?? '')
    if (texto === PAR) return 'PAR'
    if (texto === IMPAR) return 'ÍMPAR'
    if (texto.includes('Vara do Trabalho')) {
        return texto.split('Vara do Trabalho de ').pop()
            + (/\d/.test(texto) ? ' - ' + texto.split(' ')[0] : '')
    }
    return texto.split(' ')[0] + ' ' + texto.split(' ').pop()
}
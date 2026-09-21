// ============================================================
// Rota PJE — Quadro de Juízes
// ============================================================
// Revisão desta versão (correções de lifecycle/remoção):
//   1. `ancorarEm` agora também verifica se a `referencia` (banner)
//      continua conectada; se o banner sumir do DOM (re-render do
//      framework do PJe sem SPA navigation completa), a âncora se
//      autolimpa em vez de jogar a plaquinha para o canto (0,0).
//   2. A função de limpeza retornada por `ancorarEm` é guardada no
//      próprio elemento (`elemento._rotaLimparAncora`) e chamada
//      explicitamente antes de remover instâncias antigas — não
//      depende mais de esperar o próximo scroll/resize para
//      desligar os listeners da instância anterior.
//   3. `divBotoes` volta a ser removida antes de recriar (a linha
//      estava comentada, causando acúmulo de ids duplicados a cada
//      clique nos botões "Quadro de Juízes"/"Secretários e
//      Assistentes").
//   4. `tabelaAssistentesSecretarios` passa a remover de verdade as
//      linhas do próprio idBase antes de remontar (em vez de só
//      ocultar as dos outros grupos), igualando a estratégia usada
//      no branch "juízes".
//   5. `visualizaQuadroDeJuizes` agora limpa a plaquinha "Vara de
//      Origem" quando a URL não é mais de tela de processo, para
//      não deixar um badge desatualizado na tela.
// ============================================================

let QJ_URL_DADOS = 'https://raw.githubusercontent.com/minduca-gustavo/rotaPJEd/main/rotapje_finais.json'

let QJ_AJUSTE_TOPO = [
    { trecho: 'minutar',        topo: -8, banner: 'pje-cabecalho-tarefa .cabecalho-tarefa', quebra: true},
    { trecho: 'assinar',        topo: -8, banner: 'pje-cabecalho-tarefa .cabecalho-tarefa', quebra: true},
    { trecho: 'tarefa',         topo: 0,  banner: 'pje-cabecalho-tarefa .cabecalho-tarefa', quebra: true},
    { trecho: 'detalhe',        topo: -7, banner: '.resumo-processo', quebra: true},
    { trecho: 'pjekz/processo', topo: 36, banner: 'pje-cabecalho div[role="banner"]', quebra: true},
]

let QJ_ESTILO_COMPACTO = {
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

function qjAjuste() {
    return QJ_AJUSTE_TOPO.find(d => location.href.includes(d.trecho)) ?? 0
}

// ------------------------------------------------------------
// Entrada
// ------------------------------------------------------------

async function visualizaQuadroDeJuizes() {
    if (!location.href.includes('trt15.jus.br/pjekz')) return

    let banner = await aguardarElemento(qjAjuste()?.banner || 'pje-cabecalho div[role="banner"]')

    await criaVisualizador(banner)

    if (location.href.includes('pjekz/processo')) {
        await mostraVaraDeOrigem(banner)
    } else {
        // Fora de uma tela de processo a plaquinha "Vara de Origem" não
        // faz sentido — remove qualquer instância deixada por navegação
        // anterior dentro do pjekz (evita badge desatualizado na tela).
        removerComLimpezaDeAncora(id('origem', 'plaquinha'))
    }
}

// ------------------------------------------------------------
// Ancoragem — substitui o position:relative no banner
// ------------------------------------------------------------
// O banner do PJe não pode receber position:relative (quebra função nativa).
// Em vez de posicionar por absolute dentro dele, o elemento é fixed e recebe
// coordenadas calculadas a partir do getBoundingClientRect do banner.
//
// Verifica tanto a desconexão do elemento ancorado quanto da referência:
// se o banner for substituído/desmontado pelo framework do PJe sem que a
// plaquinha em si saia do DOM, a âncora se autolimpa em vez de posicionar
// a plaquinha com base num getBoundingClientRect zerado.
//
// A função de limpeza é devolvida E também guardada em
// `elemento._rotaLimparAncora`, para poder ser chamada explicitamente por
// quem for remover o elemento (em vez de depender do próximo scroll/resize
// para os listeners se desligarem sozinhos).

function ancorarEm(elemento, referencia, { ajuste = 0, alinhaEsquerda = true } = {}) {
    let controle = new AbortController()
    let observador = null

    let posicionar = () => {
        if (!elemento.isConnected || !referencia?.isConnected) return limpar()
        let r = referencia.getBoundingClientRect()
        elemento.style.top = (r.bottom + ajuste) + 'px'
        if (alinhaEsquerda) elemento.style.left = r.left + 'px'
    }

    let limpar = () => {
        controle.abort()
        observador?.disconnect()
        if (elemento._rotaLimparAncora === limpar) delete elemento._rotaLimparAncora
    }

    observador = new ResizeObserver(posicionar)
    observador.observe(referencia)
    window.addEventListener('resize', posicionar, { signal: controle.signal })
    window.addEventListener('scroll', posicionar, { capture: true, signal: controle.signal })

    posicionar()

    elemento._rotaLimparAncora = limpar
    return limpar
}

// Remove todo elemento que bata com o seletor de id, chamando antes a
// limpeza de âncora (se existir) para não deixar listeners/observers da
// instância antiga vivos até o próximo scroll/resize.
function removerComLimpezaDeAncora(idSelector) {
    document.querySelectorAll('#' + idSelector).forEach(d => {
        d._rotaLimparAncora?.()
        d.remove()
    })
}

// ------------------------------------------------------------
// Plaquinha "Quadro de Juízes"
// ------------------------------------------------------------

async function criaVisualizador(banner) {
    let idPlaquinha = id('visualizadorJuizes', 'plaquinha')
    removerComLimpezaDeAncora(idPlaquinha)

    let quebra = qjAjuste()?.quebra ? ' ' : '\n'
    let plaquinha = criaPlaquinha({
        id: idPlaquinha,
        texto: 'Quadro de' + quebra + 'Juízes',
    })
    Object.assign(plaquinha.style, qjEstiloPlaquinha(), {
        position:      'fixed',
        whiteSpace:    'pre-line'
    })
    document.body.appendChild(plaquinha)

    ancorarEm(plaquinha, banner, { ajuste: qjAjuste()?.topo })

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
    console.log('%c[Rota PJE]%c banner: ' + JSON.stringify(banner), LOG.info, 'color:inherit')
    let idProcesso = location.href.match(/pjekz\/processo\/(\d+)/)?.[1]
    if (!idProcesso) return
    console.log('%c[Rota PJE]%c idProcesso: ' + JSON.stringify(idProcesso), LOG.teste, 'color:inherit')
    let historico = await buscarHistoricoDeslocamentos(idProcesso) || []
    console.log('%c[Rota PJE]%c historico: ' + JSON.stringify(historico), LOG.teste, 'color:inherit')
    let vara = historico
        .find(h => h?.orgaoJulgadorOrigem?.descricao?.includes('Vara do Trabalho'))
        ?.orgaoJulgadorOrigem?.descricao || ''

    console.log('%c[Rota PJE]%c vara: ' + JSON.stringify(vara), LOG.info, 'color:inherit')
    let idOrigem = id('origem', 'plaquinha')
    removerComLimpezaDeAncora(idOrigem)

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
    ancorarEm(plaquinha, banner, { ajuste: qjAjuste()?.topo, alinhaEsquerda: false })

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

async function preencheQuadro(idQuadro, dados = []) {
    let idDivBotoes = id('visualizadorJuizes', 'quadro', 'botoes')
    // Remove a instância anterior antes de recriar — sem isso, cada clique
    // em "Quadro de Juízes" ou "Secretários/Assistentes" empilhava um novo
    // #idDivBotoes com id duplicado.
    document.querySelectorAll('#' + idDivBotoes).forEach(d => d.remove())

    let divBotoes = criaDiv({
        id: idDivBotoes,
        ancestral: idQuadro,
        rowColumn: 'row-reverse'
    })
    divBotoes.style.gap = '0px'
    divBotoes.style.padding = '0px'
    divBotoes.style.marginBottom = '0px'
    divBotoes.style.heigth = '14px'
    divBotoes.style.zIndex = '9999999'
    divBotoes.style.display = 'flex'

    let botoes = [
        {
            id: 'juizes',
            texto: 'Quadro de Juízes',
            acao: async () => await preencheQuadro(idQuadro)
        },
        {
            id: 'assistentes',
            texto: 'Secretários/Assistentes',
            acao: async () => await tabelaAssistentesSecretarios()
        },
        {
            id: 'comQuemFalar',
            texto: 'Com quem falar',
            acao: async () => await preencheComQuemFalar(idQuadro)
        }
    ]

    for (let botao of botoes) {
        let idBotao = botao?.id
        document.querySelectorAll('#' + idBotao).forEach(d => d.remove())
        let b = criaBotaoAzul({
            id: idBotao,
            texto: botao?.texto,
            ancestral: idDivBotoes,
            acao: botao?.acao
        })
        estiloBotaoFitaSuperior(b)
        b.style.position = 'relative'
        b.style.right = '0px'
    }

    if (dados.length === 0) {
        let armazenamento = await consultaQuadrosGit(QJ_URL_DADOS)
        if (!armazenamento) return
        let varas = [...new Set(armazenamento.map(d => d?.Vara))]
        let colunas = Object.keys(armazenamento[0] ?? {})
        let idBase = id('visualizadorJuizes', 'linha', 'finais')

        // Remove TODAS as linhas de qualquer um dos dois modos (finais e
        // assistente) antes de remontar — mantém a mesma estratégia usada
        // pelo branch de assistentes abaixo.
        document.querySelectorAll('[id^=' + id('visualizadorJuizes', 'linha') + ']').forEach(d => d.remove())

        montaCabecalho(idQuadro, idBase, colunas)

        let idRolante = idBase + '_divRolante'
        let divRolante = criaDiv({ id: idRolante, ancestral: idQuadro })
        divRolante.style.overflowY = 'auto'

        varas.forEach((vara, i) => {
            let dadosVara = armazenamento.filter(d => d?.Vara === vara) || []
            montaGrupo(idRolante, idBase + i, dadosVara, colunas)
        })
    }
    async function preencheComQuemFalar(elemento) {
        let url = 'https://raw.githubusercontent.com/minduca-gustavo/rotaPJEd/main/rotapje_comQuemFalar.json'
        let armazenamento = await consultaQuadrosGit(url)
        console.log('%c[Rota PJE]%c armazenamento: ' + JSON.stringify(armazenamento), LOG.aviso, 'color:inherit')
        document.querySelectorAll('[id^=' + id('visualizadorJuizes', 'linha') + ']').forEach(d => d.remove())
        let fases = Object.keys(armazenamento)
        let idBase = id('visualizadorJuizes', 'linha', 'assistente')
        
        console.log('%c[Rota PJE]%c elemento: ' + JSON.stringify(elemento), LOG.info, 'color:inherit', elemento)
        criaDiv({
            id: idBase + '_tituloDiv',
            ancestral: elemento
        })
        criaTitulo({
            id: idBase + '_titulo',
            texto: 'Clique no nome da pessoa para abrir o contato (e-mail, chat, etc.).',
            ancestral: idBase + '_tituloDiv'
        })
        let divBase = criaDiv({
            id: idBase,
            ancestral: elemento
        })
        divBase.style.overflowY = 'auto'
        //let idRolante = id('visualizadorJuizes', 'linha', 'finais', 'divRolante')
        console.log('%c[Rota PJE]%c armazenamento: ' + JSON.stringify(elemento), LOG.aviso, 'color:inherit', divBase)
        function formataDivQJ(elemento){
            elemento.style.gap = '1px'
            elemento.style.margin = '1px'
            elemento.style.padding = '1px'
            elemento.style.width = '100%'
            elemento.style.height = 'auto'
            return elemento
        }
        for (let fase of fases){
            let idFase = id('comQuemFalar', normalizar(fase))
            let divFase = formataDivQJ(criaDiv({
                id: idFase,
                ancestral: idBase,
                rowColumn: 'row'
            }))
            formataDiv(divFase, 'branco', 'auto', 'auto', 'inherit')
            divFase.style.transform = ''
            divFase.style.gap = '1px'
            let idSubtitulo = id('comQuemFalar', normalizar(fase), 'subtitulo', 'div')
            let divSubtitulo = criaDiv({
                id: idSubtitulo,
                ancestral: idFase
            })
            divSubtitulo.style.writingMode = 'vertical-rl'
            divSubtitulo.style.transform = 'rotate(180deg)'
            //if (fase == 'DAM' || fase == 'DAA') continue
            criaSubTitulo({
                id: id('comQuemFalar', normalizar(fase), 'subtitulo'),
                texto: fase,
                ancestral: idSubtitulo
            })
            let ojs = Object.keys(armazenamento[fase])
            console.log('%c[Rota PJE]%c ojs: ' + JSON.stringify(ojs), LOG.rosa, 'color:inherit')
            let idOjs = id('comQuemFalar', normalizar(fase), 'ojs')
            
            
            let ASSESSORES = ['Assessor', 'Chefe de Divisão', 'Chefe de Seção']
            let testaOJ = s => /[A-Z]\d/.test(s)
            let formataProId = s => normalizar(s).replace(/\s/g, '_')

            formataDivQJ(criaDiv({ id: idOjs, ancestral: idFase }))
            for (let oj of ojs) {
                montaComQuemFalar(oj, armazenamento[fase][oj], idOjs, [normalizar(fase)])
            }
            document.getElementById(idOjs).style.gap = '1px'

            function montaComQuemFalar(chave, valor, idPai, caminho = []) {
                let novoCaminho = [...caminho, formataProId(chave)]
                let idDiv = id('comQuemFalar', ...novoCaminho)
                let montaAssessor = ASSESSORES.includes(chave) || Array.isArray(valor)
                if (montaAssessor) {
                    formataDivQJ(criaDiv({
                        id: idDiv,
                        ancestral: idPai,
                        rowColumn: 'column'
                    }))
                    criaAssessores(chave, valor, idDiv)
                    return
                }

                formataDivQJ(criaDiv({
                    id: idDiv,
                    ancestral: idPai,
                    rowColumn: 'row'
                }))

                let sub = criaSubTitulo({
                    id: idDiv + '_subTitulo',
                    ancestral: idDiv,
                    texto: testaOJ(chave) ? chave : chave + ':'
                })
                sub.style.writingMode = 'vertical-rl'
                sub.style.transform = 'rotate(180deg)'

                let idFilhos = idDiv + '_filhos'
                formataDivQJ(criaDiv({
                    id: idFilhos,
                    ancestral: idDiv,
                    rowColumn: 'column'
                }))
                formataDiv(document.getElementById(idFilhos), 'branco', '98%', 'auto', 'inherit')
                document.getElementById(idFilhos).style.transform = ''
                for (let [subChave, subValor] of Object.entries(valor ?? {})) {
                    montaComQuemFalar(subChave, subValor, idFilhos, novoCaminho)
                }
            }

            function criaAssessores(cargo, assessores, idPai) {
                for (let a of assessores ?? []) {
                    if (!a?.nome) continue
                    let idLinha = `${idPai}_${formataProId(a.nome)}`
                    formataDivQJ(criaDiv({
                        id: idLinha,
                        ancestral: idPai,
                        rowColumn: 'row'
                    }))
                    criaSubTitulo({
                        id: idLinha + '_subTitulo',
                        ancestral: idLinha,
                        texto: cargo + ':'
                    })
                    let idTexto = idLinha + '_texto'
                    let el = criaTexto({ id: idTexto, texto: a.nome, ancestral: idLinha })
                    el.style.cursor = 'pointer'
                    el.addEventListener('click', () => window.open(a.link))
                    criaTooltip({
                        id: idTexto + '_tooltip',
                        texto: 'Clique para abrir o contato.',
                        elemento: idTexto
                    })
                }
            }
        }

    }
    async function consultaQuadrosGit(url){
        let resposta = await fetch(url, { cache: 'no-store', referrerPolicy: 'no-referrer' })
        if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`)
        console.log('%c[Rota PJE]%c resposta: ' + JSON.stringify(resposta), LOG.info, 'color:inherit')
        let armazenamento = await resposta.json()
        return armazenamento
    }
    async function tabelaAssistentesSecretarios() {
        let url = 'https://raw.githubusercontent.com/minduca-gustavo/rotaPJEd/main/rotapje_juizes.json'
        let armazenamento = await consultaQuadrosGit(url)
        console.log('%c[Rota PJE]%c armazenamento: ' + JSON.stringify(armazenamento), LOG.teste, 'color:inherit')
        let juizes = [...new Set(armazenamento.map(d => d?.JUIZ))]
        let colunas = Object.keys(armazenamento[0] ?? {})
        let idBase = id('visualizadorJuizes', 'linha', 'assistente')

        // Remove TODAS as linhas (do modo "finais" e de uma execução anterior
        // deste próprio modo) antes de remontar — antes só ocultava as do
        // outro grupo e nunca limpava as do próprio idBase, deixando
        // elementos remontados por cima dos antigos.
        document.querySelectorAll('[id^=' + id('visualizadorJuizes', 'linha') + ']').forEach(d => d.remove())

        montaCabecalho(idQuadro, idBase, colunas)

        let idRolante = idBase + '_divRolante'
        let divRolante = criaDiv({ id: idRolante, ancestral: idQuadro })
        divRolante.style.overflowY = 'auto'

        juizes.forEach((juiz, i) => {
            let dadosJuiz = armazenamento.filter(d => d?.JUIZ === juiz) || []
            montaGrupo(idRolante, idBase + i, dadosJuiz, colunas)
        })
    }
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
    let PAR = '0,2,4,6,8'
    let IMPAR = '1,3,5,7,9'

    let texto = String(valor ?? '')
    if (texto === PAR) return 'PAR'
    if (texto === IMPAR) return 'ÍMPAR'
    if (texto.includes('Vara do Trabalho')) {
        return texto.split('Vara do Trabalho de ').pop()
            + (/\d/.test(texto) ? ' - ' + texto.split(' ')[0] : '')
    }
    return texto.split(' ')[0] + ' ' + texto.split(' ').pop()
}
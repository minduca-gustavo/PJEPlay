// Listener de comunicação entre janelas
let esperaTramitaIA = false
rota_reacoes.tramitaIA = tramitaIACriaSecoes

function tramitaIAFuncoes(){
    tramitaIACriaBotao()
}

async function tramitaIACriaBotao(){
    console.log('%c[Rota PJE]%c criaBotão: ' + JSON.stringify(1), LOG.rosa, 'color:inherit')
    let janela = confereJanela(
        JANELA.painelGlobal
    )
    if (!janela) return
    let seletores = [
        {
            janela: JANELA.painelGlobal,
            seletor: '.cabecalho-icones' 
        }
    ]
    let ancestral = seletores.find(d => d?.janela.test(location.href))?.seletor
    await aguardarElemento(ancestral)
    let idBotao = id('tramitaIA', 'botaoPrincipal')
    let botoes = [...document.querySelectorAll('#' + idBotao)].map(d => d.remove())
    let botao = criaBotaoLaranja({
        id: idBotao,
        ancestral: ancestral,
        texto: 'ROTA - Tramita IA',
        acao: () => tramitaIAMenu()
    })
    botao.style.display = 'inline'
}

async function tramitaIAMenu() {
    let idBase = id('tramitaIA', 'menu')
    let remover = document.getElementById(idBase)?.remove()
    let div = criaDiv({
        id: idBase,
        ancestral: document.body
    })
    formataDiv(div, 'branco', '80%', '80%', 'absolute')
    let idCabecalho = idBase + '_cabecalho'
    let cabecalho = criaDiv({
        id: idCabecalho,
        ancestral: idBase,
        rowColumn: 'row-reverse'
    })
    let idBotaoFechar = idCabecalho + '_botaoFechar'
    criaBotaoFechar({
        id: idBotaoFechar,
        ancestral: idCabecalho,
        elementoFechar: idBase
    })
    let cabecalhoEsquerda = criaDiv({
        id: idCabecalho + '_esquerda',
        ancestral: idCabecalho,
        rowColumn: 'row'
    })
    cabecalhoEsquerda.style.alignItems = 'baseline'
    cabecalhoEsquerda.style.width = '100%'
    let idTitulo = idCabecalho + '_titulo'
    let titulo = criaTitulo({
        id: idTitulo,
        texto: 'Tramita IA: ',
        ancestral: idCabecalho + '_esquerda'
    })
    titulo.style.fontSize = '16px'
    let idSubtitulo = idCabecalho + '_subtitulo'
    let subtitulo = criaSubTitulo({
        id: idSubtitulo,
        texto: 'tramitação facilitada por IA',
        ancestral: idCabecalho + '_esquerda'
    })
    let idRolante = idBase + '_rolante'
    let rolante = criaDiv({
        id: idRolante,
        ancestral: idBase
    })
    rolante.style.overflowY = 'auto'
    tramitaIACriaSecoes({elemento: idRolante})
}

function tramitaIACriaSecoes({elemento = null, funcaoRechamada = null, dados = null, janela = null}){
    let secoes = [
        {
            nome: 'ris',
            funcao: 'tramitaIASecaoRis'
        },
        {
            nome: 'damPeritoDecide',
            funcao: 'tramitaIASecaoDamPeritoDecide'
        }
    ]
    let mapaFuncoes = {
        tramitaIASecaoRis, // está no arquivo ris.js
        tramitaIASecaoDamPeritoDecide, // está no arquivo damPeritoDecide.js
    }
    if (funcaoRechamada){
        let esperado = esperaTramitaIA
        if (!esperado || esperado.janela !== janela) return
        let fn = mapaFuncoes[funcaoRechamada]
        let idDiv = elemento
        let ancestral = document.getElementById(idDiv)?.parentElement?.id
        if (!fn || !ancestral) return
        esperaTramitaIA = false
        fn(idDiv, ancestral, true, rota_juntaResultados(esperado.dados, dados))
        return
    }
    for (let secao of secoes){
        let idDiv = elemento + '_' + secao?.nome
        let div = criaDiv({
            id: idDiv,
            ancestral: elemento
        })
        formataDiv(div, 'branco', 'auto', 'auto', 'relative', '0px', '0px', '')
        let funcao = mapaFuncoes[secao?.funcao]
        funcao(idDiv, elemento)
    }
}
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
            janela: JANELA.painelGlobalTarefas,
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
    tramitaIACriaSecoes(idRolante)
}

function tramitaIACriaSecoes(elemento){
    let secoes = [
        {
            nome: 'ris',
            funcao: 'tramitaIASecaoRis'
        }
    ]
    let mapaFuncoes = {
        tramitaIASecaoRis // está no arquivo ris.js
    }
    for (secao of secoes){
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
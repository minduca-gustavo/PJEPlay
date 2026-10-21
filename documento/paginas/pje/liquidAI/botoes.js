async function liquidAICriaBotoes(){
    return
    console.log('%c[Rota PJE]%c 2 Liquidai: ' + JSON.stringify(2), LOG.info, 'color:inherit')
    await aguardarElemento('pje-editor-documento')
    let elementoInserirAntes = document.querySelector('pje-editor-documento').children[0]
    let idDiv = id('liquidAI', 'editor_documento')
    let remover = document.getElementById(idDiv)?.remove()
    let div = criaDiv({
        id: idDiv,
        ancestral: document.body
    })
    insereFitaSuperior(elementoInserirAntes, div)
    let botao = criaBotaoLaranja({
        id: idDiv + '_botao_gerarPjc',
        ancestral: idDiv,
        texto: 'Gerar PJC',
        acao: () => liquidAIGerarPJC()
    })
    estiloBotaoFitaSuperior(botao)
    return
}
async function liquidAICriaBotoes(){
    console.log('%c[Rota PJE]%c 2 Liquidai: ' + JSON.stringify(2), LOG.info, 'color:inherit')
    await aguardarElemento('pje-editor-documento')
    let elementoInserirAntes = document.querySelector('pje-editor-documento').children[0]
    let idDiv = id('liquidAI', 'editor_documento')
    let div = criaDiv({
        id: idDiv,
        ancestral: document.body
    })
    insereFitaSuperior(elementoInserirAntes, div)
    return
}
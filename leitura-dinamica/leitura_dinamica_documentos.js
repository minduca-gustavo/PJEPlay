async function leituraDinamicaDocumentos() {
    let widget = document.querySelector('#rota_leituraDinamica')
    if (widget) widget.remove()
    let janela = confereJanela(JANELA.escaninho, JANELA.pautaAudiencias, JANELA.atasAudiencias)
    if (!janela){
        console.log('%c[Rota PJE]%c leituraDinamica4: ' + JSON.stringify(4), LOG.rosa, 'color:inherit')
        return
    }
    console.log('%c[Rota PJE]%c leituraDinamica4' + JSON.stringify('true'), LOG.rosa, 'color:inherit')
    criaWidgetLeituraDinamica()
}

leituraDinamicaDocumentos()

window.addEventListener('pjerota:url-mudou', () => {
    document.getElementById('pjerota-consulta_qualquer_oj-widget')?.remove()
    leituraDinamicaDocumentos()
})

async function criaWidgetLeituraDinamica() {
    let div = await criaDivFlutuante({
        id: 'rota_leituraDinamica', 
        titulo: 'Leitura Dinâmica', 
        largura: '200px', 
        ancestral: 'ffff'
    })
    let subTitulo = criaSubTitulo({
        id: 'rota_leituraDinamica_secaoMostraRecolhe_subTitulo',
        texto: 'Colore de acordo com os termos escolhidos.',
        ancestral: 'rota_leituraDinamica-corpo',
    })
}
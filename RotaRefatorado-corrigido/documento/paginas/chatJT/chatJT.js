function chatJTFuncoes(){
    console.log('%c[Rota PJE]%c ChatJS.js 2: ' + JSON.stringify(2), LOG.info, 'color:inherit')
    let janela = confereJanela(/\/ia\.jt\.jus\.br\/chat/)
    if (!janela) return
    let janelaNome = window.name
    chatJTSentencasEAcordaosConhecimento(janelaNome)
}

async function chatJTSentencasEAcordaosConhecimento(janelaNome) {
    console.log('%c[Rota PJE]%c chatJT 9: ' + JSON.stringify(9), LOG.aviso, 'color:inherit')
    if (!janelaNome.includes('rotapje')) return
    let teste = janelaNome.replace('rotapje_').replace(janelaNome.split('_').pop())
    console.log('%c[Rota PJE]%c teste: ' + JSON.stringify(teste), LOG.aviso, 'color:inherit')
    //let armazenamento 
    if (document.querySelector('form[action="/chat/login"]')){
        rota_avisoObrigatorio('Faça login e atualize a página')
        return
    }
}

// seletor do login 'form[action="/chat/login"]'
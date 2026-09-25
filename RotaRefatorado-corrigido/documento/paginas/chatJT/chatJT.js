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
    let execucao = /\d+/.test(janelaNome)
    let tarefa = janelaNome.replace('rotapje_', '').replace(execucao, '')
    console.log('%c[Rota PJE]%c teste: ' + JSON.stringify(tarefa), LOG.aviso, 'color:inherit')
    await aguardarElemento('button[type="submit"]')
    await suspender(1000)
    if (document.querySelector('form[action="/chat/login"]')){
        rota_avisoObrigatorio('Faça login e atualize a página')
        return
    }
    let armazenamento = obterArmazenamento(tarefa)
    let dados = armazenamento?.tarefa
    console.log('%c[Rota PJE]%c dados: ' + JSON.stringify(dados), LOG.teste, 'color:inherit')
}

// seletor do login 'form[action="/chat/login"]'
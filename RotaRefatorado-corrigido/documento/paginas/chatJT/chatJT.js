async function chatJTFuncoes(){
    let janela = confereJanela(/\/ia\.jt\.jus\.br\/chat/)
    if (!janela) return
    let janelaNome = window.name
    chatJTSentencasEAcordaosConhecimento(janelaNome)
}

async function chatJTSentencasEAcordaosConhecimento(janelaNome) {
    let tarefa = id('filtros_novos', 'sentencas_e_acordaos_')
    if (!janelaNome.includes(tarefa)) return
    
}
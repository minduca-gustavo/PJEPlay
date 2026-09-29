// arquitetura - soma da janela + href puxa o armazenamento. O armazenamento tem a tarefa específica
let esperaChatJT = false
let dadosChatJT  = []

async function chatJTFuncoes(){
    console.log('%c[Rota PJE]%c ChatJS.js 2: ' + JSON.stringify(2), LOG.info, 'color:inherit')
    // verifica se é a janela do chatJT
    let janela = confereJanela(/\/ia\.jt\.jus\.br\/chat/)
    if (!janela) return
    // verifica se foi janela aberta pela extensão
    let janelaNome = window.name
    if (!janelaNome.includes('rotapje')) return
    if (esperaChatJT) return
    esperaChatJT = true
    let login = await chatJTconfereLogin()
    console.log('%c[Rota PJE]%c login: ' + JSON.stringify(login), LOG.aviso, 'color:inherit')
    if (!login) return
    // pega o timestamp do nome da janela
    let execucao = janelaNome.match(/\d{13}$/)?.[0]
    // pega a tarefa do nome da janela
    let tarefa = janelaNome.replace('rotapje_', '').replace(execucao, '')
    // obtem o armazenamento pra conferir o timestamp
    console.log('%c[Rota PJE]%c tarefa: ' + JSON.stringify(tarefa), LOG.aviso, 'color:inherit')
    let armazenamento = await obterArmazenamento(janelaNome)
    let dadosTarefa = armazenamento[janelaNome]
    console.log('%c[Rota PJE]%c dadosTarefa: ' + JSON.stringify(armazenamento), LOG.teste, 'color:inherit')
    console.log('%c[Rota PJE]%c dadosTarefa: ' + JSON.stringify(dadosTarefa), LOG.teste, 'color:inherit')
    if (dadosTarefa?.execucao != execucao) return
    let mapaFuncoes = {
        chatJTSentencasEAcordaosConhecimento
    }
    let correspondenciaFuncoes = [
        {
            label: 'tramitaIA_menu_rolante_ris',
            nome: 'Recebimento e Remessa analisa sentença e Acórdãos',
            assistente: '6aac80f81501b0e00725a8df',
            orquestrador: false,
            funcaoRechamada: 'tramitaIASecaoRis'
        }
    ]
    let dados = dadosTarefa?.dados
    let parametros = correspondenciaFuncoes.find(c => c?.label == tarefa)
    let resultado = []
    if (!Array.isArray(dados)){
        let consulta = await chatJTExecutaPrompt(parametros, JSON.stringify(dados))
        resultado = [{dados: dados, resultado: consulta}]
    } else {
        for (let dado of dados){
            let consulta = null
            try { consulta = await chatJTExecutaPrompt(parametros, JSON.stringify(dado)) }
            catch(e){ consulta = 'ERRO: ' + e.message }
            resultado.push({ numero: dado.numero, resultado: consulta ?? 'sem resposta' })
        }
    }
    await rota_avisar('tramitaIA', {elemento: janelaNome.replace(execucao, ''), funcaoRechamada: parametros.funcaoRechamada, dados: resultado})
    await removerArmazenamento(janelaNome)
    window.close()
}

async function chatJTExecutaPrompt(parametros, texto) {
    let idAssistente = parametros.assistente
    let {idIA, aut} = await rota_fetch_IACriaConversa(idAssistente)
    let resultado = await rota_fetch_IAEnviaRequisicao(texto, idIA, aut)
    console.log('%c[Rota PJE]%c resultado: ' + JSON.stringify(resultado), LOG.rosa, 'color:inherit')
    if (!parametros.orquestrador) return resultado
}

async function chatJTconfereLogin() {
    await aguardarElemento('button[type="submit"]')
    await suspender(1000)
    if (document.querySelector('form[action="/chat/login"]')){
        rota_avisoObrigatorio('Faça login e atualize a página', 5)
        return false
    }
    return true
}

async function chatJTSentencasEAcordaosConhecimento(params) {
    
}

// seletor do login 'form[action="/chat/login"]'
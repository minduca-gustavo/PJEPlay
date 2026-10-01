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
    if (!login){ esperaChatJT = false; return }
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
            funcaoRechamada: 'tramitaIASecaoRis'
        }
    ]
    let dados = dadosTarefa?.dados
    let naoMandar = dados?.naoMandar || {}
    console.log('%c[Rota PJE]%c naoMandar antes' + JSON.stringify(naoMandar), LOG.aviso, 'color:inherit')
    delete dados.naoMandar
    console.log('%c[Rota PJE]%c naoMandar depois' + JSON.stringify(naoMandar), LOG.erro, 'color:inherit')
    let parametros = correspondenciaFuncoes.find(c => c?.label == tarefa)
    if (!parametros){
        console.log('%c[Rota PJE]%c chatJT: tarefa sem correspondência: ' + tarefa, LOG.aviso, 'color:inherit')
        return
    }
    let overlay = criaDiv({
        id: id('tramitaIA', 'chatJT', 'overlay'),
        ancestral: document.body
    })
    formataDiv(overlay, 'branco', '100%', '100%', 'absolute')
    overlay.style.background = 'rgba(255,255,255,0.85)'
    overlay.style.justifyContent = 'center'
    overlay.style.alignItems = 'center'
    let divMensagem = criaDiv({
        id: id('tramitaIA', 'chatJT', 'overlay', 'mensagem'),
        ancestral: id('tramitaIA', 'chatJT', 'overlay')
    })
    let texto = criaSubTitulo({
        id: id('tramitaIA', 'chatJT', 'overlay', 'mensagem', 'texto'),
        ancestral: id('tramitaIA', 'chatJT', 'overlay', 'mensagem'),
        texto: 'Aguarde, iniciando consultas. Não feche esta página.'
    })
    texto.style.fontSize = '20px'
    let resultado = []
    if (!Array.isArray(dados)){
        texto.textContent = 'Efetuando consulta'
        let consulta = null
        try { consulta = await chatJTExecutaPrompt(parametros, JSON.stringify(dados)) }
        catch(e){ consulta = 'ERRO: ' + e.message }
        resultado = [{ indice: null, ...chatJTLimpaJSON(consulta) }]
    } else {
        for (let i = 0; i < dados.length; i++){
            texto.textContent = 'Consulta em andamento: ' + (i + 1) + '/' + dados.length
            let consulta = null
            try { consulta = await chatJTExecutaPrompt(parametros, JSON.stringify(dados[i])) }
            catch(e){ consulta = 'ERRO: ' + e.message }
            resultado.push({ indice: i, ...chatJTLimpaJSON(consulta) })
        }
    }
    await rota_avisar('tramitaIA', {
        janela: janelaNome,
        elemento: janelaNome.replace(execucao, ''), 
        funcaoRechamada: parametros.funcaoRechamada, 
        dados: resultado,
        naoMandar: naoMandar
    })
    await removerArmazenamento(janelaNome)
    texto.textContent = 'Concluído. Você já pode fechar esta janela.'
    console.log('%c[Rota PJE]%c resultado: ' + JSON.stringify(resultado), LOG.teste, 'color:inherit', resultado)
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
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
            sequencia: [
                {
                    assistente: '6aac80f81501b0e00725a8df',
                    chave: 'resultado',
                    filtro: null, // só vai atuar se tiver alguma coisa
                    escopo: null, // serve para "dividir" os dados, ou seja, serão mandados dados[valorDoEscopo]
                    //arquivos: 'arquivos',  // caminho em dados com [{ nome, base64, mime }]
                    //instrucao: 'Analise a sentença e o acórdão anexos.'  // opcional
                }
            ],
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

async function chatJTExecutaPrompt(idAssistente, texto, arquivos = []) {
    let {idIA, aut} = await rota_fetch_IACriaConversa(idAssistente)
    let resultado = await rota_fetch_IAEnviaRequisicao(texto, idIA, aut, arquivos)
    console.log('%c[Rota PJE]%c resultado: ' + JSON.stringify(resultado), LOG.rosa, 'color:inherit')
    if (resultado == null) throw new Error('sem resposta da IA')
    return resultado
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

function chatJTObterCaminho(obj, caminho) {
    return caminho.split('.').reduce((o, k) => o?.[k], obj)
}

function chatJTTemConteudo(valor) {
    if (valor == null) return false
    if (typeof valor == 'string') return valor.trim() !== ''
    if (Array.isArray(valor)) return valor.length > 0
    if (typeof valor == 'object') return Object.keys(valor).length > 0
    return !!valor
}

// filtro: null (sempre roda) | string (caminho que precisa ter conteúdo) | função(entrada) => boolean
function chatJTPassaFiltro(filtro, entrada) {
    if (filtro == null) return true
    if (typeof filtro == 'function') return !!filtro(entrada)
    return chatJTTemConteudo(chatJTObterCaminho(entrada, filtro))
}

async function chatJTExecutaSequencia(sequencia, dados, aoIniciarEtapa) {
    let acumulado = {}
    for (let e = 0; e < sequencia.length; e++) {
        let etapa = sequencia[e]
        let entrada = etapa.escopo ? chatJTObterCaminho(dados, etapa.escopo) : dados

        // arquivos: caminho em dados -> [{ nome, base64, mime }]
        let arquivos = etapa.arquivos ? chatJTObterCaminho(dados, etapa.arquivos) : []
        if (!Array.isArray(arquivos)) arquivos = arquivos ? [arquivos] : []

        if (!chatJTTemConteudo(entrada) && !arquivos.length) continue
        if (!chatJTPassaFiltro(etapa.filtro, entrada)) continue

        // tira o base64 do texto (senão o JSON levaria o arquivo duas vezes)
        if (etapa.arquivos && !etapa.escopo && entrada && typeof entrada == 'object' && !Array.isArray(entrada)) {
            let { [etapa.arquivos.split('.')[0]]: _ignorado, ...resto } = entrada
            entrada = resto
        }

        let corpo = ''
        if (chatJTTemConteudo(entrada)) corpo = typeof entrada == 'string' ? entrada : JSON.stringify(entrada)
        if (arquivos.length) corpo = (etapa.instrucao || 'Segue o documento.') + (corpo ? '\n\n' + corpo : '')

        aoIniciarEtapa?.(e + 1, sequencia.length)
        let consulta = null
        try { consulta = await chatJTExecutaPrompt(etapa.assistente, corpo, arquivos) }
        catch (err) { consulta = 'ERRO: ' + err.message }
        acumulado[etapa.chave || 'resultado'] = chatJTLimpaJSON(consulta)
    }
    return acumulado
}

// seletor do login 'form[action="/chat/login"]'
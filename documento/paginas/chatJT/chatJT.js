// arquitetura - soma da janela + href puxa o armazenamento. O armazenamento tem a tarefa específica
let esperaChatJT = false


async function chatJTFuncoes(){
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
    if (!execucao) {
        window.name = ''
        rota_avisoObrigatorio('Ocorreu um erro. Tente novamente', 4)
        return
    }   // sem timestamp, a comparação abaixo passaria com undefined == undefined
    // pega a tarefa do nome da janela
    let tarefa = janelaNome.replace('rotapje_', '').replace(execucao, '')
    // obtem o armazenamento pra conferir o timestamp
    let armazenamento = await obterArmazenamento(janelaNome)
    let dadosTarefa = armazenamento[janelaNome]
    if (dadosTarefa?.execucao != execucao) return
    /*
    ATENÇÃO. CHAVES A EVITAR:
    indice
    naoMandar
    dados
    lido
    resultado
    */
    let correspondenciaFuncoes = [
        {
            label: 'tramitaIA_menu_rolante_ris',
            nome: 'Recebimento e Remessa analisa sentença e Acórdãos',
            sequencia: [
                {
                    assistente: '6aac80f81501b0e00725a8df',
                    chave: 'analise',
                    //filtro: null, // só vai atuar se tiver alguma coisa
                    //escopo: null, // serve para "dividir" os dados, ou seja, serão mandados dados[valorDoEscopo]
                    //arquivos: 'arquivos',  // caminho em dados com [{ nome, base64, mime }]
                    //instrucao: 'Analise a sentença e o acórdão anexos.'  // opcional
                    //mandaResultadoPara: chaveDoOutroAssistente
                }
            ],
            funcaoRechamada: 'tramitaIASecaoRis'
        }
    ]
    let dados = dadosTarefa?.dados
    let naoMandar = (!Array.isArray(dados) && dados?.naoMandar) || {}   // só vale para dados em objeto
    let parametros = correspondenciaFuncoes.find(c => c?.label == tarefa)
    if (!parametros) {
        window.name = ''
        rota_avisoObrigatorio('Ocorreu um erro. Tente novamente', 4)
        console.log('%c[Rota PJE]%c chatJT: tarefa sem correspondência: ' + tarefa, LOG.aviso, 'color:inherit')
        return
    }
    // depois de achar parametros:
    if (!chatJTTemConteudo(dados)) {
        console.log('%c[Rota PJE]%c chatJT: tarefa sem dados: ' + tarefa, LOG.aviso, 'color:inherit')
        return
    }
    chatJTValidaSequencia(parametros.sequencia)
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
    let ehLista = Array.isArray(dados)
    let itens = ehLista ? dados : [dados]
    let resultado = []
    try {
        for (let i = 0; i < itens.length; i++) {
            let prefixo = ehLista ? 'Consulta em andamento: ' + (i + 1) + '/' + itens.length : 'Efetuando consulta'
            texto.textContent = prefixo
            let respostas = await chatJTExecutaSequencia(parametros.sequencia, chatJTSemNaoMandar(itens[i]), (n, t) => {
                if (t > 1) texto.textContent = prefixo + ' (etapa ' + n + '/' + t + ')'
            })
            console.log('%c[Rota PJE]%c respostas: ' + JSON.stringify(respostas), LOG.aviso, 'color:inherit')
            resultado.push({ indice: ehLista ? i : null, ...respostas })
        }
        console.log('%c[Rota PJE]%c resultado: ' + JSON.stringify(resultado), LOG.teste, 'color:inherit')
        await rota_avisar('tramitaIA', {
            janela: janelaNome,
            elemento: janelaNome.replace(execucao, ''),
            funcaoRechamada: parametros.funcaoRechamada,
            dados: resultado,
            naoMandar: naoMandar
        })
        await removerArmazenamento(janelaNome)
        texto.textContent = 'Concluído. Você já pode fechar esta janela.'
        window.close()
    } catch (e) {
        texto.textContent = 'Erro: ' + e.message + '. Feche esta janela e tente novamente.'
        console.log('%c[Rota PJE]%c chatJT erro: ' + e.message, LOG.aviso, 'color:inherit')
    }
}

async function chatJTExecutaPrompt(idAssistente, texto, arquivos = []) {
    let conversa = await rota_fetch_IACriaConversa(idAssistente)
    if (!conversa?.idIA || !conversa?.aut) throw new Error('falha ao criar conversa')
    let { idIA, aut } = conversa
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
    let recebidos = {}   // { chaveDestino: { chaveOrigem: resultado } }
    let chavesArquivos = sequencia.map(s => s.arquivos?.split('.')[0]).filter(Boolean)

    for (let e = 0; e < sequencia.length; e++) {
        let etapa = sequencia[e]
        let chave = etapa.chave || 'resultado'
        let entrada = etapa.escopo ? chatJTObterCaminho(dados, etapa.escopo) : dados

        let arquivos = etapa.arquivos ? chatJTObterCaminho(dados, etapa.arquivos) : []
        if (!Array.isArray(arquivos)) arquivos = arquivos ? [arquivos] : []

        // filtro avalia a entrada bruta (antes de tirar os arquivos)
        if (!chatJTPassaFiltro(etapa.filtro, entrada)) continue

        // tira do texto as chaves de arquivo de qualquer etapa
        if (!etapa.escopo && entrada && typeof entrada == 'object' && !Array.isArray(entrada))
            entrada = Object.fromEntries(Object.entries(entrada).filter(([k]) => !chavesArquivos.includes(k)))

        let anteriores = recebidos[chave] || {}
        let temAnteriores = Object.keys(anteriores).length > 0

        if (!chatJTTemConteudo(entrada) && !arquivos.length && !temAnteriores) continue

        let textoEntrada = ''
        if (chatJTTemConteudo(entrada))
            textoEntrada = typeof entrada == 'string' ? entrada : JSON.stringify(entrada)

        let corpo = textoEntrada
        if (temAnteriores) {
            let blocos = []
            if (textoEntrada) blocos.push('DADOS:\n' + textoEntrada)
            blocos.push('RESULTADO DAS ANÁLISES ANTERIORES:\n' + JSON.stringify(anteriores))
            corpo = blocos.join('\n\n')
        }
        if (arquivos.length) corpo = (etapa.instrucao || 'Segue o documento.') + (corpo ? '\n\n' + corpo : '')

        aoIniciarEtapa?.(e + 1, sequencia.length)
        let consulta = null
        let falhou = false
        try { consulta = await chatJTExecutaPrompt(etapa.assistente, corpo, arquivos) }
        catch (err) { consulta = 'ERRO: ' + err.message; falhou = true }

        let resposta = chatJTLimpaJSON(consulta)   // erro vira { lido: false, resultado: 'ERRO: ...' }
        acumulado[chave] = resposta

        if (!falhou) {
            for (let destino of [].concat(etapa.mandaResultadoPara || [])) {
                recebidos[destino] = recebidos[destino] || {}
                recebidos[destino][chave] = resposta.resultado   // sem o envelope
            }
        }
    }
    return acumulado
}

function chatJTValidaSequencia(sequencia) {
    sequencia.forEach((etapa, i) => {
        for (let destino of [].concat(etapa.mandaResultadoPara || [])) {
            let posicao = sequencia.findIndex(s => s.chave == destino)
            if (posicao <= i)
                console.log('%c[Rota PJE]%c chatJT: mandaResultadoPara inválido "' + destino + '" na etapa ' + (etapa.chave || i), LOG.aviso, 'color:inherit')
        }
    })
}

// seletor do login 'form[action="/chat/login"]'

function chatJTSemNaoMandar(item) {
    if (!item || typeof item != 'object' || Array.isArray(item)) return item
    let { naoMandar: _ignorado, ...resto } = item
    return resto
}
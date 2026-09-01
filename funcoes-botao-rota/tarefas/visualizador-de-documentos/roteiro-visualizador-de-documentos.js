// dá problema quando o interceptador dá errado, ou seja, quando não tem gigs concluídos, por exemplo.
// o domicilio eletronico é outra api.
//     ?rota_pje_tarefa=_



const dadosVisualizadorDeDocumentos = {
    solucao: null,
    partes: null,
    processo: null,
    gig: null,
    salas: null,
    salaJuizes: null,
    horariosVagosPorSala: null,
    juizSimetriaPeloGig: null,
    peticaoInicialId: null,
    execucaoAtual: null,
    origin: location.origin,
    tarefaMaisRecente: null,
    recursos: null,
    
}
//__________________________________________________
//                      FUNÇÃO INICIAL
//__________________________________________________
async function visualizador_de_documentos_aoAbrirDetalhesDoProcesso(){
    let tarefa = 'visualizador_de_documentos'
    let janela = confereJanela(JANELA.detalhes)
    if (!janela) return
    let armazenamento = await obterArmazenamento(['rotaExecucaoAtual'])
    if (!armazenamento) return
    let execucao = String(armazenamento?.rotaExecucaoAtual || '')
    if (!execucao) return
    let tarefaParam = rota_buscarParametros('rota_pje_tarefa')
    if (tarefaParam && !window.name.includes(tarefa)) window.name = window.name + '-' + tarefaParam + '-' + execucao
    if (!window.name.includes('rota') || !window.name.includes(tarefa)) return
    if (execucao !== window.name.split('-').pop()) return
    dadosVisualizadorDeDocumentos.execucaoAtual = execucao
    browser.storage.onChanged.addListener(obedecer)
    await visualizador_de_documentos_janelaDetalhes(execucao)
}

visualizador_de_documentos_aoAbrirDetalhesDoProcesso()

//__________________________________________________
//                      DETALHES DO PROCESSO 
//__________________________________________________

async function visualizador_de_documentos_janelaDetalhes(sessao){
    await visualizador_de_documentos_enviarParaRoteiroAssistente()
    let executar = await obterArmazenamento(['rota_visualizador_de_documentos_janelaDetalhes'])
    if (executar.rota_visualizador_de_documentos_janelaDetalhes === sessao) return
    await aguardarElemento('.tl-documento')
    let documentos = [...document.getElementsByClassName('tl-documento')]
    let sentenca = documentos.filter(p => p.textContent.includes('Sentença('))
    if (!sentenca.length) return
    console.log('%c[Rota PJE]%c sentenca' + JSON.stringify(sentenca), LOG.rosa, 'color:inherit')
    await clicar(sentenca[0])
    sentenca[0].scrollIntoView({ block: 'nearest' })
    await armazenar({rota_visualizador_de_documentos_janelaDetalhes: sessao})
    await removerArmazenamento('rota_pje_tarefa')
}

//__________________________________________________
//        OBTER DADOS E ENVIAR PARA ROTEIRO ASSISTENTE
//__________________________________________________

async function visualizador_de_documentos_enviarParaRoteiroAssistente(){
    // OBTENDO SOLUÇÕES
    let idURLMatch = location.href.match(/\/processo\/(\d+)\/detalhe/);
    let idURL = idURLMatch?.[1]; // "2992885"
    let movimentos = await buscarMovimentos(idURL) || null
    let solucaoMovimento = null
    let solucao = []
    if (movimentos) {
        solucaoMovimento = movimentos.filter(m=> m?.titulo.includes('Julgado(s)') || m?.titulo.includes('Extinto')) || null
    }
    console.log('%c[Rota PJE]%c solucaoMovimento: ' + JSON.stringify(solucaoMovimento), LOG.rosa, 'color:inherit')
    for (let mov of solucaoMovimento) {
        let movimento = ''
        if (mov?.titulo.includes('Julgado(s) ')){
            movimento = (mov?.titulo.split('Julgado(s) ')[1])
                .replace("o(s) pedido(s) (", "- ")
                .replaceAll(')', '')
                .replaceAll('(', '')
                .replaceAll('/', '')
                .replaceAll(/\d*/g, '')
                .replace(/\s+/g, ' ')
                .trim().toUpperCase()
        } else {
            movimento = mov?.titulo
        }
        solucao.push(movimento)
    }
    console.log('%c[Rota PJE]%c solucao: ' + JSON.stringify(solucao), LOG.rosa, 'color:inherit')
    
    console.log('%c[Rota PJE]%c movimentos: ' + JSON.stringify(movimentos), LOG.rosa, 'color:inherit')
    let [timeline, processo, recursos] = await Promise.all([
        interceptador_aguardar('timeline').then(() => interceptador_lerTimeline() || []),
        interceptador_aguardar('processo').then(() => interceptador_lerProcesso() || {}),
        interceptador_aguardar('recursos').then(() => interceptador_lerRecursos() || {}),
    ])
    let idBusca = processo.id || idURL
    if (!idBusca) return
    let partes = await buscarProcesso(idBusca, '/partes?retornaEndereco=true') || []
    
    dadosVisualizadorDeDocumentos.solucao                  = solucao
    dadosVisualizadorDeDocumentos.timeline                 = timeline
    dadosVisualizadorDeDocumentos.partes                  = partes
    dadosVisualizadorDeDocumentos.processo                = processo
    dadosVisualizadorDeDocumentos.recursos                = recursos
    await armazenar({ rota_dadosVisualizadorDeDocumentos: dadosVisualizadorDeDocumentos })
    await armazenar({ rota_dadosVisualizadorDeDocumentosNumero: processo.numero })
    await armazenar({ rota_dadosProntos: true })
}

//__________________________________________________
//                      ABRIR DOCUMENTOS
//__________________________________________________

async function visualizador_de_documentos_abrirDocumentos(documento) {
    // Tenta pelo idUnicoDocumento (documento raiz)
    let botao = selecionar('[id="anexo_' + documento.id + '"]')
    console.log('%c[Rota PJE]%c botao 125: ' + JSON.stringify(botao.textContent), LOG.rosa, 'color:inherit')
    if (!botao) {
        // Tenta pelo id simples (anexo com pai já expandido)
        botao = selecionar('[id="abrirdoc_' + documento.idUnicoDocumento + '"]')
        console.log('%c[Rota PJE]%c botao.textContent 126: ' + JSON.stringify(botao.textContent), LOG.rosa, 'color:inherit')
    }

    if (!botao) {
        // Pai não expandido — abre o pai primeiro
        let pai = selecionar('#doc_' + documento.idDocumentoPai)
        console.log('%c[Rota PJE]%c pai.textContent 125: ' + JSON.stringify(pai.textContent), LOG.rosa, 'color:inherit')
        if (!pai) {
            rota_avisoObrigatorio('Documento não encontrado.', 5)
            console.log('%c[Rota PJE]%c 138: ' + JSON.stringify(138), LOG.rosa, 'color:inherit')
            return
        }
        let botaoPai = selecionar('.botao-anexos', pai)
        console.log('%c[Rota PJE]%c botaoPai.textContent 125: ' + JSON.stringify(botaoPai.textContent), LOG.rosa, 'color:inherit')
        if (!botaoPai) {
            rota_avisoObrigatorio('Documento não encontrado.', 5)
            console.log('%c[Rota PJE]%c 139: ' + JSON.stringify(139), LOG.rosa, 'color:inherit')
            return
        }
        await clicar(botaoPai)
        await aguardarElemento('[id$="' + documento.id + '"]')
        botao = selecionar('[id$="' + documento.id + '"]')
    }
    console.log('%c[Rota PJE]%c botao.textContent 125: ' + JSON.stringify(botao.textContent), LOG.rosa, 'color:inherit')
    await clicar(botao)
    rota_avisoTemporario(JSON.stringify(documento.idUnicoDocumento), '', 4000)
}

Object.assign(rota_acoes, {
    'visualizador_de_documentos_abrir_documentos':  async (p) => await visualizador_de_documentos_abrirDocumentos(p),
})


async function verificarOQueChegou(p) {
    rota_avisoTemporario(JSON.stringify(p), tipo = 'info', ms = 2000)
}

//__________________________________________________
//                      BUSCAR JUIZ NO MODELO - POSSÍVEL FUNÇÃO GLOBAL 
//__________________________________________________



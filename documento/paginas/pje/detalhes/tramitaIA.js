async function tramitaIAResumoRapidoCON1() {
    let idURLMatch = location.href.match(/pjekz\/processo\/(\d+)\/detalhe/)
    let idURL = idURLMatch?.[1]
    // DOCUMENTOS COMUNS
    let timeline = interceptador_lerTimeline() || await buscarDocumentos(idURL) || []
    let timelineLimpa = timeline.map(d => {
        return({id: d?.id, idUnicoDocumento: d?.idUnicoDocumento, titulo: d?.titulo, tipo: d?.tipo, data: d?.data, participacaoProcesso: d?.participacaoProcesso})
    })
    let dataMaior = null
    let atas = timelineLimpa.filter(d=> normalizar(d?.titulo).includes('ata da audiencia')) || []
    let teorAtas = []
    for (let ata of atas){
        let teor = await rota_extrairTeorDocumento(idURL, ata?.id) || ''
        teorAtas.push({id: ata?.id, informacoes: ata, teor})
        dataMaior = dataMaior > new Date(ata?.data) ? dataMaior : ata?.data
    }
    let despachos = timelineLimpa.filter(d=> ['despacho', 'decisao', 'sentenca'].some(c => normalizar(d?.titulo).includes(c))) || []
    let teorDespachos = []
    for (let despacho of despachos){
        let teor = await rota_extrairTeorDocumento(idURL, despacho?.id) || ''
        teorDespachos.push({id: despacho?.id, informacoes: despacho, teor})
        dataMaior = dataMaior > new Date(despacho?.data) ? dataMaior : despacho?.data
    }
    let peticaoInicial = null
    let documentosPartes = timelineLimpa.filter(d=>{
        let partes = ['perito', 'autor', 'reu'].some(c=> normalizar(d?.participacaoProcesso).includes(c) && d?.participacaoProcesso)
        let data = new Date(d?.data) > dataMaior
        if(partes && data) return d
    }) || []
    let teorDocumentosPartes = []
    for (let documento of documentosPartes){
        let teor = await rota_extrairTeorDocumento(idURL, documento?.id) || ''
        peticaoInicial = normalizar(documento?.titulo).includes('peticao inicial') ? {informacoes: documento, teor} : ''
        teorDocumentosPartes.push({id: documento?.id, informacoes: documento, teor})
    }
    // PRIMEIRO ASSISTENTE
    let primeiroAssistenteEnvio = {timelineLimpa, teorDespachos, teorDocumentosPartes, teorAtas}
    let primeiroAssistente = '6ac138f2bb98490b4befd0e7'
    let primeiraResposta = await rota_IAConsulta(primeiroAssistente, JSON.stringify(primeiroAssistenteEnvio)) || 'Ocorreu um erro'
    // DOCUMENTOS SEGUNDO ASSISTENTE
    let processo = document.querySelector('pje-descricao-processo')?.textContent.match(_ROTA_CNJ_PADRAO) || ''
    if (!processo){
        processo = interceptador_lerProcesso() || await buscarProcesso(idURL) || {}
    }
    let numeroProcesso = (typeof processo === 'string') ? processo : processo?.numero
    let gigs = interceptador_lerGigs() || await buscarGigs(numeroProcesso) || []
    let audienciaMarcada = document.querySelector('.campo-informacao-icone')?.textContent || ' '
    gigs = gigs.map(d => ({prazo: d?.dataPrazo, observacao: d?.observacao, tipoAtividade: d?.tipoAtividade?.descricao, statusAtividade: d?.statusAtividade}))
    let tarefa = interceptador_lerTarefaMaisRecente() || await buscarTarefaMaisRecente(idURL) || null
    let chips = interceptador_ler('chips') || await buscarChips(idURL) || []
    chips = chips.map(d=> ({nome: d?.etiquetaInstancia?.etiqueta?.nome, data: d?.etiquetaInstancia?.etiqueta?.dataInclusao}))
    let segundoAssistenteEnvio = {primeiraResposta, timelineLimpa, teorDespachos, teorAtas, chips, gigs, audienciaMarcada, tarefa}
    let segundoAssistente = '6ac7e7eb2d5c9cd657dd24f1'
    let segundaResposta = await rota_IAConsulta(segundoAssistente, JSON.stringify(segundoAssistenteEnvio)) || 'Ocorreu um erro'
    //_baixarArquivo(JSON.stringify(segundoAssistenteEnvio, null, 2), 'resumoRapidoCON1.json', 'application/json')
    return [
        {titulo: 'Resumo Geral CON1', resposta: primeiraResposta}, 
        {titulo: 'Gestão', resposta: segundaResposta},
    ]
    
}
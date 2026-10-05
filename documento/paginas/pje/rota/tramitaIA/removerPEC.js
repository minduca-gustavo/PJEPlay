async function tramitaIARemoverPEC(elementoAncestral, ancestralLimpar, rechamada = false, dadosRechamada) {
    if (rechamada){
        _baixarArquivo(JSON.stringify(dadosRechamada, null, 2), 'testeDamPerito.json', 'application/json')
        return
    }
    let el = document.getElementById(elementoAncestral)
    el.style.flexDirection = 'row-reverse'
    el.style.alignItems = 'baseline'
    let botoes = [
        {
            id: 'lista',
            texto: 'Lista',
        },
        {
            id: 'tarefa',
            texto: 'Preparar expedientes e comunicações'
        },
    ]
    for(let botao of botoes){
        let b = criaBotaoLaranja({
            id: elementoAncestral + '_' + botao?.id,
            texto: botao?.texto,
            ancestral: elementoAncestral,
            acao: async () => await removerPEC(botao?.id)
        })
        b.style.alignSelf = 'center'
    }
    let texto = criaTexto({
        id: elementoAncestral + '_texto',
        ancestral: elementoAncestral,
        texto: 'Escolha um dos modos. Funciona buscando TODOS da tarefa Elaborar Sentença, ou inserindo uma lista de números de processos. A IA responderá: todas as partes que precisavam ser intimadas foram?'
    })
    let titulo = criaSubTitulo({
        id: elementoAncestral + '_titulo',
        ancestral: elementoAncestral,
        texto: 'Remover processos intimados do PEC.'
    })
    async function removerPEC(modo){
        let idMostrador = id('tramitaIA', 'mostraResultadoRemoverPEC')
        let limpar = [...document.getElementById(ancestralLimpar).children].filter(d => d?.id !== elementoAncestral).map(d => d.remove())
        if (modo === 'lista'){
            rota_avisoObrigatorio('Não implementado', 5)
            return
        } else {
            mostraResultadosBuscaSimples(ancestralLimpar, 'Buscando processos na Tarefa. Pode ser demorado.', idMostrador)
            let processos = await buscarProcessosPorTarefa('Preparar expedientes e comunicações') || []
            if (!processos?.ids?.length) {
                mostraResultadosBuscaSimples(ancestralLimpar, 'Não foram encontrados processos na tarefa Preparar expedientes e comunicações.', idMostrador)
                let botao = criaBotaoLaranja({
                    id: id('tramitaIA', 'mostraResultado', 'botaoNovaBusca'),
                    ancestral: ancestralLimpar,
                    texto: 'Nova busca',
                    acao: () => {
                        document.getElementById(ancestralLimpar).replaceChildren()
                        tramitaIACriaSecoes({elemento: ancestralLimpar})
                    }
                })
                botao.style.width = 'fit-content'
                return
            }
            console.log('%c[Rota PJE]%c processos: ' + JSON.stringify(processos), LOG.mb, 'color:inherit', processos)
            let dados = []
            let execucao = Date.now()
            let a = 0
            for (let i = 0; i < processos?.ids?.length; i++) {
                if(i===10) break
                mostraResultadosBuscaSimples(ancestralLimpar, 'Aguarde. Buscando ' + (i + 1) + ' de ' + processos?.ids?.length, idMostrador)
                let idProc = processos?.ids[i]
                let dadosSimples = processos?.t[i]
                let processoPartes = await buscarProcesso(idProc, '/partes?apenasComPartePrincipal=false') || {}
                let partes = {
                    ativo: processoPartes?.ATIVO?.map(d => ({nome: d?.nome, tipo: d?.tipoDocumento == 'CPF' ? 'Pessoa Física' : 'Pessoa Jurídica'})),
                    passivo: processoPartes?.PASSIVO?.map(d => ({nome: d?.nome, tipo: d?.tipoDocumento == 'CPF' ? 'Pessoa Física' : 'Pessoa Jurídica'})),
                    terceiros: processoPartes?.TERCEIROS?.map(d => ({nome: d?.nome, tipo: d?.tipoDocumento == 'CPF' ? 'Pessoa Física' : 'Pessoa Jurídica'})),
                }
                let timeline = await buscarDocumentos(idProc) || []
                let ultimoDespacho = timeline?.find(d => ['despacho', 'decisao', 'sentenca'].some(c => normalizar(d?.tipo).includes(c) || normalizar(d?.titulo).includes(c))) || {}
                if (!ultimoDespacho?.id) continue
                let teorUltimoDespacho = await rota_extrairTeorDocumento(idProc, ultimoDespacho?.id)
                let {id, idUnicoDocumento, titulo, tipo, data} = ultimoDespacho
                let despacho = {
                    id,
                    idUnicoDocumento,
                    titulo,
                    tipo,
                    data,
                    teor: teorUltimoDespacho
                }
                let timelinePosDespacho = timeline.filter(d=> {
                    let {id, idUnicoDocumento, titulo, tipo, data} = d
                    if (new Date(d?.data) >= new Date (data)){
                        return {id, idUnicoDocumento, titulo, tipo, data}
                    }
                })
                let expedientesPosDespacho = await buscaExpedientesPosData(idProc, data) || null
                dados.push({despacho, timelinePosDespacho, expedientesPosDespacho, partes})
                
                async function buscaExpedientesPosData(id, data){
                    let processoExpedientes = await buscarProcesso(id, '/expedientes?pagina=1&tamanhoPagina=100&instancia=1') || {}
                    if (!processoExpedientes?.qtdPaginas) return null
                    let expedientes = processoExpedientes?.resultado
                    if (!confereData(expedientes[expedientes.length - 1], data)){
                        return expedientes.filter(d=> confereData(d, data))
                    }
                    for (let i = 2; i <= processoExpedientes?.qtdPaginas; i++){
                        let processosDois = await buscarProcesso(id, '/expedientes?pagina=' + i + '&tamanhoPagina=100&instancia=1')
                        let expedientesDois = processoDois?.resultado?.filter(d=> confereData(d, data))
                        expedientes.push(...expedientesDois)
                        if (!confereData(expedientes[expedientes.length - 1], data)) break
                    }
                    return expedientes
                    function confereData(expediente, dataConfere){
                        return new Date(expediente?.dataCriacao) >= new Date(dataConfere)
                    }
                }

                
                // até aqui, filtrei todos os processos que tem perito, que tem embargos ou ISL.
                // Agora vou pegar a petição de EE ou ISL, e salvar o conteúdo para o primeiro robô.
                // Já salvei a DATA mais antiga entre as petições encontradas
                //let timelinePrimeiroAssistente = timeline.filter(d => d?.data >= dataMaisAntiga).map(c => {
                //    return {id: c?.id, idUnicoDocumento: c?.idUnicoDocumento, tipo: c?.tipo, titulo: c?.titulo, data: c?.data, participacaoProcesso: c?.participacaoProcesso}
                //})
                //let peticoesPrimeiroAssistente = []
                //for (let peticao of embargosIsl) {
                //    if (![16, 733].includes(peticao?.idTipo)) continue
                //    let { id, idUnicoDocumento, data, titulo, tipo, tipoPolo, participacaoProcesso } = peticao
                //    let teor = normalizarTeor(await rota_extrairTeorDocumento(idProc, peticao.id) || '')
                //    peticoesPrimeiroAssistente.push({ id, idUnicoDocumento, data, titulo, tipo, tipoPolo, participacaoProcesso, teor })
                //}
                //let dadosPrimeiroAssistente = {
                //    dadosProcessuais:{
                //        idDoProcesso: idProc,
                //        partes: partes,
                //        numero: dadosSimples?.numero,
                //        dataMaisAntiga,
                //        peticoesParaAnalise: peticoesPrimeiroAssistente,
                //        timeline: timelinePrimeiroAssistente
                //    }
                //}
                //console.log('%c[Rota PJE]%c dadosPrimeiroAssistente: ' + JSON.stringify(dadosPrimeiroAssistente), LOG.teste, 'color:inherit')
                //let primeiroAssistente = '6abfbef177acca97cae0ea20'
                //let respostaPrimeiroAssistente = await rota_IAConsulta(primeiroAssistente, JSON.stringify(dadosPrimeiroAssistente, null, 2)) || null
                //// SEGUNDO ASSISTENTE
                //let timelineSegundoAssistente = timeline.filter(d => normalizar(d?.participacaoProcesso).includes('perito') && new Date(d?.data) >= new Date(dataMaisAntiga))
                //let segundoAssistente = '6ac3a3d9bb98490b4bf122cb'
                //let manifestacoesPerito = []
                //for (let manifestacao of timelineSegundoAssistente){
                //    let teor = normalizarTeor(await rota_extrairTeorDocumento(idProc, manifestacao.id) || '')
                //    let anexos = (manifestacao?.anexos ?? []).map(d => ({ id: d?.id, idUnicoDocumento: d?.idUnicoDocumento, titulo: d?.titulo }));
                //    let {id, idUnicoDocumento, data, titulo, tipo, tipoPolo, participacaoProcesso} = manifestacao
                //    manifestacoesPerito.push({id, idUnicoDocumento, data, titulo, tipo, tipoPolo, participacaoProcesso, teor, anexos: anexos})
                //}
                //
                //let dadosSegundoAssistente = {dadosProcessuais:
                //    {
                //        idDoProcesso: idProc,
                //        partes: partes,
                //        numero: dadosSimples?.numero,
                //        timeline: timelinePrimeiroAssistente,
                //        manifestacoesPerito,
                //        respostaPrimeiroAssistente: chatJTLimpaJSON(respostaPrimeiroAssistente),
                //    }
                //}
                //dadosSegundoAssistentePush.push(dadosSegundoAssistente)
                //let respostaSegundoAssistente = await rota_IAConsulta(segundoAssistente, JSON.stringify(dadosSegundoAssistente, null, 2)) || null
                //dados.push(chatJTLimpaJSON(respostaSegundoAssistente))
            }
            _baixarArquivo(JSON.stringify(dados, null, 2), 'PEC.json', 'application/json')
            //_baixarArquivo(JSON.stringify(dados, null, 2), 'resultadoFinal.json', 'application/json')
            
            
        }

    }
    
}

/*
eu tenho um array tipo
[
    {
        data,
        qualquerCoisa,
    },
    {
        data,
        qualquerCoisa,
    },
]

Como faço pra salvar numa variável a data mais antiga, ou seja, comparar as datas e ficar com a mais antiga?
*/


/*
GIGs
Aguardando audiência (audiência) ou cumprimento (sem audiência).
Acordo sem homologação (Con1 - sobrestado - movimento - prazo cumprimento voluntário - GIG - VENCIMENTO).
Acordo homologado (Liq1 - GIG - Con - Acordo - prazo final).
Razões finais, memoriais, conclusos para sentença - CON2 - encerrado a instrução. CON razões - finais.

Resumir petições
Resumo
Mensagem pra colar no GIG

*/
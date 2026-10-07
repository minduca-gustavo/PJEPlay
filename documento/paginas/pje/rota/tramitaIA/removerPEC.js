async function tramitaIARemoverPEC(elementoAncestral, ancestralLimpar, rechamada = false, dadosRechamada) {
    let idMostrador = id('tramitaIA', 'mostraResultadoRemoverPEC')
    if (rechamada){
        let rolanteFilhos = [...document.getElementById(ancestralLimpar).children]
        let excluir = rolanteFilhos.map(d=> {
            if (d?.id != elementoAncestral){
                d?.remove()
            }
        })
        let rolante = document.getElementById(ancestralLimpar)
        //rolante.style.overflowY = ''
        if (!Array.isArray(dadosRechamada)){
            mostraResultadosBuscaSimples(ancestralLimpar, 'O resultado da busca foi baixado. Ocorreu um erro na apresentação.', idMostrador)
            _baixarArquivo(JSON.stringify(dadosRechamada, null, 2), 'PECResultado.json', 'application/json')
            return
        }
        
        _baixarArquivo(JSON.stringify(dadosRechamada, null, 2), 'Rechamada.json', 'application/json')
        let resultado = dadosRechamada.map(d => formataResultado(d))
        apresentaResultados({
            array: resultado,
            nome: 'tramitaIA_resultadoRemoverPEC',
            ancestral: ancestralLimpar,
            embutido: true,
            aoVoltar: () => {
                rolante.replaceChildren()
                rolante.style.overflowY = 'auto'
                tramitaIACriaSecoes({elemento: ancestralLimpar})
            },
            baixarResultadoBruto: dadosRechamada
        })
        
        //_baixarArquivo(JSON.stringify(dadosRechamada, null, 2), 'PECResultado.json', 'application/json')
        function formataResultado(linha){
            let {lido, resultado, numero, idProc} = linha
            let res = {
                'Número':     removeQuebras(numero),
                'Id':         removeQuebras(idProc),
                'Conclusão':  lido ? removeQuebras(garanteNaoArray(resultado?.conclusao)) : 'Ocorreu um erro de formatação. Verifique a resposta da IA na última coluna.',
                'Resumo':     lido ? removeQuebras(garanteNaoArray(resultado?.resumo)) : '',
                'Alertas':    lido ? removeQuebras(garanteNaoArray(resultado?.alertas)) : removeQuebras(resultado)
            }
            
            return res
        }

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
            let promessas = []
            let resultado = []
            let tamanhoDoLote = 10
            let mostra = 0
            for (let i = 0; i < processos?.ids?.length; i++) {
                
                if (i == 0) mostraResultadosBuscaSimples(ancestralLimpar, 'Aguarde. Buscando ' + (i + 1) + ' de ' + processos?.ids?.length, idMostrador)
                promessas.push(requisicoesEmPareleloRemoverPEC(i))
                if ((i + 1) % 10 === 0 || (i + 1) === processos?.ids?.length){
                    let resultados = await Promise.all(promessas)
                    resultado.push(...resultados)
                    promessas = []
                }

                async function requisicoesEmPareleloRemoverPEC(i){
                    let idProc = processos?.ids[i]
                    let dadosSimples = processos?.t[i]
                    let {numero} = dadosSimples
                    let processoPartes = await buscarProcesso(idProc, '/partes?apenasComPartePrincipal=false') || {}
                    if (!processoPartes?.ATIVO) return 'Erro na busca de partes do processo.'
                    let partes = {
                        ativo: processoPartes?.ATIVO?.map(d => ({nome: d?.nome, tipo: d?.tipoDocumento == 'CPF' ? 'Pessoa Física' : 'Pessoa Jurídica', participacaoProcesso: d?.participacaoProcesso})),
                        passivo: processoPartes?.PASSIVO?.map(d => ({nome: d?.nome, tipo: d?.tipoDocumento == 'CPF' ? 'Pessoa Física' : 'Pessoa Jurídica', participacaoProcesso: d?.participacaoProcesso})),
                        terceiros: processoPartes?.TERCEIROS?.map(d => ({nome: d?.nome, tipo: d?.tipoDocumento == 'CPF' ? 'Pessoa Física' : 'Pessoa Jurídica', participacaoProcesso: d?.participacaoProcesso})),
                    }
                    let timeline = await buscarDocumentos(idProc) || []
                    let ultimoDespacho = timeline?.find(d => ['despacho', 'decisao', 'sentenca'].some(c => normalizar(d?.tipo).includes(c) || normalizar(d?.titulo).includes(c))) || {}
                    if (!ultimoDespacho?.id) return 'Não encontrado último despacho'
                    let teorUltimoDespacho = await rota_extrairTeorDocumento(idProc, ultimoDespacho?.id) || ''
                    let {id, idUnicoDocumento, titulo, tipo, data} = ultimoDespacho
                    let despacho = {
                        id,
                        idUnicoDocumento,
                        titulo,
                        tipo,
                        data,
                        teor: teorUltimoDespacho
                    }
                    let dataDespacho = despacho.data;

                    let timelinePosDespacho = timeline
                        .filter(d => d.ativo !== false && d.data >= dataDespacho)
                        .map(({ id, idUnicoDocumento, titulo, tipo, data }) =>
                            ({ id, idUnicoDocumento, titulo, tipo, data }));
                    let expedientesPosDespacho = await buscaExpedientesPosData(idProc, data) || []
                    let dadosAssistente = {idProc, numero, despacho, timelinePosDespacho, expedientesPosDespacho, partes}
                    let assistente = '6abfbef177acca97cae0ea20'
                    let consulta = await rota_IAConsulta(assistente, JSON.stringify(dadosAssistente, null, 2))
                    let {lido, resultado} = chatJTLimpaJSON(consulta)
                    mostra++
                    mostraResultadosBuscaSimples(ancestralLimpar, 'Aguarde. Buscando ' + (mostra) + ' de ' + processos?.ids?.length, idMostrador)
                    return {lido, resultado, idProc, numero}
                }
                
                async function buscaExpedientesPosData(id, data){
                    let processoExpedientes = await buscarProcesso(id, '/expedientes?pagina=1&tamanhoPagina=100&instancia=1') || {}
                    if (!processoExpedientes?.qtdPaginas) return null
                    let expedientes = processoExpedientes?.resultado
                    if (!confereData(expedientes[expedientes.length - 1], data)){
                        return expedientes.filter(d=> confereData(d, data))
                    }
                    for (let i = 2; i <= processoExpedientes?.qtdPaginas; i++){
                        let processoDois = await buscarProcesso(id, '/expedientes?pagina=' + i + '&tamanhoPagina=100&instancia=1')
                        let expedientesDois = processoDois?.resultado?.filter(d=> confereData(d, data))
                        expedientes.push(...expedientesDois)
                        if (!confereData(expedientes[expedientes.length - 1], data)) break
                    }
                    return expedientes
                    function confereData(expediente, dataConfere){
                        return new Date(expediente?.dataCriacao) >= new Date(dataConfere)
                    }
                }

            }
            tramitaIARemoverPEC(elementoAncestral, ancestralLimpar, true, resultado)
            //_baixarArquivo(JSON.stringify(resultado, null, 2), 'PECresultado.json', 'application/json')
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
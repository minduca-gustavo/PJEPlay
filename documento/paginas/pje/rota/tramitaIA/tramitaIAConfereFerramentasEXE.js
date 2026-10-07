async function tramitaIAConfereFerramentasEXE(elementoAncestral, ancestralLimpar, rechamada = false, dadosRechamada) {
    let idMostrador = id('tramitaIA', 'tramitaIAConfereFerramentasEXE')
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
            nome: 'tramitaIA_resultadoConfereFerramentasEXE',
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
                'Conclusão':  lido ? removeQuebras(garanteNaoArray(resultado?.conclusao)) : 'Ocorreu um erro de formatação. Verifique a resposta completa da IA na última coluna.',
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
            id: 'tarefa',
            texto: 'Pesquisar'
        },
    ]
    for(let botao of botoes){
        let b = criaBotaoLaranja({
            id: elementoAncestral + '_' + botao?.id,
            texto: botao?.texto,
            ancestral: elementoAncestral,
            acao: async () => await confereFerramentasEXE(botao?.id)
        })
        b.style.alignSelf = 'center'
    }
    let input = await criaInput({
        id: elementoAncestral + '_input',
        ancestral: elementoAncestral,
        placeholder: 'Digite o nome da tarefa. Ex: elaborar despacho, CUMPRIMENTO DE PROVIDÊNCIAS, Minutar sentenca'
    })
    input.container.style.alignSelf = 'center'
    input.container.style.margin = '0px'
    let texto = criaTexto({
        id: elementoAncestral + '_texto',
        ancestral: elementoAncestral,
        texto: 'Digite o nome da tarefa a buscar. A IA responderá para todos os processos da tarefa: quais ferramentas foram pedidas? E quais já foram feitas?'
    })
    let titulo = criaSubTitulo({
        id: elementoAncestral + '_titulo',
        ancestral: elementoAncestral,
        texto: 'Confere ferramentas utilizadas na EXE.'
    })
    async function confereFerramentasEXE(){
        let limpar = [...document.getElementById(ancestralLimpar).children].filter(d => d?.id !== elementoAncestral).map(d => d.remove())
        let valorInput = document.getElementById(elementoAncestral + '_input').value
        console.log('%c[Rota PJE]%c valorInput: ' + JSON.stringify(normalizar(valorInput)), LOG.mb, 'color:inherit')
        let tarefa = await resolverTarefa(valorInput)
        if(!tarefa){
            mostraResultadosBuscaSimples(ancestralLimpar, 'Tarefa não encontrada. Verifique o nome da tarefa.', idMostrador)
            tramitaIAcriaBotaoNovaBusca(id('tramitaIA', 'mostraResultado', 'botaoNovaBusca'), ancestralLimpar)
            return
        }
        console.log('%c[Rota PJE]%c tarefa passou: ' + JSON.stringify(tarefa), LOG.teste, 'color:inherit')

        mostraResultadosBuscaSimples(ancestralLimpar, 'Buscando processos na Tarefa. Pode ser demorado.', idMostrador)
        let processos = await buscarProcessosPorTarefa(tarefa?.nome) || []
        if (!processos?.ids?.length) {
            mostraResultadosBuscaSimples(ancestralLimpar, 'Não foram encontrados processos na tarefa ' + valorInput + '.', idMostrador)
            tramitaIAcriaBotaoNovaBusca(id('tramitaIA', 'mostraResultado', 'botaoNovaBusca'), ancestralLimpar)
            return
        }
        let dados = []
        let promessas = []
        let resultado = []
        let tamanhoDoLote = 10
        let mostra = 0
        for (let i = 0; i < processos?.ids?.length; i++) {
            
            if (i == 0) mostraResultadosBuscaSimples(ancestralLimpar, 'Aguarde. Buscando ' + (i + 1) + ' de ' + processos?.ids?.length, idMostrador)
            promessas.push(requisicoesEmPareleloconfereFerramentasEXE(i))
            if ((i + 1) % 10 === 0 || (i + 1) === processos?.ids?.length){
                let resultados = await Promise.all(promessas)
                resultado.push(...resultados)
                promessas = []
            }

            async function requisicoesEmPareleloconfereFerramentasEXE(i){
                let idProc = processos?.ids[i]
                let dadosSimples = processos?.t[i]
                let {numero} = dadosSimples
                let timeline = await buscarDocumentosEMovimentos(idProc) || []
                let inicio = timeline.find(d=> normalizar(d?.titulo).includes('termo de abertura de ') || normalizar(d?.titulo).includes('iniciada a exec')).data
                console.log('%c[Rota PJE]%c inicio: ' + JSON.stringify(inicio), LOG.teste, 'color:inherit')
                return

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
        tramitaIAconfereFerramentasEXE(elementoAncestral, ancestralLimpar, true, resultado)
        //_baixarArquivo(JSON.stringify(resultado, null, 2), 'PECresultado.json', 'application/json')
        //_baixarArquivo(JSON.stringify(dados, null, 2), 'resultadoFinal.json', 'application/json')
        
    }
}

/*








*/
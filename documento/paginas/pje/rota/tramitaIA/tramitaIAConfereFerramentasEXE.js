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
            if ((i + 1) % tamanhoDoLote === 0 || (i + 1) === processos?.ids?.length){
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
                console.log('%c[Rota PJE]%c inicio: ' + JSON.stringify(inicio), LOG.info, 'color:inherit')
                let timelineExecucao = timeline.filter(d => d?.data >= inicio && d?.documento)
                console.log('%c[Rota PJE]%c timelineExecucao: ' + JSON.stringify(timelineExecucao), LOG.teste, 'color:inherit')
                let manifestacoesPartes = timelineExecucao.filter(d => ['autor', 'reu'].some(c=> normalizar(d?.participacaoProcesso).includes(c))) || []
                console.log('%c[Rota PJE]%c manifestacoesPartes: ' + JSON.stringify(manifestacoesPartes), LOG.aviso, 'color:inherit')
                let teorManifestacoesPartes = []
                for (let manifestacao of manifestacoesPartes){
                    let teor = await rota_extrairTeorDocumento(idProc, manifestacao?.id)
                    let {id, idUnicoDocumento, titulo, tipo, participacaoProcesso} = manifestacao
                    teorManifestacoesPartes.push({teor, id, idUnicoDocumento, titulo, tipo, participacaoProcesso})
                }
                let documentosUsuarioInternos = timelineExecucao.filter(d => d?.usuarioInterno && !['intimacao', 'notificacao'].some(c => d?.titulo.includes(c)))
                let teordocumentosUsuarioInternos = []
                for (let documento of documentosUsuarioInternos){
                    let teor = await rota_extrairTeorDocumento(idProc, documento?.id)
                    let {id, idUnicoDocumento, titulo, tipo, participacaoProcesso} = documento
                    teordocumentosUsuarioInternos.push({teor, id, idUnicoDocumento, titulo, tipo, participacaoProcesso})
                }
                console.log('%c[Rota PJE]%c teorManifestacoesPartes: ' + numero, LOG.rosa, 'color:inherit', teorManifestacoesPartes)
                return {teorManifestacoesPartes, teordocumentosUsuarioInternos}

            }
            

        }
        
        //tramitaIAconfereFerramentasEXE(elementoAncestral, ancestralLimpar, true, resultado)
        //_baixarArquivo(JSON.stringify(dados, null, 2), 'resultadoFinal.json', 'application/json')
        _baixarArquivo(JSON.stringify(resultado, null, 2), 'resultadoFinal.json', 'application/json')
        
    }
}

/*








*/
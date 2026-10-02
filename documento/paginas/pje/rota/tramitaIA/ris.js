async function tramitaIASecaoRis(elementoAncestral, ancestralLimpar, rechamada = false, dadosRechamada){
    if (rechamada){
        let rolante = document.getElementById(ancestralLimpar)
        rolante.replaceChildren()                 // tira a seção e o "Iniciando buscas"
        rolante.style.overflowY = 'hidden'
        _baixarArquivo(JSON.stringify(dadosRechamada, null, 2), 'testeChatJT.json', 'application/json')
        apresentaResultados({
            array: dadosRechamada.map(tramitaIALinhaRis),
            nome: 'tramitaIA_resultadoRis',
            ancestral: ancestralLimpar,
            embutido: true,
            aoVoltar: () => {
                rolante.replaceChildren()
                rolante.style.overflowY = 'auto'
                tramitaIACriaSecoes({elemento: ancestralLimpar})
            }
        })
        return
        // ris.js, no nível do arquivo
        function tramitaIALinhaRis(item){
            let analise = item.analise
            let lido = analise?.lido === true
            let r = lido ? analise.resultado : null
            let doc = lido
                ? (item.sentencasEAcordaos || []).find(d => d.idDocumento == r.documentoDecisivo)
                : null
            let acordos = String(item.naoMandar?.acordos ?? '')
            let associados = Array.isArray(item.naoMandar?.associados) ? item.naoMandar.associados.join(', ') : ''
            return {
                "Número":                           item.numero ?? '',
                "Situação":                         lido ? 'OK' : 'CONFERIR',
                "Resultado Prevalecente":           lido ? (removeQuebras(r.resultadoPrevalecente) ?? '') : '',
                "Explicação da IA":                 lido ? (removeQuebras(r.encadeamento) ?? '') : '',
                "Confiança":                        lido ? (removeQuebras(r.confianca) ?? '') : '',
                "Documento decisivo":               doc ? doc.tipo + ' - ' + doc.instancia + ' - ' + String(doc.dataDocumento || '').slice(0, 10) : '',
                "Providências da Secretaria":       lido ? removeQuebras([].concat(r.providenciasSecretaria ?? []).filter(Boolean).join('; ')) : '',
                "Tem Obrigação de fazer?":          lido ? (removeQuebras(r.obrigacaoDeFazer) ?? '') : '',
                "Qual Obrigação?":                  lido ? (removeQuebras(r.qualObrigacao) ?? '') : '',
                "Evidência":                        lido ? (removeQuebras(r.evidencia) ?? '') : '',
                "Observação":                       lido ? (removeQuebras(r.observacao) ?? '') : removeQuebras(String(analise?.resultado ?? 'sem análise')).slice(0, 300),
                "Processos Associados":             associados,
                "Petições ou movimentos de Acordo": acordos,
            }
        }
        
    }
    let el = document.getElementById(elementoAncestral)
    el.style.flexDirection = 'row-reverse'
    el.style.alignItems = 'baseline'
    let idBotao = elementoAncestral + 'botao'
    let botao = criaBotaoLaranja({
        id: idBotao,
        ancestral: elementoAncestral,
        texto: 'Analisar',
        acao: async ()=> {
            await buscaSentencasEAcordaos(elementoAncestral, ancestralLimpar)
        }
    })
    botao.style.alignSelf = 'center'
    let texto = criaTexto({
        id: elementoAncestral + '_texto',
        ancestral: elementoAncestral,
        texto: 'ATENÇÃO: FILTRE APENAS PROCESSOS DO CONHECIMENTO. Este assistente busca os textos dos acórdãos e sentenças dos processos da tela, e encaminha para a IA, que responderá duas perguntas: qual o resultando do processo (procedente, improcedente, etc.)? Tem obrigação de fazer?'
    })
    let titulo = criaSubTitulo({
        id: elementoAncestral + '_titulo',
        ancestral: elementoAncestral,
        texto: 'Assistente de recebimento do TRT'
    })

    async function buscaSentencasEAcordaos(elemento, rolante){
        let elementos = [...document.getElementById(rolante).children]
            .filter(d => d.id !== elemento)
            .forEach(d => d.remove())
        mostraResultadosBuscaSimples(rolante, 0, id('tramitaIA', 'mostraResultadosBuscaRis'))
        let meta = interceptador_ler('agrupamento_tarefas_processos')
        let processos = meta?.resultado || []
        
        
        if (!processos.length) {
            rotinaErro('atualize')
            return
        }
        let i = 0
        let execucao = Date.now()
        let dados = []
        for (let processo of processos) {
            mostraResultadosBuscaSimples(rolante, 'Processo ' + (processos.indexOf(processo) + 1) + ' de ' + processos.length, id('tramitaIA', 'mostraResultadosBuscaRis'))
            let id = processo?.id || null
            let numero = processo?.numeroProcesso || null
            if (!id) continue
            if (!numero) continue
            let idsDocs = []
            let timeline   = await buscarDocumentos(id) || []
            let urlAssociados = 'https://pje.trt15.jus.br/pje-comum-api/api/processos/id/' + id + '/associados?pagina=1&tamanhoPagina=100&ordenacaoCrescente=true'
            let resultadoAssociados = await rota_fetch(urlAssociados) || []
            let associados = resultadoAssociados?.resultado?.map(d => d?.numeroProcesso) || []
            let idSegundo = await buscarSegundoGrauBasicos(numero) || []
            let dadosSegundo = []
            if (idSegundo.length != 0){
                dadosSegundo = await buscarSegundoGrau(idSegundo[0]?.id) || []
                console.log('%c[Rota PJE]%c dadosSegundo 573: ' + JSON.stringify(dadosSegundo), LOG.info, 'color:inherit', dadosSegundo)
            }
            let timelineSegundo = dadosSegundo?.itensProcesso || []
            let termosAcordo = ['acordo', 'homolog', 'transacao']
            let titulosAcordo = timelineSegundo
                .filter(d => termosAcordo.some(c => normalizar(d?.titulo).includes(c)))
                .map(d => {
                    let data = d?.data
                    let dataFmt = data ? data.slice(8, 10) + '/' + data.slice(5, 7) + '/' + data.slice(0, 4) : 'data não informada'
                    return 'Documento ' + d.titulo + ' datado de ' + dataFmt
                }).join(', ');
            //console.log('%c[Rota PJE]%c timelineSegundo: ' + JSON.stringify(timelineSegundo), LOG.info, 'color:inherit')
            let tituloRegex = /^TST\s*-\s*(Acórdão|Decisão)\b/i
            let sentencas  = timeline
                .filter(d => ['Sentença', 'Acórdão'].includes(d?.tipo) || tituloRegex.test(d?.titulo || ''))
                .map(d => ({id: d?.id, data: d?.data, tipo: d?.tipo, instancia: d?.instancia})) || []
            idsDocs.push(...sentencas)
            let documentosInternosTexto = await Promise.all
                (idsDocs.map(async (d) => {
                    let teor = await extrairHtml(id, d?.id) || null
                    let parser = new DOMParser();
                    let teorHtml = teor ? parser.parseFromString(teor, 'text/html') : null
                    let divs = teorHtml ? [...teorHtml.querySelectorAll('div.corpo')] : []
                    // Se não encontrou nenhuma div.corpo, tenta div.body
                    if (teorHtml && divs.length === 0) {
                        divs = [...teorHtml.querySelectorAll('.conteudo_editor')]
                    }

                    let teorCorpo = divs
                        .map(div => div.innerText.replace(/\n\s*\n/g, '\n').trim())
                        .filter(texto => texto.length > 0)
                        .join('\n\n')
                    if (!teor){
                        let teorPDF = await rota_extrairTeorDocumento(id, d?.id) || null
                        teorPDF = normalizarTeor(teorPDF)
                        if (teorPDF) teorCorpo = teorPDF
                    }
                    return {idDocumento: d?.id, teor: teorCorpo, dataDocumento: d?.data, tipo: d?.tipo, instancia: d?.instancia}
                })
            )
            let d = {
                id:                 id || '',
                numero:             numero || '',
                sentencasEAcordaos: documentosInternosTexto,
                naoMandar:          {associados: associados, acordos: titulosAcordo}
            }
            dados.push(d)
        }
        let url = 'https://ia.jt.jus.br/chat/'
        let armazenamento = elemento + execucao
        esperaTramitaIA = { janela: armazenamento, dados: dados }
        await armazenar({[armazenamento]: {dados: dados, execucao: execucao}})
        window.open(url, armazenamento)
        mostraResultadosBuscaSimples(rolante, 'Aguardando a IA no chat. Não feche a janela.', id('tramitaIA', 'mostraResultadosBuscaRis'))
        return
    }

    

    function rotinaErro(tipo){
        let erros = [
            {
                tipo: 'atualize',
                mensagem: 'Ocorreu um erro. Atualize a página e tente novamente.'
            }
        ]
        let mensagem = erros.find(d => d.tipo == tipo).mensagem
        rota_avisoObrigatorio(mensagem, 4)
        return
    }
}


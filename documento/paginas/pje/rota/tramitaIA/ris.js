

async function tramitaIASecaoRis(elemento, ancestral, rechamada = false, dadosRechamada){
    if (rechamada){
        let rolante = document.getElementById(ancestral)
        rolante.replaceChildren()                 // tira a seção e o "Iniciando buscas"
        rolante.style.overflowY = 'hidden'
        _baixarArquivo(JSON.stringify(dadosRechamada, null, 2), 'testeChatJT.json', 'application/json')
        
        apresentaResultados({
            array: dadosRechamada.map(tramitaIALinhaRis),
            nome: 'tramitaIA_resultadoRis',
            ancestral: ancestral,
            embutido: true,
            aoVoltar: () => {
                rolante.replaceChildren()
                rolante.style.overflowY = 'auto'
                tramitaIACriaSecoes({elemento: ancestral})
            }
        })
        return
// ris.js, no nível do arquivo
        function tramitaIALinhaRis(item){
            let r = item.resultado
            let lido = !!r && typeof r === 'object'
            let doc = lido
                ? (item.sentencasEAcordaos || []).find(d => d.idDocumento == r.documentoDecisivo)
                : null
            return {
                numero:       item.numero ?? '',
                situacao:     lido ? 'OK' : 'CONFERIR',
                cenario:      lido ? (r.cenario ?? '') : '',
                rotulo:       lido ? (r.rotulo ?? '') : '',
                confianca:    lido ? (r.confianca ?? '') : '',
                decisivo:     doc ? doc.tipo + ' - ' + doc.instancia + ' - ' + String(doc.dataDocumento || '').slice(0, 10) : '',
                resultado:    lido ? (r.resultadoPrevalecente ?? '') : '',
                providencias: lido ? [].concat(r.providencias ?? []).join('; ') : '',
                evidencia:    lido ? (r.evidencia ?? '') : '',
                observacao:   lido ? (r.observacao ?? '') : '',
                resposta:     lido ? '' : String(r ?? '')
            }
        }
        
    }
    let el = document.getElementById(elemento)
    el.style.flexDirection = 'row-reverse'
    el.style.alignItems = 'baseline'
    let idBotao = elemento + 'botao'
    let botao = criaBotaoLaranja({
        id: idBotao,
        ancestral: elemento,
        texto: 'Analisar',
        acao: async ()=> {
            await buscaSentencasEAcordaos(elemento, ancestral)
        }
    })
    botao.style.alignSelf = 'center'
    let texto = criaTexto({
        id: elemento + '_texto',
        ancestral: elemento,
        texto: 'ATENÇÃO: FILTRE APENAS PROCESSOS DO CONHECIMENTO. Este assistente busca os textos dos acórdãos e sentenças dos processos da tela, e encaminha para a IA, que responderá duas perguntas: qual o resultando do processo (procedente, improcedente, etc.)? Tem obrigação de fazer?'
    })
    let titulo = criaSubTitulo({
        id: elemento + '_titulo',
        ancestral: elemento,
        texto: 'Assistente de recebimento do TRT'
    })

    async function buscaSentencasEAcordaos(elemento, rolante){
        let elementos = [...document.getElementById(rolante).children]
            .filter(d => d.id !== elemento)
            .forEach(d => d.remove())
        mostraResultadosBuscaRis(rolante, 0)
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
            mostraResultadosBuscaRis(rolante, 'Processo ' + (processos.indexOf(processo) + 1) + ' de ' + processos.length)
            let id = processo?.id || null
            let numero = processo?.numeroProcesso || null
            if (!id) continue
            if (!numero) continue
            let idsDocs = []
            let timeline   = await buscarDocumentos(id) || []
            let idSegundo = await buscarSegundoGrauBasicos(numero) || []
            let dadosSegundo = []
            if (idSegundo.length != 0){
                dadosSegundo = await buscarSegundoGrau(idSegundo[0]?.id) || []
                console.log('%c[Rota PJE]%c dadosSegundo 573: ' + JSON.stringify(dadosSegundo), LOG.info, 'color:inherit', dadosSegundo)
            }
            let timelineSegundo = dadosSegundo?.itensProcesso || []
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
                        if (teorPDF) teorCorpo = teorPDF
                    }
                    return {idDocumento: d?.id, teor: teorCorpo, dataDocumento: d?.data, tipo: d?.tipo, instancia: d?.instancia}
                })
            )
            let d = {
                id:         id || '',
                numero:     numero || '',
                sentencasEAcordaos: documentosInternosTexto,
            }
            dados.push(d)
        }
        let url = 'https://ia.jt.jus.br/chat/'
        let armazenamento = elemento + execucao
        esperaTramitaIA = { janela: armazenamento, dados: dados }
        await armazenar({[armazenamento]: {dados: dados, execucao: execucao}})
        window.open(url, armazenamento)
        mostraResultadosBuscaRis(rolante, 'Aguardando a IA no chat. Não feche a janela.')
        return
    }

    function mostraResultadosBuscaRis(idElemento, contador){
        let idDiv = id('tramitaIA', 'mostraResultadosBuscaRis')
        if (!document.getElementById(idDiv)) criaDiv({ id: idDiv, ancestral: idElemento })
        let idConteudo = idDiv + '_conteudo'
        let conteudo = document.getElementById(idConteudo)
            || criaSubTitulo({ id: idConteudo, ancestral: idDiv, texto: '' })
        conteudo.textContent = contador === 0 ? 'Iniciando buscas.' : String(contador)
        conteudo.style.fontSize = '16px'
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


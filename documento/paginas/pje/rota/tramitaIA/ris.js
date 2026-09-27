async function tramitaIASecaoRis(elemento, ancestral){
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
        texto: 'Este assistente busca os textos dos acórdãos e sentenças dos processos da tela, e encaminha para a IA, que responderá duas perguntas: qual o resultando do processo (procedente, improcedente, etc.)? Tem obrigação de fazer?'
    })
    let titulo = criaSubTitulo({
        id: elemento + '_titulo',
        ancestral: elemento,
        texto: 'Assistente de recebimento do TRT'
    })

    async function buscaSentencasEAcordaos(elemento, rolante){
        let elementos = document.getElementById(rolante).children
        if (elementos.length > 1){
            elementos.filter(d => d?.id != elemento?.id).
            map(c => c.remove())
        }
        let meta = interceptador_ler('agrupamento_tarefas_processos')
        let processos = meta?.resultado || []
        alert(JSON.stringify(processos))
        
        if (!processos.length) {
            rotinaErro('atualize')
            return
        }
        for (let processo of processos) {
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
            let url = 'https://ia.jt.jus.br/chat/'
            let d = {
                id:         id || '',
                numero:     numero || '',
                sentencasEAcordaos: documentosInternosTexto,
                execucao: Date.now()
            }
            armazenar({[elemento]: d})
            window.open(url, elemento + Date.now())
            //let idAssistente = '6aac80f81501b0e00725a8df'
            //let {idIA, aut} = await rota_fetch_IACriaConversa(idAssistente)
            //let resultado = await rota_fetch_IAEnviaRequisicao(parametro, idIA, aut)
        }
        console.log('%c[Rota PJE]%c processos: ' + JSON.stringify(processos), LOG.teste, 'color:inherit')
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


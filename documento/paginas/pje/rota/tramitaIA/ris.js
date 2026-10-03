// Assistente do Chat JT usado pelo Recebimento e Remessa (analisa sentenças e acórdãos)
const TRAMITAIA_RIS_ASSISTENTE = '6aac80f81501b0e00725a8df'

async function tramitaIASecaoRis(elemento, ancestral, rechamada = false, dadosRechamada){
    if (rechamada){
        let rolante = document.getElementById(ancestral)
        rolante.replaceChildren()                 // tira a seção e o mostrador de progresso
        rolante.style.overflowY = 'hidden'
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
        let dados = []
        for (let processo of processos) {
            mostraResultadosBuscaRis(rolante, 'Buscando documentos: processo ' + (processos.indexOf(processo) + 1) + ' de ' + processos.length)
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
                })
                .join(', ');
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
                    // Se não encontrou nenhuma div.corpo, tenta .conteudo_editor
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
                id:                 id || '',
                numero:             numero || '',
                sentencasEAcordaos: documentosInternosTexto,
                naoMandar:          {associados: associados, acordos: titulosAcordo}
            }
            dados.push(d)
        }
        if (!dados.length) {
            rotinaErro('atualize')
            return
        }

        // Consulta a IA direto daqui (o fetch roda no segundo plano)
        let resultado = await consultaIARis(dados, rolante)
        if (!resultado) return
        tramitaIASecaoRis(elemento, rolante, true, rota_juntaResultados(dados, resultado))
    }

    async function consultaIARis(dados, rolante){
        let resultado = []
        for (let i = 0; i < dados.length; i++){
            mostraResultadosBuscaRis(rolante, 'Consultando a IA: processo ' + (i + 1) + ' de ' + dados.length + '. Não feche a janela.')
            let consulta = null
            try {
                consulta = await rota_IAConsulta(TRAMITAIA_RIS_ASSISTENTE, JSON.stringify(semNaoMandar(dados[i])))
            } catch(e){
                // se nem a primeira conversa abre, provavelmente não há login no Chat JT
                if (i === 0 && e.message === 'falha ao criar conversa'){
                    rotinaErro('login')
                    return null
                }
                consulta = 'ERRO: ' + e.message
            }
            resultado.push({ indice: i, ...chatJTLimpaJSON(consulta) })
        }
        return resultado
    }

    // tira o naoMandar do item antes de enviar para a IA (sem alterar o objeto original)
    function semNaoMandar(item){
        if (!item || typeof item != 'object' || Array.isArray(item)) return item
        let { naoMandar: _ignorado, ...resto } = item
        return resto
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
            },
            {
                tipo: 'login',
                mensagem: 'Não foi possível abrir a conversa no Chat JT. Faça login em ia.jt.jus.br e tente novamente.'
            }
        ]
        let mensagem = erros.find(d => d.tipo == tipo).mensagem
        rota_avisoObrigatorio(mensagem, 4)
        return
    }
}

function tramitaIALinhaRis(item){
    let lido = item.lido === true
    let r = lido ? item.resultado : null
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
        "Qual Obrigação?":                  lido ? removeQuebras([].concat(r.qualObrigacao ?? []).filter(Boolean).join('; ')) : '',
        "Evidência":                        lido ? (removeQuebras(r.evidencia) ?? '') : '',
        // quando CONFERIR, mostra o motivo (ERRO: ..., texto livre da IA ou sem análise)
        "Observação":                       lido ? (removeQuebras(r.observacao) ?? '') : removeQuebras(String(item.resultado ?? 'sem análise')).slice(0, 300),
        "Processos Associados":             associados,
        "Petições ou movimentos de Acordo": acordos,
    }
}
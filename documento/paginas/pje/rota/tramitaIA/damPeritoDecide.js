async function tramitaIASecaoDamPeritoDecide(elementoAncestral, ancestralLimpar, rechamada = false, dadosRechamada) {
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
            texto: 'Tarefa elaborar sentença'
        },
    ]
    for(let botao of botoes){
        let b = criaBotaoLaranja({
            id: elementoAncestral + '_' + botao?.id,
            texto: botao?.texto,
            ancestral: elementoAncestral,
            acao: async () => await damBusca(botao?.id)
        })
        b.style.alignSelf = 'center'
    }
    let texto = criaTexto({
        id: elementoAncestral + '_texto',
        ancestral: elementoAncestral,
        texto: 'Escolha um dos modos. Funciona buscando TODOS da tarefa Elaborar Sentença, ou inserindo uma lista de números de processos. A IA responderá: há parecer pericial? Cobre todos os pontos dos EEs ou ISLs?'
    })
    let titulo = criaSubTitulo({
        id: elementoAncestral + '_titulo',
        ancestral: elementoAncestral,
        texto: 'Filtra processos com parecer pericial para decisão na DAM'
    })
    async function damBusca(modo){
        let idMostrador = id('tramitaIA', 'mostraResultadoBuscaDamPerito')
        let limpar = [...document.getElementById(ancestralLimpar).children].filter(d => d?.id !== elementoAncestral).map(d => d.remove())
        if (modo === 'lista'){
            rota_avisoObrigatorio('Não implementado', 5)
            return
        } else {
            mostraResultadosBuscaSimples(ancestralLimpar, 'Buscando processos na Tarefa. Pode ser demorado.', idMostrador)
            let processos = await buscarProcessosPorTarefa('Elaborar sentença') || []
            if (!processos?.ids?.length) {
                mostraResultadosBuscaSimples(ancestralLimpar, 'Não foram encontrados processos na tarefa Elaborar sentença.', idMostrador)
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
            }
            console.log('%c[Rota PJE]%c processos: ' + JSON.stringify(processos), LOG.mb, 'color:inherit', processos)
            let dados = []
            let execucao = Date.now()
            let a = 0
            let dadosSegundoAssistentePush = []
            for (let i = 0; i < processos?.ids?.length; i++) {
                //if (i > 19) {
                //    break
                //}
                // PRIMEIRO ASSISTENTE
                mostraResultadosBuscaSimples(ancestralLimpar, 'Aguarde. Buscando ' + (i + 1) + ' de ' + processos?.ids?.length, idMostrador)
                let idProc = processos?.ids[i]
                let dadosSimples = processos?.t[i]
                let processo = await buscarProcesso(idProc, '/partes?apenasComPartePrincipal=false') || {}
                if (!processo?.TERCEIROS) continue
                let temPerito = processo?.TERCEIROS?.some(p => p?.tipo == 'PERITO')
                if (!temPerito) continue
                let partes = {
                    ativo: processo?.ATIVO?.map(d => ({nome: d?.nome, tipo: d?.tipoDocumento == 'CPF' ? 'Pessoa Física' : 'Pessoa Jurídica'})),
                    passivo: processo?.PASSIVO?.map(d => ({nome: d?.nome, tipo: d?.tipoDocumento == 'CPF' ? 'Pessoa Física' : 'Pessoa Jurídica'})),
                }
                let timeline = await buscarDocumentos(idProc) || []
                let dataMaisAntiga = ''
                let embargosIsl = timeline?.filter(d=> {
                    let tipos = ['embargos a execucao', 'impugnacao a sentenca de liquidacao']
                    if (tipos.some(t => normalizar(d?.tipo).includes(t) || normalizar(d?.titulo).includes(t))){
                        dataMaisAntiga = new Date(dataMaisAntiga) < new Date(d?.data) ? dataMaisAntiga : d?.data
                        return d
                    }
                })
                if (!embargosIsl.length) continue
                a++
                if(a===10) break
                // até aqui, filtrei todos os processos que tem perito, que tem embargos ou ISL.
                // Agora vou pegar a petição de EE ou ISL, e salvar o conteúdo para o primeiro robô.
                // Já salvei a DATA mais antiga entre as petições encontradas
                let timelinePrimeiroAssistente = timeline.filter(d => d?.data >= dataMaisAntiga).map(c => {
                    return {id: c?.id, idUnicoDocumento: c?.idUnicoDocumento, tipo: c?.tipo, titulo: c?.titulo, data: c?.data, participacaoProcesso: c?.participacaoProcesso}
                })
                let peticoesPrimeiroAssistente = []
                for (let peticao of embargosIsl) {
                    if (![16, 733].includes(peticao?.idTipo)) continue
                    let { id, idUnicoDocumento, data, titulo, tipo, tipoPolo, participacaoProcesso } = peticao
                    let teor = normalizarTeor(await rota_extrairTeorDocumento(idProc, peticao.id) || '')
                    peticoesPrimeiroAssistente.push({ id, idUnicoDocumento, data, titulo, tipo, tipoPolo, participacaoProcesso, teor })
                }
                let dadosPrimeiroAssistente = {
                    dadosProcessuais:{
                        idDoProcesso: idProc,
                        partes: partes,
                        numero: dadosSimples?.numero,
                        dataMaisAntiga,
                        peticoesParaAnalise: peticoesPrimeiroAssistente,
                        timeline: timelinePrimeiroAssistente
                    }
                }
                console.log('%c[Rota PJE]%c dadosPrimeiroAssistente: ' + JSON.stringify(dadosPrimeiroAssistente), LOG.teste, 'color:inherit')
                let primeiroAssistente = '6abfbef177acca97cae0ea20'
                let respostaPrimeiroAssistente = await rota_IAConsulta(primeiroAssistente, JSON.stringify(dadosPrimeiroAssistente, null, 2))
                // SEGUNDO ASSISTENTE
                let timelineSegundoAssistente = timeline.filter(d => normalizar(d?.participacaoProcesso).includes('perito') && new Date(d?.data) >= dataMaisAntiga)
                let segundoAssistente = '6ac3a3d9bb98490b4bf122cb'
                let manifestacoesPerito = []
                for (let manifestacao of timelineSegundoAssistente){
                    let teor = normalizarTeor(await rota_extrairTeorDocumento(idProc, manifestacao.id) || '')
                    let ({id, idUnicoDocumento, data, titulo, tipo, tipoPolo, participacaoProcesso})
                    manifestacoesPerito.push({id, idUnicoDocumento, data, titulo, tipo, tipoPolo, participacaoProcesso, teor})
                }
                
                let dadosSegundoAssistente = {dadosProcessuais:
                    {
                        idDoProcesso: idProc,
                        partes: partes,
                        numero: dadosSimples?.numero,
                        timeline: timelinePrimeiroAssistente,
                        manifestacoesPerito,
                        respostaPrimeiroAssistente,
                    }
                }
                dadosSegundoAssistentePush.push(dadosSegundoAssistente)
                
            }
            _baixarArquivo(JSON.stringify(dadosSegundoAssistentePush, null, 2), 'EEISL.json', 'application/json')
            
            
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
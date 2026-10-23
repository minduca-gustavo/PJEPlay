function escaninhoFuncoes(){
    //return
    console.log('%c[Rota PJE]%c 123456: ' + JSON.stringify(123456), LOG.info, 'color:inherit')
    escaninhoCriaBotao()
}

async function escaninhoCriaBotao(){
    console.log('%c[Rota PJE]%c criaBotão: ' + JSON.stringify(1), LOG.rosa, 'color:inherit')
    let janela = confereJanela(
        JANELA.escaninho
    )
    if (!janela) return
    let seletores = [
        {
            janela: JANELA.escaninho,
            seletor: '.div-estatisticas .estatisticas-lista' 
        }
    ]
    let ancestral = seletores.find(d => d?.janela.test(location.href))?.seletor
    await aguardarElemento(ancestral)
    let idBotao = id('escaninho', 'botaoPrincipal')
    let botoes = [...document.querySelectorAll('#' + idBotao)].map(d => d.remove())
    let botao = criaBotaoLaranja({
        id: idBotao,
        ancestral: ancestral,
        texto: 'Assistente de análise de petições',
        acao: () => escaninhoMenu()
    })
    botao.style.display = 'inline'

    function escaninhoMenu(){
        let idDiv = id('escaninho', 'menu')
        let remover = [...document.querySelectorAll('#' + idDiv)].map(d=> d.remove())
        let div = criaDivCentralPadrao({
            id: idDiv,
            titulo: 'Análise de petições.',
            largura: '65%',
            altura: '65%'
        })
        let scripts = [
            {
                id: 'removePeticoesAnalisadas',
                titulo: 'Remove petições analisadas.',
                texto: 'Remove do escaninho as petições de processos que já tem despacho, sentença ou ata de audiência posterior.',
                textoBotao: 'Iniciar'
            }
        ]
        let mFuncoes = {
            removePeticoesAnalisadas,
        }
        for (let script of scripts){
            let idGeral = idDiv + script?.id
            let ancestral = idGeral + '_div'
            criaDiv({
                id: ancestral,
                ancestral: div?.corpo?.id, 
                rowColumn: 'row-reverse'
            })
            criaBotaoAzul({
                id: idGeral + '_botao',
                texto: script?.textoBotao,
                ancestral,
                acao: () => mFuncoes[script.id]()
            })
            let texto = criaTexto({
                id: idGeral + '_texto',
                texto: script?.texto,
                ancestral,
            })
            texto.style.width = '100%'
            criaSubTitulo({
                id: idGeral + '_subtitulo',
                texto: script?.titulo,
                ancestral,
            })
        }
    }
    async function removePeticoesAnalisadas() {
        let idDivMenu = id('escaninho', 'menu')
        let opaco = document.getElementById(idDivMenu)
        if (opaco) {
            opaco.style.opacity = '0.5'
            opaco.style.height = '70px'
            opaco.replaceChildren('')
            criaSubTitulo({
                id: idDivMenu + '_aguarde',
                texto: 'Aguarde a conclusão da tarefa.',
                ancestral: idDivMenu
            })
        }
        let armazenamento = await obterArmazenamento(idDivMenu) || {}
        let ultimaData = armazenamento?.idDivMenu || ''
        let interceptados = interceptador_ler('peticoes_juntadas') || null
        if (!interceptados){
            rota_avisoObrigatorio('Ocorreu um erro. Atualize a página e tente novamente.', 5)
            return
        }
        let peticoes = interceptados?.resultado || []
        if (!peticoes.length){
            rota_avisoObrigatorio('Ocorreu um erro. Atualize a página e tente novamente.', 5)
            return
        }
        let buscados = []
        for (let peticao of peticoes){
            let {numeroProcesso, idProcesso, dataJuntada, idDocumento} = peticao
            if(dataJuntada < ultimaData) continue
            let removido = false
            let timeline = await buscarDocumentos(idProcesso) || []
            if (!timeline.length) continue
            let remover = timeline.some(d => d?.data > dataJuntada &&
                ['despacho', 'decisao', 'sentenca', 'ata da audiencia'].some(c=> normalizar(d?.titulo).includes(c) || normalizar(d?.tipo).includes(c)) && 
                d?.usuarioInterno)
            if (remover){
                removido = true
                await removerDoEscaninho(numeroProcesso)
                console.log('%c[Rota PJE]%c timeline' + JSON.stringify(peticao), LOG.aviso, 'color:inherit', timeline)
                //return
            }
            buscados.push({numeroProcesso, idProcesso, idDocumento, dataJuntada: new Date(dataJuntada).toLocaleDateString('pt-BR'), removido: removido? 'SIM' : 'NÃO'})
            await armazenar({[idDivMenu]: dataJuntada})
        }
        let i = 0
        while(interceptador_ler('peticoes_juntadas') === interceptados){
            await suspender(1000)
            i++
            if (i === 10){
                definePagina(qtdPaginas, true)
                break
            }
        }

        if (interceptador_ler('peticoes_juntadas') === interceptados) definePagina(interceptados?.qtdPaginas, true)

        function finaliza(buscados){
            let i = 0
            let resultado = buscados.map(d => {
                let cabecalho = Object.keys(d).map(d => d).join('\t')
                i++
                let linha = Object.values(d).map(d => d).join('\t')
                return (i == 1? (cabecalho + '\n' + linha) : linha)
            }).join('\n')
            _baixarArquivo(JSON.stringify(resultado, null, 2), 'RemovePetiçõesAnalisadas.txt', 'text/plain')
            rota_avisoObrigatorio('Um arquivo foi baixado contendo o relatório desta atividade', 5)
            escaninhoMenu()
        }

        async function definePagina(paginas, interceptadorNaoMudou = false){
            if (document.querySelector('pje-paginador mat-select').textContent >= paginas && interceptadorNaoMudou) {
                finaliza(buscados)
                return
            } else if(interceptadorNaoMudou){
                clicar('pje-paginador button[aria-label="Próximo"]')
                while(interceptador_ler('peticoes_juntadas') === interceptados){
                    await suspender(1000)
                    i++
                    if (i === 10){
                        definePagina(qtdPaginas, true)
                        break
                    }
                }
            } else {
                removePeticoesAnalisadas()
            }
            

        }
        
        async function removerDoEscaninho(numeroProcesso) {
            let linhas = [...document.querySelectorAll('pje-data-table tr')]
            let linhaExcluir = linhas.find(l => l.textContent.includes(numeroProcesso)) || null
            await aguardarElemento('button[name$="' + numeroProcesso + '"]')
            clicar('button[name$="' + numeroProcesso + '"]')
            await aguardarElemento('.mat-dialog-actions button')
            let botao = [...document.querySelectorAll('.mat-dialog-actions button')].find(b => b.textContent == 'Sim')
            clicar(botao)
            while (botao.isConnected){
                await suspender()
            }
            return
        }

    }
}
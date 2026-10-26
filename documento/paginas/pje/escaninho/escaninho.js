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
    let buscados = []
    let parar = false

    async function escaninhoMenu(){
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
                texto: 'Remove do escaninho as petições de processos que já têm despacho, sentença ou ata de audiência posterior.',
                textoBotao: 'Iniciar'
            },
            {
                id: 'removePeticoesPorTipoOuTitulo',
                titulo: 'Remove petições por tipo ou título.',
                texto: 'Remove do escaninho todas as petições que contenham no título ou tipo alguma das palavras escolhidas.',
                input: 'Preencha com as palavras a buscar, separadas por vírgula. Ex: contestacao, SUBSTABELECIMENTO, procuração.',
                textoBotao: 'Iniciar'
            },
        ]
        let mFuncoes = {
            removePeticoesAnalisadas,
            removePeticoesPorTipoOuTitulo
        }
        for (let script of scripts){
            let idGeral = idDiv + script?.id
            let ancestral = idGeral + '_div'
            let idInput = script?.input ? idGeral + '_input' : ''
            let armazenamentoInput = await obterArmazenamento(idInput) || {}
            let inputValue = armazenamentoInput?.[idInput] || ''
            let divIntermediaria = criaDiv({
                id: ancestral,
                ancestral: div?.corpo?.id, 
                rowColumn: 'row-reverse'
            })
            formataDiv(divIntermediaria, 'branco', 'auto', 'auto', 'relative', '0px', '0px', '')
            criaBotaoAzul({
                id: idGeral + '_botao',
                texto: script?.textoBotao,
                ancestral,
                acao: () => mFuncoes[script.id](idInput)
            })
            if (script?.input){
                let input = criaInput({
                    id: idInput,
                    textoEmCima: script?.input,
                    ancestral,
                })
                input.value = inputValue
            }
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
    async function removePeticoesPorTipoOuTitulo(idInput){
        let termos = document.getElementById(idInput).value || null
        if (!termos) {
            rota_avisoObrigatorio('Não foram informados termos para pesquisa', 5)
            return
        }
        await armazenar({[idInput]: termos})
        let termosArray = termos.split(',').map(d=> normalizar(d?.trim()))
        percorrePeticoes({rechamada: false, funcao: 'porTipoOuTitulo',parametros: termosArray})
    }
    async function removePeticoesAnalisadas(){
        percorrePeticoes({rechamada: false, funcao: 'analisadas', parametros: []})
    }
    async function percorrePeticoes({rechamada, funcao, parametros}) {
        let idDivMenu = id('escaninho', 'menu')
        let top = document.getElementById(idDivMenu)?.style.top
        let remover = document.getElementById(idDivMenu)?.remove()
        let idExecucao = id('escaninho', 'execucao')
        let removerExecucao = document.getElementById(idExecucao)?.remove()
        let divExecucao = criaDivCentralPadrao({
            id: idExecucao,
            titulo: 'Executando',
            largura: '40%',
            altura: '40%',
            top
        })
        let texto = criaSubTitulo({
            id: id('escaninho', 'placar'),
            texto: 'Aguarde a conclusão da tarefa. Iniciando.',
            ancestral: divExecucao.corpo.id
        })
        criaBotaoLaranja({
            id: id('escaninho', 'parar'),
            texto: 'Parar.',
            ancestral: divExecucao.corpo.id,
            acao: () => {
                parar = true
                return
            }
        })
        let armazenamento = await obterArmazenamento(idDivMenu) || {}
        if (!rechamada) await garanteOrdem()
        let ultimaData = armazenamento?.idDivMenu || ''
        let interceptados = interceptador_ler('peticoes_juntadas') || null
        if (!interceptados){
            rota_avisoObrigatorio('Ocorreu um erro. Atualize a página e tente novamente.', 5)
            return
        }
        let peticoes = interceptados?.resultado || []
        if (!peticoes.length){
            if (document.querySelector('table .mensagem-vazio')){
                finaliza(buscados)
                buscados = []
                return
            }
            rota_avisoObrigatorio('Ocorreu um erro. Atualize a página e tente novamente.', 5)
            return
        }
        let removeuAlgum = false
        let mFuncoes = {
            porTipoOuTitulo,
            analisadas
        }
        let i = 0
        for (let peticao of peticoes){
            if(parar){
                finaliza(buscados)
                return   
            }
            atualizaPlacar('Buscando ' + i++ + ' de ' + peticoes.length)
            let {numeroProcesso, idProcesso, dataJuntada, idDocumento} = peticao
            if(dataJuntada < ultimaData) continue
            let {removeuTF, dadosBuscados} = await mFuncoes[funcao]({parametros, peticao})
            if (removeuTF) removeuAlgum = true
            if (dadosBuscados) buscados.push(dadosBuscados)
            await armazenar({[idDivMenu]: dataJuntada})
        }
        if (JSON.stringify(interceptador_ler('peticoes_juntadas')) === JSON.stringify(interceptados)) {
            definePagina(interceptados?.qtdPaginas, removeuAlgum)
        } else {
            
            percorrePeticoes({rechamada: true, funcao, parametros})
        }

        function atualizaPlacar(texto){
            let placar = document.getElementById(id('escaninho', 'placar'))
            placar.textContent = texto
            return
        }

        async function analisadas({peticao}) {
            let {numeroProcesso, idProcesso, dataJuntada, idDocumento} = peticao
            let timeline = await buscarDocumentos(idProcesso) || []
            if (!timeline.length) return {removeuTF: false, dadosBuscados: null} 
            let remover = timeline.some(d => d?.data > dataJuntada &&
                ['despacho', 'decisao', 'sentenca', 'ata da audiencia'].some(c=> normalizar(d?.titulo).includes(c) || normalizar(d?.tipo).includes(c)) && 
                d?.usuarioInterno)
            let removeuTF = false
            if (remover){
                await removerDoEscaninho(numeroProcesso)
                removeuTF = true
            }
            let dadosBuscados = {
                numeroProcesso,
                idProcesso,
                idDocumento,
                dataJuntada: new Date(dataJuntada).toLocaleDateString('pt-BR'),
                removido: removeuTF? 'SIM' : 'NÃO'
            }
            return {removeuTF: false, dadosBuscados}
        }

        async function porTipoOuTitulo({parametros, peticao}) {
            let {descricaoDocumento, nomeTipoProcessoDocumento, numeroProcesso, dataJuntada} = peticao
            if(!parametros.length) return {removeuTF: false, dadosBuscados: null}
            if (parametros.some(t=> normalizar(descricaoDocumento).includes(t) || normalizar(nomeTipoProcessoDocumento).includes(t))){
                await removerDoEscaninho(numeroProcesso)
                let dadosBuscados = {numeroProcesso, dataJuntada: new Date(dataJuntada).toLocaleDateString('pt-BR'), descricaoDocumento, nomeTipoProcessoDocumento}
                return {removeuTF: true, dadosBuscados}
            }
            return {removeuTF: false, dadosBuscados: null}
        }
        
        async function garanteOrdem(){
            let interceptados = interceptador_ler('peticoes_juntadas')
            await aguardarElemento('table th')
            let botaoOrdena = [...document.querySelectorAll('table th')].find(t => normalizar(t.textContent).includes('data de juntada'))
            clicar(botaoOrdena)
            await suspender()
            while(interceptados === interceptador_ler('peticoes_juntadas')){
                await suspender()
            }
            let botaoApos = [...document.querySelectorAll('table th')].find(t => normalizar(t.textContent).includes('data de juntada'))
            let ordenacao = !!botaoApos.querySelector('[aria-label^="Ordenação ascendente"]')// || false
            console.log('%c[Rota PJE]%c ordenacao' + JSON.stringify(ordenacao), LOG.aviso, 'color:inherit')
            //return
            if (ordenacao){
                return
            }
            garanteOrdem()
        }

        function finaliza(buscados){
            atualizaPlacar('Finalizando...')
            let i = 0
            let resultado = buscados.map(d => {
                let cabecalho = Object.keys(d).map(d => d).join('\t')
                i++
                let linha = Object.values(d).map(d => d).join('\t')
                return (i == 1? (cabecalho + '\n' + linha) : linha)
            }).join('\n')
            _baixarArquivo(resultado, 'RemovePetiçõesAnalisadas.txt', 'text/plain')
            let remover = document.getElementById(id('escaninho', 'execucao'))?.remove()
            rota_avisoObrigatorio('Um arquivo foi baixado contendo o relatório desta atividade', 5)
            escaninhoMenu()
        }

        async function definePagina(paginas, removeuAlgum = false){
            atualizaPlacar('Próxima página...')
            if (Number(document.querySelector('pje-paginador mat-select').textContent) >= paginas && !removeuAlgum) {
                finaliza(buscados)
                buscados = []
                return
            } else {
                let interceptarAgora = interceptador_ler('peticoes_juntadas')
                clicar('pje-paginador button[aria-label="Próximo"]')
                let i = 0
                while(JSON.stringify(interceptarAgora) === JSON.stringify(interceptador_ler('peticoes_juntadas'))){
                    await suspender()
                    i++
                    if (i === 20){
                        finaliza(buscados)
                        buscados = []
                        return
                    }
                    //definePagina(interceptados?.qtdPaginas, true)
                }
                await suspender()
                percorrePeticoes({rechamada: true, funcao, parametros})
                return
            }
        }
        
        async function removerDoEscaninho(numeroProcesso) {
            atualizaPlacar('Removendo do escaninho...')
            let linhas = [...document.querySelectorAll('pje-data-table tr')]
            let linhaExcluir = linhas.find(l => l.textContent.includes(numeroProcesso)) || null
            await aguardarElemento('button[name$="' + numeroProcesso + '"]')
            await suspender()
            clicar('button[name$="' + numeroProcesso + '"]')
            await suspender()
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
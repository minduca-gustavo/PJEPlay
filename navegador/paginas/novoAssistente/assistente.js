async function novoAssistente() {
    let janela = location.href.includes('navegador/paginas/novoAssistente/assistente.htm')
    if (!janela) {
        return
    }
    window.addEventListener('beforeunload', () => {
        armazenar({rotapje_filaEmExecucao: false})
    })
    

    //document.querySelector('#rota_corpo_assistente').style.marginTop = '8px'
    criaFila()

    window.addEventListener('focus', () => {
        criaFila(false, true)
	})
    
    async function criaFila(primeiro = true, foco = false) {
        if (foco){
            await criaSecaoTarefa()
            return
        }
        let dadosFila = await obterArmazenamento(['rotapje_fila', 'rotapje_filaPosicao']) || {}
        let fila = dadosFila?.rotapje_fila
        let posicao = dadosFila?.rotapje_filaPosicao
        if (!fila.length) {
            rotinaFinalizar()
        }
        
    
        let corpo = document.getElementById('rota_corpo_assistente')
        corpo.replaceChildren('')
        corpo.style.overflowY = 'hidden'
        corpo.style.display = 'flex'
        corpo.style.flexDirection = 'column'
        let checks = []
        let divTarefa = criaDiv({
            id: 'corpoTarefa',
            ancestral: 'rota_corpo_assistente',
            rowColumn: 'row'
        })
        divTarefa.style.background = '#002d5b'
        await criaSecaoTarefa()
        async function criaSecaoTarefa(){
            let secao = document.getElementById('corpoTarefa')
            secao.replaceChildren('')
            let tarefasArmazenadas = await obterArmazenamento(['tarefas', 'tarefaAtiva', 'tarefasDoSistema'])
            let {tarefas, tarefaAtiva, tarefasDoSistema} = tarefasArmazenadas
            console.log('%c[Rota PJE]%c tarefasSistema' + JSON.stringify(tarefasDoSistema), LOG.aviso, 'color:inherit', tarefasDoSistema)
            console.log('%c[Rota PJE]%c tarefas' + JSON.stringify(tarefas), LOG.aviso, 'color:inherit')
            console.log('%c[Rota PJE]%c tarefaAtiva' + JSON.stringify(tarefaAtiva), LOG.aviso, 'color:inherit')
            let tarefasOpcoes = [...tarefasDoSistema.map(d=> '🤖 ' + d.label), ...Object.keys(tarefas).map(d=> '🧑‍🦱 ' + d)]
            let titulo = criaSubTitulo({
                id: 'tarefaTitulo',
                ancestral: 'corpoTarefa',
                texto: 'TAREFA ATIVA:'
            })
            titulo.style.alignSelf = 'center'
            let menu = criaMenuSuspenso({
                id: 'tarefaMenu',
                ancestral: 'corpoTarefa',
                opcoes: tarefasOpcoes,
                valorInicial: resolverTarefa(tarefaAtiva),
                
            })
            menu.style.width = '160px'
            menu.addEventListener('change', () => trocaTarefa(document.getElementById(menu.id).value))
            console.log('%c[Rota PJE]%c resolverTarefa(tarefaAtiva)' + JSON.stringify(resolverTarefa(tarefaAtiva)), LOG.aviso, 'color:inherit')
            titulo.style.color = '#feb81c'
            function resolverTarefa(tarefaAtiva){
                console.log('%c[Rota PJE]%c 58' + JSON.stringify(58), LOG.aviso, 'color:inherit')
                let tarefaSistema = tarefasDoSistema.find(d=> d.id == tarefaAtiva)
                if (tarefaSistema) return ('🤖 ' + tarefaSistema.label)
                let tarefaUsuario = Object.keys(tarefas).find(d=> d == tarefaAtiva)
                return ('🧑‍🦱 ' + tarefaUsuario)
            }
            function trocaTarefa(tarefa) {
                let ehSistema = tarefasDoSistema.some(d=> normalizar(tarefa).includes(normalizar(d.label)))
                let tarefaAtiva = tarefasDoSistema.find(d=> normalizar(tarefa).includes(normalizar(d.label)))?.id || Object.keys(tarefas).find(d=> normalizar(tarefa).includes(normalizar(d)))
                armazenar({ tarefaAtiva, tarefaAtivaIsSistema: ehSistema })
            }
        }
        let divFila = criaDiv({
            id: 'divFila',
            ancestral: 'rota_corpo_assistente'
        })
        divFila.style.height = '100%'
        divFila.style.overflowY = 'auto'
        let botFilas = []
        for (let item of fila){
            let {numProc} = item
            console.log('%c[Rota PJE]%c numProc: ' + JSON.stringify(numProc), LOG.info, 'color:inherit')
            let ancestral = 'fila_' + numProc.replace(/\.?\-?/g, '')
            let div = criaDiv({
                id: 'fila_' + numProc.replace(/\.?\-?/g, ''),
                ancestral: 'divFila',
                rowColumn: 'row'
            })
            div.style.marginLeft = '15px'
            let chk = await criaCheckBox({
                id: ancestral + '_check',
                ancestral
            })
            chk.dataset.processo = numProc
            chk.style.marginBottom = '0px'
            checks.push(ancestral + '_check')
            let texto = criaTexto({
                id: ancestral + '_texto',
                ancestral,
                texto: numProc
            })
            chk.addEventListener('click', () => corDoTexto(chk, ancestral + '_texto'))
            texto.style.alignSelf = 'center'
            
            let botRemover = criaBotaoAzul({
                id: ancestral + '_remover',
                ancestral,
                texto: '❌',
                acao: () => removerDaFila(numProc)
            })
            botRemover.style.padding = '2px 4px'
            trocarCorDoBotao(botRemover, '#dddddd', '#999999')
            criaTooltip({
                id: ancestral + '_remover_tip',
                texto: 'Remover da fila',
                elemento: botRemover
            })
            let botFila = criaTexto({
                id: ancestral + '_fila',
                ancestral,
                texto: '📍',
                // acao: () => alert('Armazenar o novo da fila e recriar')
            })
            botFilas.push(ancestral + '_fila')
            botFila.style.padding = '2px 4px'
            botFila.style.borderRadius = '6px'
            botFila.style.cursor = 'pointer'
            botFila.dataset.marcado = 0
            botFila.dataset.processo = numProc
            trocarCorDoBotao(botFila, '#dddddd', '#999999')
            
            criaTooltip({
                id: ancestral + '_fila_tip',
                texto: 'Executar este',
                elemento: botFila
            })
        }
        for (let botao of botFilas){
            let bot = document.getElementById(botao)
            bot.addEventListener('click', () => {
                if (bot.dataset.marcado == 1){
                    bot.dataset.marcado = 0
                    trocarCorDoBotao(bot, '#dddddd', '#999999')
                    //['#81d55a', '#51a851'] : ['#dddddd', '#999999']
                } else {
                    bot.dataset.marcado = 1
                    trocarCorDoBotao(bot, '#81d55a', '#51a851')
                    abrirProcessoFila(bot.dataset.processo)
                }
                alternaCheckBox(botao, ...botFilas)
            })
        }
        if (primeiro) document.getElementById(botFilas[0]).click()
        
        
        function corDoTexto (chk, texto){
            let marcado = document.getElementById(chk.id)?.dataset.marcado || 0
            if (marcado==1){
                document.getElementById(texto).style.background = '#dddddd'
            } else {
                document.getElementById(texto).style.background = '#ffffff'
            }
        }
        let remover = document.getElementById('rota_corpo_acoesFila')?.remove()
        criaDiv({
            id: 'rota_corpo_acoesFila',
            ancestral: 'rota_corpo_assistente',
            rowColumn: 'row'
        })
        let botoesFila = ['Remover selecionados', 'Remover todos', 'Copiar todos', 'Copiar selecionados', 'Nova fila']
        for (let botao of botoesFila){
            let removeEspacos = botao.replace(/\s/g, '_')
            let bot = criaBotaoAzul({
                ancestral: 'rota_corpo_acoesFila',
                id: normalizar(removeEspacos),
                texto: botao,
                acao: () => acoesFila(normalizar(removeEspacos), checks)
            })
            let cores = {
                remover: ['#c1121f', '#780000'],
                copiar: ['#38b000', '#008000']
            }
            for (let [chave, valor] of Object.entries(cores)){
                if (normalizar(botao).includes(chave)){
                    trocarCorDoBotao(bot, ...valor)
                }
            }
            
        }
    }
    async function abrirProcessoFila(parametro) {
        // mandar sinal para fechar todas as janelas
        alert(parametro)
        
        
    }
    async function acoesFila(parametro, checks) {
        console.log('%c[Rota PJE]%c parametro' + JSON.stringify(parametro), LOG.aviso, 'color:inherit')
        console.log('%c[Rota PJE]%c checks' + JSON.stringify(checks), LOG.aviso, 'color:inherit')
        console.log('%c[Rota PJE]%c 173' + JSON.stringify(173), LOG.aviso, 'color:inherit', document.getElementById(checks[0]))
        if (parametro == 'remover_selecionados'){
            let checksSelecionados = checks.filter(d => 
                document.getElementById(d).dataset.marcado == 1
            ).map(d=> document.getElementById(d).dataset.processo)
            removerDaFila(...checksSelecionados)
        }
        if (parametro == 'remover_todos'){
            let checksSelecionados = checks.map(d=> document.getElementById(d).dataset.processo)
            removerDaFila(...checksSelecionados)
        }
    }
    criaDiv({
        id: 'rota-rodape_proximoEncerrar',
        ancestral: 'rota-rodape_assistente',
        rowColumn: 'row'
    })
    let rodape = document.getElementById('rota-rodape_assistente')
    rodape.style.flexDirection = 'column'
    rodape.style.gap = '4px'
    let botoes = ['▶ Próximo', '■ Encerrar']
    for (let botao of botoes){
        let sohTexto = botao.split(' ')[1]
        let bot = criaBotaoLaranja({
            ancestral: 'rota-rodape_proximoEncerrar',
            id: normalizar(sohTexto),
            texto: botao,
            acao: () => proximoOuEncerrar(normalizar(sohTexto))
        })
    }

    async function removerDaFila(...processos) {
        let filaArmazenada = await obterArmazenamento('rotapje_fila') || {}
        let fila = filaArmazenada?.rotapje_fila
        console.log('%c[Rota PJE]%c [...processos]' + JSON.stringify([...processos]), LOG.aviso, 'color:inherit')
        fila = fila.filter(d=> ![...processos].some(c=> d.numProc.includes(c)))
        await armazenar({rotapje_fila: fila})
        criaFila(false)
        
    }

    function proximoOuEncerrar(){

    }

    function rotinaFinalizar(){
        //rota_corpo_assistente
    }
}

novoAssistente()
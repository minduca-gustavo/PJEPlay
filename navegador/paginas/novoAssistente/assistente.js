async function novoAssistente() {
    let janela = location.href.includes('navegador/paginas/novoAssistente/assistente.htm')
    if (!janela) {
        return
    }
    window.addEventListener('beforeunload', () => {
        armazenar({rotapje_filaEmExecucao: false})
    })
    
    criaFila()
    
    async function criaFila() {
        let filaArmazenada = await obterArmazenamento('rotapje_fila') || {}
        let fila = filaArmazenada?.rotapje_fila
        if (!fila.length) {
            rotinaFinalizar()
        }
    
        let corpo = document.getElementById('rota_corpo_assistente')
        corpo.replaceChildren('')
        let checks = []
        for (let item of fila){
            let {numProc} = item
            console.log('%c[Rota PJE]%c numProc: ' + JSON.stringify(numProc), LOG.info, 'color:inherit')
            let ancestral = 'fila_' + numProc.replace(/\.?\-?/g, '')
            let div = criaDiv({
                id: 'fila_' + numProc.replace(/\.?\-?/g, ''),
                ancestral: 'rota_corpo_assistente',
                rowColumn: 'row'
            })
            div.style.marginLeft = '15px'
            let chk = await criaCheckBox({
                id: ancestral + '_check',
                ancestral
            })
            chk.dataset.processo = numProc
            checks.push(ancestral + '_check')
            criaTexto({
                id: ancestral + '_texto',
                ancestral,
                texto: numProc
            })
            let bot = criaBotaoAzul({
                id: ancestral + '_remover',
                ancestral,
                texto: 'Remover da fila',
                acao: () => removerDaFila(numProc)
            })
            trocarCorDoBotao(bot, '#c1121f', '#780000')
        }
    }
    
    criaDiv({
        id: 'rota-rodape_acoesFila',
        ancestral: 'rota-rodape_assistente',
        rowColumn: 'row'
    })
    let botoesFila = ['Remover todos']
    for (let botao of botoesFila){
        let removeEspacos = botao.replace(/\s/g, '_')
        let bot = criaBotaoAzul({
            ancestral: 'rota-rodape_assistente',
            id: normalizar(removeEspacos),
            texto: botao,
            acao: () => acoesFila(removeEspacos)
        })
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

    async function removerDaFila(...ids) {
        let filaArmazenada = await obterArmazenamento('rotapje_fila') || {}
        let fila = filaArmazenada?.rotapje_fila
        if (!fila.length) criaFila()
        
    }

    function proximoOuEncerrar(){

    }

    function rotinaFinalizar(){
        //rota_corpo_assistente
    }
}

novoAssistente()
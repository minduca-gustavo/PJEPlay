
// o body está mudando COM PROCESSO. Tem que ver o innertext da painelGlobalTabelaDeProcessos
//console.log('Me chamou? BUSCA FILA')
function buscaPosicaoFila(){
    let janela = confereJanela(JANELA.detalhes)
    if (!janela) return
    busca_posicao_filaCriaCampoConsulta()
}
//console.log('Me chamou? OJ')

window.addEventListener('pjerota:url-mudou', () => {
    document.getElementById('pjerota-busca_posicao_fila-widget')?.remove()
    buscaPosicaoFila()
})

buscaPosicaoFila()

function buscaPosicaoFilaPainelGlobal(){
    let janela = confereJanela(JANELA.painelGlobalTarefas)
    if (!janela) return
    busca_FilaPainelGlobal()
}

buscaPosicaoFilaPainelGlobal()

async function busca_FilaPainelGlobal(){
    let parametros = await rota_buscarParametros('pjerota_busca_posicao_fila')
    if (!parametros) return
    let processo = await rota_buscarParametros('pjerota_busca_posicao_fila_numero')
    let armazenamento = await obterArmazenamento('pjerota_busca_posicao_fila')
    if (!armazenamento) return
    console.log('%c[Rota PJE]%c 29', LOG.teste, 'color:inherit')
    await removerArmazenamento('pjerota_busca_posicao_fila')
    await busca_posicao_filaAguardaCarregamentoDoBodyComProcesso()
    let contAtual = await interceptador_lerProcessosPainel()
    let conteudoAtual = contAtual.resultado
    let botoes = [...document.querySelectorAll(seletorPorVersao('painelGlogalBotoesDeOrdenar'))]
    let desde = botoes.find(el => el.textContent.includes('Desde'))
    let prioridade = await sel('painelGlobalBotaoFiltroDePrioridades')
    let desconsiderar = await sel('painelGlobalBotaoDesconsiderarFiltrosSelecionados')
    let dataPrioridade = ''
    let dataDesconsiderar = ''
    let cliques = [desde, prioridade]
    for(let clique of cliques){
        await clicar(clique)
        let datas = await busca_posicao_filaMudancaDaMetaTag(conteudoAtual)
        //await suspender(100)
        conteudoAtual = datas
        if(clique == prioridade) {
            dataPrioridade = new Date(datas[0].dataEntradaTarefa).toLocaleDateString('pt-BR')
        }
        if(clique == desde) {
            dataDesconsiderar = new Date(datas[0].dataEntradaTarefa).toLocaleDateString('pt-BR')
        }
        
        //await suspender(1000)
    }
    busca_posicao_filaAguardaCarregamentoDoBodyComProcesso(conteudoAtual)
    relatar(dataPrioridade + ' - ' + dataDesconsiderar, '', 'teste')
    await aguardarElementoNovo('painelGlobalTabelaDeProcessos')
    let top = window.innerHeight/2 + 150
    let aviso = criaDiv({id: 'rota-pje-busca-posicao-fila-div', ancestral: '#ffff'})
    aviso.style.width = '300px'
    aviso.style.position = 'fixed'
    aviso.style.top = '50%'
    aviso.style.left = '50%'
    aviso.style.transform = 'translate(-50%, -50%)'
    aviso.style.zIndex = '9999999'
    let botao = criaBotaoAzul({
        id: 'rota-pje-busca-posicao-fila-botao', 
        ancestral: 'rota-pje-busca-posicao-fila-div', 
        texto: 'O processo ' + processo + ' entrou na tarefa em ' + decodeURI(parametros) + '. O processo prioritário mais antigo entrou na tarefa em ' + dataPrioridade + '. O processo mais antigo, desconsiderando os prioritários, entrou na tarefa em ' + dataDesconsiderar + '. Clique para fechar.',
        acao: () => aviso.remove()
    })
    botao.style.zIndex = '9999999'
    //botao.style.width = '300px'
    document.body.appendChild(aviso)
    
    return

    
    
}

async function busca_posicao_filaMudancaDaMetaTag(conteudo) {
    let jsonInicial = JSON.stringify(conteudo)
    let conteudoAtual
    for(let i = 0; i < 100; i++){
        let contAtual = await interceptador_lerProcessosPainel()
        conteudoAtual = contAtual.resultado
        if (!conteudoAtual) { await suspender(300); continue }
        if (JSON.stringify(conteudoAtual) !== jsonInicial) break
        await suspender(300)
    }
    return conteudoAtual
}

async function busca_posicao_filaAguardaCarregamentoDoBodyComProcesso(conteudoAtual){
    let match
    let contAtual
    let conteudo
    //await suspender (1000)
    if(!conteudoAtual){
        
        await aguardarElementoNovo('painelGlobalTabelaDeProcessos')
        let ROTA_REGEX_CNJ = /\d{7}[-.]\d{2}[-.]\d{4}[-.]\d[-.]\d{2}[-.]\d{4}/
        for(let i = 0; i < 100; i++){
            
            contAtual = await sel('painelGlobalTabelaDeProcessos')
            conteudo = contAtual.innerText
            
            //console.log('%c[Rota PJE]%c body: ' + conteudo, LOG.teste, 'color:inherit')
            match = conteudo.match(ROTA_REGEX_CNJ) || conteudo.match('Não há processos neste tema.')
            //console.log('%c[Rota PJE]%c match: ' + match, LOG.teste, 'color:inherit')
            if (match) return
            await suspender(300)
        }
        if (!ROTA_REGEX_CNJ.test(conteudo)) return null
    }else{
        conteudo = conteudoAtual
    }
    console.log('%c[Rota PJE]%c conteudo: ' + conteudo, LOG.teste, 'color:inherit')
    for(let i = 0; i < 100; i++){
        let contMudou = await sel('painelGlobalTabelaDeProcessos')
        let conteudoMudou = contMudou.innerText
        //console.log('%c[Rota PJE]%c conteudoMudou: ' + conteudoMudou, LOG.teste, 'color:inherit')
        if (conteudo !== conteudoMudou && ROTA_REGEX_CNJ.test(conteudoMudou)) return
        await suspender(300)
    }
    return null
    
}

async function busca_posicao_filaCriaCampoConsulta() {
    let retira = await selecionar('#pjerota-busca-posicao-fila-div-barra')
    if (retira) retira.remove()
    let barra = await aguardarElementoNovo('detalhesDoProcessoBarraSuperior')
    let corToolbar = barra
        ? getComputedStyle(barra).backgroundColor
        : '#1565C0'
    let div = await criaDiv({
        id: 'pjerota-busca-posicao-fila-div-barra',
        ancestral: 'ffff'

    })
    div.style.backgroundColor = corToolbar
    div.style.color = corToolbar
    div.style.gap = '0px'
    div.style.padding = '0px'
    div.style.marginBottom = '0px'
    div.style.heigth = '14px'
    div.style.zIndex = '9999999'

    let botao = await criaBotaoAzul({
        id: 'pjerota-busca-posicao-fila-botao-busca',
        ancestral: 'pjerota-busca-posicao-fila-div-barra',
        acao: () => busca_posicao_filaConsultar(),
        texto: 'Busca posição do processo na fila.'
    })
    botao.style.width = 'fit-content'
    botao.style.fontSize = '9px'
    botao.style.height     = '14px'
    botao.style.lineHeight = '14px'
    botao.style.padding    = '0 8px'
    botao.style.fontSize   = '9px'
    botao.style.zIndex = '9999999'
    barra
        ? barra.parentElement.insertBefore(div, barra)
        : document.body.prepend(div)

}    


//https://pje.trt15.jus.br/pje-comum-api/api/tarefas/historico/4725975

async function busca_posicao_filaConsultar() {
    const rodape = await selecionar('#pjerota-busca-posicao-fila-rodape')
    const id = location.href.match(/\/pjekz\/processo\/(\d+)\/detalhe/)?.[1]
    const processo = ((await sel('detalhesDoProcessoNumeroProcessoComTipo'))?.textContent.split(' ')[2])
      ?? (await interceptador_lerProcesso()?.numero ?? await rota_fetch(`${location.origin}/pje-comum-api/api/processos/id/${id}`))?.numero
    if(!processo){
        rodape.textContent = 'Processo não encontrado. Atualize a página e tente novamente.'
        return
    } 
    let idTarefa = await rota_fetch(location.origin + '/pje-comum-api/api/agrupamentotarefas/processos?numero=' + processo)

    let tarefas = await rota_fetch(location.origin + '/pje-comum-api/api/tarefas/historico/' + id)
    let dataEntradaTarefa = new Date(tarefas[tarefas.length - 2]?.inicio).toLocaleDateString('pt-BR')
    rodape.textContent = 'O processo entrou na tarefa em ' + dataEntradaTarefa + '.'
    await armazenar({pjerota_busca_posicao_fila: dataEntradaTarefa})
    let url = location.origin + '/pjekz/painel/global/' + idTarefa[0].idAgrupamentoProcesso + '/lista-processos?pjerota_busca_posicao_fila=' + encodeURI(dataEntradaTarefa) + '&pjerota_busca_posicao_fila_numero='+ processo
    //alert(url)
    window.open(url)
    return
    
}

function busca_posicao_filaNavegar(url) {
    location.href = url
}
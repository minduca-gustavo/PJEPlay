// ____________________________________
//        PRELIMINAR - CRIA A FITA
// ____________________________________

async function criaFitaSuperior() {
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
    console.log('%c[Rota PJE]%c cria a fita' + JSON.stringify(8 + ': fita'), LOG.rosa, 'color:inherit')
    
    div.style.backgroundColor = corToolbar
    div.style.color = corToolbar
    div.style.gap = '0px'
    div.style.padding = '0px'
    div.style.marginBottom = '0px'
    div.style.heigth = '14px'
    div.style.zIndex = '9999999'
    div.style.display = 'flex'
    div.style.flexDirection = 'row'
    div.style.alignItems = 'center'

    // Insere a div no DOM antes de criar os botões,
    // pois criaBotaoAzul busca o ancestral pelo id
    barra
        ? barra.parentElement.insertBefore(div, barra)
        : document.body.prepend(div)

    await busca_filaCriaBotao()
    await abre_tarefa_rotaCriaBotao()
}

function confereCriaFitaSuperior(){
    let janela = confereJanela(JANELA.detalhes)
    if (!janela) return
    criaFitaSuperior()
}

window.addEventListener('pjerota:url-mudou', () => {
    document.getElementById('pjerota-busca-posicao-fila-div-barra')?.remove()
    confereCriaFitaSuperior()
})

confereCriaFitaSuperior()


// ___________________________________________________
// [1] BUSCA POSIÇÃO FILA
// ___________________________________________________

async function busca_filaCriaBotao(){
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
    botao.style.zIndex = '9999999'
}

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
        conteudoAtual = datas
        if(clique == prioridade) {
            dataPrioridade = new Date(datas[0].dataEntradaTarefa).toLocaleDateString('pt-BR')
        }
        if(clique == desde) {
            dataDesconsiderar = new Date(datas[0].dataEntradaTarefa).toLocaleDateString('pt-BR')
        }
    }
    busca_posicao_filaAguardaCarregamentoDoBodyComProcesso(conteudoAtual)
    relatar(dataPrioridade + ' - ' + dataDesconsiderar, '', 'teste')
    await aguardarElementoNovo('painelGlobalTabelaDeProcessos')
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
    document.body.appendChild(aviso)
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
    if(!conteudoAtual){
        await aguardarElementoNovo('painelGlobalTabelaDeProcessos')
        let ROTA_REGEX_CNJ = /\d{7}[-.]\d{2}[-.]\d{4}[-.]\d[-.]\d{2}[-.]\d{4}/
        for(let i = 0; i < 100; i++){
            contAtual = await sel('painelGlobalTabelaDeProcessos')
            conteudo = contAtual.innerText
            match = conteudo.match(ROTA_REGEX_CNJ) || conteudo.match('Não há processos neste tema.')
            if (match) return
            await suspender(300)
        }
        if (!ROTA_REGEX_CNJ.test(conteudo)) return null
    }else{
        conteudo = conteudoAtual
    }
    for(let i = 0; i < 100; i++){
        let contMudou = await sel('painelGlobalTabelaDeProcessos')
        let conteudoMudou = contMudou.innerText
        if (conteudo !== conteudoMudou && ROTA_REGEX_CNJ.test(conteudoMudou)) return
        await suspender(300)
    }
    return null
}

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
    window.open(url)
}

function busca_posicao_filaNavegar(url) {
    location.href = url
}


// ___________________________________________________
// [2] ABRE TAREFA DO ROTA EM JANELAS
// ___________________________________________________

async function abre_tarefa_rotaCriaBotao() {
    let nomeTarefaAtiva = await abre_tarefa_rotaNomeTarefaAtiva()
    let botaoTarefa = await criaBotaoLaranja({
        id: 'pjerota-abre-tarefa-rota-botao',
        ancestral: 'pjerota-busca-posicao-fila-div-barra',
        acao: () => abre_tarefa_rotaAbrirEmModoJanelas(),
        texto: 'tarefa: ' + nomeTarefaAtiva
    })
    botaoTarefa.style.width = 'fit-content'
    botaoTarefa.style.fontSize = '9px'
    botaoTarefa.style.height = '14px'
    botaoTarefa.style.lineHeight = '14px'
    botaoTarefa.style.padding = '0 8px'
    botaoTarefa.style.zIndex = '9999999'
}

async function abre_tarefa_rotaNomeTarefaAtiva(){
    let cfg = await obterArmazenamento('tarefaAtiva')
    return _ass_nomeTarefa(cfg?.tarefaAtiva) || cfg?.tarefaAtiva || '—'
}

async function abre_tarefa_rotaAbrirEmModoJanelas(){
    const id = location.href.match(/\/pjekz\/processo\/(\d+)\/detalhe/)?.[1]
    const processo = ((await sel('detalhesDoProcessoNumeroProcessoComTipo'))?.textContent.split(' ')[2])
        ?? (await interceptador_lerProcesso()?.numero ?? await rota_fetch(`${location.origin}/pje-comum-api/api/processos/id/${id}`))?.numero
    if(!id || !processo){
        rota_avisoTemporario('Processo não encontrado. Atualize a página e tente novamente.', 'erro', 4000)
        return
    }
    rota_avisoTemporario('▶ Abrindo no modo janelas…', 'info', 3000)
    rota_iniciarPipeline({ fila: [{ numProc: processo, id, dadosLinha: [], params: [] }] })
}
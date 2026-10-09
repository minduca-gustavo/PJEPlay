// ____________________________________
//        PRELIMINAR - CRIA A FITA
// ____________________________________

async function criaFitaSuperior() {
    let retira = await selecionar('#rotapje_fita_superior')
    if (retira) retira.remove()
    let barra = await aguardarElementoNovo('detalhesDoProcessoBarraSuperior')
    let corToolbar = barra
        ? getComputedStyle(barra).backgroundColor
        : '#1565C0'
    let div = criaDiv({
        id: 'rotapje_fita_superior',
        ancestral: 'ffff'
    })
    
    formataFitaSuperior(div, corToolbar)

    // Insere a div no DOM antes de criar os botões,
    // pois criaBotaoAzul busca o ancestral pelo id
    insereFitaSuperior(barra, div)
    if (confereJanela(JANELA.pericias)){
        await peritosPreferidos('rotapje_fita_superior')
        return
    }
    
    await busca_filaCriaBotao()
    await busca_pautaEletronicaCriaBotao()
    await abre_tarefa_rotaCriaBotao()
    await irParaAOJDesteProcessoCriaBotao()
    await tramitaIAResumoRapido()
}

function formataFitaSuperior(elemento, cor){
    elemento.style.backgroundColor = cor
    elemento.style.gap = '0px'
    elemento.style.padding = '0px'
    elemento.style.marginBottom = '0px'
    elemento.style.height = '14px'
    elemento.style.zIndex = '9999999'
    elemento.style.display = 'flex'
    elemento.style.flexDirection = 'row'
    elemento.style.alignItems = 'center'
}

async function confereCriaFitaSuperior(){
    console.log('%c[Rota PJE]%c confere: ' + JSON.stringify(43), LOG.rosa, 'color:inherit')
    let janela = confereJanela(
        JANELA.detalhes,
        JANELA.pericias
    )
    console.log('%c[Rota PJE]%c fita superior janela: ' + JSON.stringify(janela), LOG.aviso, 'color:inherit')
    if (!janela) return
    await criaFitaSuperior()
}

function insereFitaSuperior(elemento, inserir){
    elemento
        ? elemento.parentElement.insertBefore(inserir, elemento)
        : document.body.prepend(inserir)
}

// ___________________________________________________
// [1] BUSCA POSIÇÃO FILA
// ___________________________________________________

async function busca_filaCriaBotao(){
    let botao = await criaBotaoAzul({
        id: 'rotapje-busca-posicao-fila-botao-busca',
        ancestral: 'rotapje_fita_superior',
        acao: () => busca_posicao_filaConsultar(),
        texto: 'Busca posição do processo na fila.'
    })
    estiloBotaoFitaSuperior(botao)
}

function buscaPosicaoFilaPainelGlobal(){
    let janela = confereJanela(JANELA.painelGlobalTarefas)
    if (!janela) return
    busca_FilaPainelGlobal()
}

async function busca_FilaPainelGlobal(){
    let parametros = await rota_buscarParametros('rotapje_busca_posicao_fila')
    if (!parametros) return
    let processo = await rota_buscarParametros('rotapje_busca_posicao_fila_numero')
    let armazenamento = await obterArmazenamento('rotapje_busca_posicao_fila')
    if (!armazenamento) return
    await removerArmazenamento('rotapje_busca_posicao_fila')
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
        let elDesde = [...document.querySelectorAll('.th-container-class')].find(d=> d.textContent.includes('Desde'))
        if (elDesde.querySelector('[aria-label*=ascendente]') && clique == desde){
            dataDesconsiderar = new Date(datas[0].dataEntradaTarefa).toLocaleDateString('pt-BR')
            continue
        }
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
    let aviso = criaDiv({id: 'rotapje-busca-posicao-fila-div', ancestral: '#ffff'})
    aviso.style.width = '300px'
    aviso.style.position = 'fixed'
    aviso.style.top = '50%'
    aviso.style.left = '50%'
    aviso.style.transform = 'translate(-50%, -50%)'
    aviso.style.zIndex = '9999999'
    let botao = criaBotaoAzul({
        id: 'rotapje-busca-posicao-fila-botao',
        ancestral: 'rotapje-busca-posicao-fila-div',
        texto: 'O processo ' + processo + ' entrou na tarefa em ' + decodeURI(parametros) + '. O processo prioritário mais antigo entrou na tarefa em ' + dataPrioridade + '. O processo mais antigo, desconsiderando os prioritários, entrou na tarefa em ' + dataDesconsiderar + '. Clique para fechar.',
        acao: () => aviso.remove()
    })
    botao.style.zIndex = '9999999'
    document.body.appendChild(aviso)
}

async function busca_posicao_filaMudancaDaMetaTag(conteudo) {
    console.log('%c[Rota PJE]%c conteudo: ', LOG.info, 'color:inherit', conteudo)
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
    let ROTA_REGEX_CNJ = /\d{7}[-.]\d{2}[-.]\d{4}[-.]\d[-.]\d{2}[-.]\d{4}/
    if(!conteudoAtual){
        await aguardarElementoNovo('painelGlobalTabelaDeProcessos')
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
    const rodape = await selecionar('#rotapje-busca-posicao-fila-rodape')
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
    await armazenar({rotapje_busca_posicao_fila: dataEntradaTarefa})
    let url = location.origin + '/pjekz/painel/global/' + idTarefa[0].idAgrupamentoProcesso + '/lista-processos?rotapje_busca_posicao_fila=' + encodeURI(dataEntradaTarefa) + '&rotapje_busca_posicao_fila_numero='+ processo
    window.open(url)
}

function busca_posicao_filaNavegar(url) {
    location.href = url
}



// ___________________________________________________
// [2] ABRE PAUTA ELETRÔNICA
// ___________________________________________________

async function busca_pautaEletronicaCriaBotao() {
    let botao = await criaBotaoLaranja({
        id: id('buscaPautaEletronica', 'botao'),
        ancestral: 'rotapje_fita_superior',
        acao: () => busca_pautaEletronica(),
        texto: 'Pauta Eletrônica'
    })
    criaTooltip({
        id: id('buscaPautaEletronica', 'botao', 'tooltip'),
        texto: 'Abre a pauta eletrônica na sala correspondente, SE houver audiência marcada',
        elemento: botao
    })
    estiloBotaoFitaSuperior(botao)
}

async function busca_pautaEletronica() {
    let idURLMatch = location.href.match(/pjekz\/processo\/(\d+)\/detalhe/)
    let idURL = idURLMatch?.[1]
    let audienciasMarcadas = interceptador_lerAudiencias() || await buscarAudienciasMarcadas(idURL) || []
    if (!audienciasMarcadas.length) {
        fitaSuperiorErro('Não há audiências marcadas')
        return
    }
    let sala = audienciasMarcadas[0]?.salaFisica?.nome
    let oj = interceptador_lerProcesso() || await buscarProcesso(id) || {}
    if (!oj?.orgaoJulgador?.descricao) {
        fitaSuperiorErro('Ocorreu um erro. Atualize a página e tente novamente')
        return
    }
    let url = 'https://pauta.trt15.jus.br/pautaeletronica/pautaAudiencia.xhtml'
    let tarefa = id('buscaPautaEletronica')
    let execucao = Date.now()
    let nomeJanela = tarefa + '_' + execucao
    await armazenar ({[tarefa]: {execucao: execucao, oj: oj?.orgaoJulgador?.descricao, sala: sala}})
    window.open(url, nomeJanela)
}

async function pautaEletronicaAbriu() {
    let janela = confereJanela(JANELA.pautaEletronica)
    if (!janela) return
    let tarefa = id('buscaPautaEletronica')
    let janelaNome = window.name
    if (!janelaNome.includes(tarefa)) return
    let armazenamento = await obterArmazenamento(tarefa)
    let dado = armazenamento[tarefa]
    if (!janelaNome.includes(dado?.execucao)) return
    let jurisdicao = 'select[id="main:jurisdicao"]'
    await rotinaCliques(jurisdicao, dado?.oj)
    let local = 'select[id="main:local"]'
    await aguardarMudar(local)
    await rotinaCliques(local, dado?.oj)
    let sala = 'select[id="main:sala"]'
    await aguardarMudar(sala)
    await rotinaCliques(sala, dado?.sala)
    await suspender (1000)
    window.name = ''
    await removerArmazenamento(tarefa)
    document.querySelector('a[id="main:btnPautaDia"]').click()
    return

    async function aguardarMudar(local) {
        let i = 0
        while(!confereElemento(local)){
            await suspender(1000)
            i++
            if (i === 10) {
                fitaSuperiorErro('Ocorreu um erro. Proceda manualmente.')
                return
            }
        }
        return
        function confereElemento(seletor){
            let elemento = document.querySelector(seletor)
            let opcoes = [...elemento.querySelectorAll('option')]
            return opcoes.length > 1 ? true : false
        }
    }
    
    async function rotinaCliques(elemento, opcao){
        await aguardarElemento(elemento)
        await suspender(1000)
        let menu = document.querySelector(elemento)
        let opcoes = [...menu.querySelectorAll('option')]
        let opcaoEncontrada = opcoes.find(d => d.textContent == opcao || opcao.includes(d.textContent))
        menu.value = opcaoEncontrada?.value
        menu.dispatchEvent(new Event('change', { bubbles: true }))
    }
}



function fitaSuperiorErro(texto){
    if (typeof texto !== 'string') return
    rota_avisoObrigatorio(texto, 5)
    return
}

// ___________________________________________________
// [3] ABRE TAREFA DO ROTA EM JANELAS
// ___________________________________________________

async function abre_tarefa_rotaCriaBotao() {
    let nomeTarefaAtiva = await abre_tarefa_rotaNomeTarefaAtiva()
    let botaoTarefa = await criaBotaoAzul({
        id: 'rotapje-abre-tarefa-rota-botao',
        ancestral: 'rotapje_fita_superior',
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
    rota_iniciarFluxo({ fila: [{ numProc: processo, id, dadosLinha: [], params: [] }] })
}


// ___________________________________________________
// [4] IR PARA A OJ DESTE PROCESSO
// ___________________________________________________

async function irParaAOJDesteProcessoCriaBotao() {
    let id = 'rotapje-irParaAOJDesteProcesso' 
    let botaoTarefa = await criaBotaoLaranja({
        id: id + '_botao',
        ancestral: 'rotapje_fita_superior',
        acao: () => irParaAOJDesteProcesso(),
        texto: 'Ir para a OJ deste processo'
    })
    criaTooltip({
        id: id + '_tooltip',
        texto: 'Ir para a OJ atual deste processo',
        elemento: botaoTarefa
    })
    estiloBotaoFitaSuperior(botaoTarefa)
}

async function irParaAOJDesteProcesso() {
    let id = location.href.match(/\/pjekz\/processo\/(\d+)\/detalhe/)?.[1]
    let dados = await buscarProcesso(id)
    let oj = dados?.orgaoJulgador?.id || null
    if(!oj) {
        rota_avisoTemporario('Ocorreu um erro.', 'erro', 4000)
        return
    }
    //if(document.querySelector('pje-cabecalho-processo').textContent.includes(dados?.orgaoJulgador?.descricao)) {
    //    rota_avisoTemporario('Você já está na OJ deste processo.', 'info', 4000)
    //    return
    //}
    let perfis = await rota_fetch(location.origin + '/pje-seguranca/api/token/perfis')
    //console.log('%c[Rota PJE]%c perfis' + JSON.stringify(perfis), LOG.info, 'color:inherit')
    //return
    let perfil = perfis.find(el => el.idOrgaoJulgador === oj)
    if (!perfil) {
        rota_avisoTemporario('Ocorreu um erro.', 'erro', 4000)
        return
    }
    await fetch(location.origin + '/pje-seguranca/api/token/perfis/trocar', {
        method: 'POST',
        mode: 'cors',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/plain, */*',
            'X-XSRF-TOKEN': cookie_obter('Xsrf-Token') || cookie_obter('XSRF-TOKEN'),
        },
        body: JSON.stringify({ id_perfil: perfil.idPerfil })
    })
    window.location.reload()
}

// ___________________________________________________
// [5] TRAMITA IA RESUMO RÁPIDO
// ___________________________________________________

async function tramitaIAResumoRapido() {
    let idBotao = id('tramitaIAResumoRapido', 'botao')
    let botao = await criaBotaoAzul({
        id: idBotao,
        ancestral: 'rotapje_fita_superior',
        acao: () => tramitaIAResumoRapidoBusca(idBotao),
        texto: 'Tramita IA - Resumo rápido'
    })
    criaTooltip({
        id: id('tramitaIAResumoRapido', 'botao', 'tooltip'),
        texto: 'Apresenta um resumo rápido da tramitação do processo. Disponível apenas na CON1, por enquanto.',
        elemento: botao
    })
    estiloBotaoFitaSuperior(botao)
}

async function tramitaIAResumoRapidoBusca(idBotao) {
    document.getElementById(idBotao).disabled = true
    let ojs = [
        {
            oj: 'CON1',
            funcao: 'tramitaIAResumoRapidoCON1',
        }
    ]
    let mapaFuncoes = {
        tramitaIAResumoRapidoCON1
    }
    let funcao = null
    for(let oj of ojs){
        let ojAtual = document.querySelector('section.oj-cargo').textContent
        if(ojAtual.includes(oj?.oj)){
            funcao = oj?.funcao || null
        }
    }
    if (!funcao) {
        fitaSuperiorErro('Ainda não configurado para esta OJ.')
        document.getElementById(idBotao).disabled = false
        return
    }
    let resumo = montarResumo('carregando')
    if (resumo) {
        document.getElementById(idBotao).disabled = false
        return
    }
    let resposta = await mapaFuncoes[funcao]()
    console.log('%c[Rota PJE]%c resumos: ' + JSON.stringify(resposta), LOG.teste, 'color:inherit')
    montarResumo(resposta)
    document.getElementById(idBotao).disabled = false
    return

    
    function montarResumo(dados){
        let idDiv = id('tramitaIA', 'resumos')
        if (document.getElementById(idDiv)){
            if (document.getElementById(idDiv).style.display == 'none'){
                document.getElementById(idDiv).style.display = 'flex'
                return true
            } else {
                document.getElementById(idDiv)?.remove()
            }
        }
        let div = criaDiv({
            id: idDiv,
            ancestral: document.body
        })
        formataDiv(div, 'branco', '70%', '70%', 'fixed')
        let cabecalho = criaDiv({
            id: idDiv + '_cabecalho',
            ancestral: idDiv,
            rowColumn: 'row-reverse'
        })
        criaBotaoFechar({
            id: idDiv + '_fechar',
            ancestral: idDiv + '_cabecalho',
            elementoFechar: idDiv,
            esconder: true
        })
        let titulo = criaTitulo({
            id: idDiv + '_cabecalho_titulo',
            texto: 'Tramita IA',
            ancestral: idDiv + '_cabecalho',
        })
        titulo.style.width = '100%'
        let idCarregando = idDiv + '_carregando'
        if (dados === 'carregando'){
            let subtitulo = criaSubTitulo({
                id: idCarregando + '_texto',
                texto: 'Aguarde. Fazendo a consulta ao Chat-JT',
                ancestral: idDiv
            })
            subtitulo.style.fontSize = '20px'
            return null
        } else {
            document.getElementById(idCarregando)?.remove()
        }
        let idFundo = idDiv + '_fundo'
        let divFundo = criaDiv({
            id: idFundo,
            ancestral: idDiv,
            rowColumn: 'row'
        })
        divFundo.style.height = '100%'
        let idRolante = idDiv + '_rolante'
        let divRolante = criaDiv({
            id: idRolante,
            ancestral: idFundo,
        })
        divRolante.style.overflowY = 'auto'
        divRolante.style.width = '95%'
        divRolante.style.height = '95%'
        divRolante.style.left = '5px'
        let idDireita = idDiv + '_direita'
        let divDireita = criaDiv({
            id: idDireita,
            ancestral: idFundo
        })
        let rodape = criaDiv({
            id: idDiv + '_rodape',
            ancestral: idDiv
        })
        let i = 0
        for(let dado of dados){
            let {resposta, titulo} = dado
            criaSubTitulo({
                id: idDiv + '_titulo_' + i,
                texto: titulo,
                ancestral: idRolante
            })
            criaTexto({
                id: idDiv + '_resumo_' + i,
                ancestral: idRolante,
                texto: resposta
            })
            criaBotaoAzul({
                id: idDiv + '_botao_' + i,
                texto: titulo, 
                ancestral: idDireita,
                acao: () => document.getElementById(idDiv + '_titulo_' + i)?.scrollIntoView({block: 'nearest'})
            })
            i++
        }
        return null
    }
}



function estiloBotaoFitaSuperior(botao){
    botao.style.width = 'fit-content'
    botao.style.fontSize = '9px'
    botao.style.height     = '14px'
    botao.style.lineHeight = '14px'
    botao.style.padding    = '0 8px'
    botao.style.zIndex = '9999999'
}

async function peritosPreferidos(ancestral) {
    let idBotaoConfigura = id('fita_superior', 'peritosPreferidos')
    let botaoConfigura = criaBotaoAzul({
        id: idBotaoConfigura,
        texto: 'Cadastrar peritos preferidos',
        ancestral,
        acao: () => cadastrarPeritosPreferidos()
    })
    estiloBotaoFitaSuperior(botaoConfigura)
    
    async function cadastrarPeritosPreferidos(){
        let peritos = await obterArmazenamento(idBotaoConfigura) || []
        let divId = id('peritosPreferidos', 'cadastro')
        let div = criaDiv({
            id: divId,
            ancestral: document.body
        })
        formataDiv(div, 'branco', '50%', '50%')
        let divCabecalho = criaDiv({
            id: divId + '_cabecalho',
            ancestral: divId,
            rowColumn: 'row-reverse'
        })
        criaBotaoFechar({
            id: divId + '_botaoFechar',
            ancestral: divId,
            elementoFechar: divId,
        })
        criaTitulo({
            id: divId + '_titulo',
            ancestral: divId,
            texto: 'Cadastre seus peritos mais usados'
        })
        let textArea = criaInputAnotacao({
            id: divId + '_input',
            textoEmCima: 'Cadastre seus peritos mais usados, com respectivas especialidades, um por linha, separando a especialidade por vírgula.',
            ancestral: divId
        })
        textArea.style.width = '100%'
        if (peritos[idBotaoConfigura].length) alert(peritos)

    }
}
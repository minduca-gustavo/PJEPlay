// dá problema quando o interceptador dá errado, ou seja, quando não tem gigs concluídos, por exemplo.
// o domicilio eletronico é outra api.
//     ?pjerota_tarefa=_



const dadosTriagemInicial = {
    partes: null,
    processo: null,
    gig: null,
    salas: null,
    salaJuizes: null,
    horariosVagosPorSala: null,
    juizSimetriaPeloGig: null,
    peticaoInicialId: null,
    execucaoAtual: null,
    origin: location.origin,
    tarefaMaisRecente: null,
    recursos: null,
    
}
//__________________________________________________
//                      FUNÇÃO INICIAL
//__________________________________________________
async function triagem_inicial_aoAbrirDetalhesDoProcesso(){
    let tarefa = 'triagem_inicial'
    let janela = confereJanela(JANELA.detalhes)
    if (!janela) return
    let armazenamento = await obterArmazenamento(['rotaExecucaoAtual'])
    if (!armazenamento) return
    let execucao = String(armazenamento?.rotaExecucaoAtual || '')
    if (!execucao) return
    let tarefaParam = rota_buscarParametros('pjerota_tarefa')
    if (tarefaParam && !window.name.includes(tarefa)) window.name = window.name + '-' + tarefaParam + '-' + execucao
    if (!window.name.includes('rota') || !window.name.includes(tarefa)) return
    if (execucao !== window.name.split('-').pop()) return
    dadosTriagemInicial.execucaoAtual = execucao
    browser.storage.onChanged.addListener(obedecer)
    await triagem_inicial_janelaDetalhes(execucao)
}

triagem_inicial_aoAbrirDetalhesDoProcesso()

//__________________________________________________
//                      DETALHES DO PROCESSO 
//__________________________________________________

async function triagem_inicial_janelaDetalhes(sessao){
    await triagem_inicial_enviarParaRoteiroAssistente()
    let executar = await obterArmazenamento(['rota_triagem_inicial_janelaDetalhes'])
    if (executar.rota_triagem_inicial_janelaDetalhes === sessao) return

    
    await aguardarElemento('.tl-documento')
    let peticoes = [...document.getElementsByClassName('tl-documento')]
    let peticaoInicial = peticoes.find(p => p.textContent.includes('Petição Inicial('))
    let botaoAnexos    = document.querySelectorAll(seletorPorVersao('detalhesDoProcessoBotaoAbrirAnexos'))
    if (!peticaoInicial) return
    await clicar(peticaoInicial)
    let encontrouCabecalho = false
    for (let i = 0; i < 100; i++) {
        let cabecalho = await aguardarElemento('.mat-card-title')
        if (cabecalho.textContent.includes(dadosTriagemInicial.peticaoInicialId)) {
            encontrouCabecalho = true
            break
        }
        await suspender(300)
    }
    if (!encontrouCabecalho) return
    if (botaoAnexos[botaoAnexos.length - 1]){
        await clicar(botaoAnexos[botaoAnexos.length - 1])
    }
    await aguardarElemento('[aria-label*="Anexos"]')
    let ultimoDoc = await selecionar('.tl-documento', '', true) || []
    ultimoDoc[ultimoDoc.length - 1]?.scrollIntoView({ block: 'nearest' })
    await armazenar({rota_triagem_inicial_janelaDetalhes: sessao})
    await removerArmazenamento('pjerota_tarefa')
}

//__________________________________________________
//        OBTER DADOS E ENVIAR PARA ROTEIRO ASSISTENTE
//__________________________________________________

async function triagem_inicial_enviarParaRoteiroAssistente(){
    let idURLMatch = location.href.match(/\/processo\/(\d+)\/detalhe/);
    let idURL = idURLMatch?.[1]; // "2992885"
    let [timeline, gigs, gigs_concluidos, processo, recursos] = await Promise.all([
        interceptador_aguardar('timeline').then(() => interceptador_lerTimeline() || []),
        interceptador_aguardar('gigs').then(() => interceptador_lerGigs() || []),
        interceptador_aguardar('gigs_concluidos').then(() => interceptador_lerGigsConcluidos() || []),
        interceptador_aguardar('processo').then(() => interceptador_lerProcesso() || {}),
        interceptador_aguardar('recursos').then(() => interceptador_lerRecursos() || {}),
    ])
    gigs.push(...gigs_concluidos)
    let gig = gigs.find(gig => /GAB.*JU.*/i.test(gig?.tipoAtividade?.descricao || '')) ?? {}
    if (!gig?.tipoAtividade) {
        let gigsAPI = await buscarGigs(processo?.numero) || []
        gig = gigsAPI.find(g => /GAB.*JU.*/i.test(g?.tipoAtividade?.descricao || '')) ?? {}
    }
    let gigNormalizado = normalizar(gig?.tipoAtividade?.descricao)
    let juizSimetriaPeloGig = gigNormalizado.split(/ju[ií]za?/i, 2)[1]?.trim() || ''
    let peticaoInicialId = timeline[timeline.length - 1]?.idUnicoDocumento || ''
    let salas = await buscarSalas(processo?.orgaoJulgador?.id) || []
    let salaJuizes = []
    let sala = salas.find(sala => sala?.nome.includes(juizSimetriaPeloGig.toUpperCase())) || {}
    let horariosVagos = []
    if (sala.id) {
        horariosVagos = await buscarSalasHorariosVagos(sala.id) || []
    }
    let idBusca = processo.id || idURL
    if (!idBusca) return
    let partes = await buscarProcesso(idBusca, '/partes?retornaEndereco=true') || []
    
    dadosTriagemInicial.partes                  = partes
    dadosTriagemInicial.processo                = processo
    dadosTriagemInicial.gig                     = gig
    dadosTriagemInicial.salas                   = salas
    dadosTriagemInicial.sala                    = sala
    dadosTriagemInicial.salaJuizes              = salaJuizes
    dadosTriagemInicial.horariosVagos           = horariosVagos
    dadosTriagemInicial.juizSimetriaPeloGig     = juizSimetriaPeloGig
    dadosTriagemInicial.peticaoInicialId        = peticaoInicialId
    dadosTriagemInicial.recursos                = recursos
    
    await armazenar({ rota_dadosTriagemInicial: dadosTriagemInicial })
    await armazenar({ rota_dadosTriagemInicialNumero: processo.numero })
    await armazenar({ rota_dadosProntos: true })
}

async function triagem_inicial_atualizaJanelaDetalhes(){
    window.location.reload()
}

//__________________________________________________
//                      RETIFICAR
//__________________________________________________

// RETIFICAR PASSO 1 - recebe os dados e abre a tela de retificação

async function triagem_inicial_retificarAutuacao(tipo) {
    let envio = tipo.tipo
    await armazenar({
        'rota_pje_triagem_inicial_retificar': dadosTriagemInicial.execucaoAtual,
        'rota_pje_triagem_inicial_retificar_tipo': envio,
    })
    let parametros = '?rota_pje_triagem_inicial_retificar=' + dadosTriagemInicial.execucaoAtual + 
                    '&rota_pje_triagem_inicial_retificar_tipo=' + envio
    let nomeJanela = 'rota_pje_triagem_inicial_retificar_' + dadosTriagemInicial.execucaoAtual
    let id = dadosTriagemInicial?.processo?.id
    let url = location.origin + '/pjekz/processo/' + id + '/retificar' + parametros
    await abrirUrl(url, 'esquerdaAssistida', nomeJanela)
    //await alert(tipo + ' em desenvolvimento. ' + id)
}

// RETIFICAR PASSO 2 - verifica se a janela aberta é a da extensão

async function triagem_inicial_aoAbrirRetificar(){
    let janela = confereJanela(JANELA.retificar)
    if (!janela) return
    let parametros = await rota_buscarParametros('rota_pje_triagem_inicial_retificar')
    if (!parametros) return
    let armazenamento = await obterArmazenamento('rota_pje_triagem_inicial_retificar')
    if (!armazenamento) return
    let execucao = armazenamento?.rota_pje_triagem_inicial_retificar
    let nomeJanela = window.name
    if (!nomeJanela.includes('rota_pje_triagem_inicial_retificar')) return
    if(execucao !== parametros || execucao !== nomeJanela.split('_').pop()) return
    registrarListenerFechar(execucao)
    await triagem_inicial_acoesRetificar()
}

// RETIFICAR PASSO 3 - executa as ações

async function triagem_inicial_acoesRetificar(){
    let tipos = await obterArmazenamento(['rota_pje_triagem_inicial_retificar_tipo']) || await rota_buscarParametros('rota_pje_triagem_inicial_retificar_tipo')
    if (!tipos) return
    let tipo = tipos?.rota_pje_triagem_inicial_retificar_tipo ?? tipos
    let i = 0
    let elemento = null
    let seletor = null
    let seletorNome = null
    if (tipo == '100_Digital'){
        tipo = 'Características'
        seletorNome = 'retificacaoAutuacaoSeletorJuizoDigitalForm'
    }
    while (!elemento) {
        i++
        if (i > 10) break
        let elementos = [...await sel('retificacaoAutuacaoPrimeirosBotoes', '', true)]
        elemento = elementos.find(e => e.textContent.includes(tipo))
        if (!elemento) await suspender(1000)
    }
    if (!elemento) return
    await clicar(elemento)
    if (!seletorNome) return
    seletor = await aguardarElementoNovo(seletorNome)
    let seletorClique = await sel('retificacaoAutuacaoSeletorJuizoDigitalSlide', seletor)
    if (!seletorClique) return
    await clicar(seletorClique)
    let quadroJuizoDigital = await aguardarElementoNovo('retificacaoAutuacaoSeletorJuizoDigitalQuadro')
    let botoesContagem = 0
    let segundos = 30
    for (let i = 0; i < segundos * 2; i++){
        console.log('%c[Rota PJE]%c i' + JSON.stringify(i), LOG.rosa, 'color:inherit')
        await suspender(500)
        let botoesConfirmaJuizoDigital = await sel('retificacaoAutuacaoSeletorJuizoDigitalBotoes', quadroJuizoDigital, true)
        quadroJuizoDigital = await sel('retificacaoAutuacaoSeletorJuizoDigitalQuadro')
        if (!quadroJuizoDigital) await atualizaJanelaDetalhes(4000)
        for(botao of botoesConfirmaJuizoDigital){
            if (botao.textContent ==='Sim'){
                botoesContagem++
                await clicar(botao)
                if (botoesContagem == 2){
                    await atualizaJanelaDetalhes(4000)
                }
                if (i == segundos * 2) {
                    rota_avisoObrigatorio('Ocorreu um erro. Prossiga manualmente.', 5)
                    return
                }
                quadroJuizoDigital = await sel('retificacaoAutuacaoSeletorJuizoDigitalQuadro')
                if (i > 7 && !quadroJuizoDigital) await atualizaJanelaDetalhes()
            }
        }
    }
    async function atualizaJanelaDetalhes(timeout = 0){
        await suspender(timeout)
        comandar(['triagem_inicial_atualiza_janela_detalhes'], {triagem_inicial_atualiza_janela_detalhes: true})
        window.close()
        return
    }
}

triagem_inicial_aoAbrirRetificar()

//__________________________________________________
//                      DESPACHAR
//__________________________________________________

// DESPACHAR PASSO 1 - recebe os dados e abre a tela de tarefa

async function triagem_inicial_despachar(tipo) {
    let envio = tipo.tipo
    await armazenar({
        'rota_pje_triagem_inicial_despachar': dadosTriagemInicial.execucaoAtual,
        'rota_pje_triagem_inicial_despachar_tipo': envio,
    })
    let parametros =    '?rota_pje_triagem_inicial_despachar=' + dadosTriagemInicial.execucaoAtual + 
                        '&rota_pje_triagem_inicial_despachar_tipo=' + envio
    let nomeJanela =    'rota_pje_triagem_inicial_despachar_' + dadosTriagemInicial.execucaoAtual
    let id =            dadosTriagemInicial?.processo?.id
    let tarefa =        await buscarTarefaMaisRecente(id)
    let idTarefa =      tarefa[0]?.idTarefa || ''
    let recurso =       tarefa[0]?.nomeRecurso || ''
    if (!recurso || !idTarefa){
        await rota_avisoObrigatorio('Ocorreu um erro. Tente novamente.', 30)
        return
    }
    let page =          dadosTriagemInicial?.recursos?.find(r => r?.nome === recurso)
    if (!page?.caminhoRecurso){
        await rota_avisoObrigatorio('Ocorreu um erro. Tente novamente.', 30)
        return
    }
    let url =           location.origin + '/pjekz/processo/' + id + '/tarefa/' + idTarefa + page?.caminhoRecurso.split('{idTarefa}')[1] + parametros
    let setorProcesso = await aguardarElementoNovo('detalhesDoProcessoOJDoProcesso')
    if (!setorProcesso.textContent.includes('CON1')) {
        await rota_avisoObrigatorio('Esta funcionalidade deve ser executada em processos que estão na CON1.', 30)
        return
    }
    await abrirUrl(url, 'esquerdaAssistida', nomeJanela)
}

// DESPACHAR PASSO 2 - verifica se a janela aberta é a da extensão
async function triagem_inicial_aoAbrirDespachar(){
    let janela = confereJanela(JANELA.processoTarefa)
    if (!janela) return
    let armazenamento = await obterArmazenamento('rota_pje_triagem_inicial_despachar')
    let execucao = String(armazenamento?.rota_pje_triagem_inicial_despachar || '')
    if (!armazenamento) return
    let nomeJanela = window.name
    if (!nomeJanela.includes('rota_pje_triagem_inicial_despachar')) return
    if(execucao !== nomeJanela.split('_').pop()) return
    registrarListenerFechar(execucao)
    await triagem_inicial_acoesDespachar()
}

// DESPACHAR PASSO 3 - executa as ações

async function triagem_inicial_acoesDespachar(){
    let [tipo, juizEnvio, numeroProcesso] = await Promise.all([
        obterArmazenamento('rota_pje_triagem_inicial_despachar_tipo').then(dados => dados?.rota_pje_triagem_inicial_despachar_tipo || ''),
        obterArmazenamento('rota_dadosTriagemInicial').then(dados => dados?.rota_dadosTriagemInicial?.juizSimetriaPeloGig || ''),
        obterArmazenamento('rota_dadosTriagemInicial').then(dados => dados?.rota_dadosTriagemInicial?.processo?.numero || '')
    ])
    if(!juizEnvio) {
        juizEnvio = await modelo_buscarJuizesNoModelo(numeroProcesso) || ''
    }
    let tarefa = await aguardarElementoNovo('tarefaDoProcessoTituloDaTarefa')
    let dados = await obterArmazenamento('rota_dadosTriagemInicial')
    let id = dados?.rota_dadosTriagemInicial?.processo?.id
    let audienciasMarcadas = await buscarAudienciasMarcadas(id) || {}
    let tipoAudiencia = audienciasMarcadas?.tipo?.descricao || ''
    let tiposAudiencia = {
        'Inicial por videoconferência': 'SCBAU_TI_INI_ORD',
        'Inicial por videoconferência (rito sumaríssimo)': 'SCBAU_TI_INI_SUM'
    }
    let modeloDespacho = ''
    if (tipo !== 'triagem_inicial_emendar'){
        modeloDespacho = tiposAudiencia[tipoAudiencia] || 'SCBAU_TI_INI_ORD'
    }
    await movimentar('Despacho', {
        'Conclusão ao magistrado':{'juiz': juizEnvio},
        'Elaborar despacho':{'modelo': modeloDespacho}
    })
    if (modeloDespacho !== ''){
        let elaborarDespachoBotaoEnviarParaAssinatura = await aguardarElementoNovo('elaborarDespachoBotaoEnviarParaAssinatura')
        await clicar(elaborarDespachoBotaoEnviarParaAssinatura)
        for(let i = 0; i < 30 * 2; i++){
            let assinar = await sel('tarefaDoProcessoTituloDaTarefa')
            if (assinar.textContent.includes('Assinar despacho')){
                break
            }
            await suspender(500)
        }
        await suspender(2000)
        if (audienciasMarcadas?.dataInicio) {
            await armazenar({rota_acoes_conjuntas_triagem_inicial_pronta: 'triagem_inicial_despachar'})
            window.close()
        } else{ 
            await rota_avisoObrigatorio('Não foi identificada audiência designada. Prossiga manualmente.', 30)
        }
        // chamada da ação conjunta
    }
    let emAndamento = await obterArmazenamento(['rota_acoes_conjuntas_triagem_inicial_em_andamento'])
    let chamadaPorAcaoConjunta = emAndamento?.rota_acoes_conjuntas_triagem_inicial_em_andamento === 'triagem_inicial_despachar'
    if (chamadaPorAcaoConjunta || tipo !== 'triagem_inicial_emendar') {
        await criaDivFlutuante({
            id: 'rota_triagem_inicial_acoes_conjuntas_flutuante',
            titulo: 'Execute o necessário e clique em próximo.'
        })
        await criaBotaoLaranja({
            texto: '▶️ Próximo',
            id: 'rota_triagem_inicial_acoes_conjuntas_flutuante_botao',
            ancestral: 'rota_triagem_inicial_acoes_conjuntas_flutuante',
            acao: () => armazenar({ rota_acoes_conjuntas_triagem_inicial_pronta: 'triagem_inicial_despachar' })
        })
    }
    // Se for ação conjunta, aqui tem que ter uma chamada pra uma função que vai criar o botão próximo, ou então a própria chamada da ação conjunta
    return

}


triagem_inicial_aoAbrirDespachar()

//__________________________________________________
//                      DESIGNAR AUDIÊNCIA
//__________________________________________________

// DESIGNAR AUDIÊNCIA PASSO 1 - recebe os dados e abre a tela de tarefa

async function triagem_inicial_designarAudiencia(tipo) {
    //alert (JSON.stringify(tipo))
    //return
    await armazenar({
        'rota_pje_triagem_inicial_designa_audiencia_tipo': tipo,
        'rota_pje_triagem_inicial_designa_audiencia': dadosTriagemInicial.execucaoAtual
    })
    let parametros =    '?rota_pje_triagem_inicial_designa_audiencia=' + dadosTriagemInicial.execucaoAtual
    let nomeJanela =    'rota_pje_triagem_inicial_designa_audiencia_' + dadosTriagemInicial.execucaoAtual
    let setorProcesso = await aguardarElementoNovo('detalhesDoProcessoOJDoProcesso')
    if (!setorProcesso.textContent.includes('CON1')) {
        await rota_avisoObrigatorio('Esta funcionalidade deve ser executada em processos que estão na CON1.', 30)
        return
    }
    let url = location.origin + '/pjekz/pauta-audiencias' + parametros
    await abrirUrl(url, 'esquerdaAssistida', nomeJanela)
}

/*
{"horario":{
    "idTipoAudiencia":21,
    "descricaoTipoAudiencia":"Inicial por videoconferência",
    "codigoTipoAudiencia":"7699",
    "horarioInicial":"2026-08-11T09:30:00",
    "horarioFinal":"2026-08-11T09:45:00",
    "qtdDias":47,"diaUtil":"2026-08-11",
    "processo":"0010861-27.2026.5.15.0055",
    "nomeDaSala":"ERIKA RODRIGUES PEDREUS MORETE"
    }
}
*/

// DESIGNAR AUDIÊNCIA PASSO 2 - verifica se a janela aberta é a da extensão
async function triagem_inicial_aoAbrirDesignarAudiencia(){
    
    let janela = confereJanela(JANELA.pautaAudiencias)
    if (!janela) return
    let armazenamento = await obterArmazenamento('rota_pje_triagem_inicial_designa_audiencia')
    let execucao = String(armazenamento?.rota_pje_triagem_inicial_designa_audiencia || '')
    if (!armazenamento) return
    let nomeJanela = window.name
    if (!nomeJanela.includes('rota_pje_triagem_inicial_designa_audiencia')) return
    if(execucao !== nomeJanela.split('_').pop()) return
    registrarListenerFechar(execucao)
    await triagem_inicial_acoesDesignarAudiencia()
}

// DESIGNAR AUDIÊNCIA PASSO 3 - executa as ações

async function triagem_inicial_acoesDesignarAudiencia(){
    let dados = await obterArmazenamento('rota_pje_triagem_inicial_designa_audiencia_tipo')
    let buscaLink = await obterArmazenamento('rota_triagem_inicial_linkDaAudiencia')
    let link = buscaLink?.rota_triagem_inicial_linkDaAudiencia || ''
    
    //if (!dados) return
    if (dados?.rota_pje_triagem_inicial_designa_audiencia_tipo?.horario?.tipo == 'manual'){
        await triagem_inicial_acoesDesignarAudienciaManual('manual')
        return
    }
    let horario = dados?.rota_pje_triagem_inicial_designa_audiencia_tipo?.horario || ''
    if (!horario) {
        await triagem_inicial_acoesDesignarAudienciaManual('erro')
        return
    }
    if (link) horario.link = link
    await aguardarElementoNovo('pautaDeAudienciaCelulaDaTabela')
    await aguardarElementoNovo('pautaDeAudienciaSeletorDeJuiz')
    
   
    await triagem_inicial_acoesDesignarAudienciaAutomaticamente(horario)
    

}

// DESIGNAR AUDIÊNCIA - AÇÕES AUXILIARES

async function triagem_inicial_acoesDesignarAudienciaManual(manualOuErro) {
    let [tipo, aviso] = [null, null]
    if (manualOuErro == 'erro') {
        tipo  = 'erro'
        aviso = 'Ocorreu um erro. Designe manualmente a audiência.'
    } else {
        tipo  = 'info'
        aviso = 'Designe manualmente a audiência.'
    }
    let dados = await obterArmazenamento('rota_pje_triagem_inicial_designa_audiencia_tipo')
    let processo = dados?.rota_pje_triagem_inicial_designa_audiencia_tipo?.horario?.processo
    let sala = dados?.rota_pje_triagem_inicial_designa_audiencia_tipo?.horario?.sala
    let link = dados?.rota_pje_triagem_inicial_designa_audiencia_tipo?.horario?.link
    let emAndamento = await obterArmazenamento(['rota_acoes_conjuntas_triagem_inicial_em_andamento'])
    let chamadaPorAcaoConjunta = emAndamento?.rota_acoes_conjuntas_triagem_inicial_em_andamento === 'triagem_inicial_designa_audiencia'
    if (chamadaPorAcaoConjunta) {
        await criaDivFlutuante({
            id: 'rota_triagem_inicial_acoes_conjuntas_flutuante',
            titulo: 'Execute o necessário e clique em próximo.'
        })
        await criaBotaoLaranja({
            texto: '▶️ Próximo',
            id: 'rota_triagem_inicial_acoes_conjuntas_flutuante_botao',
            ancestral: 'rota_triagem_inicial_acoes_conjuntas_flutuante',
            acao: async () => {
                await armazenar({ rota_acoes_conjuntas_triagem_inicial_pronta: 'triagem_inicial_designa_audiencia' })
                window.close()
            }
        })
    }
    let seletorJuiz = await aguardarElementoNovo('pautaDeAudienciaSeletorDeJuiz')
    let metaQuadroDeHorarios
    if (seletorJuiz.textContent != sala){
        await clicar(seletorJuiz)
        await aguardarElementoNovo('pautaDeAudienciaSeletorDeJuizAberto')
        let juizes = [...(await sel ('pautaDeAudienciaSeletorDeJuizOpcoes', '', true))]
        let juizSelecionado = juizes.find(j => j.textContent?.trim() == sala)
        if (!juizSelecionado){
            await rota_avisoObrigatorio('Ocorreu um erro. Prossiga manualmente.', 30)
            return
        }
        metaQuadroDeHorarios = await sel('pautaDeAudienciaMetaQuadroHorariosVagos')
        await clicar(juizSelecionado)
    }
    rota_avisoObrigatorio(aviso, 15)
    await aguardarElementoNovo(['pautaDeAudienciaInputNumeroProcessoDesignarAudiencia', 'pautaDeAudienciaInputLinkDesignarAudiencia'], {modo: 'e', timeout: 10 * 60 * 1000})
    let inputNumeroProcesso = await aguardarElementoNovo('pautaDeAudienciaInputNumeroProcessoDesignarAudiencia')
    await preencher(inputNumeroProcesso, processo)
    let inputLinkAudiencia = await aguardarElementoNovo('pautaDeAudienciaInputLinkDesignarAudiencia')
    await preencher(inputLinkAudiencia, link)
    return
}

async function triagem_inicial_acoesDesignarAudienciaAutomaticamente(horario) {    
    // selecionar juiz
    let seletorJuiz = await sel('pautaDeAudienciaSeletorDeJuiz')
    let metaQuadroDeHorarios
    if (seletorJuiz.textContent != horario.nomeDaSala){
        await clicar(seletorJuiz)
        await aguardarElementoNovo('pautaDeAudienciaSeletorDeJuizAberto')
        let juizes = [...(await sel ('pautaDeAudienciaSeletorDeJuizOpcoes', '', true))]
        let juizSelecionado = juizes.find(j => j.textContent?.trim() == horario.nomeDaSala)
        if (!juizSelecionado){
            await rota_avisoObrigatorio('Ocorreu um erro. Prossiga manualmente.', 30)
            return
        }
        
        monitorarBody(6000, 100)
        metaQuadroDeHorarios = await sel('pautaDeAudienciaMetaQuadroHorariosVagos')
        await clicar(juizSelecionado)
    }
    if (metaQuadroDeHorarios){
        await aguardarElementoMudar(metaQuadroDeHorarios,'content')
    } else {
        await aguardarElementoNovo('pautaDeAudienciaMetaQuadroHorariosVagos')
    }
    //return
    //// clicar no botao do primeiro dia
    //await aguardarElementoNovo(['pautaDeAudienciaCelulaDaTabela', 'pautaDeAudienciaMetaQuadroHorariosVagos'], {modo: 'e'})
    //return
    let celulas = [...(await sel('pautaDeAudienciaCelulaDaTabela', '', true))]
    let celula = celulas.find(c=> c.ariaLabel && !c.ariaLabel.includes('não útil'))
    if (!celula){
        await rota_avisoObrigatorio('Ocorreu um erro. Prossiga manualmente.', 30)
        return
    }
    await suspender(500)
    await clicar(celula)

    // clicar no botao de designar

    let botaoDesignar = await aguardarElementoNovo('pautaDeAudienciaBotaoDesignarAudiencia')
    await clicar(botaoDesignar)

    //preencher dados do processo e da audiencia
    let confirmacaoSala = await aguardarElementoNovo('pautaDeAudienciaConfirmacaoSala')
    if (!confirmacaoSala.textContent.includes(horario.nomeDaSala)){
        await rota_avisoObrigatorio('Ocorreu um erro. Prossiga manualmente.', 30)
        return
    }
    let inputNumeroProcesso = await aguardarElementoNovo('pautaDeAudienciaInputNumeroProcessoDesignarAudiencia')
    await preencher(inputNumeroProcesso, horario.processo)
    let inputLinkAudiencia = await aguardarElementoNovo('pautaDeAudienciaInputLinkDesignarAudiencia')
    await preencher(inputLinkAudiencia, horario.link)
    let dataAudiencia = new Date(horario.horarioInicial).toLocaleDateString('pt-BR')
    let pautaDeAudienciaInputDataDesignarAudiencia = await aguardarElementoNovo('pautaDeAudienciaInputDataDesignarAudiencia')
    let horarioInicial = horario.horarioInicial.split('T')[1].split(':')[0] + ':' + horario.horarioInicial.split('T')[1].split(':')[1]
    await preencher(pautaDeAudienciaInputDataDesignarAudiencia, dataAudiencia)
    let pautaDeAudienciaInputHorarioDesignarAudiencia = await aguardarElementoNovo('pautaDeAudienciaInputHorarioDesignarAudiencia')
    await preencher(pautaDeAudienciaInputHorarioDesignarAudiencia, horarioInicial)
    let pautaDeAudienciaInputTipoDesignarAudiencia = await aguardarElementoNovo('pautaDeAudienciaInputTipoDesignarAudiencia')
    await clicar(pautaDeAudienciaInputTipoDesignarAudiencia)
    await aguardarElementoNovo('pautaDeAudienciaOpcoesTipoAudienciaDesignarAudienciaAberto')
    await clicar('[name="' + horario.descricaoTipoAudiencia + '"]')
    
    // clicar no botao de confirmar - alterar depois para CONFIRMAR

    let botoesDesignar = [...(await sel('pautaDeAudienciaBotoesConfirmarCancelarDesignarAudiencia', '', true))]
    let botaoConfirmar = botoesDesignar.find(b => b.textContent.includes('Confirmar'))
    if (!botaoConfirmar){
        await rota_avisoObrigatorio('Ocorreu um erro. Prossiga manualmente.', 30)
        return
    }
    await suspender(1000)
    //let botaoConfirmar = botoesDesignar.find(b => b.textContent.includes('Confirmar'))
    await clicar(botaoConfirmar)
    await aguardarElementoNovo('pautaDeAudienciaBotaoFecharDesignacaoDeAudiencia')
    await suspender(2000)
    await armazenar({ rota_acoes_conjuntas_triagem_inicial_pronta: 'triagem_inicial_designa_audiencia' })
    window.close()
    return
}

triagem_inicial_aoAbrirDesignarAudiencia()

//__________________________________________________
//                      COLOCAR GIG DE ACOMPANHAMENTO
//__________________________________________________

async function triagem_inicial_colocarGigDeAcompanhamento() {
    let id = await obterArmazenamento('rota_dadosTriagemInicial').then(dados => dados?.rota_dadosTriagemInicial?.processo?.id || '')
    let audienciaMarcadaHorario = await buscarAudienciasMarcadas(id).then(dados=> dados?.dataInicio || '')
    let audienciaMarcadaNumero = audienciaMarcadaHorario ? new Date(audienciaMarcadaHorario).getTime() : NaN
    let hoje = new Date().getTime()
    let trintaDiasAntes = audienciaMarcadaNumero - 30 * 24 * 60 * 60 * 1000
    let dataGig
    if (hoje < trintaDiasAntes) {
        dataGig = new Date(trintaDiasAntes).toLocaleDateString('pt-BR')
    } else if (audienciaMarcadaNumero - hoje < 10 * 24 * 60 * 60 * 1000) {
        dataGig = new Date(audienciaMarcadaNumero).toLocaleDateString('pt-BR')
    } else {
        dataGig = new Date(hoje + 10 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')
    }
    let usuarioObter = await obterArmazenamento('rota_usuario')
    let usuario = usuarioObter?.rota_usuario.nome || ''
    let mostrarOuEsconder = await aguardarElementoNovo('detalhesDoProcessoMostrarOuEsconderGigs')
    if (mostrarOuEsconder.ariaLabel == 'Mostrar o GIGS') await clicar(mostrarOuEsconder)
    await aguardarElementoNovo('detalhesDoProcessoBotaoNovaAtividadeGigs')
    await inserirGigsNaTelaDeDetalhesDoProcesso('Audiência', dataGig, '', usuario.trim().toUpperCase(), 'Acompanhamento - Triagem Inicial', 'sim')
    //rota_avisoTemporario(JSON.stringify(dataGig), tipo = 'info', ms = 2000)
}


//__________________________________________________
//                      CERTIFICAR
//__________________________________________________

// CERTIFICAR PASSO 1 - recebe os dados e abre a tela de tarefa

async function triagem_inicial_certificar(tipo) {
    let envio = tipo.tipo
    await armazenar({
        'rota_pje_triagem_inicial_certificar': dadosTriagemInicial.execucaoAtual,
        'rota_pje_triagem_inicial_certificar_tipo': tipo,
    })
    let parametros =    '?rota_pje_triagem_inicial_certificar=' + dadosTriagemInicial.execucaoAtual + 
                        '&rota_pje_triagem_inicial_certificar_tipo=' + envio
    let nomeJanela =    'rota_pje_triagem_inicial_certificar_' + dadosTriagemInicial.execucaoAtual
    let setorProcesso = await aguardarElementoNovo('detalhesDoProcessoOJDoProcesso')
    if (!setorProcesso.textContent.includes('CON1')) {
        await rota_avisoObrigatorio('Esta funcionalidade deve ser executada em processos que estão na CON1.', 30)
        return
    }
    let id =            dadosTriagemInicial?.processo?.id
    let url =           location.origin + '/pjekz/processo/' + id + '/documento/anexar' + parametros
    await abrirUrl(url, 'esquerdaAssistida', nomeJanela)
}

// CERTIFICAR PASSO 2 - verifica se a janela aberta é a da extensão
async function triagem_inicial_aoAbrirCertificar(){
    let janela = confereJanela(JANELA.certificar)
    if (!janela) return
    let armazenamento = await obterArmazenamento('rota_pje_triagem_inicial_certificar')
    let execucao = String(armazenamento?.rota_pje_triagem_inicial_certificar || '')
    if (!armazenamento) return
    let nomeJanela = window.name
    if (!nomeJanela.includes('rota_pje_triagem_inicial_certificar')) return
    if(execucao !== nomeJanela.split('_').pop()) return
    registrarListenerFechar(execucao)
    await triagem_inicial_acoesCertificar()
}

// CERTIFICAR PASSO 3 - executa as ações

async function triagem_inicial_acoesCertificar(){
    let tipos = await obterArmazenamento('rota_pje_triagem_inicial_certificar_tipo')
    let tipoCertidao = tipos?.rota_pje_triagem_inicial_certificar_tipo?.tipo
    let link = tipos?.rota_pje_triagem_inicial_certificar_tipo?.link
    console.log('%c[Rota PJE]%c tipoCertidao: ' + JSON.stringify(tipoCertidao), LOG.rosa, 'color:inherit')
    let elementos = await aguardarElementoNovo(
        [
            'detalhesDoProcessoInputTipoDeDocumento',
            'detalhesDoProcessoInputDescricaoDeDocumento',
            'anexarDocumentosBuscarModelos'
        ],
        {modo: 'e', timeout: 10000}
    )
    
    if (!elementos) return
    let tipo = await sel('detalhesDoProcessoInputTipoDeDocumento')
    let descricao = await sel('detalhesDoProcessoInputDescricaoDeDocumento')
    let campoModelo = await sel('anexarDocumentosBuscarModelos')
    let certidoes = {
        'triagem_inicial_certificar_designacao': {
            modelo: 'SCBAU_TI_CERT', 
            tipo: 'Certidão', 
            descricao: 'Designação de audiência', 
            intimar: 'triagem_inicial_intimar_designacao'
        },
        'triagem_inicial_certificar_novo_link_e_intimar': {
            texto: 'Certifico o novo link da audiência, conforme segue:\n' + link, 
            tipo: 'Certidão', 
            descricao: 'Certifica NOVO LINK',
            intimar: {tipo: 'triagem_inicial_intimar_link', link: link}
        }
    }
    let dados = certidoes[tipoCertidao]
    await suspender(200)
    await preencherCampoComEscolhaDeOpcao(tipo, dados.tipo)
    await suspender(200)
    await preencher(descricao, dados.descricao)
    if (dados.modelo){
        await suspender(200)
        await digitarNoInput(campoModelo, dados.modelo)
        await selecionarOpcaoDeModelo(dados.modelo)
        await esperarEClicar('elaborarDespachoInserirModelo')
    } else if (dados.texto){
        let campoTexto = await aguardarElementoNovo('elaborarAtoConteudoPrincipalDaMinuta')
        await preencherCKEditorExecCommand(campoTexto, dados.texto)
    } else {
        rota_avisoObrigatorio('Prossiga manualmente.', 5)
        return
    }
    let botaoAssinar = await aguardarElementoNovo('anexarDocumentosBotaoAssinar')
    await clicar(botaoAssinar)
    monitorarBody(6000, 100)
    if (dados.intimar){
        window.addEventListener('beforeunload', () => {
            comandar(['triagem_inicial_intimar'], [{tipo: dados.intimar}])
        })
    }
    await suspender(2000)
    return
}


triagem_inicial_aoAbrirCertificar()
//__________________________________________________
//                      INTIMAR
//__________________________________________________

// INTIMAR PASSO 1 - recebe os dados e abre a tela de tarefa

async function triagem_inicial_intimar(tipo) {
    let id = dadosTriagemInicial?.processo?.id
    let audienciaMarcadaTipo = await buscarAudienciasMarcadas(id).then(dados=> dados?.tipo?.descricao || '')
    let envio = tipo.tipo
    await armazenar({
        'rota_pje_triagem_inicial_intimar': dadosTriagemInicial.execucaoAtual,
        'rota_pje_triagem_inicial_intimar_tipo': tipo,
        'rota_pje_triagem_inicial_intimar_audienciaMarcadaTipo': audienciaMarcadaTipo,
    })
    let parametros =    '?rota_pje_triagem_inicial_intimar=' + dadosTriagemInicial.execucaoAtual + 
                        '&rota_pje_triagem_inicial_intimar_tipo=' + envio
    let nomeJanela =    'rota_pje_triagem_inicial_intimar_' + dadosTriagemInicial.execucaoAtual
    let url =           location.origin + '/pjekz/processo/' + id + '/comunicacoesprocessuais/minutas' + parametros
    await abrirUrl(url, 'esquerdaAssistida', nomeJanela)
}



// INTIMAR PASSO 2 - verifica se a janela aberta é a da extensão
async function triagem_inicial_aoAbrirIntimar(){
    let janela = confereJanela(JANELA.pec)
    if (!janela) return
    let armazenamento = await obterArmazenamento('rota_pje_triagem_inicial_intimar')
    let execucao = String(armazenamento?.rota_pje_triagem_inicial_intimar || '')
    if (!armazenamento) return
    let nomeJanela = window.name
    if (!nomeJanela.includes('rota_pje_triagem_inicial_intimar')) return
    if(execucao !== nomeJanela.split('_').pop()) return
    registrarListenerFechar(execucao)
    await triagem_inicial_acoesIntimar()
}

// INTIMAR PASSO 3 - executa as ações

async function triagem_inicial_acoesIntimar(){
    let tiposIntimar = await obterArmazenamento('rota_pje_triagem_inicial_intimar_tipo')
    let tipoIntimar = tiposIntimar?.rota_pje_triagem_inicial_intimar_tipo?.tipo.tipo
    let linkIntimar = tiposIntimar?.rota_pje_triagem_inicial_intimar_tipo?.tipo.link
    console.log('%c[Rota PJE]%c tipos: ' + JSON.stringify(tiposIntimar), LOG.rosa, 'color:inherit', tiposIntimar)
    console.log('%c[Rota PJE]%c tipos: ' + JSON.stringify(tipoIntimar), LOG.rosa, 'color:inherit', tipoIntimar)
    console.log('%c[Rota PJE]%c tipos: ' + JSON.stringify(linkIntimar), LOG.rosa, 'color:inherit', linkIntimar)
    return
    await aguardarElementoNovo(
        [
            'prepararExpedientesSeletorTipoDeExpediente',
            'prepararExpedientesBotaoConfeccionarAtoAgrupado',
        ],
        {modo: 'e', timeout: 10000}
    )
    //logInterceptador = false
    
    let seletor = await sel('prepararExpedientesSeletorTipoDeExpediente')
    await clicar(seletor)
    await aguardarElementoNovo('prepararExpedientesSeletorTipoDeExpedienteAberto')
    let opcao = [...await sel('prepararExpedientesSeletorTipoDeExpedienteAberto', '', true)].find(o => o.textContent.trim().includes('Notificação inicial'))
    await clicar(opcao)
    let botaoConfeccionar = await aguardarElementoNovo('prepararExpedientesBotaoConfeccionarAtoAgrupado')
    await clicar(botaoConfeccionar)
    await aguardarElementoNovo(
        [
            'elaborarAtoSeletorTipoDeDocumento',
            'elaborarAtoInputDescricao'
        ],
        {modo: 'e', timeout: 10000}
    )
    let descricao = await sel('elaborarAtoInputDescricao')
    let inputModelo = await sel('elaborarDespachoBuscarModelos')
    await preencher(descricao, 'Notificação Inicial - Designação de audiência')
    await suspender(200)
    let areaAssinatura = await aguardarElementoNovo('elaborarAtoCampoAssinaturaOpcional')
    await preencherCKEditorExecCommand(areaAssinatura, '.')
    await suspender(200)
    let conteudoPrincipal = await aguardarElementoNovo('elaborarAtoConteudoPrincipalDaMinuta')
    await focar(conteudoPrincipal)
    await suspender(200)
    let tipoAudiencia = await obterArmazenamento('rota_pje_triagem_inicial_intimar_audienciaMarcadaTipo').then(dados => dados?.rota_pje_triagem_inicial_intimar_audienciaMarcadaTipo || '')
    let tipos = [
        {tipo:'inicial', modelo:'SCBAU_TI_NOT_INI'},
        {tipo:'una', modelo:'SCBAU_TI_NOT_UNA'}
    ]
    let modelo = tipos.find(t => tipoAudiencia.toLowerCase().includes(t.tipo))?.modelo || null
    if (!modelo){
        await rota_avisoObrigatorio('Ocorreu um erro. Prossiga manualmente.', 15)
        window.addEventListener('beforeunload', () => {
            comandar(['triagem_inicial_aguardando_audiencia'], [{tipo: 'triagem_inicial_aguardando_audiencia'}])
        })
        return
    }
    await digitarNoInput(inputModelo, modelo)
    await selecionarOpcaoDeModelo(modelo)
    await suspender(200)
    await esperarEClicar('elaborarDespachoInserirModelo')
    await suspender(200)
    let botaoFinalizarMinuta = await aguardarElementoNovo('elaborarAtoFinalizarMinuta')
    await clicar(botaoFinalizarMinuta)
    
    //monitorarBody(6000, 300, {incluir:{classes:['snack-bar']}})
    await aguardarElementoNovo('prepararExpedientesMensagemModeloInserido', {texto:'Modelo de documento inserido com sucesso no editorX'})
    let i = 0
    while (await sel('prepararExpedientesMensagemModeloInserido')){
        await suspender(500)
        if (i++ > 3 * 2) break
    }
    //for(let i = 0; i < 30 * 2; i++){
    //    let metaConfere = await interceptador_ler('expedientes_materia')
    //    await suspender(500)
    //    if (metaConfere !== metaExpedientes) break
    //    if (i==30) return rota_avisoTemporario('Ocorreu um erro. Prossiga manualmente.', 'erro', 15 * 1000)
    //}
    //await suspender(200)
    //await aguardarElementoNovo('prepararExpedientesAtoConfeccionado')
    //metaExpedientes = await interceptador_ler('expedientes_materia') || null
    let botaoPoloAtivo = await aguardarElementoNovo('prepararExpedientesBotaoPoloAtivo')
    //logInterceptador = true
    let metaExpedientes = await interceptador_ler('expedientes_materia') || null
    await clicar(botaoPoloAtivo)
    //monitorarBody(6000, 500, {incluir:{classes:['mat-select']}})
    let verificarCarregamentoDestinatario = await aguardarElementoNovo('prepararExpedientesVerificarCarregamentoDestinatario', {texto:'Notificação inicialTipo de Expediente'})
    i = 0
    while (verificarCarregamentoDestinatario.isConnected){
        await suspender(500)
        if (i++ > 3 * 2) break
    }
    //await suspender(500)
    let botaoSalvar = await aguardarElementoNovo('prepararExpedientesBotaoSalvar')
    let botaoAssinar = (await aguardarElementoNovo('prepararExpedientesBotaoAssinar'))
    
    await clicar(botaoSalvar)
    let verificarCarregamentoSalvar = await aguardarElementoNovo('prepararExpedientesRodinhaGirando')
    while (verificarCarregamentoSalvar.isConnected){
        await suspender(500)
    }
    await clicar(botaoAssinar)
    window.addEventListener('beforeunload', () => {
        comandar(['triagem_inicial_aguardando_audiencia'], [{tipo: 'triagem_inicial_aguardando_audiencia'}])
    })
    monitorarBody(6000, 100)
    await aguardarElementoNovo('prepararExpedientesMensagemModeloInserido', {texto:'Expediente(s) assinado(s) com sucesso.X'})
    await suspender(1500)
    window.close()
    
}


triagem_inicial_aoAbrirIntimar()
//__________________________________________________
//                      ENCAMINHAR PARA AGUARDANDO AUDIÊNCIA
//__________________________________________________

// ENCAMINHAR PARA AGUARDANDO AUDIÊNCIA PASSO 1 - recebe os dados e abre a tela de tarefa

async function triagem_inicial_aguardandoAudiencia(tipo) {
    let id =            dadosTriagemInicial?.processo?.id
    let tarefa =        await buscarTarefaMaisRecente(id)
    let idTarefa =      tarefa[0]?.idTarefa || ''
    let recurso =       tarefa[0]?.nomeRecurso || ''
    let parametros =    '?rota_pje_triagem_inicial_aguardandoAudiencia=' + dadosTriagemInicial.execucaoAtual
    let nomeJanela =    'rota_pje_triagem_inicial_aguardandoAudiencia_' + dadosTriagemInicial.execucaoAtual
    await armazenar({'rota_pje_triagem_inicial_aguardandoAudiencia': dadosTriagemInicial.execucaoAtual})
    if (!recurso || !idTarefa){
        await rota_avisoObrigatorio('Ocorreu um erro. Tente novamente.', 30)
        return
    }
    let page =          dadosTriagemInicial?.recursos?.find(r => r?.nome === recurso)
    if (!page?.caminhoRecurso){
        await rota_avisoObrigatorio('Ocorreu um erro. Tente novamente.', 30)
        return
    }
    let url =           location.origin + '/pjekz/processo/' + id + '/tarefa/' + idTarefa + page?.caminhoRecurso.split('{idTarefa}')[1] + parametros
    let setorProcesso = await aguardarElementoNovo('detalhesDoProcessoOJDoProcesso')
    if (!setorProcesso.textContent.includes('CON1')) {
        await rota_avisoObrigatorio('Esta funcionalidade deve ser executada em processos que estão na CON1.', 30)
        return
    }
    await abrirUrl(url, 'esquerdaAssistida', nomeJanela)
    
}



// ENCAMINHAR PARA AGUARDANDO AUDIÊNCIA PASSO 2 - verifica se a janela aberta é a da extensão
async function triagem_inicial_aoAbrirAguardandoAudiencia(){
    let janela = confereJanela(JANELA.processoTarefa)
    if (!janela) return
    let armazenamento = await obterArmazenamento('rota_pje_triagem_inicial_aguardandoAudiencia')
    let execucao = String(armazenamento?.rota_pje_triagem_inicial_aguardandoAudiencia || '')
    if (!armazenamento) return
    let nomeJanela = window.name
    if (!nomeJanela.includes('rota_pje_triagem_inicial_aguardandoAudiencia')) return
    if(execucao !== nomeJanela.split('_').pop()) return
    registrarListenerFechar(execucao)
    await triagem_inicial_acoesEncaminharAguardandoAudiencia()
}

// ENCAMINHAR PARA AGUARDANDO AUDIÊNCIA PASSO 3 - executa as ações

async function triagem_inicial_acoesEncaminharAguardandoAudiencia(){
    await movimentar('Aguardando audiência')
    await suspender(2000)
    await armazenar({ rota_acoes_conjuntas_triagem_inicial_pronta: 'triagem_inicial_certidao' })
    window.close()
    return
    
}


triagem_inicial_aoAbrirAguardandoAudiencia()


//__________________________________________________
//                      AÇÕES CONJUNTAS
//__________________________________________________

async function triagem_inicial_acoesConjuntas(p){
    let i = 0
    for (let c of p?.comandos){
        await armazenar({ rota_acoes_conjuntas_triagem_inicial_em_andamento: c })
        const concluiu = await Promise.race([
            new Promise(resolver => {
                browser.storage.onChanged.addListener(function ouvir(mudancas) {
                    if (mudancas['rota_acoes_conjuntas_triagem_inicial_pronta']?.newValue === c) {
                        browser.storage.onChanged.removeListener(ouvir)
                        resolver(true)
                    }
                })
                comandar([c], [p?.parametros[i]])
            }),
            new Promise(resolver => setTimeout(() => resolver(false), 10 * 60 * 1000)) // 10 minutos
        ])
        if (!concluiu) {
            rota_avisoTemporario('A ação expirou. Prossiga manualmente.', 'erro', 10000)
            await removerArmazenamento('rota_acoes_conjuntas_triagem_inicial_em_andamento')
            return
        }
        i++
    }
    await removerArmazenamento('rota_acoes_conjuntas_triagem_inicial_em_andamento')
    return
}

//let emAndamento = await obterArmazenamento(['rota_acoes_conjuntas_triagem_inicial_em_andamento'])
//let chamadaPorAcaoConjunta = emAndamento?.rota_acoes_conjuntas_triagem_inicial_em_andamento === 'triagem_inicial_despachar'
//
//if (chamadaPorAcaoConjunta) {
//    criaBotaoAzul({
//        texto: 'Próximo',
//        acao: () => armazenar({ rota_acoes_conjuntas_triagem_inicial_pronta: 'triagem_inicial_despachar' })
//    })
//}

//__________________________________________________
//                      COMANDAR
//__________________________________________________


Object.assign(rota_acoes, {
    'triagem_inicial_designa_audiencia':        async (p) => await triagem_inicial_designarAudiencia(p),
    'triagem_inicial_despachar':                async (p) => await triagem_inicial_despachar(p),
    'triagem_inicial_atualiza_janela_detalhes': async (p) => await triagem_inicial_atualizaJanelaDetalhes(p),
    'triagem_inicial_gig':                      async (p) => await triagem_inicial_colocarGigDeAcompanhamento(p),
    'triagem_inicial_certidao':                 async (p) => await triagem_inicial_certificar(p),
    'triagem_inicial_retificar':                async (p) => await triagem_inicial_retificarAutuacao(p),
    'triagem_inicial_intimar':                  async (p) => await triagem_inicial_intimar(p),
    'triagem_inicial_acoes_conjuntas':          async (p) => await triagem_inicial_acoesConjuntas(p),
    'triagem_inicial_aguardando_audiencia':     async (p) => await triagem_inicial_aguardandoAudiencia(p),
    'triagem_inicial_bloquear_horarios':        async (p) => await triagem_inicial_bloquearHorarios(p),
})


async function verificarOQueChegou(p) {
    rota_avisoTemporario(JSON.stringify(p), tipo = 'info', ms = 2000)
}

//__________________________________________________
//                      BUSCAR JUIZ NO MODELO - POSSÍVEL FUNÇÃO GLOBAL 
//__________________________________________________



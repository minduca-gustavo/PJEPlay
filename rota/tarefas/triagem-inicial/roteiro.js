// dá problema quando o interceptador dá errado, ou seja, quando não tem gigs concluídos, por exemplo.
// o domicilio eletronico é outra api.
//     ?pjerota_tarefa=_
//console.log ('triagem_inicial_aoAbrirDetalhesDoProcesso: verificando janela e parâmetros...')



const dadosTriagemInicial = {
    partes: null,
    processo: null,
    gig: null,
    salas: null,
    salaJuizes: null,
    horariosVagosPorSala: null,
    juizSimetriaPeloGig: null,
    peticaoInicialId: null,
    idPrecaucao: null,
    execucaoAtual: null,
    origin: location.origin,
    tarefaMaisRecente: null,
    recursos: null,
    
}
//__________________________________________________
//                      FUNÇÃO INICIAL
//__________________________________________________
async function triagem_inicial_aoAbrirDetalhesDoProcesso(){
    let janela = confereJanela(JANELA.detalhes)
    if (!janela) return
    let nomeJanela = window.name
    if (!nomeJanela.includes('rota')) return
    let armazenamento = await obterArmazenamento(['rotaExecucaoAtual'])
    if (!armazenamento) return
    let execucao = String(armazenamento?.rotaExecucaoAtual || '')
    if (!execucao) return
    if (execucao !== nomeJanela.split('-').pop()) return
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
    //console.log('dadosTriagemInicial.peticaoInicialId: ' + dadosTriagemInicial.peticaoInicialId)
    let executar = await obterArmazenamento(['rota_triagem_inicial_janelaDetalhes'])
    if (executar.rota_triagem_inicial_janelaDetalhes === sessao) return

    
    await aguardarElemento('.tl-documento')
    let peticoes = [...document.getElementsByClassName('tl-documento')]
    let peticaoInicial = peticoes.find(p => p.textContent.includes('Petição Inicial('))
    let botaoAnexos    = document.querySelectorAll('[name="mostrarOuOcultarAnexos"]')
    await clicar(peticaoInicial)

    for (let i = 0; i < 100; i++) {
        let cabecalho = await aguardarElemento('.mat-card-title')
        if (cabecalho.textContent.includes(dadosTriagemInicial.peticaoInicialId)) break
        await suspender(300)
    }

    await clicar(botaoAnexos[botaoAnexos.length - 1])
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
    
    let [timeline, gigs, gigs_concluidos, processo, recursos, tarefa_mais_recente] = await Promise.all([
        interceptador_aguardar('timeline').then(() => interceptador_lerTimeline() || []),
        interceptador_aguardar('gigs').then(() => interceptador_lerGigs() || []),
        interceptador_aguardar('gigs_concluidos').then(() => interceptador_lerGigsConcluidos() || []),
        interceptador_aguardar('processo').then(() => interceptador_lerProcesso() || {}),
        interceptador_aguardar('recursos').then(() => interceptador_lerRecursos() || {}),
        interceptador_aguardar('processo_tarefa_mais_recente').then(() => interceptador_lerTarefaMaisRecente() || {}),
    ])
    gigs.push(...gigs_concluidos)
    console.log('%c[Rota PJE]%c gigs: ' + JSON.stringify(gigs, null, 2), LOG.teste, 'color:inherit')
    let gig = gigs.find(gig => /GAB.*JU.*/i.test(gig?.tipoAtividade?.descricao || '')) ?? {}
    //console.log('%c[Rota PJE]%c gig: ' + JSON.stringify(gig, null, 2), LOG.teste, 'color:inherit')
    let gigNormalizado = normalizar(gig?.tipoAtividade?.descricao)
    //console.log('%c[Rota PJE]%c ' + gigNormalizado, LOG.teste, 'color:inherit')
    let juizSimetriaPeloGig = gigNormalizado.split(/ju[ií]za?/i, 2)[1]?.trim() || ''
    //console.log('%c[Rota PJE]%c ' + juizSimetriaPeloGig, LOG.teste, 'color:inherit')
    let peticaoInicialId = timeline[timeline.length - 1]?.idUnicoDocumento || ''
    let salas = await buscarSalas(processo?.orgaoJulgador?.id) || []
    let salaJuizes = []
    let sala = salas.find(sala => sala?.nome.includes(juizSimetriaPeloGig.toUpperCase())) || {}
    //console.log('%c[Rota PJE]%c sala: ' + JSON.stringify(sala, null, 2), LOG.teste, 'color:inherit')
    let horariosVagos = []
    if (sala.id) {
        horariosVagos = await buscarSalasHorariosVagos(sala.id) || []
    }
    
    if (!processo.id) processo.id = rota_dadosTriagemInicial.idPrecaucao
    let partes = await buscarProcesso(processo.id, '/partes?retornaEndereco=true') || []
    
    dadosTriagemInicial.partes                  = partes
    dadosTriagemInicial.processo                = processo
    dadosTriagemInicial.gig                     = gig
    dadosTriagemInicial.salas                   = salas
    dadosTriagemInicial.sala                    = sala
    dadosTriagemInicial.salaJuizes              = salaJuizes
    dadosTriagemInicial.horariosVagos           = horariosVagos
    dadosTriagemInicial.juizSimetriaPeloGig     = juizSimetriaPeloGig
    dadosTriagemInicial.peticaoInicialId        = peticaoInicialId
    dadosTriagemInicial.tarefaMaisRecente       = tarefa_mais_recente
    dadosTriagemInicial.recursos                = recursos
    
    await armazenar({ rota_dadosTriagemInicial: dadosTriagemInicial })
    await armazenar({ rota_dadosTriagemInicialNumero: processo.numero })
    await armazenar({ rota_dadosProntos: true })
}

//__________________________________________________
//                      RETIFICAR
//__________________________________________________

// RETIFICAR PASSO 1 - recebe os dados e abre a tela de retificação

async function triagem_inicial_retificarAutuacao(tipo) {
    let envio = tipo.tipo
    console.log('%c[Rota PJE]%c 134: ' + envio, LOG.teste, 'color:inherit')
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
    while (!elemento) {
        i++
        if (i > 10) break
        let elementos = [...await sel('retificacaoAutuacaoPrimeirosBotoes', '', true)]
        elemento = elementos.find(e => e.textContent.includes(tipo))
        if (!elemento) await suspender(1000)
    }

    await clicar(elemento)
}

triagem_inicial_aoAbrirRetificar()

//__________________________________________________
//                      DESPACHAR
//__________________________________________________

// DESPACHAR PASSO 1 - recebe os dados e abre a tela de tarefa

async function triagem_inicial_despachar(tipo) {
    let envio = tipo.tipo
    console.log('%c[Rota PJE]%c 134: ' + envio, LOG.teste, 'color:inherit')
    await armazenar({
        'rota_pje_triagem_inicial_despachar': dadosTriagemInicial.execucaoAtual,
        'rota_pje_triagem_inicial_despachar_tipo': envio,
    })
    let parametros =    '?rota_pje_triagem_inicial_despachar=' + dadosTriagemInicial.execucaoAtual + 
                        '&rota_pje_triagem_inicial_despachar_tipo=' + envio
    let nomeJanela =    'rota_pje_triagem_inicial_despachar_' + dadosTriagemInicial.execucaoAtual
    let id =            dadosTriagemInicial?.processo?.id
    let tarefa =        dadosTriagemInicial?.tarefaMaisRecente[0]?.idTarefa
    let page =          dadosTriagemInicial?.recursos?.find(r => r?.nome === dadosTriagemInicial?.tarefaMaisRecente[0]?.nomeRecurso)
    let url =           location.origin + '/pjekz/processo/' + id + '/tarefa/' + tarefa + page?.caminhoRecurso.split('{idTarefa}')[1] + parametros
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
    let [tipo, juizEnvio] = await Promise.all([
        obterArmazenamento('rota_pje_triagem_inicial_despachar_tipo').then(dados => dados?.rota_pje_triagem_inicial_despachar_tipo || ''),
        obterArmazenamento('rota_dadosTriagemInicial').then(dados => dados?.rota_dadosTriagemInicial?.juizSimetriaPeloGig || '')
    ])
    if(!juizEnvio) juizEnvio = await triagem_inicial_buscarJuizNoModelo() || ''
    let tarefa = await aguardarElementoNovo('tituloDaTarefaNaJanelaDeTarefa')
    let dados = await obterArmazenamento('rota_dadosTriagemInicial')
    let id = dados?.rota_dadosTriagemInicial?.processo?.id
    let audienciasMarcadas = await buscarAudienciasMarcadas(id) || {}
    let tipoAudiencia = audienciasMarcadas?.tipo?.descricao || ''
    let tiposAudiencia = {
        'Inicial por videoconferência': 'SCBAU_TI_INI_ORD',
        'Inicial por videoconferência (rito sumaríssimo)': 'SCBAU_TI_INI_SUM'
    }
    console.log('%c[Rota PJE]%c tipo: ' + JSON.stringify(tipo), LOG.rosa, 'color:inherit')
    let modeloDespacho = ''
    if (tipo !== 'triagem_inicial_emendar'){
        modeloDespacho = tiposAudiencia[tipoAudiencia] || 'SCBAU_TI_INI_ORD'
    }
    await movimentar('Despacho', {
        'Conclusão ao magistrado':{'juiz': juizEnvio},
        'Elaborar despacho':{'modelo': modeloDespacho}
    })
    if (modeloDespacho !== ''){
        let botaoEnviarParaAssinatura = await aguardarElementoNovo('botaoEnviarParaAssinatura')
        await clicar(botaoEnviarParaAssinatura)
        for(let i = 0; i < 30 * 2; i++){
            let assinar = await sel('tituloDaTarefaNaJanelaDeTarefa')
            if (assinar.textContent.includes('Assinar despacho')){
                break
            }
            await suspender(500)
        }
        await suspender(2000)
        if (audienciasMarcadas) window.close()
    }
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
    console.log('%c[Rota PJE]%c PAUTA: armazenamento=' + JSON.stringify(armazenamento) + ' nomeJanela=' + nomeJanela, LOG.rosa, 'color:inherit')
    registrarListenerFechar(execucao)
    await triagem_inicial_acoesDesignarAudiencia()
}

// DESIGNAR AUDIÊNCIA PASSO 3 - executa as ações

async function triagem_inicial_acoesDesignarAudiencia(){
    let dados = await obterArmazenamento('rota_pje_triagem_inicial_designa_audiencia_tipo')
    console.log('%c[Rota PJE]%c linha 294 dados: ' + JSON.stringify(dados), LOG.teste, 'color:inherit')
    let buscaLink = await obterArmazenamento('rota_triagem_inicial_linkDaAudiencia')
    let link = buscaLink?.rota_triagem_inicial_linkDaAudiencia || ''
    
    //if (!dados) return
    if (dados?.rota_pje_triagem_inicial_designa_audiencia_tipo?.dados){
        await triagem_inicial_acoesDesignarAudienciaManual('manual')
        return
    }
    let horario = dados?.rota_pje_triagem_inicial_designa_audiencia_tipo?.horario || ''
    if (!horario) {
        await triagem_inicial_acoesDesignarAudienciaManual('erro')
        return
    }
    if (link) horario.link = link
    await aguardarElementoNovo('celulaDaTabelaDaPautaDeAudiencias')
    await aguardarElementoNovo('seletorDeJuizDaPautaDeAudiencias')
    
   
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
    await rota_avisoTemporario(aviso, tipo, 10000)
    return
}

async function triagem_inicial_acoesDesignarAudienciaAutomaticamente(horario) {    
    // selecionar juiz
    let seletorJuiz = await sel('seletorDeJuizDaPautaDeAudiencias')
    if (seletorJuiz.textContent != horario.nomeDaSala){
        await clicar(seletorJuiz)
        await aguardarElementoNovo('seletorDeJuizDaPautaDeAudienciasAberto')
        let juizes = [...(await sel ('seletorDeJuizDaPautaDeAudienciasOpcoes', '', true))]
        console.log('%c[Rota PJE]%c 336: ' + JSON.stringify(juizes[0]?.textContent), LOG.teste, 'color:inherit')
        let juizSelecionado = juizes.find(j => j.textContent?.trim() == horario.nomeDaSala)
        await clicar(juizSelecionado)
    }
    // clicar no botao do primeiro dia

    await aguardarElementoNovo('celulaDaTabelaDaPautaDeAudiencias')
    let celulas = [...(await sel('celulaDaTabelaDaPautaDeAudiencias', '', true))]
    let celula = celulas.find(c=> c.ariaLabel && !c.ariaLabel.includes('não útil'))
    await clicar(celula)

    // clicar no botao de designar

    let botaoDesignar = await aguardarElementoNovo('botaoDesignarAudiencia')
    await clicar(botaoDesignar)

    //preencher dados do processo e da audiencia

    let inputNumeroProcesso = await aguardarElementoNovo('inputNumeroProcessoDesignarAudiencia')
    console.log('%c[Rota PJE]%c 345: ' + JSON.stringify(horario), LOG.teste, 'color:inherit')
    await preencher(inputNumeroProcesso, horario.processo)
    let inputLinkAudiencia = await aguardarElementoNovo('inputLinkDesignarAudiencia')
    await preencher(inputLinkAudiencia, horario.link)
    let dataAudiencia = new Date(horario.horarioInicial).toLocaleDateString('pt-BR')
    let inputDataDesignarAudiencia = await aguardarElementoNovo('inputDataDesignarAudiencia')
    let horarioInicial = horario.horarioInicial.split('T')[1].split(':')[0] + ':' + horario.horarioInicial.split('T')[1].split(':')[1]
    await preencher(inputDataDesignarAudiencia, dataAudiencia)
    let inputHorarioDesignarAudiencia = await aguardarElementoNovo('inputHorarioDesignarAudiencia')
    await preencher(inputHorarioDesignarAudiencia, horarioInicial)
    let inputTipoDesignarAudiencia = await aguardarElementoNovo('inputTipoDesignarAudiencia')
    await clicar(inputTipoDesignarAudiencia)
    await aguardarElementoNovo('opcoesTipoAudienciaDesignarAudienciaAberto')
    await clicar('[name="' + horario.descricaoTipoAudiencia + '"]')
    
    // clicar no botao de confirmar - alterar depois para CONFIRMAR

    let botoesDesignar = [...(await sel('botoesConfirmarCancelarDesignarAudiencia', '', true))]
    let botaoConfirmar = botoesDesignar.find(b => b.textContent.includes('Confirmar'))
    await suspender(1000)
    //let botaoConfirmar = botoesDesignar.find(b => b.textContent.includes('Confirmar'))
    await clicar(botaoConfirmar)
    await aguardarElementoNovo('botaoFecharDesignacaoDeAudiencia')
    await suspender(2000)
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
    let audienciaMarcadaNumero = new Date(audienciaMarcadaHorario).getTime()
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
    console.log('%c[Rota PJE]%c dataGig: ' + JSON.stringify(dataGig), LOG.rosa, 'color:inherit')
    let usuarioObter = await obterArmazenamento('rota_usuario')
    let usuario = usuarioObter?.rota_usuario.nome || ''
    console.log('%c[Rota PJE]%c usuario: ' + JSON.stringify(usuario), LOG.rosa, 'color:inherit')
    await aguardarElementoNovo('botaoNovaAtividadeGigsNaJanelaDetalhesDoProcesso')
    await inserirGigsNaTelaDeDetalhesDoProcesso('Audiência', dataGig, '', usuario.trim().toUpperCase(), 'Acompanhamento - Triagem Inicial', 'sim')
    rota_avisoTemporario(JSON.stringify(dataGig), tipo = 'info', ms = 2000)
    //console.log('%c[Rota PJE]%c audienciasMarcadas: ' + JSON.stringify(audienciasMarcadas), LOG.teste, 'color:inherit')
}


//__________________________________________________
//                      CERTIFICAR
//__________________________________________________

// CERTIFICAR PASSO 1 - recebe os dados e abre a tela de tarefa

async function triagem_inicial_certificar(tipo) {
    let envio = tipo.tipo
    console.log('%c[Rota PJE]%c 134: ' + envio, LOG.teste, 'color:inherit')
    await armazenar({
        'rota_pje_triagem_inicial_certificar': dadosTriagemInicial.execucaoAtual,
        'rota_pje_triagem_inicial_certificar_tipo': envio,
    })
    let parametros =    '?rota_pje_triagem_inicial_certificar=' + dadosTriagemInicial.execucaoAtual + 
                        '&rota_pje_triagem_inicial_certificar_tipo=' + envio
    let nomeJanela =    'rota_pje_triagem_inicial_certificar_' + dadosTriagemInicial.execucaoAtual
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
    let elementos = await aguardarElementoNovo(
        [
            'inputTipoDeDocumentoNaTelaDeAnexarDocumento',
            'inputDescricaoDeDocumentoNaTelaDeAnexarDocumento',
            'buscarModelosNaTelaDeAnexarDocumento'
        ],
        {modo: 'e', timeout: 10000}
    )
    
    if (!elementos) return
    let tipo = await sel('inputTipoDeDocumentoNaTelaDeAnexarDocumento')
    let descricao = await sel('inputDescricaoDeDocumentoNaTelaDeAnexarDocumento')
    let modelo = await sel('buscarModelosNaTelaDeAnexarDocumento')
    await suspender(200)
    await preencherCampoComEscolhaDeOpcao(tipo, 'Certidão')
    await suspender(200)
    await preencher(descricao, 'Designação de audiência')
    await suspender(200)
    await digitarNoInput(modelo, 'SCBAU_TI_CERT')
    await selecionarOpcaoDeModelo('SCBAU_TI_CERT')
    await esperarEClicar('botaoInserirModeloDeDespacho')
    let botaoAssinar = await aguardarElementoNovo('botaoAssinarNaTelaDeAnexarDocumento')
    //await clicar(botaoAssinar)
    window.addEventListener('beforeunload', () => {
        comandar(['triagem_inicial_intimar'], [{tipo: 'triagem_inicial_intimar_designacao'}])
        // Sem await — pagehide não suporta async
    })
    await suspender(2000)
    window.close()
    
    
    return
}


triagem_inicial_aoAbrirCertificar()
//__________________________________________________
//                      INTIMAR
//__________________________________________________

// INTIMAR PASSO 1 - recebe os dados e abre a tela de tarefa

async function triagem_inicial_intimar(tipo) {
    let envio = tipo.tipo
    console.log('%c[Rota PJE]%c 134: ' + envio, LOG.teste, 'color:inherit')
    await armazenar({
        'rota_pje_triagem_inicial_intimar': dadosTriagemInicial.execucaoAtual,
        'rota_pje_triagem_inicial_intimar_tipo': envio,
    })
    let parametros =    '?rota_pje_triagem_inicial_intimar=' + dadosTriagemInicial.execucaoAtual + 
                        '&rota_pje_triagem_inicial_intimar_tipo=' + envio
    let nomeJanela =    'rota_pje_triagem_inicial_intimar_' + dadosTriagemInicial.execucaoAtual
    let id =            dadosTriagemInicial?.processo?.id
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
    
    await aguardarElementoNovo(
        [
            'seletorTipoDeExpedienteNaTelaDePrepararExpedientes',
            'botaoConfeccionarAtoAgrupadoNaTelaDePrepararExpedientes',
        ],
        {modo: 'e', timeout: 10000}
    )
    logInterceptador = false
    
    let seletor = await sel('seletorTipoDeExpedienteNaTelaDePrepararExpedientes')
    await clicar(seletor)
    await aguardarElementoNovo('seletorTipoDeExpedienteNaTelaDePrepararExpedientesAberto')
    let opcao = [...await sel('seletorTipoDeExpedienteNaTelaDePrepararExpedientesAberto', '', true)].find(o => o.textContent.trim().includes('Notificação inicial'))
    await clicar(opcao)
    let botaoConfeccionar = await aguardarElementoNovo('botaoConfeccionarAtoAgrupadoNaTelaDePrepararExpedientes')
    await clicar(botaoConfeccionar)
    await aguardarElementoNovo(
        [
            'seletorTipoDeDocumentoNaTelaDeElaborarAto',
            'inputDescricaoNaTelaDeElaborarAto'
        ],
        {modo: 'e', timeout: 10000}
    )
    let descricao = await sel('inputDescricaoNaTelaDeElaborarAto')
    let inputModelo = await sel('buscarModelosNaTelaDeElaborar')
    await preencher(descricao, 'Notificação Inicial - Designação de audiência')
    await suspender(200)
    let areaAssinatura = await aguardarElementoNovo('assinaturaDaMinutaNaTelaDeElaborarAto')
    await preencherCKEditorExecCommand(areaAssinatura, '.')
    await suspender(200)
    let conteudoPrincipal = await aguardarElementoNovo('conteudoPrincipalDaMinutaNaTelaDeElaborarAto')
    await focar(conteudoPrincipal)
    await suspender(200)
    await digitarNoInput(inputModelo, 'SCBAU_TI_NOT_DOM')
    await selecionarOpcaoDeModelo('SCBAU_TI_NOT_DOM')
    await suspender(200)
    await esperarEClicar('botaoInserirModeloDeDespacho')
    await suspender(200)
    let botaoFinalizarMinuta = await aguardarElementoNovo('botaoFinalizarMinutaNaTelaDeElaborarAto')
    await clicar(botaoFinalizarMinuta)
    
    monitorarBody(6000, 300, {incluir:{classes:['snack-bar']}})
    await aguardarElementoNovo('mensagemModeloInseridoNaTelaDePrepararExpedientes', {texto:'Modelo de documento inserido com sucesso no editorX'})
    let i = 0
    while (await sel('mensagemModeloInseridoNaTelaDePrepararExpedientes')){
        await suspender(500)
        if (i++ > 3 * 2) break
    }
    //for(let i = 0; i < 30 * 2; i++){
    //    let metaConfere = await interceptador_ler('expedientes_materia')
    //    console.log('%c[Rota PJE]%c metaConfere: ' + JSON.stringify(metaConfere), LOG.rosa, 'color:inherit')
    //    await suspender(500)
    //    if (metaConfere !== metaExpedientes) break
    //    if (i==30) return rota_avisoTemporario('Ocorreu um erro. Prossiga manualmente.', 'erro', 15 * 1000)
    //}
    //await suspender(200)
    //await aguardarElementoNovo('atoConfeccionadoNaTelaDePrepararExpedientes')
    //metaExpedientes = await interceptador_ler('expedientes_materia') || null
    let botaoPoloAtivo = await aguardarElementoNovo('botaoPoloAtivoNaTelaDePrepararExpedientes')
    logInterceptador = true
    let metaExpedientes = await interceptador_ler('expedientes_materia') || null
    console.log('%c[Rota PJE]%c metaExpedientes: ' + JSON.stringify(metaExpedientes), LOG.rosa, 'color:inherit')
    await clicar(botaoPoloAtivo)
    monitorarBody(6000, 500)
    await aguardarElementoNovo('mensagemAguardeNaTelaDePrepararExpedientes', {texto:'Aguarde...', timeout: 2000})
    i = 0
    while ((await sel('mensagemAguardeNaTelaDePrepararExpedientes')) || (await interceptador_ler('expedientes_materia') === metaExpedientes)){
        console.log('%c[Rota PJE]%c interceptador_ler(): ' + JSON.stringify(interceptador_ler('expedientes_materia')), LOG.rosa, 'color:inherit')
        await suspender(500)
        //if (i++ > 3 * 2) break
    }
    //await suspender(500)
    let botaoSalvar = await aguardarElementoNovo('botaoSalvarNaTelaDePrepararExpedientes')
    let botaoAssinar = (await aguardarElementoNovo('botaoAssinarNaTelaDePrepararExpedientes'))
    
    await clicar(botaoSalvar)
    monitorarBody(6000, 500)
    return
    i = 0
    while (!sel('botaoAssinarNaTelaDePrepararExpedientes').disabled){
        await suspender(500)
        if (i++ > 30 * 2) return rota_avisoTemporario('Ocorreu um erro. Prossiga manualmente.', 'erro', 15 * 1000)
    }
    
    await alert('CLICARIA')
    return
    //await clicar(botaoAssinar)
            
    /*
    if (!elementos) return
    let tipo = await sel('inputTipoDeDocumentoNaTelaDeAnexarDocumento')
    let descricao = await sel('inputDescricaoDeDocumentoNaTelaDeAnexarDocumento')
    let modelo = await sel('buscarModelosNaTelaDeAnexarDocumento')
    await suspender(200)
    await preencherCampoComEscolhaDeOpcao(tipo, 'Certidão')
    await suspender(200)
    await preencher(descricao, 'Designação de audiência')
    await suspender(200)
    await digitarNoInput(modelo, 'SCBAU_TI_CERT')
    await selecionarOpcaoDeModelo('SCBAU_TI_CERT')
    await esperarEClicar('botaoInserirModeloDeDespacho')
    let botaoAssinar = await aguardarElementoNovo('botaoAssinarNaTelaDeAnexarDocumento')
    window.addEventListener('pagehide', () => {
        comandar('triagem_inicial_intimar', { parametros: '' })
    })
    await clicar(botaoAssinar)
    */
    return
}


triagem_inicial_aoAbrirIntimar()


//__________________________________________________
//                      COMANDAR
//__________________________________________________


Object.assign(rota_acoes, {
    'triagem_inicial_designa_audiencia':    async (p) => await triagem_inicial_designarAudiencia(p),
    'triagem_inicial_despachar':            async (p) => await triagem_inicial_despachar(p),
    'triagem_inicial_gig':                  async (p) => await triagem_inicial_colocarGigDeAcompanhamento(p),
    'triagem_inicial_certidao':             async (p) => await triagem_inicial_certificar(p),
    'triagem_inicial_retificar':            async (p) => await triagem_inicial_retificarAutuacao(p),
    'triagem_inicial_intimar':              async (p) => await triagem_inicial_intimar(p),
})


async function verificarOQueChegou(p) {
    rota_avisoTemporario(JSON.stringify(p), tipo = 'info', ms = 2000)
}

//__________________________________________________
//                      BUSCAR JUIZ NO MODELO - POSSÍVEL FUNÇÃO GLOBAL 
//__________________________________________________

async function triagem_inicial_buscarJuizNoModelo(){
    console.log('%c[Rota PJE]%c buscando juiz no modelo de documentos...', LOG.teste, 'color:inherit')
}

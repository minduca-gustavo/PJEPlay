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
    let tarefa = await rota_buscarParametros('pjerota_tarefa')
    if (!tarefa) return
    let sessao = await rota_buscarParametros('pjerota_sessao')
    if (!sessao) return
    let armazenamento = await obterArmazenamento(['rotaExecucaoAtual'])
    if (!armazenamento) return
    let execucao = String(armazenamento?.rotaExecucaoAtual || '')
    let nomeJanela = window.name
    if (!nomeJanela.includes('rota')) return
    if (tarefa !== 'triagem_inicial') return
    if(sessao !== armazenamento?.rotaExecucaoAtual || sessao !== nomeJanela.split('-').pop()) return
    dadosTriagemInicial.execucaoAtual = execucao
    browser.storage.onChanged.addListener(obedecer)
    await triagem_inicial_janelaDetalhes(sessao)
    return
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
    console.log('%c[Rota PJE]%c ' + 'tipo: ' + tipo + ' / juiz: ' + juizEnvio, LOG.teste, 'color:inherit')
    let tarefa = await aguardarElementoNovo('tituloDaTarefaNaJanelaDeTarefa')
    console.log('%c[Rota PJE]%c linha 240: ' + JSON.stringify(tarefa?.innerText), LOG.teste, 'color:inherit')
    await movimentar('Conclusão ao magistrado', {'Conclusão ao magistrado':{'juiz': juizEnvio}})
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
    
    let seletorJuiz = await sel('seletorDeJuizDaPautaDeAudiencias')
    if (seletorJuiz.textContent != horario.nomeDaSala) await triagem_inicial_acoesDesignarAudienciaAutomaticamente(seletorJuiz, horario)
    
    

    //await alert ('Espere um pouquinho' + JSON.stringify(celula.textContent))
    //await alert ('Espere um pouquinho' + JSON.stringify(seletorJuiz?.textContent))
    //
    //let [tipo, juiz] = await Promise.all([
    //    obterArmazenamento('rota_pje_triagem_inicial_designa_audiencia_tipo').then(dados => dados?.rota_pje_triagem_inicial_despachar_tipo || ''),
    //    obterArmazenamento('rota_dadosTriagemInicial').then(dados => dados?.rota_dadosTriagemInicial?.juizSimetriaPeloGig || '')
    //])
    //if(!juiz) juiz = await triagem_inicial_buscarJuizNoModelo() || ''
    //alert('tipo: ' + tipo + ' / juiz: ' + juiz)
}

// DESIGNAR AUDIÊNCIA - AÇÕES AUXILIARES

async function triagem_inicial_acoesDesignarAudienciaManual(manualOuErro) {
    let [tipo, aviso] = [null, null]
    if (manualOuErro == 'erro') {
        tipo  = 'erro'
        aviso = 'Ocorreu um erro. Designe manualmente a audiência, e clique em "Próximo".'
    } else {
        tipo  = 'info'
        aviso = 'Designe manualmente a audiência, e clique em "Próximo".'
    }
    await rota_avisoTemporario(aviso, tipo, 10000)
    return
}

async function triagem_inicial_acoesDesignarAudienciaAutomaticamente(seletorJuiz, horario) {
    
    // selecionar juiz
    
    await clicar(seletorJuiz)
    await aguardarElementoNovo('seletorDeJuizDaPautaDeAudienciasAberto')
    let juizes = [...(await sel ('seletorDeJuizDaPautaDeAudienciasOpcoes', '', true))]
    console.log('%c[Rota PJE]%c 336: ' + JSON.stringify(juizes[0]?.textContent), LOG.teste, 'color:inherit')
    let juizSelecionado = juizes.find(j => j.textContent?.trim() == horario.nomeDaSala)
    await clicar(juizSelecionado)

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
    console.log('%c[Rota PJE]%c 355: ' + horarioInicial, LOG.teste, 'color:inherit')
    await preencher(inputDataDesignarAudiencia, dataAudiencia)
    let inputHorarioDesignarAudiencia = await aguardarElementoNovo('inputHorarioDesignarAudiencia')
    await preencher(inputHorarioDesignarAudiencia, horarioInicial)
    let inputTipoDesignarAudiencia = await aguardarElementoNovo('inputTipoDesignarAudiencia')
    await clicar(inputTipoDesignarAudiencia)
    await aguardarElementoNovo('opcoesTipoAudienciaDesignarAudienciaAberto')
    await clicar('[name="' + horario.descricaoTipoAudiencia + '"]')
    
    // clicar no botao de confirmar - alterar depois para CONFIRMAR

    let botoesDesignar = [...(await sel('botoesConfirmarCancelarDesignarAudiencia', '', true))]
    let botaoConfirmar = botoesDesignar.find(b => b.textContent.includes('Cancelar'))
    await suspender(1000)
    //let botaoConfirmar = botoesDesignar.find(b => b.textContent.includes('Confirmar'))
    await clicar(botaoConfirmar)
    return
}

triagem_inicial_aoAbrirDesignarAudiencia()

//__________________________________________________
//                      COMANDAR
//__________________________________________________


const rota_acoes = {
    'triagem_inicial_designa_audiencia': async (p) => await triagem_inicial_designarAudiencia(p),
    'triagem_inicial_despachar': async (p) => await triagem_inicial_despachar(p),
    'triagem_inicial_gig': async (p) => await verificarOQueChegou(p),
    'triagem_inicial_certidao': async (p) => await verificarOQueChegou(p),
    'triagem_inicial_retificar': async (p) => await triagem_inicial_retificarAutuacao(p),
}


async function verificarOQueChegou(p) {
    rota_avisoTemporario(JSON.stringify(p), tipo = 'info', ms = 2000)
}

//__________________________________________________
//                      BUSCAR JUIZ NO MODELO - POSSÍVEL FUNÇÃO GLOBAL 
//__________________________________________________

async function triagem_inicial_buscarJuizNoModelo(){
    console.log('%c[Rota PJE]%c buscando juiz no modelo de documentos...', LOG.teste, 'color:inherit')
}

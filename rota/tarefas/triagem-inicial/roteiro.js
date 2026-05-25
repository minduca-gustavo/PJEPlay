// dá problema quando o interceptador dá errado, ou seja, quando não tem gigs concluídos, por exemplo.
// o domicilio eletronico é outra api.
//     ?pjerota_tarefa=triagem-inicial
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
    
}
//----------------------------------------------------------------------
//                      FUNÇÃO INICIAL
//----------------------------------------------------------------------
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
    if (tarefa !== 'triagem-inicial') return
    if(sessao !== armazenamento?.rotaExecucaoAtual || sessao !== nomeJanela.split('-').pop()) return
    await triagem_inicial_janelaDetalhes()
    return
}

triagem_inicial_aoAbrirDetalhesDoProcesso()

//----------------------------------------------------------------------
//                      DETALHES DO PROCESSO 
//----------------------------------------------------------------------

async function triagem_inicial_janelaDetalhes(){
    
    await triagem_inicial_enviarParaRoteiroAssistente()
    //console.log('dadosTriagemInicial.peticaoInicialId: ' + dadosTriagemInicial.peticaoInicialId)
    await aguardarElemento('.tl-documento')
    let peticoes = [...document.getElementsByClassName('tl-documento')]
    let peticaoInicial = peticoes.find(p => p.textContent.includes('Petição Inicial('))
    let botaoAnexos    = document.querySelectorAll('[name="mostrarOuOcultarAnexos"]')
    //console.log('chamou? triagem-inicial')
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
    await removerArmazenamento('pjerota_tarefa')
}

//----------------------------------------------------------------------
//                      ENVIAR PARA ROTEIRO ASSISTENTE
//----------------------------------------------------------------------

async function triagem_inicial_enviarParaRoteiroAssistente(){
    
    let [timeline, gigs, gigs_concluidos, processo] = await Promise.all([
        interceptador_aguardar('timeline').then(() => interceptador_lerTimeline() || []),
        interceptador_aguardar('gigs').then(() => interceptador_lerGigs() || []),
        interceptador_aguardar('gigs-concluidos').then(() => interceptador_lerGigsConcluidos() || []),
        interceptador_aguardar('processo').then(() => interceptador_lerProcesso() || {}),
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
    
    await armazenar({ rota_dadosTriagemInicial: dadosTriagemInicial })
    await armazenar({ rota_dadosTriagemInicialNumero: processo.numero })
    await armazenar({ rota_dadosProntos: true })
}

//----------------------------------------------------------------------
//                      RETIFICAR
//----------------------------------------------------------------------


async function triagem_inicial_aoAbrirRetificar(){
    let janela = confereJanela(JANELA.retificar)
        if (!janela) return
    let parametros = await rota_buscarParametros('rota-pje-' + 'retificar')
        if (!parametros) return
    let armazenamento = obterArmazenamento('rota-pje-' + 'retificar')
        if (!armazenamento) return
    let nomeJanela = window.name
        if (!nomeJanela.includes('rota-pje-' + 'retificar')) return
    console.log('%c[Rota PJE]%c triagem-retificar-agora: parametros: ' + parametros, LOG.info, 'color:inherit')
    console.log('%c[Rota PJE]%c triagem-retificar-agora: armazenamento: ' + armazenamento, LOG.info, 'color:inherit')
    console.log('%c[Rota PJE]%c triagem-retificar-agora: nomeJanela: ' + nomeJanela, LOG.info, 'color:inherit')
}

async function triagem_inicial_janelaRetificar(){
    let tipos = await obterArmazenamento(['rota_dadosTriagemInicialRetificar'])
    if (!tipos) return
    let tipo = tipos?.rota_dadosTriagemInicialRetificar
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

const rota_acoes = {
    'designa-audiencia': async (p) => await verificarOQueChegou(p),
    'despachar': async (p) => await verificarOQueChegou(p),
    'gig': async (p) => await verificarOQueChegou(p),
    'certidao': async (p) => await verificarOQueChegou(p),
    'retificar': async (p) => await triagem_retificarAutuacao(p),
}


async function verificarOQueChegou(p) {
    rota_avisoTemporario(JSON.stringify(p), tipo = 'info', ms = 2000)
}

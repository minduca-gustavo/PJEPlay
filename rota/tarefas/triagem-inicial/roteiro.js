// dá problema quando o interceptador dá errado, ou seja, quando não tem gigs concluídos, por exemplo.
// o domicilio eletronico é outra api.
//     ?pjerota_tarefa=triagem-inicial
//console.log ('triagem_inicial_aoAbrirDetalhesDoProcesso: verificando janela e parâmetros...')


let tarefaEmExecucao = 'triagem-inicial'
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

async function triagem_inicial_aoAbrirDetalhesDoProcesso(){
    const execucaoAtual = await conferenciaCompletaJanela('triagem-inicial')
    if (!execucaoAtual) return

    dadosTriagemInicial.execucaoAtual = execucaoAtual

    const match = location.href.match(/\/pjekz\/processo\/(\d+)\/detalhe/)
    dadosTriagemInicial.idPrecaucao = match?.[1]
    browser.storage.onChanged.addListener(obedecer)
    triagem_inicial_janelaDetalhes()
}




async function triagem_inicial_janelaDetalhes(){
    
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

triagem_inicial_aoAbrirDetalhesDoProcesso()

async function triagem_inicial_aoAbrirRetificar(){
    //console.log('%c[Rota PJE]%c window.name' + window.name, LOG.teste, 'color:inherit')
    //console.log('%c[Rota PJE]%c RETIFICAR - ANTES', LOG.teste, 'color:inherit')
    //const execucaoAtual = await conferenciaJanelaAbertaPeloAssistente('triagem-inicial', JANELA.retificar)
    //if (!execucaoAtual) return
    //console.log('%c[Rota PJE]%c RETIFICAR - DEPOIS', LOG.teste, 'color:inherit')
    //dadosTriagemInicial.execucaoAtual = execucaoAtual
    console.log('cacando aqui: ' + JANELA.retificar)
    let execucao = conferenciaCompletaJanela('triagem-inicial', JANELA.retificar)
    console.log('%c[Rota PJE]%c execucao: ' + JSON.stringify(execucao), LOG.teste, 'color:inherit')
    if (execucao == null) {
        console.log('retornou')
        return
    }
    //triagem_inicial_janelaRetificar()
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

async function triagem_retificarAutuacao(tipo) {
    let dados = await obterArmazenamento(['rota_dadosTriagemInicial'])
    await armazenar({ rota_dadosTriagemInicialRetificar: tipo })
    let id = dadosTriagemInicial?.processo?.id
    let execucao = dados?.rota_dadosTriagemInicial?.execucaoAtual
    //console.log('%c[Rota PJE]%c ' + execucao, LOG.teste, 'color:inherit')
    let url = location.origin + '/pjekz/processo/' + id + '/retificar?pjerota_tarefa=triagem-inicial'
    await abrirUrl(url, 'esquerdaAssistida', 'triagem-inicial-retificar-' + execucao)
    //await alert(tipo + ' em desenvolvimento. ' + id)
}



// em desenvolvimento
// ============================================================
// tarefas/triagem-inicial/roteiro.js
// Roteiro da Triagem Inicial.
//
// Janelas: detalhes (por ora).
// Blocos: Autuação → Próximos Passos.
// ============================================================


// ── Definição do roteiro ──────────────────────────────────────
//
// O roteiro é um grafo de etapas nomeadas.
// Cada etapa define o que aparece no painel assistente.
// A navegação entre etapas é linear por padrão,
// mas pode ser condicional via campo 'proximo'.



/*
const ROTEIRO_TRIAGEM_INICIAL = {

    // Etapa de entrada — sempre a primeira
    etapaInicial: 'autuacao',

    etapas: {

        // ── AUTUAÇÃO ──────────────────────────────────────────
        autuacao: {
            id:     'autuacao',
            titulo: 'Autuação',
                
            infoPJE: async () => {
                // Tenta ler partes interceptadas
                const partes = interceptador_lerPartes()
                if (!partes?.length) return null    
                
                //if (!partes?.length) return null

                const recte  = partes.ATIVO[0].nome
                //const reda = partes.find(p =>
                //    (p.tipoParte || p.polo || '').toLowerCase().includes('reclamada') ||
                //    (p.tipoParte || p.polo || '').toLowerCase().includes('passivo')
                //)
                //const proc = interceptador_lerProcesso()
                //
                return [
                    recte? `Reclamante: ${recte}`           : null,
                    //reda?.nome ? `Reclamada: ${reda.nome}`           : null,
                    //proc?.valorCausa ? `Valor: ${proc.valorCausa}`   : null,
                ].filter(Boolean).join('\n')
            },

            //instrucaoRapida: 'Confira se a autuação está correta. Para mais detalhes, clique abaixo para ver a instrução completa da tarefa.',
            let partesInstruc = interceptador_lerPartes(),
            instrucaoRapida: async() => {
                let partesInstruc = interceptador_lerPartes()
                return JSON.stringify(partesInstruc)
            },
            instrucaoLonga: `Verifique:
• Nome completo do reclamante (sem abreviações)
• Nome/razão social da reclamada
• CPF/CNPJ das partes
• Valor da causa
• Classe processual correta
• Órgão julgador correto

Se houver erro em qualquer campo, utilize os botões de retificação abaixo.`,

            acoes: [
                {
                    label:    'Retificar — reclamante',
                    acao:     'triagem_retificarReclamante',
                    primario: false,
                },
                {
                    label:    'Retificar — reclamada',
                    acao:     'triagem_retificarReclamada',
                    primario: false,
                },
                {
                    label:    'Retificar — dados do processo',
                    acao:     'triagem_retificarDados',
                    primario: false,
                },
            ],

            proximo: 'passos',
        },


        // ── PRÓXIMOS PASSOS ───────────────────────────────────
        passos: {
            id:     'passos',
            titulo: 'Próximos Passos',

            infoPJE: null,

            instrucaoRapida: 'Defina o encaminhamento do processo.',

            instrucaoLonga: `Critérios de encaminhamento:
• Tutela: encaminhar para conclusão imediata (ver observação no sistema)
• Processo comum: marcar audiência de instrução e julgamento
• Acordo já firmado: verificar homologação
• Dúvida sobre competência: retificar autuação antes de pautar`,

            acoes: [
                {
                    label:    'Marcar audiência',
                    acao:     'triagem_marcarAudiencia',
                    primario: true,
                    submenu: [
                        { label: 'Instrução e julgamento', acao: 'triagem_audienciaInstrucao' },
                        { label: 'Conciliação',            acao: 'triagem_audienciaConciliacao' },
                    ],
                },
                {
                    label:    'Despacho',
                    acao:     'triagem_despacho',
                    primario: false,
                },
                {
                    label:    'Encaminhar para conclusão',
                    acao:     'triagem_conclusao',
                    primario: false,
                },
            ],

            proximo: null,  // última etapa — avança processo
        },
    },
}
*/

const ROTEIRO_TRIAGEM_INICIAL = {

    etapaInicial: 'autuacao',

    etapas: {

        autuacao: {
            id:     'autuacao',
            titulo: 'Autuação',

            infoPJE: {
                rotulo: '📋 Passe o mouse para ver os dados da autuação (partes e endereços).',
                detalhe: async () => {
                    if (!await comparaChavesProcesso('rota_dadosTriagemInicialNumero')) return '⏳ Carregando...'

                    const dados = await obterArmazenamento('rota_dadosTriagemInicial')
                    const triagem = dados?.rota_dadosTriagemInicial
                    
                    return formatarPartes(triagem.partes)
                }
            },

            instrucaoRapida: `Confira se a autuação está correta. Para mais detalhes, clique abaixo para ver a instrução completa da tarefa.`,

            instrucaoLonga: `Para fazer a triagem inicial, você deve verificar
- Nome completo do reclamante (sem abreviações)
- Nome/razão social da reclamada
- CPF/CNPJ das partes
- Valor da causa
- Classe processual correta
- Órgão julgador correto

Se houver erro em qualquer campo, utilize os botões de retificação abaixo.`,

            acoes: [
                { label: 'Retificar — reclamante',      acao: 'triagem_retificarReclamante', primario: false },
                { label: 'Retificar — reclamada',        acao: 'triagem_retificarReclamada',  primario: false },
                { label: 'Retificar — dados do processo',acao: 'triagem_retificarDados',      primario: false },
            ],

            proximo: 'passos',
        },

        passos: {
            id:     'passos',
            titulo: 'Próximos Passos',

            infoPJE: null,

            instrucaoRapida: 'Defina o encaminhamento do processo.',

            instrucaoLonga: `Critérios de encaminhamento:
- Tutela: encaminhar para conclusão imediata (ver observação no sistema)
- Processo comum: marcar audiência de instrução e julgamento
- Acordo já firmado: verificar homologação
- Dúvida sobre competência: retificar autuação antes de pautar`,

            acoes: [
                {
                    label:    'Marcar audiência',
                    acao:     'triagem_marcarAudiencia',
                    primario: true,
                    submenu: [
                        { label: 'Instrução e julgamento', acao: 'triagem_audienciaInstrucao'  },
                        { label: 'Conciliação',            acao: 'triagem_audienciaConciliacao' },
                    ],
                },
                { label: 'Despacho',                    acao: 'triagem_despacho',   primario: false },
                { label: 'Encaminhar para conclusão',   acao: 'triagem_conclusao',  primario: false },
            ],

            proximo: null,
        },
    },
}

// ── Ações específicas da triagem inicial ──────────────────────
//
// Estas funções são chamadas pelos botões do painel.
// Ficam no escopo global para que criarTabelaAcoes() as encontre.


async function triagem_retificarReclamante() {
    await acao_navegacao_detalhes()
    // Abre retificação — o usuário navega manualmente até partes
    await acao_ui_abrirMenu('Retificar Autuação')
}

async function triagem_retificarReclamada() {
    await acao_navegacao_detalhes()
    await acao_ui_abrirMenu('Retificar Autuação')
}

async function triagem_retificarDados() {
    const id = interceptador_lerProcesso()?.id
    if (!id) return
    window.open(
        `${location.origin}/pjekz/processo/${id}/retificar`,
        'rota-pje-janela'
    )
}

async function triagem_marcarAudiencia() {
    const id = interceptador_lerProcesso()?.id
    if (!id) return
    window.open(
        `${location.origin}/pjekz/processo/${id}/audiencias-sessoes`,
        'rota-pje-janela'
    )
}

async function triagem_audienciaInstrucao() {
    await estado_atualizar({ extras: { tipoAudiencia: 'instrucao' } })
}

async function triagem_audienciaConciliacao() {
    await estado_atualizar({ extras: { tipoAudiencia: 'conciliacao' } })
}

async function triagem_despacho() {
    const id = interceptador_lerProcesso()?.id
    if (!id) return
    window.open(
        `${location.origin}/pjekz/processo/${id}/tarefa`,
        'rota-pje-janela'
    )
}

async function triagem_conclusao() {
    const responsaveis = await acao_api_obterResponsaveis()
    if (!responsaveis?.length) {
        //console.warn('[Rota PJE] triagem_conclusao: nenhum responsável encontrado.')
        return
    }
    // Por ora abre detalhes — seletor de juiz será implementado no componente específico
    await acao_navegacao_detalhes()
}

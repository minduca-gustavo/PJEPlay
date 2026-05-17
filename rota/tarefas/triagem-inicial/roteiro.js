// dá problema quando o interceptador dá errado, ou seja, quando não tem gigs concluídos, por exemplo.
// o domicilio eletronico é outra api.
//     ?pjerota_tarefa=triagem-inicial
//console.log ('aoAbrirDetalhesDoProcesso: verificando janela e parâmetros...')
const dadosTriagemInicial = {
    partes: null,
    processo: null,
    gig: null,
    salas: null,
    salaJuizes: null,
    horariosVagosPorSala: null,
    juizSimetriaPeloGig: null,
    peticaoInicialId: null,
}
async function aoAbrirDetalhesDoProcesso(){
    let janela = confereJanela(JANELA.detalhes)
    let versao = aguardarElemento('#modulo-versao')
    if (!janela) return

    let tarefa = rota_buscarParametros('pjerota_tarefa')

    if (!tarefa) {
        const salvo = await obterArmazenamento('pjerota_tarefa')
        tarefa = salvo?.pjerota_tarefa
    } else {
        await armazenar({ pjerota_tarefa: tarefa })
    }

    if (tarefa !== 'triagem-inicial') return
    
    triagem_inicial_janelaDetalhes()
}


async function triagem_inicial_janelaDetalhes(){
    
    let [timeline, gigs, processo] = await Promise.all([
        interceptador_aguardar('timeline').then(() => interceptador_lerTimeline() || []),
        interceptador_aguardar('gigs').then(() => interceptador_lerGigs() || []),
        //interceptador_aguardar('gigs-concluidos').then(() => interceptador_lerGigsConcluidos() || []),
        interceptador_aguardar('processo').then(() => interceptador_lerProcesso() || {}),
    ])
    
    let gig = gigs.filter(gig => /GAB.*JU.*/i.test(gig?.tipoAtividade?.descricao || ''))
    let juizSimetriaPeloGig = [...new Set(gig.map(juiz => juiz.nomeUsuarioDestinatario))]
    let peticaoInicialId = timeline[timeline.length - 1]?.idUnicoDocumento || ''
    let salas = await buscarSalas(processo?.orgaoJulgador?.id) || []
    let salaJuizes = []
    for(let juiz of juizSimetriaPeloGig){
        let sala = salas.find(sala => sala?.nome == juiz)
        if(sala) salaJuizes.push(sala)
    }
    let horariosVagosPorSala = {}
    for (let sala of salaJuizes){
        let horariosVagos = await buscarSalasHorariosVagos(sala.id) || []
        horariosVagosPorSala[sala.id] = horariosVagos
    }
    let partes = await buscarProcesso(processo.id, '/partes?retornaEndereco=true') || []
    
    dadosTriagemInicial.partes               = partes
    dadosTriagemInicial.processo             = processo
    dadosTriagemInicial.gig                  = gig
    dadosTriagemInicial.salas                = salas
    dadosTriagemInicial.salaJuizes           = salaJuizes
    dadosTriagemInicial.horariosVagosPorSala = horariosVagosPorSala
    dadosTriagemInicial.juizSimetriaPeloGig  = juizSimetriaPeloGig
    dadosTriagemInicial.peticaoInicialId     = peticaoInicialId
    
    await armazenar({ rota_dadosTriagemInicial: dadosTriagemInicial })
    await armazenar({ rota_dadosTriagemInicialNumero: processo.numero })
    await armazenar({ rota_dadosProntos: true })
    
    //console.log('dadosTriagemInicial.peticaoInicialId: ' + dadosTriagemInicial.peticaoInicialId)
    await aguardarElemento('.tl-documento')
    let peticoes = [...document.getElementsByClassName('tl-documento')]
    let peticaoInicial = peticoes.find(p => p.textContent.includes('Petição Inicial('))
    let botaoAnexos    = document.querySelectorAll('[name="mostrarOuOcultarAnexos"]')
    console.log('chamou? triagem-inicial')
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

aoAbrirDetalhesDoProcesso()


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
        console.warn('[Rota PJE] triagem_conclusao: nenhum responsável encontrado.')
        return
    }
    // Por ora abre detalhes — seletor de juiz será implementado no componente específico
    await acao_navegacao_detalhes()
}

// ============================================================
// tarefas/acordo-vencido/roteiro.js
// Roteiro do Acordo Vencido.
//
// Janelas: detalhes e documento homologatório.
// Blocos: Autuação → Próximos Passos.
// ============================================================


// ── Definição do roteiro ──────────────────────────────────────
//
// O roteiro é um grafo de etapas nomeadas.
// Cada etapa define o que aparece no painel assistente.
// A navegação entre etapas é linear por padrão,
// mas pode ser condicional via campo 'proximo'.

const ROTEIRO_TRIAGEM_INICIAL = {

    // Etapa de entrada — sempre a primeira
    etapaInicial: 'verificaHomologacao',

    etapas: {

        // ── AUTUAÇÃO ──────────────────────────────────────────
        verificaHomologacao: {
            id:     'verificaHomologacao',
            titulo: 'Verificar Homologação',

            infoPJE: async () => {
                // Tenta ler partes interceptadas
                const partes = interceptador_lerPartes()
                if (!partes?.length) return null

                const rec  = partes.find(p =>
                    (p.tipoParte || p.polo || '').toLowerCase().includes('reclamante') ||
                    (p.tipoParte || p.polo || '').toLowerCase().includes('ativo')
                )
                const reda = partes.find(p =>
                    (p.tipoParte || p.polo || '').toLowerCase().includes('reclamada') ||
                    (p.tipoParte || p.polo || '').toLowerCase().includes('passivo')
                )
                const proc = interceptador_lerProcesso()

                return [
                    rec?.nome  ? `Reclamante: ${rec.nome}`           : null,
                    reda?.nome ? `Reclamada: ${reda.nome}`           : null,
                    proc?.valorCausa ? `Valor: ${proc.valorCausa}`   : null,
                ].filter(Boolean).join('\n')
            },

            instrucaoRapida: 'Confira se as partes e dados do processo estão corretos.',

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

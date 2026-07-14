// ============================================================
// tarefas/index.js
// Catálogo das tarefas guiadas (🤖 sistema).
//
// Cada tarefa define:
//   id        {string}   identificador único
//   label     {string}   nome exibido no seletor
//   descricao {string}   descrição curta
//   tipo      {string}   ROTA_TIPO.SISTEMA
//   janelas   {Array}    janelas a abrir e suas posições
//
// janelas é um array de objetos { janela, posicao }:
//   janela:  'detalhe' | 'assistente' | 'tarefa' | qualquer
//            chave de ROTA_TIPOS_JANELA, mais 'assistente'
//            que é tratado especialmente pelo pipeline
//   posicao: 'esquerda' | 'direita' | 'esquerdaAssistida' |
//            'direitaAssistente' | 'telaCheia'
//
// A janela 'assistente' é aberta pelo pipeline antes das
// demais, recebendo pjerota_execucao e pjerota_tarefa na URL.
// As demais janelas seguem a ordem do array.
//
// As tarefas do usuário (👤) vêm do storage.local (tarefas
// configuradas no popup) e são mescladas pelo botao-rota.js
// na hora de exibir o seletor.
// ============================================================


const ROTA_CATALOGO = [
    /*
    {
        id:        'balcao-virtual',
        label:     'Balcão Virtual',
        descricao: 'Abre o processo onde estiver, aponta no assistente as informações e cria botões de GIGs do DAA.',
        tipo:      ROTA_TIPO.SISTEMA,
        janelas: [
            { janela: 'detalhe',    posicao: 'esquerdaAssistida' },
            { janela: 'assistente', posicao: 'direitaAssistente' },
        ],
    },
    */
 
    {
        id:        'triagem_inicial',
        label:     'Triagem Inicial',
        descricao: 'Análise da petição inicial, autuação e encaminhamento.',
        tipo:      ROTA_TIPO.SISTEMA,
    },
    {
        id:        'con2_prazo_vencido',
        label:     'CON2 - Prazo vencido',
        descricao: 'Processamento de recurso e encaminhamento ao TRT.',
        tipo:      ROTA_TIPO.SISTEMA,
    },
    
    /*
    {
        id:        'pos-triagem',
        label:     'Pós-Triagem',
        descricao: 'Verificação pós-triagem antes da pauta.',
        tipo:      ROTA_TIPO.SISTEMA,
        janelas: [
            { janela: 'detalhe',    posicao: 'esquerdaAssistida' },
            { janela: 'assistente', posicao: 'direitaAssistente' },
        ],
    },
    */
]


// ── Buscar tarefa por ID ──────────────────────────────────────

function catalogo_obter(id = '') {
    return ROTA_CATALOGO.find(t => t.id === id) || null
}


// ── Listar todas (sistema) ────────────────────────────────────

function catalogo_listar() {
    return ROTA_CATALOGO
}


// ── Mesclar com tarefas do usuário ────────────────────────────
//
// Retorna array unificado para o seletor de tarefa.
// Tarefas do sistema primeiro, depois as do usuário.
// Cada item tem: { id, label, tipo, emoji }

async function catalogo_listarTodas() {
    // Tarefas do sistema
    const sistema = ROTA_CATALOGO.map(t => ({
        id:     t.id,
        label:  t.label,
        tipo:   ROTA_TIPO.SISTEMA,
        emoji:  ROTA_EMOJI[ROTA_TIPO.SISTEMA],
    }))

    // Tarefas do usuário (storage)
    const cfg     = await obterArmazenamento(['tarefas'])
    const tarefas = cfg?.tarefas || {}
    const usuario = Object.keys(tarefas).map(nome => ({
        id:    nome,
        label: nome,
        tipo:  ROTA_TIPO.USUARIO,
        emoji: ROTA_EMOJI[ROTA_TIPO.USUARIO],
    }))

    return [...sistema, ...usuario]
}


// ── Converter janelas do catálogo em slots do pipeline ────────
//
// O pipeline trabalha com 'slots' (formato antigo).
// Esta função traduz o formato novo { janela, posicao }
// para o formato que rota_montarUrls() entende.
//
// A janela 'assistente' é filtrada — ela é aberta
// separadamente por rota_abrirAssistente() no pipeline.
//
// Uso em rota_iniciarPipeline():
//   const slots = catalogo_paraSlots(itemCatalogo)

function catalogo_paraSlots(itemCatalogo) {
    if (!itemCatalogo?.janelas?.length) return []

    return itemCatalogo.janelas
        .filter(j => j.janela !== 'assistente')  // assistente é aberto à parte
        .map((j, i) => ({
            tipo:      j.janela,
            posicao:   j.posicao,
            ordem:     i,
            slotIndex: i,
        }))
}


// ── Paleta de cores e valores default de tarefa (👤 usuário) ──
//
// Fonte única usada pelo popup (seletor de cor da Pintura) e pela
// seed de instalação no background. Compartilhado aqui para os
// dois contextos nunca divergirem sobre o "shape" de uma tarefa.
// ============================================================

const CORES = [
    { hex:'#e74c3c', nome:'Vermelho' }, { hex:'#e67e22', nome:'Laranja' },
    { hex:'#f1c40f', nome:'Amarelo'  }, { hex:'#2ecc71', nome:'Verde'   },
    { hex:'#3498db', nome:'Azul'     }, { hex:'#9b59b6', nome:'Roxo'    },
    { hex:'#1abc9c', nome:'Turquesa' }, { hex:'#e91e63', nome:'Rosa'    },
    { hex:'#ffffff', nome:'Branco'   },
]

const REGRAS_PADRAO = CORES.slice(0, 6).map(c => ({ cor: c.hex, termos: '' }))


// ── Gera uma tarefa de usuário (👤) com valores default ────────
//
// Cada chamada retorna um objeto novo, com seu próprio array de
// regras (clone de REGRAS_PADRAO) — chamadas diferentes nunca
// compartilham a mesma referência de array/objeto de regra.

function catalogo_tarefaPadrao() {
    return {
        tarefaUnica: '',
        slots: [{ posicao: 'esquerda', tipo: 'detalhes', tipoDoc: '', selecao: 'recente', orientacao: 'horizontal', ordem: 0 }],
        regras: REGRAS_PADRAO.map(r => ({ ...r })),
        temporizador: { ativo: false, segundos: 30, opcoes: '' },
    }
}
// ============================================================
// configuracao.js
// Constantes globais do Rota PJE — modo assistente.
// ============================================================


// ── Identidade ────────────────────────────────────────────────
const ROTA_LINUX = navigator.userAgent.includes('Linux') && !navigator.userAgent.includes('Android')
const ROTA_NOME        = 'Rota PJE'
const ROTA_NOME_COMPLETO = 'Roteiro Operacional de Tarefas para o PJE'
const ROTA_VERSAO      = '2.0.0'


// ── Geometria das janelas ─────────────────────────────────────
//
// Ao iniciar o modo assistente, a extensão:
//   1. Redimensiona a janela do PJE para ROTA_LARGURA_PJE da tela
//   2. Abre o assistente como nova janela com ROTA_LARGURA_ASSISTENTE
//   3. Posiciona ambas lado a lado, sem sobreposição
//
// Valores em percentual da largura total da tela (screen.availWidth).

const ROTA_LARGURA_PJE        = 0.80   // 80%
const ROTA_LARGURA_ASSISTENTE = 0.20   // 20%


// ── Storage — chaves ─────────────────────────────────────────
//
// Todas as chaves usadas no storage.local pelo modo assistente.
// Centralizadas aqui para evitar typos e facilitar manutenção.

const ROTA_CHAVES = {
    sessao:       'rotaSessao',        // estado completo da sessão ativa
    geometria:    'rotaGeometria',     // posições salvas das janelas
    tarefaAtiva:  'rotaTarefaAtiva',   // nome da tarefa selecionada no botão
}


// ── Sessão — estrutura padrão ────────────────────────────────
//
// Formato do objeto salvo em ROTA_CHAVES.sessao durante um fluxo ativo.
// Usado como referência; instâncias reais são criadas pelo estado.js.

const ROTA_SESSAO_PADRAO = {
    ativa:        false,        // há sessão em andamento?
    tarefa:       null,         // nome da tarefa (ex: 'triagem-inicial')
    etapaAtual:   null,         // id da etapa no grafo do roteiro
    processos:    [],           // lista de IDs a percorrer
    cursor:       0,            // índice do processo atual em `processos`
    checklist:    {},           // { etapaId: { feito: bool, nota: string } }
    inicio:       null,         // timestamp de início (Date.toISOString)
}


// ── Tipos de tarefa ───────────────────────────────────────────

const ROTA_TIPO = {
    SISTEMA:  'sistema',   // 🤖 tarefa pré-programada
    USUARIO:  'usuario',   // 👤 tarefa criada pelo usuário
}


// ── Emoji de identificação ────────────────────────────────────

const ROTA_EMOJI = {
    [ROTA_TIPO.SISTEMA]:  '🤖',
    [ROTA_TIPO.USUARIO]:  '👤',
}


// ── Cores do assistente ───────────────────────────────────────
//
// Paleta institucional do Rota PJE.
// Baseada nas cores do PJE — azul #0078aa + laranja #ffa726.

const ROTA_CORES = {
    // Principais
    azul:        '#0078aa',
    azulClaro:   '#2a5a8c',
    laranja:     '#ffa726',
    laranjaEsc:  '#D68C20',

    // Neutros
    branco:      '#ffffff',
    fundo:       '#f9f9fa',
    borda:       '#dcdcdc',
    texto:       '#2c3e50',
    textoSuave:  '#6b7c93',

    // Info
    infoBg:      '#eaf2fb',
    infoBorda:   '#add8e6',
    infoTexto:   '#1a3a5c',

    // Status
    perigo:      '#c62828',
    sucesso:     '#2e7d32',
}
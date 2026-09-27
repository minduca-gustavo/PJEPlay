// ============================================================
// estado.js
// Gerencia a sessão ativa do modo assistente no storage.local.
// Todas as leituras e escritas de sessão passam por aqui.
// ============================================================


// ── Iniciar sessão ────────────────────────────────────────────
//
// Cria uma nova sessão do zero e salva no storage.
// Chamado ao clicar em ROTA com uma tarefa 🤖 selecionada.

async function estado_iniciar(nomeTarefa, processos) {
    const sessao = {
        ...ROTA_SESSAO_PADRAO,
        ativa:      true,
        tarefa:     nomeTarefa,
        processos:  processos,
        cursor:     0,
        etapaAtual: null,     // roteiro.js define a etapa inicial ao carregar
        checklist:  {},
        inicio:     new Date().toISOString(),
    }
    await armazenar({ [ROTA_CHAVES.sessao]: sessao })
    return sessao
}


// ── Ler sessão ────────────────────────────────────────────────

async function estado_ler() {
    const cfg = await obterArmazenamento([ROTA_CHAVES.sessao])
    return cfg?.[ROTA_CHAVES.sessao] || null
}


// ── Atualizar campos da sessão ────────────────────────────────
//
// Faz merge parcial — só os campos passados são sobrescritos.

async function estado_atualizar(campos) {
    const sessao = await estado_ler()
    if (!sessao) return null
    const atualizada = { ...sessao, ...campos }
    await armazenar({ [ROTA_CHAVES.sessao]: atualizada })
    return atualizada
}


// ── Avançar etapa ─────────────────────────────────────────────
//
// Atualiza a etapa atual da sessão.
// O id da próxima etapa vem do roteiro (grafo de etapas).

async function estado_avancarEtapa(idEtapa) {
    return await estado_atualizar({ etapaAtual: idEtapa })
}


// ── Avançar processo ──────────────────────────────────────────
//
// Move o cursor para o próximo processo da fila.
// Retorna false se já era o último.

async function estado_avancarProcesso() {
    const sessao = await estado_ler()
    if (!sessao) return false

    const proximoCursor = sessao.cursor + 1
    if (proximoCursor >= sessao.processos.length) return false

    await estado_atualizar({
        cursor:     proximoCursor,
        etapaAtual: null,    // roteiro reinicia para o novo processo
        checklist:  {},
    })
    return true
}


// ── Processo atual ────────────────────────────────────────────

async function estado_processoAtual() {
    const sessao = await estado_ler()
    if (!sessao) return null
    return sessao.processos[sessao.cursor] || null
}


// ── Marcar etapa no checklist ─────────────────────────────────

async function estado_marcarEtapa(idEtapa, nota = '') {
    const sessao = await estado_ler()
    if (!sessao) return

    const checklist = { ...sessao.checklist }
    checklist[idEtapa] = { feito: true, nota, timestamp: new Date().toISOString() }

    await estado_atualizar({ checklist })
}


// ── Tarefa ativa (botão seletor) ──────────────────────────────
//
// Separado da sessão — persiste mesmo sem sessão ativa.
// É o que aparece no botão de tarefa na tela do PJE.

async function estado_lerTarefaAtiva() {
    const cfg = await obterArmazenamento([ROTA_CHAVES.tarefaAtiva])
    return cfg?.[ROTA_CHAVES.tarefaAtiva] || null
}

async function estado_salvarTarefaAtiva(nomeTarefa) {
    await armazenar({ [ROTA_CHAVES.tarefaAtiva]: nomeTarefa })
}


// ── Encerrar sessão ───────────────────────────────────────────
//
// Marca a sessão como inativa mas preserva os dados
// para geração do relatório final.

async function estado_encerrar() {
    return await estado_atualizar({ ativa: false })
}


// ── Limpar sessão ─────────────────────────────────────────────
//
// Apaga completamente a sessão do storage.
// Chamado após o relatório ser exibido/copiado.

async function estado_limpar() {
    await armazenar({ [ROTA_CHAVES.sessao]: null })
}


// ── Progresso ─────────────────────────────────────────────────
//
// Retorna um objeto de conveniência para exibição no assistente.

async function estado_progresso() {
    const sessao = await estado_ler()
    if (!sessao) return null
    return {
        total:    sessao.processos.length,
        atual:    sessao.cursor + 1,
        restantes: sessao.processos.length - sessao.cursor - 1,
        tarefa:   sessao.tarefa,
        etapa:    sessao.etapaAtual,
    }
}
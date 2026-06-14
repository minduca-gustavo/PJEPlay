// ============================================================
// acoes.js
// Ações genéricas compartilhadas entre todos os roteiros.
//
// Estas são operações atômicas que qualquer roteiro pode usar.
// Ações específicas de uma tarefa ficam no roteiro da tarefa.
//
// Convenção de nomenclatura:
//   acao_navegacao_*   → abrir janelas/telas do PJE
//   acao_processo_*    → ações sobre o processo atual
//   acao_clipboard_*   → cópia de dados para área de transferência
//   acao_painel_*      → controle do painel assistente
//   acao_api_*         → requisições diretas à API (minimizadas)
// ============================================================


// ── Utilitário interno ────────────────────────────────────────

async function inserirGigsNaTelaDeDetalhesDoProcesso(tipoAtividade = 'Prazo', dataPrazo = null, dias = null, responsavel = '', observacao = '', salvar = 'nao'){
    let novaAtividade = await aguardarElementoNovo('detalhesDoProcessoBotaoNovaAtividadeGigs', {timeout: 20000})
    if (!novaAtividade) return
    await clicar(novaAtividade)
    let inputTipoAtividade = await aguardarElementoNovo('detalhesDoProcessoInputTipoAtividadeGigs')
    await focar(inputTipoAtividade)
    await suspender (200)
    await preencherCampoComEscolhaDeOpcao(inputTipoAtividade, tipoAtividade)
    if (dias && !dataPrazo){
        let inputDias = await aguardarElementoNovo('detalhesDoProcessoInputDiasGigs')
        await suspender (200)
        await preencher(inputDias, dias)
    }
    if (dataPrazo){
        let inputData = await aguardarElementoNovo('detalhesDoProcessoInputDataPrazoGigs')
        await suspender (200)
        await preencher(inputData, dataPrazo)
    }
    if (responsavel){
        let inputResponsavel = await aguardarElementoNovo('detalhesDoProcessoInputResponsavelGigs')
        await focar(inputResponsavel)
        await suspender (200)
        await preencherCampoComEscolhaDeOpcao(inputResponsavel, responsavel)
    }
    if (observacao){
        let inputObservacao = await aguardarElementoNovo('detalhesDoProcessoInputObservacaoGigs')
        await suspender (200)
        await preencher(inputObservacao, observacao)
    }
    if (salvar === 'sim'){
        let botaoSalvar = await aguardarElementoNovo('detalhesDoProcessoBotaoSalvarGigs')
        await suspender (200)
        await clicar(botaoSalvar)
        await suspender (2000)
    }
    return

}

async function _acao_fetch(url = '', metodo = 'GET', corpo = null) {
    const token    = rota_cookie('Xsrf-Token') || rota_cookie('XSRF-TOKEN')
    const instancia = CONFIGURACAO?.pessoa?.instancia || '1'
    try {
        const opts = {
            method:      metodo,
            mode:        'cors',
            credentials: 'include',
            headers: {
                'Idempotency-Key':  rota_idempotencia(),
                'X-Grau-Instancia': instancia,
                'X-XSRF-TOKEN':     token,
                'Content-Type':     'application/json',
                'Accept':           'application/json, text/plain, */*',
            },
        }
        if (corpo) opts.body = typeof corpo === 'string' ? corpo : JSON.stringify(corpo)
        const r = await fetch(url, opts)
        if (!r.ok) { relatar('HTTP ' + r.status, url, 'erro'); return null }
        const texto = await r.text()
        try { return JSON.parse(texto) } catch { return texto }
    } catch (e) {
        relatar('acao_fetch erro:', e, 'erro')
        return null
    }
}

function _acao_idProcesso() {
    const processo = interceptador_lerProcesso()
    return processo?.id || processo?.idProcesso || ''
}

function _acao_numProcesso() {
    const processo = interceptador_lerProcesso()
    return processo?.numero || processo?.numeroProcesso || ''
}


// ── NAVEGAÇÃO ─────────────────────────────────────────────────

// Abre a tela de detalhes do processo (sempre ao fundo no modo guiado)
async function acao_navegacao_detalhes(idProcesso = '') {
    const id  = idProcesso || _acao_idProcesso()
    if (!id) return relatar('acao_navegacao_detalhes: ID não encontrado', '', 'erro')
    const url = `${location.origin}/pjekz/processo/${id}/detalhe`
    window.open(url, 'rota-pje-detalhe' + id)
}

// Abre a tarefa mais recente do processo
async function acao_navegacao_tarefa(idProcesso = '') {
    const id = idProcesso || _acao_idProcesso()
    if (!id) return

    const url     = `${location.origin}/pje-comum-api/api/processos/id/${id}/tarefas?maisRecente=true`
    const dados   = await _acao_fetch(url)
    const tarefa  = Array.isArray(dados) ? dados[0] : dados
    const idTarefa = tarefa?.idTarefa

    if (!idTarefa) return relatar('acao_navegacao_tarefa: tarefa não encontrada', '', 'erro')

    const urlTarefa = `${location.origin}/pjekz/processo/${id}/tarefa/${idTarefa}`
    window.open(urlTarefa, 'rota-pje-janela')
}

// Abre a tela de audiências do processo
async function acao_navegacao_audiencias(idProcesso = '') {
    const id  = idProcesso || _acao_idProcesso()
    if (!id) return
    const url = `${location.origin}/pjekz/processo/${id}/audiencias-sessoes`
    window.open(url, 'rota-pje-janela')
}

// Abre a tela de comunicações (intimações)
async function acao_navegacao_comunicacoes(idProcesso = '') {
    const id  = idProcesso || _acao_idProcesso()
    if (!id) return
    const url = `${location.origin}/pjekz/processo/${id}/comunicacoesprocessuais`
    window.open(url, 'rota-pje-janela')
}

// Abre a tela de modelos de documentos (para o usuário escolher o próprio modelo)
function acao_navegacao_modelos() {
    const url = `${location.origin}/pjekz/configuracao/modelos-documentos`
    window.open(url, 'rota-pje-modelos')
}


// ── PROCESSO ──────────────────────────────────────────────────

// Encaminha para conclusão com o juiz informado
async function acao_processo_encaminharConclusao(idJuiz = '') {
    const id = _acao_idProcesso()
    if (!id || !idJuiz) return relatar('acao_processo_encaminharConclusao: parâmetros ausentes', '', 'erro')

    const url  = `${location.origin}/pje-comum-api/api/processos/id/${id}/conclusao`
    const corpo = { idResponsavel: idJuiz }
    const resp  = await _acao_fetch(url, 'POST', corpo)

    if (resp !== null) {
        relatar('Encaminhado para conclusão', { id, idJuiz }, 'acao')
        await estado_marcarEtapa('conclusao')
    }
    return resp
}

// Encaminha para tarefa específica
async function acao_processo_encaminharTarefa(nomeTarefa = '') {
    const id = _acao_idProcesso()
    if (!id || !nomeTarefa) return

    const url   = `${location.origin}/pje-comum-api/api/processos/id/${id}/tarefas`
    const corpo  = { nomeTarefa }
    return await _acao_fetch(url, 'POST', corpo)
}

// Lê dados básicos do processo atual (via interceptador — sem requisição se já disponível)
async function acao_processo_obterDados() {
    const cached = interceptador_lerProcesso()
    if (cached) return cached

    const num  = _acao_numProcesso() || location.pathname.match(/processo\/(\d+)/)?.[1]
    if (!num) return null

    const url  = `${location.origin}/pje-consulta-api/api/processos/dadosbasicos/${num}`
    return await _acao_fetch(url)
}

// Lê partes do processo (via interceptador se disponível)
async function acao_processo_obterPartes() {
    const cached = interceptador_lerPartes()
    if (cached) return cached

    const id = _acao_idProcesso()
    if (!id) return null

    return await cache_obterOuBuscar(
        `partes-${id}`,
        () => _acao_fetch(`${location.origin}/pje-comum-api/api/processos/id/${id}/partes`),
        1
    )
}

// Obtém lista de responsáveis (usuários internos) — cacheado 7 dias
async function acao_api_obterResponsaveis() {
    return await cache_obterOuBuscar(
        CACHE_CHAVES.responsaveis,
        () => _acao_fetch(`${location.origin}/pje-comum-api/api/usuarios/internos/pororgaojulgador`),
        7
    )
}

// Obtém tipos de atividade (para GIGs) — cacheado 7 dias
async function acao_api_obterTiposAtividade() {
    return await cache_obterOuBuscar(
        CACHE_CHAVES.tiposAtividade,
        () => _acao_fetch(`${location.origin}/pje-gigs-api/api/tiposatividades`),
        7
    )
}

// Obtém salas físicas de audiência — cacheado 7 dias
async function acao_api_obterSalasFisicas() {
    return await cache_obterOuBuscar(
        CACHE_CHAVES.salasFisicas,
        () => _acao_fetch(`${location.origin}/pje-administracao-api/api/salasfisicas`),
        7
    )
}


// ── CLIPBOARD ─────────────────────────────────────────────────

// Copia texto para a área de transferência com feedback visual no botão
async function acao_clipboard_copiar(texto = '', btnOrigem = null) {
    if (!texto) return

    try {
        await navigator.clipboard.writeText(texto)

        if (btnOrigem) {
            const orig             = btnOrigem.textContent
            const origColor        = btnOrigem.style.color
            btnOrigem.textContent  = '✅ Copiado!'
            btnOrigem.style.color  = ROTA_CORES.sucesso || 'green'
            setTimeout(() => {
                btnOrigem.textContent = orig
                btnOrigem.style.color = origColor
            }, 1500)
        }

        relatar('Copiado para clipboard:', texto, 'acao')
    } catch (e) {
        relatar('acao_clipboard_copiar erro:', e, 'erro')
    }
}

// Copia o número do processo atual
async function acao_clipboard_copiarNumero(btn = null) {
    const num = _acao_numProcesso()
    if (num) await acao_clipboard_copiar(num, btn)
}

// Copia nome das partes (reclamante - reclamada)
async function acao_clipboard_copiarPartes(btn = null) {
    const partes = await acao_processo_obterPartes()
    if (!partes?.length) return

    const reclamante = partes.find(p => p.tipoParte?.toLowerCase().includes('reclamante'))
    const reclamada  = partes.find(p => p.tipoParte?.toLowerCase().includes('reclamada'))

    const texto = [
        reclamante?.nome,
        reclamada?.nome,
    ].filter(Boolean).join(' x ')

    if (texto) await acao_clipboard_copiar(texto, btn)
}


// ── PAINEL ────────────────────────────────────────────────────

// Avança para a próxima etapa do roteiro
async function acao_painel_proximaEtapa(idEtapa = '') {
    await estado_avancarEtapa(idEtapa)
    document.dispatchEvent(new CustomEvent('RotaAvancarEtapa', { detail: { idEtapa } }))
}

// Avança para o próximo processo
async function acao_painel_proximoProcesso() {
    const temProximo = await estado_avancarProcesso()
    if (temProximo) {
        document.dispatchEvent(new CustomEvent('RotaProximoProcesso'))
    } else {
        document.dispatchEvent(new CustomEvent('RotaEncerrar'))
    }
}

// Encerra a sessão e gera o relatório
async function acao_painel_encerrar() {
    await estado_encerrar()
    document.dispatchEvent(new CustomEvent('RotaEncerrar'))
}


// ── MENU DO PROCESSO (automação de UI) ────────────────────────
//
// Aciona itens do menu do processo no PJE via DOM.
// Usa aguardarElemento (dom.js) e suspender (execucao.js).

async function acao_ui_abrirMenu(item = '') {
    const menu = await aguardarElemento('[aria-label="Menu do processo"],[aria-label="Menu da tarefa"]', 5000)
    if (!menu) return relatar('acao_ui_abrirMenu: menu não encontrado', '', 'erro')
    await suspender(100)
    menu.click()

    if (item) {
        const botao = await aguardarElemento(`[descricao="${item}"] button`, 3000)
        if (!botao) return relatar('acao_ui_abrirMenu: item não encontrado: ' + item, '', 'erro')
        await suspender(100)
        botao.click()
    }
}

// Seleciona uma opção em dropdown Angular Material
async function acao_ui_selecionarOpcao(seletor = '', texto = '') {
    if (!texto) return
    const controle = await aguardarElemento(seletor, 3000)
    if (!controle) return
    controle.click()
    await aguardarElemento('mat-option', 3000)
    await suspender(100)
    const xpath  = `//mat-option[.//span[contains(text(), "${texto}")]]`
    const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
    const opcao  = result.singleNodeValue
    if (opcao) opcao.click()
}

// Aguarda mensagem de snackbar (confirmação de ação do PJE)
async function acao_ui_aguardarMensagem(texto = '', timeout = 8000) {
    const xpath   = `//snack-bar-container[.//span[contains(text(),"${texto}")]]`
    const result  = await aguardarElemento(xpath, timeout)
    return !!result
}


// ── FAVORITOS ─────────────────────────────────────────────────
//
// Salva e recupera juízes favoritos no storage.local.

async function acao_favoritos_salvarJuiz(idJuiz = '', nomeJuiz = '') {
    if (!idJuiz) return
    const cfg       = await obterArmazenamento(['rotaFavoritos'])
    const favoritos = cfg?.rotaFavoritos || {}
    favoritos.juizes = favoritos.juizes || []

    const jaExiste = favoritos.juizes.some(j => j.id === idJuiz)
    if (!jaExiste) {
        favoritos.juizes.push({ id: idJuiz, nome: nomeJuiz })
        await armazenar({ rotaFavoritos: favoritos })
    }
}

async function acao_favoritos_removerJuiz(idJuiz = '') {
    if (!idJuiz) return
    const cfg       = await obterArmazenamento(['rotaFavoritos'])
    const favoritos = cfg?.rotaFavoritos || {}
    favoritos.juizes = (favoritos.juizes || []).filter(j => j.id !== idJuiz)
    await armazenar({ rotaFavoritos: favoritos })
}

async function acao_favoritos_listarJuizes() {
    const cfg = await obterArmazenamento(['rotaFavoritos'])
    return cfg?.rotaFavoritos?.juizes || []
}

async function acao_favoritos_salvarModelo(chave = '', idModelo = '', nomeModelo = '') {
    if (!chave || !idModelo) return
    const cfg       = await obterArmazenamento(['rotaFavoritos'])
    const favoritos = cfg?.rotaFavoritos || {}
    favoritos.modelos = favoritos.modelos || {}
    favoritos.modelos[chave] = { id: idModelo, nome: nomeModelo }
    await armazenar({ rotaFavoritos: favoritos })
}

async function acao_favoritos_lerModelo(chave = '') {
    const cfg = await obterArmazenamento(['rotaFavoritos'])
    return cfg?.rotaFavoritos?.modelos?.[chave] || null
}


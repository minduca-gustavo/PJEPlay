// ============================================================
// tarefas/triagem-inicial/roteiro-assistente.js
// Roteiro da janela assistente para a Triagem Inicial.
//
// Roda no contexto do assistente.html.
// Filtra pelo parâmetro pjerota_tarefa da URL.
//
// Por ora: aguarda os dados chegarem via storage e remove
// o carregando. A interface será montada aqui futuramente.
// ============================================================

async function triagem_assistente_iniciar() {

    // ── Filtra pelo parâmetro da URL ──────────────────────────
    const tarefa = new URL(location.href).searchParams.get('pjerota_tarefa')
    if (tarefa !== 'triagem-inicial') return

    // ── Aguarda sinal de dados prontos via storage ────────────
    //
    // O roteiro.js da página de detalhes salva rota_dadosProntos: true
    // quando termina de coletar todos os dados do processo.
    // Aqui ficamos ouvindo até esse sinal chegar.

    await new Promise(resolver => {
        browser.storage.onChanged.addListener(function ouvir(mudancas) {
            if (mudancas['rota_dadosProntos']?.newValue === true) {
                browser.storage.onChanged.removeListener(ouvir)
                // Limpa o sinal para não reativar em aberturas futuras
                armazenar({ rota_dadosProntos: false })
                resolver()
            }
        })
    })

    // ── Remove o carregando ───────────────────────────────────
    removerCarregando()

    // ── Interface será montada aqui futuramente ───────────────
    //
    // Exemplo de uso quando chegar a hora:
    //
    //   const dados = await obterArmazenamento(['rota_dadosTriagemInicial'])
    //   const triagem = dados?.rota_dadosTriagemInicial
    //
    //   criaDiv({ id: 'bloco-autuacao', ancestral: 'rota-corpo' })
    //   criaTitulo({ id: 'titulo-autuacao', texto: 'Autuação', ancestral: 'bloco-autuacao' })
    //   criaTexto({ id: 'texto-partes', texto: formatarPartes(triagem.partes), ancestral: 'bloco-autuacao' })
    //   ...
}

// Auto-executa ao carregar o script
triagem_assistente_iniciar()
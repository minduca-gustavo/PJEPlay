// ============================================================
// tarefas/con2-prazo-vencido/roteiro-assistente.js
// Roteiro da janela assistente para a Con2 Prazo Vencido.
//
// Roda no contexto do assistente.html.
// Filtra pelo parâmetro rotapje_tarefa da URL.
//
// Por ora: aguarda os dados chegarem via storage e remove
// o carregando. A interface será montada aqui futuramente.
// ============================================================



async function visualizador_de_documentos_assistente_iniciar() {
    let tarefaNome = 'visualizador_de_documentos'
    
    // ── Filtra pelo parâmetro da URL ──────────────────────────
    const tarefa = new URL(location.href).searchParams.get('rotapje_tarefa')
    if (tarefa !== 'visualizador_de_documentos') return
    console.log('%c[Rota PJE]%c 13', LOG.teste, 'color:inherit')
    // ── Aguarda sinal de dados prontos via storage ────────────
    //
    // O roteiro.js da página de detalhes salva rota_dadosProntos: true
    // quando termina de coletar todos os dados do processo.
    // Aqui ficamos ouvindo até esse sinal chegar.

    try {
        await Promise.race([
            new Promise(resolver => {
                browser.storage.onChanged.addListener(function ouvir(mudancas) {
                    if (mudancas['rota_dadosProntos']?.newValue === true) {
                        browser.storage.onChanged.removeListener(ouvir)
                        armazenar({ rota_dadosProntos: false })
                        resolver()
                    }
                })
            }),
            new Promise((_, rejeitar) => setTimeout(() => rejeitar(), 30000))
        ])
    } catch {
        rota_avisoTemporario('Ocorreu um erro ao carregar os dados. Tente novamente.', 'erro', 10000)
        return
    }

    // ── Remove o carregando ───────────────────────────────────
    removerCarregando()
    let dados = await obterArmazenamento(['rota_dadosVisualizadorDeDocumentos'])
    console.log('%c[Rota PJE]%c dados?.rota_dadosVisualizadorDeDocumentos' + JSON.stringify(dados?.rota_dadosVisualizadorDeDocumentos), LOG.rosa, 'color:inherit')
    let bloco = 'inicial'
    console.log('%c[Rota PJE]%c dados: ' + JSON.stringify(dados), LOG.rosa, 'color:inherit')
    let idDiv = id(tarefaNome)
    let idInput = id(tarefaNome, 'tipos')
    criaDiv({ id: idDiv, ancestral: 'rota_corpo' })
    criaTitulo({ id: id(tarefaNome, 'titulo'), texto: 'Visualizador de Documentos', ancestral: idDiv })
    criaTextoQueAbrePassandoOMouse({
        id: id(tarefaNome, 'instrucao_longa'),
        texto: `Passe o mouse para ver como utilizar este assistente.
Clique para fixar/desafixar.`,
        textoBox: `No input abaixo, digite os termos que você deseja buscar no tipo do documento ou no título. Os tipos selecionados serão mostrados abaixo, em formato de tabela.
Clicando em cada botão de documento, o próximo será aberto. Escolha a ordem - do mais novo para o mais antigo ou do mais antigo para o mais novo.
Ao clicar nos botões "🎛️", o documento escolhido é detalhado na tabela criada.`,
        ancestral: idDiv
    })
    criaSubTitulo({
        id: idDiv + '_subTitulo',
        texto: 'Configurações salvas',
        ancestral: idDiv
    })
    criaDiv({
        id: idDiv + '_divMenu',
        ancestral: idDiv
    })
    let carregamento = true
    let opcoesArmazenadas = {}
    await criarMenu(carregamento)
    async function criarMenu(carregamento = false) {
        // Limpa o container antes de recriar
        document.getElementById(idDiv + '_divMenu').innerHTML = ''

        let armazenamento = await obterArmazenamento(idDiv)
        let conjuntoTermos = armazenamento[idDiv] || {}
        let opcaoSelecionada = conjuntoTermos?.opcaoSelecionada || 'inicial'
        let opcoes = [{ valor: 'inicial', texto: 'Selecione uma opção' }]
        let opcoesArmazenamento = conjuntoTermos?.opcoesSalvas?.map(d => ({ texto: d?.texto, valor: d?.valor, termos: d?.termos })) || []
        opcoes.push(...opcoesArmazenamento)
        opcoesArmazenadas = opcoesArmazenamento

        criaMenuSuspenso({
            id: idDiv + '_menuSuspenso',
            opcoes: opcoes,
            valorInicial: opcaoSelecionada,
            ancestral: idDiv + '_divMenu',
            acao: async (valorAtual) => {
                if (valorAtual === 'inicial') {
                    document.getElementById(salvarId + 'input').value = ''
                    atualizaArmazenamento({ chave: 'opcaoSelecionada' }, valorAtual)
                    return
                }
                let opcaoEscolhida = opcoesArmazenamento.find(op => op.valor === valorAtual)
                if (!carregamento) document.getElementById(idInput).value = opcaoEscolhida?.termos || ''
                document.getElementById(salvarId + 'input').value = opcaoEscolhida?.texto || ''
                atualizaArmazenamento({ chave: 'opcaoSelecionada' }, valorAtual)
            }
        })
    }
    let salvarId = idDiv + '_salvar'
    let divInputSalvar = criaDiv({
        id: salvarId,
        ancestral: idDiv,
        rowColumn: 'row'
    })
    let inputSalvar = criaInput({
        id: salvarId + 'input',
        ancestral: salvarId,
        placeholder: 'Digite o nome da configuração'
    })
    let botaoSalvar = criaBotaoLaranja({
        id: salvarId + 'botao',
        texto: '💾',
        ancestral: salvarId,
        acao: async () => {
            let nome = document.getElementById(salvarId + 'input')?.value || null
            if(!nome) {
                document.getElementById(salvarId + 'input').value = 'Digite um nome.'
                await suspender (3000)
                document.getElementById(salvarId + 'input').value = ''
                return
            }
            let valores = document.getElementById(idInput)?.value
            if(!valores){
                let nome = document.getElementById(salvarId + 'input')?.value
                document.getElementById(salvarId + 'input').value = 'Não há termos a salvar.'
                await suspender (3000)
                document.getElementById(salvarId + 'input').value = nome
                return
            }
            await atualizaArmazenamento({chave: 'opcoesSalvas', modo: 'incluir'}, {valor: nome.replace(/\s/g, '_'), texto: nome, termos: valores})
            await criarMenu()
        }
    })
    let botaoExcluir = criaBotaoLaranja({
        id: salvarId + 'botaoExcluir',
        texto: '🗑️',
        ancestral: salvarId,
        acao: async () => {
            let menuSuspenso = document.getElementById(idDiv + '_menuSuspenso')
            let valorAtual = menuSuspenso?.value
            if (!valorAtual || valorAtual === 'inicial') {
                let inputEl = document.getElementById(salvarId + 'input')
                let anterior = inputEl.value
                inputEl.value = 'Selecione uma configuração para excluir.'
                await suspender(3000)
                inputEl.value = anterior
                return
            }
            await atualizaArmazenamento({ chave: 'opcoesSalvas', modo: 'excluir' }, valorAtual)
            await atualizaArmazenamento({ chave: 'opcaoSelecionada' }, 'inicial')
            document.getElementById(salvarId + 'input').value = ''
            document.getElementById(idInput).value = ''
            await criarMenu()
            criaVisualizador(idInput)
        }
    })
    async function atualizaArmazenamento({ chave, modo }, valor) {
        let armazenamento = await obterArmazenamento(idDiv)
        let armazena = armazenamento[idDiv] || {
            opcaoSelecionada: '',
            opcoesSalvas: []
        }

        if (chave === 'opcoesSalvas' && modo === 'incluir') {
            let indiceExistente = armazena.opcoesSalvas.findIndex(op => op.valor === valor.valor)
            if (indiceExistente !== -1) {
                armazena.opcoesSalvas[indiceExistente] = valor
            } else {
                armazena.opcoesSalvas.push(valor)
            }
        } else if (chave === 'opcoesSalvas' && modo === 'excluir') {
            armazena.opcoesSalvas = armazena.opcoesSalvas.filter(op => op.valor !== valor)
        } else {
            armazena[chave] = valor
        }

        armazenar({ [idDiv]: armazena })
    }
    /*
        armazena:{
            opcaoSelecionada: '',
            opcoesSalvas: [{valor: '', texto: '', termos: ''}]
        }
    */
    document.getElementById(salvarId + 'botao').style.width = 'fit-content'
    document.getElementById(salvarId + 'input').container.style.width = '100%'
    document.getElementById(salvarId + 'input').container.style.margin = '0px 0px 0px 4px'
    criaTooltip({
        id: salvarId + 'tooltip',
        texto: 'Salva a configuração atual (sobrescreve se o nome já existir).',
        elemento: botaoSalvar
    })
    document.getElementById(salvarId + 'botaoExcluir').style.width = 'fit-content'
    criaTooltip({
        id: salvarId + 'tooltipExcluir',
        texto: 'Exclui a configuração selecionada no menu acima.',
        elemento: botaoExcluir
    })
    criaInputAnotacao({ 
        id: idInput,
        placeholder: 'Digite os termos a buscar no título e tipo do documento e pressione o botão laranja.', 
        ancestral: idDiv
    })
    criaBotaoLaranja({
        id: id(tarefaNome, 'botao_tipos'), 
        texto: 'Seleciona Tipos', 
        ancestral: idDiv,
        acao: () => criaVisualizador(idInput)
    })
    let valoresSalvos = ''
    if (carregamento || document.getElementById(idDiv + '_menuSuspenso').value !== 'inicial'){
        let opcaoSelecionada = document.getElementById(idDiv + '_menuSuspenso').value
        let opcaoEscolhida = opcoesArmazenadas.find(op => op.valor === opcaoSelecionada)
        document.getElementById(idInput).value = opcaoEscolhida?.termos || ''
        document.getElementById(salvarId + 'input').value = opcaoEscolhida?.texto.replace(/\s/g, '_') || ''
        criaVisualizador(idInput)
    }
    function criaVisualizador(input){
        let idVisualizador = id(tarefaNome, 'visualizador')
        let valores = document.getElementById(input)?.value
        if (!valores){
            document.getElementById(idVisualizador)?.remove()
            criaTexto({
                id: idVisualizador,
                texto: 'Não há termos a buscar.',
                ancestral: idDiv
            })
            return
        }
        valoresSalvos = valores
        document.getElementById(idVisualizador)?.remove()
        criaVisualizadorDeDocumentos({
            id: idVisualizador,
            ancestral: idDiv,
            timeline: dados?.rota_dadosVisualizadorDeDocumentos?.timeline,
            termos: valores,
            abrir: (documento) => comandar(['visualizador_de_documentos_abrir_documentos'], [documento])
        })
    }
}


// Auto-executa ao carregar o script
visualizador_de_documentos_assistente_iniciar()
// ============================================================
// tarefas/con2-prazo-vencido/roteiro-assistente.js
// Roteiro da janela assistente para a Con2 Prazo Vencido.
//
// Roda no contexto do assistente.html.
// Filtra pelo parâmetro pjerota_tarefa da URL.
//
// Por ora: aguarda os dados chegarem via storage e remove
// o carregando. A interface será montada aqui futuramente.
// ============================================================



async function con2_prazo_vencido_assistente_iniciar() {
    let tarefaNome = 'con2_prazo_vencido'
    
    // ── Filtra pelo parâmetro da URL ──────────────────────────
    const tarefa = new URL(location.href).searchParams.get('pjerota_tarefa')
    if (tarefa !== 'con2_prazo_vencido') return
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
    let dados = await obterArmazenamento(['rota_dadosCon2PrazoVencido'])
    console.log('%c[Rota PJE]%c dados?.rota_dadosCon2PrazoVencido' + JSON.stringify(dados?.rota_dadosCon2PrazoVencido), LOG.rosa, 'color:inherit')
    let bloco = 'inicial'

    criaDiv({ id: id(tarefaNome, bloco), ancestral: 'rota_corpo' })
    criaTitulo({ id: id(tarefaNome, bloco, 'titulo'), texto: 'Con2 Prazo Vencido', ancestral: id(tarefaNome, bloco) })
    criaTextoQueAbrePassandoOMouse({
        id: id(tarefaNome, bloco, 'instrucao_longa'),
        texto: `Passe o mouse para ver como utilizar este assistente.
Clique para fixar/desafixar.`,
        textoBox: `No input abaixo, digite os termos que você deseja buscar no tipo do documento ou no título. Os tipos selecionados serão mostrados abaixo, em formato de tabela.
Clicando em cada botão de documento, o próximo será aberto. Escolha a ordem - do mais novo para o mais antigo ou do mais antigo para o mais novo.
Abaixo da tabela de documentos, o menu suspenso permite escolher, entre os tipos, aquele que vai mostrar detalhadamente cada documento. Clique para abrir.`,
        ancestral: id(tarefaNome, bloco)
    })
    criaInputAnotacao({ id: id(tarefaNome, bloco, 'tipos'), placeholder: 'Digite os termos a buscar no título e tipo do documento e pressione o botão laranja.', ancestral: id(tarefaNome, bloco) })
    criaBotaoLaranja({id: id(tarefaNome, bloco, 'botao_tipos'), texto: 'Seleciona Tipos', ancestral: id(tarefaNome, bloco)})
    // ── Bloco: autuacao ───────────────────────────────────────
    bloco = 'solucao'

    criaDiv({ id: id(tarefaNome, bloco), ancestral: 'rota_corpo' })
    criaTitulo({ id: id(tarefaNome, bloco, 'titulo'), texto: 'Solução(ões) do Processo', ancestral: id(tarefaNome, bloco) })
    let i = 0
    
    let solucoes = dados?.rota_dadosCon2PrazoVencido?.solucao || []
    console.log('%c[Rota PJE]%c solucoes.length: ' + JSON.stringify(solucoes.length), LOG.rosa, 'color:inherit')
    if (solucoes.length) {
        criaTabelaDeSolucoes(solucoes)
    } else {
        criaTexto({
            id: id(tarefaNome, bloco, 'sem_solucao'),
            texto: 'Não foram encontradas sentenças.',
            ancestral: id(tarefaNome, bloco),
        })
    }

    function criaTabelaDeSolucoes(solucoes){
        let nomeTabela = 'tabelaSolucoes'
        let divTabela = criaDiv({
            id: id(tarefaNome, bloco, nomeTabela),
            ancestral: id(tarefaNome, bloco),
            rowColumn: 'column'
        })
        let colunas = solucoes.length == 1 ? 1 : 2
        let linhas = solucoes.length == 1 ? 1: Math.ceil(solucoes.length / 2)
        console.log('%c[Rota PJE]%c linhas: ' + JSON.stringify(linhas), LOG.erro, 'color:inherit')
        for (let i = 0; i < linhas; i++){
            let div = criaDiv({
                id: id(tarefaNome, bloco, nomeTabela, 'linha' + i),
                ancestral: id(tarefaNome, bloco, nomeTabela),
                rowColumn: 'row'
            })
        }
        let i = 0
        for (s of solucoes){
            let linha = Math.floor(i / 2)
            let celula = criaDiv({
                id: id(tarefaNome, bloco, nomeTabela, 'celula' + i),
                ancestral: id(tarefaNome, bloco, nomeTabela, 'linha' + linha),
            })
            celula.style.width = '100%'
            
            let plaquinha = criaPlaquinhaComTooltip({
                id: id(tarefaNome, bloco, nomeTabela, 'plaquinha' + i),
                texto: s.split('-', 2)[0].trim(),
                cor: corDaSolucao(s),
                tooltip: s,
                ancestral: id(tarefaNome, bloco, nomeTabela, 'celula' + i)
            })
            let pl = document.querySelector('#' + id(tarefaNome, bloco, nomeTabela, 'plaquinha' + i))
            pl.style.width = '100%'
            pl.style.textAlign = 'center'
            i++

        }

        function corDaSolucao(solucao) {
            if (solucao.includes('IMPROCEDENTES') || solucao.includes('EXTINTO')) return 'vermelho'
            if (solucao.includes('EM PARTE'))    return 'amarelo'
            if (solucao.includes('PROCEDENTES')) return 'verde'
            return ''
        }

    }

    bloco = 'documentos'
    criaDiv({ id: id(tarefaNome, bloco), ancestral: 'rota_corpo' })
    criaTitulo({ id: id(tarefaNome, bloco, 'titulo'), texto: 'Documentos do Processo', ancestral: id(tarefaNome, bloco) })
    
    let tiposDocumentos = [
        { chave: 'sentenca',         label: 'Sentença' },
        { chave: 'recurso',          label: 'Recurso' },
        { chave: 'deposito',         label: 'Depósito' },
        { chave: 'custas',           label: 'Custas' },
        { chave: 'seguro',           label: 'Seguro/Fiança', opcoes: ['fianca', 'seguro'] },
        { chave: 'procuracao',       label: 'Procuração' },
        { chave: 'substabelecimento',label: 'Substabelecimento' },
    ]
    let documentosTimeline = dados?.rota_dadosCon2PrazoVencido?.timeline || []
    
    await criaWidgetDocumentos({
        ancestral:  id(tarefaNome, bloco),
        documentos: documentosTimeline,
        tipos:      tiposDocumentos,
        idPrefixo:  id(tarefaNome, bloco, 'widget'),
        onAbrir:    (documento) => comandar(['con2_prazo_vencido_abrir_documentos'],[documento]),
        modo:       'tipo',
    })

}




// Auto-executa ao carregar o script
con2_prazo_vencido_assistente_iniciar()
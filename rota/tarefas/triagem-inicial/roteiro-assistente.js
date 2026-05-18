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
    let dados = await obterArmazenamento(['rota_dadosTriagemInicial'])
    console.log('%c[Rota PJE]%c Dados: ' + JSON.stringify(dados?.rota_dadosTriagemInicial?.processo?.id, null, 2), LOG.teste, 'color:inherit')
    criaDiv({id: 'bloco-inicial', ancestral: 'rota-corpo'})
    criaTitulo({id: 'bloco-inicial-titulo', texto: 'Triagem Inicial', ancestral: 'bloco-inicial'})
    criaTextoQueAbrePassandoOMouse({
        id:'bloco-inicial-instrucao-longa', 
        texto:`Passe o mouse para ver a instrução completa da tarefa.
Clique para fixar/desafixar.`,
        textoBox: `Como utilizar este assistente:
	- Anote no campo acima o que precisar. Esta anotação é local, e será perdida ao fechar a janela.
	- O assistente traz informações que podem ser confrontadas com o processo lado a lado. Passe o mouse e clique no box para fixar as informações e fazer a confrontação.
Confronte a petição inicial com os dados da autuação no sistema:
	- As partes estão devidamente cadastradas? Há partes mencionadas na petição inicial que não constam da autuação ou vice-versa?
	- Todas as partes estão com CPF/CNPJ corretos?
	- Os endereços das partes na autuação conferem com os endereços da petição inicial? Todos têm CEP cadastrado?
	- O valor da causa na autuação confere com o valor que consta da petição inicial?
	- Verifique se o Rito está correto, principalmente em casos em que há Órgãos Públicos cadastrados. 
	- Alguma das reclamadas está em zona rural ou área não atendida pelos Correios? Qual?
Para fazer essa conferência de maneira mais rápida, utilize este assistente assim:
Passe o mouse para abrir os dados da autuação, e CLIQUE no box. Isso fixará os dados. Com a petição inicial ao lado, faça a conferência.
Na petição inicial, verifique:
	- Há pedidos ilíquidos?
	- Há pedidos no rol final sem a respectiva fundamentação (causa de pedir)?
	- Há causa de pedir na fundamentação sem o respectivo pedido no rol final?
	- Há pedidos ilíquidos (sem valor estimado)?
    - Há pedido de perícia?
Verificação dos documentos:
	- O reclamante juntou seus documentos pessoais?
	- Há procuração/substabelecimento?
Após a conferência de todos os itens, utilize os botões para tomar as providências necessárias quanto à retificação da autuação ou minuta de despacho para determinar a retificação pelo reclamante.
Caso esteja tudo certo, utilize o bloco de designação de audiência para designar a audiência, despachar ou certificar, intimar as partes, se o caso, e colocar o GIG de acompanhamento.`,
        ancestral: 'bloco-inicial'}
    )
    criaInputAnotacao({id: 'rota-triagemInicialAnotacao', placeholder: 'Utilize este campo para suas anotações. As informações não serão salvas e não aparecerão em lugar algum.', ancestral: 'bloco-inicial'})
    criaDiv({id: 'bloco-autuacao', ancestral: 'rota-corpo'})
    criaTitulo({id: 'bloco-autuacao-titulo', texto: 'Autuação/Petição Inicial/Documentos', ancestral: 'bloco-autuacao'})
    criaTextoQueAbrePassandoOMouse({
        id:'bloco-autuacao-dados-das-partes', 
        texto:`Passe o mouse para ver os dados das partes.
Clique para fixar/desafixar.`,
        textoBox: `Dados das partes:
${formatarPartes(dados?.rota_dadosTriagemInicial?.partes)}`,
        ancestral: 'bloco-autuacao'}
    )
    
    criaTexto({
        id: 'bloco-autuacao-instrucao-curta', 
        texto: `Verifique os dados da autuação, se estão corretos e correspondem à petição inicial.
        Tenha atenção aos seguintes pontos:
        - Documentos das partes;
        - Endereços (CEP, zona rural ou área não atendida pelos Correios);
        - Valor da causa;
        - Rito (atenção especial a casos com Órgãos Públicos);
        - Pedidos (líquidos/ilíquidos);`, 
        ancestral: 'bloco-autuacao'})
    criaBotaoAzul(
        { id: 'bloco-autuacao-retificar-autuacao-partes', texto: 'Retificar autuação: partes', ancestral: 'bloco-autuacao', acao: () => triagem_retificarAutuacao(dados?.rota_dadosTriagemInicial?.processo?.id, 'partes') },
    )
    criaBotaoAzul(
        { id: 'bloco-autuacao-retificar-autuacao-rito', texto: 'Retificar autuação: rito', ancestral: 'bloco-autuacao', acao: () => triagem_retificarAutuacao(dados?.rota_dadosTriagemInicial?.processo?.id, 'rito') },
    )
    criaBotaoAzul(
        { id: 'bloco-autuacao-retificar-autuacao-assuntos', texto: 'Retificar autuação: assuntos', ancestral: 'bloco-autuacao', acao: () => triagem_retificarAutuacao(dados?.rota_dadosTriagemInicial?.processo?.id, 'assuntos') },
    )
    criaBotaoLaranja(
        { id: 'bloco-autuacao-despacho-emenda-retificacao', texto: 'Despacho: retificar autuação/emendar a inicial', ancestral: 'bloco-autuacao', acao: () => triagem_despacho(dados?.rota_dadosTriagemInicial?.processo?.id, 'retificar-emendar') },
    )
    criaDiv({ id: 'bloco-designa-audiencia', ancestral: 'rota-corpo' })
    criaTitulo({ id: 'bloco-designa-audiencia-titulo', texto: 'Designação de audiência', ancestral: 'bloco-designa-audiencia' })
    console.log('%c[Rota PJE]%c Juiz: ' + dados?.rota_dadosTriagemInicial?.juizSimetriaPeloGig, LOG.teste, 'color:inherit')
    console.log('%c[Rota PJE]%c dados: ' + JSON.stringify(dados), LOG.teste, 'color:inherit')
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

async function triagem_retificarAutuacao(id, tipo){
    await alert(tipo + ' em desenvolvimento. ' + id)
}

async function triagem_despacho(id, tipo){
    await alert(tipo + ' em desenvolvimento. ' + id)
}



// Auto-executa ao carregar o script
triagem_assistente_iniciar()
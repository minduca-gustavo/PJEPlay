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
    console.log('%c[Rota PJE]%c dados: ' + JSON.stringify(dados?.rota_dadosTriagemInicial?.sala), LOG.teste, 'color:inherit')
    console.log('%c[Rota PJE]%c dados: ' + JSON.stringify(dados?.rota_dadosTriagemInicial?.horariosVagos), LOG.teste, 'color:inherit')
    
    criaTexto({
        id: 'bloco-designa-audiencia-texto',
        texto: dados?.rota_dadosTriagemInicial?.sala?.nome
        ? `A extensão identificou a seguinte sala: ${dados.rota_dadosTriagemInicial.sala.nome}.`
        : 'Não foi identificada sala.',
        ancestral: 'bloco-designa-audiencia'
    })
    if (!dados?.rota_dadosTriagemInicial?.horariosVagos?.length){
        if (dados?.rota_dadosTriagemInicial?.sala?.nome){
            criaTexto({
                id: 'bloco-designa-audiencia-texto-sem-horario',
                texto: `Não foram encontrados horários vagos para esta sala. Clique no botão abaixo para designar manualmente a audiência.`,
                ancestral: 'bloco-designa-audiencia'
            })
        }
        criaBotaoAzul({
            id: 'bloco-designa-audiencia-sem-horario',
            texto: 'Designar manualmente a audiência',
            ancestral: 'bloco-designa-audiencia',
            acao: () => {designaAudiencia({})}
        })

    } else {
        criaDivExecucao({
            id: 'bloco-designa-audiencia-acoes-conjuntas',
            idColuna: 'bloco-designa-audiencia-acoes-conjuntas-coluna',
            idBotaoExecutar: 'bloco-designa-audiencia-acoes-conjuntas-executar',
            acaoBotaoExecutar: () => {designaAudienciaExecutar()},
            ancestral: 'bloco-designa-audiencia',

        })
        criaTextoQueAbrePassandoOMouse({
            id: 'bloco-designa-audiencia-texto-escolha-audiência',
            texto: 'Como usar este bloco? Passe o mouse. Clique para fixar/desafixar.',
            textoBox: 'Se você clicar em algum dos botões azul, será designada a audiência correspondente. Você pode, também, selecionar os checkbox que deseja, e as ações serão executadas automaticamente ao clicar no botão laranja Executar ao lado.',
            ancestral: 'bloco-designa-audiencia-acoes-conjuntas-coluna'
        })
        let checkBoxPreMarcadoTipoAudiencia = false    
        let grupoBotoesIds = []
        let i = 0
        for (i; i < dados?.rota_dadosTriagemInicial?.horariosVagos?.length; i++) {
            let horario = dados?.rota_dadosTriagemInicial?.horariosVagos?.[i]
            let horarioInicial = new Date(horario.horarioInicial)
            let horarioInicialBotao = `${horario.descricaoTipoAudiencia} - ${horarioInicial.toLocaleDateString('pt-BR')} às ${horarioInicial.getHours()}h${String(horarioInicial.getMinutes()).padStart(2, '0')}`
            let dadoBotao = {
                id: 'bloco-designa-audiencia-horario' + i,
                idCheckbox: 'bloco-designa-audiencia-horario-checkbox' + i,
                texto: horarioInicialBotao,
                ancestral: 'bloco-designa-audiencia-acoes-conjuntas-coluna',
                acao: () => { designaAudiencia(dados?.rota_dadosTriagemInicial?.horariosVagos[i]) },
                grupo: 'bloco-designa-audiencia-acoes-conjuntas-designacao'
            }
            //grupoBotoesIds.push(dadoBotao.idCheckbox) // ← acumula corretamente
            criaBotaoAzulComCheckBox({ ...dadoBotao })
            if (horario.descricaoTipoAudiencia.includes('Inicial') && !checkBoxPreMarcadoTipoAudiencia){
                const checado = document.getElementById('bloco-designa-audiencia-horario-checkbox' + i)
                checado.click()
                checkBoxPreMarcadoTipoAudiencia = true
            }
        }
        criaBotaoAzulComCheckBox({
            id: 'bloco-designa-audiencia-horario' + i,
            idCheckbox: 'bloco-designa-audiencia-horario-checkbox' + i,
            texto: 'Designar audiência manualmente em outra sala',
            ancestral: 'bloco-designa-audiencia-acoes-conjuntas-coluna',
            acao: () => { designaAudiencia('') },
            grupo: 'bloco-designa-audiencia-acoes-conjuntas-designacao'
        })
        
        criaBotaoLaranjaComCheckBox({
            id: 'bloco-designa-audiencia-despacho',
            idCheckbox: 'bloco-designa-audiencia-despacho-checkbox',
            texto: 'Despachar designando.',
            ancestral: 'bloco-designa-audiencia-acoes-conjuntas-coluna',
            acao: () => { despacharDesignacaoDeAudiencia() },
            grupo: 'bloco-designa-audiencia-acoes-conjuntas-despachoOuCertidao'
        })
        criaBotaoLaranjaComCheckBox({
            id: 'bloco-designa-audiencia-certidao',
            idCheckbox: 'bloco-designa-audiencia-certidao-checkbox',
            texto: 'Certificar a designação e intimar.',
            ancestral: 'bloco-designa-audiencia-acoes-conjuntas-coluna',
            acao: () => { certificarDesignacaoDeAudiencia() },
            grupo: 'bloco-designa-audiencia-acoes-conjuntas-despachoOuCertidao'
        })
        let despachoChecado = document.getElementById('bloco-designa-audiencia-despacho-checkbox')
        despachoChecado.click()
        criaBotaoAzulComCheckBox({
            id: 'bloco-designa-audiencia-gig',
            idCheckbox: 'bloco-designa-audiencia-gig-checkbox',
            texto: 'Colocar GIG de acompanhamento.',
            ancestral: 'bloco-designa-audiencia-acoes-conjuntas-coluna',
            acao: () => { gigAcompanhamentoAudiencia('') },
        })
        let gigChecado = document.getElementById('bloco-designa-audiencia-gig-checkbox')
        gigChecado.click()
        console.log('%c[Rota PJE]%c ' + grupoBotoesIds, LOG.teste, 'color:inherit')
        // Após criar todos, aplica comportamento de seleção única
        
        
    }


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



async function designaAudienciaExecutar(param){
    await alert(param)
}

async function designaAudiencia(param){
    await alert(JSON.stringify(param, null, 2))
}

async function despacharDesignacaoDeAudiencia(){
    await alert('Despacho de designação.')
}

async function gigAcompanhamentoAudiencia(param){
    await alert('GIG de acompanhamento.')
}


async function certificarDesignacaoDeAudiencia(param){
    await alert('Certidão de designação.')
}

async function triagem_retificarAutuacao(id, tipo){
    url = location.origin + '/pjekz/processo/' + id + '/retificar?pjerota_tarefa=triagem-inicial-retificar-autuacao&pjerota_triagem_inicial_retificar_autuacao_tipo=' + tipo
    await abrirUrl(url, 'esquerda-assistida', 'triagem-inicial-retificar-autuacao')
    await alert(tipo + ' em desenvolvimento. ' + id)
}

async function triagem_despacho(id, tipo){
    await alert(tipo + ' em desenvolvimento. ' + id)
}



// Auto-executa ao carregar o script
triagem_assistente_iniciar()
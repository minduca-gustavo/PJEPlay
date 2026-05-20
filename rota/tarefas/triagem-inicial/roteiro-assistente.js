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
let janelaPrincipal = ''
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
    janelaPrincipal = dados?.rota_dadosTriagemInicial?.nomeDaJanelaPrincipal
    console.log('%c[Rota PJE]%c Dados: ' + JSON.stringify(dados?.rota_dadosTriagemInicial?.processo?.id, null, 2), LOG.teste, 'color:inherit')

    // ── Bloco: inicial ────────────────────────────────────────
    let bloco = 'inicial'

    criaDiv({ id: id(bloco), ancestral: 'rota-corpo' })
    criaTitulo({ id: id(bloco, 'titulo'), texto: 'Triagem Inicial', ancestral: id(bloco) })
    criaTextoQueAbrePassandoOMouse({
        id: id(bloco, 'instrucao-longa'),
        texto: `Passe o mouse para ver a instrução completa da tarefa.
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
        ancestral: id(bloco)
    })
    criaInputAnotacao({ id: id(bloco, 'anotacao'), placeholder: 'Utilize este campo para suas anotações. As informações não serão salvas e não aparecerão em lugar algum.', ancestral: id(bloco) })

    // ── Bloco: autuacao ───────────────────────────────────────
    bloco = 'autuacao'

    criaDiv({ id: id(bloco), ancestral: 'rota-corpo' })
    criaTitulo({ id: id(bloco, 'titulo'), texto: 'Autuação/Petição Inicial/Documentos', ancestral: id(bloco) })
    criaTextoQueAbrePassandoOMouse({
        id: id(bloco, 'dados-das-partes'),
        texto: `Passe o mouse para ver os dados das partes.
Clique para fixar/desafixar.`,
        textoBox: `Dados das partes:
${formatarPartes(dados?.rota_dadosTriagemInicial?.partes)}`,
        ancestral: id(bloco)
    })
    criaTexto({
        id: id(bloco, 'instrucao-curta'),
        texto: `Verifique os dados da autuação, se estão corretos e correspondem à petição inicial.
    Tenha atenção aos seguintes pontos:
        - Documentos das partes;
        - Endereços (CEP, zona rural ou área não atendida pelos Correios);
        - Valor da causa;
        - Rito (atenção especial a casos com Órgãos Públicos);
        - Pedidos (líquidos/ilíquidos);`,
        ancestral: id(bloco)
    })
    criaBotaoAzul({ id: id(bloco, 'retificar-partes'),   texto: 'Retificar autuação: partes',   ancestral: id(bloco), acao: () => triagem_retificarAutuacao(dados?.rota_dadosTriagemInicial?.processo?.id, 'partes') })
    criaBotaoAzul({ id: id(bloco, 'retificar-rito'),     texto: 'Retificar autuação: rito',     ancestral: id(bloco), acao: () => triagem_retificarAutuacao(dados?.rota_dadosTriagemInicial?.processo?.id, 'rito') })
    criaBotaoAzul({ id: id(bloco, 'retificar-assuntos'), texto: 'Retificar autuação: assuntos', ancestral: id(bloco), acao: () => triagem_retificarAutuacao(dados?.rota_dadosTriagemInicial?.processo?.id, 'assuntos') })
    criaBotaoLaranja({ id: id(bloco, 'despacho-emenda-retificacao'), texto: 'Despacho: retificar autuação/emendar a inicial', ancestral: id(bloco), acao: () => triagem_despacho(dados?.rota_dadosTriagemInicial?.processo?.id, 'retificar-emendar') })

    // ── Bloco: designa-audiencia ──────────────────────────────
    bloco = 'designa-audiencia'

    criaDiv({ id: id(bloco), ancestral: 'rota-corpo' })
    criaTitulo({ id: id(bloco, 'titulo'), texto: 'Designação de audiência', ancestral: id(bloco) })
    console.log('%c[Rota PJE]%c Juiz: ' + dados?.rota_dadosTriagemInicial?.juizSimetriaPeloGig, LOG.teste, 'color:inherit')
    console.log('%c[Rota PJE]%c dados: ' + JSON.stringify(dados?.rota_dadosTriagemInicial?.sala), LOG.teste, 'color:inherit')
    console.log('%c[Rota PJE]%c dados: ' + JSON.stringify(dados?.rota_dadosTriagemInicial?.horariosVagos), LOG.teste, 'color:inherit')

    criaTexto({
        id: id(bloco, 'texto'),
        texto: dados?.rota_dadosTriagemInicial?.sala?.nome
            ? `A extensão identificou a seguinte sala: ${dados.rota_dadosTriagemInicial.sala.nome}.`
            : 'Não foi identificada sala.',
        ancestral: id(bloco)
    })

    if (!dados?.rota_dadosTriagemInicial?.horariosVagos?.length) {

        if (dados?.rota_dadosTriagemInicial?.sala?.nome) {
            criaTexto({
                id: id(bloco, 'sem-horario'),
                texto: `Não foram encontrados horários vagos para esta sala. Clique no botão abaixo para designar manualmente a audiência.`,
                ancestral: id(bloco)
            })
        }
        criaBotaoAzul({
            id: id(bloco, 'btn-manual'),
            texto: 'Designar manualmente a audiência',
            ancestral: id(bloco),
            acao: () => { designaAudiencia({}) }
        })

    }

    criaSubTitulo({
        id: id(bloco, 'acoes-conjuntas', 'subtitulo'),
        texto: 'Ações conjuntas',
        ancestral: id(bloco)
    })
    
    criaDivExecucao({
        id: id(bloco, 'acoes-conjuntas'),
        idColuna: id(bloco, 'acoes-conjuntas', 'coluna'),
        idBotaoExecutar: id(bloco, 'acoes-conjuntas', 'executar'),
        acaoBotaoExecutar: () => { designaAudienciaExecutar() },
        ancestral: id(bloco)
    })



    

    criaTextoQueAbrePassandoOMouse({
        id: id(bloco, 'acoes-conjuntas', 'instrucao'),
        texto: 'Como usar este bloco? Passe o mouse. Clique para fixar/desafixar.',
        textoBox: 'Se você deseja fazer apenas uma das ações, clique no botão azul ou laranja correspondente. Você pode, também, selecionar os checkbox que deseja, e as ações serão executadas uma após a outra ao clicar no botão laranja Executar ao lado.',
        ancestral: id(bloco, 'acoes-conjuntas', 'coluna')
    })

    if (dados?.rota_dadosTriagemInicial?.horariosVagos?.length) {
        
     

        let checkBoxPreMarcadoTipoAudiencia = false
        let i = 0
        for (i; i < dados?.rota_dadosTriagemInicial?.horariosVagos?.length; i++) {
            let horario = dados?.rota_dadosTriagemInicial?.horariosVagos?.[i]
            let horarioInicial = new Date(horario.horarioInicial)
            let horarioInicialBotao = `${horario.descricaoTipoAudiencia} - ${horarioInicial.toLocaleDateString('pt-BR')} às ${horarioInicial.getHours()}h${String(horarioInicial.getMinutes()).padStart(2, '0')}`
            criaBotaoAzulComCheckBox({
                id: id(bloco, 'acoes-conjuntas', 'horario' + i),
                idCheckbox: id(bloco, 'acoes-conjuntas', 'horario' + i, 'checkbox'),
                texto: horarioInicialBotao,
                ancestral: id(bloco, 'acoes-conjuntas', 'coluna'),
                acao: () => { designaAudiencia(dados?.rota_dadosTriagemInicial?.horariosVagos[i]) },
                grupo: id(bloco, 'acoes-conjuntas', 'grupo-designacao')
            })
            if (horario.descricaoTipoAudiencia.includes('Inicial') && !checkBoxPreMarcadoTipoAudiencia) {
                document.getElementById(id(bloco, 'acoes-conjuntas', 'horario' + i, 'checkbox')).click()
                checkBoxPreMarcadoTipoAudiencia = true
            }
        }

        criaBotaoAzulComCheckBox({
            id: id(bloco, 'acoes-conjuntas', 'horario' + i),
            idCheckbox: id(bloco, 'acoes-conjuntas', 'horario' + i, 'checkbox'),
            texto: 'Designar audiência manualmente em outra sala/horário',
            ancestral: id(bloco, 'acoes-conjuntas', 'coluna'),
            acao: () => { designaAudiencia('') },
            grupo: id(bloco, 'acoes-conjuntas', 'grupo-designacao')
        })
    }
    criaBotaoLaranjaComCheckBox({
        id: id(bloco, 'acoes-conjuntas', 'despacho'),
        idCheckbox: id(bloco, 'acoes-conjuntas', 'despacho', 'checkbox'),
        texto: 'Despachar designando.',
        ancestral: id(bloco, 'acoes-conjuntas', 'coluna'),
        acao: () => { despacharDesignacaoDeAudiencia() },
        grupo: id(bloco, 'acoes-conjuntas', 'grupo-despacho-ou-certidao')
    })
    criaBotaoLaranjaComCheckBox({
        id: id(bloco, 'acoes-conjuntas', 'certidao'),
        idCheckbox: id(bloco, 'acoes-conjuntas', 'certidao', 'checkbox'),
        texto: 'Certificar a designação e intimar.',
        ancestral: id(bloco, 'acoes-conjuntas', 'coluna'),
        acao: () => { certificarDesignacaoDeAudiencia() },
        grupo: id(bloco, 'acoes-conjuntas', 'grupo-despacho-ou-certidao')
    })
    document.getElementById(id(bloco, 'acoes-conjuntas', 'despacho', 'checkbox')).click()

    criaBotaoAzulComCheckBox({
        id: id(bloco, 'acoes-conjuntas', 'gig'),
        idCheckbox: id(bloco, 'acoes-conjuntas', 'gig', 'checkbox'),
        texto: 'Colocar GIG de acompanhamento.',
        ancestral: id(bloco, 'acoes-conjuntas', 'coluna'),
        acao: () => { gigAcompanhamentoAudiencia('') }
    })
    document.getElementById(id(bloco, 'acoes-conjuntas', 'gig', 'checkbox')).click()

    console.log('%c[Rota PJE]%c blocos criados', LOG.teste, 'color:inherit')
    
}


const vigiar = setInterval(() => {
  if (janelaPrincipal.closed) {
    clearInterval(vigiar)
    window.close() // fecha o assistente
  }
}, 500)

// ── Ações ─────────────────────────────────────────────────────

async function designaAudienciaExecutar(param) {
    await alert(param)
}

async function designaAudiencia(param) {
    await alert(JSON.stringify(param, null, 2))
}

async function despacharDesignacaoDeAudiencia() {
    await alert('Despacho de designação.')
}

async function gigAcompanhamentoAudiencia(param) {
    await alert('GIG de acompanhamento.')
}

async function certificarDesignacaoDeAudiencia(param) {
    await alert('Certidão de designação.')
}

async function triagem_retificarAutuacao(id, tipo) {
    url = location.origin + '/pjekz/processo/' + id + '/retificar?pjerota_tarefa=triagem-inicial-retificar-autuacao&pjerota_triagem_inicial_retificar_autuacao_tipo=' + tipo
    await abrirUrl(url, 'esquerda-assistida', 'triagem-inicial-retificar-autuacao')
    await alert(tipo + ' em desenvolvimento. ' + id)
}

async function triagem_despacho(id, tipo) {
    await alert(tipo + ' em desenvolvimento. ' + id)
}



// ── Auxiliares ────────────────────────────────────────────────

function id(...partes) {
    return ['triagem-inicial', ...partes].filter(Boolean).join('-')
}



// Auto-executa ao carregar o script
triagem_assistente_iniciar()
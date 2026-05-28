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
    let tarefaNome = 'triagem_inicial'
    
    // ── Filtra pelo parâmetro da URL ──────────────────────────
    const tarefa = new URL(location.href).searchParams.get('pjerota_tarefa')
    if (tarefa !== 'triagem_inicial') return
    console.log('%c[Rota PJE]%c 13', LOG.teste, 'color:inherit')
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
    console.log('%c[Rota PJE]%c 38: ' + JSON.stringify(dados?.rota_dadosTriagemInicial?.processo?.numero, null, 2), LOG.teste, 'color:inherit')
    console.log('%c[Rota PJE]%c 39: ' + JSON.stringify(dados?.rota_dadosTriagemInicial?.sala?.nome, null, 2), LOG.teste, 'color:inherit')
    console.log('%c[Rota PJE]%c atual: ' + dados?.rota_dadosTriagemInicial?.execucaoAtual, LOG.info, 'color:inherit')
    // ── Bloco: inicial ────────────────────────────────────────
    let bloco = 'inicial'

    criaDiv({ id: id(tarefaNome, bloco), ancestral: 'rota_corpo' })
    criaTitulo({ id: id(tarefaNome, bloco, 'titulo'), texto: 'Triagem Inicial', ancestral: id(tarefaNome, bloco) })
    criaTextoQueAbrePassandoOMouse({
        id: id(tarefaNome, bloco, 'instrucao_longa'),
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
        ancestral: id(tarefaNome, bloco)
    })
    criaInputAnotacao({ id: id(tarefaNome, bloco, 'anotacao'), placeholder: 'Utilize este campo para suas anotações. As informações não serão salvas e não aparecerão em lugar algum.', ancestral: id(tarefaNome, bloco) })

    // ── Bloco: autuacao ───────────────────────────────────────
    bloco = 'autuacao'

    criaDiv({ id: id(tarefaNome, bloco), ancestral: 'rota_corpo' })
    criaTitulo({ id: id(tarefaNome, bloco, 'titulo'), texto: 'Autuação/Petição Inicial/Documentos', ancestral: id(tarefaNome, bloco) })
    criaTextoQueAbrePassandoOMouse({
        id: id(tarefaNome, bloco, 'dados_das_partes'),
        texto: `Passe o mouse para ver os dados das partes.
Clique para fixar/desafixar.`,
        textoBox: `Dados das partes:
${formatarPartes(dados?.rota_dadosTriagemInicial?.partes)}`,
        ancestral: id(tarefaNome, bloco)
    })
    criaTexto({
        id: id(tarefaNome, bloco, 'instrucao_curta'),
        texto: `Verifique os dados da autuação, se estão corretos e correspondem à petição inicial.
    Tenha atenção aos seguintes pontos:
        - Documentos das partes;
        - Endereços (CEP, zona rural ou área não atendida pelos Correios);
        - Valor da causa;
        - Rito (atenção especial a casos com Órgãos Públicos);
        - Pedidos (líquidos/ilíquidos);`,
        ancestral: id(tarefaNome, bloco)
    })
    criaBotaoAzul({ id: id(tarefaNome, bloco, 'retificar_partes'),   texto: 'Retificar autuação: partes',   ancestral: id(tarefaNome, bloco), acao: () => comandar(['triagem_inicial_retificar'], [{tipo: 'Partes'}])})
    criaBotaoAzul({ id: id(tarefaNome, bloco, 'retificar_rito'),     texto: 'Retificar autuação: rito',     ancestral: id(tarefaNome, bloco), acao: () => comandar(['triagem_inicial_retificar'], [{tipo: 'Dados Iniciais'}])})
    criaBotaoAzul({ id: id(tarefaNome, bloco, 'retificar_assuntos'), texto: 'Retificar autuação: assuntos', ancestral: id(tarefaNome, bloco), acao: () => comandar(['triagem_inicial_retificar'], [{tipo: 'Assuntos'}])})
    criaBotaoLaranja({ id: id(tarefaNome, bloco, 'despacho_emenda_retificacao'), texto: 'Despacho: retificar autuação/emendar a inicial', ancestral: id(tarefaNome, bloco), acao: () => comandar(['triagem_inicial_despachar'], [{tipo: 'triagem_inicial_emendar'}])})

    // ── Bloco: designa-audiencia ──────────────────────────────
    bloco = 'designa_audiencia'

    criaDiv({ id: id(tarefaNome, bloco), ancestral: 'rota_corpo' })
    criaTitulo({ id: id(tarefaNome, bloco, 'titulo'), texto: 'Designação de audiência', ancestral: id(tarefaNome, bloco) })
    console.log('%c[Rota PJE]%c Juiz: ' + dados?.rota_dadosTriagemInicial?.juizSimetriaPeloGig, LOG.teste, 'color:inherit')
    console.log('%c[Rota PJE]%c dados: ' + JSON.stringify(dados?.rota_dadosTriagemInicial?.sala), LOG.teste, 'color:inherit')
    console.log('%c[Rota PJE]%c dados: ' + JSON.stringify(dados?.rota_dadosTriagemInicial?.horariosVagos), LOG.teste, 'color:inherit')

    criaTexto({
        id: id(tarefaNome, bloco, 'texto'),
        texto: dados?.rota_dadosTriagemInicial?.sala?.nome
            ? `A extensão identificou a seguinte sala: ${dados.rota_dadosTriagemInicial.sala.nome}.`
            : 'Não foi identificada sala.',
        ancestral: id(tarefaNome, bloco)
    })

    if (!dados?.rota_dadosTriagemInicial?.horariosVagos?.length) {

        if (dados?.rota_dadosTriagemInicial?.sala?.nome) {
            criaTexto({
                id: id(tarefaNome, bloco, 'sem_horario'),
                texto: `Não foram encontrados horários vagos para esta sala. Clique no botão abaixo para designar manualmente a audiência.`,
                ancestral: id(tarefaNome, bloco)
            })
        }
        criaBotaoAzul({
            id: id(tarefaNome, bloco, 'btn_manual'),
            texto: 'Designar manualmente a audiência',
            ancestral: id(tarefaNome, bloco),
            acao: () => comandar(['triagem_inicial_designa_audiencia'], [{dados: 'manual'}])
        })

    }
    criaSubTitulo({
        id: id(tarefaNome, bloco, 'subtitulo_link_da_audiencia'),
        texto: 'Link da audiência',
        ancestral: id(tarefaNome, bloco)
    })
    criaBotaoComInputAzul({
        id: id(tarefaNome, bloco, 'salvar_link_da_audiencia'),
        idInput: id(tarefaNome, bloco, 'input_link_da_audiencia'),
        texto: 'Salvar link',
        textoEmCima: 'Digite abaixo o link da audiência para preenchimento automático no momento da designação e despacho.',
        ancestral: id(tarefaNome, bloco),
        acao: () => triagem_inicial_salvar_link_da_audiencia()
    })
    let linkSalvo = await obterArmazenamento(['rota_triagem_inicial_linkDaAudiencia'])
    let link = linkSalvo?.rota_triagem_inicial_linkDaAudiencia || ''
    let inputLinkAudiencia = document.getElementById(id(tarefaNome, bloco, 'input_link_da_audiencia'))
    inputLinkAudiencia.placeholder = 'digite aqui o link do zoom' || ''
    if (link) {
        inputLinkAudiencia.value = link
        inputLinkAudiencia.placeholder = ''
    }
    criaSubTitulo({
        id: id(tarefaNome, bloco, 'acoes_conjuntas', 'subtitulo'),
        texto: 'Ações conjuntas',
        ancestral: id(tarefaNome, bloco)
    })
    
    criaDivExecucao({
        id: id(tarefaNome, bloco, 'acoes_conjuntas'),
        idColuna: id(tarefaNome, bloco, 'acoes_conjuntas', 'coluna'),
        idBotaoExecutar: id(tarefaNome, bloco, 'acoes_conjuntas', 'executar'),
        acaoBotaoExecutar: () => triagemDesignarAudienciaAcoesConjuntas('designa_audiencia'),
        ancestral: id(tarefaNome, bloco)
    })
   

    criaTextoQueAbrePassandoOMouse({
        id: id(tarefaNome, bloco, 'acoes_conjuntas', 'instrucao'),
        texto: 'Como usar este bloco? Passe o mouse. Clique para fixar/desafixar.',
        textoBox: 'Se você deseja fazer apenas uma das ações, clique no botão azul ou laranja correspondente. Você pode, também, selecionar os checkbox que deseja, e as ações serão executadas uma após a outra ao clicar no botão laranja Executar ao lado.',
        ancestral: id(tarefaNome, bloco, 'acoes_conjuntas', 'coluna')
    })

    if (dados?.rota_dadosTriagemInicial?.horariosVagos?.length) {
        
     

        let checkBoxPreMarcadoTipoAudiencia = false
        let i = 0
        for (i; i < dados?.rota_dadosTriagemInicial?.horariosVagos?.length; i++) {
            let horario = dados?.rota_dadosTriagemInicial?.horariosVagos?.[i]
            let horarioInicial = new Date(horario.horarioInicial)
            let horarioInicialBotao = `${horario.descricaoTipoAudiencia} - ${horarioInicial.toLocaleDateString('pt-BR')} às ${horarioInicial.getHours()}h${String(horarioInicial.getMinutes()).padStart(2, '0')}`
            let processo = dados?.rota_dadosTriagemInicial?.processo?.numero
            let sala = dados?.rota_dadosTriagemInicial?.sala?.nome
            horario.processo = processo
            horario.nomeDaSala = sala
            let linha = criaBotaoAzulComCheckBox({
                id: id(tarefaNome, bloco, 'acoes_conjuntas', 'horario' + i),
                idCheckbox: id(tarefaNome, bloco, 'acoes_conjuntas', 'horario' + i, 'checkbox'),
                texto: horarioInicialBotao,
                ancestral: id(tarefaNome, bloco, 'acoes_conjuntas', 'coluna'),
                acao: () => comandar(['triagem_inicial_designa_audiencia'], [{horario}]),
                grupo: id(tarefaNome, bloco, 'acoes_conjuntas', 'grupo_designacao')
            })
            linha.dataset.horario = JSON.stringify(horario)
            if (horario.descricaoTipoAudiencia.includes('Inicial') && !checkBoxPreMarcadoTipoAudiencia) {
                document.getElementById(id(tarefaNome, bloco, 'acoes_conjuntas', 'horario' + i, 'checkbox')).click()
                checkBoxPreMarcadoTipoAudiencia = true
            }
        }

        criaBotaoAzulComCheckBox({
            id: id(tarefaNome, bloco, 'acoes_conjuntas', 'horario' + i),
            idCheckbox: id(tarefaNome, bloco, 'acoes_conjuntas', 'horario' + i, 'checkbox'),
            texto: 'Designar audiência manualmente em outra sala/horário',
            ancestral: id(tarefaNome, bloco, 'acoes_conjuntas', 'coluna'),
            acao: () => comandar(['triagem_inicial_designa_audiencia'], [{dados: {tipo: 'manual', processo: dados?.rota_dadosTriagemInicial?.processo?.numero, sala: dados?.rota_dadosTriagemInicial?.sala?.nome}}]),
            grupo: id(tarefaNome, bloco, 'acoes_conjuntas', 'grupo_designacao')
        })
    }
    criaBotaoLaranjaComCheckBox({
        id: id(tarefaNome, bloco, 'acoes_conjuntas', 'despacho'),
        idCheckbox: id(tarefaNome, bloco, 'acoes_conjuntas', 'despacho', 'checkbox'),
        texto: 'Despachar designando.',
        ancestral: id(tarefaNome, bloco, 'acoes_conjuntas', 'coluna'),
        acao: () => comandar(['triagem_inicial_despachar'], [{tipo: 'triagem_inicial_despachar_designacao'}]),
        grupo: id(tarefaNome, bloco, 'acoes_conjuntas', 'grupo_despacho_ou_certidao')
    })
    criaBotaoLaranjaComCheckBox({
        id: id(tarefaNome, bloco, 'acoes_conjuntas', 'certidao'),
        idCheckbox: id(tarefaNome, bloco, 'acoes_conjuntas', 'certidao', 'checkbox'),
        texto: 'Certificar a designação e intimar.',
        ancestral: id(tarefaNome, bloco, 'acoes_conjuntas', 'coluna'),
        acao: () => comandar(['triagem_inicial_certidao'], [{tipo: 'triagem_inicial_certificar_designacao'}]),
        grupo: id(tarefaNome, bloco, 'acoes_conjuntas', 'grupo_despacho_ou_certidao')
    })
    document.getElementById(id(tarefaNome, bloco, 'acoes_conjuntas', 'despacho', 'checkbox')).click()

    criaBotaoAzulComCheckBox({
        id: id(tarefaNome, bloco, 'acoes_conjuntas', 'gig'),
        idCheckbox: id(tarefaNome, bloco, 'acoes_conjuntas', 'gig', 'checkbox'),
        texto: 'Colocar GIG de acompanhamento.',
        ancestral: id(tarefaNome, bloco, 'acoes_conjuntas', 'coluna'),
        acao: () => comandar(['triagem_inicial_gig'], [{tipo: 'triagem_inicial_gig_acompanhamento'}]),
    })
    document.getElementById(id(tarefaNome, bloco, 'acoes_conjuntas', 'gig', 'checkbox')).click()

    console.log('%c[Rota PJE]%c blocos criados', LOG.teste, 'color:inherit')
    
    function chkEstaMarcado(idCheckbox) {
        return document.getElementById(idCheckbox)?.dataset.marcado === '1'
    }

    function triagemDesignarAudienciaAcoesConjuntas(bloco) {
        const comandos = []
        const parametros = []

        const chkDesignacao = document.querySelector(`[data-grupo="${id(tarefaNome, bloco, 'acoes_conjuntas', 'grupo_designacao')}"][data_marcado="1"]`)
        console.log('%c[Rota PJE]%c chkDesignacao: ' + JSON.stringify(chkDesignacao), LOG.teste, 'color:inherit')
        if (chkDesignacao) {
            const horario = JSON.parse(chkDesignacao.closest('[data_horario]').dataset.horario)
            comandos.push('triagem_inicial_designa_audiencia')
            parametros.push(horario)
        }

        if (chkEstaMarcado(id(tarefaNome, bloco, 'acoes_conjuntas', 'despacho', 'checkbox'))) {
            comandos.push('triagem_inicial_despachar')
            parametros.push('triagem_inicial_despachar_designacao')
        }

        if (chkEstaMarcado(id(tarefaNome, bloco, 'acoes_conjuntas', 'certidao', 'checkbox'))) {
            comandos.push('certidao')
            parametros.push('triagem_inicial_certificar_designacao')
        }

        if (chkEstaMarcado(id(tarefaNome, bloco, 'acoes_conjuntas', 'gig', 'checkbox'))) {
            comandos.push('triagem_inicial_gig')
            parametros.push('triagem_inicial_gig_acompanhamento')
        }
        console.log('%c[Rota PJE]%c quantos comandos: ' + comandos.length, LOG.teste, 'color:inherit')
        if (comandos.length) comandar(comandos, parametros)
    }
    async function triagem_inicial_salvar_link_da_audiencia() {
        let inputLinkAudiencia = document.getElementById(id(tarefaNome, 'designa_audiencia', 'input_link_da_audiencia'))
        let linkSalvar = inputLinkAudiencia.value
        if (linkSalvar){
            await armazenar({ rota_triagem_inicial_linkDaAudiencia: linkSalvar })
        } else {
            await removerArmazenamento('rota_triagem_inicial_linkDaAudiencia')
        }
    }
    
}




// Auto-executa ao carregar o script
triagem_assistente_iniciar()
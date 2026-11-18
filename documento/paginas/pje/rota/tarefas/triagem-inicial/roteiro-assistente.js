// ============================================================
// tarefas/triagem-inicial/roteiro-assistente.js
// Roteiro da janela assistente para a Triagem Inicial.
//
// Roda no contexto do assistente.html.
// Filtra pelo parâmetro rotapje_tarefa da URL.
//
// Por ora: aguarda os dados chegarem via storage e remove
// o carregando. A interface será montada aqui futuramente.
// ============================================================



async function triagem_assistente_iniciar() {
    let tarefaNome = 'triagem_inicial'
    
    // ── Filtra pelo parâmetro da URL ──────────────────────────
    const tarefa = new URL(location.href).searchParams.get('rotapje_tarefa')
    if (tarefa !== 'triagem_inicial') return
    console.log('%c[Rota PJE]%c 13', LOG.teste, 'color:inherit')
    // ── Aguarda sinal de dados prontos via storage ────────────
    //
    // O roteiro.js da página de detalhes salva rota_dadosProntos: true
    // quando termina de coletar todos os dados do processo.
    // Aqui ficamos ouvindo até esse sinal chegar.

    try {
        await Promise.race([
            new Promise(resolver => {
                NAVEGADOR.storage.onChanged.addListener(function ouvir(mudancas) {
                    if (mudancas['rota_dadosProntos']?.newValue === true) {
                        NAVEGADOR.storage.onChanged.removeListener(ouvir)
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
    let dados = await obterArmazenamento(['rota_dadosTriagemInicial'])
    console.log('%c[Rota PJE]%c 38: ' + JSON.stringify(dados?.rota_dadosTriagemInicial?.processo?.numero, null, 2), LOG.teste, 'color:inherit')
    console.log('%c[Rota PJE]%c 39: ' + JSON.stringify(dados?.rota_dadosTriagemInicial?.sala?.nome, null, 2), LOG.teste, 'color:inherit')
    console.log('%c[Rota PJE]%c atual: ' + dados?.rota_dadosTriagemInicial?.execucaoAtual, LOG.info, 'color:inherit')
    // ── Bloco: inicial ────────────────────────────────────────
    let bloco = 'inicial'

    criaDiv({ id: idg(tarefaNome, bloco), ancestral: 'rota_corpo' })
    criaTitulo({ id: idg(tarefaNome, bloco, 'titulo'), texto: 'Triagem Inicial', ancestral: idg(tarefaNome, bloco) })
    criaTextoQueAbrePassandoOMouse({
        id: idg(tarefaNome, bloco, 'instrucao_longa'),
        texto: `Passe o mouse para ver a instrução completa da tarefa.
Clique para fixar/desafixar.`,
        textoBox: `Como utilizar este assistente:
	- Anote no campo abaixo o que precisar. Esta anotação é local, e será perdida ao fechar a janela.
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
        ancestral: idg(tarefaNome, bloco)
    })
    criaInputAnotacao({ id: idg(tarefaNome, bloco, 'anotacao'), placeholder: 'Utilize este campo para suas anotações. As informações não serão salvas e não aparecerão em lugar algum.', ancestral: idg(tarefaNome, bloco) })

    // ── Bloco: autuacao ───────────────────────────────────────
    bloco = 'autuacao'

    criaDiv({ id: idg(tarefaNome, bloco), ancestral: 'rota_corpo' })
    criaTitulo({ id: idg(tarefaNome, bloco, 'titulo'), texto: 'Autuação/Petição Inicial/Documentos', ancestral: idg(tarefaNome, bloco) })
    criaTextoQueAbrePassandoOMouse({
        id: idg(tarefaNome, bloco, 'dados_das_partes'),
        texto: `Passe o mouse para ver os dados das partes.
Clique para fixar/desafixar.`,
        textoBox: `Dados das partes:
${formatarPartes(dados?.rota_dadosTriagemInicial?.partes)}`,
        ancestral: idg(tarefaNome, bloco)
    })
    criaTexto({
        id: idg(tarefaNome, bloco, 'instrucao_curta'),
        texto: `Verifique os dados da autuação, se estão corretos e correspondem à petição inicial.
    Tenha atenção aos seguintes pontos:
        - Documentos das partes;
        - Endereços (CEP, zona rural ou área não atendida pelos Correios);
        - Valor da causa;
        - Rito (atenção especial a casos com Órgãos Públicos);
        - Pedidos (líquidos/ilíquidos);`,
        ancestral: idg(tarefaNome, bloco)
    })
    criaBotaoAzul({ id: idg(tarefaNome, bloco, 'retificar_partes'),          texto: 'Retificar autuação: partes',    ancestral: idg(tarefaNome, bloco), acao: () => comandar(['triagem_inicial_retificar'], [{tipo: 'Partes'}])})
    criaBotaoAzul({ id: idg(tarefaNome, bloco, 'retificar_rito'),            texto: 'Retificar autuação: rito',      ancestral: idg(tarefaNome, bloco), acao: () => comandar(['triagem_inicial_retificar'], [{tipo: 'Dados Iniciais'}])})
    criaBotaoAzul({ id: idg(tarefaNome, bloco, 'retificar_assuntos'),        texto: 'Retificar autuação: assuntos',  ancestral: idg(tarefaNome, bloco), acao: () => comandar(['triagem_inicial_retificar'], [{tipo: 'Assuntos'}])})
    criaBotaoAzul({ id: idg(tarefaNome, bloco, 'retificar_cem_por_cento'),   texto: 'Alternar Juízo 100% digital',   ancestral: idg(tarefaNome, bloco), acao: () => comandar(['triagem_inicial_retificar'], [{tipo: '100_Digital'}])})
    criaBotaoLaranja({
        id: idg(tarefaNome, bloco, 'despacho_emenda_retificacao'), 
        texto: 'Despacho: retificar autuação/emendar a inicial', 
        ancestral: idg(tarefaNome, bloco), 
        acao: async () => {
            await removerArmazenamento('rota_acoes_conjuntas_triagem_inicial_em_andamento')
            comandar(['triagem_inicial_despachar'], [{tipo: 'triagem_inicial_emendar'}])
        }
    })

    // ── Bloco: designa-audiencia ──────────────────────────────
    bloco = 'designa_audiencia'

    criaDiv({ id: idg(tarefaNome, bloco), ancestral: 'rota_corpo' })
    criaTitulo({ id: idg(tarefaNome, bloco, 'titulo'), texto: 'Designação de audiência', ancestral: idg(tarefaNome, bloco) })
    console.log('%c[Rota PJE]%c Juiz: ' + dados?.rota_dadosTriagemInicial?.juizSimetriaPeloGig, LOG.teste, 'color:inherit')
    console.log('%c[Rota PJE]%c dados: ' + JSON.stringify(dados?.rota_dadosTriagemInicial?.sala), LOG.teste, 'color:inherit')
    console.log('%c[Rota PJE]%c dados: ' + JSON.stringify(dados?.rota_dadosTriagemInicial?.horariosVagos), LOG.teste, 'color:inherit')

    criaTexto({
        id: idg(tarefaNome, bloco, 'texto'),
        texto: dados?.rota_dadosTriagemInicial?.juizSimetriaPeloGig
            ? `A extensão identificou a sala a seguir. Altere no menu abaixo, se necessário.`
            : 'Não foi identificada sala. Escolha a sala adequada no menu abaixo.',
        ancestral: idg(tarefaNome, bloco)
    })
    console.log('%c[Rota PJE]%c dados?.rota_dadosTriagemInicial?.salas: ' + JSON.stringify(dados?.rota_dadosTriagemInicial?.salas), LOG.rosa, 'color:inherit')
    let opcoesSalas = [
        { valor: null, texto: 'Selecione a sala.' },
        ...(dados?.rota_dadosTriagemInicial?.salas ?? []).map(sala => ({
            valor: sala.id,
            texto: sala.nome,
        })),
    ]

    let salaIdentificadaId =
        dados?.rota_dadosTriagemInicial?.juizSimetriaPeloGig &&
        opcoesSalas.some(o => o.valor === dados.rota_dadosTriagemInicial.sala?.id)
            ? dados.rota_dadosTriagemInicial.sala.id
            : null

    criaMenuSuspenso({
        id:        idg(tarefaNome, bloco, 'menu_suspenso_juizes'),
        opcoes:    opcoesSalas,
        valorInicial: dados?.rota_dadosTriagemInicial?.juizSimetriaPeloGig
            ? dados.rota_dadosTriagemInicial.sala?.id   // id, não .nome
            : undefined,
        placeholder: 'Escolha a sala adequada.',
        ancestral: idg(tarefaNome, bloco),
    })
    // ATENÇÃO: assume que criaMenuSuspenso cria (ou expõe) um <select> com esse id.
    // Se o componente devolver outra coisa (wrapper, elemento custom, etc.), ajustar aqui.
    let selectSala = document.getElementById(idg(tarefaNome, bloco, 'menu_suspenso_juizes'))

    criaSubTitulo({
        id: idg(tarefaNome, bloco, 'subtitulo_link_da_audiencia'),
        texto: 'Link da audiência',
        ancestral: idg(tarefaNome, bloco)
    })
    criaBotaoComInputAzul({
        id: idg(tarefaNome, bloco, 'salvar_link_da_audiencia'),
        idInput: idg(tarefaNome, bloco, 'input_link_da_audiencia'),
        texto: 'Salvar link',
        textoEmCima: 'Digite abaixo o link da audiência para preenchimento automático no momento da designação e despacho.',
        ancestral: idg(tarefaNome, bloco),
        acao: () => triagem_inicial_salvar_link_da_audiencia()
    })
    let linkSalvo = await obterArmazenamento(['rota_triagem_inicial_linkDaAudiencia'])
    let link = linkSalvo?.rota_triagem_inicial_linkDaAudiencia || ''
    let inputLinkAudiencia = document.getElementById(idg(tarefaNome, bloco, 'input_link_da_audiencia'))
    if (inputLinkAudiencia) {
        inputLinkAudiencia.placeholder = 'digite aqui o link do zoom'
        if (link) {
            inputLinkAudiencia.value = link
            inputLinkAudiencia.placeholder = ''
        }
    }
    
    criaSubTitulo({
        id: idg(tarefaNome, bloco, 'acoes_conjuntas', 'subtitulo'),
        texto: 'Ações conjuntas',
        ancestral: idg(tarefaNome, bloco)
    })
    
    criaDivExecucao({
        id: idg(tarefaNome, bloco, 'acoes_conjuntas'),
        idColuna: idg(tarefaNome, bloco, 'acoes_conjuntas', 'coluna'),
        idBotaoExecutar: idg(tarefaNome, bloco, 'acoes_conjuntas', 'executar'), 
        acaoBotaoExecutar: () => /*alert('Em desenvolvimento'), */triagemDesignarAudienciaAcoesConjuntas('designa_audiencia'),
        ancestral: idg(tarefaNome, bloco)
    })
    

    criaTextoQueAbrePassandoOMouse({
        id: idg(tarefaNome, bloco, 'acoes_conjuntas', 'instrucao'),
        texto: 'Como usar este bloco? Passe o mouse. Clique para fixar/desafixar.',
        textoBox: 'Se você deseja fazer apenas uma das ações, clique no botão azul ou laranja correspondente. Você pode, também, selecionar os checkbox que deseja, e as ações serão executadas uma após a outra ao clicar no botão laranja Executar ao lado.',
        ancestral: idg(tarefaNome, bloco, 'acoes_conjuntas', 'coluna')
    })

    // Container vazio: preenchido/atualizado por renderizarHorariosVagos() com os botões de horário + linha manual.
    criaDiv({ id: idg(tarefaNome, bloco, 'acoes_conjuntas', 'lista_horarios'), ancestral: idg(tarefaNome, bloco, 'acoes_conjuntas', 'coluna') })
    let checkDespacharCertificar = false
    await criaBotaoLaranjaComCheckBox({
        id: idg(tarefaNome, bloco, 'acoes_conjuntas', 'despacho'),
        idCheckbox: idg(tarefaNome, bloco, 'acoes_conjuntas', 'despacho', 'checkbox'),
        texto: 'Despachar designando.',
        ancestral: idg(tarefaNome, bloco, 'acoes_conjuntas', 'coluna'),
        acao: async () => {
            await removerArmazenamento('rota_acoes_conjuntas_triagem_inicial_em_andamento')
            comandar(['triagem_inicial_despachar'], [{tipo: 'triagem_inicial_despachar_designacao'}])
        },
        grupo: idg(tarefaNome, bloco, 'acoes_conjuntas', 'grupo_despacho_ou_certidao'),
        salvar: true
    })
    if (document.getElementById(idg(tarefaNome, bloco, 'acoes_conjuntas', 'despacho', 'checkbox'))?.dataset.marcado == 1) checkDespacharCertificar = true
    await criaBotaoLaranjaComCheckBox({
        id: idg(tarefaNome, bloco, 'acoes_conjuntas', 'despacho', 'redesigna'),
        idCheckbox: idg(tarefaNome, bloco, 'acoes_conjuntas', 'despacho', 'redesigna', 'checkbox'),
        texto: 'Despachar REDESIGNAÇÃO - MODELO SIMPLES DE REDESIGNAÇÃO.',
        ancestral: idg(tarefaNome, bloco, 'acoes_conjuntas', 'coluna'),
        acao: async () => {
            await removerArmazenamento('rota_acoes_conjuntas_triagem_inicial_em_andamento')
            comandar(['triagem_inicial_despachar'], [{tipo: 'triagem_inicial_despachar_redesignacao'}])
        },
        grupo: idg(tarefaNome, bloco, 'acoes_conjuntas', 'grupo_despacho_ou_certidao'),
        salvar: true
    })
    if (document.getElementById(idg(tarefaNome, bloco, 'acoes_conjuntas', 'despacho', 'redesigna', 'checkbox'))?.dataset.marcado == 1) checkDespacharCertificar = true
    await criaBotaoLaranjaComCheckBox({
        id: idg(tarefaNome, bloco, 'acoes_conjuntas', 'certidao'),
        idCheckbox: idg(tarefaNome, bloco, 'acoes_conjuntas', 'certidao', 'checkbox'),
        texto: 'Certificar a designação, intimar e encaminhar para aguardando audiência.',
        ancestral: idg(tarefaNome, bloco, 'acoes_conjuntas', 'coluna'), 
        acao: async () => {
            await removerArmazenamento('rota_acoes_conjuntas_triagem_inicial_em_andamento')
            comandar(['triagem_inicial_certidao'], [{tipo: 'triagem_inicial_certificar_designacao'}])
        },
        grupo: idg(tarefaNome, bloco, 'acoes_conjuntas', 'grupo_despacho_ou_certidao'),
        salvar: true
    })
    if (document.getElementById(idg(tarefaNome, bloco, 'acoes_conjuntas', 'certidao', 'checkbox'))?.dataset.marcado == 1) checkDespacharCertificar = true
    await criaBotaoLaranjaComCheckBox({
        id: idg(tarefaNome, bloco, 'acoes_conjuntas', 'certificar_link_e_intimar'),
        idCheckbox: idg(tarefaNome, bloco, 'acoes_conjuntas', 'certificar_link_e_intimar', 'checkbox'),
        texto: 'Certificar novo link e intimar.',
        ancestral: idg(tarefaNome, bloco, 'acoes_conjuntas', 'coluna'),
        acao: async () => {
            let inputLink = document.getElementById(idg(tarefaNome, bloco, 'input_link_da_audiencia'))
            let link = inputLink?.value
            await removerArmazenamento('rota_acoes_conjuntas_triagem_inicial_em_andamento')
            comandar(['triagem_inicial_certidao'], [{tipo: 'triagem_inicial_certificar_novo_link_e_intimar', link: link}])
        },
        grupo: idg(tarefaNome, bloco, 'acoes_conjuntas', 'grupo_despacho_ou_certidao'),
        salvar: true
    })
    if (document.getElementById(idg(tarefaNome, bloco, 'acoes_conjuntas', 'certificar_link_e_intimar', 'checkbox'))?.dataset.marcado == 1) checkDespacharCertificar = true

    //let checkBoxDespacho = document.getElementById(idg(tarefaNome, bloco, 'acoes_conjuntas', 'despacho', 'checkbox'))
    //if (checkBoxDespacho && !checkDespacharCertificar) checkBoxDespacho.click()

    await criaBotaoAzulComCheckBox({
        id: idg(tarefaNome, bloco, 'acoes_conjuntas', 'gig'),
        idCheckbox: idg(tarefaNome, bloco, 'acoes_conjuntas', 'gig', 'checkbox'),
        texto: 'Colocar GIG de acompanhamento.',
        ancestral: idg(tarefaNome, bloco, 'acoes_conjuntas', 'coluna'),
        acao: async () => {
            await removerArmazenamento('rota_acoes_conjuntas_triagem_inicial_em_andamento')
            comandar(['triagem_inicial_gig'], [{tipo: 'triagem_inicial_gig_acompanhamento'}])
        },
        salvar: true
    })
    
    
    //let checkBoxGig = document.getElementById(idg(tarefaNome, bloco, 'acoes_conjuntas', 'gig', 'checkbox'))
    //if (checkBoxGig) checkBoxGig.click()

    // ── Renderização (e re-renderização) dos horários vagos ───
    //
    // Preenche o container criado como stub vazio mais acima:
    //   acoes_conjuntas/lista_horarios — aviso (se não houver horário),
    //   botões de horário e a linha "designar manualmente", todos dentro
    //   de 'coluna', pois a opção manual também precisa participar do
    //   "Executar" (grupo_designacao).
    // Pode ser chamada de novo (troca de sala) sem duplicar nada, pois sempre limpa antes de recriar.
    async function renderizarHorariosVagos(dadosAtual) {
        let horariosVagos = dadosAtual?.rota_dadosTriagemInicial?.horariosVagos
        console.log('%c[Rota PJE]%c horariosVagos: ' + JSON.stringify(horariosVagos), LOG.rosa, 'color:inherit')
        console.log('%c[Rota PJE]%c dadosAtual?.rota_dadosTriagemInicial?.sala?.nome: ' + JSON.stringify(dadosAtual?.rota_dadosTriagemInicial?.sala?.nome), LOG.rosa, 'color:inherit')
        let idLista = idg(tarefaNome, bloco, 'acoes_conjuntas', 'lista_horarios')
        let containerLista = document.getElementById(idLista)
        containerLista.innerHTML = ''
        let textoSemHorario = dadosAtual?.rota_dadosTriagemInicial?.sala?.nome ? `Não foram encontrados horários vagos para esta sala. Utilize a opção abaixo para designar manualmente a audiência.` : `Não há sala selecionada.`
        if (!horariosVagos?.length/* && dadosAtual?.rota_dadosTriagemInicial?.sala?.nome*/) {
            criaTexto({
                id: idg(tarefaNome, bloco, 'sem_horario'),
                texto: textoSemHorario,//`Não foram encontrados horários vagos para esta sala. Utilize a opção abaixo para designar manualmente a audiência.`,
                ancestral: idLista
            })
        }

        let checkBoxPreMarcadoTipoAudiencia = false
        let i = 0
        if (horariosVagos?.length) {
            let horarioInicialPreMarcar = ''
            for (i; i < horariosVagos.length; i++) {
                let horario = horariosVagos[i]
                let horarioInicial = new Date(horario.horarioInicial)
                let horarioInicialBotao = `${horario.descricaoTipoAudiencia} - ${horarioInicial.toLocaleDateString('pt-BR')} às ${horarioInicial.getHours()}h${String(horarioInicial.getMinutes()).padStart(2, '0')}`
                let processo = dadosAtual?.rota_dadosTriagemInicial?.processo?.numero
                let sala = dadosAtual?.rota_dadosTriagemInicial?.sala?.nome
                horario.processo = processo
                horario.nomeDaSala = sala
                let linha = await criaBotaoAzulComCheckBox({
                    id: idg(tarefaNome, bloco, 'acoes_conjuntas', 'horario' + i),
                    idCheckbox: idg(tarefaNome, bloco, 'acoes_conjuntas', 'horario' + i, 'checkbox'),
                    texto: horarioInicialBotao,
                    ancestral: idLista,
                    acao: async () => {
                        await removerArmazenamento('rota_acoes_conjuntas_triagem_inicial_em_andamento')
                        comandar(['triagem_inicial_designa_audiencia'], [{horario}])
                    },
                    grupo: idg(tarefaNome, bloco, 'acoes_conjuntas', 'grupo_designacao'),
                    salvar: true
                })
                linha.dataset.horario = JSON.stringify(horario)
                if (document.getElementById(idg(tarefaNome, bloco, 'acoes_conjuntas', 'horario' + i, 'checkbox'))?.dataset.marcado == 1) {
                    console.log('%c[Rota PJE]%c 333 aqui: ' + JSON.stringify(333), LOG.info, 'color:inherit')
                    checkBoxPreMarcadoTipoAudiencia = true
                }
                if (horario.descricaoTipoAudiencia.includes('Inicial')) horarioInicialPreMarcar = i
            }
            //if (!checkBoxPreMarcadoTipoAudiencia){
            //    console.log('%c[Rota PJE]%c 336 aqui: ' + JSON.stringify(336), LOG.info, 'color:inherit')
            //    let checkBox = document.getElementById(idg(tarefaNome, bloco, 'acoes_conjuntas', 'horario' + horarioInicialPreMarcar, 'checkbox'))
            //    if (checkBox) checkBox.click()
            //}
            
        }

        // Opção "manual" sempre presente, sempre como linha com checkbox do
        // grupo_designacao — assim ela sempre participa do "Executar",
        // exista ou não horário vago disponível pra sala escolhida.
        let linhaManual = await criaBotaoAzulComCheckBox({
            id: idg(tarefaNome, bloco, 'acoes_conjuntas', 'horario' + i),
            idCheckbox: idg(tarefaNome, bloco, 'acoes_conjuntas', 'horario' + i, 'checkbox'),
            texto: 'Designar audiência manualmente em outra sala/horário',
            ancestral: idLista,
            acao: async () => {
                await removerArmazenamento('rota_acoes_conjuntas_triagem_inicial_em_andamento')
                comandar(['triagem_inicial_designa_audiencia'], [{horario: {tipo: 'manual', processo: dadosAtual?.rota_dadosTriagemInicial?.processo?.numero, sala: dadosAtual?.rota_dadosTriagemInicial?.sala?.nome, link: inputLinkAudiencia.value}}])
            },
            grupo: idg(tarefaNome, bloco, 'acoes_conjuntas', 'grupo_designacao'),
            salvar: true
        })
        linhaManual.dataset.horario = JSON.stringify({tipo: 'manual', processo: dadosAtual?.rota_dadosTriagemInicial?.processo?.numero, sala: dadosAtual?.rota_dadosTriagemInicial?.sala?.nome, link: inputLinkAudiencia.value})

        // Sem horário vago, a manual é a única opção — pré-marca ela.
        //if (!horariosVagos?.length && !checkBoxPreMarcadoTipoAudiencia) {
        //    let checkBoxManual = document.getElementById(idg(tarefaNome, bloco, 'acoes_conjuntas', 'horario' + i, 'checkbox'))
        //    if (checkBoxManual) checkBoxManual.click()
        //}
    }

    await renderizarHorariosVagos(dados)

    // ── Troca de sala: pede novos horários e re-renderiza só a lista acima ──
    selectSala?.addEventListener('change', async () => {
        // criaMenuSuspenso não é um <select> nativo — é uma div sem noção de "disabled".
        // pointer-events: none bloqueia clique no "botão" e na lista (ambos filhos do container),
        // evitando que o usuário troque de sala de novo antes da resposta da 1ª troca voltar.
        selectSala.style.pointerEvents = 'none'
        selectSala.style.opacity = '0.6'
        document.getElementById(idg(tarefaNome, bloco, 'acoes_conjuntas', 'lista_horarios'))?.style.setProperty('opacity', '0.5')

        comandar(['triagem_inicial_atualiza_horarios_vagos'], [{ salaId: selectSala.value }])
    })

    NAVEGADOR.storage.onChanged.addListener(async (mudancas) => {
        if (!mudancas['rota_triagem_inicial_horariosAtualizados']) return
        let dadosAtualizados = await obterArmazenamento(['rota_dadosTriagemInicial'])
        await renderizarHorariosVagos(dadosAtualizados)
        if (selectSala) {
            selectSala.style.pointerEvents = ''
            selectSala.style.opacity = '1'
        }
        document.getElementById(idg(tarefaNome, bloco, 'acoes_conjuntas', 'lista_horarios'))?.style.setProperty('opacity', '1')
    })



    let armazenamentoUsuario = await obterArmazenamento('rotapje_usuario') || {}
    let usuario = armazenamentoUsuario?.rotapje_usuario || ''
    console.log('%c[Rota PJE]%c usuario: ' + JSON.stringify(usuario), LOG.info, 'color:inherit')
    if (!normalizar(usuario?.nome).includes('gustavo mariano coutinho de souza')) return
    let botaoLote = criaBotaoAzul({
        id: idg(tarefaNome, 'tramitaEmLote', 'botao'),
        ancestral: 'rota_corpo',
        texto: 'Tramitar em lote',
        acao: async () => await tramitaEmLote()
    })
    botaoLote.style.background = '#c1121f'
    botaoLote.style.width = '100%'
    _ui_hoverBotao(botaoLote, '#c1121f', '#780000')
    criaTooltip({
        id: idg(tarefaNome, 'tramitaEmLote', 'tip'),
        texto: 'Tramita em lote executando as ações que estão selecionadas no botão "Executar todas"',
        elemento: botaoLote
    })
    let loteChave = idg('triagem_inicial', 'tramitaEmLote')
    let loteArmazenamento = await obterArmazenamento(loteChave) || false
    let loteTramitar = loteArmazenamento[loteChave] || false
    if (loteTramitar) {
        botaoLote.textContent = 'Parar Tramitação em Lote'
        document.getElementById(idg(tarefaNome, 'tramitaEmLote', 'tip') + '-tip').textContent = 'Cancelará a tramitação em lote, mas o processo atual irá até o fim.'
        NAVEGADOR.storage.onChanged.addListener(function ouvirTramitarEmLote(mudancas) {
            if (mudancas['rotapje_tramitarEmLoteClicarProximo']?.newValue === true) {
                console.log('%c[Rota PJE]%c 424' + JSON.stringify(424), LOG.aviso, 'color:inherit')
                NAVEGADOR.storage.onChanged.removeListener(ouvirTramitarEmLote)
                console.log('%c[Rota PJE]%c 424' + JSON.stringify(424), LOG.aviso, 'color:inherit')
                armazenar({ rotapje_tramitarEmLoteClicarProximo: false })
                console.log('%c[Rota PJE]%c 424' + JSON.stringify(424), LOG.aviso, 'color:inherit')
                tramitaEmLote(true)
            }
        })
        document.getElementById(idg(tarefaNome, bloco, 'acoes_conjuntas', 'executar')).click()
    }

    criaTexto({
        id: idg(tarefaNome, 'textoUsuario', 'titulo'),
        ancestral: 'rota_corpo',
        texto: 'Insira abaixo os textos que você deseja que sejam incluídos nos textos de notificação ou despacho. Se os checkboxes estiverem clicados, será utilizado um modelo SIMPLES, constando apenas a data da audiência e link, seguido do texto.'
    })
    for(let i = 0; i < 2; i++){
        let idPadrao = idg(tarefaNome, 'textoUsuario', JSON.stringify(i))
        let divUsuario = criaDiv({
            id: idPadrao + '_div',
            ancestral: 'rota_corpo',
            rowColumn: 'row'
        })
        divUsuario.style.marginLeft  = '6px'
        divUsuario.style.marginRight = '6px'
        let check = await criaCheckBox({
            id: idPadrao + '_check',
            ancestral: idPadrao + '_div',
            salvar: true
        })
        criaTooltip({
            id: idPadrao + '_check_tip',
            texto: 'Clique / desclique para utilizar ou não o texto',
            elemento: check
        })
        let armazenamento = await obterArmazenamento(idPadrao + '_input') || {}
        console.log('%c[Rota PJE]%c armazenamento: ' + JSON.stringify(armazenamento), LOG.info, 'color:inherit', armazenamento)
        let textoArmazenado = armazenamento[idPadrao + '_input'] || ''
        console.log('%c[Rota PJE]%c textoArmazenado: ' + JSON.stringify(textoArmazenado), LOG.info, 'color:inherit', textoArmazenado)
        let inputUsuario = criaInputAnotacao({
            id: idPadrao + '_input',
            ancestral: idPadrao + '_div',
        })
        inputUsuario.style.width = '100%'
        if (textoArmazenado) inputUsuario.textarea.value = textoArmazenado
        inputUsuario.addEventListener('change', async () => await atualizarTextoModelo(idPadrao + '_input', idPadrao + '_textoModelo', idPadrao + 'textoModelo_subtitulo'))
        let textoModeloSubtitulo = criaSubTitulo({
            id: idPadrao + 'textoModelo_subtitulo',
            ancestral: 'rota_corpo',
            texto: ''
        })
        let textoModelo = criaTexto({
            id: idPadrao + '_textoModelo',
            ancestral: 'rota_corpo',
            texto: ''
        })
    }
    // not geral 1278250
    // des geral 1278254
    async function atualizarTextoModelo(input, texto, titulo){
        console.log('%c[Rota PJE]%c 456, chamou: ' + JSON.stringify(456), LOG.info, 'color:inherit')
        let inputTexto = document.getElementById(input)?.value
        if (!inputTexto){
            document.getElementById(texto)?.remove()
            document.getElementById(titulo)?.remove()
            return
        }
        let textoDiv = document.getElementById(texto)
        let subtitulo = document.getElementById(titulo)
        await armazenar({[input]: inputTexto})
        subtitulo.textContent = 'Os textos ficarão assim:'
        textoDiv.textContent = `Despacho:

Vistos, etc.
Designo audiência #{processo.audiencia.tipo}, em #{processo.audiencia.dataHora}. O link da audiência, para partes, advogados e testemunhas é:
#{processo.audiencia.link}
` + inputTexto + `

==============

Notificação:

Ficam as partes intimadas da audiência designada, conforme dados abaixo:
1- Classe do Processo: #{processo.classeJudicial}.  Tipo de Audiência: #{processo.audiencia.tipo}.
2- Data : #{processoTrfHome.dataAudiencia}
3- Link da audiência: O link da audiência, para partes, advogados e testemunhas, é o que segue:
#{processo.audiencia.link}
` + inputTexto
        return
    }

    console.log('%c[Rota PJE]%c blocos criados', LOG.teste, 'color:inherit')
    
    function chkEstaMarcado(idCheckbox) {
        return document.getElementById(idCheckbox)?.dataset.marcado === '1'
    }

    function triagemDesignarAudienciaAcoesConjuntas(bloco) {
        const comandos = []
        const dados = []

        const chkDesignacao = document.querySelector(`[data-grupo="${idg(tarefaNome, bloco, 'acoes_conjuntas', 'grupo_designacao')}"][data-marcado="1"]`)
        console.log('%c[Rota PJE]%c chkDesignacao: ' + JSON.stringify(chkDesignacao), LOG.teste, 'color:inherit')
        if (chkDesignacao) {
            const horario = JSON.parse(chkDesignacao.closest('[data-horario]').dataset.horario)
            comandos.push('triagem_inicial_designa_audiencia')
            dados.push({horario: horario})
        }

        if (chkEstaMarcado(idg(tarefaNome, bloco, 'acoes_conjuntas', 'despacho', 'checkbox'))) {
            comandos.push('triagem_inicial_despachar')
            dados.push({tipo: 'triagem_inicial_despachar_designacao'})
        }

        if (chkEstaMarcado(idg(tarefaNome, bloco, 'acoes_conjuntas', 'despacho', 'redesigna', 'checkbox'))) {
            comandos.push('triagem_inicial_despachar')
            dados.push({tipo: 'triagem_inicial_despachar_redesignacao'})
        }

        if (chkEstaMarcado(idg(tarefaNome, bloco, 'acoes_conjuntas', 'certidao', 'checkbox'))) {
            comandos.push('triagem_inicial_certidao')
            dados.push({tipo: 'triagem_inicial_certificar_designacao'})
        }
        if (chkEstaMarcado(idg(tarefaNome, bloco, 'acoes_conjuntas', 'certificar_link_e_intimar', 'checkbox'))) {
            comandos.push('triagem_inicial_certidao')
            dados.push({tipo: 'triagem_inicial_certificar_novo_link_e_intimar', link: link})
        }

        if (chkEstaMarcado(idg(tarefaNome, bloco, 'acoes_conjuntas', 'gig', 'checkbox'))) {
            comandos.push('triagem_inicial_gig')
            dados.push({tipo: 'triagem_inicial_gig_acompanhamento'})
        }
        console.log('%c[Rota PJE]%c quantos comandos: ' + comandos.length, LOG.teste, 'color:inherit')
        if (comandos.length) comandar(['triagem_inicial_acoes_conjuntas'], [{comandos: comandos, parametros: dados}])
    }
    async function triagem_inicial_salvar_link_da_audiencia() {
        let inputLinkAudiencia = document.getElementById(idg(tarefaNome, 'designa_audiencia', 'input_link_da_audiencia'))
        let linkSalvar = inputLinkAudiencia.value
        if (linkSalvar){
            await armazenar({ rota_triagem_inicial_linkDaAudiencia: linkSalvar })
        } else {
            await removerArmazenamento('rota_triagem_inicial_linkDaAudiencia')
        }
    }
    
}

async function tramitaEmLote(clicarProximo = false) {
    console.log('%c[Rota PJE]%c 489' + JSON.stringify(489), LOG.aviso, 'color:inherit')
    if (clicarProximo){
        let texto = document.querySelector('#nav-posicao.assistente-posicao').textContent
        let numeros = texto.split('/').map(d => Number(d.trim()))
        if (numeros[0] == numeros[1]) return
        document.getElementById('rota-btn-nav-proximo').click()
        return
    }
    let loteChave = idg('triagem_inicial', 'tramitaEmLote')
    let loteArmazenamento = await obterArmazenamento(loteChave) || false
    let loteTramitar = loteArmazenamento[loteChave] || false
    await armazenar({[loteChave]: !loteTramitar})
    if(!loteTramitar){
        document.getElementById(idg('triagem_inicial', 'tramitaEmLote', 'botao')).textContent = 'Parar Tramitação em Lote'
        document.getElementById(idg('triagem_inicial', 'tramitaEmLote', 'tip') + '-tip').textContent = 'Cancelará a tramitação em lote, mas o processo atual irá até o fim.'
        document.getElementById(idg('triagem_inicial', 'designa_audiencia', 'acoes_conjuntas', 'executar')).click()
        NAVEGADOR.storage.onChanged.addListener(function ouvirTramitarEmLote(mudancas) {
            if (mudancas['rotapje_tramitarEmLoteClicarProximo']?.newValue === true) {
                NAVEGADOR.storage.onChanged.removeListener(ouvirTramitarEmLote)
                armazenar({ rotapje_tramitarEmLoteClicarProximo: false })
                tramitaEmLote(true)
            }
        })
    } else {
        document.getElementById(idg('triagem_inicial', 'tramitaEmLote', 'botao')).textContent = 'Tramitar em lote'
        document.getElementById(idg('triagem_inicial', 'tramitaEmLote', 'tip') + '-tip').textContent = 'Tramita em lote executando as ações que estão selecionadas no botão "Executar todas"'
    }
}

rotaRegistrarAcoes({
    'tramitarEmLote_clicarProximo':        async (p) => await tramitaEmLote(p),
})

// Auto-executa ao carregar o script
triagem_assistente_iniciar()
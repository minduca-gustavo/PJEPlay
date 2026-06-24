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
    bloco = 'solucao'

    criaDiv({ id: id(tarefaNome, bloco), ancestral: 'rota_corpo' })
    criaTitulo({ id: id(tarefaNome, bloco, 'titulo'), texto: 'Solução(ões) do Processo', ancestral: id(tarefaNome, bloco) })
    let i = 0
    for (solucao of dados?.rota_dadosCon2PrazoVencido?.solucao || []) {
        if (solucao.includes('IMPROCEDENTES')){
            cor = 'vermelho'
        } else if (solucao.includes('PROCEDENTES EM PARTE')) {
            cor = 'amarelo'
        } else if (solucao.includes('PROCEDENTES') && !solucao.includes('EM PARTE')) {
            cor = 'verde'
        }

        let plaquinha = criaPlaquinha({
            id:     id(tarefaNome, bloco, 'solucao', i),
            texto:  solucao,
            cor:    cor,
            ancestral: id(tarefaNome, bloco)
        })
        i++
    }
    criaTextoQueAbrePassandoOMouse({
        id: id(tarefaNome, bloco, 'dados_das_partes'),
        texto: `Passe o mouse para ver os dados das partes.
Clique para fixar/desafixar.`,
        textoBox: `Dados das partes:
${formatarPartes(dados?.rota_dadosCon2PrazoVencido?.partes)}`,
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
    criaBotaoAzul({ id: id(tarefaNome, bloco, 'retificar_partes'),   texto: 'Retificar autuação: partes',   ancestral: id(tarefaNome, bloco), acao: () => comandar(['con2_prazo_vencido_retificar'], [{tipo: 'Partes'}])})
    criaBotaoAzul({ id: id(tarefaNome, bloco, 'retificar_rito'),     texto: 'Retificar autuação: rito',     ancestral: id(tarefaNome, bloco), acao: () => comandar(['con2_prazo_vencido_retificar'], [{tipo: 'Dados Iniciais'}])})
    criaBotaoAzul({ id: id(tarefaNome, bloco, 'retificar_assuntos'), texto: 'Retificar autuação: assuntos', ancestral: id(tarefaNome, bloco), acao: () => comandar(['con2_prazo_vencido_retificar'], [{tipo: 'Assuntos'}])})
    criaBotaoLaranja({
        id: id(tarefaNome, bloco, 'despacho_emenda_retificacao'), 
        texto: 'Despacho: retificar autuação/emendar a inicial', 
        ancestral: id(tarefaNome, bloco), 
        acao: async () => {
            await removerArmazenamento('rota_acoes_conjuntas_con2_prazo_vencido_em_andamento')
            comandar(['con2_prazo_vencido_despachar'], [{tipo: 'con2_prazo_vencido_emendar'}])
        }
    })

    // ── Bloco: designa-audiencia ──────────────────────────────
    bloco = 'designa_audiencia'

    criaDiv({ id: id(tarefaNome, bloco), ancestral: 'rota_corpo' })
    criaTitulo({ id: id(tarefaNome, bloco, 'titulo'), texto: 'Designação de audiência', ancestral: id(tarefaNome, bloco) })
    console.log('%c[Rota PJE]%c Juiz: ' + dados?.rota_dadosCon2PrazoVencido?.juizSimetriaPeloGig, LOG.teste, 'color:inherit')
    console.log('%c[Rota PJE]%c dados: ' + JSON.stringify(dados?.rota_dadosCon2PrazoVencido?.sala), LOG.teste, 'color:inherit')
    console.log('%c[Rota PJE]%c dados: ' + JSON.stringify(dados?.rota_dadosCon2PrazoVencido?.horariosVagos), LOG.teste, 'color:inherit')

    criaTexto({
        id: id(tarefaNome, bloco, 'texto'),
        texto: dados?.rota_dadosCon2PrazoVencido?.juizSimetriaPeloGig
            ? `A extensão identificou a seguinte sala: ${dados.rota_dadosCon2PrazoVencido.sala.nome}.`
            : 'Não foi identificada sala.',
        ancestral: id(tarefaNome, bloco)
    })

    if (!dados?.rota_dadosCon2PrazoVencido?.horariosVagos?.length) {

        if (dados?.rota_dadosCon2PrazoVencido?.sala?.nome) {
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
            acao: async () => {
                await removerArmazenamento('rota_acoes_conjuntas_con2_prazo_vencido_em_andamento')
                comandar(['con2_prazo_vencido_designa_audiencia'], [{dados: 'manual'}])
            }
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
        acao: () => con2_prazo_vencido_salvar_link_da_audiencia()
    })
    let linkSalvo = await obterArmazenamento(['rota_con2_prazo_vencido_linkDaAudiencia'])
    let link = linkSalvo?.rota_con2_prazo_vencido_linkDaAudiencia || ''
    let inputLinkAudiencia = document.getElementById(id(tarefaNome, bloco, 'input_link_da_audiencia'))
    if (inputLinkAudiencia) {
        inputLinkAudiencia.placeholder = 'digite aqui o link do zoom'
        if (link) {
            inputLinkAudiencia.value = link
            inputLinkAudiencia.placeholder = ''
        }
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
        acaoBotaoExecutar: () => /*alert('Em desenvolvimento'), */con2_prazo_vencidoDesignarAudienciaAcoesConjuntas('designa_audiencia'),
        ancestral: id(tarefaNome, bloco)
    })
    

    criaTextoQueAbrePassandoOMouse({
        id: id(tarefaNome, bloco, 'acoes_conjuntas', 'instrucao'),
        texto: 'Como usar este bloco? Passe o mouse. Clique para fixar/desafixar.',
        textoBox: 'Se você deseja fazer apenas uma das ações, clique no botão azul ou laranja correspondente. Você pode, também, selecionar os checkbox que deseja, e as ações serão executadas uma após a outra ao clicar no botão laranja Executar ao lado.',
        ancestral: id(tarefaNome, bloco, 'acoes_conjuntas', 'coluna')
    })

    if (dados?.rota_dadosCon2PrazoVencido?.horariosVagos?.length) {
        
     

        let checkBoxPreMarcadoTipoAudiencia = false
        let i = 0
        //let inputPulando = criaInput({
        //    id: id(tarefaNome, bloco, 'acoes_conjuntas', 'horario', i, 'input'), 
        //    textoEmCima: 'Caso queira utilizar datas posteriores às datas dos botões abaixo, insira a data inicial desejada abaixo, utilize a opção de designação manual, e clique no botão "Próximo horário vago" (seta preta) correspondente.', 
        //    ancestral: id(tarefaNome, bloco, 'acoes_conjuntas', 'coluna'),
        //    placeholder: 'DD/MM/AAAA'
        //})
        //let dataPula = await obterArmazenamento('con2_prazo_vencido_pula_data')
        //console.log('%c[Rota PJE]%c dataPula: ' + JSON.stringify(dataPula), LOG.rosa, 'color:inherit')
        //if (dataPula?.con2_prazo_vencido_pula_data){
        //    inputPulando.value = dataPula?.con2_prazo_vencido_pula_data
        //}
        for (i; i < dados?.rota_dadosCon2PrazoVencido?.horariosVagos?.length; i++) {
            let horario = dados?.rota_dadosCon2PrazoVencido?.horariosVagos?.[i]
            let horarioInicial = new Date(horario.horarioInicial)
            let horarioInicialBotao = `${horario.descricaoTipoAudiencia} - ${horarioInicial.toLocaleDateString('pt-BR')} às ${horarioInicial.getHours()}h${String(horarioInicial.getMinutes()).padStart(2, '0')}`
            let processo = dados?.rota_dadosCon2PrazoVencido?.processo?.numero
            let sala = dados?.rota_dadosCon2PrazoVencido?.sala?.nome
            horario.processo = processo
            horario.nomeDaSala = sala
            let linha = criaBotaoAzulComCheckBox({
                id: id(tarefaNome, bloco, 'acoes_conjuntas', 'horario' + i),
                idCheckbox: id(tarefaNome, bloco, 'acoes_conjuntas', 'horario' + i, 'checkbox'),
                texto: horarioInicialBotao,
                ancestral: id(tarefaNome, bloco, 'acoes_conjuntas', 'coluna'),
                acao: async () => {
                    await removerArmazenamento('rota_acoes_conjuntas_con2_prazo_vencido_em_andamento')
                    comandar(['con2_prazo_vencido_designa_audiencia'], [{horario}])
                },
                grupo: id(tarefaNome, bloco, 'acoes_conjuntas', 'grupo_designacao')
            })
            linha.dataset.horario = JSON.stringify(horario)
            if (horario.descricaoTipoAudiencia.includes('Inicial') && !checkBoxPreMarcadoTipoAudiencia) {
                let checkBox = document.getElementById(id(tarefaNome, bloco, 'acoes_conjuntas', 'horario' + i, 'checkbox'))
                if (checkBox) checkBox.click()
                checkBoxPreMarcadoTipoAudiencia = true
            }
        }
        let linhaManual = criaBotaoAzulComCheckBox({
            id: id(tarefaNome, bloco, 'acoes_conjuntas', 'horario' + i),
            idCheckbox: id(tarefaNome, bloco, 'acoes_conjuntas', 'horario' + i, 'checkbox'),
            texto: 'Designar audiência manualmente em outra sala/horário',
            ancestral: id(tarefaNome, bloco, 'acoes_conjuntas', 'coluna'),
            acao: async () => {
                await removerArmazenamento('rota_acoes_conjuntas_con2_prazo_vencido_em_andamento')
                comandar(['con2_prazo_vencido_designa_audiencia'], [{horario: {tipo: 'manual', processo: dados?.rota_dadosCon2PrazoVencido?.processo?.numero, sala: dados?.rota_dadosCon2PrazoVencido?.sala?.nome, link: inputLinkAudiencia.value}}])
            },
            grupo: id(tarefaNome, bloco, 'acoes_conjuntas', 'grupo_designacao')
        })
        linhaManual.dataset.horario = JSON.stringify({tipo: 'manual', processo: dados?.rota_dadosCon2PrazoVencido?.processo?.numero, sala: dados?.rota_dadosCon2PrazoVencido?.sala?.nome, link: inputLinkAudiencia.value})
        
        //i++
        //let inputPulando = criaInput({
        //    id: id(tarefaNome, bloco, 'acoes_conjuntas', 'horario', i, 'input'), 
        //    textoEmCima: 'Insira a data limite para bloqueio das audiências (serão bloqueadas todas as audiências até a data escolhida).', 
        //    ancestral: id(tarefaNome, bloco, 'extras-recolhe'),
        //    placeholder: 'DD/MM/AAAA'
        //})
        //await armazenar({con2_prazo_vencido_pula_data: '22/06/2026'})
        
        //let linhaPulando = criaBotaoAzulComCheckBox({
        //    id: id(tarefaNome, bloco, 'acoes_conjuntas', 'horario' + i),
        //    idCheckbox: id(tarefaNome, bloco, 'acoes_conjuntas', 'horario' + i, 'checkbox'),
        //    texto: 'Designar audiência pulando horário',
        //    ancestral: id(tarefaNome, bloco, 'acoes_conjuntas', 'coluna'),
        //    acao: async () => {
        //        await removerArmazenamento('rota_acoes_conjuntas_con2_prazo_vencido_em_andamento')
        //        comandar(['con2_prazo_vencido_designa_audiencia'], [{horario: {tipo: 'pulando', processo: dados?.rota_dadosCon2PrazoVencido?.processo?.numero, sala: dados?.rota_dadosCon2PrazoVencido?.sala?.nome}}])
        //    },
        //    grupo: id(tarefaNome, bloco, 'acoes_conjuntas', 'grupo_designacao')
        //})
        //linhaPulando.dataset.horario = JSON.stringify({tipo: 'manual', processo: dados?.rota_dadosCon2PrazoVencido?.processo?.numero, sala: dados?.rota_dadosCon2PrazoVencido?.sala?.nome})
    }
    criaBotaoLaranjaComCheckBox({
        id: id(tarefaNome, bloco, 'acoes_conjuntas', 'despacho'),
        idCheckbox: id(tarefaNome, bloco, 'acoes_conjuntas', 'despacho', 'checkbox'),
        texto: 'Despachar designando.',
        ancestral: id(tarefaNome, bloco, 'acoes_conjuntas', 'coluna'),
        acao: async () => {
            await removerArmazenamento('rota_acoes_conjuntas_con2_prazo_vencido_em_andamento')
            comandar(['con2_prazo_vencido_despachar'], [{tipo: 'con2_prazo_vencido_despachar_designacao'}])
        },
        grupo: id(tarefaNome, bloco, 'acoes_conjuntas', 'grupo_despacho_ou_certidao')
    })
    criaBotaoLaranjaComCheckBox({
        id: id(tarefaNome, bloco, 'acoes_conjuntas', 'certidao'),
        idCheckbox: id(tarefaNome, bloco, 'acoes_conjuntas', 'certidao', 'checkbox'),
        texto: 'Certificar a designação, intimar e encaminhar para aguardando audiência.',
        ancestral: id(tarefaNome, bloco, 'acoes_conjuntas', 'coluna'), 
        acao: async () => {
            await removerArmazenamento('rota_acoes_conjuntas_con2_prazo_vencido_em_andamento')
            comandar(['con2_prazo_vencido_certidao'], [{tipo: 'con2_prazo_vencido_certificar_designacao'}])
        },
        grupo: id(tarefaNome, bloco, 'acoes_conjuntas', 'grupo_despacho_ou_certidao')
    })
    

    let checkBoxDespacho = document.getElementById(id(tarefaNome, bloco, 'acoes_conjuntas', 'despacho', 'checkbox'))
    if (checkBoxDespacho) checkBoxDespacho.click()

    criaBotaoAzulComCheckBox({
        id: id(tarefaNome, bloco, 'acoes_conjuntas', 'gig'),
        idCheckbox: id(tarefaNome, bloco, 'acoes_conjuntas', 'gig', 'checkbox'),
        texto: 'Colocar GIG de acompanhamento.',
        ancestral: id(tarefaNome, bloco, 'acoes_conjuntas', 'coluna'),
        acao: async () => {
            await removerArmazenamento('rota_acoes_conjuntas_con2_prazo_vencido_em_andamento')
            comandar(['con2_prazo_vencido_gig'], [{tipo: 'con2_prazo_vencido_gig_acompanhamento'}])
        },
    })
    let checkBoxGig = document.getElementById(id(tarefaNome, bloco, 'acoes_conjuntas', 'gig', 'checkbox'))
    if (checkBoxGig) checkBoxGig.click()

    console.log('%c[Rota PJE]%c blocos criados', LOG.teste, 'color:inherit')
    
    function chkEstaMarcado(idCheckbox) {
        return document.getElementById(idCheckbox)?.dataset.marcado === '1'
    }
    /*
    bloco = 'extras'
    let secaoExtras = criaSecaoMostraRecolhe({
        id: id(tarefaNome, bloco),
        idSempreAMostra: id(tarefaNome, bloco, 'extras-mostra'), 
        idRecolhe: id(tarefaNome, bloco, 'extras-recolhe'),  
        ancestral: 'rota_corpo'
    })
    const estadoSalvo = await obterArmazenamento('con2_prazo_vencido_extras_expandido')
    if (estadoSalvo?.con2_prazo_vencido_extras_expandido === false) {
        secaoExtras.recolher()
    }

    // Salvar quando o usuário alternar
    secaoExtras.aoAlternar = async (expandido) => {
        await armazenar({ con2_prazo_vencido_extras_expandido: expandido })
    }
    criaTitulo({
        id: id(tarefaNome, bloco, 'extras-titulo'), 
        texto: 'Extras (Bloqueio de pauta, etc.)', 
        ancestral: id(tarefaNome, bloco, 'extras-mostra')
    })
    criaSubTitulo({
        id: id(tarefaNome, bloco, 'extras-bloqueioDePauta'), 
        texto: 'Bloqueio de pauta', 
        ancestral: id(tarefaNome, bloco, 'extras-recolhe')
    })
    criaTexto({
        id: id(tarefaNome, bloco, 'extras-bloqueio-texto'), 
        texto: 'Esta ferramenta foi pensada para "tapar os furos" da pauta, dos processos que são retirados de pauta, e os horários ficam muito "em cima" para designação.', 
        ancestral: id(tarefaNome, bloco, 'extras-recolhe')
    })
    criaInput({
        id: id(tarefaNome, bloco, 'extras-bloqueio-inputData'), 
        textoEmCima: 'Insira a data limite para bloqueio das audiências (serão bloqueadas todas as audiências até a data escolhida).', 
        ancestral: id(tarefaNome, bloco, 'extras-recolhe'),
        placeholder: 'DD/MM/AAAA'
    })
    await armazenar({con2_prazo_vencido_pula_data: '22/06/2026'})
    let dataPula = await obterArmazenamento('con2_prazo_vencido_pula_data')
    console.log('%c[Rota PJE]%c dataPula: ' + JSON.stringify(dataPula), LOG.rosa, 'color:inherit')
    let input = document.getElementById(id(tarefaNome, bloco, 'extras-pula-inputData'))
    if (dataPula?.con2_prazo_vencido_pula_data){
        input.value = dataPula?.con2_prazo_vencido_pula_data
    }
    console.log('%c[Rota PJE]%c dados?.rota_dadosCon2PrazoVencido?.horariosVagos?.length: ' + JSON.stringify(dados?.rota_dadosCon2PrazoVencido?.horariosVagos?.length), LOG.rosa, 'color:inherit')
    for (let i = 0; i < dados?.rota_dadosCon2PrazoVencido?.horariosVagos?.length; i++){
        let horario = dados?.rota_dadosCon2PrazoVencido?.horariosVagos?.[i]
        console.log('%c[Rota PJE]%c horario: ' + JSON.stringify(horario), LOG.rosa, 'color:inherit')
        if (horario?.descricaoTipoAudiencia){
            let funcao = i % 2 === 0 ? criaBotaoAzul : criaBotaoLaranja
            funcao({
                id: id(tarefaNome, bloco, 'extras-bloqueio-botao' + i),
                texto: 'Bloquear todas as audiências do tipo ' + horario?.descricaoTipoAudiencia + ' até a data preenchida acima.',
                ancestral: id(tarefaNome, bloco, 'extras-recolhe'),
                acao: async ()=> {
                    if (!/\d\d\/\d\d\/\d\d\d\d/.test(input.value)) {
                        rota_avisoTemporario('Data no formato incorreto. Formato esperado: DD/MM/AAAA', 'erro')
                        input.value = ''
                        input.placeholder = 'Data no formato incorreto. Formato esperado: DD/MM/AAAA'
                        await suspender (5 * 1000)
                        input.placeholder = 'DD/MM/AAAA'
                        return
                    }
                    comandar(['con2_prazo_vencido_bloquear_horarios'],[{tipo: horario?.descricaoTipoAudiencia, data: input.value}] )
                }
            })
        }
    }
    */
    function con2_prazo_vencidoDesignarAudienciaAcoesConjuntas(bloco) {
        const comandos = []
        const dados = []

        const chkDesignacao = document.querySelector(`[data-grupo="${id(tarefaNome, bloco, 'acoes_conjuntas', 'grupo_designacao')}"][data-marcado="1"]`)
        console.log('%c[Rota PJE]%c chkDesignacao: ' + JSON.stringify(chkDesignacao), LOG.teste, 'color:inherit')
        if (chkDesignacao) {
            const horario = JSON.parse(chkDesignacao.closest('[data-horario]').dataset.horario)
            comandos.push('con2_prazo_vencido_designa_audiencia')
            dados.push({horario: horario})
        }

        if (chkEstaMarcado(id(tarefaNome, bloco, 'acoes_conjuntas', 'despacho', 'checkbox'))) {
            comandos.push('con2_prazo_vencido_despachar')
            dados.push({tipo: 'con2_prazo_vencido_despachar_designacao'})
        }

        if (chkEstaMarcado(id(tarefaNome, bloco, 'acoes_conjuntas', 'certidao', 'checkbox'))) {
            comandos.push('con2_prazo_vencido_certidao')
            dados.push({tipo: 'con2_prazo_vencido_certificar_designacao'})
        }

        if (chkEstaMarcado(id(tarefaNome, bloco, 'acoes_conjuntas', 'gig', 'checkbox'))) {
            comandos.push('con2_prazo_vencido_gig')
            dados.push({tipo: 'con2_prazo_vencido_gig_acompanhamento'})
        }
        console.log('%c[Rota PJE]%c quantos comandos: ' + comandos.length, LOG.teste, 'color:inherit')
        if (comandos.length) comandar(['con2_prazo_vencido_acoes_conjuntas'], [{comandos: comandos, parametros: dados}])
    }
    async function con2_prazo_vencido_salvar_link_da_audiencia() {
        let inputLinkAudiencia = document.getElementById(id(tarefaNome, 'designa_audiencia', 'input_link_da_audiencia'))
        let linkSalvar = inputLinkAudiencia.value
        if (linkSalvar){
            await armazenar({ rota_con2_prazo_vencido_linkDaAudiencia: linkSalvar })
        } else {
            await removerArmazenamento('rota_con2_prazo_vencido_linkDaAudiencia')
        }
    }
    
}




// Auto-executa ao carregar o script
con2_prazo_vencido_assistente_iniciar()
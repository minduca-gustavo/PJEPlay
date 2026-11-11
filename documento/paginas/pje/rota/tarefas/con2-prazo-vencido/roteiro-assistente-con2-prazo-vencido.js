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



async function con2_prazo_vencido_assistente_iniciar() {
    let tarefaNome = 'con2_prazo_vencido'
    
    // ── Filtra pelo parâmetro da URL ──────────────────────────
    const tarefa = new URL(location.href).searchParams.get('rotapje_tarefa')
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
    let dados = await obterArmazenamento(['rota_dadosCon2PrazoVencido'])
    console.log('%c[Rota PJE]%c dados?.rota_dadosCon2PrazoVencido' + JSON.stringify(dados?.rota_dadosCon2PrazoVencido), LOG.rosa, 'color:inherit')
    let bloco = 'inicial'

    criaDiv({ id: idg(tarefaNome, bloco), ancestral: 'rota_corpo' })
    criaTitulo({ id: idg(tarefaNome, bloco, 'titulo'), texto: 'Con2 Prazo Vencido', ancestral: idg(tarefaNome, bloco) })
    criaTextoQueAbrePassandoOMouse({
        id: idg(tarefaNome, bloco, 'instrucao_longa'),
        texto: `Passe o mouse para ver a instrução completa da tarefa.
Clique para fixar/desafixar.`,
        textoBox: `Como utilizar este assistente:
    - Anote no campo abaixo o que precisar. Esta anotação é local, e será perdida ao fechar a janela.
    - O assistente traz informações que podem ser confrontadas com o processo lado a lado. Passe o mouse e clique no box para fixar as informações e fazer a confrontação.
    - Esta tarefa foi pensada para o prazo vencido da CON2, portanto, contempla o prazo vencido de sentença (admissibilidade de RO), e também de contrarrazões (remessa ao TRT).
    - Esta primeira seção traz informações úteis a ambas as tarefas. No bloco de soluções, todas as soluções existentes são mostradas. Passe o mouse para maiores detalhes.
    - No bloco de documentos, ao clicar em cada opção, o assistente buscará o próximo documento daquele tipo (sentença, recurso, procuração, etc.), se houver.
    - As instruções e tarefas referentes à admissibilidade de recursos e remessa ao TRT ficam abaixo, e podem ser recolhidas.
`,
        ancestral: idg(tarefaNome, bloco)
    })
    criaInputAnotacao({ id: idg(tarefaNome, bloco, 'anotacao'), placeholder: 'Utilize este campo para suas anotações. As informações não serão salvas e não aparecerão em lugar algum.', ancestral: idg(tarefaNome, bloco) })

    // ── Bloco: autuacao ───────────────────────────────────────
    bloco = 'solucao'

    criaDiv({ id: idg(tarefaNome, bloco), ancestral: 'rota_corpo' })
    criaTitulo({ id: idg(tarefaNome, bloco, 'titulo'), texto: 'Solução(ões) do Processo', ancestral: idg(tarefaNome, bloco) })
    let i = 0
    
    let solucoes = dados?.rota_dadosCon2PrazoVencido?.solucao || []
    console.log('%c[Rota PJE]%c solucoes.length: ' + JSON.stringify(solucoes.length), LOG.rosa, 'color:inherit')
    if (solucoes.length) {
        criaTabelaDeSolucoes(solucoes)
    } else {
        criaTexto({
            id: idg(tarefaNome, bloco, 'sem_solucao'),
            texto: 'Não foram encontradas sentenças.',
            ancestral: idg(tarefaNome, bloco),
        })
    }

    function criaTabelaDeSolucoes(solucoes){
        let nomeTabela = 'tabelaSolucoes'
        let divTabela = criaDiv({
            id: idg(tarefaNome, bloco, nomeTabela),
            ancestral: idg(tarefaNome, bloco),
            rowColumn: 'column'
        })
        let colunas = solucoes.length == 1 ? 1 : 2
        let linhas = solucoes.length == 1 ? 1: Math.ceil(solucoes.length / 2)
        console.log('%c[Rota PJE]%c linhas: ' + JSON.stringify(linhas), LOG.erro, 'color:inherit')
        for (let i = 0; i < linhas; i++){
            let div = criaDiv({
                id: idg(tarefaNome, bloco, nomeTabela, 'linha' + i),
                ancestral: idg(tarefaNome, bloco, nomeTabela),
                rowColumn: 'row'
            })
        }
        let i = 0
        for (let solucao of solucoes){
            let linha = Math.floor(i / 2)
            let celula = criaDiv({
                id: idg(tarefaNome, bloco, nomeTabela, 'celula' + i),
                ancestral: idg(tarefaNome, bloco, nomeTabela, 'linha' + linha),
            })
            celula.style.width = '100%'
            
            let plaquinha = criaPlaquinhaComTooltip({
                id: idg(tarefaNome, bloco, nomeTabela, 'plaquinha' + i),
                texto: solucao?.movimento.split('-', 2)[0].trim(),
                cor: corDaSolucao(solucao?.movimento),
                tooltip: solucao?.movimento + ' - ' + solucao?.data,
                ancestral: idg(tarefaNome, bloco, nomeTabela, 'celula' + i)
            })
            let pl = document.querySelector('#' + idg(tarefaNome, bloco, nomeTabela, 'plaquinha' + i))
            pl.style.width = '100%'
            pl.style.height = '100%'
            pl.style.textAlign = 'center'
            i++

        }

        function corDaSolucao(solucao) {
            if (normalizar(solucao).includes('improcedentes') || normalizar(solucao).includes('extinto')) return 'vermelho'
            if (normalizar(solucao).includes('em parte'))    return 'amarelo'
            if (normalizar(solucao).includes('procedentes')) return 'verde'
            return ''
        }

    }

    bloco = 'documentos'
    criaDiv({ id: idg(tarefaNome, bloco), ancestral: 'rota_corpo' })
    criaTitulo({ id: idg(tarefaNome, bloco, 'titulo'), texto: 'Documentos do Processo', ancestral: idg(tarefaNome, bloco) })
    
    let documentosTimeline = dados?.rota_dadosCon2PrazoVencido?.timeline || []
    let valores = 'sentenca, recurso, deposito, custas, seguro, fianca, procuracao, substabelecimento'
    criaVisualizadorDeDocumentos({
        id: idg(tarefaNome, bloco, 'visualizador'),
        ancestral: idg(tarefaNome, bloco),
        timeline: documentosTimeline,
        termos: valores,
        abrir: (documento) => comandar(['con2_prazo_vencido_abrir_documentos'],[documento]),
    })

    bloco = 'partes'

    criaDiv({ id: idg(tarefaNome, bloco), ancestral: 'rota_corpo' })
    criaTitulo({ id: idg(tarefaNome, bloco, 'titulo'), texto: 'Partes do Processo', ancestral: idg(tarefaNome, bloco) })
    criaTextoQueAbrePassandoOMouse({
        id: idg(tarefaNome, bloco, 'dados_das_partes'),
        texto: `Passe o mouse para ver os dados das partes.
Clique para fixar/desafixar.`,
        textoBox: `Dados das partes:
${formatarPartes(dados?.rota_dadosCon2PrazoVencido?.partes)}`,
        ancestral: idg(tarefaNome, bloco)
    })

    criaBotaoAzul({
         id: idg(tarefaNome, bloco, 'retificar_partes'),
         texto: 'Retificar autuação',
         ancestral: idg(tarefaNome, bloco),
         acao: () => comandar(['con2_prazo_vencido_retificar'], [{tipo: 'Partes'}])
    })

    bloco = 'recursos'

    criaTitulo({
        id: idg(tarefaNome, bloco, 'titulo'),
        texto: 'Recursos',
        ancestral: 'rota_corpo'
    })
    let recursosPrimeiroGrau = documentosTimeline.filter(d => (normalizar(d?.tipo).includes('recurso') || normalizar(d?.titulo).includes('recurso')) && normalizar(d?.instancia).includes(normalizar('1º Grau'))) || []
    console.log('%c[Rota PJE]%c recursosUm' + JSON.stringify(recursosPrimeiroGrau), LOG.aviso, 'color:inherit', recursosPrimeiroGrau)
    let caixas = []
    for(let i = 0; i < recursosPrimeiroGrau.length; i++){
        let recurso = recursosPrimeiroGrau[i]
        let {id, idUnicoDocumento, data, participacaoProcesso, titulo, idSignatario} = recurso || {}
        let ancestral = idg(tarefaNome, bloco, JSON.stringify(i))
        let coluna = idg(tarefaNome, bloco, JSON.stringify(i), 'coluna')
        criaDiv({
            id: coluna,
            ancestral: 'rota_corpo'
        })
        criaDiv({
            id: ancestral,
            ancestral: coluna,
            rowColumn: 'row'
        })
        let check = await criaCheckBox({
            id: ancestral + '_check',
            ancestral,
        })
        caixas.push(ancestral + '_check')
        check.style.gap = '0px'
        check.dataset.recurso = JSON.stringify({id, idUnicoDocumento, idSignatario, participacaoProcesso})
        clicar('#' + ancestral + '_check')
        check.addEventListener('click', async () => await definirPreparo(ancestral, check, coluna))
        let textoAoLado = criaTexto({
            id: ancestral + '_texto',
            ancestral,
            texto: idUnicoDocumento + ' - ' + new Date(data).toLocaleDateString() + ' - ' + participacaoProcesso.split(',')[0] + ' - ' + titulo
        })
        textoAoLado.style.padding = '0px 0px 0px 0px'
        textoAoLado.style.cursor = 'pointer'
        criaTooltip({
            id: ancestral + '_tip',
            texto: 'Clique para abrir este recurso na janela do processo.',
            elemento: textoAoLado
        })
        //let textoAoLado = document.querySelector('#' + ancestral + ' span')
        textoAoLado.addEventListener('click', () => comandar(['con2_prazo_vencido_abrir_documentos'],[recurso]))
        await definirPreparo(ancestral, check, coluna)
        
        async function definirPreparo(ancestral, check, coluna){
            console.log('%c[Rota PJE]%c check: ' + JSON.stringify(check), LOG.info, 'color:inherit', check)
            if (!document.getElementById(ancestral + '_preparo')) {
                let div = criaDiv({
                    id: ancestral + '_preparo',
                    ancestral: coluna,
                    rowColumn: 'row'
                })
                div.style.marginLeft = '70px'
                div.style.flexWrap = 'wrap'
            }
            let remover = [...document.getElementById(ancestral + '_preparo').childNodes].map( d=> d.remove())
            if (check.dataset.marcado == 0){
                let chkTempestividade = await criaCheckBox({
                    id: ancestral + '_tempestividade',
                    ancestral: ancestral + '_preparo',
                    textoAoLado: 'Intempestivo'
                })
                let chkCustas = await criaCheckBox({
                    id: ancestral + '_custas',
                    ancestral: ancestral + '_preparo',
                    textoAoLado: 'Sem custas'
                })
                let chkDeposito = await criaCheckBox({
                    id: ancestral + '_deposito',
                    ancestral: ancestral + '_preparo',
                    textoAoLado: 'Sem depósito / fiança'
                })
                let chkAlcada = await criaCheckBox({
                    id: ancestral + '_alcada',
                    ancestral: ancestral + '_preparo',
                    textoAoLado: 'Alçada'
                })
                chkTempestividade.addEventListener('click', () => {
                    let recurso = JSON.parse(check.dataset.recurso)
                    recurso.intempestivo = !recurso.intempestivo
                    check.dataset.recurso = JSON.stringify(recurso)
                })
                chkCustas.addEventListener('click', () => {
                    let recurso = JSON.parse(check.dataset.recurso)
                    recurso.custasAusentes = !recurso.custasAusentes
                    check.dataset.recurso = JSON.stringify(recurso)
                })
                chkDeposito.addEventListener('click', () => {
                    let recurso = JSON.parse(check.dataset.recurso)
                    recurso.depositoAusente = !recurso.depositoAusente
                    check.dataset.recurso = JSON.stringify(recurso)
                })
                chkAlcada.addEventListener('click', () => {
                    let recurso = JSON.parse(check.dataset.recurso)
                    recurso.alcada = !recurso.alcada
                    check.dataset.recurso = JSON.stringify(recurso)
                })
                
            } else {
                let dados = JSON.parse(check.dataset.recurso)
                if (normalizar(dados?.participacaoProcesso).includes('reu')){
                    let chkRecolhidas = await criaCheckBox({
                        id: ancestral + '_recolhidas',
                        ancestral: ancestral + '_preparo',
                        textoAoLado: 'Custas e depósito OK'
                    })
                    clicar('#' + ancestral + '_recolhidas')
                    let chkDispensadas = await criaCheckBox({
                        id: ancestral + '_dispensadas',
                        ancestral: ancestral + '_preparo',
                        textoAoLado: 'Dispensados'
                    })
                    chkRecolhidas.addEventListener('click', () => {
                        let recurso = JSON.parse(check.dataset.recurso)
                        recurso.preparo = 'recolhidas'
                        check.dataset.recurso = JSON.stringify(recurso)
                        alternaCheckBox(chkRecolhidas.id, chkRecolhidas, chkDispensadas)
                    })
                    chkDispensadas.addEventListener('click', () => {
                        let recurso = JSON.parse(check.dataset.recurso)
                        recurso.preparo = 'dispensadas'
                        check.dataset.recurso = JSON.stringify(recurso)
                        alternaCheckBox(chkDispensadas.id, chkRecolhidas, chkDispensadas)
                    })
                    
                }
            }
        }

        let anexos = recurso?.anexos?.length ? recurso?.anexos : []
        if (anexos.length){
            let div = criaDiv({
                id: ancestral + '_anexos',
                ancestral: coluna,
            })
        }
        for (let anexo of anexos){
            let {idUnicoDocumento, data, participacaoProcesso, titulo} = anexo || {}
            let texto = criaTexto({
                id: ancestral + '_anexos_texto',
                ancestral: ancestral + '_anexos',
                texto: 'Anexo - ' + idUnicoDocumento + ' - ' + new Date(data).toLocaleDateString() + ' - ' + participacaoProcesso.split(',')[0] + ' - ' + titulo
            })
            texto.style.padding = '0px 0px 0px 0px'
            texto.style.marginLeft = '35px'
            texto.style.cursor = 'pointer'
            texto.addEventListener('click', () => comandar(['con2_prazo_vencido_abrir_documentos'],[anexo]))
            criaTooltip({
                id: ancestral + '_tip',
                texto: 'Clique para abrir este anexo na janela do processo.',
                elemento: texto
            })
        }
        
        console.log('%c[Rota PJE]%c textoAoLado', LOG.aviso, 'color:inherit', textoAoLado)
    }
    let botaoProcessar = criaBotaoLaranja({
        id: idg(tarefaNome, 'processarRecursos'),
        texto: 'Processar Recursos Selecionados',
        ancestral: 'rota_corpo',
        acao: () => processarRecursosSelecionados(caixas)
    })
    criaTooltip({
        id: idg(tarefaNome, 'processar_tip'),
        texto: 'Somente os recursos selecionados serão processados. Aos demais será denegado seguimento.',
        elemento: botaoProcessar
    })

    async function processarRecursosSelecionados(caixas) {
        let recursos = []
        for (caixa of caixas){
            let elemento = document.getElementById(caixa)
            let marcado = elemento.dataset.marcado == 1 ? true : false
            let dataset = JSON.parse(elemento.dataset.recurso)
            //console.log('%c[Rota PJE]%c dataset: ' + JSON.stringify(...dataset), LOG.info, 'color:inherit')
            let {idSignatario, idUnicoDocumento} = dataset
            recursos.push({marcado, ...dataset})
        }
        comandar(['con2_prazo_vencido_processar_recursos'], [recursos])
        
    }
    
    return
    // ___________________________________________________
    //  SECAO POS SENTENCA
    // ___________________________________________________    
    let secoes = [
        {
            titulo: 'Pós Sentença',
            label: 'posSentenca',
            instrucaoLonga: {
                label: 'instrucaoLonga',
                texto: `Passe o mouse para ver a instrução completa da tarefa.
Clique para fixar/desafixar.`,
                textoBox: `Nesta tarefa, você deve:
1) verificar se houve o trânsito em julgado da sentença (se as partes não entraram com Recurso Ordinário ou Embargos de Declaração no prazo);
    1.a) Se houve o trânsito e for improcedente, verificar se há pendências como honorários advocatícios e periciais para execução, suspensão ou requisição, pagamento de custas, multa, despesas processuais, ofícios para expedir, etc. Se o caso, providenciar o necessário antes do arquivamento.
    1.b) Se houve o trânsito, e for caso de liquidar a sentença, fazer o registro do trânsito em julgado, iniciar a liquidação, inserir o CHIP "Cálculo - Aguardar Secretaria" e encaminhar para a LIQ 1.
    1.c) Se houve o trânsito, e for caso de sentença líquida, fazer o registro do trânsito em julgado, lançar obrigação de fazer, iniciar a execução (ou liquidação), inserir o CHIP "Sentença - partes cientes" e encaminhar encaminhar para a LIQ 2.
    1.d) Se as partes recorreram, ou embargaram, prossiga para a análise dos recursos (2).
2) Verifique a admissibilidade do Recurso Ordinário (RO) interposto, seguindo as instruções abaixo:

Tempestividade:
    - O recurso foi interposto no prazo de 8 dias úteis a partir da intimação da decisão/sentença?
    - Sendo ente público (+ Correios): prazo de 16 dias úteis a partir da intimação.
    - Houve prorrogação de prazo (feriados, recesso forense, indisponibilidade do PJe)?

Regularidade de representação:
    - O recurso foi subscrito por advogado com procuração válida nos autos?
    - A procuração é específica para o processo em questão ou é procuração geral?

Preparo:
    - Custas: foram recolhidas na guia correta (GRU), no valor correto (geralmente 2% do valor da condenação ou da causa)?
    - Depósito recursal: foi realizado e comprovado nos autos? O valor corresponde ao teto do TST vigente na data do recurso (R$ 13.813,83 a partir de 01.08.2025)?
    - Se seguro garantia: verificar na apólice o número do processo, as partes e se o valor corresponde a 30% a mais do que o depósito recursal (salvo se a condenação for menor que o valor do depósito). Verificar também se há registro da apólice na Susep e certidão de regularidade/licenciamento da seguradora.
    - O recorrente está dispensado do preparo (justiça gratuita, entidade filantrópica, empresa de pequeno porte etc.), com a devida justificativa no despacho? Verificar modelo no PJe.

Recorribilidade:
    - O recurso é cabível para a decisão atacada (sentença definitiva, terminativa ou decisão de competência originária do TRT)?
    - A decisão é recorrível de imediato ou trata-se de decisão interlocutória?

Também verifique:
    - O tipo de petição: observe sempre o que está escrito na frente, não o que está entre parênteses (ex.: Recurso Adesivo(Recurso Adesivo)).
    - Se o processo é de alçada: causas de até dois salários mínimos na data do ajuizamento seguem o rito sumário, com decisões em regra irrecorríveis, exceto matéria constitucional. Exemplo de despacho: "Denego seguimento ao recurso interposto pelo autor, em face da irrecorribilidade da sentença em causa de alçada exclusiva de Vara do Trabalho, nos termos dos §§ 3º e 4º do art. 2º da Lei 5.584/1970".
    - Se há mais de um recurso da mesma parte: verifique se são idênticos; sendo o caso, conste no despacho: "Tratando-se de recursos idênticos, altere-se a petição sob id xxx para constar: 'manifestação'".
    - Se a parte interpôs RO e, após decisão de Embargos de Declaração, interpôs outro RO: lance no PJe os dois ROs para dar baixa no sistema, pois o Tribunal analisará ambos.
    - Quem efetivamente interpôs o recurso: passe o cursor no "bonequinho" ao lado da petição (lado esquerdo do PJe) para lançar corretamente. Havendo mais de um recurso, lance cada um deles.
    - Há pedido de efeito suspensivo? Será possível deferir?
    - Condenação solidária: o depósito recursal feito por uma das empresas aproveita as demais (Súmula 128, III, do TST), exceto se a empresa depositante pedir sua exclusão da lide — nesse caso, as demais deverão realizar depósito próprio.

Após a conferência de todos os itens, utilize os botões para tomar as providências necessárias (juízo de admissibilidade positivo ou negativo, determinação de emenda, intimação para regularização de preparo/representação etc.).`,
            },
            elementos:[
                {
                    funcao: '',
                    id: '',
                    parametro: '',
                }
            ],
            casos: [
                {
                    id: 'improcedencia',
                    texto: 'Improcedente'
                },
                {
                    id: 'liquidar',
                    texto: 'A liquidar'
                },
                {
                    id: 'sentencaLiquida',
                    texto: 'Sentença Líquida'
                },
                {
                    id: 'recurso',
                    texto: 'Recurso'
                },
                {
                    id: 'embargos',
                    texto: 'Embargos Declaratórios'
                },
            ],
        },
        {
            titulo: 'Remessa ao TRT',
            label: 'remessa',
            instrucaoLonga: {
                texto: `Passe o mouse para ver a instrução completa da tarefa.
Clique para fixar/desafixar.`,
                textoBox: '',
            },
            casos: [
                
            ],
            elementos:[

            ]
        }
    ]
    
    
    let divSecoes = criaDiv({
        id: idg(tarefaNome, 'divSecoes'),
        ancestral: 'rota_corpo',
        rowColumn: 'column'
    })
    for (let secao of secoes){
        let mostraRecolhe = await criaSecaoMostraRecolhe({
            id: idg(tarefaNome, secao?.label, 'mostra_recolhe'),
            idSempreAMostra: idg(tarefaNome, secao?.label, 'mostra'),
            idRecolhe: idg(tarefaNome, secao?.label, 'recolhe'),
            ancestral: idg(tarefaNome, 'divSecoes'),
            armazenarExpandido: true
        })
        let titulo = criaTitulo({
            id: idg(tarefaNome, secao?.label, 'titulo'),
            texto: secao?.titulo,
            ancestral: idg(tarefaNome, secao?.label, 'mostra')
        })
        let instrucaoLonga = criaTextoQueAbrePassandoOMouse({
            id: idg(tarefaNome, secao?.label, secao?.instrucaoLonga?.label),
            texto: secao?.instrucaoLonga?.texto,
            ancestral: idg(tarefaNome, secao?.label, 'recolhe'),
            textoBox: secao?.instrucaoLonga?.textoBox
        })
        
        for (let caso of secao?.casos){
            let ancestral = idg(tarefaNome, secao?.label, 'recolhe')
            let checkBox = await criaCheckBox({
                id: idg(tarefaNome, secao?.label, 'checkbox', caso?.id),
                textoAoLado: caso?.texto,
                ancestral: ancestral,
            })
            checkBox.dataset.caso = caso?.id
            checkBox.addEventListener('click', () => con2_prazo_vencidoCriaAcoes(checkBox, ancestral))
        }

        async function con2_prazo_vencidoCriaAcoes(seletor, ancestral){
            let idTodos = seletor?.id.replace(seletor?.dataset?.caso,'')
            let botoes = [...document.querySelectorAll('[id^="' + idTodos + '"]')]
            for (let botao of botoes){
                if (botao?.id.includes('caixa')) continue
                if (botao !== seletor && botao?.dataset?.marcado == 1 && seletor.dataset.marcado == 1){
                    clicar(botao)
                }
                
            }
            await montarAcoes_con2_prazo_vencido(seletor?.dataset?.caso, ancestral)
        }

        async function montarAcoes_con2_prazo_vencido(caso, ancestral) {
            console.log('%c[Rota PJE]%c montaracoes: ' + JSON.stringify(caso + ' - ' + ancestral), LOG.teste, 'color:inherit')
            let idDiv = idg('divAcoes', ancestral)
            let remover = document.getElementById(idDiv)
            if (remover) {
                remover.remove()
                return
            }
            let div = criaDiv({
                id: idDiv,
                ancestral: ancestral
            })
            let idDivEmail = idg('divEmail', ancestral)
            let divEmail = criaDiv({
                id: idDivEmail,
                ancestral: idDiv
            })
            let idBotaoLaranjaEmail = idg('e-mail')
            let armazenamentoBotaoLaranjaEmail = await obterArmazenamento(idBotaoLaranjaEmail)
            let expandido = armazenamentoBotaoLaranjaEmail[idBotaoLaranjaEmail] ? armazenamentoBotaoLaranjaEmail[idBotaoLaranjaEmail] : false
            console.log('%c[Rota PJE]%c expandido: ' + JSON.stringify(expandido), LOG.erro, 'color:inherit')
            let textoSeta = expandido ? '▲' : '▼'
            let botaoEMail = criaBotaoLaranja({
                id: idBotaoLaranjaEmail,
                texto: 'Encaminhar documento atual por e-mail. '+ textoSeta,
                ancestral: idDivEmail,
                acao: () => montarMenuEmail(idDivEmail, idBotaoLaranjaEmail, true),
            })
            if (expandido) montarMenuEmail(idDivEmail, idBotaoLaranjaEmail, false)
            let idDivRequisicao = idg('divRequisicao', ancestral, caso)
            let divRequisicao = criaDiv({
                id: idDivRequisicao,
                ancestral: idDiv
            })
            let botaoRequisicao = criaBotaoLaranja({
                id: idg(caso, 'requisicaoHonorarios'),
                texto: 'Fazer Requisição de Honorários Periciais ▼',
                ancestral: idDivRequisicao,
                acao: () => montarMenuRequisicao(caso, idDivRequisicao),
            })
        }

        async function montarMenuEmail(ancestral, botao, expandir){
            
            let idDiv = idg('menuEMail')
            let remover = document.getElementById(idDiv)
            let botaoSeta = document.getElementById(botao)
            if (remover && expandir) {
                botaoSeta.textContent = 'Encaminhar documento atual por e-mail. ▼'
                let armazenaExpandido = false
                await armazenar({[botao]: armazenaExpandido})
                remover.remove()
                return
            }
            let armazenaExpandido = true
            await armazenar({[botao]: armazenaExpandido})
            botaoSeta.textContent = 'Encaminhar documento atual por e-mail. ▲'
            let div = criaDiv({
                id: idDiv,
                ancestral: ancestral
            })
            let emailsArmazenados = await obterArmazenamento(idDiv)
            if (emailsArmazenados[idDiv]){
                console.log('%c[Rota PJE]%c emailsArmazenados: ' + JSON.stringify(emailsArmazenados), LOG.erro, 'color:inherit')
                for (let email of emailsArmazenados[idDiv]){
                    let idCheckbox = idg('checkEMail')
                    let checkBox = await criaCheckBox({
                        id: idCheckbox,
                        ancestral: idDiv,
                        textoAoLado: email
                    })
                }
            }
            let inputId = idg('inputEMail')
            let inputEMail = criaInput({
                id: idg('inputEMail'),
                ancestral: idDiv,
                textoEmCima: 'Digite os e-mails, separados por vírgula',
                placeholder: 'email@email.com, email2@email.org, email3@email.jus.br'
            })
            let botaoEMail = criaBotaoAzul({
                id: idg('botaoEMail'),
                ancestral: idDiv,
                texto: 'Encaminhar para todos (inclusive os selecionados)',
                acao: () => {
                    let checkId = idg('checkEMail')
                    let checks = [...document.querySelectorAll('#' + checkId)].map(d => d.textContent)
                    let input = document.querySelector('#' + inputId)
                    let regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/g
                    let emailsInput = input.textContent.match(regexEmail) || ''
                    let emails = []
                    emails.push(emailsInput, ...checks)
                    armazenar ({[idDiv]: emails})
//                    comandar(
//                        ['email'], 
//                        {
//                            endereco: checks,
//                            texto: `Prezados,
//
//Encaminho, em anexo, os documentos referentes ao processo ${dados.rota_dadosCon2PrazoVencido.processo.numero}, para ciência/providências.
//
//At.te`
//
//                        }
//                    )
                }
            })
            
        }
        async function montarMenuRequisicao(caso, ancestral){
            let idDiv = idg(caso, 'menuEMail')
            let div = criaDiv({
                id: idDiv,
                ancestral: ancestral
            })
            let emailsArmazenados = await obterArmazenamento(idDiv)
            if (emailsArmazenados[idDiv]){
                console.log('%c[Rota PJE]%c emailsArmazenados: ' + JSON.stringify(emailsArmazenados), LOG.erro, 'color:inherit')
            }
        }

        let funcao = secao?.elementos?.funcao
        
    }
    
    return

    
    
    let armazenarSecaoPosSentenca = (idg(tarefaNome, bloco, 'mostra_recolhe'))
    let estadoSalvoPosSentenca = await obterArmazenamento(idg(tarefaNome, bloco, 'mostra_recolhe'))
    if (estadoSalvoPosSentenca?.[armazenarSecaoPosSentenca] === false) {
        SecaoPosSentenca.recolher()
    }
    
    SecaoPosSentenca.aoAlternar = async (expandido) => {
        await armazenar({ [armazenarSecaoPosSentenca]: expandido })
    }

    criaTitulo({
        id: idg(tarefaNome, bloco, 'mostra_recolhe', 'titulo'),
        texto: 'Pós Sentença',
        ancestral: idg(tarefaNome, bloco, 'mostra_recolhe', 'mostra')
    })

    criaTexto({
        id: idg(tarefaNome, bloco, 'mostra_recolhe', 'mostra', 'texto'),
        texto: 'Em desenvolvimento.',
        ancestral: idg(tarefaNome, bloco, 'mostra_recolhe', 'recolhe')
    })

    
    // ___________________________________________________
    //  SECAO REMESSA
    // ___________________________________________________    
    bloco = 'remessa'
    
    
    let SecaoRemessa = await criaSecaoMostraRecolhe({
        id: idg(tarefaNome, bloco, 'mostra_recolhe'),
        idSempreAMostra: idg(tarefaNome, bloco, 'mostra_recolhe', 'mostra'),
        idRecolhe: idg(tarefaNome, bloco, 'mostra_recolhe', 'recolhe'),
        ancestral: 'rota_corpo',
    })

    let armazenarSecaoRemessa = (idg(tarefaNome, bloco, 'mostra_recolhe'))
    let estadoSalvoRemessa = await obterArmazenamento(idg(tarefaNome, bloco, 'mostra_recolhe'))
    if (estadoSalvoRemessa?.[armazenarSecaoRemessa] === false) {
        SecaoRemessa.recolher()
    }
    
    SecaoRemessa.aoAlternar = async (expandido) => {
        await armazenar({ [armazenarSecaoRemessa]: expandido })
    }

    criaTitulo({
        id: idg(tarefaNome, bloco, 'mostra_recolhe', 'titulo'),
        texto: 'Remessa ao TRT.',
        ancestral: idg(tarefaNome, bloco, 'mostra_recolhe', 'mostra')
    })

    criaTexto({
        id: idg(tarefaNome, bloco, 'mostra_recolhe', 'mostra', 'texto'),
        texto: 'Em desenvolvimento.',
        ancestral: idg(tarefaNome, bloco, 'mostra_recolhe', 'recolhe')
    })
    
    return
    
    console.log('%c[Rota PJE]%c documentosTimeline: ' + JSON.stringify(documentosTimeline), LOG.rosa, 'color:inherit')
    let ordem = 0
    let textoOrdem = ordem == 0  ? 'do mais antigo para o mais novo' : 'do mais novo para o mais antigo'
    let botaoOrdem = criaBotaoLaranja({
        id: idg(tarefaNome, bloco, 'botao_ordem_documentos'),
        texto: 'Ordem: ' + textoOrdem,
        ancestral: idg(tarefaNome, bloco),
        acao: () => ordenaDocumentos()
    })
    
    let contadoresDocumentos = {}

    if (documentosTimeline.length){
        criaTabelaDeDocumentos(documentosTimeline)
    }
    
    function ordenaDocumentos(){
        
        let botaoOrdem = document.getElementById(idg(tarefaNome, bloco, 'botao_ordem_documentos'))
        ordem = ordem == 0 ? 1 : 0
        botaoOrdem.textContent = ordem == 0  ? 'Ordem: do mais antigo para o mais novo' : 'Ordem: do mais novo para o mais antigo'
        console.log('%c[Rota PJE]%c ordena: ' + JSON.stringify(ordem), LOG.rosa, 'color:inherit')
    }

    function criaTabelaDeDocumentos(documentos){
        console.log('%c[Rota PJE]%c documentos 165: ' + JSON.stringify(documentos), LOG.rosa, 'color:inherit')
        let documentosCriar =   {}
        let elementos =         0
        for(let c of tiposDocumentos){
            documentosCriar[c.chave] = encontrarTipoNaTimeline(c, documentos)
            if (documentosCriar[c.chave].length) elementos++
        }
        let colunas =           elementos > 3 ? 3 : elementos
        let idDasColunas =      []
        for(let i = 1; i <= colunas; i){
            idDasColunas.push(idg(tarefaNome, bloco, 'tabela', 'coluna', i++))
        }
        let idTabela = idg(tarefaNome, bloco, 'tabela')
        criaTabela({
            id:             idTabela,
            idDasColunas:   idDasColunas,
            semDivisao:     true,
            ancestral:      idg(tarefaNome, bloco)
        })
        // to parado aqui
        let contadorTipo = 0
        let linha = {}
        for (let [tipo, doc] of Object.entries(documentosCriar)) {
            
            if (!doc.length) continue

            let label = tiposDocumentos.find(t => t.chave === tipo || (t.opcoes && t.opcoes.includes(tipo)))
            if (!label) continue

            // Estado do contador para este tipo
            let chaveContador = idg(tarefaNome, bloco, tipo)
            contadoresDocumentos[chaveContador] = { atual: 0, total: doc.length }

            let idBotao = idg(tarefaNome, bloco, 'botao', tipo)
            let textoBotao = label.label + ' 0/' + doc.length
            let idColuna = idDasColunas[contadorTipo]       // ← chave que ui_adicionarLinhaTabela entende
            linha[idColuna] = criaBotaoAzul({
                id: idBotao,
                texto: textoBotao,
                acao: async () => {
                    let {tipoContador, contador} = avancarContadorDocumento(tarefaNome, bloco, tipo, ordem)
                    console.log('%c[Rota PJE]%c tipo: ' + JSON.stringify(tipoContador), LOG.rosa, 'color:inherit')
                    console.log('%c[Rota PJE]%c contador: ' + JSON.stringify(contador), LOG.rosa, 'color:inherit')
                    await comandar(['con2_prazo_vencido_abrir_documentos'],[documentosCriar[tipoContador][contador]])
                }
            })
            contadorTipo++
            if (contadorTipo % colunas == 0) {
                ui_adicionarLinhaTabela(idTabela, linha)
                linha = {}
                contadorTipo = 0                            // ← reseta pra próxima linha
            }
        
            //console.log('%c[Rota PJE]%c textoBotao: ' + JSON.stringify(textoBotao), LOG.rosa, 'color:inherit')
            //linha[tipo] = criaBotaoAzul({
            //    id: idBotao,
            //    texto: textoBotao,
            //    acao: () => avancarContadorDocumento(tarefaNome, bloco, tipo, ordem)
            //})
            //contadorTipo++
            //if (contadorTipo % colunas == 0){
            //    ui_adicionarLinhaTabela(idTabela, linha)
            //    linha = {}
            //}
            
            
            // (aqui você cria o botão com idBotao e textoBotao)
            // ui_adicionarLinhaTabela(...) ou o que você usa pra inserir na tabela

        }
        if (Object.keys(linha).length) {
            ui_adicionarLinhaTabela(idTabela, linha)
        }
        console.log('%c[Rota PJE]%c documentosCriar 187: ' + JSON.stringify(documentosCriar), LOG.rosa, 'color:inherit')
        
        return
        for (let i = 0; i < elementos; i++) {
            
            let esq =           solucoes[i].split('-', 2)[0].trim()
            let toolTipEsq =      solucoes[i]
            let dir = ''
            let toolTipDir = ''
            if (solucoes.length > 1) {
                 dir = solucoes[i + 1].split('-', 2)[0].trim()   // pode ser undefined na última linha se quantidade for ímpar
                toolTipDir = solucoes[i + 1]
            }
            
            let valores = {
                [idEsq]: criaPlaquinhaComTooltip({ id: idg(tarefaNome, bloco, 'solucao', i), texto: esq, tooltip: toolTipEsq, cor: corDaSolucao(esq) }),
            }
            if (dir !== undefined) {
                valores[idDir] = criaPlaquinhaComTooltip({ id: idg(tarefaNome, bloco, 'solucao', i + 1), texto: dir, tooltip: toolTipDir, cor: corDaSolucao(dir) })
            }

            ui_adicionarLinhaTabela(idTabela, valores)
        }
        function encontrarTipoNaTimeline(tipo, ondeBuscar) {
            const termos = tipo.opcoes ?? [tipo.chave]

            const bate = (titulo, tipoDoc) =>
                termos.some(termo => 
                    normalizar(titulo).toLowerCase().includes(termo) ||
                    normalizar(tipoDoc).toLowerCase().includes(termo)
                )

            const resultado = []

            for (const documento of ondeBuscar) {
                if (bate(documento?.titulo, documento?.tipo)) {
                    resultado.push(documento)
                }
                for (const anexo of documento?.anexos ?? []) {
                    if (bate(anexo?.titulo, anexo?.tipo)) {
                        resultado.push(anexo)
                    }
                }
            }

            return resultado
        }
    }

    function avancarContadorDocumento(tarefaNome, bloco, tipo, ordem) {
        let chaveContador = idg(tarefaNome, bloco, tipo)
        let contador = contadoresDocumentos[chaveContador]
        console.log('%c[Rota PJE]%c ordem: ' + JSON.stringify(ordem), LOG.rosa, 'color:inherit')
        if (!contador) return
        if (ordem == 0){ 
            contador.atual = (contador.atual + 1) % (contador.total + 1)
        } else {
            contador.atual = (contador.atual - 1 + contador.total + 1) % (contador.total + 1)
        }
        
        let idBotao = idg(tarefaNome, bloco, 'botao', tipo)
        let botao = document.getElementById(idBotao)
        if (!botao) return

        let label = tiposDocumentos.find(t => t.chave === tipo || (t.opcoes && t.opcoes.includes(tipo)))
        botao.textContent = label.label + ' ' + contador.atual + '/' + contador.total
        console.log('%c[Rota PJE]%c tipo: ' + JSON.stringify(tipo), LOG.rosa, 'color:inherit')
        console.log('%c[Rota PJE]%c contador.atual: ' + JSON.stringify(contador.atual), LOG.rosa, 'color:inherit')
        return {tipoContador: tipo, contador: contador.atual}
    }



    return


















    

    criaTextoQueAbrePassandoOMouse({
        id: idg(tarefaNome, bloco, 'dados_das_partes'),
        texto: `Passe o mouse para ver os dados das partes.
Clique para fixar/desafixar.`,
        textoBox: `Dados das partes:
${formatarPartes(dados?.rota_dadosCon2PrazoVencido?.partes)}`,
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
    criaBotaoAzul({ id: idg(tarefaNome, bloco, 'retificar_partes'),   texto: 'Retificar autuação: partes',   ancestral: idg(tarefaNome, bloco), acao: () => comandar(['con2_prazo_vencido_retificar'], [{tipo: 'Partes'}])})
    criaBotaoAzul({ id: idg(tarefaNome, bloco, 'retificar_rito'),     texto: 'Retificar autuação: rito',     ancestral: idg(tarefaNome, bloco), acao: () => comandar(['con2_prazo_vencido_retificar'], [{tipo: 'Dados Iniciais'}])})
    criaBotaoAzul({ id: idg(tarefaNome, bloco, 'retificar_assuntos'), texto: 'Retificar autuação: assuntos', ancestral: idg(tarefaNome, bloco), acao: () => comandar(['con2_prazo_vencido_retificar'], [{tipo: 'Assuntos'}])})
    criaBotaoLaranja({
        id: idg(tarefaNome, bloco, 'despacho_emenda_retificacao'), 
        texto: 'Despacho: retificar autuação/emendar a inicial', 
        ancestral: idg(tarefaNome, bloco), 
        acao: async () => {
            await removerArmazenamento('rota_acoes_conjuntas_con2_prazo_vencido_em_andamento')
            comandar(['con2_prazo_vencido_despachar'], [{tipo: 'con2_prazo_vencido_emendar'}])
        }
    })

    // ── Bloco: designa-audiencia ──────────────────────────────
    bloco = 'designa_audiencia'

    criaDiv({ id: idg(tarefaNome, bloco), ancestral: 'rota_corpo' })
    criaTitulo({ id: idg(tarefaNome, bloco, 'titulo'), texto: 'Designação de audiência', ancestral: idg(tarefaNome, bloco) })
    console.log('%c[Rota PJE]%c Juiz: ' + dados?.rota_dadosCon2PrazoVencido?.juizSimetriaPeloGig, LOG.teste, 'color:inherit')
    console.log('%c[Rota PJE]%c dados: ' + JSON.stringify(dados?.rota_dadosCon2PrazoVencido?.sala), LOG.teste, 'color:inherit')
    console.log('%c[Rota PJE]%c dados: ' + JSON.stringify(dados?.rota_dadosCon2PrazoVencido?.horariosVagos), LOG.teste, 'color:inherit')

    criaTexto({
        id: idg(tarefaNome, bloco, 'texto'),
        texto: dados?.rota_dadosCon2PrazoVencido?.juizSimetriaPeloGig
            ? `A extensão identificou a seguinte sala: ${dados.rota_dadosCon2PrazoVencido.processo.sala.nome}.`
            : 'Não foi identificada sala.',
        ancestral: idg(tarefaNome, bloco)
    })

    if (!dados?.rota_dadosCon2PrazoVencido?.horariosVagos?.length) {

        if (dados?.rota_dadosCon2PrazoVencido?.sala?.nome) {
            criaTexto({
                id: idg(tarefaNome, bloco, 'sem_horario'),
                texto: `Não foram encontrados horários vagos para esta sala. Clique no botão abaixo para designar manualmente a audiência.`,
                ancestral: idg(tarefaNome, bloco)
            })
        }
        criaBotaoAzul({
            id: idg(tarefaNome, bloco, 'btn_manual'),
            texto: 'Designar manualmente a audiência',
            ancestral: idg(tarefaNome, bloco),
            acao: async () => {
                await removerArmazenamento('rota_acoes_conjuntas_con2_prazo_vencido_em_andamento')
                comandar(['con2_prazo_vencido_designa_audiencia'], [{dados: 'manual'}])
            }
        })

    }
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
        acao: () => con2_prazo_vencido_salvar_link_da_audiencia()
    })
    let linkSalvo = await obterArmazenamento(['rota_con2_prazo_vencido_linkDaAudiencia'])
    let link = linkSalvo?.rota_con2_prazo_vencido_linkDaAudiencia || ''
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
        acaoBotaoExecutar: () => /*alert('Em desenvolvimento'), */con2_prazo_vencidoDesignarAudienciaAcoesConjuntas('designa_audiencia'),
        ancestral: idg(tarefaNome, bloco)
    })
    

    criaTextoQueAbrePassandoOMouse({
        id: idg(tarefaNome, bloco, 'acoes_conjuntas', 'instrucao'),
        texto: 'Como usar este bloco? Passe o mouse. Clique para fixar/desafixar.',
        textoBox: 'Se você deseja fazer apenas uma das ações, clique no botão azul ou laranja correspondente. Você pode, também, selecionar os checkbox que deseja, e as ações serão executadas uma após a outra ao clicar no botão laranja Executar ao lado.',
        ancestral: idg(tarefaNome, bloco, 'acoes_conjuntas', 'coluna')
    })

    if (dados?.rota_dadosCon2PrazoVencido?.horariosVagos?.length) {
        
     

        let checkBoxPreMarcadoTipoAudiencia = false
        let i = 0
        //let inputPulando = criaInput({
        //    id: idg(tarefaNome, bloco, 'acoes_conjuntas', 'horario', i, 'input'), 
        //    textoEmCima: 'Caso queira utilizar datas posteriores às datas dos botões abaixo, insira a data inicial desejada abaixo, utilize a opção de designação manual, e clique no botão "Próximo horário vago" (seta preta) correspondente.', 
        //    ancestral: idg(tarefaNome, bloco, 'acoes_conjuntas', 'coluna'),
        //    placeholder: 'DD/MM/AAAA'
        //})
        //let dataPula = await obterArmazenamento('con2_prazo_vencido_pula_data')
        //console.log('%c[Rota PJE]%c dataPula: ' + JSON.stringify(dataPula), LOG.rosa, 'color:inherit')
        //if (dataPula?.con2_prazo_vencido_pula_data){
        //    inputPulando.value = dataPula?.con2_prazo_vencido_pula_data
        //}
        for (let i; i < dados?.rota_dadosCon2PrazoVencido?.horariosVagos?.length; i++) {
            let horario = dados?.rota_dadosCon2PrazoVencido?.horariosVagos?.[i]
            let horarioInicial = new Date(horario.horarioInicial)
            let horarioInicialBotao = `${horario.descricaoTipoAudiencia} - ${horarioInicial.toLocaleDateString('pt-BR')} às ${horarioInicial.getHours()}h${String(horarioInicial.getMinutes()).padStart(2, '0')}`
            let processo = dados?.rota_dadosCon2PrazoVencido?.processo?.numero
            let sala = dados?.rota_dadosCon2PrazoVencido?.sala?.nome
            horario.processo = processo
            horario.nomeDaSala = sala
            let linha = criaBotaoAzulComCheckBox({
                id: idg(tarefaNome, bloco, 'acoes_conjuntas', 'horario' + i),
                idCheckbox: idg(tarefaNome, bloco, 'acoes_conjuntas', 'horario' + i, 'checkbox'),
                texto: horarioInicialBotao,
                ancestral: idg(tarefaNome, bloco, 'acoes_conjuntas', 'coluna'),
                acao: async () => {
                    await removerArmazenamento('rota_acoes_conjuntas_con2_prazo_vencido_em_andamento')
                    comandar(['con2_prazo_vencido_designa_audiencia'], [{horario}])
                },
                grupo: idg(tarefaNome, bloco, 'acoes_conjuntas', 'grupo_designacao')
            })
            linha.dataset.horario = JSON.stringify(horario)
            if (horario.descricaoTipoAudiencia.includes('Inicial') && !checkBoxPreMarcadoTipoAudiencia) {
                let checkBox = document.getElementById(idg(tarefaNome, bloco, 'acoes_conjuntas', 'horario' + i, 'checkbox'))
                if (checkBox) checkBox.click()
                checkBoxPreMarcadoTipoAudiencia = true
            }
        }
        let linhaManual = criaBotaoAzulComCheckBox({
            id: idg(tarefaNome, bloco, 'acoes_conjuntas', 'horario' + i),
            idCheckbox: idg(tarefaNome, bloco, 'acoes_conjuntas', 'horario' + i, 'checkbox'),
            texto: 'Designar audiência manualmente em outra sala/horário',
            ancestral: idg(tarefaNome, bloco, 'acoes_conjuntas', 'coluna'),
            acao: async () => {
                await removerArmazenamento('rota_acoes_conjuntas_con2_prazo_vencido_em_andamento')
                comandar(['con2_prazo_vencido_designa_audiencia'], [{horario: {tipo: 'manual', processo: dados?.rota_dadosCon2PrazoVencido?.processo?.numero, sala: dados?.rota_dadosCon2PrazoVencido?.sala?.nome, link: inputLinkAudiencia.value}}])
            },
            grupo: idg(tarefaNome, bloco, 'acoes_conjuntas', 'grupo_designacao')
        })
        linhaManual.dataset.horario = JSON.stringify({tipo: 'manual', processo: dados?.rota_dadosCon2PrazoVencido?.processo?.numero, sala: dados?.rota_dadosCon2PrazoVencido?.sala?.nome, link: inputLinkAudiencia.value})
        
        //i++
        //let inputPulando = criaInput({
        //    id: idg(tarefaNome, bloco, 'acoes_conjuntas', 'horario', i, 'input'), 
        //    textoEmCima: 'Insira a data limite para bloqueio das audiências (serão bloqueadas todas as audiências até a data escolhida).', 
        //    ancestral: idg(tarefaNome, bloco, 'extras-recolhe'),
        //    placeholder: 'DD/MM/AAAA'
        //})
        //await armazenar({con2_prazo_vencido_pula_data: '22/06/2026'})
        
        //let linhaPulando = criaBotaoAzulComCheckBox({
        //    id: idg(tarefaNome, bloco, 'acoes_conjuntas', 'horario' + i),
        //    idCheckbox: idg(tarefaNome, bloco, 'acoes_conjuntas', 'horario' + i, 'checkbox'),
        //    texto: 'Designar audiência pulando horário',
        //    ancestral: idg(tarefaNome, bloco, 'acoes_conjuntas', 'coluna'),
        //    acao: async () => {
        //        await removerArmazenamento('rota_acoes_conjuntas_con2_prazo_vencido_em_andamento')
        //        comandar(['con2_prazo_vencido_designa_audiencia'], [{horario: {tipo: 'pulando', processo: dados?.rota_dadosCon2PrazoVencido?.processo?.numero, sala: dados?.rota_dadosCon2PrazoVencido?.sala?.nome}}])
        //    },
        //    grupo: idg(tarefaNome, bloco, 'acoes_conjuntas', 'grupo_designacao')
        //})
        //linhaPulando.dataset.horario = JSON.stringify({tipo: 'manual', processo: dados?.rota_dadosCon2PrazoVencido?.processo?.numero, sala: dados?.rota_dadosCon2PrazoVencido?.sala?.nome})
    }
    criaBotaoLaranjaComCheckBox({
        id: idg(tarefaNome, bloco, 'acoes_conjuntas', 'despacho'),
        idCheckbox: idg(tarefaNome, bloco, 'acoes_conjuntas', 'despacho', 'checkbox'),
        texto: 'Despachar designando.',
        ancestral: idg(tarefaNome, bloco, 'acoes_conjuntas', 'coluna'),
        acao: async () => {
            await removerArmazenamento('rota_acoes_conjuntas_con2_prazo_vencido_em_andamento')
            comandar(['con2_prazo_vencido_despachar'], [{tipo: 'con2_prazo_vencido_despachar_designacao'}])
        },
        grupo: idg(tarefaNome, bloco, 'acoes_conjuntas', 'grupo_despacho_ou_certidao')
    })
    criaBotaoLaranjaComCheckBox({
        id: idg(tarefaNome, bloco, 'acoes_conjuntas', 'certidao'),
        idCheckbox: idg(tarefaNome, bloco, 'acoes_conjuntas', 'certidao', 'checkbox'),
        texto: 'Certificar a designação, intimar e encaminhar para aguardando audiência.',
        ancestral: idg(tarefaNome, bloco, 'acoes_conjuntas', 'coluna'), 
        acao: async () => {
            await removerArmazenamento('rota_acoes_conjuntas_con2_prazo_vencido_em_andamento')
            comandar(['con2_prazo_vencido_certidao'], [{tipo: 'con2_prazo_vencido_certificar_designacao'}])
        },
        grupo: idg(tarefaNome, bloco, 'acoes_conjuntas', 'grupo_despacho_ou_certidao')
    })
    

    let checkBoxDespacho = document.getElementById(idg(tarefaNome, bloco, 'acoes_conjuntas', 'despacho', 'checkbox'))
    if (checkBoxDespacho) checkBoxDespacho.click()

    criaBotaoAzulComCheckBox({
        id: idg(tarefaNome, bloco, 'acoes_conjuntas', 'gig'),
        idCheckbox: idg(tarefaNome, bloco, 'acoes_conjuntas', 'gig', 'checkbox'),
        texto: 'Colocar GIG de acompanhamento.',
        ancestral: idg(tarefaNome, bloco, 'acoes_conjuntas', 'coluna'),
        acao: async () => {
            await removerArmazenamento('rota_acoes_conjuntas_con2_prazo_vencido_em_andamento')
            comandar(['con2_prazo_vencido_gig'], [{tipo: 'con2_prazo_vencido_gig_acompanhamento'}])
        },
    })
    let checkBoxGig = document.getElementById(idg(tarefaNome, bloco, 'acoes_conjuntas', 'gig', 'checkbox'))
    if (checkBoxGig) checkBoxGig.click()

    console.log('%c[Rota PJE]%c blocos criados', LOG.teste, 'color:inherit')
    
    function chkEstaMarcado(idCheckbox) {
        return document.getElementById(idCheckbox)?.dataset.marcado === '1'
    }
    /*
    bloco = 'extras'
    let secaoExtras = await criaSecaoMostraRecolhe({
        id: idg(tarefaNome, bloco),
        idSempreAMostra: idg(tarefaNome, bloco, 'extras-mostra'), 
        idRecolhe: idg(tarefaNome, bloco, 'extras-recolhe'),  
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
        id: idg(tarefaNome, bloco, 'extras-titulo'), 
        texto: 'Extras (Bloqueio de pauta, etc.)', 
        ancestral: idg(tarefaNome, bloco, 'extras-mostra')
    })
    criaSubTitulo({
        id: idg(tarefaNome, bloco, 'extras-bloqueioDePauta'), 
        texto: 'Bloqueio de pauta', 
        ancestral: idg(tarefaNome, bloco, 'extras-recolhe')
    })
    criaTexto({
        id: idg(tarefaNome, bloco, 'extras-bloqueio-texto'), 
        texto: 'Esta ferramenta foi pensada para "tapar os furos" da pauta, dos processos que são retirados de pauta, e os horários ficam muito "em cima" para designação.', 
        ancestral: idg(tarefaNome, bloco, 'extras-recolhe')
    })
    criaInput({
        id: idg(tarefaNome, bloco, 'extras-bloqueio-inputData'), 
        textoEmCima: 'Insira a data limite para bloqueio das audiências (serão bloqueadas todas as audiências até a data escolhida).', 
        ancestral: idg(tarefaNome, bloco, 'extras-recolhe'),
        placeholder: 'DD/MM/AAAA'
    })
    await armazenar({con2_prazo_vencido_pula_data: '22/06/2026'})
    let dataPula = await obterArmazenamento('con2_prazo_vencido_pula_data')
    console.log('%c[Rota PJE]%c dataPula: ' + JSON.stringify(dataPula), LOG.rosa, 'color:inherit')
    let input = document.getElementById(idg(tarefaNome, bloco, 'extras-pula-inputData'))
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
                id: idg(tarefaNome, bloco, 'extras-bloqueio-botao' + i),
                texto: 'Bloquear todas as audiências do tipo ' + horario?.descricaoTipoAudiencia + ' até a data preenchida acima.',
                ancestral: idg(tarefaNome, bloco, 'extras-recolhe'),
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

        const chkDesignacao = document.querySelector(`[data-grupo="${idg(tarefaNome, bloco, 'acoes_conjuntas', 'grupo_designacao')}"][data-marcado="1"]`)
        console.log('%c[Rota PJE]%c chkDesignacao: ' + JSON.stringify(chkDesignacao), LOG.teste, 'color:inherit')
        if (chkDesignacao) {
            const horario = JSON.parse(chkDesignacao.closest('[data-horario]').dataset.horario)
            comandos.push('con2_prazo_vencido_designa_audiencia')
            dados.push({horario: horario})
        }

        if (chkEstaMarcado(idg(tarefaNome, bloco, 'acoes_conjuntas', 'despacho', 'checkbox'))) {
            comandos.push('con2_prazo_vencido_despachar')
            dados.push({tipo: 'con2_prazo_vencido_despachar_designacao'})
        }

        if (chkEstaMarcado(idg(tarefaNome, bloco, 'acoes_conjuntas', 'certidao', 'checkbox'))) {
            comandos.push('con2_prazo_vencido_certidao')
            dados.push({tipo: 'con2_prazo_vencido_certificar_designacao'})
        }

        if (chkEstaMarcado(idg(tarefaNome, bloco, 'acoes_conjuntas', 'gig', 'checkbox'))) {
            comandos.push('con2_prazo_vencido_gig')
            dados.push({tipo: 'con2_prazo_vencido_gig_acompanhamento'})
        }
        console.log('%c[Rota PJE]%c quantos comandos: ' + comandos.length, LOG.teste, 'color:inherit')
        if (comandos.length) comandar(['con2_prazo_vencido_acoes_conjuntas'], [{comandos: comandos, parametros: dados}])
    }
    async function con2_prazo_vencido_salvar_link_da_audiencia() {
        let inputLinkAudiencia = document.getElementById(idg(tarefaNome, 'designa_audiencia', 'input_link_da_audiencia'))
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
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
    let expedientes = dados?.rota_dadosCon2PrazoVencido?.expedientes || []
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
            let possiveis = [
                {
                    solucao: 'arquivado o processo',
                    label: 'Arquivado o processo'
                },
                {
                    solucao: 'nao acolhidos',
                    label: 'Não acolhidos os Embargos de Declaração'
                }
            ]
            let solucaoAjustada = possiveis.find(p => normalizar(solucao?.movimento).includes(p.solucao))?.label || null
            let plaquinha = criaPlaquinhaComTooltip({
                id: idg(tarefaNome, bloco, nomeTabela, 'plaquinha' + i),
                texto: solucaoAjustada ? solucaoAjustada : solucao?.movimento.split('-', 2)[0].trim(),
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
            let vermelho = ['improcedentes', 'extinto', 'nao acolhidos', 'arquivado o processo']
            if (vermelho.some(c => normalizar(solucao).includes(c))) return 'vermelho'
            if (normalizar(solucao).includes('em parte'))    return 'amarelo'
            let verde = ['procedentes', 'acolhidos']
            if (verde.some(c=> normalizar(solucao).includes(c))) return 'verde'
            return ''
        }

    }

    bloco = 'documentos'
    criaDiv({ id: idg(tarefaNome, bloco), ancestral: 'rota_corpo' })
    criaTitulo({ id: idg(tarefaNome, bloco, 'titulo'), texto: 'Documentos do Processo', ancestral: idg(tarefaNome, bloco) })
    
    let documentosTimeline = dados?.rota_dadosCon2PrazoVencido?.timeline || []
    let valores = 'sentenca, recurso, deposito, custas, seguro, fianca, procuracao, substabelecimento, contrarrazoes, contrarrazao'
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
    console.log('%c[Rota PJE]%c dados?.rota_dadosCon2PrazoVencido?.partes: ' + JSON.stringify(dados?.rota_dadosCon2PrazoVencido?.partes), LOG.info, 'color:inherit')
    criaBotaoAzul({
         id: idg(tarefaNome, bloco, 'retificar_partes'),
         texto: 'Retificar autuação',
         ancestral: idg(tarefaNome, bloco),
         acao: () => comandar(['con2_prazo_vencido_retificar'], [{tipo: 'Partes'}])
    })

    bloco = 'prazos'

    criaTitulo({
        id: idg(tarefaNome, bloco, 'titulo'),
        texto: 'Prazos Vencidos pós-sentença',
        ancestral: 'rota_corpo'
    })
    let datas = []
    let partes = []
    let data = null
    let tipoPrazo = null
    let prazoLegal = null
    let partesProcesso = dados?.rota_dadosCon2PrazoVencido?.partes
    for (let expediente of expedientes){
        if (expediente.fimDoPrazoLegal != data){
            if (data){
                datas.push({data, partes, tipoPrazo, prazoLegal})
                partes = []
            }
            data = expediente.fimDoPrazoLegal
            tipoPrazo = expediente.tipoPrazo
            prazoLegal = expediente.prazoLegal
        }
        let parteTipo = partesProcesso?.ATIVO?.find(d=> d.nome == expediente.nomePessoaParte)?.tipo || partesProcesso?.PASSIVO?.find(d=> d.nome == expediente.nomePessoaParte)?.tipo || partesProcesso?.TERCEIROS?.find(d=> d.nome == expediente.nomePessoaParte)?.tipo || ''
        partes.push({nomePessoaParte: expediente.nomePessoaParte, tipo: parteTipo})
    }
    datas.push({data, partes, tipoPrazo, prazoLegal})
    console.log('%c[Rota PJE]%c datas' + JSON.stringify(datas), LOG.aviso, 'color:inherit')
    
    for (let i = 0; i < datas.length; i++){
        let {data, partes, tipoPrazo, prazoLegal} = datas[datas.length - i - 1]
        criaTexto({
            id: idg(tarefaNome, bloco, String(i), 'texto'),
            ancestral: 'rota_corpo',
            texto: `🗓️ ${new Date(data).toLocaleDateString()}:
    🧑 partes: ${partes.map(p => p.nomePessoaParte + ' - ' + p.tipo).join(', ')}
    📅 dias: ${prazoLegal} ${tipoPrazo}

`
        })
    }

    bloco = 'recursos'

    criaTitulo({
        id: idg(tarefaNome, bloco, 'titulo'),
        texto: 'Recursos',
        ancestral: 'rota_corpo'
    })
    let recursosPrimeiroGrau = documentosTimeline.filter(d => (normalizar(d?.tipo).includes('recurso') || normalizar(d?.titulo).includes('recurso')) && (['autor', 'reu', 'procurador', 'advogado'].some(c=> normalizar(d?.participacaoProcesso).includes(c))) && normalizar(d?.instancia).includes(normalizar('1º Grau')) && !normalizar(d?.tipo).includes('contrarraz') && !normalizar(d?.titulo).includes('contrarraz')) || []
    console.log('%c[Rota PJE]%c recursosUm' + JSON.stringify(recursosPrimeiroGrau), LOG.aviso, 'color:inherit', recursosPrimeiroGrau)
    let caixas = []
    for(let i = 0; i < recursosPrimeiroGrau.length; i++){
        let recurso = recursosPrimeiroGrau[i]
        let {id, idUnicoDocumento, data, participacaoProcesso, titulo, idSignatario, tipo, nomeResponsavel} = recurso || {}
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
        check.dataset.recurso = JSON.stringify({id, idUnicoDocumento, idSignatario, participacaoProcesso, tipo})
        clicar('#' + ancestral + '_check')
        check.addEventListener('click', async () => await definirPreparo(ancestral, check, coluna))
        let textoAoLado = criaTexto({
            id: ancestral + '_texto',
            ancestral,
            texto: idUnicoDocumento + ' - ' + new Date(data).toLocaleDateString() + ' - ' + participacaoProcesso.split(',')[0] + ' - ' + titulo + ' - Assinado por ' + nomeResponsavel
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
                let chkNaoProcessar = await criaCheckBox({
                    id: ancestral + '_naoProcessar',
                    ancestral: ancestral + '_preparo',
                    textoAoLado: 'Não processar'
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
                chkNaoProcessar.addEventListener('click', () => {
                    let recurso = JSON.parse(check.dataset.recurso)
                    recurso.naoProcessar = !recurso.naoProcessar
                    check.dataset.recurso = JSON.stringify(recurso)
                })
                
            } else {
                let dados = JSON.parse(check.dataset.recurso)
                if (normalizar(dados?.participacaoProcesso).includes('reu')){
                    let chkRecolhidas = await criaCheckBox({
                        id: ancestral + '_recolhidas',
                        ancestral: ancestral + '_preparo',
                        textoAoLado: 'Custas e depósito/fiança OK'
                    })
                    let chkDispensadas = await criaCheckBox({
                        id: ancestral + '_dispensadas',
                        ancestral: ancestral + '_preparo',
                        textoAoLado: 'Dispensados'
                    })
                    chkRecolhidas.addEventListener('click', () => {
                        let recurso = JSON.parse(check.dataset.recurso)
                        if (document.getElementById(ancestral + '_recolhidas').dataset.marcado == 1){
                            recurso.preparo = 'recolhidas'
                        }
                        check.dataset.recurso = JSON.stringify(recurso)
                        alternaCheckBox(chkRecolhidas.id, chkRecolhidas, chkDispensadas)
                    })
                    chkDispensadas.addEventListener('click', () => {
                        let recurso = JSON.parse(check.dataset.recurso)
                        if (document.getElementById(ancestral + '_dispensadas').dataset.marcado == 1){
                            recurso.preparo = 'dispensadas'
                        }
                        check.dataset.recurso = JSON.stringify(recurso)
                        alternaCheckBox(chkDispensadas.id, chkRecolhidas, chkDispensadas)
                    })
                    clicar('#' + ancestral + '_recolhidas')
                    
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
    botaoProcessar.style.width = '100%'
    botaoProcessar.style.marginBottom = '4px'
    criaTooltip({
        id: idg(tarefaNome, 'processar_tip'),
        texto: 'Somente os recursos selecionados serão processados. Aos demais será denegado seguimento.',
        elemento: botaoProcessar
    })

    criaTitulo({
        id: idg(tarefaNome, bloco, 'titulo_processados'),
        texto: 'Recursos processados',
        ancestral: 'rota_corpo'
    })

    let movimentos = dados?.rota_dadosCon2PrazoVencido?.movimentos
    let processados = movimentos.filter(d=> d.titulo.includes('Recebido(s) o(s)'))
    console.log('%c[Rota PJE]%c processados: ' + JSON.stringify(processados), LOG.info, 'color:inherit')
    let k = 0
    console.log('%c[Rota PJE]%c Object.values(partesProcesso): ' + JSON.stringify(Object.values(partesProcesso)), LOG.info, 'color:inherit', Object.values(partesProcesso))
    let recorrentes = []
    for (let processado of processados){
        let parte = Object.values(partesProcesso).map(d => d.find(d => normalizar(processado?.titulo).includes(normalizar(d?.nome).trim())))
        let chk = await criaCheckBox({
            id: idg(tarefaNome, bloco, 'processados', String(k)),
            ancestral: 'rota_corpo',
            textoAoLado: '    🟢 ' + processado?.titulo + ' - ' + new Date(processado?.data).toLocaleDateString() + '\n'
        })
        if (((new Date() - new Date(processado?.data)) / 1000 / 60 / 60 / 24) < 365) chk.click()
        recorrentes.push(parte)
        k++
    }

    let botaoDevolver = criaBotaoAzul({
        id: idg(tarefaNome, 'devolver'),
        texto: 'Devolver para a vara de origem',
        ancestral: 'rota_corpo',
        acao: () => comandar(['con2_prazo_vencido_devolverRemeter'], ['devolver'])
    })
    botaoDevolver.style.width = '100%'
    botaoDevolver.style.marginBottom = '4px'

    criaTooltip({
        id: idg(tarefaNome, 'processar_tip'),
        texto: 'Devolve o processo para a vara de origem (para remeter o recurso).',
        elemento: botaoDevolver
    })
    
    let botaoRemeter = criaBotaoAzul({
        id: idg(tarefaNome, 'remeter'),
        texto: 'Remeter para a instância superior',
        ancestral: 'rota_corpo',
        acao: () => comandar(['con2_prazo_vencido_devolverRemeter'], ['remeter'])
    })
    botaoRemeter.style.width = '100%'
    botaoRemeter.style.marginBottom = '4px'
    
    criaTooltip({
        id: idg(tarefaNome, 'remeter_tip'),
        texto: 'Remete para a instância superior, considerando os recursos já processados.',
        elemento: botaoDevolver
    })

    async function processarRecursosSelecionados(caixas) {
        let recursos = []
        for (caixa of caixas){
            let elemento = document.getElementById(caixa)
            let marcado = elemento.dataset.marcado == 1 ? true : false
            let dataset = JSON.parse(elemento.dataset.recurso)
            recursos.push({marcado, ...dataset})
        }
        comandar(['con2_prazo_vencido_processar_recursos'], [recursos])
        
    }


    
    return
    
    
}




// Auto-executa ao carregar o script
con2_prazo_vencido_assistente_iniciar()
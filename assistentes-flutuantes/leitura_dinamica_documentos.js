// ── TDs excluídos da busca de número de processo ────────────────
//
// O rastreamento de processo em colorirDinamico() percorre toda 'tr'
// da página e, dentro dela, procura o 'td' cujo texto bate com
// ROTA_REGEX_CNJ. Em algumas telas mais de um td da mesma linha
// contém um número de processo (ex: coluna oculta, tooltip, link
// duplicado) e não é o td onde queremos o badge.
//
// Em vez de trocar o seletor principal a cada tela nova, acrescente
// aqui os seletores CSS dos tds que devem ser IGNORADOS na busca —
// o primeiro td restante (na ordem do DOM) que bater com o regex é
// o escolhido.
//
// ex: ROTA_LEITURA_DINAMICA_TDS_EXCLUIDOS.push('.mat-column-acoes')
const ROTA_LEITURA_DINAMICA_TDS_EXCLUIDOS = [
    // 'seletor-css-do-td-que-nao-deve-ser-usado',
]

async function leituraDinamicaDocumentos(ancestral) {
    let widget = document.querySelector('#rota_leituraDinamica')
    if (widget) widget.remove()
    let janela = confereJanela(
        JANELA.meuPainel,          
        JANELA.painelGlobal,      	
        JANELA.painelGlobalTarefas,
        JANELA.painelGlobalTodos, 	
        JANELA.escaninho, 			
        JANELA.pautaAudiencias, 	
        JANELA.atasAudiencias, 	
        JANELA.gigsRelatorios, 	
    )
    if (!janela){
        console.log('%c[Rota PJE]%c leituraDinamica4: ' + JSON.stringify(4), LOG.rosa, 'color:inherit')
        return
    }
    console.log('%c[Rota PJE]%c leituraDinamica4' + JSON.stringify('true'), LOG.rosa, 'color:inherit')
    criaWidgetLeituraDinamica(ancestral)
}

//leituraDinamicaDocumentos()
//
//window.addEventListener('pjerota:url-mudou', () => {
//    document.getElementById('pjerota-consulta_qualquer_oj-widget')?.remove()
//    leituraDinamicaDocumentos()
//})

async function criaWidgetLeituraDinamica(ancestral) {
    let mapaFuncoes ={
        criaInput
    }
    let div = await criaDiv({
        id: 'rota_leituraDinamica', 
        ancestral: ancestral,
    })
    let subTitulo = criaSubTitulo({
        id: 'rota_leituraDinamica_subTitulo',
        texto: 'Colore de acordo com os termos escolhidos.',
        ancestral: 'rota_leituraDinamica',
    })
    let tipos = [
        {
            tipo: 'peticao',
            label: 'Petições não apreciadas',
        },
        {
            tipo: 'ataDeAudiencia',
            label: 'Última ata de audiência',
        },
        {
            tipo: 'sentenca',
            label: 'Sentenças e Acórdãos',
        },
    ]
    for(t of tipos){
        let checkBox = criaCheckBox({
            id: 'rota_leituraDinamica_check_' + t?.tipo, 
            textoAoLado: t?.label, 
            ancestral: 'rota_leituraDinamica',
        })
        checkBox.style.marginLeft = '3px'
        let checkListener = document.querySelector('#rota_leituraDinamica_check_' + t?.tipo)
        checkListener.dataset.tipo = t?.tipo
        checkListener.addEventListener('click', () => alternarCheckLeituraDinamica(checkListener))
    }
    async function alternarCheckLeituraDinamica(el) {
        let todosChecks = [...document.querySelectorAll('[id*="rota_leituraDinamica_check_"]')]
        
        for (t of tipos){
            let check = document.querySelector('#rota_leituraDinamica_check_' + t?.tipo)
            if (check !== el && el.dataset.marcado == 1 && check.dataset.marcado == 1){
                check.click()
                await suspender(200)
            }
        }
        
    }

    // ── Configurações salvas do usuário ─────────────────────────
    const CHAVE_CONFIGURACOES = 'rota_leituraDinamica_configuracoesUsuario'
    const CHAVE_ULTIMA_CONFIGURACAO = 'rota_leituraDinamica_ultimaConfiguracaoEscolhida'

    let configuracoesCache = {}
    let menuConfiguracoes = null

    async function _carregarConfiguracoes() {
        let dados = await obterArmazenamento([CHAVE_CONFIGURACOES])
        configuracoesCache = dados?.[CHAVE_CONFIGURACOES] || {}
        return configuracoesCache
    }

    // aplica os termos/checkbox de uma configuração salva nos campos do widget
    function _aplicarConfiguracao(nome) {
        let cfg = configuracoesCache?.[nome]
        if (!cfg) return
        let checkDesejado = document.querySelector('#rota_leituraDinamica_check_' + cfg?.tipo)
        if (checkDesejado && checkDesejado.dataset.marcado !== '1'){
            checkDesejado.click()
        }
        for (let j of cores){
            let inputEl = document.querySelector('#rota_leituraDinamica_divCores_input_' + j?.nome.toLowerCase())
            if (inputEl) inputEl.value = cfg?.termos?.[j?.nome] ?? ''
        }
    }

    // reconstrói o menu suspenso — criaMenuSuspenso não suporta atualizar opções,
    // então recriamos o elemento sempre que a lista de configurações muda
    async function _renderizarMenuConfiguracoes(valorParaSelecionar) {
        let divMenu = document.getElementById('rota_leituraDinamica_divMenuConfig')
        if (!divMenu) return
        divMenu.innerHTML = ''
        menuConfiguracoes = null

        let nomes = Object.keys(configuracoesCache)
        if (!nomes.length){
            let vazio = criaTexto({
                id: 'rota_leituraDinamica_configVazia',
                texto: 'Nenhuma configuração salva ainda.',
                ancestral: 'rota_leituraDinamica_divMenuConfig',
            })
            vazio.style.fontSize = '11px'
            vazio.style.margin = '2px 0'
            return
        }

        let opcoes = nomes.map(n => ({valor: n, texto: n}))
        let inicial = (valorParaSelecionar && nomes.includes(valorParaSelecionar)) ? valorParaSelecionar : nomes[0]
        menuConfiguracoes = criaMenuSuspenso({
            id: 'rota_leituraDinamica_menuConfiguracoes',
            opcoes: opcoes,
            valorInicial: inicial,
            ancestral: 'rota_leituraDinamica_divMenuConfig',
            cor: 'azul',
            acao: async (valor) => {
                await armazenar({[CHAVE_ULTIMA_CONFIGURACAO]: valor})
                _aplicarConfiguracao(valor)
            }
        })
    }

    async function _removerConfiguracaoAtual() {
        let nomeAtual = menuConfiguracoes?.value
        if (!nomeAtual || !configuracoesCache?.[nomeAtual]){
            rota_leituraDinamica_avisoTemporario('Nenhuma configuração selecionada para remover.')
            return
        }
        if (!confirm('Remover a configuração "' + nomeAtual + '"?')) return

        delete configuracoesCache[nomeAtual]
        try {
            await armazenar({[CHAVE_CONFIGURACOES]: configuracoesCache})
        } catch (e) {
            console.error('[Rota PJE] erro ao remover configuração:', e)
            rota_leituraDinamica_avisoTemporario('Não foi possível remover a configuração. Tente novamente.')
            return
        }

        let restantes = Object.keys(configuracoesCache)
        let novaUltima = restantes[0] || null
        await armazenar({[CHAVE_ULTIMA_CONFIGURACAO]: novaUltima})
        await _renderizarMenuConfiguracoes(novaUltima)
        rota_leituraDinamica_avisoTemporario('Configuração "' + nomeAtual + '" removida.')
    }

    let subTituloConfigs = criaSubTitulo({
        id: 'rota_leituraDinamica_subTituloConfigs',
        texto: 'Configurações salvas',
        ancestral: 'rota_leituraDinamica',
    })
    let divLinhaConfiguracoes = criaDiv({
        id: 'rota_leituraDinamica_divLinhaConfiguracoes',
        ancestral: 'rota_leituraDinamica',
        rowColumn: 'row',
    })
    let divMenuConfig = criaDiv({
        id: 'rota_leituraDinamica_divMenuConfig',
        ancestral: 'rota_leituraDinamica_divLinhaConfiguracoes',
    })
    divMenuConfig.style.flex = '1'
    divMenuConfig.style.marginBottom = '0'
    let divBotaoRemoverConfig = criaDiv({
        id: 'rota_leituraDinamica_divBotaoRemoverConfig',
        ancestral: 'rota_leituraDinamica_divLinhaConfiguracoes',
    })
    divBotaoRemoverConfig.style.marginBottom = '0'
    let botaoExcluir = criaBotaoLaranja({
        id: 'rota_leituraDinamica_botaoRemoverConfig',
        texto: '🗑',
        ancestral: 'rota_leituraDinamica_divBotaoRemoverConfig',
        acao: () => _removerConfiguracaoAtual()
    })
    criaTooltip({
        id: 'rota_leituraDinamica_tooltipRemoverConfig',
        texto: 'Excluir configuração salva.',
        elemento: botaoExcluir
    })

    let cores = [
        {
            nome: 'Vermelho'
        },
        {
            nome: 'Laranja'
        },
        {
            nome: 'Amarelo'
        },
        {
            nome: 'Verde'
        },
        {
            nome: 'Azul'
        },
        {
            nome: 'Roxo'
        },
    ]
    let secoes = [
        {
            background: true,
            nome: 'quadroCor',
            pixels: '30px',
        },
        {
            background: false,
            nome: 'input',
            funcao: 'criaInput',
            width: '75%',
            height: '100%'
        },
    ]
    function defineCor(cor) {
        return (CORES.find(d => d?.nome == cor))?.hex
    }
    let processosCopiar = []
    for (let j of cores){
        let cor = defineCor(j?.nome)
        let idDivCores = 'rota_leituraDinamica_divCores' + j?.nome.toLowerCase()
        let divCores = criaDiv({
            id: idDivCores,
            ancestral: 'rota_leituraDinamica',
            rowColumn: 'row'
        })
        divCores.style.margin = '4px'
        for (let k of secoes){
            let funcao = k?.funcao || null
            let divSecao = criaDiv({
                id: 'rota_leituraDinamica_divCores' + j?.nome.toLowerCase() + '_' + k?.nome,
                ancestral: idDivCores,
                rowColumn: 'row'
            })
            
            if (k?.background){
                divSecao.style.background = cor
                divSecao.style.width = k?.pixels
                divSecao.style.height = k?.pixels
                divSecao.style.border = '1px solid ' + cor
                divSecao.style.borderRadius = '4px'
                //divSecao.style.marginLeft = '4px'
                
            }
            if (funcao){
                let inputNome = 'rota_leituraDinamica_divCores_input_' + j?.nome.toLowerCase()
                let input = mapaFuncoes[funcao]({
                    id: inputNome,
                    textoEmCima: '',
                    ancestral: idDivCores,
                    placeholder: 'termo1, TERMO2, Termo3',
                })
                input.container.style.width = '75%'
                input.style.height = k?.pixels
                input.dataset.cor = cor
                input.dataset.nome = j?.nome.toLowerCase()
                let copiarNome = 'rota_leituraDinamica_divCores_copiar_' + j?.nome.toLowerCase()
                let botao = criaBotaoLaranja({
                    id: copiarNome,
                    texto: '📋',
                    ancestral: idDivCores,
                    acao: () => copiarDadosCores(j?.nome)
                })
                botao.style.padding = '6px 6px 6px 6px'
                botao.style.height = '30px'

                let tooltip = criaTooltip({
                    id: 'rota_leituraDinamica_divCores_tooltipCopiar_' + j?.nome.toLowerCase(),
                    texto: 'Copiar processos desta cor.',
                    elemento: botao
                })

            }
        }
        
    }
    console.log('%c[Rota PJE]%c processosCopiar: ' + JSON.stringify(processosCopiar), LOG.teste, 'color:inherit')
    
    function copiarDadosCores(cor){
        let dados = processosCopiar
        let copia = []
        if (cor === 'processo'){
            let variaveis = []
            for (let i = 0; i < dados.length; i++){
                if (dados[i+1] && dados[i]?.processo === dados[i+1]?.processo){
                    variaveis.push({cor: dados[i]?.cor, termos: dados[i]?.termos})
                } else {
                    variaveis.push({cor: dados[i]?.cor, termos: dados[i]?.termos})
                    let resultado = dados[i]?.processo + '\t' + variaveis.map(d => d?.cor + ': ' + d?.termos.join(', ')).join('\t')
                    variaveis = []
                    copia.push(resultado)
                }
                
            }
            navigator.clipboard.writeText(copia.join('\n'))
            rota_leituraDinamica_avisoTemporario('Conteúdo copiado com sucesso', 3000)
        } else if(cor === 'cor'){
            for (let cor of cores){
                
            }
        }
        console.log('%c[Rota PJE]%c dados: ' + JSON.stringify(dados), LOG.rosa, 'color:inherit')
    }
    let idGrade = id('leituraDinamica', 'botoesCopia')
    let gradeCopias = criaGrade({
        id: idGrade,
        ancestral: 'rota_leituraDinamica',
        numeroColunas: 2
    })
    let botoes = [
        {
            id: 'cor',
            texto: 'Copia todos ordenados por cor.'
        },
        {
            id: 'processo',
            texto: 'Copia todos ordenados por processo.'
        },
    ]
    for (let botao of botoes){
        criaBotaoLaranja({
            id: idGrade + botao?.id,
            texto: botao?.texto,
            ancestral: idGrade,
            acao: () => copiarDadosCores(botao.id)
        })
    }

    let botao = criaBotaoAzul({
        id: 'rota_leituraDinamica_botaoAcao',
        texto: 'Colorir',
        ancestral: 'rota_leituraDinamica',
        acao: () => colorirDinamico('rota_leituraDinamica_divCores_input_')
    })
    
    // ── Salvar configuração atual ────────────────────────────────
    let divSalvarConfig = criaDiv({
        id: 'rota_leituraDinamica_divSalvarConfig',
        ancestral: 'rota_leituraDinamica',
        rowColumn: 'row',
    })
    let divInputNomeConfig = criaDiv({
        id: 'rota_leituraDinamica_divInputNomeConfig',
        ancestral: 'rota_leituraDinamica_divSalvarConfig',
    })
    divInputNomeConfig.style.flex = '1'
    divInputNomeConfig.style.marginBottom = '0'
    let inputNomeConfig = criaInput({
        id: 'rota_leituraDinamica_inputNomeConfig',
        ancestral: 'rota_leituraDinamica_divInputNomeConfig',
        placeholder: 'Nome da configuração',
    })
    let divBotaoSalvarConfig = criaDiv({
        id: 'rota_leituraDinamica_divBotaoSalvarConfig',
        ancestral: 'rota_leituraDinamica_divSalvarConfig',
    })
    divBotaoSalvarConfig.style.width = '40px'
    divBotaoSalvarConfig.style.marginBottom = '0'
    criaBotaoAzul({
        id: 'rota_leituraDinamica_botaoSalvarConfig',
        texto: '+',
        ancestral: 'rota_leituraDinamica_divBotaoSalvarConfig',
        acao: () => _salvarConfiguracaoAtual()
    })

    async function _salvarConfiguracaoAtual() {
        let nomeInput = document.querySelector('#rota_leituraDinamica_inputNomeConfig')
        let nome = nomeInput?.value?.trim() || ''
        if (nome === ''){
            rota_leituraDinamica_avisoTemporario('Dê um nome para a configuração antes de salvar.')
            return
        }

        let checkMarcado = tipos.find(t => document.querySelector('#rota_leituraDinamica_check_' + t?.tipo)?.dataset.marcado === '1')
        if (!checkMarcado){
            rota_leituraDinamica_avisoTemporario('Selecione um tipo de documento (Petições, Ata ou Sentenças) antes de salvar.')
            return
        }

        let termos = {}
        let algumTermoPreenchido = false
        for (let j of cores){
            let inputEl = document.querySelector('#rota_leituraDinamica_divCores_input_' + j?.nome.toLowerCase())
            let valor = inputEl?.value?.trim() || ''
            termos[j.nome] = valor
            if (valor !== '') algumTermoPreenchido = true
        }
        if (!algumTermoPreenchido){
            rota_leituraDinamica_avisoTemporario('Preencha ao menos um campo de termos antes de salvar.')
            return
        }

        let jaExistia = !!configuracoesCache?.[nome]
        configuracoesCache[nome] = {nome: nome, tipo: checkMarcado.tipo, termos: termos}

        try {
            await armazenar({[CHAVE_CONFIGURACOES]: configuracoesCache})
        } catch (e) {
            console.error('[Rota PJE] erro ao salvar configuração:', e)
            rota_leituraDinamica_avisoTemporario('Não foi possível salvar a configuração. Tente novamente.')
            return
        }

        await armazenar({[CHAVE_ULTIMA_CONFIGURACAO]: nome})
        await _renderizarMenuConfiguracoes(nome)
        if (nomeInput) nomeInput.value = ''
        rota_leituraDinamica_avisoTemporario(jaExistia ? 'Configuração "' + nome + '" atualizada.' : 'Configuração "' + nome + '" salva.')
    }

    

    // ── Carrega a última configuração escolhida, se houver ───────
    await _carregarConfiguracoes()
    let ultimaSalva = await obterArmazenamento([CHAVE_ULTIMA_CONFIGURACAO]).then(d => d?.[CHAVE_ULTIMA_CONFIGURACAO])
    await _renderizarMenuConfiguracoes(ultimaSalva)
    if (ultimaSalva && configuracoesCache?.[ultimaSalva]) _aplicarConfiguracao(ultimaSalva)
    
    async function colorirDinamico(seletores) {
        let checkboxSelecionado = tipos.find(t => document.querySelector('#rota_leituraDinamica_check_' + t?.tipo)?.dataset.marcado === '1')
        if (!checkboxSelecionado){
            rota_leituraDinamica_avisoTemporario('Selecione um tipo de documento (Petições, Ata ou Sentenças) antes de colorir.')
            return
        }

        let inputs = [...selecionar('[id*="' + seletores + '"]', '', true)]
        let regras = []
        for (e of inputs){
            if (e?.id.includes('container')) continue
            let valor = e?.value
            if (valor !== ''){
                let conteudo = valor.split(',').map(d=> d.trim()) || []
                let cor = e?.dataset.cor
                let nome = e?.dataset.nome
                regras.push({palavras: conteudo, cor: cor, nome: nome})
            }
        }
        let algumTermoValido = regras.some(r => (r?.palavras || []).some(p => p !== ''))
        if (!regras.length || !algumTermoValido){
            rota_leituraDinamica_avisoTemporario('Preencha ao menos um campo de termos antes de colorir.')
            return
        }

        let exclusao = [...document.querySelectorAll('[id*="rota_leituraDinamica_pintura"]')].map(d=> d.remove())

        // encontra, em cada 'tr' da página, o primeiro 'td' (não excluído) cujo
        // texto bate com o número de processo — em vez de depender de um
        // seletor específico de cada tela
        let elementos = []
        for (let tr of document.querySelectorAll('tr')){
            if (!tr.textContent.match(ROTA_REGEX_CNJ)) continue
            let tdProcesso = [...tr.querySelectorAll('td')].find(td =>
                td.textContent.match(ROTA_REGEX_CNJ) &&
                !ROTA_LEITURA_DINAMICA_TDS_EXCLUIDOS.some(sel => td.matches(sel))
            )
            if (tdProcesso) elementos.push(tdProcesso)
        }

        let processosResultado = []
        let mapaCopiar = new Map()      // chave: `${processo}|${nomeRegra}`
        let cacheProcesso = new Map()   // chave: número CNJ -> análise já feita
        let contadorBadge = 0

        for (let el of elementos){
            let p = el.textContent.match(ROTA_REGEX_CNJ)?.[0]
            if (!p) continue

            let analise = cacheProcesso.get(p)

            if (!analise){
                let id = await buscarIdPeloNumeroCNJ(p).then(d => d?.id) || null
                if (!id) continue

                let documentosTimeline = await buscaDocumentosNaoApreciados(id)
                let documentos = []
                let corBadge = ''
                let textoBadge = ''
                let tooltipBadge = ''
                let complemento = ''

                for (let doc of documentosTimeline){
                    let teor = await extrairTexto(id, doc?.id)
                    let resultado = []

                    for (let r of regras){
                        let encontrado = r?.palavras.map(palavra => {
                            let valor = palavra !== ''
                                ? buscaEmTextoMalFormatado(teor, palavra, 100, 100)
                                : null
                            if (!valor) return null

                            // acumula por par processo-regra
                            let chave = p + '|' + r?.nome
                            if (!mapaCopiar.has(chave)){
                                mapaCopiar.set(chave, {
                                    processo: p,
                                    cor: r?.nome,
                                    corHex: r?.cor,
                                    termos: new Set()
                                })
                            }
                            mapaCopiar.get(chave).termos.add(palavra)

                            // badge: primeiro termo define texto/cor/tooltip;
                            // os demais viram ➕ e entram no complemento
                            if (textoBadge === ''){
                                textoBadge = palavra
                                corBadge = r?.cor
                                tooltipBadge = valor?.trechos
                            } else {
                                if (!textoBadge.includes('➕')) textoBadge += '➕'
                                let termoMaiusculo = palavra.toUpperCase()
                                if (complemento === ''){
                                    complemento = '...\n\nOutros termos encontrados:\n\n-' + termoMaiusculo + '\n'
                                } else if (!complemento.includes(termoMaiusculo)){
                                    complemento += '-' + termoMaiusculo + '\n'
                                }
                            }

                            return valor
                        })

                        if (encontrado?.some(d => d !== null)){
                            resultado.push({
                                busca: encontrado.filter(d => d !== null),
                                cor: r?.cor
                            })
                        }
                    }

                    // 'data' é um placeholder — o nome real do campo de data no
                    // objeto retornado por buscaDocumentosNaoApreciados ainda
                    // precisa ser conferido; deixe pronto pra troca.
                    documentos.push({
                        idUnicoDocumento: doc?.idUnicoDocumento,
                        dados: resultado,
                        teor: teor,
                        data: doc?.data
                    })
                }

                tooltipBadge += complemento

                analise = {
                    processo: {processo: p, documentos: documentos},
                    textoBadge: textoBadge,
                    corBadge: corBadge,
                    tooltipBadge: tooltipBadge
                }

                cacheProcesso.set(p, analise)
                processosResultado.push(analise.processo)
            }

            contadorBadge++
            let badgeId = 'rota_leituraDinamica_pintura' + contadorBadge
            let encontrouAlgo = analise.textoBadge !== ''
            let textoBadgeFinal = encontrouAlgo ? analise.textoBadge.toUpperCase() : 'NÃO ENCONTRADO'
            let corBadgeFinal = encontrouAlgo ? analise.corBadge : '#6b7c93'

            let badge = criaPlaquinhaComTooltip({
                id: badgeId,
                texto: textoBadgeFinal,
                cor: corBadgeFinal,
                tooltip: analise.tooltipBadge
            })
            el.appendChild(badge)

            let badgeEdita = document.querySelector('#' + badgeId)
            badgeEdita.style.backgroundColor = corBadgeFinal
            badgeEdita.style.border = '1px solid ' + corBadgeFinal
            badgeEdita.style.borderRadius = '2px'
            badgeEdita.style.padding = '2px 2px'
            badgeEdita.style.cursor = 'pointer'
            badgeEdita.addEventListener('click', (e) => {
                e.stopPropagation()
                e.preventDefault()
                rota_leituraDinamica_abrirCompiladoProcesso(analise.processo)
            })
        }

        processosCopiar = [...mapaCopiar.values()].map(x => ({
            processo: x.processo,
            cor: x.cor,
            termos: [...x.termos]
        }))
        
    }

    async function buscaDocumentosNaoApreciados(id) {
        let valor = [...document.querySelectorAll('[id^="rota_leituraDinamica_check_"')].find(d=> d.dataset.marcado==1).dataset.tipo || ''
        console.log('%c[Rota PJE]%c seletores: ' + JSON.stringify(valor), LOG.aviso, 'color:inherit')
        let tipos = 
            {
                peticao: {
                    busca: 'documentoApreciavel',
                    valor: true
                },
                ataDeAudiencia: {
                    busca: 'tipo',
                    valor: 'Ata da Audiência'
                },
                sentenca: {
                    busca: 'tipo',
                    valor: ['Sentença', 'Acórdão'],
                    // No TST o campo 'tipo' não vem preenchido do mesmo jeito, então
                    // completa a busca pelo TÍTULO — mas só ancorado em "TST -" no
                    // começo, senão pega qualquer petição de parte com "Acórdão"/
                    // "Decisão" no nome. 'titulo' é placeholder — confira o campo certo.
                    tituloRegex: /^TST\s*-\s*(Acórdão|Decisão)\b/i
                },
                
            }
        
        let busca = tipos[valor]
        let documentosBrutos = await buscarDocumentos(id)
        let documentos = documentosBrutos.filter(d =>
            [].concat(busca.valor).includes(d[busca.busca]) ||
            (busca.tituloRegex && busca.tituloRegex.test(d?.titulo || ''))
        ) || []
        return documentos
    }

}

// ── rota_leituraDinamica_avisoTemporario ──────────────────────────────────────────
//
// Toast leve e não-bloqueante para avisos rápidos (validações,
// confirmações). Some sozinho após 'duracaoMs'. Diferente de
// rota_avisoObrigatorio (que é um modal que exige clique).
//
// rota_leituraDinamica_avisoTemporario(msg, duracaoMs)

function rota_leituraDinamica_avisoTemporario(msg = '', duracaoMs = 2500) {
    let existente = document.querySelector('#rota_leituraDinamica_avisoTemporario')
    if (existente) existente.remove()
    let corpo = document.querySelector('#rota_leituraDinamica')
    if (!corpo) return
    // 'corpo' não tem position:relative, então vira containing-block do
    // aviso (absolute) — sem isso o navegador sobe até o wrapper
    // (position:fixed), que é onde o antigo bug de largura mora.
    corpo.style.position = corpo.style.position || 'relative'
 
    let z = (typeof ROTA_Z !== 'undefined' ? (ROTA_Z.aviso ?? 9999) : 9999) + 1
    let aviso = document.createElement('div')
    aviso.id = 'rota_leituraDinamica_avisoTemporario'
    Object.assign(aviso.style, {
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        background: '#2c3e50',
        color: '#ffffff',
        borderLeft: '4px solid #ffa726',
        borderRadius: '6px',
        padding: '10px 16px',
        fontSize: '12px',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
        zIndex: String(z),
        width: '90%',
        boxSizing: 'border-box',
        textAlign: 'center',
    })
    aviso.textContent = msg
    corpo.appendChild(aviso)
 
    setTimeout(() => aviso.remove(), duracaoMs)
}


// ── rota_leituraDinamica_abrirCompiladoProcesso ───────────────
//
// Abre uma divFlutuante (60% largura, 80% altura, centralizada)
// com o compilado do TEOR de cada manifestação (documento) do
// processo, com os TERMOS buscados destacados na cor da regra que
// os encontrou. Clicar em qualquer lugar da div fecha.
//
// rota_leituraDinamica_abrirCompiladoProcesso(processo)
//   processo: { processo: <numero>, documentos: [{idUnicoDocumento, dados, teor}] }

function rota_leituraDinamica_escapeHtml(s = '') {
    return String(s)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
}

// monta o HTML do teor com os trechos casados (dado.busca[].inicio/fim)
// envolvidos em <mark> na cor da regra (dado.cor). Sobreposições entre
// termos são resolvidas mantendo a primeira ocorrência (por posição).
function rota_leituraDinamica_destacarTermos(teor = '', dados = []) {
    let marcas = []
    for (let d of (dados || [])){
        for (let m of (d?.busca || [])){
            if (m && typeof m.inicio === 'number' && typeof m.fim === 'number' && m.fim > m.inicio){
                marcas.push({inicio: m.inicio, fim: m.fim, cor: d?.cor})
            }
        }
    }
    marcas.sort((a, b) => a.inicio - b.inicio)

    let semSobreposicao = []
    let fimAnterior = -1
    for (let m of marcas){
        if (m.inicio >= fimAnterior){
            semSobreposicao.push(m)
            fimAnterior = m.fim
        }
    }

    let html = ''
    let cursor = 0
    for (let m of semSobreposicao){
        let inicio = Math.max(cursor, Math.min(m.inicio, teor.length))
        let fim = Math.max(inicio, Math.min(m.fim, teor.length))
        html += rota_leituraDinamica_escapeHtml(teor.slice(cursor, inicio))
        html += '<mark style="background:' + (m.cor || '#ffd500') + ';color:#03071e;border-radius:2px;padding:0 1px;">'
            + rota_leituraDinamica_escapeHtml(teor.slice(inicio, fim)) + '</mark>'
        cursor = fim
    }
    html += rota_leituraDinamica_escapeHtml(teor.slice(cursor))
    return html
}

function rota_leituraDinamica_abrirCompiladoProcesso(processo) {
    document.querySelector('#rota_leituraDinamica_compiladoOverlay')?.remove()

    let z = (typeof ROTA_Z !== 'undefined' ? (ROTA_Z.aviso ?? 9999) : 9999) + 2
    let overlay = document.createElement('div')
    overlay.id = 'rota_leituraDinamica_compiladoOverlay'
    Object.assign(overlay.style, {
        position: 'fixed', inset: '0',
        background: 'rgba(0,0,0,0.5)',
        zIndex: String(z),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        cursor: 'pointer',
    })

    let caixa = document.createElement('div')
    Object.assign(caixa.style, {
        background: '#ffffff',
        borderRadius: '8px',
        width: '60vw',
        height: '80vh',
        boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
    })

    let cabecalho = document.createElement('div')
    Object.assign(cabecalho.style, {
        background: '#0078aa',
        color: '#ffffff',
        padding: '10px 16px',
        fontWeight: '700',
        fontSize: '13px',
        flexShrink: '0',
    })
    cabecalho.textContent = 'Compilado — Processo ' + (processo?.processo ?? '—')

    let corpo = document.createElement('div')
    Object.assign(corpo.style, {
        padding: '14px 18px',
        overflowY: 'auto',
        flex: '1',
        fontSize: '13px',
        lineHeight: '1.5',
        color: '#2c3e50',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
    })

    let documentos = processo?.documentos || []
    if (!documentos.length){
        corpo.textContent = 'Nenhum documento encontrado para este processo.'
    } else {
        // 'data' é placeholder (ver comentário em colorirDinamico) — ordena do
        // jeito que der por enquanto, sem quebrar se vier vazio/inválido
        let porData = (a, b) => {
            let da = a?.data ? new Date(a.data).getTime() : 0
            let db = b?.data ? new Date(b.data).getTime() : 0
            return (da || 0) - (db || 0)
        }
        let encontrados = documentos.filter(doc => (doc?.dados || []).length > 0).sort(porData)
        let naoEncontrados = documentos.filter(doc => !(doc?.dados || []).length).sort(porData)

        let divisor = '─'.repeat(59)
        let blocoDoc = doc => {
            let teorDestacado = rota_leituraDinamica_destacarTermos(doc?.teor || '', doc?.dados)
            return '<div style="margin-bottom:16px;">'
                + '<div style="color:#6b7c93;">' + divisor + '</div>'
                + '<div style="font-weight:700;margin:4px 0;">id: ' + rota_leituraDinamica_escapeHtml(doc?.idUnicoDocumento ?? '—') + '</div>'
                + '<div>' + teorDestacado + '</div>'
                + '</div>'
        }

        let html = encontrados.map(blocoDoc).join('')
        if (naoEncontrados.length){
            if (encontrados.length){
                html += '<div style="color:#6b7c93;font-weight:700;margin:6px 0 10px;">— Sem termos encontrados —</div>'
            }
            html += naoEncontrados.map(blocoDoc).join('')
        }
        corpo.innerHTML = html
    }

    caixa.appendChild(cabecalho)
    caixa.appendChild(corpo)
    overlay.appendChild(caixa)
    document.body.appendChild(overlay)

    // clicar em qualquer lugar (overlay ou dentro da caixa, já que o clique borbulha) fecha
    overlay.addEventListener('click', () => overlay.remove())
}


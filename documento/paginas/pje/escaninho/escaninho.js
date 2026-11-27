// linha 564. falta completar o GIG pra mandar, ou seja, incluir 
// observação, responsável, etc.
// parece que está fácil continuar, a estrutura parece ser a mesma,
// linha 85 liga/desliga
//
//
//
//

function escaninhoFuncoes(){
    //return
    console.log('%c[Rota PJE]%c 123456: ' + JSON.stringify(123456), LOG.info, 'color:inherit')
    escaninhoCriaBotao()
}

async function escaninhoCriaBotao(){
    console.log('%c[Rota PJE]%c criaBotão: ' + JSON.stringify(1), LOG.rosa, 'color:inherit')
    let janela = confereJanela(
        JANELA.escaninho
    )
    if (!janela) return
    let seletores = [
        {
            janela: JANELA.escaninho,
            seletor: '.div-estatisticas .estatisticas-lista' 
        }
    ]
    let ancestral = seletores.find(d => d?.janela.test(location.href))?.seletor
    await aguardarElemento(ancestral)
    let idBotao = idg('escaninho', 'botaoPrincipal')
    let botoes = [...document.querySelectorAll('#' + idBotao)].map(d => d.remove())
    let botao = criaBotaoLaranja({
        id: idBotao,
        ancestral: ancestral,
        texto: 'Assistente de análise de petições',
        acao: () => escaninhoMenu()
    })
    botao.style.display = 'inline'
    let buscados = []
    let parar = false

    async function escaninhoMenu(){
        let idDiv = idg('escaninho', 'menu')
        let remover = [...document.querySelectorAll('#' + idDiv)].map(d=> d.remove())
        let div = criaDivCentralPadrao({
            id: idDiv,
            titulo: 'Análise de petições.',
            largura: '65%',
            altura: '65%'
        })
        let scripts = [
            {
                id: 'removePeticoesAnalisadas',
                titulo: 'Remove petições analisadas.',
                texto: 'Remove do escaninho as petições de processos que já têm despacho, sentença ou ata de audiência posterior.',
                input: 'Se houver qualquer dos documentos clicados posteriores à petição, ela será removida:',
                checkBoxes: ['Sentença', 'Despacho', 'Decisão', 'Ata da audiência'],
                textoBotao: 'Iniciar'
            },
            {
                id: 'removePeticoesPorTipoOuTitulo',
                titulo: 'Remove petições por tipo ou título.',
                texto: 'Remove do escaninho todas as petições que contenham no título ou tipo alguma das palavras escolhidas. DICA: FILTRE ANTES AS PETIÇÕES POR TIPO.',
                input: 'Preencha com as palavras a buscar, separadas por vírgula. Ex: contestacao, SUBSTABELECIMENTO, procuração.',
                textoBotao: 'Iniciar'
            },
            {
                id: 'inserirGigPorTipoOuTitulo',
                titulo: 'Inserir GIG e remover por tipo ou título.',
                texto: 'Insere o GIG escolhido e remove do escaninho as petições que contenham no título ou tipo alguma das palavras escolhidas. DICA: FILTRE ANTES AS PETIÇÕES POR TIPO.',
                textoBotao: 'Configurar e executar'
            },
            {
                id: 'resumirComIA',
                titulo: 'Resumir petições com IA.',
                texto: 'Resume as petições usando IA, e permite marcar assistente, secretário e apoio com um GIG contendo o resumo da petição, ou remover.',
                textoBotao: 'Configurar e executar'
            },
        ]
        let mFuncoes = {
            removePeticoesAnalisadas,
            removePeticoesPorTipoOuTitulo,
            inserirGigPorTipoOuTitulo,
            resumirComIA
        }
        for (let script of scripts){
            //if (script.id == 'resumirComIA') continue
            console.log('%c[Rota PJE]%c script: ' + JSON.stringify(script), LOG.info, 'color:inherit', script)
            let idGeral = idDiv + script?.id
            let ancestral = idGeral + '_div'
            let idInput = script?.input ? idGeral + '_input' : ''
            let armazenamentoInput = await obterArmazenamento(idInput) || {}
            let inputValue = armazenamentoInput?.[idInput] || ''
            let funcao = mFuncoes[script.id]
            let divIntermediaria = criaDiv({
                id: ancestral,
                ancestral: div?.corpo?.id, 
                rowColumn: 'row-reverse'
            })
            formataDiv(divIntermediaria, 'branco', 'auto', 'auto', 'relative', '0px', '0px', '')
            criaBotaoAzul({
                id: idGeral + '_botao',
                texto: script?.textoBotao,
                ancestral,
                acao: () => funcao(idInput)
            })
            if (script?.input && !script?.checkBoxes){
                let input = criaInput({
                    id: idInput,
                    textoEmCima: script?.input,
                    ancestral,
                })
                input.value = inputValue
            }
            if (script?.checkBoxes){
                criaDiv({
                    id: idInput,
                    ancestral
                })
                criaTexto({
                    id: idInput + '_texto',
                    ancestral: idInput,
                    texto: script?.input
                })
                criaDiv({
                    id: idInput + '_chks',
                    ancestral: idInput,
                    rowColumn: 'row'
                })
                let ch = 0
                for (let check of script?.checkBoxes){
                    let chk = await criaCheckBox({
                        id: idInput + '_chk_' + String(ch),
                        ancestral: idInput + '_chks',
                        salvar: true,
                        textoAoLado: check
                    })
                    chk.dataset.tipo = normalizar(check)
                    ch++
                }
            }
            let texto = criaTexto({
                id: idGeral + '_texto',
                texto: script?.texto,
                ancestral,
            })
            texto.style.width = '100%'
            criaSubTitulo({
                id: idGeral + '_subtitulo',
                texto: script?.titulo,
                ancestral,
            })
        }
    }

    async function resumirComIA() {
        inserirGigPorTipoOuTitulo('resumirComIA')
    }

    async function inserirGigPorTipoOuTitulo(parametro) {
        console.log('%c[Rota PJE]%c parametro: ' + JSON.stringify(parametro), LOG.info, 'color:inherit', parametro)
        document.getElementById(idg('escaninho', 'menu'))?.remove()
        let ancestral = parametro == 'resumirComIA' ? idg('escaninho', 'resumirComIA') : idg('escaninho', 'inserirGigPorTipoOuTitulo')
        document.getElementById(ancestral)?.remove()
        let diVTitulo = parametro == 'resumirComIA' ? 'Resumir petições usando IA' : 'Inserir GIG por Tipo ou Título'
        let div = criaDivCentralPadrao({
            id: ancestral,
            largura: '65%',
            altura: '65%',
            titulo: diVTitulo
        })
        div.corpo.style.overflowY = 'auto'
        let secoes = [
            {
                label: 'secretarios',
                titulo: 'Secretários de audiência',
                oj: ['CON1'],
                textoIA: 'Cadastre os secretários/juízes para serem marcados posteriormente à apresentação dos resumos.',
                texto: 'Os gigs serão atribuídos aos secretários de acordo com o GIG Simetria ou de acordo com a planilha de Juízes (finais), no caso de legado.',
                inputAnotacao: [
                    {
                        resumoIA: true,
                        label: 'secretarios_dados',
                        texto: 'Insira abaixo os dados de JUIZ e SECRETÁRIO correspondente, separados por vírgula, um por linha.',
                        placeholder: 'Ex:\nFULANO DE TAL, beltrano de tal\nciclano de tal, fulano de tal'
                    },
                    {
                        label: 'secretarios_termos',
                        texto: 'Indique os termos que devem conter no tipo ou título da petição para serem atribuídas aos secretários, o GIG a ser marcado, e o prazo, separados por vírgulas, um por linha.',
                        placeholder: 'Ex:\nacordo, Acordo, 0\nredesigna, Audiência, 5'
                    }
                ],
            },
            {
                label: 'assistentes',
                titulo: 'Assistentes de Juiz',
                textoIA: 'Cadastre os assistentes/juízes para serem marcados posteriormente à apresentação dos resumos.',
                texto: 'Os gigs serão atribuídos aos assistentes de acordo com o GIG Simetria (CON1 e CON2) ou de acordo com a planilha de Juízes (finais), no caso de legado.',
                inputAnotacao: [
                    {
                        resumoIA: true,
                        label: 'assistentes_dados',
                        texto: 'Insira abaixo os dados de JUIZ e SECRETÁRIO correspondente, separados por vírgula, um por linha.',
                        placeholder: 'Ex:\nFULANO DE TAL, beltrano de tal\nciclano de tal, fulano de tal'
                    },
                    {
                        label: 'assistentes_termos',
                        texto: 'Indique os termos que devem conter no tipo ou título da petição para serem atribuídas aos assistentes, o GIG a ser marcado, e o prazo, separados por tabulações, um por linha.',
                        placeholder: 'Ex:\nembargos de declaracao, Embargos de Declaração, 0\nreconsideracao, Gabinete, 5'
                    }
                ],
            },
            {
                label: 'apoio',
                titulo: 'Servidores de apoio',
                textoIA: 'Cadastre os servidores de apoio e respectivos finais para serem marcados posteriormente à apresentação dos resumos.',
                texto: 'Os gigs serão atribuídos aos servidores de apoio de acordo com o final indicado.',
                inputAnotacao: [
                    {
                        resumoIA: true,
                        label:'apoio_dados',
                        texto: 'Cole abaixo os dados dos servidores de apoio e finais, separados por vírgula, no formato "SERVIDOR, FINAIS", um por linha.',
                        placeholder: 'Ex: \nFULANO DE TAL, 01\nBELTRANO DE TAL, 2 3\nCiclano de tal, 456 7'
                    },
                    {
                        label:'apoio_termos',
                        texto: 'Indique os termos que devem conter no tipo ou título da petição para serem atribuídas aos servidores de apoio, o GIG a ser marcado, e o prazo, separados por tabulações, um por linha.',
                        placeholder: 'Ex:\n concordancia, Concordância, 15\nurgente, URGENCIA, 0\npenhora online, sisbajud, 0'
                    }
                ],
            },
        ]
        if (parametro == 'resumirComIA'){
            let secao = {
                label: 'gigs',
                titulo: 'Gigs disponíveis',
                textoIA: 'Insira aqui os GIGs e prazos respectivos que aparecerão no menu para escolha de GIGs após a consulta à IA, separados por vírgula. O primeiro GIG inserido será o que aparecerá no menu (escolher o mais usado poupará dois cliques).',
                inputAnotacao: [
                    {
                        resumoIA: true,
                        label: 'gigs_input',
                        texto: 'Insira abaixo os gigs, seguidos dos prazos, separados por vírgula, um por linha. Aceita como prazo dataAudiencia que será substituída pela data de hoje, se não houver audiência marcada.',/*, e dataPeticao.',*/
                        placeholder: 'Ex:\n prazo, 5\nAcordo, 01/01/2027\nAUDIÊNCIA, dataAudiencia'
                    },
                ],
            }
            let secoesAtuais = secoes
            secoes = [secao, ...secoesAtuais]
        }
        let inputsSecoes = []
        for (let secao of secoes){
            if(secao?.oj){
                let oj = document.querySelector('pje-cabecalho-perfil .papel-usuario')?.textContent || ''
                if (!secao?.oj.some(o => oj.includes(o))) continue
            }
            let idSecao = ancestral + '_' + secao?.label
            let divSecao = criaDiv({
                id: idSecao,
                ancestral: div.corpo.id,
            })
            formataDiv(divSecao, 'branco', 'auto', 'auto', 'relative', '0px', '0px', '')
            criaTitulo({
                id: idSecao + '_titulo',
                ancestral: idSecao,
                texto: secao?.titulo
            })
            let textoConteudo = parametro == 'resumirComIA' ? secao?.textoIA : secao?.texto
            let texto = criaTexto({
                id: idSecao + '_texto',
                ancestral: idSecao,
                texto: textoConteudo
            })
            let inputsIds = []
            for (let input of secao?.inputAnotacao){
                if (parametro == 'resumirComIA' && !input?.resumoIA) continue
                let inputElementoId = idSecao + '_' + input?.label + (parametro == 'resumirComIA' ? /*'resumirComIA'*/ '' : '')
                let inputElemento = criaInputAnotacao({
                    id: inputElementoId,
                    textoEmCima: input?.texto,
                    ancestral: idSecao
                })
                let valor = await obterArmazenamento(idSecao + '_' + input?.label)
                inputElemento.textarea.value = valor?.[idSecao + '_' + input?.label] || ''
                inputElemento.textarea.placeholder = input?.placeholder || ''
                inputElemento.label.style.whiteSpace = 'pre-wrap'
                inputElemento.textarea.style.maxHeight = '150px'
                inputElemento.textarea.style.overflowY = 'auto'
                inputsIds.push(inputElementoId)
                let botao = criaBotaoAzul({
                    id: idSecao + '_' + input?.label + '_salvar',
                    ancestral: idSecao,
                    texto: 'Salvar',
                    acao: async () => {
                        let valor =
                        await armazenar({[inputElementoId]: document.getElementById(idSecao + '_' + input?.label)?.value || ''})
                    }
                })
            }
            inputsSecoes.push({label: secao?.label, inputs: inputsIds})
        }
        let textoBotaoExecutar = parametro == 'resumirComIA' ? 'Resumir as petições da tela com IA.' : 'Percorrer todas as petições, inserir os GIGs e remover do escaninho'
        criaBotaoLaranja({
            id: ancestral + '_executar',
            ancestral: div.rodape.id,
            texto: textoBotaoExecutar,
            acao: () => {
                let parametros = []
                for (let secao of inputsSecoes){
                    let inputs = []
                    for (let input of secao?.inputs){
                        let valor = document.getElementById(input)?.value
                        inputs.push({label: input, valor})
                    }
                    parametros.push({secao: secao.label, inputs})
                }
                //parametros = inputsIds.map(d => {
                //    console.log('%c[Rota PJE]%c d' + JSON.stringify(d), LOG.aviso, 'color:inherit')
                //    let valor = document.getElementById(d)?.value
                //    return {label: d, valor}
                //})
                //console.log('%c[Rota PJE]%c parametros' + JSON.stringify(parametros), LOG.erro, 'color:inherit', parametros)
                if (parametro == 'resumirComIA'){
                    consultarResumirComIA(parametros, div.rodape.id)
                    return
                }
                document.getElementById(ancestral)?.remove()
                percorrePeticoes({rechamada: false, funcao: 'gigPorTituloOuTipo', parametros})
            }
        })
        
    }

    async function consultarResumirComIA(parametros, ancestralBotao){
        let corpoId = idg('escaninho', 'resumirComIA') + '_corpo'
        let corpo = document.getElementById(corpoId)
        corpo.replaceChildren()
        let botao = document.getElementById(idg('escaninho', 'resumirComIA') + '_executar')
        botao.disabled = true
        //console.log('%c[Rota PJE]%c parametros' + JSON.stringify(parametros), LOG.aviso, 'color:inherit', parametros)
        let divPlacarId = idg('escaninho', 'placar')
        let placar = criaSubTitulo({
            id: divPlacarId,
            ancestral: corpoId,
            texto: 'Aguarde. Iniciando busca do teor das petições e consultas ao Chat-JT.'
        })
        let interceptados = interceptador_ler('peticoes_juntadas') || {}
        let peticoes = interceptados?.resultado || []
        if(!peticoes){
            rota_avisoObrigatorio('Ocorreu um erro. Atualize a página e tente novamente.', 5)
            return
        }
        let consultas = []
        let i = 0
        let checks = []
        let gigs = parametros?.find(d=> d?.secao == 'gigs')?.inputs[0]?.valor?.split(/\r?\n/).map(d => normalizar(d).trim()) || ['prazo, 0']
        for (let peticao of peticoes){
            let {
                idDocumento,
                idProcesso,
                numeroProcesso,
                faseProcessual,
                tarefa,
                dataHoraAudiencia,
                descricaoDocumento,
                nomeTipoProcessoDocumento,
                dataJuntada,
                poloPeticionante
            } = peticao
            let teor = location.origin.includes('pje-web-hm') ? 'Teor teste ambiente de homologação.' : await rota_extrairTeorDocumento(idProcesso, idDocumento) || null
            if (!teor) continue
            let idDiv = idg('resumirComIA', 'resultado', JSON.stringify(i))
            criaDiv({
                id: idDiv,
                ancestral: corpoId,
                rowColumn: 'row-reverse'
            })
            let instrucao = 'Resuma o teor da petição, que segue abaixo, em até 50 palavras. Não apresente botões para nova consulta ou para fazer busca no processo, nem inicie a resposta com "Olá! Eu sou o Chat-JT, assistente preciso e confiável da plataforma nacional de IA da Justiça do Trabalho.": \n'
            let consulta = location.origin.includes('pje-web-hm') ? '' : rota_IAConsulta('', instrucao + teor) || null
            consultas.push({
                consulta,
                idDocumento,
                idProcesso,
                numeroProcesso,
                faseProcessual,
                tarefa,
                nomeTipoProcessoDocumento,
                descricaoDocumento,
                dataJuntada,
                dataHoraAudiencia,
                poloPeticionante
            })
            i++
        }
        let j = 0
        let parametrosTarefa = []
        for (let consulta of consultas){
            atualizaPlacar('Consultando ' + JSON.stringify(j + 1) + ' / ' + consultas.length)
            let {
                idDocumento,
                idProcesso,
                numeroProcesso,
                tarefa,
                faseProcessual,
                nomeTipoProcessoDocumento,
                descricaoDocumento,
                dataJuntada,
                dataHoraAudiencia,
                poloPeticionante
            } = consulta
            let processo = numeroProcesso
            let resultado = location.origin.includes('pje-web-hm') ? 'Teste ambiente de homologação.' : await consulta.consulta || 'Ocorreu um erro na consulta ao CHAT-JT.'
            let ancestral = idg('resumirComIA', 'resultado', JSON.stringify(j))
            //formataDiv(document.getElementById(ancestral), 'branco', '98%', 'auto', 'relative', '0px', '0px', '')
            let opcoes = ['Secretário', 'Assistente', 'Apoio', 'Eu mesmo', 'Remover']
            let checkAlternar = []
            let checkEnviar = []
            for (let opcao of opcoes){
                if (!['CON1', 'CON2'].some(d=> document.querySelector('.papel-usuario')?.textContent.includes(d)) && opcao === 'Secretário'){
                    continue
                }
                let idOpcao = normalizar(opcao).replaceAll(' ', '')
                let div = criaDiv({
                    id: ancestral + idOpcao,
                    ancestral,
                })
                let texto = criaTexto({
                    id: ancestral + idOpcao + '_texto',
                    ancestral: ancestral + idOpcao,
                    texto: opcao
                })
                texto.style.display = 'flex'
                texto.style.height = '50%'
                texto.style.textAlign = 'center'
                texto.style.alignItems = 'flex-end'
                texto.style.justifyContent = 'center'
                let check = await criaCheckBox({
                    id: ancestral + idOpcao + '_check',
                    ancestral: ancestral + idOpcao,
                })
                checkEnviar.push(ancestral + idOpcao + '_check')
                checkAlternar.push({id: ancestral + idOpcao + '_check', check})
                check.style.display = 'flex'
                check.style.height = '50%'
                check.style.textAlign = 'center'
                check.style.alignItems = 'flex-start'
                check.style.justifyContent = 'center'
                check.dataset.opcao = opcao
            }
            let div = criaDiv({
                id: ancestral + '_gigInserir',
                ancestral,
            })
            let textoMenu = criaTexto({
                id: ancestral + '_gigInserir_' + 'texto',
                ancestral: ancestral + '_gigInserir',
                texto: 'Gig a inserir'
            })
            textoMenu.style.display = 'flex'
            textoMenu.style.height = '50%'
            textoMenu.style.textAlign = 'center'
            textoMenu.style.alignItems = 'flex-end'
            textoMenu.style.justifyContent = 'center'
            let idMenu = ancestral + '_gigInserir_' + 'menu'
            let menu = criaMenuSuspenso({
                id: idMenu,
                ancestral: ancestral + '_gigInserir',
                opcoes: gigs?.map(d => d.split(',')[0]?.trim()),
                valorInicial: gigs[0].split(',')[0]?.trim()
            })
            menu.style.display = 'flex'
            menu.style.height = '50%'
            menu.style.textAlign = 'center'
            menu.style.alignItems = 'flex-start'
            menu.style.justifyContent = 'center'
            for (let elemento of checkAlternar){
                document.getElementById(elemento.id)?.addEventListener('click', () => alternaCheckBox(elemento.id, ...(checkAlternar.map(d=> d.check))))
            }
            criaDiv({
                id: idg('resumirComIA', 'resultado', 'peticao', JSON.stringify(j), 'div'),
                ancestral
            })
            let subtitulo = criaSubTitulo({
                id: idg('resumirComIA', 'resultado', 'peticao', JSON.stringify(j), 'subtitulo'),
                ancestral: idg('resumirComIA', 'resultado', 'peticao', JSON.stringify(j), 'div'),
                texto: processo
            })
            subtitulo.style.color = '#005b89'
            let texto = []
            for (let [chave, valor] of Object.entries(consulta)){
                if (chave == 'consulta' || chave == 'idDocumento' || chave == 'idProcesso' || chave == 'numeroProcesso') continue
                let nome = {
                    faseProcessual: 'Fase: ',
                    tarefa: 'Tarefa: ',
                    dataHoraAudiencia: 'Audiência: ',
                    descricaoDocumento: 'Descrição: ',
                    nomeTipoProcessoDocumento: 'Tipo: ',
                    dataJuntada: 'Data de Juntada: ',
                    poloPeticionante: 'Polo: '
                }
                if (String(valor) == 'undefined') continue
                valor = String(new Date(valor).toLocaleDateString()) != 'Invalid Date' ? new Date(valor).toLocaleDateString() : valor
                texto.push(nome[chave] + valor)
            }
            let textoDescricao = criaTexto({
                id: idg('resumirComIA', 'resultado', 'peticao', JSON.stringify(j), '_descricao'),
                ancestral: idg('resumirComIA', 'resultado', 'peticao', JSON.stringify(j), 'div'),
                texto: texto.join(' / ')
            })
            criaTexto({
                id: idg('resumirComIA', 'resultado', 'peticao', JSON.stringify(j)),
                ancestral: idg('resumirComIA', 'resultado', 'peticao', JSON.stringify(j), 'div'),
                texto: resultado
            })
            parametrosTarefa.push({
                idMenu,
                checkEnviar,
                resultado,
                idDocumento,
                idProcesso,
                numeroProcesso,
                tarefa,
                faseProcessual,
                nomeTipoProcessoDocumento,
                descricaoDocumento,
                dataJuntada,
                dataHoraAudiencia
            })
            j++
        }
        atualizaPlacar('Consulta finalizada.')
        botao.remove()
        let botaoExecutar = criaBotaoLaranja({
            id: idg('resumirComIA', 'marcarERemover'),
            ancestral: ancestralBotao,
            texto: 'Marcar/remover todos conforme selecionado',
            acao: async () => {
                let remover = document.getElementById(divPlacarId)?.remove()
                botaoExecutar.disabled = true
                let resultado = await executarResumirComIA({parametros, consultas: parametrosTarefa, gigs})
                await finalizar(resultado)
            }
        })

        async function finalizar(resultado){
            _baixarArquivo(resultado, 'resultadoEscaninho' + new Date().toLocaleDateString() + '.txt', 'text/plain')
            atualizaPlacar('Um arquivo foi baixado contendo o relatório da atividade')
            await suspender(4000)
            let idExecucao = idg('escaninho', 'resumirComIA', 'execucao')
            let remover = document.getElementById(idExecucao)?.remove()
            escaninhoMenu()
        }

        async function executarResumirComIA(parametro){
            let esconderId = 'rotapje_escaninho_resumirComIA'
            let esconder = document.getElementById(esconderId) || null
            if (esconder) esconder.style.display = 'none'
            let idExecucao = idg('escaninho', 'resumirComIA', 'execucao')
            let divExecucao = criaDivCentralPadrao({
                id: idExecucao,
                titulo:     'Executando',
                largura:    '30%',
                altura:     'auto',
                top:        '78px',
                left:       '85px',
                transform: ''
            })
            let texto = criaSubTitulo({
                id: idg('escaninho', 'placar'),
                texto: 'Aguarde a conclusão da tarefa. Iniciando.',
                ancestral: divExecucao.corpo.id
            })
            let opcoes = [
                {
                    escolha: 'Remover',
                    label: 'remover'
                },
                {
                    escolha: 'Eu mesmo',
                    label: 'eumesmo'
                },
                {
                    escolha: 'Assistente',
                    label: 'assistentes'
                },
                {
                    escolha: 'Secretário',
                    label: 'secretarios'
                },
                {
                    escolha: 'Apoio',
                    label: 'apoio'
                },
            ]
            let {parametros, consultas, gigs} = parametro
            console.log('%c[Rota PJE]%c 533' + JSON.stringify(533), LOG.aviso, 'color:inherit', parametros)
            let i = 0
            let resultados = ''
            for (let consulta of consultas){
                i++
                console.log('%c[Rota PJE]%c i' + JSON.stringify(i), LOG.aviso, 'color:inherit')
                atualizaPlacar('Executando: ' + JSON.stringify(i) + ' / ' + consultas.length)
                let {
                    idMenu,
                    idProcesso,
                    resultado,
                    numeroProcesso,
                    tarefa,
                    faseProcessual,
                    nomeTipoProcessoDocumento,
                    descricaoDocumento,
                    dataJuntada,
                    dataHoraAudiencia
                } = consulta
                let checks = consulta?.checkEnviar
                let idCheck = checks.find(d => document.getElementById(d)?.dataset.marcado == 1) || null
                let escolhido = document.getElementById(idCheck)?.dataset.opcao || ''
                let opcao = opcoes.find(d => d?.escolha == escolhido)?.label
                let gig = {}
                gig.observacao = 'Petição de ' + new Date(dataJuntada).toLocaleDateString() + ': ' + resultado
                gig.tipoAtividade = document.getElementById(idMenu)?.textContent || 'prazo'
                let tipoPrazo = gigs.find(g => g.includes(gig.tipoAtividade))?.split(',')[1].trim() || 0
                let prazo = definirTipoDePrazo(tipoPrazo, dataHoraAudiencia, dataJuntada)
                console.log('%c[Rota PJE]%c 651 prazo: ' + JSON.stringify(prazo), LOG.info, 'color:inherit', prazo)
                gig[prazo.label] = prazo.valor
                let tabela = parametros.find(d => d?.secao == opcao)?.inputs[0].valor.split(/\r?\n/) || ''
                console.log('%c[Rota PJE]%c 651 gig: ' + JSON.stringify(gig), LOG.info, 'color:inherit', gig)
                if (opcao == 'eumesmo'){
                    let linha = definirLinha(consulta)
                    if (!linha) continue
                    gig.responsavel = normalizar(document.querySelector('pje-cabecalho-perfil .nome-usuario')?.textContent)
                    await removerDoEscaninhoEInserirGigs(numeroProcesso, gig, consulta, false)
                }
                if (opcao == 'remover'){
                    let linha = definirLinha(consulta)
                    if (!linha) continue
                    await removerDoEscaninhoEInserirGigs(numeroProcesso, null, consulta, false)
                }
                if (opcao == 'assistentes'){
                    let linha = definirLinha(consulta)
                    if (!linha) continue
                    let juiz = await escaninhoDefineJuiz(idProcesso, numeroProcesso) || ''
                    if (!juiz) {
                        resultados += [numeroProcesso, 'Não foi encontrado juiz'].join('\t') + '\n'
                        continue
                    }
                    let juizLinha = tabela.find(d => normalizar(d).includes(normalizar(juiz))) || ''
                    if(!juizLinha) continue
                    let responsavel = juizLinha.split(',')[1].trim() || ''
                    if(!responsavel) {
                        resultados += [numeroProcesso, 'Não foi possível identificar o responsável'].join('\t') + '\n'
                        continue
                    }
                    gig.responsavel = responsavel
                    await removerDoEscaninhoEInserirGigs(numeroProcesso, gig, consulta, false)
                }
                if (opcao == 'secretarios'){
                    let linha = definirLinha(consulta)
                    if (!linha) continue
                    let juiz = await escaninhoDefineJuiz(idProcesso, numeroProcesso) || ''
                    if (!juiz) {
                        resultados += [numeroProcesso, 'Não foi encontrado juiz'].join('\t') + '\n'
                        continue
                    }
                    let juizLinha = tabela.find(d => normalizar(d).includes(normalizar(juiz))) || ''
                    if(!juizLinha) continue
                    let responsavel = juizLinha.split(',')[1].trim() || ''
                    if(!responsavel) {
                        resultados += [numeroProcesso, 'Não foi possível identificar o responsável'].join('\t') + '\n'
                        continue
                    }
                    gig.responsavel = responsavel
                    await removerDoEscaninhoEInserirGigs(numeroProcesso, gig, consulta, false)
                }
                if (opcao == 'apoio'){
                    let linha = definirLinha(consulta)
                    if (!linha) continue
                    let anoProcesso = numeroProcesso.slice(11, 15)
                    let final = Number(anoProcesso) < 2010 ? numeroProcesso.slice(4, 5) : numeroProcesso.slice(6, 7)
                    let linhaApoio = tabela.find(d => normalizar(d).includes(String(final))) || ''
                    if(!linhaApoio) continue
                    let responsavel = linhaApoio.split(',')[0].trim() || ''
                    gig.responsavel = responsavel
                    if(!responsavel) {
                        resultados += [numeroProcesso, 'Não foi possível identificar o responsável'].join('\t') + '\n'
                        continue
                    }
                    await removerDoEscaninhoEInserirGigs(numeroProcesso, gig, consulta, false)
                }
                if (!gig.responsavel){
                    gig.responsavel = ''
                }
                let opcaoResultado = opcoes.find(d => d.label == opcao)?.escolha || 'Nenhuma ação'
                if (i == 1){
                    resultados += ['Número do Processo', 'Marcação'].join('\t') + '\n'
                }
                resultados += [numeroProcesso, opcaoResultado].join('\t') + '\n'
            }
            return resultados
            function definirTipoDePrazo(entrada, dataHoraAudiencia = null, dataJuntada = null){
                let prazo = {}
                entrada = String(entrada)
                if (entrada.match(/\d{2}\/\d{2}\/\d{4}/)){
                    prazo.label = 'dataPrazo'
                    prazo.valor = entrada
                    return prazo
                }
                if (entrada == 'dataaudiencia' && !!dataHoraAudiencia){
                    prazo.label = 'dataPrazo'
                    prazo.valor = new Date(dataHoraAudiencia).toLocaleDateString() || new Date().toLocaleDateString()
                    return prazo
                }
                //if (entrada == 'datapeticao' && !!dataJuntada){
                //    prazo.label = 'dataPrazo'
                //    prazo.valor = new Date(dataJuntada).toLocaleDateString() || new Date().toLocaleDateString()
                //    return prazo
                //}
                if(entrada == 0){
                    prazo.label = 'hoje'
                    prazo.valor = true
                    return prazo
                }
                if (entrada.match(/\d+/)){
                    prazo.label = 'dias'
                    prazo.valor = entrada
                    return prazo
                }
                prazo.label = 'dataPrazo'
                prazo.valor = new Date().toLocaleDateString()
                return prazo
            }
            //alert('oi')
        }

    }
    async function removePeticoesPorTipoOuTitulo(idInput){
        let termos = document.getElementById(idInput).value || null
        if (!termos) {
            rota_avisoObrigatorio('Não foram informados termos para pesquisa', 5)
            return
        }
        await armazenar({[idInput]: termos})
        let termosArray = termos.split(',').map(d=> normalizar(d?.trim()))
        percorrePeticoes({rechamada: false, funcao: 'porTipoOuTitulo',parametros: termosArray})
    }
    async function removePeticoesAnalisadas(ancestral){
        let checks = [...document.getElementById(ancestral).querySelectorAll('div [data-marcado]')]
        let parametros = checks.filter(d => d?.dataset?.marcado == 1).map(d=> d?.dataset?.tipo)
        percorrePeticoes({rechamada: false, funcao: 'analisadas', parametros})
    }
    async function percorrePeticoes({rechamada, funcao, parametros}) {
        let idDivMenu = idg('escaninho', 'menu')
        let top = document.getElementById(idDivMenu)?.style.top
        let remover = document.getElementById(idDivMenu)?.remove()
        let idExecucao = idg('escaninho', 'execucao')
        let removerExecucao = document.getElementById(idExecucao)?.remove()
        let divExecucao = criaDivCentralPadrao({
            id: idExecucao,
            titulo: 'Executando',
            largura: '40%',
            altura: 'auto',
            top
        })
        let texto = criaSubTitulo({
            id: idg('escaninho', 'placar'),
            texto: 'Aguarde a conclusão da tarefa. Iniciando.',
            ancestral: divExecucao.corpo.id
        })
        criaBotaoLaranja({
            id: idg('escaninho', 'parar'),
            texto: 'Parar.',
            ancestral: divExecucao.corpo.id,
            acao: () => {
                parar = true
                return
            }
        })
        let armazenamento = await obterArmazenamento(idDivMenu) || {}
        if (!rechamada) await garanteOrdem()
        let ultimaData = armazenamento?.idDivMenu || ''
        let interceptados = interceptador_ler('peticoes_juntadas') || null
        if (!interceptados){
            rota_avisoObrigatorio('Ocorreu um erro. Atualize a página e tente novamente.', 5)
            return
        }
        let peticoes = interceptados?.resultado || []
        if (!peticoes.length){
            if (document.querySelector('table .mensagem-vazio')){
                finaliza(buscados)
                buscados = []
                return
            }
            rota_avisoObrigatorio('Ocorreu um erro. Atualize a página e tente novamente.', 5)
            return
        }
        let removeuAlgum = false
        let mFuncoes = {
            porTipoOuTitulo,
            analisadas,
            gigPorTituloOuTipo
        }
        let i = 0
        for (let peticao of peticoes){
            if(parar || !document.getElementById(idExecucao)){
                finaliza(buscados)
                buscados = []
                parar = false
                return   
            }
            atualizaPlacar('Buscando ' + i++ + ' de ' + peticoes.length)
            let {numeroProcesso, idProcesso, dataJuntada, idDocumento} = peticao
            if(dataJuntada < ultimaData) continue
            let {removeuTF, dadosBuscados} = await mFuncoes[funcao]({parametros, peticao})
            if (removeuTF) removeuAlgum = true
            if (dadosBuscados) buscados.push(dadosBuscados)
            await armazenar({[idDivMenu]: dataJuntada})
        }
        if (JSON.stringify(interceptador_ler('peticoes_juntadas')) === JSON.stringify(interceptados)) {
            definePagina(interceptados?.qtdPaginas, removeuAlgum)
        } else {
            
            percorrePeticoes({rechamada: true, funcao, parametros})
        }

        

        async function analisadas({parametros, peticao}) {
            console.log('%c[Rota PJE]%c parametros: ' + JSON.stringify(parametros), LOG.info, 'color:inherit')
            let {numeroProcesso, idProcesso, dataJuntada, idDocumento} = peticao
            let timeline = await buscarDocumentos(idProcesso) || []
            if (!timeline.length) return {removeuTF: false, dadosBuscados: null} 
            let remover = timeline.some(d => d?.data > dataJuntada &&
                parametros.some(c=> normalizar(d?.titulo).includes(c) || normalizar(d?.tipo).includes(c)) && 
                d?.usuarioInterno)
            let removeuTF = false
            if (remover){
                await removerDoEscaninhoEInserirGigs(numeroProcesso)
                removeuTF = true
            }
            let dadosBuscados = {
                numeroProcesso,
                idProcesso,
                idDocumento,
                dataJuntada: new Date(dataJuntada).toLocaleDateString('pt-BR'),
                removido: removeuTF? 'SIM' : 'NÃO'
            }
            return {removeuTF, dadosBuscados}
        }

        async function gigPorTituloOuTipo({parametros, peticao}){
            let {idProcesso, numeroProcesso, descricaoDocumento, nomeTipoProcessoDocumento, dataJuntada} = peticao
            console.log('%c[Rota PJE]%c peticao' + JSON.stringify(peticao), LOG.erro, 'color:inherit', peticao)
            console.log('%c[Rota PJE]%c parametros' + JSON.stringify(parametros), LOG.aviso, 'color:inherit', parametros)
            //return
            let removeuTF = false
            let gig = ''
            for (let tipo of parametros){
                if (tipo?.secao?.includes('secretarios')){
                    let dados = tipo?.inputs?.find(d => d.label.includes('dados')).valor.split(/\r?\n/) || []
                    let termos = tipo?.inputs?.find(d => d.label.includes('termos')).valor.split(/\r?\n/) || []
                    console.log('%c[Rota PJE]%c dados' + JSON.stringify(dados), LOG.aviso, 'color:inherit', dados)
                    console.log('%c[Rota PJE]%c termos' + JSON.stringify(termos), LOG.aviso, 'color:inherit', termos)
                    //return
                    if (dados.length && termos.length) {
                        for(let linha of termos){
                            let celula = linha.split(',') || []
                            if (!celula.length) continue
                            if (
                                normalizar(descricaoDocumento).includes(normalizar(celula[0]).trim()) || 
                                normalizar(nomeTipoProcessoDocumento).includes(normalizar(celula[0]).trim())
                            ){
                                if(!celula[1] || !celula[2]) continue
                                let juiz = await escaninhoDefineJuiz(idProcesso, numeroProcesso) || ''
                                if (!juiz) continue
                                let juizLinha = dados.find(d => normalizar(d).includes(normalizar(juiz))) || ''
                                if(!juizLinha) continue
                                let responsavel = juizLinha.split(',')[1].trim() || ''
                                if(!responsavel) continue
                                let tipoAtividade = celula[1].trim()
                                let dataPrazo = /\d\d\/\d\d\/\d\d\d\d/.test(celula[2].trim()) ? celula[2].trim() : null
                                console.log('%c[Rota PJE]%c dataPrazo' + JSON.stringify(dataPrazo), LOG.info, 'color:inherit')
                                let hoje = Number(celula[2].trim()) == 0 ? true : false
                                console.log('%c[Rota PJE]%c hoje' + JSON.stringify(hoje), LOG.info, 'color:inherit')
                                let dias = !dataPrazo && !hoje && !!Number(celula[2].trim()) ? celula[2].trim() : null
                                console.log('%c[Rota PJE]%c dias' + JSON.stringify(dias), LOG.info, 'color:inherit')
                                let observacao = 'Petição de ' + new Date(dataJuntada).toLocaleDateString() + ': ' + descricaoDocumento
                                let sucesso = await removerDoEscaninhoEInserirGigs(numeroProcesso, {responsavel, tipoAtividade, dias, observacao, dataPrazo, hoje, dias})
                                if (sucesso) {
                                    removeuTF = true
                                    gig = tipoAtividade + ' - ' + observacao
                                }
                                
                            }
                        }
                    }
                }
                if (tipo?.secao?.includes('assistentes')){
                    let dados = tipo?.inputs?.find(d => d.label.includes('dados')).valor.split(/\r?\n/) || []
                    let termos = tipo?.inputs?.find(d => d.label.includes('termos')).valor.split(/\r?\n/) || []
                    if (dados.length && termos.length) {
                        for(let linha of termos){
                            let celula = linha.split(',') || []
                            if (!celula.length) continue
                            if (
                                normalizar(descricaoDocumento).includes(normalizar(celula[0]).trim()) || 
                                normalizar(nomeTipoProcessoDocumento).includes(normalizar(celula[0]).trim())
                            ){
                                if(!celula[1] || !celula[2]) continue
                                let juiz = await escaninhoDefineJuiz(idProcesso, numeroProcesso) || ''
                                if (!juiz) continue
                                let juizLinha = dados.find(d => normalizar(d).includes(normalizar(juiz))) || ''
                                if(!juizLinha) continue
                                let responsavel = juizLinha.split(',')[1].trim() || ''
                                if(!responsavel) continue
                                let tipoAtividade = celula[1].trim()
                                let dataPrazo = /\d\d\/\d\d\/\d\d\d\d/.test(celula[2].trim()) ? celula[2].trim() : null
                                let hoje = Number(celula[2].trim()) == 0 ? true : false
                                let dias = !dataPrazo && !hoje && !!Number(celula[2].trim()) ? celula[2].trim() : null
                                let observacao = 'Petição de ' + new Date(dataJuntada).toLocaleDateString() + ': ' + descricaoDocumento
                                let sucesso = await removerDoEscaninhoEInserirGigs(numeroProcesso, {responsavel, tipoAtividade, dias, observacao, dataPrazo, hoje, dias})
                                if (sucesso) {
                                    removeuTF = true
                                    gig = tipoAtividade + ' - ' + observacao
                                }
                            }
                        }
                    }
                }
                if (tipo?.secao?.includes('apoio')){
                    let dados = tipo?.inputs?.find(d => d.label.includes('dados')).valor.split(/\r?\n/) || []
                    let termos = tipo?.inputs?.find(d => d.label.includes('termos')).valor.split(/\r?\n/) || []
                    if (dados.length && termos.length) {
                        for(let linha of termos){
                            let celula = linha.split(',') || []
                            if (!celula.length) continue
                            if (
                                normalizar(descricaoDocumento).includes(normalizar(celula[0]).trim()) || 
                                normalizar(nomeTipoProcessoDocumento).includes(normalizar(celula[0]).trim())
                            ){
                                if(!celula[1] || !celula[2]) continue
                                let anoProcesso = numeroProcesso.slice(11, 15)
                                let final = Number(anoProcesso) < 2010 ? numeroProcesso.slice(4, 5) : numeroProcesso.slice(6, 7)
                                let linhaApoio = dados.find(d => normalizar(d).includes(String(final))) || ''
                                if(!linhaApoio) continue
                                let responsavel = linhaApoio.split(',')[0].trim() || ''
                                if(!responsavel) continue
                                let tipoAtividade = celula[1].trim()
                                let dataPrazo = /\d\d\/\d\d\/\d\d\d\d/.test(celula[2].trim()) ? celula[2].trim() : null
                                let hoje = Number(celula[2].trim()) == 0 ? true : false
                                let dias = !dataPrazo && !hoje && !!Number(celula[2].trim()) ? celula[2].trim() : null
                                let observacao = 'Petição de ' + new Date(dataJuntada).toLocaleDateString() + ': ' + descricaoDocumento
                                let sucesso = await removerDoEscaninhoEInserirGigs(numeroProcesso, {responsavel, tipoAtividade, dias, observacao, dataPrazo, hoje, dias})
                                if (sucesso) {
                                    removeuTF = true
                                    gig = tipoAtividade + ' - ' + observacao
                                }
                            }
                        }
                    }
                }
            }
            return {removeuTF, dadosBuscados:{idProcesso, numeroProcesso, descricaoDocumento, nomeTipoProcessoDocumento, dataJuntada, removido: removeuTF ? 'SIM' : 'NÃO', gig}}
            //alert (JSON.stringify(parametros))
        }
        

        async function porTipoOuTitulo({parametros, peticao}) {
            let {descricaoDocumento, nomeTipoProcessoDocumento, numeroProcesso, dataJuntada} = peticao
            if(!parametros.length) return {removeuTF: false, dadosBuscados: null}
            if (parametros.some(t=> normalizar(descricaoDocumento).includes(t) || normalizar(nomeTipoProcessoDocumento).includes(t))){
                await removerDoEscaninhoEInserirGigs(numeroProcesso)
                let dadosBuscados = {numeroProcesso, dataJuntada: new Date(dataJuntada).toLocaleDateString('pt-BR'), descricaoDocumento, nomeTipoProcessoDocumento}
                return {removeuTF: true, dadosBuscados}
            }
            return {removeuTF: false, dadosBuscados: null}
        }
        
        async function garanteOrdem(){
            if (document.querySelector('.total-registros').textContent.trim() == '1 - 1 de 1') return
            let botaoApos = [...document.querySelectorAll('table th')].find(t => normalizar(t.textContent).includes('data de juntada'))
            let ordenacao = !!botaoApos.querySelector('[aria-label^="Ordenação ascendente"]')// || false
            console.log('%c[Rota PJE]%c ordenacao' + JSON.stringify(ordenacao), LOG.aviso, 'color:inherit')
            //return
            if (ordenacao){
                return
            }
            let interceptados = interceptador_ler('peticoes_juntadas')
            await aguardarElemento('table th')
            let botaoOrdena = [...document.querySelectorAll('table th')].find(t => normalizar(t.textContent).includes('data de juntada'))
            clicar(botaoOrdena)
            await suspender()
            while(JSON.stringify(interceptados) === JSON.stringify(interceptador_ler('peticoes_juntadas'))){
                await suspender()
            }
            garanteOrdem()
        }

        function finaliza(buscados){
            atualizaPlacar('Finalizando...')
            let i = 0
            let resultado = buscados.map(d => {
                let cabecalho = Object.keys(d).map(d => d).join('\t')
                i++
                let linha = Object.values(d).map(d => d).join('\t')
                return (i == 1? (cabecalho + '\n' + linha) : linha)
            }).join('\n')
            let nomeArquivo = 'RelatórioEscaninho' + Date.now() + '.txt'
            _baixarArquivo(resultado, nomeArquivo, 'text/plain')
            let remover = document.getElementById(idg('escaninho', 'execucao'))?.remove()
            rota_avisoObrigatorio('Um arquivo foi baixado contendo o relatório desta atividade', 5)
            escaninhoMenu()
        }

        async function definePagina(paginas, removeuAlgum = false){
            atualizaPlacar('Próxima página...')
            if (Number(document.querySelector('pje-paginador mat-select').textContent) >= paginas && !removeuAlgum) {
                finaliza(buscados)
                buscados = []
                return
            } else {
                let interceptarAgora = interceptador_ler('peticoes_juntadas')
                clicar('pje-paginador button[aria-label="Próximo"]')
                let i = 0
                while(JSON.stringify(interceptarAgora) === JSON.stringify(interceptador_ler('peticoes_juntadas'))){
                    await suspender()
                    i++
                    if (i === 20){
                        finaliza(buscados)
                        buscados = []
                        return
                    }
                    //definePagina(interceptados?.qtdPaginas, true)
                }
                await suspender()
                percorrePeticoes({rechamada: true, funcao, parametros})
                return
            }
        }
        
        
    }

    async function escaninhoDefineJuiz(idProcesso, numeroProcesso) {
        let secoes = ['CON1', 'CON2']
        let simetriaTF = secoes.some(d=> document.querySelector('.papel-usuario')?.textContent.includes(d))
        let juiz = simetriaTF ? await defineJuizSimetria(idProcesso) || '' : false
        if (!juiz){
            let historico = await buscarHistoricoDeslocamentos(idProcesso) || []
            let vara = historico
                .find(h => h?.orgaoJulgadorOrigem?.descricao?.includes('Vara do Trabalho'))
                ?.orgaoJulgadorOrigem?.descricao || ''
            juiz = await defineJuizPlanilha(vara, numeroProcesso) || ''
        }
        return juiz
    }

    function atualizaPlacar(texto){
        let placar = document.getElementById(idg('escaninho', 'placar'))
        console.log('%c[Rota PJE]%c placar' + JSON.stringify(placar), LOG.aviso, 'color:inherit', placar)
        console.log('%c[Rota PJE]%c texto' + JSON.stringify(texto), LOG.aviso, 'color:inherit')
        if (!placar) return
        placar.textContent = texto
        return
    }
    function definirLinha(dados){
        console.log('%c[Rota PJE]%c dados' + JSON.stringify(dados), LOG.aviso, 'color:inherit', dados)
        let {numeroProcesso, tarefa, faseProcessual, nomeTipoProcessoDocumento, descricaoDocumento, dataJuntada} = dados
        let linha = [...document.querySelectorAll('tr')].find(l => l.textContent.includes(numeroProcesso) &&
            l.textContent.includes(tarefa) &&
            l.textContent.includes(faseProcessual) &&
            l.textContent.includes(nomeTipoProcessoDocumento.trim()) &&
            l.textContent.includes(descricaoDocumento.trim()) &&
            l.textContent.includes(new Date(dataJuntada).toLocaleDateString())
        ) || null
        return linha
    }

    async function removerDoEscaninhoEInserirGigs(numeroProcesso, gig = null, dadosLinha = null, placar = true) {
        console.log('%c[Rota PJE]%c gig532' + JSON.stringify(numeroProcesso), LOG.aviso, 'color:inherit')
        //return
        let linha = dadosLinha ? definirLinha(dadosLinha) : null
        let mensagemPlacar = gig ? 'Inserindo GIGs e removendo do escaninho...' : 'Removendo do escaninho...'
        if (placar) atualizaPlacar(mensagemPlacar)
        await aguardarElemento('pje-data-table tr')
        let linhas = !linha ? [...document.querySelectorAll('pje-data-table tr')] : []
        let linhaExcluir = linha ? linha : linhas.find(l => l.textContent.includes(numeroProcesso)) || null
        if (!linhaExcluir) return null
        let gigMenu = null
        if (gig){
            await aguardarElemento('pje-gigs-icone-gigs button')
            let gigClicar = linha ? linha.querySelector('pje-gigs-icone-gigs button') : document.querySelector('pje-gigs-icone-gigs button[aria-label*="' + numeroProcesso + '"]')
            if (!gigClicar) return null
            clicar(gigClicar)
            await aguardarElemento('pje-gigs-lista-atividades #nova-atividade')
            gigMenu = document.querySelector('pje-gigs-ficha-processo')
            let gigSucesso = await inserirGigsNaTelaDeDetalhesDoProcesso(gig)
            let botoes = [...document.querySelectorAll('pje-gigs-cadastro-atividades mat-card-actions button')]
            let texto = gigSucesso ? 'Salvar' : 'Cancelar'
            await suspender(500)
            clicar(botoes.find(b => normalizar(b.textContent).includes(normalizar(texto))))
            await suspender(500)
            await aguardarElemento('pje-gigs-dados-processo button[mattooltip="Fechar"]')
            await suspender(500)
            clicar('pje-gigs-dados-processo button[mattooltip="Fechar"]')
            if (!gigSucesso) return null
        }
        while(gigMenu && gigMenu.isConnected){
            await suspender(500)
        }
        console.log('%c[Rota PJE]%c 1000' + JSON.stringify(1000), LOG.aviso, 'color:inherit')
        await aguardarElemento('button[name$="' + numeroProcesso + '"]')
        console.log('%c[Rota PJE]%c 1002' + JSON.stringify(1002), LOG.aviso, 'color:inherit')
        await suspender()
        let linhaRemover = dadosLinha ? definirLinha(dadosLinha) : null
        let seletorBotao = linhaRemover ? linhaRemover.querySelector('button[mattooltip^="Remover"]') : 'button[name$="' + numeroProcesso + '"]'
        await suspender()
        if (typeof seletorBotao === 'string'){
            document.querySelector(seletorBotao)?.click()
        } else {
            seletorBotao?.click()
        }
        await aguardarElemento('.mat-dialog-actions button')
        await suspender()
        let botao = [...document.querySelectorAll('.mat-dialog-actions button')].find(b => b.textContent == 'Sim')
        clicar(botao)
        while (botao.isConnected){
            await suspender()
        }
        return true
    }
}
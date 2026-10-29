async function despachosPreferidos(ancestral){
    let idBotaoConfigura = id('fita_superior', 'despachosPreferidos')
    document.getElementById(idBotaoConfigura)?.remove()
    let botaoConfigura = criaBotaoAzul({
        id: idBotaoConfigura,
        texto: 'Cadastrar despachos mais usados',
        ancestral,
        acao: () => cadastrarDespachosPreferidos()
    })
    let tooltip = criaTooltip({
        id: idBotaoConfigura + '_tooltip',
        texto: 'Cria botões com os despachos mais usados, para escolher com um clique.',
        elemento: idBotaoConfigura
    })
    estiloBotaoFitaSuperior(botaoConfigura)
    let despachos = await obterArmazenamento(idBotaoConfigura) || {}
    if (despachos[idBotaoConfigura] && despachos[idBotaoConfigura].length) {
        let despachosArmazenados = despachos[idBotaoConfigura]
        let i = 0
        for (let despacho of despachosArmazenados){
            let funcoes = [
                'criaBotaoLaranja',
                'criaBotaoAzul'
            ]
            let mFuncoes = {
                criaBotaoAzul,
                criaBotaoLaranja
            }
            console.log('%c[Rota PJE]%c mFuncoes[funcoes[i % 2]]' + JSON.stringify(mFuncoes[funcoes[(i % 2)]]), LOG.info, 'color:inherit')
            let funcao = funcoes[i % 2]
            let botao = mFuncoes[funcao]({
                id: idBotaoConfigura + '_botaoDespacho_' + i,
                ancestral: 'rotapje_fita_superior',
                texto: despacho?.textoBotao || despacho?.modelo,
                acao: () => inserirModelo(despacho?.modelo)
            })
            criaTooltip({
                id: idBotaoConfigura + '_botaoDespacho_tooltip_' + i,
                texto: 'Inserir modelo ' + despacho?.modelo + ' no editor.',
                elemento: idBotaoConfigura + '_botaoDespacho_' + i
            })
            estiloBotaoFitaSuperior(botao)
            i++
        }
    }
    async function cadastrarDespachosPreferidos(){
        let despachos = await obterArmazenamento(idBotaoConfigura) || {}
        let divId = id('despachosPreferidos', 'cadastro')
        let remover = document.getElementById(divId)?.remove()
        let div = criaDiv({
            id: divId,
            ancestral: document.body
        })
        formataDiv(div, 'branco', '50%', '50%')
        let divCabecalho = criaDiv({
            id: divId + '_cabecalho',
            ancestral: divId,
            rowColumn: 'row-reverse'
        })
        divCabecalho.style.marginBottom = '0px'
        criaBotaoFechar({
            id: divId + '_botaoFechar',
            ancestral: divId + '_cabecalho',
            elementoFechar: divId,
        })
        let titulo = criaTitulo({
            id: divId + '_titulo',
            ancestral: divId + '_cabecalho',
            texto: 'Cadastre seus despachos mais usados'
        })
        titulo.style.width = '100%'
        let textArea = criaInputAnotacao({
            id: divId + '_input',
            textoEmCima: 'Cadastre seus despachos mais usados, um por linha, com o nome a buscar e o título do botão (opcional), separados por vírgula. DICA: salve seu modelo acrescentando o número do ID do modelo (disponível na tela de edição de modelos), e use o número do ID no nome a buscar.',
            ancestral: divId
        })
        textArea.style.width = 'auto'
        textArea.style.height = '80%'
        textArea.textarea.style.height = '100%'
        textArea.textarea.placeholder = 'Ex:\nDesigna aud instrução, INSTRUÇÃO\nNomeação de perito, perito\nSentença de liquidação - órgão público'
        if (despachos[idBotaoConfigura] && despachos[idBotaoConfigura].length){
            let texto = despachos[idBotaoConfigura].map(d => d?.modelo + ', ' + d?.textoBotao).join('\n')
            textArea.textarea.value = texto
        }
        let divRodape = criaDiv({
            id: divId + '_rodape',
            ancestral: divId,
            rowColumn: 'row-reverse'
        })
        divRodape.style.marginBottom = '0px'
        criaBotaoAzul({
            id: divId + '_botaoSalvar',
            texto: 'Salvar alterações',
            ancestral: divId + '_rodape',
            acao: () => salvarAlteracoes(divId + '_input')
        })

    }
    async function salvarAlteracoes(elemento){
        let despachos = await obterArmazenamento(idBotaoConfigura) || {}
        let despachosCadastrados = despachos[idBotaoConfigura] || []
        let despachosNovos = tratarDados(document.getElementById(elemento).value)
        await armazenar({[idBotaoConfigura]: despachosNovos?.despachos})
        if(despachosNovos?.erros?.length){
            rota_avisoObrigatorio(
                `Os seguintes despachos não foram cadastrados, pois foi encontrado erro na formatação (vírgula ausente, mais de uma vírgula, etc.):\n` +
                despachosNovos?.erros.join('\n'), 8
            )
        } else {
            rota_avisoObrigatorio('Cadastro efetuado com sucesso', 8)
        }
        criaFitaSuperior()
        return
    }
    function tratarDados(texto){
        let linhas = texto.split(/\r?\n/)
        let despachos = []
        let erros = []
        for (let linha of linhas){
            if (!linha.length) continue
            let dados = linha.split(',')
            console.log('%c[Rota PJE]%c dados' + JSON.stringify(dados), LOG.aviso, 'color:inherit')
            if (dados.length != 1 && dados.length != 2){
                if (linha.match(/[A-Za-zÀ-ÿ\s]+/)?.[0]) erros.push(linha)
                continue
            }
            despachos.push({
                modelo: dados[0].trim(), 
                textoBotao: !!dados[1] ? dados[1].trim() : dados[0].trim()
            })
        }
        return {despachos, erros}
    }
}


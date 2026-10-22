/*
pje-gigs-cadastro-atividades
#tipoAtividade
document.querySelectorAll('mat-radio-group .mat-radio-checked')] => indica qual está checado
#diasUteis
#diasCorridos
dial.querySelector('#dataInicio').value
dial.querySelector('#dataPrazo').value
dial.querySelector('#dias').value
dial.querySelector('#responsavel').value
dial.querySelector('#observacao').value
dial.querySelector('#destaque.mat-checkbox-checked') => checado
*/

async function favoritarGigs() {
    let janela = confereJanela(JANELA.detalhes)
    if (!janela) return
    let idBotao = id('favoritarGig') 
    await aguardarElemento('pje-gigs-cadastro-atividades')
    await suspender(100)
    await aguardarElemento('pje-gigs-cadastro-atividades mat-card-actions')
    let remover = [...document.querySelectorAll('#' + idBotao)].map(d=> d.remove())
    let botao = criaBotaoLaranja({
        id: idBotao,
        texto: 'ROTA - favoritar este GIG',
        ancestral: 'pje-gigs-cadastro-atividades mat-card-actions',
        acao: () => salvarComoFavorito(idBotao)
    })
    botao.type = 'button'
    async function salvarComoFavorito(idBotao){
        let div = criaDiv({
            id: idBotao + '_div',
            ancestral: document.body
        })
        formataDiv(div, 'branco', '25%', 'auto')
        console.log('%c[Rota PJE]%c 41: ' + JSON.stringify(41), LOG.info, 'color:inherit')
        let cabecalho = criaDiv({
            id: idBotao + '_cabecalho',
            ancestral: idBotao + '_div',
            rowColumn: 'row-reverse'
        })
        console.log('%c[Rota PJE]%c 46: ' + JSON.stringify(46), LOG.info, 'color:inherit')
        criaBotaoFechar({
            id: idBotao + '_fechar',
            ancestral: idBotao + '_cabecalho',
            elementoFechar: idBotao + '_div'
        })
        console.log('%c[Rota PJE]%c 53: ' + JSON.stringify(53), LOG.info, 'color:inherit')
        let titulo = criaTitulo({
            id: idBotao + '_fechar',
            ancestral: idBotao + '_cabecalho',
            texto: 'Salvar este GIG como favorito'
        })
        titulo.style.width = '100%'
        console.log('%c[Rota PJE]%c 59: ' + JSON.stringify(59), LOG.info, 'color:inherit')
        let corpo = criaDiv({
            id: idBotao + '_corpo',
            ancestral: idBotao + '_div',
        })
        console.log('%c[Rota PJE]%c 64: ' + JSON.stringify(60), LOG.info, 'color:inherit')
        let input = criaInput({
            id: idBotao + '_input',
            textoEmCima: 'Dê um nome para o botão',
            placeholder: 'Ex: Audiência - Fulano de tal, CON - PERÍCIAS, etc.',
            ancestral: idBotao + '_corpo'
        })
        console.log('%c[Rota PJE]%c 70: ' + JSON.stringify(70), LOG.info, 'color:inherit')
        let botoesAcoes = criaDiv({
            id: idBotao + '_botoesAcoes',
            ancestral: idBotao + '_corpo',
            rowColumn: 'row'
        })
        console.log('%c[Rota PJE]%c 76: ' + JSON.stringify(76), LOG.info, 'color:inherit')
        let dias = document.querySelector('pje-gigs-cadastro-atividades #dias').value
        let dataPrazo = document.querySelector('pje-gigs-cadastro-atividades #dataPrazo').value
        let dataInicio = document.querySelector('pje-gigs-cadastro-atividades #dataInicio').value
        if (!!dias & (dias != 0 || dataPrazo != dataInicio)){
            let botaoDias = criaBotaoAzul({
                id: idBotao + '_dias',
                ancestral: idBotao + '_botoesAcoes',
                texto: 'Salvar utilizando ' + document.querySelector('pje-gigs-cadastro-atividades #dias').value + ' dias',
                acao: () => armazenarFavoritos(idBotao, 'dias')
            })
            botaoDias.style.width = '50%'
        } 
        if (!!dataPrazo){
            let botaoDataPrazo = criaBotaoAzul({
                id: idBotao + '_dataPrazo',
                ancestral: idBotao + '_botoesAcoes',
                texto: 'Salvar utilizando data certa: ' + document.querySelector('pje-gigs-cadastro-atividades #dataPrazo').value,
                acao: () => armazenarFavoritos(idBotao, 'dataPrazo')
            })
            botaoDataPrazo.style.width = '50%'
        }
        if (dias === 0 || ((!!dataPrazo && !!dataInicio) && (dataPrazo == dataInicio))){
            let botaoHoje = criaBotaoAzul({
                id: idBotao + '_hoje',
                ancestral: idBotao + '_botoesAcoes',
                texto: 'Salvar com prazo zero (data de hoje).',
                acao: () => armazenarFavoritos(idBotao, 'hoje')
            })
            botaoDataPrazo.style.width = '50%'
        }
        if(!dataPrazo && !dias){
            let botaoSalvar = criaBotaoAzul({
                id: idBotao + '_botaoSalvar',
                ancestral: idBotao + '_botoesAcoes',
                texto: 'Salvar sem prazo.',
                acao: () => armazenarFavoritos(idBotao, null)
            })
        }
        
        console.log('%c[Rota PJE]%c 90: ' + JSON.stringify(90), LOG.info, 'color:inherit')
        
        async function armazenarFavoritos(idBotao, tipo) {
            let nomeBotao = document.getElementById(idBotao + '_input').value || null
            if (!nomeBotao){
                rota_avisoObrigatorio('Dê um nome ao botão para salvar', 5)
                return
            }
            let armazenamento = await obterArmazenamento(idBotao)
            let gigsSalvos = armazenamento?.[idBotao] || []
            if(gigsSalvos.some(d => d?.nomeBotao == nomeBotao)){
                rota_avisoObrigatorio('Já existe um botão com esse nome.', 5)
                return
            }
            let dial = document.querySelector('pje-gigs-cadastro-atividades')
            let tipoAtividade = dial.querySelector('#tipoAtividade').value
            console.log('%c[Rota PJE]%c tipoAtividade: ' + JSON.stringify(tipoAtividade), LOG.info, 'color:inherit')
            let corridosOuUteis = dial.querySelector('mat-radio-group .mat-radio-checked').id
            let dataInicio = dial.querySelector('#dataInicio').value || ''
            let hoje = tipo == 'hoje' ? true : false
            let dataPrazo = tipo == 'dataPrazo' ? dial.querySelector('#dataPrazo').value : null
            let dias = tipo == 'dias'? dial.querySelector('#dias').value : null
            let responsavel = dial.querySelector('#responsavel').value
            let observacao = dial.querySelector('#observacao').value
            let destaque = dial.querySelector('#destaque.mat-checkbox-checked') ?? false
            let gig = {hoje, tipoAtividade, nomeBotao, corridosOuUteis, dataInicio, dataPrazo, dias, responsavel, observacao, destaque}
            gigsSalvos.push(gig)
            await armazenar({[idBotao]: gigsSalvos})
            document.getElementById(idBotao + '_corpo').replaceChildren()
            let salvo = criaSubTitulo({
                id: idBotao + '_salvo',
                ancestral: idBotao + '_corpo',
                texto: 'Salvo com sucesso'
            })
            criarBarraGigsFavoritos()
            await suspender(2000)
            let remover = document.getElementById(idBotao + '_div')?.remove()
        }
    }
    
}

async function criarBarraGigsFavoritos() {
    await aguardarElemento('pje-gigs-lista-atividades')
    let idGigBarra = id('gig', 'barra', 'favoritos')
    let gigsArmazenados = id('favoritarGig')
    let elementoInserirAntes = document.querySelector('pje-gigs-lista-atividades #lista-atividades')
    let armazenamento = await obterArmazenamento(gigsArmazenados)
    let botoes = armazenamento?.[gigsArmazenados] || []
    let remover = document.getElementById(idGigBarra)?.remove()
    let div = criaDiv({
        id: idGigBarra,
        ancestral: document.body
    })
    formataFitaSuperior(div)
    insereFitaSuperior(elementoInserirAntes, div)
    let botao = criaBotaoLaranja({
        id: idGigBarra + '_botao_excluir',
        ancestral: idGigBarra,
        texto: 'Configurar botões de GIGs favoritos',
        acao: () => configurarGigsFavoritos(botoes)
    })
    estiloBotaoFitaSuperior(botao)
    let mFuncoes = {
        criaBotaoLaranja,
        criaBotaoAzul
    }
    for (let i = 0; i < botoes.length; i++){
        let funcao = i % 2 == 0 ? 'criaBotaoAzul' : 'criaBotaoLaranja'
        let botao = botoes[i]
        let b = mFuncoes[funcao]({
            id: idGigBarra + '_' + i,
            texto: botao?.nomeBotao,
            ancestral: idGigBarra,
            acao: () => inserirGigsNaTelaDeDetalhesDoProcesso(botao)
        })
        estiloBotaoFitaSuperior(b)
    }

}

async function configurarGigsFavoritos(botoes) {
    let idDiv = id('gigsFavoritos', 'configurar')
    let remover = [...document.querySelectorAll('#' + idDiv)].map(d => d?.remove())
    let div = criaDivCentralPadrao({
        id: idDiv,
        largura: '30%',
        altura: '250px',
        titulo: 'Configurar GIGs favoritos'
    })
    div.style.gap = '0px'
    let input = criaInputAnotacao({
        id: idDiv + '_input',
        textoEmCima: 'Para excluir um botão, apague a linha com o nome do botão correspondente e clique em salvar.',
        ancestral: div?.corpo?.id
    })
    let alturaMaxima = div?.corpo.offsetHeight
    input.style.height = (alturaMaxima * 0.7) + 'px'
    let alturaMaximaInput = input.offsetHeight
    console.log('%c[Rota PJE]%c alturaMaxima: ' + JSON.stringify(alturaMaxima), LOG.info, 'color:inherit')
    input.textarea.style.height = alturaMaximaInput + 'px'
    input.textarea.style.overflowY = 'auto'
    input.textarea.style.boxSizing = 'border-box'
    let botao = criaBotaoAzul({
        id: idDiv + '_salvar',
        texto: 'Salvar',
        ancestral: div?.rodape?.id,
        acao: () => salvarAlteracoes(botoes)
    })
    input.textarea.value = botoes.map(d => d?.nomeBotao).join('\n')
    return
    async function salvarAlteracoes(botoes) {
        let input = document.getElementById(idDiv + '_input')
        let texto = input?.value
        let nomes = texto.split(/\r?\n/).filter(l => l.trim())
        console.log('%c[Rota PJE]%c nomes: ' + JSON.stringify(nomes), LOG.info, 'color:inherit')
        let botoesSalvar = botoes.filter(d=> nomes.some(c=> d?.nomeBotao == c))
        console.log('%c[Rota PJE]%c botoesSalvar: ' + JSON.stringify(botoesSalvar), LOG.info, 'color:inherit')
        await armazenar({[id('favoritarGig')]: botoesSalvar})
        criarBarraGigsFavoritos()
        input.value = 'Alterações salvas com sucesso'
        await suspender (3000)
        input.value = texto
        return
    }
}


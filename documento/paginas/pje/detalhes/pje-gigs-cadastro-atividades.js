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
    criarBarraGigsFavoritos(idBotao)
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
            ancestral: idBotao + '_div',
            rowColumn: 'row'
        })
        console.log('%c[Rota PJE]%c 76: ' + JSON.stringify(76), LOG.info, 'color:inherit')
        let botaoDias = criaBotaoAzul({
            id: idBotao + '_dias',
            ancestral: idBotao + '_botoesAcoes',
            texto: 'Salvar utilizando ' + document.querySelector('pje-gigs-cadastro-atividades #dias').value + ' dias',
            acao: () => armazenarFavoritos(idBotao, 'dias')
        })
        botaoDias.style.width = '50%'
        console.log('%c[Rota PJE]%c 77: ' + JSON.stringify(77), LOG.info, 'color:inherit')
        let botaoDataPrazo = criaBotaoAzul({
            id: idBotao + '_dataPrazo',
            ancestral: idBotao + '_botoesAcoes',
            texto: 'Salvar utilizando data certa: ' + document.querySelector('pje-gigs-cadastro-atividades #dataPrazo').value,
            acao: () => armazenarFavoritos(idBotao, 'dataPrazo')
        })
        botaoDataPrazo.style.width = '50%'
        console.log('%c[Rota PJE]%c 90: ' + JSON.stringify(90), LOG.info, 'color:inherit')
        
        async function armazenarFavoritos(idBotao, tipo) {
            let nomeBotao = document.getElementById(idBotao + '_input').value || null
            if (!nomeBotao){
                rota_avisoObrigatorio('Dê um nome ao botão para salvar', 5)
                return
            }
            let armazenamento = await obterArmazenamento(idBotao)
            console.log('%c[Rota PJE]%c armazenamento: ' + JSON.stringify(armazenamento), LOG.info, 'color:inherit')
            let gigsSalvos = armazenamento?.[idBotao] || []
            console.log('%c[Rota PJE]%c gigsSalvos: ' + JSON.stringify(gigsSalvos), LOG.info, 'color:inherit')
            let dial = document.querySelector('pje-gigs-cadastro-atividades')
            let corridosOuUteis = dial.querySelector('mat-radio-group .mat-radio-checked').id
            let dataInicio = dial.querySelector('#dataInicio').value || ''
            let dataPrazo = tipo == 'dataPrazo' ? dial.querySelector('#dataPrazo').value : null
            let dias = tipo == 'dias'? dial.querySelector('#dias').value : null
            let responsavel = dial.querySelector('#responsavel').value
            let observacao = dial.querySelector('#observacao').value
            let destaque = dial.querySelector('#destaque.mat-checkbox-checked') ?? false
            let gig = {nomeBotao, corridosOuUteis, dataInicio, dataPrazo, dias, responsavel, observacao, destaque}
            gigsSalvos.push(gig)
            await armazenar({[idBotao]: gigsSalvos})
        }
    }
    async function criarBarraGigsFavoritos(idBotao) {
        
    }
}

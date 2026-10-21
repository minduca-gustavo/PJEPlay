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

async function favoritarGigs(rechamada = true) {
    let janela = confereJanela(JANELA.detalhes)
    if (!janela) return
    //if (angular){
    //    criarBarraGigsFavoritos()
    //    return    
    //} 
    criarBarraGigsFavoritos()
    await aguardarElemento('pje-gigs-cadastro-atividades')
    await suspender(100)
    await aguardarElemento('pje-gigs-cadastro-atividades mat-card-actions')
    let idBotao = id('favoritarGig') 
    criaBotaoLaranja({
        id: idBotao,
        texto: 'ROTA - favoritar este GIG',
        ancestral: 'pje-gigs-cadastro-atividades mat-card-actions',
        acao: () => salvarComoFavorito(idBotao)
    })
    async function salvarComoFavorito(idBotao){
        let armazenamento = obterArmazenamento(idBotao)
        let gigsSalvos = armazenamento?.[idBotao] || null
        let dial = document.querySelector('pje-gigs-cadastro-atividades')
        let corridosOuUteis = dial.querySelector('mat-radio-group .mat-radio-checked').id
        let dataInicio = dial.querySelector('#dataInicio').value || ''
        let dataPrazo = dial.querySelector('#dataPrazo').value
        let dias = dial.querySelector('#dias').value
        let responsavel = dial.querySelector('#responsavel').value
        let observacao = dial.querySelector('#observacao').value
        let destaque = dial.querySelector('#destaque.mat-checkbox-checked') ?? false
        let gig = {dial, corridosOuUteis, dataInicio, dataPrazo, dias, responsavel, observacao, destaque}
        favoritarGigs(true)
        console.log('%c[Rota PJE]%c gig: ', LOG.info, 'color:inherit', gig)
    }
}

async function criarBarraGigsFavoritos() {
    
}
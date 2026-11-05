async function pautaAudienciasMeses(){
    let janela = confereJanela(JANELA.pautaAudiencias)
    if(!janela) return
    console.log('%c[Rota PJE]%c 4 audiências: ' + JSON.stringify(4), LOG.info, 'color:inherit')
    await aguardarElemento('pje-cabecalho-perfil .papel-usuario')
    let oj = document.querySelector('pje-cabecalho-perfil .papel-usuario')
    if (!oj.textContent.includes('CON1')) return
    let fitaId = idg('pautaAudiencias', 'meses')
    document.getElementById(fitaId)?.remove()
    let div = criaDiv({
        id: fitaId,
        ancestral: document.body
    })
    await aguardarElemento('pje-calendario-pauta-audiencia .filtros')
    let elementoAnterior = document.querySelector('pje-calendario-pauta-audiencia .filtros')
    formataFitaSuperior(div)
    insereFitaSuperior(elementoAnterior, div)
    let mesAgora = Number(mesAtual().split('/')[1])
    let somas = []
    for (let i = -4; i < 12; i++){
        somas.push(i)
    }
    let meses = somas.map(d => new Date().setMonth(mesAgora + d, 1)).map(d => new Date(d).toLocaleDateString())
    let i = 0
    for (let mes of meses){
        let array = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
        let numeroMes = mes.split('/')[1]
        let nomeMes = array[numeroMes - 1]
        let ano = mes.split('/')[2]
        let mFuncoes = {
            criaBotaoLaranja,
            criaBotaoAzul
        }
        let funcao = i % 2 == 0 ? 'criaBotaoAzul' : 'criaBotaoLaranja'
        let botao = mFuncoes[funcao]({
            id: idg('pautaAudiencias', 'meses', 'botao', JSON.stringify(i)),
            texto: nomeMes.toUpperCase() + '/' + ano,
            ancestral: fitaId,
            acao: () => irParaMes(ano, nomeMes)
        })
        estiloBotaoFitaSuperior(botao)
        i++
    }
    console.log('%c[Rota PJE]%c meses: ' + JSON.stringify(meses), LOG.info, 'color:inherit')
    async function irParaMes(ano, mes){
        await aguardarElemento('mat-datepicker-toggle button')
        await suspender(500)
        clicar('mat-datepicker-toggle button')
        await aguardarElemento('mat-multi-year-view tbody')
        await suspender(500)
        let anual = document.querySelector('mat-multi-year-view')
        let botaoAno = [...document.querySelectorAll('td button')].find(b => b.textContent.includes(ano))
        clicar(botaoAno)
        while(anual.isConnected){
            await suspender(1000)
            console.log('To aqui parado')
        }
        console.log('Passei')
        await aguardarElemento('.mat-calendar-body-label')
        await suspender (500)
        let botaoMes = [...document.querySelectorAll('td button')].find(b => normalizar(b.textContent).includes(mes.slice(0,3)))
        clicar(botaoMes)
    }
    function mesAtual(){
        let data = new Date().setHours(0,0,0,0)
        data = new Date(data).setDate(1)
        return new Date(data).toLocaleDateString()
    }
}
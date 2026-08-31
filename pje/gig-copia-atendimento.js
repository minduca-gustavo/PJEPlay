async function gig_copiaAtendimento(){
    let janela = confereJanela(JANELA.detalhes)
    if (!janela) return
    let botaoExcluir = await aguardarElemento('[id^=excluir-atividade]')
    criaBotaoCopiaAtendimento(botaoExcluir)
}
gig_copiaAtendimento()
function criaBotaoCopiaAtendimento(botao){
    console.log('%c[Rota PJE]%c botao: ' + JSON.stringify(botao), LOG.info, 'color:inherit', botao)
    let botaoCopia = criaTexto({
        id: id('copiaAtendimento'),
        texto: '📋',
        ancestral: '.actions'
    })
    botaoCopia.addEventListenter('click', ()=> alert('clicou'))
    botao.insertAdjacentElement('afterend', botaoCopia)
}
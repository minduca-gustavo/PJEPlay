async function comunicacoesProcessuaisMinutas(){
    let janela = confereJanela(JANELA.pec)
    if (!janela) return
    await aguardarElemento('pje-pec-dialogo-ato mat-card')
    await aguardarElemento('.area-conteudo[contenteditable]')
    await suspender()
    inserirTextoNoEditor('assinatura', '.')
    return
}
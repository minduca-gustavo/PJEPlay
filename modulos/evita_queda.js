async function evitaQueda() {
    if (!location.href.includes('jus.bre/pjekz')) return
    let name = 'rota_evitaQuedaAtivo'
    let evitaQuedaAtivo = await obterArmazenamento([name]).then(d => d?.[name])
    console.log('%c[Rota PJE]%c evitaQuedaAtivo: ' + JSON.stringify(evitaQuedaAtivo), LOG.aviso, 'color:inherit')
    let elemento = await aguardarElementoNovo(
        ['pjeMudancaDePerfil', 'pjeAcessoNegado'],
        {modo: 'ou', timeout: 3000}
    )
    if (elemento) window.location.reload()
    return
}

window.addEventListener('focus', function() {
    evitaQueda()
});

evitaQueda()
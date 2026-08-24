async function evitaQueda() {
    if (!location.href.includes('trt15.jus.br/pjekz')) return
    let name = 'rota_evitaQuedaAtivo'
    let evitaQuedaAtivo = await obterArmazenamento([name]).then(d => d?.[name])
    if (!evitaQuedaAtivo) return
    console.log('%c[Rota PJE]%c evitaQuedaAtivo: ' + JSON.stringify(evitaQuedaAtivo), LOG.aviso, 'color:inherit')
    let elemento = await aguardarElementoNovo(
        ['pjeMudancaDePerfil', 'pjeAcessoNegado'],
        {modo: 'ou', timeout: 30000}
    )
    if (!elemento) return
    if (elemento.textContent.includes('Acesso Negado') || elemento.textContent.includes('mudança de perfil')) window.location.reload()
    return
}

window.addEventListener('focus', function() {
    evitaQueda()
});

evitaQueda()
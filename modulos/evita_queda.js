async function evitaQueda() {
    if (!location.href.includes('trt15.jus.br')) return
    console.log('%c[Rota PJE]%c 3: tentando evitar queda.' + JSON.stringify(3), LOG.info, 'color:inherit')
    let oj = await obterArmazenamento('rotaDados_orgaos_julgadores')
    let timestamp = await obterArmazenamento('rota_evita_queda')
    console.log('%c[Rota PJE]%c oj 7: ' + JSON.stringify(oj?.rotaDados_orgaos_julgadores), LOG.rosa, 'color:inherit')
    console.log('%c[Rota PJE]%c timestamp 7: ' + JSON.stringify(timestamp?.rota_evita_queda), LOG.rosa, 'color:inherit')
}

evitaQueda()
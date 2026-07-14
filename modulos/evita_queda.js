async function evitaQueda() {
    let name = 'rota_evitaQuedaAtivo'
    let evitaQuedaAtivo = await obterArmazenamento([name])
    console.log('%c[Rota PJE]%c evitaQuedaAtivo eq3: ' + JSON.stringify(evitaQuedaAtivo?.rota_evitaQuedaAtivo), LOG.rosa, 'color:inherit')
    if (!location.href.includes('trt15.jus.br/pjekz') || !evitaQuedaAtivo /*|| location.href.includes('gigs/meu-painel')*/) return
    console.log('%c[Rota PJE]%c eq3: tentando evitar queda.' + JSON.stringify(3), LOG.info, 'color:inherit')
    let oj = await obterArmazenamento('rotaDados_orgaos_julgadores')
    let timestamp = await obterArmazenamento('rota_evita_queda')
    
    console.log('%c[Rota PJE]%c oj eq7: ' + JSON.stringify(oj?.rotaDados_orgaos_julgadores), LOG.rosa, 'color:inherit')
    console.log('%c[Rota PJE]%c timestamp eq7: ' + JSON.stringify(timestamp?.rota_evita_queda), LOG.rosa, 'color:inherit')
    let leitura = await interceptador_ler('evitaQuedaAtivo') || null
    if (leitura && leitura?.timestamp < timestamp?.rota_evita_queda && leitura?.oj?.id != oj?.rotaDados_orgaos_julgadores?.id){
        window.location.reload()
    } else {
        console.log('%c[Rota PJE]%c leitura eq12: ' + JSON.stringify(leitura), LOG.rosa, 'color:inherit')
        let content = JSON.stringify({oj: {id: oj?.rotaDados_orgaos_julgadores?.id, descricao: oj?.rotaDados_orgaos_julgadores?.descricao}, timestamp: timestamp?.rota_evita_queda})
        let nameMeta = name.replaceAll('_', '-')
        let meta = document.head.querySelector(`meta[name="${nameMeta}"]`)
        if(meta){
            meta.setAttribute('content', content)
        } else {
            meta = document.createElement('meta')
            meta.setAttribute('name', nameMeta)
            meta.setAttribute('content', content)
            document.head.appendChild(meta)
        }
    }
}

window.addEventListener('focus', function() {
    evitaQueda()
});

/*
browser.storage.onChanged.addListener(function ouvir(mudancas) {
    if (mudancas['rota_evita_queda']?.newValue) {
        browser.storage.onChanged.removeListener(ouvir)
//        window.location.reload()
        evitaQueda()
    }
})
*/
/*
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
        // janela foi ativada
        evitaQueda()
    }
});
*/
evitaQueda()
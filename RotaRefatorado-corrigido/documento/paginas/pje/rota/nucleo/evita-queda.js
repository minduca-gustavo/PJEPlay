// ============================================================
// nucleo/evita-queda.js
//
// Detecta a queda de sessão ("Acesso Negado" / "mudança de
// perfil") e recarrega a página. É a abordagem ATIVA do Rota.
//
// ── Alternativa, deliberadamente desligada ──────────────────
//
// O SISE resolve o mesmo problema pelo caminho oposto: em vez de
// reagir à queda, ele impede que a checagem de perfil chegue a
// rodar, bloqueando o listener de 'focus' da janela no mundo MAIN.
//
// As duas NÃO convivem: a checagem do SISE é justamente o que
// dispara o 'focus' que este arquivo escuta. Ligar as duas faz
// esta aqui nunca disparar.
//
// Fica registrada abaixo, comentada, para quem precisar trocar de
// estratégia. Ativar exige três passos: descomentar, criar o
// content script no mundo MAIN em document_start (ver
// documento/paginas/pje/requisicoes/xhr.js como molde) e desligar
// evitaQueda em Configurações → Comportamento do Rota.
//
// function rota_desabilitarChecagemDeMudancaDePerfil(){
//     if(CONFIGURACAO?.rota?.evitaQueda) return   // não acumula com o de cima
//     criar_script({
//         texto:      'window.__pje_desabilitarChecagemDeMudancaDePerfil = true',
//         ancestral:  document.documentElement,
//         temporario: true,
//     })
// }
//
// // …e, no mundo MAIN, antes de tudo:
// // let eventos = EventTarget.prototype.addEventListener
// // EventTarget.prototype.addEventListener = function(tipo, detector, opcoes){
// //     if(tipo === 'focus' && this === window && window.__pje_desabilitarChecagemDeMudancaDePerfil)
// //         return
// //     return eventos.call(this, tipo, detector, opcoes)
// // }
// ============================================================

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
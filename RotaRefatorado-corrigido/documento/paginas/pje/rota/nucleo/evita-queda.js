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

//async function evitaQueda() {
//    if (!location.href.includes('trt15.jus.br/pjekz')) return
//    let name = 'rota_evitaQuedaAtivo'
//    let tentativaNome = 'rota_evitaQuedaTentativa'
//    let tentativa = 0
//    let evitaQuedaAtivo = await obterArmazenamento([name]).then(d => d?.[name])
//    if (!evitaQuedaAtivo) return
//    console.log('%c[Rota PJE]%c evitaQuedaAtivo: ' + JSON.stringify(evitaQuedaAtivo), LOG.aviso, 'color:inherit')
//    let elemento = await aguardarElementoNovo(
//        ['pjeMudancaDePerfil', 'pjeAcessoNegado'],
//        {modo: 'ou', timeout: 30000}
//    )
//    if (!elemento) return
//    if (elemento.textContent.includes('Acesso Negado') || elemento.textContent.includes('mudança de perfil')) window.location.reload()
//    return
//}

let EVITA_QUEDA_MAX      = 3        // recargas seguidas antes de desistir
let EVITA_QUEDA_JANELA   = 60_000   // ms: intervalo que caracteriza "seguidas"
let EVITA_QUEDA_GUARDA   = 'rota_evitaQuedaGuarda'

function evitaQueda_lerGuarda() {
    try {
        return JSON.parse(sessionStorage.getItem(EVITA_QUEDA_GUARDA)) || {tentativas: 0, ultimo: 0}
    } catch {
        return {tentativas: 0, ultimo: 0}
    }
}

function evitaQueda_gravarGuarda(guarda) {
    sessionStorage.setItem(EVITA_QUEDA_GUARDA, JSON.stringify(guarda))
}

function evitaQueda_limparGuarda() {
    sessionStorage.removeItem(EVITA_QUEDA_GUARDA)
}

async function evitaQueda() {
    if (!location.href.includes('trt15.jus.br/pjekz')) return

    let name = 'rota_evitaQuedaAtivo'
    let evitaQuedaAtivo = await obterArmazenamento([name]).then(d => d?.[name])
    if (!evitaQuedaAtivo) return

    console.log('%c[Rota PJE]%c evitaQuedaAtivo: ' + JSON.stringify(evitaQuedaAtivo), LOG.aviso, 'color:inherit')

    let guarda = evitaQueda_lerGuarda()

    // Passou tempo demais desde a última recarga: o episódio anterior
    // era passageiro, então o contador não vale mais.
    if (Date.now() - guarda.ultimo > EVITA_QUEDA_JANELA) guarda = {tentativas: 0, ultimo: 0}

    let elemento = await aguardarElementoNovo(
        ['pjeMudancaDePerfil', 'pjeAcessoNegado'],
        {modo: 'ou', timeout: 30000}
    )

    // Nenhum aviso em 30s: a sessão está de pé, zera o histórico.
    if (!elemento) {
        evitaQueda_limparGuarda()
        return
    }

    let texto = elemento.textContent
    if (!texto.includes('Acesso Negado') && !texto.includes('mudança de perfil')) {
        evitaQueda_limparGuarda()
        return
    }

    if (guarda.tentativas >= EVITA_QUEDA_MAX) {
        console.warn(
            `[Rota PJE] evitaQueda: ${guarda.tentativas} recargas sem sucesso. ` +
            `Provável perda de autenticação — desistindo. Faça login novamente.`
        )
        evitaQueda_limparGuarda()   // uma nova queda futura recomeça do zero
        return
    }

    evitaQueda_gravarGuarda({tentativas: guarda.tentativas + 1, ultimo: Date.now()})
    window.location.reload()
}
async function gig_copiaAtendimento(){
    let janela = confereJanela(JANELA.detalhes)
    if (!janela) return
    let botaoExcluir = await aguardarElemento('[id^=excluir-atividade]')
    criaBotaoCopiaAtendimento(botaoExcluir)
}
gig_copiaAtendimento()
function criaBotaoCopiaAtendimento(botao){
    let ancestrais = [... document.querySelectorAll('.actions')]
    console.log('%c[Rota PJE]%c ancestrais' + JSON.stringify(ancestrais), LOG.info, 'color:inherit', ancestrais)
    let remover = [...document.querySelectorAll('.btn-copia_atendimento')].map(el => el.remove())
    let i = 0
    for (let ancestral of ancestrais) {
        i++
        let botaoCopia = document.createElement('button')
        botaoCopia.id = id('copiaAtendimento') + i
        botaoCopia.textContent = '📋'
        botaoCopia.className = 'btn-copia_atendimento mat-focus-indicator mat-tooltip-trigger icone-clicavel mat-icon-button mat-button-base'
        botaoCopia.style.cssText = 'min-width: 20px !important; width: 20px !important; height: 0px !important; padding: 0 !important; margin: 0 !important; line-height: 20px !important;'
        console.log('%c[Rota PJE]%c botao: ' + JSON.stringify(botao), LOG.info, 'color:inherit', botao)
        botaoCopia.addEventListener('click', () => copiaDadosAtendimento(botaoCopia))
        ancestral.appendChild(botaoCopia)
        criaTooltip({
            id: id('copiaAtendimento', 'tooltip'),
            texto: 'Copia OJ, Número do Processo e Texto do GIG para colar no Chat.',
            elemento: botaoCopia
        })
    }
}
function copiaDadosAtendimento(botaoCopia){
    console.log('%c[Rota PJE]%c Chamou' + JSON.stringify(29), LOG.info, 'color:inherit')
    let tr = botaoCopia.closest('tr')
    let texto = tr.querySelector('.descricao').textContent.trim()
    let elementoProcesso = document.querySelector('pje-descricao-processo')
    let textoProcesso = elementoProcesso?.children[0]?.children[2]?.textContent
    let ojElemento = document.querySelector('.oj-cargo').textContent.split('/')[0].trim()
    let textoFinal = `${ojElemento} - Processo: ${textoProcesso}: ${texto}`
    navigator.clipboard.writeText(textoFinal)
}
window.addEventListener('rota_pje:url-mudou', () => {
    // fecha o painel de minutas antes de remontar o widget — o conteúdo
    // é sempre da tela anterior e ficaria órfão
    //document.querySelector('#rota_assistenteAssinatura_painelMinutas')?.remove()
    gig_copiaAtendimento()
})
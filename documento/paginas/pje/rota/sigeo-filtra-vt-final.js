let SELETORES_SIGEO = {
    barraDeBusca: '#div_pesquisa',
    botaoOk: '#formAJIntranet\\:botaoPesquisarPorPalavraChave',
    celulaDoProcessoNaTabela: '#formAJIntranet\\:numeroPPJ'
}

async function sigeoAjJtAoIniciar() {
    let janela = location.href
    console.log('%c[Rota PJE]%c 3: ' + location.href, LOG.teste, 'color:inherit')
    if (!janela.includes('sigeo.jt.jus.br/aj/nomeacao/nomearprofissionais/nomearprofissionais_index.jsf')) return
    await aguardarElemento(SELETORES_SIGEO.barraDeBusca)
    sigeoAjJtInserirElementos()
}

async function sigeoAjJtInserirElementos() {
    let retira = await selecionar('#rota-pje-sigeo-filtra-vt-final')
    if (retira) retira.remove()
    console.log('%c[Rota PJE]%c 15:', LOG.teste, 'color:inherit')
    let botaoOk = await selecionar(SELETORES_SIGEO.botaoOk)
    //let height = botaoOk.height
    
    let div = criaDiv({ 
        id: 'rota-pje-sigeo-filtra-vt-final', 
        ancestral: SELETORES_SIGEO.barraDeBusca,
        
    })
    div.style.display = 'inline-flex'  // inline pra não quebrar linha com o botaoOk
    div.style.alignItems = 'center'    // alinha verticalmente
    div.style.gap = '4px'              // espaço entre input e botão
    div.style.marginTop = '3px'              // espaço entre input e botão
    
    let input = criaInput({ 
        id: 'rota-pje-sigeo-filtra-vt-final-input-vara', 
        ancestral: 'rota-pje-sigeo-filtra-vt-final',
        placeholder: 'Digite o código da Vara. Ex.: 0091, 0049',
    })
    input.style.flexDirection = 'row'
    
    
    botaoOk.insertAdjacentElement('afterend', div)
    let inputEl = document.querySelector('#rota-pje-sigeo-filtra-vt-final-input-vara')
    inputEl.style.padding = '0px 4px'
    inputEl.style.fontSize = '10px'
    inputEl.style.marginLeft = '6px'
    inputEl.style.borderRadius = '0px'
    inputEl.style.marginTop = '3px'
    inputEl.addEventListener('keydown', e => {
        if (e.key === 'Enter') botaoFiltroEl.click()
    })  
    
    let botaoFiltro = criaBotaoAzul({ 
        id: 'rota-pje-sigeo-filtra-vt-final-botao-filtro', 
        ancestral: 'rota-pje-sigeo-filtra-vt-final',
        texto: 'Filtrar por Vara',
        acao: () => sigeo_filtra_vt_finalfiltrarPorVara(inputEl.value)
    })
    let botaoFiltroEl = document.querySelector('#rota-pje-sigeo-filtra-vt-final-botao-filtro')
    botaoFiltroEl.style.display = 'inline-flex'
    botaoFiltroEl.style.width = '300px'
    botaoFiltroEl.style.height = 'fit-content'
    botaoFiltroEl.style.padding = '0px 0px'
    botaoFiltroEl.style.fontSize = '12px'
    botaoFiltroEl.style.borderRadius = '2px'
    botaoFiltroEl.style.marginLeft = '6px'
    botaoFiltroEl.style.textAlign = 'center'
    botaoFiltroEl.style.justifyContent = 'center'
    botaoFiltroEl.style.marginTop = '3px'  
    botaoFiltroEl.type = 'button'
    
    let varaSalva = await obterArmazenamento('pjerota_sigeo_filtra_vt_finalVaraSalva')
    if (varaSalva) {
        inputEl.value = varaSalva.pjerota_sigeo_filtra_vt_finalVaraSalva
    }
        
    

    inputEl.insertAdjacentElement('afterend', botaoFiltro)




}

async function sigeo_filtra_vt_finalfiltrarPorVara(vara) {
    await armazenar({pjerota_sigeo_filtra_vt_finalVaraSalva: vara})
    document.querySelectorAll(SELETORES_SIGEO.celulaDoProcessoNaTabela)
    .forEach(el => el.closest('tr').style.display = '')
    if (!vara){
        return
    }
    let numeroProcessos = [...document.querySelectorAll(SELETORES_SIGEO.celulaDoProcessoNaTabela)]
    console.log('%c[Rota PJE]%c 81: ' + JSON.stringify(numeroProcessos.length), LOG.teste, 'color:inherit')
    let numeroFiltrado = numeroProcessos.filter(el => el.textContent.slice(-4) != vara)
    console.log('%c[Rota PJE]%c 83: ' + JSON.stringify(numeroFiltrado.length), LOG.teste, 'color:inherit')
    //numeroFiltrado.forEach(el => el.closest('tr').remove())
    numeroFiltrado.forEach(el => el.closest('tr').style.display = 'none')
    //await alert (vara)
}

sigeoAjJtAoIniciar()
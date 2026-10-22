async function guardaContraOJIncorreta(){
    let janela = confereJanela(JANELA.encaminharPostoAvancado)
    if (!janela) return
    await aguardarElemento('.container-botoes')
    await suspender()
    let divId = id('guardaContraOJIncorreta')
    let armazenamento = await obterArmazenamento(divId)
    //if (!armazenamento[divId]) return
    let botoes = [...document.querySelectorAll('pje-encaminhar-posto-avancado .opcoes button')]
    let botoesErrados = botoes.filter(d => 
        !normalizar(d.textContent).includes('bauru') && 
        !normalizar(d.textContent).includes('nucleo') &&
        !normalizar(d.textContent).includes('posto avancado')
    ) || []
    if (botoesErrados.length){
        let div = criaDiv({
            id: divId,
            ancestral: document.body
        })
        formataDiv(div, '#e64a19', '90%', '90%')
        div.style.padding = '50px'
        div.style.boxSizing = 'border-box'
        let textoAtencao = criaTexto({
            id: divId + '_textoAtencao',
            ancestral: divId,
            texto: 'ATENÇÃO'
        })
        textoAtencao.style.fontSize = '48px'
        textoAtencao.style.textAlign = 'center'
        textoAtencao.style.color = '#000000'
        let texto = criaTexto({
            id: divId + '_texto',
            ancestral: divId,
            texto: 'Este processo está com erro.\nAs OJs mostradas não são as OJs da Secretaria Conjunta de Bauru. Certifique-se de que deseja realmente mandar este processo para outra Secretaria Conjunta, ou abra chamado. Clique para fechar. Fechará automaticamente em 5 segundos.'
        })
        texto.style.fontSize = '32px'
        texto.style.color = '#000000'
        let textoContagem = criaTexto({
            id: divId + '_textoContagem',
            ancestral: divId,
            texto: 'Fechando em 5.'
        })
        textoContagem.style.color = '#000000'
        div.addEventListener('click', d => {document.getElementById(divId).remove(d)})
        for (let i = 0; i < 5; i++){
            await suspender (1000)
            textoContagem.textContent = 'Fechando em ' + (4 - i) + '.'
        }
        document.getElementById(divId).remove()
    }

}

async function encaminharPostoAvancadoGigs(vara){
    let nomeJanela = window.name
    if (nomeJanela.includes('rotapje_levaGigs')){
        await insereGigsOJAnterior()
    }
    let janela = confereJanela(JANELA.encaminharPostoAvancado, JANELA.analise)
    if (!janela) return
    let ancestral = 'rotapje_fita_superior'
    let fita = await aguardarElemento('#' + ancestral)
    if (!fita) return
    let idEncaminha = id('encaminhaComGig')
    let armazenamento = await obterArmazenamento(idEncaminha) || {}
    let estado = armazenamento[idEncaminha] || null
    
    if (!estado){
        await armazenar({[idEncaminha]:{leva: false, continua: false}})
    }
    verificarBotoesEIncluirListeners(vara) 

    let botaoLeva = criaBotaoLaranja({
        id: idEncaminha + '_botao_' + '_leva',
        ancestral,
        texto: 'Leva os GIGs para a próxima OJ' + (estado?.leva ? ' - ATIVADO' : ' - DESATIVADO'),
        acao: () => alternarEstadoESalvar('leva')
    })
    criaTooltip({
        id: idEncaminha + '_tooltip_' + '_leva',
        texto: 'Ative esta opção para levar os GIGs para a próxima OJ.',
        elemento: botaoLeva
    })
    estiloBotaoFitaSuperior(botaoLeva)
    let botaoContinua = criaBotaoAzul({
        id: idEncaminha + '_botao_' + '_continua',
        ancestral,
        texto: 'Quero continuar na tarefa da próxima OJ' + (estado?.continua ? ' - ATIVADO' : ' - DESATIVADO'),
        acao: () => alternarEstadoESalvar('continua')
    })
    criaTooltip({
        id: idEncaminha + '_tooltip_' + '_continua',
        texto: 'Ative esta opção para que a tarefa não feche após o clique.',
        elemento: botaoContinua
    })
    estiloBotaoFitaSuperior(botaoContinua)
    
    async function insereGigsOJAnterior() {
        let armazenamento = await obterArmazenamento('rotapje_levaGigs') || {}
        let gigsAnteriores = armazenamento?.rotapje_levaGigs?.gigs || []
        let continua = armazenamento?.rotapje_levaGigs?.continua || false
        let perfilAtual = armazenamento?.rotapje_levaGigs?.perfil
        let perfilAnterior = armazenamento?.rotapje_levaGigs?.perfilAnterior
        console.log('%c[Rota PJE]%c gigsAnteriores: ' + JSON.stringify(gigsAnteriores), LOG.info, 'color:inherit')
        console.log('%c[Rota PJE]%c continua: ' + JSON.stringify(continua), LOG.info, 'color:inherit')
        console.log('%c[Rota PJE]%c perfilAtual: ' + JSON.stringify(perfilAtual), LOG.info, 'color:inherit')
        await aguardarElemento('.oj-cargo')
        await suspender(500)
        let mostraOJ = document.querySelector('.oj-cargo')
        if (!normalizar(mostraOJ.textContent).includes(normalizar(perfilAtual?.orgaoJulgador))) mostraOJ.textContent = perfilAtual?.orgaoJulgador + ' / Juiz do Trabalho Titular'
        await aguardarElemento('pje-descricao-processo [role="button"]')
        if (gigsAnteriores?.length) {
            let gigsAtuais = await obterGigsDestaOJ()
            for (let gigAnterior of gigsAnteriores){
                if (
                    gigsAtuais.some(d=> 
                        d?.tipoAtividade?.id == gigAnterior?.tipoAtividade?.id &&
                        d?.observacao == gigAnterior?.observacao &&
                        d?.dataPrazo == gigAnterior?.dataPrazo
                    )
                ){
                    continue
                }
                let idURLMatch = location.href.match(/processo\/(\d+)\/tarefa\/\d+/)
                let idURL = idURLMatch?.[1]
                await criarAtividadeGigs (idURL, gigAnterior)
            }
        }
        await removerArmazenamento('rotapje_levaGigs')
        window.name = ''
        if (!continua) {
            await postTrocaDeOJ(perfilAnterior?.idPerfil)
            window.close()
        }
    }

    async function obterGigsDestaOJ(){
        let idURLMatch = location.href.match(/processo\/(\d+)\/tarefa\/\d+/)
        let idURL = idURLMatch?.[1]
        let gigs = await rota_fetch(location.origin + '/pje-gigs-api/api/atividade/processo/' + idURL) || []
        return gigs
    }
    async function verificarBotoesEIncluirListeners(vara){
        await aguardarElemento('pje-botoes-transicao button')
        await suspender(500)
        if(confereJanela(JANELA.analise)){
            let botoes = [...document.querySelectorAll('pje-botoes-transicao button')]
            if (!botoes.length) return
            let botao = botoes.find(d=> normalizar(d?.textContent).includes('vara de origem')) || null
            if (!botao) return
            //PERFIL AQUI
            let perfis = await rota_fetch(location.origin + '/pje-seguranca/api/token/perfis') || []
            let perfil = perfis.find(d=> normalizar(d?.orgaoJulgador).includes(normalizar(vara))) || {}
            if (!perfil?.idPerfil) return
            let perfilAnterior = perfis.find(d=> normalizar(d?.orgaoJulgador).includes(normalizar(document.querySelector('.oj-cargo').textContent.split('/')[0].trim()))) || {}
            botao.addEventListener('click', levaGigSegueTarefa(true, perfil, perfilAnterior), { capture: true });
            return
        } else {
            let botoes = [...document.querySelectorAll('pje-encaminhar-posto-avancado .opcoes button')]
            let perfis = await rota_fetch(location.origin + '/pje-seguranca/api/token/perfis')
            for (let botao of botoes){
                let perfil = perfis.find(d=> normalizar(d?.orgaoJulgador).includes(normalizar(botao.textContent)))
                let perfilAnterior = perfis.find(d=> normalizar(d?.orgaoJulgador).includes(normalizar(document.querySelector('.oj-cargo').textContent.split('/')[0].trim()))) || {}
                if(!perfil?.idPerfil) continue

                botao.addEventListener('click', levaGigSegueTarefa(false, perfil, perfilAnterior), { capture: true })
            }
        }
        return
        
        function levaGigSegueTarefa(analise, perfil = null, perfilAnterior) {
            
            return async function listenerTemporario(e) {
                let botao = e.currentTarget;

                e.stopImmediatePropagation();
                e.preventDefault();

                botao.removeEventListener('click', listenerTemporario, { capture: true });

                // --- SEU CÓDIGO AQUI ---
                let armazenamento = await obterArmazenamento([idEncaminha])
                let leva = armazenamento?.[idEncaminha]?.leva || false
                let continua = armazenamento?.[idEncaminha]?.continua || false
                let gigs = leva ? await obterGigsDestaOJ() || [] : null
                let idURLMatch = location.href.match(/processo\/(\d+)\/tarefa\/\d+/)
                let idURL = idURLMatch?.[1]
                let url = analise ? location.origin + '/pjekz/processo/' + idURL + '/tarefa/553/transicao' : location.origin + '/pjekz/processo/' + idURL + '/tarefa/122/transicao'
                if (leva || continua) await postTrocaDeOJ(perfil?.idPerfil)
                await suspender(300)
                let nomeJanela = window.name
                if (leva || continua) {
                    window.name = !nomeJanela.includes('rotapje_levaGigs') ? nomeJanela + 'rotapje_levaGigs' : nomeJanela
                    let gigsLeva = leva ? gigs : []
                    await armazenar({rotapje_levaGigs: {gigs: gigsLeva, continua, perfil, perfilAnterior}})
                }
                botao.click()
                await suspender (100)
                await aguardarElemento('.mat-progress-spinner')
                if (!leva && !continua) return
                location.href = url
            }
        }
      
        
    }
    async function alternarEstadoESalvar(idFim){
        let botao = document.getElementById(idEncaminha + '_botao_' + '_' + idFim)
        if (botao.textContent.includes('DES')){
            botao.textContent = botao.textContent.replace('DESATIVADO', 'ATIVADO')
            let armazenamento = await obterArmazenamento([idEncaminha])
            let estado = armazenamento[idEncaminha]
            estado[idFim]= true
            await armazenar({[idEncaminha]: estado})
        } else {
            botao.textContent = botao.textContent.replace('ATIVADO', 'DESATIVADO')
            let armazenamento = await obterArmazenamento([idEncaminha])
            let estado = armazenamento[idEncaminha]
            estado[idFim]= false
            await armazenar({[idEncaminha]: estado})
        }
    }

}



/* CEJUSC É OUTRA TELA
            let botoes = [...document.querySelectorAll('pje-botoes-transicao button')]
            if (!botoes.length) return
            let botoesFiltrados = botoes.filter(d=> normalizar(d?.textContent).includes('vara de origem') || normalizar(d?.textContent).includes('cejusc')) || null
            if (!botoesFiltrados) return
            //PERFIL AQUI
            let perfis = await rota_fetch(location.origin + '/pje-seguranca/api/token/perfis') || []
            let perfil = perfis.filter(d=> normalizar(d?.orgaoJulgador).includes(normalizar(vara)) || normalizar(d?.orgaoJulgador).includes('cejusc'))?.idPerfil || ''
            if (!perfil) return
            for (let botao of botoesFiltrados){
                let perfil = normalizar(botao.textContent).includes('cejusc') ?
                    perfis.find(d=> normalizar(d?.orgaoJulgador).includes('cejusc')) || '' :
                    perfis.find(d=> normalizar(d?.orgaoJulgador).includes(normalizar(botao.textContent))) || ''
                if (!perfil) return
                botao.addEventListener('click', levaGigSegueTarefa(leva, continua, true, perfil), { capture: true })
            }
*/
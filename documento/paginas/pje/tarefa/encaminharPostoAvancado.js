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
        !normalizar(d.textContent).includes('nucleo')
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
    //return
    let janela = confereJanela(JANELA.encaminharPostoAvancado, JANELA.analise)
    if (!janela) return
    let ancestral = 'rotapje_fita_superior'
    let fita = aguardarElemento('#' + ancestral)
    if (!fita) return
    let idEncaminha = id('encaminhaComGig')
    let armazenamento = await obterArmazenamento(idEncaminha) || {}
    let estado = armazenamento[idEncaminha] || null
    console.log('%c[Rota PJE]%c estado' + JSON.stringify(estado), LOG.aviso, 'color:inherit')
    if (!estado){
        await armazenar({[idEncaminha]:{leva: false, continua: false}})
    }
    if (estado?.leva || estado?.continua) {
        await verificarBotoesEIncluirListeners(estado?.leva, estado?.continua, vara) 
    } else {

    }
    let botaoLeva = criaBotaoLaranja({
        id: idEncaminha + '_botao_' + '_leva',
        ancestral,
        texto: 'Leva os GIGs para a próxima OJ' + (estado?.leva ? ' - ATIVADO' : ' - DESATIVADO'),
        acao: () => alternarEstadoESalvar('leva')
    })
    estiloBotaoFitaSuperior(botaoLeva)
    let botaoContinua = criaBotaoAzul({
        id: idEncaminha + '_botao_' + '_continua',
        ancestral,
        texto: 'Quero continuar na tarefa da próxima OJ' + (estado?.continua ? ' - ATIVADO' : ' - DESATIVADO'),
        acao: () => alternarEstadoESalvar('continua')
    })
    estiloBotaoFitaSuperior(botaoContinua)
    
    async function obterGigsDestaOJ(){
        let processo = document.querySelector('pje-descricao-processo [role="button"]').textContent.trim()
        let gigs = await buscarGigs(processo) || []
        return gigs
    }
    async function verificarBotoesEIncluirListeners(leva, continua, vara){
        await aguardarElemento('pje-botoes-transicao button')
        await suspender(500)
        if(confereJanela(JANELA.analise)){
            let botoes = [...document.querySelectorAll('pje-botoes-transicao button')]
            if (!botoes.length) return
            let botao = botoes.find(d=> normalizar(d?.textContent).includes('vara de origem')) || null
            if (!botao) return
            //PERFIL AQUI
            let perfis = await rota_fetch(location.origin + '/pje-seguranca/api/token/perfis') || []
            let perfil = perfis.find(d=> normalizar(d?.orgaoJulgador).includes(normalizar(vara)))?.idPerfil || ''
            if (!perfil) return
            console.log('%c[Rota PJE]%c perfil' + JSON.stringify(perfil), LOG.aviso, 'color:inherit')
            botao.addEventListener('click', levaGigSegueTarefa(leva, continua, true, perfil), { capture: true });
            return
        } else {
            let botoes = [...document.querySelectorAll('pje-encaminhar-posto-avancado .opcoes button')]
            let perfis = await rota_fetch(location.origin + '/pje-seguranca/api/token/perfis')
            for (let botao of botoes){
                let perfil = perfis.find(d=> normalizar(d?.orgaoJulgador).includes(normalizar(botao.textContent)))?.idPerfil || ''
                if(!perfil) continue

                botao.addEventListener('click', levaGigSegueTarefa(leva, continua, false, perfil), { capture: true })
            }
        }
        return
        
        function levaGigSegueTarefa(leva, continua, analise, perfil = null) {
            console.log('%c[Rota PJE]%c listener' + JSON.stringify(125), LOG.rosa, 'color:inherit')
            
            return async function listenerTemporario(e) {
                let botao = e.currentTarget;

                e.stopImmediatePropagation();
                e.preventDefault();

                botao.removeEventListener('click', listenerTemporario, { capture: true });

                // --- SEU CÓDIGO AQUI ---
                let gigs = leva ? await obterGigsDestaOJ() : []
                let idURLMatch = location.href.match(/processo\/(\d+)\/tarefa\/\d+/)
                let idURL = idURLMatch?.[1]
                let url = analise ? location.origin + '/pjekz/processo/' + idURL + '/tarefa/553/transicao' : location.origin + '/pjekz/processo/' + idURL + '/tarefa/122/transicao'
                console.log('%c[Rota PJE]%c url' + JSON.stringify(url), LOG.erro, 'color:inherit')
                console.log('%c[Rota PJE]%c gigs' + JSON.stringify(gigs), LOG.aviso, 'color:inherit')
                if (leva || continua) await postTrocaDeOJ(perfil)
                await suspender(300)
                botao.click()
                await suspender (100)
                if (!leva && !continua) return
                console.log('%c[Rota PJE]%c url' + JSON.stringify(url), LOG.rosa, 'color:inherit')
                location.href = url
                if (leva){

                }
                if(!continua){
                    window.close()
                }
            };
        }
      
        //function levaGigSegueTarefa(){
        //    //alert('OK')
        //}
        //console.log('%c[Rota PJE]%c perfis: ' + JSON.stringify(perfis), LOG.mb, 'color:inherit')
        //alert (botoes.map(d => d.textContent).join('\n'))
    }
    async function alternarEstadoESalvar(idFim){
        let botao = document.getElementById(idEncaminha + '_botao_' + '_' + idFim)
        if (botao.textContent.includes('DES')){
            botao.textContent = botao.textContent.replace('DESATIVADO', 'ATIVADO')
            let armazenamento = await obterArmazenamento([idEncaminha])
            let estado = armazenamento[idEncaminha]
            estado[idFim]= true
            await armazenar({[idEncaminha]: estado})
            gigs = estado?.leva ? await obterGigsDestaOJ() : []
            verificarBotoesEIncluirListeners(estado?.leva, estado?.continua, gigs) 
        } else {
            botao.textContent = botao.textContent.replace('ATIVADO', 'DESATIVADO')
            let armazenamento = await obterArmazenamento([idEncaminha])
            let estado = armazenamento[idEncaminha]
            estado[idFim]= false
            await armazenar({[idEncaminha]: estado})
            verificarBotoesEIncluirListeners(estado?.leva, estado?.continua, gigs) 
        }
    }

}
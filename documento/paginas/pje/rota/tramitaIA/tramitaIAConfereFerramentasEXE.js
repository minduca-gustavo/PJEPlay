async function tramitaIAConfereFerramentasEXE(elementoAncestral, ancestralLimpar, rechamada = false, dadosRechamada) {
    let idMostrador = id('tramitaIA', 'tramitaIAConfereFerramentasEXE')
    if (rechamada){
        let rolanteFilhos = [...document.getElementById(ancestralLimpar).children]
        let excluir = rolanteFilhos.map(d=> {
            if (d?.id != elementoAncestral){
                d?.remove()
            }
        })
        let rolante = document.getElementById(ancestralLimpar)
        //rolante.style.overflowY = ''
        if (!Array.isArray(dadosRechamada)){
            mostraResultadosBuscaSimples(ancestralLimpar, 'O resultado da busca foi baixado. Ocorreu um erro na apresentação.', idMostrador)
            _baixarArquivo(JSON.stringify(dadosRechamada, null, 2), 'ConfereFerramentasEXE.json', 'application/json')
            return
        }
        
        _baixarArquivo(JSON.stringify(dadosRechamada, null, 2), 'Rechamada.json', 'application/json')
        let resultado = dadosRechamada.map(d => formataResultado(d))
        apresentaResultados({
            array: resultado,
            nome: 'tramitaIA_resultadoConfereFerramentasEXE',
            ancestral: ancestralLimpar,
            embutido: true,
            aoVoltar: () => {
                rolante.replaceChildren()
                rolante.style.overflowY = 'auto'
                tramitaIACriaSecoes({elemento: ancestralLimpar})
            },
            baixarResultadoBruto: dadosRechamada
        })
        
        //_baixarArquivo(JSON.stringify(dadosRechamada, null, 2), 'ConfereFerramentasEXE.json', 'application/json')
        function formataResultado(linha){
            let {requeridas, utilizadas, idProc, numeroProcesso, erro} = linha
            let res = {
                'Número':                   removeQuebras(numeroProcesso),
                'Id':                       removeQuebras(idProc),
                'Ferramentas requeridas':   erro ? erro : removeQuebras(garanteNaoArray(requeridas)),
                'Ferramentas utilizadas':   erro ? '' : removeQuebras(garanteNaoArray(utilizadas))
            }
            return res
        }

        return
    }
    let el = document.getElementById(elementoAncestral)
    el.style.flexDirection = 'row-reverse'
    el.style.alignItems = 'baseline'
    let botoes = [
        {
            id: 'tarefa',
            texto: 'Pesquisar'
        },
    ]
    for(let botao of botoes){
        let b = criaBotaoLaranja({
            id: elementoAncestral + '_' + botao?.id,
            texto: botao?.texto,
            ancestral: elementoAncestral,
            acao: async () => await confereFerramentasEXE(botao?.id)
        })
        b.style.alignSelf = 'center'
    }
    //let input = await criaInput({
    //    id: elementoAncestral + '_input',
    //    ancestral: elementoAncestral,
    //    placeholder: 'Digite o nome da tarefa. Ex: elaborar despacho, CUMPRIMENTO DE PROVIDÊNCIAS, Minutar sentenca'
    //})
    //input.container.style.alignSelf = 'center'
    //input.container.style.margin = '0px'
    //input.addEventListener('keydown', e => {
    //    if (e.key === 'Enter') confereFerramentasEXE();
    //});
    let texto = criaTexto({
        id: elementoAncestral + '_texto',
        ancestral: elementoAncestral,
        texto: 'A IA responderá para todos os processos da tela: quais ferramentas foram pedidas? E quais já foram feitas?'
    })
    texto.style.width = '100%'
    let titulo = criaSubTitulo({
        id: elementoAncestral + '_titulo',
        ancestral: elementoAncestral,
        texto: 'Confere ferramentas utilizadas na EXE.'
    })
    async function confereFerramentasEXE(){
        let limpar = [...document.getElementById(ancestralLimpar).children].filter(d => d?.id !== elementoAncestral).map(d => d.remove())

        let dados = []
        let promessas = []
        let resultado = []
        let tamanhoDoLote = 10
        let mostra = 0
        let meta = interceptador_ler('agrupamento_tarefas_processos')
        let processos = meta?.resultado || []
        console.log('%c[Rota PJE]%c processos: ', LOG.mb, 'color:inherit', processos)
        if (!processos.length){
            mostraResultadosBuscaSimples(ancestralLimpar, 'Ocorreu um erro. Atualize a página e tente novamente.', idMostrador)
            tramitaIAcriaBotaoNovaBusca(id('tramitaIA', 'confereFerramentasEXE', 'novaBusca'), ancestralLimpar)
            return
        }
        for (let i = 0; i < processos?.length; i++) {
            
            if (i == 0) mostraResultadosBuscaSimples(ancestralLimpar, 'Aguarde. Buscando ' + (i + 1) + ' de ' + processos?.length, idMostrador)
            promessas.push(requisicoesEmPareleloconfereFerramentasEXE(i))
            if ((i + 1) % tamanhoDoLote === 0 || (i + 1) === processos?.length){
                let resultados = await Promise.all(promessas)
                resultado.push(...resultados)
                promessas = []
            }

            async function requisicoesEmPareleloconfereFerramentasEXE(i){
                console.log('%c[Rota PJE]%c processos[i]: ' + JSON.stringify(processos[i]), LOG.info, 'color:inherit')
                let {id, numeroProcesso} = processos[i]
                let idProc = id
                let timeline = await buscarDocumentosEMovimentos(idProc) || []
                if (!timeline.length) return {idProc, numeroProcesso, erro: `Erro ao buscar a timeline`}
                let inicioExec = timeline.find(d => normalizar(d?.titulo).includes('termo de abertura de ') || normalizar(d?.titulo).includes('iniciada a exec'))
                let timelineExecucao = timeline.filter(d => d?.documento && (!inicioExec || d?.data >= inicioExec.data))
                let timelineMandar = timelineExecucao.map(d => {
                    let {id, idUnicoDocumento, titulo, tipo, data, participacaoProcesso, papelUsuarioDocumento} = d ?? {}
                    return {id, idUnicoDocumento, titulo, tipo, data, participacaoProcesso, papelUsuarioDocumento}
                })
                console.log('%c[Rota PJE]%c timelineExecucao: ' + JSON.stringify(timelineExecucao), LOG.teste, 'color:inherit')
                let manifestacoesPartes = timelineExecucao.filter(d => ['autor', 'reu'].some(c=> normalizar(d?.participacaoProcesso).includes(c))) || []
                console.log('%c[Rota PJE]%c manifestacoesPartes: ' + JSON.stringify(manifestacoesPartes), LOG.aviso, 'color:inherit')
                let teorManifestacoesPartes = []
                for (let manifestacao of manifestacoesPartes){
                    let teor = await rota_extrairTeorDocumento(idProc, manifestacao?.id) || ''
                    if (!teor) continue
                    let {id, idUnicoDocumento, titulo, tipo, participacaoProcesso, data} = manifestacao
                    teorManifestacoesPartes.push({teor, id, idUnicoDocumento, titulo, tipo, participacaoProcesso, data})
                    if (!verificaTamanho(teorManifestacoesPartes, 500)) return {idProc, numeroProcesso, erro: `Processo grande demais para a IA. Conferir manualmente.`}
                }
                let documentosUsuarioInternos = timelineExecucao.filter(d => d?.usuarioInterno && !['intimacao', 'notificacao', 'alvara', 'ata da audiencia'].some(c => normalizar(d?.titulo).includes(c) || normalizar(d?.tipo).includes(c)))
                let teordocumentosUsuarioInternos = []
                for (let documento of documentosUsuarioInternos){
                    let teor = await rota_extrairTeorDocumento(idProc, documento?.id) || ''
                    if (!teor) continue
                    let {id, idUnicoDocumento, titulo, tipo, participacaoProcesso, data} = documento
                    teordocumentosUsuarioInternos.push({teor, id, idUnicoDocumento, titulo, tipo, participacaoProcesso, data})
                    if (!verificaTamanho({teordocumentosUsuarioInternos, timelineMandar}, 500)) return {idProc, numeroProcesso, erro: `Processo grande demais para a IA. Conferir manualmente.`}
                }
                //let payloadUtilizadas = JSON.stringify({teordocumentosUsuarioInternos, timelineMandar})
                //let payloadRequeridas = JSON.stringify({teorManifestacoesPartes})
                //let kbRequeridas = new TextEncoder().encode(payloadRequeridas).length / 1024
                //let kbUtilizadas = new TextEncoder().encode(payloadUtilizadas).length / 1024
                //if (kbRequeridas > 500 || kbUtilizadas > 500) {
                //    return {idProc, numeroProcesso, erro: `Processo grande demais para a IA (${kb.toFixed(0)} KB). Conferir manualmente.`}
                //}

                let assistenteRequeridas = '6ac68a7acedb0a75feb94099'
                let requeridas = await rota_IAConsulta(assistenteRequeridas, JSON.stringify(teorManifestacoesPartes, null, 2))
                let assistenteUtilizadas = '6ac68aa1cedb0a75feb940e3'
                let utilizadas = await rota_IAConsulta(assistenteUtilizadas, JSON.stringify({teordocumentosUsuarioInternos, timelineMandar}, null, 2))
                mostra++
                mostraResultadosBuscaSimples(ancestralLimpar, 'Aguarde. Buscando ' + (mostra) + ' de ' + processos?.length, idMostrador)
                return {requeridas, utilizadas, idProc, numeroProcesso}
                
                function verificaTamanho(dados, kb = 500){
                    return (new TextEncoder().encode(JSON.stringify(dados)).length / 1024) <= 500
                }
                
            }
            
            
        }
        
        tramitaIAConfereFerramentasEXE(elementoAncestral, ancestralLimpar, true, resultado)
        //_baixarArquivo(JSON.stringify(dados, null, 2), 'resultadoFinal.json', 'application/json')
        _baixarArquivo(JSON.stringify(resultado, null, 2), 'resultadoFinal.json', 'application/json')
        
    }
}

/*
requeridas = 6ac68a7acedb0a75feb94099
utilizadas = 6ac68aa1cedb0a75feb940e3
async function comTimeout(promessa, ms, rotulo) {
    return Promise.race([
        promessa,
        new Promise((_, rej) => setTimeout(() => rej(new Error('Timeout: ' + rotulo)), ms))
    ])
}
*/
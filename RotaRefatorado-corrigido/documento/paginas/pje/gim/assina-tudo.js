async function rotaAssinaTudo() {
    let janela = confereJanela(JANELA.gim)
    if (!janela) return
    console.log('%c[Rota PJE]%c assina Janela: ' + JSON.stringify(4), LOG.info, 'color:inherit')
    let ancestral = '.centralizado-botoes'
    let elemento = await aguardarElemento('.centralizado-botoes')
    if (!elemento) return
    console.log('%c[Rota PJE]%c assina Elemento: ' + JSON.stringify(elemento), LOG.info, 'color:inherit', elemento)
    let idBotaoAssina = id('assinaTudo', 'botao', 'assina')
    let idBotaoExibe = id('assinaTudo', 'botao', 'exibe')
    document.getElementById(idBotaoAssina)?.remove()
    document.getElementById(idBotaoExibe)?.remove()
    let botaoAssina = criaBotaoLaranja({
        id: idBotaoAssina,
        ancestral: ancestral,
        texto: 'Assinar todos em todas as OJs',
        acao: () => assinaTudo('assina')
    })
    let botaoExibe = criaBotaoLaranja({
        id: idBotaoExibe,
        ancestral: ancestral,
        texto: 'Exibir todos de todas as OJs',
        acao: () => assinaTudo('exibe')
    })
    async function assinaTudo(parametro) {
        let orgaos = interceptador_ler('gim_orgaos_julgadores') || null
        if (!orgaos) {
            rota_avisoTemporario('Ocorreu um erro.', 'erro', 3000)
            console.log('%c[Rota PJE]%c interceptador: erro', LOG.info, 'color:inherit')
            return
        }
        let data = Date.now()
        let perfis = await interceptador_lerPerfis() || []
        if (!perfis.length) {
            perfis = await rota_fetch(location.origin + '/pje-seguranca/api/token/perfis') || []
            if (!perfis.length) {
                rota_avisoTemporario('Ocorreu um erro.', 'erro', 3000)
                return
            }
        }
        if (parametro === 'assina'){
            let idPerfis = []
            for (let orgao of orgaos){
                let idPerfil = perfis.find(d => d?.idOrgaoJulgador === orgao?.idOrgaoJulgador) || {}
                if (!idPerfil?.idPerfil) continue
                idPerfis.push(idPerfil)
            }
            await armazenar({rotapje_assinaTudo:{idPerfis: idPerfis, execucao: data, perfilExecucao: idPerfis[0].idPerfil}})
            await rotaAssinaTudo_trocarPerfilENavegar(idPerfis[0], data)
            return
        }
        let idDiv = id('assinaTudo', 'exibirTodos')
        document.getElementById(idDiv)?.remove()
        let div = criaDiv({
            id: idDiv,
            ancestral: 'ffff'
        })
        formataDiv(div)
        let dados = []
        for (let orgao of orgaos){
            let url = location.origin + '/pje-comum-api/api/gim/processos/todos?pagina=1&tamanhoPagina=100&ordenacaoCrescente=true&filtrarPorResponsavel=false&data=' + Math.floor(data/1000) + '&idOrgaoJulgador=' + orgao?.idOrgaoJulgador// + '&assinarTodos=true'
            let pesquisa = await rota_fetch(url) || {}
            if (pesquisa?.qtdPaginas > 1) {
                for (let i = 2; i <= pesquisa?.qtdPaginas; i++){
                    let url = location.origin + '/pje-comum-api/api/gim/processos/todos?pagina=' + i + '&tamanhoPagina=100&ordenacaoCrescente=true&filtrarPorResponsavel=false&data=' + Math.floor(data/1000) + '&idOrgaoJulgador=' + orgao?.idOrgaoJulgador// + '&assinarTodos=true'
                    let pesquisa = await rota_fetch(url) || {}
                    if (pesquisa?.resultado) dados.push(...pesquisa?.resultado)
                }
            }
            if (pesquisa?.resultado) dados.push(...pesquisa?.resultado)
            
            // variável que indica se o processo pode ser assinado em lote ou não: minutaPendenteAnalise
            // "temOcorrenciaImpedimento": true, - quando tem impedimento
            // https://pje-web-hm.trt15.jus.br/pje-comum-api/api/processos/id/2193070/documentos/id/305490464/conteudo?incluirAssinatura=false
        }
        let sinalizados = dados.filter(d => d?.minutaPendenteAnalise || !d?.temOcorrenciaImpedimento)
        let filtrados = dados.filter(d => !d?.minutaPendenteAnalise && !d?.temOcorrenciaImpedimento && d?.tarefa.includes('Assinar'))

        let mostra = []
        for (let processo of filtrados){
            if (!processo.id || !processo.idMinutaKz) continue
            let conteudo = ''
            try {
                conteudo = rota_normalizaHtml(await extrairHtml(processo.id, processo.idMinutaKz))
            } catch (e) {
                console.error('[Rota PJE] erro ao extrair html do documento ' + processo.idMinutaKz + ':', e)
                continue
            }
            if (!conteudo) continue
            mostra.push(conteudo)
        }
        console.log('%c[Rota PJE]%c sinalizados: ' + JSON.stringify(sinalizados), LOG.aviso, 'color:inherit')
        _baixarArquivo(JSON.stringify(dados), 'assinaTudo.json', 'application/json')
        _baixarArquivo(mostra, 'mostra.html', 'text/html')
        //alert (JSON.stringify(dados))
    }
    function formataDiv(div){
        Object.assign(div.style,{
            position:       'absolute',
            top:            '50%',
            left:           '50%',
            transform:      'translate(-50%, -50%)',
            width:          '80%',
            height:         '80%',
            background:     UI_CORES.branco,
            border:         '1px solid ' + UI_CORES.azul,
            borderRadius:   '8px',
            boxShadow:      '0 4px 16px rgba(0,0,0,0.15)',
            zIndex:         String(ROTA_Z.flutuante ?? 9000),
            display:        'flex',
            padding:        '4px 4px 4px 4px'
        })
    }
}

rotaAssinaTudo()

async function rotaAssinaTudo_trocarPerfilENavegar(perfil, data){
    await fetch(location.origin + '/pje-seguranca/api/token/perfis/trocar', {
        method: 'POST',
        mode: 'cors',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/plain, */*',
            'X-XSRF-TOKEN': cookie_obter('Xsrf-Token') || cookie_obter('XSRF-TOKEN'),
        },
        body: JSON.stringify({ id_perfil: perfil.idPerfil })
    })
    let url = location.origin + '/pjekz/painel/gim/todos/oj/' + perfil.idOrgaoJulgador + '/lista-processos?assinarTodos=true'
    window.name = 'rotapje_assinaTudo_' + data
    location.href = url
}

async function rotaCicloAssinatura(){
    let janela = confereJanela(JANELA.gimAssinarTodos)
    if (!janela) return
    let nomeJanela = window.name
    if (!nomeJanela.includes('rotapje_assinaTudo')) return
    let execucao = await obterArmazenamento('rotapje_assinaTudo')
    if (execucao?.fim){
        window.name = ''
        return
    }
    let timeStamp = execucao?.rotapje_assinaTudo?.execucao
    if(!nomeJanela.includes(timeStamp)) return
    await aguardarElemento('table.t-class tbody')
    let tabela = selecionar('table.t-class')
    let tabelaHead = tabela.querySelector('thead')
    let tabelaCorpo = tabela.querySelector('tbody')
    let linhasAssinaveis = [...tabelaCorpo.querySelectorAll('tr')].filter(d => !d.querySelector('button.botao-icone-tabela-assinar.mat-button-disabled'))
    if (!linhasAssinaveis.length) {
        defineCiclo(execucao?.rotapje_assinaTudo)
        return
    }
    console.log('%c[Rota PJE]%c linhasAssinaveis: ' + JSON.stringify(linhasAssinaveis), LOG.info, 'color:inherit')
    for(let linha of linhasAssinaveis){
        let botaoSeleciona = linha.querySelector('button.botao-icone-tabela-assinar')
        await suspender(200)
        await clicar(botaoSeleciona)
    }
    let botaoAssinarTudo = tabelaHead.querySelector('button.botao-icone-tabela-assinar')
    await clicar(botaoAssinarTudo)
    // ver o elemento que aparece quando assina e chamar defineCiclo(execucao)
    await suspender(5000)
    defineCiclo(execucao?.rotapje_assinaTudo)
    return
    //alert (JSON.stringify(linhasAssinaveis))
    
    async function defineCiclo(execucao) {
        let index = execucao?.idPerfis.findIndex(d => d?.idPerfil === execucao?.perfilExecucao)
        if (index === execucao?.idPerfis?.length - 1) {
            window.name = ''
            await removerArmazenamento('rotapje_assinaTudo')
            return
        }
        execucao.perfilExecucao = execucao?.idPerfis[index + 1].idPerfil
        await armazenar({rotapje_assinaTudo : execucao})
        await rotaAssinaTudo_trocarPerfilENavegar(execucao.idPerfis[index + 1], execucao.execucao)
        
        
    }
}

rotaCicloAssinatura()

window.addEventListener('rotapje:url-mudou', () => {
    rotaAssinaTudo()
})



//https://pje-web-hm.trt15.jus.br/pje-comum-api/api/gim/orgaosjulgadores

//await fetch("https://pje-web-hm.trt15.jus.br/pje-comum-api/api/gim/orgaosjulgadores", {
//    "credentials": "include",
//    "headers": {
//        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0",
//        "Accept": "application/json, text/plain, */*",
//        "Accept-Language": "pt-BR,pt;q=0.8,en-US;q=0.5,en;q=0.3",
//        "X-XSRF-TOKEN": "334D2B09A5EC9ABF62E3FD45B59C2CD8EB0D386B9EFF557DA738FFF7DD0197678D8A7630C4D7EB120851D47DA676E0DF56B7",
//        "Sec-Fetch-Dest": "empty",
//        "Sec-Fetch-Mode": "cors",
//        "Sec-Fetch-Site": "same-origin"
//    },
//    "referrer": "https://pje-web-hm.trt15.jus.br/pjekz/painel/gim",
//    "method": "GET",
//    "mode": "cors"
//});
//
//[
//    {
//        "quantidadeProcessos": 3,
//        "idOrgaoJulgador": 424,
//        "nomeOrgaoJulgador": "CON1 - Bauru"
//    },
//    {
//        "quantidadeProcessos": 21,
//        "idOrgaoJulgador": 349,
//        "nomeOrgaoJulgador": "CON2 - Bauru"
//    },
//    {
//        "quantidadeProcessos": 25,
//        "idOrgaoJulgador": 392,
//        "nomeOrgaoJulgador": "DAM - Bauru"
//    },
//    {
//        "quantidadeProcessos": 1,
//        "idOrgaoJulgador": 425,
//        "nomeOrgaoJulgador": "LIQ1 - Bauru"
//    },
//    {
//        "quantidadeProcessos": 2,
//        "idOrgaoJulgador": 78,
//        "nomeOrgaoJulgador": "4ª Vara do Trabalho de Bauru"
//    }
//]
//https://pje-web-hm.trt15.jus.br/pje-comum-api/api/gim/processos/todos?pagina=1&tamanhoPagina=20&ordenacaoCrescente=true&filtrarPorResponsavel=false&data=1788895646077&idOrgaoJulgador=349
//
//{
//    "pagina": 1,
//    "tamanhoPagina": 20,
//    "qtdPaginas": 2,
//    "totalRegistros": 21,
//    "resultado": [
//        {
//            "id": 4498974,
//            "idOrgaoJulgador": 349,
//            "descricaoOrgaoJulgador": "CON2 - Bauru",
//            "idAgrupamento": 23,
//            "idClasseJudicial": 535,
//            "classeJudicial": "ATOrd",
//            "numeroProcesso": "0011326-62.2025.5.15.0090",
//            "segredoDeJustica": false,
//            "faseProcessual": "Conhecimento",
//            "idTarefa": 558,
//            "tarefa": "Elaborar sentença",
//            "dataEntradaTarefa": "2026-08-07T10:17:08.657",
//            "nomeUsuarioResponsavel": "ANTONIA PATRICIA ALVES BELLEZE",
//            "temComentario": false,
//            "temComentarioSecretaria": false,
//            "prazoExpirado": false,
//            "prazoExpiradoSecretaria": false,
//            "prazoExpiradoLocalizacao": false,
//            "prioridadeProcessual": 4,
//            "nomeParteAutora": "ANDREI JOSE RODRIGUES",
//            "qtdeParteAutora": 1,
//            "nomeParteRe": "ABR SERVICE LTDA",
//            "qtdeParteRe": 2,
//            "temAssociacao": true,
//            "isTarefaAssinaturaLote": false,
//            "temOcorrenciaImpedimento": false,
//            "ocorrenciaImpedimentoVisivelOj": false,
//            "juizoDigital": true,
//            "numero": 11326
//        },
//        {
//            "id": 4446189,
//            "idOrgaoJulgador": 349,
//            "descricaoOrgaoJulgador": "CON2 - Bauru",
//            "idAgrupamento": 23,
//            "idClasseJudicial": 535,
//            "classeJudicial": "ATOrd",
//            "numeroProcesso": "0011878-24.2025.5.15.0091",
//            "segredoDeJustica": false,
//            "faseProcessual": "Conhecimento",
//            "idTarefa": 558,
//            "tarefa": "Elaborar sentença",
//            "dataEntradaTarefa": "2026-08-19T16:45:12.68",
//            "temComentario": false,
//            "temComentarioSecretaria": false,
//            "prazoExpirado": false,
//            "prazoExpiradoSecretaria": false,
//            "prazoExpiradoLocalizacao": false,
//            "prioridadeProcessual": 4,
//            "nomeParteAutora": "OTACILIO YAMAMOTO",
//            "qtdeParteAutora": 1,
//            "nomeParteRe": "IMECA INDUSTRIA METALURGICA LTDA",
//            "qtdeParteRe": 1,
//            "isTarefaAssinaturaLote": false,
//            "temOcorrenciaImpedimento": false,
//            "ocorrenciaImpedimentoVisivelOj": false,
//            "juizoDigital": true,
//            "numero": 11878
//        },
//        {
//            "id": 3890257,
//            "idOrgaoJulgador": 349,
//            "descricaoOrgaoJulgador": "CON2 - Bauru",
//            "idAgrupamento": 23,
//            "idClasseJudicial": 535,
//            "classeJudicial": "ATOrd",
//            "numeroProcesso": "0010200-11.2024.5.15.0090",
//            "segredoDeJustica": false,
//            "faseProcessual": "Conhecimento",
//            "idTarefa": 558,
//            "tarefa": "Elaborar sentença",
//            "dataEntradaTarefa": "2026-08-20T17:04:22.026",
//            "temComentario": false,
//            "temComentarioSecretaria": false,
//            "prazoExpirado": false,
//            "prazoExpiradoSecretaria": false,
//            "prazoExpiradoLocalizacao": false,
//            "prioridadeProcessual": 4,
//            "nomeParteAutora": "JORGE APARECIDO DA SILVA",
//            "qtdeParteAutora": 1,
//            "nomeParteRe": "EMPRESA BRASILEIRA DE CORREIOS E TELEGRAFOS",
//            "qtdeParteRe": 1,
//            "isTarefaAssinaturaLote": false,
//            "temOcorrenciaImpedimento": false,
//            "ocorrenciaImpedimentoVisivelOj": false,
//            "juizoDigital": false,
//            "numero": 10200
//        },
//        {
//            "id": 4472178,
//            "idOrgaoJulgador": 349,
//            "descricaoOrgaoJulgador": "CON2 - Bauru",
//            "idAgrupamento": 23,
//            "idClasseJudicial": 535,
//            "classeJudicial": "ATOrd",
//            "numeroProcesso": "0012182-23.2025.5.15.0091",
//            "segredoDeJustica": false,
//            "faseProcessual": "Conhecimento",
//            "idTarefa": 558,
//            "tarefa": "Elaborar sentença",
//            "dataEntradaTarefa": "2026-08-07T14:30:40.384",
//            "nomeUsuarioResponsavel": "ANTONIA PATRICIA ALVES BELLEZE",
//            "temComentario": false,
//            "temComentarioSecretaria": false,
//            "prazoExpirado": false,
//            "prazoExpiradoSecretaria": false,
//            "prazoExpiradoLocalizacao": false,
//            "prioridadeProcessual": 0,
//            "nomeParteAutora": "ELISANGELA PEREIRA CARDOSO",
//            "qtdeParteAutora": 1,
//            "nomeParteRe": "FRIED FISH VILAREJO CHOPERIA E RESTAURANTE BAURU LTDA - ME",
//            "qtdeParteRe": 1,
//            "isTarefaAssinaturaLote": false,
//            "temOcorrenciaImpedimento": false,
//            "ocorrenciaImpedimentoVisivelOj": false,
//            "juizoDigital": true,
//            "numero": 12182
//        },
//        {
//            "id": 4257000,
//            "idOrgaoJulgador": 349,
//            "descricaoOrgaoJulgador": "CON2 - Bauru",
//            "idAgrupamento": 23,
//            "idClasseJudicial": 608,
//            "classeJudicial": "ATSum",
//            "numeroProcesso": "0010026-62.2025.5.15.0091",
//            "segredoDeJustica": false,
//            "faseProcessual": "Conhecimento",
//            "idTarefa": 558,
//            "tarefa": "Elaborar sentença",
//            "dataEntradaTarefa": "2026-08-13T09:51:54.616",
//            "temComentario": false,
//            "temComentarioSecretaria": false,
//            "prazoExpirado": false,
//            "prazoExpiradoSecretaria": false,
//            "prazoExpiradoLocalizacao": false,
//            "prioridadeProcessual": 0,
//            "nomeParteAutora": "HENRIQUE LUIZ DIAS DA MOTTA",
//            "qtdeParteAutora": 1,
//            "nomeParteRe": "52.790.387 GIULIANO MANNE",
//            "qtdeParteRe": 1,
//            "isTarefaAssinaturaLote": false,
//            "temOcorrenciaImpedimento": false,
//            "ocorrenciaImpedimentoVisivelOj": false,
//            "juizoDigital": false,
//            "numero": 10026
//        },
//        {
//            "id": 4907198,
//            "idOrgaoJulgador": 349,
//            "descricaoOrgaoJulgador": "CON2 - Bauru",
//            "idAgrupamento": 23,
//            "idClasseJudicial": 608,
//            "classeJudicial": "ATSum",
//            "numeroProcesso": "0011072-55.2026.5.15.0090",
//            "segredoDeJustica": false,
//            "faseProcessual": "Conhecimento",
//            "idTarefa": 558,
//            "tarefa": "Elaborar sentença",
//            "dataEntradaTarefa": "2026-08-13T10:47:14.338",
//            "temComentario": false,
//            "temComentarioSecretaria": false,
//            "prazoExpirado": false,
//            "prazoExpiradoSecretaria": false,
//            "prazoExpiradoLocalizacao": false,
//            "prioridadeProcessual": 0,
//            "nomeParteAutora": "ANDERLI JULIANO ALVES FERREIRA",
//            "qtdeParteAutora": 1,
//            "nomeParteRe": "ESSENCIAL SISTEMA DE SEGURANCA LTDA                                                                                                                   ",
//            "qtdeParteRe": 1,
//            "isTarefaAssinaturaLote": false,
//            "temOcorrenciaImpedimento": false,
//            "ocorrenciaImpedimentoVisivelOj": false,
//            "juizoDigital": true,
//            "numero": 11072
//        },
//        {
//            "id": 4469524,
//            "idOrgaoJulgador": 349,
//            "descricaoOrgaoJulgador": "CON2 - Bauru",
//            "idAgrupamento": 23,
//            "idClasseJudicial": 608,
//            "classeJudicial": "ATSum",
//            "numeroProcesso": "0012172-76.2025.5.15.0091",
//            "segredoDeJustica": false,
//            "faseProcessual": "Conhecimento",
//            "idTarefa": 558,
//            "tarefa": "Elaborar sentença",
//            "dataEntradaTarefa": "2026-08-13T14:57:18.976",
//            "temComentario": false,
//            "temComentarioSecretaria": false,
//            "prazoExpirado": false,
//            "prazoExpiradoSecretaria": false,
//            "prazoExpiradoLocalizacao": false,
//            "prioridadeProcessual": 0,
//            "nomeParteAutora": "CRISTOPHER CARDOSO COSTA",
//            "qtdeParteAutora": 1,
//            "nomeParteRe": "COMFRIO TRANSPORTES EIRELI",
//            "qtdeParteRe": 1,
//            "temAssociacao": true,
//            "isTarefaAssinaturaLote": false,
//            "temOcorrenciaImpedimento": false,
//            "ocorrenciaImpedimentoVisivelOj": false,
//            "juizoDigital": true,
//            "numero": 12172
//        },
//        {
//            "id": 4460458,
//            "idOrgaoJulgador": 349,
//            "descricaoOrgaoJulgador": "CON2 - Bauru",
//            "idAgrupamento": 23,
//            "idClasseJudicial": 535,
//            "classeJudicial": "ATOrd",
//            "numeroProcesso": "0012058-40.2025.5.15.0091",
//            "segredoDeJustica": false,
//            "faseProcessual": "Conhecimento",
//            "idTarefa": 558,
//            "tarefa": "Elaborar sentença",
//            "dataEntradaTarefa": "2026-08-13T15:16:27.687",
//            "temComentario": false,
//            "temComentarioSecretaria": false,
//            "prazoExpirado": false,
//            "prazoExpiradoSecretaria": false,
//            "prazoExpiradoLocalizacao": false,
//            "prioridadeProcessual": 0,
//            "nomeParteAutora": "ALEXANDRE MADUREIRA RUFINO",
//            "qtdeParteAutora": 1,
//            "nomeParteRe": "E. J. VINGNOTTO EIRELI",
//            "qtdeParteRe": 3,
//            "temAssociacao": true,
//            "isTarefaAssinaturaLote": false,
//            "temOcorrenciaImpedimento": false,
//            "ocorrenciaImpedimentoVisivelOj": false,
//            "juizoDigital": true,
//            "numero": 12058
//        },
//        {
//            "id": 4692102,
//            "idOrgaoJulgador": 349,
//            "descricaoOrgaoJulgador": "CON2 - Bauru",
//            "idAgrupamento": 23,
//            "idClasseJudicial": 535,
//            "classeJudicial": "ATOrd",
//            "numeroProcesso": "0010013-32.2026.5.15.0090",
//            "segredoDeJustica": false,
//            "faseProcessual": "Conhecimento",
//            "idTarefa": 558,
//            "tarefa": "Elaborar sentença",
//            "dataEntradaTarefa": "2026-08-13T15:17:58.754",
//            "temComentario": false,
//            "temComentarioSecretaria": false,
//            "prazoExpirado": false,
//            "prazoExpiradoSecretaria": false,
//            "prazoExpiradoLocalizacao": false,
//            "prioridadeProcessual": 0,
//            "nomeParteAutora": "THAIS HELENA BENITS PEREIRA",
//            "qtdeParteAutora": 1,
//            "nomeParteRe": "PORT LOPES PORTARIA E SERVICOS LTDA",
//            "qtdeParteRe": 2,
//            "isTarefaAssinaturaLote": false,
//            "temOcorrenciaImpedimento": false,
//            "ocorrenciaImpedimentoVisivelOj": false,
//            "juizoDigital": true,
//            "numero": 10013
//        },
//        {
//            "id": 4688680,
//            "idOrgaoJulgador": 349,
//            "descricaoOrgaoJulgador": "CON2 - Bauru",
//            "idAgrupamento": 23,
//            "idClasseJudicial": 608,
//            "classeJudicial": "ATSum",
//            "numeroProcesso": "0012228-15.2025.5.15.0090",
//            "segredoDeJustica": false,
//            "faseProcessual": "Conhecimento",
//            "idTarefa": 558,
//            "tarefa": "Elaborar sentença",
//            "dataEntradaTarefa": "2026-08-14T14:42:44.948",
//            "temComentario": false,
//            "temComentarioSecretaria": false,
//            "prazoExpirado": false,
//            "prazoExpiradoSecretaria": false,
//            "prazoExpiradoLocalizacao": false,
//            "prioridadeProcessual": 0,
//            "nomeParteAutora": "RICARDO LOSILLA DE CARVALHO",
//            "qtdeParteAutora": 1,
//            "nomeParteRe": "SUKEST INDUSTRIA DE ALIMENTOS E FARMA LTDA  EM RECUPERACAO JUDICIAL",
//            "qtdeParteRe": 1,
//            "isTarefaAssinaturaLote": false,
//            "temOcorrenciaImpedimento": false,
//            "ocorrenciaImpedimentoVisivelOj": false,
//            "juizoDigital": false,
//            "numero": 12228
//        },
//        {
//            "id": 4370442,
//            "idOrgaoJulgador": 349,
//            "descricaoOrgaoJulgador": "CON2 - Bauru",
//            "idAgrupamento": 23,
//            "idClasseJudicial": 535,
//            "classeJudicial": "ATOrd",
//            "numeroProcesso": "0011088-40.2025.5.15.0091",
//            "segredoDeJustica": false,
//            "faseProcessual": "Conhecimento",
//            "idTarefa": 558,
//            "tarefa": "Elaborar sentença",
//            "dataEntradaTarefa": "2026-08-14T15:03:03.343",
//            "temComentario": false,
//            "temComentarioSecretaria": false,
//            "prazoExpirado": false,
//            "prazoExpiradoSecretaria": false,
//            "prazoExpiradoLocalizacao": false,
//            "prioridadeProcessual": 0,
//            "nomeParteAutora": "CAROLINA APARECIDA DE SOUZA",
//            "qtdeParteAutora": 1,
//            "nomeParteRe": "PASCHOALOTTO SERVICOS FINANCEIROS S/A                                                                                                                 ",
//            "qtdeParteRe": 2,
//            "temAssociacao": true,
//            "isTarefaAssinaturaLote": false,
//            "temOcorrenciaImpedimento": false,
//            "ocorrenciaImpedimentoVisivelOj": false,
//            "juizoDigital": true,
//            "numero": 11088
//        },
//        {
//            "id": 4815149,
//            "idOrgaoJulgador": 349,
//            "descricaoOrgaoJulgador": "CON2 - Bauru",
//            "idAgrupamento": 23,
//            "idClasseJudicial": 534,
//            "classeJudicial": "ACum",
//            "numeroProcesso": "0010632-59.2026.5.15.0090",
//            "segredoDeJustica": true,
//            "faseProcessual": "Conhecimento",
//            "idTarefa": 558,
//            "tarefa": "Elaborar sentença",
//            "dataEntradaTarefa": "2026-08-19T12:15:37.813",
//            "temComentario": false,
//            "temComentarioSecretaria": false,
//            "prazoExpirado": false,
//            "prazoExpiradoSecretaria": false,
//            "prazoExpiradoLocalizacao": false,
//            "prioridadeProcessual": 0,
//            "nomeParteAutora": "SIND.CAT.PROFISS.EMPREG.TRAB.V SEG.PRIVADA/CONEXOS SIMILARES AFINS DE BAURU REGIAO SINDIVIGILANCIA BAURU",
//            "qtdeParteAutora": 1,
//            "nomeParteRe": "NOBRE SEGURANCA LTDA",
//            "qtdeParteRe": 1,
//            "isTarefaAssinaturaLote": false,
//            "temOcorrenciaImpedimento": false,
//            "ocorrenciaImpedimentoVisivelOj": false,
//            "juizoDigital": true,
//            "numero": 10632
//        },
//        {
//            "id": 4422489,
//            "idOrgaoJulgador": 349,
//            "descricaoOrgaoJulgador": "CON2 - Bauru",
//            "idAgrupamento": 23,
//            "idClasseJudicial": 535,
//            "classeJudicial": "ATOrd",
//            "numeroProcesso": "0011628-88.2025.5.15.0091",
//            "segredoDeJustica": false,
//            "faseProcessual": "Conhecimento",
//            "idTarefa": 558,
//            "tarefa": "Elaborar sentença",
//            "dataEntradaTarefa": "2026-08-19T14:33:53.718",
//            "temComentario": false,
//            "temComentarioSecretaria": false,
//            "prazoExpirado": false,
//            "prazoExpiradoSecretaria": false,
//            "prazoExpiradoLocalizacao": false,
//            "prioridadeProcessual": 0,
//            "nomeParteAutora": "LUIS FELIPE TAIOQUE",
//            "qtdeParteAutora": 1,
//            "nomeParteRe": "CORRECTA INDUSTRIA E COMERCIO LTDA.",
//            "qtdeParteRe": 1,
//            "isTarefaAssinaturaLote": false,
//            "temOcorrenciaImpedimento": false,
//            "ocorrenciaImpedimentoVisivelOj": false,
//            "juizoDigital": true,
//            "numero": 11628
//        },
//        {
//            "id": 4752848,
//            "idOrgaoJulgador": 349,
//            "descricaoOrgaoJulgador": "CON2 - Bauru",
//            "idAgrupamento": 23,
//            "idClasseJudicial": 535,
//            "classeJudicial": "ATOrd",
//            "numeroProcesso": "0010352-88.2026.5.15.0090",
//            "segredoDeJustica": false,
//            "faseProcessual": "Conhecimento",
//            "idTarefa": 558,
//            "tarefa": "Elaborar sentença",
//            "dataEntradaTarefa": "2026-08-19T16:51:39.468",
//            "temComentario": false,
//            "temComentarioSecretaria": false,
//            "prazoExpirado": false,
//            "prazoExpiradoSecretaria": false,
//            "prazoExpiradoLocalizacao": false,
//            "prioridadeProcessual": 0,
//            "nomeParteAutora": "ALEX LOPES CABRAL",
//            "qtdeParteAutora": 1,
//            "nomeParteRe": "JUNIOR MARIANO SERVICOS ADMINISTRATIVOS, SEGURANCA E LIMPEZA LTDA",
//            "qtdeParteRe": 2,
//            "isTarefaAssinaturaLote": false,
//            "temOcorrenciaImpedimento": false,
//            "ocorrenciaImpedimentoVisivelOj": false,
//            "juizoDigital": true,
//            "numero": 10352
//        },
//        {
//            "id": 4674159,
//            "idOrgaoJulgador": 349,
//            "descricaoOrgaoJulgador": "CON2 - Bauru",
//            "idAgrupamento": 19,
//            "idClasseJudicial": 608,
//            "classeJudicial": "ATSum",
//            "numeroProcesso": "0012143-29.2025.5.15.0090",
//            "segredoDeJustica": false,
//            "faseProcessual": "Conhecimento",
//            "idTarefa": 561,
//            "tarefa": "Assinar sentença",
//            "dataEntradaTarefa": "2026-08-19T20:48:36.993",
//            "temComentario": false,
//            "temComentarioSecretaria": false,
//            "prazoExpirado": false,
//            "prazoExpiradoSecretaria": false,
//            "prazoExpiradoLocalizacao": false,
//            "prioridadeProcessual": 0,
//            "nomeParteAutora": "HUGO JOSE RIBEIRO MARQUES",
//            "qtdeParteAutora": 1,
//            "nomeParteRe": "CONCILIG TELEMARKETING E COBRANCA LTDA.",
//            "qtdeParteRe": 1,
//            "isTarefaAssinaturaLote": true,
//            "temOcorrenciaImpedimento": false,
//            "ocorrenciaImpedimentoVisivelOj": false,
//            "idMinutaKz": 305191770,
//            "juizoDigital": true,
//            "minutaPendenteAnalise": false,
//            "codTipoMinuta": 7007,
//            "numero": 12143
//        },
//        {
//            "id": 4615844,
//            "idOrgaoJulgador": 349,
//            "descricaoOrgaoJulgador": "CON2 - Bauru",
//            "idAgrupamento": 23,
//            "idClasseJudicial": 535,
//            "classeJudicial": "ATOrd",
//            "numeroProcesso": "0011876-57.2025.5.15.0090",
//            "segredoDeJustica": false,
//            "faseProcessual": "Conhecimento",
//            "idTarefa": 558,
//            "tarefa": "Elaborar sentença",
//            "dataEntradaTarefa": "2026-08-20T14:26:28.173",
//            "temComentario": false,
//            "temComentarioSecretaria": false,
//            "prazoExpirado": false,
//            "prazoExpiradoSecretaria": false,
//            "prazoExpiradoLocalizacao": false,
//            "prioridadeProcessual": 0,
//            "nomeParteAutora": "ANA GABRIELA RAMOS",
//            "qtdeParteAutora": 1,
//            "nomeParteRe": "52.409.248 JOSE NILTON DE LIMA",
//            "qtdeParteRe": 1,
//            "isTarefaAssinaturaLote": false,
//            "temOcorrenciaImpedimento": false,
//            "ocorrenciaImpedimentoVisivelOj": false,
//            "juizoDigital": true,
//            "minutaPendenteAnalise": false,
//            "codTipoMinuta": 7323,
//            "numero": 11876
//        },
//        {
//            "id": 4435754,
//            "idOrgaoJulgador": 349,
//            "descricaoOrgaoJulgador": "CON2 - Bauru",
//            "idAgrupamento": 23,
//            "idClasseJudicial": 535,
//            "classeJudicial": "ATOrd",
//            "numeroProcesso": "0011750-04.2025.5.15.0091",
//            "segredoDeJustica": false,
//            "faseProcessual": "Conhecimento",
//            "idTarefa": 558,
//            "tarefa": "Elaborar sentença",
//            "dataEntradaTarefa": "2026-08-21T11:05:26.897",
//            "temComentario": false,
//            "temComentarioSecretaria": false,
//            "prazoExpirado": false,
//            "prazoExpiradoSecretaria": false,
//            "prazoExpiradoLocalizacao": false,
//            "prioridadeProcessual": 0,
//            "nomeParteAutora": "PAULO BRITTES FILHO",
//            "qtdeParteAutora": 1,
//            "nomeParteRe": "CAIXA ECONOMICA FEDERAL",
//            "qtdeParteRe": 1,
//            "isTarefaAssinaturaLote": false,
//            "temOcorrenciaImpedimento": false,
//            "ocorrenciaImpedimentoVisivelOj": false,
//            "juizoDigital": true,
//            "numero": 11750
//        },
//        {
//            "id": 4453047,
//            "idOrgaoJulgador": 349,
//            "descricaoOrgaoJulgador": "CON2 - Bauru",
//            "idAgrupamento": 23,
//            "idClasseJudicial": 535,
//            "classeJudicial": "ATOrd",
//            "numeroProcesso": "0011964-92.2025.5.15.0091",
//            "segredoDeJustica": false,
//            "faseProcessual": "Conhecimento",
//            "idTarefa": 558,
//            "tarefa": "Elaborar sentença",
//            "dataEntradaTarefa": "2026-08-21T13:46:18.994",
//            "temComentario": false,
//            "temComentarioSecretaria": false,
//            "prazoExpirado": false,
//            "prazoExpiradoSecretaria": false,
//            "prazoExpiradoLocalizacao": false,
//            "prioridadeProcessual": 0,
//            "nomeParteAutora": "MARCIO AUGUSTO DE ANDRADE",
//            "qtdeParteAutora": 1,
//            "nomeParteRe": "DEXCO S.A",
//            "qtdeParteRe": 1,
//            "isTarefaAssinaturaLote": false,
//            "temOcorrenciaImpedimento": false,
//            "ocorrenciaImpedimentoVisivelOj": false,
//            "juizoDigital": false,
//            "numero": 11964
//        },
//        {
//            "id": 4736968,
//            "idOrgaoJulgador": 349,
//            "descricaoOrgaoJulgador": "CON2 - Bauru",
//            "idAgrupamento": 23,
//            "idClasseJudicial": 608,
//            "classeJudicial": "ATSum",
//            "numeroProcesso": "0010243-74.2026.5.15.0090",
//            "segredoDeJustica": false,
//            "faseProcessual": "Conhecimento",
//            "idTarefa": 558,
//            "tarefa": "Elaborar sentença",
//            "dataEntradaTarefa": "2026-08-21T14:30:43.791",
//            "temComentario": false,
//            "temComentarioSecretaria": false,
//            "prazoExpirado": false,
//            "prazoExpiradoSecretaria": false,
//            "prazoExpiradoLocalizacao": false,
//            "prioridadeProcessual": 0,
//            "nomeParteAutora": "DIEGO DE LIMA PERES",
//            "qtdeParteAutora": 1,
//            "nomeParteRe": "AVOCADO BRASIL COMERCIO DE ALIMENTOS LTDA - ME",
//            "qtdeParteRe": 1,
//            "isTarefaAssinaturaLote": false,
//            "temOcorrenciaImpedimento": false,
//            "ocorrenciaImpedimentoVisivelOj": false,
//            "juizoDigital": true,
//            "numero": 10243
//        },
//        {
//            "id": 4737357,
//            "idOrgaoJulgador": 349,
//            "descricaoOrgaoJulgador": "CON2 - Bauru",
//            "idAgrupamento": 23,
//            "idClasseJudicial": 608,
//            "classeJudicial": "ATSum",
//            "numeroProcesso": "0010246-29.2026.5.15.0090",
//            "segredoDeJustica": false,
//            "faseProcessual": "Conhecimento",
//            "idTarefa": 558,
//            "tarefa": "Elaborar sentença",
//            "dataEntradaTarefa": "2026-08-21T14:31:42.03",
//            "temComentario": false,
//            "temComentarioSecretaria": false,
//            "prazoExpirado": false,
//            "prazoExpiradoSecretaria": false,
//            "prazoExpiradoLocalizacao": false,
//            "prioridadeProcessual": 0,
//            "nomeParteAutora": "DERIK PATRIK DE LUCA BENEDITO",
//            "qtdeParteAutora": 1,
//            "nomeParteRe": "AVOCADO BRASIL COMERCIO DE ALIMENTOS LTDA - ME",
//            "qtdeParteRe": 1,
//            "isTarefaAssinaturaLote": false,
//            "temOcorrenciaImpedimento": false,
//            "ocorrenciaImpedimentoVisivelOj": false,
//            "juizoDigital": true,
//            "numero": 10246
//        }
//    ]
//}
//
// https://pje-web-hm.trt15.jus.br/pje-comum-api/api/gim/processos/todos?pagina=1&tamanhoPagina=20&ordenacaoCrescente=true&filtrarPorResponsavel=false&data=1788896070474&idOrgaoJulgador=349&assinarTodos=true
//
// https://pje-web-hm.trt15.jus.br/pjekz/painel/gim
async function sisbajudInicia(){
    //return
    let janela = confereJanela(JANELA.sisbajudCadastrarMinuta, JANELA.sisbajudOrdemJudicial)
    if (!janela) return
    if (confereJanela(JANELA.sisbajudOrdemJudicial)){
        botaoCertificar()
        return
    }
    await aguardarElemento('.uikit-actions button')
    await suspender(500)
    let botaoProtocolar = [...document.querySelectorAll('.uikit-actions button')].find(d => normalizar(d.textContent).includes('protocolar')) || null
    if (!botaoProtocolar) return
    let idBotao = idg('sisbajud', 'protolocar_e_inserirGigs')
    document.getElementById(idBotao)?.remove()
    let botao = criaBotaoLaranja({
        id: idBotao,
        ancestral: '.uikit-actions',
        texto: 'Protocolar e inserir CHIP/GIG',
        acao: () => abrirUrlSisbajud('criaGIGeCHIP')
    })
    botao.style.display = 'inline-block'

    async function abrirUrlSisbajud(parametro){
        aguardarElemento('.uikit-actions button[title="Protocolar Minuta"]')
        await suspender(300)
        clicar('.uikit-actions button[title="Protocolar Minuta"]')
        let numero = document.querySelector('.sisbajud-label-valor')?.textContent.trim()
        if (!numero){
            rota_avisoObrigatorio('Ocorreu um erro. Atualize a página e tente novamente.', 5)
            return
        }
        let url = 'https://pje.trt15.jus.br/pje-consulta-api/api/processos/dadosbasicos/' + numero
        let dadosBasicos = await NAVEGADOR.runtime.sendMessage({
			requisicao: url,
			configuracao: {
				method: 'GET',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json', 'Accept': '*/*' },
				
			}
		})
        
        if (!dadosBasicos.sucesso){
            rota_avisoObrigatorio('Ocorreu um erro. Atualize a página e tente novamente.', 5)
            return
        }
        let {dados} = dadosBasicos
        if (!dados[0]?.id){
            rota_avisoObrigatorio('Ocorreu um erro. Atualize a página e tente novamente.', 5)
            return
        }
        let execucao = Date.now()
        await armazenar({rotapje_sisbajudExecucao: execucao})
        let detalhe = {
            'criaGIGeCHIP': 'detalhe',
            'sisbajudCertificar': 'documento/anexar'
        }
        let urlAbrir = 'https://pje.trt15.jus.br/pjekz/processo/' + dados[0]?.id + '/' + detalhe[parametro] +'?rotapje_sisbajud=' + parametro + '&rotapje_sisbajudExecucao=' + execucao
        abrirURL({url: urlAbrir})
        
    }

    async function botaoCertificar(){
        await aguardarElemento('.uikit-actions button')
        await suspender(500)
        let idBotao = idg('sisbajud', 'certificar')
        document.getElementById(idBotao)?.remove()
        let textoProtocolo = [...document.querySelectorAll('div .row [class*="label"]')].map(d => d.textContent).join('\n')
        let colReus = [...document.querySelectorAll('sisbajud-table-reus td')].filter(c=> c.textContent.trim())
        let textoReus = colReus.map(d=> {
            let span = [...d?.querySelectorAll('span')].filter(d=> d?.textContent).map(d => d).join(' - ')
            let aEl = [...d?.querySelectorAll('a')].filter(d=> d?.textContent).map(d => d).join(' - ')
            return(span + '\n' + a)
        })
        /*
        textoReus = colReus.map(d=> {
            let span = [...d?.querySelectorAll('span')].filter(d=> d?.textContent).map(d => d.textContent).join(' - ')
            let aEl = [...d?.querySelectorAll('a')].filter(d=> d?.textContent).map(d => d.textContent).join(' - ')
            return(span + ' ' + aEl)
        })
        */
        let botao = criaBotaoLaranja({
            id: idBotao,
            ancestral: '.uikit-actions',
            texto: 'Certificar',
            acao: () => abrirUrlSisbajud('sisbajudCertificar')
        })
        botao.style.display = 'inline-block'
    }
    //let botoes = elemento.querySelectorAll('button')
}

async function sisbajudDetalhesAbriu(){
    let janela = confereJanela(JANELA.detalhes, JANELA.certificar)
    if (!janela) return
    let parametros = new URLSearchParams(document.location.search);
    let sisbajud = parametros.get('rotapje_sisbajud')?.trim()
    if(!sisbajud) return
    let execucao = parametros.get('rotapje_sisbajudExecucao')
    let armazenamento = await obterArmazenamento('rotapje_sisbajudExecucao') || {}
    let execucaoArmazenada = armazenamento?.rotapje_sisbajudExecucao
    if (execucao != execucaoArmazenada) return
    mFuncoes = {
        criaGIGeCHIP,
        sisbajudCertificar
    }
    mFuncoes[sisbajud]()
    return

    async function sisbajudCertificar() {
        
    }

    async function criaGIGeCHIP(){
        await aguardarElemento('pje-historico button.botao-esconder-gigs')
        if (!document.querySelector('.conteudo-historico #gigs')) clicar('pje-historico button.botao-esconder-gigs')
        let usuarioArmazenado = await obterArmazenamento('rota_usuario') || {}
        let responsavel = usuarioArmazenado?.rota_usuario?.nome || null
        let salvar = responsavel ? true : false
        let fechar = responsavel ? true : false
        let gig = await inserirGigsNaTelaDeDetalhesDoProcesso({tipoAtividade: 'SISBAJUD', dias: 5, responsavel, salvar, observacao: 'Resposta SISBAJUD'})
        await aguardarElemento('simple-snack-bar')
        let sucesso = document.querySelector('simple-snack-bar')
        await aguardarElemento('pje-lista-etiquetas button[mattooltip="Incluir Chip Amarelo"]')
        await suspender(500)
        if([...document.querySelectorAll('mat-chip-list mat-chip')].find(c => normalizar(c?.textContent).includes('sisbajud')) && sucesso && gig && fechar){
            await removerArmazenamento('rotapje_sisbajudExecucao')
            //alert ('fechar')
            window.close()
        }
        clicar('pje-lista-etiquetas button[mattooltip="Incluir Chip Amarelo"]')
        await aguardarElemento('pje-inclui-etiquetas-dialogo li')
        await suspender(500)
        let sucessoChip = false
        let opcao = [...document.querySelectorAll('pje-inclui-etiquetas-dialogo li')].find(c => normalizar(c.textContent).includes('sisbajud')) || null
        let opcaoClique = opcao?.querySelector('input') || null
        if (opcao && opcaoClique) {
            clicar(opcaoClique)
            await aguardarElemento('.container-botoes button')
            let textoChip = opcao?.textContent.trim()
            let salvarChip = [...document.querySelectorAll('.container-botoes button')].find(b => normalizar(b.textContent).includes('salvar')) || null
            if (salvarChip) clicar(salvarChip)
            await aguardarElemento('mat-chip-list mat-chip[aria-label*=' + textoChip + ']')
            sucessoChip = true
        }
        //while(sucesso.isConnected){
        //    await suspender(1000)
        //}
        if (gig && fechar && sucesso?.textContent.includes('salva com sucesso') && sucessoChip){
            await removerArmazenamento('rotapje_sisbajudExecucao')
            window.close()
        }
    }
}

/*


https://pje.trt15.jus.br/pjekz/processo/id/detalhe
0000098-73.2014.5.15.0091 - {
    "sucesso": true,
    "dados": [
        {
            "id": 2449534,
            "numeroIdentificacaoJustica": 515,
            "numero": "0000098-73.2014.5.15.0091",
            "classe": "ATOrd",
            "codigoOrgaoJulgador": "091 ",
            "segredoJustica": false,
            "juizoDigital": false
        }
    ]
}
*/
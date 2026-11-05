async function sisbajudInicia(){
    return
    let janela = confereJanela(JANELA.sisbajudCadastrarMinuta)
    if (!janela) return
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
        acao: () => protocolarEInserirChip()
    })
    botao.style.display = 'inline-block'

    async function protocolarEInserirChip(){
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
        alert(JSON.stringify(dadosBasicos))
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
        let urlAbrir = 'https://pje.trt15.jus.br/pjekz/processo/' + dados[0]?.id + '/detalhe?rotapje_sisbajud=criaGIGeCHIP&rotapje_sisbajudExecucao=' + execucao
        abrirURL({url: urlAbrir})
        
    }
    //let botoes = elemento.querySelectorAll('button')
}

async function sisbajudDetalhesAbriu(){
    let parametros = new URLSearchParams(document.location.search);
    let sisbajud = parametros.get('rota_pje_sisbajud')
    if(!sisbajud) return
    let execucao = parametros.get('rotapje_sisbajudExecucao')
    let armazenamento = await obterArmazenamento('rotapje_sisbajudExecucao') || {}
    let execucaoArmazenada = armazenamento?.rotapje_sisbajudExecucao
    if (execucao != execucaoArmazenada) return
    await aguardarElemento('pje-historico button.botao-esconder-gigs')
    if (!document.querySelector('.conteudo-historico #gigs')) clicar('pje-historico button.botao-esconder-gigs')
    let usuarioArmazenado = await obterArmazenamento('rota_usuario') || {}
    let responsavel = usuarioArmazenado?.rota_usuario?.nome || null
    let salvar = responsavel ? true : false
    let fechar = responsavel ? true : false
    let gig = await inserirGigsNaTelaDeDetalhesDoProcesso({tipoAtividade: 'SISBAJUD', dias: 5, responsavel, salvar, observacao: 'Resposta SISBAJUD'})
    if (gig && fechar){
        await removerArmazenamento('rotapje_sisbajudExecucao')
        window.close()
    }
    rota_avisoObrigatorio('Ocorreu um erro ao inserir o GIG. Prossiga manualmente.', 5)
    
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
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
        let urlAbrir = 'https://pje.trt15.jus.br/pjekz/processo/' + dados[0]?.id + '/detalhe?rota_pje_sisbajud=criaGIGeCHIP'
        abrirURL({url: urlAbrir})
        
    }
    //let botoes = elemento.querySelectorAll('button')
}

function sisbajudDetalhesAbriu(){
    return
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
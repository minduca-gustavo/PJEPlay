async function compiladorDeAssistentes() {
    let funcao = 'compiladorDeAssistentes'
    let elemento = 'divFlutuante'
    let compilador = await criaDivFlutuante({
        id: id(funcao, elemento),
        titulo: 'Assistentes',
        largura: '230px',
        ancestral: '#ffff',
        armazenarRecolhido: true
    })
    let mapaFuncoes = {
        assistenteAssinaturaDocumentos,
        consultaQualquerOJ,
        leituraDinamicaDocumentos
    }
    let assistentes = [
        {
            id: 'consulta-qualquer-oj',
            titulo: 'Consulta em qualquer OJ',
            funcao: 'consultaQualquerOJ'
        },
        {
            id: 'leitura-dinamica',
            titulo: 'Leitura Dinâmica',
            funcao: 'leituraDinamicaDocumentos'
        },
        {
            id: 'assistente-assinatura',
            titulo: 'Assistente de assinatura',
            funcao: 'assistenteAssinaturaDocumentos'
        },
        {
            id: 'assistente-assinatura',
            titulo: 'Assistente de assinatura',
            funcao: 'assistenteAssinaturaDocumentos',
            inativo: true
        },
    ]
    for (assistente of assistentes){
        if (assistente.inativo) continue
        let ancestral = id(funcao, elemento) + '-corpo'
        let mostraRecolhe = await criaSecaoMostraRecolhe({
            id: id(assistente.id, 'mostra-recolhe'),
            idSempreAMostra: id(assistente.id, 'mostra'), 
            idRecolhe: id(assistente.id, 'recolhe'), 
            ancestral: ancestral,
            armazenarExpandido: true
        })
        let titulo = criaSubTitulo({
            id: id(assistente.id, 'titulo'),
            texto: assistente.titulo,
            ancestral: id(assistente.id, 'mostra')
        })
        let funcaoChamar = assistente?.funcao
        mapaFuncoes[funcaoChamar](ancestral)
    }
}

compiladorDeAssistentes()
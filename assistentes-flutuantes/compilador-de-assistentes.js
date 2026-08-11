async function compiladorDeAssistentes() {
    let funcao = 'compiladorDeAssisntes'
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
        let mostraRecolhe = await criaSecaoMostraRecolhe({
            id,
            idSempreAMostra, 
            idRecolhe, 
            ancestral, 
            expandido
        })
    }
}

compiladorDeAssistentes()
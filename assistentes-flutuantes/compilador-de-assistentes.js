async function compiladorDeAssistentes() {
    
    let assistentes = [
        {
            id: 'consulta-qualquer-oj',
            titulo: 'Consulta em qualquer OJ',
            funcao: 'consultaQualquerOJ',
            janelas: [JANELA.meuPainel, JANELA.painelGlobal, JANELA.painelGlobalTodos],
        },
        {
            id: 'leitura-dinamica',
            titulo: 'Leitura Dinâmica',
            funcao: 'leituraDinamicaDocumentos',
            janelas: [
                JANELA.meuPainel,          
                JANELA.painelGlobalTarefas,
                JANELA.painelGlobalTodos, 	
                JANELA.escaninho, 			
                JANELA.pautaAudiencias, 	
                JANELA.atasAudiencias, 	
                JANELA.gigsRelatorios, 	
            ],
        },
        {
            id: 'assistente-assinatura',
            titulo: 'Assistente de assinatura',
            funcao: 'assistenteAssinaturaDocumentos',
            janelas: [JANELA.analisarEAssinar],
        },
        {
            id: 'filtros-novos',
            titulo: 'Super Filtros',
            funcao: 'filtrosNovos',
            janelas: [],
            inativo: true
        },
    ]
    
    let janela = confereJanela(...assistentes.map(d => d?.janelas).flat())
    if (!janela) return
    let funcao = 'compiladorDeAssistentes'
    let elemento = 'divFlutuante'
    let idCompilador = id(funcao, elemento)
    let compiladorAntigo = document.querySelector('#' + idCompilador)
    if (compiladorAntigo) compiladorAntigo.remove()
    let compilador = await criaDivFlutuante({
        id: idCompilador,
        titulo: 'Assistentes',
        largura: '230px',
        ancestral: '#ffff',
        armazenarRecolhido: true
    })
    let compiladorCorpo = document.getElementById(idCompilador + '-corpo')
    compiladorCorpo.style.gap = '0px'
    compiladorCorpo.style.padding = '0px 0 0px 0'
    let mapaFuncoes = {
        assistenteAssinaturaDocumentos,
        consultaQualquerOJ,
        leituraDinamicaDocumentos
    }
    
    for (assistente of assistentes){
        if (assistente.inativo) continue
        let janela = confereJanela(...assistente?.janelas)
        if (!janela) continue
        let ancestral = id(funcao, elemento) + '-corpo'
        let mostraRecolhe = await criaSecaoMostraRecolhe({
            id: id(assistente.id, 'mostra-recolhe'),
            idSempreAMostra: id(assistente.id, 'mostra'), 
            idRecolhe: id(assistente.id, 'recolhe'), 
            ancestral: ancestral,
            armazenarExpandido: true
        })
        mostraRecolhe.style.marginBottom = '0px'
        mostraRecolhe.style.marginTop = '0px'
        mostraRecolhe.style.gap = '0px'
        mostraRecolhe.style.padding = '0px 0px 0px 0px'
        mostraRecolhe.corpo.style.padding = '0px 0px 0px 0px'
        let titulo = criaTitulo({
            id: id(assistente.id, 'titulo'),
            texto: assistente.titulo,
            ancestral: id(assistente.id, 'mostra')
        })
        let funcaoChamar = assistente?.funcao
        console.log('%c[Rota PJE]%c mapaFuncoes[funcaoChamar]: ' + JSON.stringify(typeof mapaFuncoes[funcaoChamar]), LOG.mb, 'color:inherit')
        let funcaoConfere = mapaFuncoes[funcaoChamar](id(assistente.id, 'recolhe'))
        console.log('%c[Rota PJE]%c funcaoConfere: ' + JSON.stringify(typeof funcaoConfere), LOG.erro, 'color:inherit')
    }
    
}
window.addEventListener('pjerota:url-mudou', () => {
    // fecha o painel de minutas antes de remontar o widget — o conteúdo
    // é sempre da tela anterior e ficaria órfão
    //document.querySelector('#rota_assistenteAssinatura_painelMinutas')?.remove()
    compiladorDeAssistentes()
})
compiladorDeAssistentes()


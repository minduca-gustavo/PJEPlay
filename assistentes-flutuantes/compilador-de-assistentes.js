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
            janelas: [JANELA.painelGlobalTodos],
            //inativo: true
        },
        { id: 'prazos-periciais', titulo: 'Prazos Periciais', funcao: 'assistentePrazosPericiais', janelas: [JANELA.aud] },
        { id: 'peritos',          titulo: 'Peritos',          funcao: 'assistentePeritos',          janelas: [JANELA.aud] },
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
    let chaveStorage = id(idCompilador) + '-expandido'
    let store = await obterArmazenamento([chaveStorage])
    let temValorSalvo = store?.[chaveStorage] !== undefined
    let compiladorCorpo = document.getElementById(idCompilador + '-corpo')
    compiladorCorpo.style.gap = '0px'
    compiladorCorpo.style.padding = '0px 0 0px 0'
    if (!temValorSalvo) {
        compiladorCorpo.style.diplay = 'flex'
    } 
    let mapaFuncoes = {
        assistenteAssinaturaDocumentos,
        consultaQualquerOJ,
        leituraDinamicaDocumentos,
        filtrosNovos,
        assistentePeritos,
        assistentePrazosPericiais,
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
        let mostraRecolheCorpo = document.querySelector(id(assistente.id, 'recolhe'))
        mostraRecolhe.corpo.style.padding = '0px 0px 0px 0px'
        if (!mostraRecolheCorpo && assistente?.id === 'consulta-qualquer-oj'){
            let chaveStorage = id(assistente.id, 'mostra-recolhe') + '-expandido'
            let store = await obterArmazenamento([chaveStorage])
            let temValorSalvo = store?.[chaveStorage] !== undefined
            if (!temValorSalvo) {
                let elemento = document.querySelector('#' + id(assistente.id, 'mostra'))
                await clicar(elemento)
                await armazenar({ [chaveStorage]: true })
            } 
        }
        // depois que o mecanismo rodar, ele gerencia o overflow normalmente
        let titulo = criaTitulo({
            id: id(assistente.id, 'titulo'),
            texto: assistente.titulo,
            ancestral: id(assistente.id, 'mostra')
        })
        let funcaoChamar = assistente?.funcao
        console.log('%c[Rota PJE]%c mapaFuncoes[funcaoChamar]: ' + JSON.stringify(typeof mapaFuncoes[funcaoChamar]), LOG.mb, 'color:inherit')
        if (assistente.id !== 'filtros-novos'){
            let funcaoConfere = mapaFuncoes[funcaoChamar](id(assistente.id, 'recolhe'))
            console.log('%c[Rota PJE]%c funcaoConfere: ' + JSON.stringify(typeof funcaoConfere), LOG.erro, 'color:inherit')
        } else {
            mostraRecolhe.aoAlternar = mapaFuncoes[funcaoChamar](id(assistente.id, 'recolhe'))
        }
    }
    
}
window.addEventListener('pjerota:url-mudou', () => {
    // fecha o painel de minutas antes de remontar o widget — o conteúdo
    // é sempre da tela anterior e ficaria órfão
    //document.querySelector('#rota_assistenteAssinatura_painelMinutas')?.remove()
    compiladorDeAssistentes()
})
compiladorDeAssistentes()


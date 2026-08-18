// ── TDs excluídos da busca de número de processo ────────────────
//
// O rastreamento de processo em colorirDinamico() percorre toda 'tr'
// da página e, dentro dela, procura o 'td' cujo texto bate com
// ROTA_REGEX_CNJ. Em algumas telas mais de um td da mesma linha
// contém um número de processo (ex: coluna oculta, tooltip, link
// duplicado) e não é o td onde queremos o badge.
//
// Em vez de trocar o seletor principal a cada tela nova, acrescente
// aqui os seletores CSS dos tds que devem ser IGNORADOS na busca —
// o primeiro td restante (na ordem do DOM) que bater com o regex é
// o escolhido.
//
// ex: ROTA_FILTROS_NOVOS_TDS_EXCLUIDOS.push('.mat-column-acoes')
const ROTA_FILTROS_NOVOS_TDS_EXCLUIDOS = [
    // 'seletor-css-do-td-que-nao-deve-ser-usado',
]

async function filtrosNovos(ancestral) {
    let widget = document.querySelector('#rota_filtrosNovos')
    if (widget) widget.remove()
    let janela = confereJanela(
        JANELA.meuPainel,          
        JANELA.painelGlobal,      	
        JANELA.painelGlobalTarefas,
        JANELA.painelGlobalTodos, 	
        JANELA.escaninho, 			
        JANELA.pautaAudiencias, 	
        JANELA.atasAudiencias, 	
        JANELA.gigsRelatorios, 	
    )
    if (!janela){
        console.log('%c[Rota PJE]%c filtrosNovos4: ' + JSON.stringify(4), LOG.rosa, 'color:inherit')
        return
    }
    console.log('%c[Rota PJE]%c filtrosNovos4' + JSON.stringify('true'), LOG.rosa, 'color:inherit')
    criaWidgetfiltrosNovos(ancestral)
}

//filtrosNovos()

//window.addEventListener('pjerota:url-mudou', () => {
//    document.getElementById('pjerota-consulta_qualquer_oj-widget')?.remove()
//    filtrosNovos()
//})

async function criaWidgetfiltrosNovos(ancestral) {
    let autenticacaoArmazenada = 'rota_filtroAutenticacao'
    let autenticado = await obterArmazenamento([autenticacaoArmazenada]).then(d => d[autenticacaoArmazenada])
    let div = 'filtros'
    let divFiltros = criaDiv({
        id: id(div), 
        ancestral: ancestral
    })
    
    if (!autenticado){
        await obterAutenticacao(id(div))
    } else {
        await apresentaFiltros()
    }
    return

    async function obterAutenticacao(ancestral) {
        
        let subTitulo = criaSubTitulo({

        })
        return
    }

    async function apresentaFiltros(params) {
        return
    }
    
    let mapaFuncoes ={
        criaInput

    }
    let div = await criaDivFlutuante({
        id: 'rota_filtrosNovos', 
        titulo: 'Filtros Novos', 
        largura: '250px', 
        ancestral: 'ffff',
        armazenarRecolhido: true
    })
    let subTitulo = criaSubTitulo({
        id: 'rota_filtrosNovos_subTitulo',
        texto: 'Filtra processos e outros.',
        ancestral: 'rota_filtrosNovos-corpo',
    })
    let botoes = [
        {
            funcao: 'peticao',
            label: 'Petições não apreciadas',
            parametros: ''
        },
        {
            funcao: 'peticao',
            label: 'Petições não apreciadas',
            parametros: ''
        },
        {
            funcao: 'peticao',
            label: 'Petições não apreciadas',
            parametros: ''
        },
    ]
    
    for (b of botoes){
        let funcao = b?.funcao
        let botao = criaBotaoAzul({
            id: botao?.funcao,
            texto: botao?.texto,
            ancestral: 'rota_filtrosNovos-corpo',
            acao: mapaFuncoes[funcao](b.parametros)
        })
    }
}

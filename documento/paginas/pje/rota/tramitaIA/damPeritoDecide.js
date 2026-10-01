async function tramitaIASecaoDamPeritoDecide(elementoAncestral, ancestralLimpar, rechamada = false, dadosRechamada) {
    if (rechamada){

    }
    let el = document.getElementById(elementoAncestral)
    el.style.flexDirection = 'row-reverse'
    el.style.alignItems = 'baseline'
    let botoes = [
        {
            id: 'lista',
            texto: 'Lista',
        },
        {
            id: 'tarefa',
            texto: 'Tarefa elaborar sentença'
        },
    ]
    for(let botao of botoes){
        let b = criaBotaoLaranja({
            id: elementoAncestral + '_' + botao?.id,
            texto: botao?.texto,
            ancestral: elementoAncestral,
            acao: async () => await damBusca(botao?.id)
        })
        b.style.alignSelf = 'center'
    }
    let texto = criaTexto({
        id: elementoAncestral + '_texto',
        ancestral: elementoAncestral,
        texto: 'Escolha um dos modos. Funciona buscando TODOS da tarefa Elaborar Sentença, ou inserindo uma lista de números de processos. A IA responderá: há parecer pericial? Cobre todos os pontos dos EEs ou ISLs?'
    })
    let titulo = criaSubTitulo({
        id: elementoAncestral + '_titulo',
        ancestral: elementoAncestral,
        texto: 'Filtra processos com parecer pericial para decisão na DAM'
    })
    function damBusca(modo){
        if (modo === 'lista'){
            rota_avisoObrigatorio('Não implementado', 5)
            return
        }

    }
}
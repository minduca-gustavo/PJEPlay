async function gestao_inicializar() {
    let janela = location.href.includes('navegador/paginas/menu/menu-gestor.htm')
    if (!janela) {
        return
    }
    console.log('%c[Rota PJE]%c Menu Gestão' + JSON.stringify(), LOG.aviso, 'color:inherit')
    let divId = id('gestao', 'corpo')
    let div = criaDiv({
        id: divId,
        ancestral: 'rota_corpo_gestao',
        rowColumn: 'row'
    })
    div.style.height = '100%'
    let divDoca = id('gestao', 'doca')
    let doca = criaDiv({
        id: divDoca,
        ancestral: divId,
        rowColumn: 'column'
    })
    doca.style.width = '100px'
    let botoesDoca = [
        {
            id: id('finais'),
            texto: '👨🏾‍⚖️\nFinais',
            tooltip: 'Finais por Vara/Final.',
            colunas: [{vara: 'Vara'}, {digitos: 'Dígitos'}, {magistrado: 'Magistrado'}],
        },
        {
            id: id('pericias'),
            texto: '🩺\nPerícias',
            tooltip: 'Tabela de peritos em atividade',
        },
        {
            id: id('juizes'),
            texto: '👩🏻‍⚖️\nJuízes',
            tooltip: 'Informações sobre Juízes - assistente/secretário, modelos de despacho, etc.',
        },
    ]
    for (let botao of botoesDoca) {
        let b = criaBotaoAzul({
            id: botao.id,
            ancestral: divDoca,
            texto: botao.texto,
            acao: () => grade_abrir(botao.id, botao.colunas)
        })
        b.style.width = '100%'
        b.style.height = '50px'
        b.style.whiteSpace = 'pre-line'
        b.addEventListener('mouseover', () => {
            if (botao.tooltip) {
                criaTooltip({ id: botao.id + '-tip', texto: botao.tooltip, elemento: b })
            }
        })
    }
    let divConteudo = id('gestao', 'conteudo')
    let conteudo = criaDiv({
        id: divConteudo,
        ancestral: divId,
        rowColumn: 'column'
    })
    conteudo.style.width = 'calc(100% - 100px)'
    conteudo.style.height = '100% - 50px'
    let divPrincipal = id('gestao', 'principal')
    let principal = criaDiv({
        id: divPrincipal,
        ancestral: divConteudo,
        rowColumn: 'row'
    })
    principal.style.width = '100%'
    principal.style.height = 'calc(100% - 50px)'
    let divRodape = id('gestao', 'rodape')
    let rodape = criaDiv({
        id: divRodape,
        ancestral: divConteudo,
        rowColumn: 'row'
    })
    rodape.style.width = '100%'
    rodape.style.height = '50px'
    async function grade_abrir(tipos, colunas) {
        let remover = document.getElementById(id('gestao', 'grade'))
        if (remover) {
            remover.remove()
        }
        let armazenamento = await obterArmazenamento(tipos) || {}
        let tipo = armazenamento?.tipo || []
        if (tipo.length === 0) {
            let idGrade = id('gestao', 'grade')
            criaGrade({
                id: idGrade,
                ancestral: divPrincipal,
                numeroColunas: colunas?.length || 1,
            })
        }
        
    }
}
gestao_inicializar()
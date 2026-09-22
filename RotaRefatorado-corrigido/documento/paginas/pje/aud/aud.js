async function menuPericiasAud() {
    let janela = confereJanela(JANELA.aud)
    if (!janela) return
    let seletorBarra = '.document-editor__toolbar .ck-toolbar__items'
    await aguardarElemento(seletorBarra)
    let barra = document.querySelector(seletorBarra)
    if (!barra) return
    let idBotaoPericias = id('aud', 'pericias', 'botao')
    let remover = [...document.querySelectorAll('#' + idBotaoPericias)].map(d => d.remove())
    let botaoPericias = criaBotaoLaranja({
        id: idBotaoPericias,
        ancestral: seletorBarra,
        texto: 'Perícias',
        acao: async () => await criaQuadroDePericias()
    })
    async function criaQuadroDePericias(){
        let idDivQuadro = id('aud', 'pericias', 'quadro')
        let remover = [...document.querySelectorAll('#' + idDivQuadro)].map(d => d.remove())
        let quadro = criaDiv({
            id: idDivQuadro,
            ancestral: 'ffff'
        })
        formataDiv(quadro, 'branco', '75%', '75%')
        let idCabecalho = id('aud', 'pericias', 'quadro', 'cabecalho')
        let cabecalho = criaDiv({
            id: idCabecalho,
            ancestral: idDivQuadro,
            rowColumn: 'row-reverse'
        })
        let idBotaoFechar = id('aud', 'pericias', 'quadro', 'fechar')
        let botaoFechar = criaBotaoAzul({
            id: idBotaoFechar,
            texto: '✕',
            ancestral: idCabecalho,
            acao: () => {
                document.getElementById(idDivQuadro)?.remove()
                return
            }
        })
        botaoFechar.style.height =          '20px'
        botaoFechar.style.fontSize =        '13px'
        botaoFechar.style.lineHeight =      '1px'
        botaoFechar.style.padding =         '2px 5px'
        botaoFechar.style.borderRadius =    '4px'
        let idTitulo = id('aud', 'pericias', 'quadro', 'titulo')
        let titulo = criaTitulo({
            id: idTitulo,
            texto: 'Perícias',
            ancestral: idCabecalho
        })
        titulo.style.width = '100%'
        titulo.style.fontSize = '18px'
        let idRolante = id('aud', 'pericias', 'quadro', 'rolante')
        let divRolante = criaDiv({
            id: idRolante,
            ancestral: idDivQuadro
        })
        divRolante.style.overflowY = 'auto'

        let dados = await buscarDadosPeritosGit()

        montarQuadro()

        function montarQuadro(idRolante, dados) {
            
        }

        async function buscarDadosPeritosGit() {
            return dados = await lerGit('rotapje_peritos.json')
        }
    }
}

function audFuncoes(){
    menuPericiasAud()
}
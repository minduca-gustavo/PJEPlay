// a fita é criada pelo fita-superior-detalhes.js, mas o script é chamado pelo
// quadro-juizesSempreVisivel para economizar uma requisição ao historicodeslocamentos

async function escolheMagistrado(ancestral, vara) {
    
    let botoes = [
        {
            tipo: 'configura',
            texto: 'CONFIGURA SELEÇÃO DE JUÍZES',            
            parametro: 'configura'
        },
        {
            tipo: 'simetria',
            texto: 'SIMETRIA',            
            parametro: 'juizSimetria'
        },
        {
            tipo: 'planilha',
            texto: 'JUIZ DA PLANILHA',
            parametro: 'juizPlanilha'
        },
        {
            tipo: 'titular',
            texto: 'TITULAR DO ÓRGÃO JULGADOR'
        },
        {
            tipo: 'ultima',
            texto: 'UTILIZADO NA ÚLTIMA CONCLUSÃO'
        },
        //{
        //    tipo: 'impedimentos',
        //    texto: 'ASSINANDO IMPEDIMENTOS'
        //}
    ]
    await aguardarElemento('pje-descricao-processo [role="button"]')
    await suspender(500)
    let processo = document.querySelector('pje-descricao-processo [role="button"]').textContent
    let juizSimetria =  await defineJuizSimetria(processo)
    let juizPlanilha =  await defineJuizPlanilha(vara, processo)
    let juizTitular =   await defineJuizApi('titular')
    let juizUltima =    await defineJuizApi('ultima')
    async function defineJuizSimetria(processo) {
        let gigs = await buscarGigs(processo) || []
        if (!gigs) return null
        let gigSimetria = gigs.find(d => d?.tipoAtividade?.descricaoConsulta.includes('GABINETE'))
        if (!gigSimetria) return null
        let juiz = gigSimetria.tipoAtividade.descricaoConsulta.split(/JUIZ[A]?/)[1].trim()
        return juiz ?? null
    }
    async function defineJuizPlanilha(vara, processo) {
        let anoProcesso = processo.slice(11, 15)
        let final = Number(anoProcesso) < 2010 ? processo.slice(4, 5) : processo.slice(6, 7)
        let git = await lerGit('rotapje_finais.json') || []
        let varasObjetos = git.filter(d => d?.Vara == vara) || []
        let varaDigito = varasObjetos.find(d => d?.Dígitos.includes(final)) || {}
        let juiz = varaDigito.Magistrado || null
        return juiz ?? null
    }
    async function defineJuizApi(parametro) {
        let interceptado = interceptador_ler('magistrados') || {}
        if (!interceptado?.magistradosSugeridos) return null
        let sugeridos = interceptado?.magistradosSugeridos || []
        let juizObjeto = sugeridos.find(j => normalizar(j?.destaques).includes(parametro)) || null
        return (juizObjeto?.nome)
    }
    let idMagistrado = id('escolheMagistrado', 'botao')
    let botaoConfigura = criaBotaoAzul({
        id: idMagistrado,
        ancestral,
        texto: 'Configura escolha de magistrados.',
        acao: () => escolheMagistradoConfigura()
    })
    estiloBotaoFitaSuperior(botaoConfigura)
    for (let botao of botoes){

    }
    async function escolheMagistradoConfigura(){
        let divId = id('escolheMagistrados', 'configura')
        let div = criaDiv({
            id: divId,
            ancestral: document.body
        })
        formataDiv(div, 'branco', '30%', '30%')
        let divCabecalho = criaDiv({
            id: divId + '_cabecalho',
            ancestral: divId,
            rowColumn: 'row-reverse'
        })
        divCabecalho.style.marginBottom = '0px'
        criaBotaoFechar({
            id: divId + '_botaoFechar',
            ancestral: divId + '_cabecalho',
            elementoFechar: divId,
        })
        let titulo = criaTitulo({
            id: divId + '_titulo',
            ancestral: divId + '_cabecalho',
            texto: 'Configure a escolha de magistrados.'
        })
        titulo.style.width = '100%'
        let texto = criaTexto({
            id: divId + '_textoEscolha',
            texto: 'Caso queira que seja atribuído automaticamente o Juiz ao abrir a página, escolha a fonte da escolha:',
            ancestral: divId
        })
        for (let botao of botoes){
            let idCheck = divId + '_check_' + botao.tipo
            if (botao.tipo == 'configura') continue
            let check = await criaCheckBox({
                id: idCheck,
                textoAoLado: botao.texto,
                ancestral: divId,
                salvar: true
            })
            check.dataset.tipo = botao.tipo
            check.addEventListener('click', () => alternarESalvar(idCheck))
        }
        async function alternarESalvar(idCheck) {
            console.log('%c[Rota PJE]%c 115 alternar: ' + JSON.stringify(115), LOG.aviso, 'color:inherit')
            let checks = [...document.querySelectorAll('[id^="' + divId + '_check_"')]
            for (let check of checks){
                console.log('%c[Rota PJE]%c check.id: ' + JSON.stringify(check.id), LOG.mb, 'color:inherit')
                console.log('%c[Rota PJE]%c idCheck: ' + JSON.stringify(idCheck), LOG.info, 'color:inherit')
                if (check.id.includes('caixa')) continue
                if (check.id != idCheck && check.dataset.marcado == 1 && document.getElementById(idCheck).dataset.marcado == 1) clicar('#' + check.id)
            }
        }
        
    }
}
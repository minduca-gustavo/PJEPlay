// a fita é criada pelo fita-superior-detalhes.js, mas o script é chamado pelo
// quadro-juizesSempreVisivel para economizar uma requisição ao historicodeslocamentos

async function escolheMagistrado(ancestral, vara, juizAEscolher = '') {
    if (juizAEscolher){
        let inputJuiz = document.querySelector('mat-select[placeholder="Magistrado"]')
        clicar(inputJuiz)
        await aguardarElemento('mat-option')
        await suspender()
        let opcoesJuizes = [...document.querySelectorAll('mat-option')]
        let opcaoJuiz = opcoesJuizes.find(d => normalizar(d?.textContent).includes(normalizar(juizAEscolher)))
        if(!opcaoJuiz){
            rota_avisoObrigatorio('Não foi encontrado o juiz ' + juizAEscolher + '. Tente novamente', 5)
            return
        }
        clicar(opcaoJuiz)
        //alert (juizAEscolher)
        return
    }
    
    let botoes = [
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
            texto: 'TITULAR DO ÓRGÃO JULGADOR',
            parametro: 'juizTitular'
        },
        {
            tipo: 'ultima',
            texto: 'UTILIZADO NA ÚLTIMA CONCLUSÃO',
            parametro: 'juizUltima'
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
    let juizes = {
        juizSimetria,
        juizPlanilha,
        juizTitular,
        juizUltima
    }
    async function defineJuizSimetria(processo) {
        let gigs = await buscarGigs(processo) || []
        console.log('%c[Rota PJE]%c gigs' + JSON.stringify(gigs), LOG.erro, 'color:inherit')
        if (!gigs.length) return null
        let gigSimetria = gigs.find(d => d?.tipoAtividade?.descricaoConsulta.includes('GABINETE D'))
        console.log('%c[Rota PJE]%c gigSimetria.length' + JSON.stringify(gigSimetria), LOG.erro, 'color:inherit', gigSimetria)
        if (!gigSimetria.tipoAtividade) return null
        let juizAtividade = gigSimetria.tipoAtividade.descricaoConsulta.split(/JUIZ[A]?/)
        let juiz = juizAtividade[1] ? juizAtividade[1].trim() : null
        return juiz
    }
    async function defineJuizPlanilha(vara, processo) {
        let anoProcesso = processo.slice(11, 15)
        let final = Number(anoProcesso) < 2010 ? processo.slice(4, 5) : processo.slice(6, 7)
        let git = await lerGit('rotapje_finais.json') || []
        console.log('%c[Rota PJE]%c git: ' + JSON.stringify(git), LOG.info, 'color:inherit')
        let varasObjetos = git.filter(d => d?.Vara == vara) || []
        console.log('%c[Rota PJE]%c varasObjetos: ' + JSON.stringify(varasObjetos), LOG.info, 'color:inherit')
        let varaDigito = varasObjetos.find(d => d?.Dígitos.includes(final)) || {}
        console.log('%c[Rota PJE]%c vara: ' + JSON.stringify(vara), LOG.info, 'color:inherit')
        console.log('%c[Rota PJE]%c varaDigito: ' + JSON.stringify(varaDigito), LOG.aviso, 'color:inherit')
        let juiz = varaDigito.Magistrado || null
        console.log('%c[Rota PJE]%c juiz: ' + JSON.stringify(juiz), LOG.info, 'color:inherit')
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
    let mFuncoes = {
        criaBotaoAzul,
        criaBotaoLaranja
    }
    let i = 0
    for (let botao of botoes){
        let funcao = i % 2 == 0 ? 'criaBotaoLaranja' : 'criaBotaoAzul'
        let parametro = botao.parametro
        let juiz = juizes[botao.parametro]
        if(!juiz) continue
        let bot = mFuncoes[funcao]({
            id: idMagistrado + '_botao_' + botao.tipo,
            texto: botao.texto + ': ' + juiz,
            ancestral,
            acao: () => escolheMagistrado('', '', juiz)
        })
        i++
        estiloBotaoFitaSuperior(bot)
    }
    let armazenamento = await obterArmazenamento(idMagistrado) || {}
    let opcao = armazenamento[idMagistrado] || ''
    if(!document.querySelector('#' + idMagistrado + '_botao_' + opcao)) return
    if(opcao) clicar('#' + idMagistrado + '_botao_' + opcao)
    console.log('%c[Rota PJE]%c opcao' + JSON.stringify(opcao), LOG.erro, 'color:inherit')
    async function escolheMagistradoConfigura(){
        let divId = id('escolheMagistrados', 'configura')
        let div = criaDiv({
            id: divId,
            ancestral: document.body
        })
        formataDiv(div, 'branco', '30%', '30%')
        div.style.overflowY = 'auto'
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
            let armazenado = (document.getElementById(idCheck).dataset.marcado == 1) ? document.getElementById(idCheck).dataset.tipo : ''
            await armazenar({[idMagistrado]: armazenado})
        }
        
    }
}
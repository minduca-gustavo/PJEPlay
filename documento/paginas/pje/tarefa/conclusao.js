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
        console.log('%c[Rota PJE]%c interceptado', LOG.teste, 'color:inherit', interceptado)
    }
    let idMagistrado = id('escolheMagistrado', 'botao')
    criaBotaoAzul({
        id: idMagistrado,
        ancestral,
        texto: 'Configura escolha de magistrados.',
        acao: () => escolheMagistradoConfigura()
    })
    async function escolheMagistradoConfigura(){
        let despachos = await obterArmazenamento(idBotaoConfigura) || {}
        let divId = id('despachosPreferidos', 'cadastro')
        let div = criaDiv({
            id: divId,
            ancestral: document.body
        })
        formataDiv(div, 'branco', '50%', '50%')
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
            texto: 'Cadastre seus despachos mais usados'
        })
        titulo.style.width = '100%'
        let textArea = criaInputAnotacao({
            id: divId + '_input',
            textoEmCima: 'Cadastre seus despachos mais usados, um por linha, com o nome a buscar e o título do botão (opcional), separados por vírgula. DICA: salve seu modelo acrescentando o número do ID do modelo (disponível na tela de edição de modelos), e use o número do ID no nome a buscar.',
            ancestral: divId
        })
        textArea.style.width = 'auto'
        textArea.style.height = '80%'
        textArea.textarea.style.height = '100%'
        textArea.textarea.placeholder = 'Ex:\nDesigna aud instrução, INSTRUÇÃO\nNomeação de perito, perito\nSentença de liquidação - órgão público'
        if (despachos[idBotaoConfigura] && despachos[idBotaoConfigura].length){
            let texto = despachos[idBotaoConfigura].map(d => d?.modelo + ', ' + d?.textoBotao).join('\n')
            textArea.textarea.value = texto
        }
        let divRodape = criaDiv({
            id: divId + '_rodape',
            ancestral: divId,
            rowColumn: 'row-reverse'
        })
        divRodape.style.marginBottom = '0px'
        criaBotaoAzul({
            id: divId + '_botaoSalvar',
            texto: 'Salvar alterações',
            ancestral: divId + '_rodape',
            acao: () => salvarAlteracoes(divId + '_input')
        })
    }
}
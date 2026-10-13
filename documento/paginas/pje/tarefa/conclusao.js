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
            texto: 'JUIZ DA PLANILHA'
        },
        {
            tipo: 'titular',
            texto: 'TITULAR DO ÓRGÃO JULGADOR'
        },
        {
            tipo: 'impedimentos',
            texto: 'ASSINANDO IMPEDIMENTOS'
        }
    ]
    await aguardarElemento('pje-descricao-processo [role="button"]')
    await suspender(500)
    let processo = document.querySelector('pje-descricao-processo [role="button"]').textContent
    let juizSimetria = defineJuizSimetria(processo)
    let juizPlanilha = defineJuizPlanilha(vara, processo)
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
        let final = Number(anoProcesso) < 2010
    }
}
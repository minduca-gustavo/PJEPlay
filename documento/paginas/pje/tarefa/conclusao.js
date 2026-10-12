async function escolheMagistrado() {
    let botoes = [
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
    let processo = document.querySelector('pje-descricao-processo [role="button"]').textContent
    let juizSimetria = defineJuizSimetria(processo)
    async function defineJuizSimetria(processo) {
        let gigs = await buscarGigs(processo) || []
        if (!gigs) return null
        let gigSimetria = gigs.find(d => d?.tipoAtividade?.descricaoConsulta.includes('GABINETE'))
        if (!gigSimetria) return null
        let juiz = gigSimetria.tipoAtividade.descricaoConsulta.split(/JUIZ[A]?/)[1].trim()
        return juiz ?? null
    }
}
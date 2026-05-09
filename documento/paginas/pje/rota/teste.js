//(async ()=> {
//    let testando = 1
//    if (testando !== 1) return
//    let d = await buscarProcessosPorTarefa('Triagem Inicial')
//    
//    //for(let j of d.PASSIVO){
//    //    relatar(JSON.stringify(j),'','teste')
//    //    
//    //}
//    //relatar('Linha 5 do teste: ' + JSON.stringify(dados), '', 'teste')
//    relatar('Tá mudando? ' + JSON.stringify(d), '', 'teste')
//}) ()


(async ()=> {
    let testando = 0
    if (testando !== 1) return
    let d = await extrairTexto(3866132, 279194446)
    
    //for(let j of d.PASSIVO){
    //    relatar(JSON.stringify(j),'','teste')
    //    
    //}
    //relatar('Linha 5 do teste: ' + JSON.stringify(dados), '', 'teste')
    relatar('Tá mudando? ' + JSON.stringify(d), '', 'teste')
}) ()














//(async ()=> {
//    let testando = 0
//    if (testando !== 1) return
//    let d = await buscarProcesso(3896542, '/partes')
//    let r = d?.PASSIVO
//    for (let j of r){
//        relatar(JSON.stringify(j.documento),'','teste')
//    }
//    //for(let j of d.PASSIVO){
//    //    relatar(JSON.stringify(j),'','teste')
//    //    
//    //}
//    //relatar('Linha 5 do teste: ' + JSON.stringify(dados), '', 'teste')
//    relatar('Tá mudando? ' + JSON.stringify(r), '', 'teste')
//}) ()

//(async ()=> {
//    let testando = 0
//    if (testando !== 1) return
//    let d = []
//    let gigs = await buscarGigs('0011054-19.2025.5.15.0074')
//    relatar('gigs: ' + JSON.stringify(gigs), '', 'teste')  // nova API que traz tudo junto
//    let ativos     = gigs.filter(gig => gig.statusAtividade !== 'Concluído')
//    let concluidos = gigs.filter(gig => gig.statusAtividade === 'Concluído')
//    let descricao = gigs[0]?.tipoAtividade?.descricao || ''
//
//    let temAtivoGab = ativos.some(gig => /GAB.* JU/i.test(gig?.tipoAtividade?.descricao || ''))
//
//    if (temAtivoGab) return  // tem ativo — não interessa
//
//    // Não tem ativo — procura no concluído
//    let gigConcluido = concluidos.find(gig => /GAB.*JU.*/i.test(gig?.tipoAtividade?.descricao || '')) || 'Não foi encontrado GIG concluído.'
//    
//        d.push({
//            processo: '0011054-19.2025.5.15.0074',
//            gig:      gigConcluido.tipoAtividade?.descricao || '',
//            status:   gigConcluido.statusAtividade,
//    //    })
//    
//    relatar('ativos: ' + JSON.stringify(ativos), '', 'teste')
//    relatar('concluidos: ' + JSON.stringify(concluidos), '', 'teste')
//    relatar('temAtivoGab: ' + JSON.stringify(temAtivoGab), '', 'teste')
//    relatar('descricao: ' + JSON.stringify(descricao), '', 'teste')
//    relatar('resultado: ' + JSON.stringify(d), '', 'teste')
//}) ()

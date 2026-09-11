async function teste(){
  let salas = await buscarSalas('424') || []
  console.log('%c[Rota PJE]%c salas: ' + JSON.stringify(salas), LOG.teste, 'color:inherit', salas)
  let dados = []
  for (let sala of salas){
    let id = sala?.id
    let horarios = await buscarSalasHorariosVagos(id) || []
    //let tipos = horarios?.filter(d => !['Instrução', 'Conciliação'].some(c => d?.descricaoTipoAudiencia.includes(c)))
    let tipo = horarios.map(d => d?.descricaoTipoAudiencia)
    let resultado = sala?.nome + '\t' + tipo.join('\t')
    dados.push(resultado)
  }
  _baixarArquivo(dados.join('\n'), 'resultado.txt', 'text/plain')
  _baixarArquivo(dados.join('\n'), 'resultado.json', 'application/json')
}
//teste()
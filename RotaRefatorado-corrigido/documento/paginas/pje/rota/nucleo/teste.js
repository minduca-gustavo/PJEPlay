async function teste(){
  let janelas = [
    /ia\.jt\.jus\.br/,
    JANELA.meuPainel
  ]
  let janela = janelas.some(j => j.test(window.location.href))
  if (!janela) return
  let divId = id('teste')
  let el = [...document.querySelectorAll('#' + divId)].forEach(e => e.remove())
  let div = criaDiv({
    id: divId,
    ancestral: 'ffff'
  })
  formataDiv(div, 'branco', '350px', '80px', 'absolute')
  let input = criaInputAnotacao({
    id: divId + '_input',
    ancestral: divId,
  })
  let funcao = confereJanela(JANELA.meuPainel) ? testeJSON : testeIA
  let botao = criaBotaoAzul({
    id: divId + '_botao',
    ancestral: divId,
    texto: 'Teste',
    acao: async () => await funcao(document.getElementById(divId + '_input').value)
  })
  criaBotaoLaranja({
    id: divId + '_fechar',
    ancestral: divId,
    texto: 'X',
    acao: () => div.remove()
  })
}
teste()

function testeJSON(parametro){
  console.log('%c[Rota PJE]%c parametro: ' + JSON.stringify(parametro), LOG.info, 'color:inherit')
  //let teste = parametro.flatMap(d => d.nodosFilhos)
  let entrada = typeof(parametro) === 'string' ? JSON.parse(parametro) : parametro
  let resultado = []
  if (!resultado.some(d => d?.id == entrada.id)) resultado.push({id: entrada?.id, titulo: entrada?.titulo})
  if(entrada.nodosFilhos){
    console.log('%c[Rota PJE]%c if: ' + JSON.stringify(), LOG.teste, 'color:inherit')
    for (j of entrada?.nodosFilhos){
      if (!resultado.some(d => d?.id == j.id)) resultado.push({id: j?.id, titulo: j?.titulo})
      if (j.nodosFilhos) testeJSON(j)
    }
  }
  console.log('%c[Rota PJE]%c resultado: ' + JSON.stringify(resultado), LOG.teste, 'color:inherit')
}
async function testeIA(parametro){
  let idAssistente = '6aac80f81501b0e00725a8df'
  let {id, aut} = await rota_fetch_IACriaConversa(idAssistente)
  //console.log('%c[Rota PJE]%c conversa: ' + JSON.stringify(conversa), LOG.mb, 'color:inherit')
  let resultado = await rota_fetch_IAEnviaRequisicao(parametro, id, aut)
  console.log('%c[Rota PJE]%c resultado: ' + JSON.stringify(resultado), LOG.teste, 'color:inherit', resultado)  
  alert (resultado)
}
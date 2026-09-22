async function teste(){
  let janelas = [
    /ia\.jt\.jus\.br/,
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
  let botao = criaBotaoAzul({
    id: divId + '_botao',
    ancestral: divId,
    texto: 'Teste',
    acao: () => alert('Teste')
  })
  criaBotaoLaranja({
    id: divId + '_fechar',
    ancestral: divId,
    texto: 'X',
    acao: () => div.remove()
  })
}
teste()
async function testeUm() {
  await aguardarElemento('pje-cabecalho-documento mat-card')
  let anterior = document.querySelector('pje-cabecalho-documento').firstChild
  let botoes = [
    {
      id: idg('b1'),
      texto: 'B1',
      acao: () => alert('B1')
    },
    {
      id: idg('b2'),
      texto: 'B2',
      acao: () => alert('B2')
    }
  ]
  document.getElementById(idg('fita', 'teste'))?.remove()
  let fita = fitaSuperiorCompleta({
    id: idg('fita', 'teste'),
    elementoAnterior: anterior,
    botoes
  })
}

//testeUm()

async function teste(){
  let janelas = [
    /ia\.jt\.jus\.br/,
    JANELA.meuPainel,
    JANELA.painelGlobal,
    JANELA.certificar
  ]
  let janela = janelas.some(j => j.test(window.location.href))
  if (!janela) return
  aguardarElemento('#brasao-republica')
  criaNovoBotaoRota()
  return
  let divId = idg('teste')
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
  let mapaFuncoes = {
    testeJSON,
    testeIA,
    testePatch,
    testeInserirTexto,
  }
  let funcao = confereJanela(/ia\.jt\.jus\.br/) ? testeIA : testeIA
  let botao = criaBotaoAzul({
    id: divId + '_botao',
    ancestral: divId,
    texto: 'Teste',
    acao: async () => {
      let resultado = await testeInserirTexto(document.getElementById(divId + '_input').value)
      console.log('%c[Rota PJE]%c resultado: ' + JSON.stringify(resultado), LOG.rosa, 'color:inherit')
      //apresentaResultados(resultado)
    }
  })
  criaBotaoLaranja({
    id: divId + '_fechar',
    ancestral: divId,
    texto: 'X',
    acao: () => div.remove()
  })
}
//teste()

function criaNovoBotaoRota(){
  let ancestral = idg('novoBotaoRota')
  let remover = document.getElementById(ancestral)?.remove()
  let div = criaDiv({
    id: ancestral,
    ancestral: document.body,
  })
  div.style.width = '130px'
  div.style.height = '65px'
  div.style.gap = '0px'
  div.style.position = 'fixed'
  div.style.left = 'max(15%, 360px)'
  div.style.top= '0px'
  div.style.zIndex= '99999999'
  let divSuperior = criaDiv({
    id: ancestral + '_superior',
    ancestral,
    rowColumn: 'row'
  })
  divSuperior.style.gap = '0px'
  divSuperior.style.height = '40px'
  let divEsquerda = criaDiv({
    id: ancestral + '_esquerda',
    ancestral: ancestral + '_superior'
  })
  divEsquerda.style.width = '0px'
  divEsquerda.style.height = '0px'
  divEsquerda.style.borderRight = '20px solid #000000'
  divEsquerda.style.borderBottom = '20px solid transparent'
  divEsquerda.style.borderTop = '20px solid transparent'
  
  let divCentral = criaDiv({
    id: ancestral + '_central',
    ancestral: ancestral + '_superior'
  })
  divCentral.style.width = '110px'
  divCentral.style.height = '28px'
  divCentral.style.background = '#000000'
  divCentral.style.alignSelf = 'center'
  //divCentral.style.borderRight = '40px solid #000000'
  //divCentral.style.borderBottom = '20px solid transparent'
  //divCentral.style.borderTop = '20px solid transparent'
  
  let divDireita = criaDiv({
    id: ancestral + '_esquerda',
    ancestral: ancestral + '_superior'
  })
  divDireita.style.width = '0px'
  divDireita.style.height = '0px'
  divDireita.style.borderLeft = '20px solid #000000'
  divDireita.style.borderBottom = '20px solid transparent'
  divDireita.style.borderTop = '20px solid transparent'
  //divDireita.style.background = '#000000'


  let divInferior = criaDiv({
    id: ancestral + '_inferior',
    ancestral
  })
  divInferior.style.height = '25px'
  let botaoTroca = criaBotaoLaranja({
    id: ancestral + 'trocaTarefa',
    ancestral: ancestral + '_inferior',
    texto: 'Troca tarefa'
  })
  botaoTroca.style.height = '100%'
  botaoTroca.style.width = '94px'
  botaoTroca.style.padding = '2px'
  botaoTroca.style.padding = '2px'

}

function testePatch(){
  let teste = interceptador_ler('agrupamento_tarefas_processos')
  alert(JSON.stringify(teste))
}

function testeJSON(parametro){
  //let teste = parametro.flatMap(d => d.nodosFilhos)
  let entrada = typeof(parametro) === 'string' ? JSON.parse(parametro) : parametro
  let resultado = []
  if(entrada.nodosFilhos){
    for (let j of entrada?.nodosFilhos){
        let result = []
        if (j.nodosFilhos) resultado.push(...testeJSON(j))
        if (!resultado.some(d => d?.id == entrada.id) && !j?.titulo.includes('Link para o nodo')) resultado.push({id: j?.id, titulo: j?.titulo})
      }
    }
  if (!resultado.some(d => d?.id == entrada.id) && !entrada?.titulo.includes('Link para o nodo')) resultado.push({id: entrada?.id, titulo: entrada?.titulo})
  return resultado
}
async function testeIA(parametro){
  let idAssistente = '6aac80f81501b0e00725a8df'
  let {idIA, aut} = await rota_fetch_IACriaConversaBack(idAssistente)
  //console.log('%c[Rota PJE]%c conversa: ' + JSON.stringify(conversa), LOG.mb, 'color:inherit')
  let resultado = await rota_fetch_IAEnviaRequisicaoBack(parametro, idIA, aut)
  console.log('%c[Rota PJE]%c resultado: ' + JSON.stringify(resultado), LOG.teste, 'color:inherit', resultado)  
  alert (resultado)
}
async function testeInserirTexto(params) {
  inserirTextoNoEditor('.area-conteudo [contenteditable]', params)
}
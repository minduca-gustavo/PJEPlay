async function leituraDinamicaDocumentos() {
    let widget = document.querySelector('#rota_leituraDinamica')
    if (widget) widget.remove()
    let janela = confereJanela(JANELA.escaninho, JANELA.pautaAudiencias, JANELA.atasAudiencias)
    if (!janela){
        console.log('%c[Rota PJE]%c leituraDinamica4: ' + JSON.stringify(4), LOG.rosa, 'color:inherit')
        return
    }
    console.log('%c[Rota PJE]%c leituraDinamica4' + JSON.stringify('true'), LOG.rosa, 'color:inherit')
    criaWidgetLeituraDinamica()
}

leituraDinamicaDocumentos()

window.addEventListener('pjerota:url-mudou', () => {
    document.getElementById('pjerota-consulta_qualquer_oj-widget')?.remove()
    leituraDinamicaDocumentos()
})

async function criaWidgetLeituraDinamica() {
    let mapaFuncoes ={
        criaInput
    }
    let div = await criaDivFlutuante({
        id: 'rota_leituraDinamica', 
        titulo: 'Leitura Dinâmica', 
        largura: '250px', 
        ancestral: 'ffff',
        armazenarRecolhido: true
    })
    let subTitulo = criaSubTitulo({
        id: 'rota_leituraDinamica_subTitulo',
        texto: 'Colore de acordo com os termos escolhidos.',
        ancestral: 'rota_leituraDinamica-corpo',
    })
    let cores = [
        {
            nome: 'Vermelho'
        },
        {
            nome: 'Laranja'
        },
        {
            nome: 'Amarelo'
        },
        {
            nome: 'Verde'
        },
        {
            nome: 'Azul'
        },
        {
            nome: 'Roxo'
        },
    ]
    let secoes = [
        {
            background: true,
            nome: 'quadroCor',
            pixels: '30px',
        },
        {
            background: false,
            nome: 'input',
            funcao: 'criaInput',
            width: '75%',
            height: '100%'
        },
    ]
    function defineCor(cor) {
        return (CORES.find(d => d?.nome == cor))?.hex
    }
    for (let j of cores){
        let cor = defineCor(j?.nome)
        let idDivCores = 'rota_leituraDinamica_divCores' + j?.nome.toLowerCase()
        let divCores = criaDiv({
            id: idDivCores,
            ancestral: 'rota_leituraDinamica-corpo',
            rowColumn: 'row'
        })
        divCores.style.margin = '4px'
        for (let k of secoes){
            let funcao = k?.funcao || null
            let divSecao = criaDiv({
                id: 'rota_leituraDinamica_divCores' + j?.nome.toLowerCase() + '_' + k?.nome,
                ancestral: idDivCores,
                rowColumn: 'row'
            })
            
            if (k?.background){
                divSecao.style.background = cor
                divSecao.style.width = k?.pixels
                divSecao.style.height = k?.pixels
                divSecao.style.border = '1px solid ' + cor
                divSecao.style.borderRadius = '4px'
                //divSecao.style.marginLeft = '4px'
                
            }
            if (funcao){
                let inputNome = 'rota_leituraDinamica_divCores_input_' + j?.nome.toLowerCase()
                let input = mapaFuncoes[funcao]({
                    id: inputNome,
                    textoEmCima: '',
                    ancestral: idDivCores,
                    placeholder: 'termo1, TERMO2, Termo3',
                })
                input.container.style.width = '75%'
                input.style.height = k?.pixels
                input.dataset.cor = cor
                
            }
        }
        
    }
    
    let botao = criaBotaoAzul({
        id: 'rota_leituraDinamica_botaoAcao',
        texto: 'Colorir',
        ancestral: 'rota_leituraDinamica-corpo',
        acao: () => colorirDinamico('rota_leituraDinamica_divCores_input_')
    })
    
    async function colorirDinamico(seletores) {
        let seletorProcessos = [
            seletorPorVersao('painelGlobalAbrirTarefaDoProcesso'),
        ]
        let inputs = [...selecionar('[id*="' + seletores + '"]', '', true)]
        let regras = []
        for (e of inputs){
            if (e?.id.includes('container')) continue
            let valor = e?.value
            if (valor !== ''){
                let conteudo = valor.split(',').map(d=> d.trim()) || []
                let cor = e?.dataset.cor
                regras.push({palavras: conteudo, cor: cor})
            }
        }
        let processos = []
        for (s of seletorProcessos){
            processos = [...selecionar(s, '', true)].map(d=> d.textContent.split(' ')[2])
        }
        let processosResultado = []
        for (p of processos){
            let id = await buscarIdPeloNumeroCNJ(p).then(d=> d?.id) || null
            if (!id) continue
            let documentosTimeline = await buscaDocumentosNaoApreciados(id)
            let documentos = []
            for (d of documentosTimeline){
                let teor = await extrairTexto(id, d?.id)
                let i=0
                let resultado = []
                for (r of regras){
                    i++
                    let encontrado = r?.palavras.map(d=> d!== '' ? buscaEmTextoMalFormatado(teor, d, 100, 100) : null)
                    if (encontrado && encontrado?.some(d=> d !== null)){
                        let dado = {}
                        let dados = encontrado?.filter(d => d !== null)
                        //console.log('%c[Rota PJE]%c dados: ' + JSON.stringify(dados), LOG.rosa, 'color:inherit')
                        dado.busca = dados
                        dado.cor = r?.cor
                        resultado.push(dado)
                    }
                    
                }
                //console.log('%c[Rota PJE]%c encontrado: ' + JSON.stringify(resultado), LOG.rosa, 'color:inherit')
                let documento = {idUnico: d?.idUnico, dados: resultado, teor: teor}
                documentos.push( documento)
            }
            let processo = {}
            processo.processo = p
            processo.documentos = documentos
            //console.log('%c[Rota PJE]%c documentos: ' + JSON.stringify(documentos), LOG.rosa, 'color:inherit')
            processosResultado.push(processo)
            let linha = [...document.querySelectorAll('tr')].find(d=> d.textContent.includes(p))
            console.log('%c[Rota PJE]%c linha: ' + JSON.stringify(linha), LOG.teste, 'color:inherit', linha)
            linha.style.background = LOG.rosa

            //let naoApreciados = timeline
        }
        
        
        //let celula = selecionar('td', linha)

        console.log('%c[Rota PJE]%c processosResultado: ' + JSON.stringify(processosResultado), LOG.teste, 'color:inherit', processosResultado)
        
    }

    async function buscaDocumentosNaoApreciados(id) {
        let documentos = (await buscarDocumentos(id)).filter(d=> d?.documentoApreciavel == true) || []
        return documentos
    }
}

function buscaEmTextoMalFormatado(textoABuscar, termo, antes = 0, depois = 0){
    let texto = normalizar(textoABuscar).toLowerCase()
    //console.log('%c[Rota PJE]%c texto' + JSON.stringify(texto), LOG.rosa, 'color:inherit')
    let mapa = []
    let espacos = []
    let limpo = ''
    for (let i=0; i < texto.length; i++){
        let c = texto[i];
        if (/\s/.test(c)) {
            espacos.push(i);
            continue; // pula espaços/quebras de linha
        }
        limpo += c;
        mapa.push(i);
    }
    //console.log('%c[Rota PJE]%c limpo' + JSON.stringify(limpo), LOG.teste, 'color:inherit')
    let busca = normalizar(termo).toLowerCase()
    let posicao = limpo.indexOf(busca)
    if (posicao === -1) return null
    let inicio = mapa[posicao]
    let fim = mapa[posicao + busca.length - 1] + 1
    //return {encontrado: true, }
    let espacoInicio = espacos[espacos.findIndex(d=> d > Math.max(0, inicio - antes)) - 1]
    let espacoFim = espacos[espacos.findIndex(d=> d > Math.min(textoABuscar.length, fim + depois))]
    //console.log('%c[Rota PJE]%c espacoInicio: ' + JSON.stringify(espacoInicio), LOG.rosa, 'color:inherit')
    //console.log('%c[Rota PJE]%c espacoInicio: ' + JSON.stringify(espacoFim), LOG.rosa, 'color:inherit')
    let resultado = textoABuscar.slice(espacoInicio, espacoFim)
    //console.log('%c[Rota PJE]%c resultado 200: ' + JSON.stringify(resultado), LOG.rosa, 'color:inherit')
    return {trechos: resultado, termo: termo, inicio: inicio, fim: fim}
            ///*return*/ console.log(textoABuscar.slice(
    //        Math.max(0, inicio - caracteres),
    //        Math.min(textoABuscar.length, fim + caracteres)
    //    ).split(' ', 1)[1]
    //)
}
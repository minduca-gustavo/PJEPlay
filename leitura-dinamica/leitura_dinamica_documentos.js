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
            console.log('%c[Rota PJE]%c e.id10:' + JSON.stringify(e.id), LOG.info, 'color:inherit', e)
            let valor = e?.value
            console.log('%c[Rota PJE]%c valor' + JSON.stringify(valor), LOG.erro, 'color:inherit')
            let conteudo = valor.split(',').map(d=> d.trim()) || []
            let cor = e?.dataset.cor
            console.log('%c[Rota PJE]%c cor' + JSON.stringify(cor), LOG.aviso, 'color:inherit')
            regras.push({palavras: conteudo, cor: cor})
        }
        console.log('%c[Rota PJE]%c inputs' + JSON.stringify(inputs), LOG.teste, 'color:inherit', inputs)
        let processo = []
        for (s of seletorProcessos){
            console.log('%c[Rota PJE]%c s: ' + JSON.stringify(s), LOG.rosa, 'color:inherit')
            processo = [...selecionar(s, '', true)].map(d=> d.textContent.split(' ')[2])
            console.log('%c[Rota PJE]%c processo: ' + JSON.stringify(processo), LOG.rosa, 'color:inherit', processo)
        }
        for (p of processo){
            let id = await buscarIdPeloNumeroCNJ(p).then(d=> d?.id) || null
            if (!id) continue
            let documentosTimeline = (await buscarDocumentos(id)).filter(d=> d?.documentoApreciavel == true) 
            console.log('%c[Rota PJE]%c documentos' + JSON.stringify(documentosTimeline), LOG.rosa, 'color:inherit')
            let documentosTeor = []
            for (d of documentosTimeline){
                let teor = await extrairTexto(id, d?.id)
                console.log('%c[Rota PJE]%c teor 142: ' + JSON.stringify(teor), LOG.aviso, 'color:inherit')
                for (r of regras){
                    r.palavras.map(d=> buscaEmTextoMalFormatado(teor, d))
                }
            }
            return
            //let naoApreciados = timeline
        }
        console.log('%c[Rota PJE]%c processos: ' + JSON.stringify(processo), LOG.rosa, 'color:inherit')
        
    }

}

function buscaEmTextoMalFormatado(textoABuscar, termo, caracteres = 50){
    let texto = normalizar(textoABuscar).toLowerCase()
    console.log('%c[Rota PJE]%c texto' + JSON.stringify(texto), LOG.rosa, 'color:inherit')
    let mapa = []
    let limpo = ''
    for (let i=0; i < texto.length; i++){
        let c = texto[i];
        if (/\s/.test(c)) continue; // pula espaços/quebras de linha
        limpo += c;
        mapa.push(i);
    }
    console.log('%c[Rota PJE]%c limpo' + JSON.stringify(limpo), LOG.teste, 'color:inherit')
    let busca = normalizar(termo).toLowerCase()
    let posicao = limpo.indexOf(busca)
    if (posicao === -1) return null
    let inicio = mapa[posicao]
    let fim = mapa[posicao + busca.length - 1] + 1
    let resultado = textoABuscar.slice(
            Math.max(0, inicio - caracteres),
            Math.min(textoABuscar.length, fim + caracteres));
    console.log('%c[Rota PJE]%c resultado' + JSON.stringify(resultado.split(' ', 2)[1]), LOG.rosa, 'color:inherit')
    console.log('%c[Rota PJE]%c inicio' + JSON.stringify(inicio), LOG.rosa, 'color:inherit')
    console.log('%c[Rota PJE]%c fim' + JSON.stringify(fim), LOG.teste, 'color:inherit')
            ///*return*/ console.log(textoABuscar.slice(
    //        Math.max(0, inicio - caracteres),
    //        Math.min(textoABuscar.length, fim + caracteres)
    //    ).split(' ', 1)[1]
    //)
}
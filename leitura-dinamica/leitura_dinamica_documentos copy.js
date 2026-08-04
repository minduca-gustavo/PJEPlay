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
    let tipos = [
        {
            tipo: 'peticao',
            label: 'Petições não apreciadas',
        },
        {
            tipo: 'ataDeAudiencia',
            label: 'Última ata de audiência',
        },
        {
            tipo: 'sentenca',
            label: 'Sentenças e Acórdãos',
        },
    ]
    for(t of tipos){
        let checkBox = criaCheckBox({
            id: 'rota_leituraDinamica_check_' + t?.tipo, 
            textoAoLado: t?.label, 
            ancestral: 'rota_leituraDinamica-corpo',
        })
        checkBox.style.marginLeft = '3px'
        let checkListener = document.querySelector('#rota_leituraDinamica_check_' + t?.tipo)
        checkListener.dataset.tipo = t?.tipo
        checkListener.addEventListener('click', () => alternarCheckLeituraDinamica(checkListener))
    }
    async function alternarCheckLeituraDinamica(el) {
        let todosChecks = [...document.querySelectorAll('[id*="rota_leituraDinamica_check_"]')]
        
        for (t of tipos){
            let check = document.querySelector('#rota_leituraDinamica_check_' + t?.tipo)
            if (check !== el && el.dataset.marcado == 1 && check.dataset.marcado == 1){
                check.click()
                await suspender(200)
            }
        }
        
    }
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
        let exclusao = [...document.querySelectorAll('[id*="rota_leituraDinamica_pintura"]')].map(d=> d.remove())
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
            elementos = [...selecionar(s, '', true)]/*.map(d=> d.textContent.split(' ')[2])*/
        }
        let processosResultado = []
        let i = 0
        for (el of elementos){
            let p = el.textContent.split(' ')[2]
            let id = await buscarIdPeloNumeroCNJ(p).then(d=> d?.id) || null
            if (!id) continue
            let documentosTimeline = await buscaDocumentosNaoApreciados(id)
            let documentos = []
            let corBadge = ''
            let textoBadge = ''
            let tooltipBadge = ''
            let complemento = ''
            for (d of documentosTimeline){
                let teor = await extrairTexto(id, d?.id)
                let i=0
                let resultado = []
                
                    
                for (r of regras){
                    let encontrado = r?.palavras.map(d=> {
                        let valor = d!== '' ? buscaEmTextoMalFormatado(teor, d, 100, 100) : null
                        
                        if (valor && textoBadge !== ''){
                            if (!textoBadge.includes('➕')) textoBadge = textoBadge + '➕'
                        }
                        if (valor && complemento != '' && !complemento.includes(d.toUpperCase())) complemento += '-' + d.toUpperCase() + '\n'
                        if (valor && complemento == ''){
                            complemento = '...\n\nOutros termos encontrados:\n\n' + '-' + d.toUpperCase() + '\n'
                        }
                        if (valor && textoBadge == ''){
                            textoBadge = d
                            corBadge = r?.cor
                            tooltipBadge = valor?.trechos
                        }
                        return valor
                    })
                    if (encontrado && encontrado?.some(d=> d !== null)){
                        let dado = {}
                        let dados = encontrado?.filter(d => d !== null)
                        //console.log('%c[Rota PJE]%c dados: ' + JSON.stringify(dados), LOG.rosa, 'color:inherit')
                        dado.busca = dados
                        dado.cor = r?.cor
                        //corBadge = r?.cor
                        resultado.push(dado)
                    }
                    i++
                }
                
                //console.log('%c[Rota PJE]%c encontrado: ' + JSON.stringify(resultado), LOG.rosa, 'color:inherit')
                let documento = {idUnico: d?.idUnico, dados: resultado, teor: teor}
                documentos.push( documento)
            }
            tooltipBadge += complemento
            let processo = {}
            processo.processo = p
            processo.documentos = documentos
            //console.log('%c[Rota PJE]%c documentos: ' + JSON.stringify(documentos), LOG.rosa, 'color:inherit')
            processosResultado.push(processo)
            //let linha = [...document.querySelectorAll('tr')].find(d=> d.textContent.includes(p))
            //let celula = [...linha.querySelectorAll('td')].find(d=> d.textContent.includes(p))
            //let celulaId = celula.id
            //celula.style.background = corTeste
            i++
            let badgeId = 'rota_leituraDinamica_pintura' + i
            let badge = criaPlaquinhaComTooltip({
                id: badgeId,
                texto: textoBadge.toUpperCase(),
                cor: corBadge,
                tooltip: tooltipBadge,
                
            })
            el.appendChild(badge)
            let badgeEdita = document.querySelector('#rota_leituraDinamica_pintura' + i)
            badgeEdita.style.backgroundColor = corBadge
            badgeEdita.style.border = '1px solid ' + corBadge
            badgeEdita.style.borderRadius = "2px"
            badgeEdita.style.padding = '2px 2px'
            
            //let naoApreciados = timeline
        }
        
        
        //let celula = selecionar('td', linha)

        console.log('%c[Rota PJE]%c processosResultado: ' + JSON.stringify(processosResultado), LOG.teste, 'color:inherit', processosResultado)
        
    }

    async function buscaDocumentosNaoApreciados(id) {
        let valor = [...document.querySelectorAll('[id^="rota_leituraDinamica_check_"')].find(d=> d.dataset.marcado==1).dataset.tipo || ''
        console.log('%c[Rota PJE]%c seletores: ' + JSON.stringify(valor), LOG.aviso, 'color:inherit')
        let tipos = 
            {
                peticao: {
                    busca: 'documentoApreciavel',
                    valor: true
                },
                ataDeAudiencia: {
                    busca: 'tipo',
                    valor: 'Ata da Audiência'
                },
                sentenca: {
                    busca: 'tipo',
                    valor: ['Sentença', 'Acórdão']
                },
                
            }
        
        let busca = tipos[valor]
        let documentos = (await buscarDocumentos(id)).filter(d => [].concat(busca.valor).includes(d[busca.busca])) || []
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
// estou retirando dados do editor. tem que fazer rotina de erro no textoSentenca, ou seja, se textoSentenca?.erro

async function liquidAIGerarPJC(){
    let {dadosProcesso, dadosProcessuaisPJECalc, municipio} = await liquidAIExtraiDadosPJE()
    let textoSentenca = liquidAIExtraiTextoEditor()
    let configuracoes = await liquidAIConfigurar('extrair')
    let dataCalculo = new Date().setHours(0,0,0,0)
    let indice = 0
    let versao = 0
    let ordem = 0
    // gprec parcitipa, é o primeiro
    let gprec = liquidAICriaGprec(dadosProcesso, dataCalculo)
    // dadosEstruturados participa, é o segundo
    let dadosEstruturados = liquidAICriaDadosEstruturados(dataCalculo)
    // os parametros entram, mas o retorno são variáveis separadas.
    let internalRef = ++indice
    let parametros = liquidAICriaParametrosIniciais(
        {
            id: internalRef, 
            versao, 
            dataCriacao: dataCalculo,
            dataDeLiquidacao: dataCalculo,
            versaoDoSistema: configuracoes,
        },
        textoSentenca,
        dadosProcesso,
        configuracoes,
    )
    // processo entra e é uma variável só
    let processoPJECalc = liquidAICriaDadosProcessuaisPJECalc(dadosProcessuaisPJECalc, ++indice, versao, internalRef)
    // município tem uma externalRef que é da tabela TOM da receita federal
    municipio = liquidAIDefineMunicipio({municipio})
    let verbas = verbasNaoMapeadas()
    // historico - está sendo feito agora
    let historico = liquidAICriaHistoricos(indice, textoSentenca)
    indice = indice + textoSentenca.historicos.length
    // restante trará tudo que não foi mapeado, de acordo com CalculoCalculistaSemVerbasSemHistorico.xml
    let restante = naoMapeados()
    let resultado = {Calculo: {gprec, dadosEstruturados, ...parametros, ...processoPJECalc, ...municipio, ...verbas, ...historico, ...restante}}
    let xml = liquidAIJsonToXml(resultado)
    await _baixarPjc('<?xml version="1.0" encoding="ISO-8859-1"?>' + xml, 'liquidAI')
}

function liquidAICriaHistoricos(id, {historicos = [],}){
    let historicoArray = []
    let i = 1
    for(let historico of historicos){
        let id = id + i++
        let versao = 0
        let nome
        let tipoVariacaoParcela
        let incidenciaFGTS
        let aplicarProporcionalidadeFGTS
        let incidenciaINSS
        let aplicarProporcionalidadeINSS
        let calculo = {
            Calculo: {
                internalRef
            }
        }
        let ocorrenciasArray = []
        for (let ocorrencia of ocorrencias){
            let id
            let versao
            let dataOcorrencia
            let valor
            let recolhidoFGTS
            let recolhidoINSS
            let incidenciaFGTS
            let incidenciaINSS
            let historicoSalarial = {
                HistoricoSalarial: {
                    internalRef // internalRef do HISTORICO
                }
            }
            ocorrenciasArray.push(ocorrencia)
        }
        let ocorrencias = {
            List:{
                OcorrenciaDoHistoricoSalarial: ocorrenciasArray
            }
        }
        historicoArray.push(historico)
    }

    let historicosSalariais = {
        Set: {
            HistoricoSalarial: historicoArray,
        }
    }
}

function verbasNaoMapeadas(){
    return{verbas:{Set:''}}
}

function naoMapeados(){
    return {
        listaDeFerias: {
            Set:''
        },
        apuracoesDeJuros: {
            Set:''
        },
        excecoesDaCargaHoraria: {
            Set:''
        },
        excecoesDoSabado: {
            Set:''
        },
        faltas: {
            Set:''
        },
        fgts: {
            Fgts:''
        },
        inss: '',
        previdenciaPrivada: '',
        pensaoAlimenticia: '',
        parametrosDeAtualizacao: '',
        multas: {
            Set:''
        },
        honorarios: {
            Set:''
        },
        irpf: '',
        custasJudiciais: '',
        seguroDesemprego: '',
        salarioFamilia: '',
        pontosFacultativos: {
            Set:''
        },
        historicosValidacao: {
            Set:''
        },
        historicosValidacaoAtualizacao: {
            Set:''
        },
        cartoesDePonto: {
            Set:''
        },
        pagamentos: {
            Set:''
        },
        apuracoesCartaoDePonto: {
            Set:''
        },
        apuracoesDiariasCartaoDePonto: {
            Set:''
        },
        excecoesDoFechamentoDeCartaoDePonto: {
            Set:''
        },
    }
}

function liquidAIExtraiTextoEditor(){
    let buscas = [
        {
            label: 'parametrosDeLiquidacao',
            termos: [
                'parametros de liquidacao',
                'parametros da liquidacao',
                'parametros para liquidacao',
                'dados para liquidacao'
            ]
        },
        {
            label: 'extraiDataDeAdmissao',
            termos: [
                'data de admissao',
                'data da admissao'
            ]
        },
        {
            label: 'extraiDataDeDemissao',
            termos: [
                'data de demissao',
                'data da demissao'
            ]
        },
        {
            label: 'extraiValorUltimaRemuneracao',
            termos: [
                'ultima remuneracao',
            ]
        },
        {
            label: 'extraiValorMaiorRemuneracao',
            termos: [
                'maior remuneracao',
            ]
        }
    ]
    let editor = [...document.querySelectorAll('pje-editor .conteudo >div')].find(d=> d.innerText.includes('Fundamenta')) || {}
    let conteudo = editor.querySelector('[contenteditable]')?.innerText || ''
    console.log('%c[Rota PJE]%c conteudo: ' + JSON.stringify(conteudo), LOG.info, 'color:inherit', conteudo)
    if (!conteudo) {
        rota_avisoObrigatorio('Não foi encontrado texto no editor', 5)
        return
    }
    let linhas = conteudo.split(/\r?\n/)
    console.log('%c[Rota PJE]%c linhas: ' + JSON.stringify(linhas), LOG.info, 'color:inherit', linhas)
    let linhaInicial = linhas.findIndex(d => buscas[0].termos.some(t => normalizar(d).includes(t)))
    let parametrosTexto = linhas.slice(linhaInicial)
    console.log('%c[Rota PJE]%c parametrosTexto: ' + JSON.stringify(parametrosTexto), LOG.info, 'color:inherit')
    let i = 0
    let resultado = {}
    for(let busca of buscas){
        i++
        if (i === 1) continue
        let label = busca.label
        console.log('%c[Rota PJE]%c label: ' + JSON.stringify(label), LOG.info, 'color:inherit')
        let termos = busca.termos
        console.log('%c[Rota PJE]%c termos: ' + JSON.stringify(termos), LOG.info, 'color:inherit')
        let linhaEncontrada = parametrosTexto.find(l => termos.some(t => normalizar(l).includes(t))) || ''
        console.log('%c[Rota PJE]%c linhaEncontrada: ' + JSON.stringify(linhaEncontrada), LOG.info, 'color:inherit')
        resultado[label] = linhaEncontrada
    }
    let {extraiDataDeAdmissao, extraiDataDeDemissao, extraiValorUltimaRemuneracao, extraiValorMaiorRemuneracao} = resultado
    let erros = []
    let dataAdmissao = tratarData(extraiDataDeAdmissao)
    let dataDemissao = tratarData(extraiDataDeDemissao)
    let valorUltimaRemuneracao = tratarValor(extraiValorMaiorRemuneracao)
    let valorMaiorRemuneracao = tratarValor(extraiValorUltimaRemuneracao)
    if (!dataAdmissao) erros.push('Data de Admissão')
    if (!dataDemissao) erros.push('Data de Demissão')
    if (!valorUltimaRemuneracao) erros.push('Última Remuneração')
    if (!valorMaiorRemuneracao) erros.push('Maior Remuneração')
    console.log('%c[Rota PJE]%c resultado: ' + JSON.stringify(resultado), LOG.info, 'color:inherit', resultado)
    alert (JSON.stringify(resultado))
    if (erros.length) return {erros, sucesso: false}
    return({
        dataAdmissao,
        dataDemissao,
        valorUltimaRemuneracao,
        valorMaiorRemuneracao,
        sabadoDiaUtil: 'true',
        projetaAvisoIndenizado: 'true',
        consideraFeriadoEstadual: 'true',
        prescricaoFgts: 'false',
        prescricaoQuinquenal: 'false',
        limitarAvosAoPeriodoDoCalculo: 'false',
        zeraValorNegativo: 'false',
        consideraFeriadoMunicipal: 'true',
        prazoFeriasProporcional: 'null',
        regimeDoContrato: 'INTEGRAL',
        indicesAcumulados: 'MES_SUBSEQUENTE_AO_VENCIMENTO',
        apuracaoPrazoDoAvisoPrevio: 'APURACAO_CALCULADA',
        prazoAvisoInformado: 'null',
        ativo: 'true',
        processoInformadoManualmente: 'true',
        comentarios: 'Gerado por LiquidAI',
        diaFechamentoMes: '31',
    })

    function tratarData(texto){
        let numeros = texto.match(/\d*/g).join('')
        if (numeros.length != 8) return null
        let ano = numeros.slice(4)
        let mes = numeros.slice(2, 4)
        let dia = numeros.slice(0,2)
        return new Date(ano, (mes - 1), dia).setHours(0, 0, 0, 0)
    }
    function tratarValor(texto){
        let numeros = texto.match(/\d*/g).join('')
        let valor = Number(numeros.slice(0, numeros.length - 2) + '.' + numeros.slice(numeros.length - 2)) || null
        return valor
    }
}

async function liquidAIConfigurar(parametro) {
    if(parametro === 'extrair'){
        let versaoDoPJECalc = await liquidAIObterVersao()
        return({versaoDoSistema: versaoDoPJECalc})
    }
    async function liquidAIObterVersao() {
        let versao = '2.16.0'
        return (versao)
    }
}

async function liquidAIExtraiDadosPJE(){
    let idMatch = location.href.match(/\/processo\/(\d+)\/tarefa/)
    let idURL = idMatch[1]
    let interceptadorProcesso = interceptador_lerProcesso() || await buscarProcesso(idURL)
    let {numero, valorDaCausa, autuadoEm} = interceptadorProcesso
    autuadoEm = new Date(autuadoEm).setHours(0, 0, 0, 0)
    let numeroPonto = numero.split('.')
    let numeroTraco = numeroPonto[0].split('-')
    let municipio = interceptadorProcesso?.processoJT?.municipio?.nome
    console.log('%c[Rota PJE]%c municipio: ' + JSON.stringify(municipio), LOG.info, 'color:inherit')
    let interceptadorPartes = interceptador_lerPartes()
    let dadosReclamante = interceptadorPartes?.ATIVO[0]
    let reclamante = dadosReclamante?.nome.trim()
    let tipoDocumentoFiscalReclamante = dadosReclamante?.tipoDocumento
    let numeroDocumentoFiscalReclamante = dadosReclamante?.documento.replace(/\.*\-*\/*/g, '')
    let dadosReclamado = interceptadorPartes?.PASSIVO[0]
    let reclamado = dadosReclamado?.nome.trim()
    let tipoDocumentoFiscalReclamado = dadosReclamado?.tipoDocumento
    let numeroDocumentoFiscalReclamado = dadosReclamado?.documento.replace(/\.*\-*\/*/g, '')
    let idSetor = interceptador_ler('historico_deslocamentos').find(h => normalizar(h?.orgaoJulgadorOrigem?.descricao).includes('vara do trabalho'))?.orgaoJulgadorOrigem?.id || ''
    console.log('%c[Rota PJE]%c idSetor: ' + JSON.stringify(idSetor), LOG.info, 'color:inherit')
    return({
        dadosProcesso:{
            reclamante,
            cpfReclamante: numeroDocumentoFiscalReclamante,
            dataAjuizamento: autuadoEm,
            cpfUsuarioCriador: 32656400864, // falta
            idSetor,
        },
        dadosProcessuaisPJECalc:{
            valorDaCausa,
            dataAutuacao: autuadoEm,
            numero: Number(numeroTraco[0]),
            ano: Number(numeroPonto[1]),
            justica: Number(numeroPonto[2]),
            regiao: Number(numeroPonto[3]),
            vara: Number(numeroPonto[4]),
            digito: Number(numeroTraco[1]),
            tipoDocumentoPrevidenciarioReclamante: 'null',
            numeroDocumentoPrevidenciarioReclamante: 'null',
            nomeReclamante: reclamante,
            tipoDocumentoFiscalReclamante,
            numeroDocumentoFiscalReclamante,
            nomeReclamado: reclamado,
            tipoDocumentoFiscalReclamado,
            numeroDocumentoFiscalReclamado,
        },
        municipio
    })
}


function liquidAICriaDadosProcessuaisPJECalc(
    {
        valorDaCausa = '0.00',
        dataAutuacao = new Date().setHours(0,0,0,0),
        numero,
        ano,
        justica,
        regiao,
        vara,
        digito,
        tipoDocumentoPrevidenciarioReclamante,
        numeroDocumentoPrevidenciarioReclamante,
        nomeReclamante,
        tipoDocumentoFiscalReclamante,
        numeroDocumentoFiscalReclamante,
        nomeReclamado,
        tipoDocumentoFiscalReclamado,
        numeroDocumentoFiscalReclamado,
    },
    id, 
    versao,
    internalRef,
){
    return({
        processo:{
            Processo:{
                id,
                versao,
                valorDaCausa,
                dataAutuacao,
                calculo:{
                    Calculo:{
                        internalRef
                    }
                },
                identificador:{
                    IdentificadorDoProcesso:{
                        numero,
                        ano,
                        justica,
                        regiao,
                        vara,
                        digito,
                    }
                },
                reclamante:{
                    Reclamante:{
                        tipoDocumentoPrevidenciario: tipoDocumentoPrevidenciarioReclamante,
                        numeroDocumentoPrevidenciario: numeroDocumentoPrevidenciarioReclamante,
                        nome: nomeReclamante,
                        tipoDocumentoFiscal: tipoDocumentoFiscalReclamante,
                        numeroDocumentoFiscal: numeroDocumentoFiscalReclamante,
                    }
                },
                reclamado:{
                    Reclamado:{
                        nome: nomeReclamado,
                        tipoDocumentoFiscal: tipoDocumentoFiscalReclamado,
                        numeroDocumentoFiscal: numeroDocumentoFiscalReclamado,
                    }
                },
                advogadosReclamante:{
                    List:''
                },
                advogadosReclamado:{
                    List:''
                }
            }
        }
    })
}


function liquidAICriaParametrosIniciais(
    {
        id,
        versao,
        dataCriacao= new Date().setHours(0,0,0,0),
        dataDeLiquidacao = new Date().setHours(0,0,0,0)
    }, // vem do liquidAIGerarPJC
    {
        dataAdmissao = '',
        dataDemissao = '',
        valorUltimaRemuneracao = '',
        valorMaiorRemuneracao = '',
        valorCargaHorariaPadrao = '220',
        sabadoDiaUtil = 'true',
        projetaAvisoIndenizado = 'true',
        consideraFeriadoEstadual = 'true',
        prescricaoFgts = 'false',
        prescricaoQuinquenal = 'false',
        limitarAvosAoPeriodoDoCalculo = 'false',
        zeraValorNegativo = 'false',
        consideraFeriadoMunicipal = 'true',
        tipoCalculo = 'VARA',
        prazoFeriasProporcional = 'null',
        regimeDoContrato = 'INTEGRAL',
        indicesAcumulados = 'MES_SUBSEQUENTE_AO_VENCIMENTO',
        apuracaoPrazoDoAvisoPrevio = 'APURACAO_CALCULADA',
        prazoAvisoInformado = 'null',
        ativo = 'true',
        processoInformadoManualmente = 'true',
        comentarios = 'Gerado por LiquidAI',
        diaFechamentoMes = '31',
    }, // vem do liquidAIExtraiTextoEditor
    {
        dataAjuizamento,
        cpfUsuarioCriador,
        idSetor
    }, // vem do liquidAIExtraiDadosPJE - dadosProcesso
    {
        versaoDoSistema
    }//, // vem do liquidAIConfigurar
    //{
//
    //} // vem do liquidAIExtraiDadosPJE - dadosProcessuaisPJECalc
){
    return {
        id: id,
        versao: versao,
        atualizacao: 'null',
        hashCodeLiquidacao: '',
        dataCriacao,
        dataAdmissao, // falta
        dataDemissao, // falta
        dataAjuizamento,
        valorUltimaRemuneracao, // falta
        valorMaiorRemuneracao, // falta
        dataInicioCalculo: 'null',
        dataTerminoCalculo: 'null',
        valorCargaHorariaPadrao,
        sabadoDiaUtil,
        projetaAvisoIndenizado,
        consideraFeriadoEstadual,
        prescricaoFgts,
        prescricaoQuinquenal,
        limitarAvosAoPeriodoDoCalculo,
        zeraValorNegativo,
        consideraFeriadoMunicipal,
        tipoCalculo,
        prazoFeriasProporcional,
        dataDeLiquidacao,
        regimeDoContrato,
        indicesAcumulados,
        usuarioCriador: cpfUsuarioCriador,
        apuracaoPrazoDoAvisoPrevio,
        prazoAvisoInformado,
        ativo,
        processoInformadoManualmente,
        comentarios,
        idSetor,
        instancia: 'PRIMEIRA',
        validado: 'false',
        hashCalculoCorreto: 'false',
        hashAtualizacaoCorreto: 'false',
        diaFechamentoMes,
        calculoExterno: 'false',
        parcelasAtualizaveisCreditosReclamante: 'null',
        parcelasAtualizaveisDescontoCreditosReclamante: 'null',
        parcelasAtualizaveisOutrosDebitosReclamado: 'null',
        parcelasAtualizaveisDebitosReclamante: 'null',
        versaoDoSistema,
    }
}

function liquidAICriaDadosEstruturados(dataCalculo){
    return {
        dataLiquidacao: dataCalculo,
        hashLiquidacao: '',
        contrSocialDezPorcento: '0',
        contrSocialMeioPorcento: '0',
        custasReclamado: '0',
        custasReclamante: '0',
        debitoReclamantePensaoAlimenticia: '0',
        debitoReclamantePrevidenciaPrivada: '0',
        fgtsDepositoContaVinculada: '0',
        impostoRenda: '0',
        inssReclamado: '0',
        inssReclamante: '0',
        jurosMora:'null',
        jurosPrevidenciaPrivada:'null',
        valorPrincipal: '0',
        tipoRegistroCalculo: 'CALCULO',
        multas: '',
        honorarios: '',
    }
}

function liquidAICriaGprec({reclamante, cpfReclamante}, dataCalculo){
    return {
        dataCalculo: dataCalculo,
        nomeBeneficiario: reclamante,
        documentoFiscalBeneficiario: cpfReclamante,
        liquidoExequente: '0',
        inssBeneficiario: '0',
        inssExecutado: '0',
        impostoRenda: '0',
        depositoFgts: '0',
        custasJudiciais: '0',
        honorariosReclamante: '',
        honorariosReclamado: '',
    }
}

function liquidAIDefineMunicipio({municipio}){
    
    let externalRef = municipiosTOM.find(d => normalizar(d?.nome).includes(normalizar(municipio)))?.codigo
    return {municipio: {Municipio: {externalRef}}}
}

function liquidAIJsonToXml(objeto) {
    var xml = ''
    for (var propriedade in objeto) {
        xml += Array.isArray(objeto[propriedade]) ? '' : "<" + propriedade + ">"
        if (Array.isArray(objeto[propriedade])) {
            for (var array in objeto[propriedade]) {
                xml += "<" + propriedade + ">"
                xml += liquidAIJsonToXml(objeto[propriedade][array])
                xml += "</" + propriedade + ">"
            }
        } else if (typeof objeto[propriedade] == "object") {
            xml += liquidAIJsonToXml(objeto[propriedade])
        } else {
            xml += objeto[propriedade]
        }
        xml += Array.isArray(objeto[propriedade]) ? '' : "</" + propriedade + ">"
    }
    var xml = xml.replace(/<\/?[0-9]{1,}>/g, '')
    return xml
}
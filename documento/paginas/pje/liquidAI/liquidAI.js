async function liquidAIGerarPJC(){
    let {dadosProcesso, dadosProcessuaisPJECalc, municipio} = await liquidAIExtraiDadosPJE()
    console.log('%c[Rota PJE]%c dadosProcesso' + JSON.stringify(dadosProcesso), LOG.aviso, 'color:inherit')
    console.log('%c[Rota PJE]%c dadosProcessuaisPJECalc' + JSON.stringify(dadosProcessuaisPJECalc), LOG.aviso, 'color:inherit'),
    console.log('%c[Rota PJE]%c municipio' + JSON.stringify(municipio), LOG.aviso, 'color:inherit')
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
    let parametros = liquidAICriaParametrosIniciais(
        {
            id: ++indice, 
            versao: ++versao, 
            dataCriacao: dataCalculo,
            dataDeLiquidacao: dataCalculo,
            versaoDoSistema: versaoDoPJECalc,
        },
        textoSentenca,
        dadosProcesso,
        configuracoes,
    )
    // processo entra e é uma variável só
    let processoPJECalc = liquidAICriaDadosProcessuaisPJECalc(dadosProcessuaisPJECalc, ++indice, ++versao, ++indice)
    // município tem uma externalRef que é da tabela TOM da receita federal
    let municipioTOM = liquidAIDefineMunicipio({municipio})
    // restante trará tudo que não foi mapeado, de acordo com CalculoCalculistaSemVerbasSemHistorico.xml
    let restante = naoMapeados()
}

function liquidAIExtraiTextoEditor(){
    return({
        dataAdmissao,
        dataDemissao,
        valorUltimaRemuneracao,
        valorMaiorRemuneracao,
        sabadoDiaUtil,
        projetaAvisoIndenizado,
        consideraFeriadoEstadual,
        prescricaoFgts,
        prescricaoQuinquenal,
        limitarAvosAoPeriodoDoCalculo,
        zeraValorNegativo,
        consideraFeriadoMunicipal,
        prazoFeriasProporcional,
        regimeDoContrato,
        indicesAcumulados,
        apuracaoPrazoDoAvisoPrevio,
        prazoAvisoInformado,
        ativo,
        processoInformadoManualmente,
        comentarios,
        diaFechamentoMes,
    })
}

async function liquidAIConfigurar(parametro) {
    if(parametro === 'extrair'){
        let versaoDoPJECalc = await liquidAIObterVersao()
        return({versaoDoSistema: versaoDoPJECalc})
    }
    async function liquidAIObterVersao() {
        let versao = ''
        return ({versao})
    }
}

async function liquidAIExtraiDadosPJE(){
    let interceptadorProcesso = interceptador_lerProcesso()
    let {numero, valorDaCausa, autuadoEm} = interceptadorProcesso
    let numeroPonto = numero.split('.')
    let numeroTraco = numeroPonto[0].split('-')
    let municipio = interceptadorProcesso?.processoJT?.municipio?.nome
    
    let interceptadorPartes = interceptador_lerPartes()
    let dadosReclamante = interceptadorPartes?.ATIVO[0]
    let reclamante = dadosReclamante?.nome
    let tipoDocumentoFiscalReclamante = dadosReclamante?.tipoDocumento
    let numeroDocumentoFiscalReclamante = dadosReclamante?.documento
    let dadosReclamado = interceptadorPartes?.PASSIVO[0]
    let reclamado = dadosReclamado?.nome
    let tipoDocumentoFiscalReclamado = dadosReclamado?.tipoDocumento
    let numeroDocumentoFiscalReclamado = dadosReclamante?.documento
    console.log('%c[Rota PJE]%c interceptadorProcesso' + JSON.stringify(interceptadorProcesso), LOG.aviso, 'color:inherit', interceptadorProcesso)
    console.log('%c[Rota PJE]%c interceptadorPartes' + JSON.stringify(interceptadorPartes), LOG.aviso, 'color:inherit', interceptadorPartes)
    return({
        dadosProcesso:{
            reclamante,
            cpfReclamante: numeroDocumentoFiscalReclamante,
            dataAjuizamento: autuadoEm.slice(0,10),
            cpfUsuarioCriador: '', // falta
            idSetor: '' // falta
        },
        dadosProcessuaisPJECalc:{
            valorDaCausa,
            dataAutuacao: autuadoEm.slice(0,10),
            numero: numeroTraco[0],
            ano: numeroPonto[1],
            justica: numeroPonto[2],
            regiao: numeroPonto[3],
            vara: numeroPonto[4],
            digito: numeroTraco[1],
            tipoDocumentoPrevidenciarioReclamante: '',
            numeroDocumentoPrevidenciarioReclamante: '',
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
                    List
                },
                advogadosReclamado:{
                    List
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
        dataAdmissao,
        dataDemissao,
        valorUltimaRemuneracao,
        valorMaiorRemuneracao,
        valorCargaHorariaPadrao = '220',
        sabadoDiaUtil= 'true',
        projetaAvisoIndenizado= 'true',
        consideraFeriadoEstadual= 'true',
        prescricaoFgts= 'false',
        prescricaoQuinquenal= 'false',
        limitarAvosAoPeriodoDoCalculo= 'false',
        zeraValorNegativo= 'false',
        consideraFeriadoMunicipal= 'true',
        tipoCalculo= 'VARA',
        prazoFeriasProporcional= 'null',
        regimeDoContrato= 'INTEGRAL',
        indicesAcumulados= 'MES_SUBSEQUENTE_AO_VENCIMENTO',
        apuracaoPrazoDoAvisoPrevio= 'APURACAO_CALCULADA',
        prazoAvisoInformado= 'null',
        ativo= 'true',
        processoInformadoManualmente= 'false',
        comentarios= 'null',
        diaFechamentoMes= '31',
    }, // vem do liquidAIExtraiTextoEditor
    {
        dataAjuizamento,
        cpfUsuarioCriador,
        idSetor
    }, // vem do liquidAIExtraiDadosPJE - dadosProcesso
    {
        versaoDoSistema
    }, // vem do liquidAIConfigurar
    {

    } // vem do liquidAIExtraiDadosPJE - dadosProcessuaisPJECalc
){
    let parametros = {
        id: id,
        versao: versao,
        atualizacao: 'null',
        hashCodeLiquidacao,
        dataCriacao,
        dataAdmissao,
        dataDemissao,
        dataAjuizamento,
        valorUltimaRemuneracao,
        valorMaiorRemuneracao,
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
    let dadosEstruturados = {
        dataLiquidacao: dataCalculo,
        hashLiquidacao,
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
        multas,
        honorarios,
    }
}

function liquidAICriaGprec({reclamante, cpfReclamante}, dataCalculo){
    let gprec = {
        dataCalculo: dataCalculo,
        nomeBeneficiario: reclamante,
        documentoFiscalBeneficiario: cpfReclamante,
        liquidoExequente: '0',
        inssBeneficiario: '0',
        inssExecutado: '0',
        impostoRenda: '0',
        depositoFgts: '0',
        custasJudiciais: '0',
        honorariosReclamante,
        honorariosReclamado,
    }
    return {gprec}
}

function liquidAIDefineMunicipio({cidade}){
    let externalRef = municipioTOM.find(d => normalizar(d?.nome).includes(normalizar(cidade)))?.codigo
    return {municipio: {Municipio: externalRef}}
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
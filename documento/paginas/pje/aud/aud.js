async function menuPericiasAud() {
    let janela = confereJanela(JANELA.aud)
    if (!janela) return
    let seletorBarra = '.document-editor__toolbar .ck-toolbar__items'
    await aguardarElemento(seletorBarra)
    let barra = document.querySelector(seletorBarra)
    if (!barra) return
    let idBotaoPericias = id('aud', 'pericias', 'botao')
    let remover = [...document.querySelectorAll('#' + idBotaoPericias)].map(d => d.remove())
    let botaoPericias = criaBotaoLaranja({
        id: idBotaoPericias,
        ancestral: seletorBarra,
        texto: 'Perícias',
        acao: async () => await criaQuadroDePericias()
    })

}
async function criaQuadroDePericias(){
    let idDivQuadro = id('aud', 'pericias', 'quadro')
    let remover = [...document.querySelectorAll('#' + idDivQuadro)].map(d => d.remove())
    let quadro = criaDiv({
        id: idDivQuadro,
        ancestral: 'ffff'
    })
    formataDiv(quadro, 'branco', '75%', '75%')
    let idCabecalho = id('aud', 'pericias', 'quadro', 'cabecalho')
    let cabecalho = criaDiv({
        id: idCabecalho,
        ancestral: idDivQuadro,
        rowColumn: 'row-reverse'
    })
    let idBotaoFechar = id('aud', 'pericias', 'quadro', 'fechar')
    let botaoFechar = criaBotaoAzul({
        id: idBotaoFechar,
        texto: '✕',
        ancestral: idCabecalho,
        acao: () => {
            document.getElementById(idDivQuadro)?.remove()
            return
        }
    })
    botaoFechar.style.height =          '20px'
    botaoFechar.style.fontSize =        '13px'
    botaoFechar.style.lineHeight =      '1px'
    botaoFechar.style.padding =         '2px 5px'
    botaoFechar.style.borderRadius =    '4px'
    let idTitulo = id('aud', 'pericias', 'quadro', 'titulo')
    let titulo = criaTitulo({
        id: idTitulo,
        texto: 'Perícias',
        ancestral: idCabecalho
    })
    titulo.style.width = '100%'
    titulo.style.fontSize = '18px'
    let idRolante = id('aud', 'pericias', 'quadro', 'rolante')
    let divRolante = criaDiv({
        id: idRolante,
        ancestral: idDivQuadro
    })
    divRolante.style.overflowY = 'auto'

    let dados = await buscarDadosPeritosGit()

    await montarQuadro(idRolante, dados)

    async function buscarDadosPeritosGit() {
        let resposta = await lerGit('rotapje_peritos.json')
        if (typeof resposta === 'string') {
            try { resposta = JSON.parse(resposta) } catch (e) { resposta = [] }
        }
        return Array.isArray(resposta) ? resposta : []
    }
}


// ============================================================
// montarQuadro
// Reproduz a "Calculadora de Prazos e Consulta de Peritos"
// (nomeacao_peritos_Bauru.htm) com os componentes do ui.js:
//   1. Filtros e seleção direta de peritos (+ Técnica / + Médica)
//   2. Data base e prazos em dias úteis
//   3. Abas com o texto da ata e botão de copiar
// ============================================================

async function montarQuadro(idRolante, dados) {

    let base    = id('aud', 'pericias')
    let peritos = pericias_normalizarPeritos(dados)

    // Estado compartilhado entre as seções
    let estado = {
        tecnico:   null,       // perito selecionado para a perícia técnica
        medico:    null,       // perito selecionado para a perícia médica
        tipo:      'tecnica',  // aba ativa
        suspensaoCPC: true,    // art. 220 do CPC (07 a 20/01)
    }

    // Referências preenchidas pelas seções
    let redesenharTabela = () => {}
    let atualizarTexto   = () => {}

    await secaoPeritos()
    await secaoPrazos()
    secaoTexto()

    atualizarTexto()
    pericias_carregarFeriadosAPI().then(ok => {
        let status = document.getElementById(base + '-status-feriados')
        if (status) status.textContent = ok ? 'Feriados do OJ carregados do PJe' : 'Modo offline (regras locais)'
        atualizarTexto()
    })


    // ── 1. Filtros e seleção direta de peritos ───────────────

    async function secaoPeritos() {
        let idSecao   = base + '-peritos'
        let idMostra  = idSecao + '-mostra'
        let idRecolhe = idSecao + '-recolhe'

        await criaSecaoMostraRecolhe({ id: idSecao, idSempreAMostra: idMostra, idRecolhe, ancestral: idRolante })
        criaTitulo({ id: idSecao + '-titulo', texto: '1. Filtros e Seleção Direta de Peritos', ancestral: idMostra })

        let idGradeFiltros = idSecao + '-filtros'
        criaGrade({
            id: idGradeFiltros,
            ancestral: idRecolhe,
            numeroColunas: 3,
            larguraColunas: { coluna0: '1fr', coluna1: '1fr', coluna2: '1fr' }
        })

        let inputNome = criaInput({
            id: idSecao + '-nome',
            textoEmCima: 'Buscar por nome',
            placeholder: 'Digite o nome...',
            ancestral: idGradeFiltros
        })
        inputNome.addEventListener('input', () => redesenharTabela())

        let idColVara = idSecao + '-col-vara'
        let idColEsp  = idSecao + '-col-esp'
        criaDiv({ id: idColVara, ancestral: idGradeFiltros })
        criaDiv({ id: idColEsp,  ancestral: idGradeFiltros })
        pericias_rotulo('Localidade / Vara', idColVara)
        pericias_rotulo('Especialidade',     idColEsp)

        let menuVara = criaMenuSuspenso({
            id: idSecao + '-vara',
            opcoes: [{ valor: '', texto: 'Todas as localidades' }, ...pericias_unicos(peritos.flatMap(p => p.varas))],
            valorInicial: '',
            ancestral: idColVara,
            acao: () => redesenharTabela()
        })
        let menuEsp = criaMenuSuspenso({
            id: idSecao + '-esp',
            opcoes: [{ valor: '', texto: 'Todas as especialidades' }, ...pericias_unicos(peritos.flatMap(p => p.especialidades))],
            valorInicial: '',
            ancestral: idColEsp,
            acao: () => redesenharTabela()
        })

        let estatistica = criaTexto({ id: idSecao + '-stats', texto: '', ancestral: idRecolhe })
        estatistica.style.fontSize = '11px'
        estatistica.style.color    = UI_CORES.suave

        let idTabela = idSecao + '-tabela'
        let colNome  = idTabela + '-nome'
        let colEsp   = idTabela + '-esp'
        let colVaras = idTabela + '-varas'
        let colAcao  = idTabela + '-acao'
        let wrapper  = criaTabela({
            id: idTabela,
            idDasColunas: [colNome, colEsp, colVaras, colAcao],
            colunas: ['Nome do Perito', 'Especialidade(s)', 'Localidades', 'Nomear na Ata'],
            ancestral: idRecolhe
        })
        wrapper.style.maxHeight = '260px'
        wrapper.style.overflowY = 'auto'
        wrapper.querySelectorAll('thead th').forEach(th => {
            th.style.position = 'sticky'
            th.style.top      = '0'
            th.style.zIndex   = '1'
        })

        redesenharTabela = function () {
            let termo = pericias_normalizar(inputNome.value)
            let vara  = menuVara.value
            let esp   = menuEsp.value

            let lista = peritos.filter(p =>
                (!termo || pericias_normalizar(p.nome).includes(termo)) &&
                (!vara  || p.varas.includes(vara)) &&
                (!esp   || p.especialidades.includes(esp))
            )

            document.getElementById(idTabela + '-corpo').replaceChildren()
            estatistica.textContent = `${lista.length} de ${peritos.length} peritos`

            if (!lista.length) {
                let tr = ui_adicionarLinhaTabela(idTabela, { [colNome]: 'Nenhum perito encontrado.' })
                while (tr.children.length > 1) tr.lastChild.remove()
                tr.children[0].colSpan   = 4
                tr.children[0].style.color = UI_CORES.suave
                return
            }

            lista.forEach(p => {
                let ehTecnico = estado.tecnico?.nome === p.nome
                let ehMedico  = estado.medico?.nome  === p.nome

                let tr = ui_adicionarLinhaTabela(idTabela, {
                    [colNome]:  pericias_celulaNome(p, ehTecnico, ehMedico, idTabela),
                    [colEsp]:   pericias_plaquinhas(p.especialidades, 'azul',  idTabela + '-esp-'  + p.indice),
                    [colVaras]: pericias_plaquinhas(p.varas,          'verde', idTabela + '-vara-' + p.indice),
                    [colAcao]:  pericias_celulaAcoes(p, ehTecnico, ehMedico, idTabela, selecionar),
                })
                for (let td of tr.children) {
                    td.style.textAlign     = 'left'
                    td.style.verticalAlign = 'top'
                }
                tr.lastChild.style.textAlign = 'center'
                tr.lastChild.style.width     = '170px'

                if (ehTecnico) tr.style.background = '#ebf8ff'
                if (ehMedico)  tr.style.background = '#fff3e0'
            })
        }

        // Clicar de novo no perito já escolhido desfaz a seleção
        function selecionar(tipo, perito) {
            let chave = tipo === 'tecnica' ? 'tecnico' : 'medico'
            estado[chave] = estado[chave]?.nome === perito.nome ? null : perito
            redesenharTabela()
            atualizarTexto()
        }

        redesenharTabela()
    }


    // ── 2. Data base e prazos ────────────────────────────────

    async function secaoPrazos() {
        let idSecao   = base + '-prazos'
        let idMostra  = idSecao + '-mostra'
        let idRecolhe = idSecao + '-recolhe'

        await criaSecaoMostraRecolhe({ id: idSecao, idSempreAMostra: idMostra, idRecolhe, ancestral: idRolante })
        criaTitulo({ id: idSecao + '-titulo', texto: '2. Data Base e Prazos (em Dias Úteis)', ancestral: idMostra })

        criaPlaquinha({
            id: base + '-status-feriados',
            texto: 'Verificando feriados...',
            cor: 'verde',
            ancestral: idRecolhe
        }).style.alignSelf = 'flex-start'

        let inputData = criaInput({
            id: idSecao + '-data',
            textoEmCima: 'Data inicial (audiência/intimação)',
            ancestral: idRecolhe
        })
        inputData.type  = 'date'
        inputData.value = pericias_dataDaAudiencia() || pericias_hojeISO()
        inputData.addEventListener('change', () => atualizarTexto())

        let idGrade = idSecao + '-grade'
        criaGrade({
            id: idGrade,
            ancestral: idRecolhe,
            numeroColunas: 5,
            larguraColunas: { coluna0: '1fr', coluna1: '1fr', coluna2: '1fr', coluna3: '1fr', coluna4: '1fr' }
        })
        let inputsPrazo = PERICIAS_PRAZOS.map((p, i) => {
            let inp = criaInput({
                id: idSecao + '-p' + (i + 1),
                textoEmCima: `${i + 1}. ${p.rotulo}`,
                ancestral: idGrade
            })
            inp.type  = 'number'
            inp.min   = '1'
            inp.value = p.padrao
            inp.addEventListener('input', () => atualizarTexto())
            return inp
        })

        let idCPC = idSecao + '-cpc'
        let chkCPC = criaCheckBox({
            id: idCPC,
            textoAoLado: 'Considerar a suspensão de prazos processuais (art. 220 do CPC - 07 a 20 de janeiro)',
            ancestral: idRecolhe
        })
        chkCPC.click()   // começa marcado, como no original
        chkCPC.addEventListener('click', () => {
            estado.suspensaoCPC = ui_checkboxMarcado(idCPC)
            atualizarTexto()
        })

        // Datas calculadas — todas contadas a partir da data inicial
        estado.calcularDatas = function () {
            let inicio = pericias_lerDataISO(inputData.value)
            if (!inicio) return null
            return inputsPrazo.map((inp, i) => {
                let dias = parseInt(inp.value, 10) || PERICIAS_PRAZOS[i].padrao
                return pericias_formatarData(pericias_somarDiasUteis(inicio, dias, estado.suspensaoCPC))
            })
        }
    }


    // ── 3. Texto da ata ──────────────────────────────────────

    function secaoTexto() {
        let idSecao = base + '-texto'
        criaDiv({ id: idSecao, ancestral: idRolante })
        criaTitulo({ id: idSecao + '-titulo', texto: 'Texto da Ata', ancestral: idSecao })

        let idAbas = idSecao + '-abas'
        criaGrade({
            id: idAbas,
            ancestral: idSecao,
            numeroColunas: 3,
            larguraColunas: { coluna0: '1fr', coluna1: '1fr', coluna2: '1fr' }
        })
        desenharAbas()

        let previa = _ui_el('div', {
            border:       '1px solid ' + UI_CORES.borda,
            borderRadius: '6px',
            padding:      '8px 12px',
            margin:       '0 4px',
            fontSize:     '12px',
            lineHeight:   '1.5',
            color:        UI_CORES.texto,
            fontFamily:   rota_ui_fonte(),
            background:   UI_CORES.fundo,
            maxHeight:    '320px',
            overflowY:    'auto',
            textAlign:    'justify',
        })
        previa.id = idSecao + '-previa'
        _ui_inserir(previa, idSecao)
        
        criaDiv({
            id: idSecao + '-div',
            ancestral: idSecao,
            rowColumn: 'row'
        })
        let textoLimpar = '🧹 Limpar tudo'
        let botaoLimpar = criaBotaoAzul({
            id: idSecao + '-limpar',
            texto: textoLimpar,
            ancestral: idSecao + '-div',
            acao: async () => await criaQuadroDePericias()
        })
        botaoLimpar.style.width = '50%'
        let textoCopiar = '📋 Copiar texto'
        let botaoCopiar = criaBotaoAzul({
            id: idSecao + '-copiar',
            texto: textoCopiar,
            ancestral: idSecao + '-div',
            acao: async () => {
                let ok = await pericias_copiarFormatado(previa)
                botaoCopiar.textContent = ok ? '✓ Copiado com sucesso!' : 'Falha ao copiar'
                setTimeout(() => botaoCopiar.textContent = textoCopiar, 2000)
            }
        })
        botaoCopiar.style.width = '50%'

        let credito = criaTexto({ id: idSecao + '-credito', texto: 'Modelos: otocampos@trt15.jus.br', ancestral: idSecao })
        credito.style.fontSize  = '10px'
        credito.style.fontStyle = 'italic'
        credito.style.color     = UI_CORES.suave

        atualizarTexto = function () {
            let datas = estado.calcularDatas?.()
            if (!datas) {
                previa.textContent = 'Informe a data inicial.'
                return
            }
            previa.innerHTML = PERICIAS_TEXTOS[estado.tipo](datas, estado)
        }

        function desenharAbas() {
            let container = document.getElementById(idAbas)
            container.replaceChildren()
            for (let [chave, rotulo] of Object.entries(PERICIAS_ABAS)) {
                let idAba = idAbas + '-' + chave
                let acao  = () => {
                    estado.tipo = chave
                    desenharAbas()
                    atualizarTexto()
                }
                if (chave === estado.tipo) {
                    let aba = criaBotaoAzul({ id: idAba, texto: rotulo, ancestral: idAbas, acao })
                    aba.style.border = '1px solid ' + UI_CORES.azul
                } else {
                    pericias_criaBotao({
                        id: idAba, texto: rotulo, ancestral: idAbas, acao,
                        cor: UI_CORES.fundo, corHover: UI_CORES.borda, corTexto: UI_CORES.texto,
                        estilos: { border: '1px solid ' + UI_CORES.borda }
                    })
                }
            }
        }
    }
}


// ── Configuração ─────────────────────────────────────────────

// Cada prazo é contado a partir da data inicial (não são encadeados)
let PERICIAS_PRAZOS = [
    { rotulo: 'Agendar perícia',    padrao: 10 },
    { rotulo: 'Réplica / Quesitos', padrao: 15 },
    { rotulo: 'Apresentar laudo',   padrao: 40 },
    { rotulo: 'Manifestar laudo',   padrao: 50 },
    { rotulo: 'Esclarecimentos',    padrao: 60 },
]

let PERICIAS_ABAS = {
    tecnica: 'Insalubridade/Periculosidade',
    medica:  'Perícia Médica',
    dupla:   'Cumulativas (Técnica + Médica)',
}

// Feriados recorrentes (mês-dia): nacionais + estadual SP (09/07)
// + municipais de Bauru (01/08 e 08/12), como no arquivo original
let PERICIAS_FERIADOS_FIXOS = ['01-01', '04-21', '05-01', '07-09', '08-01', '09-07', '10-12', '11-02', '11-15', '11-20', '12-08', '12-25']

// Deslocamentos em relação à Páscoa: carnaval (seg e ter),
// sexta-feira santa e Corpus Christi
let PERICIAS_FERIADOS_MOVEIS = [-48, -47, -2, 60]


// ── Textos da ata ────────────────────────────────────────────
// d = [d10, d15, d40, d50, d60]

let PERICIAS_TEXTOS = {

    tecnica: (d, estado) => `
<p>Defere-se às partes o prazo de 05 dias para regularizar a representação processual, caso necessário, juntando carta de preposição, substabelecimento e documentos de constituição.</p>
<p>INCONCILIADOS.</p>
<p>Defesa escrita, com documentos. Neste ato é retirado o sigilo.</p>
${pericias_nomeacaoTecnica(estado.tecnico)}
<p>As partes informam que a perícia técnica deverá ser realizada no endereço da reclamada constante da petição inicial.</p>
<p><b>Fixação de prazos:</b></p>
<p style="margin-left: 20px;"><b>Perito:</b> até <b>${d[0]}</b> para informar no processo a data, hora e local da realização de suas diligências, ficando ciente da sua nomeação e do prazo assinalado mediante a inclusão deste processo em seu painel de trabalho no PJe.</p>
<p style="margin-left: 20px;"><b>Partes:</b> até <b>${d[1]}</b> para tomar ciência da data, hora e local da diligência. No mesmo prazo, poderá o autor apresentar sua réplica e poderão as partes apresentar quesitos e indicar assistente técnico, cabendo aos advogados dar ciência a seus clientes e assistentes técnicos.</p>
<p style="margin-left: 20px;"><b>Perito:</b> até <b>${d[2]}</b> para realização do trabalho pericial e entrega do laudo técnico.</p>
<p style="margin-left: 20px;"><b>Partes:</b> até <b>${d[3]}</b> para manifestação sobre o laudo pericial.</p>
<p style="margin-left: 20px;"><b>Perito:</b> até <b>${d[4]}</b> para esclarecimentos e resposta às impugnações das partes, se forem específicas, fundamentadas e acompanhadas de questões suplementares.</p>
<p>As partes poderão comparecer à perícia e prestar ao perito todas as informações sobre as atividades realizadas e os EPIs utilizados, sob pena de preclusão. A parte que não comparecer à inspeção ficará sujeita às declarações da parte que se fizer presente. A ausência de uma das partes não obsta a realização dos trabalhos do perito.</p>
<p>Autoriza-se o acompanhamento da perícia pelo reclamante, seu advogado e assistente técnico (desde que comprovada a habilitação de engenheiro ou técnico em segurança do trabalho). A presença das partes é facultativa.</p>
${PERICIAS_TEXTO_FINAL}`,

    medica: (d, estado) => `
<p>Defere-se às partes o prazo de 05 dias para regularizar a representação processual, caso necessário, juntando carta de preposição, substabelecimento e documentos de constituição.</p>
<p>INCONCILIADOS.</p>
<p>Defesa escrita, com documentos. Neste ato é retirado o sigilo.</p>
${pericias_nomeacaoMedica(estado.medico)}
<p>A perícia médica será realizada em local a ser indicado pelo perito nomeado.</p>
<p><b>Fixação de prazos:</b></p>
<p style="margin-left: 20px;"><b>Perito:</b> até <b>${d[0]}</b> para informar no processo a data, hora e local da realização de suas diligências, ficando ciente da sua nomeação e do prazo assinalado mediante a inclusão deste processo em seu painel de trabalho no PJe.</p>
<p style="margin-left: 20px;"><b>Partes:</b> até <b>${d[1]}</b> para tomar ciência da data, hora e local da diligência. No mesmo prazo, poderá o autor apresentar sua réplica e poderão as partes apresentar quesitos e indicar assistente técnico, cabendo aos advogados dar ciência a seus clientes e assistentes técnicos.</p>
<p style="margin-left: 20px;"><b>Perito:</b> até <b>${d[2]}</b> para realização do trabalho pericial e entrega do laudo.</p>
<p style="margin-left: 20px;"><b>Partes:</b> até <b>${d[3]}</b> para manifestação sobre o laudo pericial.</p>
<p style="margin-left: 20px;"><b>Perito:</b> até <b>${d[4]}</b> para esclarecimentos e resposta às impugnações das partes, se forem específicas, fundamentadas e acompanhadas de questões suplementares.</p>
<p>A ausência à perícia médica deverá ser justificada no prazo de 24 horas, sob pena de preclusão da produção da prova pericial médica.</p>
${PERICIAS_TEXTO_PRONTUARIO}
${PERICIAS_TEXTO_FINAL}`,

    dupla: (d, estado) => `
<p>Defere-se às partes o prazo de 05 dias para regularizar a representação processual, caso necessário, juntando carta de preposição, substabelecimento e documentos de constituição.</p>
<p>INCONCILIADOS.</p>
<p>Defesa escrita, com documentos. Neste ato é retirado o sigilo.</p>
${pericias_nomeacaoTecnica(estado.tecnico)}
${pericias_nomeacaoMedica(estado.medico)}
<p><b>Fixação de prazos:</b></p>
<p style="margin-left: 20px;"><b>Peritos:</b> até <b>${d[0]}</b> para informar no processo a data, hora e local da realização de suas diligências, ficando cientes de suas nomeações e do prazo assinalado mediante a inclusão deste processo em seus painéis de trabalho no PJe.</p>
<p style="margin-left: 20px;"><b>Partes:</b> até <b>${d[1]}</b> para tomar ciência da data, hora e local das diligências. No mesmo prazo, poderá o autor apresentar sua réplica e poderão as partes apresentar quesitos e indicar assistentes técnicos para ambas as perícias, cabendo aos advogados dar ciência a seus clientes e assistentes técnicos.</p>
<p style="margin-left: 20px;"><b>Peritos:</b> até <b>${d[2]}</b> para realização dos trabalhos periciais e entrega dos laudos técnicos.</p>
<p style="margin-left: 20px;"><b>Partes:</b> até <b>${d[3]}</b> para manifestação sobre os laudos periciais.</p>
<p style="margin-left: 20px;"><b>Peritos:</b> até <b>${d[4]}</b> para esclarecimentos e resposta às impugnações das partes, se forem específicas, fundamentadas e acompanhadas de questões suplementares.</p>
<p><b>Disposições da Perícia Técnica:</b></p>
<p>As partes informam que a perícia técnica deverá ser realizada no endereço da reclamada constante da petição inicial.</p>
<p>As partes poderão comparecer à perícia técnica e prestar ao perito todas as informações sobre as atividades realizadas e os EPIs utilizados, sob pena de preclusão. A parte que não comparecer à inspeção ficará sujeita às declarações da parte que se fizer presente. A ausência de uma das partes não obsta a realização dos trabalhos do perito.</p>
<p>Autoriza-se o acompanhamento da perícia pelo reclamante, seu advogado e assistente técnico (desde que comprovada a habilitação de engenheiro ou técnico em segurança do trabalho). A presença das partes é facultativa.</p>
<p><b>Disposições da Perícia Médica:</b></p>
<p>A perícia médica será realizada em local a ser indicado pelo perito nomeado.</p>
<p>A ausência à perícia médica deverá ser justificada no prazo de 24 horas, sob pena de preclusão da produção da prova pericial médica.</p>
${PERICIAS_TEXTO_PRONTUARIO}
${PERICIAS_TEXTO_FINAL}`,
}

let PERICIAS_TEXTO_PRONTUARIO = `
<p>#prontuario</p>
<p>Providencie a Secretaria a juntada dos seguintes documentos, em sigilo, com visibilidade às partes no processo, no prazo de 20 (vinte) dias, os quais deverão ser obtidos por meio do convênio PREVJUD, firmado com o INSS:</p>
<p style="margin-left: 20px;">I - FAP – Fator Acidentário de Prevenção referente à empresa empregadora;</p>
<p style="margin-left: 20px;">II - Códigos de afastamento referentes aos benefícios previdenciários concedidos ao autor (início do benefício, alta médica, natureza do benefício);</p>
<p style="margin-left: 20px;">III - laudos periciais produzidos;</p>
<p style="margin-left: 20px;">IV - CATs expedidas durante todo o contrato de trabalho do reclamante;</p>
<p style="margin-left: 20px;">V - Cópia integral do procedimento administrativo de concessão de benefícios previdenciários ao reclamante.</p>`

let PERICIAS_TEXTO_FINAL = `
<p>Não serão admitidas novas impugnações nem dilação de prazos, salvo por motivo justo e comprovado, devendo as partes observar o calendário processual estabelecido.</p>
<p>A Secretaria não expedirá intimações. Todos os prazos são preclusivos e transcorrerão independentemente de notificação.</p>
<p><b>A audiência de instrução é desde já designada para o dia xx/xx/2026, às xxhxx.</b></p>
<p>#audpresencial</p>
<p>#audtele</p>`

function pericias_nomeacaoTecnica(perito) {
    if (!perito) return '<p><b>[SELECIONE O PERITO TÉCNICO NA TABELA ACIMA]</b></p>'
    let nome = pericias_nomeLimpo(perito.nome)
    let soErgonomia = perito.especialidades.includes('Ergonomia') &&
                       !perito.especialidades.includes('Insalubridade/Periculosidade')
    return soErgonomia
        ? `<p>Para a verificação das condições de trabalho de acordo com a NR 17 (ergonomia do trabalho), nomeio a expert ${nome}.</p>`
        : `<p>Para atuar como perito do Juízo na apuração da insalubridade e/ou periculosidade alegada pelo reclamante, nomeio o expert ${nome}.</p>`
}

function pericias_nomeacaoMedica(perito) {
    if (!perito) return '<p><b>[SELECIONE O PERITO MÉDICO NA TABELA ACIMA]</b></p>'
    return `<p>Para a apuração de doença ocupacional ou danos alegados na petição inicial e o nexo de causalidade com o trabalho, nomeio como perito médico do juízo o expert ${pericias_nomeLimpo(perito.nome)}.</p>`
}


// ── Auxiliares de interface ──────────────────────────────────

// Botão no formato do ui.js com cores livres, sem exigir ancestral
function pericias_criaBotao({ id, texto, ancestral, acao, cor, corHover, corTexto = '#ffffff', estilos = {} }) {
    let btn = _ui_el('button', { ..._ui_estiloBotao(cor, corHover, corTexto), ...estilos })
    btn.id          = id
    btn.textContent = texto
    _ui_hoverBotao(btn, cor, corHover)
    btn.addEventListener('click', acao)
    if (ancestral) _ui_inserir(btn, ancestral)
    return btn
}

// Rótulo no mesmo estilo do textoEmCima do criaInput
function pericias_rotulo(texto, ancestral) {
    let el = _ui_el('div', {
        fontSize:   '11px',
        color:      UI_CORES.suave,
        fontFamily: 'var(--extensao-rotapje-fonte)',
        marginBottom: '-3px',
    })
    el.textContent = texto
    _ui_inserir(el, ancestral)
    return el
}

function pericias_plaquinhas(textos, cor, prefixoId) {
    let container = _ui_el('div', { display: 'flex', flexWrap: 'wrap' })
    textos.forEach((texto, i) => {
        container.appendChild(criaPlaquinha({ id: prefixoId + '-' + i, texto, cor }))
    })
    return container
}

function pericias_celulaNome(perito, ehTecnico, ehMedico, prefixo) {
    let container = _ui_el('div', {})
    let nome = _ui_el('div', { fontWeight: '700', marginBottom: '3px' })
    nome.textContent = perito.nome
    container.appendChild(nome)
    if (ehTecnico) container.appendChild(criaPlaquinha({ id: prefixo + '-sel-tec', texto: 'TÉCNICA', cor: 'azul' }))
    if (ehMedico)  container.appendChild(criaPlaquinha({ id: prefixo + '-sel-med', texto: 'MÉDICA',  cor: 'laranja' }))
    return container
}

// Botões liberados conforme a especialidade, como no original
function pericias_celulaAcoes(perito, ehTecnico, ehMedico, prefixo, selecionar) {
    let container = _ui_el('div', { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '4px' })
    let pequeno   = { display: 'inline-block', padding: '4px 10px', fontSize: '11px', margin: '0' }

    let podeTecnica = perito.especialidades.includes('Insalubridade/Periculosidade') ||
                        perito.especialidades.includes('Ergonomia')
    let podeMedica  = perito.especialidades.includes('Médica')

    if (podeTecnica) container.appendChild(pericias_criaBotao({
        id: `${prefixo}-btn-tec-${perito.indice}`,
        texto: ehTecnico ? '✕ Técnica' : '+ Técnica',
        cor: UI_CORES.azul, corHover: UI_CORES.azulHover,
        estilos: pequeno,
        acao: () => selecionar('tecnica', perito),
    }))
    if (podeMedica) container.appendChild(pericias_criaBotao({
        id: `${prefixo}-btn-med-${perito.indice}`,
        texto: ehMedico ? '✕ Médica' : '+ Médica',
        cor: UI_CORES.laranja, corHover: UI_CORES.laranjaHover,
        estilos: pequeno,
        acao: () => selecionar('medica', perito),
    }))
    return container
}

// Copia com formatação (negrito, recuos) para colar no editor da ata
async function pericias_copiarFormatado(elemento) {
    let html  = elemento.innerHTML
    let texto = elemento.innerText
    try {
        await navigator.clipboard.write([new ClipboardItem({
            'text/html':  new Blob([html],  { type: 'text/html' }),
            'text/plain': new Blob([texto], { type: 'text/plain' }),
        })])
        return true
    } catch (e) {
        // Alternativa: seleciona o conteúdo e usa execCommand
        let selecao = window.getSelection()
        let faixa   = document.createRange()
        faixa.selectNodeContents(elemento)
        selecao.removeAllRanges()
        selecao.addRange(faixa)
        let ok = false
        try { ok = document.execCommand('copy') } catch (erro) { console.error('[pericias] falha ao copiar', erro) }
        selecao.removeAllRanges()
        return ok
    }
}


// ── Auxiliares de dados ──────────────────────────────────────

function pericias_normalizarPeritos(dados) {
    if (!Array.isArray(dados)) return []
    return dados
        .filter(p => p && p.nome)
        .map((p, indice) => ({
            nome:           String(p.nome).trim(),
            especialidades: Array.isArray(p.especialidades) ? p.especialidades : [],
            varas:          Array.isArray(p.varas) ? p.varas : [],
            indice,
        }))
}

function pericias_nomeLimpo(nome) {
    return nome.replace(/\s*\(.*?\)/g, '').trim()
}

function pericias_unicos(lista) {
    return [...new Set(lista)].sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

function pericias_normalizar(texto) {
    return String(texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}


// ── Auxiliares de data ───────────────────────────────────────

// Lê "17/09/2026" do cabeçalho do AUD4 e devolve "2026-09-17"
function pericias_dataDaAudiencia() {
    let texto = document.querySelector('.datahora-audiencia')?.textContent || ''
    let m = texto.match(/(\d{2})\/(\d{2})\/(\d{4})/)
    return m ? `${m[3]}-${m[2]}-${m[1]}` : ''
}

function pericias_iso(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function pericias_hojeISO() {
    return pericias_iso(new Date())
}

function pericias_lerDataISO(iso) {
    let m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null
}

function pericias_formatarData(d) {
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

function pericias_somarDiasUteis(dataBase, dias, suspensaoCPC) {
    let d = new Date(dataBase)
    let contados = 0
    while (contados < dias) {
        d.setDate(d.getDate() + 1)
        if (pericias_ehDiaUtil(d, suspensaoCPC)) contados++
    }
    return d
}

function pericias_ehDiaUtil(d, suspensaoCPC) {
    let diaSemana = d.getDay()
    if (diaSemana === 0 || diaSemana === 6) return false

    let mes = d.getMonth() + 1, dia = d.getDate()

    // Recesso forense: 20/12 a 06/01
    if ((mes === 12 && dia >= 20) || (mes === 1 && dia <= 6)) return false

    // Suspensão do art. 220 do CPC: 07 a 20/01 (opcional)
    if (suspensaoCPC && mes === 1 && dia >= 7 && dia <= 20) return false

    let iso = pericias_iso(d)
    return !pericias_feriadosDoAno(d.getFullYear()).has(iso) && !_pericias_feriadosAPI.has(iso)
}

let _pericias_cacheFeriados = {}

function pericias_feriadosDoAno(ano) {
    if (_pericias_cacheFeriados[ano]) return _pericias_cacheFeriados[ano]
    let fixos  = PERICIAS_FERIADOS_FIXOS.map(md => `${ano}-${md}`)
    let pascoa = pericias_pascoa(ano)
    let moveis = PERICIAS_FERIADOS_MOVEIS.map(delta => {
        let d = new Date(pascoa)
        d.setDate(d.getDate() + delta)
        return pericias_iso(d)
    })
    return _pericias_cacheFeriados[ano] = new Set([...fixos, ...moveis])
}

// Algoritmo de Meeus/Jones/Butcher
function pericias_pascoa(ano) {
    let a = ano % 19, b = Math.floor(ano / 100), c = ano % 100
    let d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25)
    let g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30
    let i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7
    let m = Math.floor((a + 11 * h + 22 * l) / 451)
    let mes = Math.floor((h + l - 7 * m + 114) / 31)
    let dia = ((h + l - 7 * m + 114) % 31) + 1
    return new Date(ano, mes - 1, dia)
}

// Complementa as regras locais com o calendário do próprio PJe,
// pelo órgão julgador em que o usuário está logado.
// Carrega uma vez por sessão; se falhar, as regras locais seguem valendo.

let _pericias_feriadosAPI  = new Set()   // datas 'AAAA-MM-DD'
let _pericias_apiCarregada = null        // Promise<boolean>

// Tipos de evento que NÃO devem suspender prazo. Rode uma vez com o
// console aberto: a função lista os tipos que vieram do calendário.
let PERICIAS_EVENTOS_IGNORADOS = []

function pericias_carregarFeriadosAPI() {
    if (_pericias_apiCarregada) return _pericias_apiCarregada

    _pericias_apiCarregada = (async () => {
        let idOj = await pericias_idDoOrgaoJulgador()
        if (!idOj) {
            console.warn('[pericias] órgão julgador não identificado — usando só as regras locais')
            return false
        }

        let resposta = await rota_fetch(`${location.origin}/pje-comum-api/api/calendarioeventos?oj=${idOj}`)
        let eventos  = pericias_listaDeEventos(resposta)
        if (!eventos.length) return false

        console.log('%c[Rota PJE]%c calendário do OJ ' + idOj, LOG.aviso, 'color:inherit', eventos)
        console.log('%c[Rota PJE]%c tipos de evento recebidos', LOG.aviso, 'color:inherit',
            [...new Set(eventos.map(pericias_tipoDoEvento))])

        eventos.forEach(pericias_marcarEvento)
        return _pericias_feriadosAPI.size > 0
    })().catch(erro => {
        console.warn('[pericias] falha ao ler o calendário do PJe', erro)
        _pericias_apiCarregada = null
        return false
    })

    return _pericias_apiCarregada
}

// Descobre o id do OJ pelo nome que aparece no cabeçalho ("CON1 - Bauru")
async function pericias_idDoOrgaoJulgador() {
    let seletor = '.info-usuario [aria-label="Localização do usuário"]'
    await aguardarElemento(seletor)
    let nomeOj = document.querySelector(seletor)?.textContent.trim()
    if (!nomeOj) return null

    let perfis = interceptador_ler('perfis_seguranca')
        || interceptador_ler('perfis')
        || await rota_fetch(location.origin + '/audapi/rest/pje/seguranca/token/perfis/')

    let lista = pericias_listaDeEventos(perfis)
    let alvo  = pericias_normalizar(nomeOj)
    let perfil = lista.find(p => [p.orgaoJulgador, p.nomeOrgaoJulgador, p.descricao, p.nome]
        .some(n => n && pericias_normalizar(n) === alvo))

    if (!perfil) {
        console.warn('[pericias] nenhum perfil bateu com "' + nomeOj + '"', lista)
        return null
    }
    return perfil.idOrgaoJulgador ?? perfil.idOrgaoJulgadorPje ?? perfil.id ?? null
}

// Aceita array puro ou envelopado (content / results / dados / resultado)
function pericias_listaDeEventos(resposta) {
    if (typeof resposta === 'string') {
        try { resposta = JSON.parse(resposta) } catch (e) { return [] }
    }
    if (Array.isArray(resposta)) return resposta
    let lista = resposta?.content ?? resposta?.results ?? resposta?.dados ?? resposta?.resultado
    return Array.isArray(lista) ? lista : []
}

function pericias_tipoDoEvento(evento) {
    return evento?.tipo ?? evento?.tipoEvento ?? evento?.descricaoTipo ?? evento?.descricao ?? ''
}

// Marca todos os dias do evento, já que um evento pode cobrir um período
function pericias_marcarEvento(evento) {
    if (PERICIAS_EVENTOS_IGNORADOS.includes(pericias_tipoDoEvento(evento))) return

    let inicio = pericias_isoDaApi(evento?.dataInicio ?? evento?.data ?? evento?.dataEvento)
    if (!inicio) return
    let fim = pericias_isoDaApi(evento?.dataFim ?? evento?.dataFinal) || inicio

    let d      = pericias_lerDataISO(inicio)
    let limite = pericias_lerDataISO(fim)
    if (!d || !limite || limite < d) return

    let guarda = 0
    while (d <= limite && guarda++ < 400) {
        _pericias_feriadosAPI.add(pericias_iso(d))
        d.setDate(d.getDate() + 1)
    }
}

// Aceita "2026-11-02", "2026-11-02T00:00:00-03:00" e "02/11/2026"
function pericias_isoDaApi(valor) {
    if (!valor) return null
    let texto = String(valor)
    let iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
    let br = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
    if (br) return `${br[3]}-${br[2]}-${br[1]}`
    return null
}


function audFuncoes(){
    menuPericiasAud()
}
// ── assistente-prazos-periciais.js ───────────────────────────────────────
//
// Calculadora de Prazos Periciais — Secretaria Conjunta de Bauru
// Desenvolvida originalmente por Oto H. P. de Campos
//
// Para usar como assistente no compilador, registre em compiladorDeAssistentes():
//
//   {
//       id: 'prazos-periciais',
//       titulo: 'Prazos Periciais',
//       funcao: 'assistentePrazosPericiais',
//       janelas: [JANELA.meuPainel, JANELA.painelGlobal, ...],
//   }
//
// e adicione 'assistentePrazosPericiais' ao mapaFuncoes.
// ─────────────────────────────────────────────────────────────────────────





// ── Feriados (2025/2026) ──────────────────────────────────────────────────
const PRAZOS_PERICIAIS_FERIADOS = [
    '2025-01-01', '2025-04-18', '2025-04-21', '2025-05-01',
    '2025-06-19', '2025-09-07', '2025-10-12', '2025-11-02',
    '2025-11-15', '2025-11-20', '2025-12-08', '2025-12-25',
    '2026-01-01', '2026-04-03', '2026-04-21', '2026-05-01',
    '2026-06-04', '2026-09-07', '2026-10-12', '2026-11-02',
    '2026-11-15', '2026-11-20', '2026-12-08', '2026-12-25',
]

function _pp_eDiaUtil(data) {
    const dia = data.getDay()
    if (dia === 0 || dia === 6) return false
    const iso = data.toISOString().split('T')[0]
    return !PRAZOS_PERICIAIS_FERIADOS.includes(iso)
}

function _pp_somarDiasUteis(dataBase, dias) {
    let d = new Date(dataBase)
    let cont = 0
    while (cont < dias) {
        d.setDate(d.getDate() + 1)
        if (_pp_eDiaUtil(d)) cont++
    }
    return d
}

function _pp_fmt(d) {
    return String(d.getDate()).padStart(2, '0') + '/' +
           String(d.getMonth() + 1).padStart(2, '0') + '/' +
           d.getFullYear()
}

// ── Textos gerados por tipo de perícia ───────────────────────────────────

function _pp_textoEngenharia(d7, d10, d30, d35, d40) {
    return `O perito deverá informar nos autos os dados, hora e local da realização de seus atos (diligências) até o dia ${d7} e ficará ciente da sua nomeação e do prazo acima assinalado através da inclusão deste processo no seu painel de trabalho no sistema do PJ-e.

As partes informam que a perícia técnica de insalubridade/periculosidade deverá ser realizada no endereço da reclamada, constante da petição inicial.

Caberá aos advogados das partes dar ciência a seus clientes e assistentes técnicos, bem como acessar os autos no PJe até o dia ${d10} para tomar ciência dos dados, hora e local da diligência, independentemente de intimação.

No mesmo prazo poderá o autor apresentar sua réplica e poderão as partes apresentar quesitos e indicar assistente técnico.

Para realização do trabalho pericial e entrega do laudo técnico, conceda-se ao perito prazo até ${d30}.

As partes poderão se manifestar sobre o laudo pericial até ${d35}.

Para a resposta às impugnações das partes, se forem específicas, fundamentadas e acompanhadas de questões suplementares, o perito apresentará seus esclarecimentos até ${d40}.

As partes poderão comparecer à perícia e prestar ao perito todas as informações sobre as atividades realizadas e os EPIs utilizados, sob pena de preclusão. A parte que não compareceu à inspeção será sujeita às declarações da parte que se fizerem presentes. A ausência de uma das partes não obsta à realização dos trabalhos do perito.

Fica autorizado o acompanhamento da perícia pelo(a) reclamante e seu(sua) patrono(a), sendo facultativa a sua presença, nos termos do disposto no art. 818 da CLT. Autoriza-se o acompanhamento da perícia por assistente técnico desde que engenheiro ou técnico em segurança do trabalho.

Não serão admitidas novas impugnações à(ao)(s) Sr(a)(s). Perito(a)(s) quanto à(s) sua(s) manifestação(ões) nem serão deferidas dilações de prazos, salvo motivo justo e comprovado.

Todos os prazos são preclusivos e transcorrerão independentemente de notificação.`
}

function _pp_textoMedica(d7, d10, d30, d35, d40) {
    return `O perito deverá informar nos autos os dados, hora e local da realização de seus atos (diligências) até o dia ${d7} e ficará ciente da sua nomeação e do prazo acima assinalado através da inclusão deste processo no seu painel de trabalho no sistema do PJ-e.

A perícia médica será realizada em local a ser indicado pelo senhor perito.

Caberá aos advogados das partes dar ciência a seus clientes e assistentes técnicos, bem como acessar os autos no PJe até o dia ${d10} para tomar ciência dos dados, hora e local da diligência, independentemente de intimação.

No mesmo prazo poderá o autor apresentar sua réplica e poderão as partes apresentar quesitos e indicar assistente técnico.

Para realização do trabalho pericial e entrega do laudo técnico, conceda-se ao perito médico prazo até ${d30}.

As partes poderão se manifestar sobre o laudo pericial até ${d35}.

Para a resposta às impugnações das partes, se forem específicas, fundamentadas e acompanhadas de questões suplementares, o perito apresentará seus esclarecimentos até ${d40}.

A ausência à perícia médica deverá ser justificada no prazo de 24 horas, sob pena de preclusão da produção da prova pericial médica.

A cópia desta Ata de Audiência, assinada eletronicamente, terá valor de alvará para retirada pelo(a) reclamante, de prontuários/documentos médicos em locais onde a parte autora tenha sido atendida.

Providencie a Secretaria a juntada dos seguintes documentos, em sigilo, com visibilidade às partes do processo, no prazo de 20 (vinte) dias, os quais deverão ser obtidos por meio do convênio PREVJUD, firmado com o INSS:

I - FAP – Fator Acidentário de Prevenção referente à empresa empregadora;
II - Códigos de afastamento referentes aos benefícios previdenciários concedidos ao autor (início do benefício, alta médica, natureza do benefício);
III - laudos periciais produzidos;
IV - CATs expedidas durante todo o contrato de trabalho do reclamante;
V - Cópia integral do procedimento administrativo de concessão de benefícios previdenciários ao reclamante.

Não serão admitidas novas impugnações à(ao)(s) Sr(a)(s). Perito(a)(s) quanto à(s) sua(s) manifestação(ões) nem serão deferidas dilações de prazos, salvo motivo justo e comprovado.

Todos os prazos são preclusivos e transcorrerão independentemente de notificação.`
}

function _pp_textoDupla(d7, d10, d30, d35, d40) {
    return `Os peritos deverão informar nos autos os dados, hora e local da realização de seus atos (diligências) até o dia ${d7} e ficarão cientes de suas nomeações e do prazo acima assinalado através da inclusão deste processo em seus painéis de trabalho no sistema do PJ-e.

Caberá aos advogados das partes dar ciência a seus clientes e assistentes técnicos, bem como acessar os autos no PJe até o dia ${d10} para tomar ciência dos dados, hora e local das diligências, independentemente de intimação.

No mesmo prazo poderá o autor apresentar sua réplica e poderão as partes apresentar quesitos e indicar assistentes técnicos para ambas as perícias.

Para realização dos trabalhos periciais e entrega dos laudos técnicos, conceda-se aos peritos prazo até ${d30}.

As partes poderão se manifestar sobre os laudos periciais até ${d35}.

Para a resposta às impugnações das partes, se forem específicas, fundamentadas e acompanhadas de questões suplementares, os peritos apresentarão seus esclarecimentos até ${d40}.

DISPOSIÇÕES DA PERÍCIA TÉCNICA DE INSALUBRIDADE/PERICULOSIDADE:
As partes informam que a perícia técnica deverá ser realizada no endereço da reclamada, constante da petição inicial. As partes poderão comparecer à perícia técnica e prestar ao perito todas as informações sobre as atividades realizadas e os EPIs utilizados, sob pena de preclusão. Fica autorizado o acompanhamento da perícia pelo(a) reclamante e seu(sua) patrono(a), sendo facultativa a sua presença, nos termos do disposto no art. 818 da CLT. Autoriza-se o acompanhamento da perícia por assistente técnico desde que engenheiro ou técnico em segurança do trabalho.

DISPOSIÇÕES DA PERÍCIA MÉDICA:
A perícia médica será realizada em local a ser indicado pelo senhor perito. A ausência à perícia médica deverá ser justificada no prazo de 24 horas, sob pena de preclusão da produção da prova pericial médica. A cópia desta Ata de Audiência, assinada eletronicamente, terá valor de alvará para retirada pelo(a) reclamante, de prontuários/documentos médicos em locais onde a parte autora tenha sido atendida.

Providencie a Secretaria a juntada dos seguintes documentos, em sigilo, com visibilidade às partes do processo, no prazo de 20 (vinte) dias, os quais deverão ser obtidos por meio do convênio PREVJUD, firmado com o INSS: I - FAP; II - Códigos de afastamento; III - laudos periciais produzidos; IV - CATs expedidas durante todo o contrato de trabalho do reclamante; V - Cópia integral do procedimento administrativo de concessão de benefícios previdenciários ao reclamante.

Não serão admitidas novas impugnações aos Srs. Peritos quanto às suas manifestações nem serão deferidas dilações de prazos, salvo motivo justo e comprovado.

Todos os prazos são preclusivos e transcorrerão independentemente de notificação.`
}

// ── Widget principal ──────────────────────────────────────────────────────

async function assistentePrazosPericiais(ancestral) {
    const ID = 'rota_prazosPericiais'
    document.querySelector('#' + ID)?.remove()

    const div = await criaDiv({ id: ID, ancestral })

    // ── Subtítulo ────────────────────────────────────────────────
    criaSubTitulo({
        id: ID + '_sub',
        texto: 'Calcula prazos em dias úteis a partir da data da audiência.',
        ancestral: ID,
    })

    // ── Data inicial ─────────────────────────────────────────────
    const divData = criaDiv({ id: ID + '_divData', ancestral: ID })

    const labelData = _ui_el('div', {
        fontSize: '11px',
        color: UI_CORES.suave,
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        marginBottom: '2px',
        marginLeft: '4px',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
    })
    labelData.textContent = 'Data inicial (audiência/intimação)'
    divData.appendChild(labelData)

    const inputData = _ui_el('input', {
        type: 'date',
        width: '100%',
        border: '1px solid ' + UI_CORES.borda,
        borderRadius: '6px',
        padding: '7px 10px',
        fontSize: '12px',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        color: UI_CORES.texto,
        background: UI_CORES.branco,
        outline: 'none',
        boxSizing: 'border-box',
        marginLeft: '4px',
    })
    inputData.id = ID + '_inputData'
    inputData.type = 'date'
    // Data de hoje como padrão
    const hoje = new Date()
    const anoH = hoje.getFullYear()
    const mesH = String(hoje.getMonth() + 1).padStart(2, '0')
    const diaH = String(hoje.getDate()).padStart(2, '0')
    inputData.value = `${anoH}-${mesH}-${diaH}`
    divData.appendChild(inputData)

    // ── Prazos configuráveis ─────────────────────────────────────
    criaSubTitulo({
        id: ID + '_subPrazos',
        texto: 'Prazos em dias úteis',
        ancestral: ID,
    })

    const configPrazos = [
        { id: 'p1', label: '1. Agendar perícia', valor: 7 },
        { id: 'p2', label: '2. Réplica / Quesitos', valor: 10 },
        { id: 'p3', label: '3. Apresentar laudo', valor: 30 },
        { id: 'p4', label: '4. Manifestar laudo', valor: 35 },
        { id: 'p5', label: '5. Esclarecimentos', valor: 40 },
    ]

    const grade = criaGrade({
        id: ID + '_gradePrazos',
        ancestral: ID,
        numeroColunas: 2,
    })
    grade.style.marginLeft = '4px'
    grade.style.marginRight = '4px'

    for (const cfg of configPrazos) {
        const celula = _ui_el('div', {
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
        })

        const lbl = _ui_el('div', {
            fontSize: '10px',
            color: UI_CORES.suave,
            fontFamily: "'Segoe UI', system-ui, sans-serif",
        })
        lbl.textContent = cfg.label

        const inp = _ui_el('input', {
            border: '1px solid ' + UI_CORES.borda,
            borderRadius: '4px',
            padding: '5px 6px',
            fontSize: '12px',
            fontFamily: "'Segoe UI', system-ui, sans-serif",
            color: UI_CORES.texto,
            background: UI_CORES.branco,
            outline: 'none',
            width: '100%',
            boxSizing: 'border-box',
        })
        inp.id = ID + '_' + cfg.id
        inp.type = 'number'
        inp.min = '1'
        inp.value = cfg.valor
        inp.addEventListener('change', _pp_atualizar)

        celula.appendChild(lbl)
        celula.appendChild(inp)
        grade.appendChild(celula)
    }

    // ── Abas de tipo de perícia ───────────────────────────────────
    criaSubTitulo({
        id: ID + '_subTipo',
        texto: 'Tipo de perícia',
        ancestral: ID,
    })

    const tipos = [
        { key: 'engenharia', label: 'Técnica (Insalubridade)' },
        { key: 'medica',     label: 'Médica' },
        { key: 'dupla',      label: 'Cumulativa (Téc. + Med.)' },
    ]

    const gradeAbas = criaGrade({
        id: ID + '_gradeAbas',
        ancestral: ID,
        numeroColunas: 1,
    })

    // Estado da aba selecionada
    let abaAtiva = 'engenharia'

    for (const t of tipos) {
        const btn = _ui_el('button', {
            ..._ui_estiloBotao(UI_CORES.fundo, '#ececec', UI_CORES.texto),
            border: '1px solid ' + UI_CORES.borda,
            width: 'auto',
            textAlign: 'left',
            padding: '6px 10px',
        })
        btn.id = ID + '_aba_' + t.key
        btn.textContent = t.label
        btn.addEventListener('click', () => _pp_selecionarAba(t.key))
        gradeAbas.appendChild(btn)
    }

    // ── Área de prévia do texto ───────────────────────────────────
    const divPrevia = _ui_el('div', {
        border: '1px solid ' + UI_CORES.borda,
        borderRadius: '6px',
        padding: '8px 10px',
        fontSize: '11px',
        lineHeight: '1.55',
        color: UI_CORES.texto,
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        whiteSpace: 'pre-wrap',
        maxHeight: '220px',
        overflowY: 'auto',
        marginLeft: '4px',
        marginRight: '4px',
        background: UI_CORES.fundo,
    })
    divPrevia.id = ID + '_previa'
    document.getElementById(ID)?.appendChild(divPrevia)

    // ── Botão Copiar ──────────────────────────────────────────────
    criaBotaoAzul({
        id: ID + '_btnCopiar',
        texto: '📋 Copiar texto',
        ancestral: ID,
        acao: () => _pp_copiar(),
    })

    // ── Helpers internos ──────────────────────────────────────────

    function _pp_selecionarAba(key) {
        abaAtiva = key
        for (const t of tipos) {
            const btn = document.getElementById(ID + '_aba_' + t.key)
            if (!btn) continue
            if (t.key === key) {
                btn.style.background = UI_CORES.azul
                btn.style.color = '#ffffff'
                btn.style.borderColor = UI_CORES.azul
            } else {
                btn.style.background = UI_CORES.fundo
                btn.style.color = UI_CORES.texto
                btn.style.borderColor = UI_CORES.borda
            }
        }
        _pp_atualizar()
    }

    function _pp_calcularDatas() {
        const raw = document.getElementById(ID + '_inputData')?.value
        if (!raw) return null
        const [y, m, d] = raw.split('-')
        const base = new Date(y, m - 1, d)
        const v = (idCfg) => parseInt(document.getElementById(ID + '_' + idCfg)?.value) || 0
        return {
            d7:  _pp_fmt(_pp_somarDiasUteis(base, v('p1'))),
            d10: _pp_fmt(_pp_somarDiasUteis(base, v('p2'))),
            d30: _pp_fmt(_pp_somarDiasUteis(base, v('p3'))),
            d35: _pp_fmt(_pp_somarDiasUteis(base, v('p4'))),
            d40: _pp_fmt(_pp_somarDiasUteis(base, v('p5'))),
        }
    }

    function _pp_atualizar() {
        const datas = _pp_calcularDatas()
        const el = document.getElementById(ID + '_previa')
        if (!el) return
        if (!datas) { el.textContent = 'Selecione uma data inicial.'; return }
        const { d7, d10, d30, d35, d40 } = datas
        let texto = ''
        if (abaAtiva === 'engenharia') texto = _pp_textoEngenharia(d7, d10, d30, d35, d40)
        else if (abaAtiva === 'medica')   texto = _pp_textoMedica(d7, d10, d30, d35, d40)
        else if (abaAtiva === 'dupla')    texto = _pp_textoDupla(d7, d10, d30, d35, d40)
        el.textContent = texto
    }

    async function _pp_copiar() {
        const el = document.getElementById(ID + '_previa')
        if (!el || !el.textContent.trim()) return
        try {
            await navigator.clipboard.writeText(el.textContent)
        } catch {
            // fallback para execCommand
            const ta = document.createElement('textarea')
            ta.value = el.textContent
            ta.style.position = 'fixed'
            ta.style.opacity = '0'
            document.body.appendChild(ta)
            ta.select()
            document.execCommand('copy')
            ta.remove()
        }
        const btn = document.getElementById(ID + '_btnCopiar')
        if (btn) {
            const orig = btn.textContent
            btn.textContent = '✅ Copiado!'
            setTimeout(() => { btn.textContent = orig }, 2000)
        }
    }

    // Listeners
    inputData.addEventListener('change', _pp_atualizar)

    // Estado inicial
    _pp_selecionarAba('engenharia')
}

// ── assistente-peritos.js ─────────────────────────────────────────────────
//
// Consulta de Peritos Judiciais — TRT 15ª Região (Secretaria de Bauru)
//
// Para usar como assistente no compilador, registre em compiladorDeAssistentes():
//
//   {
//       id: 'peritos',
//       titulo: 'Peritos',
//       funcao: 'assistentePeritos',
//       janelas: [JANELA.meuPainel, JANELA.painelGlobal, ...],
//   }
//
// e adicione 'assistentePeritos' ao mapaFuncoes.
// ─────────────────────────────────────────────────────────────────────────

const PERITOS_DATA = [
  {"nome": "EVERTON JOSÉ PALMA", "varas": ["Bauru1a", "Bauru2a", "Bauru3a", "Bauru4a", "Itápolis", "Jaú2a", "Lençóis1a", "Pederneiras", "Santa Cruz"], "especialidades": ["Insalubridade/Periculosidade"]},
  {"nome": "CHANG YUAN CHIANG", "varas": ["Bauru1a", "Bauru2a", "Bauru3a", "Jaú2a"], "especialidades": ["Insalubridade/Periculosidade"]},
  {"nome": "MATHEUS PUNTEL DE ALMEIDA", "varas": ["Bauru2a"], "especialidades": ["Insalubridade/Periculosidade"]},
  {"nome": "ROBERTO DE ANDRADE", "varas": ["Bauru1a", "Bauru2a"], "especialidades": ["Insalubridade/Periculosidade"]},
  {"nome": "RODRIGO FRANCESCHI", "varas": ["Bauru1a", "Botucatu", "Jaú1a", "Lençóis1a", "Lençóis2a"], "especialidades": ["Médica"]},
  {"nome": "ANA CRISTINA RADUAN RIBEIRO", "varas": ["Bauru2a", "Bauru3a"], "especialidades": ["Médica"]},
  {"nome": "ANTONIO BARBOSA NOBRE JUNIOR", "varas": ["Bauru2a", "Bauru3a"], "especialidades": ["Médica"]},
  {"nome": "NIVALDO PENTEADO BAUTZ", "varas": ["Bauru1a", "Bauru2a", "Bauru3a", "Bauru4a", "Jaú1a", "Jaú2a", "Lençóis1a", "Lençóis2a"], "especialidades": ["Insalubridade/Periculosidade"]},
  {"nome": "VICENTE PAULO COSTA GRIZZO", "varas": ["Bauru1a", "Bauru4a"], "especialidades": ["Insalubridade/Periculosidade"]},
  {"nome": "PAULO ROGERIO PICHELLI", "varas": ["Bauru1a", "Bauru2a", "Bauru4a"], "especialidades": ["Insalubridade/Periculosidade"]},
  {"nome": "SLEN EUGENIA NASCIMENTO", "varas": ["Bauru3a", "Bauru4a"], "especialidades": ["Insalubridade/Periculosidade"]},
  {"nome": "VALDIR APARECIDO DOMINGUES", "varas": ["Bauru4a"], "especialidades": ["Insalubridade/Periculosidade"]},
  {"nome": "JOYCE GIMENES BRANDÃO PÓPOLO", "varas": ["Avaré", "Bauru1a", "Bauru3a", "Bauru4a", "Jaú2a"], "especialidades": ["Médica"]},
  {"nome": "MARCELO BRESSAN ROCHA VIANNA", "varas": ["Bauru1a", "Bauru2a", "Bauru3a", "Bauru4a"], "especialidades": ["Médica"]},
  {"nome": "MARCELLO TEIXEIRA CASTIGLIA", "varas": ["Bauru4a", "Itápolis", "Jaú1a"], "especialidades": ["Médica"]},
  {"nome": "EDMILSON FERREIRA DE CARVALHO", "varas": ["Bauru2a", "Bauru3a", "Bauru4a"], "especialidades": ["Médica"]},
  {"nome": "GUSTAVO BERBEL FAIDIGA", "varas": ["Bauru1a", "Bauru3a", "Bauru4a", "Botucatu", "Itápolis", "Jaú2a", "Pederneiras", "Santa Cruz"], "especialidades": ["Médica"]},
  {"nome": "OSVALDO SÉRGIO ORTEGA", "varas": ["Bauru1a", "Bauru2a", "Bauru3a", "Bauru4a", "Jaú1a", "Jaú2a"], "especialidades": ["Médica"]},
  {"nome": "NEDER MOUSTAFA YAKTINE", "varas": ["Bauru3a", "Bauru4a", "Jaú2a", "Lençóis1a", "Lençóis2a"], "especialidades": ["Médica"]},
  {"nome": "THALLES PORFIRIO DUTRA", "varas": ["Bauru4a"], "especialidades": ["Ergonomia"]},
  {"nome": "DANIEL DA SILVA RUFINO", "varas": ["Marília2a"], "especialidades": ["Insalubridade/Periculosidade"]},
  {"nome": "Reinaldo Bordim Junior", "varas": ["Marília1a", "Marília2a"], "especialidades": ["Insalubridade/Periculosidade"]},
  {"nome": "Dennis Mychel de Castro", "varas": ["Marília2a"], "especialidades": ["Insalubridade/Periculosidade"]},
  {"nome": "Carlos Eduardo Mattioli", "varas": ["Botucatu", "Marília1a", "Marília2a"], "especialidades": ["Insalubridade/Periculosidade"]},
  {"nome": "DANIEL RIBEIRO PENTEADO", "varas": ["Lençóis1a", "Lençóis2a", "Marília1a", "Marília2a"], "especialidades": ["Insalubridade/Periculosidade"]},
  {"nome": "MARCELO LUIS SANTILLI", "varas": ["Marília2a"], "especialidades": ["Médica"]},
  {"nome": "CRISTIANO HAYOSHI CHOJI", "varas": ["Marília1a", "Marília2a"], "especialidades": ["Médica"]},
  {"nome": "MICHEL DE LARA LIMA", "varas": ["Marília1a", "Marília2a", "Santa Cruz"], "especialidades": ["Ergonomia"]},
  {"nome": "Fabiano Carvalho Duarte", "varas": ["Marília2a"], "especialidades": ["Grafotécnica"]},
  {"nome": "JOEL ZANARDO", "varas": ["Marília1a", "Marília2a"], "especialidades": ["Contábil"]},
  {"nome": "LUIZ ROBERTO BAPTISTELLA DE OLIVEIRA", "varas": ["Botucatu"], "especialidades": ["Insalubridade/Periculosidade"]},
  {"nome": "GREGORY FELIPE CABRAL TORINI", "varas": ["Avaré", "Botucatu", "Jaú1a", "Jaú2a", "Lençóis2a", "Ourinhos", "Pederneiras"], "especialidades": ["Insalubridade/Periculosidade"]},
  {"nome": "JOÃO HENRIQUE FERREIRA DIGNANI", "varas": ["Avaré", "Bauru2a", "Botucatu", "Jaú1a"], "especialidades": ["Insalubridade/Periculosidade"]},
  {"nome": "ADEMILSON ALVES CORREIA", "varas": ["Botucatu"], "especialidades": ["Insalubridade/Periculosidade"]},
  {"nome": "ROBERTO VAZ PIESCO", "varas": ["Botucatu", "Lençóis1a", "Lençóis2a"], "especialidades": ["Médica"]},
  {"nome": "LAERT JOSE BARUZZO SAMPAIO", "varas": ["Bauru4a"], "especialidades": ["Grafotécnica"]},
  {"nome": "RENAN SANTOS GAMA", "varas": ["Avaré", "Jaú1a"], "especialidades": ["Insalubridade/Periculosidade"]},
  {"nome": "EDIVÂNIO BARROS OLIVEIRA", "varas": ["Avaré"], "especialidades": ["Insalubridade/Periculosidade"]},
  {"nome": "CARLOS EDUARDO POLASTRO MENDES FERNANDES", "varas": ["Avaré"], "especialidades": ["Insalubridade/Periculosidade"]},
  {"nome": "ANA CAROLINE ALVES FERNANDES POÇARLI", "varas": ["Avaré"], "especialidades": ["Médica"]},
  {"nome": "José Augusto Rodrigues Massabki", "varas": ["Bauru3a"], "especialidades": ["Insalubridade/Periculosidade"]},
  {"nome": "Murilo Bertocco Meirelles", "varas": ["Marília1a", "Marília2a"], "especialidades": ["Médica"]},
  {"nome": "Roberta Oliveira Lança", "varas": ["Bauru1a"], "especialidades": ["Insalubridade/Periculosidade"]},
  {"nome": "JOSE BRAULIO ROSA ARRUDA", "varas": ["Ourinhos"], "especialidades": ["Médica"]},
  {"nome": "MICHELLE DORNFELD ARRUDA", "varas": ["Ourinhos"], "especialidades": ["Insalubridade/Periculosidade"]},
  {"nome": "MARCELO APARECIDO CIARAMELLO", "varas": ["Ourinhos"], "especialidades": ["Insalubridade/Periculosidade"]},
  {"nome": "GERALDO NOBILE", "varas": ["Santa Cruz"], "especialidades": ["Insalubridade/Periculosidade"]},
  {"nome": "TALITA DA SILVEIRA CAMPOS TEIXEIRA", "varas": ["Bauru3a", "Bauru4a"], "especialidades": ["Ergonomia"]},
  {"nome": "FÚLVIO JUNQUEIRA", "varas": ["Jaú1a", "Lençóis2a"], "especialidades": ["Grafotécnica", "Insalubridade/Periculosidade"]},
  {"nome": "GIL MONTEIRO NOVO", "varas": ["Lençóis2a"], "especialidades": ["Insalubridade/Periculosidade"]},
  {"nome": "CARLOS AUGUSTO ANGELICI", "varas": ["Lençóis2a"], "especialidades": ["Insalubridade/Periculosidade"]},
  {"nome": "MARCOS RUBINO", "varas": ["Jaú2a", "Lençóis2a"], "especialidades": ["Insalubridade/Periculosidade"]},
  {"nome": "LEONARDO MARTINS PEREIRA", "varas": ["Bauru1a", "Lençóis2a"], "especialidades": ["Insalubridade/Periculosidade"]},
  {"nome": "NIVALDO CHIQUIERI PAES", "varas": ["Bauru1a", "Lençóis2a"], "especialidades": ["Insalubridade/Periculosidade"]},
  {"nome": "NELSON ALOISI FASSONI", "varas": ["Bauru2a", "Lençóis2a"], "especialidades": ["Insalubridade/Periculosidade"]},
  {"nome": "ORLANDO CREDIDIO FILHO", "varas": ["Lençóis2a"], "especialidades": ["Médica"]},
  {"nome": "Altair Aparecido Angelo de Amorin (Tem Aparelho de Vibração) (Exceto Sams e Santa Casa)", "varas": ["Itápolis"], "especialidades": ["Insalubridade/Periculosidade"]},
  {"nome": "Luiz Pedro Basílio", "varas": ["Itápolis"], "especialidades": ["Insalubridade/Periculosidade"]},
  {"nome": "Eduardo Borges Soares", "varas": ["Itápolis"], "especialidades": ["Insalubridade/Periculosidade"]},
  {"nome": "Cristian Jober Siqueira (tem aparelho de vibração)", "varas": ["Itápolis"], "especialidades": ["Insalubridade/Periculosidade"]},
  {"nome": "Monise Ellen Barelli", "varas": ["Itápolis"], "especialidades": ["Insalubridade/Periculosidade"]},
  {"nome": "RENATA CRISTINA GONÇALVES DE FREITAS", "varas": ["Itápolis"], "especialidades": ["Ergonomia"]},
  {"nome": "ROBERTO JORGE", "varas": ["Itápolis"], "especialidades": ["Médica"]},
  {"nome": "Manuel Castro Lahoz", "varas": ["Itápolis"], "especialidades": ["Médica"]},
  {"nome": "HUGO YUUKI WAKIYAMA", "varas": ["Itápolis"], "especialidades": ["Grafotécnica"]},
  {"nome": "Antonio Carlos Pastori", "varas": ["Itápolis"], "especialidades": ["Contábil"]},
  {"nome": "ADRIANA BINATTO SCHAER", "varas": ["Garça"], "especialidades": ["Insalubridade/Periculosidade"]},
  {"nome": "PEDRO ROBERTO DE ANDRADE JUNIOR", "varas": ["Garça"], "especialidades": ["Insalubridade/Periculosidade"]},
  {"nome": "AHMAD ABDUL LATIF HAMZE", "varas": ["Garça"], "especialidades": ["Médica"]},
  {"nome": "Wong Kum Yuen", "varas": ["Itápolis"], "especialidades": ["Médica"]},
  {"nome": "Luiz Moreschi Neto", "varas": ["Jaú1a", "Jaú2a"], "especialidades": ["Médica"]},
  {"nome": "Sergio Luis Ribeiro Canuto", "varas": ["Jaú2a", "Lençóis1a"], "especialidades": ["Médica"]},
  {"nome": "JOSE ROBERTO ROCHA", "varas": ["Jaú1a"], "especialidades": ["Ergonomia", "Insalubridade/Periculosidade"]},
  {"nome": "LUIZ AUGUSTO SAMPAIO GONZAGA FILHO", "varas": ["Jaú2a"], "especialidades": ["Médica"]},
  {"nome": "Daniel Humberto de Freitas", "varas": ["Jaú2a"], "especialidades": ["Insalubridade/Periculosidade"]},
  {"nome": "Jameson Wagner Battochio", "varas": ["Jaú2a"], "especialidades": ["Insalubridade/Periculosidade"]},
  {"nome": "Luis Ricardo Spirito", "varas": ["Jaú2a"], "especialidades": ["Insalubridade/Periculosidade"]},
  {"nome": "Renato José Miranda Braga", "varas": ["Jaú1a", "Jaú2a"], "especialidades": ["Insalubridade/Periculosidade"]},
  {"nome": "Thiago Ribeiro Ramalho Rosa", "varas": ["Jaú2a"], "especialidades": ["Insalubridade/Periculosidade"]},
  {"nome": "Vinicius Vechi", "varas": ["Jaú2a"], "especialidades": ["Insalubridade/Periculosidade"]},
  {"nome": "Samuel de Oliveira Raia", "varas": ["Jaú2a"], "especialidades": ["Insalubridade/Periculosidade"]},
  {"nome": "Fabio Andre Bernardo", "varas": ["Jaú1a", "Jaú2a"], "especialidades": ["Grafotécnica"]},
  {"nome": "Carlos Eduardo Feijó", "varas": ["Jaú2a"], "especialidades": ["Contábil"]},
  {"nome": "Erica Cristina Garbin Pizzinato", "varas": ["Jaú2a"], "especialidades": ["Contábil"]},
  {"nome": "José Luiz Marconi", "varas": ["Jaú2a"], "especialidades": ["Contábil"]},
  {"nome": "MARCELO ENRICO SAMPAR PALLONE", "varas": ["Jaú2a"], "especialidades": ["Contábil"]},
  {"nome": "José Renato Baptista", "varas": ["Jaú2a"], "especialidades": ["Contábil"]},
  {"nome": "Raquel Alleoni Tararam", "varas": ["Jaú2a"], "especialidades": ["Ergonomia"]},
  {"nome": "LESSANDRA DE OLIVEIRA BROCCA CARNEIRO", "varas": ["Jaú2a"], "especialidades": ["Ergonomia"]},
  {"nome": "Ana Luiza Marchi Spoldario", "varas": ["Jaú2a"], "especialidades": ["Ergonomia"]},
  {"nome": "José Alves Neto", "varas": ["Jaú2a"], "especialidades": ["Intérprete de Linguas"]},
  {"nome": "Mirna Schneider Braziolli", "varas": ["Jaú2a"], "especialidades": ["Intérprete de Linguas"]},
  {"nome": "Mila Refundini Santiago Denadai", "varas": ["Jaú2a"], "especialidades": ["Fonoaudiologia"]},
  {"nome": "Marco Aurélio Rabelo de Paula", "varas": ["Bauru1a", "Bauru2a", "Bauru3a"], "especialidades": ["Grafotécnica"]},
  {"nome": "MAURICIO PIMENTEL BERGAMASCHI", "varas": ["Bauru1a", "Bauru2a", "Bauru3a"], "especialidades": ["Grafotécnica"]},
  {"nome": "Tiago Ferreira Isabel", "varas": ["Jaú1a"], "especialidades": ["Insalubridade/Periculosidade"]},
  {"nome": "EDGAR SALLUM BULL", "varas": ["Jaú1a"], "especialidades": ["Insalubridade/Periculosidade"]},
  {"nome": "MARILIA SALLUM BULL", "varas": ["Jaú1a"], "especialidades": ["Médica"]},
  {"nome": "JOAO CARLOS VICHETI", "varas": ["Marília2a"], "especialidades": ["Ergonomia"]},
  {"nome": "JOSÉ CARLOS MARTINI", "varas": ["Jaú1a"], "especialidades": ["Insalubridade/Periculosidade"]},
  {"nome": "Miriam Garcia Cirlinas Visin", "varas": ["Marília2a"], "especialidades": ["Insalubridade/Periculosidade"]},
  {"nome": "VITOR JARDIM GIARETA CONTI", "varas": ["Avaré"], "especialidades": ["Insalubridade/Periculosidade"]},
]

async function assistentePeritos(ancestral) {
    const ID = 'rota_peritos'
    document.querySelector('#' + ID)?.remove()

    await criaDiv({ id: ID, ancestral })

    // ── Subtítulo ────────────────────────────────────────────────
    criaSubTitulo({
        id: ID + '_sub',
        texto: 'Busca por nome, vara ou especialidade.',
        ancestral: ID,
    })

    // ── Campo de busca por nome ───────────────────────────────────
    const inputNome = criaInput({
        id: ID + '_inputNome',
        ancestral: ID,
        placeholder: 'Buscar por nome...',
    })
    inputNome.addEventListener('input', _pe_renderizar)

    // ── Filtro de vara ────────────────────────────────────────────
    // Coleta todas as varas únicas e ordena
    const todasVaras = [...new Set(PERITOS_DATA.flatMap(p => p.varas))].sort()
    const opcoesVaras = [
        { valor: '', texto: 'Todas as varas' },
        ...todasVaras.map(v => ({ valor: v, texto: v })),
    ]
    const menuVara = criaMenuSuspenso({
        id: ID + '_menuVara',
        opcoes: opcoesVaras,
        valorInicial: '',
        ancestral: ID,
        cor: 'azul',
        acao: () => _pe_renderizar(),
    })

    // ── Filtro de especialidade ───────────────────────────────────
    const todasEsps = [...new Set(PERITOS_DATA.flatMap(p => p.especialidades))].sort()
    const opcoesEsps = [
        { valor: '', texto: 'Todas as especialidades' },
        ...todasEsps.map(e => ({ valor: e, texto: e })),
    ]
    const menuEsp = criaMenuSuspenso({
        id: ID + '_menuEsp',
        opcoes: opcoesEsps,
        valorInicial: '',
        ancestral: ID,
        cor: 'azul',
        acao: () => _pe_renderizar(),
    })

    // ── Contador de resultados ────────────────────────────────────
    const divStats = _ui_el('div', {
        fontSize: '11px',
        color: UI_CORES.suave,
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        marginLeft: '4px',
        marginBottom: '2px',
    })
    divStats.id = ID + '_stats'
    document.getElementById(ID)?.appendChild(divStats)

    // ── Tabela de resultados ──────────────────────────────────────
    criaTabela({
        id: ID + '_tabela',
        ancestral: ID,
        idDasColunas: ['col-nome', 'col-esp', 'col-varas'],
        colunas: ['Perito', 'Especialidade', 'Varas'],
    })

    // ── Renderização ──────────────────────────────────────────────

    function _pe_renderizar() {
        const busca     = document.getElementById(ID + '_inputNome')?.value?.toLowerCase()?.trim() || ''
        const varaFiltro = menuVara.value || ''
        const espFiltro  = menuEsp.value  || ''

        const filtrados = PERITOS_DATA.filter(p => {
            const matchNome = p.nome.toLowerCase().includes(busca)
            const matchVara = !varaFiltro || p.varas.includes(varaFiltro)
            const matchEsp  = !espFiltro  || p.especialidades.includes(espFiltro)
            return matchNome && matchVara && matchEsp
        })

        // Atualiza contador
        const stats = document.getElementById(ID + '_stats')
        if (stats) stats.textContent = `${filtrados.length} de ${PERITOS_DATA.length} peritos`

        // Limpa o tbody e repopula
        const tbody = document.getElementById(ID + '_tabela-corpo')
        if (!tbody) return
        tbody.innerHTML = ''

        if (!filtrados.length) {
            const tr = document.createElement('tr')
            const td = _ui_el('td', {
                padding: '10px',
                textAlign: 'center',
                color: UI_CORES.suave,
                fontSize: '11px',
                fontFamily: "'Segoe UI', system-ui, sans-serif",
            })
            td.colSpan = 3
            td.textContent = 'Nenhum perito encontrado.'
            tr.appendChild(td)
            tbody.appendChild(tr)
            return
        }

        const idx = tbody.children.length
        filtrados.forEach((p, i) => {
            const tr = document.createElement('tr')
            tr.style.background = i % 2 === 0 ? UI_CORES.branco : UI_CORES.fundo

            // Col nome
            const tdNome = _ui_el('td', {
                padding: '6px 8px',
                borderTop: '1px solid ' + UI_CORES.borda,
                fontSize: '11px',
                fontFamily: "'Segoe UI', system-ui, sans-serif",
                color: UI_CORES.texto,
                fontWeight: '600',
                verticalAlign: 'top',
            })
            tdNome.textContent = p.nome
            tr.appendChild(tdNome)

            // Col especialidades — plaquinhas
            const tdEsp = _ui_el('td', {
                padding: '6px 8px',
                borderTop: '1px solid ' + UI_CORES.borda,
                borderLeft: '1px solid ' + UI_CORES.borda,
                fontSize: '11px',
                verticalAlign: 'top',
            })
            p.especialidades.forEach(e => {
                const tag = _ui_el('span', {
                    display: 'inline-block',
                    background: '#ebf8ff',
                    color: '#2b6cb0',
                    border: '1px solid #bee3f8',
                    borderRadius: '3px',
                    padding: '1px 5px',
                    fontSize: '10px',
                    fontFamily: "'Segoe UI', system-ui, sans-serif",
                    fontWeight: '600',
                    marginRight: '3px',
                    marginBottom: '3px',
                    whiteSpace: 'nowrap',
                })
                tag.textContent = e
                tdEsp.appendChild(tag)
            })
            tr.appendChild(tdEsp)

            // Col varas — plaquinhas
            const tdVaras = _ui_el('td', {
                padding: '6px 8px',
                borderTop: '1px solid ' + UI_CORES.borda,
                borderLeft: '1px solid ' + UI_CORES.borda,
                fontSize: '11px',
                verticalAlign: 'top',
            })
            p.varas.forEach(v => {
                const tag = _ui_el('span', {
                    display: 'inline-block',
                    background: '#f0fff4',
                    color: '#276749',
                    border: '1px solid #c6f6d5',
                    borderRadius: '3px',
                    padding: '1px 5px',
                    fontSize: '10px',
                    fontFamily: "'Segoe UI', system-ui, sans-serif",
                    fontWeight: '600',
                    marginRight: '3px',
                    marginBottom: '3px',
                    whiteSpace: 'nowrap',
                })
                tag.textContent = v
                tdVaras.appendChild(tag)
            })
            tr.appendChild(tdVaras)

            tbody.appendChild(tr)
        })
    }

    // Render inicial
    _pe_renderizar()
}
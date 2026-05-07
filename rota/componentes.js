// ============================================================
// componentes.js
// Fábrica de elementos visuais do painel assistente.
//
// Paleta via ROTA_CORES (configuracao.js):
//   azul, azulClaro, laranja, laranjaEsc
//   branco, fundo, borda, texto, textoSuave
//   infoBg, infoBorda, infoTexto
// ============================================================


// ── Utilitários internos ──────────────────────────────────────

function _comp_el(tag, estilos = {}) {
    const el = document.createElement(tag)
    Object.assign(el.style, estilos)
    return el
}

function _comp_cor(nome) {
    return ROTA_CORES[nome] || ''
}


// ── BLOCO TEMÁTICO ────────────────────────────────────────────
//
// Estrutura principal do painel: checkbox + título + corpo.
//
// Retorna { el, corpo, check }
//   el    → elemento raiz (inserir no painel)
//   corpo → div interna onde se inserem os sub-componentes
//   check → o checkbox do bloco (para manipulação externa)

function criarBloco({ titulo = '', iniciarMarcado = false } = {}) {

    const el = _comp_el('div', {
        background:   _comp_cor('branco'),
        border:       `1px solid ${_comp_cor('borda')}`,
        borderRadius: '6px',
        overflow:     'hidden',
        marginBottom: '8px',
    })

    const cabecalho = _comp_el('div', {
        display:      'flex',
        alignItems:   'center',
        gap:          '8px',
        padding:      '8px 12px',
        borderBottom: `1px solid ${_comp_cor('borda')}`,
        background:   _comp_cor('branco'),
    })

    const check = _comp_el('div', {
        width:          '16px',
        height:         '16px',
        borderRadius:   '3px',
        border:         `1.5px solid ${_comp_cor('borda')}`,
        flexShrink:     '0',
        cursor:         'pointer',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        transition:     'all 0.15s',
        background:     _comp_cor('branco'),
    })

    if (iniciarMarcado) _comp_marcarCheck(check)
    check.addEventListener('click', () =>
        check.dataset.marcado === '1' ? _comp_desmarcarCheck(check) : _comp_marcarCheck(check)
    )

    const tituloEl = _comp_el('span', {
        fontSize:   '12px',
        fontWeight: '500',
        color:      _comp_cor('texto'),
        flex:       '1',
    })
    tituloEl.textContent = titulo

    cabecalho.appendChild(check)
    cabecalho.appendChild(tituloEl)
    el.appendChild(cabecalho)

    const corpo = _comp_el('div', {
        padding:       '10px 12px',
        display:       'flex',
        flexDirection: 'column',
        gap:           '8px',
    })
    el.appendChild(corpo)

    return { el, corpo, check }
}

function _comp_marcarCheck(check) {
    check.dataset.marcado   = '1'
    check.style.background  = _comp_cor('laranja')
    check.style.borderColor = _comp_cor('laranja')
    check.innerHTML = `<svg width="8" height="6" viewBox="0 0 8 6" fill="none">
        <path d="M1 3L3 5L7 1" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`
}

function _comp_desmarcarCheck(check) {
    check.dataset.marcado   = '0'
    check.style.background  = _comp_cor('branco')
    check.style.borderColor = _comp_cor('borda')
    check.innerHTML         = ''
}


// ── INFO PJE ──────────────────────────────────────────────────
//
// Faixa azul clara com dados extraídos do PJE.
// Detalhe expansível no hover.

function criarInfoPJE({ rotulo = '', detalhe = '' } = {}) {

    const el = _comp_el('div', {
        background:   _comp_cor('infoBg'),
        borderLeft:   `3px solid ${_comp_cor('infoBorda')}`,
        borderRadius: '0 4px 4px 0',
        padding:      '6px 10px',
        fontSize:     '11px',
        color:        _comp_cor('infoTexto'),
        cursor:       detalhe ? 'pointer' : 'default',
    })

    const label = _comp_el('div', { fontWeight: '500', display: 'flex', alignItems: 'center', gap: '5px' })
    label.textContent = rotulo
    el.appendChild(label)

    if (detalhe) {
        const det = _comp_el('div', {
            marginTop:  '5px',
            color:      _comp_cor('azulClaro'),
            display:    'none',
            lineHeight: '1.5',
            whiteSpace: 'pre-line',
        })
        det.textContent = detalhe
        el.appendChild(det)
        el.addEventListener('mouseenter', () => det.style.display = 'block')
        el.addEventListener('mouseleave', () => det.style.display = 'none')
    }

    // Permite atualizar o detalhe em tempo real (dados chegam assíncronos)
    el.atualizarDetalhe = (novoDetalhe) => {
        const det = el.querySelector('div:last-child')
        if (det) det.textContent = novoDetalhe
    }

    return el
}


// ── INSTRUÇÃO RÁPIDA ──────────────────────────────────────────

function criarInstrucaoRapida({ texto = '' } = {}) {
    const el = _comp_el('p', {
        fontSize:   '12px',
        fontWeight: '500',
        color:      _comp_cor('texto'),
        lineHeight: '1.5',
        margin:     '0',
    })
    el.textContent = texto
    return el
}


// ── INSTRUÇÃO LONGA ───────────────────────────────────────────
//
// Oculta por padrão, com toggle ▼/▲.

function criarInstrucaoLonga({ texto = '' } = {}) {

    const wrapper = _comp_el('div', { display: 'flex', flexDirection: 'column', gap: '4px' })

    const toggle = _comp_el('button', {
        fontSize:   '11px',
        color:      _comp_cor('azulClaro'),
        cursor:     'pointer',
        background: 'none',
        border:     'none',
        padding:    '0',
        textAlign:  'left',
    })
    toggle.textContent = '▼ ver instrução completa'

    const conteudo = _comp_el('div', {
        fontSize:    '11px',
        color:       _comp_cor('textoSuave'),
        lineHeight:  '1.6',
        borderLeft:  `2px solid ${_comp_cor('borda')}`,
        paddingLeft: '8px',
        display:     'none',
        whiteSpace:  'pre-line',
    })
    conteudo.textContent = texto

    toggle.addEventListener('click', () => {
        const visivel          = conteudo.style.display !== 'none'
        conteudo.style.display = visivel ? 'none' : 'block'
        toggle.textContent     = visivel ? '▼ ver instrução completa' : '▲ ocultar'
    })

    wrapper.appendChild(toggle)
    wrapper.appendChild(conteudo)
    return wrapper
}


// ── DIVISOR ───────────────────────────────────────────────────

function criarDivisor() {
    const el = _comp_el('hr', {
        border:    'none',
        borderTop: `1px solid ${_comp_cor('borda')}`,
        margin:    '0',
    })
    return el
}


// ── TABELA DE AÇÕES ───────────────────────────────────────────
//
// Estrutura aprovada: botão | checkbox | ↓executar (rowspan)
//
// Parâmetro acoes[]:
//   label    {string}   texto do botão
//   acao     {string}   nome da função global a chamar
//   primario {boolean}  estilo laranja
//   submenu  {array}    [ { label, acao } ]

function criarTabelaAcoes(acoes = []) {

    if (!acoes.length) return document.createDocumentFragment()

    const tabela = _comp_el('table', {
        width:          '100%',
        borderCollapse: 'separate',
        borderSpacing:  '0 3px',
    })

    const tbody = document.createElement('tbody')
    tabela.appendChild(tbody)

    const uid = `ta${Date.now()}`

    acoes.forEach((acao, idx) => {

        const tr    = document.createElement('tr')
        const btnId = `${uid}-${idx}`

        // ── Célula: botão + submenu
        const tdAcao         = document.createElement('td')
        tdAcao.style.cssText = 'width:100%;padding:0;'

        const btn = _criarBotaoAcao(acao.label, acao.acao, acao.primario)
        btn.id    = btnId
        tdAcao.appendChild(btn)

        if (acao.submenu?.length) {
            tdAcao.appendChild(_criarSubmenuEl(acao.submenu))
        }

        // ── Célula: checkbox de execução
        const tdCheck         = document.createElement('td')
        tdCheck.style.cssText = `width:28px;padding:0 0 0 4px;vertical-align:top;padding-top:8px;cursor:pointer;`

        const chk = _criarExecCheckbox(true)
        tdCheck.appendChild(chk)

        tdCheck.addEventListener('click', () => {
            const ativo = chk.dataset.ativo !== '0'
            _setExecCheckbox(chk, !ativo)
            btn.style.opacity        = ativo ? '0.3' : '1'
            btn.style.textDecoration = ativo ? 'line-through' : 'none'
        })

        tr.appendChild(tdAcao)
        tr.appendChild(tdCheck)

        // ── Célula executar — só na primeira linha, rowspan cobre todas
        if (idx === 0) {
            const tdExec         = document.createElement('td')
            tdExec.setAttribute('rowspan', acoes.length)
            tdExec.style.cssText = 'width:32px;padding:0 0 0 4px;vertical-align:middle;'

            const cell = _criarCelulaExecutar(() => {
                tbody.querySelectorAll(`button[id^="${uid}"]`).forEach(b => {
                    if (b.style.opacity !== '0.3') b.click()
                })
            })

            tdExec.appendChild(cell)
            tr.appendChild(tdExec)
        }

        tbody.appendChild(tr)
    })

    return tabela
}

function _criarBotaoAcao(label = '', acao = '', primario = false) {
    const btn = _comp_el('button', {
        width:        '100%',
        padding:      '7px 10px',
        borderRadius: '4px',
        border:       `1px solid ${primario ? _comp_cor('laranja') : _comp_cor('borda')}`,
        background:   primario ? _comp_cor('laranja') : _comp_cor('branco'),
        fontSize:     '11px',
        color:        primario ? '#fff' : _comp_cor('texto'),
        fontWeight:   primario ? '500' : '400',
        cursor:       'pointer',
        textAlign:    'left',
        lineHeight:   '1.3',
        display:      'block',
        transition:   'background 0.15s',
    })
    btn.textContent = label

    btn.addEventListener('mouseenter', () =>
        btn.style.background = primario ? _comp_cor('laranjaEsc') : _comp_cor('fundo')
    )
    btn.addEventListener('mouseleave', () =>
        btn.style.background = primario ? _comp_cor('laranja') : _comp_cor('branco')
    )

    if (acao) btn.addEventListener('click', () => {
        if (typeof window[acao] === 'function') window[acao](btn)
    })

    return btn
}

function _criarSubmenuEl(itens = []) {
    const wrap = _comp_el('div', {
        marginTop:     '3px',
        marginLeft:    '12px',
        display:       'flex',
        flexDirection: 'column',
        gap:           '3px',
        borderLeft:    `2px solid ${_comp_cor('laranja')}`,
        paddingLeft:   '8px',
    })

    itens.forEach(({ label = '', acao = '' }) => {
        const btn = _comp_el('button', {
            padding:      '5px 10px',
            borderRadius: '4px',
            border:       `1px solid ${_comp_cor('borda')}`,
            background:   _comp_cor('fundo'),
            fontSize:     '11px',
            color:        _comp_cor('textoSuave'),
            cursor:       'pointer',
            textAlign:    'left',
            transition:   'background 0.15s',
            width:        '100%',
        })
        btn.textContent = label
        btn.addEventListener('mouseenter', () => {
            btn.style.color      = _comp_cor('texto')
            btn.style.background = _comp_cor('branco')
        })
        btn.addEventListener('mouseleave', () => {
            btn.style.color      = _comp_cor('textoSuave')
            btn.style.background = _comp_cor('fundo')
        })
        if (acao) btn.addEventListener('click', () => {
            if (typeof window[acao] === 'function') window[acao](btn)
        })
        wrap.appendChild(btn)
    })

    return wrap
}

function _criarExecCheckbox(ativo = true) {
    const el = _comp_el('div', {
        width:          '14px',
        height:         '14px',
        borderRadius:   '3px',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        transition:     'all 0.15s',
        flexShrink:     '0',
    })
    _setExecCheckbox(el, ativo)
    return el
}

function _setExecCheckbox(el, ativo) {
    el.dataset.ativo    = ativo ? '1' : '0'
    el.style.background = ativo ? _comp_cor('laranja') : _comp_cor('branco')
    el.style.border     = `1.5px solid ${ativo ? _comp_cor('laranja') : _comp_cor('borda')}`
    el.innerHTML        = ativo
        ? `<svg width="7" height="5" viewBox="0 0 7 5" fill="none">
             <path d="M1 2.5L2.8 4.2L6 1" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
           </svg>`
        : ''
}

function _criarCelulaExecutar(aoClicar) {
    const cell = _comp_el('div', {
        background:     _comp_cor('laranja'),
        borderRadius:   '4px',
        height:         '100%',
        minHeight:      '80px',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            '5px',
        cursor:         'pointer',
        padding:        '8px 0',
        transition:     'background 0.15s',
    })

    const texto = _comp_el('span', {
        fontSize:      '10px',
        fontWeight:    '500',
        color:         '#fff',
        writingMode:   'vertical-rl',
        transform:     'rotate(180deg)',
        letterSpacing: '1px',
        textTransform: 'uppercase',
    })
    texto.textContent = 'executar'

    const seta = _comp_el('span', { fontSize: '16px', color: '#fff', lineHeight: '1' })
    seta.textContent = '↓'

    cell.appendChild(texto)
    cell.appendChild(seta)

    cell.addEventListener('mouseenter', () => cell.style.background = _comp_cor('laranjaEsc'))
    cell.addEventListener('mouseleave', () => cell.style.background = _comp_cor('laranja'))
    cell.addEventListener('click', aoClicar)

    return cell
}


// ── SELETOR DE OPÇÃO ÚNICA ────────────────────────────────────
//
// Botões mutuamente exclusivos — tipo de audiência, despacho, etc.
//
// Uso:
//   const sel = criarSeletorOpcaoUnica({
//     opcoes: [
//       { label: 'Instrução e julgamento', valor: 'instrucao' },
//       { label: 'Conciliação',            valor: 'conciliacao' },
//     ],
//     aoSelecionar: (valor) => estado_atualizar({ tipoAudiencia: valor })
//   })
//   sel.obterValor()  → 'instrucao'

function criarSeletorOpcaoUnica({ opcoes = [], aoSelecionar, valorInicial } = {}) {

    const wrap = _comp_el('div', { display: 'flex', flexDirection: 'column', gap: '3px' })

    let selecionado = null

    opcoes.forEach(({ label = '', valor = '' }) => {
        const btn = _comp_el('button', {
            width:        '100%',
            padding:      '7px 10px',
            borderRadius: '4px',
            border:       `1px solid ${_comp_cor('borda')}`,
            background:   _comp_cor('branco'),
            fontSize:     '11px',
            color:        _comp_cor('texto'),
            cursor:       'pointer',
            textAlign:    'left',
            transition:   'all 0.15s',
        })
        btn.textContent   = label
        btn.dataset.valor = valor

        const selecionar = () => {
            wrap.querySelectorAll('button').forEach(b => {
                b.style.background  = _comp_cor('branco')
                b.style.borderColor = _comp_cor('borda')
                b.style.color       = _comp_cor('texto')
                b.style.fontWeight  = '400'
            })
            btn.style.background  = _comp_cor('laranja')
            btn.style.borderColor = _comp_cor('laranja')
            btn.style.color       = '#fff'
            btn.style.fontWeight  = '500'
            selecionado           = valor
            if (typeof aoSelecionar === 'function') aoSelecionar(valor)
        }

        btn.addEventListener('click', selecionar)
        if (valor === valorInicial) selecionar()
        wrap.appendChild(btn)
    })

    wrap.obterValor = () => selecionado
    return wrap
}


// ── INPUT COM CONFIRMAÇÃO ─────────────────────────────────────
//
// Campo de texto com botão ✓. Pressionar Enter também confirma.

function criarInput({ placeholder = '', label, aoConfirmar } = {}) {

    const wrap = _comp_el('div', { display: 'flex', flexDirection: 'column', gap: '4px' })

    if (label) {
        const lbl = _comp_el('span', {
            fontSize:   '11px',
            color:      _comp_cor('textoSuave'),
            fontWeight: '500',
        })
        lbl.textContent = label
        wrap.appendChild(lbl)
    }

    const linha = _comp_el('div', { display: 'flex', gap: '4px' })

    const input = document.createElement('input')
    Object.assign(input.style, {
        flex:         '1',
        padding:      '7px 10px',
        borderRadius: '4px',
        border:       `1px solid ${_comp_cor('borda')}`,
        background:   _comp_cor('branco'),
        fontSize:     '11px',
        color:        _comp_cor('texto'),
        outline:      'none',
    })
    input.placeholder = placeholder
    input.addEventListener('focus', () => input.style.borderColor = _comp_cor('laranja'))
    input.addEventListener('blur',  () => input.style.borderColor = _comp_cor('borda'))

    const btnConfirmar = _comp_el('button', {
        padding:      '0 10px',
        borderRadius: '4px',
        border:       `1px solid ${_comp_cor('laranja')}`,
        background:   _comp_cor('laranja'),
        color:        '#fff',
        fontSize:     '13px',
        cursor:       'pointer',
        flexShrink:   '0',
        transition:   'background 0.15s',
    })
    btnConfirmar.textContent = '✓'
    btnConfirmar.title       = 'Confirmar'
    btnConfirmar.addEventListener('click', () => {
        if (typeof aoConfirmar === 'function') aoConfirmar(input.value.trim())
    })
    btnConfirmar.addEventListener('mouseenter', () => btnConfirmar.style.background = _comp_cor('laranjaEsc'))
    btnConfirmar.addEventListener('mouseleave', () => btnConfirmar.style.background = _comp_cor('laranja'))

    input.addEventListener('keydown', e => { if (e.key === 'Enter') btnConfirmar.click() })

    linha.appendChild(input)
    linha.appendChild(btnConfirmar)
    wrap.appendChild(linha)

    wrap.obterValor  = () => input.value.trim()
    wrap.definirValor = (v) => { input.value = v }
    return wrap
}


// ── CABEÇALHO DO PAINEL ───────────────────────────────────────

function criarCabecalho({ tarefa = '', etapa = '', atual = 0, total = 0 } = {}) {

    const wrap = _comp_el('div', {
        background:     _comp_cor('azul'),
        padding:        '10px 14px',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
    })

    const info    = _comp_el('div')
    const titulo  = _comp_el('div', { fontSize: '13px', fontWeight: '500', color: '#fff' })
    const sub     = _comp_el('div', { fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginTop: '1px' })

    titulo.textContent = tarefa
    sub.textContent    = etapa
    info.appendChild(titulo)
    info.appendChild(sub)

    const progresso = _comp_el('div', {
        fontSize:     '11px',
        color:        'rgba(255,255,255,0.8)',
        background:   'rgba(255,255,255,0.15)',
        borderRadius: '20px',
        padding:      '3px 10px',
    })
    progresso.textContent = total ? `${atual} de ${total}` : ''

    wrap.appendChild(info)
    wrap.appendChild(progresso)

    wrap.atualizar = ({ tarefa: t, etapa: e, atual: a, total: tot } = {}) => {
        if (t !== undefined) titulo.textContent = t
        if (e !== undefined) sub.textContent    = e
        if (a !== undefined && tot !== undefined) progresso.textContent = `${a} de ${tot}`
    }

    return wrap
}


// ── RODAPÉ DO PAINEL ──────────────────────────────────────────

function criarRodape({ aoProximo, aoEncerrar } = {}) {

    const wrap = _comp_el('div', {
        padding:    '8px 10px',
        borderTop:  `1px solid ${_comp_cor('borda')}`,
        display:    'flex',
        gap:        '6px',
        background: _comp_cor('branco'),
    })

    const _btn = (texto, bg, borda, cb) => {
        const b = _comp_el('button', {
            flex:         '1',
            padding:      '7px',
            borderRadius: '4px',
            fontSize:     '11px',
            fontWeight:   '500',
            cursor:       'pointer',
            textAlign:    'center',
            border:       `1px solid ${borda}`,
            background:   bg,
            color:        bg === _comp_cor('branco') ? _comp_cor('texto') : '#fff',
            transition:   'background 0.15s',
        })
        b.textContent = texto
        b.addEventListener('click', () => typeof cb === 'function' && cb())
        return b
    }

    const btnEncerrar = _btn('Encerrar', _comp_cor('branco'), _comp_cor('borda'), aoEncerrar)
    const btnProximo  = _btn('Próximo processo →', _comp_cor('azul'), _comp_cor('azul'), aoProximo)
    btnProximo.style.flex = '2'

    btnEncerrar.addEventListener('mouseenter', () => btnEncerrar.style.background = _comp_cor('fundo'))
    btnEncerrar.addEventListener('mouseleave', () => btnEncerrar.style.background = _comp_cor('branco'))
    btnProximo.addEventListener('mouseenter',  () => btnProximo.style.background  = _comp_cor('azulClaro'))
    btnProximo.addEventListener('mouseleave',  () => btnProximo.style.background  = _comp_cor('azul'))

    wrap.appendChild(btnEncerrar)
    wrap.appendChild(btnProximo)
    return wrap
}
// criarCaixaDeAviso

// ============================================================
// ui.js
// Biblioteca de componentes visuais do assistente Rota PJE.
//
// Paleta:
//   azul    #0078aa      laranja  #ffa726
//   fundo   #f9f9fa      borda    #dcdcdc
//   texto   #2c3e50      suave    #6b7c93
//
// Convenção:
//   - Todos os componentes recebem um objeto de configuração.
//   - 'ancestral' é sempre o id (string) do elemento pai.
//   - O elemento criado é inserido no ancestral automaticamente.
//   - Todos os componentes retornam o elemento raiz criado.
//   - Ids são obrigatórios para que o roteiro possa acessar
//     os valores por document.getElementById(id).
// ============================================================


// ── Utilitários internos ──────────────────────────────────────

const UI_CORES = {
    azul:        '#0078aa',
    azulHover:   '#005f8a',
    laranja:     '#ffa726',
    laranjaHover:'#e6941f',
    fundo:       '#f9f9fa',
    borda:       '#dcdcdc',
    texto:       '#2c3e50',
    suave:       '#6b7c93',
    branco:      '#ffffff',
    erro:        '#c62828',
}

function _ui_el(tag, estilos = {}) {
    const el = document.createElement(tag)
    Object.assign(el.style, estilos)
    return el
}

// Insere 'el' dentro do elemento com id 'ancestral'.
// Se 'ancestral' não for encontrado, insere no body com aviso.
function _ui_inserir(el, ancestral) {
    // Aceita id simples ('minha-div') ou seletor CSS ('[class*="pje"]')
    const pai = ancestral.match(/^[a-zA-Z0-9_-]+$/)
        ? document.getElementById(ancestral)
        : document.querySelector(ancestral)
    if (!pai) {
        console.warn('[ui.js] ancestral não encontrado:', ancestral)
        document.body.appendChild(el)
        return
    }
    pai.appendChild(el)
}

// Estilo base de botão — compartilhado por variantes
function _ui_estiloBotao(cor, corHover, corTexto = '#ffffff') {
    return {
        display:      'block',
        width:        '100% - 6px',
        background:   cor,
        color:        corTexto,
        border:       'none',
        borderRadius: '6px',
        padding:      '8px 12px',
        marginLeft:   '3px',
        marginRight:  '3px',
        fontSize:     '12px',
        fontWeight:   '700',
        fontFamily:   "'Segoe UI', system-ui, sans-serif",
        cursor:       'pointer',
        textAlign:    'center',
        transition:   'background 0.15s',
        boxSizing:    'border-box',
    }
}

function _ui_hoverBotao(btn, cor, corHover) {
    btn.addEventListener('mouseenter', () => btn.style.background = corHover)
    btn.addEventListener('mouseleave', () => btn.style.background = cor)
}


// ── criaDiv ───────────────────────────────────────────────────
//
// Cria uma div genérica com id. Usada como container para
// agrupar outros componentes.
//
// criaDiv({ id, ancestral })

function criaDiv({ id, ancestral }) {
    const el = _ui_el('div', {
        display:       'flex',
        flexDirection: 'column',
        gap:           '6px',
        marginBottom:  '8px',
    })
    el.id = id
    _ui_inserir(el, ancestral)
    return el
}


// ── criaTitulo ────────────────────────────────────────────────
//
// Texto de título (h2 visual). Linha azul à esquerda.
//
// criaTitulo({ id, texto, ancestral })

function criaTitulo({ id, texto, ancestral }) {
    const el = _ui_el('div', {
        fontSize:    '13px',
        fontWeight:  '700',
        color:       UI_CORES.azul,
        borderLeft:  '3px solid ' + UI_CORES.azul,
        paddingLeft: '8px',
        marginBottom:'4px',
        fontFamily:  "'Segoe UI', system-ui, sans-serif",
    })
    el.id          = id
    el.textContent = texto
    _ui_inserir(el, ancestral)
    return el
}


// ── criaSubTitulo ─────────────────────────────────────────────
//
// Texto de subtítulo menor, cor suave.
//
// criaSubTitulo({ id, texto, ancestral })

function criaSubTitulo({ id, texto, ancestral }) {
    const el = _ui_el('div', {
        fontSize:   '11px',
        fontWeight: '600',
        color:      UI_CORES.suave,
        marginBottom:'2px',
        marginLeft: '8px',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
    })
    el.id          = id
    el.textContent = texto
    _ui_inserir(el, ancestral)
    return el
}


// ── criaTexto ─────────────────────────────────────────────────
//
// Parágrafo de texto simples.
//
// criaTexto({ id, texto, ancestral })

function criaTexto({ id, texto, ancestral }) {
    const el = _ui_el('div', {
        fontSize:   '12px',
        color:      UI_CORES.texto,
        paddingLeft: '8px',
        marginRight:'8px',
        lineHeight: '1.5',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        whiteSpace: 'pre-wrap',
    })
    el.id          = id
    el.textContent = texto
    _ui_inserir(el, ancestral)
    return el
}


// ── criaBotaoAzul ─────────────────────────────────────────────
//
// Botão azul primário. Clique chama acao().
//
// criaBotaoAzul({ id, texto, ancestral, acao })

function criaBotaoAzul({ id, texto = 'OK', ancestral, acao }) {
    const btn = _ui_el('button', _ui_estiloBotao(UI_CORES.azul, UI_CORES.azulHover))
    btn.id          = id
    btn.textContent = texto
    _ui_hoverBotao(btn, UI_CORES.azul, UI_CORES.azulHover)
    if (typeof acao === 'function') btn.addEventListener('click', acao)
    _ui_inserir(btn, ancestral)
    return btn
}


// ── criaBotaoLaranja ──────────────────────────────────────────
//
// Botão laranja de ação secundária. Clique chama acao().
//
// criaBotaoLaranja({ id, texto, ancestral, acao })

function criaBotaoLaranja({ id, texto = 'OK', ancestral, acao }) {
    const btn = _ui_el('button', _ui_estiloBotao(UI_CORES.laranja, UI_CORES.laranjaHover))
    btn.id          = id
    btn.textContent = texto
    _ui_hoverBotao(btn, UI_CORES.laranja, UI_CORES.laranjaHover)
    if (typeof acao === 'function') btn.addEventListener('click', acao)
    _ui_inserir(btn, ancestral)
    return btn
}


// ── criaBotaoAzulComCheckBox ──────────────────────────────────
//
// Botão azul com checkbox à direita.
// Clicar no botão → executa acao() diretamente.
// O checkbox é lido pelo EXECUTAR da criaDivExecucao.
//
// Layout:
//   [ Texto do botão              ✓ ]
//
// criaBotaoAzulComCheckBox({ id, idCheckbox, texto, ancestral, acao })

function criaBotaoAzulComCheckBox({ id, idCheckbox, texto = 'OK', ancestral, acao, grupo}) {
    return _ui_botaoComCheckBox({
        id, idCheckbox, texto, ancestral, acao, grupo, 
        cor: UI_CORES.azul, corHover: UI_CORES.azulHover,
    })
}


// ── criaBotaoLaranjaComCheckBox ───────────────────────────────
//
// Igual ao azul mas na cor laranja.
//
// criaBotaoLaranjaComCheckBox({ id, idCheckbox, texto, ancestral, acao })

function criaBotaoLaranjaComCheckBox({ id, idCheckbox, texto = 'OK', ancestral, acao, grupo }) {
    return _ui_botaoComCheckBox({
        id, idCheckbox, texto, ancestral, acao, grupo,
        cor: UI_CORES.laranja, corHover: UI_CORES.laranjaHover,
    })
}

// Implementação compartilhada dos botões com checkbox
function _ui_botaoComCheckBox({ id, idCheckbox, texto, ancestral, acao, cor, corHover, grupo }) {
    // Container linha
    const linha = _ui_el('div', {
        display:     'flex',
        alignItems:  'center',
        gap:         '6px',
        marginBottom:'4px',
    })
    linha.id = id + '-linha'

    // Botão
    const btn = _ui_el('button', {
        ..._ui_estiloBotao(cor, corHover),
        flex:   '1',
        width:  'auto',
        display:'block',
    })
    btn.id          = id
    btn.textContent = texto
    _ui_hoverBotao(btn, cor, corHover)
    if (typeof acao === 'function') btn.addEventListener('click', acao)

    // Checkbox visual
    const chk = _ui_el('div', {
        width:          '18px',
        height:         '18px',
        flexShrink:     '0',
        border:         '2px solid ' + UI_CORES.borda,
        borderRadius:   '4px',
        background:     UI_CORES.branco,
        cursor:         'pointer',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        transition:     'all 0.15s',
        fontSize:       '12px',
    })
    chk.id              = idCheckbox
    chk.dataset.marcado = '0'
    if (grupo) chk.dataset.grupo = grupo

    // Função de desmarcar exposta no elemento
    chk.desmarcar = () => {
        chk.dataset.marcado  = '0'
        chk.style.background = UI_CORES.branco
        chk.style.borderColor= UI_CORES.borda
        chk.textContent      = ''
    }

    chk.addEventListener('click', () => {
        if (chk.dataset.marcado === '1') {
            chk.desmarcar()
        } else {
            // Marca este
            chk.dataset.marcado  = '1'
            chk.style.background = cor
            chk.style.borderColor= cor
            chk.textContent      = '✓'
            chk.style.color      = '#ffffff'

            // Desmarca os demais do mesmo grupo
            if (grupo) {
                document.querySelectorAll(`[data-grupo="${grupo}"]`).forEach(outro => {
                    if (outro !== chk && typeof outro.desmarcar === 'function') {
                        outro.desmarcar()
                    }
                })
            }
        }
    })

    linha.appendChild(btn)
    linha.appendChild(chk)
    _ui_inserir(linha, ancestral)
    return linha
}


// ── criaBotaoComInputAzul ─────────────────────────────────────
//
// Input de texto com botão azul abaixo.
//
// Layout:
//   textoEmCima (label, opcional)
//   ┌─────────────┐
//   │    INPUT    │
//   ├─────────────┤
//   │    BOTÃO    │
//   └─────────────┘
//
// criaBotaoComInputAzul({ id, idInput, texto, textoEmCima, ancestral, acao })

function criaBotaoComInputAzul({ id, idInput, texto = 'OK', textoEmCima = '', ancestral, acao }) {
    return _ui_botaoComInput({
        id, idInput, texto, textoEmCima, ancestral, acao,
        cor: UI_CORES.azul, corHover: UI_CORES.azulHover,
    })
}


// ── criaBotaoComInputLaranja ──────────────────────────────────
//
// Igual ao azul mas na cor laranja.
//
// criaBotaoComInputLaranja({ id, idInput, texto, textoEmCima, ancestral, acao })

function criaBotaoComInputLaranja({ id, idInput, texto = 'OK', textoEmCima = '', ancestral, acao }) {
    return _ui_botaoComInput({
        id, idInput, texto, textoEmCima, ancestral, acao,
        cor: UI_CORES.laranja, corHover: UI_CORES.laranjaHover,
    })
}

function _ui_botaoComInput({ id, idInput, texto, textoEmCima, ancestral, acao, cor, corHover }) {
    const container = _ui_el('div', {
        display:       'flex',
        flexDirection: 'column',
        gap:           '0',
        marginBottom:  '6px',
    })
    container.id = id + '-container'

    // Label acima (opcional)
    if (textoEmCima) {
        const label = _ui_el('div', {
            fontSize:     '11px',
            color:        UI_CORES.suave,
            marginBottom: '3px',
            fontFamily:   "'Segoe UI', system-ui, sans-serif",
        })
        label.textContent = textoEmCima
        container.appendChild(label)
    }

    // Input
    const input = _ui_el('input', {
        width:        '100%',
        border:       '1px solid ' + UI_CORES.borda,
        borderBottom: 'none',
        borderRadius: '6px 6px 0 0',
        padding:      '7px 10px',
        fontSize:     '12px',
        fontFamily:   "'Segoe UI', system-ui, sans-serif",
        color:        UI_CORES.texto,
        background:   UI_CORES.branco,
        outline:      'none',
        boxSizing:    'border-box',
    })
    input.id   = idInput
    input.type = 'text'

    // Botão
    const btn = _ui_el('button', {
        ..._ui_estiloBotao(cor, corHover),
        borderRadius: '0 0 6px 6px',
        marginTop:    '0',
    })
    btn.id          = id
    btn.textContent = texto
    _ui_hoverBotao(btn, cor, corHover)
    if (typeof acao === 'function') btn.addEventListener('click', acao)

    container.appendChild(input)
    container.appendChild(btn)
    _ui_inserir(container, ancestral)
    return container
}


// ── criaInput ─────────────────────────────────────────────────
//
// Campo de texto simples com label acima.
//
// criaInput({ id, textoEmCima, ancestral, placeholder })

function criaInput({ id, textoEmCima = '', ancestral, placeholder = '' }) {
    const container = _ui_el('div', {
        display:       'flex',
        flexDirection: 'column',
        gap:           '3px',
        marginBottom:  '6px',
    })
    container.id = id + '-container'

    if (textoEmCima) {
        const label = _ui_el('div', {
            fontSize:  '11px',
            color:     UI_CORES.suave,
            fontFamily:"'Segoe UI', system-ui, sans-serif",
        })
        label.textContent = textoEmCima
        container.appendChild(label)
    }

    const input = _ui_el('input', {
        width:        '100%',
        border:       '1px solid ' + UI_CORES.borda,
        borderRadius: '6px',
        padding:      '7px 10px',
        fontSize:     '12px',
        fontFamily:   "'Segoe UI', system-ui, sans-serif",
        color:        UI_CORES.texto,
        background:   UI_CORES.branco,
        outline:      'none',
        boxSizing:    'border-box',
    })
    input.id          = id
    input.type        = 'text'
    input.placeholder = placeholder

    container.appendChild(input)
    _ui_inserir(container, ancestral)
    return container
}

function criaInputAnotacao({ id, textoEmCima = '', ancestral, placeholder = '' }) {
    const container = _ui_el('div', {
        display:       'flex',
        padding: '8px',
        flexDirection: 'column',
        gap:           '3px',
        marginBottom:  '6px',
    })
    container.id = id + '-container'

    if (textoEmCima) {
        const label = _ui_el('div', {
            fontSize:  '11px',
            color:     UI_CORES.suave,
            fontFamily:"'Segoe UI', system-ui, sans-serif",
        })
        label.textContent = textoEmCima
        container.appendChild(label)
    }

    const textarea = _ui_el('textarea', {
        width:        '100%',
        border:       '1px solid ' + UI_CORES.borda,
        borderRadius: '6px',
        padding:      '7px 10px',
        fontSize:     '12px',
        fontFamily:   "'Segoe UI', system-ui, sans-serif",
        color:        UI_CORES.texto,
        background:   UI_CORES.branco,
        outline:      'none',
        boxSizing:    'border-box',
        resize:       'none',       // não redimensiona manualmente
        overflow:     'hidden',     // esconde scrollbar enquanto cresce
        minHeight:    '34px',
        lineHeight:   '1.5',
    })
    textarea.id          = id
    textarea.placeholder = placeholder

    // Cresce conforme o conteúdo
    textarea.addEventListener('input', () => {
        textarea.style.height = 'auto'
        textarea.style.height = textarea.scrollHeight + 'px'
    })

    container.appendChild(textarea)
    _ui_inserir(container, ancestral)
    return container
}
// ── criaCheckBox ──────────────────────────────────────────────
//
// Checkbox com texto ao lado direito.
//
// Layout:  [✓] Texto ao lado
//
// criaCheckBox({ id, textoAoLado, ancestral })

function criaCheckBox({ id, textoAoLado = '', ancestral }) {
    const linha = _ui_el('div', {
        display:    'flex',
        alignItems: 'center',
        gap:        '8px',
        cursor:     'pointer',
        marginBottom:'4px',
    })
    linha.id = id + '-linha'

    const chk = _ui_el('div', {
        width:          '16px',
        height:         '16px',
        flexShrink:     '0',
        border:         '2px solid ' + UI_CORES.borda,
        borderRadius:   '4px',
        background:     UI_CORES.branco,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        transition:     'all 0.15s',
        fontSize:       '11px',
    })
    chk.id              = id
    chk.dataset.marcado = '0'

    const label = _ui_el('span', {
        fontSize:  '12px',
        color:     UI_CORES.texto,
        fontFamily:"'Segoe UI', system-ui, sans-serif",
        userSelect:'none',
    })
    label.textContent = textoAoLado

    function alternar() {
        if (chk.dataset.marcado === '1') {
            chk.dataset.marcado  = '0'
            chk.style.background = UI_CORES.branco
            chk.style.borderColor= UI_CORES.borda
            chk.textContent      = ''
        } else {
            chk.dataset.marcado  = '1'
            chk.style.background = UI_CORES.azul
            chk.style.borderColor= UI_CORES.azul
            chk.textContent      = '✓'
            chk.style.color      = '#ffffff'
        }
    }

    linha.addEventListener('click', alternar)

    linha.appendChild(chk)
    linha.appendChild(label)
    _ui_inserir(linha, ancestral)
    return linha
}


// ── criaTabela ────────────────────────────────────────────────
//
// Tabela com colunas identificadas por id.
// As colunas são criadas pelo array idDasColunas.
// O rótulo de cada coluna é opcional — se não passar 'colunas',
// usa os próprios ids como cabeçalho.
// Linhas são adicionadas depois via ui_adicionarLinhaTabela().
//
// criaTabela({ id, idDasColunas, colunas, ancestral })
//   idDasColunas: ['col-nome', 'col-cpf', 'col-acao']
//   colunas:      ['Nome', 'CPF', 'Ação']  ← opcional

function criaTabela({ id, idDasColunas = [], colunas, ancestral }) {
    const rotulosColunas = colunas || idDasColunas

    const wrapper = _ui_el('div', {
        overflowX:    'auto',
        marginBottom: '8px',
        borderRadius: '6px',
        border:       '1px solid ' + UI_CORES.borda,
    })
    wrapper.id = id + '-wrapper'

    const tabela = _ui_el('table', {
        width:          '100%',
        borderCollapse: 'collapse',
        fontSize:       '12px',
        fontFamily:     "'Segoe UI', system-ui, sans-serif",
        color:          UI_CORES.texto,
    })
    tabela.id = id

    // Cabeçalho
    const thead = document.createElement('thead')
    const trH   = document.createElement('tr')
    idDasColunas.forEach((colId, i) => {
        const th = _ui_el('th', {
            padding:     '7px 10px',
            textAlign:   'left',
            background:  UI_CORES.azul,
            color:       '#ffffff',
            fontWeight:  '700',
            whiteSpace:  'nowrap',
            borderRight: i < idDasColunas.length - 1 ? '1px solid rgba(255,255,255,0.2)' : 'none',
        })
        th.id          = colId
        th.textContent = rotulosColunas[i] || colId
        trH.appendChild(th)
    })
    thead.appendChild(trH)
    tabela.appendChild(thead)

    // Corpo (linhas adicionadas depois)
    const tbody = document.createElement('tbody')
    tbody.id = id + '-corpo'
    tabela.appendChild(tbody)

    wrapper.appendChild(tabela)
    _ui_inserir(wrapper, ancestral)
    return wrapper
}

// Adiciona uma linha à tabela.
// valores: objeto { idColuna: 'conteudo' }
// Retorna o <tr> criado para manipulação extra se necessário.
//
// ui_adicionarLinhaTabela('minha-tabela', { 'col-nome': 'João', 'col-cpf': '123' })

function ui_adicionarLinhaTabela(idTabela, valores = {}) {
    const tbody = document.getElementById(idTabela + '-corpo')
    if (!tbody) { console.warn('[ui.js] tabela não encontrada:', idTabela); return null }

    const tabela = document.getElementById(idTabela)
    const ths    = tabela?.querySelectorAll('thead th') || []

    const tr = document.createElement('tr')
    const idx = tbody.children.length
    tr.style.background = idx % 2 === 0 ? UI_CORES.branco : UI_CORES.fundo

    ths.forEach((th, i) => {
        const td = _ui_el('td', {
            padding:     '6px 10px',
            borderTop:   '1px solid ' + UI_CORES.borda,
            borderRight: i < ths.length - 1 ? '1px solid ' + UI_CORES.borda : 'none',
            verticalAlign:'middle',
        })
        // O conteúdo pode ser string ou elemento DOM
        const valor = valores[th.id]
        if (valor instanceof HTMLElement) {
            td.appendChild(valor)
        } else {
            td.textContent = valor ?? ''
        }
        tr.appendChild(td)
    })

    tbody.appendChild(tr)
    return tr
}


// ── criaDivExecucao ───────────────────────────────────────────
//
// Div com duas colunas:
//   - idColuna (esquerda): o roteiro coloca qualquer coisa aqui
//   - idBotaoExecutar (direita): botão EXECUTAR fixo
//
// Layout:
//   ┌──────────────────────┬──────────┐
//   │ idColuna             │ EXECUTAR │
//   └──────────────────────┴──────────┘
//
// criaDivExecucao({ id, idColuna, idBotaoExecutar, acaoBotaoExecutar, ancestral })

function criaDivExecucao({ id, idColuna, idBotaoExecutar, acaoBotaoExecutar, ancestral }) {
    const container = _ui_el('div', {
        display:     'flex',
        gap:         '8px',
        alignItems:  'flex-start',
        marginBottom:'8px',
        marginLeft:  '4px',
        marginRight: '6px',
        borderRadius:'6px',
        background:  UI_CORES.fundo,
        border:      '1px solid ' + UI_CORES.borda,
        borderRadius:'6px',
        padding:     '8px',
    })
    container.id = id

    // Coluna esquerda — livre para o roteiro
    const coluna = _ui_el('div', {
        flex:          '1',
        display:       'flex',
        flexDirection: 'column',
        gap:           '6px',
        minWidth:      '0',
    })
    coluna.id = idColuna

    // Botão EXECUTAR — fixo à direita
    const btn = _ui_el('button', {
        ..._ui_estiloBotao(UI_CORES.laranja, UI_CORES.laranjaHover),
        width:     'auto',
        flexShrink:'0',
        padding:   '8px 14px',
        alignSelf: 'stretch',  // ocupa a altura da coluna esquerda
        writingMode: 'vertical-rl',
        fontSize:     '12px',
    })
    btn.id          = idBotaoExecutar
    btn.textContent = 'Executar todos ➡️'
    
    _ui_hoverBotao(btn, UI_CORES.laranja, UI_CORES.laranjaHover)
    if (typeof acaoBotaoExecutar === 'function') {
        btn.addEventListener('click', acaoBotaoExecutar)
    }

    container.appendChild(coluna)
    container.appendChild(btn)
    _ui_inserir(container, ancestral)
    return container
}


// ── criaTextoQueAbrePassandoOMouse ────────────────────────────
//
// Texto/rótulo que, ao passar o mouse, exibe um box com conteúdo.
// Equivalente ao antigo infoPJE.
//
// corDoBox: 'azul' | 'laranja' | 'verde' | 'vermelho'
//
// criaTextoQueAbrePassandoOMouse({ id, texto, ancestral, corDoBox })
function criaTextoQueAbrePassandoOMouse({ id, texto = '📋 Passe o mouse', ancestral, corDoBox = 'azul', textoBox = '' }) {
    const CORES_BOX = {
        azul:     { bg: '#e3f2fd', borda: UI_CORES.azul    },
        laranja:  { bg: '#fff3e0', borda: UI_CORES.laranja  },
        verde:    { bg: '#e8f5e9', borda: '#2e7d32'         },
        vermelho: { bg: '#fdecea', borda: UI_CORES.erro     },
    }
    const cor = CORES_BOX[corDoBox] || CORES_BOX.azul

    let fixado = false  // ← estado que persiste no closure

    const wrapper = _ui_el('div', { position: 'relative', marginBottom: '4px' })
    wrapper.id = id + '-wrapper'
    
    const rotulo = _ui_el('div', {
        fontSize: '12px', color: UI_CORES.azul, cursor: 'pointer',
        fontFamily: "'Segoe UI', system-ui, sans-serif", userSelect: 'none',
        display: 'inline-block', borderBottom: '1px dashed ' + UI_CORES.azul,
        paddingBottom: '1px', paddingLeft: '8px', whiteSpace: 'pre-wrap',
    })
    rotulo.id = id
    rotulo.textContent = texto

    const box = _ui_el('div', {
        display: 'none', position: 'absolute', top: 'calc(100% + 4px)', left: '0',
        zIndex: '9999', background: cor.bg, border: '1px solid ' + cor.borda,
        borderRadius: '6px', padding: '10px 12px', fontSize: '12px',
        color: UI_CORES.texto, fontFamily: "'Segoe UI', system-ui, sans-serif",
        lineHeight: '1.5', whiteSpace: 'pre-wrap', maxWidth: parseInt(window.innerWidth * 0.97) + 'px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.10)', minWidth: '180px',
        textAlign: 'justify',
        cursor: 'pointer',
    })
    box.id = id + '-box'
    box.textContent = textoBox

    // Hover: só age se não estiver fixado
    rotulo.addEventListener('mouseenter', () => {
        if (!fixado) box.style.display = 'block'
    })
    rotulo.addEventListener('mouseleave', () => {
        if (!fixado) setTimeout(() => { if (!box.matches(':hover')) box.style.display = 'none' }, 100)
    })
    box.addEventListener('mouseleave', () => {
        if (!fixado) box.style.display = 'none'
    })

    // Clique no rótulo: alterna fixação
    rotulo.addEventListener('click', () => {
        fixado = !fixado
        box.style.display = fixado ? 'block' : 'none'
        rotulo.style.fontWeight = fixado ? 'bold' : 'normal'  // feedback visual opcional
        rotulo.textContent = texto + (fixado ? '▲' : '')  // seta para indicar fixação
    })

    // Clique no box enquanto fixado: desfixa e fecha
    box.addEventListener('click', () => {
        if (fixado) {
            fixado = false
            box.style.display = 'none'
            rotulo.style.fontWeight = 'normal'
            rotulo.textContent = texto
        } else {
            fixado = true
            rotulo.style.fontWeight = 'bold'
            rotulo.textContent = texto + '▲'
        }
    })

    wrapper.appendChild(rotulo)
    wrapper.appendChild(box)
    _ui_inserir(wrapper, ancestral)

    wrapper.atualizarConteudo = (conteudo) => { box.textContent = conteudo }

    return wrapper
}


// ── criaBotaoProximoEEncerrar ─────────────────────────────────
//
// Par de botões Encerrar + Próximo lado a lado.
// Usados no rodapé do assistente e no widget das janelas filhas.
// Acionam rota_sinalizar() com a sessão atual.
//
// A sessao é lida do storage (rotaExecucaoAtual) no momento do clique.
//
// criaBotaoProximoEEncerrar({ id, ancestral })

function criaBotaoProximoEEncerrar({ id, ancestral }) {
    const linha = _ui_el('div', {
        display: 'flex',
        gap:     '6px',
    })
    linha.id = id

    const btnEncerrar = _ui_el('button', {
        ..._ui_estiloBotao(UI_CORES.fundo, '#ececec', UI_CORES.texto),
        flex:   '1',
        border: '1px solid ' + UI_CORES.borda,
        width:  'auto',
    })
    btnEncerrar.id          = id + '-encerrar'
    btnEncerrar.textContent = '■ Encerrar'
    btnEncerrar.addEventListener('mouseenter', () => btnEncerrar.style.background = '#ececec')
    btnEncerrar.addEventListener('mouseleave', () => btnEncerrar.style.background = UI_CORES.fundo)

    const btnProximo = _ui_el('button', {
        ..._ui_estiloBotao(UI_CORES.laranja, UI_CORES.laranjaHover),
        flex:  '1',
        width: 'auto',
    })
    btnProximo.id          = id + '-proximo'
    btnProximo.textContent = '▶ Próximo'
    _ui_hoverBotao(btnProximo, UI_CORES.laranja, UI_CORES.laranjaHover)

    // Lê a sessão no momento do clique para garantir o valor atual
    btnProximo.addEventListener('click', async () => {
        const cfg = await obterArmazenamento(['rotaExecucaoAtual'])
        const sessao = cfg?.rotaExecucaoAtual
        if (sessao) await armazenar({ rotaSinalAssistente: 'proximo' })
    })

    btnEncerrar.addEventListener('click', async () => {
        const cfg = await obterArmazenamento(['rotaExecucaoAtual'])
        const sessao = cfg?.rotaExecucaoAtual
        if (sessao) await armazenar({ rotaSinalAssistente: 'encerrar' })
    })

    linha.appendChild(btnEncerrar)
    linha.appendChild(btnProximo)
    _ui_inserir(linha, ancestral)
    return linha
}


// ── criarCarregando / removerCarregando ───────────────────────
//
// Exibe/remove um indicador de carregamento na área rolável.
// O elemento pai é 'rota-corpo' (área rolável do assistente).

const _UI_ID_CARREGANDO = 'rota-carregando'

function criarCarregando(ancestral = 'rota-corpo') {
    removerCarregando()

    const el = _ui_el('div', {
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            '10px',
        padding:        '32px 16px',
        color:          UI_CORES.suave,
        fontSize:       '12px',
        fontFamily:     "'Segoe UI', system-ui, sans-serif",
    })
    el.id = _UI_ID_CARREGANDO

    // Spinner CSS simples
    const spinner = _ui_el('div', {
        width:       '24px',
        height:      '24px',
        border:      '3px solid ' + UI_CORES.borda,
        borderTop:   '3px solid ' + UI_CORES.azul,
        borderRadius:'50%',
        animation:   'rota-spin 0.8s linear infinite',
    })

    // Injeta keyframe se ainda não existir
    if (!document.getElementById('rota-spin-style')) {
        const style = document.createElement('style')
        style.id = 'rota-spin-style'
        style.textContent = '@keyframes rota-spin { to { transform: rotate(360deg) } }'
        document.head.appendChild(style)
    }

    const msg = _ui_el('span', {})
    msg.textContent = 'Aguardando dados…'

    el.appendChild(spinner)
    el.appendChild(msg)
    _ui_inserir(el, ancestral)
    return el
}

function removerCarregando() {
    document.getElementById(_UI_ID_CARREGANDO)?.remove()
}


// ── ui_checkboxMarcado ────────────────────────────────────────
//
// Utilitário: retorna true se o checkbox com o id dado
// estiver marcado. Usado pelo roteiro para verificar
// o estado dos botões com checkbox.
//
// ui_checkboxMarcado('chk-reclamante')  →  true | false

function ui_checkboxMarcado(idCheckbox) {
    const el = document.getElementById(idCheckbox)
    return el?.dataset?.marcado === '1'
}

// ── criaPlaquinha ─────────────────────────────────────────────
//
// Plaquinha colorida para destacar informações.
// cor: 'azul' | 'laranja' | 'amarelo' | 'verde'
//
// criaPlaquinha({ id, texto, cor, ancestral })

function criaPlaquinha({ id, texto = '', cor = 'azul', ancestral }) {
    const CORES_PLAQUINHA = {
        azul:    { bg: '#e3f2fd', borda: '#0078aa', texto: '#0078aa' },
        laranja: { bg: '#fff3e0', borda: '#ffa726', texto: '#e65100' },
        amarelo: { bg: '#fffde7', borda: '#fdd835', texto: '#f57f17' },
        verde:   { bg: '#e8f5e9', borda: '#43a047', texto: '#2e7d32' },
    }
    const c = CORES_PLAQUINHA[cor] || CORES_PLAQUINHA.azul

    const el = _ui_el('span', {
        display:       'inline-block',
        background:    c.bg,
        border:        '1px solid ' + c.borda,
        borderRadius:  '4px',
        padding:       '2px 8px',
        fontSize:      '11px',
        fontWeight:    '700',
        color:         c.texto,
        fontFamily:    "'Segoe UI', system-ui, sans-serif",
        whiteSpace:    'nowrap',
        marginRight:   '4px',
        marginBottom:  '4px',
        letterSpacing: '0.02em',
    })
    el.id          = id
    el.textContent = texto
    _ui_inserir(el, ancestral)
    return el
}


// ── criaPlaquinhaComTooltip ───────────────────────────────────
//
// Plaquinha colorida com tooltip ao passar o mouse.
// cor: 'azul' | 'laranja' | 'amarelo' | 'verde'
//
// criaPlaquinhaComTooltip({ id, texto, cor, tooltip, ancestral })

function criaPlaquinhaComTooltip({ id, texto = '', cor = 'azul', tooltip = '', ancestral }) {
    const CORES_PLAQUINHA = {
        azul:    { bg: '#e3f2fd', borda: '#0078aa', texto: '#0078aa', tooltipBg: '#0078aa' },
        laranja: { bg: '#fff3e0', borda: '#ffa726', texto: '#e65100', tooltipBg: '#ffa726' },
        amarelo: { bg: '#fffde7', borda: '#fdd835', texto: '#f57f17', tooltipBg: '#f9a825' },
        verde:   { bg: '#e8f5e9', borda: '#43a047', texto: '#2e7d32', tooltipBg: '#43a047' },
    }
    const c = CORES_PLAQUINHA[cor] || CORES_PLAQUINHA.azul

    const wrapper = _ui_el('span', {
        position:     'relative',
        display:      'inline-block',
        marginRight:  '4px',
        marginBottom: '4px',
    })
    wrapper.id = id + '-wrapper'

    // Plaquinha
    const plaquinha = _ui_el('span', {
        display:       'inline-block',
        background:    c.bg,
        border:        '1px solid ' + c.borda,
        borderRadius:  '4px',
        padding:       '2px 8px',
        fontSize:      '11px',
        fontWeight:    '700',
        color:         c.texto,
        fontFamily:    "'Segoe UI', system-ui, sans-serif",
        whiteSpace:    'nowrap',
        letterSpacing: '0.02em',
        cursor:        'default',
    })
    plaquinha.id          = id
    plaquinha.textContent = texto

    // Tooltip
    const tip = _ui_el('div', {
        display:      'none',
        position:     'absolute',
        bottom:       'calc(100% + 4px)',
        left:         '50%',
        transform:    'translateX(-50%)',
        background:   c.tooltipBg,
        color:        '#ffffff',
        borderRadius: '4px',
        padding:      '5px 10px',
        fontSize:     '11px',
        fontFamily:   "'Segoe UI', system-ui, sans-serif",
        whiteSpace:   'pre-wrap',
        maxWidth:     '240px',
        boxShadow:    '0 2px 8px rgba(0,0,0,0.15)',
        zIndex:       '9999',
        pointerEvents:'none',
        lineHeight:   '1.4',
    })
    tip.textContent = tooltip

    plaquinha.addEventListener('mouseenter', () => tip.style.display = 'block')
    plaquinha.addEventListener('mouseleave', () => tip.style.display = 'none')

    wrapper.appendChild(plaquinha)
    wrapper.appendChild(tip)
    _ui_inserir(wrapper, ancestral)

    // Método para atualizar tooltip externamente
    wrapper.atualizarTooltip = (novoTexto) => { tip.textContent = novoTexto }

    return wrapper
}
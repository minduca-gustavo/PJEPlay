console.log('Me chamou? OJ')
function consultaQualquerOJ(){
    let janela = confereJanela(JANELA.meuPainel, JANELA.painelGlobal, JANELA.painelGlobalTodos)
    if (!janela) return
    consulta_qualquer_ojCriaCampoConsulta()
}
console.log('Me chamou? OJ')

window.addEventListener('pjerota:url-mudou', () => {
    document.getElementById('pjerota-consulta_qualquer_oj-widget')?.remove()
    consultaQualquerOJ()
})

consultaQualquerOJ()

async function consulta_qualquer_ojCriaCampoConsulta() {

    let WIDGET_ID   = 'pjerota-consulta_qualquer_oj-widget'
    let STORAGE_POS = 'consulta_qualquer_oj_widget_pos'

    if (document.getElementById(WIDGET_ID)) return

    let C = {
        azul:       '#0078aa',
        azulClaro:  '#2a5a8c',
        branco:     '#ffffff',
        fundo:      '#f9f9fa',
        borda:      '#dcdcdc',
        texto:      '#2c3e50',
        textoSuave: '#6b7c93',
    }

    let store     = await obterArmazenamento([STORAGE_POS, 'consulta_qualquer_oj_recolhido', 'consulta_qualquer_oj_minimo'])
    let pos       = store[STORAGE_POS] || { top: 80, left: 20 }
    let recolhido = store['consulta_qualquer_oj_recolhido'] ?? false
    let minimo    = store['consulta_qualquer_oj_minimo']    ?? false

    const maxLeft = Math.max(0, window.innerWidth  - 240)
    const maxTop  = Math.max(0, window.innerHeight - 120)
    pos = {
        left: Math.min(Math.max(0, pos.left), maxLeft),
        top:  Math.min(Math.max(0, pos.top),  maxTop),
    }
    let _arrastando = false

    // ── Raiz ─────────────────────────────────────────────────
    let widget = document.createElement('div')
    widget.id  = WIDGET_ID
    _s(widget, {
        position:     'fixed',
        top:          pos.top  + 'px',
        left:         pos.left + 'px',
        zIndex:       '999999',
        width:        '240px',
        background:   C.branco,
        border:       '1px solid ' + C.borda,
        borderRadius: '12px',
        boxShadow:    '0 4px 20px rgba(0,0,0,0.14)',
        fontFamily:   "system-ui, -apple-system, 'Segoe UI', Arial, sans-serif",
        fontSize:     '12px',
        color:        C.texto,
        userSelect:   'none',
        overflow:     'hidden',
        transition:   'width 0.2s',
    })

    // ── Barra de título ───────────────────────────────────────
    let barra = document.createElement('div')
    _s(barra, {
        display:     'flex',
        alignItems:  'center',
        height:      '32px',
        padding:     '0 8px',
        background:  C.azul,
        cursor:      'grab',
    })

    // ── Botão horizontal (◄ / ►) — só aparece quando recolhido pra cima
    let btnHoriz = document.createElement('button')
    btnHoriz.textContent = '◄'
    _s(btnHoriz, {
        background: 'transparent',
        border:     'none',
        color:      'rgba(255,255,255,0.6)',
        fontSize:   '11px',
        cursor:     'pointer',
        padding:    '0 6px 0 0',
        lineHeight: '1',
        display:    'none',
    })
    btnHoriz.addEventListener('click', (e) => {
        e.stopPropagation()
        minimo = !minimo
        armazenar({ consulta_qualquer_oj_minimo: minimo })
        aplicarEstado()
    })

    let titulo = document.createElement('span')
    titulo.textContent = 'Consulta em qualquer OJ.'
    _s(titulo, {
        flex:          '1',
        fontWeight:    '700',
        fontSize:      '11px',
        color:         '#ffffff',
        letterSpacing: '0.4px',
        overflow:      'hidden',
        whiteSpace:    'nowrap',
    })

    // ── Botão vertical (▲ / ▼)
    let btnToggle = document.createElement('button')
    btnToggle.textContent = '▲'
    _s(btnToggle, {
        background: 'transparent',
        border:     'none',
        color:      'rgba(255,255,255,0.6)',
        fontSize:   '11px',
        cursor:     'pointer',
        padding:    '0',
        lineHeight: '1',
    })
    btnToggle.addEventListener('click', (e) => {
        e.stopPropagation()
        recolhido = !recolhido
        if (!recolhido) minimo = false    // abrir vertical limpa o mínimo
        armazenar({
            consulta_qualquer_oj_recolhido: recolhido,
            consulta_qualquer_oj_minimo:    minimo,
        })
        aplicarEstado()
    })

    barra.appendChild(btnHoriz)
    barra.appendChild(titulo)
    barra.appendChild(btnToggle)

    // ── Corpo ─────────────────────────────────────────────────
    let corpo = document.createElement('div')
    _s(corpo, {
        display:       'flex',
        flexDirection: 'column',
        gap:           '8px',
        padding:       '10px 10px 12px',
        background:    C.fundo,
    })

    let rotulo = document.createElement('span')
    rotulo.textContent = 'CONSULTE O PROCESSO ABAIXO'
    _s(rotulo, {
        fontSize:      '9px',
        fontWeight:    '700',
        letterSpacing: '0.8px',
        color:         C.textoSuave,
    })

    let wrapInput = document.createElement('div')
    _s(wrapInput, { display: 'flex', gap: '4px' })

    let input = document.createElement('input')
    input.type        = 'text'
    input.placeholder = 'Nº do processo…'
    input.id          = 'pjerota-consulta_qualquer_oj-input'
    _s(input, {
        flex:         '1',
        background:   C.branco,
        border:       '1px solid ' + C.borda,
        borderRadius: '7px',
        color:        C.texto,
        fontSize:     '12px',
        padding:      '6px 8px',
        outline:      'none',
        fontFamily:   'inherit',
        boxSizing:    'border-box',
        transition:   'border-color 0.15s, box-shadow 0.15s',
    })
    input.addEventListener('focus', () => {
        input.style.borderColor = C.azul
        input.style.boxShadow   = '0 0 0 3px rgba(0,120,170,0.1)'
    })
    input.addEventListener('blur', () => {
        input.style.borderColor = C.borda
        input.style.boxShadow   = 'none'
    })
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') btnLupa.click() })

    let btnLupa = document.createElement('button')
    btnLupa.textContent = '🔍'
    btnLupa.id          = 'pjerota-consulta_qualquer_oj-lupa'
    _s(btnLupa, {
        background:   C.azul,
        border:       'none',
        borderRadius: '7px',
        color:        '#fff',
        fontSize:     '13px',
        cursor:       'pointer',
        padding:      '0 9px',
        flexShrink:   '0',
        transition:   'background 0.15s',
    })
    btnLupa.addEventListener('mouseover', () => btnLupa.style.background = C.azulClaro)
    btnLupa.addEventListener('mouseout',  () => btnLupa.style.background = C.azul)
    btnLupa.addEventListener('click', () => consulta_qualquer_ojConsultar(input.value.trim()))

    wrapInput.appendChild(input)
    wrapInput.appendChild(btnLupa)

    let rodape = document.createElement('span')
    rodape.textContent = 'A ROTA escolherá a OJ adequada.'
    _s(rodape, {
        fontSize:   '10px',
        color:      C.textoSuave,
        lineHeight: '1.4',
    })

    let aviso = document.createElement('span')
    aviso.innerHTML = '<strong style="text-decoration:underline">ATENÇÃO</strong>: em teletrabalho, só funciona com a VPN ligada.'
    _s(aviso, {
        fontSize:   '10px',
        color:      C.textoSuave,
        lineHeight: '1.4',
    })

    corpo.appendChild(rotulo)
    corpo.appendChild(wrapInput)
    corpo.appendChild(rodape)
    corpo.appendChild(aviso)

    widget.appendChild(barra)
    widget.appendChild(corpo)
    document.body.appendChild(widget)

    // ── Aplica estado visual ──────────────────────────────────
    function aplicarEstado() {
        if (minimo) {
            // Quadradinho: só ► visível
            widget.style.width         = '32px'
            barra.style.padding        = '0'
            barra.style.justifyContent = 'center'
            titulo.style.display       = 'none'
            btnToggle.style.display    = 'none'
            btnHoriz.style.display     = 'inline'
            btnHoriz.textContent       = '►'
            btnHoriz.style.padding     = '0'
            corpo.style.display        = 'none'
        } else if (recolhido) {
            // Barra visível, corpo oculto, ◄ aparece
            widget.style.width         = '240px'
            barra.style.padding        = '0 8px'
            barra.style.justifyContent = ''
            titulo.style.display       = ''
            btnToggle.style.display    = 'inline'
            btnToggle.textContent      = '▼'
            btnHoriz.style.display     = 'inline'
            btnHoriz.textContent       = '◄'
            btnHoriz.style.padding     = '0 6px 0 0'
            corpo.style.display        = 'none'
        } else {
            // Aberto: sem ◄
            widget.style.width         = '240px'
            barra.style.padding        = '0 8px'
            barra.style.justifyContent = ''
            titulo.style.display       = ''
            btnToggle.style.display    = 'inline'
            btnToggle.textContent      = '▲'
            btnHoriz.style.display     = 'none'
            corpo.style.display        = 'flex'
        }
    }

    aplicarEstado()

    let tarefaAtiva = await obterArmazenamento('tarefaAtiva')

    setTimeout(() => { if (!recolhido && !minimo) input.focus() }, 80)

    // ── Arrastar ─────────────────────────────────────────────
    barra.addEventListener('mousedown', (e) => {
        if (btnToggle.contains(e.target) || btnHoriz.contains(e.target)) return
        _arrastando = false
        let ox = e.clientX - widget.getBoundingClientRect().left
        let oy = e.clientY - widget.getBoundingClientRect().top
        barra.style.cursor = 'grabbing'
        e.preventDefault()

        function onMove(e) {
            _arrastando = true
            widget.style.left = Math.max(0, Math.min(e.clientX - ox, window.innerWidth  - widget.offsetWidth))  + 'px'
            widget.style.top  = Math.max(0, Math.min(e.clientY - oy, window.innerHeight - widget.offsetHeight)) + 'px'
        }
        function onUp() {
            barra.style.cursor = 'grab'
            document.removeEventListener('mousemove', onMove)
            document.removeEventListener('mouseup',   onUp)
            NAVEGADOR.storage.local.set({ [STORAGE_POS]: {
                top:  parseInt(widget.style.top),
                left: parseInt(widget.style.left),
            }})
            setTimeout(() => { _arrastando = false }, 0)
        }
        document.addEventListener('mousemove', onMove)
        document.addEventListener('mouseup',   onUp)
    })

    function _s(el, styles) { Object.assign(el.style, styles) }
}



async function consulta_qualquer_ojConsultar(numeroDoProcesso) {
    let ROTA_REGEX_CNJ = /\d{7}[-.]\d{2}[-.]\d{4}[-.]\d[-.]\d{2}[-.]\d{4}/
    let ROTA_REGEX_CNJ_SEM_DIVISOR = /\d{20}/
    console.log(JSON.stringify(numeroDoProcesso))
    let numeroVerificado = ROTA_REGEX_CNJ.test(numeroDoProcesso) || ROTA_REGEX_CNJ_SEM_DIVISOR.test(numeroDoProcesso)
    if (!numeroVerificado) {
        await consulta_qualquer_ojErroNumero('fora do padrao')
        return
    }
    let dadosBasicos = await buscarIdPeloNumeroCNJ(numeroDoProcesso)
    if (!dadosBasicos) {
        await consulta_qualquer_ojErroNumero('nao encontrado')
        return
    }
    let dadosProcesso = await buscarProcesso(dadosBasicos?.id)
    if (!dadosProcesso) {
        await consulta_qualquer_ojErroNumero('nao conectado')
        return
    }
    let orgaoJulgador = interceptador_lerOrgaosJulgadores() || {}
    relatar('dadosBasicos: ', dadosBasicos, 'teste')
    relatar('dadosProcesso: ', dadosProcesso, 'teste')
    relatar('orgaosJulgadores: ', orgaoJulgador, 'teste')
    if (dadosProcesso?.orgaoJulgador?.id !== orgaoJulgador.id){
        let perfis = await rota_fetch(location.origin + '/pje-seguranca/api/token/perfis')
        relatar ('perfis: ', perfis, 'teste')
        let perfil = perfis.find(el => el.idOrgaoJulgador === dadosProcesso?.orgaoJulgador?.id)
        if (!perfil) {
            consulta_qualquer_ojErroNumero('erro perfil')
            return
        }
        relatar ('perfil: ', perfil, 'teste')
        await fetch(location.origin + '/pje-seguranca/api/token/perfis/trocar', {
            method: 'POST',
            mode: 'cors',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/plain, */*',
                'X-XSRF-TOKEN': rota_cookie('Xsrf-Token') || rota_cookie('XSRF-TOKEN'),
            },
            body: JSON.stringify({ id_perfil: perfil.idPerfil })
        })
    }
    await armazenar({pjerota_consulta_qualquer_oj: dadosBasicos?.id})
    url = location.origin + '/pjekz/painel/global/todos/lista-processos/' + dadosBasicos?.numero
    await consulta_qualquer_ojNavegar(url)
}

async function consulta_qualquer_ojAbreDetalhes(){
    let cfg = await obterArmazenamento('pjerota_consulta_qualquer_oj')
    let id = cfg?.pjerota_consulta_qualquer_oj
    if (!id) return
    await removerArmazenamento('pjerota_consulta_qualquer_oj')
    let confirmacao = await obterArmazenamento('pjerota_consulta_qualquer_oj')
    if (confirmacao?.pjerota_consulta_qualquer_oj) return
    await acao_navegacao_detalhes(id)
}

consulta_qualquer_ojAbreDetalhes()

async function consulta_qualquer_ojErroNumero(erro = '') {
    let mensagem = ''
    if (erro === 'fora do padrao'){
        mensagem = 'Número não está no padrão CNJ.'
    }
    if (erro === 'nao encontrado'){
        mensagem = 'Verifique o dígito.'
    }
    if (erro === 'nao conectado'){
        mensagem = 'Verifique sua conexão ao PJE.'
    }
    if (erro === 'erro perfil'){
        mensagem = 'Você não possui o perfil da OJ.'
    }

    let campo = document.getElementById('pjerota-consulta_qualquer_oj-input')
    campo.placeholder = mensagem
    campo.value = ''
    let lupa = document.getElementById('pjerota-consulta_qualquer_oj-lupa')
    lupa.style.background = '#c0392b'
    await suspender(5000)
    lupa.style.background = '#0078aa'
    campo.placeholder = 'Nº do processo…'
    return
}

function consulta_qualquer_ojNavegar(url) {
    location.href = url
}
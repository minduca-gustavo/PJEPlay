// ── TDs excluídos da busca de número de processo ────────────────
//
// O rastreamento de processo em buscarTextosAAssinar() percorre toda 'tr'
// da página e, dentro dela, procura o 'td' cujo texto bate com
// ROTA_REGEX_CNJ. Em algumas telas mais de um td da mesma linha
// contém um número de processo (ex: coluna oculta, tooltip, link
// duplicado) e não é o td onde queremos o badge.
//
// Em vez de trocar o seletor principal a cada tela nova, acrescente
// aqui os seletores CSS dos tds que devem ser IGNORADOS na busca —
// o primeiro td restante (na ordem do DOM) que bater com o regex é
// o escolhido.
//
// ex: ROTA_ASSISTENTE_ASSINATURA_TDS_EXCLUIDOS.push('.mat-column-acoes')
const ROTA_ASSISTENTE_ASSINATURA_TDS_EXCLUIDOS = [
    // 'seletor-css-do-td-que-nao-deve-ser-usado',
]

// ── Quais documentos entram no painel ───────────────────────────
//
// buscarDocumentos devolve a lista inteira do processo, assinados e
// não assinados. O que separa os dois é a assinatura em si: o
// documento assinado vem com idSignatario/nomeSignatario (e ganha
// 'data', 'nomeResponsavel', 'idUsuario'); o pendente não tem nada
// disso. 'data' sozinha não serve de teste — é a data de juntada, que
// só existe depois de assinar, mas pode faltar por outros motivos.
function rota_assistenteAssinatura_ehAssinado(doc) {
    return !!(doc?.idSignatario || doc?.nomeSignatario)
}

// Deixe vazio para trazer todo documento pendente. Para restringir,
// acrescente o 'tipo' como vem da api (comparação sem acento e sem
// diferenciar maiúscula).
// ex: ROTA_ASSISTENTE_ASSINATURA_TIPOS.push('Sentença', 'Despacho')
const ROTA_ASSISTENTE_ASSINATURA_TIPOS = [
]

function rota_assistenteAssinatura_tipoInteressa(doc) {
    if (!ROTA_ASSISTENTE_ASSINATURA_TIPOS.length) return true
    let tipo = normalizar(String(doc?.tipo || doc?.titulo || '')).toLowerCase()
    return ROTA_ASSISTENTE_ASSINATURA_TIPOS.some(t => normalizar(String(t)).toLowerCase() === tipo)
}

async function assistenteAssinaturaDocumentos(ancestral) {
    criaWidgetAssistenteAssinatura(ancestral)
}


async function criaWidgetAssistenteAssinatura(ancestral) {
    let mapaFuncoes ={
        criaInput
    }
    let div = await criaDiv({
        id: 'rota_assistenteAssinatura', 
        ancestral: ancestral,
    })
    let subTitulo = criaSubTitulo({
        id: 'rota_assistenteAssinatura_subTitulo',
        texto: 'Apresenta os documentos a serem assinados em sequência.',
        ancestral: 'rota_assistenteAssinatura',
    })

    let botao = criaBotaoAzul({
        id: 'rota_assistenteAssinatura_botaoAcao',
        texto: 'Buscar textos dos documentos.',
        ancestral: 'rota_assistenteAssinatura',
        acao: () => buscarTextosAAssinar()
    })

    async function buscarTextosAAssinar() {
        // a busca é assíncrona e demorada; sem essa trava dois cliques
        // rodam dois loops preenchendo o mesmo painel
        let botaoAcao = document.querySelector('#rota_assistenteAssinatura_botaoAcao')
        if (botaoAcao?.dataset.rodando === '1') return
        if (botaoAcao) botaoAcao.dataset.rodando = '1'

        let elementos = []
        for (let tr of document.querySelectorAll('tr')){
            if (!tr.textContent.match(ROTA_REGEX_CNJ)) continue
            let tdProcesso = [...tr.querySelectorAll('td')].find(td =>
                td.textContent.match(ROTA_REGEX_CNJ) &&
                !ROTA_ASSISTENTE_ASSINATURA_TDS_EXCLUIDOS.some(sel => td.matches(sel))
            )
            if (tdProcesso) elementos.push(tdProcesso)
        }
        // o painel abre já no clique, vazio, e vai sendo preenchido conforme
        // cada processo responde — a busca é lenta (2 requisições por linha)
        // e esperar tudo pra mostrar algo daria sensação de travamento
        let painel = rota_assistenteAssinatura_abrirPainelMinutas()

        if (!elementos.length){
            painel.definirStatus('Nenhum processo encontrado nesta tela.')
            painel.definirVazio('Nenhum processo encontrado nesta tela.')
            if (botaoAcao) botaoAcao.dataset.rodando = '0'
            return
        }

        let total = elementos.length
        let feitos = 0
        let comPendente = 0
        for (let el of elementos){
            // se o usuário fechou o painel no meio, para de consultar
            if (!painel.aberto()) break

            let p = el.textContent.match(ROTA_REGEX_CNJ)?.[0]
            if (!p) continue

            feitos++
            painel.definirStatus('Buscando ' + feitos + ' de ' + total + '…')

            let id = await buscarIdPeloNumeroCNJ(p).then(d => d?.id) || null
            if (!id){
                painel.adicionarProcesso(p, [], 'Processo não localizado.')
                continue
            }

            let documentos = []
            try {
                documentos = await buscaDocumentosNaoAssinados(id)
            } catch (e) {
                console.error('[Rota PJE] erro ao buscar documentos de ' + p + ':', e)
                painel.adicionarProcesso(p, [], 'Erro ao buscar os documentos deste processo.')
                continue
            }

            if (documentos.length) comPendente++
            painel.adicionarProcesso(p, documentos)
        }

        painel.definirStatus(comPendente + ' de ' + feitos + ' com documento a assinar')
        painel.definirVazio('Nenhum documento pendente de assinatura nesta tela.')
        if (botaoAcao) botaoAcao.dataset.rodando = '0'
    }

    // ── código antigo (badges por termo, vindo da leitura dinâmica) ─────
    // mantido fora do fluxo até a busca por termos/cores voltar; depende
    // de 'regras', que hoje está no bloco comentado acima.
    async function _buscarTextosAAssinar_badges() {
        let elementos = []
        let processosResultado = []
        let i = 0
        for (let el of elementos){
            let p = el.textContent.match(ROTA_REGEX_CNJ)?.[0]
            if (!p) continue
            let id = await buscarIdPeloNumeroCNJ(p).then(d=> d?.id) || null
            if (!id) continue
            let documentosTimeline = await buscaDocumentosNaoAssinados(id)
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
                        dado.busca = dados
                        dado.cor = r?.cor
                        //corBadge = r?.cor
                        resultado.push(dado)
                    }
                    i++
                }
                
                // 'data' é um placeholder — o nome real do campo de data no
                // objeto retornado por buscaDocumentosNaoAssinados ainda
                // precisa ser conferido; deixe pronto pra troca.
                let documento = {idUnicoDocumento: d?.idUnicoDocumento, dados: resultado, teor: teor, data: d?.data}
                documentos.push( documento)
            }
            tooltipBadge += complemento
            let processo = {}
            processo.processo = p
            processo.documentos = documentos
            processosResultado.push(processo)
            i++
            let badgeId = 'rota_assistenteAssinatura_pintura' + i
            let encontrouAlgo = textoBadge !== ''
            let textoBadgeFinal = encontrouAlgo ? textoBadge.toUpperCase() : 'NÃO ENCONTRADO'
            let corBadgeFinal = encontrouAlgo ? corBadge : '#6b7c93'
            let badge = criaPlaquinhaComTooltip({
                id: badgeId,
                texto: textoBadgeFinal,
                cor: corBadgeFinal,
                tooltip: tooltipBadge,
                
            })
            el.appendChild(badge)
            let badgeEdita = document.querySelector('#rota_assistenteAssinatura_pintura' + i)
            badgeEdita.style.backgroundColor = corBadgeFinal
            badgeEdita.style.border = '1px solid ' + corBadgeFinal
            badgeEdita.style.borderRadius = "2px"
            badgeEdita.style.padding = '2px 2px'
            badgeEdita.style.cursor = 'pointer'
            badgeEdita.addEventListener('click', (e) => {
                e.stopPropagation()
                e.preventDefault()
                rota_assistenteAssinatura_abrirCompiladoProcesso(processo)
            })
            
        }
        
    }

    // Devolve sempre um array de {idDocumento, idUnicoDocumento, titulo, html},
    // vazio quando o processo não tem documento pendente de assinatura.
    // buscarDocumentos traz a lista inteira do processo — assinados e não
    // assinados — então o filtro é rota_assistenteAssinatura_ehAssinado.
    async function buscaDocumentosNaoAssinados(id) {
        let todos = await buscarDocumentos(id)
        if (!Array.isArray(todos)) todos = todos ? [todos] : []

        // ordena por id crescente: o id é sequencial, então serve de ordem
        // cronológica também para os não assinados, que não têm 'data'
        let pendentes = todos
            .filter(d => d?.ativo !== false)
            .filter(d => !rota_assistenteAssinatura_ehAssinado(d))
            .filter(d => rota_assistenteAssinatura_tipoInteressa(d))
            .sort((a, b) => (a?.id || 0) - (b?.id || 0))

        let documentos = []
        for (let d of pendentes){
            // extrairHtml usa o id numérico do documento (mesma api de antes);
            // se em alguma tela ele pedir o idUnicoDocumento, é só inverter aqui
            let idDocumento = d?.id ?? d?.idUnicoDocumento
            if (!idDocumento) continue

            let html = ''
            try {
                html = rota_assistenteAssinatura_normalizaHtml(await extrairHtml(id, idDocumento))
            } catch (e) {
                console.error('[Rota PJE] erro ao extrair html do documento ' + idDocumento + ':', e)
                continue
            }
            if (!html) continue

            documentos.push({
                idDocumento: idDocumento,
                idUnicoDocumento: d?.idUnicoDocumento || '',
                titulo: d?.titulo || d?.tipo || '',
                html: html,
            })
        }
        return documentos
    }

}

// ── rota_assistenteAssinatura_avisoTemporario ──────────────────────────────────────────
//
// Toast leve e não-bloqueante para avisos rápidos (validações,
// confirmações). Some sozinho após 'duracaoMs'. Diferente de
// rota_avisoObrigatorio (que é um modal que exige clique).
//
// rota_assistenteAssinatura_avisoTemporario(msg, duracaoMs)

function rota_assistenteAssinatura_avisoTemporario(msg = '', duracaoMs = 2500) {
    let existente = document.querySelector('#rota_assistenteAssinatura_avisoTemporario')
    if (existente) existente.remove()
    let corpo = document.querySelector('#rota_assistenteAssinatura-corpo')
    if (!corpo) return
    // 'corpo' não tem position:relative, então vira containing-block do
    // aviso (absolute) — sem isso o navegador sobe até o wrapper
    // (position:fixed), que é onde o antigo bug de largura mora.
    corpo.style.position = corpo.style.position || 'relative'
 
    let z = (typeof ROTA_Z !== 'undefined' ? (ROTA_Z.aviso ?? 9999) : 9999) + 1
    let aviso = document.createElement('div')
    aviso.id = 'rota_assistenteAssinatura_avisoTemporario'
    Object.assign(aviso.style, {
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        background: '#2c3e50',
        color: '#ffffff',
        borderLeft: '4px solid #ffa726',
        borderRadius: '6px',
        padding: '10px 16px',
        fontSize: '12px',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
        zIndex: String(z),
        width: '90%',
        boxSizing: 'border-box',
        textAlign: 'center',
    })
    aviso.textContent = msg
    corpo.appendChild(aviso)
 
    setTimeout(() => aviso.remove(), duracaoMs)
}


// ── Limpeza do HTML da minuta ──────────────────────────────────────
//
// O HTML que vem do PJe traz cabeçalho com brasão, folhas de estilo e
// atributos do editor. Aqui fica só o texto e a formatação que o
// servidor usa pra sinalizar trechos: negrito, itálico, sublinhado,
// tachado e cores (fonte e realce). Tudo o mais é desembrulhado — a
// tag some, o texto fica.
//
// Cor definida por CLASSE de folha de estilo se perde, porque as
// folhas são removidas. Se aparecer uma minuta assim, o caminho é
// mapear a classe pra uma cor aqui dentro.

const ROTA_ASSISTENTE_ASSINATURA_TAGS_REMOVIDAS = [
    'head', 'title', 'base', 'meta', 'link', 'style', 'script', 'noscript',
    'img', 'picture', 'source', 'svg', 'canvas', 'iframe', 'object', 'embed',
    'video', 'audio', 'form', 'input', 'button', 'select', 'textarea',
]

const ROTA_ASSISTENTE_ASSINATURA_TAGS_MANTIDAS = [
    'P', 'BR', 'DIV', 'SPAN', 'B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'DEL', 'INS',
    'FONT', 'MARK', 'UL', 'OL', 'LI', 'DL', 'DT', 'DD',
    'TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TR', 'TD', 'TH', 'CAPTION',
    'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'PRE', 'SUP', 'SUB', 'SMALL', 'HR', 'CENTER',
]

const ROTA_ASSISTENTE_ASSINATURA_ESTILOS_MANTIDOS = [
    'color', 'background', 'background-color',
    'font-weight', 'font-style',
    'text-decoration', 'text-decoration-line', 'text-decoration-color',
    'text-align',
]

function rota_assistenteAssinatura_limpaAtributos(el) {
    let estilos = []
    let anota = (prop, valor) => {
        prop = String(prop ?? '').trim().toLowerCase()
        valor = String(valor ?? '').trim()
        if (prop === '' || valor === '') return
        if (!ROTA_ASSISTENTE_ASSINATURA_ESTILOS_MANTIDOS.includes(prop)) return
        if (/url\(|expression\(|javascript:/i.test(valor)) return
        estilos.push(prop + ':' + valor)
    }

    for (let parte of (el.getAttribute('style') || '').split(';')){
        let corte = parte.indexOf(':')
        if (corte === -1) continue
        anota(parte.slice(0, corte), parte.slice(corte + 1))
    }
    // equivalentes antigos que o editor do PJe ainda gera
    if (el.tagName === 'FONT') anota('color', el.getAttribute('color'))
    anota('background-color', el.getAttribute('bgcolor'))
    anota('text-align', el.getAttribute('align'))

    let colspan = el.getAttribute('colspan')
    let rowspan = el.getAttribute('rowspan')

    for (let attr of [...el.attributes]) el.removeAttribute(attr.name)

    if (estilos.length) el.setAttribute('style', estilos.join(';'))
    if (el.tagName === 'TD' || el.tagName === 'TH'){
        if (colspan) el.setAttribute('colspan', colspan)
        if (rowspan) el.setAttribute('rowspan', rowspan)
    }
}

function rota_assistenteAssinatura_limparHtmlMinuta(html = '') {
    let bruto = String(html ?? '')
    if (bruto.trim() === '') return ''

    // DOMParser não executa script nem baixa imagem: o documento nasce inerte
    let doc = new DOMParser().parseFromString(bruto, 'text/html')
    let raiz = doc?.body
    if (!raiz) return ''

    for (let el of [...raiz.querySelectorAll(ROTA_ASSISTENTE_ASSINATURA_TAGS_REMOVIDAS.join(','))]){
        el.remove()
    }

    // a célula do brasão fica vazia depois que a imagem sai e viraria um
    // retângulo com borda na tela — some com ela e com a linha/tabela que
    // sobrar sem nada dentro
    for (let seletor of ['td', 'th', 'tr', 'table']){
        for (let el of [...raiz.querySelectorAll(seletor)]){
            if (el.textContent.trim() === '' && !el.querySelector('br, hr')) el.remove()
        }
    }

    // ordem inversa = filhos antes dos pais, então desembrulhar um pai
    // nunca deixa filho por limpar
    for (let el of [...raiz.querySelectorAll('*')].reverse()){
        if (!ROTA_ASSISTENTE_ASSINATURA_TAGS_MANTIDAS.includes(el.tagName)){
            el.replaceWith(...el.childNodes)
            continue
        }
        rota_assistenteAssinatura_limpaAtributos(el)
    }
    return raiz.innerHTML
}

// extrairHtml pode devolver a string crua, um objeto com o HTML dentro
// ou uma lista — normaliza os três num texto só
function rota_assistenteAssinatura_normalizaHtml(valor) {
    if (!valor) return ''
    if (typeof valor === 'string') return valor
    if (Array.isArray(valor)) return valor.map(rota_assistenteAssinatura_normalizaHtml).filter(Boolean).join('')
    for (let chave of ['html', 'conteudo', 'texto', 'documento', 'teor', 'minuta', 'valor']){
        let v = valor?.[chave]
        if (typeof v === 'string' && v.trim() !== '') return v
    }
    return ''
}


// ── rota_assistenteAssinatura_abrirPainelMinutas ───────────────────
//
// Abre a div flutuante (60% largura, 80% altura, centralizada) já no
// clique do botão e vai recebendo os processos um a um, conforme a
// busca responde. Fecha no ✕, no Esc ou no clique fora da caixa —
// clique dentro não fecha, senão não dá pra rolar nem selecionar texto.
//
// let painel = rota_assistenteAssinatura_abrirPainelMinutas()
// painel.definirStatus('Buscando 1 de 12…')
// painel.adicionarProcesso(numero, documentos)   // documentos: [{titulo, html}]
// painel.adicionarProcesso(numero, [], 'Processo não localizado.')
// painel.definirVazio(texto) / painel.aberto() / painel.fechar()

function rota_assistenteAssinatura_abrirPainelMinutas() {
    document.querySelector('#rota_assistenteAssinatura_painelMinutas')?.remove()

    let z = (typeof ROTA_Z !== 'undefined' ? (ROTA_Z.aviso ?? 9999) : 9999) + 2
    let overlay = document.createElement('div')
    overlay.id = 'rota_assistenteAssinatura_painelMinutas'
    Object.assign(overlay.style, {
        position: 'fixed', inset: '0',
        background: 'rgba(0,0,0,0.5)',
        zIndex: String(z),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
    })

    // o CSS da página do PJe alcança o conteúdo injetado; estas regras
    // são escritas com id + classe pra ganhar em especificidade
    let estilo = document.createElement('style')
    estilo.textContent = `
#rota_assistenteAssinatura_painelMinutas .rota-minuta-processo { border:1px solid #dfe4ea; border-radius:6px; margin:0 0 14px; overflow:hidden; background:#ffffff; }
#rota_assistenteAssinatura_painelMinutas .rota-minuta-numero { background:#f9f9fa; border-left:4px solid #ffa726; padding:8px 12px; font-family:'Segoe UI',system-ui,sans-serif; font-size:13px; font-weight:700; color:#0078aa; }
#rota_assistenteAssinatura_painelMinutas .rota-minuta-doc { padding:12px 16px; border-top:1px solid #eef1f4; }
#rota_assistenteAssinatura_painelMinutas .rota-minuta-doc-titulo { font-family:'Segoe UI',system-ui,sans-serif; font-size:11px; letter-spacing:.04em; text-transform:uppercase; color:#6b7c93; margin:0 0 8px; }
#rota_assistenteAssinatura_painelMinutas .rota-minuta-aviso { padding:10px 12px; font-family:'Segoe UI',system-ui,sans-serif; font-size:12px; font-style:italic; color:#6b7c93; }
#rota_assistenteAssinatura_painelMinutas .rota-minuta-conteudo { font-family:Georgia,'Times New Roman',serif; font-size:14px; line-height:1.6; color:#1f2d3d; word-break:break-word; }
#rota_assistenteAssinatura_painelMinutas .rota-minuta-conteudo p { margin:0 0 10px; }
#rota_assistenteAssinatura_painelMinutas .rota-minuta-conteudo div { margin:0; }
#rota_assistenteAssinatura_painelMinutas .rota-minuta-conteudo h1,
#rota_assistenteAssinatura_painelMinutas .rota-minuta-conteudo h2,
#rota_assistenteAssinatura_painelMinutas .rota-minuta-conteudo h3,
#rota_assistenteAssinatura_painelMinutas .rota-minuta-conteudo h4,
#rota_assistenteAssinatura_painelMinutas .rota-minuta-conteudo h5,
#rota_assistenteAssinatura_painelMinutas .rota-minuta-conteudo h6 { font-size:15px; margin:14px 0 6px; }
#rota_assistenteAssinatura_painelMinutas .rota-minuta-conteudo ul,
#rota_assistenteAssinatura_painelMinutas .rota-minuta-conteudo ol { margin:0 0 10px 22px; padding:0; }
#rota_assistenteAssinatura_painelMinutas .rota-minuta-conteudo table { border-collapse:collapse; width:100%; margin:0 0 10px; }
#rota_assistenteAssinatura_painelMinutas .rota-minuta-conteudo td,
#rota_assistenteAssinatura_painelMinutas .rota-minuta-conteudo th { border:1px solid #dfe4ea; padding:4px 6px; vertical-align:top; }
#rota_assistenteAssinatura_painelMinutas .rota-minuta-conteudo hr { border:none; border-top:1px solid #dfe4ea; margin:10px 0; }
#rota_assistenteAssinatura_painelMinutas .rota-minuta-conteudo blockquote { margin:0 0 10px 16px; }
`
    overlay.appendChild(estilo)

    let caixa = document.createElement('div')
    Object.assign(caixa.style, {
        background: '#ffffff',
        borderRadius: '8px',
        width: '60vw',
        height: '80vh',
        boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        cursor: 'default',
    })

    let cabecalho = document.createElement('div')
    Object.assign(cabecalho.style, {
        background: '#0078aa',
        color: '#ffffff',
        padding: '10px 16px',
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        flexShrink: '0',
    })

    let tituloPainel = document.createElement('div')
    tituloPainel.textContent = 'Documentos a assinar'
    tituloPainel.style.fontWeight = '700'

    let status = document.createElement('div')
    status.id = 'rota_assistenteAssinatura_painelMinutas_status'
    Object.assign(status.style, {flex: '1', fontSize: '12px', opacity: '0.9'})

    let botaoFechar = document.createElement('button')
    botaoFechar.type = 'button'
    botaoFechar.textContent = '✕'
    botaoFechar.title = 'Fechar (Esc)'
    Object.assign(botaoFechar.style, {
        background: 'transparent',
        border: 'none',
        color: '#ffffff',
        fontSize: '15px',
        lineHeight: '1',
        padding: '2px 4px',
        cursor: 'pointer',
    })

    cabecalho.appendChild(tituloPainel)
    cabecalho.appendChild(status)
    cabecalho.appendChild(botaoFechar)

    let corpo = document.createElement('div')
    Object.assign(corpo.style, {
        padding: '14px 18px',
        overflowY: 'auto',
        flex: '1',
        background: '#f9f9fa',
    })

    let vazio = document.createElement('div')
    Object.assign(vazio.style, {
        fontSize: '12px',
        color: '#6b7c93',
        textAlign: 'center',
        padding: '24px 0',
    })
    vazio.textContent = 'Procurando os documentos dos processos desta tela…'
    corpo.appendChild(vazio)

    caixa.appendChild(cabecalho)
    caixa.appendChild(corpo)
    overlay.appendChild(caixa)
    document.body.appendChild(overlay)

    function fechar() {
        document.removeEventListener('keydown', aoTeclar)
        overlay.remove()
    }
    function aoTeclar(e) {
        if (e.key === 'Escape') fechar()
    }
    document.addEventListener('keydown', aoTeclar)
    botaoFechar.addEventListener('click', fechar)
    // só o clique fora da caixa fecha — dentro é preciso rolar e selecionar
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) fechar()
    })

    function definirStatus(texto = '') {
        status.textContent = texto
    }
    function definirVazio(texto = '') {
        vazio.textContent = texto
    }
    function aberto() {
        return document.body.contains(overlay)
    }

    function adicionarProcesso(numero, documentos = [], aviso = '') {
        vazio.style.display = 'none'

        let bloco = document.createElement('div')
        bloco.className = 'rota-minuta-processo'
        bloco.dataset.processo = numero || ''

        let numeroEl = document.createElement('div')
        numeroEl.className = 'rota-minuta-numero'
        numeroEl.textContent = numero || '—'
        bloco.appendChild(numeroEl)

        if (aviso || !documentos.length){
            let avisoEl = document.createElement('div')
            avisoEl.className = 'rota-minuta-aviso'
            avisoEl.textContent = aviso || 'Sem documento pendente de assinatura.'
            bloco.appendChild(avisoEl)
        } else {
            for (let doc of documentos){
                let caixaDoc = document.createElement('div')
                caixaDoc.className = 'rota-minuta-doc'

                if (doc?.titulo){
                    let tituloDoc = document.createElement('div')
                    tituloDoc.className = 'rota-minuta-doc-titulo'
                    tituloDoc.textContent = doc.titulo
                    caixaDoc.appendChild(tituloDoc)
                }

                let conteudo = document.createElement('div')
                conteudo.className = 'rota-minuta-conteudo'
                conteudo.innerHTML = rota_assistenteAssinatura_limparHtmlMinuta(doc?.html)
                caixaDoc.appendChild(conteudo)

                bloco.appendChild(caixaDoc)
            }
        }

        corpo.appendChild(bloco)
        return bloco
    }

    return {aberto, fechar, definirStatus, definirVazio, adicionarProcesso}
}


// ── rota_assistenteAssinatura_abrirCompiladoProcesso ───────────────
//
// Abre uma divFlutuante (60% largura, 80% altura, centralizada)
// com o compilado do TEOR de cada manifestação (documento) do
// processo, com os TERMOS buscados destacados na cor da regra que
// os encontrou. Clicar em qualquer lugar da div fecha.
//
// rota_assistenteAssinatura_abrirCompiladoProcesso(processo)
//   processo: { processo: <numero>, documentos: [{idUnicoDocumento, dados, teor}] }

function rota_assistenteAssinatura_escapeHtml(s = '') {
    return String(s)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
}

// monta o HTML do teor com os trechos casados (dado.busca[].inicio/fim)
// envolvidos em <mark> na cor da regra (dado.cor). Sobreposições entre
// termos são resolvidas mantendo a primeira ocorrência (por posição).
function rota_assistenteAssinatura_destacarTermos(teor = '', dados = []) {
    let marcas = []
    for (let d of (dados || [])){
        for (let m of (d?.busca || [])){
            if (m && typeof m.inicio === 'number' && typeof m.fim === 'number' && m.fim > m.inicio){
                marcas.push({inicio: m.inicio, fim: m.fim, cor: d?.cor})
            }
        }
    }
    marcas.sort((a, b) => a.inicio - b.inicio)

    let semSobreposicao = []
    let fimAnterior = -1
    for (let m of marcas){
        if (m.inicio >= fimAnterior){
            semSobreposicao.push(m)
            fimAnterior = m.fim
        }
    }

    let html = ''
    let cursor = 0
    for (let m of semSobreposicao){
        let inicio = Math.max(cursor, Math.min(m.inicio, teor.length))
        let fim = Math.max(inicio, Math.min(m.fim, teor.length))
        html += rota_assistenteAssinatura_escapeHtml(teor.slice(cursor, inicio))
        html += '<mark style="background:' + (m.cor || '#ffd500') + ';color:#03071e;border-radius:2px;padding:0 1px;">'
            + rota_assistenteAssinatura_escapeHtml(teor.slice(inicio, fim)) + '</mark>'
        cursor = fim
    }
    html += rota_assistenteAssinatura_escapeHtml(teor.slice(cursor))
    return html
}

function rota_assistenteAssinatura_abrirCompiladoProcesso(processo) {
    document.querySelector('#rota_assistenteAssinatura_compiladoOverlay')?.remove()

    let z = (typeof ROTA_Z !== 'undefined' ? (ROTA_Z.aviso ?? 9999) : 9999) + 2
    let overlay = document.createElement('div')
    overlay.id = 'rota_assistenteAssinatura_compiladoOverlay'
    Object.assign(overlay.style, {
        position: 'fixed', inset: '0',
        background: 'rgba(0,0,0,0.5)',
        zIndex: String(z),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        cursor: 'pointer',
    })

    let caixa = document.createElement('div')
    Object.assign(caixa.style, {
        background: '#ffffff',
        borderRadius: '8px',
        width: '60vw',
        height: '80vh',
        boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
    })

    let cabecalho = document.createElement('div')
    Object.assign(cabecalho.style, {
        background: '#0078aa',
        color: '#ffffff',
        padding: '10px 16px',
        fontWeight: '700',
        fontSize: '13px',
        flexShrink: '0',
    })
    cabecalho.textContent = 'Compilado — Processo ' + (processo?.processo ?? '—')

    let corpo = document.createElement('div')
    Object.assign(corpo.style, {
        padding: '14px 18px',
        overflowY: 'auto',
        flex: '1',
        fontSize: '13px',
        lineHeight: '1.5',
        color: '#2c3e50',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
    })

    let documentos = processo?.documentos || []
    if (!documentos.length){
        corpo.textContent = 'Nenhum documento encontrado para este processo.'
    } else {
        // 'data' é placeholder (ver comentário em buscarTextosAAssinar) — ordena do
        // jeito que der por enquanto, sem quebrar se vier vazio/inválido
        let porData = (a, b) => {
            let da = a?.data ? new Date(a.data).getTime() : 0
            let db = b?.data ? new Date(b.data).getTime() : 0
            return (da || 0) - (db || 0)
        }
        let encontrados = documentos.filter(doc => (doc?.dados || []).length > 0).sort(porData)
        let naoEncontrados = documentos.filter(doc => !(doc?.dados || []).length).sort(porData)

        let divisor = '─'.repeat(59)
        let blocoDoc = doc => {
            let teorDestacado = rota_assistenteAssinatura_destacarTermos(doc?.teor || '', doc?.dados)
            return '<div style="margin-bottom:16px;">'
                + '<div style="color:#6b7c93;">' + divisor + '</div>'
                + '<div style="font-weight:700;margin:4px 0;">id: ' + rota_assistenteAssinatura_escapeHtml(doc?.idUnicoDocumento ?? '—') + '</div>'
                + '<div>' + teorDestacado + '</div>'
                + '</div>'
        }

        let html = encontrados.map(blocoDoc).join('')
        if (naoEncontrados.length){
            if (encontrados.length){
                html += '<div style="color:#6b7c93;font-weight:700;margin:6px 0 10px;">— Sem termos encontrados —</div>'
            }
            html += naoEncontrados.map(blocoDoc).join('')
        }
        corpo.innerHTML = html
    }

    caixa.appendChild(cabecalho)
    caixa.appendChild(corpo)
    overlay.appendChild(caixa)
    document.body.appendChild(overlay)

    // clicar em qualquer lugar (overlay ou dentro da caixa, já que o clique borbulha) fecha
    overlay.addEventListener('click', () => overlay.remove())
}


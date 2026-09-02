


// ── Constantes ───────────────────────────────────────────────────────────────
const DEVOLVER_GIG_URL_REGEX = /processo\/\d{7}\/detalhe/

function devolverGig() {
    adicionarBotoesDevolverGig()
}



// ── Observa mudanças no DOM (Angular renderiza async) ────────────────────────
let _devolverGig_debounce = null
const _devolverGig_observer = new MutationObserver(() => {
    clearTimeout(_devolverGig_debounce)
    _devolverGig_debounce = setTimeout(adicionarBotoesDevolverGig, 300)
})
_devolverGig_observer.observe(document.body, { childList: true, subtree: true })

devolverGig()



// ── Funções auxiliares ───────────────────────────────────────────────────────
function devolverGig_extrairNome(trElement) {
    const todosSrOnly = trElement.querySelectorAll('p.sr-only')
    const srOnly = [...todosSrOnly].find(p => /Cria|Altera/.test(p.textContent))
    if (!srOnly) return null
    const texto = srOnly.textContent || ''
    const match = texto.match(/Altera(?:ção|cao):\s+([A-ZÁÉÍÓÚÀÂÊÔÃÕÜÇ ]+?)\s+em\s/)
                || texto.match(/Cria(?:ção|cao):\s+([A-ZÁÉÍÓÚÀÂÊÔÃÕÜÇ ]+?)\s+em\s/)
    return match ? match[1].trim() : null
}

function devolverGig_extrairDescricao(trElement) {
    const span = trElement.querySelector('span.descricao')
    if (!span) return ''
    const b = span.querySelector('b')
    const prefixo = b ? b.innerText + ':' : ''
    let texto = span.innerText.trim()
    if (prefixo && texto.startsWith(prefixo)) {
        texto = texto.slice(prefixo.length).trimStart()
    }
    return texto
}

function devolverGig_setNativeValue(element, value) {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        element.tagName === 'TEXTAREA'
            ? window.HTMLTextAreaElement.prototype
            : window.HTMLInputElement.prototype,
        'value'
    ).set
    nativeInputValueSetter.call(element, value)
    element.dispatchEvent(new Event('input',  { bubbles: true }))
    element.dispatchEvent(new Event('change', { bubbles: true }))
}

function devolverGig_aguardarElemento(seletor, timeout = 10000) {
    return new Promise((resolve, reject) => {
        const el = document.querySelector(seletor)
        if (el) return resolve(el)
        const obs = new MutationObserver(() => {
            const found = document.querySelector(seletor)
            if (found) {
                obs.disconnect()
                resolve(found)
            }
        })
        obs.observe(document.body, { childList: true, subtree: true })
        setTimeout(() => {
            obs.disconnect()
            reject(new Error(`Timeout aguardando: ${seletor}`))
        }, timeout)
    })
}

async function devolverGig_executarDevolucao(btnEditar, nome, descricao) {
    btnEditar.click()

    try {
        await devolverGig_aguardarElemento('[aria-label="Salva as alterações"]')
        await new Promise(r => setTimeout(r, 400))

        // ---- Responsável ----
        const inputResponsavel = document.querySelector('input[formcontrolname="responsavel"]')
        if (inputResponsavel && nome) {
            inputResponsavel.focus()
            devolverGig_setNativeValue(inputResponsavel, '')
            await new Promise(r => setTimeout(r, 200))
            devolverGig_setNativeValue(inputResponsavel, nome)
            await new Promise(r => setTimeout(r, 600))
            const primeiraOpcao = document.querySelector('mat-option')
            if (primeiraOpcao) primeiraOpcao.click()
        }

        // ---- Observação ----
        const textarea = document.querySelector('textarea[formcontrolname="observacao"]')
        if (textarea) {
            const novaObservacao = `FEITO. Devolvendo.\n${descricao}`
            textarea.focus()
            devolverGig_setNativeValue(textarea, novaObservacao)
        }

    } catch (err) {
        console.error('[Devolver GIG] Erro aguardando formulário:', err)
    }
}

function adicionarBotoesDevolverGig() {
    if (!DEVOLVER_GIG_URL_REGEX.test(location.pathname)) return

    const tabela = document.getElementById('tabela-atividades')
    if (!tabela) return

    const linhas = tabela.querySelectorAll('tbody tr')
    linhas.forEach(tr => {
        if (tr.querySelector('.btn-devolver-gig')) return

        const nome      = devolverGig_extrairNome(tr)
        const descricao = devolverGig_extrairDescricao(tr)
        if (!nome) return

        const btnTrash  = tr.querySelector('[id^="excluir-atividade-"]')
        if (!btnTrash) return

        const btnEditar = tr.querySelector('[id^="editar-atividade-"]')
        if (!btnEditar) return

        const btn = document.createElement('button')
        btn.type      = 'button'
        btn.className = 'btn-devolver-gig mat-focus-indicator mat-tooltip-trigger icone-clicavel mat-icon-button mat-button-base'
        btn.setAttribute('mattooltip', 'Devolver para quem criou ou alterou o GIG')
        btn.setAttribute('aria-label', 'Devolver para quem criou ou alterou o GIG')
        btn.title = `Devolver para: ${nome}`
        btn.innerHTML = `
            <span class="mat-button-wrapper">
                <i aria-hidden="true" class="far fa-share-square botao-icone-tabela"></i>
            </span>
            <span matripple="" class="mat-ripple mat-button-ripple mat-button-ripple-round"></span>
            <span class="mat-button-focus-overlay"></span>
        `
        btn.style.cssText = 'min-width: 20px !important; width: 20px !important; height: 0px !important; padding: 0 !important; margin: 0 !important; line-height: 20px !important;'

        btn.addEventListener('click', () => {
            devolverGig_executarDevolucao(btnEditar, nome, descricao)
        })

        btnTrash.insertAdjacentElement('afterend', btn)
    })
}
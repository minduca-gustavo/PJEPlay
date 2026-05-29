// ============================================================
// interceptador-documento.js
// Escuta RotaDocumentoInterceptado, busca o conteúdo e salva
// como metatag rota-documentos_conteudo no <head>.
// ============================================================

interceptador_documento_iniciar()

function interceptador_documento_iniciar(){
    document.addEventListener('RotaDocumentoInterceptado', interceptador_documento_processar)
}

async function interceptador_documento_processar(evento){
    let { url, status } = evento.detail
    if(status !== 200) return

    try {
        let resposta = await fetch(url, { credentials: 'include' })
        let tipo     = resposta.headers.get('Content-Type') || ''
        let dados

        if(tipo.includes('application/json')){
            dados = await resposta.json()
            interceptador_documento_salvar(url, JSON.stringify(dados), 'json')
        } else if(tipo.includes('text/html') || tipo.includes('text/')){
            dados = await resposta.text()
            interceptador_documento_salvar(url, dados, 'html')
        } else {
            // PDF ou binário — salva só a URL e o tipo
            interceptador_documento_salvar(url, null, tipo)
        }

    } catch(erro) {
        console.warn('[Rota] interceptador_documento_processar erro:', erro)
    }
}

function interceptador_documento_salvar(url = '', conteudo = null, tipo = ''){
    let name    = 'rota-documentos_conteudo'
    let payload = JSON.stringify({ url, tipo, conteudo })

    let meta = document.head.querySelector(`meta[name="${name}"]`)
    if(meta){
        meta.setAttribute('content', payload)
    } else {
        meta = document.createElement('meta')
        meta.setAttribute('name', name)
        meta.setAttribute('content', payload)
        document.head.appendChild(meta)
    }

    document.dispatchEvent(
        new CustomEvent('RotaMetaTagAtualizada', {
            detail: { rotulo: 'documentos_conteudo', url: name }
        })
    )
}

// ── Leitura ──────────────────────────────────────────────────

function interceptador_lerDocumentosConteudo(){
    let meta = document.head.querySelector('meta[name="rota-documentos_conteudo"]')
    if(!meta) return null
    try { return JSON.parse(meta.getAttribute('content')) } catch { return null }
}
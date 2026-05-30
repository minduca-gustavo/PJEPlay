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

        if(tipo.includes('application/json')){
            let json  = await resposta.json()
            let b64   = json.conteudoBase64.trim()
            let bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
            let html  = new TextDecoder('iso-8859-1').decode(bytes)

            if(html.startsWith('%PDF')){
                let resp = await NAVEGADOR.runtime.sendMessage({
                    tipo: 'EXTRAIR_PDF', bytes: Array.from(bytes)
                })
                if(!resp.ok) throw new Error(resp.erro)
                interceptador_documento_salvar(url, resp.texto, 'texto')  // ← texto extraído
            } else {
                let doc = new DOMParser().parseFromString(html, 'text/html')
                interceptador_documento_salvar(url, doc.body.innerText, 'texto')
            }

        } else if(tipo.includes('application/pdf')){
            let bytes = Array.from(new Uint8Array(await resposta.arrayBuffer()))
            let resp  = await NAVEGADOR.runtime.sendMessage({
                tipo: 'EXTRAIR_PDF', bytes
            })
            if(!resp.ok) throw new Error(resp.erro)
            interceptador_documento_salvar(url, resp.texto, 'texto')  // ← texto extraído

        } else {
            interceptador_documento_salvar(url, await resposta.text(), 'texto')
        }

    } catch(erro){
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
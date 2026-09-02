// ============================================================
// requisicoes/documento.js
// Escuta RotaDocumentoInterceptado (requisicoes/xhr.js), busca o
// conteúdo do documento e guarda o texto extraído na metatag
// prefixar('documentos_conteudo') no <head>.
// ============================================================

interceptador_documento_iniciar()

function interceptador_documento_iniciar(){
    document.addEventListener('RotaDocumentoInterceptado', interceptador_documento_processar)
}

async function interceptador_documento_processar(evento){

    let { url, status } = evento.detail
    if(status !== 200) return

    relatar('Documento interceptado:', url, 'requisicao')

    try{
        let resposta = await fetch(url, { credentials: 'include' })
        let tipo     = resposta.headers.get('Content-Type') || ''

        if(tipo.includes('application/json')){
            let json  = await resposta.json()
            let b64   = json.conteudoBase64.trim()
            let bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
            let html  = new TextDecoder('iso-8859-1').decode(bytes)

            if(html.startsWith('%PDF')){
                interceptador_documento_salvar(url, await interceptador_documento_pdf(bytes), 'texto')
            } else {
                // textoParaDOM() — modulos/texto.js
                let doc = textoParaDOM(html)
                interceptador_documento_salvar(url, doc.body.innerText, 'texto')
            }

        } else if(tipo.includes('application/pdf')){
            let bytes = new Uint8Array(await resposta.arrayBuffer())
            interceptador_documento_salvar(url, await interceptador_documento_pdf(bytes), 'texto')

        } else {
            interceptador_documento_salvar(url, await resposta.text(), 'texto')
        }

    } catch(erro){
        relatar('interceptador_documento_processar:', erro, 'erro')
    }
}


/**
 * Delega a extração ao segundo plano, que é onde o pdf.js vive.
 */
async function interceptador_documento_pdf(bytes){
    let resposta = await NAVEGADOR.runtime.sendMessage({
        tipo:  'EXTRAIR_PDF',
        bytes: Array.from(bytes)
    })
    if(!resposta?.ok) throw new Error(resposta?.erro || 'Falha ao extrair o PDF.')
    return resposta.texto
}


function interceptador_documento_salvar(url = '', conteudo = null, tipo = ''){

    let rotulo = 'documentos_conteudo'

    // modulos/dom.js — serializa o objeto e cria/substitui a <meta>
    criar_metaTag(rotulo, { url, tipo, conteudo })

    document.dispatchEvent(
        new CustomEvent('RotaMetaTagAtualizada', {
            detail: { rotulo, url: rota_metaTag_nome(rotulo) }
        })
    )
}


// ── Leitura ──────────────────────────────────────────────────

function interceptador_lerDocumentosConteudo(){
    return interceptador_ler('documentos_conteudo')
}

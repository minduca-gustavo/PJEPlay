// ============================================================
// navegador/segundo-plano.js — background script
// ============================================================

let _PRONTO = (async () => {
	CONFIGURACAO = await obterArmazenamento()
})()

NAVEGADOR.runtime.onMessage.addListener((msg, _remetente, responder) => {
	_processar(); return true
	async function _processar(){
		await _PRONTO
		if(msg.tipo === 'EXTRAIR_PDF'){
			try{
				let texto = await _extrairPDF(new Uint8Array(msg.bytes))
				responder({ ok:true, texto })
			} catch(e){
				responder({ ok:false, erro: e.message })
			}
		}
	}
})

async function _extrairPDF(bytes){
	let raiz   = NAVEGADOR.runtime.getURL('')
	let pdfjs  = await import(raiz + 'utils/pdfjs.mjs')
	pdfjs.GlobalWorkerOptions.workerSrc = raiz + 'utils/pdfjs.worker.mjs'
	let doc    = await pdfjs.getDocument({ data: bytes }).promise
	let texto  = ''
	for(let i = 1; i <= doc.numPages; i++){
		let pag = await doc.getPage(i)
		let c   = await pag.getTextContent()
		texto  += c.items.map(it => it.str).join(' ') + '\n'
	}
	return texto
}


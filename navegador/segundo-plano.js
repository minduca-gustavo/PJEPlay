// ============================================================
// navegador/segundo-plano.js — background script
// ============================================================

let _PRONTO = (async () => {
	CONFIGURACAO = await obterArmazenamento()
	await _semearTarefaPadrao()
})()


// ── Seed da tarefa padrão ──────────────────────────────────────
//
// Sem isso, um usuário novo que nunca abre o popup fica sem
// nenhuma tarefa 👤 no menu do botão Rota, e o rótulo do botão
// mostra '—' porque tarefaAtiva nunca foi gravada. A seed do
// popup (programa.js) continua existindo como reforço — esta
// aqui garante o caso de o usuário só usar o botão em tela.
//
// Roda a cada início do background (não só via runtime.onInstalled)
// porque esse evento não dispara de forma confiável em extensões
// temporárias carregadas via about:debugging — só em instalações
// reais. catalogo_garantirTarefaAtiva() (rota/tarefas/index.js) é
// idempotente: só escreve quando falta algo, então chamá-la toda
// vez que o background acorda não tem custo nem risco de sobrescrever
// uma tarefa já em uso.

async function _semearTarefaPadrao(){
	try{
		await catalogo_garantirTarefaAtiva()
	} catch(e){
		relatar('_semearTarefaPadrao: erro ao gravar tarefa padrão', e, 'rota')
	}
}

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
/**
 * navegador/segundo-plano.js — Rota PJE
 *
 * Base herdada do SISE (mesmo protocolo de mensagens), porque é
 * ele que modulos/navegador.js espera do outro lado de
 * abrirURL(), extensao_recarregar(), recarregarAba(), aba_fechar()
 * e capturarImagemDeElemento(). Mexer aqui é mexer no contrato
 * com a pasta modulos/.
 *
 * Ao final do arquivo ficam as duas responsabilidades próprias do
 * Rota: a extração de texto de PDF (EXTRAIR_PDF, que precisa do
 * pdf.js e por isso não pode rodar no content script) e a semeadura
 * da tarefa padrão.
 */

let PRONTO = inicializar()

async function inicializar(){
	CONFIGURACAO	= await obterArmazenamento()
	relatar('Armazenamento Local:', CONFIGURACAO, 'configuracao')
	await definicoesGlobais()
	definirIconeDaExtensaoPeloEstado(CONFIGURACAO.ativa)
	await semearTarefaPadrao()
}


/**
 * Sem isto, um usuário novo que nunca abre o menu fica sem nenhuma
 * tarefa 👤 e o rótulo do botão Rota mostra '—'.
 *
 * Roda a cada início do segundo plano — não via runtime.onInstalled —
 * porque esse evento não dispara de forma confiável em extensões
 * temporárias carregadas por about:debugging.
 * catalogo_garantirTarefaAtiva() é idempotente.
 */
async function semearTarefaPadrao(){
	try{
		await catalogo_garantirTarefaAtiva()
	} catch(erro){
		relatar('semearTarefaPadrao:', erro, 'erro')
	}
}

NAVEGADOR.runtime.onInstalled.addListener(async () => {
	await PRONTO
	definirIconeDaExtensaoPeloEstado(CONFIGURACAO.ativa)
})

NAVEGADOR.runtime.onStartup.addListener(async () => {
	await PRONTO
	definirIconeDaExtensaoPeloEstado(CONFIGURACAO.ativa)
})

NAVEGADOR.runtime.onMessage.addListener((
	mensagem,
	remetente,
	responder
) => {

	processar()

	return true

	async function processar(){

		await PRONTO
	
		relatar('Mensagem Recebida:', {mensagem,remetente}, 'navegador')
	
		let {
			acao					= '',
			url						= '',
			configuracao	= '',
			requisicao		= '',
			tipo					= '',
			texto					= '',
			chave					= '',
			ativa					= true,
			incognito		 	= false,
			largura				= 0,
			altura				= 0,
			horizontal		= 0,
			vertical			= 0,
			capturar			= false,
			retangulo			= false,
			copiar				= true,
			processo			= '',
		} = mensagem
	
		if(requisicao){
			try{
				relatar('Requisição:',requisicao,'requisicao')
				let resposta = await fetch(requisicao, configuracao)
				relatar('Resposta:',resposta,'resposta')
				if(resposta.type === 'opaqueredirect')
					throw new Error('Redirecionamento bloqueado.')
				if(!resposta.ok)
					throw new Error(`HTTP ${resposta.status}`)
				let texto	= await resposta.text()	|| ''
				let dados = texto_ou_json(texto)	|| ''
				responder({sucesso:true, dados })
			} catch(erro){
				relatar('Erro:',erro,'erro')				
				responder({sucesso:false,erro:erro.message })
			}
			return
		}
	
		if(url){
			if(tipo === 'aba')
				criarAba({
					url,
					active:ativa
				})
			else
				criarJanela({
					url,
					chave,
					incognito,
					tipo,
					largura,
					altura,
					horizontal,
					vertical
				})
			esforcosPoupados({
				movimentos: 6,
				cliques:				4,
				teclas:				 contarCaracteres(url),
				segundos:		 caracteresParaSegundos(url)
			})
			return
		}
	
		if(acao === 'RecarregarExtensao'){
			relatar('Recarregando extensão…','','navegador')
			NAVEGADOR.runtime.reload()
			return
		}
		if(acao === 'RecarregarAba'){
			relatar('Recarregando aba…','','navegador')
			NAVEGADOR.tabs.reload(remetente.tab.id, {bypassCache:true})
			return
		}
	
		if(acao === 'FecharEstaAba' && remetente.tab){
			relatar('Fechando aba atual…', '', 'navegador')
			NAVEGADOR.tabs.remove(remetente.tab.id)
			return
		}
	
		if(acao === 'FecharAbaPorTitulo'){
			relatar('Fechando aba com título contendo: ', '"' + texto + '"', 'navegador')
			try{
				let abas = await NAVEGADOR.tabs.query({})
				let abaFechavel = abas.find(aba => aba.title && aba.title.includes(texto))
				relatar('Aba encontrada para fechamento:', abaFechavel, 'navegador')
				if(abaFechavel){
					relatar('Fechando aba:', abaFechavel.title, 'navegador')
					await NAVEGADOR.tabs.remove(abaFechavel.id)
					responder({sucesso:true })
				}
				else{
					responder({sucesso:false,erro:'Nenhuma aba encontrada' })
				}
			} catch(erro){
				responder({sucesso:false,erro:erro.message })
			}
			return
		}
	
		if(tipo === 'EXTRAIR_PDF'){
			try{
				let texto = await extrairTextoDePDF(new Uint8Array(mensagem.bytes))
				responder({ ok:true, texto })
			} catch(erro){
				relatar('EXTRAIR_PDF:', erro, 'erro')
				responder({ ok:false, erro:erro.message })
			}
			return
		}

		if(capturar === 'imagem'){
			try {
				let imagem = await capturarImagem({ retangulo, copiar })
				relatar('Imagem capturada:', imagem, 'navegador')
				responder(imagem)
			} catch(erro){
				responder({sucesso:false,erro:erro.message })
			}
			return
		}

	}
})


function criarAba(configuracao={}){
	relatar('Criando aba…','','navegador')
	relatar('Definindo opções:',configuracao,'navegador')
	NAVEGADOR.tabs.create(configuracao).then(
		() => relatar('Aba criada com sucesso!','','navegador')
	).catch(erro => relatar('Erro ao criar aba:', erro, 'erro'))
}


/**
 * Cria uma janela com os parâmetros determinados:
 * @param	{string}	url
 * @param	{string}	chave				Será usada para extrair configurações de ${CONFIGURACAO.janela[chave]}
 * @param	{integer}	largura
 * @param	{integer}	altura
 * @param	{integer}	horizontal
 * @param	{integer}	vertical
 * @param	{string} 	tipo				Ver https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/windows/CreateType
 */
async function criarJanela(configuracao = {}) {

	let {
		url					= 'about:blank',
		largura			= TELA.availWidth,
		altura			= TELA.availHeight,
		horizontal	= 0,
		vertical		= 0,
		chave				= 'nova',
		tipo				= 'normal',
		incognito		= false,
	} = configuracao

	let armazenamento = await NAVEGADOR.storage.local.get('janela')
	let janela = armazenamento?.janela || {}
	if (janela[chave]) {
		let valor = janela[chave]
		if (valor?.l) largura			= valor.l
		if (valor?.a) altura			= valor.a
		if (valor?.h) horizontal	= valor.h
		if (valor?.v) vertical		= valor.v
	}

	let opcoes = {
		url,
		incognito,
		height:	altura,
		left:		horizontal,
		top:		vertical,
		width:	largura,
		type:		tipo,
	}

	try{
		await NAVEGADOR.windows.create(opcoes)
	} catch(erro){
		relatar('Erro ao criar janela', erro, 'erro')
		throw erro
	}

}


/**
 * Extrai o texto de um PDF usando o pdf.js empacotado em utils/.
 * Vive no segundo plano porque o content script do PJe não permite
 * importar módulo dinâmico.
 */
async function extrairTextoDePDF(bytes){
	let raiz  = extensao_raiz('')
	let pdfjs = await import(raiz + 'utils/pdfjs.mjs')
	pdfjs.GlobalWorkerOptions.workerSrc = raiz + 'utils/pdfjs.worker.mjs'
	let doc   = await pdfjs.getDocument({ data: bytes }).promise
	let texto = ''
	for(let i = 1; i <= doc.numPages; i++){
		let pagina   = await doc.getPage(i)
		let conteudo = await pagina.getTextContent()
		texto += conteudo.items.map(item => item.str).join(' ') + '\n'
	}
	return texto
}

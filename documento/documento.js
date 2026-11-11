// ============================================================
// documento/documento.js
// Ponto de entrada dos content scripts do Rota PJE.
//
// Espelha documento/documento.js do SISE: carrega o storage na
// global CONFIGURACAO, roda definicoesGlobais() (que popula
// LINK, EXPRESSAO, CONTEXTO e semeia as chaves padrão), respeita
// o interruptor `ativa` e só então otimiza a página.
//
// Deve ser o ÚLTIMO script da lista do manifest.
// ============================================================

obterArmazenamento().then(async armazenamento => {

	// modulos/definicoes.js
	CONFIGURACAO = armazenamento

	await definicoesGlobais()

	// Traduz o antigo booleano modoDev para CONFIGURACAO.diagnostico.*
	// (nucleo/rota-nucleo.js)
	rota_nucleo_definirModoDev(CONFIGURACAO?.modoDev)

	relatar('Armazenamento local:', CONFIGURACAO, 'configuracao')

	if(!CONFIGURACAO.ativa){
		relatar('Extensão desativada pelo menu.', '', 'execucao')
		return
	}
	await limparArmazenamento(CONFIGURACAO)
	otimizar()

})

document.addEventListener('rotapje_limparArmazenamento', async (evento) => {
	console.log('%c[Rota PJE]%c ouviu' + JSON.stringify(36), LOG.aviso, 'color:inherit')
	let {agora} = JSON.parse(evento.detail) || {}
	await limparArmazenamento(CONFIGURACAO, agora)
	interceptador_salvarMetaTag(idg('armazenamentoLimpo'))
})

async function limparArmazenamento(configuracao, agora = false){
	console.log('%c[Rota PJE]%c agora' + JSON.stringify(agora), LOG.aviso, 'color:inherit')
	for (let key of Object.keys(configuracao)){
		let timestamp = key.includes('rotaJanela') ? Number(key.match(/\d{13}/)[0]) : null
		let comparacao = agora ? Date.now() : new Date().setHours(0,0,0,0)
		if (timestamp && (timestamp < comparacao)){
			await removerArmazenamento(key)
		}
	}
}

async function otimizar(){

	relatar('Iniciando o Rota PJE…', LOCAL, 'execucao')

	// modulos/definicoes.js — expõe os ícones como custom properties
	definirIcones()
	
	// documento/paginas/pje/pje.js
	rota()

	// modulos/janela.js — botão de memorizar dimensões da janela
	janela()

}

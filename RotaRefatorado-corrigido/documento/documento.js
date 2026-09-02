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

	otimizar()

})


async function otimizar(){

	relatar('Iniciando o Rota PJE…', LOCAL, 'execucao')

	// modulos/definicoes.js — expõe os ícones como custom properties
	definirIcones()

	// documento/paginas/pje/pje.js
	rota()

	// modulos/janela.js — botão de memorizar dimensões da janela
	janela()

}

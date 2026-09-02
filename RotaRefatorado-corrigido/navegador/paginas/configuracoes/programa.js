// ============================================================
// navegador/paginas/configuracoes/programa.js
// Espelha o programa.js da página de configurações do SISE.
//
// Toda a persistência é dos módulos: obterConfiguracoesDaExtensao()
// preenche os campos a partir de CONFIGURACAO, e
// salvarConfiguracoesDaExtensao() grava de volta lendo os
// atributos chave= da marcação. Aqui só há semeadura de padrões
// e ligação dos dois botões.
// ============================================================

window.addEventListener('load', programa)

async function programa(){

	CONFIGURACAO = await obterArmazenamento()

	await definicoesGlobais()
	await semearConfiguracoesDoRota()

	obterConfiguracoesDaExtensao()

	ativarBotao('#rotapje-salvar',     salvar)
	ativarBotao('#rotapje-recarregar', extensao_recarregar)

	selecionar('#rotapje-versao').textContent =
		EXTENSAO.name + ' — versão ' + EXTENSAO.version

}


/**
 * Cria o grupo `rota` na primeira abertura, migrando as chaves
 * planas antigas (habilitado, rota_evitaQuedaAtivo, modoDev) para
 * o formato agrupado que <funcionalidades chave="rota"> espera.
 */
async function semearConfiguracoesDoRota(){

	if(CONFIGURACAO?.rota !== undefined) return

	let rota = {
		botaoVisivel:        CONFIGURACAO?.habilitado !== false,
		evitaQueda:          CONFIGURACAO?.rota_evitaQuedaAtivo === true,
		assistentesVisiveis: true,
		larguraPje:          80,
	}

	await armazenar({ rota })
	CONFIGURACAO.rota = rota

	// modoDev antigo → liga todos os tipos de diagnóstico
	if(CONFIGURACAO?.modoDev === true){
		let diagnostico = CONFIGURACAO?.diagnostico || {}
		Object.keys(diagnostico).forEach(chave => diagnostico[chave] = true)
		await armazenar({ diagnostico })
		CONFIGURACAO.diagnostico = diagnostico
	}

}


async function salvar(){

	await salvarConfiguracoesDaExtensao()

	// Mantém as chaves planas em sincronia enquanto os scripts do
	// Rota ainda as leem diretamente (habilitado, rota_evitaQuedaAtivo).
	await armazenar({
		habilitado:           CONFIGURACAO?.rota?.botaoVisivel !== false,
		rota_evitaQuedaAtivo: CONFIGURACAO?.rota?.evitaQueda === true,
	})

	let botao = selecionar('#rotapje-salvar')
	await classe_adicionarEsperarRemover(botao, 'rotapje-encolher-crescer', 400)

}

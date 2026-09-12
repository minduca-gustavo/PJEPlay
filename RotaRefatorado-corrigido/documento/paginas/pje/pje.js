// ============================================================
// documento/paginas/pje/pje.js
// Substitui o antigo pje/iniciar.js.
//
// PONTO ÚNICO DE PARTIDA dos content scripts do Rota PJE.
// Nenhum outro arquivo deve se auto-executar: cada um apenas
// DECLARA suas funções; quem CHAMA é este arquivo.
//
// Organização:
//   rotaRegistrarMutacao()      → registro central de mutações
//   rota()                      → orquestra tudo
//   rota_iniciarInfra()         → 1x por documento, antes de tudo
//   rota_iniciarPermanentes()   → listeners/observers, 1x por documento
//   rota_iniciarRetomadas()     → retomada de fluxo após reload
//   rota_iniciarRoteiros()      → roteiros de tarefa (auto-guardados)
//   rota_aoAbrir()              → widget / botão, conforme a janela
//   rota_interfacePorContexto() → TUDO que depende da URL atual
//   rota_observarNavegacaoSPA() → dispara rota_interfacePorContexto()
//
// Fora daqui, de propósito:
//   requisicoes/xhr.js — roda em document_start, mundo MAIN.
//   Precisa ser o primeiro de todos e o manifest já garante isso.
// ============================================================

// ============================================================
// REGISTRO CENTRAL DE MUTAÇÕES
// ============================================================
//
// Vem do antigo iniciar.js (registro_mutacoes.js).
//
// Um observer só para o documento inteiro. Cada funcionalidade
// registra { seletor, callback } e é chamada quando um nó que
// casa com o seletor é ADICIONADO ao DOM.
//
// Só reage a addedNodes — remoções e mudanças de atributo passam
// batido. Por isso um callback que insere elemento dentro do
// próprio alvo não se realimenta: o nó inserido não casa com o
// seletor do alvo.
//
// E por isso também o observer não substitui a chamada direta:
// ele só vê o que entra DEPOIS de começar a observar. Quem já
// estava na tela precisa da passada de rota_interfacePorContexto().
//
// Exemplo de registro:
//   rotaRegistrarMutacao({
//     seletor:  '.assistente-assinatura-alvo',
//     callback: (el) => montarAssistenteAssinatura(el)
//   })

let ROTA_MUTACOES = []


function rotaRegistrarMutacao({ seletor, callback, umaVez = false }){
	ROTA_MUTACOES.push({ seletor, callback, umaVez })
}


function rotaIniciarObservadorCentral(raiz = document.body){

	let observer = new MutationObserver(mutacoes => {

		for(let mutacao of mutacoes){
			for(let node of mutacao.addedNodes){

				if(node.nodeType !== 1) continue   // só elementos

				for(let regra of [...ROTA_MUTACOES]){

					let alvo = node.matches?.(regra.seletor)
						? node
						: node.querySelector?.(regra.seletor)

					if(!alvo) continue

					regra.callback(alvo)

					if(regra.umaVez){
						let i = ROTA_MUTACOES.indexOf(regra)
						if(i > -1) ROTA_MUTACOES.splice(i, 1)
					}

				}

			}
		}

	})

	observer.observe(raiz, { childList:true, subtree:true })

	return observer

}


async function rota(){

	// Guarda deliberadamente ampla: o Rota atua não só no host do
	// PJe, mas também em sigeo, exe-pje, gigs e /aud. O escopo real
	// continua sendo o do manifest (*.jus.br), igual ao de antes —
	// esta guarda só existe para o caso de o content script ser
	// injetado programaticamente em outro lugar.
	if(!LOCAL.includes('.jus.br')){
		relatar('Fora do domínio da Justiça — Rota não atua aqui.', LOCAL, 'contexto')
		return
	}

	relatar('Otimizando o PJe…', CONTEXTO, 'execucao')

	// nucleo/rota-nucleo.js
	identificaUsuario()

	await rota_iniciarInfra()

	rota_iniciarPermanentes()
	rota_iniciarRetomadas()
	rota_iniciarRoteiros()

	await rota_aoAbrir()

	rota_observarNavegacaoSPA()

}


// ============================================================
// INFRA — roda uma vez, e antes de qualquer outra coisa
// ============================================================
//
// Ordem importa aqui:
//
// 1. Os interceptadores são só registro de listener (síncrono).
//    Vêm primeiro para não perder evento nenhum disparado pelo
//    xhr.js enquanto esperamos o resto.
//
// 2. detectarVersao() é AWAITADA. Antes ela se auto-executava sem
//    await e seletorPorVersao() — que é síncrona e lê a versão da
//    memória — podia rodar com o fallback. Era corrida garantida.
//    Nada que use seletor pode vir antes desta linha.

async function rota_iniciarInfra(){

	// requisicoes/interceptador.js
	interceptador_iniciar()

	// requisicoes/documento.js
	interceptador_documento_iniciar()

	// nucleo/seletores.js — precisa terminar antes dos seletores
	await detectarVersao()

	// nucleo/cache.js — limpeza de expirados, não bloqueia
	cache_limparExpirados()

}


// ============================================================
// PERMANENTES — listeners e observers, uma vez por documento
// ============================================================
//
// ATENÇÃO: nada aqui pode ser chamado de novo na navegação SPA,
// ou os listeners duplicam. Se algo precisa reagir à mudança de
// URL, o lugar é rota_interfacePorContexto().

function rota_iniciarPermanentes(){

	// nucleo/evita-queda.js
	window.addEventListener('focus', () => evitaQueda())
	evitaQueda()

	// nucleo/gigs.js — o Angular renderiza a tabela em momentos
	// imprevisíveis, então este observer é separado do ciclo de URL.
	rota_observarGigs()

	// gigs — botão de copiar atendimento. Registros de mutação:
	// uma vez por documento, nunca dentro do ciclo de URL.
	rotaRegistrarMutacao({ seletor: '#gigs',    callback: () => gig_copiaAtendimento() })
	rotaRegistrarMutacao({ seletor: '.actions', callback: () => gig_copiaAtendimento() })

	// Observador central — depois dos registros, por clareza.
	// A ordem não é obrigatória: o callback lê ROTA_MUTACOES na hora.
	rotaIniciarObservadorCentral()

}


function rota_observarGigs(){

	let debounce = null

	new MutationObserver(() => {
		clearTimeout(debounce)
		debounce = setTimeout(adicionarBotoesDevolverGig, 300)
	}).observe(document.body, { childList:true, subtree:true })

}


// ============================================================
// RETOMADAS — estado que sobreviveu a um reload
// ============================================================
//
// Não são awaitadas: cada uma se resolve sozinha contra o storage
// e desiste em silêncio se não houver nada pendente.

function rota_iniciarRetomadas(){

	// botao/janelas.js — fluxo persistido antes do reload por troca de OJ
	rota_fluxo_retomar()

	// nucleo/movimentar.js — destino pendente de movimentação
	rota_movimentar_retomar()

	// assistentes/consulta-qualquer-oj.js — abre os detalhes após o salto de OJ
	consulta_qualquer_ojAbreDetalhes()

}


// ============================================================
// ROTEIROS DE TAREFA
// ============================================================
//
// Todos se protegem sozinhos: confereJanela() + window.name +
// rotaExecucaoAtual. Chamar a lista inteira é exatamente o que já
// acontecia quando cada arquivo se auto-executava — a diferença é
// que agora dá para ler a lista em um lugar só.

function rota_iniciarRoteiros(){

	// tarefas/triagem-inicial/roteiro.js
	triagem_inicial_aoAbrirDetalhesDoProcesso()
	triagem_inicial_aoAbrirRetificar()
	triagem_inicial_aoAbrirDespachar()
	triagem_inicial_aoAbrirDesignarAudiencia()
	triagem_inicial_aoAbrirCertificar()
	triagem_inicial_aoAbrirIntimar()
	triagem_inicial_aoAbrirAguardandoAudiencia()

	// tarefas/con2-prazo-vencido/roteiro-con2-prazo-vencido.js
	con2_prazo_vencido_aoAbrirDetalhesDoProcesso()
	con2_prazo_vencido_aoAbrirRetificar()
	con2_prazo_vencido_aoAbrirDespachar()
	con2_prazo_vencido_aoAbrirDesignarAudiencia()
	con2_prazo_vencido_aoAbrirCertificar()
	con2_prazo_vencido_aoAbrirIntimar()
	con2_prazo_vencido_aoAbrirAguardandoAudiencia()

	// tarefas/visualizador-de-documentos/roteiro-visualizador-de-documentos.js
	visualizador_de_documentos_aoAbrirDetalhesDoProcesso()

}


// ============================================================
// ABERTURA — widget de janela filha ou botão de janela normal
// ============================================================

async function rota_aoAbrir(){

	let habilitado = CONFIGURACAO?.habilitado !== false   // padrão: habilitado

	// ── Janela filha aberta pelo fluxo (traz a sessão na URL) ──
	if(location.search.includes('rotapje_sessao=')){
		pinturaInicio().catch(e => relatar('Pintura:', e, 'erro'))
		rota_injetarWidget().catch(e => relatar('Widget:', e, 'erro'))
		return
	}

	// ── Janela filha que recarregou ────────────────────────────
	// sessionStorage sobrevive ao recarregamento e morre ao fechar a aba.
	const chaveJanela = sessionStorage.getItem('rotapje_chave_janela')
	if(chaveJanela){
		const ctx      = await obterArmazenamento(chaveJanela)
		const ctxSalvo = ctx?.[chaveJanela]
		if(ctxSalvo){
			relatar('Janela filha recarregada — restaurando widget…', '', 'execucao')
			pinturaInicio().catch(e => relatar('Pintura:', e, 'erro'))
			rota_injetarWidget(ctxSalvo).catch(e => relatar('Widget (restaurado):', e, 'erro'))
			return
		}
	}

	// ── Telas normais: respeita o interruptor ──────────────────
	if(!habilitado) return

	pinturaInicio().catch(e => relatar('Pintura:', e, 'erro'))
	botaoRota_iniciar()

	rota_interfacePorContexto()

}


// ============================================================
// INTERFACE POR CONTEXTO
// ============================================================
//
// Tudo que depende da URL atual e precisa ser remontado a cada
// navegação da SPA. É o "listener único de mudou" do desenho: as
// funções se guardam por confereJanela()/URL, então chamar todas
// é seguro em qualquer tela.
//
// Cada uma limpa o que deixou para trás ANTES de recriar — senão
// a navegação SPA duplica elemento.

function rota_interfacePorContexto(){

	// botao/fita-superior-detalhes.js
	remover('#rotapje-busca-posicao-fila-div-barra')
	confereCriaFitaSuperior()
	buscaPosicaoFilaPainelGlobal()

	// assistentes/compilador-de-assistentes.js
	compiladorDeAssistentes()

	// assistentes/quadro-juizesSempreVisivel.js
	visualizaQuadroDeJuizes()

	// nucleo/gigs.js — primeira tentativa; o observer cobre o resto
	devolverGig()

	// gigs — botão de copiar atendimento. Passada de recuperação:
	// o observador central só vê o que é adicionado depois dele,
	// então o que já estava na tela depende desta chamada.
	gig_copiaAtendimento()

	// nucleo/sigeo.js — só atua no sigeo.jt.jus.br, guarda interna
	sigeoAjJtAoIniciar()
	// documento/paginas/pje/gim/assina-tudo.js - só funciona no GIM - script para juízes assinarem tudo de uma vez.
	rotaAssinaTudo()

}


// ============================================================
// NAVEGAÇÃO SPA
// ============================================================
//
// O PJe é uma SPA: a URL muda sem recarregar o documento.
// Este observador é o único gatilho de remontagem. Ele ainda
// dispara 'rotapje:url-mudou' para quem estiver ouvindo de fora
// do content script (assistentes flutuantes), mas nenhum arquivo
// do pacote precisa mais registrar o próprio listener.

function rota_observarNavegacaoSPA(){

	let urlAnterior = LOCAL

	new MutationObserver(() => {

		if(location.href === urlAnterior) return
		urlAnterior = location.href

		relatar('Navegação SPA:', urlAnterior, 'mutacao')

		remover('#rotapje-widget')
		pinturaInicio().catch(() => {})

		if(location.search.includes('rotapje_sessao=')){
			rota_injetarWidget().catch(e => relatar('Widget (SPA):', e, 'erro'))
			return
		}

		const chaveJanela = sessionStorage.getItem('rotapje_chave_janela')

		if(chaveJanela){
			obterArmazenamento(chaveJanela).then(ctx => {
				const ctxSalvo = ctx?.[chaveJanela]
				if(!ctxSalvo) return
				relatar('Widget (SPA sem parâmetros) — restaurando…', '', 'execucao')
				rota_injetarWidget(ctxSalvo).catch(e => relatar('Widget (SPA restaurado):', e, 'erro'))
			})
			return
		}

		obterArmazenamento(['habilitado']).then(cfg => {
			if(cfg?.habilitado === false) return
			botaoRota_atualizarUrl()
			rota_interfacePorContexto()
			window.dispatchEvent(new CustomEvent('rotapje:url-mudou'))
		})

	}).observe(document.body, { childList:true, subtree:true })

}
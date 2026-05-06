// ============================================================
// programa.js — lógica completa do popup Rota PJE
// ============================================================

const NAV = (typeof browser !== 'undefined') ? browser : chrome

const TOTAL_PAGINAS = 3
const SUBTITULOS    = ['Editor de Tarefa', 'Configurações de Pintura', 'Desenvolvedores']

const TIPOS_JANELA = [
	{ valor:'detalhes',  label:'Detalhes do Processo' },
	{ valor:'tarefa',    label:'Tarefa do Processo'        },
	{ valor:'documento', label:'Documento do Processo' },
	{ valor:'nao_apreciados', label:'Petições não apreciadas' },
	{ valor:'anexar_documentos', label:'Anexar Documentos' },
	{ valor:'audiencias_e_sessoes', label:'Audiências e Sessões' },
	{ valor:'bndt', label:'BNDT' },
	{ valor:'calculo',   label:'Cálculos'       },
	{ valor:'comunicacoes_e_expedientes', label:'Comunicações e Expedientes'},
	{ valor:'gigs', label:'GIGS do Processo' },
	{ valor:'homologacaoAcordo', label:'Homologação do Acordo' },
	{ valor:'obrigacao_de_pagar', label:'Obrigações de Pagar' },
	{ valor:'pericias', label:'Perícias' },
	{ valor:'retificaAutuacao', label:'Retificação da Autuação' },
	{ valor:'sif', label:'SIF' },
	{ valor:'siscondj', label:'SISCONDJ - só funciona com AVJT ativo' }
]

const CORES = [
	{ hex:'#e74c3c', nome:'Vermelho' }, { hex:'#e67e22', nome:'Laranja' },
	{ hex:'#f1c40f', nome:'Amarelo'  }, { hex:'#2ecc71', nome:'Verde'   },
	{ hex:'#3498db', nome:'Azul'     }, { hex:'#9b59b6', nome:'Roxo'    },
	{ hex:'#1abc9c', nome:'Turquesa' }, { hex:'#e91e63', nome:'Rosa'    },
	{ hex:'#ffffff', nome:'Branco'   },
]

const REGRAS_PADRAO = CORES.slice(0,6).map(c => ({ cor:c.hex, termos:'' }))


// ── Estado ────────────────────────────────────────────────────
let paginaAtual  = 1
let tarefas      = {}
let nomeAtivo    = ''


// ── Inicialização ─────────────────────────────────────────────
window.addEventListener('load', iniciar)

async function iniciar(){

	// Referências página 1
	let selTarefa       = document.getElementById('sel-tarefa')
	let inputNomeTarefa = document.getElementById('input-nome-tarefa')
	let btnSalvarNome   = document.getElementById('btn-salvar-nome')
	let btnNovaTarefa   = document.getElementById('btn-nova-tarefa')
	let btnExcluirTarefa= document.getElementById('btn-excluir-tarefa')
	let inputTarefaUnica= document.getElementById('input-tarefa-unica')
	let slotsContainer  = document.getElementById('slots-container')
	let btnAddSlot      = document.getElementById('btn-add-slot')
	let btnSalvarTarefa = document.getElementById('btn-salvar-tarefa')
	let statusTarefa    = document.getElementById('status-tarefa')

	// Referências temporizador (página 1)
	let chkTemporizador      = document.getElementById('chk-temporizador')
	let temporizadorConfig   = document.getElementById('temporizador-config')
	let inputTimerSegundos   = document.getElementById('input-timer-segundos')
	let inputTimerOpcoes     = document.getElementById('input-timer-opcoes')

	// Referências página 2
	let regrasContainer = document.getElementById('regras-container')
	let btnSalvarPintura= document.getElementById('btn-salvar-pintura')
	let statusPintura   = document.getElementById('status-pintura')

	// Referências página 3
	let btnAtivarFiltros     = document.getElementById('btn-ativar-filtros')
	let statusFiltros        = document.getElementById('status-filtros')

	// Navegação
	let setaEsq    = document.getElementById('seta-esq')
	let setaDir    = document.getElementById('seta-dir')
	let navInd     = document.getElementById('nav-ind')
	let subtitulo  = document.getElementById('subtitulo')

	// ── Navegação ────────────────────────────────────────────
	function irPara(n){
		for(let i=1;i<=TOTAL_PAGINAS;i++){
			let el = document.getElementById('pagina-'+i)
			if(el) el.style.display = n===i ? 'block' : 'none'
		}
		paginaAtual          = n
		subtitulo.textContent= SUBTITULOS[n-1]||''
		navInd.textContent   = n + ' / ' + TOTAL_PAGINAS
		setaEsq.disabled     = n===1
		setaDir.disabled     = n===TOTAL_PAGINAS
	}
	setaEsq.addEventListener('click', () => { if(paginaAtual>1) irPara(paginaAtual-1) })
	setaDir.addEventListener('click', () => { if(paginaAtual<TOTAL_PAGINAS) irPara(paginaAtual+1) })
	irPara(1)

	// ── Toggle principal (ligar/desligar extensão) ───────────
	let btnToggle = document.getElementById('btn-toggle')
	let shell     = document.querySelector('.shell')

	async function _aplicarEstadoToggle(habilitado){
		if(habilitado){
			btnToggle.classList.add('ativo')
			btnToggle.title = 'Extensão ligada — clique para desligar'
			btnToggle.textContent = 'ON'
			shell.classList.remove('desabilitado')
		} else {
			btnToggle.classList.remove('ativo')
			btnToggle.title = 'Extensão desligada — clique para ligar'
			btnToggle.textContent = 'OFF'
			shell.classList.add('desabilitado')
		}
	}

	let storeToggle = await NAV.storage.local.get(['habilitado'])
	let habilitado  = storeToggle.habilitado !== false
	await _aplicarEstadoToggle(habilitado)

	btnToggle.addEventListener('click', async () => {
		habilitado = !habilitado
		await NAV.storage.local.set({ habilitado })
		await _aplicarEstadoToggle(habilitado)
		let tabs = await NAV.tabs.query({ url: '*://*.jus.br/*' })
		tabs.forEach(tab => {
			NAV.scripting.executeScript({
				target: { tabId: tab.id },
				func: (h) => { window._pjerota_habilitado = h },
				args: [habilitado],
			}).catch(()=>{})
		})
	})

	// ── Carrega storage ──────────────────────────────────────
	let store = await NAV.storage.local.get(['tarefas','tarefaAtiva'])
	tarefas   = store.tarefas  || {}
	nomeAtivo = store.tarefaAtiva || ''

	if(!Object.keys(tarefas).length){
		tarefas['Padrão'] = _tarefaPadrao()
		nomeAtivo = 'Padrão'
		await NAV.storage.local.set({ tarefas, tarefaAtiva: nomeAtivo })
	}

	_popularSelectTarefas()
	_carregarTarefaAtiva()

	// ── Seletor de tarefa ────────────────────────────────────
	selTarefa.addEventListener('change', () => {
		nomeAtivo = selTarefa.value
		NAV.storage.local.set({ tarefaAtiva: nomeAtivo })
		_carregarTarefaAtiva()
	})

	btnNovaTarefa.addEventListener('click', () => {
		let mostrando = inputNomeTarefa.style.display !== 'none'
		inputNomeTarefa.style.display = mostrando ? 'none'  : 'block'
		btnSalvarNome.style.display   = mostrando ? 'none'  : 'inline-flex'
		selTarefa.style.display       = mostrando ? 'block' : 'none'
		if(!mostrando){ inputNomeTarefa.value=''; inputNomeTarefa.focus() }
	})

	btnSalvarNome.addEventListener('click', () => {
		let nome = inputNomeTarefa.value.trim()
		if(!nome){ mostrarStatus(statusTarefa,'Nome não pode estar vazio.','#e74c3c'); return }
		if(tarefas[nome]){ mostrarStatus(statusTarefa,'Já existe uma tarefa com esse nome.','#e74c3c'); return }
		tarefas[nome] = _tarefaPadrao()
		nomeAtivo     = nome
		_popularSelectTarefas()
		_carregarTarefaAtiva()
		inputNomeTarefa.style.display = 'none'
		btnSalvarNome.style.display   = 'none'
		selTarefa.style.display       = 'block'
		NAV.storage.local.set({ tarefas, tarefaAtiva: nomeAtivo })
		mostrarStatus(statusTarefa,'✅ Tarefa criada!','#2ecc71')
	})

	btnExcluirTarefa.addEventListener('click', () => {
		if(Object.keys(tarefas).length <= 1){
			mostrarStatus(statusTarefa,'Não é possível excluir a única tarefa.','#e74c3c')
			return
		}
		if(!confirm('Excluir a tarefa "' + nomeAtivo + '"?')) return
		delete tarefas[nomeAtivo]
		nomeAtivo = Object.keys(tarefas)[0]
		_popularSelectTarefas()
		_carregarTarefaAtiva()
		NAV.storage.local.set({ tarefas, tarefaAtiva: nomeAtivo })
		mostrarStatus(statusTarefa,'Tarefa excluída.','#F9B73F')
	})

	// ── Temporizador toggle ──────────────────────────────────
	function _aplicarEstadoTemporizador(ativo){
		if(ativo){
			temporizadorConfig.style.display = 'flex'
		} else {
			temporizadorConfig.style.display = 'none'
		}
	}
	chkTemporizador.addEventListener('change', () => _aplicarEstadoTemporizador(chkTemporizador.checked))

	// ── Slots ────────────────────────────────────────────────
	btnAddSlot.addEventListener('click', () => {
		let qtd = slotsContainer.querySelectorAll('.slot').length
		if(qtd >= 5){ mostrarStatus(statusTarefa,'Máximo de 5 janelas.','#e74c3c'); return }
		_adicionarSlot({ posicao:'esquerda', tipo:'detalhes', tipoDoc:'', selecao:'recente', orientacao:'horizontal', ordem: qtd })
	})

	btnSalvarTarefa.addEventListener('click', () => {
		if(!nomeAtivo){ mostrarStatus(statusTarefa,'Crie ou selecione uma tarefa primeiro.','#e74c3c'); return }
		tarefas[nomeAtivo].tarefaUnica = inputTarefaUnica.value.trim()
		tarefas[nomeAtivo].slots       = _lerSlots()
		tarefas[nomeAtivo].temporizador = {
			ativo:    chkTemporizador.checked,
			segundos: parseInt(inputTimerSegundos.value) || 30,
			opcoes:   inputTimerOpcoes.value.trim(),
		}
		NAV.storage.local.set({ tarefas, tarefaAtiva: nomeAtivo })
		mostrarStatus(statusTarefa,'✅ Tarefa salva!','#2ecc71')
	})


	// ── Página 2 — Pintura ───────────────────────────────────
	btnSalvarPintura.addEventListener('click', () => {
		if(!nomeAtivo) return
		let regras = _lerRegras()
		tarefas[nomeAtivo].regras = regras
		NAV.storage.local.set({ tarefas })
		mostrarStatus(statusPintura,'✅ Pintura salva!','#2ecc71')
	})

	regrasContainer.addEventListener('click', e => {
		if(e.target.classList.contains('color-btn')){
			let menu  = e.target.nextElementSibling
			let aberto = !menu.classList.contains('hidden')
			_fecharMenusCor()
			if(!aberto) menu.classList.remove('hidden')
			return
		}
		if(e.target.classList.contains('color-opt')){
			let nova   = e.target.dataset.cor
			let slot   = e.target.closest('.rule-slot')
			let btn    = slot.querySelector('.color-btn')
			btn.style.backgroundColor = nova; btn.dataset.cor = nova
			_fecharMenusCor()
			let todos = [...regrasContainer.querySelectorAll('.rule-slot')]
			let outro = todos.find(s => s!==slot && rgbParaHex(s.querySelector('.color-btn').style.backgroundColor)===nova)
			if(outro){
				let ob = outro.querySelector('.color-btn')
				let an = rgbParaHex(btn.style.backgroundColor)
				ob.style.backgroundColor = an; ob.dataset.cor = an
			}
		}
	})
	document.addEventListener('click', e => {
		if(!e.target.closest('.color-picker-wrapper')) _fecharMenusCor()
	})


	// ════════════════════════════════════════════════════════
	// PÁGINA 3 — SUPER FILTROS (protegida por senha)
	// ════════════════════════════════════════════════════════

	// Hash SHA-256 da senha. Para trocar: gere o hash da nova senha em
	// https://emn178.github.io/online-tools/sha256.html e substitua abaixo.
	const SENHA_HASH  = 'd4b8b964ed94a604c3adb5accbf19a370a6cd7558a52bd30c2ea1c8d6b5370e4'
	const AUTH_KEY    = 'superfiltro_auth_ts'
	const AUTH_EXPIRY = 8 * 60 * 60 * 1000  // 8 horas em ms

	let divSenha    = document.getElementById('superfiltro-senha')
	let divConteudo = document.getElementById('superfiltro-conteudo')
	let inputSenha  = document.getElementById('input-senha-sf')
	let btnSenha    = document.getElementById('btn-senha-sf')
	let statusSenha = document.getElementById('status-senha-sf')

	async function _hashSenha(texto) {
		let buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto))
		return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('')
	}

	async function _superfiltroAutenticado() {
		let s = await NAV.storage.local.get([AUTH_KEY])
		let ts = s[AUTH_KEY] || 0
		return (Date.now() - ts) < AUTH_EXPIRY
	}

	async function _autenticar() {
		await NAV.storage.local.set({ [AUTH_KEY]: Date.now() })
		// Notifica abas para remontarem o widget
		_notificarAbasFiltro()
	}

	function _mostrarSuperfiltro(autenticado) {
		divSenha.style.display    = autenticado ? 'none'  : 'block'
		divConteudo.style.display = autenticado ? 'block' : 'none'
	}

	// Checa ao navegar para página 3
	let _irParaOriginal = irPara
	irPara = async function(n) {
		_irParaOriginal(n)
		if (n === 3) _mostrarSuperfiltro(await _superfiltroAutenticado())
	}

	_mostrarSuperfiltro(await _superfiltroAutenticado())

	btnSenha.addEventListener('click', async () => {
		let hash = await _hashSenha(inputSenha.value)
		if (hash === SENHA_HASH) {
			await _autenticar()
			inputSenha.value = ''
			_mostrarSuperfiltro(true)
		} else {
			statusSenha.textContent = '❌ Senha incorreta.'
			statusSenha.style.color = '#e74c3c'
			inputSenha.value = ''
			inputSenha.focus()
			setTimeout(() => { statusSenha.textContent = '' }, 2500)
		}
	})

	inputSenha.addEventListener('keydown', e => {
		if (e.key === 'Enter') btnSenha.click()
	})

	// Estado local do filtro
	let filtroAtivo = false

	// ── Carregar estado inicial ──────────────────────────────
	let storeFiltro = await NAV.storage.local.get(['superfiltro_ativo'])
	filtroAtivo = storeFiltro.superfiltro_ativo === true

	_aplicarEstadoFiltro(filtroAtivo)

	// ── Botão Ativar/Desativar widget ────────────────────────
	function _aplicarEstadoFiltro(ativo){
		filtroAtivo = ativo
		if(ativo){
			btnAtivarFiltros.classList.add('ativo')
			btnAtivarFiltros.title = 'Widget ativo — clique para desativar'
			statusFiltros.textContent = '✅ Widget ativo no painel'
			statusFiltros.style.color = '#2ecc71'
		} else {
			btnAtivarFiltros.classList.remove('ativo')
			btnAtivarFiltros.title = 'Widget inativo — clique para ativar'
			statusFiltros.textContent = '○ Widget desativado'
			statusFiltros.style.color = '#5e84a8'
		}
	}

	btnAtivarFiltros.addEventListener('click', async () => {
		filtroAtivo = !filtroAtivo
		await NAV.storage.local.set({ superfiltro_ativo: filtroAtivo })
		_aplicarEstadoFiltro(filtroAtivo)
		// Notifica abas do PJE
		_notificarAbasFiltro()
	})

	// ── Notificar abas do PJE sobre mudança no super filtro ──
	async function _notificarAbasFiltro() {
		let storeDados = await NAV.storage.local.get(['superfiltro_ativo'])
		let tabs = await NAV.tabs.query({ url: '*://*.jus.br/*' })
		tabs.forEach(tab => {
			NAV.scripting.executeScript({
				target: { tabId: tab.id },
				func: (dados) => {
					window._superfiltro_ativo = dados.ativo
					window.dispatchEvent(new CustomEvent('pjerota:superfiltro-atualizado', { detail: dados }))
				},
				args: [{ ativo: storeDados.superfiltro_ativo === true }],
			}).catch(()=>{})
		})
	}


	// ════════════════════════════════════════════════════════
	// HELPERS internos
	// ════════════════════════════════════════════════════════

	function _popularSelectTarefas(){
		selTarefa.innerHTML = ''
		Object.keys(tarefas).forEach(nome => {
			let op = document.createElement('option')
			op.value = nome; op.textContent = nome
			if(nome === nomeAtivo) op.selected = true
			selTarefa.appendChild(op)
		})
	}

	function _carregarTarefaAtiva(){
		if(!nomeAtivo || !tarefas[nomeAtivo]) return
		let t = tarefas[nomeAtivo]
		selTarefa.value           = nomeAtivo
		inputTarefaUnica.value    = t.tarefaUnica || ''

		// Temporizador
		let tmr = t.temporizador || {}
		chkTemporizador.checked     = !!tmr.ativo
		inputTimerSegundos.value    = tmr.segundos || 30
		inputTimerOpcoes.value      = tmr.opcoes   || ''
		_aplicarEstadoTemporizador(!!tmr.ativo)

		slotsContainer.innerHTML  = ''
		let slots = t.slots || []
		if(!slots.length) slots = [{ posicao:'esquerda', tipo:'detalhes', tipoDoc:'', selecao:'recente', orientacao:'horizontal', ordem:0 }]
		slots.forEach(s => _adicionarSlot(s))

		let regras = t.regras || REGRAS_PADRAO
		_criarRegrasCor(regras)
	}

	function _adicionarSlot(dados = {}){
		let { posicao='esquerda', tipo='detalhes', tipoDoc='', selecao='recente', orientacao='horizontal', ordem=0 } = dados
		let qtd = slotsContainer.querySelectorAll('.slot').length

		let slot = document.createElement('div')
		slot.className = 'slot'

		let header = document.createElement('div')
		header.className = 'slot-header'

		let numSpan = document.createElement('span')
		numSpan.className = 'slot-ordem'
		numSpan.textContent = (qtd + 1) + 'ª'

		let setasDiv = document.createElement('div')
		setasDiv.className = 'seta-ordem'

		let setaCima  = document.createElement('button')
		let setaBaixo = document.createElement('button')
		setaCima.className  = 'seta-ord-btn'; setaCima.textContent  = '▲'; setaCima.title  = 'Trazer para frente'
		setaBaixo.className = 'seta-ord-btn'; setaBaixo.textContent = '▼'; setaBaixo.title = 'Mandar para o fundo'

		setaCima.addEventListener('click',  () => _moverSlot(slot, -1))
		setaBaixo.addEventListener('click', () => _moverSlot(slot, +1))

		setasDiv.appendChild(setaCima)
		setasDiv.appendChild(setaBaixo)

		let btnRemover = document.createElement('button')
		btnRemover.className   = 'btn-remover-slot'
		btnRemover.textContent = '×'; btnRemover.title = 'Remover janela'
		btnRemover.addEventListener('click', () => {
			slot.remove(); _renumerarSlots()
		})

		let tipoLabel = document.createElement('span')
		Object.assign(tipoLabel.style, { flex:'1', fontSize:'11px', color:'#5e84a8' })
		tipoLabel.textContent = TIPOS_JANELA.find(t => t.valor===tipo)?.label || tipo

		header.appendChild(numSpan)
		header.appendChild(setasDiv)
		header.appendChild(tipoLabel)
		header.appendChild(btnRemover)

		let body = document.createElement('div')
		body.className = 'slot-body'

		let posDiv = document.createElement('div')
		let posLabel = document.createElement('label')
		posLabel.textContent = 'Posição: '
		Object.assign(posLabel.style, { fontSize:'11px', color:'#5e84a8', marginRight:'4px' })
		let posGrupo = document.createElement('div')
		posGrupo.className = 'pos-grupo'
		;['esquerda','direita','tela-cheia'].forEach(p => {
			let btn = document.createElement('button')
			btn.className = 'pos-btn' + (posicao===p ? ' ativo' : '')
			btn.textContent = p==='tela-cheia' ? 'Tela Cheia' : p.charAt(0).toUpperCase()+p.slice(1)
			btn.dataset.pos = p
			btn.addEventListener('click', () => {
				posGrupo.querySelectorAll('.pos-btn').forEach(b => b.classList.remove('ativo'))
				btn.classList.add('ativo')
			})
			posGrupo.appendChild(btn)
		})
		posDiv.style.display = 'flex'; posDiv.style.alignItems = 'center'; posDiv.style.gap = '4px'
		posDiv.appendChild(posLabel); posDiv.appendChild(posGrupo)

		let tipoDiv = document.createElement('div')
		tipoDiv.style.display='flex'; tipoDiv.style.alignItems='center'; tipoDiv.style.gap='4px'
		let tipoLbl = document.createElement('label')
		tipoLbl.textContent = 'Conteúdo: '
		Object.assign(tipoLbl.style, { fontSize:'11px', color:'#5e84a8', whiteSpace:'nowrap' })
		let tipoSel = document.createElement('select')
		tipoSel.className = 'select-full'
		TIPOS_JANELA.forEach(t => {
			let op = document.createElement('option')
			op.value=t.valor; op.textContent=t.label
			if(t.valor===tipo) op.selected=true
			tipoSel.appendChild(op)
		})
		tipoDiv.appendChild(tipoLbl); tipoDiv.appendChild(tipoSel)

		let docDiv = document.createElement('div')
		docDiv.style.display='flex'; docDiv.style.gap='6px'; docDiv.style.flexDirection='column'

		let inputDoc = document.createElement('input')
		inputDoc.type='text'; inputDoc.className='input-texto'
		inputDoc.placeholder='Tipo de documento (ex: Petição Inicial)'
		inputDoc.value = tipoDoc || ''
		inputDoc.disabled = tipo !== 'documento'

		let selGrupo = document.createElement('div')
		selGrupo.className = 'sel-grupo'
		;[['recente','Mais Recente'],['antigo','Mais Antigo'],['ultimos5','Últimos 5']].forEach(([val,lbl]) => {
			let btn = document.createElement('button')
			btn.className = 'sel-btn' + (selecao===val ? ' ativo' : '')
			btn.textContent = lbl; btn.dataset.sel = val
			btn.disabled = tipo !== 'documento'
			btn.addEventListener('click', () => {
				selGrupo.querySelectorAll('.sel-btn').forEach(b => b.classList.remove('ativo'))
				btn.classList.add('ativo')
			})
			selGrupo.appendChild(btn)
		})

		tipoSel.addEventListener('change', () => {
			let v = tipoSel.value
			tipoLabel.textContent = TIPOS_JANELA.find(t=>t.valor===v)?.label || v
			inputDoc.disabled = v !== 'documento'
			selGrupo.querySelectorAll('.sel-btn').forEach(b => b.disabled = v !== 'documento')
		})

		docDiv.appendChild(inputDoc)
		docDiv.appendChild(selGrupo)

		let orientDiv = document.createElement('div')
		orientDiv.style.display='flex'; orientDiv.style.alignItems='center'; orientDiv.style.gap='4px'
		let orientLbl = document.createElement('label')
		orientLbl.textContent='Widget: '
		Object.assign(orientLbl.style, { fontSize:'11px', color:'#5e84a8' })
		let orientGrupo = document.createElement('div')
		orientGrupo.className='orient-grupo'
		;[['horizontal','⇄ Horizontal'],['vertical','⇅ Vertical']].forEach(([val,lbl]) => {
			let btn = document.createElement('button')
			btn.className='orient-btn' + (orientacao===val ? ' ativo' : '')
			btn.textContent=lbl; btn.dataset.orient=val
			btn.addEventListener('click', () => {
				orientGrupo.querySelectorAll('.orient-btn').forEach(b=>b.classList.remove('ativo'))
				btn.classList.add('ativo')
			})
			orientGrupo.appendChild(btn)
		})
		orientDiv.appendChild(orientLbl); orientDiv.appendChild(orientGrupo)

		body.appendChild(posDiv)
		body.appendChild(tipoDiv)
		body.appendChild(docDiv)
		body.appendChild(orientDiv)

		slot.appendChild(header)
		slot.appendChild(body)
		slotsContainer.appendChild(slot)
	}

	function _moverSlot(slot, direcao){
		let todos = [...slotsContainer.querySelectorAll('.slot')]
		let idx   = todos.indexOf(slot)
		let dest  = idx + direcao
		if(dest < 0 || dest >= todos.length) return
		if(direcao < 0)
			slotsContainer.insertBefore(slot, todos[dest])
		else
			slotsContainer.insertBefore(todos[dest], slot)
		_renumerarSlots()
	}

	function _renumerarSlots(){
		slotsContainer.querySelectorAll('.slot-ordem').forEach((el, i) => {
			el.textContent = (i+1) + 'ª'
		})
	}

	function _lerSlots(){
		let slots = []
		slotsContainer.querySelectorAll('.slot').forEach((slot, i) => {
			let posAtiva  = slot.querySelector('.pos-btn.ativo')?.dataset?.pos    || 'esquerda'
			let tipoAtivo = slot.querySelector('select')?.value                   || 'detalhes'
			let tipoDoc   = slot.querySelector('input[type="text"]')?.value       || ''
			let selAtiva  = slot.querySelector('.sel-btn.ativo')?.dataset?.sel    || 'recente'
			let orientAtiva = slot.querySelector('.orient-btn.ativo')?.dataset?.orient || 'horizontal'
			slots.push({ posicao:posAtiva, tipo:tipoAtivo, tipoDoc, selecao:selAtiva, orientacao:orientAtiva, ordem:i })
		})
		return slots
	}

	function _criarRegrasCor(regras){
		regrasContainer.innerHTML = ''
		regras.forEach((reg, i) => {
			let slot = document.createElement('div')
			slot.className = 'rule-slot'

			let badge = document.createElement('div')
			badge.className = 'prioridade-badge'; badge.textContent = (i+1)+'º'

			let wrapper = document.createElement('div')
			wrapper.className = 'color-picker-wrapper'

			let btn = document.createElement('button')
			btn.className = 'color-btn'
			btn.style.backgroundColor = reg.cor || '#3498db'
			btn.title = 'Escolher cor'

			let menu = document.createElement('div')
			menu.className = 'color-menu hidden'
			CORES.forEach(c => {
				let op = document.createElement('span')
				op.className = 'color-opt'; op.dataset.cor = c.hex
				op.title = c.nome; op.style.background = c.hex
				if(c.hex==='#ffffff') op.style.border='1px solid #aaa'
				menu.appendChild(op)
			})
			wrapper.appendChild(btn); wrapper.appendChild(menu)

			let input = document.createElement('input')
			input.type='text'; input.className='input-tags'
			input.placeholder='Ex: Manifestação, Recurso'
			input.value = reg.termos || ''

			slot.appendChild(badge); slot.appendChild(wrapper); slot.appendChild(input)
			regrasContainer.appendChild(slot)
		})
	}

	function _lerRegras(){
		return [...regrasContainer.querySelectorAll('.rule-slot')].map(slot => {
			let btn = slot.querySelector('.color-btn')
			let cor = btn.dataset.cor || btn.style.backgroundColor
			return { cor: rgbParaHex(cor), termos: slot.querySelector('.input-tags').value.trim() }
		})
	}

	function _fecharMenusCor(){
		regrasContainer.querySelectorAll('.color-menu').forEach(m => m.classList.add('hidden'))
	}

	function _tarefaPadrao(){
		return {
			tarefaUnica: '',
			slots: [{ posicao:'esquerda', tipo:'detalhes', tipoDoc:'', selecao:'recente', orientacao:'horizontal', ordem:0 }],
			regras:  REGRAS_PADRAO,
			temporizador: { ativo: false, segundos: 30, opcoes: '' },
		}
	}

	function mostrarStatus(el, msg, cor){
		el.textContent = msg; el.style.color = cor; el.style.opacity = '1'
		setTimeout(() => { el.style.opacity = '0' }, 2800)
	}

	function rgbParaHex(cor){
		if(!cor) return '#000000'
		if(cor.startsWith('#')) return cor
		let m = cor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
		if(!m) return cor
		return '#' + [m[1],m[2],m[3]].map(n=>parseInt(n).toString(16).padStart(2,'0')).join('')
	}
}

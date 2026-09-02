/**
 * Executa console.log() com os parâmetros:
 * @param {string} rotulo	- Texto a ser exibido.
 * @param {object} objeto - Opcional: objeto a ser exibido.
 * @param {string} tipo		- Opcional: exibir ${texto} com destaque específico.
 */
function relatar(
	rotulo		= '',
	conteudo	= '',
	tipo			= '',
	ativada		= false
){
	return
	let diagnosticar = CONFIGURACAO?.diagnostico || ativada
	if(!diagnosticar)
		return

	let extensao	= '%c' + EXTENSAO.short_name
	let corExtensao	= 'hsl(180,100%,	25%)'
	let corRotulo		= 'hsl(0,	100%,	5%)'

	if(tipo === 'execucao'){
		if(diagnosticar?.execucao){
			relatorio()
		}
	}

	if(tipo === 'armazenamento'){
		if(diagnosticar?.armazenamento){
			corRotulo			= 'hsl(0,	0%,	30%)'
			rotulo				= '💾 Armazenamento - ' + rotulo
			relatorio()
		}
	}

	if(tipo === 'autogigs'){
		if(diagnosticar?.autogigs){
			corRotulo			= 'hsl(0,	0%,	30%)'
			rotulo				= '🤖 AutoGIGS - ' + rotulo
			relatorio()
		}
	}

	if(tipo === 'automacao'){
		if(diagnosticar?.automacao){
			corRotulo			= 'hsl(0,	0%,	30%)'
			rotulo				= '🤖 Automação - ' + rotulo
			relatorio()
		}
	}

	if(tipo === 'configuracao'){
		if(diagnosticar?.configuracao){
			corRotulo			= 'hsl(275, 100%, 40%)'
			rotulo				= '🔑 CONFIGURAÇÃO - ' + rotulo
			relatorio()
		}
	}

	if(tipo === 'contexto'){
		if(diagnosticar?.contexto){
			corRotulo			= 'hsla(189, 100%, 40%, 1.00)'
			rotulo				= '🌐 CONTEXTO - ' + rotulo
			relatorio()
		}
	}

	if(tipo === 'dom'){
		if(diagnosticar?.dom){
			corRotulo			= 'hsla(266, 100%, 40%, 1.00)'
			rotulo				= '📜 DOM - ' + rotulo
			relatorio()
		}
	}

	if(tipo === 'erro'){
		if(diagnosticar?.erro){
			corRotulo			= 'hsl(0,	100%,	40%)'
			rotulo				= '❌ ERRO - ' + rotulo
			relatorio()
		}
	}

	if(tipo === 'requisicao'){
		if(diagnosticar?.requisicao){
			corRotulo			= 'hsla(0, 100%, 30%, 1.00)'
			rotulo				= '📤 Requisição - ' + rotulo
			relatorio()
		}
	}

	if(tipo === 'resposta'){
		if(diagnosticar?.resposta){
			corRotulo			= 'hsl(120,100%,	30%)'
			rotulo				= '📩 Resposta - ' + rotulo
			relatorio()
		}
	}

	if(tipo === 'mutacao'){
		if(diagnosticar?.mutacao){
			corRotulo			= 'hsl(300, 100%, 30%)'
			rotulo				= '🔍 ' + rotulo
			relatorio()
		}
	}

	if(tipo === 'navegador'){
		if(diagnosticar?.navegador){
			corRotulo			= 'hsl(300, 100%, 30%)'
			rotulo				= '🌐 ' + rotulo
			relatorio()
		}
	}

	if(tipo === 'selecao'){
		if(diagnosticar?.selecao){
			corRotulo			= 'hsl(300, 100%, 30%)'
			rotulo				= '🖱️ ' + rotulo
			relatorio()
		}
	}

	if(tipo === 'texto'){
		if(diagnosticar?.texto){
			corRotulo			= 'hsl(300, 100%, 30%)'
			rotulo				= '📄 ' + rotulo
			relatorio()
		}
	}

	if(tipo === 'worker'){
		if(diagnosticar?.worker){
			corRotulo			= 'hsl(50,	100%,	20%)'
			rotulo				= '👷‍♀️ Worker - ' + rotulo
			relatorio()
		}
	}

	if(tipo === 'xhr'){
		if(diagnosticar?.xhr){
			corRotulo			= 'hsl(50,	100%,	20%)'
			rotulo				= '📤 XHR - ' + rotulo
			relatorio()
		}
	}

	if(tipo === 'teste'){
		if(diagnosticar?.teste){
			corRotulo			= 'hsl(39, 100%, 30%)'
			rotulo				= '🧪 ' + rotulo
			relatorio()
		}
	}


	function relatorio(){
		let estilo = `
			border-radius:3px;
			color:hsla(0,100%,100%,1);
			display:inline-block;
			font-weight:600;
			padding:0 3px;
		`
		let estiloExtensao	= estilo + `
			background:${corExtensao};
		`
		let estiloRotulo		= estilo + `
			background:${corRotulo};
			margin:0 0 0 3px;
		`
		rotulo = '%c' + rotulo
		if(!conteudo)
			console.log(extensao + rotulo, estiloExtensao, estiloRotulo)
		else
			console.log(extensao + rotulo, estiloExtensao, estiloRotulo, conteudo)
	}

}

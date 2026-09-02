async function esforcosPoupados(poupados = {}){

	relatar('Esforços Repetitivos Poupados: ',poupados,'armazenamento')

	let armazenamento	= await obterArmazenamento(['esforcos'])

	relatar('Esforços atuais armazenados: ',armazenamento.esforcos,'armazenamento')

	let armazenados			= armazenamento.esforcos

	let esforcos				= {}
	esforcos.desde			= armazenados.desde
	esforcos.cliques		= (Number(poupados.cliques)			+ Number(armazenados.cliques))		|| 0
	esforcos.movimentos	= (Number(poupados.movimentos)	+ Number(armazenados.movimentos))	|| 0
	esforcos.segundos		= (Number(poupados.segundos)		+ Number(armazenados.segundos))		|| 0
	esforcos.teclas			= (Number(poupados.teclas)			+ Number(armazenados.teclas))			|| 0

	await armazenar({esforcos})

}

function somarEsforcosRepetitivosPoupados(esforcos = CONFIGURACAO.esforcos){

	let {
		cliques			= 0,
		movimentos	= 0,
		teclas			= 0
	} = esforcos

	let total = Number(cliques) + Number(movimentos) + Number(teclas)

	return Number(total)

}


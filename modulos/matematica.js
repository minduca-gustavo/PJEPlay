function somar(
	numeros				=	[],
	retornarMoeda	= false
){
	let total		= numeros.reduce((acumulador, valor) => acumulador + valor, 0) || 0
	if(retornarMoeda)
		total	= numeroParaValorMonetario(total)
	return total
}

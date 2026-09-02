/**
 * Retorna uma matriz com os termos por extenso dos números inteiros em português.
 * @returns 
 */
function numerosInteirosPorExtenso(){
	return [
		['zero','um','dois','três','quatro','cinco','seis','sete','oito','nove','dez','onze','doze','treze','quatorze','quinze','dezesseis','dezessete','dezoito','dezenove'],
		['dez','vinte','trinta','quarenta','cinquenta','sessenta','setenta','oitenta','noventa'],
		['cem','cento','duzentos','trezentos','quatrocentos','quinhentos','seiscentos','setecentos','oitocentos','novecentos'],
		['mil','milhão','bilhão','trilhão','quatrilhão']
	]
}


/**
 * Retorna uma matriz com os termos por extenso dos números ordinais inteiros em português.
 * @returns 
 */
function numerosOrdinaisPorExtenso(){
	return [
		['', 'primeiro', 'segundo', 'terceiro', 'quarto', 'quinto', 'sexto', 'sétimo', 'oitavo', 'nono'],
		['décimo', 'vigésimo', 'trigésimo', 'quadragésimo', 'quinquagésimo','sexagésimo', 'septuagésimo', 'octogésimo', 'nonagésimo'],
		['centésimo', 'ducentésimo', 'tricentésimo', 'quadringentésimo','quingentésimo', 'sexcentésimo', 'septingentésimo','octingentésimo', 'nongentésimo'],
		['milésimo', 'milionésimo', 'bilionésimo', 'trilionésimo']
	]
}


/**
 * Substitui os caracteres no texto passado pelo parâmetro ${texto} pelo seu equivalente por extenso em português.
 * @param{string} texto 
 * @returns 
 */
function caracteresPorExtenso(texto){

	let caracteres ={
		'0': 'zero',
		'1': 'um',
		'2': 'dois',
		'3': 'três',
		'4': 'quatro',
		'5': 'cinco',
		'6': 'seis',
		'7': 'sete',
		'8': 'oito',
		'9': 'nove'
	}
	
	return texto.replace(/\d/g, (caractere => caracteres[caractere] + ' ') || caractere + ' ')
}


/**
 * Converte um valor numérico para o seu equivalente por extenso em português.
 * @param{string} texto
 * @returns 
 */
function porExtenso_numerosInteiros(texto=''){

	let termos = numerosInteirosPorExtenso()

	let numero = texto.replace(/\D/g,'')
	
	if(!numero)
		numero = '0'

	let resultado	= []
	let e					= ' e '
	let numerico	= []
	let inicio		= numero.length % 3
	
	if(inicio > 0)
		numerico.push(numero.slice(0, inicio))
	
	for(
		let i = inicio;
		i < numero.length;
		i += 3
	){
		numerico.push(numero.slice(i, i + 3))
	}

	for(
		let texto = 0;
		texto < numerico.length;
		texto++
	){
		let grupo		= numerico[texto]
		let inteiro	= parseInt(grupo, 10)
		
		if(inteiro === 0)
			continue

		let largura			= numerico.length
		let termoAtual	= largura - texto - 2
		let termo				= ''

		if(inteiro < 20)
			termo = termos[0][inteiro]
		else if(inteiro < 100){
			let dezena	= Math.floor(inteiro / 10)
			let unidade	= inteiro % 10
			termo				= termos[1][dezena - 1]
			if(unidade > 0)
				termo += e + termos[0][unidade]
		}
		else{
			let centena	= Math.floor(inteiro / 100)
			let resto		= inteiro % 100
			if(resto === 0)
				termo = termos[2][inteiro === 100 ? 0 : centena]
			else{
				termo = termos[2][centena] + e
				if(resto < 20)
					termo += termos[0][resto]
				else{
					let dezena	= Math.floor(resto / 10)
					let unidade	= resto % 10
					termo				+= termos[1][dezena - 1]
					if(unidade > 0)
						termo += e + termos[0][unidade]
				}
			}
		}

		if(termoAtual > -1){
			let escala = termos[3][termoAtual]
			if(inteiro > 1 && termoAtual > 0)
				termo += ' ' + escala.replace('ão', 'ões')
			else
				termo += ' ' + escala
		}

		resultado.push(termo)
	}

	if(resultado.length === 0)
		return termos[0][0]

	if(resultado.length > 1){
		let ultimo = resultado.pop()
		return resultado.join(' ') + e + ultimo
	}

	return resultado[0]

}


/**
 * Converte um valor decimal para o seu equivalente por extenso em português.
 * @param{string} texto
 * @returns 
 */
function porExtenso_numerosDecimais(texto){

	let separador = texto.includes(',') || ''
	
	if(!separador)
		return ''

	let [
		parteInteira,
		parteDecimal
	] = texto.split(',')
	
	parteInteira = porExtenso_numerosInteiros(parteInteira)
	
	if(parteDecimal.length <= 3){
		parteDecimal = porExtenso_numerosInteiros(parteDecimal)
	}
	else{
		parteDecimal = caracteresPorExtenso(parteDecimal)
	}
	
	return parteInteira + ' vírgula ' + parteDecimal
}


/**
 * Converte um valor ordinal para o seu equivalente por extenso em português.
 * @param{string} texto
 * @returns 
 */
function porExtenso_numerosOrdinais(texto = ''){

	let termos		= numerosOrdinaisPorExtenso()
	let feminino	= /ª/g.test(texto)
	if(feminino)
		termos			= termos.map(grupo => grupo.map(palavra => palavra.endsWith('o') ? palavra.slice(0, -1) + 'a' : palavra))
	
	texto					= texto.replace(/[°]/g,'º')
	let numero		= texto.replace(/\D/g,'')
	
	if(!numero)
		numero = '0'

	let resultado	= []
	let numerico	= []
	let inicio		= numero.length % 3

	if(inicio > 0)
		numerico.push(numero.slice(0,inicio))

	for(
		let i = inicio;
		i < numero.length;
		i += 3
	){
		numerico.push(numero.slice(i, i + 3))
	}

	for(
		let texto = 0;
		texto < numerico.length;
		texto++
	){
		let grupo		= numerico[texto]
		let inteiro	= parseInt(grupo, 10)

		if(inteiro === 0)
			continue

		let largura			= numerico.length
		let termoAtual	= largura - texto - 2
		let termo				= ''

		if(inteiro < 10)
			termo = termos[0][inteiro]
		else if(inteiro < 100){
			let dezena	= Math.floor(inteiro / 10)
			let unidade	= inteiro % 10
			termo				= termos[1][dezena - 1]
			if(unidade > 0)
				termo += ' ' + termos[0][unidade]
		}
		else{
			let centena = Math.floor(inteiro / 100)
			let resto = inteiro % 100
			if(resto === 0)
				termo = termos[2][centena - 1]
			else{
				termo = termos[2][centena - 1] + ' '
				if(resto < 10)
					termo += termos[0][resto]
				else{
					let dezena = Math.floor(resto / 10)
					let unidade = resto % 10
					termo += termos[1][dezena - 1]
					if(unidade > 0)
						termo += ' ' + termos[0][unidade]
				}
			}
		}

		if(termoAtual > -1){
			let escala = termos[3][termoAtual]
			termo += ' ' + escala
		}
		resultado.push(termo)
	}

	if(resultado.length === 0)
		return termos[0][1]

	if(resultado.length > 1){
		let ultimo = resultado.pop()
		return resultado.join(' ') + ' ' + ultimo
	}

	return resultado[0]
}


/**
 * Converte um valor numérico monetário para o seu equivalente por extenso em português.
 * @param{string} texto
 * @returns 
 */
function porExtenso_valorMonetario(texto){

	let [
		parteInteira,
		parteDecimal
	] = texto.split(',')
	
	let resultado = porExtenso_numerosInteiros(parteInteira)

	let deReais = /(milhões|bilhões|trilhões|quatrilhões)$/i.test(resultado)
	
	if(deReais)
		resultado += ' de reais'
	else{
		if(parteInteira === '1')
			resultado += ' real'
		else
			resultado += ' reais'
	}
	
	if(parteDecimal !== '00'){
		resultado += ' e '
		let centavosExtenso = porExtenso_numerosInteiros(parteDecimal)
		if(parteDecimal === '01')
			resultado += centavosExtenso + ' centavo'
		else
			resultado += centavosExtenso + ' centavos'
	}
	
	return resultado

}
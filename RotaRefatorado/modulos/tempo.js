/**
 * Converte segundos para minutos.
 * @param {number} segundos 
 * @returns 
 */
function converterSegundosParaMinutos(segundos = 0) {
	return Math.floor((segundos % 3600) / 60)
}


/**
 * Converte segundos para horas.
 * @param {number} segundos 
 * @returns 
 */
function converterSegundosParaHoras(segundos = 0) {
	return Math.floor(segundos / 3600)
}


/**
 * Converte segundos para tempo.
 * @param {number} segundos 
 * @returns 
 */
function converterSegundosParaTempo(segundos = 0) {
	let horas								= converterSegundosParaHoras(segundos)
	let minutos							= converterSegundosParaMinutos(segundos)
	let segundosRestantes		= segundos % 60
	let horasFormatadas			= horas.toString().padStart(2,'0')
	let minutosFormatados		= minutos.toString().padStart(2,'0')
	let segundosFormatados	= segundosRestantes.toString().padStart(2,'0')
	return horasFormatadas + 'h' + minutosFormatados + 'm' + segundosFormatados + 's'
}


/**
 * Converte, por estimativa, caracteres para segundos.
 * @param {string} texto 
 * @param {number} divisor 
 * @returns 
 */
function caracteresParaSegundos(
	texto		= '',
	divisor	= 5
){
	if(!texto)
		return 0
	let caracteres	= contarCaracteres(texto) || 0
	let segundos		= Math.ceil(caracteres / divisor)
	return segundos
}
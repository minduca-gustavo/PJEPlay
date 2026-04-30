function normalizar(texto){
    return String(texto ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function rgbParaHex(cor = ''){
	if(!cor) return '#000000'
	if(cor.startsWith('#')) return cor
	let m = cor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
	if(!m) return cor
	return '#' + [m[1],m[2],m[3]].map(n => parseInt(n).toString(16).padStart(2,'0')).join('')
}

function escurecerCor(hex = ''){
	let n = parseInt(hex.replace('#',''), 16)
	let r = Math.max(0,(n>>16)-40), g = Math.max(0,((n>>8)&0xff)-40), b = Math.max(0,(n&0xff)-40)
	return '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('')
}

/**
 * Define as datas utilizadas com frequência.
 * @returns 
 */
function definirDatas(){

	let agora		= new Date()
	let data		= {
		agora,
		hoje:{
			curta:	agora.toLocaleDateString(),
			dia:		agora.getDate(),
			ano:		agora.getFullYear(),
			mes:		(Number(agora.getMonth()) + 1),
		}
	}

	return data

}


/**
 * Obtém a data contida no texto passado pelo parâmetro ${texto}.
 * @param {string} texto 
 * @returns 
 */
function obterData(texto){
	let data = texto.match(EXPRESSAO.data) || ''
	if(!data)
		return ''
	return data[0]
}


/**
 * Obtém a hora contida no texto passado pelo parâmetro ${texto}.
 * @param {string} texto 
 * @returns 
 */
function obterHora(texto){
	let hora = texto.match(EXPRESSAO.hora) || ''
	if(!hora)
		return ''
	return hora[0]
}


/**
 * @param {string} data 'dd/mm/aaaa'
 */
 function dataLocalParaIso(data=''){
	if(!data)
		return ''
	let local = data.replace(/(\d{2}).(\d{2}).(\d{4})/,'$3-$2-$1')
	return local
}


/**
 * @param {string} data 'aaaa-mm-dd'
 */
 function dataIsoParaLocal(data=''){
	if(!data)
		return ''
	let iso = data.substring(8, 10) + '/' + data.substring(5, 7) + '/' + data.substring(0, 4)
	return iso
}


/**
 * @param {string} data 'aaaa-mm-ddThh:mm:ss.sss'
 */
function dataLocalCurta(data=''){
	let dataNova = new Date(data)
	let dataLocal = dataNova.toLocaleDateString() || ''
	return dataLocal || ''
}

function éHoje(data=''){
  return new Date(data).toDateString() === new Date().toDateString()
}
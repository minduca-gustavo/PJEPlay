function whatsapp_montarMensagem(numero=''){
	numero				= apenasNumeros(numero)
	let resposta	= prompt('Informe o número do telefone do destinatário:',+numero) || ''
	if(!resposta)
		return
	let telefone	= apenasNumeros(resposta)
	let texto			= saudacao() + '\n\n'
	whatsapp_escreverMensagem(telefone,texto)
	esforcosPoupados({
		movimentos:	9,
		cliques:		2,
		teclas:			(3 + contarCaracteres(telefone)),
		segundos:		2
	})
}

function whatsapp_escreverMensagem(
  telefone	= '',
  texto			= ''
){

  abrirURL({
		url:		LINK.whatsapp.api + apenasNumeros(telefone) + '&text=' + encodeURI(texto),
		chave:	'whatsapp'
	})
}
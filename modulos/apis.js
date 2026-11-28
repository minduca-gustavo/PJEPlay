function criarChaveDeIdempotencia() {
  return crypto.randomUUID() // 122 bits de entropia, formato padrão UUID v4
}

function rota_cabecalhosApi(aceita = 'application/json, text/plain, */*'){
	return {
		'Idempotency-Key':  criarChaveDeIdempotencia(),
		'X-Grau-Instancia': CONFIGURACAO?.pessoa?.instancia || '1',
		'X-XSRF-TOKEN':     rota_token(),
		'Content-Type':     'application/json',
		'Accept':           aceita,
	}
}
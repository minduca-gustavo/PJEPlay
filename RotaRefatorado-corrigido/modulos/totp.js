async function totp_autenticacao_exibirCodigo(chave=''){
	let campo			= selecionar('input:is(#codigo,#otp)')

	
	let progresso	= selecionar('progress')
	atualizar()
	let intervalo	= setInterval(atualizar,1000)
	window.addEventListener('beforeunload', () => clearInterval(intervalo))

	async function atualizar(){
		if(!chave)
			return
		let periodo 		= 30
		let digitos			= 6
		let algoritmo		= 'SHA-1'
		let segredo			= decodificar(chave)
		let contador		= Math.floor(Date.now() / 1000 / periodo)
		let segundos		= periodo - (Math.floor(Date.now() / 1000) % periodo)
		let codigo 			= await gerar(segredo,contador,digitos,algoritmo)
		campo.value			= codigo
		progresso.value	= segundos
	}
	
	function decodificar(textoBase32){
		let alfabeto	= 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
		let texto			= textoBase32.replace(/\s+/g, '').replace(/=+$/g, '').toUpperCase()
		let buffer		= 0
		let bits			= 0
		let bytes			= []
		for(let caractere of texto){
			let valor	= alfabeto.indexOf(caractere)
			if(valor === -1)
				throw new Error('Caractere inválido: ' + caractere)
			buffer = (buffer << 5) | valor
			bits += 5
			if(bits >= 8){
				bits -= 8
				bytes.push((buffer >> bits) & 0xff)
			}
		}
		return new Uint8Array(bytes)
	}
	
	async function gerar(segredo, contador, digitos, algoritmo){
		let mensagemBytes = new Uint8Array(8)
		let valor = BigInt(contador)
		for(let i = 7;i >= 0;i--){
			mensagemBytes[i] = Number(valor & 0xffn)
			valor >>= 8n
		}
		let chave					= await crypto.subtle.importKey('raw', segredo, { name: 'HMAC', hash: { name: algoritmo } }, false, ['sign'])
		let assinatura		= new Uint8Array(await crypto.subtle.sign('HMAC', chave, mensagemBytes))
		let deslocamento	= assinatura[assinatura.length - 1] & 0x0f
		let codigoBinario	= ((assinatura[deslocamento] & 0x7f) << 24) |	((assinatura[deslocamento + 1] & 0xff) << 16) |	((assinatura[deslocamento + 2] & 0xff) << 8) | (assinatura[deslocamento + 3] & 0xff)
		return (codigoBinario % (10 ** digitos)).toString().padStart(digitos, '0')
	}
}
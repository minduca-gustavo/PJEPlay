function relatar(rotulo = '', conteudo = '', tipo = ''){
	if(!MODO_DEV) return

	let pfx  = 'background:#0a3d6b;color:#F9B73F;font-weight:700;padding:0 4px;border-radius:3px;'
	let base = 'padding:0 4px;border-radius:3px;color:#fff;font-weight:600;'
	let cor  = {
		execucao:    '#1a7a1a',
		armazenamento:'#555',
		requisicao:  '#7a1a1a',
		resposta:    '#1a5c1a',
		erro:        '#cc0000',
		dom:         '#4a1a7a',
		mutacao:     '#7a4a00',
		navegador:   '#005c7a',
		teste: 		'#ff10d7'
	}[tipo] || '#333'

	let msg = '%c PJEPlay %c ' + rotulo
	let s2  = base + 'background:' + cor + ';margin-left:3px;'
	if(!conteudo) console.log(msg, pfx, s2)
	else          console.log(msg, pfx, s2, conteudo)
}

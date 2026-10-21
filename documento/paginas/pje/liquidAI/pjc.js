const _CRC_TABLE = (() => {
    const t = new Uint32Array(256)
    for (let n = 0; n < 256; n++) {
        let c = n
        for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
        t[n] = c >>> 0
    }
    return t
})()

function _crc32(bytes) {
    let c = 0xFFFFFFFF
    for (let i = 0; i < bytes.length; i++) c = _CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8)
    return (c ^ 0xFFFFFFFF) >>> 0
}

// Texto -> bytes ASCII. Tudo acima de 127 vira &#NNN; (como o próprio PJe-Calc grava)
function _xmlParaBytes(texto) {
    let ascii = ''
    for (const ch of texto) {
        const cp = ch.codePointAt(0)
        ascii += cp > 127 ? '&#' + cp + ';' : ch
    }
    const bytes = new Uint8Array(ascii.length)
    for (let i = 0; i < ascii.length; i++) bytes[i] = ascii.charCodeAt(i)
    return bytes
}

async function _deflateRaw(bytes) {
    const fluxo = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'))
    return new Uint8Array(await new Response(fluxo).arrayBuffer())
}

async function zipPjc(xml, nomeBase) {
    if (!xml.startsWith('<?xml')) xml = '<?xml version="1.0" encoding="ISO-8859-1"?>' + xml
    const dados = _xmlParaBytes(xml)
    const nome = _xmlParaBytes(nomeBase + '.pjc')
    const crc = _crc32(dados)

    let metodo = 0, corpo = dados
    try {
        const d = await _deflateRaw(dados)
        if (d.length < dados.length) { metodo = 8; corpo = d }
    } catch (e) { /* sem 'deflate-raw': grava sem compactar */ }

    const agora = new Date()
    const hora = (agora.getHours() << 11) | (agora.getMinutes() << 5) | (agora.getSeconds() >> 1)
    const data = ((agora.getFullYear() - 1980) << 9) | ((agora.getMonth() + 1) << 5) | agora.getDate()

    const tamCD = 46 + nome.length
    const buf = new ArrayBuffer(30 + nome.length + corpo.length + tamCD + 22)
    const v = new DataView(buf), u8 = new Uint8Array(buf)
    let p = 0
    const w16 = x => { v.setUint16(p, x, true); p += 2 }
    const w32 = x => { v.setUint32(p, x, true); p += 4 }

    // cabeçalho local
    w32(0x04034b50); w16(20); w16(0); w16(metodo); w16(hora); w16(data)
    w32(crc); w32(corpo.length); w32(dados.length); w16(nome.length); w16(0)
    u8.set(nome, p); p += nome.length
    u8.set(corpo, p); p += corpo.length

    // diretório central
    const inicioCD = p
    w32(0x02014b50); w16(20); w16(20); w16(0); w16(metodo); w16(hora); w16(data)
    w32(crc); w32(corpo.length); w32(dados.length); w16(nome.length)
    w16(0); w16(0); w16(0); w16(0); w32(0); w32(0)
    u8.set(nome, p); p += nome.length

    // fim do diretório central
    w32(0x06054b50); w16(0); w16(0); w16(1); w16(1); w32(tamCD); w32(inicioCD); w16(0)

    return new Blob([buf], { type: 'application/octet-stream' })
}

async function _baixarPjc(xml, nomeBase, extensao = 'pjc') {
    const zip = await zipPjc(xml, nomeBase)
    _baixarArquivo(zip, nomeBase + '.' + extensao, 'application/octet-stream')
}
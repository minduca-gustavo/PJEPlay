function formatarPartes(partes) {
    relatar('formatarPartes: ' + JSON.stringify(partes))
    if (!partes) return ''

    const linhas = []

    const formatarPessoa = (p) => {
        const doc    = `${p.tipoDocumento}: ${p.documento}`
        const isPJ   = p.tipoPessoa === 'J'
        const habDec = isPJ ? '\n    Habilitado no domicílio Eletrônico/CNJ' : ''
        const email  = p.email || p.emails?.[0] || ''
        const end    = p.endereco
        const endStr = end ? [
            `\n    ${end.logradouro.trim()}${end.complemento ? ', ' + end.complemento.trim() : ''}, ${end.numero}`,
            `    ${end.bairro} - ${end.municipio} - ${end.estado?.sigla} - CEP: ${end.nroCep}${isPJ && email ? ' (email: ' + email + ')' : ''}`,
        ].join('\n') : ''

        const reps = (p.representantes || []).map(r =>
            `        ${r.nome.trim()} (${r.tipo})\n        CPF: ${r.documento}\n        OAB: ${r.numeroOab}\n        E-mail: ${r.email}`
        ).join('\n')

        return `    ${p.tipo.toLowerCase()}:\n    ${p.nome.trim()}${habDec}\n    ${doc}${endStr}${reps ? '\n' + reps : ''}`
    }

    if (partes.ATIVO?.length) {
        linhas.push('Polo Ativo\n')
        partes.ATIVO.forEach(p => linhas.push(formatarPessoa(p)))
    }

    if (partes.PASSIVO?.length) {
        linhas.push('\nPolo Passivo\n')
        partes.PASSIVO.forEach(p => linhas.push(formatarPessoa(p)))
    }

    return linhas.join('\n')
}

async function comparaChavesProcesso(chave) {
    const cfg = await obterArmazenamento([ROTA_CHAVES.sessao])
    const sessao = cfg?.[ROTA_CHAVES.sessao]
    const valorSessao = sessao?.processos?.[sessao.cursor || 0]
    const dados = await obterArmazenamento([chave])
    return dados?.[chave] === valorSessao
}
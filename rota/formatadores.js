function formatarPartes(partes) {
    relatar('formatarPartes: ' + JSON.stringify(partes))
    if (!partes) return ''
    const linhas = []
    const s = (v) => (v ?? '').toString().trim()   // helper: null/undefined → ''

    const formatarPessoa = (p) => {
        const doc    = `🪪 ${s(p.tipoDocumento)}: ${s(p.documento)}`
        const isPJ   = p.tipoPessoa === 'J'
        const email  = p.email || p.emails?.[0] || ''
        const end    = p.endereco
        const endStr = end ? [
            `\n   🏠 ${s(end.logradouro)}${end.complemento ? ', ' + s(end.complemento) : ''}, ${s(end.numero)}`,
            `    ${s(end.bairro)} - ${s(end.municipio)} - ${s(end.estado?.sigla)} - CEP: ${s(end.nroCep)}${isPJ && email ? ' (email: ' + email + ')' : ''}`,
        ].join('\n') : ''

        const reps = (p.representantes || []).map(r => {
            const oab   = s(r.numeroOab)
            const email = s(r.email)
            return [
                `      👔 ${s(r.nome)} (${s(r.tipo)})`,
                `        CPF: ${s(r.documento)}`,
                oab   ? `        OAB: ${oab}`     : '',
                email ? `        E-mail: ${email}` : '',
            ].filter(Boolean).join('\n')
        }).join('\n')

        return `    _____________________________________ \n${s(p.tipo).toUpperCase()}:\n   🧑‍💼 ${s(p.nome)}\n    ${doc}${endStr}${reps ? '\n' + reps : ''}`
    }

    if (partes.ATIVO?.length) {
        linhas.push('POLO ATIVO\n')
        partes.ATIVO.forEach(p => linhas.push(formatarPessoa(p)))
    }
    if (partes.PASSIVO?.length) {
        linhas.push('\nPOLO PASSIVO\n')
        partes.PASSIVO.forEach(p => linhas.push(formatarPessoa(p)))
    }
    return linhas.join('\n')
}
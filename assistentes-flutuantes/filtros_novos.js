// ── TDs excluídos da busca de número de processo ────────────────
const ROTA_FILTROS_NOVOS_TDS_EXCLUIDOS = [
    // 'seletor-css-do-td-que-nao-deve-ser-usado',
]

// ── Contador (Etapa / Filtrando) ──────────────────────────────
//
// Chamar a cada volta de um for loop que faz requisição ao servidor.
// ancestral  → id do container onde o botão Filtrar foi criado
//              (aparece logo abaixo dele).
// etapa      → string "atual/total" (ex: '2/3'). Passe 0 (padrão) para
//              omitir a linha "Etapa" — funções com um único for loop
//              não devem mostrá-la.
// filtrando  → string "atual/total" (ex: '15/251') com o índice da
//              chamada dentro do loop atual. Se vier uma string SEM
//              "/" (ex: 'Nenhum processo encontrado.'), é tratada como
//              mensagem final — substitui o texto inteiro, sem os
//              prefixos "Etapa"/"Filtrando". É assim que o retorno
//              negativo da função de filtro chega até aqui (ver
//              criaFiltro).
function atualizar_contador(ancestral, etapa = 0, filtrando = 1) {
    let idContador = ancestral + '_contador'
    let ehMensagem = typeof filtrando === 'string' && !filtrando.includes('/')
    let texto
    if (ehMensagem) {
        texto = filtrando
    } else {
        let linhas = []
        if (etapa) linhas.push('Etapa ' + etapa)
        linhas.push('Filtrando ' + filtrando)
        texto = linhas.join(' — ')
    }

    let el = document.querySelector('#' + idContador)
    if (el) {
        el.innerText = texto
    } else {
        criaTexto({ id: idContador, texto: texto, ancestral: ancestral })
    }
}

async function filtrosNovos(ancestral) {
    let widget = document.querySelector('#rota_filtrosNovos')
    if (widget) widget.remove()
    let janela = confereJanela(
        JANELA.meuPainel,
        JANELA.painelGlobal,
        JANELA.painelGlobalTarefas,
        JANELA.painelGlobalTodos,
        JANELA.escaninho,
        JANELA.pautaAudiencias,
        JANELA.atasAudiencias,
        JANELA.gigsRelatorios,
    )
    if (!janela) {
        console.log('%c[Rota PJE]%c filtrosNovos4: ' + JSON.stringify(4), LOG.rosa, 'color:inherit')
        return
    }
    console.log('%c[Rota PJE]%c filtrosNovos4' + JSON.stringify('true'), LOG.rosa, 'color:inherit')
    criaWidgetfiltrosNovos(ancestral)
}

async function criaWidgetfiltrosNovos(ancestral) {
    let div = 'filtros'
    let divFiltros = criaDiv({
        id: id(div),
        ancestral: ancestral
    })

    const USUARIOS_PERMITIDOS = [
        'gustavo',
        'heber',
        'ronaldo'
        // acrescente aqui
    ]

    let autenticado = false
    let usuarioAtivo = null

    for (let usuario of USUARIOS_PERMITIDOS) {
        let chave = 'rota_filtroAutenticacao_' + usuario
        let armazenado = await obterArmazenamento([chave])
        let dados = armazenado?.[chave]
        if (dados?.tf && dados?.horario && (Date.now() - dados.horario) < 12 * 60 * 60 * 1000) {
            autenticado = true
            usuarioAtivo = usuario
            break
        }
    }

    if (!autenticado) {
        await obterAutenticacao(id(div))
    } else {
        await apresentaFiltros(ancestral)
    }
    return

    // ── Autenticação ─────────────────────────────────────────────
    async function obterAutenticacao(ancestral) {
        let secao = 'senha'
        let divAutenticaNome = id(div, secao, 'autentica')
        let divAutentica = criaDiv({
            id: divAutenticaNome,
            ancestral: ancestral
        })
        let idInputUsuario = id(div, secao, 'input') + '_usuario'
        let idInputSenha   = id(div, secao, 'input')

        let inputUsuario = criaInput({
            id: idInputUsuario,
            textoEmCima: 'Usuário',
            ancestral: divAutenticaNome
        })
        inputUsuario.container.style.width = '95%'
        inputUsuario.container.style.margin = '4px'
        inputUsuario.autocomplete = 'username'

        let inputSenha = criaInput({
            id: idInputSenha,
            textoEmCima: 'Senha',
            ancestral: divAutenticaNome
        })
        inputSenha.container.style.width = '95%'
        inputSenha.container.style.margin = '4px'
        inputSenha.type = 'password'
        inputSenha.autocomplete = 'new-password'

        inputUsuario.addEventListener('blur', () => {
            let usuario = inputUsuario.value.trim().toLowerCase()
            if (!usuario) return
            if (!USUARIOS_PERMITIDOS.includes(usuario)) {
                inputSenha.type = ''
                inputSenha.autocomplete = 'off'
                inputSenha.value = 'Usuário não possui permissão'
                inputSenha.disabled = true
                botao.disabled = true
            } else {
                if (inputSenha.value === 'Usuário não possui permissão') {
                    inputSenha.type = 'password'
                    inputSenha.autocomplete = 'new-password'
                    inputSenha.value = ''
                }
                inputSenha.disabled = false
                botao.disabled = false
            }
        })

        let botao = criaBotaoAzul({
            id: id(div, secao, 'botao'),
            texto: 'Autenticar',
            acao: () => confereSenha(idInputUsuario, idInputSenha, divAutentica),
            ancestral: divAutenticaNome
        })

        async function confereSenha(idInputUsuario, idInputSenha, divRemover) {
            let usuario = document.querySelector('#' + idInputUsuario).value.trim().toLowerCase()
            let senha   = document.querySelector('#' + idInputSenha).value

            if (!USUARIOS_PERMITIDOS.includes(usuario)) return

            let chave = 'rota_filtroAutenticacao_' + usuario
            let armazenado = await obterArmazenamento([chave])
            let hashSalvo  = armazenado?.[chave]?.hash
            let hashDigitado = await _hashSenha(senha)

            if (!hashSalvo) {
                await armazenar({ [chave]: { hash: hashDigitado, tf: true, horario: Date.now() } })
                divRemover.remove()
                await apresentaFiltros(ancestral)
            } else if (hashDigitado === hashSalvo) {
                await armazenar({ [chave]: { hash: hashSalvo, tf: true, horario: Date.now() } })
                divRemover.remove()
                await apresentaFiltros(ancestral)
            } else {
                inputSenha.value = ''
                inputSenha.placeholder = 'Senha incorreta'
                setTimeout(() => inputSenha.placeholder = 'Senha', 3000)
            }
        }

        async function _hashSenha(texto) {
            let buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto))
            return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('')
        }
    }

    // ── Filtros ──────────────────────────────────────────────────
    async function apresentaFiltros(ancestral) {
        let secao = 'filtros'

        let botoes = [

            // ── 1. Lista processos por CNPJ/CPF (Tarefa) ─────────
            {
                id: id(secao, 'botao', 'cnpjcpf_tarefa'),
                texto: 'Lista processos por CNPJ/CPF — por Tarefa',
                inputs: [
                    {
                        id: id(secao, 'input', 'cnpjcpf_tarefa_nome'),
                        textoEmCima: 'Nome da tarefa',
                        placeholder: 'Ex: Concluso para sentença',
                        tipoInput: 'criaInput',
                    }
                ],
                funcao: async (valores, ancestral) => {
                    let nomeTarefa = valores[0]?.trim()
                    if (!nomeTarefa) return 'Informe o nome da tarefa.'

                    // Etapa 1/2 — coleta dos processos da tarefa
                    let tarefa = await resolverTarefa(nomeTarefa)
                    if (!tarefa) return 'Tarefa não encontrada.'
                    let r = await buscarProcessosPorTarefaPagina(tarefa.id, 1)
                    let ids = r.ids, t = r.t
                    atualizar_contador(ancestral, '1/2', '1/' + r.paginas)
                    for (let pagina = 2; pagina <= r.paginas; pagina++) {
                        atualizar_contador(ancestral, '1/2', pagina + '/' + r.paginas)
                        let rp = await buscarProcessosPorTarefaPagina(tarefa.id, pagina)
                        ids.push(...rp.ids); t.push(...rp.t)
                    }
                    if (!ids.length) return 'Nenhum processo encontrado.'

                    // Etapa 2/2 — partes de cada processo
                    let d = []
                    for (let idx = 0; idx < ids.length; idx++) {
                        atualizar_contador(ancestral, '2/2', (idx + 1) + '/' + ids.length)
                        let r2 = await buscarProcesso(ids[idx], '/partes')
                        let numero = t[idx]?.numero || ''
                        let autor  = t[idx]?.autor  || ''
                        for (let j of r2?.PASSIVO || []) {
                            let maisReclamadas = r2?.PASSIVO.length === 1 ? 'Não' : 'Sim'
                            d.push({
                                documento:         j?.documento || '',
                                processo:          numero,
                                reclamada:         j?.nome,
                                reclamante:        autor,
                                Outras_Reclamadas: maisReclamadas,
                            })
                        }
                    }
                    return d
                }
            },

            // ── 2. Lista processos Tema 1389 (Tarefa) ─────────────
            {
                id: id(secao, 'botao', 'tema1389_tarefa'),
                texto: 'Lista processos Tema 1389 — por Tarefa',
                inputs: [
                    {
                        id: id(secao, 'input', 'tema1389_tarefa_nome'),
                        textoEmCima: 'Nome da tarefa',
                        placeholder: 'Ex: Concluso para sentença',
                        tipoInput: 'criaInput',
                    }
                ],
                funcao: async (valores, ancestral) => {
                    let nomeTarefa = valores[0]?.trim()
                    if (!nomeTarefa) return 'Informe o nome da tarefa.'

                    // Etapa 1/2 — coleta dos processos da tarefa
                    let tarefa = await resolverTarefa(nomeTarefa)
                    if (!tarefa) return 'Tarefa não encontrada.'
                    let r = await buscarProcessosPorTarefaPagina(tarefa.id, 1)
                    let ids = r.ids, t = r.t
                    atualizar_contador(ancestral, '1/2', '1/' + r.paginas)
                    for (let pagina = 2; pagina <= r.paginas; pagina++) {
                        atualizar_contador(ancestral, '1/2', pagina + '/' + r.paginas)
                        let rp = await buscarProcessosPorTarefaPagina(tarefa.id, pagina)
                        ids.push(...rp.ids); t.push(...rp.t)
                    }
                    if (!ids.length) return 'Nenhum processo encontrado.'

                    // Etapa 2/2 — sobrestamento/gigs de cada processo
                    let d = []
                    for (let idx = 0; idx < ids.length; idx++) {
                        atualizar_contador(ancestral, '2/2', (idx + 1) + '/' + ids.length)
                        let sobrestamentos = await rota_fetch(location.origin + '/pje-comum-api/api/processos/id/' + ids[idx] + '/sobrestamentos') || []
                        let sobrestamento = sobrestamentos.find(s => !s.dataRevogacao)
                        let textoSobrestamento = sobrestamento?.textoFinalExternoSobrestamento || ''
                        let numero   = t[idx]?.numero  || ''
                        let autor    = t[idx]?.autor   || ''
                        let reu      = t[idx]?.reu     || ''
                        let autuacao = (new Date(t[idx]?.autuadoEm).toLocaleDateString('pt-BR')) || ''
                        let gigs = []
                        if (new Date(t[idx]?.autuadoEm) >= new Date('2025-10-20') &&
                            (textoSobrestamento?.includes('1389') || textoSobrestamento?.includes('1.389'))) {
                            gigs = await buscarGigs(numero)
                        }
                        let gig = gigs.find(gig => /GAB.*JU.*/i.test(gig?.tipoAtividade?.descricao || '')) ?? {}
                        let gigNormalizado = normalizar(gig?.tipoAtividade?.descricao)
                        let juizSimetria = gigNormalizado.split(/ju[ií]za?/i, 2)[1]?.trim().toUpperCase() || ''
                        d.push({
                            id:            ids[idx] || '',
                            processo:      numero   || '',
                            autor:         autor    || '',
                            reu:           reu      || '',
                            sobrestamento: textoSobrestamento || '',
                            autuacao:      autuacao || '',
                            juiz_simetria: juizSimetria || '',
                        })
                    }
                    return d
                }
            },

            // ── 3a. Lista número/partes/autuação/tarefa — por Tarefa ─
            {
                id: id(secao, 'botao', 'listagem_tarefa'),
                texto: 'Lista número, partes, autuação, tarefa — por Tarefa',
                inputs: [
                    {
                        id: id(secao, 'input', 'listagem_tarefa_nome'),
                        textoEmCima: 'Nome da tarefa (ou TODAS)',
                        placeholder: 'TODAS',
                        tipoInput: 'criaInput',
                    }
                ],
                funcao: async (valores, ancestral) => {
                    let valorTarefa = valores[0]?.trim() || 'TODAS'
                    let idsx = [], tx = []
                    let tarefas = await rota_fetch(location.origin + '/pje-comum-api/api/tarefas/ativas?presenteEmProcesso=true')
                    if (valorTarefa !== 'TODAS') {
                        tarefas = [tarefas.find(t => t.nome.toLowerCase() === valorTarefa.toLowerCase())]
                    }
                    // Único estágio de rede: para cada tarefa (etapa), percorre
                    // suas páginas (filtrando). Só se aplica quando "TODAS".
                    for (let it = 0; it < tarefas.length; it++) {
                        let tarefaNome = tarefas[it]?.nome
                        if (!tarefaNome?.toLowerCase().includes('arquiv' || 'cartas devolvidas')) {
                            let etapaTexto = tarefas.length > 1 ? (it + 1) + '/' + tarefas.length : 0
                            let tarefa = await resolverTarefa(tarefaNome)
                            if (!tarefa) continue
                            let r = await buscarProcessosPorTarefaPagina(tarefa.id, 1)
                            atualizar_contador(ancestral, etapaTexto, '1/' + r.paginas)
                            idsx.push(...r.ids); tx.push(...r.t)
                            for (let pagina = 2; pagina <= r.paginas; pagina++) {
                                atualizar_contador(ancestral, etapaTexto, pagina + '/' + r.paginas)
                                let rp = await buscarProcessosPorTarefaPagina(tarefa.id, pagina)
                                idsx.push(...rp.ids); tx.push(...rp.t)
                            }
                        }
                    }
                    if (!idsx.length) return 'Nenhum processo encontrado.'
                    let d = []
                    for (let i = 0; i < idsx.length; i++) {
                        d.push({
                            Id:         idsx[i] || '',
                            Processo:   tx[i]?.numero || '',
                            Tipo:       tx[i]?.descricaoClasseJudicial || '',
                            Reclamada:  tx[i]?.reu   || '',
                            Reclamante: tx[i]?.autor || '',
                            Autuado_em: (new Date(tx[i]?.autuadoEm).toLocaleDateString('pt-BR')) || '',
                        })
                    }
                    return d
                }
            },

            // ── 3b. Lista número/partes/autuação/tarefa — por Lista ──
            {
                id: id(secao, 'botao', 'listagem_lista'),
                texto: 'Lista número, partes, autuação, tarefa — por Lista',
                inputs: [
                    {
                        id: id(secao, 'input', 'listagem_lista_nums'),
                        textoEmCima: 'Números CNJ (um por linha)',
                        placeholder: '0000000-00.0000.0.00.0000',
                        tipoInput: 'criaInputAnotacao',
                    }
                ],
                funcao: async (valores, ancestral) => {
                    let numerosRaw = valores[0] || ''
                    let numeros = numerosRaw.split('\n').map(s => s.trim()).filter(Boolean)
                    if (!numeros.length) return 'Nenhum número informado.'
                    let idsx = [], tx = []
                    for (let i = 0; i < numeros.length; i++) {
                        atualizar_contador(ancestral, 0, (i + 1) + '/' + numeros.length)
                        let idProcesso = await buscarIdPeloNumeroCNJ(numeros[i])
                        if (idProcesso) { idsx.push(idProcesso); tx.push({ numero: numeros[i] }) }
                    }
                    if (!idsx.length) return 'Nenhum processo encontrado.'
                    let d = []
                    for (let i = 0; i < idsx.length; i++) {
                        d.push({
                            Id:         idsx[i] || '',
                            Processo:   tx[i]?.numero || '',
                            Tipo:       tx[i]?.descricaoClasseJudicial || '',
                            Reclamada:  tx[i]?.reu   || '',
                            Reclamante: tx[i]?.autor || '',
                            Autuado_em: (new Date(tx[i]?.autuadoEm).toLocaleDateString('pt-BR')) || '',
                        })
                    }
                    return d
                }
            },

            // ── 4a. PJC único + Sentenças — por Tarefa ────────────
            {
                id: id(secao, 'botao', 'pjc_tarefa'),
                texto: 'PJC único + Sentenças — por Tarefa',
                inputs: [
                    {
                        id: id(secao, 'input', 'pjc_tarefa_nome'),
                        textoEmCima: 'Nome da tarefa (ou TODAS)',
                        placeholder: 'TODAS',
                        tipoInput: 'criaInput',
                    }
                ],
                funcao: async (valores, ancestral) => {
                    let valorTarefa = valores[0]?.trim() || 'TODAS'
                    let idsx = [], tx = []
                    let tarefas = await rota_fetch(location.origin + '/pje-comum-api/api/tarefas/ativas?presenteEmProcesso=true')
                    if (valorTarefa !== 'TODAS') {
                        tarefas = [tarefas.find(t => t.nome.toLowerCase() === valorTarefa.toLowerCase())]
                    }
                    // Etapa 1/2 — coleta dos processos (uma ou mais tarefas)
                    for (let tarefaAtiva of tarefas) {
                        if (!tarefaAtiva?.nome?.toLowerCase().includes('arquiv' || 'cartas devolvidas')) {
                            let tarefa = await resolverTarefa(tarefaAtiva.nome)
                            if (!tarefa) continue
                            let r = await buscarProcessosPorTarefaPagina(tarefa.id, 1)
                            atualizar_contador(ancestral, '1/2', '1/' + r.paginas)
                            idsx.push(...r.ids); tx.push(...r.t)
                            for (let pagina = 2; pagina <= r.paginas; pagina++) {
                                atualizar_contador(ancestral, '1/2', pagina + '/' + r.paginas)
                                let rp = await buscarProcessosPorTarefaPagina(tarefa.id, pagina)
                                idsx.push(...rp.ids); tx.push(...rp.t)
                            }
                        }
                    }
                    if (!idsx.length) return 'Nenhum processo encontrado.'
                    return await _executaPjcSentencas(idsx, tx, ancestral, '2/2')
                }
            },

            // ── 4b. PJC único + Sentenças — por Lista ─────────────
            {
                id: id(secao, 'botao', 'pjc_lista'),
                texto: 'PJC único + Sentenças — por Lista',
                inputs: [
                    {
                        id: id(secao, 'input', 'pjc_lista_nums'),
                        textoEmCima: 'Números CNJ (um por linha)',
                        placeholder: '0000000-00.0000.0.00.0000',
                        tipoInput: 'criaInputAnotacao',
                    }
                ],
                funcao: async (valores, ancestral) => {
                    let numerosRaw = valores[0] || ''
                    let numeros = numerosRaw.split('\n').map(s => s.trim()).filter(Boolean)
                    if (!numeros.length) return 'Nenhum número informado.'
                    let idsx = [], tx = []
                    for (let i = 0; i < numeros.length; i++) {
                        atualizar_contador(ancestral, '1/2', (i + 1) + '/' + numeros.length)
                        let idProcesso = await buscarIdPeloNumeroCNJ(numeros[i])
                        if (idProcesso) { idsx.push(idProcesso); tx.push({ numero: numeros[i] }) }
                    }
                    if (!idsx.length) return 'Nenhum processo encontrado.'
                    return await _executaPjcSentencas(idsx, tx, ancestral, '2/2')
                }
            },

            // ── 5. Lista informações por GIG (Tarefa) ─────────────
            {
                id: id(secao, 'botao', 'gig_tarefa'),
                texto: 'Lista informações dos processos pelo GIG — por Tarefa',
                inputs: [
                    {
                        id: id(secao, 'input', 'gig_tarefa_nome'),
                        textoEmCima: 'Nome do GIG',
                        placeholder: 'Ex: GAB JUÍZA FULANA',
                        tipoInput: 'criaInput',
                    }
                ],
                funcao: async (valores, ancestral) => {
                    let nomeGig = valores[0]?.trim()
                    if (!nomeGig) return 'Informe o nome do GIG.'
                    let gigs = await resolverGigs(nomeGig)
                    if (!gigs.length) return 'Nenhum processo encontrado.'
                    let ids = [], t = []
                    for (let ig = 0; ig < gigs.length; ig++) {
                        let etapaTexto = gigs.length > 1 ? (ig + 1) + '/' + gigs.length : 0
                        let r = await buscarProcessosPorGigPagina(gigs[ig].id, 1)
                        atualizar_contador(ancestral, etapaTexto, '1/' + r.paginas)
                        ids.push(...r.ids); t.push(...r.t)
                        for (let pagina = 2; pagina <= r.paginas; pagina++) {
                            atualizar_contador(ancestral, etapaTexto, pagina + '/' + r.paginas)
                            let rp = await buscarProcessosPorGigPagina(gigs[ig].id, pagina)
                            ids.push(...rp.ids); t.push(...rp.t)
                        }
                    }
                    if (!ids.length) return 'Nenhum processo encontrado.'
                    let d = []
                    for (let i = 0; i < ids.length; i++) {
                        d.push({
                            Id:         t[i]?.processo?.id          || '',
                            Processo:   t[i]?.processo?.numero      || '',
                            Reclamada:  t[i]?.processo?.nomeParteRe || '',
                            Reclamante: t[i]?.processo?.nomeParteAutora || '',
                            Tarefa:     t[i]?.processo?.nomeTarefa  || '',
                        })
                    }
                    return d
                }
            },

            // ── 6. Simetria sem GIG Gabinete — por Tarefa ─────────
            {
                id: id(secao, 'botao', 'simetria_tarefa'),
                texto: 'Simetria sem GIG Gabinete — por Tarefa',
                inputs: [
                    {
                        id: id(secao, 'input', 'simetria_tarefa_nome'),
                        textoEmCima: 'Nome da tarefa',
                        placeholder: 'Ex: Concluso para sentença',
                        tipoInput: 'criaInput',
                    }
                ],
                funcao: async (valores, ancestral) => {
                    let nomeTarefa = valores[0]?.trim()
                    if (!nomeTarefa) return 'Informe o nome da tarefa.'

                    // Etapa 1/2 — coleta dos processos da tarefa
                    let tarefa = await resolverTarefa(nomeTarefa)
                    if (!tarefa) return 'Tarefa não encontrada.'
                    let r = await buscarProcessosPorTarefaPagina(tarefa.id, 1, '&idEtiqueta=316')
                    let ids = r.ids, t = r.t
                    atualizar_contador(ancestral, '1/2', '1/' + r.paginas)
                    for (let pagina = 2; pagina <= r.paginas; pagina++) {
                        atualizar_contador(ancestral, '1/2', pagina + '/' + r.paginas)
                        let rp = await buscarProcessosPorTarefaPagina(tarefa.id, pagina, '&idEtiqueta=316')
                        ids.push(...rp.ids); t.push(...rp.t)
                    }
                    if (!ids.length) return 'Nenhum processo encontrado.'
                    return await _executaSimetriaSemGig(ids, t, ancestral, '2/2')
                }
            },

            // ── 6b. Simetria sem GIG Gabinete — por Lista ─────────
            {
                id: id(secao, 'botao', 'simetria_lista'),
                texto: 'Simetria sem GIG Gabinete — por Lista',
                inputs: [
                    {
                        id: id(secao, 'input', 'simetria_lista_nums'),
                        textoEmCima: 'Números CNJ (um por linha)',
                        placeholder: '0000000-00.0000.0.00.0000',
                        tipoInput: 'criaInputAnotacao',
                    }
                ],
                funcao: async (valores, ancestral) => {
                    let numerosRaw = valores[0] || ''
                    let numeros = numerosRaw.split('\n').map(s => s.trim()).filter(Boolean)
                    if (!numeros.length) return 'Nenhum número informado.'
                    let ids = [], t = []
                    for (let i = 0; i < numeros.length; i++) {
                        atualizar_contador(ancestral, '1/2', (i + 1) + '/' + numeros.length)
                        let idProcesso = await buscarIdPeloNumeroCNJ(numeros[i])
                        if (idProcesso) { ids.push(idProcesso); t.push({ numero: numeros[i] }) }
                    }
                    if (!ids.length) return 'Nenhum processo encontrado.'
                    return await _executaSimetriaSemGig(ids, t, ancestral, '2/2')
                }
            },

            // ── 7a. Processos sem .pjc na tarefa — por Tarefa ─────
            {
                id: id(secao, 'botao', 'sempjc_tarefa'),
                texto: 'Processos sem .pjc na tarefa — por Tarefa',
                inputs: [
                    {
                        id: id(secao, 'input', 'sempjc_tarefa_nome'),
                        textoEmCima: 'Nome da tarefa',
                        placeholder: 'Ex: Concluso para sentença',
                        tipoInput: 'criaInput',
                    }
                ],
                funcao: async (valores, ancestral) => {
                    let nomeTarefa = valores[0]?.trim()
                    if (!nomeTarefa) return 'Informe o nome da tarefa.'

                    // Etapa 1/2 — coleta dos processos da tarefa
                    let tarefa = await resolverTarefa(nomeTarefa)
                    if (!tarefa) return 'Tarefa não encontrada.'
                    let r = await buscarProcessosPorTarefaPagina(tarefa.id, 1)
                    let ids = r.ids, t = r.t
                    atualizar_contador(ancestral, '1/2', '1/' + r.paginas)
                    for (let pagina = 2; pagina <= r.paginas; pagina++) {
                        atualizar_contador(ancestral, '1/2', pagina + '/' + r.paginas)
                        let rp = await buscarProcessosPorTarefaPagina(tarefa.id, pagina)
                        ids.push(...rp.ids); t.push(...rp.t)
                    }
                    if (!ids.length) return 'Nenhum processo encontrado.'
                    return await _executaSemPjc(ids, t, ancestral, '2/2')
                }
            },

            // ── 7b. Processos sem .pjc na tarefa — por Lista ──────
            {
                id: id(secao, 'botao', 'sempjc_lista'),
                texto: 'Processos sem .pjc na tarefa — por Lista',
                inputs: [
                    {
                        id: id(secao, 'input', 'sempjc_lista_nums'),
                        textoEmCima: 'Números CNJ (um por linha)',
                        placeholder: '0000000-00.0000.0.00.0000',
                        tipoInput: 'criaInputAnotacao',
                    }
                ],
                funcao: async (valores, ancestral) => {
                    let numerosRaw = valores[0] || ''
                    let numeros = numerosRaw.split('\n').map(s => s.trim()).filter(Boolean)
                    if (!numeros.length) return 'Nenhum número informado.'
                    let ids = [], t = []
                    for (let i = 0; i < numeros.length; i++) {
                        atualizar_contador(ancestral, '1/2', (i + 1) + '/' + numeros.length)
                        let idProcesso = await buscarIdPeloNumeroCNJ(numeros[i])
                        if (idProcesso) { ids.push(idProcesso); t.push({ numero: numeros[i] }) }
                    }
                    if (!ids.length) return 'Nenhum processo encontrado.'
                    return await _executaSemPjc(ids, t, ancestral, '2/2')
                }
            },

            // ── 8. Recebimento do TRT — por Tarefa ────────────────
            {
                id: id(secao, 'botao', 'recebimento_tarefa'),
                texto: 'Recebimento do TRT (Acordo / Improcedência) — por Tarefa',
                inputs: [
                    {
                        id: id(secao, 'input', 'recebimento_tarefa_nome'),
                        textoEmCima: 'Nome da tarefa',
                        placeholder: 'Ex: Concluso para sentença',
                        tipoInput: 'criaInput',
                    }
                ],
                funcao: async (valores, ancestral) => {
                    let nomeTarefa = valores[0]?.trim()
                    if (!nomeTarefa) return 'Informe o nome da tarefa.'

                    // Etapa 1/2 — coleta dos processos da tarefa
                    let tarefa = await resolverTarefa(nomeTarefa)
                    if (!tarefa) return 'Tarefa não encontrada.'
                    let r = await buscarProcessosPorTarefaPagina(tarefa.id, 1)
                    let ids = r.ids, t = r.t
                    atualizar_contador(ancestral, '1/2', '1/' + r.paginas)
                    for (let pagina = 2; pagina <= r.paginas; pagina++) {
                        atualizar_contador(ancestral, '1/2', pagina + '/' + r.paginas)
                        let rp = await buscarProcessosPorTarefaPagina(tarefa.id, pagina)
                        ids.push(...rp.ids); t.push(...rp.t)
                    }
                    if (!ids.length) return 'Nenhum processo encontrado.'
                    return await _executaRecebimentoTRT(ids, t, ancestral, '2/2')
                }
            },

            // ── 8b. Recebimento do TRT — por Lista ────────────────
            {
                id: id(secao, 'botao', 'recebimento_lista'),
                texto: 'Recebimento do TRT (Acordo / Improcedência) — por Lista',
                inputs: [
                    {
                        id: id(secao, 'input', 'recebimento_lista_nums'),
                        textoEmCima: 'Números CNJ (um por linha)',
                        placeholder: '0000000-00.0000.0.00.0000',
                        tipoInput: 'criaInputAnotacao',
                    }
                ],
                funcao: async (valores, ancestral) => {
                    let numerosRaw = valores[0] || ''
                    let numeros = numerosRaw.split('\n').map(s => s.trim()).filter(Boolean)
                    if (!numeros.length) return 'Nenhum número informado.'
                    let ids = [], t = []
                    for (let i = 0; i < numeros.length; i++) {
                        atualizar_contador(ancestral, '1/2', (i + 1) + '/' + numeros.length)
                        let idProcesso = await buscarIdPeloNumeroCNJ(numeros[i])
                        if (idProcesso) { ids.push(idProcesso); t.push({ numero: numeros[i] }) }
                    }
                    if (!ids.length) return 'Nenhum processo encontrado.'
                    return await _executaRecebimentoTRT(ids, t, ancestral, '2/2')
                }
            },

            // ── 9. Audiências até data — por Sala ─────────────────
            {
                id: id(secao, 'botao', 'analisa_triagem'),
                texto: 'Analisa a triagem.',
                inputs: [
                    {
                        id: id(secao, 'input', 'audiencias_sala_juiz'),
                        textoEmCima: 'Nome da sala na OJ.',
                        placeholder: 'Ex: FULANO DE TAL',
                        tipoInput: 'criaInput',
                    },
                    {
                        id: id(secao, 'input', 'audiencias_tipo'),
                        textoEmCima: 'Tipos de audiência a buscar, separados por vírgula. Deixe em branco para todas.',
                        placeholder: 'Ex: "inicial, una", "una", "rito sumarissimo, instrucao"',
                        tipoInput: 'criaInput',
                    },
                    {
                        id: id(secao, 'input', 'audiencias_maximo'),
                        textoEmCima: 'Quantos processos devem ser buscados',
                        placeholder: '100. Caso não seja informado, será 50.',
                        tipoInput: 'criaInput',
                    }
                ],
                funcao: async (valores, ancestral) => {
                    let nomeSala        = valores[0]?.trim() || ''
                    let tipoAudiencia   = valores[1]?.trim() || ''
                    let maximo          = Number(valores[2]?.trim()) || ''
                    if (!nomeSala) {
                        return 'Informe o nome da sala.'
                    }
                    if (!maximo) maximo = 50
                    if (typeof maximo !== 'number') {
                        return 'O valor informado para a quantidade de processos deve ser um número.'
                    }
                    let sala = await resolverSala(nomeSala)
                    if (!sala) return 'Sala não encontrada.'
                    let i = 0
                    let resultadoAudiencia = []
                    atualizar_contador(ancestral, '1 / X', 0 + '/' + maximo)
                    for (let j = 0; j < 10; j++){
                        if (i > maximo) break
                        let data = acertaData()
                        let dados = await buscarProcessosNaSalaPorData(sala.id, data)
                        console.log('%c[Rota PJE]%c dados: ' + JSON.stringify(dados), LOG.teste, 'color:inherit', dados)
                        if (!dados?.t) continue
                        for (audiencia of dados?.t){
                            console.log('%c[Rota PJE]%c audiencia: ' + JSON.stringify(audiencia), LOG.teste, 'color:inherit')
                            if(
                                tipoAudiencia.split(',').map(d => d.trim()).some(d=> (normalizar(audiencia?.tipo?.descricao.toLowerCase())).includes(d))
                                && audiencia.idProcesso
                            ){
                                i++
                                atualizar_contador(ancestral, '1 / X', i + '/' + maximo)
                                resultadoAudiencia.push(audiencia)
                                if (i > maximo) break
                            }
                        }
                        function acertaData(){
                            let data = new Date()
                            data.setDate(data.getDate() + i)
                            let dado = data.toISOString().slice(0, 10)
                            return dado
                        }
                    }
                    console.log('%c[Rota PJE]%c resultadoAudiencia: ' + JSON.stringify(resultadoAudiencia), LOG.rosa, 'color:inherit')
                    if (!resultadoAudiencia.length) return 'Não foram encontradas audiências para o tipo informado.'
                    let resultadoProcesso = []
                    for (dado of resultadoAudiencia){
                        let id = dado?.idProcesso
                        let timeline = await buscarDocumentos(id) || []
                        let documentos = timeline.filter(d => d?.usuarioInterno || d?.tipo === 'Petição Inicial')
                        let teorDocumentos = await Promise.all(
                            documentos.map(async (d) => {
                                let idDocumento = d?.id;
                                let teor = await extrairTexto(id, idDocumento);
                                return {
                                    teorDocumento: {
                                        idDocumento: idDocumento,
                                        teor: teor
                                    }
                                };
                            })
                        )
                        resultadoProcesso.push({dadosAudiencia: dado, timeline: timeline, teorDocumentosPrincipais: teorDocumentos})
                    }
                    _baixarArquivo(JSON.stringify(resultadoProcesso, null, 2), 'audiencias.json', 'application/json')
                    return 'O arquivo foi baixado.'
                    //let dias = parseInt((dataTransformada - hoje) / (1000 * 60 * 60 * 24))
                    //let sala = await resolverSala(nomeSala)
                    //if (!sala) return 'Sala não encontrada.'
                    //let ids = [], t = []
                    //let datas = listarDatasParaSala(dias)
                    //for (let i = 0; i < datas.length; i++) {
                    //    atualizar_contador(ancestral, 0, (i + 1) + '/' + datas.length)
                    //    let r = await buscarProcessosNaSalaPorData(sala.id, datas[i])
                    //    ids.push(...r.ids); t.push(...r.t)
                    //}
                    //if (!ids.length) return 'Nenhum processo encontrado.'
                    //let d = []
                    //const formatarHora = h => h ? h.slice(0, 5).replace(':', 'h') : ''
                    //const formatarData = d => d ? d.slice(0, 10).split('-').reverse().join('/') : ''
                    //const limiteSimet = new Date('2025-10-19')
                    //for (let i in t) {
                    //    const horarioRaw  = t[i]?.pautaAudienciaHorario?.horaInicial || ''
                    //    const dataRaw     = t[i]?.data || ''
                    //    const autuacaoRaw = t[i]?.processo?.autuadoEm || ''
                    //    const autuacaoDate = new Date(autuacaoRaw.slice(0, 10))
                    //    const processo    = t[i]?.nrProcesso || ''
                    //    d.push({
                    //        processo:          processo,
                    //        horario:           formatarHora(horarioRaw),
                    //        data:              formatarData(dataRaw),
                    //        autuacao:          formatarData(autuacaoRaw),
                    //        simetriaOuLegado:  processo === '' ? '' : autuacaoDate > limiteSimet ? 'SIMETRIA' : 'LEGADO',
                    //    })
                    //}
                    //return d.length ? d : 'Nenhum processo encontrado.'
                    
                }
            },
            // ── 9. Audiências até data — por Sala ─────────────────
            {
                id: id(secao, 'botao', 'audiencias_sala'),
                texto: 'Listar audiências na sala até a data — por Sala',
                inputs: [
                    {
                        id: id(secao, 'input', 'audiencias_sala_juiz'),
                        textoEmCima: 'Nome da sala / juiz',
                        placeholder: 'Ex: FULANO DE TAL',
                        tipoInput: 'criaInput',
                    },
                    {
                        id: id(secao, 'input', 'audiencias_sala_data'),
                        textoEmCima: 'Data limite (dd/mm/aaaa)',
                        placeholder: '31/12/2024',
                        tipoInput: 'criaInput',
                    }
                ],
                funcao: async (valores, ancestral) => {
                    let juiz = valores[0]?.trim() || ''
                    let data = valores[1]?.trim() || ''
                    let dataTransformada = _dataParaJS(data)
                    if (!juiz || !data || !dataTransformada) {
                        return 'Informe o nome da sala e a data no formato dd/mm/aaaa.'
                    }
                    let hoje = new Date()
                    let dias = parseInt((dataTransformada - hoje) / (1000 * 60 * 60 * 24))
                    let sala = await resolverSala(juiz)
                    if (!sala) return 'Sala não encontrada.'
                    let ids = [], t = []
                    let datas = listarDatasParaSala(dias)
                    for (let i = 0; i < datas.length; i++) {
                        atualizar_contador(ancestral, 0, (i + 1) + '/' + datas.length)
                        let r = await buscarProcessosNaSalaPorData(sala.id, datas[i])
                        ids.push(...r.ids); t.push(...r.t)
                    }
                    if (!ids.length) return 'Nenhum processo encontrado.'
                    let d = []
                    const formatarHora = h => h ? h.slice(0, 5).replace(':', 'h') : ''
                    const formatarData = d => d ? d.slice(0, 10).split('-').reverse().join('/') : ''
                    const limiteSimet = new Date('2025-10-19')
                    for (let i in t) {
                        const horarioRaw  = t[i]?.pautaAudienciaHorario?.horaInicial || ''
                        const dataRaw     = t[i]?.data || ''
                        const autuacaoRaw = t[i]?.processo?.autuadoEm || ''
                        const autuacaoDate = new Date(autuacaoRaw.slice(0, 10))
                        const processo    = t[i]?.nrProcesso || ''
                        d.push({
                            processo:          processo,
                            horario:           formatarHora(horarioRaw),
                            data:              formatarData(dataRaw),
                            autuacao:          formatarData(autuacaoRaw),
                            simetriaOuLegado:  processo === '' ? '' : autuacaoDate > limiteSimet ? 'SIMETRIA' : 'LEGADO',
                        })
                    }
                    return d.length ? d : 'Nenhum processo encontrado.'
                }
            },

            // ── 10. Audiências por ID — por Lista ─────────────────
            {
                id: id(secao, 'botao', 'audiencias_lista'),
                texto: 'Lista audiências a partir do ID do processo — por Lista',
                inputs: [
                    {
                        id: id(secao, 'input', 'audiencias_lista_ids'),
                        textoEmCima: 'IDs dos processos (um por linha)',
                        placeholder: '123456',
                        tipoInput: 'criaInputAnotacao',
                    }
                ],
                funcao: async (valores, ancestral) => {
                    let idsRaw = valores[0] || ''
                    let ids = idsRaw.split('\n').map(s => s.trim()).filter(Boolean)
                    if (!ids.length) return 'Nenhum ID informado.'
                    let d = []
                    for (let i = 0; i < ids.length; i++) {
                        atualizar_contador(ancestral, 0, (i + 1) + '/' + ids.length)
                        let idProcesso = ids[i]
                        let audienciasMarcadas = await buscarAudienciasMarcadas(idProcesso)
                        let dataInicio = '-', sala = '-', processo = '-', autuacao = '-', tipo = '-'
                        if (audienciasMarcadas?.dataInicio) {
                            dataInicio = new Date(audienciasMarcadas?.dataInicio).toLocaleDateString('pt-BR')
                            sala       = audienciasMarcadas?.salaFisica?.nome
                            processo   = audienciasMarcadas?.processo?.numero
                            autuacao   = new Date(audienciasMarcadas?.processo?.autuadoEm).toLocaleDateString('pt-BR')
                            tipo       = audienciasMarcadas?.tipo?.descricao
                        }
                        d.push({
                            Id:                idProcesso,
                            Processo:          processo,
                            Sala:              sala,
                            Data_da_Audiencia: dataInicio,
                            Tipo:              tipo,
                            Data_de_Autuacao:  autuacao,
                        })
                    }
                    return d.length ? d : 'Nenhuma audiência encontrada.'
                }
            },

            // ── 11. Dados do processo por ID — por Lista ──────────
            {
                id: id(secao, 'botao', 'dadosprocesso_lista'),
                texto: 'Lista dados do processo a partir do ID — por Lista',
                inputs: [
                    {
                        id: id(secao, 'input', 'dadosprocesso_lista_ids'),
                        textoEmCima: 'IDs dos processos (um por linha)',
                        placeholder: '123456',
                        tipoInput: 'criaInputAnotacao',
                    }
                ],
                funcao: async (valores, ancestral) => {
                    let idsRaw = valores[0] || ''
                    let ids = idsRaw.split('\n').map(s => s.trim()).filter(Boolean)
                    if (!ids.length) return 'Nenhum ID informado.'
                    let d = []
                    for (let i = 0; i < ids.length; i++) {
                        atualizar_contador(ancestral, 0, (i + 1) + '/' + ids.length)
                        let idProcesso = ids[i]
                        let dados    = await buscarProcesso(idProcesso)
                        let processo = dados?.numero || '-'
                        let autuacao = new Date(dados?.autuadoEm).toLocaleDateString('pt-BR') || '-'
                        d.push({
                            Id:              idProcesso,
                            Processo:        processo,
                            Data_de_Autuacao: autuacao,
                        })
                    }
                    return d.length ? d : 'Nenhum processo encontrado.'
                }
            },

            // ── 12. Data da sentença por ID — por Lista ───────────
            {
                id: id(secao, 'botao', 'sentenca_lista'),
                texto: 'Lista data da sentença a partir do ID do processo — por Lista',
                inputs: [
                    {
                        id: id(secao, 'input', 'sentenca_lista_ids'),
                        textoEmCima: 'IDs dos processos (um por linha)',
                        placeholder: '123456',
                        tipoInput: 'criaInputAnotacao',
                    }
                ],
                funcao: async (valores, ancestral) => {
                    let idsRaw = valores[0] || ''
                    let ids = idsRaw.split('\n').map(s => s.trim()).filter(Boolean)
                    if (!ids.length) return 'Nenhum ID informado.'
                    let d = []
                    for (let i = 0; i < ids.length; i++) {
                        atualizar_contador(ancestral, 0, (i + 1) + '/' + ids.length)
                        let idProcesso = ids[i]
                        let documentos   = await buscarDocumentos(idProcesso)
                        let sentenca     = documentos?.find(d => d?.tipo?.toLowerCase().includes('sentença'))
                        let dataSentenca = sentenca ? new Date(sentenca.data).toLocaleDateString('pt-BR') : '-'
                        d.push({
                            id:           idProcesso,
                            Sentenca_data: dataSentenca,
                        })
                    }
                    return d.length ? d : 'Nenhuma sentença encontrada.'
                }
            },

        ] // fim de botoes[]

        // ── Renderiza cada botão ──────────────────────────────────
        let mapaFuncoes = { criaInput, criaInputAnotacao }

        let ranking = (await obterArmazenamento('rota_ranking_botoesFiltro')) || {}
        let botoesOrdenados = [...botoes].sort((a, b) => {
            let ra = ranking[id(secao, a?.id)] || { pontos: 0, ultimoUso: 0 }
            let rb = ranking[id(secao, b?.id)] || { pontos: 0, ultimoUso: 0 }
            if (rb.pontos !== ra.pontos) return rb.pontos - ra.pontos
            return rb.ultimoUso - ra.ultimoUso
        })

        for (let botao of botoesOrdenados) {
            let divId = id(secao, botao?.id)
            let divBotao = criaDiv({ id: divId, ancestral: ancestral })
            criaBotaoAzul({
                id: divId,
                texto: botao?.texto || 'OK',
                ancestral: divId,
                acao: () => criaFiltro(botao?.inputs, divId, botao?.funcao, mapaFuncoes)
            })
        }
    
    }

    // ── criaFiltro ───────────────────────────────────────────────
    async function criaFiltro(inputs, ancestral, funcao, mapaFuncoes) {
        // Remove filtro anterior se já aberto
        let idConteiner = ancestral + '_filtro'
        let remover = document.querySelector('#' + idConteiner) || null
        if (remover){
            remover.remove()
            return
        }
        let divFiltro = criaDiv({ id: idConteiner, ancestral: ancestral })

        for (let input of inputs) {
            let fn = mapaFuncoes[input.tipoInput] || criaInput
            fn({
                id: input.id,
                textoEmCima: input.textoEmCima || null,
                placeholder: input.placeholder || null,
                ancestral: idConteiner
            })
        }

        criaBotaoLaranja({
            id: idConteiner + '_executar',
            texto: 'Filtrar',
            ancestral: idConteiner,
            acao: async () => {
                let ranking = (await obterArmazenamento('rota_ranking_botoesFiltro')) || {}
                let atual = ranking[idConteiner] || { pontos: 0, ultimoUso: 0 }
                // ou use `ancestral`, que é o mesmo valor que idConteiner deriva
                atual.pontos += 1
                atual.ultimoUso = Date.now()
                ranking[idConteiner] = atual
                await armazenar({ rota_ranking_botoesFiltro: ranking})

                let resultado = await funcao(inputs.map(inp => document.querySelector('#' + inp.id)?.value), idConteiner)
                if (Array.isArray(resultado)) {
                    apresentaResultados(resultado)
                } else {
                    atualizar_contador(idConteiner, 0, resultado)
                }
            }
        })
    }

    // ── Helpers compartilhados ────────────────────────────────────

    function _dataParaJS(str) {
        if (!str) return null
        const [d, m, a] = str.split('/')
        if (!d || !m || !a) return null
        return new Date(a, m - 1, d)
    }

    async function _executaPjcSentencas(idsx, tx, ancestral, etapa = 0) {
        let d = []
        let maximo = 0
        for (let i = 0; i < idsx.length; i++) {
            atualizar_contador(ancestral, etapa, (i + 1) + '/' + idsx.length)
            let id = idsx[i]
            let calculos = await buscarCalculos(id) || {}
            let calculo = [...new Set((calculos?.resultado || []).map(d => d?.idPjeCalc))]
            if (calculo.length !== 1) continue
            let idCalculo = (calculos?.resultado.find(d => d?.idPjeCalc == calculo[0]))?.idPJeCalcImportacao || null
            if (!idCalculo) continue
            let pjc     = await rota_download(location.origin + '/pje-comum-api/api/calculos/' + idCalculo + '/pjc')
            let acordo  = await rota_buscarDocumentoHomologatorio(id) || null
            let idsDocs = []
            if (acordo) {
                idsDocs.push(acordo)
            } else {
                let timeline   = await buscarDocumentos(id) || []
                let tituloRegex = /^TST\s*-\s*(Acórdão|Decisão)\b/i
                let sentencas  = timeline
                    .filter(d => ['Sentença', 'Acórdão'].includes(d?.tipo) || tituloRegex.test(d?.titulo || ''))
                    .map(d => d?.id) || []
                idsDocs.push(...sentencas)
            }
            let encontrado = false
            let conteudos  = []
            for (let idDoc of idsDocs) {
                let conteudo    = await extrairTexto(id, idDoc) || ''
                let horasExtras = buscaEmTextoMalFormatado(conteudo, 'horas extras', 0, 0)
                if (horasExtras?.trechos) encontrado = true
                conteudos.push(idDoc + ': ' + conteudo)
            }
            if (pjc && encontrado) {
                maximo++
                d.push({
                    Id:       id || '',
                    Numero:   tx[i]?.numero || '',
                    PJC:      await blobParaBase64(pjc),
                    Conteudo: conteudos.join(''),
                })
            }
            if (maximo === 50) break
        }
        let json = JSON.stringify(d)
        const blob = new Blob([json], { type: 'application/json' })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = 'calculos.json'
        a.click()
        return d.map(t => ({ Id: t?.Id, Numero: t?.Numero }))
    }

    async function _executaSimetriaSemGig(ids, t, ancestral, etapa = 0) {
        let d = []
        let numeros = t.map(tt => tt.numero)
        for (let idx = 0; idx < numeros.length; idx++) {
            atualizar_contador(ancestral, etapa, (idx + 1) + '/' + numeros.length)
            let numero     = numeros[idx]
            let gigs       = await buscarGigs(numero)
            let ativos     = gigs.filter(gig => gig.statusAtividade !== 'Concluído')
            let concluidos = gigs.filter(gig => gig.statusAtividade === 'Concluído')
            let temAtivoGab = ativos.some(gig => /GAB.*JU.*/i.test(gig?.tipoAtividade?.descricao || ''))
            if (temAtivoGab) continue
            let gigConcluido = concluidos
                .find(gig => /GAB.*JU.*/i.test(gig?.tipoAtividade?.descricao || ''))
                ?.tipoAtividade?.descricao ?? 'Não foi encontrado GIG de Gabinete concluído.'
            d.push({
                processo:                numero,
                gig_concluido_encontrado: gigConcluido,
            })
        }
        return d.length ? d : 'Nenhum processo encontrado sem GIG de Gabinete ativo.'
    }

    async function _executaSemPjc(ids, t, ancestral, etapa = 0) {
        let d = []
        for (let idx = 0; idx < ids.length; idx++) {
            atualizar_contador(ancestral, etapa, (idx + 1) + '/' + ids.length)
            let calculos = await buscarCalculos(ids[idx])
            if (calculos?.totalRegistros === 0) {
                d.push({
                    processo: t[idx]?.numero || '',
                    autor:    t[idx]?.autor  || '',
                    reu:      t[idx]?.reu    || '',
                    oj:       t[idx]?.descricaoOrgaoJulgador || '',
                    tarefa:   t[idx]?.nomeTarefa || '',
                })
            }
        }
        return d.length ? d : 'Nenhum processo encontrado sem PJC.'
    }

    async function _executaRecebimentoTRT(ids, t, ancestral, etapa = 0) {
        let d = []
        for (let idx = 0; idx < ids.length; idx++) {
            atualizar_contador(ancestral, etapa, (idx + 1) + '/' + ids.length)
            let acordo_ou_improcedencia = ''
            let documentosemovimentos   = await buscarDocumentosEMovimentos(ids[idx])

            if (documentosemovimentos.some(doc => /julgado\(s\) improcedente/i.test(doc.titulo))) {
                acordo_ou_improcedencia = 'Improcedência'
            }
            if (!acordo_ou_improcedencia) {
                if (documentosemovimentos.some(doc =>
                    /acordo(?!\s*coletivo)/i.test(doc.titulo) ||
                    /acordo(?!\s*coletivo)/i.test(doc.tipo)
                )) {
                    acordo_ou_improcedencia = 'Acordo'
                }
            }
            if (!acordo_ou_improcedencia) acordo_ou_improcedencia = 'Não'

            d.push({
                processo:   t[idx]?.numero                  || '',
                autor:      t[idx]?.autor                   || '',
                reu:        t[idx]?.reu                     || '',
                oj:         t[idx]?.descricaoOrgaoJulgador  || '',
                tarefa:     t[idx]?.nomeTarefa              || '',
                encontrado: acordo_ou_improcedencia,
            })
        }
        return d.length ? d : 'Nenhum processo encontrado.'
    }
}

function apresentaResultados(array){
    let nome = 'resultado_superFiltros'
    let divId = id(nome)
    let div = criaDiv({
        id: divId,
        ancestral: 'ffff'
    })
    Object.assign(div.style,{
        position:       'absolute',
        top:            '50%',
        left:           '50%',
        transform:      'translate(-50%, -50%)',
        width:          '80%',
        height:         '80%',
        background:     UI_CORES.branco,
        border:         '1px solid ' + UI_CORES.azul,
        borderRadius:   '8px',
        boxShadow:      '0 4px 16px rgba(0,0,0,0.15)',
        zIndex:         String(ROTA_Z.flutuante ?? 9000),
        display:        'flex',
        padding:        '4px 4px 4px 4px'
    })
    
    let divTitulo = criaDiv({
        id: id(nome, 'divTitulo'),
        ancestral: divId,
        rowColumn: 'row'
    })
    let titulo = criaTitulo({
        id: id(nome, 'titulo'),
        texto: 'Resultado',
        ancestral: id(nome, 'divTitulo')
    })
    let botaoFechar = criaBotaoAzul({
        id: id(nome, 'fechar'),
        texto: '✕',
        ancestral: id(nome, 'divTitulo'),
        acao: () => {
            document.getElementById(divId).remove()
            return
        }
    })
    botaoFechar.style.height =          '15px'
    botaoFechar.style.fontSize =        '13px'
    botaoFechar.style.lineHeight =      '1'
    botaoFechar.style.padding =         '2px 5px'
    botaoFechar.style.borderRadius =    '4px'
    botaoFechar.style.position =        'fixed'
    botaoFechar.style.right =           '4px'
    let divLinhas = criaDiv({
        id: id(nome, 'linhas'),
        ancestral: divId
    })
    divLinhas.style.overflowY = 'auto'
    let i = 0
    for (i; i < array.length; i++){
        if (i === 0){
            let primeiraLinha = criaDiv({
            id: id(nome, 'linha' + i),
            ancestral: id(nome, 'linhas'), 
            rowColumn: 'row'
        })
        }
        let linha = criaDiv({
            id: id(nome, 'linha' + (i + 1)),
            ancestral: id(nome, 'linhas'), 
            rowColumn: 'row'
        })
        let objeto = array[i]
        for(let j = 0 ; j < Object.entries(objeto).length; j++){
            
            let largura = Math.floor(100/Object.entries(objeto).length)
            if (i === 0){
                let celula = criaSubTitulo({
                    id: id(nome, 'linha' + i, 'celula' + j),
                    ancestral: id(nome, 'linha' + i),
                    texto: Object.keys(objeto)[j]
                })
                celula.style.width = largura + '%'
            }
            
            let celula = criaTexto({
                id: id(nome, 'linha' + i, 'celula' + j),
                ancestral: id(nome, 'linha' + (i + 1)),
                texto: Object.values(objeto)[j]
            })
            
            celula.style.width = largura + '%'
            
        }
    }
    i++
    let linhaFinal = criaDiv({
        id: id(nome, 'linha' + i),
        ancestral: divId, 
        rowColumn: 'row'
    })
    //linhaFinal.style.
    let botoesFinais = [
        {
            id: id(nome, 'copiar'),
            texto: 'Copiar dados tabulados',
            ancestral: id(nome, 'linha' + i),
        },
        {
            id: id(nome, 'baixarTexto'),
            texto: 'Baixar em formato TXT',
            ancestral: id(nome, 'linha' + i),
        },
        {
            id: id(nome, 'baixarJSON'),
            texto: 'Baixar em formato JSON',
            ancestral: id(nome, 'linha' + i),
        },
    ]
    for (let k = 0; k < botoesFinais.length; k++) {
        let botaoConfig = botoesFinais[k]
        let funcaoBotao = k % 2 === 0 ? criaBotaoAzul : criaBotaoLaranja
        funcaoBotao({
            id: botaoConfig.id,
            texto: botaoConfig.texto,
            ancestral: botaoConfig.ancestral,
            acao: () => extrairResultado(botaoConfig.id)
        })
    }

    // ── Exportação — usam o `array` recebido por apresentaResultados,
    //    não o que já foi renderizado na tela ─────────────────────
    function extrairResultado(tipo){
        let nomeFuncao = tipo.split('_').pop()
        let funcoes = { copiar, baixarJSON, baixarTexto }
        funcoes[nomeFuncao]?.()

        function copiar(){
            navigator.clipboard.writeText(arrayParaTsv(array))
        }

        function baixarTexto(){
            _baixarArquivo(arrayParaTsv(array), 'resultado.txt', 'text/plain')
        }

        function baixarJSON(){
            _baixarArquivo(JSON.stringify(array, null, 2), 'resultado.json', 'application/json')
        }
    }
}

function arrayParaTsv(array){
    if (!array.length) return ''
    let cabecalho = Object.keys(array[0])
    let linhas = [cabecalho.join('\t')]
    for (let objeto of array) {
        linhas.push(cabecalho.map(chave => objeto[chave] ?? '').join('\t'))
    }
    return linhas.join('\n')
}

function _baixarArquivo(conteudo, nomeArquivo, tipo){
    const blob = new Blob([conteudo], { type: tipo })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = nomeArquivo
    a.click()
}
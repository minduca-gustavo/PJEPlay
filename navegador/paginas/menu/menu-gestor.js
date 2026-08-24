async function gestao_inicializar() {
    let janela = location.href.includes('navegador/paginas/menu/menu-gestor.htm')
    if (!janela) {
        return
    }
    console.log('%c[Rota PJE]%c Menu Gestão', LOG.aviso, 'color:inherit')

    // ── Estado global da sessão de gestão ────────────────────────────────────
    let _docaAtiva        = null  // id do botão da doca atualmente selecionado
    let _configDocaAtiva  = null  // objeto completo do botão ativo
    let _dadosGit         = []    // array de objetos carregado do GitHub
    let _colunasAtivas    = []    // [{chave, label}] — colunas visíveis no momento
    let _modoEdicao       = null  // 'tabela' | 'texto' | null

    // ── Estrutura principal ──────────────────────────────────────────────────
    let divId = id('gestao', 'corpo')
    let div = criaDiv({ id: divId, ancestral: 'rota_corpo_gestao', rowColumn: 'row' })
    div.style.height = '100%'

    let divDoca = id('gestao', 'doca')
    let doca = criaDiv({ id: divDoca, ancestral: divId, rowColumn: 'column' })
    doca.style.width = '100px'

    let divConteudo = id('gestao', 'conteudo')
    let conteudo = criaDiv({ id: divConteudo, ancestral: divId, rowColumn: 'column' })
    conteudo.style.width = 'calc(100% - 100px)'

    let divPrincipal = id('gestao', 'principal')
    let principal = criaDiv({ id: divPrincipal, ancestral: divConteudo })
    principal.style.width  = '100%'
    principal.style.height = 'calc(100% - 50px)'
    principal.style.overflowY = 'auto'

    let divRodape = id('gestao', 'rodape')
    let rodape = criaDiv({ id: divRodape, ancestral: divConteudo, rowColumn: 'row' })
    rodape.style.width  = '100%'
    rodape.style.height = '50px'
    rodape.style.flexShrink = '0'

    // ── Botões da doca ───────────────────────────────────────────────────────
    let botoesDoca = [
        {
            id: id('finais'),
            texto: '👨🏾‍⚖️\nFinais',
            tooltip: 'Finais por Vara/Final.',
            colunas: [{ vara: 'Vara' }, { digitos: 'Dígitos' }, { magistrado: 'Magistrado' }],
            acrescentaColunas: false
        },
        {
            id: id('pericias'),
            texto: '🩺\nPerícias',
            tooltip: 'Tabela de peritos em atividade',
            acrescentaColunas: true
        },
        {
            id: id('juizes'),
            texto: '👩🏻‍⚖️\nJuízes',
            tooltip: 'Informações sobre Juízes - assistente/secretário, modelos de despacho, etc.',
            acrescentaColunas: true
        },
    ]

    for (let botao of botoesDoca) {
        let b = criaBotaoAzul({
            id: botao.id,
            ancestral: divDoca,
            texto: botao.texto,
            acao: () => grade_abrir(botao)
        })
        b.style.width      = '100%'
        b.style.height     = '50px'
        b.style.whiteSpace = 'pre-line'
        b.addEventListener('mouseover', () => {
            if (botao.tooltip) {
                criaTooltip({ id: botao.id + '-tip', texto: botao.tooltip, elemento: b })
            }
        })
    }

    // ── Verificação de login inicial ─────────────────────────────────────────
    let senha = await githubGetSenha()
    let senhaAutenticada = senha ? await githubTestarSenha(senha) : false
    if (!senhaAutenticada) {
        rodape_mostrarLogin()
    }

    // ════════════════════════════════════════════════════════════════════════
    // GRADE — abre e renderiza dados de um arquivo do GitHub
    // ════════════════════════════════════════════════════════════════════════

    async function grade_abrir(configBotao) {
        // Limpa principal
        let el = document.getElementById(divPrincipal)
        if (el) el.innerHTML = ''

        // Limpa botões de edição/salvar do rodapé (exceto login)
        rodape_limparEdicao()

        _docaAtiva       = configBotao.id
        _configDocaAtiva = configBotao
        _modoEdicao      = null

        // Carregamento
        criarCarregando(divPrincipal)

        let nomeArquivo = _docaAtiva + '.json'
        try {
            _dadosGit = await githubLerDados(nomeArquivo)
        } catch (e) {
            removerCarregando()
            //await rota_avisoObrigatorio('Erro ao carregar ' + nomeArquivo + ': ' + e.message)
            return
        }
        removerCarregando()

        // Deriva colunas: usa configBotao.colunas se existir, senão deriva do primeiro objeto
        if (configBotao.colunas && configBotao.colunas.length) {
            _colunasAtivas = configBotao.colunas.map(c => {
                let chave = Object.keys(c)[0]
                let label = Object.values(c)[0]
                return { chave, label }
            })
        } else if (_dadosGit.length) {
            _colunasAtivas = Object.keys(_dadosGit[0]).map(k => ({ chave: k, label: k }))
        } else {
            _colunasAtivas = []
        }

        grade_renderizarVisualizacao()

        // Botões de edição só aparecem para gestores autenticados
        let gestor = await githubGetSenha()
        if (gestor) {
            rodape_mostrarBotoesEdicao()
        }
    }

    // ── Renderiza os dados em modo VISUALIZAÇÃO (somente leitura) ────────────
    function grade_renderizarVisualizacao() {
        let el = document.getElementById(divPrincipal)
        if (el) el.innerHTML = ''

        if (!_dadosGit.length) {
            criaTexto({ id: id('gestao', 'vazio'), texto: 'Nenhum dado encontrado.', ancestral: divPrincipal })
            return
        }

        // Linha de cabeçalho
        let idCabecalho = id('gestao', 'grade', 'cabecalho')
        let cabecalho = criaDiv({ id: idCabecalho, ancestral: divPrincipal, rowColumn: 'row' })
        Object.assign(cabecalho.style, { borderBottom: '2px solid ' + UI_CORES.azul, paddingBottom: '4px' })

        for (let col of _colunasAtivas) {
            let titulo = criaTitulo({
                id: id('gestao', 'grade', 'titulo', col.chave),
                texto: col.label,
                ancestral: idCabecalho
            })
            titulo.style.flex = '1'
        }

        // Linhas de dados
        for (let i = 0; i < _dadosGit.length; i++) {
            let linha = _dadosGit[i]
            let idLinha = id('gestao', 'grade', 'linha', String(i))
            let divLinha = criaDiv({ id: idLinha, ancestral: divPrincipal, rowColumn: 'row' })
            Object.assign(divLinha.style, {
                background:   i % 2 === 0 ? UI_CORES.branco : UI_CORES.fundo,
                borderBottom: '1px solid ' + UI_CORES.borda,
                padding:      '2px 0'
            })
            for (let col of _colunasAtivas) {
                let valor = linha[col.chave]
                let textoValor = Array.isArray(valor) ? valor.join(', ') : (valor ?? '')
                let celula = criaTexto({
                    id: id('gestao', 'grade', 'cel', col.chave, String(i)),
                    texto: String(textoValor),
                    ancestral: idLinha
                })
                celula.style.flex = '1'
            }
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    // EDIÇÃO COMO TABELA
    // ════════════════════════════════════════════════════════════════════════

    function abrirEdicaoTabela() {
        _modoEdicao = 'tabela'
        let el = document.getElementById(divPrincipal)
        if (el) el.innerHTML = ''

        grade_renderizarEdicaoTabela(_dadosGit)
        rodape_mostrarSalvar()
    }

    function grade_renderizarEdicaoTabela(dados) {
        let el = document.getElementById(divPrincipal)
        if (el) el.innerHTML = ''

        // Linha de cabeçalho com colunas
        let idCabecalho = id('gestao', 'grade', 'cabecalho')
        let cabecalho = criaDiv({ id: idCabecalho, ancestral: divPrincipal, rowColumn: 'row' })
        Object.assign(cabecalho.style, { borderBottom: '2px solid ' + UI_CORES.azul, paddingBottom: '4px' })

        for (let col of _colunasAtivas) {
            let titulo = criaTitulo({
                id: id('gestao', 'grade', 'titulo', col.chave),
                texto: col.label,
                ancestral: idCabecalho
            })
            titulo.style.flex = '1'
        }

        // Linhas de inputs
        for (let i = 0; i < dados.length; i++) {
            grade_criarLinhaInput(dados[i], i)
        }

        // Linha vazia extra para acrescentar
        grade_criarLinhaInput(null, dados.length)

        // Botão acrescentar linha (simples, no final)
        let idBtnLinha = id('gestao', 'btn', 'addlinha')
        let btnLinha = criaBotaoAzul({
            id: idBtnLinha,
            texto: '+ Linha',
            ancestral: divPrincipal,
            acao: () => {
                let totalLinhas = _contarLinhasInput()
                grade_criarLinhaInput(null, totalLinhas)
            }
        })
        btnLinha.style.width = '80px'
        btnLinha.style.margin = '4px 0'

        // Botão acrescentar coluna (só se acrescentaColunas = true)
        if (_configDocaAtiva?.acrescentaColunas) {
            grade_mostrarBotaoAcrescentarColuna()
        }
    }

    function grade_criarLinhaInput(dadosLinha, indice) {
        let idLinha = id('gestao', 'grade', 'linha', String(indice))
        let divLinha = criaDiv({ id: idLinha, ancestral: divPrincipal, rowColumn: 'row' })
        Object.assign(divLinha.style, {
            background:   indice % 2 === 0 ? UI_CORES.branco : UI_CORES.fundo,
            borderBottom: '1px solid ' + UI_CORES.borda,
            alignItems:   'center'
        })

        for (let col of _colunasAtivas) {
            let valorBruto = dadosLinha ? dadosLinha[col.chave] : ''
            let valorExibido = Array.isArray(valorBruto) ? valorBruto.join(',') : (valorBruto ?? '')
            let idCelula = id('gestao', 'grade', col.chave, String(indice))
            let inputEl = criaInput({
                id: idCelula,
                ancestral: idLinha,
                placeholder: col.label
            })
            inputEl.value = String(valorExibido)
            inputEl.style.flex = '1'
            inputEl.container.style.flex = '1'
            inputEl.container.style.marginBottom = '0'

            // CTRL+V — distribuição de dados tabulados
            inputEl.addEventListener('paste', (e) => {
                let texto = e.clipboardData.getData('text')
                // Detecta se é tabulado (tem tab OU múltiplas linhas)
                if (!texto.includes('\t') && !texto.includes('\n')) return
                e.preventDefault()
                _colarTabelado(texto, indice, col.chave)
            })
        }

        return divLinha
    }

    // Cola dados tabulados a partir da célula (linhaInicio, chaveColuna)
    function _colarTabelado(texto, linhaInicio, chaveColuna) {
        let linhasTexto = texto.trim().split('\n').map(l => l.split('\t'))
        let colunaInicio = _colunasAtivas.findIndex(c => c.chave === chaveColuna)
        if (colunaInicio < 0) colunaInicio = 0

        let totalLinhasExistentes = _contarLinhasInput()

        for (let li = 0; li < linhasTexto.length; li++) {
            let idxLinha = linhaInicio + li
            // Cria linhas extras se necessário
            if (idxLinha >= totalLinhasExistentes) {
                grade_criarLinhaInput(null, idxLinha)
                totalLinhasExistentes++
            }
            for (let ci = 0; ci < linhasTexto[li].length; ci++) {
                let idxCol = colunaInicio + ci
                if (idxCol >= _colunasAtivas.length) break
                let col = _colunasAtivas[idxCol]
                let inputEl = document.getElementById(id('gestao', 'grade', col.chave, String(idxLinha)))
                if (inputEl) inputEl.value = linhasTexto[li][ci].trim()
            }
        }
    }

    function _contarLinhasInput() {
        let i = 0
        while (document.getElementById(id('gestao', 'grade', 'linha', String(i)))) i++
        return i
    }

    // ── Botão acrescentar coluna ─────────────────────────────────────────────
    function grade_mostrarBotaoAcrescentarColuna() {
        let idBtnCol = id('gestao', 'btn', 'addcoluna')
        let existing = document.getElementById(idBtnCol)
        if (existing) existing.remove()

        let idInputContainer = id('gestao', 'addcol', 'container')
        let existingInput = document.getElementById(idInputContainer + '-container')
        if (existingInput) existingInput.remove()

        // Input para nome da nova coluna (estilo igual à senha)
        let inputCol = criaBotaoComInputAzul({
            id: idBtnCol,
            idInput: id('gestao', 'addcol', 'input'),
            texto: '+ Coluna',
            textoEmCima: 'Nome da nova coluna',
            ancestral: divPrincipal,
            acao: () => {
                let inputEl = document.getElementById(id('gestao', 'addcol', 'input'))
                let nomeCol = inputEl?.value?.trim()
                if (!nomeCol) return
                // Verifica se já existe
                if (_colunasAtivas.find(c => c.chave === nomeCol)) {
                    //rota_avisoObrigatorio('Coluna "' + nomeCol + '" já existe.')
                    return
                }
                _colunasAtivas.push({ chave: nomeCol, label: nomeCol })
                // Re-renderiza mantendo os dados já digitados nos inputs
                let dadosAtuais = _lerDadosInputs()
                grade_renderizarEdicaoTabela(dadosAtuais)
            }
        })
    }

    // ── Lê os dados dos inputs da grade ─────────────────────────────────────
    // Preserva o tipo array quando o dado original era array
    function _lerDadosInputs() {
        let totalLinhas = _contarLinhasInput()
        let resultado = []

        // Mapa de quais chaves eram arrays no dado original
        let chavesArray = new Set()
        for (let obj of _dadosGit) {
            for (let [k, v] of Object.entries(obj)) {
                if (Array.isArray(v)) chavesArray.add(k)
            }
        }

        for (let i = 0; i < totalLinhas; i++) {
            let obj = {}
            let temValor = false
            for (let col of _colunasAtivas) {
                let inputEl = document.getElementById(id('gestao', 'grade', col.chave, String(i)))
                let val = inputEl?.value?.trim() ?? ''
                if (val) temValor = true
                if (chavesArray.has(col.chave)) {
                    obj[col.chave] = val ? val.split(',').map(s => s.trim()) : []
                } else {
                    obj[col.chave] = val
                }
            }
            // Ignora linhas completamente vazias
            if (temValor) resultado.push(obj)
        }
        return resultado
    }

    // ════════════════════════════════════════════════════════════════════════
    // EDIÇÃO COMO TEXTO
    // ════════════════════════════════════════════════════════════════════════

    function abrirEdicaoTexto() {
        _modoEdicao = 'texto'
        let el = document.getElementById(divPrincipal)
        if (el) el.innerHTML = ''

        // Converte array de objetos para texto tabulado
        let linhas = []
        // Cabeçalho
        linhas.push(_colunasAtivas.map(c => c.label).join('\t'))
        // Dados
        for (let obj of _dadosGit) {
            let linha = _colunasAtivas.map(col => {
                let v = obj[col.chave]
                return Array.isArray(v) ? v.join(',') : (v ?? '')
            })
            linhas.push(linha.join('\t'))
        }

        let idTextarea = id('gestao', 'textarea')
        let anotacao = criaInputAnotacao({
            id: idTextarea,
            textoEmCima: 'Edite os dados tabulados (Tab entre colunas, Enter entre linhas). Primeira linha = cabeçalho.',
            ancestral: divPrincipal,
            placeholder: 'Cole ou edite os dados aqui...'
        })
        anotacao.style.width  = '100%'
        anotacao.style.height = '100%'

        let textarea = document.getElementById(idTextarea)
        if (textarea) {
            textarea.value = linhas.join('\n')
            // Ajusta altura inicial
            textarea.style.height = 'auto'
            textarea.style.height = textarea.scrollHeight + 'px'
        }

        rodape_mostrarSalvar()
    }

    // ── Lê e valida o textarea, retorna array de objetos ou null ────────────
    function _lerDadosTexto() {
        let idTextarea = id('gestao', 'textarea')
        let textarea = document.getElementById(idTextarea)
        if (!textarea) return null

        let linhas = textarea.value.trim().split('\n').map(l => l.split('\t'))
        if (linhas.length < 2) return null

        // Valida que todas as linhas são tabuladas (têm ao menos 2 colunas)
        for (let i = 1; i < linhas.length; i++) {
            if (linhas[i].length < 2) {
                //rota_avisoObrigatorio(
                //    'Linha ' + (i + 1) + ' não está no formato tabulado. Corrija e tente novamente.'
                //)
                return null
            }
        }

        let cabecalho = linhas[0].map(c => c.trim())

        // Mapa de quais chaves eram arrays no dado original
        let chavesArray = new Set()
        for (let obj of _dadosGit) {
            for (let [k, v] of Object.entries(obj)) {
                if (Array.isArray(v)) chavesArray.add(k)
            }
        }

        let resultado = []
        for (let i = 1; i < linhas.length; i++) {
            let obj = {}
            for (let j = 0; j < cabecalho.length; j++) {
                let chave = cabecalho[j]
                let val   = (linhas[i][j] ?? '').trim()
                if (chavesArray.has(chave)) {
                    obj[chave] = val ? val.split(',').map(s => s.trim()) : []
                } else {
                    obj[chave] = val
                }
            }
            resultado.push(obj)
        }
        return resultado
    }

    // ════════════════════════════════════════════════════════════════════════
    // SALVAR NO GITHUB
    // ════════════════════════════════════════════════════════════════════════

    async function salvar() {
        let dados = null

        if (_modoEdicao === 'tabela') {
            dados = _lerDadosInputs()
        } else if (_modoEdicao === 'texto') {
            dados = _lerDadosTexto()
            if (!dados) return  // _lerDadosTexto já exibiu o aviso
        }

        if (!dados || !dados.length) {
            //await rota_avisoObrigatorio('Nenhum dado para salvar.')
            return
        }

        let btnSalvar = document.getElementById(id('gestao', 'btn', 'salvar'))
        if (btnSalvar) {
            btnSalvar.textContent = 'Salvando…'
            btnSalvar.disabled    = true
        }

        let nomeArquivo = _docaAtiva + '.json'
        try {
            await githubSalvarDados(nomeArquivo, dados)
            _dadosGit = dados
        } catch (e) {
            if (btnSalvar) {
                btnSalvar.textContent = 'Salvar'
                btnSalvar.disabled    = false
            }
            //await rota_avisoObrigatorio('Erro ao salvar: ' + e.message)
            return
        }

        // Salvo com sucesso — volta para visualização e remove botão salvar
        rodape_limparEdicao()
        grade_renderizarVisualizacao()
        rodape_mostrarBotoesEdicao()
        _modoEdicao = null
    }

    // ════════════════════════════════════════════════════════════════════════
    // RODAPÉ — controle de botões
    // ════════════════════════════════════════════════════════════════════════

    function rodape_limparEdicao() {
        let ids = [
            id('gestao', 'editar', 'tabelado'),
            id('gestao', 'editar', 'texto'),
            id('gestao', 'btn', 'salvar'),
        ]
        for (let elId of ids) {
            document.getElementById(elId)?.remove()
        }
    }

    function rodape_mostrarBotoesEdicao() {
        rodape_limparEdicao()
        let botoesEdicao = [
            { id: 'tabelado', texto: 'Editar como tabela', acao: abrirEdicaoTabela },
            { id: 'texto',    texto: 'Editar como texto',  acao: abrirEdicaoTexto  },
        ]
        for (let botao of botoesEdicao) {
            criaBotaoAzul({
                id: id('gestao', 'editar', botao.id),
                texto: botao.texto,
                ancestral: divRodape,
                acao: botao.acao
            })
        }
    }

    function rodape_mostrarSalvar() {
        // Remove botões de editar, mostra só salvar
        document.getElementById(id('gestao', 'editar', 'tabelado'))?.remove()
        document.getElementById(id('gestao', 'editar', 'texto'))?.remove()
        document.getElementById(id('gestao', 'btn', 'salvar'))?.remove()

        criaBotaoLaranja({
            id: id('gestao', 'btn', 'salvar'),
            texto: 'Salvar',
            ancestral: divRodape,
            acao: salvar
        })
    }

    function rodape_mostrarLogin() {
        criaBotaoLaranja({
            id: id('gestao', 'login'),
            ancestral: divRodape,
            texto: 'Fazer login como gestor.',
            acao: () => loginGestor()
        })
    }

    // ════════════════════════════════════════════════════════════════════════
    // LOGIN
    // ════════════════════════════════════════════════════════════════════════

    async function loginGestor() {
        let nome  = 'loginGestor'
        let divId = id('gestao', nome)

        // Evita duplicar
        document.getElementById(divId)?.remove()

        let divLogin = criaDiv({ id: divId, ancestral: 'ffff' })
        Object.assign(divLogin.style, {
            position:     'absolute',
            top:          '50%',
            left:         '50%',
            transform:    'translate(-50%, -50%)',
            width:        '15%',
            height:       'fit-content',
            background:   UI_CORES.branco,
            border:       '1px solid ' + UI_CORES.azul,
            borderRadius: '8px',
            boxShadow:    '0 4px 16px rgba(0,0,0,0.15)',
            display:      'flex',
            padding:      '4px'
        })

        criaBotaoComInputAzul({
            id:          id('gestao', 'senhaBotao'),
            idInput:     id('gestao', 'senhaInput'),
            texto:       'OK',
            textoEmCima: 'Digite a senha',
            ancestral:   divId,
            acao:        () => confereSenha(document.getElementById(id('gestao', 'senhaInput')), divId)
        })

        let inputElemento = document.getElementById(id('gestao', 'senhaInput'))
        inputElemento.type         = 'password'
        inputElemento.autocomplete = 'new-password'
        inputElemento.placeholder  = 'Insira sua senha'

        // Enter no input também confirma
        inputElemento.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') confereSenha(inputElemento, divId)
        })
    }

    async function confereSenha(elemento, remover) {
        let senhaTeste = await githubTestarSenha(elemento.value)
        if (!senhaTeste) {
            elemento.value       = ''
            elemento.placeholder = 'Senha incorreta.'
            await suspender(3000)
            elemento.placeholder = 'Insira sua senha'
            return
        }
        await githubSalvarSenha(elemento.value)
        // Remove o modal de login
        document.getElementById(remover)?.remove()
        document.getElementById(id('gestao', 'login'))?.remove()
        // Aparece botões de edição se já houver uma doca ativa
        if (_docaAtiva) {
            rodape_mostrarBotoesEdicao()
        }
    }
}
gestao_inicializar()
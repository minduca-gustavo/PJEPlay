
// ============================================================
// pintura.js
// Coloração de cabeçalhos de documentos no PJE.
//
// Depende de interceptador-documento.js para ter o conteúdo
// disponível na metatag prefixar('documentos_conteudo').
// ============================================================


// ── Detecção de página ────────────────────────────────────────
function pinturaAoAbrir(){
    let janela = confereJanela(JANELA.detalhes, JANELA.documentosConteudo)
    if (!janela) return
    pinturaInicio()
}

pinturaAoAbrir()

async function pinturaInicio(){
    let metaEl = await rota_aguardarElemento('meta[name="' + rota_metaTag_nome('documentos_conteudo') + '"]', 12000)
    if(!metaEl) return

    function processar(){
        let meta = interceptador_lerDocumentosConteudo()
        if(meta?.conteudo) pintura_processar(meta.conteudo)
    }

    processar()

    document.addEventListener('RotaMetaTagAtualizada', e => {
        if(e.detail.rotulo !== 'documentos_conteudo') return
        processar()
    })
}

// ── Regras ────────────────────────────────────────────────────

async function pintura_carregarRegras(){
    let cfg = await obterArmazenamento('tarefaAtiva')
    let nomeAtivo = cfg?.tarefaAtiva || ''
    if(!nomeAtivo) return []
    let store = await obterArmazenamento('tarefas')
    let tarefa = store?.tarefas?.[nomeAtivo]
    return tarefa?.regras || []
}

function pintura_resolverTodos(textoNormalizado = '', regras = []){
    let principal = null
    let extras    = []

    for(let regra of regras){
        if(!regra.cor || !regra.termos) continue
        let termos = regra.termos.split(/[,;]/)
            .map(t => normalizar(t.trim())).filter(t => t)
        for(let termo of termos){
            if(!textoNormalizado.includes(termo)) continue
            if(!principal){
                principal = { cor: regra.cor, termo }
            } else {
                if(!extras.some(e => e.termo === termo))
                    extras.push({ cor: regra.cor, termo })
            }
        }
    }

    if(!principal) return null
    return { cor: principal.cor, termo: principal.termo, extras }
}


// ── Aplicação visual ──────────────────────────────────────────

function pintura_aplicar(cabecalho, cor, termo, extras = []){

    if(!cabecalho) return

    // A cor vem das regras do usuário, então continua inline.
    // Toda a moldura fixa mudou para estilos/rotapje-pje.css.
    cabecalho.classList.add('rotapje-cabecalho-pintado')
    cabecalho.style.backgroundColor = cor
    cabecalho.style.borderLeft      = `6px solid ${escurecerCor(cor)}`

    let alvo = selecionar('.cabecalho-direita', cabecalho) || cabecalho

    let badge = criar({
        prefixo:    true,
        tag:        'span',
        id:         'termo-badge',
        ancestral:  alvo,
        texto:      '💡 ' + termo + (extras.length ? ` (+${extras.length})` : ''),
        atributos:  extras.length ? { extras: extras.length } : {},
    })

    if(!extras.length) return

    let dica = criar({
        prefixo:    false,
        tag:        'span',
        classe:     'rotapje-termo-dica',
        ancestral:  badge,
    })

    criar({
        prefixo:    false,
        tag:        'span',
        classe:     'rotapje-termo-dica-titulo',
        texto:      'TAMBÉM ENCONTRADO',
        ancestral:  dica,
    })

    extras.forEach(extra => {
        criar({ prefixo:false, tag:'br', ancestral:dica })
        criar({
            prefixo:    false,
            tag:        'span',
            classe:     'rotapje-termo-bolinha',
            style:      'background:' + extra.cor,
            ancestral:  dica,
        })
        criar_texto({ texto: extra.termo.toUpperCase(), ancestral: dica })
    })

}


function pintura_limpar(cabecalho){
    if(!cabecalho) return
    cabecalho.classList.remove('rotapje-cabecalho-pintado')
    cabecalho.style.removeProperty('background-color')
    cabecalho.style.removeProperty('border-left')
    remover('#' + prefixar('termo-badge'))
}


// ── Aguarda cabeçalho ─────────────────────────────────────────

async function pintura_aguardarCabecalho(){
    let seletor = seletorPorVersao('detalhesDoProcessoCabecalhoDosDocumentos')
    return await rota_aguardarElemento(seletor, 12000)
}



// ── Processamento principal ───────────────────────────────────

async function pintura_processar(texto){
    let regras = await pintura_carregarRegras()
    if(!regras.length) return
    let cabecalho = await pintura_aguardarCabecalho()
    if(!cabecalho){ relatar('Pintura: cabeçalho não encontrado.', '', 'erro'); return }

    cabecalho.style.borderLeft = '6px solid #5e84a8'
    cabecalho.style.opacity    = '0.75'

    cabecalho.style.opacity = '1'
    pintura_limpar(cabecalho)

    if(!texto){ relatar('Sem texto para classificar.', '', 'execucao'); return }

    let resultado = pintura_resolverTodos(normalizar(texto), regras)
    if(resultado) pintura_aplicar(cabecalho, resultado.cor, resultado.termo, resultado.extras)
    else          relatar('Nenhum termo encontrado.', '', 'execucao')
}


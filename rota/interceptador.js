// ============================================================
// interceptador.js
// Processa as requisições interceptadas pelo interceptador-xhr.js
// e salva os dados úteis como <meta> no <head> da página.
// ============================================================


const INTERCEPTADOR_URL = {
    processo:           /\/pje-comum-api\/api\/processos\/id\/\d+$/i,
    processoPartes:     /\/pje-comum-api\/api\/processos\/id\/\d+\/partes/i,
    tarefas:            /\/pje-comum-api\/api\/agrupamentotarefas$/i,
    tarefasAtivas:      /\/pje-comum-api\/api\/tarefas\/ativas/i,
    perfis:             /\/api\/token\/perfis\/trocar/i,
    recursos:           /\/api\/token\/permissoes\/recursos/i,
    pauta:              /\/pje-comum-api\/api\/pautasaudiencias/i,
    audiencias:         /\/pje-comum-api\/api\/processos\/id\/\d+\/audiencias/i,
    responsaveis:       /\/pje-comum-api\/api\/usuarios\/internos\/pororgaojulgador/i,
    dadosBasicos:       /\/pje-comum-api\/api\/processos\/dadosbasicos\//i,
    documentos:         /\/pje-comum-api\/api\/processos\/id\/\d+\/documentos/i,
    orgaosJulgadores:   /\/pje-comum-api\/api\/orgaosjulgadores/i,
    timeline:           /\/pje-comum-api\/api\/processos\/id\/\d+\/timeline/i,
}

const INTERCEPTADOR_ROTULO = {
    processo:           'processo',
    processoPartes:     'processo-partes',
    tarefas:            'tarefas',
    tarefasAtivas:      'tarefas-ativas',
    perfis:             'perfis',
    recursos:           'recursos',
    pauta:              'pauta',
    audiencias:         'audiencias',
    responsaveis:       'responsaveis',
    dadosBasicos:       'dados-basicos',
    timeline:           'timeline',
    orgaosJulgadores:   'orgaosJulgadores',
}


interceptador_iniciar()

function interceptador_iniciar(){
    relatar('Interceptador: ouvindo requisições…', '', 'xhr')
    document.addEventListener(
        'RotaRequisicaoInterceptada',
        interceptador_processar
    )
}

function interceptador_processar(evento){
    let dados    = evento.detail
    let url      = dados.url      || ''
    let resposta = dados.resposta || ''

    relatar('Requisição interceptada:', url, 'xhr')

    if(!url.includes('/api/') || !resposta) return

    for(const [chave, expressao] of Object.entries(INTERCEPTADOR_URL)){
        if(expressao.test(url)){
            let rotulo = INTERCEPTADOR_ROTULO[chave]
            interceptador_salvarMetaTag(rotulo, resposta)
            break
        }
    }
}

function interceptador_salvarMetaTag(rotulo = '', resposta = ''){
    if(!rotulo || !resposta) return
    try{
        let name    = 'rota-' + rotulo
        let dados; try{ dados = JSON.parse(resposta) } catch{ dados = resposta }
        let content = typeof dados === 'string' ? dados : JSON.stringify(dados)

        relatar('Salvando metatag:', name, 'resposta')

        let meta = document.head.querySelector(`meta[name="${name}"]`)
        if(meta){
            meta.setAttribute('content', content)
        } else {
            meta = document.createElement('meta')
            meta.setAttribute('name', name)
            meta.setAttribute('content', content)
            document.head.appendChild(meta)
        }

        document.dispatchEvent(
            new CustomEvent('RotaMetaTagAtualizada', { detail: { rotulo, url: name } })
        )

        // Espelha dados importantes no storage para o assistente ler
        const rotulosParaStorage = ['processo', 'processo-partes', 'audiencias', 'responsaveis', 'documentos']
        if(rotulosParaStorage.includes(rotulo)){
            let chaveStorage = 'rotaDados_' + rotulo.replace('-', '_')
            armazenar({ [chaveStorage]: dados }).catch(() => {})
        }

    } catch(erro){
        relatar('interceptador_salvarMetaTag erro:', erro, 'erro')
    }
}


// ── Leitura ───────────────────────────────────────────────────

function interceptador_ler(rotulo = ''){
    let meta = document.head.querySelector(`meta[name="rota-${rotulo}"]`)
    if(!meta) return null
    let content = meta.getAttribute('content')
    if(!content) return null
    try{ return JSON.parse(content) } catch{ return content }
}

function interceptador_lerProcesso()            { return interceptador_ler('processo')        }
function interceptador_lerPartes()              { return interceptador_ler('processo-partes') }
function interceptador_lerTarefas()             { return interceptador_ler('tarefas')         }
function interceptador_lerPerfis()              { return interceptador_ler('perfis')          }
function interceptador_lerAudiencias()          { return interceptador_ler('audiencias')      }
function interceptador_lerResponsaveis()        { return interceptador_ler('responsaveis')    }
function interceptador_lerDocumentos()          { return interceptador_ler('documentos')      }
function interceptador_lerOrgaosJulgadores()    { return interceptador_ler('orgaosJulgadores')      }
function interceptador_lerTimeline()            { return interceptador_ler('timeline')            }


// ── Aguardar dado ─────────────────────────────────────────────

function interceptador_aguardar(rotulo = '', timeout = 8000){
    return new Promise((resolver, rejeitar) => {
        let existente = interceptador_ler(rotulo)
        if(existente) return resolver(existente)

        let handler = (evento) => {
            if(evento.detail.rotulo !== rotulo) return
            document.removeEventListener('RotaMetaTagAtualizada', handler)
            clearTimeout(timer)
            resolver(interceptador_ler(rotulo))
        }
        document.addEventListener('RotaMetaTagAtualizada', handler)

        let timer = setTimeout(() => {
            document.removeEventListener('RotaMetaTagAtualizada', handler)
            rejeitar(new Error('[Rota PJE] Timeout aguardando: rota-' + rotulo))
        }, timeout)
    })
}
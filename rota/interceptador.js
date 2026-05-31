// ============================================================
// interceptador.js
// Processa as requisições interceptadas pelo interceptador-xhr.js
// e salva os dados úteis como <meta> no <head> da página.
// ============================================================
//https://pje-web-hm.trt15.jus.br/pje-gigs-api/api/atividade/processo/3997133
//    /pje-gigs-api/api/processo/4642553

const INTERCEPTADOR_URL = {
    gigs:                           /\/pje-gigs-api\/api\/atividade\/processo\/\d+$/i,
    gigsConcluidos:                 /\/pje-gigs-api\/api\/atividade\/processo\/\d+\/concluida/i,
    processo:                       /\/pje-comum-api\/api\/processos\/id\/\d+$/i,
    processoPartes:                 /\/pje-comum-api\/api\/processos\/id\/\d+\/partes/i,
    processoTarefaMaisRecente:      /\/pje-comum-api\/api\/processos\/id\/\d+\/tarefas\?maisRecente=true/i,
    agrupamentoTarefasProcessos:    /\/pje-comum-api\/api\/agrupamentotarefas\/\d+\/processos*/i,
    tarefasProcesso:                /\/pje-comum-api\/api\/processos\/id\/\d+\/tarefas*/i,
    tarefasAtivas:                  /\/pje-comum-api\/api\/tarefas\/ativas/i,
    perfis:                         /\/api\/token\/perfis\/trocar/i,
    recursos:                       /\/api\/token\/permissoes\/recursos/i,
    recursosPage:                   /\/api\/token\/permissoes\/recursos\/*/i,
    pauta:                          /\/pje-comum-api\/api\/pautasaudiencias/i,
    audiencias:                     /\/pje-comum-api\/api\/processos\/id\/\d+\/audiencias/i,
    responsaveis:                   /\/pje-comum-api\/api\/usuarios\/internos\/pororgaojulgador/i,
    dadosBasicos:                   /\/pje-comum-api\/api\/processos\/dadosbasicos\//i,
    documentos:                     /\/pje-comum-api\/api\/processos\/id\/\d+\/documentos/i,
    modelosDocumentos:              /\/pje-comum-api\/api\/modelosdocumentos\/pastas\/raiz/i,
    orgaosJulgadores:               /\/pje-comum-api\/api\/orgaosjulgadores/i,
    timeline:                       /\/pje-comum-api\/api\/processos\/id\/\d+\/timeline/i,
}
//https://pje.trt15.jus.br/pje-comum-api/api/modelosdocumentos/pastas/raiz

const INTERCEPTADOR_ROTULO = {
    gigs:                           'gigs',
    gigsConcluidos:                 'gigs_concluidos',
    processo:                       'processo',
    processoPartes:                 'processo_partes',
    processoTarefaMaisRecente:      'processo_tarefa_mais_recente',
    agrupamentoTarefasProcessos:    'agrupamento_tarefas_processos',
    tarefasAtivas:                  'tarefas_ativas',
    perfis:                         'perfis',
    recursos:                       'recursos',
    recursosPage:                   'recursos_page',
    pauta:                          'pauta',
    audiencias:                     'audiencias',
    responsaveis:                   'responsaveis',
    dadosBasicos:                   'dados_basicos',
    timeline:                       'timeline',
    orgaosJulgadores:               'orgaosJulgadores',
    tarefasProcesso:                'tarefas_processo',
    modelosDocumentos:              'modelos_documentos',
}


interceptador_iniciar()

function interceptador_iniciar(){
    let estilo = 'border-radius:3px;color:hsla(0,100%,100%,1);display:inline-block;font-weight:600;padding:0 3px;'
	console.log(
		'%cRota PJE%c✅ interceptador() executado com sucesso!',
		estilo + 'background:hsla(204,100%,40%,1);',
		estilo + 'background:rgb(65, 90, 119);margin:0 0 0 3px;'
	)
    document.addEventListener(
        'RotaRequisicaoInterceptada',
        interceptador_processar
    )
}

function interceptador_processar(evento){
    let dados    = evento.detail
    let url      = dados.url      || ''
    let resposta = dados.resposta || ''

    let estilo = 'border-radius:3px;color:hsla(0,100%,100%,1);display:inline-block;font-weight:600;padding:0 3px;'
	console.log(
		'%cRota PJE%c✅ interceptador(): ' + location.origin + url,
		estilo + 'background:hsla(204,100%,40%,1);',
		estilo + 'background:rgb(65, 90, 119);margin:0 0 0 3px;'
	)

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
    let estilo = 'border-radius:3px;color:hsla(0,100%,100%,1);display:inline-block;font-weight:600;padding:0 3px;'
    try{
        let name    = 'rota-' + rotulo
        let dados; try{ dados = JSON.parse(resposta) } catch{ dados = resposta }
        let content = typeof dados === 'string' ? dados : JSON.stringify(dados)

        console.log(
            '%cRota PJE%c Salvando metatag: ' + name,
            estilo + 'background:hsla(204,100%,40%,1);',
            estilo + 'background:hsla(120,63%,28%,1);margin:0 0 0 3px;'
        )

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
        const rotulosParaStorage = [
            'processo',
            'processo_partes',
            'audiencias',
            'responsaveis',
            'documentos'
        ]
        if(rotulosParaStorage.includes(rotulo)){
            let chaveStorage = 'rotaDados_' + rotulo.replaceAll('-', '_')
            armazenar({ [chaveStorage]: dados }).catch(() => {})
        }

    } catch(erro){
        console.log(
            '%cRota PJE%c interceptador_salvarMetaTag erro: ' + erro,
            estilo + 'background:hsla(204,100%,40%,1);',
            estilo + 'background:hsla(0,100%,40%,1);margin:0 0 0 3px;'
        )
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

function interceptador_lerProcesso()            { return interceptador_ler('processo')                      }
function interceptador_lerProcessosPainel()     { return interceptador_ler('agrupamento_tarefas_processos') }
function interceptador_lerModelosDocumentos()   { return interceptador_ler('modelos_documentos')            }
function interceptador_lerRecursos()            { return interceptador_ler('recursos')                      }
function interceptador_lerRecursosPage()        { return interceptador_ler('recursos_page')                 }
function interceptador_lerPartes()              { return interceptador_ler('processo_partes')               }
function interceptador_lerTarefas()             { return interceptador_ler('tarefas')                       }
function interceptador_lerTarefasProcesso()     { return interceptador_ler('tarefas_processo')              }
function interceptador_lerTarefaMaisRecente()   { return interceptador_ler('processo_tarefa_mais_recente')  }
function interceptador_lerPerfis()              { return interceptador_ler('perfis')                        }
function interceptador_lerAudiencias()          { return interceptador_ler('audiencias')                    }
function interceptador_lerResponsaveis()        { return interceptador_ler('responsaveis')                  }
function interceptador_lerDocumentos()          { return interceptador_ler('documentos')                    }
function interceptador_lerOrgaosJulgadores()    { return interceptador_ler('orgaosJulgadores')              }
function interceptador_lerTimeline()            { return interceptador_ler('timeline')                      }
function interceptador_lerGigs()                { return interceptador_ler('gigs')                          }
function interceptador_lerGigsConcluidos()      { return interceptador_ler('gigs_concluidos')               }

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
            resolver(null)  // ← em vez de rejeitar
        }, timeout)
    })
}
// ============================================================
// requisicoes/interceptador.js
// Processa o evento RotaRequisicaoInterceptada (disparado por
// requisicoes/xhr.js, no mundo MAIN) e guarda o payload útil
// como <meta> no <head>, via criar_metaTag() de modulos/dom.js.
//
// O nome da metatag passa a ser prefixado pelo módulo:
// prefixar('processo') → 'rotapje-processo'. Use sempre
// rota_metaTag_nome() para montar/ler o nome, nunca literal.
// ============================================================

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
    horariosVagos:                  /\/pje-comum-api\/api\/pautasaudiencias\/horariosvagos.*/i,
    pauta:                          /\/pje-comum-api\/api\/pautasaudiencias/i,
    audiencias:                     /\/pje-comum-api\/api\/processos\/id\/\d+\/audiencias/i,
    responsaveis:                   /\/pje-comum-api\/api\/usuarios\/internos\/pororgaojulgador/i,
    dadosBasicos:                   /\/pje-comum-api\/api\/processos\/dadosbasicos\//i,
    documentos:                     /\/pje-comum-api\/api\/processos\/id\/\d+\/documentos/i,
    modelosDocumentos:              /\/pje-comum-api\/api\/modelosdocumentos\/pastas\/raiz/i,
    orgaosJulgadores:               /\/pje-comum-api\/api\/orgaosjulgadores/i,
    timeline:                       /\/pje-comum-api\/api\/processos\/id\/\d+\/timeline/i,
    expedientesMateria:             /\/pje-comum-api\/api\/expedientesmateria\/\d+.*/i,
    
}
//https://pje.trt15.jus.br/pje-comum-api/api/expedientesmateria/13?idTarefa=0
//https://pje.trt15.jus.br/pje-comum-api/api/modelosdocumentos/pastas/raiz
//https://pje.trt15.jus.br/pje-comum-api/api/pautasaudiencias/horariosvagos?idSalaFisica=2084

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
    orgaosJulgadores:               'orgaos_julgadores',
    tarefasProcesso:                'tarefas_processo',
    modelosDocumentos:              'modelos_documentos',
    expedientesMateria:             'expedientes_materia',
    horariosVagos:                  'horarios_vagos',
}


interceptador_iniciar()

function interceptador_iniciar(){
    relatar('Interceptador de requisições ativo.', '', 'execucao')
    document.addEventListener(
        'RotaRequisicaoInterceptada',
        interceptador_processar
    )
}


/**
 * Nome canônico da metatag de um rótulo.
 * Espelha o que criar_metaTag() grava no atributo name.
 */
function rota_metaTag_nome(rotulo = ''){
    return prefixar(rotulo)
}


function interceptador_processar(evento){
    let dados    = evento.detail
    let url      = dados.url      || ''
    let resposta = dados.resposta || ''

    if(!url.includes('/api/') || !resposta) return

    for(const [chave, expressao] of Object.entries(INTERCEPTADOR_URL)){
        if(expressao.test(url)){
            interceptador_salvarMetaTag(INTERCEPTADOR_ROTULO[chave], resposta)
            break
        }
    }
}


function interceptador_salvarMetaTag(rotulo = '', resposta = ''){

    if(!rotulo || !resposta) return

    try{
        let dados
        try{ dados = JSON.parse(resposta) } catch{ dados = resposta }

        relatar('Salvando metatag: ' + rota_metaTag_nome(rotulo), dados, 'resposta')

        // modulos/dom.js — cria/substitui a <meta> no <head>
        criar_metaTag(rotulo, dados)

        document.dispatchEvent(
            new CustomEvent('RotaMetaTagAtualizada', {
                detail: { rotulo, url: rota_metaTag_nome(rotulo) }
            })
        )

        // Espelha dados importantes no storage para o assistente ler
        const rotulosParaStorage = [
            'processo',
            'processo_partes',
            'audiencias',
            'responsaveis',
            'documentos',
            'orgaos_julgadores'
        ]
        if(rotulosParaStorage.includes(rotulo)){
            let chaveStorage = 'rotaDados_' + rotulo.replaceAll('-', '_')
            armazenar({ [chaveStorage]: dados }).catch(() => {})
        }

        if(rotulo === 'orgaos_julgadores'){
            let agora = Date.now()
            sessionStorage.setItem('rota_evita_queda_origem', agora)
            armazenar({ rota_evita_queda: agora }).catch(() => {})
        }

    } catch(erro){
        relatar('interceptador_salvarMetaTag:', erro, 'erro')
    }
}


// ── Leitura ───────────────────────────────────────────────────

function interceptador_ler(rotulo = ''){
    let meta = selecionar('meta[name="' + rota_metaTag_nome(rotulo) + '"]')
    if(!meta) return null
    let content = meta.getAttribute('content')
    if(!content) return null
    // texto_ou_json() — modulos/texto.js
    return texto_ou_json(content)
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
// ============================================================
// interceptador.js
// Intercepta as requisições XHR que o PJE já faz naturalmente
// e salva os dados úteis como <meta> no <head> da página.
//
// DEVE SER O PRIMEIRO content_script carregado no manifest.json
// para garantir que o XHR seja sobrescrito antes de qualquer
// requisição do PJE.
//
// Inspirado na arquitetura do SISE-JT (interceptarRequisicoesXHR).
// ============================================================


// ── Expressões regulares das URLs da API do PJE ───────────────
//
// Usadas para identificar qual dado está sendo retornado
// em cada resposta interceptada.

const INTERCEPTADOR_URL = {
    processo:       /\/pje-comum-api\/api\/processos\/id\/\d+$/i,
    processoPartes: /\/pje-comum-api\/api\/processos\/id\/\d+\/partes/i,
    tarefas:        /\/pje-comum-api\/api\/agrupamentotarefas$/i,
    tarefasAtivas:  /\/pje-comum-api\/api\/tarefas\/ativas/i,
    perfis:         /\/api\/token\/perfis/i,
    recursos:       /\/api\/token\/permissoes\/recursos/i,
    pauta:          /\/pje-comum-api\/api\/pautasaudiencias/i,
    audiencias:     /\/pje-comum-api\/api\/processos\/id\/\d+\/audiencias/i,
    responsaveis:   /\/pje-comum-api\/api\/usuarios\/internos\/pororgaojulgador/i,
    dadosBasicos:   /\/pje-comum-api\/api\/processos\/dadosbasicos\//i,
    documentos:     /\/pje-comum-api\/api\/processos\/id\/\d+\/documentos/i,
}

// Nome da metatag de cada URL (prefixo 'rota-' adicionado ao salvar)
const INTERCEPTADOR_ROTULO = {
    processo:       'processo',
    processoPartes: 'processo-partes',
    tarefas:        'tarefas',
    tarefasAtivas:  'tarefas-ativas',
    perfis:         'perfis',
    recursos:       'recursos',
    pauta:          'pauta',
    audiencias:     'audiencias',
    responsaveis:   'responsaveis',
    dadosBasicos:   'dados-basicos',
    documentos:     'documentos',
}


// ── Inicialização ─────────────────────────────────────────────
//
// Chamada imediatamente — antes de qualquer outro script.

interceptador_iniciar()

function interceptador_iniciar() {

    // Evita dupla inicialização em navegações SPA
    if (window._rota_interceptando) return
    window._rota_interceptando = true

    interceptador_sobrescreverXHR()

    // Ouve os eventos disparados pelo XHR sobrescrito
    document.addEventListener(
        'RotaRequisicaoInterceptada',
        interceptador_processar
    )

    console.log(
        '%cRota PJE%c ✅ Interceptador iniciado',
        'background:#0078aa;color:#fff;border-radius:3px;padding:0 4px;font-weight:700;',
        'background:#ffa726;color:#fff;border-radius:3px;padding:0 4px;margin-left:3px;'
    )
}


// ── Sobrescrita do XHR ────────────────────────────────────────
//
// Técnica do SISE: sobrescreve open() para guardar a URL,
// e send() para escutar a resposta e disparar evento customizado.

function interceptador_sobrescreverXHR() {

    const _open = XMLHttpRequest.prototype.open
    const _send = XMLHttpRequest.prototype.send

    XMLHttpRequest.prototype.open = function (metodo, url) {
        this._rota_url    = url
        this._rota_metodo = metodo
        return _open.apply(this, arguments)
    }

    XMLHttpRequest.prototype.send = function (dados) {
        const req = this

        req.addEventListener('load', () => {
            if (req.readyState !== 4 || !req._rota_url) return

            document.dispatchEvent(
                new CustomEvent('RotaRequisicaoInterceptada', {
                    detail: {
                        url:      req._rota_url,
                        metodo:   req._rota_metodo,
                        status:   req.status,
                        resposta: req.responseText,
                    }
                })
            )
        })

        return _send.call(this, dados)
    }
}


// ── Processamento das respostas ───────────────────────────────
//
// Recebe cada evento disparado pelo XHR sobrescrito.
// Identifica a URL e salva o dado relevante em metatag.

function interceptador_processar(evento) {
    const { url, resposta, status } = evento.detail

    if (!url || !resposta || status < 200 || status >= 300) return
    if (!url.includes('/api/')) return

    for (const [chave, expressao] of Object.entries(INTERCEPTADOR_URL)) {
        if (expressao.test(url)) {
            const rotulo = INTERCEPTADOR_ROTULO[chave]
            interceptador_salvarMetaTag(rotulo, resposta, url)
            break
        }
    }
}


// ── Salvar em metatag ─────────────────────────────────────────
//
// Salva ou atualiza uma <meta> no <head> com os dados interceptados.
// Se a metatag já existir, atualiza o conteúdo (atualização de SPA).

function interceptador_salvarMetaTag(rotulo, resposta, url) {
    if (!rotulo || !resposta) return

    try {
        const name    = 'rota-' + rotulo
        const content = typeof resposta === 'string' ? resposta : JSON.stringify(resposta)

        let meta = document.head.querySelector(`meta[name="${name}"]`)

        if (meta) {
            // Atualiza metatag existente (navegação SPA sem reload)
            meta.setAttribute('content', content)
        } else {
            meta = document.createElement('meta')
            meta.setAttribute('name', name)
            meta.setAttribute('content', content)
            document.head.appendChild(meta)
        }

        // Dispara evento para quem quiser reagir em tempo real
        document.dispatchEvent(
            new CustomEvent('RotaMetaTagAtualizada', {
                detail: { rotulo, url }
            })
        )

    } catch (erro) {
        console.error('[Rota PJE] interceptador_salvarMetaTag:', erro)
    }
}


// ── Leitura de metatags ───────────────────────────────────────
//
// Funções utilitárias para ler os dados salvos.
// Disponíveis globalmente para uso em qualquer módulo da extensão.

function interceptador_ler(rotulo) {
    const name = 'rota-' + rotulo
    const meta = document.head.querySelector(`meta[name="${name}"]`)
    if (!meta) return null

    const content = meta.getAttribute('content')
    if (!content) return null

    try {
        return JSON.parse(content)
    } catch {
        return content
    }
}

// Atalhos semânticos para os dados mais usados
function interceptador_lerProcesso()     { return interceptador_ler('processo')         }
function interceptador_lerPartes()       { return interceptador_ler('processo-partes')  }
function interceptador_lerTarefas()      { return interceptador_ler('tarefas')          }
function interceptador_lerPerfis()       { return interceptador_ler('perfis')           }
function interceptador_lerAudiencias()   { return interceptador_ler('audiencias')       }
function interceptador_lerResponsaveis() { return interceptador_ler('responsaveis')     }
function interceptador_lerDocumentos()   { return interceptador_ler('documentos')       }


// ── Aguardar dado disponível ──────────────────────────────────
//
// Aguarda até que uma metatag específica esteja disponível.
// Útil quando o assistente precisa de um dado que ainda não chegou.
//
// Uso: const processo = await interceptador_aguardar('processo', 5000)

function interceptador_aguardar(rotulo, timeout = 8000) {
    return new Promise((resolver, rejeitar) => {

        // Já está disponível?
        const existente = interceptador_ler(rotulo)
        if (existente) return resolver(existente)

        const nome = 'rota-' + rotulo

        // Ouve atualizações
        const handler = (evento) => {
            if (evento.detail.rotulo !== rotulo) return
            document.removeEventListener('RotaMetaTagAtualizada', handler)
            clearTimeout(timer)
            resolver(interceptador_ler(rotulo))
        }

        document.addEventListener('RotaMetaTagAtualizada', handler)

        // Timeout de segurança
        const timer = setTimeout(() => {
            document.removeEventListener('RotaMetaTagAtualizada', handler)
            rejeitar(new Error(`[Rota PJE] Timeout aguardando metatag: ${nome}`))
        }, timeout)
    })
}
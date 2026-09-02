// ============================================================
// cache.js
// Cache de requisições à API do PJE via IndexedDB.
//
// Princípio: se já buscamos um dado hoje, não buscamos de novo.
// TTL padrão = fim do dia corrente (meia-noite).
//
// Uso:
//   const dados = await cache_obter('responsaveis')
//   if (!dados) {
//     const resposta = await pje_api_responsaveis()
//     await cache_salvar('responsaveis', resposta)
//   }
// ============================================================


const CACHE_BANCO    = 'RotaPJE'
const CACHE_TABELA   = 'cache-api'
const CACHE_VERSAO   = 1


// ── Abrir banco ───────────────────────────────────────────────

function cache_abrirBanco() {
    return new Promise((resolver, rejeitar) => {
        const req = indexedDB.open(CACHE_BANCO, CACHE_VERSAO)

        req.onupgradeneeded = (evento) => {
            const db = evento.target.result
            if (!db.objectStoreNames.contains(CACHE_TABELA)) {
                db.createObjectStore(CACHE_TABELA, { keyPath: 'chave' })
            }
        }

        req.onsuccess = () => resolver(req.result)
        req.onerror   = () => rejeitar(req.error)
    })
}


// ── Salvar ────────────────────────────────────────────────────
//
// Salva um dado no cache com timestamp de expiração.
// Por padrão expira à meia-noite do dia corrente.
// Para dados mais estáveis (ex: responsaveis), passar ttlDias > 1.

async function cache_salvar(chave, dados, ttlDias = 1) {
    if (!chave || dados === undefined || dados === null) return

    try {
        const db      = await cache_abrirBanco()
        const expira  = cache_calcularExpiracao(ttlDias)
        const item    = {
            chave,
            dados:    typeof dados === 'string' ? dados : JSON.stringify(dados),
            expira,
            salvo:    Date.now(),
        }

        await new Promise((resolver, rejeitar) => {
            const tx  = db.transaction(CACHE_TABELA, 'readwrite')
            const obj = tx.objectStore(CACHE_TABELA)
            const req = obj.put(item)
            req.onsuccess = () => resolver()
            req.onerror   = () => rejeitar(req.error)
        })

        db.close()

    } catch (erro) {
        console.error('[Rota PJE] cache_salvar:', erro)
    }
}


// ── Obter ─────────────────────────────────────────────────────
//
// Retorna o dado se existir e não tiver expirado.
// Retorna null se não existir ou se estiver vencido (e limpa o registro).

async function cache_obter(chave) {
    if (!chave) return null

    try {
        const db   = await cache_abrirBanco()
        const item = await new Promise((resolver, rejeitar) => {
            const tx  = db.transaction(CACHE_TABELA, 'readonly')
            const obj = tx.objectStore(CACHE_TABELA)
            const req = obj.get(chave)
            req.onsuccess = () => resolver(req.result)
            req.onerror   = () => rejeitar(req.error)
        })

        db.close()

        if (!item) return null

        // Expirado?
        if (Date.now() > item.expira) {
            await cache_remover(chave)
            return null
        }

        // Parsear se for JSON
        try {
            return JSON.parse(item.dados)
        } catch {
            return item.dados
        }

    } catch (erro) {
        console.error('[Rota PJE] cache_obter:', erro)
        return null
    }
}


// ── Obter ou buscar ───────────────────────────────────────────
//
// Padrão mais comum: tenta o cache, se não tiver chama a função
// de busca, salva o resultado e retorna.
//
// Uso:
//   const responsaveis = await cache_obterOuBuscar(
//     'responsaveis',
//     pje_api_responsaveis,
//     7   // TTL de 7 dias (dado muito estável)
//   )

async function cache_obterOuBuscar(chave, funcaoBusca, ttlDias = 1) {
    const cached = await cache_obter(chave)
    if (cached !== null) return cached

    try {
        const dados = await funcaoBusca()
        if (dados) await cache_salvar(chave, dados, ttlDias)
        return dados
    } catch (erro) {
        console.error('[Rota PJE] cache_obterOuBuscar:', erro)
        return null
    }
}


// ── Remover ───────────────────────────────────────────────────

async function cache_remover(chave) {
    if (!chave) return

    try {
        const db = await cache_abrirBanco()
        await new Promise((resolver, rejeitar) => {
            const tx  = db.transaction(CACHE_TABELA, 'readwrite')
            const obj = tx.objectStore(CACHE_TABELA)
            const req = obj.delete(chave)
            req.onsuccess = () => resolver()
            req.onerror   = () => rejeitar(req.error)
        })
        db.close()
    } catch (erro) {
        console.error('[Rota PJE] cache_remover:', erro)
    }
}


// ── Limpar tudo ───────────────────────────────────────────────
//
// Remove todos os registros expirados do banco.
// Pode ser chamado ao iniciar a sessão para manter o banco limpo.

async function cache_limparExpirados() {
    try {
        const db    = await cache_abrirBanco()
        const agora = Date.now()

        const chaves = await new Promise((resolver, rejeitar) => {
            const tx      = db.transaction(CACHE_TABELA, 'readonly')
            const obj     = tx.objectStore(CACHE_TABELA)
            const req     = obj.getAll()
            req.onsuccess = () => resolver(
                req.result
                    .filter(item => agora > item.expira)
                    .map(item => item.chave)
            )
            req.onerror = () => rejeitar(req.error)
        })

        db.close()

        for (const chave of chaves) {
            await cache_remover(chave)
        }

    } catch (erro) {
        console.error('[Rota PJE] cache_limparExpirados:', erro)
    }
}


// ── Calcular expiração ────────────────────────────────────────
//
// TTL de 1 dia = meia-noite do dia corrente.
// TTL de N dias = meia-noite N dias à frente.

function cache_calcularExpiracao(ttlDias = 1) {
    const expira = new Date()
    expira.setDate(expira.getDate() + ttlDias)
    expira.setHours(0, 0, 0, 0)
    return expira.getTime()
}


// ── Chaves pré-definidas ──────────────────────────────────────
//
// Nomes padronizados para os dados cacheados mais comuns.
// Evita typos nos roteiros.

const CACHE_CHAVES = {
    responsaveis:   'responsaveis',        // usuários internos por órgão — TTL 7 dias
    perfis:         'perfis',              // perfis do usuário — TTL 1 dia
    tiposAtividade: 'tipos-atividade',     // tipos de atividade (GIG) — TTL 7 dias
    salasFisicas:   'salas-fisicas',       // salas de audiência — TTL 7 dias
    modelo:         (id) => `modelo-${id}`, // modelo de documento por ID — TTL 7 dias
}


// ── Inicialização ─────────────────────────────────────────────
//
// Limpa registros expirados ao iniciar (não bloqueia execução).

cache_limparExpirados()
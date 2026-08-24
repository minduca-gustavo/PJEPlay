/**
 * github_storage.js
 * Módulo para o RotaPJE — gerencia leitura e escrita dos JSONs no repo-dados.
 *
 * Uso no menu-gestor.htm (salvar senha):
 *   await GitHubStorage.salvarSenha(senha);
 *   const ok = await GitHubStorage.testarSenha();
 *
 * Uso no RotaPJE (leitura — sem senha, repo público):
 *   const juizes = await GitHubStorage.lerDados('juizes.json');
 *
 * Uso no menu-gestor.htm (escrita — precisa da senha salva):
 *   await GitHubStorage.salvarDados('juizes.json', objetoAtualizado);
 */

const GitHubStorage = (() => {

  // ─── Configuração ─────────────────────────────────────────────────────────
  // Ajuste estas constantes para os seus repositórios.

  const CONFIG = {
    owner:        'minduca-gustavo',          // usuário/org GitHub
    repoToken:    'rotaPJEt',        // repo público com token.enc
    repoTokenPath:'token.enc',            // caminho do arquivo encriptado
    repoDados:    'rotaPJEd',        // repo público com os JSONs
    branch:       'main',
    senhaStorageKey:  'rota_pje_senha',
    tokenCacheKey:    'rota_pje_token_cache',
    tokenCacheTTL:    7 * 24 * 60 * 60 * 1000, // 7 dias em ms
  };

  // ─── Utilitários de crypto (Web Crypto API — disponível em extensões) ─────

  function encode(str) {
    return new TextEncoder().encode(str);
  }

  function fromBase64(str) {
    return Uint8Array.from(atob(str), c => c.charCodeAt(0));
  }

  async function deriveKey(password, salt) {
    const keyMaterial = await crypto.subtle.importKey(
      'raw', encode(password), { name: 'PBKDF2' }, false, ['deriveKey']
    );
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 310_000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
  }

  /**
   * Decripta o conteúdo do token.enc usando a senha.
   * Lança erro se a senha estiver errada (AES-GCM valida integridade).
   */
  async function decryptToken(encJson, password) {
    let parsed;
    try {
      parsed = JSON.parse(encJson);
    } catch {
      throw new Error('token.enc inválido — não é JSON.');
    }

    if (parsed.v !== 1) {
      throw new Error(`Versão do token.enc não suportada: ${parsed.v}`);
    }

    const salt = fromBase64(parsed.salt);
    const iv   = fromBase64(parsed.iv);
    const data = fromBase64(parsed.data);
    const key  = await deriveKey(password, salt);

    let decrypted;
    try {
      decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
    } catch {
      throw new Error('Senha incorreta ou arquivo corrompido.');
    }

    return new TextDecoder().decode(decrypted);
  }

  // ─── Gerenciamento de senha e token em cache ──────────────────────────────

  /**
   * Salva a senha no chrome.storage.sync com TTL de 7 dias.
   * Chamado pelo menu-gestor quando o usuário digita a senha.
   */
  async function salvarSenha(senha) {
    await chrome.storage.sync.set({
      [CONFIG.senhaStorageKey]: {
        valor:   senha,
        expira:  Date.now() + CONFIG.tokenCacheTTL,
      }
    });
  }

  /**
   * Retorna a senha salva, ou null se expirada/ausente.
   */
  async function getSenha() {
    const data = await chrome.storage.sync.get(CONFIG.senhaStorageKey);
    const entry = data[CONFIG.senhaStorageKey];
    if (!entry || Date.now() > entry.expira) return null;
    return entry.valor;
  }

  /**
   * Busca o token.enc do repo público, decripta com a senha e retorna o token GitHub.
   * Usa cache em memória para não buscar a cada operação.
   */
  const _cache = { token: null, expira: 0 };

  async function getToken() {
    // Cache em memória (válido enquanto a extensão estiver aberta)
    if (_cache.token && Date.now() < _cache.expira) {
      return _cache.token;
    }

    const senha = await getSenha();
    if (!senha) {
      throw new Error('Senha não configurada ou expirada. Configure no menu-gestor.');
    }

    // Busca o token.enc do repo público
    const url = `https://raw.githubusercontent.com/${CONFIG.owner}/${CONFIG.repoToken}/${CONFIG.branch}/${CONFIG.repoTokenPath}`;
    const resp = await fetch(url, { cache: 'no-store' });
    if (!resp.ok) {
      throw new Error(`Não foi possível buscar o token.enc: ${resp.status}`);
    }
    const encJson = await resp.text();

    // Decripta
    const token = await decryptToken(encJson, senha);

    // Cacheia por 1 hora em memória
    _cache.token  = token;
    _cache.expira = Date.now() + 60 * 60 * 1000;

    return token;
  }

  // ─── API pública ──────────────────────────────────────────────────────────

  /**
   * Testa se a senha salva consegue decriptar o token.enc.
   * Retorna true/false — use no menu-gestor para feedback visual.
   */
  async function testarSenha() {
    try {
      await getToken();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Lê um JSON do repo-dados (público, sem autenticação).
   * Use em qualquer parte da extensão para carregar os dados.
   *
   * @param {string} arquivo  ex: 'juizes.json'
   * @returns {Promise<any>}
   */
  async function lerDados(arquivo) {
    const url = `https://raw.githubusercontent.com/${CONFIG.owner}/${CONFIG.repoDados}/${CONFIG.branch}/${arquivo}`;
    const resp = await fetch(url, { cache: 'no-store' });
    if (!resp.ok) {
      throw new Error(`Erro ao ler ${arquivo}: ${resp.status}`);
    }
    return resp.json();
  }

  /**
   * Salva/atualiza um JSON no repo-dados.
   * Requer a senha configurada no menu-gestor.
   *
   * @param {string} arquivo   ex: 'juizes.json'
   * @param {any}    conteudo  objeto JS — será serializado como JSON formatado
   * @param {string} [msg]     mensagem de commit (opcional)
   */
  async function salvarDados(arquivo, conteudo, msg) {
    const token = await getToken();

    const url = `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repoDados}/contents/${arquivo}`;

    // Busca SHA atual (obrigatório para atualizar)
    const getResp = await fetch(url, {
      headers: { Authorization: `token ${token}` }
    });

    let sha;
    if (getResp.ok) {
      const info = await getResp.json();
      sha = info.sha;
    } else if (getResp.status !== 404) {
      throw new Error(`Erro ao verificar ${arquivo}: ${getResp.status}`);
    }

    const json    = JSON.stringify(conteudo, null, 2);
    const base64  = btoa(unescape(encodeURIComponent(json)));
    const message = msg || `dados: atualiza ${arquivo}`;

    const putResp = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization:  `token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        content: base64,
        branch:  CONFIG.branch,
        ...(sha ? { sha } : {}),
      }),
    });

    if (!putResp.ok) {
      const erro = await putResp.text();
      throw new Error(`Erro ao salvar ${arquivo}: ${putResp.status} — ${erro}`);
    }

    return putResp.json();
  }

  // ─── Exports ──────────────────────────────────────────────────────────────

  return {
    salvarSenha,   // (senha: string) => Promise<void>
    testarSenha,   // () => Promise<boolean>
    lerDados,      // (arquivo: string) => Promise<any>
    salvarDados,   // (arquivo: string, conteudo: any, msg?: string) => Promise<any>
    getSenha,      // () => Promise<string|null>  — para saber se está logado
  };

})();
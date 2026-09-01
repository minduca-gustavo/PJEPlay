/**
 * github_storage.js
 * Funções para o RotaPJE — leitura e escrita dos JSONs no repo-dados do GitHub.
 *
 * Uso no menu-gestor.htm (salvar e testar senha):
 *   await githubSalvarSenha(senha);
 *   const ok = await githubTestarSenha();
 *
 * Uso na extensão (leitura pública, sem senha):
 *   const juizes = await githubLerDados('juizes.json');
 *
 * Uso no menu-gestor.htm (escrita, requer senha salva):
 *   await githubSalvarDados('juizes.json', objetoAtualizado);
 */

// ─── Configuração ────────────────────────────────────────────────────────────
// Ajuste para os seus repositórios antes de usar.

const GITHUB_OWNER         = 'minduca-gustavo';     // usuário/org GitHub
const GITHUB_REPO_TOKEN    = 'rotaPJEt';   // repo público com token.enc
const GITHUB_TOKEN_PATH    = 'token.enc';       // caminho do arquivo encriptado
const GITHUB_REPO_DADOS    = 'rotaPJEd';   // repo público com os JSONs
const GITHUB_BRANCH        = 'main';
const GITHUB_SENHA_KEY     = 'rota_pje_senha_gestao';  // chave no armazenar
const GITHUB_SENHA_TTL     = 7 * 24 * 60 * 60 * 1000; // 7 dias em ms

// Cache em memória do token decriptado (válido por 1 hora)
let _githubTokenCache  = null;
let _githubTokenExpira = 0;

// ─── Utilitários internos ────────────────────────────────────────────────────

function _githubEncode(str) {
  return new TextEncoder().encode(str);
}

function _githubFromBase64(str) {
  return Uint8Array.from(atob(str), c => c.charCodeAt(0));
}

async function _githubDeriveKey(password, salt) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw', _githubEncode(password), { name: 'PBKDF2' }, false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 310_000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
}

async function _githubDecryptToken(encJson, password) {
  let parsed;
  try {
    parsed = JSON.parse(encJson);
  } catch {
    throw new Error('token.enc inválido — não é JSON.');
  }

  if (parsed.v !== 1) {
    throw new Error(`Versão do token.enc não suportada: ${parsed.v}`);
  }

  const salt = _githubFromBase64(parsed.salt);
  const iv   = _githubFromBase64(parsed.iv);
  const data = _githubFromBase64(parsed.data);
  const key  = await _githubDeriveKey(password, salt);

  let decrypted;
  try {
    decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
  } catch {
    throw new Error('Senha incorreta ou arquivo corrompido.');
  }

  return new TextDecoder().decode(decrypted);
}

async function _githubGetToken() {
  // Retorna do cache se ainda válido
  if (_githubTokenCache && Date.now() < _githubTokenExpira) {
    return _githubTokenCache;
  }

  const senha = await githubGetSenha();
  if (!senha) {
    throw new Error('Senha não configurada ou expirada. Configure no menu-gestor.');
  }

  const url = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO_TOKEN}/${GITHUB_BRANCH}/${GITHUB_TOKEN_PATH}`;
  const resp = await fetch(url, { cache: 'no-store' });
  if (!resp.ok) {
    throw new Error(`Não foi possível buscar o token.enc: ${resp.status}`);
  }
  const encJson = await resp.text();

  const token = await _githubDecryptToken(encJson, senha);

  // Cacheia por 1 hora
  _githubTokenCache  = token;
  _githubTokenExpira = Date.now() + 60 * 60 * 1000;

  return token;
}

// ─── Funções públicas ────────────────────────────────────────────────────────

/**
 * Salva a senha no armazenar com validade de 7 dias.
 * Chame no menu-gestor quando o usuário digitar a senha.
 */
async function githubSalvarSenha(senha) {
  armazenar({
    [GITHUB_SENHA_KEY]: {
      valor:  senha,
      expira: Date.now() + GITHUB_SENHA_TTL,
    }
  });
  // Limpa cache de token ao trocar a senha
  _githubTokenCache  = null;
  _githubTokenExpira = 0;
}

/**
 * Retorna a senha salva, ou null se ausente/expirada.
 * Use para saber se o usuário está "logado".
 */
async function githubGetSenha() {
  const data  = await obterArmazenamento(GITHUB_SENHA_KEY);
  const entry = data[GITHUB_SENHA_KEY];
  if (!entry || Date.now() > entry.expira) return null;
  return entry.valor;
}

/**
 * Testa se a senha salva consegue decriptar o token.enc.
 * Retorna true/false — use no menu-gestor para feedback visual.
 */
async function githubTestarSenha(senha) {
  try {
    const url = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO_TOKEN}/${GITHUB_BRANCH}/${GITHUB_TOKEN_PATH}`;
    const resp = await fetch(url, { cache: 'no-store' });
    if (!resp.ok) throw new Error();
    const encJson = await resp.text();
    await _githubDecryptToken(encJson, senha);
    return true;
  } catch(e) {
    return false;
  }
}

/**
 * Lê um JSON do repo-dados (público, sem autenticação).
 * Use em qualquer parte da extensão.
 *
 * @param {string} arquivo  ex: 'juizes.json'
 * @returns {Promise<any>}
 */
async function githubLerDados(arquivo) {
  const url = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO_DADOS}/${GITHUB_BRANCH}/${arquivo}`;
  const resp = await fetch(url, { cache: 'no-store' });
  if (!resp.ok) {
    throw new Error(`Erro ao ler ${arquivo}: ${resp.status}`);
  }
  return resp.json();
}

/**
 * Salva/atualiza um JSON no repo-dados.
 * Requer senha configurada no menu-gestor.
 *
 * @param {string} arquivo   ex: 'juizes.json'
 * @param {any}    conteudo  objeto JS — serializado como JSON formatado
 * @param {string} [msg]     mensagem de commit (opcional)
 */
async function githubSalvarDados(arquivo, conteudo, msg) {
  const token = await _githubGetToken();
  const url   = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO_DADOS}/contents/${arquivo}`;

  // Busca SHA atual (obrigatório para atualizar arquivo existente)
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
      branch:  GITHUB_BRANCH,
      ...(sha ? { sha } : {}),
    }),
  });

  if (!putResp.ok) {
    const erro = await putResp.text();
    throw new Error(`Erro ao salvar ${arquivo}: ${putResp.status} — ${erro}`);
  }

  return putResp.json();
}
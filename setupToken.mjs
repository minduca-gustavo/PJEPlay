/**
 * setup_token.mjs
 * Roda UMA VEZ no seu PC para gerar o token.enc e fazer upload pro repo-token.
 *
 * Pré-requisitos:
 *   node >= 18  (usa crypto e fetch nativos, sem dependências externas)
 *
 * Uso:
 *   node 1_setup_token.mjs
 *
 * O script vai pedir interativamente:
 *   1. O Personal Access Token do GitHub (Contents: write no repo-dados)
 *   2. A senha compartilhada entre você e os colegas
 *   3. Usuário GitHub, nome do repo-token e caminho do arquivo
 */

import { createInterface } from 'readline';
import { webcrypto } from 'crypto';

const subtle         = webcrypto.subtle;
const getRandomValues = (arr) => webcrypto.getRandomValues(arr);

// ─── Utilitários ────────────────────────────────────────────────────────────

function prompt(rl, question) {
  return new Promise(resolve => rl.question(question, resolve));
}

function encode(str) {
  return new TextEncoder().encode(str);
}

function toBase64(buffer) {
  return Buffer.from(buffer).toString('base64');
}

function fromBase64(str) {
  return Buffer.from(str, 'base64');
}

// ─── Criptografia (AES-GCM 256) ─────────────────────────────────────────────

/**
 * Deriva uma chave AES-256 a partir da senha usando PBKDF2.
 * O salt é gerado aleatoriamente e salvo junto com o token encriptado.
 */
async function deriveKey(password, salt) {
  const keyMaterial = await subtle.importKey(
    'raw',
    encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 310_000, // OWASP 2023 recommendation
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encripta o token.
 * Retorna um JSON com salt, iv e ciphertext em base64 — seguro para armazenar publicamente.
 *
 * Estrutura do token.enc:
 * {
 *   "v": 1,
 *   "salt": "<base64>",   // 16 bytes aleatórios — para PBKDF2
 *   "iv":   "<base64>",   // 12 bytes aleatórios — para AES-GCM
 *   "data": "<base64>"    // token encriptado
 * }
 */
async function encryptToken(token, password) {
  const salt = getRandomValues(new Uint8Array(16));
  const iv   = getRandomValues(new Uint8Array(12));
  const key  = await deriveKey(password, salt);

  const encrypted = await subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encode(token)
  );

  return JSON.stringify({
    v:    1,
    salt: toBase64(salt),
    iv:   toBase64(iv),
    data: toBase64(new Uint8Array(encrypted)),
  });
}

// ─── GitHub API ──────────────────────────────────────────────────────────────

async function uploadToGitHub({ owner, repo, path, content, token, message }) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

  // Verifica se o arquivo já existe (precisamos do SHA para atualizar)
  let sha;
  const getResp = await fetch(url, {
    headers: { Authorization: `token ${token}` },
  });

  if (getResp.ok) {
    const existing = await getResp.json();
    sha = existing.sha;
    console.log(`\nArquivo existente encontrado. Será atualizado (sha: ${sha.slice(0, 8)}...)`);
  } else if (getResp.status === 404) {
    console.log('\nArquivo não existe. Será criado.');
  } else {
    throw new Error(`Erro ao verificar arquivo: ${getResp.status} ${await getResp.text()}`);
  }

  const body = {
    message,
    content: Buffer.from(content).toString('base64'),
    ...(sha ? { sha } : {}),
  };

  const putResp = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!putResp.ok) {
    throw new Error(`Erro no upload: ${putResp.status} ${await putResp.text()}`);
  }

  return putResp.json();
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  console.log('=== Setup do token.enc para RotaPJE ===\n');
  console.log('Este script vai encriptar o seu GitHub Token com a senha');
  console.log('compartilhada e fazer upload para o repo-token público.\n');

  try {
    // 1. Coleta de dados
    const githubToken = (await prompt(rl, 'GitHub Token (ghp_...): ')).trim();
    if (!githubToken.startsWith('ghp_') && !githubToken.startsWith('github_pat_')) {
      throw new Error('Token inválido. Deve começar com ghp_ ou github_pat_');
    }

    const senha = (await prompt(rl, 'Senha compartilhada: ')).trim();
    if (senha.length < 8) {
      throw new Error('Senha muito curta — use ao menos 8 caracteres.');
    }

    const senhaConfirm = (await prompt(rl, 'Confirme a senha: ')).trim();
    if (senha !== senhaConfirm) {
      throw new Error('Senhas não conferem.');
    }

    const owner     = (await prompt(rl, '\nUsuário/org GitHub (ex: gustavotrt15): ')).trim();
    const repoToken = (await prompt(rl, 'Nome do repo-token  (ex: rotapje-token): ')).trim();
    const repoToken_path = (await prompt(rl, 'Caminho do arquivo  [token.enc]: ')).trim() || 'token.enc';

    rl.close();

    // 2. Encripta
    console.log('\nEncriptando token...');
    const encrypted = await encryptToken(githubToken, senha);
    console.log('Token encriptado com sucesso.');

    // 3. Upload (usa o mesmo token informado)
    console.log(`\nFazendo upload para ${owner}/${repoToken}/${repoToken_path}...`);
    await uploadToGitHub({
      owner,
      repo:    repoToken,
      path:    repoToken_path,
      content: encrypted,
      token:   githubToken,
      message: 'chore: atualiza token.enc',
    });

    console.log('\n✓ token.enc publicado com sucesso!');
    console.log(`  URL pública: https://raw.githubusercontent.com/${owner}/${repoToken}/main/${repoToken_path}`);
    console.log('\nGuarde a senha em local seguro — ela será digitada no menu-gestor da extensão.');

  } catch (err) {
    rl.close();
    console.error('\n✗ Erro:', err.message);
    process.exit(1);
  }
}

main();

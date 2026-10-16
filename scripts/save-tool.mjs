#!/usr/bin/env node
// Ferramenta de TESTES da Quinta Magnífica: decifrar/cifrar saves.
// O jogo cifra com AES-GCM; use isto para inspecionar ou preparar saves.
//
//   node scripts/save-tool.mjs decrypt <save.json> [saida.json]
//   node scripts/save-tool.mjs encrypt <estado.json> [saida.json]
//
// `decrypt` aceita o envelope exportado (`{app, version, encrypted}`);
// imprime o `gameState` (ou grava em `saida.json`).
// `encrypt` lê um `gameState` simples (ou envelope v1 com `gameState`)
// e grava o envelope cifrado v2.
//
// Chave: env QUINTA_SAVE_KEY (hex de 64 chars) ou a mesma de
// `src/lib/game/saveCrypto.ts` (manter sincronizada!).

import { webcrypto } from 'node:crypto';
import fs from 'node:fs';

const KEY_HEX = process.env.QUINTA_SAVE_KEY ||
  'd963e3c2bc969d03b3d79a66c1801e70c6afd7aafe4bdf4ee6318d92f9f0e2fb';

function keyBytes() {
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) bytes[i] = parseInt(KEY_HEX.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

async function importKey() {
  return webcrypto.subtle.importKey('raw', keyBytes(), { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

async function cmdDecrypt(input, output) {
  const envelope = JSON.parse(fs.readFileSync(input, 'utf8'));
  if (!envelope || envelope.app !== 'quinta-magnifica' || typeof envelope.encrypted !== 'string') {
    throw new Error('Ficheiro não é um save cifrado v2 (tem `encrypted`?).');
  }
  const payload = Buffer.from(envelope.encrypted, 'base64');
  const key = await importKey();
  const plaintext = await webcrypto.subtle.decrypt(
    { name: 'AES-GCM', iv: payload.subarray(0, 12) },
    key,
    payload.subarray(12),
  );
  const text = JSON.stringify(JSON.parse(Buffer.from(plaintext).toString('utf8')), null, 2) + '\n';
  if (output) fs.writeFileSync(output, text);
  else process.stdout.write(text);
}

async function cmdEncrypt(input, output) {
  const parsed = JSON.parse(fs.readFileSync(input, 'utf8'));
  const state = parsed && typeof parsed === 'object' && parsed.gameState !== undefined ? parsed.gameState : parsed;
  const key = await importKey();
  const iv = webcrypto.getRandomValues(new Uint8Array(12));
  const ciphertext = Buffer.from(await webcrypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    Buffer.from(JSON.stringify(state), 'utf8'),
  ));
  const envelope = {
    app: 'quinta-magnifica',
    version: 2,
    encrypted: Buffer.concat([Buffer.from(iv), ciphertext]).toString('base64'),
  };
  const text = JSON.stringify(envelope, null, 2) + '\n';
  if (output) fs.writeFileSync(output, text);
  else process.stdout.write(text);
}

const [cmd, input, output] = process.argv.slice(2);
try {
  if (cmd === 'decrypt' && input) await cmdDecrypt(input, output);
  else if (cmd === 'encrypt' && input) await cmdEncrypt(input, output);
  else throw new Error('Uso: save-tool.mjs <decrypt|encrypt> <ficheiro> [saida]');
} catch (error) {
  console.error('Erro:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
}

import type { GameState } from '@/types/game';
import { validateAndNormalizeImportedGameState } from './save';
import type { FishingGrid } from './fishing';

// Saves opacos: o `gameState` é cifrado com AES-GCM (WebCrypto) e vai em
// base64 dentro do envelope `{ app, version: 2, encrypted }` — tanto no
// ficheiro exportado como no `localStorage`. Quem sacar o ficheiro vê
// lixo; qualquer byte adulterado faz a decifra falhar (integridade do GCM).
//
// HONESTIDADE: a chave vive no cliente (tem de viver, o jogo é 100%
// local), por isso isto trava edição casual — não um jogador determinado
// com devtools (aí nem a memória escapa). Para testes, use
// `scripts/save-tool.mjs` (mesma chave) para decifrar/cifrar saves.
//
// Se o WebCrypto não existir (contexto não seguro), a escrita cai para o
// formato simples v1; a leitura aceita os dois formatos.

export const SAVE_ENVELOPE_VERSION = 2;

/**
 * ATENÇÃO: chave embebida = ofuscação forte, não segredo real.
 * Trocar esta chave invalida todos os saves cifrados anteriores.
 * Manter sincronizada com `scripts/save-tool.mjs` (ou QUINTA_SAVE_KEY).
 */
const SAVE_KEY_HEX =
  'd963e3c2bc969d03b3d79a66c1801e70c6afd7aafe4bdf4ee6318d92f9f0e2fb';

export interface EncryptedSaveEnvelope {
  app: 'quinta-magnifica';
  version: number;
  encrypted: string;
}

function subtleCrypto(): SubtleCrypto | null {
  try {
    const subtle = globalThis.crypto?.subtle;
    return subtle ?? null;
  } catch {
    return null;
  }
}

function keyBytes(): Uint8Array {
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(SAVE_KEY_HEX.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

async function importKey(): Promise<CryptoKey | null> {
  const subtle = subtleCrypto();
  if (!subtle) return null;
  try {
    return await subtle.importKey('raw', keyBytes(), { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
  } catch {
    return null;
  }
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function fromBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Cifra o estado para o envelope opaco v2. Falha se não houver WebCrypto. */
export async function encryptGameState(state: GameState): Promise<EncryptedSaveEnvelope> {
  const key = await importKey();
  const subtle = subtleCrypto();
  if (!key || !subtle) throw new Error('WebCrypto indisponível');
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(state));
  const ciphertext = new Uint8Array(await subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext));
  const payload = new Uint8Array(iv.length + ciphertext.length);
  payload.set(iv, 0);
  payload.set(ciphertext, iv.length);
  return { app: 'quinta-magnifica', version: SAVE_ENVELOPE_VERSION, encrypted: toBase64(payload) };
}

/** Decifra um envelope v2 para o objeto bruto (ou null se inválido/adulterado). */
export async function decryptGameState(envelope: EncryptedSaveEnvelope): Promise<Record<string, unknown> | null> {
  const key = await importKey();
  const subtle = subtleCrypto();
  if (!key || !subtle || typeof envelope.encrypted !== 'string') return null;
  try {
    const payload = fromBase64(envelope.encrypted);
    const iv = payload.slice(0, 12);
    const ciphertext = payload.slice(12);
    const plaintext = await subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
    const parsed = JSON.parse(new TextDecoder().decode(plaintext)) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Ponto único de leitura: aceita envelope v2 cifrado OU formato simples
 * v1 (migração de saves antigos). Devolve `GameState` válido ou null.
 */
export async function decryptAndValidateGameState(
  raw: unknown,
  refreshGrid: () => FishingGrid,
): Promise<GameState | null> {
  if (raw && typeof raw === 'object') {
    const envelope = raw as Partial<EncryptedSaveEnvelope> & { gameState?: unknown };
    if (envelope.app === 'quinta-magnifica' && envelope.version === SAVE_ENVELOPE_VERSION && typeof envelope.encrypted === 'string') {
      const decrypted = await decryptGameState(envelope as EncryptedSaveEnvelope);
      if (!decrypted) return null;
      return validateAndNormalizeImportedGameState(decrypted, refreshGrid);
    }
  }
  return validateAndNormalizeImportedGameState(raw, refreshGrid);
}

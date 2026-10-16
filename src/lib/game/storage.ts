import type { GameState } from '@/types/game';
import { encryptGameState } from './saveCrypto';

// Persistência automática em `localStorage`. Desde a v2 o conteúdo vai
// cifrado (AES-GCM, ver `saveCrypto.ts`); sem WebCrypto cai para o
// formato simples v1. Falhas de escrita/leitura (modo privado, quota
// cheia) nunca partem o jogo: ficam em silêncio.

export const SAVE_STORAGE_KEY = 'quinta-magnifica.save.v1';
export const SAVE_VERSION = 2;

export interface StoredSaveV1 {
  app: 'quinta-magnifica';
  version: 1;
  savedAt: number;
  gameState: GameState;
}

export interface StoredSaveV2 {
  app: 'quinta-magnifica';
  version: 2;
  savedAt: number;
  encrypted: string;
}

export type StoredSave = StoredSaveV1 | StoredSaveV2;

function browserStorage(): Storage | null {
  try {
    const storage = globalThis.localStorage;
    return storage ?? null;
  } catch {
    return null;
  }
}

export async function saveGameToStorage(state: GameState): Promise<void> {
  const storage = browserStorage();
  if (!storage) return;
  try {
    const envelope = await encryptGameState(state);
    storage.setItem(SAVE_STORAGE_KEY, JSON.stringify({ ...envelope, savedAt: Date.now() }));
    return;
  } catch {
    // Sem WebCrypto: formato simples (funcional, menos protegido).
  }
  try {
    const payload: StoredSaveV1 = { app: 'quinta-magnifica', version: 1, savedAt: Date.now(), gameState: state };
    storage.setItem(SAVE_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Quota cheia ou escrita bloqueada: o jogo continua sem persistência.
  }
}

export function readGameFromStorage(): StoredSave | null {
  const storage = browserStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(SAVE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredSave> & { encrypted?: unknown; gameState?: unknown };
    if (!parsed || typeof parsed !== 'object' || parsed.app !== 'quinta-magnifica') return null;
    if (parsed.gameState === undefined && typeof parsed.encrypted !== 'string') return null;
    return parsed as StoredSave;
  } catch {
    return null;
  }
}

export function clearGameStorage(): void {
  try {
    browserStorage()?.removeItem(SAVE_STORAGE_KEY);
  } catch {
    // Ignorar: não há nada crítico a fazer.
  }
}

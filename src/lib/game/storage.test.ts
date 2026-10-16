import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SAVE_STORAGE_KEY, clearGameStorage, readGameFromStorage, saveGameToStorage } from './storage';
import type { GameState } from '@/types/game';

function memoryStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => (store.has(key) ? store.get(key) as string : null),
    setItem: (key: string, value: string) => { store.set(key, value); },
    removeItem: (key: string) => { store.delete(key); },
    store,
  };
}

function minimalState(): GameState {
  return {
    playerName: 'Teste',
    currency: 10,
    fields: [],
    animalPens: [],
    inventory: {},
    missions: [],
    achievements: [],
    nextFieldCost: 50,
    nextAnimalPenCost: 75,
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    lastWaterCollectionTime: null,
    fishingGrid: null,
    contracts: [],
    nextContractAt: 0,
    stats: { earned: 0, harvested: 0, collected: 0, crafted: 0, fished: 0, contractsDone: 0, playMs: 0 },
  };
}

describe('storage', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('guarda e lê o save com o envelope partilhado com Exportar/Importar', async () => {
    const mem = memoryStorage();
    vi.stubGlobal('localStorage', mem);
    await saveGameToStorage(minimalState());
    expect(mem.store.has(SAVE_STORAGE_KEY)).toBe(true);
    const stored = JSON.parse(mem.store.get(SAVE_STORAGE_KEY) as string);
    expect(stored.version).toBe(2);
    expect(typeof stored.encrypted).toBe('string');
    const loaded = readGameFromStorage();
    expect(loaded?.app).toBe('quinta-magnifica');
    expect(typeof loaded?.savedAt).toBe('number');
  });

  it('devolve null sem save, com JSON inválido ou sem gameState', () => {
    const mem = memoryStorage();
    vi.stubGlobal('localStorage', mem);
    expect(readGameFromStorage()).toBeNull();
    mem.store.set(SAVE_STORAGE_KEY, '{ inválido');
    expect(readGameFromStorage()).toBeNull();
    mem.store.set(SAVE_STORAGE_KEY, JSON.stringify({ app: 'quinta-magnifica' }));
    expect(readGameFromStorage()).toBeNull();
  });

  it('limpa o save guardado', async () => {
    const mem = memoryStorage();
    vi.stubGlobal('localStorage', mem);
    await saveGameToStorage(minimalState());
    clearGameStorage();
    expect(readGameFromStorage()).toBeNull();
  });

  it('nunca atira sem localStorage (SSR/privado)', async () => {
    vi.stubGlobal('localStorage', undefined);
    await expect(saveGameToStorage(minimalState())).resolves.toBeUndefined();
    expect(readGameFromStorage()).toBeNull();
    expect(() => clearGameStorage()).not.toThrow();
  });
});

import { describe, it, expect } from 'vitest';
import { decryptAndValidateGameState, decryptGameState, encryptGameState } from './saveCrypto';
import type { EncryptedSaveEnvelope } from './saveCrypto';
import type { FishingGrid } from './fishing';
import type { GameState } from '@/types/game';

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

const refreshGrid = (): FishingGrid => [];

describe('saveCrypto', () => {
  it('cifra e decifra com roundtrip válido', async () => {
    const envelope = await encryptGameState(minimalState());
    expect(envelope.app).toBe('quinta-magnifica');
    expect(envelope.version).toBe(2);
    expect(typeof envelope.encrypted).toBe('string');
    // Opaco: não contém o estado em claro.
    expect(envelope.encrypted).not.toContain('Teste');
    const back = await decryptGameState(envelope);
    expect(back?.playerName).toBe('Teste');
    expect((back?.currency as number)).toBe(10);
  });

  it('decryptAndValidate aceita o envelope e normaliza', async () => {
    const envelope = await encryptGameState(minimalState());
    const state = await decryptAndValidateGameState(envelope, refreshGrid);
    expect(state?.currency).toBe(10);
    expect(state?.level).toBe(1);
  });

  it('ficheiro adulterado falha a decifra', async () => {
    const envelope = await encryptGameState(minimalState());
    const first = envelope.encrypted[0] === 'A' ? 'B' : 'A';
    const tampered = { ...envelope, encrypted: first + envelope.encrypted.slice(1) };
    expect(await decryptGameState(tampered)).toBeNull();
    expect(await decryptAndValidateGameState(tampered, refreshGrid)).toBeNull();
  });

  it('rejeita envelope de outra app ou sem cifra', async () => {
    const foreign = { app: 'outra', version: 2, encrypted: 'AAAA' } as unknown as EncryptedSaveEnvelope;
    expect(await decryptGameState(foreign)).toBeNull();
    expect(await decryptAndValidateGameState({ app: 'quinta-magnifica', version: 2 }, refreshGrid)).toBeNull();
    expect(await decryptAndValidateGameState(null, refreshGrid)).toBeNull();
    expect(await decryptAndValidateGameState('lixo', refreshGrid)).toBeNull();
  });

  it('aceita o formato simples v1 (migração)', async () => {
    const legacy = { app: 'quinta-magnifica', version: 1, gameState: minimalState() };
    const state = await decryptAndValidateGameState(legacy, refreshGrid);
    expect(state?.currency).toBe(10);
  });
});

import { describe, it, expect, vi } from 'vitest';
import { validateAndNormalizeImportedGameState } from './save';
import { BASE_FIELD_COST, FISHING_GRID_COLS, FISHING_GRID_ROWS, calculateXpToNextLevel } from '@/config/gameConfig';
import type { FishingGrid } from './fishing';

function validGrid(): FishingGrid {
  return Array(FISHING_GRID_ROWS).fill(null).map(() => Array(FISHING_GRID_COLS).fill(null));
}

function minimalState() {
  return {
    playerName: 'Teste',
    currency: 123.7,
    level: 3,
    xp: 10,
    xpToNextLevel: 999,
    nextFieldCost: 50,
    nextAnimalPenCost: 75,
    fields: [{ id: 'f1', cropId: null, plantTime: null, harvestReadyTime: null, upgradeLevel: 0 }],
    animalPens: [{ id: 'p1', animalTypeId: null, animalPlacedTime: null, productReadyTime: null, upgradeLevel: 0 }],
    inventory: { egg: 3, water: 0, junk: 'x' },
    missions: [],
    achievements: [],
    lastWaterCollectionTime: null,
    fishingGrid: validGrid(),
  };
}

describe('validateAndNormalizeImportedGameState', () => {
  it('rejects null, primitives and shapes without currency/level', () => {
    const grid = () => validGrid();
    expect(validateAndNormalizeImportedGameState(null, grid)).toBeNull();
    expect(validateAndNormalizeImportedGameState(42, grid)).toBeNull();
    expect(validateAndNormalizeImportedGameState({}, grid)).toBeNull();
    expect(validateAndNormalizeImportedGameState({ currency: 10 }, grid)).toBeNull();
  });

  it('accepts both wrapped ({gameState}) and bare saves', () => {
    const grid = () => validGrid();
    const wrapped = validateAndNormalizeImportedGameState({ app: 'quinta-magnifica', version: 1, gameState: minimalState() }, grid);
    const bare = validateAndNormalizeImportedGameState(minimalState(), grid);
    expect(wrapped?.currency).toBe(123);
    expect(bare?.currency).toBe(123);
  });

  it('normalizes numbers, inventory and recomputes xpToNextLevel', () => {
    const grid = () => validGrid();
    const state = validateAndNormalizeImportedGameState(minimalState(), grid);
    expect(state?.level).toBe(3);
    expect(state?.xp).toBe(10);
    expect(state?.xpToNextLevel).toBe(calculateXpToNextLevel(3));
    // inventário: só números > 0 sobrevivem
    expect(state?.inventory).toEqual({ egg: 3 });
  });

  it('regenerates the fishing grid when dimensions are wrong', () => {
    const fresh = validGrid();
    fresh[0][0] = 'sardine';
    const refreshGrid = vi.fn(() => fresh);
    const raw = { ...minimalState(), fishingGrid: [[null]] };
    const state = validateAndNormalizeImportedGameState(raw, refreshGrid);
    expect(refreshGrid).toHaveBeenCalledTimes(1);
    expect(state?.fishingGrid).toBe(fresh);
  });

  it('keeps a valid fishing grid untouched', () => {
    const refreshGrid = vi.fn(() => validGrid());
    const grid = validGrid();
    const state = validateAndNormalizeImportedGameState({ ...minimalState(), fishingGrid: grid }, refreshGrid);
    expect(refreshGrid).not.toHaveBeenCalled();
    expect(state?.fishingGrid).toBe(grid);
  });

  it('defaults costs when missing, from the number of buildings', () => {
    const refreshGrid = () => validGrid();
    const raw = { ...minimalState(), nextFieldCost: undefined, nextAnimalPenCost: undefined };
    const state = validateAndNormalizeImportedGameState(raw, refreshGrid);
    expect(state?.nextFieldCost).toBe(Math.floor(BASE_FIELD_COST * 1.5 ** 1));
    expect(state?.nextAnimalPenCost).toBeGreaterThan(0);
  });

  it('migra saves com o formato antigo de contrato único', () => {
    const grid = () => validGrid();
    const legacyContract = { id: 'c1', requirements: [{ itemId: 'egg', quantity: 2 }], rewardCoins: 30, rewardXp: 8, createdAt: 1, expiresAt: 9999999999999 };
    const state = validateAndNormalizeImportedGameState({ ...minimalState(), activeContract: legacyContract }, grid);
    expect(state?.contracts).toHaveLength(1);
    expect(state?.contracts[0].id).toBe('c1');
  });

  it('preenche contratos e estatísticas em saves antigos (sem os campos novos)', () => {
    const state = validateAndNormalizeImportedGameState(minimalState(), () => validGrid());
    expect(state?.contracts).toEqual([]);
    expect(typeof state?.nextContractAt).toBe('number');
    expect(state?.stats).toEqual({ earned: 0, harvested: 0, collected: 0, crafted: 0, fished: 0, contractsDone: 0, playMs: 0 });
  });
});

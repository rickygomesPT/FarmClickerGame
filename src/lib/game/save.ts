import type { AnimalPen, Contract, Field, GameState, GameStats, Inventory, Mission, AchievementProgress } from '@/types/game';
import {
  BASE_ANIMAL_PEN_COST,
  ANIMAL_PEN_COST_MULTIPLIER,
  BASE_FIELD_COST,
  FIELD_COST_MULTIPLIER,
  FISHING_GRID_COLS,
  FISHING_GRID_ROWS,
  calculateXpToNextLevel,
} from '@/config/gameConfig';
import type { FishingGrid } from './fishing';

export const DEFAULT_GAME_STATS: GameStats = {
  earned: 0,
  harvested: 0,
  collected: 0,
  crafted: 0,
  fished: 0,
  contractsDone: 0,
  playMs: 0,
};

function isValidContract(raw: unknown): raw is Contract {
  if (!raw || typeof raw !== 'object') return false;
  const contract = raw as Record<string, unknown>;
  return (
    typeof contract.id === 'string' &&
    Array.isArray(contract.requirements) &&
    (contract.requirements as unknown[]).every(req =>
      !!req && typeof req === 'object' &&
      typeof (req as { itemId?: unknown }).itemId === 'string' &&
      typeof (req as { quantity?: unknown }).quantity === 'number'
    ) &&
    typeof contract.rewardCoins === 'number' &&
    typeof contract.rewardXp === 'number' &&
    typeof contract.expiresAt === 'number' &&
    (contract.pinned === undefined || typeof contract.pinned === 'boolean')
  );
}

function normalizeStats(raw: unknown): GameStats {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_GAME_STATS };
  const data = raw as Record<string, unknown>;
  const numberOr = (value: unknown, fallback: number) => (typeof value === 'number' && value >= 0 ? Math.floor(value) : fallback);
  return {
    earned: numberOr(data.earned, 0),
    harvested: numberOr(data.harvested, 0),
    collected: numberOr(data.collected, 0),
    crafted: numberOr(data.crafted, 0),
    fished: numberOr(data.fished, 0),
    contractsDone: numberOr(data.contractsDone, 0),
    playMs: numberOr(data.playMs, 0),
  };
}

// Validação/normalização de saves importados. Função pura: recebe o JSON
// bruto e uma fábrica de grelha de pesca (para regenerar grelhas inválidas).
// Devolve um `GameState` válido ou `null` se o ficheiro for inválido.
export function validateAndNormalizeImportedGameState(
  raw: unknown,
  refreshGrid: () => FishingGrid,
): GameState | null {
  if (!raw || typeof raw !== 'object') return null;

  const data = typeof (raw as { gameState?: unknown }).gameState === 'object' && (raw as { gameState?: unknown }).gameState !== null
    ? (raw as { gameState: Record<string, unknown> }).gameState
    : (raw as Record<string, unknown>);

  if (typeof data.currency !== 'number' || typeof data.level !== 'number') return null;
  if (!Array.isArray(data.fields) || !Array.isArray(data.animalPens)) return null;
  if (typeof data.inventory !== 'object' || data.inventory === null) return null;

  const inventory: Inventory = {};
  for (const [key, value] of Object.entries(data.inventory as Record<string, unknown>)) {
    if (typeof value === 'number' && value > 0) inventory[key] = value;
  }

  const fields: Field[] = (data.fields as Field[])
    .filter((f: Field) => f && typeof f.id === 'string' && typeof f.upgradeLevel === 'number')
    .map((f: Field) => ({
      id: f.id,
      cropId: f.cropId ?? null,
      plantTime: f.plantTime ?? null,
      harvestReadyTime: f.harvestReadyTime ?? null,
      upgradeLevel: f.upgradeLevel,
      currentUpgradeCost: f.currentUpgradeCost,
    }));

  const animalPens: AnimalPen[] = (data.animalPens as AnimalPen[])
    .filter((p: AnimalPen) => p && typeof p.id === 'string' && typeof p.upgradeLevel === 'number')
    .map((p: AnimalPen) => ({
      id: p.id,
      animalTypeId: p.animalTypeId ?? null,
      animalPlacedTime: p.animalPlacedTime ?? null,
      productReadyTime: p.productReadyTime ?? null,
      upgradeLevel: p.upgradeLevel,
      currentUpgradeCost: p.currentUpgradeCost,
    }));

  const missions: Mission[] = Array.isArray(data.missions) ? (data.missions as Mission[]) : [];
  const achievements: AchievementProgress[] = Array.isArray(data.achievements) ? (data.achievements as AchievementProgress[]) : [];

  const level = Math.max(1, Math.floor(data.level as number));
  const xp = Math.max(0, Math.floor((data.xp as number) || 0));
  const xpToNextLevel = Math.max(1, Math.floor(calculateXpToNextLevel(level)));

  const nextFieldCost = typeof data.nextFieldCost === 'number' ? data.nextFieldCost : Math.floor(BASE_FIELD_COST * Math.pow(FIELD_COST_MULTIPLIER, fields.length));
  const nextAnimalPenCost = typeof data.nextAnimalPenCost === 'number' ? data.nextAnimalPenCost : Math.floor(BASE_ANIMAL_PEN_COST * Math.pow(ANIMAL_PEN_COST_MULTIPLIER, animalPens.length));

  let fishingGrid = data.fishingGrid as FishingGrid | unknown;
  if (!Array.isArray(fishingGrid) || fishingGrid.length !== FISHING_GRID_ROWS || (fishingGrid as unknown[]).some(row => !Array.isArray(row) || (row as unknown[]).length !== FISHING_GRID_COLS)) {
    fishingGrid = refreshGrid();
  }

  return {
    playerName: typeof data.playerName === 'string' ? data.playerName : 'Convidado',
    currency: Math.max(0, Math.floor(data.currency as number)),
    fields,
    animalPens,
    inventory,
    missions,
    achievements,
    nextFieldCost,
    nextAnimalPenCost,
    level,
    xp,
    xpToNextLevel,
    lastWaterCollectionTime: typeof data.lastWaterCollectionTime === 'number' ? data.lastWaterCollectionTime : null,
    fishingGrid: fishingGrid as FishingGrid,
    contracts: normalizeContracts(data),
    nextContractAt: typeof data.nextContractAt === 'number' ? data.nextContractAt : Date.now(),
    stats: normalizeStats(data.stats),
  };
}

function normalizeContracts(data: Record<string, unknown>): Contract[] {
  const list: unknown[] = Array.isArray(data.contracts)
    ? data.contracts as unknown[]
    : isValidContract(data.activeContract)
      ? [data.activeContract as Contract]
      : [];
  // Migração: contratos antigos (formato único ou sem `pinned`) ganham defaults.
  return list.filter(isValidContract).map(contract => ({ ...contract, pinned: contract.pinned ?? false }));
}

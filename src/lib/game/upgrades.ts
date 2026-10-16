import {
  ANIMAL_PEN_UPGRADE_TIME_FACTOR_PER_LEVEL,
  FIELD_UPGRADE_TIME_FACTOR_PER_LEVEL,
  UPGRADE_YIELD_BONUS_PER_LEVEL,
} from '@/config/gameConfig';

// Matemática dos upgrades de campos e currais (usada em `page.tsx` e nas
// pré-visualizações dos cartões). Funções puras.
//
// Modelo: cada nível soma +25% da base à colheita (mínimo +1, para os
// níveis nunca "falharem") e multiplica o tempo por 0.85.

export const MIN_EFFECTIVE_TIME_MS = 1000;

export function upgradeYield(baseYield: number, level: number): number {
  if (level <= 0) return baseYield;
  return baseYield + Math.max(1, Math.floor(baseYield * UPGRADE_YIELD_BONUS_PER_LEVEL * level));
}

export function upgradeFieldTime(baseTimeMs: number, level: number): number {
  return upgradeTime(baseTimeMs, level, FIELD_UPGRADE_TIME_FACTOR_PER_LEVEL);
}

export function upgradePenTime(baseTimeMs: number, level: number): number {
  return upgradeTime(baseTimeMs, level, ANIMAL_PEN_UPGRADE_TIME_FACTOR_PER_LEVEL);
}

export function upgradeTime(baseTimeMs: number, level: number, factorPerLevel: number): number {
  if (baseTimeMs <= 0) return 0;
  return Math.max(MIN_EFFECTIVE_TIME_MS, Math.floor(baseTimeMs * Math.pow(factorPerLevel, level)));
}

/** Débito relativo (1 = base). Ex.: 1.5 = +50% moedas/min. */
export function upgradeThroughput(baseYield: number, baseTimeMs: number, level: number, factorPerLevel: number): number {
  if (baseTimeMs <= 0 || level <= 0) return 1;
  return upgradeYield(baseYield, level) / baseYield / (upgradeTime(baseTimeMs, level, factorPerLevel) / baseTimeMs);
}

/** Milissegundos a abater com o regador: `percent`% do tempo efetivo. */
export function wateringCanReductionMs(effectiveGrowthTimeMs: number, percent: number): number {
  if (effectiveGrowthTimeMs <= 0 || percent <= 0) return 0;
  return Math.floor(effectiveGrowthTimeMs * (percent / 100));
}

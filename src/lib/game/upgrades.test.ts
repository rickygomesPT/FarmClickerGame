import { describe, it, expect } from 'vitest';
import { MIN_EFFECTIVE_TIME_MS, upgradeFieldTime, upgradePenTime, upgradeThroughput, upgradeYield, wateringCanReductionMs } from './upgrades';
import { MAX_UPGRADE_LEVEL } from '@/config/gameConfig';

describe('upgradeYield', () => {
  it('devolve a base no nível 0', () => {
    expect(upgradeYield(5, 0)).toBe(5);
  });

  it('garante no mínimo +1 por nível (nunca falha)', () => {
    expect(upgradeYield(1, 1)).toBe(2);
    expect(upgradeYield(3, 1)).toBe(4);
  });

  it('soma +25% da base por nível', () => {
    expect(upgradeYield(8, 1)).toBe(10);
    expect(upgradeYield(8, 2)).toBe(12);
    expect(upgradeYield(4, 5)).toBe(9);
  });

  it('cresce monotonicamente com o nível', () => {
    let prev = upgradeYield(6, 0);
    for (let level = 1; level <= MAX_UPGRADE_LEVEL; level++) {
      const next = upgradeYield(6, level);
      expect(next).toBeGreaterThan(prev);
      prev = next;
    }
  });
});

describe('upgradeFieldTime / upgradePenTime', () => {
  it('devolve a base no nível 0', () => {
    expect(upgradeFieldTime(60000, 0)).toBe(60000);
    expect(upgradePenTime(30000, 0)).toBe(30000);
  });

  it('multiplica por 0.85 por nível', () => {
    expect(upgradeFieldTime(60000, 1)).toBe(51000);
    expect(upgradeFieldTime(60000, 2)).toBe(Math.floor(60000 * Math.pow(0.85, 2)));
  });

  it('nunca desce abaixo de 1s nem com níveis altos', () => {
    expect(upgradeFieldTime(1500, 5)).toBe(MIN_EFFECTIVE_TIME_MS);
    expect(upgradePenTime(100, 5)).toBe(MIN_EFFECTIVE_TIME_MS);
  });

  it('devolve 0 para tempos não positivos (animais só de carne)', () => {
    expect(upgradePenTime(0, 3)).toBe(0);
  });
});

describe('upgradeThroughput', () => {  it('o nível 1 dá um salto visível (≥ +35%)', () => {
    // alface: 3/15s → 4/12.75s ≈ +57%
    expect(upgradeThroughput(3, 15000, 1, 0.85)).toBeGreaterThan(1.35);
    // milho: 6/90s → 7/76.5s ≈ +37%
    expect(upgradeThroughput(6, 90000, 1, 0.85)).toBeGreaterThan(1.35);
  });

  it('o nível máximo multiplica o débito (≥ ×4)', () => {
    expect(upgradeThroughput(6, 90000, MAX_UPGRADE_LEVEL, 0.85)).toBeGreaterThan(4);
    expect(upgradeThroughput(3, 15000, MAX_UPGRADE_LEVEL, 0.85)).toBeGreaterThan(4);
  });
});

describe('wateringCanReductionMs', () => {
  it('abate a percentagem do tempo efetivo', () => {
    expect(wateringCanReductionMs(60000, 25)).toBe(15000);
    expect(wateringCanReductionMs(12750, 25)).toBe(3187);
  });

  it('devolve 0 para entradas inválidas', () => {
    expect(wateringCanReductionMs(0, 25)).toBe(0);
    expect(wateringCanReductionMs(60000, 0)).toBe(0);
  });
});

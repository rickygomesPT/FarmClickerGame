import { describe, it, expect } from 'vitest';
import { MAX_MISSION_TIME_MS, clampMissionAmount } from './missions';

describe('clampMissionAmount', () => {
  it('corta colheitas longas pelo teto de tempo', () => {
    // tomate: 60s / 4 = 15s por item → teto 48
    expect(clampMissionAmount('HARVEST_CROP', 50, { timeMsPerItem: 15000 })).toBe(48);
    // alface: 15s / 3 = 5s por item → teto 144, não corta 20
    expect(clampMissionAmount('HARVEST_CROP', 20, { timeMsPerItem: 5000 })).toBe(20);
  });

  it('corta plantações pelo tempo de ocupação do campo', () => {
    // milho: 90s por plantação → teto 8
    expect(clampMissionAmount('PLANT_CROP', 12, { timeMsPerItem: 90000 })).toBe(8);
  });

  it('limita carnes (sem ciclo) a 3 unidades', () => {
    expect(clampMissionAmount('COLLECT_ANIMAL_PRODUCT', 6, {})).toBe(3);
    expect(clampMissionAmount('COLLECT_ANIMAL_PRODUCT', 2, {})).toBe(2);
  });

  it('limita produtos passivos pelo ciclo', () => {
    // lã: 60s por unidade → teto 12
    expect(clampMissionAmount('COLLECT_ANIMAL_PRODUCT', 20, { timeMsPerItem: 60000 })).toBe(12);
  });

  it('pratos caros pedem sempre 1 unidade', () => {
    expect(clampMissionAmount('CRAFT_ITEM', 2, { priceEach: 1455 })).toBe(1);
    expect(clampMissionAmount('CRAFT_ITEM', 2, { priceEach: 50 })).toBe(2);
  });

  it('deixa passar tipos sem custo (moedas, upgrades, animais)', () => {
    expect(clampMissionAmount('EARN_CURRENCY', 150)).toBe(150);
    expect(clampMissionAmount('HAVE_CURRENCY', 250)).toBe(250);
    expect(clampMissionAmount('UPGRADE_FIELDS', 2)).toBe(2);
    expect(clampMissionAmount('BUY_ANIMAL', 2)).toBe(2);
    expect(MAX_MISSION_TIME_MS).toBe(12 * 60 * 1000);
  });
});

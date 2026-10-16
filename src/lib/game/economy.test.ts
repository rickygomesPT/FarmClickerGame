import { describe, it, expect } from 'vitest';
import {
  ALL_SELLABLE_ITEMS,
  AVAILABLE_ANIMALS,
  AVAILABLE_CROPS,
  AVAILABLE_FISH,
  AVAILABLE_RECIPES,
  AVAILABLE_RESOURCE_ITEMS,
  ANIMAL_PEN_UPGRADE_COST_MULTIPLIER,
  FIELD_UPGRADE_COST_MULTIPLIER,
  FISH_TYPE_PROBABILITIES,
  MAX_UPGRADE_LEVEL,
} from '@/config/gameConfig';
import { upgradeYield } from './upgrades';

// Invariantes da economia. Se algum falhar após mexer em preços/tempos,
// a escada de progressão partiu — ver o cabeçalho de `gameConfig.ts`.

const priceOf = new Map(ALL_SELLABLE_ITEMS.map(item => [item.id, item.sellPrice]));
const resourcePrice = new Map(AVAILABLE_RESOURCE_ITEMS.map(item => [item.id, item.sellPrice]));

function cropUnitPrice(cropId: string, sellPrice: number, productId?: string): number {
  if (sellPrice > 0) return sellPrice;
  const product = productId ? resourcePrice.get(productId) : undefined;
  if (product === undefined) throw new Error(`Sem preço para ${cropId}`);
  return product;
}

function cropProfitPerMinute(index: number): number {
  const crop = AVAILABLE_CROPS[index];
  const unit = cropUnitPrice(crop.id, crop.sellPrice, crop.productId);
  return (crop.harvestYield * unit - crop.seedCost) / (crop.growthTime / 60000);
}

describe('escada das culturas', () => {
  it('toda a cultura dá lucro na venda direta', () => {
    for (const crop of AVAILABLE_CROPS) {
      const unit = cropUnitPrice(crop.id, crop.sellPrice, crop.productId);
      expect(crop.harvestYield * unit - crop.seedCost, crop.id).toBeGreaterThan(0);
    }
  });

  it('o lucro/minuto cresce estritamente com o desbloqueio', () => {
    for (let i = 1; i < AVAILABLE_CROPS.length; i++) {
      expect(cropProfitPerMinute(i), AVAILABLE_CROPS[i].id).toBeGreaterThan(cropProfitPerMinute(i - 1));
    }
  });

  it('a semente custa no máximo 60% da receita', () => {
    for (const crop of AVAILABLE_CROPS) {
      const unit = cropUnitPrice(crop.id, crop.sellPrice, crop.productId);
      expect(crop.seedCost / (crop.harvestYield * unit), crop.id).toBeLessThanOrEqual(0.6);
    }
  });
});

describe('equilíbrio dos animais', () => {
  it('o custo cresce estritamente com o desbloqueio', () => {
    for (let i = 1; i < AVAILABLE_ANIMALS.length; i++) {
      expect(AVAILABLE_ANIMALS[i].cost, AVAILABLE_ANIMALS[i].id).toBeGreaterThan(AVAILABLE_ANIMALS[i - 1].cost);
    }
  });

  it('o abate vale no máximo 80% do custo (é salvado, não lucro)', () => {
    for (const animal of AVAILABLE_ANIMALS) {
      if (!animal.meatProductId) continue;
      const meatPrice = priceOf.get(animal.meatProductId);
      if (meatPrice === undefined) throw new Error(`Sem preço para ${animal.meatProductId}`);
      expect(animal.butcherYield * meatPrice, animal.id).toBeLessThanOrEqual(animal.cost * 0.8);
    }
  });

  it('o abate continua sem lucro mesmo no nível máximo de upgrade', () => {
    for (const animal of AVAILABLE_ANIMALS) {
      if (!animal.meatProductId) continue;
      const meatPrice = priceOf.get(animal.meatProductId);
      if (meatPrice === undefined) throw new Error(`Sem preço para ${animal.meatProductId}`);
      expect(upgradeYield(animal.butcherYield, MAX_UPGRADE_LEVEL) * meatPrice, animal.id).toBeLessThanOrEqual(animal.cost * 0.8);
    }
  });

  it('o rendimento passivo fica abaixo de 80% da melhor cultura do nível', () => {
    for (const animal of AVAILABLE_ANIMALS) {
      if (!animal.productId || animal.productionTime <= 0) continue;
      const productPrice = priceOf.get(animal.productId);
      if (productPrice === undefined) throw new Error(`Sem preço para ${animal.productId}`);
      const passivePerMinute = (animal.productYield * productPrice) / (animal.productionTime / 60000);
      const eligibleIndexes = AVAILABLE_CROPS.map((crop, index) => ({ crop, index })).filter(({ crop }) => crop.minLevel <= animal.minLevel);
      const bestCrop = Math.max(...eligibleIndexes.map(({ index }) => cropProfitPerMinute(index)));
      expect(passivePerMinute, animal.id).toBeLessThanOrEqual(bestCrop * 0.8);
    }
  });
});

describe('margens do crafting', () => {
  it('toda a receita vende acima de 115% do custo dos ingredientes', () => {
    for (const recipe of AVAILABLE_RECIPES) {
      const productPrice = priceOf.get(recipe.producesItemId);
      if (productPrice === undefined) throw new Error(`Sem preço para ${recipe.producesItemId}`);
      const cost = recipe.ingredients.reduce((sum, ing) => {
        const ingredientPrice = priceOf.get(ing.itemId);
        if (ingredientPrice === undefined) throw new Error(`Sem preço para ${ing.itemId}`);
        return sum + ingredientPrice * ing.quantity;
      }, 0);
      expect(productPrice, recipe.id).toBeGreaterThanOrEqual(cost * 1.15);
    }
  });
});

describe('pesca e upgrades', () => {
  it('o valor esperado por peixe não passa de 25 moedas', () => {
    const fishPrice = new Map(AVAILABLE_FISH.map(fish => [fish.id, fish.sellPrice]));
    const totalWeight = FISH_TYPE_PROBABILITIES.reduce((sum, fish) => sum + fish.weight, 0);
    const expected = FISH_TYPE_PROBABILITIES.reduce((sum, fish) => sum + (fishPrice.get(fish.fishId) ?? 0) * fish.weight, 0) / totalWeight;
    expect(expected).toBeLessThanOrEqual(25);
  });

  it('os multiplicadores de upgrade são suaves (×2)', () => {
    expect(FIELD_UPGRADE_COST_MULTIPLIER).toBe(2);
    expect(ANIMAL_PEN_UPGRADE_COST_MULTIPLIER).toBe(2);
  });
});

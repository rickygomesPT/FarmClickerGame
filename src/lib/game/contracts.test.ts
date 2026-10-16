import { describe, it, expect } from 'vitest';
import {
  CONTRACT_DURATION_MS,
  MAX_ACTIVE_CONTRACTS,
  canFulfillContract,
  contractQuantity,
  contractUnitTimeMs,
  generateContract,
  getContractableItems,
  shouldGenerateContract,
  sweepExpiredContracts,
} from './contracts';

describe('getContractableItems', () => {
  it('no nível 1 só oferece o desbloqueado e nunca água/isca', () => {
    const items = getContractableItems(1);
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.minLevel).toBeLessThanOrEqual(1);
      expect(item.sellPrice).toBeGreaterThan(0);
    }
    const ids = items.map(i => i.id);
    expect(ids).not.toContain('water');
    expect(ids).not.toContain('fishing_bait');
    expect(ids).toContain('lettuce');
  });

  it('desbloqueia mais itens com o nível (peixe, receitas, carnes)', () => {
    const low = new Set(getContractableItems(1).map(i => i.id));
    const high = new Set(getContractableItems(20).map(i => i.id));
    expect(high.size).toBeGreaterThan(low.size);
    expect(high.has('sardine')).toBe(true);
    expect(high.has('bread')).toBe(true);
  });
});

describe('generateContract', () => {
  it('é determinístico com random injetado e respeita os desbloqueios', () => {
    const contract = generateContract(1, 1000000, () => 0);
    expect(contract).not.toBeNull();
    expect(contract?.requirements).toHaveLength(1);
    expect(contract?.requirements[0]).toEqual({ itemId: 'lettuce', quantity: 8 });
    expect(contract?.rewardCoins).toBe(24);
    expect(contract?.rewardXp).toBe(8);
    expect(contract?.pinned).toBe(false);
    expect(contract?.createdAt).toBe(1000000);
    expect(contract?.expiresAt).toBe(1000000 + CONTRACT_DURATION_MS);
    expect(contract?.id).toContain('1000000');
  });

  it('pede até 3 linhas em níveis altos', () => {
    const contract = generateContract(20, 1000000, () => 0.999);
    expect(contract).not.toBeNull();
    expect(contract!.requirements.length).toBeLessThanOrEqual(3);
    for (const req of contract!.requirements) {
      expect(req.quantity).toBeGreaterThanOrEqual(1);
      expect(req.quantity).toBeLessThanOrEqual(12);
    }
  });
});

describe('contractQuantity', () => {
  it('cabe no orçamento de tempo com teto de 8', () => {
    expect(contractQuantity('lettuce', 2)).toBe(8);
    expect(contractQuantity('olive', 55)).toBe(6);
    expect(contractQuantity('egg', 8)).toBe(6);
  });

  it('limita carnes a 2 e pratos caros pelo valor', () => {
    expect(contractQuantity('rabbit_meat', 22)).toBe(2);
    expect(contractQuantity('churrasco', 635)).toBe(1);
    expect(contractQuantity('bread', 50)).toBe(3);
  });

  it('mede o tempo unitário por tipo de item', () => {
    expect(contractUnitTimeMs('lettuce')).toBe(5000);
    expect(contractUnitTimeMs('milk')).toBe(30000);
    expect(contractUnitTimeMs('rabbit_meat')).toBe(Number.POSITIVE_INFINITY);
    expect(contractUnitTimeMs('sardine')).toBe(30000);
  });
});

describe('sweepExpiredContracts', () => {
  const base = { requirements: [], rewardCoins: 10, rewardXp: 5, createdAt: 0 };
  it('remove expirados mas mantém fixados', () => {
    const list = [
      { ...base, id: 'a', expiresAt: 100, pinned: false },
      { ...base, id: 'b', expiresAt: 100, pinned: true },
      { ...base, id: 'c', expiresAt: 9999, pinned: false },
    ];
    expect(sweepExpiredContracts(list, 200).map(c => c.id)).toEqual(['b', 'c']);
  });
});

describe('shouldGenerateContract', () => {
  it('gera com lugar livre e cadência cumprida; fixados não ocupam lugar', () => {
    const mk = (id: string, pinned: boolean) => ({ id, requirements: [], rewardCoins: 1, rewardXp: 1, createdAt: 0, expiresAt: 9999, pinned });
    const full = Array.from({ length: MAX_ACTIVE_CONTRACTS }, (_, i) => mk('u' + i, false));
    expect(shouldGenerateContract(full, 0, 1000)).toBe(false);
    expect(shouldGenerateContract([], 2000, 1000)).toBe(false);
    expect(shouldGenerateContract([], 0, 1000)).toBe(true);
    const pinnedFull = Array.from({ length: MAX_ACTIVE_CONTRACTS }, (_, i) => mk('p' + i, true));
    expect(shouldGenerateContract(pinnedFull, 0, 1000)).toBe(true);
  });
});

describe('canFulfillContract', () => {
  it('verdadeiro só com tudo no inventário', () => {
    const reqs = [{ itemId: 'egg', quantity: 3 }, { itemId: 'milk', quantity: 1 }];
    expect(canFulfillContract({ egg: 3, milk: 2 }, reqs)).toBe(true);
    expect(canFulfillContract({ egg: 2, milk: 1 }, reqs)).toBe(false);
    expect(canFulfillContract({}, reqs)).toBe(false);
  });
});

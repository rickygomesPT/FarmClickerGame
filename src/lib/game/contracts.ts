import {
  ALL_SELLABLE_ITEMS,
  AVAILABLE_ANIMALS,
  AVAILABLE_CROPS,
  AVAILABLE_FISH,
  AVAILABLE_RECIPES,
  AVAILABLE_RESOURCE_ITEMS,
  BAIT_ID,
} from '@/config/gameConfig';
import type { Contract, ContractRequirement, Inventory } from '@/types/game';

// Contratos (encomendas de clientes). Um contrato pede 1–3 tipos de itens
// que o jogador já consegue obter ao nível atual, expira em 10 minutos e
// um novo aparece de 3 em 3 minutos quando o lugar está livre (máx. 6).
// Tudo aqui é puro e determinístico com `random` injetado (testes).

export const CONTRACT_INTERVAL_MS = 3 * 60 * 1000;
export const CONTRACT_DURATION_MS = 10 * 60 * 1000;
export const CONTRACT_FIRST_DELAY_MS = 60 * 1000;
export const MAX_ACTIVE_CONTRACTS = 6;
/** Orçamento de produção por contrato: tem de caber na validade com folga. */
export const CONTRACT_TIME_BUDGET_MS = 3 * 60 * 1000;

const EXCLUDED_ITEM_IDS = new Set<string>([BAIT_ID, 'water']);

export interface ContractableItem {
  id: string;
  sellPrice: number;
  minLevel: number;
}

/** Itens que o jogador consegue obter ao `level` (preço de venda > 0). */
export function getContractableItems(level: number): ContractableItem[] {
  const items = new Map<string, ContractableItem>();
  const add = (id: string, sellPrice: number, minLevel: number) => {
    if (!id || EXCLUDED_ITEM_IDS.has(id) || sellPrice <= 0 || minLevel > level || items.has(id)) return;
    items.set(id, { id, sellPrice, minLevel });
  };

  for (const crop of AVAILABLE_CROPS) {
    const product = crop.productId ? AVAILABLE_RESOURCE_ITEMS.find(r => r.id === crop.productId) : undefined;
    const unitPrice = crop.sellPrice > 0 ? crop.sellPrice : product?.sellPrice ?? 0;
    add(crop.productId || crop.id, unitPrice, crop.minLevel);
  }

  for (const animal of AVAILABLE_ANIMALS) {
    for (const productId of [animal.productId, animal.meatProductId]) {
      if (!productId) continue;
      const item = ALL_SELLABLE_ITEMS.find(i => i.id === productId);
      if (item) add(productId, item.sellPrice, animal.minLevel);
    }
  }

  for (const fish of AVAILABLE_FISH) {
    add(fish.id, fish.sellPrice, 1);
  }

  for (const resource of AVAILABLE_RESOURCE_ITEMS) {
    const source = AVAILABLE_CROPS.find(c => c.productId === resource.id);
    add(resource.id, resource.sellPrice, source ? source.minLevel : 1);
  }

  for (const recipe of AVAILABLE_RECIPES) {
    const produced = ALL_SELLABLE_ITEMS.find(i => i.id === recipe.producesItemId);
    if (produced) add(produced.id, produced.sellPrice, recipe.minLevelRequired ?? 1);
  }

  return [...items.values()];
}

export function canFulfillContract(inventory: Inventory, requirements: ContractRequirement[]): boolean {
  return requirements.every(req => (inventory[req.itemId] || 0) >= req.quantity);
}

/**
 * ms de produção por unidade do item (um slot). Carnes (sem ciclo) e
 * craftables devolvem valores de recurso para limitar quantidades.
 */
export function contractUnitTimeMs(itemId: string): number {
  const crop = AVAILABLE_CROPS.find(c => c.id === itemId || c.productId === itemId);
  if (crop) return crop.growthTime / Math.max(1, crop.harvestYield);

  const animal = AVAILABLE_ANIMALS.find(a => a.productId === itemId || a.meatProductId === itemId);
  if (animal) {
    if (animal.productionTime <= 0) return Number.POSITIVE_INFINITY;
    const isMeat = animal.meatProductId === itemId;
    if (isMeat) return Number.POSITIVE_INFINITY;
    return animal.productionTime / Math.max(1, animal.productYield);
  }

  if (AVAILABLE_FISH.some(f => f.id === itemId)) return 30000;
  return 60000;
}

export function contractQuantity(itemId: string, sellPrice: number): number {
  const unitTime = contractUnitTimeMs(itemId);
  if (!Number.isFinite(unitTime)) return 2;
  const byTime = Math.ceil(CONTRACT_TIME_BUDGET_MS / unitTime);
  const byValue = Math.max(1, Math.floor(400 / Math.max(1, sellPrice)));
  return Math.max(1, Math.min(8, byTime, byValue));
}

export function generateContract(
  level: number,
  now: number = Date.now(),
  random: () => number = Math.random,
): Contract | null {
  const pool = getContractableItems(level);
  if (pool.length === 0) return null;

  const maxLines = level >= 10 ? 3 : 2;
  const lineCount = 1 + Math.floor(random() * Math.min(maxLines, pool.length));

  const bag = [...pool];
  const picked: ContractableItem[] = [];
  for (let i = 0; i < lineCount && bag.length > 0; i++) {
    const taken = bag.splice(Math.floor(random() * bag.length), 1)[0];
    picked.push(taken);
  }

  const requirements: ContractRequirement[] = picked.map(item => ({
    itemId: item.id,
    quantity: contractQuantity(item.id, item.sellPrice),
  }));

  const goodsValue = requirements.reduce((sum, req) => {
    const price = pool.find(p => p.id === req.itemId)?.sellPrice ?? 0;
    return sum + price * req.quantity;
  }, 0);

  return {
    id: `${now}-${Math.floor(random() * 1000000)}`,
    requirements,
    rewardCoins: Math.ceil(goodsValue * 1.35) + level * 2,
    rewardXp: Math.ceil(goodsValue * 0.15) + 5,
    createdAt: now,
    expiresAt: now + CONTRACT_DURATION_MS,
    pinned: false,
  };
}

/** Remove expirados (fixados nunca expiram). Pura, para o tick de 1 s. */
export function sweepExpiredContracts(contracts: Contract[], now: number): Contract[] {
  return contracts.filter(c => c.pinned || now < c.expiresAt);
}

/** Há lugar e já passou a cadência? Fixados não ocupam lugar. */
export function shouldGenerateContract(contracts: Contract[], nextContractAt: number, now: number): boolean {
  return now >= nextContractAt && contracts.filter(c => !c.pinned).length < MAX_ACTIVE_CONTRACTS;
}

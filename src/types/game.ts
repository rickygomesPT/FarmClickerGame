
// ============================================================================
// 💡 O QUE É ESTE FICHEIRO?
//
// Define a "forma" de cada coisa do jogo (tipos TypeScript). Isto é como um
// contrato: diz ao programa que informação cada objeto TINHA de ter.
//
// Exemplo: a interface `Crop` diz que uma cultura PRECISA de `seedCost`
// (custo da semente), `growthTime` (tempo de crescimento), etc.
// Se um objeto não tiver esses campos, o TypeScript acusa erro.
//
// ➕ ADICIONAR FUNCIONALIDADE AQUI: ao criar uma coisa nova no jogo
//    (ex.: um "armazém"), comece por criar aqui a sua interface.
// 🔧 ALTERAR AQUI: para afinar valores use o ficheiro `src/config/gameConfig.ts`,
//    não este. Este ficheiro só define a FORMA dos dados.
// ============================================================================

import type { LucideIcon } from 'lucide-react';

export interface ItemEffect {
  type: 'SPEED_UP_CROP'; // Só existe este efeito; ao criar outro, alargue aqui
  valueType: 'percentage' | 'fixed_seconds'; // How the value is interpreted
  value: number; // The actual value of the effect (e.g., 25 for 25%, or 30 for 30 seconds)
  target: 'field'; // What the effect applies to
  description?: string; // Optional description of the effect for UI
}

export interface SellableItem {
  id: string;
  name: string;
  sellPrice: number;
  icon: LucideIcon | React.FC<React.SVGProps<SVGSVGElement>>;
  description?: string;
  type: 'crop' | 'animal_product' | 'crafted_item' | 'resource';
  imageUrl?: string;
  dataAiHint?: string;
  minLevel?: number;
}

export interface Crop extends SellableItem {
  type: 'crop';
  seedCost: number;
  growthTime: number; // in milliseconds
  harvestYield: number;
  minLevel: number;
  productId?: string;
}

export interface AnimalProduct extends SellableItem {
  type: 'animal_product';
}

export interface CraftableItem extends SellableItem {
  type: 'crafted_item';
  effect?: ItemEffect; // Consumable effect
}

export interface AnimalType {
  id: string;
  name: string;
  cost: number;
  productId: string; // Primary product (e.g., egg, milk, wool, truffle)
  productionTime: number;
  productYield: number;
  meatProductId: string; // ID of the meat product obtained when butchered
  butcherYield: number;  // Amount of meat obtained
  icon: LucideIcon | React.FC<React.SVGProps<SVGSVGElement>>;
  minLevel: number;
  imageUrl?: string;
  dataAiHint?: string;
}

export interface Field {
  id: string;
  cropId: string | null;
  plantTime: number | null;
  harvestReadyTime: number | null;
  upgradeLevel: number;
  currentUpgradeCost?: number;
}

export interface AnimalPen {
  id: string;
  animalTypeId: string | null;
  animalPlacedTime: number | null;
  productReadyTime: number | null;
  upgradeLevel: number;
  currentUpgradeCost?: number;
}

export type MissionType =
  | 'HARVEST_CROP'
  | 'EARN_CURRENCY'
  | 'PLANT_CROP'
  | 'HAVE_CURRENCY'
  | 'UPGRADE_FIELDS'
  | 'BUY_ANIMAL'
  | 'COLLECT_ANIMAL_PRODUCT'
  | 'CRAFT_ITEM';

export interface Mission {
  id: string;
  description: string;
  type: MissionType;
  targetId?: string;
  targetAmount: number;
  currentAmount: number;
  reward: number;
  isCompleted: boolean;
}

export type Inventory = {
  [itemId: string]: number;
};

export type AchievementType =
  | 'HARVEST_CROP_TOTAL'
  | 'HARVEST_SPECIFIC_CROP'
  | 'COLLECT_PRODUCT_TOTAL'
  | 'COLLECT_SPECIFIC_PRODUCT'
  | 'EARN_CURRENCY_TOTAL'
  | 'REACH_LEVEL_X'
  | 'COMPLETE_MISSIONS_TOTAL'
  | 'OWN_FIELDS_TOTAL'
  | 'OWN_PENS_TOTAL'
  | 'UPGRADE_BUILDINGS_TOTAL'
  | 'CRAFT_ITEM_TOTAL'
  | 'BUY_SPECIFIC_ANIMAL';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  type: AchievementType;
  targetId?: string;
  targetAmount: number;
  rewardCurrency: number;
  rewardXp: number;
  icon: LucideIcon | React.FC<React.SVGProps<SVGSVGElement>>;
}

export interface AchievementProgress {
  achievementId: string;
  currentAmount: number;
  isCompleted: boolean;
  isClaimed: boolean;
}

export interface RecipeIngredient {
  itemId: string;
  quantity: number;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: RecipeIngredient[];
  producesItemId: string;
  producesQuantity: number;
  icon: LucideIcon | React.FC<React.SVGProps<SVGSVGElement>>;
  minLevelRequired?: number;
  imageUrl?: string;
  dataAiHint?: string;
}

// ✨ GAME STATE — "O cérebro do jogo"
// Este é o objeto que guarda TODO o progresso do jogador
// (moedas, nível, campos, animais, inventário, missões...).
// O componente HomePage (em `src/app/page.tsx`) cria um destes e
// vai "reescrevendo-o" a cada ação. Não existem outros "estados
// secretos" — tudo o que importa está aqui.
export interface GameState {
  playerName: string;
  currency: number;
  fields: Field[];
  animalPens: AnimalPen[];
  inventory: Inventory;
  missions: Mission[];
  achievements: AchievementProgress[];
  nextFieldCost: number;
  nextAnimalPenCost: number;
  level: number;
  xp: number;
  xpToNextLevel: number;
  lastWaterCollectionTime: number | null;
  fishingGrid: (string | 'CLICKED_EMPTY' | null)[][] | null;
  contracts: Contract[];
  nextContractAt: number;
  stats: GameStats;
}

// Uma linha de um contrato: `quantity` unidades de `itemId`.
export interface ContractRequirement {
  itemId: string;
  quantity: number;
}

// Encomenda de um cliente: entregar os itens até `expiresAt`
// para receber `rewardCoins` + `rewardXp`. Se `pinned`, não expira.
export interface Contract {
  id: string;
  requirements: ContractRequirement[];
  rewardCoins: number;
  rewardXp: number;
  createdAt: number;
  expiresAt: number;
  pinned: boolean;
}

// Contadores acumulados para as Estatísticas (só somam, nunca descem).
export interface GameStats {
  earned: number;
  harvested: number;
  collected: number;
  crafted: number;
  fished: number;
  contractsDone: number;
  playMs: number;
}
    

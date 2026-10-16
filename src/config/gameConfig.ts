import type { Crop, AnimalType, AnimalProduct, SellableItem, MissionType, Achievement, Recipe, CraftableItem } from '@/types/game';
import { Award, Wheat, Carrot, Nut, Coins, Sprout, TrendingUp, Tractor, ChevronsUp, Apple, Leaf, Bird, Egg, Milk, Shirt, ShoppingCart, Archive as ArchiveIcon, LucideIcon, Box, Zap, Cherry, Drumstick, Grape, Vegan, Orbit, Sun, Package, Bug, Container, Rabbit, Gem, Target, ShieldQuestion, BarChart, CookingPot, Sandwich, Droplets, Utensils, Fish as FishIconSymbol, Worm, Citrus, CakeSlice, GlassWater } from 'lucide-react';
import CowIcon from '@/components/icons/CowIcon';
import SheepIcon from '@/components/icons/SheepIcon';
import PumpkinIcon from '@/components/icons/PumpkinIcon';
import PigIcon from '@/components/icons/PigIcon';

// ============================================================================
// 💡 O QUE É ESTE FICHEIRO?
//
// É o "EQUILÍBRIO" do jogo: toda a economia e configuração.
// Aqui define-se: preços, tempos de crescimento, XP por ação,
// quais culturas/animais/peixes/receitas existem, missões e conquistas.
//
// 🔧 ALTERAR AQUI para:
//   - Mudar o preço de venda de um item            →  campo `sellPrice`
//   - Mudar o tempo de crescimento de uma cultura   →  campo `growthTime`
//   - Mudar quanto XP uma ação dá                   →  constantes `XP_FOR_*`
//   - Mudar o custo de comprar um campo/curral      →  `BASE_*_COST`
//   - Adicionar/remover culturas, animais, receitas →  listas em baixo
//
// ⚠️ CUIDADO: os `id` dos itens têm de ser únicos e bater certo com os
// textos do ficheiro `src/messages/pt.json` (chaves `Items.<id>.*`).
// ============================================================================

export const INITIAL_CURRENCY = 100;
export const INITIAL_FIELDS_COUNT = 2;
export const INITIAL_ANIMAL_PENS_COUNT = 1;
export const MAX_ACTIVE_MISSIONS = 6;

export const BASE_FIELD_COST = 50;
export const FIELD_COST_MULTIPLIER = 1.5;

export const BASE_ANIMAL_PEN_COST = 75;
export const ANIMAL_PEN_COST_MULTIPLIER = 1.6;

// XP and Leveling
// 🔧 ALTERAR AQUI: quanto XP cada ação dá. Se quiser que o jogo
// seja MAIS rápido a subir de nível, aumente estes valores.
export const XP_FOR_PLANT_ACTION = 1;
export const XP_FOR_HARVEST_ACTION = 2;
export const XP_FOR_MISSION_COMPLETION_BASE = 15;
export const XP_FOR_FIELD_PURCHASE = 25;
export const XP_FOR_ANIMAL_PEN_PURCHASE = 35;
export const XP_FOR_BUYING_ANIMAL = 10;
export const XP_FOR_COLLECTING_PRODUCT = 3;
export const XP_FOR_FIELD_UPGRADE = 15;
export const XP_FOR_ANIMAL_PEN_UPGRADE = 20;
export const XP_FOR_CRAFTING_ITEM = 10;
export const XP_FOR_USING_CONSUMABLE = 5;
export const XP_FOR_BUTCHERING_ANIMAL = 8;
export const XP_FOR_FISHING_ACTION = 4;

export const BASE_XP_TO_NEXT_LEVEL = 100;
export const LEVEL_XP_GROWTH_FACTOR = 1.2;

export const calculateXpToNextLevel = (level: number): number => {
  if (level <= 0) return BASE_XP_TO_NEXT_LEVEL;
  return Math.floor(BASE_XP_TO_NEXT_LEVEL * Math.pow(LEVEL_XP_GROWTH_FACTOR, level - 1));
};

// Upgrades
// Upgrades — efeitos COMPOSTOS por nível para serem decisivos:
//   colheita/produto: base + max(1, base × 25% × nível)
//   tempo: base × 0.85^nível (mín. 1s)
// Nv 1 ≈ +40-60% débito; Nv 5 ≈ ×4-5 débito. Ver `src/lib/game/upgrades.ts`.
export const MAX_UPGRADE_LEVEL = 5;
export const UPGRADE_YIELD_BONUS_PER_LEVEL = 0.25;

export const FIELD_UPGRADE_TIME_FACTOR_PER_LEVEL = 0.85;
export const BASE_FIELD_UPGRADE_COST = 75;
export const FIELD_UPGRADE_COST_MULTIPLIER = 2;

export const ANIMAL_PEN_UPGRADE_TIME_FACTOR_PER_LEVEL = 0.85;
export const BASE_ANIMAL_PEN_UPGRADE_COST = 100;
export const ANIMAL_PEN_UPGRADE_COST_MULTIPLIER = 2;


export const calculateNextUpgradeCost = (baseCost: number, multiplier: number, currentUpgradeLevel: number): number => {
  return Math.floor(baseCost * Math.pow(multiplier, currentUpgradeLevel));
};

// CULTURAS (plantações) — valores explícitos e equilibrados.
// REGRA DE EQUILÍBRIO (verificada em `src/lib/game/economy.test.ts`):
//   1. TODA cultura dá lucro na venda direta (receita - semente > 0).
//   2. O lucro/minuto cresce ESTRITAMENTE com o nível de desbloqueio:
//      cada cultura nova supera todas as anteriores (12 → 550/min).
//   3. A semente custa ~45-55% da receita de uma colheita.
// 🔧 ALTERAR AQUI para adicionar uma cultura: copie uma linha, escolha
// `sellPrice`/`growthTime`/`harvestYield` que mantenham a escada e
// adicione os textos em `src/messages/*.json` (`Items.<id>.*`).
const rawCrops: Crop[] = [
  { id: 'lettuce', name: "Alface", description: "Folha verde para saladas.", sellPrice: 2, growthTime: 15000, harvestYield: 3, seedCost: 3, minLevel: 1, icon: Leaf, type: 'crop', imageUrl: '/images/alface.png', dataAiHint: 'lettuce vegetable' },
  { id: 'wheat', name: "Trigo", description: "Grão básico para farinha e pão.", sellPrice: 3, growthTime: 15000, harvestYield: 5, seedCost: 8, minLevel: 2, icon: Wheat, type: 'crop', imageUrl: '/images/trigo.png', dataAiHint: 'wheat crop' },
  { id: 'strawberry', name: "Morango", description: "Fruta vermelha doce e suculenta.", sellPrice: 5, growthTime: 20000, harvestYield: 5, seedCost: 14, minLevel: 4, icon: Cherry, type: 'crop', imageUrl: '/images/morango.png', dataAiHint: 'strawberry fruit' },
  { id: 'carrot', name: "Cenoura", description: "Raiz laranja, doce e crocante.", sellPrice: 6, growthTime: 30000, harvestYield: 6, seedCost: 19, minLevel: 5, icon: Carrot, type: 'crop', imageUrl: '/images/cenoura.png', dataAiHint: 'carrot vegetable' },
  { id: 'tomato', name: "Tomate", description: "Fruto vermelho, usado em saladas e molhos.", sellPrice: 16, growthTime: 60000, harvestYield: 4, seedCost: 29, minLevel: 7, icon: Apple, type: 'crop', imageUrl: '/images/tomate.png', dataAiHint: 'tomato fruit' },
  { id: 'onion', name: "Cebola", description: "Bulbo com sabor forte, essencial na culinária.", sellPrice: 8, growthTime: 30000, harvestYield: 5, seedCost: 20, minLevel: 8, icon: Vegan, type: 'crop', imageUrl: '/images/cebola.png', dataAiHint: 'onion vegetable' },
  { id: 'cucumber', name: "Pepino", description: "Vegetal refrescante, ótimo para saladas.", sellPrice: 12, growthTime: 45000, harvestYield: 5, seedCost: 29, minLevel: 10, icon: Leaf, type: 'crop', imageUrl: '/images/pepino.png', dataAiHint: 'cucumber vegetable' },
  { id: 'potato', name: "Batata", description: "Tubérculo versátil, base de muitos pratos.", sellPrice: 14, growthTime: 60000, harvestYield: 6, seedCost: 40, minLevel: 11, icon: Nut, type: 'crop', imageUrl: '/images/batata.png', dataAiHint: 'potato vegetable' },
  { id: 'cabbage', name: "Couve", description: "Vegetal de folhas verdes, ótimo para sopas.", sellPrice: 16, growthTime: 60000, harvestYield: 6, seedCost: 46, minLevel: 13, icon: Vegan, type: 'crop', imageUrl: '/images/couve.png', dataAiHint: 'cabbage vegetable' },
  { id: 'pea', name: "Ervilha", description: "Pequenos grãos verdes em vagem.", sellPrice: 9, growthTime: 60000, harvestYield: 8, seedCost: 21, minLevel: 14, icon: Vegan, type: 'crop', imageUrl: '/images/ervilha.png', dataAiHint: 'pea vegetable' },
  { id: 'sugarcane', name: "Cana-de-Açúcar", description: "Planta alta usada para produzir açúcar.", sellPrice: 0, growthTime: 60000, harvestYield: 6, seedCost: 44, minLevel: 16, icon: Leaf, type: 'crop', productId: 'sugar', imageUrl: '/images/cana-de-acucar.png', dataAiHint: 'sugarcane plant' },
  { id: 'olive', name: "Azeitona", description: "Fruto da oliveira, para consumo ou azeite.", sellPrice: 55, growthTime: 180000, harvestYield: 6, seedCost: 150, minLevel: 17, icon: Nut, type: 'crop', imageUrl: '/images/azeitona.png', dataAiHint: 'olive fruit' },
  { id: 'apple', name: "Maçã", description: "Fruta crocante e popular, vem em várias cores.", sellPrice: 28, growthTime: 60000, harvestYield: 5, seedCost: 64, minLevel: 19, icon: Apple, type: 'crop', imageUrl: '/images/maca.png', dataAiHint: 'apple fruit' },
  { id: 'rice', name: "Arroz", description: "Grão básico na alimentação mundial.", sellPrice: 22, growthTime: 75000, harvestYield: 9, seedCost: 89, minLevel: 20, icon: Wheat, type: 'crop', imageUrl: '/images/arroz.png', dataAiHint: 'rice grain' },
  { id: 'basil', name: "Manjericão", description: "Erva aromática, perfeita para pratos italianos.", sellPrice: 12, growthTime: 60000, harvestYield: 14, seedCost: 76, minLevel: 22, icon: Sprout, type: 'crop', imageUrl: '/images/manjericao.png', dataAiHint: 'basil herb' },
  { id: 'mushroom', name: "Cogumelo", description: "Fungo comestível, vários tipos disponíveis.", sellPrice: 34, growthTime: 60000, harvestYield: 6, seedCost: 92, minLevel: 23, icon: Vegan, type: 'crop', imageUrl: '/images/cogumelo.png', dataAiHint: 'mushroom fungi' },
  { id: 'bellpepper', name: "Pimento", description: "Vegetal colorido, pode ser doce ou picante.", sellPrice: 45, growthTime: 90000, harvestYield: 7, seedCost: 142, minLevel: 25, icon: Vegan, type: 'crop', imageUrl: '/images/pimento.png', dataAiHint: 'bellpepper vegetable' },
  { id: 'bean', name: "Feijão", description: "Leguminosa nutritiva, base de muitos pratos.", sellPrice: 28, growthTime: 90000, harvestYield: 12, seedCost: 151, minLevel: 26, icon: Vegan, type: 'crop', imageUrl: '/images/feijao.png', dataAiHint: 'bean legume' },
  { id: 'sunflower', name: "Girassol", description: "Planta com flor grande amarela, produz sementes.", sellPrice: 0, growthTime: 45000, harvestYield: 8, seedCost: 71, minLevel: 28, icon: Sun, type: 'crop', productId: 'sunflower_seeds', imageUrl: '/images/girassol.png', dataAiHint: 'sunflower plant' },
  { id: 'grape_crop', name: "Uva", description: "Pequenas frutas que crescem em cachos, usadas para vinho ou consumo direto.", sellPrice: 46, growthTime: 60000, harvestYield: 6, seedCost: 124, minLevel: 29, icon: Grape, type: 'crop', imageUrl: '/images/uva.png', dataAiHint: 'grape fruit' },
  { id: 'blueberry', name: "Mirtilo", description: "Pequena fruta azul, rica em antioxidantes.", sellPrice: 34, growthTime: 60000, harvestYield: 9, seedCost: 138, minLevel: 31, icon: Grape, type: 'crop', imageUrl: '/images/mirtilo.png', dataAiHint: 'blueberry fruit' },
  { id: 'orange', name: "Laranja", description: "Fruta cítrica, rica em vitamina C.", sellPrice: 62, growthTime: 60000, harvestYield: 5, seedCost: 139, minLevel: 32, icon: Citrus, type: 'crop', imageUrl: '/images/laranja.png', dataAiHint: 'orange fruit' },
  { id: 'pear', name: "Pera", description: "Fruta doce com formato característico.", sellPrice: 80, growthTime: 60000, harvestYield: 4, seedCost: 144, minLevel: 34, icon: Apple, type: 'crop', imageUrl: '/images/pera.png', dataAiHint: 'pear fruit' },
  { id: 'lemon', name: "Limão", description: "Fruta cítrica azeda, ótima para temperos e bebidas.", sellPrice: 70, growthTime: 60000, harvestYield: 5, seedCost: 157, minLevel: 35, icon: Citrus, type: 'crop', imageUrl: '/images/limao.png', dataAiHint: 'lemon fruit' },
  { id: 'banana', name: "Banana", description: "Fruta amarela e curva, rica em potássio.", sellPrice: 66, growthTime: 60000, harvestYield: 6, seedCost: 178, minLevel: 37, icon: Apple, type: 'crop', imageUrl: '/images/banana.png', dataAiHint: 'banana fruit' },
  { id: 'pumpkin', name: "Abóbora", description: "Fruta grande, popular no outono.", sellPrice: 110, growthTime: 60000, harvestYield: 4, seedCost: 198, minLevel: 38, icon: PumpkinIcon, type: 'crop', imageUrl: '/images/abobora.png', dataAiHint: 'pumpkin fruit' },
  { id: 'eggplant', name: "Beringela", description: "Vegetal roxo escuro, com textura esponjosa.", sellPrice: 130, growthTime: 60000, harvestYield: 4, seedCost: 234, minLevel: 40, icon: Vegan, type: 'crop', imageUrl: '/images/beringela.png', dataAiHint: 'eggplant vegetable' },
  { id: 'almond', name: "Amêndoa", description: "Fruto seco, nutritivo e saboroso.", sellPrice: 165, growthTime: 60000, harvestYield: 4, seedCost: 297, minLevel: 41, icon: Nut, type: 'crop', imageUrl: '/images/amendoa.png', dataAiHint: 'almond nut' },
  { id: 'melon', name: "Melão", description: "Fruta grande e doce, com muita água.", sellPrice: 300, growthTime: 60000, harvestYield: 3, seedCost: 405, minLevel: 43, icon: Orbit, type: 'crop', imageUrl: '/images/melao.png', dataAiHint: 'melon fruit' },
  { id: 'watermelon', name: "Melancia", description: "Fruta grande e refrescante, perfeita para o verão.", sellPrice: 580, growthTime: 75000, harvestYield: 2, seedCost: 522, minLevel: 44, icon: Orbit, type: 'crop', imageUrl: '/images/melancia.png', dataAiHint: 'watermelon fruit' },
  { id: 'corn', name: "Milho", description: "Grãos amarelos doces, crescem em espigas.", sellPrice: 250, growthTime: 90000, harvestYield: 6, seedCost: 675, minLevel: 46, icon: Leaf, type: 'crop', imageUrl: '/images/milho.png', dataAiHint: 'corn crop' },
];

export const AVAILABLE_CROPS: Crop[] = [...rawCrops].sort((a,b) => a.minLevel - b.minLevel || a.id.localeCompare(b.id));

export const getAvailableCrops = (): Crop[] => {
  return AVAILABLE_CROPS;
};


export const AVAILABLE_ANIMAL_PRODUCTS: AnimalProduct[] = [
  { id: 'egg', name: 'Ovo de Galinha', description: 'Ovo fresco de galinha.', sellPrice: 8, icon: Egg, type: 'animal_product', imageUrl: '/images/ovo.png', dataAiHint: 'egg icon' },
  { id: 'duck_egg', name: 'Ovo de Pato', description: 'Ovo fresco de pato, um pouco maior que o de galinha.', sellPrice: 10, icon: Egg, type: 'animal_product', imageUrl: '/images/ovo.png', dataAiHint: 'duck egg' },
  { id: 'milk', name: 'Leite de Vaca', description: 'Leite fresco de vaca.', sellPrice: 18, icon: Milk, type: 'animal_product', imageUrl: '/images/leite.png', dataAiHint: 'cow milk' },
  { id: 'goat_milk', name: 'Leite de Cabra', description: 'Leite fresco de cabra, com sabor distinto.', sellPrice: 20, icon: Milk, type: 'animal_product', imageUrl: '/images/leite.png', dataAiHint: 'goat milk' },
  { id: 'wool', name: 'Lã', description: 'Lã macia de ovelha, para vestuário.', sellPrice: 24, icon: Shirt, type: 'animal_product', imageUrl: '/images/la.png', dataAiHint: 'sheep wool' },
  { id: 'honey', name: 'Mel', description: 'Mel doce produzido por abelhas.', sellPrice: 30, icon: Container, type: 'animal_product', imageUrl: '/images/mel.png', dataAiHint: 'bee honey' },
  { id: 'chicken_meat', name: 'Carne de Frango', description: 'Carne de frango fresca.', sellPrice: 10, icon: Drumstick, type: 'animal_product', imageUrl: '/images/carne-grelhada.png', dataAiHint: 'grilled meat' },
  { id: 'duck_meat', name: 'Carne de Pato', description: 'Carne de pato saborosa.', sellPrice: 12, icon: Drumstick, type: 'animal_product', imageUrl: '/images/carne-grelhada.png', dataAiHint: 'grilled meat' },
  { id: 'beef_meat', name: 'Carne de Vaca', description: 'Carne de vaca de primeira.', sellPrice: 30, icon: Drumstick, type: 'animal_product', imageUrl: '/images/carne-grelhada.png', dataAiHint: 'grilled meat' },
  { id: 'pork_meat', name: 'Carne de Porco', description: 'Carne de porco fresca.', sellPrice: 26, icon: Drumstick, type: 'animal_product', imageUrl: '/images/carne-grelhada.png', dataAiHint: 'grilled meat' },
  { id: 'mutton_meat', name: 'Carne de Ovelha', description: 'Carne de ovelha tenra.', sellPrice: 20, icon: Drumstick, type: 'animal_product', imageUrl: '/images/carne-grelhada.png', dataAiHint: 'grilled meat' },
  { id: 'goat_meat_product', name: 'Carne de Cabra', description: 'Carne de cabra, com sabor característico.', sellPrice: 22, icon: Drumstick, type: 'animal_product', imageUrl: '/images/carne-grelhada.png', dataAiHint: 'grilled meat' },
  { id: 'rabbit_meat', name: 'Carne de Coelho', description: 'Carne de coelho magra.', sellPrice: 22, icon: Drumstick, type: 'animal_product', imageUrl: '/images/carne-grelhada.png', dataAiHint: 'grilled meat' },
  { id: 'turkey_meat', name: 'Carne de Peru', description: 'Carne de peru macia.', sellPrice: 24, icon: Drumstick, type: 'animal_product', imageUrl: '/images/carne-grelhada.png', dataAiHint: 'grilled meat' },
];

// Subprodutos obtidos de culturas (não são produtos animais).
// ⚠️ CUIDADO: estas `resource items` NÃO aparecem em `AVAILABLE_ANIMAL_PRODUCTS` —
// foi essa separação que corrigiu os erros de tipo do projeto. Mantenham-nos aqui.
export const AVAILABLE_RESOURCE_ITEMS: SellableItem[] = [
  { id: 'sunflower_seeds', name: 'Sementes de Girassol', description: 'Sementes nutritivas de girassol.', sellPrice: 21, icon: Package, type: 'resource', imageUrl: '/images/girassol.png', dataAiHint: 'sunflower seeds' },
  { id: 'sugar', name: 'Açúcar', description: 'Açúcar refinado, para adoçar.', sellPrice: 16, icon: Package, type: 'resource', imageUrl: '/images/acucar.png', dataAiHint: 'sugar ingredient' },
];

export const getAvailableAnimalProducts = (): AnimalProduct[] => {
  return AVAILABLE_ANIMAL_PRODUCTS;
};

// ANIMAIS — valores explícitos e equilibrados.
// REGRA DE EQUILÍBRIO (verificada em `src/lib/game/economy.test.ts`):
//   1. O rendimento passivo/min de cada animal é ~55-65% da melhor cultura
//      do mesmo nível (passivo paga menos que o cultivo ativo).
//   2. O custo do animal paga-se em ~4-17 min da sua própria produção.
//   3. O abate vale no MÁXIMO 80% do custo (é salvado, não lucro).
//      Coelho/peru/porco (só carne) ganham propósito nas receitas.
const rawAnimals: AnimalType[] = [
  { id: 'chicken', name: "Galinha", cost: 60, minLevel: 2, productId: 'egg', productionTime: 30000, productYield: 1, meatProductId: 'chicken_meat', butcherYield: 2, icon: Bird, imageUrl: '/images/galinha.png', dataAiHint: 'chicken animal' },
  { id: 'duck', name: "Pato", cost: 110, minLevel: 4, productId: 'duck_egg', productionTime: 35000, productYield: 1, meatProductId: 'duck_meat', butcherYield: 2, icon: Bird, imageUrl: '/images/pato.png', dataAiHint: 'duck animal' },
  { id: 'rabbit', name: "Coelho", cost: 120, minLevel: 6, productId: '', productionTime: 0, productYield: 0, meatProductId: 'rabbit_meat', butcherYield: 2, icon: Rabbit, imageUrl: '/images/coelho.png', dataAiHint: 'rabbit animal' },
  { id: 'sheep', name: "Ovelha", cost: 170, minLevel: 8, productId: 'wool', productionTime: 60000, productYield: 1, meatProductId: 'mutton_meat', butcherYield: 2, icon: SheepIcon, imageUrl: '/images/ovelha.png', dataAiHint: 'sheep animal' },
  { id: 'turkey', name: "Peru", cost: 260, minLevel: 10, productId: '', productionTime: 0, productYield: 0, meatProductId: 'turkey_meat', butcherYield: 3, icon: Bird, imageUrl: '/images/peru.png', dataAiHint: 'turkey animal' },
  { id: 'pig', name: "Porco", cost: 300, minLevel: 12, productId: '', productionTime: 0, productYield: 0, meatProductId: 'pork_meat', butcherYield: 3, icon: PigIcon, imageUrl: '/images/porco.png', dataAiHint: 'pig animal' },
  { id: 'goat', name: "Cabra", cost: 380, minLevel: 14, productId: 'goat_milk', productionTime: 40000, productYield: 1, meatProductId: 'goat_meat_product', butcherYield: 2, icon: Rabbit, imageUrl: '/images/cabra.png', dataAiHint: 'goat animal' },
  { id: 'bee', name: "Abelha", cost: 450, minLevel: 16, productId: 'honey', productionTime: 60000, productYield: 1, meatProductId: '', butcherYield: 0, icon: Bug, imageUrl: '/images/abelha.png', dataAiHint: 'bee animal' },
  { id: 'cow', name: "Vaca", cost: 600, minLevel: 18, productId: 'milk', productionTime: 60000, productYield: 2, meatProductId: 'beef_meat', butcherYield: 3, icon: CowIcon, imageUrl: '/images/vaca.png', dataAiHint: 'cow animal' },
];

export const AVAILABLE_ANIMALS: AnimalType[] = [...rawAnimals].sort((a,b) => a.minLevel - b.minLevel || a.id.localeCompare(b.id));

export const getAvailableAnimals = (): AnimalType[] => {
  return AVAILABLE_ANIMALS;
};

export const AVAILABLE_CRAFTABLE_ITEMS: CraftableItem[] = [
  { id: 'flour', name: 'Farinha de Trigo', description: 'Farinha de trigo moído, base para muitas receitas.', sellPrice: 20, icon: Package, type: 'crafted_item', imageUrl: '/images/farinha.png', dataAiHint: 'flour ingredient' },
  { id: 'omelette', name: 'Omelete', description: 'Uma omelete simples feita com ovos frescos da quinta.', sellPrice: 30, icon: Utensils, type: 'crafted_item', imageUrl: '/images/omelete.png', dataAiHint: 'omelette food' },
  { id: 'watering_can', name: 'Regador', description: 'Um regador que acelera o crescimento de uma cultura em 25%.', sellPrice: 0, icon: GlassWater, type: 'crafted_item', imageUrl: '/images/regador.png', dataAiHint: 'watering can', effect: { type: 'SPEED_UP_CROP', valueType: 'percentage', value: 25, target: 'field', description: 'Acelera o crescimento da cultura em 25%.' } },
  { id: 'dough', name: 'Massa Fresca', description: 'Massa fresca feita com farinha e água, pronta para cozinhar.', sellPrice: 45, icon: Vegan, type: 'crafted_item', imageUrl: '/images/massa.png', dataAiHint: 'dough ingredient' },
  { id: 'bread', name: 'Pão', description: 'Um pão rústico feito com farinha da quinta.', sellPrice: 50, icon: Sandwich, type: 'crafted_item', imageUrl: '/images/pao.png', dataAiHint: 'bread icon' },
  { id: 'vegetable_soup', name: 'Sopa de Legumes', description: 'Uma sopa quente e reconfortante.', sellPrice: 58, icon: CookingPot, type: 'crafted_item', imageUrl: '/images/sopa-de-legumes.png', dataAiHint: 'vegetable soup recipe' },
  { id: 'orange_juice', name: 'Sumo de Laranja', description: 'Sumo de laranja fresco e natural.', sellPrice: 155, icon: GlassWater, type: 'crafted_item', imageUrl: '/images/sumo-de-laranja.png', dataAiHint: 'orange juice' },
  { id: 'strawberry_compote', name: 'Compota de Morango', description: 'Doce compota caseira de morangos frescos.', sellPrice: 72, icon: Container, type: 'crafted_item', imageUrl: '/images/compota-de-morango.png', dataAiHint: 'strawberry compote' },
  { id: 'carrot_cake', name: 'Bolo de Cenoura', description: 'Um bolo de cenoura fofo.', sellPrice: 80, icon: CakeSlice, type: 'crafted_item', imageUrl: '/images/bolo-de-cenoura.png', dataAiHint: 'carrot cake' },
  { id: 'blueberry_juice', name: 'Sumo de Mirtilo', description: 'Um sumo antioxidante e delicioso.', sellPrice: 215, icon: Droplets, type: 'crafted_item', imageUrl: '/images/sumo-de-mirtilo.png', dataAiHint: 'blueberry juice' },
  { id: 'blueberry_compote', name: 'Compota de Mirtilo', description: 'Uma compota doce e rica em mirtilos.', sellPrice: 255, icon: Container, type: 'crafted_item', imageUrl: '/images/compota-de-mirtilo.png', dataAiHint: 'blueberry compote' },
  { id: 'mixed_salad', name: 'Salada', description: 'Uma salada colorida e nutritiva com vegetais frescos.', sellPrice: 385, icon: Leaf, type: 'crafted_item', imageUrl: '/images/salada.png', dataAiHint: 'salad icon' },
  { id: 'apple_pie', name: 'Tarte de Maçã', description: 'Uma tarte de maçã caseira e deliciosa.', sellPrice: 150, icon: CakeSlice, type: 'crafted_item', imageUrl: '/images/tarte-de-maca.png', dataAiHint: 'apple pie' },
  { id: 'cod_with_potatoes', name: 'Bacalhau Assado com Batatas', description: 'Bacalhau assado suculento com batatas.', sellPrice: 565, icon: FishIconSymbol, type: 'crafted_item', imageUrl: '/images/bacalhau-assado-com-batatas.png', dataAiHint: 'cod with potatoes' },
  { id: 'grilled_sardine_meal', name: 'Sardinha Grelhada', description: 'Sardinha grelhada servida com batatas e salada.', sellPrice: 530, icon: FishIconSymbol, type: 'crafted_item', imageUrl: '/images/sardinha-grelhada.png', dataAiHint: 'grilled sardine' },
  { id: 'duck_rice', name: 'Arroz de Pato', description: 'Um clássico prato português, saboroso e reconfortante.', sellPrice: 565, icon: CookingPot, type: 'crafted_item', imageUrl: '/images/arroz-de-pato.png', dataAiHint: 'duck rice' },
  { id: 'bean_stew', name: 'Feijoada', description: 'Uma feijoada rica e saborosa.', sellPrice: 275, icon: CookingPot, type: 'crafted_item', imageUrl: '/images/feijoada.png', dataAiHint: 'bean stew' },
  { id: 'cheese', name: 'Queijo', description: 'Queijo fresco feito com leite da quinta.', sellPrice: 68, icon: Gem, type: 'crafted_item', imageUrl: '/images/queijo.png', dataAiHint: 'cheese dairy' },
  { id: 'pancake', name: 'Panqueca', description: 'Panquecas fofas, perfeitas para o pequeno-almoço.', sellPrice: 78, icon: Utensils, type: 'crafted_item', imageUrl: '/images/panqueca.png', dataAiHint: 'pancake food' },
  { id: 'goat_cheese_honey_toast', name: 'Tosta com Queijo de Cabra e Mel', description: 'Uma tosta crocante com queijo de cabra cremoso e um fio de mel doce.', sellPrice: 185, icon: Sandwich, type: 'crafted_item', imageUrl: '/images/tosta.png', dataAiHint: 'toast food' },
  { id: 'churrasco', name: 'Churrasco', description: 'Uma seleção generosa de carnes grelhadas, batatas e salada.', sellPrice: 635, icon: Drumstick, type: 'crafted_item', imageUrl: '/images/churrasco.png', dataAiHint: 'churrasco barbecue' },
  { id: 'almond_cake', name: 'Bolo de Amêndoa', description: 'Bolo fofo e saboroso com amêndoas.', sellPrice: 480, icon: CakeSlice, type: 'crafted_item', imageUrl: '/images/bolo-de-amendoa.png', dataAiHint: 'almond cake' },
  { id: 'pizza_margarita', name: 'Pizza Margarita', description: 'Pizza clássica com tomate, queijo e manjericão.', sellPrice: 610, icon: Utensils, type: 'crafted_item', imageUrl: '/images/pizza-margarita.png', dataAiHint: 'pizza margarita' },
  { id: 'pumpkin_pie', name: 'Torta de Abóbora', description: 'Torta clássica de abóbora com especiarias.', sellPrice: 195, icon: CakeSlice, type: 'crafted_item', imageUrl: '/images/torta-de-abobora.png', dataAiHint: 'pumpkin pie' },
  { id: 'melon_juice', name: 'Sumo de Melão', description: 'Sumo refrescante de melão.', sellPrice: 395, icon: Droplets, type: 'crafted_item', imageUrl: '/images/sumo-de-melao.png', dataAiHint: 'melon juice' },
  { id: 'stuffed_eggplant', name: 'Beringela Recheada', description: 'Beringela recheada com carne e vegetais.', sellPrice: 225, icon: CookingPot, type: 'crafted_item', imageUrl: '/images/beringela-recheada.png', dataAiHint: 'stuffed eggplant' },
  { id: 'watermelon_juice', name: 'Sumo de Melancia', description: 'Sumo doce e hidratante de melancia.', sellPrice: 745, icon: Droplets, type: 'crafted_item', imageUrl: '/images/sumo-de-melancia.png', dataAiHint: 'watermelon juice' },
  { id: 'fruit_salad', name: 'Salada de Fruta', description: 'Uma salada de frutas refrescante e saudável.', sellPrice: 1455, icon: Utensils, type: 'crafted_item', imageUrl: '/images/salada-de-fruta.png', dataAiHint: 'fruit salad' },
  { id: 'pasta_tomato_basil', name: 'Massa com Tomate e Manjericão', description: 'Um prato clássico italiano com ingredientes frescos da quinta.', sellPrice: 450, icon: Utensils, type: 'crafted_item', imageUrl: '/images/massa-com-tomate-e-manjericao.png', dataAiHint: 'pasta tomato basil recipe' },
  { id: 'olive_oil', name: 'Azeite', description: 'Azeite extra virgem, prensado de azeitonas frescas.', sellPrice: 275, icon: Droplets, type: 'crafted_item', imageUrl: '/images/azeite.png', dataAiHint: 'olive oil' },
  { id: 'rabbit_stew', name: 'Ensopado de Coelho', description: 'Um ensopado rico e reconfortante com carne de coelho.', sellPrice: 190, icon: CookingPot, type: 'crafted_item', imageUrl: '/images/feijoada.png', dataAiHint: 'rabbit stew' },
  { id: 'turkey_roast', name: 'Peru Assado', description: 'Peru assado suculento com batatas, um banquete festivo.', sellPrice: 360, icon: Drumstick, type: 'crafted_item', imageUrl: '/images/churrasco.png', dataAiHint: 'roast turkey' },
];

export const WATER_ITEM: SellableItem = {
  id: 'water',
  name: 'Água',
  sellPrice: 0,
  icon: Droplets,
  description: 'Água fresca e pura, essencial para algumas receitas.',
  type: 'resource',
  imageUrl: '/images/agua.png',
  dataAiHint: 'water resource'
};

export const FISHING_GRID_ROWS = 3;
export const FISHING_GRID_COLS = 8;
export const BAIT_ID = 'fishing_bait';
export const BAIT_COST_PER_PACK = 30;
export const BAIT_PACK_SIZE = 12;
// 24 células × 25% ≈ 6 peixes/grelha — o mesmo que 15 × 40% (economia intacta).
export const CELL_HAS_FISH_PROBABILITY = 0.25;

export const FISHING_BAIT: SellableItem = {
  id: BAIT_ID,
  name: 'Isca de Pesca',
  sellPrice: 0,
  icon: Worm,
  description: 'Usada para atrair peixes na zona de pesca.',
  type: 'resource',
  imageUrl: '/images/isca.png',
  dataAiHint: 'fishing bait'
};

// PEIXES da pesca e respetivas probabilidades de cada tipo.
// 🔧 ALTERAR AQUI: `sellPrice` para o valor, e `weight` em
// `FISH_TYPE_PROBABILITIES` para a raridade (quanto maior o peso,
// mais provável é apanhar esse peixe).
export const AVAILABLE_FISH: SellableItem[] = [
  { id: 'sardine', name: 'Sardinha', sellPrice: 8, icon: FishIconSymbol, type: 'resource', imageUrl: '/images/peixe.png', description: 'Peixe pequeno e comum.', dataAiHint: 'fish food' },
  { id: 'seabass', name: 'Robalo', sellPrice: 15, icon: FishIconSymbol, type: 'resource', imageUrl: '/images/peixe.png', description: 'Peixe saboroso, um pouco mais difícil de apanhar.', dataAiHint: 'fish food' },
  { id: 'cod', name: 'Bacalhau', sellPrice: 25, icon: FishIconSymbol, type: 'resource', imageUrl: '/images/peixe.png', description: 'Peixe valioso, encontrado em águas mais profundas.', dataAiHint: 'fish food' },
  { id: 'salmon', name: 'Salmão', sellPrice: 40, icon: FishIconSymbol, type: 'resource', imageUrl: '/images/peixe.png', description: 'Peixe rosado e delicioso, bom para grelhar.', dataAiHint: 'salmon fish' },
  { id: 'tuna', name: 'Atum', sellPrice: 55, icon: FishIconSymbol, type: 'resource', imageUrl: '/images/peixe.png', description: 'Peixe grande e carnudo, excelente para bifes.', dataAiHint: 'fish food' },
];

export const getAvailableFish = (): SellableItem[] => {
  return AVAILABLE_FISH;
};

export const FISH_TYPE_PROBABILITIES: { fishId: string, weight: number }[] = [
  { fishId: 'sardine', weight: 40 },
  { fishId: 'seabass', weight: 25 },
  { fishId: 'cod', weight: 15 },
  { fishId: 'salmon', weight: 12 },
  { fishId: 'tuna', weight: 8 },
];


const rawRecipes: Omit<Recipe, 'minLevelRequired' >[] = [
  { id: 'recipe_watering_can', name: "Regador", description: "Cria um regador.", ingredients: [{ itemId: 'water', quantity: 10 }], producesItemId: 'watering_can', producesQuantity: 1, icon: GlassWater, imageUrl: '/images/regador.png', dataAiHint: 'watering can recipe' },
  { id: 'recipe_flour', name: "Farinha", description: "Transforme trigo em farinha.", ingredients: [{ itemId: 'wheat', quantity: 5 }], producesItemId: 'flour', producesQuantity: 1, icon: Wheat, imageUrl: '/images/farinha.png', dataAiHint: 'flour recipe' },
  { id: 'recipe_omelette', name: "Omelete", description: "Uma omelete simples feita com ovos frescos da quinta.", ingredients: [{ itemId: 'egg', quantity: 3 }], producesItemId: 'omelette', producesQuantity: 1, icon: Utensils, imageUrl: '/images/omelete.png', dataAiHint: 'omelette recipe' },
  { id: 'recipe_dough', name: "Massa Fresca", description: "Prepare massa fresca com farinha e água.", ingredients: [{ itemId: 'flour', quantity: 1 }, { itemId: 'water', quantity: 2 }, { itemId: 'egg', quantity: 1 }], producesItemId: 'dough', producesQuantity: 1, icon: Vegan, imageUrl: '/images/massa.png', dataAiHint: 'dough recipe' },
  { id: 'recipe_bread', name: "Pão", description: "Cria um delicioso pão com farinha.", ingredients: [{ itemId: 'flour', quantity: 2 }, { itemId: 'water', quantity: 3 }], producesItemId: 'bread', producesQuantity: 1, icon: Sandwich, imageUrl: '/images/pao.png', dataAiHint: 'bread recipe' },
  { id: 'recipe_vegetable_soup', name: "Sopa de Legumes", description: "Uma sopa quente e reconfortante.", ingredients: [{ itemId: 'onion', quantity: 1 }, { itemId: 'carrot', quantity: 1 }, { itemId: 'cabbage', quantity: 2 }, { itemId: 'water', quantity: 2 }], producesItemId: 'vegetable_soup', producesQuantity: 1, icon: CookingPot, imageUrl: '/images/sopa-de-legumes.png', dataAiHint: 'vegetable soup recipe' },
  { id: 'recipe_orange_juice', name: "Sumo de Laranja", description: "Esprema laranjas para um sumo delicioso.", ingredients: [{ itemId: 'orange', quantity: 2 }, { itemId: 'water', quantity: 2 }], producesItemId: 'orange_juice', producesQuantity: 1, icon: GlassWater, imageUrl: '/images/sumo-de-laranja.png', dataAiHint: 'orange juice recipe' },
  { id: 'recipe_strawberry_compote', name: "Compota de Morango", description: "Faça uma compota bem doce.", ingredients: [{ itemId: 'strawberry', quantity: 5 }, { itemId: 'sugar', quantity: 2 }], producesItemId: 'strawberry_compote', producesQuantity: 1, icon: Container, imageUrl: '/images/compota-de-morango.png', dataAiHint: 'strawberry compote recipe' },
  { id: 'recipe_carrot_cake', name: "Bolo de Cenoura", description: "Prepare um bolo de cenoura húmido e saboroso.", ingredients: [{ itemId: 'carrot', quantity: 2 }, { itemId: 'flour', quantity: 1 }, { itemId: 'sugar', quantity: 1 }, { itemId: 'egg', quantity: 2 }], producesItemId: 'carrot_cake', producesQuantity: 1, icon: CakeSlice, imageUrl: '/images/bolo-de-cenoura.png', dataAiHint: 'carrot cake recipe' },
  { id: 'recipe_blueberry_juice', name: "Sumo de Mirtilo", description: "Esprema mirtilos para um sumo refrescante.", ingredients: [{ itemId: 'blueberry', quantity: 5 }, { itemId: 'water', quantity: 3 }], producesItemId: 'blueberry_juice', producesQuantity: 1, icon: Droplets, imageUrl: '/images/sumo-de-mirtilo.png', dataAiHint: 'blueberry juice recipe' },
  { id: 'recipe_blueberry_compote', name: "Compota de Mirtilo", description: "Uma compota doce e rica em mirtilos.", ingredients: [{ itemId: 'blueberry', quantity: 5 }, { itemId: 'sugar', quantity: 2 }], producesItemId: 'blueberry_compote', producesQuantity: 1, icon: Container, imageUrl: '/images/compota-de-mirtilo.png', dataAiHint: 'blueberry compote recipe' },
  { id: 'recipe_mixed_salad', name: "Salada", description: "Uma salada colorida e nutritiva com vegetais frescos.", ingredients: [{ itemId: 'lettuce', quantity: 2 }, { itemId: 'tomato', quantity: 1 }, { itemId: 'cucumber', quantity: 1 }, { itemId: 'olive_oil', quantity: 1 }], producesItemId: 'mixed_salad', producesQuantity: 1, icon: Leaf, imageUrl: '/images/salada.png', dataAiHint: 'salad recipe' },
  { id: 'recipe_apple_pie', name: "Tarte de Maçã", description: "Asse uma tarte de maçã com ingredientes frescos.", ingredients: [{ itemId: 'apple', quantity: 3 }, { itemId: 'flour', quantity: 1 }, { itemId: 'sugar', quantity: 1 }], producesItemId: 'apple_pie', producesQuantity: 1, icon: CakeSlice, imageUrl: '/images/tarte-de-maca.png', dataAiHint: 'apple pie recipe' },
  { id: 'recipe_cod_with_potatoes', name: "Bacalhau Assado com Batatas", description: "Bacalhau assado suculento com batatas.", ingredients: [{ itemId: 'cod', quantity: 1 }, { itemId: 'potato', quantity: 3 }, { itemId: 'mixed_salad', quantity: 1 } ], producesItemId: 'cod_with_potatoes', producesQuantity: 1, icon: FishIconSymbol, imageUrl: '/images/bacalhau-assado-com-batatas.png', dataAiHint: 'cod with potatoes recipe' },
  { id: 'recipe_grilled_sardine_meal', name: "Sardinha Grelhada", description: "Sardinha grelhada servida com batatas e salada.", ingredients: [{ itemId: 'sardine', quantity: 1 }, { itemId: 'potato', quantity: 2 }, { itemId: 'mixed_salad', quantity: 1 }], producesItemId: 'grilled_sardine_meal', producesQuantity: 1, icon: FishIconSymbol, imageUrl: '/images/sardinha-grelhada.png', dataAiHint: 'grilled sardine recipe' },
  { id: 'recipe_duck_rice', name: "Arroz de Pato", description: "Cozinhe um delicioso arroz de pato.", ingredients: [{ itemId: 'duck_meat', quantity: 1 }, { itemId: 'rice', quantity: 2 }, { itemId: 'onion', quantity: 1 }, { itemId: 'water', quantity: 2 }, { itemId: 'mixed_salad', quantity: 1 }], producesItemId: 'duck_rice', producesQuantity: 1, icon: CookingPot, imageUrl: '/images/arroz-de-pato.png', dataAiHint: 'duck rice recipe' },
  { id: 'recipe_bean_stew', name: "Feijoada", description: "Cozinhe uma feijoada saborosa e nutritiva.", ingredients: [{ itemId: 'bean', quantity: 5 }, { itemId: 'pork_meat', quantity: 1 }, { itemId: 'onion', quantity: 1 }, { itemId: 'water', quantity: 2 }, { itemId: 'rice', quantity: 2 }], producesItemId: 'bean_stew', producesQuantity: 1, icon: CookingPot, imageUrl: '/images/feijoada.png', dataAiHint: 'bean stew recipe' },
  { id: 'recipe_pancake', name: "Panqueca", description: "Panquecas fofas, perfeitas para o pequeno-almoço.", ingredients: [{ itemId: 'flour', quantity: 1 }, { itemId: 'egg', quantity: 1 }, { itemId: 'milk', quantity: 1 }, { itemId: 'sugar', quantity: 1 }], producesItemId: 'pancake', producesQuantity: 3, icon: Utensils, imageUrl: '/images/panqueca.png', dataAiHint: 'pancake recipe' },
  { id: 'recipe_cheese', name: "Queijo", description: "Transforme leite fresco em queijo delicioso.", ingredients: [{ itemId: 'milk', quantity: 3 }], producesItemId: 'cheese', producesQuantity: 1, icon: Gem, imageUrl: '/images/queijo.png', dataAiHint: 'cheese recipe' },
  { id: 'recipe_churrasco', name: "Churrasco", description: "Prepare um churrasco completo com várias carnes, batatas e salada.", ingredients: [{ itemId: 'chicken_meat', quantity: 1 }, { itemId: 'pork_meat', quantity: 1 }, { itemId: 'beef_meat', quantity: 1 }, { itemId: 'potato', quantity: 4 }, { itemId: 'mixed_salad', quantity: 1 }], producesItemId: 'churrasco', producesQuantity: 1, icon: Drumstick, imageUrl: '/images/churrasco.png', dataAiHint: 'churrasco barbecue recipe' },
  { id: 'recipe_goat_cheese_honey_toast', name: "Tosta com Queijo de Cabra e Mel", description: "Prepare uma deliciosa tosta com queijo de cabra e mel.", ingredients: [{ itemId: 'bread', quantity: 1 }, { itemId: 'cheese', quantity: 1 }, { itemId: 'honey', quantity: 1 }], producesItemId: 'goat_cheese_honey_toast', producesQuantity: 1, icon: Sandwich, imageUrl: '/images/tosta.png', dataAiHint: 'toast recipe' },
  { id: 'recipe_almond_cake', name: "Bolo de Amêndoa", description: "Bolo fofo e saboroso com amêndoas.", ingredients: [{ itemId: 'almond', quantity: 2 }, { itemId: 'flour', quantity: 1 }, { itemId: 'sugar', quantity: 1 }, { itemId: 'egg', quantity: 2 }], producesItemId: 'almond_cake', producesQuantity: 1, icon: CakeSlice, imageUrl: '/images/bolo-de-amendoa.png', dataAiHint: 'almond cake recipe' },
  { id: 'recipe_pizza_margarita', name: "Pizza Margarita", description: "Faça uma pizza clássica e deliciosa.", ingredients: [{ itemId: 'bread', quantity: 1 }, { itemId: 'tomato', quantity: 2 }, { itemId: 'cheese', quantity: 1 }, { itemId: 'basil', quantity: 5 }, { itemId: 'olive_oil', quantity: 1 }], producesItemId: 'pizza_margarita', producesQuantity: 1, icon: Utensils, imageUrl: '/images/pizza-margarita.png', dataAiHint: 'pizza margarita recipe' },
  { id: 'recipe_pumpkin_pie', name: "Torta de Abóbora", description: "Torta clássica de abóbora com especiarias.", ingredients: [{ itemId: 'pumpkin', quantity: 1 }, { itemId: 'flour', quantity: 1 }, { itemId: 'sugar', quantity: 1 }, { itemId: 'egg', quantity: 1 }], producesItemId: 'pumpkin_pie', producesQuantity: 1, icon: CakeSlice, imageUrl: '/images/torta-de-abobora.png', dataAiHint: 'pumpkin pie recipe' },
  { id: 'recipe_melon_juice', name: "Sumo de Melão", description: "Sumo refrescante de melão.", ingredients: [{ itemId: 'melon', quantity: 1 }, { itemId: 'sugar', quantity: 1 }], producesItemId: 'melon_juice', producesQuantity: 1, icon: Droplets, imageUrl: '/images/sumo-de-melao.png', dataAiHint: 'melon juice recipe' },
  { id: 'recipe_stuffed_eggplant', name: "Beringela Recheada", description: "Beringela recheada com carne e vegetais.", ingredients: [{ itemId: 'eggplant', quantity: 1 }, { itemId: 'pork_meat', quantity: 1 }, { itemId: 'onion', quantity: 1 }, { itemId: 'tomato', quantity: 1 }], producesItemId: 'stuffed_eggplant', producesQuantity: 1, icon: CookingPot, imageUrl: '/images/beringela-recheada.png', dataAiHint: 'stuffed eggplant recipe' },
  { id: 'recipe_watermelon_juice', name: "Sumo de Melancia", description: "Sumo doce e hidratante de melancia.", ingredients: [{ itemId: 'watermelon', quantity: 1 }, { itemId: 'sugar', quantity: 1 }], producesItemId: 'watermelon_juice', producesQuantity: 1, icon: Droplets, imageUrl: '/images/sumo-de-melancia.png', dataAiHint: 'watermelon juice recipe' },
  { id: 'recipe_fruit_salad', name: "Salada de Fruta", description: "Crie uma deliciosa e refrescante salada de frutas.", ingredients: [{ itemId: 'apple', quantity: 1 }, { itemId: 'orange', quantity: 1 }, { itemId: 'pear', quantity: 1 }, { itemId: 'grape_crop', quantity: 1 }, { itemId: 'banana', quantity: 1 }, {itemId: 'melon', quantity: 1}, {itemId: 'watermelon', quantity: 1}], producesItemId: 'fruit_salad', producesQuantity: 1, icon: Utensils, imageUrl: '/images/salada-de-fruta.png', dataAiHint: 'fruit salad recipe' },
  { id: 'recipe_pasta_tomato_basil', name: "Massa com Tomate e Manjericão", description: "Prepare um delicioso prato de massa com tomate e manjericão.", ingredients: [{ itemId: 'dough', quantity: 1 }, { itemId: 'tomato', quantity: 1 }, { itemId: 'basil', quantity: 2 }, { itemId: 'olive_oil', quantity: 1 }], producesItemId: 'pasta_tomato_basil', producesQuantity: 1, icon: Utensils, imageUrl: '/images/massa-com-tomate-e-manjericao.png', dataAiHint: 'pasta tomato basil recipe' },
  { id: 'recipe_olive_oil', name: "Azeite", description: "Prensa azeitonas para obter azeite puro.", ingredients: [{ itemId: 'olive', quantity: 4 }], producesItemId: 'olive_oil', producesQuantity: 1, icon: Droplets, imageUrl: '/images/azeite.png', dataAiHint: 'olive oil recipe' },
  { id: 'recipe_rabbit_stew', name: "Ensopado de Coelho", description: "Cozinhe um ensopado rico com carne de coelho e legumes.", ingredients: [{ itemId: 'rabbit_meat', quantity: 1 }, { itemId: 'potato', quantity: 2 }, { itemId: 'carrot', quantity: 2 }, { itemId: 'water', quantity: 2 }], producesItemId: 'rabbit_stew', producesQuantity: 1, icon: CookingPot, imageUrl: '/images/feijoada.png', dataAiHint: 'rabbit stew recipe' },
  { id: 'recipe_turkey_roast', name: "Peru Assado", description: "Asse um peru inteiro com batatas para um banquete.", ingredients: [{ itemId: 'turkey_meat', quantity: 1 }, { itemId: 'potato', quantity: 3 }, { itemId: 'onion', quantity: 2 }], producesItemId: 'turkey_roast', producesQuantity: 1, icon: Drumstick, imageUrl: '/images/churrasco.png', dataAiHint: 'roast turkey recipe' },
];

const getIngredientMinLevel = (itemId: string, calculatedLevels: Map<string, number>): number => {
  // Base case: Water and bait
  if (itemId === 'water' || itemId === BAIT_ID) return 1;

  // Check if it's a crop or direct animal product
  const crop = AVAILABLE_CROPS.find(c => c.id === itemId || c.productId === itemId);
  if (crop) return crop.minLevel;

  const animal = AVAILABLE_ANIMALS.find(a => a.productId === itemId || a.meatProductId === itemId);
  if (animal) return animal.minLevel;

  // Check if it's a fish
  const fish = AVAILABLE_FISH.find(f => f.id === itemId);
  if (fish) return 1; // Assuming fishing is available from level 1

  // It must be a crafted item, find its recipe
  const recipe = rawRecipes.find(r => r.producesItemId === itemId);
  if (recipe) {
    return calculateMinLevelForRecipe(recipe, calculatedLevels);
  }

  return 999; // Should not happen if all items are configured
};

const calculateMinLevelForRecipe = (recipe: Omit<Recipe, 'minLevelRequired'>, calculatedLevels: Map<string, number>): number => {
  const recipeId = recipe.id;
  if (calculatedLevels.has(recipeId)) {
    return calculatedLevels.get(recipeId)!;
  }

  // To prevent infinite loops with circular dependencies
  calculatedLevels.set(recipeId, 999);

  let maxIngredientLevel = 0;
  for (const ingredient of recipe.ingredients) {
    const ingredientLevel = getIngredientMinLevel(ingredient.itemId, calculatedLevels);
    if (ingredientLevel > maxIngredientLevel) {
      maxIngredientLevel = ingredientLevel;
    }
  }

  calculatedLevels.set(recipeId, maxIngredientLevel);
  return maxIngredientLevel;
};

const calculatedRecipeLevels = new Map<string, number>();
rawRecipes.forEach(recipe => calculateMinLevelForRecipe(recipe, calculatedRecipeLevels));

export const AVAILABLE_RECIPES: Recipe[] = rawRecipes
  .map(recipe => ({
    ...recipe,
    minLevelRequired: calculatedRecipeLevels.get(recipe.id) || 1,
  }))
  .sort((a, b) => (a.minLevelRequired || 0) - (b.minLevelRequired || 0) || a.id.localeCompare(b.id));


// ============ CONSOLIDAÇÃO FINAL (não mexer) ============
// 🛑 ESTA SECÇÃO FUNDE TODAS AS LISTAS num único "mapa" de itens vendáveis.
// É por causa disto que os `id` têm de ser únicos — se repetir um id, um
// item "engole" o outro aqui. Adicione os seus itens às listas acima,
// NUNCA mexa no `ALL_SELLABLE_ITEMS` diretamente.
const finalAllItemsMap = new Map<string, SellableItem>();
const addFinalItemToMap = (item: SellableItem) => {
  if (item && item.id) {
    finalAllItemsMap.set(item.id, item);
  }
};

AVAILABLE_CROPS.forEach(addFinalItemToMap);
AVAILABLE_ANIMAL_PRODUCTS.forEach(addFinalItemToMap);
AVAILABLE_RESOURCE_ITEMS.forEach(addFinalItemToMap);
AVAILABLE_CRAFTABLE_ITEMS.forEach(item => {
    const recipe = AVAILABLE_RECIPES.find(r => r.producesItemId === item.id);
    addFinalItemToMap({ ...item, minLevel: recipe?.minLevelRequired || 1 });
});
AVAILABLE_FISH.forEach(addFinalItemToMap);
addFinalItemToMap(WATER_ITEM);
addFinalItemToMap(FISHING_BAIT);

export const ALL_SELLABLE_ITEMS: SellableItem[] = Array.from(finalAllItemsMap.values())
  .filter(item => item && item.name)
  .sort((a, b) => a.name.localeCompare(b.name));


export const MISSION_CONFIG: { [key in MissionType]?: { baseReward: number; amountRange: [number, number]; icon: LucideIcon | React.FC<React.SVGProps<SVGSVGElement>>; } } = {
  HARVEST_CROP: { baseReward: 20, amountRange: [5, 20], icon: Tractor },
  EARN_CURRENCY: { baseReward: 30, amountRange: [30, 150], icon: Coins },
  PLANT_CROP: { baseReward: 15, amountRange: [3, 12], icon: Sprout },
  HAVE_CURRENCY: { baseReward: 50, amountRange: [30, 250], icon: TrendingUp },
  UPGRADE_FIELDS: { baseReward: 75, amountRange: [1, 2], icon: ChevronsUp },
  BUY_ANIMAL: { baseReward: 40, amountRange: [1, 2], icon: ShoppingCart },
  COLLECT_ANIMAL_PRODUCT: { baseReward: 20, amountRange: [2, 6], icon: ArchiveIcon },
  CRAFT_ITEM: { baseReward: 25, amountRange: [1, 2], icon: CookingPot },
};

const baseAchievements: Omit<Achievement, 'title'|'description'>[] = [
  { id: 'reach_level_10', type: 'REACH_LEVEL_X', targetAmount: 10, rewardCurrency: 100, rewardXp: 100, icon: BarChart },
  { id: 'reach_level_25', type: 'REACH_LEVEL_X', targetAmount: 25, rewardCurrency: 500, rewardXp: 500, icon: Award },
  { id: 'reach_level_40', type: 'REACH_LEVEL_X', targetAmount: 40, rewardCurrency: 1000, rewardXp: 1000, icon: Award },
  { id: 'complete_missions_20', type: 'COMPLETE_MISSIONS_TOTAL', targetAmount: 20, rewardCurrency: 100, rewardXp: 100, icon: ShieldQuestion },
  { id: 'complete_missions_75', type: 'COMPLETE_MISSIONS_TOTAL', targetAmount: 75, rewardCurrency: 500, rewardXp: 500, icon: Target },
  { id: 'complete_missions_150', type: 'COMPLETE_MISSIONS_TOTAL', targetAmount: 150, rewardCurrency: 1000, rewardXp: 1000, icon: Target },
  { id: 'earn_currency_50k', type: 'EARN_CURRENCY_TOTAL', targetAmount: 50000, rewardCurrency: 500, rewardXp: 1000, icon: Coins },
  { id: 'earn_currency_750k', type: 'EARN_CURRENCY_TOTAL', targetAmount: 750000, rewardCurrency: 3000, rewardXp: 7500, icon: Gem },
  { id: 'earn_currency_1m', type: 'EARN_CURRENCY_TOTAL', targetAmount: 1000000, rewardCurrency: 25000, rewardXp: 25000, icon: Gem },
  { id: 'own_fields_10', type: 'OWN_FIELDS_TOTAL', targetAmount: 10, rewardCurrency: 200, rewardXp: 150, icon: Sprout },
  { id: 'own_fields_15', type: 'OWN_FIELDS_TOTAL', targetAmount: 15, rewardCurrency: 500, rewardXp: 300, icon: Sprout },
  { id: 'own_pens_10', type: 'OWN_PENS_TOTAL', targetAmount: 10, rewardCurrency: 200, rewardXp: 150, icon: Bird },
  { id: 'own_pens_15', type: 'OWN_PENS_TOTAL', targetAmount: 15, rewardCurrency: 500, rewardXp: 300, icon: Bird },
  { id: 'upgrade_buildings_20', type: 'UPGRADE_BUILDINGS_TOTAL', targetAmount: 20, rewardCurrency: 300, rewardXp: 200, icon: Zap },
  { id: 'upgrade_buildings_40', type: 'UPGRADE_BUILDINGS_TOTAL', targetAmount: 40, rewardCurrency: 750, rewardXp: 500, icon: Zap },
  { id: 'collect_eggs_300', type: 'COLLECT_SPECIFIC_PRODUCT', targetId: 'egg', targetAmount: 300, rewardCurrency: 225, rewardXp: 225, icon: Egg },
  { id: 'collect_total_1000', type: 'COLLECT_PRODUCT_TOTAL', targetAmount: 1000, rewardCurrency: 600, rewardXp: 600, icon: Box },
  { id: 'harvest_total_2000', type: 'HARVEST_CROP_TOTAL', targetAmount: 2000, rewardCurrency: 500, rewardXp: 500, icon: Tractor },
  { id: 'craft_items_total_200', type: 'CRAFT_ITEM_TOTAL', targetAmount: 200, rewardCurrency: 750, rewardXp: 750, icon: CookingPot },
];

const cropAchievements: Omit<Achievement, 'title'|'description'>[] = AVAILABLE_CROPS.map(crop => ({
  id: `harvest_${crop.id}_100`,
  type: 'HARVEST_SPECIFIC_CROP',
  targetId: crop.productId || crop.id,
  targetAmount: 100,
  rewardCurrency: Math.floor(crop.sellPrice * 10 + 50),
  rewardXp: Math.floor(crop.sellPrice * 5 + 50),
  icon: crop.icon,
}));

const animalAchievements: Omit<Achievement, 'title'|'description'>[] = AVAILABLE_ANIMALS.map(animal => ({
  id: `buy_${animal.id}_2`,
  type: 'BUY_SPECIFIC_ANIMAL',
  targetId: animal.id,
  targetAmount: 2,
  rewardCurrency: Math.floor(animal.cost * 0.5 + 50),
  rewardXp: Math.floor(animal.cost * 0.25 + 50),
  icon: animal.icon,
}));

const achievementsData: Omit<Achievement, 'title'|'description'>[] = [...baseAchievements, ...cropAchievements, ...animalAchievements];

export const AVAILABLE_ACHIEVEMENTS: Achievement[] = achievementsData.map(ach => {
    // Os títulos/descrições reais vivem em `src/messages/*.json`
    // (chaves `Items.<id>.title` e `Items.<id>.description`) e são aplicados
    // em `getAvailableAchievements()` (`src/app/page.tsx`). Aqui ficam
    // fallbacks neutros para que este ficheiro não duplique traduções.
    return {
        ...ach,
        title: ach.id,
        description: '',
    };
}).sort((a, b) => {
  if (a.type === 'REACH_LEVEL_X' && b.type !== 'REACH_LEVEL_X') return -1;
  if (a.type !== 'REACH_LEVEL_X' && b.type === 'REACH_LEVEL_X') return 1;
  if (a.type === 'REACH_LEVEL_X' && b.type === 'REACH_LEVEL_X') {
    if (a.targetAmount !== b.targetAmount) return a.targetAmount - b.targetAmount;
  }
  if (a.rewardXp !== b.rewardXp) return a.rewardXp - b.rewardXp;
  if (a.rewardCurrency !== b.rewardCurrency) return a.rewardCurrency - b.rewardCurrency;
  if (a.targetAmount !== b.targetAmount) return a.targetAmount - b.targetAmount;
  return a.id.localeCompare(b.id);
});
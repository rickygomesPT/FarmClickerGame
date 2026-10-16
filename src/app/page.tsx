// ============================================================================
// 💡 O QUE É ESTE FICHEIRO?
//
// É o CORAÇÃO DA QUINTA. Todo o progresso do jogador vive num único estado
// (`gameState`) e a maioria das ações do jogo são funções `handle*` definidas
// aqui em baixo (handlePlantRequest, handleHarvest, handleCraftItem, ...).
//
// CONCEITO DOMINANTE — IMUTABILIDADE:
//   Nunca alteramos `gameState` diretamente. Em cada ação fazemos:
//     setGameState(prev => ({ ...prev, currency: 999 }))
//   ou seja, criamos sempre uma CÓPIA com a alteração. Isto é o padrão
//   React/Redux e evita erros de estado.
//
// MEMO:
//   - `gameState` começa a `null` e é preenchido após carregar (loading).
//   - `toastConfig` mostra mensagens temporárias no ecrã.
//   - `t('HomePage.<chave>')` busca os textos traduzidos em pt.json.
//
// 🔧 ALTERAR AQUI: para mudar como o jogo REAGE a uma ação.
// ➕ ADICIONAR FUNCIONALIDADE AQUI: para criar uma ação nova.
// ⚠️ CUIDADO: funções longas e interdependentes — leia tudo antes de mexer.
// ============================================================================

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { GameState, Field, Mission, MissionType, AnimalPen, SellableItem, AchievementProgress, Achievement, AchievementType as AchievementTypeEnum, Recipe, Inventory, Crop, AnimalType, AnimalProduct, GameStats } from '@/types/game';
import type { Toast } from "@/hooks/use-toast";
import {
  getAvailableCrops as getAvailableCropsConfig,
  getAvailableAnimals as getAvailableAnimalsConfig,
  getAvailableAnimalProducts as getAvailableAnimalProductsConfig,
  ALL_SELLABLE_ITEMS,
  INITIAL_CURRENCY,
  INITIAL_FIELDS_COUNT,
  INITIAL_ANIMAL_PENS_COUNT,
  MAX_ACTIVE_MISSIONS,
  MISSION_CONFIG,
  BASE_FIELD_COST,
  FIELD_COST_MULTIPLIER,
  BASE_ANIMAL_PEN_COST,
  ANIMAL_PEN_COST_MULTIPLIER,
  XP_FOR_PLANT_ACTION,
  XP_FOR_HARVEST_ACTION,
  XP_FOR_MISSION_COMPLETION_BASE,
  XP_FOR_FIELD_PURCHASE,
  XP_FOR_ANIMAL_PEN_PURCHASE,
  XP_FOR_BUYING_ANIMAL,
  XP_FOR_COLLECTING_PRODUCT,
  calculateXpToNextLevel,
  MAX_UPGRADE_LEVEL,
  BASE_FIELD_UPGRADE_COST,
  FIELD_UPGRADE_COST_MULTIPLIER,
  XP_FOR_FIELD_UPGRADE,
  BASE_ANIMAL_PEN_UPGRADE_COST,
  ANIMAL_PEN_UPGRADE_COST_MULTIPLIER,
  XP_FOR_ANIMAL_PEN_UPGRADE,
  calculateNextUpgradeCost,
  AVAILABLE_ACHIEVEMENTS,
  AVAILABLE_RECIPES,
  AVAILABLE_CRAFTABLE_ITEMS,
  XP_FOR_CRAFTING_ITEM,
  XP_FOR_USING_CONSUMABLE,
  XP_FOR_BUTCHERING_ANIMAL,
  getAvailableFish as getAvailableFishConfig,
  XP_FOR_FISHING_ACTION,
  FISHING_GRID_ROWS,
  FISHING_GRID_COLS,
  CELL_HAS_FISH_PROBABILITY,
  FISH_TYPE_PROBABILITIES,
  BAIT_ID,
  BAIT_COST_PER_PACK,
  BAIT_PACK_SIZE,
} from '@/config/gameConfig';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { GameHeader } from '@/components/GameHeader';
import { FieldSection } from '@/components/FieldSection';
import { AnimalPenSection } from '@/components/AnimalPenSection';
import { FishingSection } from '@/components/FishingSection';
import { InventoryPanel } from '@/components/InventoryPanel';
import { RecipesPanel } from '@/components/RecipesPanel';
import { PlantCropDialog } from '@/components/PlantCropDialog';
import { BuyAnimalDialog } from '@/components/BuyAnimalDialog';
import { MissionsDialog } from '@/components/MissionsDialog';
import { AchievementsDialog } from '@/components/AchievementsDialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { t, t_items, t_general, tSection, useI18n } from '@/lib/i18n';
import { getMissionDescription } from '@/lib/missionText';
import { applyXpGain, applyMissionProgress, applyAchievementProgress } from '@/lib/game/progress';
import { clampMissionAmount } from '@/lib/game/missions';
import { generateFishingGrid } from '@/lib/game/fishing';
import { upgradeFieldTime, upgradePenTime, upgradeYield, wateringCanReductionMs } from '@/lib/game/upgrades';
import { DEFAULT_GAME_STATS } from '@/lib/game/save';
import { decryptAndValidateGameState, encryptGameState } from '@/lib/game/saveCrypto';
import { CONTRACT_FIRST_DELAY_MS, CONTRACT_INTERVAL_MS, canFulfillContract, generateContract, shouldGenerateContract, sweepExpiredContracts } from '@/lib/game/contracts';
import { clearGameStorage, readGameFromStorage, saveGameToStorage } from '@/lib/game/storage';
import { isSoundMuted, playBuySound, playCatchSound, playCoinSound, playContractSound, playCraftSound, playCollectSound, playHarvestSound, playLevelUpSound, playMissSound, playPlantSound, playUpgradeSound, playWaterSound, setSoundMuted } from '@/lib/sound';
import { ContractsSection } from '@/components/ContractsSection';
import { StatsDialog } from '@/components/StatsDialog';

const WATER_COLLECTION_COOLDOWN = 1000; // 1 second
const AUTOSAVE_TICK_MS = 10000; // Persistência + contratos: corre de 10 em 10 s


export default function HomePage() {
  const { toast } = useToast();
  const { locale, setLocale } = useI18n();
  
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isGameLoading, setIsGameLoading] = useState(true);

  const [toastConfig, setToastConfig] = useState<Toast | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isPlanting, setIsPlanting] = useState(false);
  const [plantingFieldId, setPlantingFieldId] = useState<string | null>(null);
  const [isBuyingAnimal, setIsBuyingAnimal] = useState(false);
  const [buyingAnimalPenId, setBuyingAnimalPenId] = useState<string | null>(null);
  const [notifiedReadyMissions, setNotifiedReadyMissions] = useState<Set<string>>(new Set());
  const [levelUpInfo, setLevelUpInfo] = useState<{ level: number } | null>(null);
  const [levelUpBanner, setLevelUpBanner] = useState<number | null>(null);
  const bannerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [isMissionsDialogOpen, setIsMissionsDialogOpen] = useState(false);
  const [isAchievementsDialogOpen, setIsAchievementsDialogOpen] = useState(false);
  const [isStatsDialogOpen, setIsStatsDialogOpen] = useState(false);
  const [muted, setMuted] = useState<boolean>(() => isSoundMuted());
  
  const [notifiedReadyAchievements, setNotifiedReadyAchievements] = useState<Set<string>>(new Set());
  
  const getAvailableAchievements = useCallback((): Achievement[] => {
    return AVAILABLE_ACHIEVEMENTS.map(ach => ({
      ...ach,
      title: t_items(`${ach.id}.title`),
      description: t_items(`${ach.id}.description`)
    }));
  }, []);

  const getAvailableRecipes = useCallback((): Recipe[] => {
    return AVAILABLE_RECIPES.map(recipe => ({
      ...recipe,
      name: t_items(`${recipe.id}.name`),
      description: t_items(`${recipe.id}.description`),
    }));
  }, []);

  const getAvailableCrops = useCallback((): Crop[] => {
    return getAvailableCropsConfig().map(crop => ({
      ...crop,
      name: t_items(`${crop.id}.name`),
      description: t_items(`${crop.id}.description`),
    }));
  }, []);
  
  const getAvailableAnimals = useCallback((): AnimalType[] => {
    return getAvailableAnimalsConfig().map(animal => ({
      ...animal,
      name: t_items(`${animal.id}.name`),
    }));
  }, []);

  const getAvailableAnimalProducts = useCallback((): AnimalProduct[] => {
    return getAvailableAnimalProductsConfig().map(product => ({
      ...product,
      name: t_items(`${product.id}.name`),
      description: t_items(`${product.id}.description`),
    }));
  }, []);

  const getAvailableFish = useCallback((): SellableItem[] => {
    return getAvailableFishConfig().map(fish => ({
      ...fish,
      name: t_items(`${fish.id}.name`),
      description: t_items(`${fish.id}.description`),
    }));
  }, []);
  
  const getAllSellableItems = useCallback((): SellableItem[] => {
    return ALL_SELLABLE_ITEMS.map(item => ({
      ...item,
      name: t_items(`${item.id}.name`),
      description: t_items(`${item.id}.description`),
    }));
  }, []);

  useEffect(() => {
    if (toastConfig) {
      const { dismiss } = toast(toastConfig);
      // Garante que o popup desaparece ao fim de 5 s mesmo com ações seguidas.
      const timeout = setTimeout(() => dismiss(), 5000);
      setToastConfig(null);
      return () => clearTimeout(timeout);
    }
  }, [toastConfig, toast]);

  const initializeAchievements = useCallback((): AchievementProgress[] => {
    return getAvailableAchievements().map(ach => ({
      achievementId: ach.id,
      currentAmount: 0,
      isCompleted: false,
      isClaimed: false,
    }));
  }, [getAvailableAchievements]);

  const updateAchievementProgress = useCallback((type: AchievementTypeEnum, amount: number, details?: { targetId?: string }) => {
    setGameState(prev => {
      if (!prev) return prev;
      const next = applyAchievementProgress(prev.achievements, getAvailableAchievements(), type, amount, details);
      if (!next) return prev;
      return { ...prev, achievements: next };
    });
  }, [getAvailableAchievements]);
  
  const internalRefreshFishingGrid = useCallback((): (string | 'CLICKED_EMPTY' | null)[][] => {
    return generateFishingGrid(FISHING_GRID_ROWS, FISHING_GRID_COLS, CELL_HAS_FISH_PROBABILITY, FISH_TYPE_PROBABILITIES);
  }, []);

  const downloadJsonFile = (payload: unknown, filename: string) => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const handleExportSave = useCallback(() => {
    if (!gameState) return;

    const filename = `quinta-magnifica-save-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    (async () => {
      try {
        downloadJsonFile(await encryptGameState(gameState), filename);
      } catch {
        // Sem WebCrypto: formato simples (funcional, menos protegido).
        downloadJsonFile({ app: 'quinta-magnifica', version: 1, gameState }, filename);
      }
      setToastConfig({ title: t('HomePage.save.exportTitle'), description: t('HomePage.save.exportDescription'), variant: "default" });
    })();
  }, [gameState, setToastConfig]);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImportFile = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      (async () => {
        try {
          const parsed = JSON.parse(String(reader.result));
          const importedState = await decryptAndValidateGameState(parsed, internalRefreshFishingGrid);
          if (!importedState) {
            setToastConfig({ title: t('HomePage.save.importInvalidTitle'), description: t('HomePage.save.importInvalidDescription'), variant: "destructive" });
            return;
          }

          const userConfirmed = window.confirm(t('HomePage.save.importConfirm'));
          if (!userConfirmed) return;

          prevLevelRef.current = importedState.level;

          setGameState(importedState);
          setNotifiedReadyMissions(new Set());
          setNotifiedReadyAchievements(new Set());
          setLevelUpInfo(null);
          setToastConfig({ title: t('HomePage.save.importTitle'), description: t('HomePage.save.importDescription'), variant: "default" });
        } catch {
          setToastConfig({ title: t('HomePage.save.importInvalidTitle'), description: t('HomePage.save.importInvalidDescription'), variant: "destructive" });
        }
      })();
    };
    reader.readAsText(file);
  }, [internalRefreshFishingGrid, setToastConfig]);

  const initializeNewGame = useCallback((playerName: string = 'Convidado') => {
    const initialFields: Field[] = Array.from({ length: INITIAL_FIELDS_COUNT }, (_, _i) => ({
      id: crypto.randomUUID(),
      cropId: null,
      plantTime: null,
      harvestReadyTime: null,
      upgradeLevel: 0,
      currentUpgradeCost: calculateNextUpgradeCost(BASE_FIELD_UPGRADE_COST, FIELD_UPGRADE_COST_MULTIPLIER, 0),
    }));
    const initialAnimalPens: AnimalPen[] = Array.from({ length: INITIAL_ANIMAL_PENS_COUNT }, (_,_i) => ({
      id: crypto.randomUUID(),
      animalTypeId: null,
      animalPlacedTime: null,
      productReadyTime: null,
      upgradeLevel: 0,
      currentUpgradeCost: calculateNextUpgradeCost(BASE_ANIMAL_PEN_UPGRADE_COST, ANIMAL_PEN_UPGRADE_COST_MULTIPLIER, 0),
    }));

    const initialAchievements = initializeAchievements();
    const initialFishingGrid = internalRefreshFishingGrid();

    const newGameState: GameState = {
      playerName: playerName,
      currency: INITIAL_CURRENCY,
      fields: initialFields,
      animalPens: initialAnimalPens,
      inventory: { [BAIT_ID]: 12 }, // Uma embalagem para a primeira grelha
      missions: [],
      achievements: initialAchievements,
      nextFieldCost: Math.floor(BASE_FIELD_COST * Math.pow(FIELD_COST_MULTIPLIER, INITIAL_FIELDS_COUNT -1 < 0 ? 0 : INITIAL_FIELDS_COUNT -1)),
      nextAnimalPenCost: Math.floor(BASE_ANIMAL_PEN_COST * Math.pow(ANIMAL_PEN_COST_MULTIPLIER, INITIAL_ANIMAL_PENS_COUNT -1 < 0 ? 0 : INITIAL_ANIMAL_PENS_COUNT -1)),
      level: 1,
      xp: 0,
      xpToNextLevel: calculateXpToNextLevel(1),
      lastWaterCollectionTime: null,
      fishingGrid: initialFishingGrid,
      contracts: [],
      nextContractAt: Date.now() + CONTRACT_FIRST_DELAY_MS,
      stats: { ...DEFAULT_GAME_STATS },
    };
    
    setGameState(newGameState);
    updateAchievementProgress('OWN_FIELDS_TOTAL', INITIAL_FIELDS_COUNT);
    updateAchievementProgress('OWN_PENS_TOTAL', INITIAL_ANIMAL_PENS_COUNT);
    updateAchievementProgress('REACH_LEVEL_X', 1);

    return newGameState;
  }, [initializeAchievements, updateAchievementProgress, internalRefreshFishingGrid]);

  const handleNewGame = useCallback(() => {
    const userConfirmed = window.confirm(t('GameHeader.newGameConfirm'));
    if (!userConfirmed) return;
    clearGameStorage();
    setNotifiedReadyMissions(new Set());
    setNotifiedReadyAchievements(new Set());
    setLevelUpInfo(null);
    initializeNewGame(t_general('guest'));
  }, [initializeNewGame]);

  useEffect(() => {
    let cancelled = false;
    setIsGameLoading(true);
    (async () => {
      try {
        const stored = readGameFromStorage();
        const loaded = stored ? await decryptAndValidateGameState(stored, internalRefreshFishingGrid) : null;
        if (cancelled) return;
        if (loaded) {
          setGameState(loaded);
          setNotifiedReadyMissions(new Set());
          setNotifiedReadyAchievements(new Set());
          setLevelUpInfo(null);
        } else {
          initializeNewGame(t_general('guest'));
        }
      } finally {
        if (!cancelled) setIsGameLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [initializeNewGame, internalRefreshFishingGrid]);

  const gameStateRef = useRef(gameState);
  useEffect(() => {
      gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    if (isGameLoading || !gameState) return;
    void saveGameToStorage(gameState);
  }, [gameState, isGameLoading]);

  useEffect(() => {
    const id = setInterval(() => {
      setGameState(prev => {
        if (!prev) return prev;
        return { ...prev, stats: { ...prev.stats, playMs: prev.stats.playMs + AUTOSAVE_TICK_MS } };
      });
    }, AUTOSAVE_TICK_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const current = gameStateRef.current;
      if (!current) return;
      const now = Date.now();
      const swept = sweepExpiredContracts(current.contracts, now);
      const shouldGenerate = shouldGenerateContract(current.contracts, current.nextContractAt, now);
      if (swept.length === current.contracts.length && !shouldGenerate) return;
      const contract = shouldGenerate ? generateContract(current.level, now) : null;
      setGameState(prev => {
        if (!prev) return prev;
        let next: GameState = { ...prev, contracts: sweepExpiredContracts(prev.contracts, now) };
        if (contract && shouldGenerateContract(next.contracts, next.nextContractAt, now)) {
          next = { ...next, contracts: [...next.contracts, contract], nextContractAt: now + CONTRACT_INTERVAL_MS };
        }
        return next;
      });
      if (contract) {
        setToastConfig({ title: t('HomePage.contractArrived.title'), description: t('HomePage.contractArrived.description'), className: "bg-primary text-primary-foreground" });
        playContractSound();
      }
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (levelUpInfo) {
      setToastConfig({
        title: t('HomePage.levelUp.title'),
        description: t('HomePage.levelUp.description', {level: levelUpInfo.level}),
        className: "bg-primary text-primary-foreground font-bold"
      });
      updateAchievementProgress('REACH_LEVEL_X', levelUpInfo.level);
      playLevelUpSound();
      setLevelUpBanner(levelUpInfo.level);
      if (bannerTimeoutRef.current !== null) clearTimeout(bannerTimeoutRef.current);
      bannerTimeoutRef.current = setTimeout(() => setLevelUpBanner(null), 2500);
      setLevelUpInfo(null);
    }
  }, [levelUpInfo, updateAchievementProgress, setToastConfig]);


  useEffect(() => {
    if (!gameState || !gameState.achievements) return;
    const achievementsToNotifyNow: string[] = [];
    const currentAchievements = getAvailableAchievements();
    gameState.achievements.forEach(achProgress => {
      const achievement = currentAchievements.find(a => a.id === achProgress.achievementId);
      if (
        achievement &&
        achProgress.isCompleted &&
        !achProgress.isClaimed &&
        !notifiedReadyAchievements.has(achProgress.achievementId)
      ) {
        achievementsToNotifyNow.push(achProgress.achievementId);
        setToastConfig({ title: t('HomePage.achievementUnlocked.title'), description: t('HomePage.achievementUnlocked.description', {achievementTitle: achievement.title}) });
      }
    });

    if (achievementsToNotifyNow.length > 0) {
      setNotifiedReadyAchievements(prev => new Set([...prev, ...achievementsToNotifyNow]));
    }
  }, [gameState?.achievements, notifiedReadyAchievements, setToastConfig, getAvailableAchievements]);


  // Contadores das Estatísticas: soma um incremento sem tocar no resto.
  const trackStats = useCallback((patch: Partial<GameStats>) => {
    setGameState(prev => {
      if (!prev) return prev;
      const nextStats = { ...prev.stats };
      (Object.keys(patch) as (keyof GameStats)[]).forEach(key => {
        nextStats[key] = nextStats[key] + (patch[key] ?? 0);
      });
      return { ...prev, stats: nextStats };
    });
  }, []);

  // 🔧 ALTERAR AQUI: ajusta o sistema de níveis/XP.
  // Sempre que qualquer ação do jogo quer dar XP, chama `gainXP(n)`.
  // É O EXEMPLO MAIS CLARO do padrão imutável:
  //   setGameState(prev => ({ ...prev, xp, level, xpToNextLevel }))
  // `prev` é o estado antigo; devolvemos uma cópia com os campos novos.
  const gainXP = useCallback((amount: number) => {
    setGameState(prev => {
      if (!prev) return null;
      const result = applyXpGain(prev, amount);

      return {
        ...prev,
        xp: result.xp,
        level: result.level,
        xpToNextLevel: result.xpToNextLevel,
      };
    });
  }, []);

  // Celebração de subida de nível: observa o nível (efeito) em vez de
  // depender de `setState` dentro de updaters, que o React pode descartar.
  const prevLevelRef = useRef<number | null>(null);
  useEffect(() => {
    if (!gameState || isGameLoading) return;
    const currentLevel = gameState.level;
    if (prevLevelRef.current === null) {
      prevLevelRef.current = currentLevel;
      return;
    }
    if (currentLevel > prevLevelRef.current) {
      setLevelUpInfo({ level: currentLevel });
    }
    prevLevelRef.current = currentLevel;
  }, [gameState?.level, isGameLoading]);


  const updateMissionProgress = useCallback((type: MissionType, amount: number, details?: { targetId?: string, currentTotalCurrency?: number }) => {
    setGameState(prev => {
      if (!prev) return prev;
      const next = applyMissionProgress(prev.missions, type, amount, details);
      if (!next) return prev;
      return { ...prev, missions: next };
    });
  }, []);

  useEffect(() => {
    if (!gameState) return;
    updateMissionProgress('HAVE_CURRENCY', 0, { currentTotalCurrency: gameState.currency });
  }, [gameState?.currency, updateMissionProgress]);

  useEffect(() => {
    if (!gameState || !gameState.missions) return;
    const missionsToNotifyNow: string[] = [];
    gameState.missions.forEach(mission => {
      if (
        mission.currentAmount >= mission.targetAmount &&
        !mission.isCompleted &&
        !notifiedReadyMissions.has(mission.id)
      ) {
        missionsToNotifyNow.push(mission.id);
        setToastConfig({ title: t('HomePage.missionReady.title'), description: t('HomePage.missionReady.description', {missionDescription: getMissionDescription(mission)}) });
      }
    });

    if (missionsToNotifyNow.length > 0) {
      setNotifiedReadyMissions(prev => new Set([...prev, ...missionsToNotifyNow]));
    }
  }, [gameState?.missions, notifiedReadyMissions, setToastConfig]);


  const generateNewMission = useCallback(() => {
    setGameState(prev => {
      if (!prev) return null;
      if (prev.missions.filter(m => !m.isCompleted).length >= MAX_ACTIVE_MISSIONS) {
        return prev;
      }

      const missionTypes = Object.keys(MISSION_CONFIG).filter(mt => MISSION_CONFIG[mt as MissionType]) as MissionType[];
      if (missionTypes.length === 0) return prev;

      const randomType = missionTypes[Math.floor(Math.random() * missionTypes.length)];
      const config = MISSION_CONFIG[randomType];
      if (!config) return prev;

      let targetId: string | undefined = undefined;
      let targetAmount = config.amountRange[0] + Math.floor(Math.random() * (config.amountRange[1] - config.amountRange[0] + 1));
      let reward = config.baseReward; 
      let itemNameForLogic = "";

      const allSellable = getAllSellableItems();

      const unlockedCrops = getAvailableCrops().filter(c => c.minLevel <= prev.level);
      const unlockedAnimals = getAvailableAnimals().filter(a => a.minLevel <= prev.level);
      const unlockedProducts = getAvailableAnimalProducts().filter(p => {
        const parentAnimal = getAvailableAnimals().find(a => a.productId === p.id || a.meatProductId === p.id);
        return parentAnimal && parentAnimal.minLevel <= prev.level;
      });
      const unlockedRecipes = getAvailableRecipes().filter(r => (r.minLevelRequired || 0) <= prev.level);

      switch (randomType) {
        case 'HARVEST_CROP': {
          if (unlockedCrops.length === 0) return prev;
          const item = unlockedCrops[Math.floor(Math.random() * unlockedCrops.length)];
          targetId = item.productId || item.id;
          const sellableItem = allSellable.find(si => si.id === targetId);
          itemNameForLogic = sellableItem ? sellableItem.name : item.name;
          targetAmount = clampMissionAmount(randomType, targetAmount, { timeMsPerItem: item.growthTime / Math.max(1, item.harvestYield) });
          reward += Math.floor((sellableItem ? sellableItem.sellPrice : item.sellPrice) * targetAmount * 0.2);
          break;
        }
        case 'PLANT_CROP': {
          if (unlockedCrops.length === 0) return prev;
          const item = unlockedCrops[Math.floor(Math.random() * unlockedCrops.length)];
          targetId = item.id;
          itemNameForLogic = item.name;
          targetAmount = clampMissionAmount(randomType, targetAmount, { timeMsPerItem: item.growthTime });
          reward += Math.floor(item.seedCost * targetAmount * 0.15);
          break;
        }
         case 'BUY_ANIMAL': {
          if (unlockedAnimals.length === 0) return prev;
          const animal = unlockedAnimals[Math.floor(Math.random() * unlockedAnimals.length)];
          targetId = animal.id;
          itemNameForLogic = animal.name;
          reward += Math.floor(animal.cost * targetAmount * 0.1);
          break;
        }
        case 'COLLECT_ANIMAL_PRODUCT': {
          if (unlockedProducts.length === 0) return prev;
          const product = unlockedProducts[Math.floor(Math.random() * unlockedProducts.length)];
          targetId = product.id;
          itemNameForLogic = product.name;
          const parentAnimal = getAvailableAnimals().find(a => a.productId === product.id || a.meatProductId === product.id);
          targetAmount = clampMissionAmount(randomType, targetAmount, parentAnimal && parentAnimal.productionTime > 0
            ? { timeMsPerItem: parentAnimal.productionTime / Math.max(1, parentAnimal.productYield) }
            : {});
          reward += Math.floor(product.sellPrice * targetAmount * 0.2);
          break;
        }
        case 'EARN_CURRENCY':
          itemNameForLogic = t_general('coins');
          reward += Math.floor(targetAmount * 0.1);
          break;
        case 'HAVE_CURRENCY':
            itemNameForLogic = t_general('total_coins');
            reward += Math.floor(targetAmount * 0.05);
            break;
        case 'UPGRADE_FIELDS':
            itemNameForLogic = t_general('upgrades');
            const avgUpgradeCost = (BASE_FIELD_UPGRADE_COST + BASE_ANIMAL_PEN_UPGRADE_COST) / 2;
            reward += Math.floor(targetAmount * avgUpgradeCost * 0.2);
            break;
        case 'CRAFT_ITEM': {
            if (unlockedRecipes.length === 0) return prev;
            const recipe = unlockedRecipes[Math.floor(Math.random() * unlockedRecipes.length)];
            targetId = recipe.producesItemId;
            const producedItem = allSellable.find(item => item.id === recipe.producesItemId);
            itemNameForLogic = producedItem ? producedItem.name : recipe.name;
            targetAmount = clampMissionAmount(randomType, targetAmount, { priceEach: producedItem ? producedItem.sellPrice : 0 });
            reward += Math.floor(targetAmount * (producedItem ? producedItem.sellPrice * 0.3 : 10)); 
            break;
        }
      }

      if (!randomType) return prev;

      const missionKey = `${randomType}-${targetId || 'none'}-${targetAmount}`;
      if (prev.missions.some(m => !m.isCompleted && `${m.type}-${m.targetId || 'none'}-${m.targetAmount}` === missionKey)) {
        return prev;
      }

      let description = "";
      const missionTemplate = tSection('HomePage.missions');
      const missionText = (key: 'harvest' | 'earn' | 'plant' | 'buy' | 'collect' | 'have' | 'upgrade' | 'craft') =>
        typeof missionTemplate === 'object' && typeof missionTemplate[key] === 'string' ? missionTemplate[key] as string : '';
      switch (randomType) {
        case 'HARVEST_CROP': description = missionText('harvest').replace('{amount}', String(targetAmount)).replace('{item}', itemNameForLogic); break;
        case 'EARN_CURRENCY': description = missionText('earn').replace('{amount}', String(targetAmount)).replace('{item}', itemNameForLogic); break;
        case 'PLANT_CROP': description = missionText('plant').replace('{amount}', String(targetAmount)).replace('{item}', itemNameForLogic); break;
        case 'BUY_ANIMAL': description = missionText('buy').replace('{amount}', String(targetAmount)).replace('{item}', itemNameForLogic); break;
        case 'COLLECT_ANIMAL_PRODUCT': description = missionText('collect').replace('{amount}', String(targetAmount)).replace('{item}', itemNameForLogic); break;
        case 'HAVE_CURRENCY': description = missionText('have').replace('{amount}', String(targetAmount)).replace('{item}', itemNameForLogic); break;
        case 'UPGRADE_FIELDS': description = missionText('upgrade').replace('{amount}', String(targetAmount)).replace('{item}', itemNameForLogic); break;
        case 'CRAFT_ITEM': description = missionText('craft').replace('{amount}', String(targetAmount)).replace('{item}', itemNameForLogic); break;
        default: description = `Complete the task: ${randomType} ${targetAmount}`;
      }

      if (description.length > 80) {
        description = description.substring(0, 77) + "...";
      }

      const newMission: Mission = {
          id: crypto.randomUUID(),
          description: description,
          type: randomType,
          targetId,
          targetAmount,
          currentAmount: randomType === 'HAVE_CURRENCY' && prev.currency !== undefined ? Math.min(prev.currency, targetAmount) : 0,
          reward: Math.floor(reward),
          isCompleted: false,
      };
      return { ...prev, missions: [...prev.missions, newMission] };
    });
  }, [getAvailableCrops, getAvailableAnimals, getAvailableAnimalProducts, getAvailableRecipes, getAllSellableItems]);

  useEffect(() => {
    if (!gameState || !gameState.fields || !gameState.animalPens || !gameState.missions || isGameLoading) return;

    if ((gameState.fields.length > 0 || gameState.animalPens.length > 0)) {
      // Conta como "ativa" a missão por fazer (pronta-a-reclamar não ocupa lugar).
      const activeMissionsCount = gameState.missions.filter(m => !m.isCompleted && m.currentAmount < m.targetAmount).length;
      if (activeMissionsCount < MAX_ACTIVE_MISSIONS) {
        for(let i = activeMissionsCount; i < MAX_ACTIVE_MISSIONS; i++) {
            generateNewMission();
        }
      }
    }
  }, [gameState, generateNewMission, isGameLoading]);


  const handlePlantRequest = (fieldId: string) => {
    setPlantingFieldId(fieldId);
    setIsPlanting(true);
  };

  const handlePlantConfirm = (cropId: string) => {
    let localToastMessageConfig: Toast | null = null;
    if (!plantingFieldId || !gameState) {
      localToastMessageConfig = { title: t_general('error'), description: t('HomePage.errors.invalidPlantField'), variant: "destructive" };
      setIsPlanting(false);
      setPlantingFieldId(null);
      if(localToastMessageConfig) setToastConfig(localToastMessageConfig);
      return;
    }

    const crop = getAvailableCrops().find(c => c.id === cropId);
    const field = gameState.fields.find(f => f.id === plantingFieldId);

    if (!crop || !field || gameState.currency < crop.seedCost || crop.minLevel > gameState.level) {
      let desc = t('HomePage.errors.cannotPlantDefault');
      if (crop && crop.minLevel > gameState.level) {
        desc = t('HomePage.errors.levelTooLowForCrop', {level: crop.minLevel, cropName: crop.name});
      } else if (crop && gameState.currency < crop.seedCost) {
        desc = t('HomePage.errors.insufficientCurrencyForSeeds', {cropName: crop.name});
      }
      localToastMessageConfig = { title: t('HomePage.errors.cannotPlantTitle'), description: desc, variant: "destructive" };
    } else {
      const plantActionTime = Date.now();
      const baseGrowthTime = crop.growthTime;
      const effectiveGrowthTime = upgradeFieldTime(baseGrowthTime, field.upgradeLevel);
      const calculatedHarvestReadyTime = plantActionTime + effectiveGrowthTime;

      setGameState(prev => {
        if (!prev) return null;
        const newFields = prev.fields.map(f =>
          f.id === plantingFieldId
            ? { ...f, cropId, plantTime: plantActionTime, harvestReadyTime: calculatedHarvestReadyTime }
            : f
        );
        return {
          ...prev,
          currency: prev.currency - crop.seedCost,
          fields: newFields,
        };
      });
      updateMissionProgress('PLANT_CROP', 1, { targetId: cropId });
      gainXP(XP_FOR_PLANT_ACTION);
      localToastMessageConfig = { title: t('HomePage.plantStarted.title'), description: t('HomePage.plantStarted.description', {cropName: crop.name}), className: "bg-primary text-primary-foreground" };
      playPlantSound();
    }

    setIsPlanting(false);
    setPlantingFieldId(null);
    if(localToastMessageConfig) setToastConfig(localToastMessageConfig);
  };

  const handleReplant = (fieldId: string) => {
    let localToastMessageConfig: Toast | null = null;
    if (!gameState) {
      localToastMessageConfig = { title: t_general('error'), description: t('HomePage.errors.gameStateNotFound'), variant: "destructive" };
      if(localToastMessageConfig) setToastConfig(localToastMessageConfig);
      return;
    }

    const field = gameState.fields.find(f => f.id === fieldId);
    if (!field || !field.cropId) {
      localToastMessageConfig = { title: t('HomePage.errors.replantErrorTitle'), description: t('HomePage.errors.invalidFieldForReplant'), variant: "destructive" };
    } else {
      const crop = getAvailableCrops().find(c => c.id === field.cropId);
      if (!crop || gameState.currency < crop.seedCost || crop.minLevel > gameState.level) {
        let desc = t('HomePage.errors.cannotReplantDefault');
        if (crop && crop.minLevel > gameState.level) {
            desc = t('HomePage.errors.levelTooLowForReplant', {level: crop.minLevel, cropName: crop.name});
        } else if (crop && gameState.currency < crop.seedCost) {
            desc = t('HomePage.errors.insufficientCurrencyForReplant', {cropName: crop.name});
        }
        localToastMessageConfig = { title: t('HomePage.errors.cannotReplantTitle'), description: desc, variant: "destructive" };
      } else {
        const plantActionTime = Date.now();
        const baseGrowthTime = crop.growthTime;
        const effectiveGrowthTime = upgradeFieldTime(baseGrowthTime, field.upgradeLevel);
        const calculatedHarvestReadyTime = plantActionTime + effectiveGrowthTime;

        setGameState(prev => {
            if (!prev) return null;
            const newFields = prev.fields.map(f =>
            f.id === fieldId
                ? { ...f, plantTime: plantActionTime, harvestReadyTime: calculatedHarvestReadyTime }
                : f
            );
            return {
            ...prev,
            currency: prev.currency - crop.seedCost,
            fields: newFields,
            };
        });
        updateMissionProgress('PLANT_CROP', 1, { targetId: crop.id });
        gainXP(XP_FOR_PLANT_ACTION);
        localToastMessageConfig = { title: t('HomePage.replantStarted.title'), description: t('HomePage.replantStarted.description', {cropName: crop.name}), className: "bg-primary text-primary-foreground" };
        playPlantSound();
      }
    }
    if(localToastMessageConfig) setToastConfig(localToastMessageConfig);
  };

  const handleHarvest = (fieldId: string) => {
    let localToastMessageConfig: Toast | null = null;
    if (!gameState) {
      localToastMessageConfig = { title: t_general('error'), description: t('HomePage.errors.gameStateNotFound'), variant: "destructive" };
      if(localToastMessageConfig) setToastConfig(localToastMessageConfig);
      return;
    }

    const field = gameState.fields.find(f => f.id === fieldId);
    if (!field || !field.cropId) {
      localToastMessageConfig = { title: t('HomePage.errors.harvestErrorTitle'), description: t('HomePage.errors.invalidFieldForHarvest'), variant: "destructive" };
    } else {
      const crop = getAvailableCrops().find(c => c.id === field.cropId);
      if (!crop) {
         localToastMessageConfig = { title: t_general('error'), description: t('HomePage.errors.cropNotFound'), variant: "destructive" };
      } else {
        const actualHarvestYield = upgradeYield(crop.harvestYield, field.upgradeLevel);
        const inventoryItemId = crop.productId || crop.id;
        const harvestedItemDetails = getAllSellableItems().find(item => item.id === inventoryItemId);
        const harvestedItemName = harvestedItemDetails ? harvestedItemDetails.name : crop.name;

        setGameState(prev => {
          if (!prev) return null;
          return {
            ...prev,
            inventory: {
              ...prev.inventory,
              [inventoryItemId]: (prev.inventory[inventoryItemId] || 0) + actualHarvestYield,
            },
            fields: prev.fields.map(f =>
              f.id === fieldId ? { ...f, plantTime: null, harvestReadyTime: null } : f // Keep cropId, reset times
            ),
          }
        });
        updateMissionProgress('HARVEST_CROP', actualHarvestYield, { targetId: inventoryItemId });
        updateAchievementProgress('HARVEST_CROP_TOTAL', actualHarvestYield);
        updateAchievementProgress('HARVEST_SPECIFIC_CROP', actualHarvestYield, { targetId: inventoryItemId });
        gainXP(XP_FOR_HARVEST_ACTION * actualHarvestYield);
        trackStats({ harvested: actualHarvestYield });
        playHarvestSound();
        localToastMessageConfig = { title: t('HomePage.harvestSuccess.title'), description: t('HomePage.harvestSuccess.description', {amount: actualHarvestYield, itemName: harvestedItemName}), className: "bg-accent text-accent-foreground animate-subtle-pop" };
      }
    }
    if(localToastMessageConfig) setToastConfig(localToastMessageConfig);
  };

  const handleRequestBuyAnimal = (penId: string) => {
    setBuyingAnimalPenId(penId);
    setIsBuyingAnimal(true);
  };

  const handleConfirmBuyAnimal = (animalTypeId: string) => {
    let localToastMessageConfig: Toast | null = null;
    if (!buyingAnimalPenId || !gameState) {
       localToastMessageConfig = { title: t_general('error'), description: t('HomePage.errors.invalidPenId'), variant: "destructive" };
       setIsBuyingAnimal(false);
       setBuyingAnimalPenId(null);
       if(localToastMessageConfig) setToastConfig(localToastMessageConfig);
       return;
    }

    const animalType = getAvailableAnimals().find(a => a.id === animalTypeId);
    const pen = gameState.animalPens.find(p => p.id === buyingAnimalPenId);

    if (!animalType || !pen || gameState.currency < animalType.cost || animalType.minLevel > gameState.level) {
      let desc = t('HomePage.errors.cannotBuyAnimalDefault');
      if (animalType && animalType.minLevel > gameState.level) {
        desc = t('HomePage.errors.levelTooLowForAnimal', {level: animalType.minLevel, animalName: animalType.name});
      } else if (animalType && gameState.currency < animalType.cost) {
        desc = t('HomePage.errors.insufficientCurrencyForAnimal', {animalName: animalType.name});
      }
      localToastMessageConfig = { title: t('HomePage.errors.cannotBuyAnimalTitle'), description: desc, variant: "destructive" };
    } else {
      const animalPlacedTime = Date.now();
      const baseProductionTime = animalType.productionTime;
      const effectiveProductionTime = upgradePenTime(baseProductionTime, pen.upgradeLevel);
      const calculatedProductReadyTime = effectiveProductionTime > 0 ? animalPlacedTime + effectiveProductionTime : null;


      setGameState(prev => {
        if (!prev) return null;
        const newPens = prev.animalPens.map(p =>
          p.id === buyingAnimalPenId
            ? { ...p, animalTypeId, animalPlacedTime: animalPlacedTime, productReadyTime: calculatedProductReadyTime }
            : p
        );
        return {
          ...prev,
          currency: prev.currency - animalType.cost,
          animalPens: newPens,
        }
      });
      updateMissionProgress('BUY_ANIMAL', 1, { targetId: animalTypeId });
      updateAchievementProgress('BUY_SPECIFIC_ANIMAL', 1, { targetId: animalTypeId });
      gainXP(XP_FOR_BUYING_ANIMAL);
      localToastMessageConfig = { title: t('HomePage.animalBought.title'), description: t('HomePage.animalBought.description', {animalName: animalType.name}), className: "bg-primary text-primary-foreground" };
      playBuySound();
    }

    setIsBuyingAnimal(false);
    setBuyingAnimalPenId(null);
    if(localToastMessageConfig) setToastConfig(localToastMessageConfig);
  };

  const handleCollectProduct = (penId: string) => {
    let localToastMessageConfig: Toast | null = null;
    if (!gameState) {
      localToastMessageConfig = { title: t_general('error'), description: t('HomePage.errors.gameStateNotFound'), variant: "destructive" };
      if(localToastMessageConfig) setToastConfig(localToastMessageConfig);
      return;
    }

    const pen = gameState.animalPens.find(p => p.id === penId);
    if (!pen || !pen.animalTypeId ) {
       localToastMessageConfig = { title: t('HomePage.errors.collectErrorTitle'), description: t('HomePage.errors.invalidPenOrAnimal'), variant: "destructive" };
    } else {
      const animalType = getAvailableAnimals().find(a => a.id === pen.animalTypeId);
      if (!animalType || !animalType.productId || animalType.productionTime <= 0) {
        localToastMessageConfig = { title: t_general('error'), description: t('HomePage.errors.animalTypeNotFound'), variant: "destructive" };
      } else {
        const product = getAvailableAnimalProducts().find(p => p.id === animalType.productId);
        if (!product) {
          localToastMessageConfig = { title: t_general('error'), description: t('HomePage.errors.productNotFound'), variant: "destructive" };
        } else {
          const actualProductYield = upgradeYield(animalType.productYield, pen.upgradeLevel);
          const newAnimalPlacedTime = Date.now();
          const baseProductionTime = animalType.productionTime;
          const effectiveProductionTime = upgradePenTime(baseProductionTime, pen.upgradeLevel);
          const newProductReadyTime = newAnimalPlacedTime + effectiveProductionTime;


          setGameState(prev => {
            if (!prev) return null;
            return {
              ...prev,
              inventory: {
                ...prev.inventory,
                [product.id]: (prev.inventory[product.id] || 0) + actualProductYield,
              },
              animalPens: prev.animalPens.map(p =>
                p.id === penId ? { ...p, animalPlacedTime: newAnimalPlacedTime, productReadyTime: newProductReadyTime }
                : p
              ),
            }
          });
          updateMissionProgress('COLLECT_ANIMAL_PRODUCT', actualProductYield, { targetId: product.id });
          updateAchievementProgress('COLLECT_PRODUCT_TOTAL', actualProductYield);
          updateAchievementProgress('COLLECT_SPECIFIC_PRODUCT', actualProductYield, { targetId: product.id });
          gainXP(XP_FOR_COLLECTING_PRODUCT * actualProductYield);
          trackStats({ collected: actualProductYield });
          localToastMessageConfig = { title: t('HomePage.productCollected.title'), description: t('HomePage.productCollected.description', {amount: actualProductYield, productName: product.name}), className: "bg-accent text-accent-foreground animate-subtle-pop" };
        playCollectSound();
        }
      }
    }
    if(localToastMessageConfig) setToastConfig(localToastMessageConfig);
  };

  const handleButcherAnimal = (penId: string) => {
    let localToastMessageConfig: Toast | null = null;
    if (!gameState) {
      localToastMessageConfig = { title: t_general('error'), description: t('HomePage.errors.gameStateNotFound'), variant: "destructive" };
      if(localToastMessageConfig) setToastConfig(localToastMessageConfig);
      return;
    }

    const pen = gameState.animalPens.find(p => p.id === penId);
    if (!pen || !pen.animalTypeId) {
      localToastMessageConfig = { title: t('HomePage.errors.butcherFailedTitle'), description: t('HomePage.errors.emptyPen'), variant: "destructive" };
    } else {
      const animalType = getAvailableAnimals().find(a => a.id === pen.animalTypeId);
      if (!animalType || !animalType.meatProductId || animalType.butcherYield <= 0) {
        localToastMessageConfig = { title: t('HomePage.errors.butcherFailedTitle'), description: t('HomePage.errors.animalNotForMeat'), variant: "destructive" };
      } else {
        const meatProduct = getAllSellableItems().find(item => item.id === animalType.meatProductId);
        if (!meatProduct) {
             localToastMessageConfig = { title: t_general('error'), description: t('HomePage.errors.meatProductNotFound'), variant: "destructive" };
        } else {
            const actualButcherYield = upgradeYield(animalType.butcherYield, pen.upgradeLevel);
            const userConfirmed = window.confirm(t('AnimalPenCard.butcherConfirm', { amount: actualButcherYield, meat: meatProduct.name }));
            if (!userConfirmed) return;
            setGameState(prev => {
                if (!prev) return null;
                const newInventory = {
                ...prev.inventory,
                [animalType.meatProductId!]: (prev.inventory[animalType.meatProductId!] || 0) + actualButcherYield,
                };
                const newPens = prev.animalPens.map(p =>
                p.id === penId
                    ? { ...p, animalTypeId: null, animalPlacedTime: null, productReadyTime: null }
                    : p
                );
                return {
                ...prev,
                inventory: newInventory,
                animalPens: newPens,
                };
            });
            gainXP(XP_FOR_BUTCHERING_ANIMAL);
            updateMissionProgress('COLLECT_ANIMAL_PRODUCT', actualButcherYield, { targetId: animalType.meatProductId });
            updateAchievementProgress('COLLECT_SPECIFIC_PRODUCT', actualButcherYield, { targetId: animalType.meatProductId });
            updateAchievementProgress('COLLECT_PRODUCT_TOTAL', actualButcherYield);

            localToastMessageConfig = { title: t('HomePage.butcherSuccess.title'), description: t('HomePage.butcherSuccess.description', {amount: actualButcherYield, meatName: meatProduct.name}), className: "bg-primary text-primary-foreground" };
        }
      }
    }
    if(localToastMessageConfig) setToastConfig(localToastMessageConfig);
  };


  const handleSellItem = (itemId: string, amount: number) => {
    let localToastMessageConfig: Toast | null = null;
    if (!gameState) {
      localToastMessageConfig = { title: t_general('error'), description: t('HomePage.errors.gameStateNotFound'), variant: "destructive" };
      if(localToastMessageConfig) setToastConfig(localToastMessageConfig);
      return;
    }

    const item = getAllSellableItems().find(i => i.id === itemId) as SellableItem | undefined;
    if (!item || !gameState.inventory[itemId] || gameState.inventory[itemId] < amount || amount <= 0) {
       localToastMessageConfig = { title: t('HomePage.errors.sellFailedTitle'), description: t('HomePage.errors.invalidAmount'), variant: "destructive" };
    } else {
      const earnings = item.sellPrice * amount;
      setGameState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          currency: prev.currency + earnings,
          inventory: {
            ...prev.inventory,
            [itemId]: prev.inventory[itemId] - amount,
          },
        }
      });
      updateMissionProgress('EARN_CURRENCY', earnings);
      updateAchievementProgress('EARN_CURRENCY_TOTAL', earnings);
      trackStats({ earned: earnings });
      playCoinSound();
      localToastMessageConfig = { title: t('HomePage.sellSuccess.title'), description: t('HomePage.sellSuccess.description', {amount: amount, itemName: item.name, earnings: earnings}) };
    }
    if(localToastMessageConfig) setToastConfig(localToastMessageConfig);
  };

  const handleBuyField = () => {
    let localToastMessageConfig: Toast | null = null;
    if (!gameState || gameState.currency < gameState.nextFieldCost) {
      localToastMessageConfig = { title: t('HomePage.errors.buyFailedTitle'), description: t('HomePage.errors.insufficientCurrencyForField'), variant: "destructive" };
    } else {
      const newField: Field = {
        id: crypto.randomUUID(),
        cropId: null,
        plantTime: null,
        harvestReadyTime: null,
        upgradeLevel: 0,
        currentUpgradeCost: calculateNextUpgradeCost(BASE_FIELD_UPGRADE_COST, FIELD_UPGRADE_COST_MULTIPLIER, 0),
      };

      setGameState(prev => {
        if (!prev) return null;
        const newFields = [...prev.fields, newField];
        const newNextFieldCost = Math.floor(prev.nextFieldCost * FIELD_COST_MULTIPLIER);
        updateAchievementProgress('OWN_FIELDS_TOTAL', newFields.length);
        return {
          ...prev,
          currency: prev.currency - prev.nextFieldCost,
          fields: newFields,
          nextFieldCost: newNextFieldCost,
        }
      });
      updateMissionProgress('UPGRADE_FIELDS', 1);
      gainXP(XP_FOR_FIELD_PURCHASE);
      localToastMessageConfig = { title: t('HomePage.fieldBought.title'), description: t('HomePage.fieldBought.description'), className: "bg-primary text-primary-foreground" };
      playBuySound();
    }
    if(localToastMessageConfig) setToastConfig(localToastMessageConfig);
  };

  const handleBuyAnimalPen = () => {
    let localToastMessageConfig: Toast | null = null;
    if (!gameState || gameState.currency < gameState.nextAnimalPenCost) {
      localToastMessageConfig = { title: t('HomePage.errors.buyFailedTitle'), description: t('HomePage.errors.insufficientCurrencyForPen'), variant: "destructive" };
    } else {
      const newPen: AnimalPen = {
        id: crypto.randomUUID(),
        animalTypeId: null,
        animalPlacedTime: null,
        productReadyTime: null,
        upgradeLevel: 0,
        currentUpgradeCost: calculateNextUpgradeCost(BASE_ANIMAL_PEN_UPGRADE_COST, ANIMAL_PEN_UPGRADE_COST_MULTIPLIER, 0),
      };
      setGameState(prev => {
        if(!prev) return null;
        const newAnimalPens = [...prev.animalPens, newPen];
        const newNextAnimalPenCost = Math.floor(prev.nextAnimalPenCost * ANIMAL_PEN_COST_MULTIPLIER);
        updateAchievementProgress('OWN_PENS_TOTAL', newAnimalPens.length);
        return {
          ...prev,
          currency: prev.currency - prev.nextAnimalPenCost,
          animalPens: newAnimalPens,
          nextAnimalPenCost: newNextAnimalPenCost,
        }
      });
      updateMissionProgress('UPGRADE_FIELDS', 1);
      gainXP(XP_FOR_ANIMAL_PEN_PURCHASE);
      localToastMessageConfig = { title: t('HomePage.penBought.title'), description: t('HomePage.penBought.description'), className: "bg-primary text-primary-foreground" };
      playBuySound();
    }
    if(localToastMessageConfig) setToastConfig(localToastMessageConfig);
  };

  const handleUpgradeField = (fieldId: string) => {
    let toastMessageConfig: Toast | null = null;
    if (!gameState) {
      toastMessageConfig = { title: t_general('error'), description: t('HomePage.errors.gameStateNotFound'), variant: "destructive" };
      setToastConfig(toastMessageConfig);
      return;
    }

    const fieldToUpgrade = gameState.fields.find(f => f.id === fieldId);
    if (!fieldToUpgrade) {
      toastMessageConfig = { title: t('HomePage.errors.upgradeFailedTitle'), description: t('HomePage.errors.fieldNotFound'), variant: "destructive" };
      setToastConfig(toastMessageConfig);
      return;
    }
    if (fieldToUpgrade.upgradeLevel >= MAX_UPGRADE_LEVEL) {
      toastMessageConfig = { title: t('HomePage.errors.upgradeFailedTitle'), description: t('HomePage.errors.maxLevelReached'), variant: "destructive" };
      setToastConfig(toastMessageConfig);
      return;
    }
    if (!fieldToUpgrade.currentUpgradeCost || gameState.currency < fieldToUpgrade.currentUpgradeCost) {
      toastMessageConfig = { title: t('HomePage.errors.upgradeFailedTitle'), description: t('HomePage.errors.insufficientCurrencyForUpgrade', {cost: fieldToUpgrade.currentUpgradeCost}), variant: "destructive" };
      setToastConfig(toastMessageConfig);
      return;
    }

    const costOfUpgrade = fieldToUpgrade.currentUpgradeCost;
    const newLevel = fieldToUpgrade.upgradeLevel + 1;
    let newCalculatedHarvestReadyTime = fieldToUpgrade.harvestReadyTime;

    if (fieldToUpgrade.cropId && fieldToUpgrade.plantTime) {
      const cropDetails = getAvailableCrops().find(c => c.id === fieldToUpgrade.cropId);
      if (cropDetails) {
          const baseGrowthTime = cropDetails.growthTime;
          const newEffectiveGrowthTime = upgradeFieldTime(baseGrowthTime, newLevel);
          newCalculatedHarvestReadyTime = fieldToUpgrade.plantTime + newEffectiveGrowthTime;
      }
    }

    setGameState(prev => {
      if (!prev) return prev;
      const fieldIndex = prev.fields.findIndex(f => f.id === fieldId);
      if (fieldIndex === -1) {
        return prev;
      }

      const current = prev.fields[fieldIndex];
      if (current.upgradeLevel >= MAX_UPGRADE_LEVEL || !current.currentUpgradeCost || prev.currency < current.currentUpgradeCost) {
        return prev;
      }

      const updatedFields = [...prev.fields];
      updatedFields[fieldIndex] = {
        ...current,
        upgradeLevel: newLevel,
        currentUpgradeCost: newLevel < MAX_UPGRADE_LEVEL ? calculateNextUpgradeCost(BASE_FIELD_UPGRADE_COST, FIELD_UPGRADE_COST_MULTIPLIER, newLevel) : undefined,
        harvestReadyTime: newCalculatedHarvestReadyTime,
      };

      return {
        ...prev,
        currency: prev.currency - costOfUpgrade,
        fields: updatedFields,
      };
    });

    updateMissionProgress('UPGRADE_FIELDS', 1);
    updateAchievementProgress('UPGRADE_BUILDINGS_TOTAL', 1);
    gainXP(XP_FOR_FIELD_UPGRADE);

    toastMessageConfig = {
      title: t('HomePage.fieldUpgraded.title'),
      description: t('HomePage.fieldUpgraded.description', {fieldId: fieldId.substring(0,4), level: newLevel}),
      className: "bg-primary text-primary-foreground"
    };

    if (toastMessageConfig) {
      setToastConfig(toastMessageConfig);
      if (toastMessageConfig.variant !== 'destructive') playUpgradeSound();
    }
  };

  const handleUpgradeAnimalPen = (penId: string) => {
    let toastMessageConfig: Toast | null = null;
    if (!gameState) {
      toastMessageConfig = { title: t_general('error'), description: t('HomePage.errors.gameStateNotFound'), variant: "destructive" };
      setToastConfig(toastMessageConfig);
      return;
    }

    const penToUpgrade = gameState.animalPens.find(p => p.id === penId);
    if (!penToUpgrade) {
      toastMessageConfig = { title: t('HomePage.errors.upgradeFailedTitle'), description: t('HomePage.errors.penNotFound'), variant: "destructive" };
      setToastConfig(toastMessageConfig);
      return;
    }
    if (penToUpgrade.upgradeLevel >= MAX_UPGRADE_LEVEL) {
      toastMessageConfig = { title: t('HomePage.errors.upgradeFailedTitle'), description: t('HomePage.errors.maxLevelReached'), variant: "destructive" };
      setToastConfig(toastMessageConfig);
      return;
    }
    if (!penToUpgrade.currentUpgradeCost || gameState.currency < penToUpgrade.currentUpgradeCost) {
      toastMessageConfig = { title: t('HomePage.errors.upgradeFailedTitle'), description: t('HomePage.errors.insufficientCurrencyForUpgrade', {cost: penToUpgrade.currentUpgradeCost}), variant: "destructive" };
      setToastConfig(toastMessageConfig);
      return;
    }

    const costOfUpgrade = penToUpgrade.currentUpgradeCost;
    const newLevel = penToUpgrade.upgradeLevel + 1;
    let newCalculatedProductReadyTime = penToUpgrade.productReadyTime;

    if (penToUpgrade.animalTypeId && penToUpgrade.animalPlacedTime) {
      const animalTypeDetails = getAvailableAnimals().find(a => a.id === penToUpgrade.animalTypeId);
      if (animalTypeDetails && animalTypeDetails.productionTime > 0) {
          const baseProductionTime = animalTypeDetails.productionTime;
          const newEffectiveProductionTime = upgradePenTime(baseProductionTime, newLevel);
          newCalculatedProductReadyTime = penToUpgrade.animalPlacedTime + newEffectiveProductionTime;
      } else {
          newCalculatedProductReadyTime = null;
      }
    }

    setGameState(prev => {
      if (!prev) return prev;
      const penIndex = prev.animalPens.findIndex(p => p.id === penId);
      if (penIndex === -1) {
        return prev;
      }

      const current = prev.animalPens[penIndex];
      if (current.upgradeLevel >= MAX_UPGRADE_LEVEL || !current.currentUpgradeCost || prev.currency < current.currentUpgradeCost) {
        return prev;
      }

      const updatedPens = [...prev.animalPens];
      updatedPens[penIndex] = {
        ...current,
        upgradeLevel: newLevel,
        currentUpgradeCost: newLevel < MAX_UPGRADE_LEVEL ? calculateNextUpgradeCost(BASE_ANIMAL_PEN_UPGRADE_COST, ANIMAL_PEN_UPGRADE_COST_MULTIPLIER, newLevel) : undefined,
        productReadyTime: newCalculatedProductReadyTime,
      };

      return {
        ...prev,
        currency: prev.currency - costOfUpgrade,
        animalPens: updatedPens,
      };
    });

    updateMissionProgress('UPGRADE_FIELDS', 1);
    updateAchievementProgress('UPGRADE_BUILDINGS_TOTAL', 1);
    gainXP(XP_FOR_ANIMAL_PEN_UPGRADE);

    toastMessageConfig = {
      title: t('HomePage.penUpgraded.title'),
      description: t('HomePage.penUpgraded.description', {penId: penId.substring(0,4), level: newLevel}),
      className: "bg-primary text-primary-foreground"
    };

    if (toastMessageConfig) {
      setToastConfig(toastMessageConfig);
      if (toastMessageConfig.variant !== 'destructive') playUpgradeSound();
    }
  };


  const handleClaimMissionReward = (missionId: string) => {
    let localToastMessageConfig: Toast | null = null;
    if (!gameState) {
      localToastMessageConfig = { title: t_general('error'), description: t('HomePage.errors.gameStateNotFound'), variant: "destructive" };
      if(localToastMessageConfig) setToastConfig(localToastMessageConfig);
      return;
    }
    const mission = gameState.missions.find(m => m.id === missionId);
    if (!mission || mission.isCompleted || mission.currentAmount < mission.targetAmount) {
      return;
    }

    const xpFromMission = XP_FOR_MISSION_COMPLETION_BASE + Math.floor(mission.reward * 0.1);

    setGameState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        currency: prev.currency + mission.reward,
        missions: prev.missions.map(m => (m.id === missionId ? { ...m, isCompleted: true } : m)),
      }
    });

    updateAchievementProgress('EARN_CURRENCY_TOTAL', mission.reward);
    updateAchievementProgress('COMPLETE_MISSIONS_TOTAL', 1);
    trackStats({ earned: mission.reward });
    playCoinSound();

    localToastMessageConfig = { title: t('HomePage.rewardCollected.title'), description: t('HomePage.rewardCollected.description', {reward: mission.reward, xp: xpFromMission}), className: "bg-primary text-primary-foreground" };

    if (xpFromMission > 0) {
      gainXP(xpFromMission);
    }

    setNotifiedReadyMissions(prev => {
      const newSet = new Set(prev);
      newSet.delete(missionId);
      return newSet;
    });

     setTimeout(() => {
        setGameState(prev => {
          if (!prev) return null;
            return {
                ...prev,
                missions: prev.missions.filter(m => m.id !== missionId)
            }
        });
        if (gameStateRef.current && gameStateRef.current.missions.filter(m => !m.isCompleted).length < MAX_ACTIVE_MISSIONS) {
            generateNewMission();
        }
    }, 500);

    if(localToastMessageConfig){
        setToastConfig(localToastMessageConfig);
    }
  };


  const handleClaimAchievementReward = (achievementId: string) => {
    let localToastMessageConfig: Toast | null = null;
    if (!gameState) {
      localToastMessageConfig = { title: t_general('error'), description: t('HomePage.errors.gameStateNotFound'), variant: "destructive" };
      if(localToastMessageConfig) setToastConfig(localToastMessageConfig);
      return;
    }

    const achievementProgress = gameState.achievements.find(ap => ap.achievementId === achievementId);
    const achievementConfig = getAvailableAchievements().find(ac => ac.id === achievementId);

    if (!achievementProgress || !achievementConfig || !achievementProgress.isCompleted || achievementProgress.isClaimed) {
      localToastMessageConfig = { title: t_general('error'), description: t('HomePage.errors.achievementNotReady'), variant: "destructive" };
      if(localToastMessageConfig) setToastConfig(localToastMessageConfig);
      return;
    }

    setGameState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        currency: prev.currency + achievementConfig.rewardCurrency,
        achievements: prev.achievements.map(ap =>
          ap.achievementId === achievementId ? { ...ap, isClaimed: true } : ap
        ),
      }
    });

    if (achievementConfig.rewardXp > 0) {
      gainXP(achievementConfig.rewardXp);
    }
    trackStats({ earned: achievementConfig.rewardCurrency });
    playCoinSound();

    localToastMessageConfig = { title: t('HomePage.achievementClaimed.title'), description: t('HomePage.achievementClaimed.description', {currency: achievementConfig.rewardCurrency, xp: achievementConfig.rewardXp, achievementTitle: achievementConfig.title}), className: "bg-primary text-primary-foreground" };

    setNotifiedReadyAchievements(prev => {
      const newSet = new Set(prev);
      newSet.delete(achievementId);
      return newSet;
    });

    if(localToastMessageConfig) setToastConfig(localToastMessageConfig);
  };

  const handleDeliverContract = (contractId: string) => {
    const contract = gameState?.contracts.find(c => c.id === contractId);
    if (!gameState || !contract || contract.expiresAt <= Date.now()) return;

    if (!canFulfillContract(gameState.inventory, contract.requirements)) {
      setToastConfig({ title: t_general('error'), description: t('HomePage.errors.invalidAmount'), variant: "destructive" });
      return;
    }

    setGameState(prev => {
      if (!prev) return prev;
      const target = prev.contracts.find(c => c.id === contractId);
      if (!target || target.expiresAt <= Date.now()) return prev;
      const newInventory = { ...prev.inventory };
      for (const req of target.requirements) {
        newInventory[req.itemId] = (newInventory[req.itemId] || 0) - req.quantity;
        if (newInventory[req.itemId] <= 0) {
          delete newInventory[req.itemId];
        }
      }
      return {
        ...prev,
        currency: prev.currency + target.rewardCoins,
        inventory: newInventory,
        contracts: prev.contracts.filter(c => c.id !== contractId),
      };
    });

    gainXP(contract.rewardXp);
    trackStats({ earned: contract.rewardCoins, contractsDone: 1 });
    playCoinSound();
    setToastConfig({ title: t('HomePage.contractFulfilled.title'), description: t('HomePage.contractFulfilled.description', { reward: contract.rewardCoins }), className: "bg-primary text-primary-foreground" });
  };

  const handleTogglePinContract = (contractId: string) => {
    setGameState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        contracts: prev.contracts.map(c => (c.id === contractId ? { ...c, pinned: !c.pinned } : c)),
      };
    });
  };

  const handleToggleMute = useCallback(() => {
    setMuted(prev => {
      const next = !prev;
      setSoundMuted(next);
      return next;
    });
  }, []);

  const handleClaimAllMissions = () => {
    if (!gameState) return;
    const claimable = gameState.missions.filter(m => !m.isCompleted && m.currentAmount >= m.targetAmount);
    if (claimable.length === 0) return;

    const ids = new Set(claimable.map(m => m.id));
    const totalCoins = claimable.reduce((sum, m) => sum + m.reward, 0);
    const totalXp = claimable.reduce((sum, m) => sum + XP_FOR_MISSION_COMPLETION_BASE + Math.floor(m.reward * 0.1), 0);

    setGameState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        currency: prev.currency + totalCoins,
        missions: prev.missions.map(m => (ids.has(m.id) && !m.isCompleted && m.currentAmount >= m.targetAmount ? { ...m, isCompleted: true } : m)),
      }
    });

    updateAchievementProgress('EARN_CURRENCY_TOTAL', totalCoins);
    updateAchievementProgress('COMPLETE_MISSIONS_TOTAL', claimable.length);
    if (totalXp > 0) gainXP(totalXp);
    trackStats({ earned: totalCoins });
    playCoinSound();
    setToastConfig({ title: t('HomePage.rewardCollected.title'), description: t('HomePage.rewardCollected.description', { reward: totalCoins, xp: totalXp }), className: "bg-primary text-primary-foreground" });

    setNotifiedReadyMissions(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.delete(id));
      return next;
    });

    setTimeout(() => {
      setGameState(prev => {
        if (!prev) return null;
        return { ...prev, missions: prev.missions.filter(m => !ids.has(m.id)) };
      });
    }, 500);
  };

  const handleClaimAllAchievements = () => {
    if (!gameState) return;
    const configs = getAvailableAchievements();
    const claimable = gameState.achievements.filter(p => {
      const config = configs.find(c => c.id === p.achievementId);
      return !!config && p.isCompleted && !p.isClaimed;
    });
    if (claimable.length === 0) return;

    const ids = new Set(claimable.map(p => p.achievementId));
    let totalCoins = 0;
    let totalXp = 0;
    for (const progress of claimable) {
      const config = configs.find(c => c.id === progress.achievementId);
      if (!config) continue;
      totalCoins += config.rewardCurrency;
      totalXp += config.rewardXp;
    }

    setGameState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        currency: prev.currency + totalCoins,
        achievements: prev.achievements.map(ap => (ids.has(ap.achievementId) && ap.isCompleted && !ap.isClaimed ? { ...ap, isClaimed: true } : ap)),
      }
    });

    if (totalXp > 0) gainXP(totalXp);
    trackStats({ earned: totalCoins });
    playCoinSound();
    setToastConfig({ title: t('HomePage.rewardCollected.title'), description: t('HomePage.rewardCollected.description', { reward: totalCoins, xp: totalXp }), className: "bg-primary text-primary-foreground" });

    setNotifiedReadyAchievements(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.delete(id));
      return next;
    });
  };

  const handleCraftItem = (recipeId: string) => {
    if (!gameState) {
      setToastConfig({ title: t_general('error'), description: t('HomePage.errors.gameStateNotFound'), variant: "destructive" });
      return;
    }

    const recipe = getAvailableRecipes().find(r => r.id === recipeId);
    if (!recipe) {
      setToastConfig({ title: t('HomePage.errors.craftingErrorTitle'), description: t('HomePage.errors.recipeNotFound'), variant: "destructive" });
      return;
    }

    if (recipe.minLevelRequired && gameState.level < recipe.minLevelRequired) {
      setToastConfig({ title: t('HomePage.errors.levelTooLowTitle'), description: t('HomePage.errors.levelTooLowToCraft', {level: recipe.minLevelRequired, recipeName: recipe.name}), variant: "destructive" });
      return;
    }

    const newInventory = { ...gameState.inventory };
    let canCraft = true;
    const itemsToDeduct: { itemId: string, quantity: number }[] = [];

    for (const ingredient of recipe.ingredients) {
      let foundIngredientForSlot = false;
      let itemToUseForSlot = ingredient.itemId;

      if (recipe.id === 'recipe_omelette' && ingredient.itemId === 'egg') {
        if ((newInventory['egg'] || 0) >= ingredient.quantity) {
          itemToUseForSlot = 'egg';
          foundIngredientForSlot = true;
        } else if ((newInventory['duck_egg'] || 0) >= ingredient.quantity) {
          itemToUseForSlot = 'duck_egg';
          foundIngredientForSlot = true;
        }
      } else if (recipe.id === 'recipe_cheese' && ingredient.itemId === 'milk') {
        if ((newInventory['milk'] || 0) >= ingredient.quantity) {
          itemToUseForSlot = 'milk';
          foundIngredientForSlot = true;
        } else if ((newInventory['goat_milk'] || 0) >= ingredient.quantity) {
          itemToUseForSlot = 'goat_milk';
          foundIngredientForSlot = true;
        }
      } else {
        if ((newInventory[ingredient.itemId] || 0) >= ingredient.quantity) {
          foundIngredientForSlot = true;
        }
      }

      if (foundIngredientForSlot) {
        itemsToDeduct.push({ itemId: itemToUseForSlot, quantity: ingredient.quantity });
      } else {
        canCraft = false;
        break;
      }
    }

    if (!canCraft) {
      setToastConfig({ title: t('HomePage.errors.insufficientIngredientsTitle'), description: t('HomePage.errors.insufficientIngredientsToCraft', {recipeName: recipe.name}), variant: "destructive" });
      return;
    }
    
    for (const itemToDeduct of itemsToDeduct) {
      newInventory[itemToDeduct.itemId] = (newInventory[itemToDeduct.itemId] || 0) - itemToDeduct.quantity;
      if (newInventory[itemToDeduct.itemId] === 0) {
        delete newInventory[itemToDeduct.itemId];
      }
    }
    
    newInventory[recipe.producesItemId] = (newInventory[recipe.producesItemId] || 0) + recipe.producesQuantity;
    const craftedItemDetails = getAllSellableItems().find(item => item.id === recipe.producesItemId);

    setGameState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        inventory: newInventory,
      };
    });

    if (XP_FOR_CRAFTING_ITEM > 0) {
      gainXP(XP_FOR_CRAFTING_ITEM);
    }

    updateMissionProgress('CRAFT_ITEM', recipe.producesQuantity, { targetId: recipe.producesItemId });
    updateAchievementProgress('CRAFT_ITEM_TOTAL', recipe.producesQuantity);
    trackStats({ crafted: recipe.producesQuantity });


    setToastConfig({
      title: t('HomePage.itemCrafted.title'),
      description: t('HomePage.itemCrafted.description', {quantity: recipe.producesQuantity, itemName: craftedItemDetails ? craftedItemDetails.name : recipe.name, xp: XP_FOR_CRAFTING_ITEM}),
      className: "bg-primary text-primary-foreground",
    });
    playCraftSound();
  };

  const handleCollectWater = () => {
    setGameState(prev => {
      if (!prev) return null;

      if (prev.lastWaterCollectionTime && (Date.now() - prev.lastWaterCollectionTime) < WATER_COLLECTION_COOLDOWN) {
        setToastConfig({
          title: t('HomePage.wait.title'),
          description: t('HomePage.wait.description'),
          variant: "default",
          duration: 1500,
        });
        return prev;
      }

      const newInventory = { ...prev.inventory };
      newInventory['water'] = (newInventory['water'] || 0) + 1;

      setToastConfig({
        title: t('HomePage.waterCollected.title'),
        description: t('HomePage.waterCollected.description'),
        className: "bg-primary text-primary-foreground",
        duration: 2000,
      });
      playWaterSound();

      return {
        ...prev,
        inventory: newInventory,
        lastWaterCollectionTime: Date.now(),
      };
    });
  };

  const handleUseWateringCan = (fieldId: string) => {
    if (!gameState) {
      setToastConfig({ title: t_general('error'), description: t('HomePage.errors.gameStateNotFound'), variant: "destructive" });
      return;
    }

    if ((gameState.inventory['watering_can'] || 0) <= 0) {
      setToastConfig({ title: t('HomePage.errors.noItemTitle'), description: t('HomePage.errors.noItemToUse'), variant: "destructive" });
      return;
    }

    const field = gameState.fields.find(f => f.id === fieldId);
    const crop = field?.cropId ? getAvailableCrops().find(c => c.id === field.cropId) : null;
    if (!field || !crop || !field.plantTime || !field.harvestReadyTime || field.harvestReadyTime <= Date.now()) {
      setToastConfig({ title: t('HomePage.errors.notApplicableTitle'), description: t('HomePage.errors.itemNotOnGrowingCrops'), variant: "destructive" });
      return;
    }

    const wateringCan = AVAILABLE_CRAFTABLE_ITEMS.find(item => item.id === 'watering_can');
    const effect = wateringCan?.effect;
    const effectiveGrowthTime = upgradeFieldTime(crop.growthTime, field.upgradeLevel);
    const reductionMs = effect?.valueType === 'fixed_seconds'
      ? Math.floor((effect.value > 0 ? effect.value : 0) * 1000)
      : wateringCanReductionMs(effectiveGrowthTime, effect?.value ?? 25);
    const newHarvestReadyTime = Math.max(Date.now(), field.harvestReadyTime - reductionMs);

    if (newHarvestReadyTime === field.harvestReadyTime) {
      setToastConfig({ title: t('HomePage.errors.noEffectTitle'), description: t('HomePage.errors.itemHadNoEffect'), variant: "default" });
      return;
    }

    setGameState(prev => {
      if (!prev) return null;
      const newInventory = { ...prev.inventory };
      newInventory['watering_can'] = (newInventory['watering_can'] || 1) - 1;
      if (newInventory['watering_can'] <= 0) {
        delete newInventory['watering_can'];
      }
      return {
        ...prev,
        fields: prev.fields.map(f =>
          f.id === fieldId ? { ...f, harvestReadyTime: newHarvestReadyTime } : f
        ),
        inventory: newInventory,
      };
    });

    gainXP(XP_FOR_USING_CONSUMABLE);
    setToastConfig({
      title: t('HomePage.consumableUsed.title', { itemName: t_items('watering_can.name') }),
      description: t('HomePage.consumableUsed.description', { itemName: t_items('watering_can.name'), cropName: crop.name }),
      className: "bg-primary text-primary-foreground",
    });
    playWaterSound();
  };

  const handleBuyBait = () => {
    setGameState(prev => {
      if (!prev) return null;
      if (prev.currency < BAIT_COST_PER_PACK) {
        setToastConfig({ title: t('HomePage.errors.noCoinsTitle'), description: t('HomePage.errors.noCoinsForBait', {cost: BAIT_COST_PER_PACK}), variant: "destructive" });
        return prev;
      }
      const newInventory = { ...prev.inventory };
      newInventory[BAIT_ID] = (newInventory[BAIT_ID] || 0) + BAIT_PACK_SIZE;
      setToastConfig({ title: t('HomePage.baitBought.title'), description: t('HomePage.baitBought.description', {amount: BAIT_PACK_SIZE}), className: "bg-primary text-primary-foreground" });
      playBuySound();
      return {
        ...prev,
        currency: prev.currency - BAIT_COST_PER_PACK,
        inventory: newInventory,
      };
    });
  };

  const handleRefreshFishingGrid = useCallback((showToast: boolean = true) => {
    const newGrid = internalRefreshFishingGrid();
    setGameState(prev => {
        if (!prev) return null;
        return { ...prev, fishingGrid: newGrid };
    });

    if (showToast) {
        setToastConfig({ title: t('HomePage.fishingRefreshed.title'), description: t('HomePage.fishingRefreshed.description'), className: "bg-secondary text-secondary-foreground" });
    }
  }, [internalRefreshFishingGrid, setToastConfig]);
  

  const handleFishCellClick = (row: number, col: number) => {
    if (!gameState || !gameState.fishingGrid) return;

    const currentBait = gameState.inventory[BAIT_ID] || 0;
    if (currentBait <= 0) {
      setToastConfig({ title: t('HomePage.errors.noBaitTitle'), description: t('HomePage.errors.noBaitDescription'), variant: "destructive" });
      return;
    }

    const currentCellState = gameState.fishingGrid[row][col];
    if (currentCellState === 'CLICKED_EMPTY') {
      return;
    }

    const newInventory: Inventory = { ...gameState.inventory, [BAIT_ID]: currentBait - 1 };
    const newFishingGrid = gameState.fishingGrid.map(r => [...r]);
    let fishCaughtThisClick: SellableItem | null = null;

    if (currentCellState && currentCellState !== 'CLICKED_EMPTY') {
      const fishDetails = getAvailableFish().find(f => f.id === currentCellState);
      if (fishDetails) {
        fishCaughtThisClick = fishDetails;
        newInventory[currentCellState] = (newInventory[currentCellState] || 0) + 1;
      }
    }

    newFishingGrid[row][col] = 'CLICKED_EMPTY';

    setGameState(prev => {
      if (!prev || !prev.fishingGrid) return null;
      return { ...prev, inventory: newInventory, fishingGrid: newFishingGrid };
    });

    if (fishCaughtThisClick) {
      if (XP_FOR_FISHING_ACTION > 0) {
        gainXP(XP_FOR_FISHING_ACTION);
      }
      trackStats({ fished: 1 });
      setToastConfig({ title: t('HomePage.fishCaught.title'), description: t('HomePage.fishCaught.description', {fishName: fishCaughtThisClick.name, xp: XP_FOR_FISHING_ACTION}), className: "bg-primary text-primary-foreground" });
      playCatchSound();
    } else if (currentCellState !== 'CLICKED_EMPTY') {
       setToastConfig({ title: t('HomePage.fishMissed.title'), description: t('HomePage.fishMissed.description'), variant: "default" });
       playMissSound();
    }
  };


  // 💡 GUIA RÁPIDO do render (o "ecrã" que o jogador vê):
//   - `GameHeader`        → barra do topo (moedas, nível, XP, exportar/importar)
//   - `Tabs` com 3 abas   → Campos / Animais / Pesca
//   - Inventário/Receitas  → abas de página inteira (InventoryPanel/RecipesPanel)
//   - Diálogos            → janelas (plantar, comprar animal, missões, conquistas)
//
// ➕ ADICIONAR FUNCIONALIDADE AQUI: é neste `return` que se coloca um novo
// bloco visual na página. Cada secção recebe "props" (erros) e dados do
// `gameState`, mais as funções `handle*` que a fazem reagir aos cliques.
  if (isGameLoading || !gameState) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-2xl font-semibold bg-background text-foreground">
        <Loader2 className="h-12 w-12 animate-spin mb-4" />
        {t('HomePage.loading')}
      </div>
    );
  }

  const currentBaitCount = gameState.inventory[BAIT_ID] || 0;
  const availableCropsForDialog = getAvailableCrops().filter(crop => gameState.level >= crop.minLevel);
  const availableAnimalsForDialog = getAvailableAnimals().filter(animal => gameState.level >= animal.minLevel);
  const achievementsForDialog = getAvailableAchievements();
  const recipesForDialog = getAvailableRecipes();

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8 bg-background text-foreground animate-in fade-in-0 duration-500">
      <GameHeader
        currency={gameState.currency}
        level={gameState.level}
        xp={gameState.xp}
        xpToNextLevel={gameState.xpToNextLevel}
        onExport={handleExportSave}
        onImport={handleImportClick}
        onNewGame={handleNewGame}
        onOpenStats={() => setIsStatsDialogOpen(true)}
        onOpenMissionsDialog={() => setIsMissionsDialogOpen(true)}
        onOpenAchievementsDialog={() => setIsAchievementsDialogOpen(true)}
        hasClaimableMissions={gameState.missions.some(m => m.currentAmount >= m.targetAmount && !m.isCompleted)}
        hasClaimableAchievements={gameState.achievements.some(ap => ap.isCompleted && !ap.isClaimed)}
        muted={muted}
        onToggleMute={handleToggleMute}
        locale={locale}
        onLocaleChange={setLocale}
      />

      {/* 🔧 ALTERAR AQUI: botão "Importar" no topo (GameHeader) ativa este
           <input> escondido, que abre o seletor de ficheiros do navegador.
           O ficheiro escolhido é lido em `handleImportFile` (ver acima). */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleImportFile}
      />

      <main className="flex-grow h-full mt-6">
        <section className="space-y-10">
          <Tabs defaultValue="fields" className="w-full">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 h-auto gap-1">
              <TabsTrigger value="fields" className="text-xs sm:text-sm px-1 sm:px-3">{t('HomePage.tabs.fields')}</TabsTrigger>
              <TabsTrigger value="animals" className="text-xs sm:text-sm px-1 sm:px-3">{t('HomePage.tabs.animals')}</TabsTrigger>
              <TabsTrigger value="fishing" className="text-xs sm:text-sm px-1 sm:px-3">{t('HomePage.tabs.fishing')}</TabsTrigger>
              <TabsTrigger value="contracts" className="text-xs sm:text-sm px-1 sm:px-3">{t('HomePage.tabs.contracts')}</TabsTrigger>
              <TabsTrigger value="inventory" className="text-xs sm:text-sm px-1 sm:px-3">{t('HomePage.tabs.inventory')}</TabsTrigger>
              <TabsTrigger value="recipes" className="text-xs sm:text-sm px-1 sm:px-3">{t('HomePage.tabs.recipes')}</TabsTrigger>
            </TabsList>
            <TabsContent value="fields">
              <FieldSection
                fields={gameState.fields}
                inventory={gameState.inventory}
                onPlantClick={handlePlantRequest}
                onHarvestClick={handleHarvest}
                onReplantClick={handleReplant}
                onBuyField={handleBuyField}
                canAffordNextField={gameState.currency >= gameState.nextFieldCost}
                nextFieldCost={gameState.nextFieldCost}
                onUpgradeField={handleUpgradeField}
                onUseWateringCan={handleUseWateringCan}
                currentCurrency={gameState.currency}
                currentLevel={gameState.level}
              />
            </TabsContent>
            <TabsContent value="animals">
              <AnimalPenSection
                pens={gameState.animalPens}
                onBuyAnimalClick={handleRequestBuyAnimal}
                onCollectProductClick={handleCollectProduct}
                onButcherAnimalClick={handleButcherAnimal}
                onBuyAnimalPen={handleBuyAnimalPen}
                canAffordNextPen={gameState.currency >= gameState.nextAnimalPenCost}
                nextAnimalPenCost={gameState.nextAnimalPenCost}
                onUpgradeAnimalPen={handleUpgradeAnimalPen}
                currentCurrency={gameState.currency}
              />
            </TabsContent>
            <TabsContent value="fishing">
              <FishingSection 
                fishingGrid={gameState.fishingGrid}
                baitCount={currentBaitCount}
                onBuyBait={handleBuyBait}
                onRefreshGrid={() => handleRefreshFishingGrid(true)}
                onCellClick={handleFishCellClick}
                currentCurrency={gameState.currency}
                baitCost={BAIT_COST_PER_PACK}
              />
            </TabsContent>
            <TabsContent value="contracts">
              <ContractsSection
                contracts={gameState.contracts}
                nextContractAt={gameState.nextContractAt}
                inventory={gameState.inventory}
                onDeliver={handleDeliverContract}
                onTogglePin={handleTogglePinContract}
              />
            </TabsContent>
            <TabsContent value="inventory">
              <InventoryPanel
                inventory={gameState.inventory}
                onSellItem={handleSellItem}
              />
            </TabsContent>
            <TabsContent value="recipes">
              <RecipesPanel
                inventory={gameState.inventory}
                availableRecipes={recipesForDialog}
                onCraftItem={handleCraftItem}
                onCollectWater={handleCollectWater}
                currentLevel={gameState.level}
              />
            </TabsContent>
          </Tabs>
        </section>
      </main>

      {isPlanting && plantingFieldId && (
        <PlantCropDialog
          isOpen={isPlanting}
          onClose={() => {
            setIsPlanting(false);
            setPlantingFieldId(null);
          }}
          availableCrops={availableCropsForDialog}
          onPlant={handlePlantConfirm}
          currentCurrency={gameState.currency}
        />
      )}
      {isBuyingAnimal && buyingAnimalPenId && (
        <BuyAnimalDialog
          isOpen={isBuyingAnimal}
          onClose={() => {
            setIsBuyingAnimal(false);
            setBuyingAnimalPenId(null);
          }}
          availableAnimals={availableAnimalsForDialog}
          onBuyAnimal={handleConfirmBuyAnimal}
          currentCurrency={gameState.currency}
        />
      )}
      {isMissionsDialogOpen && (
        <MissionsDialog
          isOpen={isMissionsDialogOpen}
          onClose={() => setIsMissionsDialogOpen(false)}
          missions={gameState.missions}
          onClaimMissionReward={handleClaimMissionReward}
          onClaimAllMissions={handleClaimAllMissions}
        />
      )}
      {isAchievementsDialogOpen && (
        <AchievementsDialog
          isOpen={isAchievementsDialogOpen}
          onClose={() => setIsAchievementsDialogOpen(false)}
          achievementsProgress={gameState.achievements}
          availableAchievements={achievementsForDialog}
          onClaimAchievementReward={handleClaimAchievementReward}
          onClaimAllAchievements={handleClaimAllAchievements}
        />
      )}
      {isStatsDialogOpen && (
        <StatsDialog
          isOpen={isStatsDialogOpen}
          onClose={() => setIsStatsDialogOpen(false)}
          stats={gameState.stats}
        />
      )}
      {levelUpBanner !== null && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
          <div className="animate-celebrate text-center px-4">
            <p className="font-headline text-4xl sm:text-6xl md:text-7xl font-bold text-[#FF9800] drop-shadow-[0_2px_0_rgba(62,39,35,1)]">
              {t('HomePage.levelUp.title')}
            </p>
            <p className="font-headline text-2xl text-[#3E2723] bg-[#EFEBE9]/90 rounded-md px-4 py-1 mt-3 inline-block">
              {t('HomePage.levelUp.description', { level: levelUpBanner })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

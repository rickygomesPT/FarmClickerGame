import type { Achievement, AchievementProgress, AchievementType, Mission, MissionType } from '@/types/game';
import { calculateXpToNextLevel } from '@/config/gameConfig';

// Lógica pura de progressão (XP, missões, conquistas), extraída de
// `src/app/page.tsx`. Estas funções não tocam em estado React: recebem
// dados e devolvem dados. O componente continua a tratar dos
// `setGameState`/`setLevelUpInfo` à volta delas.

export interface XpGainResult {
  xp: number;
  level: number;
  xpToNextLevel: number;
  leveledUp: boolean;
  newLevel: number;
}

export function applyXpGain(
  prev: { xp: number; level: number; xpToNextLevel: number },
  amount: number,
): XpGainResult {
  let newXp = prev.xp + amount;
  let newLevel = prev.level;
  let newXpToNextLevel = prev.xpToNextLevel;
  let leveledUp = false;

  while (newXp >= newXpToNextLevel) {
    newLevel++;
    newXp -= newXpToNextLevel;
    newXpToNextLevel = calculateXpToNextLevel(newLevel);
    leveledUp = true;
  }

  return { xp: newXp, level: newLevel, xpToNextLevel: newXpToNextLevel, leveledUp, newLevel };
}

export interface ProgressDetails {
  targetId?: string;
  currentTotalCurrency?: number;
}

/** Devolve o array novo de missões, ou `null` se nada mudou. */
export function applyMissionProgress(
  prevMissions: Mission[],
  type: MissionType,
  amount: number,
  details?: ProgressDetails,
): Mission[] | null {
  let missionsActuallyChanged = false;
  const newMissions = prevMissions.map(mission => {
    if (mission.isCompleted) return mission;

    const originalCurrentAmount = mission.currentAmount;
    let newCurrentAmount = mission.currentAmount;
    let specificMissionProgressMade = false;

    if (mission.type === type) {
      if (['HARVEST_CROP', 'PLANT_CROP', 'BUY_ANIMAL', 'COLLECT_ANIMAL_PRODUCT', 'CRAFT_ITEM'].includes(type)) {
        if (mission.targetId === details?.targetId) {
          newCurrentAmount = Math.min(mission.targetAmount, mission.currentAmount + amount);
          if (newCurrentAmount !== originalCurrentAmount) specificMissionProgressMade = true;
        }
      } else if (type === 'EARN_CURRENCY' || type === 'UPGRADE_FIELDS') {
        newCurrentAmount = Math.min(mission.targetAmount, mission.currentAmount + amount);
        if (newCurrentAmount !== originalCurrentAmount) specificMissionProgressMade = true;
      } else if (type === 'HAVE_CURRENCY' && details?.currentTotalCurrency !== undefined) {
        newCurrentAmount = Math.min(mission.targetAmount, details.currentTotalCurrency);
        if (newCurrentAmount !== originalCurrentAmount) specificMissionProgressMade = true;
      }
    }

    if (specificMissionProgressMade) {
      missionsActuallyChanged = true;
      return { ...mission, currentAmount: newCurrentAmount };
    }
    return mission;
  });

  if (!missionsActuallyChanged) return null;
  return newMissions;
}

/** Devolve o array novo de progresso de conquistas, ou `null` se nada mudou. */
export function applyAchievementProgress(
  prevProgress: AchievementProgress[],
  configs: Achievement[],
  type: AchievementType,
  amount: number,
  details?: ProgressDetails,
): AchievementProgress[] | null {
  let achievementsActuallyChanged = false;
  const newAchievementsProgress = prevProgress.map(progress => {
    if (progress.isCompleted && progress.isClaimed) return progress;

    const achievementConfig = configs.find(ach => ach.id === progress.achievementId);
    if (!achievementConfig) return progress;

    let specificAchievementProgressMade = false;
    let newCurrentAmount = progress.currentAmount;

    if (achievementConfig.type === type) {
      switch (type) {
        case 'HARVEST_SPECIFIC_CROP':
        case 'COLLECT_SPECIFIC_PRODUCT':
        case 'BUY_SPECIFIC_ANIMAL':
          if (achievementConfig.targetId === details?.targetId) {
            newCurrentAmount = Math.min(achievementConfig.targetAmount, progress.currentAmount + amount);
            if (newCurrentAmount !== progress.currentAmount) specificAchievementProgressMade = true;
          }
          break;
        case 'HARVEST_CROP_TOTAL':
        case 'COLLECT_PRODUCT_TOTAL':
        case 'EARN_CURRENCY_TOTAL':
        case 'COMPLETE_MISSIONS_TOTAL':
        case 'UPGRADE_BUILDINGS_TOTAL':
        case 'CRAFT_ITEM_TOTAL':
          newCurrentAmount = Math.min(achievementConfig.targetAmount, progress.currentAmount + amount);
          if (newCurrentAmount !== progress.currentAmount) specificAchievementProgressMade = true;
          break;
        case 'REACH_LEVEL_X':
        case 'OWN_FIELDS_TOTAL':
        case 'OWN_PENS_TOTAL':
          newCurrentAmount = Math.min(achievementConfig.targetAmount, amount);
          if (newCurrentAmount !== progress.currentAmount) specificAchievementProgressMade = true;
          break;
      }
    }

    if (specificAchievementProgressMade) {
      achievementsActuallyChanged = true;
      const isNowCompleted = newCurrentAmount >= achievementConfig.targetAmount;
      return {
        ...progress,
        currentAmount: newCurrentAmount,
        isCompleted: progress.isCompleted || isNowCompleted,
      };
    }
    return progress;
  });

  if (!achievementsActuallyChanged) return null;
  return newAchievementsProgress;
}

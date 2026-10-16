import { describe, it, expect } from 'vitest';
import { applyXpGain, applyMissionProgress, applyAchievementProgress } from './progress';
import { calculateXpToNextLevel } from '@/config/gameConfig';
import type { Achievement, AchievementProgress, Mission } from '@/types/game';

function makeMission(overrides: Partial<Mission> = {}): Mission {
  return {
    id: 'm1',
    description: 'test mission',
    type: 'HARVEST_CROP',
    targetId: 'lettuce',
    targetAmount: 10,
    currentAmount: 0,
    reward: 20,
    isCompleted: false,
    ...overrides,
  };
}

function makeAchievementConfig(overrides: Partial<Achievement> = {}): Achievement {
  return {
    id: 'harvest_lettuce_100',
    title: 'harvest_lettuce_100',
    description: '',
    type: 'HARVEST_SPECIFIC_CROP',
    targetId: 'lettuce',
    targetAmount: 100,
    rewardCurrency: 10,
    rewardXp: 10,
    icon: () => null,
    ...overrides,
  };
}

function makeProgress(overrides: Partial<AchievementProgress> = {}): AchievementProgress {
  return {
    achievementId: 'harvest_lettuce_100',
    currentAmount: 0,
    isCompleted: false,
    isClaimed: false,
    ...overrides,
  };
}

describe('applyXpGain', () => {
  it('adds xp without leveling up', () => {
    const result = applyXpGain({ xp: 10, level: 1, xpToNextLevel: 100 }, 20);
    expect(result).toEqual({ xp: 30, level: 1, xpToNextLevel: 100, leveledUp: false, newLevel: 1 });
  });

  it('levels up once carrying the remainder', () => {
    const result = applyXpGain({ xp: 90, level: 1, xpToNextLevel: 100 }, 20);
    expect(result.level).toBe(2);
    expect(result.xp).toBe(10);
    expect(result.xpToNextLevel).toBe(calculateXpToNextLevel(2));
    expect(result.leveledUp).toBe(true);
    expect(result.newLevel).toBe(2);
  });

  it('chains multiple level ups in one gain', () => {
    const first = calculateXpToNextLevel(1);
    const second = calculateXpToNextLevel(2);
    const result = applyXpGain({ xp: 0, level: 1, xpToNextLevel: first }, first + second + 5);
    expect(result.level).toBe(3);
    expect(result.xp).toBe(5);
    expect(result.xpToNextLevel).toBe(calculateXpToNextLevel(3));
    expect(result.leveledUp).toBe(true);
  });

  it('exact threshold levels up with zero remainder', () => {
    const result = applyXpGain({ xp: 90, level: 1, xpToNextLevel: 100 }, 10);
    expect(result.level).toBe(2);
    expect(result.xp).toBe(0);
    expect(result.leveledUp).toBe(true);
  });
});

describe('applyMissionProgress', () => {
  it('increments a matching targeted mission and caps at the target', () => {
    const missions = [makeMission({ currentAmount: 8 })];
    const next = applyMissionProgress(missions, 'HARVEST_CROP', 5, { targetId: 'lettuce' });
    expect(next?.[0].currentAmount).toBe(10);
    // input não é mutado
    expect(missions[0].currentAmount).toBe(8);
  });

  it('returns null when the target id does not match', () => {
    const missions = [makeMission()];
    expect(applyMissionProgress(missions, 'HARVEST_CROP', 5, { targetId: 'wheat' })).toBeNull();
  });

  it('skips completed missions', () => {
    const missions = [makeMission({ isCompleted: true, currentAmount: 10 })];
    expect(applyMissionProgress(missions, 'HARVEST_CROP', 5, { targetId: 'lettuce' })).toBeNull();
  });

  it('accumulates EARN_CURRENCY missions', () => {
    const missions = [makeMission({ type: 'EARN_CURRENCY', targetId: undefined, currentAmount: 40, targetAmount: 100 })];
    const next = applyMissionProgress(missions, 'EARN_CURRENCY', 30);
    expect(next?.[0].currentAmount).toBe(70);
  });

  it('sets HAVE_CURRENCY from the current total', () => {
    const missions = [makeMission({ type: 'HAVE_CURRENCY', targetId: undefined, currentAmount: 40, targetAmount: 200 })];
    const next = applyMissionProgress(missions, 'HAVE_CURRENCY', 0, { currentTotalCurrency: 150 });
    expect(next?.[0].currentAmount).toBe(150);
  });

  it('returns null for HAVE_CURRENCY without a total', () => {
    const missions = [makeMission({ type: 'HAVE_CURRENCY', targetId: undefined })];
    expect(applyMissionProgress(missions, 'HAVE_CURRENCY', 0)).toBeNull();
  });
});

describe('applyAchievementProgress', () => {
  it('increments a matching specific-crop achievement and completes at target', () => {
    const configs = [makeAchievementConfig()];
    const prev = [makeProgress({ currentAmount: 95 })];
    const next = applyAchievementProgress(prev, configs, 'HARVEST_SPECIFIC_CROP', 10, { targetId: 'lettuce' });
    expect(next?.[0].currentAmount).toBe(100);
    expect(next?.[0].isCompleted).toBe(true);
    expect(prev[0].currentAmount).toBe(95);
  });

  it('returns null on target mismatch', () => {
    const configs = [makeAchievementConfig()];
    const prev = [makeProgress()];
    expect(applyAchievementProgress(prev, configs, 'HARVEST_SPECIFIC_CROP', 10, { targetId: 'wheat' })).toBeNull();
  });

  it('accumulates total-type achievements with a cap', () => {
    const configs = [makeAchievementConfig({ id: 'harvest_total_2000', type: 'HARVEST_CROP_TOTAL', targetId: undefined, targetAmount: 2000 })];
    const prev = [makeProgress({ achievementId: 'harvest_total_2000', currentAmount: 1990 })];
    const next = applyAchievementProgress(prev, configs, 'HARVEST_CROP_TOTAL', 50);
    expect(next?.[0].currentAmount).toBe(2000);
    expect(next?.[0].isCompleted).toBe(true);
  });

  it('sets (not adds) REACH_LEVEL_X achievements', () => {
    const configs = [makeAchievementConfig({ id: 'reach_level_10', type: 'REACH_LEVEL_X', targetId: undefined, targetAmount: 10 })];
    const prev = [makeProgress({ achievementId: 'reach_level_10', currentAmount: 3 })];
    const next = applyAchievementProgress(prev, configs, 'REACH_LEVEL_X', 10);
    expect(next?.[0].currentAmount).toBe(10);
  });

  it('skips completed-and-claimed achievements', () => {
    const configs = [makeAchievementConfig()];
    const prev = [makeProgress({ isCompleted: true, isClaimed: true, currentAmount: 100 })];
    expect(applyAchievementProgress(prev, configs, 'HARVEST_SPECIFIC_CROP', 10, { targetId: 'lettuce' })).toBeNull();
  });

  it('ignores progress entries without a matching config', () => {
    const configs = [makeAchievementConfig()];
    const prev = [makeProgress({ achievementId: 'unknown_id' })];
    expect(applyAchievementProgress(prev, configs, 'HARVEST_SPECIFIC_CROP', 10, { targetId: 'lettuce' })).toBeNull();
  });
});

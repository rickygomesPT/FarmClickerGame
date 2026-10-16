import { describe, it, expect } from 'vitest';
import { calculateNextUpgradeCost, calculateXpToNextLevel } from '@/config/gameConfig';

describe('calculateXpToNextLevel', () => {
  it('returns the base value for level 1 and non-positive levels', () => {
    expect(calculateXpToNextLevel(1)).toBe(100);
    expect(calculateXpToNextLevel(0)).toBe(100);
    expect(calculateXpToNextLevel(-3)).toBe(100);
  });

  it('grows with the level', () => {
    const l2 = calculateXpToNextLevel(2);
    const l3 = calculateXpToNextLevel(3);
    expect(l2).toBe(120);
    expect(l3).toBeGreaterThan(l2);
  });
});

describe('calculateNextUpgradeCost', () => {
  it('applies base * multiplier^level, floored', () => {
    expect(calculateNextUpgradeCost(75, 5, 0)).toBe(75);
    expect(calculateNextUpgradeCost(75, 5, 1)).toBe(375);
    expect(calculateNextUpgradeCost(100, 1.5, 2)).toBe(Math.floor(100 * 1.5 ** 2));
  });
});

import { describe, it, expect } from 'vitest';
import { generateFishingGrid } from './fishing';

const PROBS = [
  { fishId: 'sardine', weight: 40 },
  { fishId: 'seabass', weight: 25 },
  { fishId: 'cod', weight: 15 },
];

describe('generateFishingGrid', () => {
  it('creates a grid with the requested dimensions', () => {
    const grid = generateFishingGrid(3, 5, 0.4, PROBS, () => 0.999);
    expect(grid).toHaveLength(3);
    for (const row of grid) expect(row).toHaveLength(5);
  });

  it('leaves every cell empty when random never hits', () => {
    const grid = generateFishingGrid(2, 4, 0.4, PROBS, () => 0.999);
    expect(grid.flat().every(cell => cell === null)).toBe(true);
  });

  it('fills every cell when random always hits, picking by weight', () => {
    // random() = 0: 0 < 0.4 (tem peixe); peso 0 * total = 0 < 40 → primeiro peixe.
    const grid = generateFishingGrid(2, 3, 0.4, PROBS, () => 0);
    expect(grid.flat().every(cell => cell === 'sardine')).toBe(true);
  });

  it('returns all nulls with zero probability', () => {
    const grid = generateFishingGrid(3, 5, 0, PROBS, () => 0);
    expect(grid.flat().every(cell => cell === null)).toBe(true);
  });

  it('is deterministic for the same random sequence', () => {
    const seq = [0.1, 0.5, 0.9, 0.2, 0.7, 0.3];
    let i = 0;
    const a = generateFishingGrid(2, 3, 0.4, PROBS, () => seq[i++ % seq.length]);
    i = 0;
    const b = generateFishingGrid(2, 3, 0.4, PROBS, () => seq[i++ % seq.length]);
    expect(a).toEqual(b);
  });
});

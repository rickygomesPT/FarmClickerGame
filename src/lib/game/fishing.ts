// Geração da grelha de pesca. Função pura: o `random` é injetável para
// ser determinística nos testes; em produção usa `Math.random`.

export type FishingGrid = (string | 'CLICKED_EMPTY' | null)[][];

export interface FishProbability {
  fishId: string;
  weight: number;
}

export function generateFishingGrid(
  rows: number,
  cols: number,
  fishProbability: number,
  fishProbabilities: FishProbability[],
  random: () => number = Math.random,
): FishingGrid {
  const newGrid: FishingGrid = Array(rows).fill(null).map(() => Array(cols).fill(null));
  const totalWeight = fishProbabilities.reduce((sum, fish) => sum + fish.weight, 0);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (random() < fishProbability) {
        let randomWeight = random() * totalWeight;
        for (const fishProb of fishProbabilities) {
          if (randomWeight < fishProb.weight) {
            newGrid[r][c] = fishProb.fishId;
            break;
          }
          randomWeight -= fishProb.weight;
        }
      }
    }
  }
  return newGrid;
}

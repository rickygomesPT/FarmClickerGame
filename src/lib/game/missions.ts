import type { MissionType } from '@/types/game';

// Teto de esforço das missões: nenhum alvo deve exigir mais do que isto
// de produção num só slot (~12 min). Usado em `generateNewMission`.
export const MAX_MISSION_TIME_MS = 12 * 60 * 1000;

export interface MissionClampContext {
  /** ms por unidade (crescimento/colheita por item, produção por item). */
  timeMsPerItem?: number;
  /** preço de venda (só para CRAFT_ITEM). */
  priceEach?: number;
}

/** Corta `amount` para um alvo justo. Tipos sem tempo/custo passam intactos. */
export function clampMissionAmount(type: MissionType, amount: number, context: MissionClampContext = {}): number {
  if (type === 'CRAFT_ITEM' && (context.priceEach ?? 0) > 300) return 1;
  const timeMs = context.timeMsPerItem;
  if (timeMs === undefined || timeMs <= 0) {
    // Produtos sem ciclo (carnes): teto pequeno e fixo.
    return type === 'COLLECT_ANIMAL_PRODUCT' ? Math.min(amount, 3) : amount;
  }
  return Math.max(1, Math.min(amount, Math.floor(MAX_MISSION_TIME_MS / timeMs)));
}

import type { Mission, MissionType } from '@/types/game';
import { t_items, t_general, tSection } from '@/lib/i18n';

const TEMPLATE_KEYS: Record<MissionType, string> = {
  HARVEST_CROP: 'harvest',
  EARN_CURRENCY: 'earn',
  PLANT_CROP: 'plant',
  BUY_ANIMAL: 'buy',
  COLLECT_ANIMAL_PRODUCT: 'collect',
  HAVE_CURRENCY: 'have',
  UPGRADE_FIELDS: 'upgrade',
  CRAFT_ITEM: 'craft',
};

function getMissionItemName(mission: Mission): string {
  switch (mission.type) {
    case 'EARN_CURRENCY':
      return t_general('coins');
    case 'HAVE_CURRENCY':
      return t_general('total_coins');
    case 'UPGRADE_FIELDS':
      return t_general('upgrades');
    default:
      return mission.targetId ? t_items(`${mission.targetId}.name`) : '';
  }
}

export function getMissionDescription(mission: Mission): string {
  const templates = tSection('HomePage.missions');
  const templateKey = TEMPLATE_KEYS[mission.type];
  const template = typeof templates === 'object' ? templates[templateKey] : undefined;

  if (typeof template !== 'string') {
    return mission.description || '';
  }

  return template
    .replace('{amount}', String(mission.targetAmount))
    .replace('{item}', getMissionItemName(mission));
}

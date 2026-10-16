
import type React from 'react';
import type { Achievement, AchievementProgress } from '@/types/game';
import { AchievementItemCard } from './AchievementItemCard';
import { t } from '@/lib/i18n';

interface AchievementsListProps {
  achievementsProgress: AchievementProgress[];
  availableAchievements: Achievement[];
  onClaimAchievementReward: (achievementId: string) => void;
}

export function AchievementsList({
  achievementsProgress,
  availableAchievements,
  onClaimAchievementReward,
}: AchievementsListProps) {
  if (availableAchievements.length === 0) {
    return <p className="text-[#5D4037] text-center py-4">{t('AchievementsList.noneConfigured')}</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {availableAchievements.map((achievement) => {
        const progress = achievementsProgress.find(p => p.achievementId === achievement.id);
        if (!progress) {
          // Should not happen if initialized correctly, but good to handle
          return <p key={achievement.id} className="text-destructive">{t('AchievementsList.errorLoading', { title: achievement.title })}</p>;
        }
        return (
          <AchievementItemCard
            key={achievement.id}
            achievement={achievement}
            progress={progress}
            onClaimReward={onClaimAchievementReward}
          />
        );
      })}
    </div>
  );
}

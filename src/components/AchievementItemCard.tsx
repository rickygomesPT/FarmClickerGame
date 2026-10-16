
import type React from 'react';
import type { Achievement, AchievementProgress } from '@/types/game';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Coins, Star, Award } from 'lucide-react';
import { t } from '@/lib/i18n';

interface AchievementItemCardProps {
  achievement: Achievement;
  progress: AchievementProgress;
  onClaimReward: (achievementId: string) => void;
}

export function AchievementItemCard({ achievement, progress, onClaimReward }: AchievementItemCardProps) {
  const currentProgressPercentage = achievement.targetAmount > 0 
    ? Math.min(100, (progress.currentAmount / achievement.targetAmount) * 100) 
    : 0;

  const IconComponent = achievement.icon;

  return (
    <Card className={`border-[3px] border-[#5D4037] transition-all duration-300 ${progress.isClaimed ? 'bg-[#D7CCC8]/50 opacity-70' : 'bg-[#EFEBE9] hover:shadow-lg'}`}>
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center text-[#3E2723]">
            {typeof IconComponent === 'function' ? <IconComponent className="mr-2 h-6 w-6 text-[#A0522D]" /> : <Award className="mr-2 h-6 w-6 text-[#A0522D]" />}
            {achievement.title}
          </CardTitle>
          {progress.isClaimed && (
            <CheckCircle className="h-6 w-6 text-[#8BC34A]" />
          )}
        </div>
        <CardDescription className="text-sm text-[#5D4037]">{achievement.description}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 pb-2">
        <div className="mb-2">
          <Progress value={currentProgressPercentage} className="h-4 border border-[#5D4037] bg-white [&>div]:bg-[#8BC34A]" />
          <p className="text-sm font-bold font-mono text-[#5D4037] mt-1 text-right">
            {progress.currentAmount} / {achievement.targetAmount}
          </p>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex flex-col sm:flex-row justify-between items-center bg-[#D7CCC8]/30">
        <div className="text-sm text-[#3E2723] mb-2 sm:mb-0 font-semibold">
          {t('AchievementItemCard.reward')} 
          {achievement.rewardCurrency > 0 && <span className="ml-1 mr-2 inline-flex items-center"><Coins className="h-4 w-4 mr-1 text-[#FF9800]" /> {achievement.rewardCurrency}</span>}
          {achievement.rewardXp > 0 && <span className="ml-1 inline-flex items-center"><Star className="h-4 w-4 mr-1 text-yellow-600" /> {achievement.rewardXp} XP</span>}
          {(achievement.rewardCurrency === 0 && achievement.rewardXp === 0) && <span className="ml-1">{t('AchievementItemCard.none')}</span>}
        </div>
        <Button
          size="sm"
          onClick={() => onClaimReward(achievement.id)}
          disabled={!progress.isCompleted || progress.isClaimed}
          className={`text-base py-3 px-6 ${progress.isCompleted && !progress.isClaimed ? 'bg-[#A1887F] hover:bg-[#8D6E63] text-white animate-pulse' : 'bg-[#D7CCC8] text-[#5D4037]'} ${progress.isClaimed ? 'bg-[#A1887F]/50' : ''}`}
        >
          {progress.isClaimed ? t('AchievementItemCard.claimed') : progress.isCompleted ? t('AchievementItemCard.collect') : t('AchievementItemCard.inProgress')}
        </Button>
      </CardFooter>
    </Card>
  );
}

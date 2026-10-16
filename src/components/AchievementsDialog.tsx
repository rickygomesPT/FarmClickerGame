
import type React from 'react';
import type { Achievement, AchievementProgress } from '@/types/game';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Award } from 'lucide-react';
import { AchievementsList } from './AchievementsList';
import { t } from '@/lib/i18n';

interface AchievementsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  achievementsProgress: AchievementProgress[];
  availableAchievements: Achievement[];
  onClaimAchievementReward: (achievementId: string) => void;
  onClaimAllAchievements: () => void;
}

export function AchievementsDialog({
  isOpen,
  onClose,
  achievementsProgress,
  availableAchievements,
  onClaimAchievementReward,
  onClaimAllAchievements,
}: AchievementsDialogProps) {
  const claimableCount = achievementsProgress.filter(p => p.isCompleted && !p.isClaimed).length;
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl md:max-w-4xl bg-[#EFEBE9] text-[#3E2723] border-[3px] border-[#5D4037] max-h-[90dvh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="font-headline text-xl sm:text-2xl flex items-center text-[#3E2723]">
            <Award className="mr-2 h-8 w-8 text-[#A0522D]" />
            {t('AchievementsDialog.title')}
          </DialogTitle>
          <DialogDescription className="text-base sm:text-lg text-[#5D4037]">{t('AchievementsDialog.description')}</DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain my-2 pr-3 [scrollbar-width:thin]">
          <div className="py-2">
            <AchievementsList
              achievementsProgress={achievementsProgress}
              availableAchievements={availableAchievements}
              onClaimAchievementReward={onClaimAchievementReward}
            />
          </div>
        </div>
        <DialogFooter className="mt-2 flex flex-col sm:flex-row gap-2 flex-shrink-0">
          {claimableCount > 1 && (
            <Button onClick={onClaimAllAchievements} className="w-full sm:w-auto text-base py-3 bg-[#8BC34A] hover:bg-[#689F38] text-white">
              {t('AchievementsDialog.claimAll')}
            </Button>
          )}
          <DialogClose asChild>
            <Button variant="outline" className="w-full sm:w-auto text-base py-3 bg-[#A1887F] text-white border-[#5D4037] hover:bg-[#8D6E63]">{t('AchievementsDialog.close')}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

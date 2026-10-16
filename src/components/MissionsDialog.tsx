
import type React from 'react';
import type { Mission, MissionType } from '@/types/game';
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
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Coins, ClipboardList } from 'lucide-react';
import { MISSION_CONFIG } from '@/config/gameConfig';
import { t } from '@/lib/i18n';
import { getMissionDescription } from '@/lib/missionText';

interface MissionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  missions: Mission[];
  onClaimMissionReward: (missionId: string) => void;
  onClaimAllMissions: () => void;
}

export function MissionsDialog({ isOpen, onClose, missions, onClaimMissionReward, onClaimAllMissions }: MissionsDialogProps) {
  const getMissionIconElement = (missionType: MissionType) => {
    const Icon = MISSION_CONFIG[missionType]?.icon || ClipboardList;
    return <Icon className="h-6 w-6 mr-2 text-accent" />;
  };

  const activeMissions = missions.filter(m => !m.isCompleted);
  const claimableCount = activeMissions.filter(m => m.currentAmount >= m.targetAmount).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl md:max-w-4xl bg-[#EFEBE9] text-[#3E2723] border-[3px] border-[#5D4037] max-h-[90dvh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="font-headline text-xl sm:text-2xl flex items-center text-[#3E2723]">
            <ClipboardList className="mr-2 h-8 w-8 text-[#A0522D]" />
            {t('MissionsDialog.title')}
          </DialogTitle>
          <DialogDescription className="text-base sm:text-lg text-[#5D4037]">{t('MissionsDialog.description')}</DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain my-2 pr-3 [scrollbar-width:thin]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            {activeMissions.length === 0 && (
              <p className="text-[#8D6E63] text-center py-10 text-lg md:col-span-2">
                {t('MissionsDialog.noActive')}
              </p>
            )}
            {activeMissions.map((mission) => {
              const progress = mission.targetAmount > 0 ? Math.min(100, (mission.currentAmount / mission.targetAmount) * 100) : 0;
              const isComplete = mission.currentAmount >= mission.targetAmount;

              return (
                <Card key={mission.id} className="p-3 sm:p-4 bg-[#D7CCC8] border border-[#5D4037]">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center text-lg font-semibold">
                      {getMissionIconElement(mission.type)}
                      <span>{getMissionDescription(mission)}</span>
                    </div>
                    <Badge variant="outline" className="text-sm whitespace-nowrap py-1 px-2.5">
                      <Coins className="inline h-5 w-5 mr-1 text-[#FF9800]" /> {mission.reward}
                    </Badge>
                  </div>
                  <Progress value={progress} className="mb-3 h-4 border border-[#5D4037] bg-[#EFEBE9] [&>div]:bg-[#8BC34A]" />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-sm font-mono font-bold text-[#5D4037]">
                      {t('MissionsDialog.progress', { current: mission.currentAmount, target: mission.targetAmount })}
                    </p>
                    {isComplete && (
                      <Button size="sm" onClick={() => onClaimMissionReward(mission.id)} className="bg-[#A1887F] hover:bg-[#8D6E63] text-white text-base py-3 px-5">
                        {t('MissionsDialog.collect')}
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
        <DialogFooter className="mt-2 flex flex-col sm:flex-row gap-2 flex-shrink-0">
          {claimableCount > 1 && (
            <Button onClick={onClaimAllMissions} className="w-full sm:w-auto text-base py-3 bg-[#8BC34A] hover:bg-[#689F38] text-white">
              {t('MissionsDialog.claimAll')}
            </Button>
          )}
          <DialogClose asChild>
            <Button variant="outline" className="w-full sm:w-auto text-base py-3 bg-[#A1887F] text-white border-[#5D4037] hover:bg-[#8D6E63]">{t('MissionsDialog.close')}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Coins, Wheat, Egg, CookingPot, Fish as FishIcon, PackageCheck, Clock } from 'lucide-react';
import { t } from '@/lib/i18n';
import type { GameStats } from '@/types/game';

function formatPlayTime(playMs: number): string {
  const totalMinutes = Math.floor(playMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes} min`;
  return `${hours} h ${minutes} min`;
}

interface StatsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  stats: GameStats;
}

export function StatsDialog({ isOpen, onClose, stats }: StatsDialogProps) {
  const rows = [
    { icon: Coins, label: t('StatsDialog.earned'), value: stats.earned },
    { icon: Wheat, label: t('StatsDialog.harvested'), value: stats.harvested },
    { icon: Egg, label: t('StatsDialog.collected'), value: stats.collected },
    { icon: CookingPot, label: t('StatsDialog.crafted'), value: stats.crafted },
    { icon: FishIcon, label: t('StatsDialog.fished'), value: stats.fished },
    { icon: PackageCheck, label: t('StatsDialog.contracts'), value: stats.contractsDone },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#EFEBE9] text-[#3E2723] border-[3px] border-[#5D4037] max-h-[90dvh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="font-headline text-lg sm:text-xl md:text-2xl flex items-center">
            <Clock className="mr-2 h-6 w-6 text-primary" />
            {t('StatsDialog.title')}
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">{t('StatsDialog.description')}</DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain py-2 pr-1 [scrollbar-width:thin]">
        <div className="space-y-2">
          {rows.map(row => (
            <div key={row.label} className="flex items-center justify-between bg-[#FFF8E1] border border-[#8D6E63]/40 rounded-md px-3 py-2">
              <span className="flex items-center gap-2 font-semibold text-sm">
                <row.icon className="h-5 w-5" />
                {row.label}
              </span>
              <span className="font-mono font-bold">{row.value}</span>
            </div>
          ))}
          <div className="flex items-center justify-between bg-[#D7CCC8] border border-[#5D4037] rounded-md px-3 py-2">
            <span className="flex items-center gap-2 font-semibold text-sm">
              <Clock className="h-5 w-5" />
              {t('StatsDialog.playTime')}
            </span>
            <span className="font-mono font-bold">{formatPlayTime(stats.playMs)}</span>
          </div>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

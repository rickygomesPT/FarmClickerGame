
import type { AnimalPen } from '@/types/game';
import { AnimalPenCard } from './AnimalPenCard';
import { PlusCircle, Coins } from 'lucide-react';
import { t } from '@/lib/i18n';

interface AnimalPenSectionProps {
  pens: AnimalPen[];
  onBuyAnimalClick: (penId: string) => void;
  onCollectProductClick: (penId: string) => void;
  onButcherAnimalClick: (penId: string) => void;
  onBuyAnimalPen: () => void;
  canAffordNextPen: boolean;
  nextAnimalPenCost: number;
  onUpgradeAnimalPen: (penId: string) => void;
  currentCurrency: number;
}

export function AnimalPenSection({
  pens,
  onBuyAnimalClick,
  onCollectProductClick,
  onButcherAnimalClick,
  onBuyAnimalPen,
  canAffordNextPen,
  nextAnimalPenCost,
  onUpgradeAnimalPen,
  currentCurrency,
}: AnimalPenSectionProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold font-headline text-[#3E2723]">{t('AnimalPenSection.title')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {pens.map((pen) => (
          <AnimalPenCard
            key={pen.id}
            pen={pen}
            onBuyAnimalClick={onBuyAnimalClick}
            onCollectProductClick={onCollectProductClick}
            onButcherAnimalClick={onButcherAnimalClick}
            onUpgradeAnimalPen={onUpgradeAnimalPen}
            currentCurrency={currentCurrency}
          />
        ))}
         <CardAddItem onBuyPen={onBuyAnimalPen} canAffordNextPen={canAffordNextPen} nextPenCost={nextAnimalPenCost} />
      </div>
    </div>
  );
}

function CardAddItem({ onBuyPen, canAffordNextPen, nextPenCost }: { onBuyPen: () => void; canAffordNextPen: boolean; nextPenCost: number; }) {
  return (
    <button
      onClick={onBuyPen}
      disabled={!canAffordNextPen}
      className={`w-full h-full min-h-[140px] p-2 border-2 border-dashed rounded-md flex flex-col items-center justify-center transition-all duration-200
        ${canAffordNextPen 
          ? 'border-[#8D6E63]/50 hover:border-[#8D6E63] hover:bg-[#D7CCC8]/50 text-[#8D6E63]' 
          : 'border-[#A1887F]/30 text-[#A1887F] cursor-not-allowed bg-[#EFEBE9]/50' 
        }`}
      aria-label={t('AnimalPenSection.buyAria')}
    >
      <PlusCircle className="h-8 w-8 mb-1" />
      <span className="text-sm font-semibold">{t('AnimalPenSection.buy')}</span>
      {canAffordNextPen ? (
        <span className="text-xs flex items-center">
          <Coins className="h-3 w-3 mr-1 text-[#FF9800]" /> {nextPenCost}
        </span>
      ) : (
         <span className="text-xs text-destructive flex items-center">
          <Coins className="h-3 w-3 mr-1" /> {nextPenCost}
        </span>
      )}
    </button>
  );
}

    
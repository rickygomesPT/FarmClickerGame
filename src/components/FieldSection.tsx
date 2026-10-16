
import type { Field, Inventory } from '@/types/game';
import { FieldCard } from './FieldCard';
import { PlusCircle, Coins } from 'lucide-react';
import { t } from '@/lib/i18n';

interface FieldSectionProps {
  fields: Field[];
  inventory: Inventory;
  onPlantClick: (fieldId: string) => void;
  onHarvestClick: (fieldId: string) => void;
  onReplantClick: (fieldId: string) => void;
  onBuyField: () => void;
  canAffordNextField: boolean;
  nextFieldCost: number;
  onUpgradeField: (fieldId: string) => void;
  onUseWateringCan: (fieldId: string) => void;
  currentCurrency: number;
  currentLevel: number;
}

export function FieldSection({
  fields,
  inventory,
  onPlantClick,
  onHarvestClick,
  onReplantClick,
  onBuyField,
  canAffordNextField,
  nextFieldCost,
  onUpgradeField,
  onUseWateringCan,
  currentCurrency,
  currentLevel,
}: FieldSectionProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold font-headline text-[#3E2723]">{t('FieldSection.title')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {fields.map((field) => (
          <FieldCard
            key={field.id}
            field={field}
            inventory={inventory}
            onPlantClick={onPlantClick}
            onHarvestClick={onHarvestClick}
            onReplantClick={onReplantClick}
            onUpgradeField={onUpgradeField}
            onUseWateringCan={onUseWateringCan}
            currentCurrency={currentCurrency}
            currentLevel={currentLevel}
          />
        ))}
         <CardAddItem onBuyField={onBuyField} canAffordNextField={canAffordNextField} nextFieldCost={nextFieldCost} />
      </div>
    </div>
  );
}

function CardAddItem({ onBuyField, canAffordNextField, nextFieldCost }: { onBuyField: () => void; canAffordNextField: boolean; nextFieldCost: number; }) {
  return (
    <button
      onClick={onBuyField}
      disabled={!canAffordNextField}
      className={`w-full h-full min-h-[140px] p-2 border-2 border-dashed rounded-md flex flex-col items-center justify-center transition-all duration-200
        ${canAffordNextField 
          ? 'border-[#8D6E63]/50 hover:border-[#8D6E63] hover:bg-[#D7CCC8]/50 text-[#8D6E63]' 
          : 'border-[#A1887F]/30 text-[#A1887F] cursor-not-allowed bg-[#EFEBE9]/50' 
        }`}
      aria-label={t('FieldSection.buyAria')}
    >
      <PlusCircle className="h-8 w-8 mb-1" />
      <span className="text-sm font-semibold">{t('FieldSection.buy')}</span>
      {canAffordNextField ? (
        <span className="text-xs flex items-center">
          <Coins className="h-3 w-3 mr-1 text-[#FF9800]" /> {nextFieldCost}
        </span>
      ) : (
         <span className="text-xs text-destructive flex items-center">
          <Coins className="h-3 w-3 mr-1" /> {nextFieldCost}
        </span>
      )}
    </button>
  );
}


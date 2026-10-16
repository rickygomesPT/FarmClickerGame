
import type React from 'react';
import { useState, useEffect } from 'react';
import type { AnimalPen } from '@/types/game';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, PlusCircle, Zap, Star, ArrowRightLeft, Slice } from 'lucide-react'; 
import Image from 'next/image';
import {
  AVAILABLE_ANIMALS,
  AVAILABLE_ANIMAL_PRODUCTS,
  MAX_UPGRADE_LEVEL,
  ANIMAL_PEN_UPGRADE_TIME_FACTOR_PER_LEVEL
} from '@/config/gameConfig';
import { upgradeThroughput } from '@/lib/game/upgrades';
import { t, t_items } from '@/lib/i18n';

interface AnimalPenCardProps {
  pen: AnimalPen;
  onBuyAnimalClick: (penId: string) => void;
  onCollectProductClick: (penId: string) => void;
  onButcherAnimalClick: (penId: string) => void; 
  onUpgradeAnimalPen: (penId: string) => void;
  currentCurrency: number;
}

export function AnimalPenCard({ pen, onBuyAnimalClick, onCollectProductClick, onButcherAnimalClick, onUpgradeAnimalPen, currentCurrency }: AnimalPenCardProps) {
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  const [isReadyToCollectVisual, setIsReadyToCollectVisual] = useState(false);

  const placedAnimalType = pen.animalTypeId ? AVAILABLE_ANIMALS.find(a => a.id === pen.animalTypeId) : null;
  const animalProduct = placedAnimalType ? AVAILABLE_ANIMAL_PRODUCTS.find(p => p.id === placedAnimalType.productId) : null;

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;

    setProgress(0);
    setTimeRemaining(null);
    setIsReadyToCollectVisual(false);

    if (placedAnimalType && pen.animalPlacedTime && pen.productReadyTime && typeof pen.upgradeLevel === 'number' && animalProduct && placedAnimalType.productionTime > 0) { 
      const targetProductReadyTime = pen.productReadyTime; 

      const updateProgress = () => {
        const now = Date.now();
        if (now >= targetProductReadyTime) {
          setProgress(100);
          setTimeRemaining(t('AnimalPenCard.ready'));
          setIsReadyToCollectVisual(true);
          if (intervalId) clearInterval(intervalId);
        } else {
          setIsReadyToCollectVisual(false);
          const totalTimeForProgress = targetProductReadyTime - pen.animalPlacedTime!; 
          const elapsedTime = now - pen.animalPlacedTime!;
          const currentProgress = totalTimeForProgress > 0 ? Math.min(100, (elapsedTime / totalTimeForProgress) * 100) : 100;
          setProgress(currentProgress);

          const remainingSeconds = Math.max(0, Math.ceil((targetProductReadyTime - now) / 1000));
          const minutes = Math.floor(remainingSeconds / 60);
          const seconds = remainingSeconds % 60;
          setTimeRemaining(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
        }
      };
      updateProgress();

      if (Date.now() < targetProductReadyTime) {
        intervalId = setInterval(updateProgress, 1000);
      } else {
         if (!isReadyToCollectVisual) {
            setProgress(100);
            setTimeRemaining(t('AnimalPenCard.ready'));
            setIsReadyToCollectVisual(true);
        }
      }
    } else {
      setProgress(0);
      setTimeRemaining(null);
      setIsReadyToCollectVisual(false);
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [pen.animalTypeId, pen.animalPlacedTime, pen.productReadyTime, pen.upgradeLevel, placedAnimalType, animalProduct, isReadyToCollectVisual]);


  const canAffordUpgrade = pen.currentUpgradeCost !== undefined && currentCurrency >= pen.currentUpgradeCost;
  const isMaxLevel = pen.upgradeLevel >= MAX_UPGRADE_LEVEL;
  const nextUpgradeLevel = pen.upgradeLevel + 1;
  const upgradePreviewPct = placedAnimalType && placedAnimalType.productionTime > 0
    ? Math.round((upgradeThroughput(placedAnimalType.productYield, placedAnimalType.productionTime, nextUpgradeLevel, ANIMAL_PEN_UPGRADE_TIME_FACTOR_PER_LEVEL) - 1) * 100)
    : null;
  const canButcher = !!placedAnimalType && !!placedAnimalType.meatProductId && placedAnimalType.butcherYield > 0;

  return (
    <Card className="w-full flex flex-col justify-between group border-[3px] border-[#5D4037] bg-[#EFEBE9] transition-transform duration-200 hover:scale-105">
      <div>
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-base font-semibold flex items-center justify-between text-[#3E2723]">
            {t('AnimalPenCard.title', { id: pen.id.substring(0, 4) })}
            <span className="flex items-center text-sm text-[#5D4037]">
              <Star className="h-4 w-4 mr-1 text-yellow-600" /> {t('AnimalPenCard.level', { level: pen.upgradeLevel })}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 flex-grow flex flex-col justify-center min-h-[190px]">
          {placedAnimalType ? (
            <div className="space-y-2 flex flex-col items-center">
               {placedAnimalType.imageUrl && (
                <div className={`relative flex justify-center items-center h-24 w-24 ${isReadyToCollectVisual ? 'animate-bounce' : ''}`}>
                  <Image
                    src={placedAnimalType.imageUrl}
                    alt={t_items(`${placedAnimalType.id}.name`)}
                    fill
                    sizes="96px"
                    className="object-contain"
                    data-ai-hint={`${placedAnimalType.name.toLowerCase()} animal pen`}
                  />
                </div>
              )}
              {animalProduct && placedAnimalType.productionTime > 0 && !isReadyToCollectVisual && pen.animalPlacedTime && pen.productReadyTime ? (
                <>
                  <Progress value={progress} className="w-full h-3 border border-[#5D4037] bg-[#D7CCC8]" />
                  <p className="text-sm text-[#5D4037] text-center font-mono font-bold">
                    {timeRemaining}
                  </p>
                </>
              ) : null}
              {animalProduct && placedAnimalType.productionTime > 0 && isReadyToCollectVisual ? (
                <Button
                  onClick={() => onCollectProductClick(pen.id)}
                  className="w-full bg-[#FF9800] hover:bg-[#F57C00] active:scale-95 transition-transform text-white animate-pulse text-sm py-2 h-auto"
                >
                  <CheckCircle className="mr-1 h-4 w-4" />
                  {t('AnimalPenCard.collect')}
                </Button>
              ) : (
                 !pen.animalPlacedTime && pen.animalTypeId && placedAnimalType.productionTime > 0 ?
                 <p className="text-sm text-center text-[#5D4037] mt-1 font-mono font-bold">{t('AnimalPenCard.waiting')}</p> : 
                 !isReadyToCollectVisual && pen.animalPlacedTime && pen.animalTypeId && placedAnimalType.productionTime > 0 ?
                 <p className="text-sm text-center text-[#5D4037] mt-1 font-mono font-bold">{t('AnimalPenCard.producing')}</p> 
                 : null
              )}
              <Button
                  onClick={() => onBuyAnimalClick(pen.id)}
                  variant="outline"
                  className="w-full h-10 border-[#5D4037] text-[#5D4037] hover:bg-[#D7CCC8] text-xs font-bold"
              >
                  <ArrowRightLeft className="mr-1 h-4 w-4 shrink-0" />
                  {t('AnimalPenCard.switchAnimal')}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-[#8D6E63] flex-grow">
              <PlusCircle className="h-12 w-12 mb-2" />
              <Button onClick={() => onBuyAnimalClick(pen.id)} className="w-full bg-[#A1887F] hover:bg-[#8D6E63] text-white text-sm py-2 h-auto">
                {t('AnimalPenCard.buy')}
              </Button>
            </div>
          )}
        </CardContent>
      </div>
      <CardFooter className="p-4 pt-0 mt-auto flex flex-col gap-2">
        {!isMaxLevel && (
            <Button
              onClick={() => onUpgradeAnimalPen(pen.id)}
              disabled={!canAffordUpgrade}
              variant="outline"
              className="w-full h-10 text-xs bg-[#D7CCC8] text-[#3E2723] border-[#5D4037] hover:bg-[#BCAAA4] active:scale-[0.98] transition-transform font-bold"
            >
              <Zap className="mr-1 h-4 w-4 shrink-0" />
              <span className="truncate">{t('AnimalPenCard.upgrade', { level: pen.upgradeLevel + 1, cost: pen.currentUpgradeCost })}</span>
              {upgradePreviewPct !== null && <span className="ml-1 font-normal opacity-80 shrink-0">(+{upgradePreviewPct}%)</span>}
            </Button>
        )}
        {canButcher && (
            <Button
                onClick={() => onButcherAnimalClick(pen.id)}
                variant="outline"
                aria-label={t('AnimalPenCard.butcher')}
                title={t('AnimalPenCard.butcher')}
                className="w-full h-10 shrink-0 border-red-800 text-red-800 hover:bg-red-100 active:scale-[0.98] transition-transform text-xs font-bold"
            >
                <Slice className="mr-1 h-4 w-4 shrink-0" />
                {t('AnimalPenCard.butcher')}
            </Button>
        )}
      </CardFooter>
    </Card>
  );
}

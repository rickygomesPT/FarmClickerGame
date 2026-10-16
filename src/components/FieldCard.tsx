
// ============================================================================
// 💡 O QUE É ESTE COMPONENTE?
//
// "FieldCard" = o cartão visual de UM campo (mostra a planta, a barra de
// progresso do crescimento, os botões Plantar/Colher/Replantar/Melhorar).
//
// Regra de ouro: este componente é apenas VISUAL.
// Quando o jogador clica, ele chama uma das funções que recebe como props
// (onPlantClick, onHarvestClick, ...). Quem decide o que ACONTECE é o
// `page.tsx`. É por isso que este ficheiro não mexe nas moedas nem no XP.
//
// 🔧 ALTERAR AQUI para: mudar a aparência do cartão do campo
//    (cores, textos dos botões, ícones, layout).
// ⚠️ CUIDADO: qualquer botão/dia alead `disabled` é decidido pelas
//    variáveis `can*` definidas abaixo. Se mudar algo nelas, verifique
//    que os textos/botões continuam a fazer sentido.
// ============================================================================

import type React from 'react';
import { useState, useEffect } from 'react';
import type { Field, Inventory } from '@/types/game';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sprout, CheckCircle, Zap, Star, RefreshCcw, ArrowRightLeft, Droplets } from 'lucide-react';
import Image from 'next/image';
import {
  AVAILABLE_CROPS,
  AVAILABLE_CRAFTABLE_ITEMS,
  MAX_UPGRADE_LEVEL,
  FIELD_UPGRADE_TIME_FACTOR_PER_LEVEL
} from '@/config/gameConfig';
import { upgradeThroughput } from '@/lib/game/upgrades';
import { t, t_items } from '@/lib/i18n';


interface FieldCardProps {
  field: Field;
  inventory: Inventory;
  onPlantClick: (fieldId: string) => void;
  onHarvestClick: (fieldId: string) => void;
  onReplantClick: (fieldId: string) => void;
  onUpgradeField: (fieldId: string) => void;
  onUseWateringCan: (fieldId: string) => void;
  currentCurrency: number;
  currentLevel: number;
}

export function FieldCard({ 
  field, 
  inventory,
  onPlantClick, 
  onHarvestClick, 
  onReplantClick, 
  onUpgradeField, 
  onUseWateringCan,
  currentCurrency,
  currentLevel
}: FieldCardProps) {
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  const [isReadyToHarvestVisual, setIsReadyToHarvestVisual] = useState(false);

  const plantedCrop = field.cropId ? AVAILABLE_CROPS.find(c => c.id === field.cropId) : null;
  const isHarvestedAndAwaitingAction = plantedCrop && !field.plantTime && !field.harvestReadyTime;


  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;

    setProgress(0);
    setTimeRemaining(null);
    setIsReadyToHarvestVisual(false);

    if (plantedCrop && field.plantTime && field.harvestReadyTime && typeof field.upgradeLevel === 'number') {
      const targetHarvestTime = field.harvestReadyTime; 

      const updateProgress = () => {
        const now = Date.now();
        if (now >= targetHarvestTime) {
          setProgress(100);
          setTimeRemaining(t('FieldCard.ready'));
          setIsReadyToHarvestVisual(true);
          if (intervalId) clearInterval(intervalId);
        } else {
          setIsReadyToHarvestVisual(false);
          const totalDurationForProgress = targetHarvestTime - field.plantTime!; 
          const elapsedTime = now - field.plantTime!;
          const currentProgress = totalDurationForProgress > 0 ? Math.min(100, (elapsedTime / totalDurationForProgress) * 100) : 100;
          setProgress(currentProgress);

          const remainingSeconds = Math.max(0, Math.ceil((targetHarvestTime - now) / 1000));
          const minutes = Math.floor(remainingSeconds / 60);
          const seconds = remainingSeconds % 60;
          setTimeRemaining(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
        }
      };

      updateProgress(); 

      if (Date.now() < targetHarvestTime) {
        intervalId = setInterval(updateProgress, 1000);
      } else {
        if (!isReadyToHarvestVisual) { 
            setProgress(100);
            setTimeRemaining(t('FieldCard.ready'));
            setIsReadyToHarvestVisual(true);
        }
      }
    } else { 
      setProgress(0);
      setTimeRemaining(null);
      setIsReadyToHarvestVisual(false);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [field.cropId, field.plantTime, field.harvestReadyTime, field.upgradeLevel, plantedCrop, isReadyToHarvestVisual]);


  const canAffordUpgrade = field.currentUpgradeCost !== undefined && currentCurrency >= field.currentUpgradeCost;
  const isMaxLevel = field.upgradeLevel >= MAX_UPGRADE_LEVEL;
  const canAffordReplant = plantedCrop && currentCurrency >= plantedCrop.seedCost;
  const meetsLevelForReplant = plantedCrop && currentLevel >= plantedCrop.minLevel;
  const nextUpgradeLevel = field.upgradeLevel + 1;
  const upgradePreviewPct = plantedCrop
    ? Math.round((upgradeThroughput(plantedCrop.harvestYield, plantedCrop.growthTime, nextUpgradeLevel, FIELD_UPGRADE_TIME_FACTOR_PER_LEVEL) - 1) * 100)
    : null;
  const wateringCanCount = inventory['watering_can'] || 0;
  const wateringCanPercent = AVAILABLE_CRAFTABLE_ITEMS.find(item => item.id === 'watering_can')?.effect?.value ?? 25;


  return (
    <Card className="w-full flex flex-col justify-between group border-[3px] border-[#5D4037] bg-[#EFEBE9] transition-transform duration-200 hover:scale-105">
      <div>
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-base font-semibold flex items-center justify-between text-[#3E2723]">
            {t('FieldCard.title', { id: field.id.substring(0, 4) })}
            <span className="flex items-center text-sm text-[#5D4037]">
              <Star className="h-4 w-4 mr-1 text-yellow-600" /> {t('FieldCard.level', { level: field.upgradeLevel })}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 flex-grow flex flex-col justify-center min-h-[190px]">
          {field.cropId && plantedCrop ? (
            <div className="space-y-2 flex flex-col items-center">
              <div className={`relative flex justify-center items-center h-24 w-24 ${isReadyToHarvestVisual ? 'animate-bounce' : ''}`}>
                {plantedCrop.imageUrl ? (
                  <Image
                    src={plantedCrop.imageUrl}
                    alt={t_items(`${plantedCrop.id}.name`)}
                    fill
                    sizes="96px"
                    className="object-contain"
                    data-ai-hint={`${plantedCrop.name.toLowerCase()} crop`}
                  />
                ) : (
                  <Sprout className="h-16 w-16 text-[#8BC34A]" />
                )}
              </div>
              {!isReadyToHarvestVisual && field.plantTime && field.harvestReadyTime ? ( // Growing
                <>
                  <Progress value={progress} className="w-full h-3 border border-[#5D4037] bg-[#D7CCC8]" />
                  <p className="text-sm text-[#5D4037] text-center font-mono font-bold">
                    {timeRemaining}
                  </p>
                  {wateringCanCount > 0 && (
                    <Button
                      onClick={() => onUseWateringCan(field.id)}
                      variant="outline"
                      className="w-full h-8 text-xs border-[#0288D1] text-[#0288D1] hover:bg-[#B3E5FC] active:scale-95 transition-transform"
                    >
                      <Droplets className="mr-1 h-4 w-4" />
                      {t('FieldCard.water', { percent: wateringCanPercent })}
                    </Button>
                  )}
                </>
              ) : isReadyToHarvestVisual ? ( // Ready to harvest
                <Button
                  onClick={() => onHarvestClick(field.id)}
                  className="w-full bg-[#FF9800] hover:bg-[#F57C00] active:scale-95 transition-transform text-white animate-pulse text-sm py-2 h-auto"
                >
                  <CheckCircle className="mr-1 h-4 w-4" />
                  {t('FieldCard.harvest')}
                </Button>
              ) : isHarvestedAndAwaitingAction ? (
                <div className="flex flex-col gap-2 w-full">
                  <Button
                      onClick={() => onReplantClick(field.id)}
                      className="w-full bg-[#8BC34A] hover:bg-[#689F38] active:scale-95 transition-transform text-white text-sm py-2 h-auto"
                      disabled={!canAffordReplant || !meetsLevelForReplant}
                  >
                      <RefreshCcw className="mr-1 h-4 w-4" />
                      {t('FieldCard.replant')}
                  </Button>
                  <Button
                    onClick={() => onPlantClick(field.id)}
                    variant="outline"
                    className="w-full h-10 border-[#5D4037] text-[#5D4037] hover:bg-[#D7CCC8] text-xs font-bold"
                  >
                    <ArrowRightLeft className="mr-1 h-4 w-4 shrink-0" />
                    {t('FieldCard.switchCrop')}
                  </Button>
                </div>
              ) : null}
            </div>
          ) : ( // Empty
            <div className="flex flex-col items-center justify-center text-[#8D6E63] flex-grow">
              <Sprout className="h-12 w-12 mb-2" />
              <Button onClick={() => onPlantClick(field.id)} className="w-full bg-[#A1887F] hover:bg-[#8D6E63] active:scale-95 transition-transform text-white text-sm py-2 h-auto">
                {t('FieldCard.plant')}
              </Button>
            </div>
          )}
        </CardContent>
      </div>
      <CardFooter className="p-4 pt-0 mt-auto flex gap-2">
        {!isMaxLevel && (
            <Button
              onClick={() => onUpgradeField(field.id)}
              disabled={!canAffordUpgrade}
              variant="outline"
              className="w-full h-10 text-xs bg-[#D7CCC8] text-[#3E2723] border-[#5D4037] hover:bg-[#BCAAA4] active:scale-[0.98] transition-transform font-bold"
            >
              <Zap className="mr-1 h-4 w-4" />
              {t('FieldCard.upgrade', { level: field.upgradeLevel + 1, cost: field.currentUpgradeCost })}
              {upgradePreviewPct !== null && <span className="ml-1 font-normal opacity-80">(+{upgradePreviewPct}%)</span>}
            </Button>
        )}
      </CardFooter>
    </Card>
  );
}

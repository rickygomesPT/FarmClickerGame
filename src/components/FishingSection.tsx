
'use client';

import type React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Fish as FishIconSymbol, RefreshCw, ShoppingCart } from 'lucide-react'; 
import { FISHING_GRID_COLS, BAIT_PACK_SIZE } from '@/config/gameConfig';
import Image from 'next/image';
import { t } from '@/lib/i18n';

interface FishingSectionProps {
  fishingGrid: (string | 'CLICKED_EMPTY' | null)[][] | null;
  baitCount: number;
  onBuyBait: () => void;
  onRefreshGrid: () => void;
  onCellClick: (row: number, col: number) => void;
  currentCurrency: number;
  baitCost: number;
}

export function FishingSection({
  fishingGrid,
  baitCount,
  onBuyBait,
  onRefreshGrid,
  onCellClick,
  currentCurrency,
  baitCost,
}: FishingSectionProps) {
  
  const getGridCellContent = (): React.ReactNode => {
    return (
      <Image 
        src="/images/onda.png" 
        alt={t('FishingSection.imageAlt')} 
        width={32} 
        height={32} 
        className="object-cover"
        data-ai-hint="water wave"
      />
    );
  };

  return (
    <div className="space-y-4">
      <Card className="border-[3px] border-[#5D4037] bg-[#EFEBE9]">
        <CardHeader className="p-3 pb-0">
          <CardTitle className="text-xl font-bold font-headline text-[#3E2723] flex items-center">
            <FishIconSymbol className="mr-2 h-6 w-6" /> 
            {t('FishingSection.title')}
          </CardTitle>
          <CardDescription className="text-[#5D4037]">{t('FishingSection.description')}</CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-1">
              <div className="rounded-md bg-[#D7CCC8] border border-[#5D4037] p-3 text-center">
                <p className="text-sm font-semibold text-[#3E2723] flex items-center justify-center">
                  {t('FishingSection.baitLabel')}
                  <Image
                    src="/images/isca.png"
                    alt={t('FishingSection.baitImageAlt')}
                    width={16}
                    height={16}
                    className="inline mx-1"
                    data-ai-hint="fishing bait"
                  />
                  <span className="font-mono font-bold text-base ml-1">{baitCount}</span>
                </p>
              </div>
              <Button
                onClick={onBuyBait}
                disabled={currentCurrency < baitCost}
                className="w-full h-10 text-sm bg-[#8BC34A] hover:bg-[#689F38] text-white"
                variant="outline"
              >
                <ShoppingCart className="mr-1 h-4 w-4" /> {t('FishingSection.buyBait', { amount: BAIT_PACK_SIZE, cost: baitCost })}
              </Button>
              <Button onClick={onRefreshGrid} className="w-full h-10 text-sm bg-[#A1887F] hover:bg-[#8D6E63] text-white">
                <RefreshCw className="mr-1 h-4 w-4" /> {t('FishingSection.refresh')}
              </Button>
            </div>
            <div className="md:col-span-2">
              {!fishingGrid ? (
                <div className="flex justify-center items-center h-40">
                  <p className="text-[#5D4037]">{t('FishingSection.loading')}</p>
                </div>
              ) : (
                <div
                  className="grid gap-1.5 bg-[#BCAAA4] p-1.5 rounded-md border border-[#5D4037] shadow-inner w-full"
                  style={{ gridTemplateColumns: `repeat(${FISHING_GRID_COLS}, minmax(0, 1fr))` }}
                >
                  {fishingGrid.map((row, rowIndex) =>
                    row.map((cellState, colIndex) => (
                      <Button
                        key={`${rowIndex}-${colIndex}`}
                        variant="outline"
                        className="aspect-square w-full h-auto p-0.5 sm:p-1 flex items-center justify-center bg-[#EFEBE9] hover:bg-[#D7CCC8] hover:scale-105 active:scale-90 transition-transform border-[#5D4037] disabled:opacity-60 disabled:hover:scale-100"
                        onClick={() => onCellClick(rowIndex, colIndex)}
                        disabled={baitCount === 0 || cellState === 'CLICKED_EMPTY'}
                        aria-label={t('FishingSection.cellAria', { row: rowIndex + 1, col: colIndex + 1 })}
                      >
                        {getGridCellContent()}
                      </Button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


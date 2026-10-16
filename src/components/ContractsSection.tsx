'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, Package, PackageCheck, Pin, PinOff, Timer } from 'lucide-react';
import Image from 'next/image';
import { ALL_SELLABLE_ITEMS } from '@/config/gameConfig';
import { canFulfillContract } from '@/lib/game/contracts';
import { t, t_items } from '@/lib/i18n';
import type { Contract, Inventory } from '@/types/game';

function formatCountdown(ms: number): string {
  if (ms <= 0) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`;
}

interface ContractsSectionProps {
  contracts: Contract[];
  nextContractAt: number;
  inventory: Inventory;
  onDeliver: (contractId: string) => void;
  onTogglePin: (contractId: string) => void;
}

export function ContractsSection({ contracts, nextContractAt, inventory, onDeliver, onTogglePin }: ContractsSectionProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-4">
      <Card className="border-[3px] border-[#5D4037] bg-[#EFEBE9]">
        <CardHeader className="p-3 pb-0">
          <CardTitle className="text-xl font-bold font-headline text-[#3E2723] flex items-center">
            <PackageCheck className="mr-2 h-6 w-6" />
            {t('ContractsSection.title')}
            {contracts.length > 0 && <span className="ml-2 text-base font-mono">({contracts.length})</span>}
          </CardTitle>
          <CardDescription className="text-[#5D4037]">{t('ContractsSection.description')}</CardDescription>
        </CardHeader>
        <CardContent className="p-3 space-y-3">
          {contracts.length === 0 && (
            <div className="text-center py-6 space-y-2">
              <Package className="h-10 w-10 mx-auto text-[#8D6E63]" />
              <p className="text-[#5D4037]">{t('ContractsSection.empty')}</p>
              <p className="text-sm text-[#8D6E63] flex items-center justify-center gap-1">
                <Timer className="h-4 w-4" />
                {t('ContractsSection.nextIn', { time: formatCountdown(nextContractAt - now) })}
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {contracts.map(contract => {
            const fulfillable = canFulfillContract(inventory, contract.requirements);
            return (
              <div key={contract.id} className="space-y-3 rounded-md border-2 border-[#8D6E63]/40 bg-[#FFF8E1]/60 p-3">
                <div className="space-y-2">
                  {contract.requirements.map(req => {
                    const definition = ALL_SELLABLE_ITEMS.find(item => item.id === req.itemId);
                    const Icon = definition?.icon ?? Package;
                    const have = inventory[req.itemId] || 0;
                    const name = definition ? t_items(`${req.itemId}.name`) : req.itemId;
                    return (
                      <div key={req.itemId} className="flex items-center justify-between bg-[#FFF8E1] border border-[#8D6E63]/40 rounded-md px-3 py-2">
                        <span className="flex items-center gap-2 text-[#3E2723] font-semibold text-sm">
                          {definition?.imageUrl ? (
                            <span className="relative h-6 w-6 shrink-0">
                              <Image src={definition.imageUrl} alt={name} fill sizes="24px" className="object-contain" />
                            </span>
                          ) : (
                            <Icon className="h-5 w-5 shrink-0" />
                          )}
                          {name} ×{req.quantity}
                        </span>
                        <span className={`text-xs font-mono font-bold ${have >= req.quantity ? 'text-green-700' : 'text-red-700'}`}>
                          {t('ContractsSection.progress', { have, need: req.quantity })}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 font-semibold text-[#3E2723]">
                    <Coins className="h-4 w-4 text-[#FF9800]" />
                    {t('ContractsSection.reward')}: {contract.rewardCoins} + {contract.rewardXp} XP
                  </span>
                  <span className="flex items-center gap-1 text-[#8D6E63]">
                    {contract.pinned ? (
                      <>
                        <Pin className="h-4 w-4 text-[#FF9800]" />
                        {t('ContractsSection.pinned')}
                      </>
                    ) : (
                      <>
                        <Timer className="h-4 w-4" />
                        {t('ContractsSection.expires', { time: formatCountdown(contract.expiresAt - now) })}
                      </>
                    )}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => onDeliver(contract.id)}
                    disabled={!fulfillable}
                    className="flex-1 bg-[#8BC34A] hover:bg-[#689F38] active:scale-[0.98] transition-transform text-white"
                  >
                    <PackageCheck className="mr-2 h-5 w-5" />
                    {t('ContractsSection.deliver')}
                  </Button>
                  <Button
                    onClick={() => onTogglePin(contract.id)}
                    variant="outline"
                    aria-pressed={contract.pinned}
                    title={t(contract.pinned ? 'ContractsSection.unpin' : 'ContractsSection.pin')}
                    aria-label={t(contract.pinned ? 'ContractsSection.unpin' : 'ContractsSection.pin')}
                    className={`h-10 w-10 shrink-0 p-0 ${contract.pinned ? 'border-[#FF9800] text-[#FF9800] bg-[#FFF8E1]' : 'border-[#5D4037] text-[#5D4037] hover:bg-[#D7CCC8]'}`}
                  >
                    {contract.pinned ? <PinOff className="h-5 w-5" /> : <Pin className="h-5 w-5" />}
                  </Button>
                </div>
              </div>
            );
          })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import React, { useState } from 'react';
import { Sprout as SproutIcon } from 'lucide-react';
import type { Inventory as InventoryType } from '@/types/game';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ALL_SELLABLE_ITEMS } from '@/config/gameConfig';
import Image from 'next/image';
import { t, t_items } from '@/lib/i18n';

interface InventoryPanelProps {
  inventory: InventoryType;
  onSellItem: (itemId: string, amount: number) => void;
}

export function InventoryPanel({ inventory, onSellItem }: InventoryPanelProps) {
  const plainInventory = inventory && typeof inventory === 'object' ? { ...inventory } : {};
  const [sellAmounts, setSellAmounts] = useState<{[itemId: string]: string}>({});

  const handleSellAmountChange = (itemId: string, value: string) => {
    const numValue = parseInt(value);
    const itemQuantity = plainInventory[itemId] || 0;
    if (value === '' || (numValue > 0 && numValue <= itemQuantity)) {
       setSellAmounts(prev => ({...prev, [itemId]: value}));
    } else if (numValue > itemQuantity) {
      setSellAmounts(prev => ({...prev, [itemId]: itemQuantity.toString()}));
    } else if (numValue <= 0 && value !== '') {
       setSellAmounts(prev => ({...prev, [itemId]: '1'}));
    }
  };

  const getItemFromId = (itemId: string) => ALL_SELLABLE_ITEMS.find(item => item.id === itemId);

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const inventoryEntries = Object.entries(plainInventory)
    .filter(([, quantity]) => quantity > 0)
    .map(([itemId]) => itemId)
    .filter(itemId => getItemFromId(itemId));
  const selectedId = selectedItemId && inventoryEntries.includes(selectedItemId) ? selectedItemId : inventoryEntries[0] ?? null;
  const selectedItem = selectedId ? getItemFromId(selectedId) : undefined;
  const selectedQuantity = selectedId ? plainInventory[selectedId] || 0 : 0;

  let isInventoryEffectivelyEmpty = true;
  for (const key in plainInventory) {
    if (Object.prototype.hasOwnProperty.call(plainInventory, key) && plainInventory[key] > 0) {
      isInventoryEffectivelyEmpty = false;
      break;
    }
  }

  return (
    <Card className="border-[3px] border-[#5D4037] bg-[#EFEBE9]">
      <CardHeader className="p-4 pb-1">
        <CardTitle className="font-headline text-xl md:text-2xl text-[#3E2723]">{t('ControlPanel.inventoryTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        {isInventoryEffectivelyEmpty && (
          <p className="text-[#5D4037] text-center py-8">{t('ControlPanel.inventoryEmpty')}</p>
        )}
        {selectedItem && selectedId && (
          <div className="rounded-md border-2 border-[#5D4037] bg-[#D7CCC8] p-4 space-y-2 max-w-xl">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-base text-[#3E2723]">{t_items(`${selectedId}.name`)}</span>
              <Badge variant="secondary" className="text-lg bg-[#EFEBE9] text-[#3E2723]">x{selectedQuantity}</Badge>
            </div>
            <p className="text-sm text-[#5D4037]">{t('ControlPanel.pricePerUnit', { price: selectedItem.sellPrice })}</p>
            <div className="flex items-stretch space-x-2">
              <Input
                type="number"
                min="1"
                max={selectedQuantity}
                value={sellAmounts[selectedId] || ''}
                onChange={(e) => handleSellAmountChange(selectedId, e.target.value)}
                placeholder={t('ControlPanel.quantityPlaceholder')}
                className="w-24 h-10 text-sm bg-[#EFEBE9] border-[#5D4037]"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const amount = parseInt(sellAmounts[selectedId] || '0');
                  if (amount > 0 && amount <= selectedQuantity) {
                    onSellItem(selectedId, amount);
                    setSellAmounts(prev => ({...prev, [selectedId]: ''}));
                  }
                }}
                disabled={!sellAmounts[selectedId] || parseInt(sellAmounts[selectedId]) <= 0 || parseInt(sellAmounts[selectedId]) > selectedQuantity}
                className="h-10 text-sm bg-[#A1887F] text-white"
              >
                {t('ControlPanel.sell')}
              </Button>
            </div>
          </div>
        )}
        {!isInventoryEffectivelyEmpty && (
          <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-8 gap-2">
            {inventoryEntries.map(itemId => {
              const item = getItemFromId(itemId);
              if (!item) return null;
              const ItemIcon = item.icon || SproutIcon;
              const quantity = plainInventory[itemId] || 0;
              const isSelected = itemId === selectedId;
              const itemName = t_items(`${itemId}.name`);
              return (
                <button
                  key={itemId}
                  onClick={() => setSelectedItemId(itemId)}
                  title={itemName}
                  aria-label={itemName}
                  aria-pressed={isSelected}
                  className={`relative flex flex-col items-center justify-center rounded-md border-2 px-1 py-1.5 transition-all active:scale-95 ${isSelected ? 'border-[#FF9800] bg-[#FFF8E1]' : 'border-[#5D4037]/40 bg-[#D7CCC8] hover:border-[#5D4037]'}`}
                >
                  <span className="w-full truncate text-center text-[10px] sm:text-xs font-semibold text-[#3E2723] leading-tight">{itemName}</span>
                  <span className="relative block h-10 w-10 sm:h-12 sm:w-12">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={itemName}
                        fill
                        sizes="48px"
                        className="object-contain rounded-sm"
                        data-ai-hint={`${item.name.toLowerCase()} icon`}
                      />
                    ) : (
                      <ItemIcon className="h-full w-full text-[#3E2723]" />
                    )}
                  </span>
                  <span className="absolute -bottom-1 -right-1 text-base font-mono font-bold bg-[#EFEBE9] text-[#3E2723] border border-[#5D4037] rounded-full px-1.5">x{quantity}</span>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

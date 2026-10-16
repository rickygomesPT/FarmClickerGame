
import type { AnimalType } from '@/types/game';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Coins, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import { t, t_items } from '@/lib/i18n';

interface BuyAnimalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  availableAnimals: AnimalType[];
  onBuyAnimal: (animalTypeId: string) => void;
  currentCurrency: number;
}

export function BuyAnimalDialog({
  isOpen,
  onClose,
  availableAnimals,
  onBuyAnimal,
  currentCurrency,
}: BuyAnimalDialogProps) {

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl md:max-w-5xl bg-card text-card-foreground max-h-[92dvh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="font-headline text-lg sm:text-xl md:text-2xl flex items-center"><ShoppingCart className="mr-2 h-6 w-6 text-primary"/>{t('BuyAnimalDialog.title')}</DialogTitle>
          <DialogDescription className="text-sm sm:text-base md:text-lg">{t('BuyAnimalDialog.description')}</DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain my-2 pr-3 [scrollbar-width:thin]">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 py-2">
            {availableAnimals.length === 0 && (
              <p className="col-span-full text-center text-muted-foreground py-10 text-base md:text-lg">{t('BuyAnimalDialog.noAnimals')}</p>
            )}
            {availableAnimals.map((animal) => {
              const AnimalIcon = animal.icon;
              const canAfford = currentCurrency >= animal.cost;
              const canBuy = canAfford;

              return (
                <Card 
                  key={animal.id} 
                  className={`transition-all duration-200 ease-in-out overflow-hidden ${!canBuy ? 'bg-muted/30 opacity-70' : 'hover:shadow-lg'}`}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className={`relative flex-shrink-0 p-1 rounded-md ${!canBuy ? 'bg-muted/50' : 'bg-primary/10'} w-[60px] h-[60px] flex items-center justify-center`}>
                      {animal.imageUrl ? (
                        <Image
                          src={animal.imageUrl}
                          alt={t_items(`${animal.id}.name`)}
                          fill
                          sizes="60px"
                          className="object-contain rounded"
                          data-ai-hint={`${animal.name.toLowerCase()} icon`}
                        />
                      ) : (
                        <AnimalIcon className={`h-[50px] w-[50px] ${!canBuy ? 'text-muted-foreground' : 'text-primary'}`} />
                      )}
                    </div>

                    <div className="flex-grow min-w-0">
                      <h3 className="text-lg font-semibold font-headline truncate" title={t_items(`${animal.id}.name`)}>{t_items(`${animal.id}.name`)}</h3>
                      <div className="text-sm mt-1">
                        <span className="mr-3">{t('BuyAnimalDialog.minLevel', { level: animal.minLevel })}</span>
                        <span className="flex items-center">
                          {t('BuyAnimalDialog.cost', { cost: animal.cost })} <Coins className="h-4 w-4 ml-1 text-accent" />
                        </span>
                      </div>
                    </div>

                    <div className="flex-shrink-0 flex flex-col items-end">
                      <Button
                        size="sm"
                        onClick={() => {
                          if (canBuy) {
                            onBuyAnimal(animal.id);
                            onClose();
                          }
                        }}
                        disabled={!canBuy}
                        className={`w-full min-w-[90px] text-base py-2.5 ${canBuy ? 'bg-primary hover:bg-primary/90' : 'bg-secondary hover:bg-secondary/80'}`}
                      >
                        {t('BuyAnimalDialog.buy')}
                      </Button>
                      {!canAfford && <p className="text-xs text-destructive mt-1">{t('BuyAnimalDialog.notEnoughCoins')}</p>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
        <DialogFooter className="mt-2 flex-shrink-0">
          <Button variant="outline" onClick={onClose} className="text-base py-2.5">
            {t('BuyAnimalDialog.cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

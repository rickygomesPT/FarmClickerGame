import React, { useMemo } from 'react';
import { Sprout as SproutIcon, Package } from 'lucide-react';
import type { Inventory as InventoryType, Recipe } from '@/types/game';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from './ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ALL_SELLABLE_ITEMS, AVAILABLE_CROPS, AVAILABLE_ANIMALS } from '@/config/gameConfig';
import Image from 'next/image';
import { t, t_items } from '@/lib/i18n';

interface RecipesPanelProps {
  inventory: InventoryType;
  availableRecipes: Recipe[];
  onCraftItem: (recipeId: string) => void;
  onCollectWater: () => void;
  currentLevel: number;
}

export function RecipesPanel({
  inventory,
  availableRecipes,
  onCraftItem,
  onCollectWater,
  currentLevel,
}: RecipesPanelProps) {
  const plainInventory = inventory && typeof inventory === 'object' ? { ...inventory } : {};

  const checkCanCraft = (recipe: Recipe) => {
    for (const ingredient of recipe.ingredients) {
      let hasIngredient = false;
      if (recipe.id === 'recipe_omelette' && ingredient.itemId === 'egg') {
        if ((plainInventory['egg'] || 0) >= ingredient.quantity || (plainInventory['duck_egg'] || 0) >= ingredient.quantity) {
          hasIngredient = true;
        }
      } else if (recipe.id === 'recipe_cheese' && ingredient.itemId === 'milk') {
        if ((plainInventory['milk'] || 0) >= ingredient.quantity || (plainInventory['goat_milk'] || 0) >= ingredient.quantity) {
          hasIngredient = true;
        }
      } else {
        if ((plainInventory[ingredient.itemId] || 0) >= ingredient.quantity) {
          hasIngredient = true;
        }
      }
      if (!hasIngredient) return false;
    }
    return true;
  };

  const wateringCanRecipeId = 'recipe_watering_can';
  const wateringCanRecipe = availableRecipes.find(r => r.id === wateringCanRecipeId);

  let canCraftWateringCan = false;
  let wateringCanTooltipContent: React.ReactNode = t('ControlPanel.createOneWateringCan');

  if (wateringCanRecipe) {
    const waterNeeded = wateringCanRecipe.ingredients.find(i => i.itemId === 'water')?.quantity || 10;
    const waterOwned = plainInventory['water'] || 0;
    const hasEnoughWater = waterOwned >= waterNeeded;
    const meetsLevelRequirement = wateringCanRecipe.minLevelRequired ? currentLevel >= wateringCanRecipe.minLevelRequired : true;

    canCraftWateringCan = hasEnoughWater && meetsLevelRequirement;

    const ingredientsList = t('ControlPanel.waterIngredients', { needed: waterNeeded, owned: waterOwned });
    const effectDescription = t_items('watering_can.description') || '';

    let title = t('ControlPanel.createOneWateringCan');
    if (!meetsLevelRequirement && wateringCanRecipe.minLevelRequired) {
      title = t('ControlPanel.levelRequired', { level: wateringCanRecipe.minLevelRequired });
    } else if (!hasEnoughWater) {
      title = t('ControlPanel.insufficientIngredients');
    }

    wateringCanTooltipContent = (
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-xs opacity-80">{ingredientsList}</p>
        <p className="text-xs opacity-80">{effectDescription}</p>
      </div>
    );
  }

  const recipesToDisplay = useMemo(() => {
    return availableRecipes
      .filter(recipe => {
        if (recipe.id === wateringCanRecipeId) return false;
        if (recipe.minLevelRequired && currentLevel < recipe.minLevelRequired) {
          return false;
        }

        // Check if player has unlocked the sources for all ingredients
        for (const ingredient of recipe.ingredients) {
          const item = ALL_SELLABLE_ITEMS.find(i => i.id === ingredient.itemId);
          if (!item) return false; // Ingredient doesn't exist in the game config

          if (item.type === 'crop') {
            const crop = AVAILABLE_CROPS.find(c => c.id === item.id || c.productId === item.id);
            if (!crop || currentLevel < crop.minLevel) return false;
          } else if (item.type === 'animal_product') {
            const animal = AVAILABLE_ANIMALS.find(a => a.productId === item.id || a.meatProductId === item.id);
            if (!animal || currentLevel < animal.minLevel) return false;
          }
          // For 'crafted_item' or 'resource', we assume if the recipe is unlocked,
          // the source recipes are also available or they are basic resources like water.
        }

        return true;
      })
      .sort((a, b) => {
        const canCraftA = checkCanCraft(a);
        const canCraftB = checkCanCraft(b);
        if (canCraftA && !canCraftB) return -1;
        if (!canCraftA && canCraftB) return 1;
        return (a.minLevelRequired || 0) - (b.minLevelRequired || 0) || a.name.localeCompare(b.name);
      });
  }, [availableRecipes, currentLevel, inventory]);

  return (
    <Card className="border-[3px] border-[#5D4037] bg-[#EFEBE9]">
      <CardHeader className="p-5 flex-shrink-0">
        <CardTitle className="font-headline text-xl md:text-2xl">{t('ControlPanel.craftingBench')}</CardTitle>
        <CardDescription className="text-base md:text-lg">{t('ControlPanel.craftingDescription')}</CardDescription>
      </CardHeader>

      <div className="px-5 pt-0 pb-4 flex-shrink-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
          <Button onClick={onCollectWater} className="w-full text-base py-3.5">
            <Image src="/images/agua.png" alt="" width={24} height={24} className="mr-2" /> {t('ControlPanel.collectWater')}
          </Button>
          {(!wateringCanRecipe || currentLevel >= (wateringCanRecipe.minLevelRequired || 0)) && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0} className="inline-block w-full">
                    <Button
                      onClick={() => {
                        if (wateringCanRecipe) onCraftItem(wateringCanRecipe.id);
                      }}
                      disabled={!canCraftWateringCan}
                      className="w-full text-base py-3.5"
                      aria-label={t('ControlPanel.createWateringCanAria')}
                    >
                      <Image src="/images/regador.png" alt="" width={24} height={24} className="mr-2" /> {t('ControlPanel.createWateringCan')}
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent className="text-sm">
                  {wateringCanTooltipContent}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      <div className="px-5 pb-5">
        {recipesToDisplay.length === 0 ? (
            <p className="text-muted-foreground text-center py-4 text-base">{t('ControlPanel.noRecipesYet')}</p>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recipesToDisplay.map(recipe => {
                  const recipeDetails = availableRecipes.find(r => r.id === recipe.id);
                  if (!recipeDetails) return null;

                  let hasAllIngredients = true;
                  let reasonWhyNot = "";
                   if (recipeDetails.minLevelRequired && currentLevel < recipeDetails.minLevelRequired) {
                    hasAllIngredients = false;
                    reasonWhyNot = t('ControlPanel.requiresLevel', { level: recipeDetails.minLevelRequired });
                  } else {
                    hasAllIngredients = checkCanCraft(recipeDetails);
                     if (!hasAllIngredients) {
                        reasonWhyNot = t('ControlPanel.insufficientIngredients');
                    }
                  }

                  const canCraftThisRecipe = hasAllIngredients;
                  const producedItemDetails = ALL_SELLABLE_ITEMS.find(i => i.id === recipe.producesItemId);

                  return (
                    <Card key={recipe.id} className="p-3 bg-[#D7CCC8] border border-[#5D4037] space-y-2 flex flex-col">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-[#3E2723] flex items-center text-md">
                              {recipe.name}
                            </h4>
                             {recipeDetails.minLevelRequired && <p className="text-xs mt-0.5 text-[#5D4037]">{t('ControlPanel.minLevel', { level: recipeDetails.minLevelRequired })}</p>}
                          </div>
                          <div className="w-[50px] h-[50px] relative rounded-md border border-[#5D4037] p-0.5 flex-shrink-0 bg-[#EFEBE9]">
                            {producedItemDetails?.imageUrl ? (
                                <Image
                                  src={producedItemDetails.imageUrl}
                                  alt={producedItemDetails.name}
                                  fill
                                  sizes="50px"
                                  className="object-contain rounded-md"
                                  data-ai-hint={`${producedItemDetails.name.toLowerCase()} item icon`}
                                />
                              ): <Package className="h-full w-full text-[#5D4037]"/>}
                          </div>
                        </div>

                        <div className="flex-grow">
                          <p className="text-sm font-semibold mb-1.5 text-[#3E2723]">{t('ControlPanel.ingredients')}</p>
                          <ul className="space-y-1 text-xs text-[#3E2723] list-inside pl-1">
                            {recipeDetails.ingredients.map(ing => {
                              const itemDetails = ALL_SELLABLE_ITEMS.find(i => i.id === ing.itemId);
                              const IngredientIcon = itemDetails?.icon || SproutIcon;

                              let owned = 0;
                              let displayItemName = t_items(`${ing.itemId}.name`);

                              if (recipe.id === 'recipe_omelette' && ing.itemId === 'egg') {
                                owned = (plainInventory['egg'] || 0) + (plainInventory['duck_egg'] || 0);
                                displayItemName = t('ControlPanel.eggCombinedName');
                              } else if (recipe.id === 'recipe_cheese' && ing.itemId === 'milk') {
                                owned = (plainInventory['milk'] || 0) + (plainInventory['goat_milk'] || 0);
                                displayItemName = t('ControlPanel.milkCombinedName');
                              }
                              else {
                                owned = plainInventory[ing.itemId] || 0;
                              }

                              return (
                                <li key={`${recipe.id}-${ing.itemId}`} className={`flex items-center ${owned >= ing.quantity ? 'text-[#3E2723]' : 'text-red-900'}`}>
                                  <div className="w-8 h-8 relative mr-2 flex-shrink-0">
                                    {itemDetails?.imageUrl ? (
                                      <Image
                                        src={itemDetails.imageUrl}
                                        alt={displayItemName}
                                        fill
                                        sizes="32px"
                                        className="object-contain rounded-sm"
                                        data-ai-hint={`${(itemDetails?.name || ing.itemId).toLowerCase()} ingredient icon`}
                                      />
                                    ): (
                                      <IngredientIcon className="h-full w-full text-[#5D4037]" />
                                    )}
                                  </div>
                                  {t('ControlPanel.ingredientWithStock', { name: displayItemName, quantity: ing.quantity, owned })}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                        <Button
                          size="sm"
                          className="w-full mt-auto h-9 text-sm bg-[#8BC34A] hover:bg-[#689F38] text-white"
                          onClick={() => onCraftItem(recipe.id)}
                          disabled={!canCraftThisRecipe}
                          title={!canCraftThisRecipe ? reasonWhyNot : t('ControlPanel.craftWithName', { name: recipe.name })}
                        >
                          {t('ControlPanel.craft')}
                        </Button>
                        {!canCraftThisRecipe && reasonWhyNot && <p className="text-xs text-red-900 text-center mt-1.5 font-bold">{reasonWhyNot}</p>}
                    </Card>
                  );
                })}
            </div>
        )}
      </div>
    </Card>
  );
}

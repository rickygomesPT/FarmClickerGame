import { Coins, Download, Upload, Languages, BarChart3, RotateCcw, Volume2, VolumeX, ClipboardList, Trophy, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { t, SUPPORTED_LOCALES, LOCALE_LABELS, type Locale } from '@/lib/i18n';

interface GameHeaderProps {
  currency: number;
  level: number;
  xp: number;
  xpToNextLevel: number;
  onExport: () => void;
  onImport: () => void;
  onNewGame: () => void;
  onOpenStats: () => void;
  onOpenMissionsDialog: () => void;
  onOpenAchievementsDialog: () => void;
  hasClaimableMissions: boolean;
  hasClaimableAchievements: boolean;
  muted: boolean;
  onToggleMute: () => void;
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
}

export function GameHeader({ currency, level, xp, xpToNextLevel, onExport, onImport, onNewGame, onOpenStats, onOpenMissionsDialog, onOpenAchievementsDialog, hasClaimableMissions, hasClaimableAchievements, muted, onToggleMute, locale, onLocaleChange }: GameHeaderProps) {
  const xpPercentage = xpToNextLevel > 0 ? (xp / xpToNextLevel) * 100 : 0;

  return (
    <Card className="mb-6 border-[3px] border-[#5D4037] bg-[#EFEBE9]">
      <CardContent className="p-4 flex flex-wrap items-center gap-x-4 gap-y-3">

        <h1 className="text-3xl md:text-4xl font-bold font-headline text-[#3E2723] tracking-tight order-1">
          {t('GameHeader.title')}
        </h1>

            <div className="flex flex-wrap items-center gap-2 order-3 w-full border-t border-[#5D4037]/30 pt-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onExport}
                      className="border-[#5D4037] text-[#3E2723] hover:bg-[#D7CCC8]"
                      aria-label={t('GameHeader.export')}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {t('GameHeader.export')}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('GameHeader.exportTooltip')}</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onImport}
                      className="border-[#5D4037] text-[#3E2723] hover:bg-[#D7CCC8]"
                      aria-label={t('GameHeader.import')}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {t('GameHeader.import')}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('GameHeader.importTooltip')}</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onNewGame}
                      className="border-[#5D4037] text-[#3E2723] hover:bg-[#D7CCC8]"
                      aria-label={t('GameHeader.newGame')}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      {t('GameHeader.newGame')}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('GameHeader.newGameTooltip')}</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onOpenStats}
                      className="border-[#5D4037] text-[#3E2723] hover:bg-[#D7CCC8]"
                      aria-label={t('GameHeader.stats')}
                    >
                      <BarChart3 className="mr-2 h-4 w-4" />
                      {t('GameHeader.stats')}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('GameHeader.statsTooltip')}</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onToggleMute}
                      className="border-[#5D4037] text-[#3E2723] hover:bg-[#D7CCC8]"
                      aria-label={muted ? t('GameHeader.unmute') : t('GameHeader.mute')}
                    >
                      {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{muted ? t('GameHeader.unmute') : t('GameHeader.mute')}</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <label className="flex items-center gap-1 border border-[#5D4037] text-[#3E2723] bg-[#EFEBE9] hover:bg-[#D7CCC8] rounded-md px-2 h-9 cursor-pointer">
                      <Languages className="h-4 w-4" />
                      <span className="sr-only">{t('GameHeader.language')}</span>
                      <select
                        value={locale}
                        onChange={(e) => onLocaleChange(e.target.value as Locale)}
                        className="bg-transparent text-sm font-medium outline-none cursor-pointer"
                        aria-label={t('GameHeader.language')}
                      >
                        {SUPPORTED_LOCALES.map((l) => (
                          <option key={l} value={l}>{LOCALE_LABELS[l]}</option>
                        ))}
                      </select>
                    </label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('GameHeader.language')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div className="flex items-center gap-2 ml-auto">
                <Button onClick={onOpenMissionsDialog} variant="outline" size="sm" className="font-semibold border-[#5D4037] text-[#3E2723] hover:bg-[#D7CCC8]">
                  <ClipboardList className="mr-1 h-4 w-4" />{t('ControlPanel.missions')}
                  {hasClaimableMissions && <AlertCircle className="ml-1.5 h-3 w-3 text-[#FF9800] animate-pulse" />}
                </Button>
                <Button onClick={onOpenAchievementsDialog} variant="outline" size="sm" className="font-semibold border-[#5D4037] text-[#3E2723] hover:bg-[#D7CCC8]">
                  <Trophy className="mr-1 h-4 w-4" />{t('ControlPanel.achievements')}
                  {hasClaimableAchievements && <AlertCircle className="ml-1.5 h-3 w-3 text-[#FF9800] animate-pulse" />}
                </Button>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 order-2 ml-auto">
              <div className="flex items-center text-xl font-semibold text-[#3E2723]">
                <Coins className="mr-2 h-6 w-6 text-[#FF9800]" />
                <span>{currency}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#5D4037] w-full max-w-xs sm:max-w-none min-w-[280px]">
                <span className="font-semibold whitespace-nowrap text-xl">{t('GameHeader.levelValue', { level })}</span>
                <div className="flex-grow w-full">
                  <Progress value={xpPercentage} className="h-3 border border-[#5D4037] bg-[#D7CCC8] [&>div]:bg-[#8BC34A]" aria-label={t('GameHeader.xpA11y', { xp, xpToNextLevel })} />
                </div>
                <span className="text-xs whitespace-nowrap font-mono">
                  {xp} / {xpToNextLevel} XP
                </span>
              </div>
            </div>
      </CardContent>
    </Card>
  );
}
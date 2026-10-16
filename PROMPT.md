## Descrição da Aplicação: Quinta Magnífica

**Contexto:** Quinta Magnífica é um jogo incremental de simulação de fazenda, desenvolvido como uma Single-Page Application (SPA) utilizando Next.js com o App Router. O jogo é totalmente executado no lado do cliente, com persistência automática em `localStorage` (e Exportar/Importar o save em ficheiro, no mesmo formato).

**Stack Tecnológica:**
*   **Framework Principal:** Next.js 15 (App Router)
*   **Linguagem:** TypeScript (estrito: `noUnusedLocals` + `noUnusedParameters`; o build falha com erros de tipo)
*   **Componentes de UI:** React, ShadCN UI (só os 11 usados: `button`, `card`, `dialog`, `badge`, `progress`, `scroll-area`, `tabs`, `toast`, `toaster`, `tooltip`, `input`)
*   **Estilização:** Tailwind CSS
*   **Gestão de Estado:** Hooks nativos do React (`useState`, `useEffect`, `useCallback`, `useRef`). O estado global do jogo é gerido num único objeto `gameState` no componente principal `HomePage`.
*   **Ícones:** Lucide React
*   **Testes:** Vitest (`npm test`, config em `vitest.config.mts`)

**Lógica Central do Jogo (`/src/app/page.tsx`):**

O coração do jogo reside no componente `HomePage`, que utiliza um único `useState<GameState | null>` para gerir todo o progresso do jogador. A lógica **pura** (sem React) vive em `src/lib/game/` e é chamada pelos handlers: `progress.ts` (`applyXpGain`, `applyMissionProgress`, `applyAchievementProgress`), `missions.ts` (`clampMissionAmount`), `fishing.ts` (`generateFishingGrid`), `save.ts` (`validateAndNormalizeImportedGameState`), `upgrades.ts` (`upgradeYield`, `upgradeFieldTime`/`upgradePenTime`, `upgradeThroughput`, `wateringCanReductionMs`), `contracts.ts` (`generateContract`, `canFulfillContract`) e `storage.ts` (autosave). Toasts dispensam aos 5 s (`use-toast` + `duration={5000}`). A interface `GameState` (definida em `src/types/game.ts`) inclui:
*   `currency`: Moedas do jogador.
*   `level`, `xp`, `xpToNextLevel`: Sistema de progressão.
*   `fields`: Um array de objetos `Field`, cada um representando um terreno para cultivo.
*   `animalPens`: Um array de objetos `AnimalPen` para criação de animais.
*   `inventory`: Um objeto que mapeia IDs de itens para a sua quantidade.
*   `missions`: Um array de missões ativas, geradas dinamicamente.
*   `achievements`: O progresso do jogador nas conquistas predefinidas.
*   `fishingGrid`: O estado do mini-jogo de pesca.
*   `contracts` + `nextContractAt`: até 6 encomendas em simultâneo (expiram em 10 min; nova de 3 em 3 min quando há lugar), geradas só com itens desbloqueados (`src/lib/game/contracts.ts`).
*   `stats`: Contadores acumulados (moedas ganhas, colheitas, peixes, contratos, `playMs`).

**Persistência (`src/lib/game/storage.ts`):**
Autoguardado cifrado (AES-GCM, `saveCrypto.ts`) em `localStorage` a cada ação + tick de 10 s (que acumula `playMs`); tick próprio de 1 s expira/gera contratos sem renders parados. Ao arrancar valida com `decryptAndValidateGameState` (aceita v2 cifrado e v1 simples; saves antigos ganham defaults, incluindo migração do formato de contrato único; `SAVE_VERSION` diferente = jogo novo). Mesmo envelope do Exportar/Importar. Botão Novo jogo limpa o storage e recomeça (com `confirm`); abate também pede confirmação. Ferramenta de testes: `scripts/save-tool.mjs`.

**Configuração e Equilíbrio (`/src/config/gameConfig.ts`):**

Este é um ficheiro crucial que contém toda a lógica de equilíbrio do jogo, com valores **explícitos** (nada é derivado da posição no array). Nele estão definidos:
*   **`AVAILABLE_CROPS`:** 31 culturas com `id`, `name`, `seedCost`, `growthTime`, `harvestYield`, `minLevel`, etc. Regra: **todas dão lucro** e o **lucro/minuto cresce estritamente** com o nível de desbloqueio (12 → 550/min); a semente custa ~45–55% da receita.
*   **`AVAILABLE_ANIMALS`:** 9 animais com `id`, `name`, `cost`, `productionTime`, `meatProductId`, etc. Regra: o rendimento passivo é ~55–65% da melhor cultura do nível e o **abate vale ≤80% do custo** (é salvado, não lucro).
*   **`AVAILABLE_RECIPES`:** 32 receitas (inclui `recipe_rabbit_stew` e `recipe_turkey_roast`, que dão propósito ao coelho/peru). Regra: **todas vendem ≥115% do custo** dos ingredientes.
*   **`AVAILABLE_CRAFTABLE_ITEMS`:** 32 itens (inclui `rabbit_stew` e `turkey_roast`).
*   **`AVAILABLE_FISH`:** 5 peixes com valor esperado de ~20 moedas/peixe (a pesca rende sem dominar a economia).
*   **Upgrades (compostos por nível, máx. 5):** colheita `base + max(1, base×25%×nível)`, tempo `base×0.85^nível` (mín. 1s); o abate também escala com o nível do curral. Custos: campos 75×2^n, currais 100×2^n.
*   **`ALL_SELLABLE_ITEMS`:** Uma lista consolidada de todos os itens do jogo que podem ser vendidos.
*   Constantes de XP (pesca: 4 XP), custos de compra/upgrade e outros multiplicadores que governam a economia do jogo.
*   **Missões:** as recompensas escalam automaticamente com os preços (`sellPrice`/`seedCost`/`cost` do alvo), por isso o rebalance propaga-se sem mexer no `page.tsx`.
*   **Conquistas:** títulos/descrições vivem SÓ em `src/messages/*.json` (`Items.<id>.title|description`); o `gameConfig` só guarda `type`/`targetId`/`targetAmount`/recompensas com fallbacks neutros.

**Estrutura de Componentes (`/src/components`):**

A UI é dividida em componentes modulares e reutilizáveis, seguindo as melhores práticas do React:
*   `GameHeader`: duas linhas (título+moedas/nível; ações com Missões/Conquistas à direita) além de Exportar/Importar/Novo jogo/Estatísticas/mute e idioma.
*   Abas de página inteira (6): Campos, Animais, Pesca, Contratos, Inventário (`InventoryPanel`: grelha + venda) e Receitas (`RecipesPanel`: água, regador, receitas).
*   `FieldSection` e `FieldCard`: grelha até 6 colunas (1 no telemóvel); `FieldCard` gere o estado visual de um campo individual (vazio, a crescer, pronto a colher) e o botão Regar (usa 1 regador do inventário, −25% no tempo restante). O botão de upgrade mostra a pré-visualização do ganho (ex.: `(+41%)`).
*   `AnimalPenSection` e `AnimalPenCard`: Semelhante aos campos, mas para os currais de animais (também com pré-visualização `(+…%)` quando há animal produtor).
*   `FishingSection`: Interface para o mini-jogo de pesca.
*   `ContractsSection` (aba Contratos): até 6 encomendas em simultâneo com countdown ao segundo, linhas têm/falta e botão Entregar por encomenda; estado vazio com countdown do próximo.
*   `StatsDialog`: contadores acumulados (`stats` no `GameState`) + tempo de jogo.
*   `MissionsDialog` e `AchievementsDialog`: Janelas modais para visualizar e reclamar recompensas de missões e conquistas, com botão Recolher tudo quando há >1 por reclamar (`handleClaimAllMissions`, `handleClaimAllAchievements`, um só toast).
*   Popups: base `ui/dialog.tsx` vira bottom-sheet no mobile (`max-sm:`) com `max-h` em `dvh`; cada diálogo usa `flex flex-col` + `ScrollArea flex-1 min-h-0` para nunca cortar conteúdo.
*   `PlantCropDialog` e `BuyAnimalDialog`: Modais para selecionar que cultura plantar ou que animal comprar.

**Tipos de Dados (`/src/types/game.ts`):**
Este ficheiro define as interfaces TypeScript para todas as entidades do jogo, como `Crop`, `AnimalType`, `Recipe`, `Mission`, `Achievement`, e a principal, `GameState`. É a "fonte da verdade" para a estrutura de dados da aplicação.

**Testes (`npm test`, Vitest):**
*   `src/lib/game/progress.test.ts`, `fishing.test.ts`, `save.test.ts`, `gameConfig.test.ts`: lógica pura e fórmulas do config.
*   `src/lib/game/economy.test.ts`: **invariantes do equilíbrio** — escada de lucro das culturas, teto do abate (base e nível máximo), margens das receitas, valor esperado da pesca, multiplicadores de upgrade. Se um teste falhar após mexer em preços, a progressão partiu.
*   `src/lib/game/upgrades.test.ts`: matemática dos upgrades (Nv 1 ≥ +35% débito, Nv 5 ≥ ×4).
*   `src/lib/game/storage.test.ts` e `contracts.test.ts`: autosave e geração de contratos (só desbloqueados, com expiração).
*   `src/lib/game/missions.test.ts`: teto de esforço das missões (tempo, carnes, pratos caros).
*   `src/lib/game/saveCrypto.test.ts`: roundtrip AES-GCM, adulteração rejeitada, migração v1.
*   `src/lib/sound.ts`: Web Audio sem ficheiros (colheita, plantar, coletar, craft, pesca, upgrade, compra, água, contrato, level-up, moeda), mute em `localStorage`; nunca atira.

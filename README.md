# Quinta Magnífica

Jogo **incremental** de fazenda construído com **Next.js**, **TypeScript** e **React**. Plante culturas, crie animais, pesque e crie novos itens enquanto ganha XP, sobe de nível e completa missões e conquistas.

> 🎯 Este README foi escrito para que **qualquer pessoa consiga entender o projeto**, mesmo sem experiência em programação. Se é o seu caso, leia do início ao fim. Se já conhece o projeto, use o índice para saltar para o que precisa.

---

## Índice

1. [Como executar o projeto](#como-executar-o-projeto)
2. [Tecnologias utilizadas](#tecnologias-utilizadas)
3. [Como funciona o jogo (conceitos)](#como-funciona-o-jogo-conceitos)
4. [Equilíbrio da economia (regras)](#equilíbrio-da-economia-regras)
5. [Estrutura do projeto](#estrutura-do-projeto)
6. [Fluxo de dados (como o jogo "anda")](#fluxo-de-dados-como-o-jogo-anda)
7. [Funcionalidades e onde alterar](#funcionalidades-e-onde-alterar)
8. [Como alterar o jogo (guia passo a passo)](#como-alterar-o-jogo-guia-passo-a-passo)
9. [Como adicionar uma funcionalidade nova](#como-adicionar-uma-funcionalidade-nova)
10. [Base de dados / APIs / configuração](#base-de-dados--apis--configuração)
11. [Pontos de atenção (regras importantes)](#pontos-de-atenção-regras-importantes)
12. [Glossário](#glossário)
13. [Folha de emergência](#folha-de-emergência)
14. [Problemas conhecidos](#problemas-conhecidos)
15. [Ideias de melhorias futuras](#ideias-de-melhorias-futuras)

---

## Como executar o projeto

Precisa de instalar o [Node.js](https://nodejs.org/) (versão 20 ou superior). Depois:

```bash
# 1. Instalar as dependências do projeto (a primeira vez e quando mudar package.json)
# O --legacy-peer-deps é preciso por um conflito de peers pré-existente
# (vitest 5 pede @types/node ≥22, o projeto usa v20)
npm install --legacy-peer-deps

# 2. Iniciar o servidor de desenvolvimento
npm run dev
```

Abra o navegador em **http://localhost:3000**.

| Comando             | O que faz                                                        |
| ------------------- | ---------------------------------------------------------------- |
| `npm run dev`       | Servidor de desenvolvimento (atualiza sozinho quando edita)      |
| `npm run build`     | Verifica se o jogo compila e cria a versão de produção            |
| `npm run start`     | Serve a versão de produção (precisa de `build` primeiro)         |
| `npm run typecheck` | Verifica erros de tipos TypeScript sem compilar                  |
| `npm test`          | Corre os testes unitários (`src/lib/game/*.test.ts`)             |

## Publicar no GitHub Pages

O jogo é 100% estático (`output: 'export'` gera a pasta `out/`), por isso corre bem no Pages:

```bash
# 1. Criar o repositório no github.com e ligar a pasta local
git init
git add -A
git commit -m "Quinta Magnífica"
git branch -M main
git remote add origin https://github.com/<user>/agricultura-incremental-game.git
git push -u origin main

# 2. No repo: Settings → Pages → Build and deployment → Source: "GitHub Actions"
```

Cada push para `main` publica sozinho (workflow em `.github/workflows/deploy.yml`, com `typecheck` + testes antes do deploy). Site final: `https://<user>.github.io/agricultura-incremental-game/`.

Notas:
- O workflow define `NEXT_BASE_PATH=/agricultura-incremental-game` — tem de ser igual ao nome do repositório. Se for site de utilizador (`<user>.github.io`), pôr a `''`.
- `public/.nojekyll` é obrigatório (sem ele o Pages ignora a pasta `_next`).
- No Windows, definir `NEXT_BASE_PATH` inline na linha de comandos falha (o Git Bash transforma `/repo` em caminho Windows); em CI (Linux) funciona.

> Se a página "encravar" (erro de `ChunkLoadError`): apague a pasta `.next` e corra `npm run dev` de novo.

---

## Tecnologias utilizadas

| Tecnologia          | Para que serve                                                        |
| ------------------- | ------------------------------------------------------------------- |
| **Next.js 15**      | Framework web / servidor de desenvolvimento                         |
| **React 18**        | Biblioteca que constrói a interface de utilizador                  |
| **TypeScript**      | JavaScript com tipos (apanha erros antes de o jogo correr)          |
| **Tailwind CSS**    | Estilos das páginas (classes tipo `bg-green-100`)                    |
| **ShadCN/UI + Radix** | Componentes reutilizáveis (botões, cartões, janelas, toasts)        |
| **Lucide React**    | Ícones                                                              |

**Não usa** (por opção): base de dados, servidor de backend, contas, Firebase. Tudo vive no navegador: o estado no `page.tsx`, com a lógica pura em `src/lib/game/`. O progresso **guarda-se sozinho** em `localStorage` — e pode levar o save em ficheiro com **Exportar/Importar**.

---

## Como funciona o jogo (conceitos)

- **`gameState`** — um único objeto com **todo** o progresso do jogador: moedas, nível, campos, animais, inventário, missões, conquistas, pesca. É "a alma" do jogo.
- **XP e Nível** — quase todas as ações dão XP. Ao acumular XP suficiente, sobe de nível e desbloqueia culturas, animais e receitas novas.
- **Campos** — compra campos, planta culturas, espera o tempo de crescimento e colhe. Cada cultura tem custo, tempo e rendimento próprios.
- **Currais** — compra currais e animais; eles produzem produtos (ovos, leite, lã…) em intervalos. Também pode **abater** para obter carne (vale sempre menos do que o animal custou — é salvado, não lucro).
- **Upgrades** — cada campo/curral sobe até ao nível 5. Cada nível dá **+25% de colheita** e **−15% de tempo** (efeito composto: Nv 1 ≈ +40%, Nv 5 ≈ ×5). O botão mostra a pré-visualização (ex.: `(+41%)`). O abate também cresce com o nível do curral.
- **Pesca** — mini-jogo de grelha: cada célula pode esconder um peixe. Gasta iscas, clica numa célula e apanha peixes.
- **Crafting** — a bancada de receitas transforma itens simples (farinha, açúcar…) em itens valiosos (pão, tartes, compotas…). **Todas** as receitas vendem acima do custo dos ingredientes — experimentar nunca dá prejuízo. O regador (10 águas) usa-se no botão **Regar** do campo em crescimento: −25% no tempo restante.
- **Missões** — geradas automaticamente: "Colhe 20 alfaces", "Cria 3 bolos"… Cumprir dá moedas e XP.
- **Persistência automática** — o jogo guarda sozinho em `localStorage` a cada ação e ao fim de 10 s. Ao abrir, continua onde parou. O botão **Novo jogo** (topo) recomeça do zero (com confirmação). Exportar/Importar continua a existir para levar o save em ficheiro — o formato é o mesmo.
- **Saves cifrados (anti-batota casual)** — ficheiro e `localStorage` guardam o estado em AES-GCM (`src/lib/game/saveCrypto.ts`): opaco por fora, qualquer byte mexido invalida o save. Limite honesto: a chave vive no cliente, por isso um jogador determinado com devtools consegue sempre batota — isto trava edição casual de ficheiros. Saves simples v1 antigos continuam a importar (migração).
- **Contratos** — 4.ª aba: até 6 encomendas em simultâneo (a nova aparece em baixo), cada uma com 10 min para entregar, por moedas + XP. O **alfinete** fixa as que interessam (não expiram). Só pedem o que já desbloqueaste e em quantidades que cabem no prazo. Novo contrato de 3 em 3 min. O botão **Entregar** ativa quando tens tudo.
- **Estatísticas e sons** — botão de gráfico no topo abre os contadores (moedas ganhas, colheitas, peixes, contratos, tempo de jogo). Colheitas, plantações, coletas, crafts, pesca, upgrades, compras, contratos e nível têm efeitos sonoros (Web Audio, sem ficheiros) com botão de silenciar; level-up mostra faixa animada e imagens prontas saltitam.
- **Conquistas** — metas de longo prazo ("Colhe 100 tomates", "Alcança o nível 10") com recompensas.

---

## Equilíbrio da economia (regras)

A economia foi desenhada para que **cada desbloqueio novo supere os anteriores**. Estas regras vivem em `src/config/gameConfig.ts` e são verificadas automaticamente por `src/lib/game/economy.test.ts` (corra `npm test` depois de mexer em qualquer preço):

| # | Regra | Onde |
|---|-------|------|
| 1 | **Toda a cultura dá lucro** na venda direta e o **lucro/minuto cresce estritamente** com o nível (alface 12/min → milho 550/min). A semente custa ~45–55% da receita. | `rawCrops` |
| 2 | **Animais rendem ~55–65%** da melhor cultura do nível (passivo paga menos que cultivo ativo) e o custo paga-se em ~4–17 min de produção própria. | `rawAnimals` |
| 3 | **O abate vale ≤80% do custo** (é salvado, não lucro) — mesmo no nível máximo de upgrade. Coelho/peru/porco ganham propósito nas receitas (ensopado, peru assado). | `AVAILABLE_ANIMAL_PRODUCTS` + abate |
| 4 | **Toda a receita vende ≥115% do custo** dos ingredientes (na prática ≥125%). | `AVAILABLE_CRAFTABLE_ITEMS` |
| 5 | **Pesca comedida:** valor esperado ~20 moedas/peixe (~120 por grelha cheia). | `AVAILABLE_FISH`, `FISH_TYPE_PROBABILITIES` |
| 6 | **Upgrades compostos:** +25% colheita e ×0,85 tempo por nível (máx. 5); custos 75×2^n (campos) e 100×2^n (currais). | `UPGRADE_*`, `src/lib/game/upgrades.ts` |
| 7 | **Missões auto-escaláveis:** a recompensa soma uma % do preço do item alvo, por isso acompanha os preços sem mexer no `page.tsx`. |
| 8 | **Missões com teto de esforço:** nenhum alvo exige mais de ~12 min de produção; intervalos menores e carnes limitadas a 3. |
| 9 | **Contratos justos:** quantidades por orçamento de ~3 min de produção; pratos caros pedem 1 unidade. | `generateNewMission`, `clampMissionAmount` |

> Para mudar preços em segurança, siga os Exemplos 1, 4 e 5 abaixo e corra `npm test` — se a escada partir, os testes dizem qual regra quebrou.

---

## Estrutura do projeto

```
agricultura-incremental-game/
├── next.config.ts          # Configuração do Next.js (build rigoroso, sem imagens remotas)
├── package.json            # Dependências e comandos (npm run dev, build, ...)
├── README.md               # Este documento
├── scripts/
│   └── save-tool.mjs       # Testes: decifrar/cifrar saves (`npm run save:decrypt|encrypt`)
├── src/
│   ├── app/
│   │   ├── layout.tsx      # Página "mãe": título, fontes, componente de toasts
│   │   └── page.tsx        # ⭐ CORAÇÃO DO JOGO (lógica + estado + interfaces)
│   ├── config/
│   │   └── gameConfig.ts   # ⭐ EQUILÍBRIO DO JOGO: culturas, animais, preços, XP, receitas
│   ├── types/
│   │   └── game.ts         # ⭐ TIPOS do jogo (GameState, Crop, AnimalType, ...)
│   ├── messages/           # Traduções (UI) em vários idiomas
│   │   ├── pt.json         # Todas as traduções/textos em português (base)
│   │   ├── en.json         # Inglês
│   │   ├── es.json         # Espanhol
│   │   └── fr.json         # Francês
│   ├── components/         # Peças visuais (React)
│   │   ├── GameHeader.tsx        # Topo (2 linhas): moedas/nível + ações, Missões/Conquistas à direita
│   │   ├── ContractsSection.tsx  # Aba Contratos: lista, countdowns, Entregar
│   │   ├── InventoryPanel.tsx    # Aba Inventário: grelha de ícones + venda
│   │   ├── RecipesPanel.tsx      # Aba Receitas: água, regador, lista de receitas
│   │   ├── StatsDialog.tsx       # Janela de estatísticas (contadores + tempo de jogo)
│   │   ├── FieldSection/Card     # Campos (secção + cartão de cada campo)
│   │   ├── AnimalPenSection/Card # Currais (secção + cartão de cada curral)
│   │   ├── FishingSection.tsx    # Mini-jogo de pesca
│   │   ├── PlantCropDialog.tsx   # Janela "escolher cultura para plantar"
│   │   ├── BuyAnimalDialog.tsx   # Janela "escolher animal para comprar"
│   │   ├── MissionsDialog.tsx    # Janela de missões
│   │   ├── AchievementsDialog.tsx# Janela de conquistas
│   │   └── ui/                   # Componentes genéricos (botões, cartões, tabs, ...) da ShadCN
│   ├── hooks/
│   │   └── use-toast.ts    # Função "toast" (notificações temporárias no ecrã)
│   ├── lib/
│   │   ├── i18n.tsx        # ⭐ Motor de traduções: `t()`, `useI18n` e seletor de idioma
│   │   ├── game/           # Lógica pura extraída do `page.tsx` + testes (`npm test`)
│   │   │   ├── progress.ts # `applyXpGain`, `applyMissionProgress`, `applyAchievementProgress`
│   │   │   ├── fishing.ts  # `generateFishingGrid` (grelha de pesca)
│   │   │   ├── save.ts     # `validateAndNormalizeImportedGameState` (+ contratos/stats)
│   │   │   ├── upgrades.ts # `upgradeYield`, `upgradeFieldTime/PenTime`, `upgradeThroughput`
│   │   │   ├── contracts.ts# `generateContract`, `canFulfillContract` (só desbloqueados)
│   │   │   ├── missions.ts # `clampMissionAmount` (teto de esforço das missões)
│   │   │   ├── storage.ts  # Autosave `localStorage` (mesmo envelope do Exportar/Importar)
│   │   │   ├── saveCrypto.ts # AES-GCM: cifra/decifra saves + valida (`decryptAndValidateGameState`)
│   │   │   └── *.test.ts   # Testes: lógica, fórmulas e invariantes da economia (`economy.test.ts`)
│   │   ├── sound.ts        # 12 efeitos Web Audio (colheita…moeda) + mute em `localStorage`
│   │   └── utils.ts        # Utilitário `cn` (junta classes CSS)
│   └── public/ (na raiz)   # Imagens dos itens em /public/images
```

**A regra de ouro do projeto:**

| O que quer mexer?                       | Ficheiro                                                    |
| ---------------------------------------- | ----------------------------------------------------------- |
| Preços, tempos, culturas, animais, receitas | `src/config/gameConfig.ts`                                |
| Como o jogo reage aos cliques (lógica)   | `src/app/page.tsx`                                          |
| Que informação um item guarda            | `src/types/game.ts`                                         |
| Textos que aparecem no ecrã              | `src/messages/*.json` (+ `src/lib/i18n.tsx`)                 |
| Como um botão se parece                  | componente em `src/components/` + Tailwind                  |

---

## Fluxo de dados (como o jogo "anda")

```
                      ┌─────────────────────────────────────┐
   O jogador clica    │  src/app/page.tsx  (HomePage)        │
   num botão ───────▶ │                                     │
                      │  1. handler (ex.: handleHarvest)      │
                      │  2. usa setGameState(prev => {...})   │  ← muda UM objeto
                      │  3. atualiza XP/missões/conquistas    │
                      └──────────────┬──────────────────────┘
                                     │ novo gameState
                                     ▼
                      React re-renderiza a página com o estado novo
                                     │
                                     ▼
               Os componentes (FieldCard, InventoryPanel, ...)
               mostram o estado atualizado
```

**Pontos-chave:**
- Cada ação é uma função `handle...` em `page.tsx` que recebe um `gameState` antigo e devolve um novo (funções "imutáveis": nunca modificam o objeto diretamente, criam uma cópia).
- As funções híbridas **nunca** devem esconder bugs — se algo falha, configuram um `toastConfig` (mensagem de erro em vez de crash).
- XP, missões e conquistas são atualizados dentro dos handlers, não nos componentes visuais.

---

## Funcionalidades e onde alterar

| Funcionalidade                                | Lógica (page.tsx)            | Dados (gameConfig.ts)               | Textos (pt.json) |
| --------------------------------------------- | ---------------------------- | ------------------------------------ | ---------------- |
| Plantar / colher / replantar culturas         | `handlePlantRequest`, `handleHarvest`, `handleReplant` | `AVAILABLE_CROPS` | `HomePage.errors.*` |
| Comprar campos e melhorar                     | `handleBuyField`, `handleUpgradeField` | `BASE_FIELD_COST`, `BASE_FIELD_UPGRADE_COST`, `FIELD_UPGRADE_*` (efeitos em `lib/game/upgrades.ts`) | — |
| Animais, produtos e abate                     | `handleRequestBuyAnimal`, `handleCollectProduct`, `handleButcherAnimal` (com confirmação) | `AVAILABLE_ANIMALS`, `AVAILABLE_ANIMAL_PRODUCTS` | — |
| Notificações (toasts)                         | `toastConfig` + `use-toast` (dispensa automática aos 5 s) | `ui/toaster.tsx` (`duration={5000}`) | — |
| Pesca                                          | `handleBuyBait`, `handleFishCellClick`, `handleRefreshFishingGrid` | `AVAILABLE_FISH`, `BAIT_*`, `FISHING_*` | `HomePage.fishCaught*` |
| Crafting                                       | `handleCraftItem` | `AVAILABLE_RECIPES`, `AVAILABLE_CRAFTABLE_ITEMS` | — |
| Missões e conquistas                           | `updateMissionProgress`, `updateAchievementProgress` (lógica pura em `lib/game/progress.ts`), `handleClaimAllMissions`, `handleClaimAllAchievements` | `AVAILABLE_ACHIEVEMENTS`, `MISSION_CONFIG` | `HomePage.missions*` |
| Níveis / XP                                   | `gainXP` (matemática em `lib/game/progress.ts`) | `BASE_XP_TO_NEXT_LEVEL`, `XP_FOR_*`  | `HomePage.levelUp*` |
| Agua / regador                                | `handleCollectWater`, `handleUseWateringCan` (botão Regar no cartão) | `WATER_ITEM`                          | — |
| Exportar / importar progresso                 | `handleExportSave`, `handleImportFile` (cifra/validação em `lib/game/saveCrypto.ts`) | Autosave `lib/game/storage.ts`, botão Novo jogo (`handleNewGame`) | `HomePage.save.*` |
| Contratos                                     | `handleDeliverContract` + tick próprio de 1 s | `lib/game/contracts.ts` (geração só com desbloqueados) | `ContractsSection.*`, `HomePage.tabs.contracts` |
| Estatísticas e sons                           | `trackStats`, `play*Sound` | `stats` no `GameState`, `lib/sound.ts` | `StatsDialog.*` |

---

## Como alterar o jogo (guia passo a passo)

> Procurou no código por `obj => ({ ...obj, currency: 999 })`? Parabéns, é essa a "fórmula" das ações.

**Exemplo 1 — Mudar o preço da alface (economia)**

1. Abra `src/config/gameConfig.ts`.
2. Encontre `{ id: 'lettuce', name: "Alface", ..., sellPrice: 2, ...}`.
3. Mude `sellPrice` de `2` para `3`. Feito.

**Exemplo 2 — Dar mais XP ao colher**

1. Em `src/config/gameConfig.ts`, encontre `export const XP_FOR_HARVEST_ACTION = 2;`.
2. Mude para `= 5`. Todas as colheitas passam a dar 5 XP.

**Exemplo 3 — Mudar um texto (ex.: mensagem de pesca)**

1. Abra `src/messages/pt.json`.
2. Em `HomePage.fishCaught.description`, altere o texto.
3. Nota: `{fishName}` e `{xp}` são "espaços reservados" — não os apague, o jogo substitui pelo valor real.

**Exemplo 4 — Adicionar uma cultura nova**

1. Em `gameConfig.ts`, copie a linha de outra cultura e altere `id`, `name`, `sellPrice`, `growthTime`, `harvestYield`, `seedCost`, `minLevel`, `imageUrl`, `dataAiHint`.
2. Respeite a escada (secção [Equilíbrio da economia](#equilíbrio-da-economia-regras)): a cultura tem de dar lucro e render mais/min que a anterior. Corra `npm test` para confirmar.
3. Adicione o texto correspondente em **todos** os `src/messages/*.json` (`Items.<id>.name` e `Items.<id>.description`).
4. Coloque uma imagem nova na pasta `public/images/`. (Se não tiver, reutilize a de outra cultura.)

**Exemplo 5 — Adicionar um animal novo**

1. Em `rawAnimals`, copie uma linha e defina `cost`, `minLevel`, `productId`, `productionTime`, `productYield`, `meatProductId`, `butcherYield` explícitos.
2. Respeite as regras: passivo ~55–65% da cultura do nível; abate ≤80% do custo (`npm test` verifica).
3. Se o produto que produz é novo, adicione-o também em `AVAILABLE_ANIMAL_PRODUCTS` (com `type: 'animal_product'`).
4. Traduza em **todos** os `src/messages/*.json` e coloque a imagem em `public/images/`.

---

## Como adicionar uma funcionalidade nova

1. **Pergunte-se "o que muda?"**: um valor novo, um texto novo, um botão novo ou os três.
2. **Dados**: adicione o novo item/campo em `gameConfig.ts` e `types/game.ts` se precisar de um tipo novo.
3. **Estado**: se for algo simples, use os `setGameState` de `page.tsx`. Se for algo com janela/cartão, crie (ou reutilize) um componente em `src/components/`.
4. **Interação**: escreva um `handleNovaAcao` em `page.tsx` que siga o padrão dos outros handlers (validar → `setGameState(prev => ...)` → atualizar XP/missões/conquistas → toast de erro/sucesso).
5. **Visual**: adicione o botão/cartão no componente e traduza os textos em **todos** os `src/messages/*.json`.
6. **Verifique**:
   ```bash
   npm run typecheck
   npm test
   npm run build
   npm run dev
   ```

> Procure no código os marcadores pedagógicos:
> - `🔧 ALTERAR AQUI` — o sítio exato para mudar valores/lógica.
> - `➕ ADICIONAR FUNCIONALIDADE AQUI` — o sítio onde inserir código novo.
> - `⚠️ CUIDADO` — zonas frágeis, não mexa sem perceber primeiro.

---

## Base de dados / APIs / configuração

- **Não existe base de dados nem APIs.** O jogo é 100% local ao navegador.
- **Não existem variáveis de ambiente** (`process.env...`) necessárias para correr o jogo.
- **Configuração do servidor** (`next.config.ts`): build rigoroso (falha com erros de tipos/ESLint), sem imagens remotas — todas as imagens são locais em `public/images/`.
- **Qualidade do código** (`tsconfig.json`): `strict` + `noUnusedLocals`/`noUnusedParameters` — sem imports, props ou variáveis mortas. O `npm test` (Vitest, `vitest.config.mts`) cobre lógica pura, fórmulas e invariantes da economia.
- **Saves versionados e cifrados** (`SAVE_VERSION` em `storage.ts`, AES-GCM em `saveCrypto.ts`): versão diferente = jogo novo em vez de estado estranho. Para **testes**, decifrar/cifrar saves: `npm run save:decrypt -- save.json [saida.json]` e `npm run save:encrypt -- estado.json [saida.json]` (mesma chave; `QUINTA_SAVE_KEY` sobrepõe).
- **Acessibilidade**: `prefers-reduced-motion` desliga animações; botões de ícone têm `aria-label`.

---

## Pontos de atenção (regras importantes)

1. **Tudo num só estado**: quase toda a lógica está no `page.tsx`. Não crie "segundos estados" (ex.: guardar moedas em outro `useState`) — use sempre `gameState`.
2. **Imutabilidade**: nunca altere o `gameState` diretamente (`gameState.currency = 99` ❌). Faça sempre `setGameState(prev => ({ ...prev, currency: ... }))` ✅.
3. **Traduções**: nunca escreva texto direto num componente. Use sempre `t('Chave')` (interface), `t_items('id.name')` (itens/culturas/animais) ou `t_general('...')` (termos gerais), e adicione a chave a **todos** os ficheiros em `src/messages/` (pt, en, es, fr). O `pt.json` é a base: se uma chave faltar noutro idioma, o texto pode ficar em falta.
4. **Imagens**: todas as imagens dos itens estão em `public/images/`. Cada item de `gameConfig` deve apontar para um ficheiro que **exista**.
5. **ID único**: os itens têm IDs tipo `lettuce`, `egg`, `recipe_pancake`. Não duplique IDs entre listas (o `ALL_SELLABLE_ITEMS` funde as listas num mapa único).
6. **Resíduos**: o projeto foi limpo — não reintroduza dependências (Firebase, genkit, etc.) sem necessidade real.

---

## Glossário

| Termo             | Significado                                                                 |
| ----------------- | --------------------------------------------------------------------------- |
| **XP**            | Pontos de experiência ganhos em ações; acumule para subir de nível          |
| **Cultura**       | Uma planta que compra, planta e colhe (alface, trigo, cenoura…)           |
| **Curral**        | Construção onde coloca animais                                              |
| **Upgrade**       | Melhoria de campo/curral (máx. Nv 5): +25% colheita e −15% tempo por nível; o botão mostra `(+…%)` |
| **Inventário**    | Objeto que mapeia `id-item → quantidade` (ex.: `{ "egg": 12, "milk": 3 }`) |
| **Crafting**      | Criar um item novo a partir de ingredientes (receitas)                     |
| **Isca**          | Item gasto em cada lançamento de pesca                                     |
| **Toast**         | Notificação temporária que aparece no canto (verde/vermelho)               |
| **Handler**       | Função que reage a um clique/evento (ex.: `handleHarvest`)                  |
| **`gameState`**   | O objeto principal com todo o progresso do jogador                          |
| **Contrato**      | Encomenda temporária de um cliente (aba Contratos): entregar itens por moedas e XP |
| **`pt.json`**     | O ficheiro base de traduções (português); há também `en.json`, `es.json` e `fr.json` |

---

## Folha de emergência

| Problema                                              | Solução                                                                  |
| ----------------------------------------------------- | ------------------------------------------------------------------------ |
| `ChunkLoadError` / página em branco                   | Apagar `.next` e correr `npm run dev` (o servidor dev antigo pode ter ficado "preso") |
| `npm install` com erros                               | Apagar `node_modules` e `package-lock.json`, correr `npm install` de novo |
| Erros de tipo ao editar (`tsc`)                        | Confira se o item/id que criou existe em `gameConfig` e `pt.json`         |
| Imagem não aparece                                    | Confirme que o ficheiro está em `public/images/` e o nome bate certo      |
| Porta 3000 já ocupada                                 | Feche o terminal com o `next dev` ou mude de porta (`npm run dev -- -p 3001`) |
| Perdeu o progresso                                    | Volte a importar o ficheiro exportado (botão "Importar")                  |

---

## Problemas conhecidos

Estas são limitações **deliberadas** que não são bugs:

1. **Saves antigos** — continuam a carregar: contratos/estatísticas novos vêm com defaults. O formato de ficheiro não mudou.
2. **Build rigoroso** — `next.config.ts` **não** ignora erros de tipos/ESLint e o `tsconfig.json` tem `noUnusedLocals`/`noUnusedParameters`. Corra `npm run typecheck` e `npm test` antes de commitar.
3. **Componentes UI mínimos** — a pasta `src/components/ui/` contém só o que o jogo usa (`button`, `card`, `dialog`, `badge`, `progress`, `scroll-area`, `tabs`, `toast`, `toaster`, `tooltip`, `input`). O stock ShadCN não usado (`chart.tsx`, `calendar.tsx`, etc.) foi removido.
4. **Avisos do `npm install`** — podem aparecer "vulnerabilities" de dependências indiretas; para um jogo local (sem rede/servidor) o risco prático é baixo. **Nunca** corra `npm audit fix --force` (pode partir o projeto).
5. **Meta-descrição inicial** — o `<title>`/`<meta name="description">` iniciais vêm do `layout.tsx` em português; no cliente são atualizados ao idioma escolhido assim que a aplicação carrega.

---

## Ideias de melhorias futuras

- Progresso offline (acumular produção com o jogo fechado).
- Prestígio/renascimento para o endgame (pós-nível 40).
- Custo/cooldown para atualizar a grelha de pesca (hoje o refresh é grátis).
- Sons e animações nas colheitas/abates.
- Mais missões e conquistas por categoria.
- Modo "produtor" com economias mais profundas (mercado com preços que oscilam).

---

*Divirta-se a construir a sua Quinta Magnífica.* 🚜🌾
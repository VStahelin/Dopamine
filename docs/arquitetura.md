# Arquitetura

Como o código do Dopamina Blaster é organizado. Este arquivo descreve **o estado atual**; o porquê de cada escolha fica nas [decisões](decisoes/README.md), ligadas em cada seção. Ao mudar algo aqui, registre a decisão primeiro.

> **Estado:** fases 0 a 2.5 implementadas; fases 2.6, 2.7, 3 (meta-progressão), 4 (campo longo) e 5 (organismo) implementadas, falta validar no celular.

## Stack

| Peça | Escolha | Decisão |
| --- | --- | --- |
| Engine | Phaser 4.2 | [0002](decisoes/0002-phaser-4-typescript-pwa.md) |
| Linguagem | TypeScript 6 (modo `strict`) | [0002](decisoes/0002-phaser-4-typescript-pwa.md) |
| Distribuição | Web, instalável como PWA, offline e com atualização controlada (fase 2.5, [atualizacoes.md](atualizacoes.md)) | [0002](decisoes/0002-phaser-4-typescript-pwa.md) |
| Build e servidor local | Vite 8 | [0003](decisoes/0003-camadas-core-game-config.md) |
| Testes | Vitest 4 | [0003](decisoes/0003-camadas-core-game-config.md) |
| Lint e formatação | ESLint 10 (typescript-eslint) e Prettier | [0003](decisoes/0003-camadas-core-game-config.md) |
| Tela e pixel art | Canvas na resolução real da tela; sprites com 2 ou 3 pixels de arte por unidade, pixel de arte inteiro | [0009](decisoes/0009-grade-16px-zoom-inteiro.md), [0010](decisoes/0010-orientacao-livre.md) |
| Save | IndexedDB, com backup exportável | [0005](decisoes/0005-save-local-indexeddb.md) |
| Onde roda | GitHub Pages, publicado só ao gerar uma versão (tag); `npm run dev` para programar | [0017](decisoes/0017-deploy-por-versao.md), [0018](decisoes/0018-jogo-no-pages-servidor-futuro.md) |

## Camadas

O código se divide em três camadas, com dependência num sentido só ([0003](decisoes/0003-camadas-core-game-config.md)):

```
src/game/   →   src/core/   →   src/config/
(Phaser)        (TS puro)       (números)
```

- **`src/config/`**: todos os parâmetros, em arquivos JSON tipados (abas Parâmetros e Economia). Só dados e tipos, sem lógica; o acesso é sempre por `src/config/index.ts` ([0004](decisoes/0004-parametros-centralizados.md)).
- **`src/core/`**: as regras do jogo em TypeScript puro: combate, spawn, XP, economia, idle, saúde, save. **Não importa Phaser nem nada do navegador**, para rodar nos testes e no simulador.
- **`src/game/`**: cenas do Phaser, desenho, som e leitura do controle. Lê o estado do `core`, desenha e repassa a entrada do jogador. Não guarda regra de jogo.

A regra de dependência é verificada pelo ESLint (`no-restricted-imports` em [eslint.config.js](../eslint.config.js)): importar `phaser` ou `src/game` dentro de `src/core` ou `src/config` quebra o lint, assim como usar `window`, `document`, `localStorage` ou `indexedDB`.

## Cenas

| Cena | Arquivo | Papel |
| --- | --- | --- |
| `boot` | [BootScene.ts](../src/game/scenes/BootScene.ts) | Gera as texturas, carrega o save e abre o título |
| `title` | [TitleScene.ts](../src/game/scenes/TitleScene.ts) | Logo e Começar |
| `hub` | [HubScene.ts](../src/game/scenes/HubScene.ts) | Menu principal ([menu.md](menu.md)): status, caso com estrelas, JOGAR, trilhos e as 5 abas |
| `placeholder` | [PlaceholderScene.ts](../src/game/scenes/PlaceholderScene.ts) | Telas abertas pelo hub que ainda não têm conteúdo, no formato comum ([sectionView.ts](../src/game/ui/sectionView.ts)) |
| `records`, `options` | [RecordsScene.ts](../src/game/scenes/RecordsScene.ts), [OptionsScene.ts](../src/game/scenes/OptionsScene.ts) | Recordes salvos; opções com as abas Som, Tela e Jogo |
| `run` | [RunScene.ts](../src/game/scenes/RunScene.ts) | Chama o `stepRun` do `core` em passos fixos e desenha o estado (sprites reaproveitados, números de dano); abre as telas por cima |
| `hud` | [HudScene.ts](../src/game/scenes/HudScene.ts) | Por cima da run ([ui-cronico.md](ui-cronico.md)): banda com XP, ícones de armas e reagentes, tempo, onda e decompostas; efeitos, chefe e pausa abaixo dela; botão do especial, joystick e FPS |
| `idle` | [IdleScene.ts](../src/game/scenes/IdleScene.ts) | Campo longo (prancheta "Tela de batalha"): BASE, ondas, pool de agentes, melhorias e x2. A simulação roda no [idleRunner](../src/game/idle/idleRunner.ts), mesmo com a tela fechada |
| `levelUp`, `pause`, `gameOver` | [LevelUpScene.ts](../src/game/scenes/LevelUpScene.ts), [PauseScene.ts](../src/game/scenes/PauseScene.ts), [GameOverScene.ts](../src/game/scenes/GameOverScene.ts) | Telas por cima da run; a pausa tem as abas Arsenal, Atributos e Run (duas colunas na tela deitada) e abre as Opções por cima |

A música fica em [src/game/audio/](../src/game/audio/music.ts): um player único em Web Audio, ligado ao contexto de som do Phaser, que baixa as faixas de `public/audio/music/` em segundo plano (OGG ou M4A, o que o navegador tocar), troca com crossfade e repete só o trecho de loop. Cada tela pede a sua faixa no `create`; a run calcula a música a cada quadro com [musicLogic.ts](../src/game/audio/musicLogic.ts) (tempo, crise, chefe, telas por cima). As faixas ficam fora do precache e entram no cache `dopamina-audio` do service worker na primeira vez.

As telas de interface usam [uiLayout.ts](../src/game/ui/uiLayout.ts): zoom inteiro a partir do canto superior esquerdo e layout refeito a cada redimensionamento.

## A run no `core`

- [state.ts](../src/core/run/state.ts): estado da run (agente, inimigos, disparos, gemas, nível) e `createRun(semente)`.
- [step.ts](../src/core/run/step.ts): `stepRun` avança um passo: movimento, nascimento de inimigos, perseguição, arma, dano, contato e gemas. Usa uma [grade espacial](../src/core/run/spatialGrid.ts) para achar vizinhos.
- [upgrades.ts](../src/core/run/upgrades.ts): level up com armas e receptores (decisão 0027), raridade pela Sorte também no nível de arma, Mutação, Rerrolar, Pular, Banir e espaços de receptor. O papel de cada passivo (`receptor`, `reagent`, `off`) está em `passives.json`.
- [items.ts](../src/core/run/items.ts): itens no mapa (fase 5.5): vesículas, os itens que elas soltam, efeitos com tempo (Gelo seco, Bico de Bunsen, Febre de ATP) e a cápsula do chefe. Números em `drops.json`; a cápsula aberta para a run até a tela da cápsula fechar.
- [stats.ts](../src/core/run/stats.ts) e [progression.ts](../src/core/run/progression.ts): atributos com modificadores, arma por nível, XP e dificuldade.
- [mapStep.ts](../src/core/run/mapStep.ts) e [src/core/map/](../src/core/map/): mapa gerado (fase 5.7). `chunk.ts` gera um bloco de 16×16 tiles pela semente e pela posição (chão, obstáculos, destrutíveis, decoração e ninho), `world.ts` guarda os blocos em volta do agente, os destrutíveis quebrados e a grade dos sólidos, e `noise.ts` tem o hash e o ruído. Números em `map.json`, arte em `src/assets/sprites/map.json`.
- [rules.ts](../src/core/run/rules.ts): as regras chegam como parâmetro (`RunRules`), com os JSON como padrão.
- O `core` registra acontecimentos (`events`) que a cena lê para efeitos, sem o `core` saber de desenho.

Fora dessas camadas:

- **`tools/audio/`**: `music.py` corta os loops e converte as músicas de `audio/musicas/` para `public/audio/music/` ([sonoplastia.md](sonoplastia.md#como-entra-no-jogo)).
- **`tools/sim/`**: `npm run sim` roda o simulador de `src/core/sim/` (um robô joga runs seguidas e compra entre elas) e mostra a curva de progressão da meta. `node tools/sim/still.mjs` roda um robô parado com cada agente, para ver se ficar parado ainda segura a run.
- **`tests/`** ou arquivos `*.test.ts` ao lado do código: testes do `core`.

## Estrutura de pastas

```
src/
  assets/
    sprites/     toda a pixel art como dados (decisão 0019): paleta, ícones 16×16, molduras, moléculas, interface, mundo
  config/        JSON de parâmetros (stats, run, enemies, weapons, passives, rarities, economy, idle, display), types.ts e index.ts
  core/
    math/        vetores e utilidades
    random.ts    gerador aleatório com semente
    run/         campo crônico: agente, inimigos, armas, XP, level up
    idle/        campo longo: simulação das ondas e da BASE, pool, níveis, melhorias e offline (fase 4)
    organism/    setores de saúde, efeitos, saúde dos agentes, regras da run e ALTA (fase 5)
    meta/        Laboratório, desbloqueios, estrelas e baú; regras da run com o progresso (fase 3)
    sim/         robô e simulador de progressão (npm run sim)
    save/        formato do save, migrações e recordes
  game/
    scenes/      cenas do Phaser
    idle/        idleRunner: roda o campo longo o tempo todo e paga o offline
    render/      paleta, zoom, spriteArt.ts (desenho dos sprites a partir dos dados), fxArt.ts (efeitos das armas em pixels de arte) e textures.ts (gerador único de texturas)
    input/       teclado e joystick virtual
    ui/          tema (fontes, textos), botões, layout das telas, textos dos upgrades, espaços de ícone, conteúdo da pausa, números de dano, rolagem
    storage/     save no IndexedDB e backup (código e arquivo)
  main.ts        ponto de entrada
public/          favicon; manifest do PWA e fontes na fase 6
tools/sim/       simulador de progressão
tools/sprites/   gerador dos PNGs de sprite
tools/audio/     corte dos loops e conversão das músicas
.github/         workflow de CI (verificações, sem deploy)
docs/            design, roadmap, arquitetura e decisões
```

Os testes ficam ao lado do código, como `*.test.ts`.

## Sprites

Toda a pixel art fica em `src/assets/sprites/` como dados ([0019](decisoes/0019-sprites-numa-pasta.md)): grades de caracteres para os ícones (as mesmas do canvas de identidade visual), átomos e ligações para as moléculas, números para chão, gema, elétron, disparo e moeda, e as molduras. [spriteArt.ts](../src/game/render/spriteArt.ts) pinta esses dados com retângulos num `Painter`, sem depender do Phaser.

Os PNGs ficam em `public/sprites/`, gerados por `npm run sprites:build` ([0020](decisoes/0020-sprites-em-png-por-tamanho.md)): ícones em pastas por tamanho (16 a 128 px), molduras por escala e sprites do mundo por detail ([0009](decisoes/0009-grade-16px-zoom-inteiro.md)). A lista de arquivos está em [spriteFiles.ts](../src/game/render/spriteFiles.ts); [textures.ts](../src/game/render/textures.ts) carrega no `preload` da abertura só os tamanhos de ícone que o zoom da tela usa. `npm run sprites:check` confere que os PNGs batem com os dados, e um teste confere que toda arma, modificador, especial, agente e inimigo tem sprite.

## Princípios

- **Simulação com passo fixo.** O `core` avança em passos de tempo fixos, independentes do FPS, para que a run se comporte igual no PC e no celular e o simulador reproduza os mesmos resultados. ([0012](decisoes/0012-passo-fixo-e-semente.md))
- **Aleatoriedade com semente.** O `core` usa um gerador de números aleatórios com semente, nunca `Math.random()` direto, para dar para repetir uma run nos testes. O lint barra `Math.random()` no `core` ([0012](decisoes/0012-passo-fixo-e-semente.md)).
- **Reaproveitamento de objetos.** Inimigos, disparos e gemas saem de pools, sem criar e destruir a cada quadro.
- **Pixel art em escala inteira.** Escala 1×, 2× ou 3×, sem suavização.

## Comandos

Precisa de Node 20.19 ou mais novo.

| Comando | O que faz |
| --- | --- |
| `npm install` | Instala as dependências |
| `npm run dev` | Servidor local com recarga automática; abre no celular pelo IP da rede mostrado no terminal |
| `npm test` | Roda os testes uma vez (`npm run test:watch` fica observando) |
| `npm run lint` | Verifica o código e a regra de camadas |
| `npm run format` | Formata o código com o Prettier |
| `npm run build` | Checa os tipos e gera o build em `dist/` |
| `npm run preview` | Serve o build de `dist/` localmente, para testar a versão final |
| `npm run release` | Check completo e publicação local atômica em `releases/` ([atualizacoes.md](atualizacoes.md)) |
| `node tools/sim/still.mjs` | Robô parado: quanto a run dura sem mexer o agente, por agente |
| `npm run sim` | Simulador de progressão: runs seguidas com um robô, compras entre elas, primeiro desbloqueio e paredes de grind (`-- --runs 30 --max 360`) |
| `npm run sprites:build` | Gera os PNGs de `public/sprites/` a partir dos dados de `src/assets/sprites/` |
| `python3 tools/audio/music.py` | Corta os loops e converte as músicas de `audio/musicas/` para `public/audio/music/` (precisa de numpy e ffmpeg; [sonoplastia.md](sonoplastia.md#como-entra-no-jogo)) |
| `npm run sprites:check` | Confere se os PNGs estão iguais aos dados (faz parte do `npm run check`) |
| `npm run serve` | Serve a build publicada localmente, em HTTPS, para testar atualizações no PC |
| `npm version minor` + `git push --follow-tags` | Gera uma versão: dispara o deploy no GitHub Pages (skills `criar-versao` e `publicar-versao`) |
| `npm run check` | Lint, formatação, testes e build de uma vez; rode antes de abrir um PR |

## Testes no navegador

Com `npm run dev`, a cena da run fica em `globalThis.dopamina` (só em desenvolvimento). Pelo console dá para mexer no estado, por exemplo `dopamina.run.xp = dopamina.run.xpToNext` para forçar um level up.

## CI e deploy

[ci.yml](../.github/workflows/ci.yml) roda o `npm run check` em todo PR e push na `main`. [deploy.yml](../.github/workflows/deploy.yml) roda só com tags `vX.Y.Z`: check, build e GitHub Pages ([0017](decisoes/0017-deploy-por-versao.md), [0018](decisoes/0018-jogo-no-pages-servidor-futuro.md)). Servidor só no futuro, para contas e ranking ([servidor.md](servidor.md)).

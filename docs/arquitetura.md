# Arquitetura

Como o código do Dopamina Blaster é organizado. Este arquivo descreve **o estado atual**; o porquê de cada escolha fica nas [decisões](decisoes/README.md), ligadas em cada seção. Ao mudar algo aqui, registre a decisão primeiro.

> **Estado:** fase 1 concluída; fase 1.5 (menu) implementada seguindo o artboard "Menu principal (protótipo)" do canvas de identidade visual, falta validar no celular.

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
| Onde roda (desenvolvimento) | Localmente (`npm run dev`), celular pela rede local; distribuição ainda não decidida | [0011](decisoes/0011-rodar-localmente.md) |

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
| `records`, `options` | [RecordsScene.ts](../src/game/scenes/RecordsScene.ts), [OptionsScene.ts](../src/game/scenes/OptionsScene.ts) | Recordes salvos; opções (FPS, tela cheia) |
| `run` | [RunScene.ts](../src/game/scenes/RunScene.ts) | Chama o `stepRun` do `core` em passos fixos e desenha o estado (sprites reaproveitados, números de dano); abre as telas por cima |
| `hud` | [HudScene.ts](../src/game/scenes/HudScene.ts) | Por cima da run: XP, nível, tempo, interações, decompostas, pausa, joystick e FPS |
| `levelUp`, `pause`, `gameOver` | [LevelUpScene.ts](../src/game/scenes/LevelUpScene.ts), [PauseScene.ts](../src/game/scenes/PauseScene.ts), [GameOverScene.ts](../src/game/scenes/GameOverScene.ts) | Telas por cima da run |

As telas de interface usam [uiLayout.ts](../src/game/ui/uiLayout.ts): zoom inteiro a partir do canto superior esquerdo e layout refeito a cada redimensionamento.

## A run no `core`

- [state.ts](../src/core/run/state.ts): estado da run (agente, inimigos, disparos, gemas, nível) e `createRun(semente)`.
- [step.ts](../src/core/run/step.ts): `stepRun` avança um passo: movimento, nascimento de inimigos, perseguição, arma, dano, contato e gemas. Usa uma [grade espacial](../src/core/run/spatialGrid.ts) para achar vizinhos.
- [upgrades.ts](../src/core/run/upgrades.ts): opções de level up com raridade (Sorte), Rerrolar, Pular, Banir e espaços de modificador.
- [stats.ts](../src/core/run/stats.ts) e [progression.ts](../src/core/run/progression.ts): atributos com modificadores, arma por nível, XP e dificuldade.
- [rules.ts](../src/core/run/rules.ts): as regras chegam como parâmetro (`RunRules`), com os JSON como padrão.
- O `core` registra acontecimentos (`events`) que a cena lê para efeitos, sem o `core` saber de desenho.

Fora dessas camadas:

- **`tools/sim/`**: simulador sem tela que roda milhares de runs usando o `core` e gera as curvas de progressão (fase 3).
- **`tests/`** ou arquivos `*.test.ts` ao lado do código: testes do `core`.

## Estrutura de pastas

```
src/
  config/        JSON de parâmetros (stats, run, enemies, weapons, passives, rarities, economy, idle, display), types.ts e index.ts
  core/
    math/        vetores e utilidades
    random.ts    gerador aleatório com semente
    run/         campo crônico: agente, inimigos, armas, XP, level up
    idle/        campo longo: produção, offline (fase 4)
    organism/    setores de saúde, reset (fase 5)
    meta/        moeda, upgrades, desbloqueios (fase 3)
    save/        formato do save, migrações e recordes
  game/
    scenes/      cenas do Phaser
    render/      paleta, texturas, zoom e o gerador de sprites de molécula
    input/       teclado e joystick virtual
    ui/          tema (fontes, textos), botões, layout das telas, textos dos upgrades
    storage/     save no IndexedDB
  main.ts        ponto de entrada
public/          favicon; manifest do PWA e fontes na fase 6
tools/sim/       simulador (fase 3)
.github/         workflow de CI (verificações, sem deploy)
docs/            design, roadmap, arquitetura e decisões
```

Os testes ficam ao lado do código, como `*.test.ts`.

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
| `npm run check` | Lint, formatação, testes e build de uma vez; rode antes de abrir um PR |

## Testes no navegador

Com `npm run dev`, a cena da run fica em `globalThis.dopamina` (só em desenvolvimento). Pelo console dá para mexer no estado, por exemplo `dopamina.run.xp = dopamina.run.xpToNext` para forçar um level up.

## CI

[.github/workflows/ci.yml](../.github/workflows/ci.yml) roda o `npm run check` em todo PR e push na `main`. Não há deploy: o jogo roda localmente ([0011](decisoes/0011-rodar-localmente.md)).

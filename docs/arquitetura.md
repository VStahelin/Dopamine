# Arquitetura

Como o código do Dopamina Blaster é organizado. Este arquivo descreve **o estado atual**; o porquê de cada escolha fica nas [decisões](decisoes/README.md), ligadas em cada seção. Ao mudar algo aqui, registre a decisão primeiro.

> **Estado:** fase 0 concluída, fase 1 em andamento. Já existem as três camadas, a cena da run com o agente andando (teclado e joystick), testes, lint e o CI. As pastas marcadas como "fase N" na estrutura abaixo ainda não existem.

## Stack

| Peça | Escolha | Decisão |
| --- | --- | --- |
| Engine | Phaser 4.2 | [0002](decisoes/0002-phaser-4-typescript-pwa.md) |
| Linguagem | TypeScript 6 (modo `strict`) | [0002](decisoes/0002-phaser-4-typescript-pwa.md) |
| Distribuição | Web, instalável como PWA (PWA na fase 6) | [0002](decisoes/0002-phaser-4-typescript-pwa.md) |
| Build e servidor local | Vite 8 | [0003](decisoes/0003-camadas-core-game-config.md) |
| Testes | Vitest 4 | [0003](decisoes/0003-camadas-core-game-config.md) |
| Lint e formatação | ESLint 10 (typescript-eslint) e Prettier | [0003](decisoes/0003-camadas-core-game-config.md) |
| Tela e pixel art | Canvas em tela cheia, zoom inteiro; grade em aberto (16 px provisório) | [0009](decisoes/0009-grade-16px-zoom-inteiro.md), [0010](decisoes/0010-orientacao-livre.md) |
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
| `boot` | [BootScene.ts](../src/game/scenes/BootScene.ts) | Gera as texturas e abre a run |
| `run` | [RunScene.ts](../src/game/scenes/RunScene.ts) | Mundo da run, com câmera e zoom inteiro; lê teclado ou joystick e chama o `core` |
| `hud` | [HudScene.ts](../src/game/scenes/HudScene.ts) | Interface por cima da run, sem zoom: joystick virtual e FPS |

Fora dessas camadas:

- **`tools/sim/`**: simulador sem tela que roda milhares de runs usando o `core` e gera as curvas de progressão (fase 3).
- **`tests/`** ou arquivos `*.test.ts` ao lado do código: testes do `core`.

## Estrutura de pastas

```
src/
  config/        JSON de parâmetros (stats, run, economy, idle, display), types.ts e index.ts
  core/
    math/        vetores e utilidades
    run/         campo crônico: agente, inimigos, armas, XP, level up
    idle/        campo longo: produção, offline (fase 4)
    organism/    setores de saúde, reset (fase 5)
    meta/        moeda, upgrades, desbloqueios (fase 3)
    save/        formato do save e migrações (fase 1)
  game/
    scenes/      cenas do Phaser
    render/      paleta, texturas, zoom e, na fase 1, o gerador de moléculas
    input/       teclado e joystick virtual
    ui/          telas de level up e menu (fase 1)
  main.ts        ponto de entrada
public/          favicon; manifest do PWA e fontes na fase 6
tools/sim/       simulador (fase 3)
.github/         workflow de CI (verificações, sem deploy)
docs/            design, roadmap, arquitetura e decisões
```

Os testes ficam ao lado do código, como `*.test.ts`.

## Princípios

- **Simulação com passo fixo.** O `core` avança em passos de tempo fixos, independentes do FPS, para que a run se comporte igual no PC e no celular e o simulador reproduza os mesmos resultados. *(proposta, decidir na fase 1)*
- **Aleatoriedade com semente.** O `core` usa um gerador de números aleatórios com semente, nunca `Math.random()` direto, para dar para repetir uma run nos testes. *(proposta, decidir na fase 1)*
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

## CI

[.github/workflows/ci.yml](../.github/workflows/ci.yml) roda o `npm run check` em todo PR e push na `main`. Não há deploy: o jogo roda localmente ([0011](decisoes/0011-rodar-localmente.md)).

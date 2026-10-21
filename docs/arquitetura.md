# Arquitetura

Como o código do Dopamina Blaster é organizado. Este arquivo descreve **o estado atual**; o porquê de cada escolha fica nas [decisões](decisoes/README.md), ligadas em cada seção. Ao mudar algo aqui, registre a decisão primeiro.

> **Estado:** o código ainda não existe. Tudo abaixo é o alvo da [fase 0 do roadmap](roadmap.md#fase-0-fundação).

## Stack

| Peça | Escolha | Decisão |
| --- | --- | --- |
| Engine | Phaser 4 | [0002](decisoes/0002-phaser-4-typescript-pwa.md) |
| Linguagem | TypeScript (modo `strict`) | [0002](decisoes/0002-phaser-4-typescript-pwa.md) |
| Distribuição | Web, instalável como PWA | [0002](decisoes/0002-phaser-4-typescript-pwa.md) |
| Build e servidor local | Vite | [0003](decisoes/0003-camadas-core-game-config.md) |
| Testes | Vitest | [0003](decisoes/0003-camadas-core-game-config.md) |
| Save | IndexedDB, com backup exportável | [0005](decisoes/0005-save-local-indexeddb.md) |
| Hospedagem | GitHub Pages, deploy pelo GitHub Actions | [0006](decisoes/0006-deploy-github-pages.md) |

## Camadas

O código se divide em três camadas, com dependência num sentido só ([0003](decisoes/0003-camadas-core-game-config.md)):

```
src/game/   →   src/core/   →   src/config/
(Phaser)        (TS puro)       (números)
```

- **`src/config/`**: todas as constantes de balanceamento (abas Parâmetros e Economia). Só dados e tipos, sem lógica ([0004](decisoes/0004-parametros-centralizados.md)).
- **`src/core/`**: as regras do jogo em TypeScript puro: combate, spawn, XP, economia, idle, saúde, save. **Não importa Phaser nem nada do navegador**, para rodar nos testes e no simulador.
- **`src/game/`**: cenas do Phaser, desenho, som e leitura do controle. Lê o estado do `core`, desenha e repassa a entrada do jogador. Não guarda regra de jogo.

Fora dessas camadas:

- **`tools/sim/`**: simulador sem tela que roda milhares de runs usando o `core` e gera as curvas de progressão (fase 3).
- **`tests/`** ou arquivos `*.test.ts` ao lado do código: testes do `core`.

## Estrutura de pastas (alvo)

```
src/
  config/        constantes de balanceamento
  core/
    run/         campo crônico: agente, inimigos, armas, XP, level up
    idle/        campo longo: produção, offline
    organism/    setores de saúde, reset
    meta/        moeda, upgrades, desbloqueios
    save/        formato do save e migrações
  game/
    scenes/      cenas do Phaser (Boot, Menu, Run, Idle, ...)
    render/      sprites (gerador de moléculas), efeitos
    input/       teclado, joystick virtual, gamepad
    ui/          HUD, telas de level up e menu
  main.ts        ponto de entrada
public/          manifest do PWA, ícones, fontes
tools/sim/       simulador
docs/            design, roadmap, arquitetura e decisões
```

## Princípios

- **Simulação com passo fixo.** O `core` avança em passos de tempo fixos, independentes do FPS, para que a run se comporte igual no PC e no celular e o simulador reproduza os mesmos resultados. *(proposta, decidir na fase 1)*
- **Aleatoriedade com semente.** O `core` usa um gerador de números aleatórios com semente, nunca `Math.random()` direto, para dar para repetir uma run nos testes. *(proposta, decidir na fase 1)*
- **Reaproveitamento de objetos.** Inimigos, disparos e gemas saem de pools, sem criar e destruir a cada quadro.
- **Pixel art em escala inteira.** Escala 1×, 2× ou 3×, sem suavização.

## Comandos

*A preencher quando o projeto for criado (fase 0): instalar, rodar, testar, lint, build.*

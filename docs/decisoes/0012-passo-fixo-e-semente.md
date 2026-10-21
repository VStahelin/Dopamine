# 0012. Simulação em passo fixo, com aleatoriedade por semente

- **Status:** proposta
- **Data:** 2026-10-21
- **Área:** técnica

## Contexto

A run precisa se comportar igual no PC e no celular, e o simulador da fase 3 precisa repetir resultados para comparar curvas de balanceamento. Com passo variável e `Math.random()`, a mesma partida dá resultados diferentes a cada vez.

## Decisão

- O `core` avança a run em **passos fixos** (`ticksPerSecond` em `run.json`, hoje 60). A cena acumula o tempo real de cada quadro e chama `stepRun` quantas vezes couber, com um limite por quadro para não travar depois de uma pausa longa.
- Toda aleatoriedade do `core` vem do `Rng` com semente (`src/core/random.ts`). `Math.random()` é proibido no `core` pelo lint.
- As regras chegam à simulação como parâmetro (`RunRules`), com a configuração dos JSON como padrão, para testes e simulador usarem variações.

## Alternativas consideradas

- **Passo variável (delta do quadro):** mais simples, mas colisões e dano mudam com o FPS, e o simulador não repete resultados.
- **Física do Phaser (Arcade):** pronta, mas prende as regras ao Phaser e quebra a [0003](0003-camadas-core-game-config.md).

## Consequências

- Mesma semente + mesma entrada = mesma run. Há um teste que garante isso.
- O desenho mostra o estado do último passo; se aparecer tremido em telas de 120 Hz, dá para interpolar depois.

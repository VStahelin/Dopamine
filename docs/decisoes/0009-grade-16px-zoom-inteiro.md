# 0009. Tamanho do pixel e zoom inteiro pelo lado menor da tela

- **Status:** em aberto
- **Data:** 2026-10-21
- **Área:** técnica

> **Em aberto:** o tamanho da grade ainda não está decidido. A tendência é um pixel art mais detalhado (grade maior que 16 px). Até lá, o código usa 16 px como valor provisório, configurável em `src/config/display.json` (`tileSizePx`). O zoom inteiro vale independente da grade.

## Contexto

A aba [Design](../design.md) deixa em aberto o tamanho base do pixel (grade de 16 ou de 32 px) e pede escala inteira para os pixels não borrarem. As telas vão de celular em pé (390×844) a monitor (1920×1080).

## Decisão

- Os sprites seguem uma grade de **16 px lógicos**. É o tamanho do H na aba Design; os outros átomos (26 a 30 px) continuam como desenhados.
- O canvas ocupa a tela inteira (`Phaser.Scale.RESIZE`) e a câmera do mundo usa o **maior zoom inteiro** que ainda mostra pelo menos 360 px lógicos no lado menor da tela. Celular em pé fica em 1×, monitor 1080p em 3×.
- A HUD fica numa cena separada, sem o zoom do mundo.
- Os valores ficam em `src/config/display.json`.

## Alternativas consideradas

- **Grade de 32 px:** mais detalhe por sprite, mas o dobro de trabalho de arte, e no celular cabem menos inimigos na tela.
- **Resolução fixa com `Scale.FIT`:** a área visível seria igual em todo aparelho, mas sobram faixas pretas e o zoom deixa de ser inteiro.

## Consequências

- A área visível muda um pouco com o aparelho (entre 360 e 720 px lógicos no lado menor). Se isso pesar na dificuldade, a fase 1 pode limitar a área visível.
- No celular em pé, um sprite de 16 px fica pequeno; a fase 1 avalia se o agente e os inimigos precisam de mais tamanho.

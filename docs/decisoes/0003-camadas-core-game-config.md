# 0003. Camadas config, core e game, com Vite e Vitest

- **Status:** proposta
- **Data:** 2026-10-21
- **Área:** técnica

## Contexto

A aba [Plataforma](../plataforma.md) propõe separar a lógica do desenho, para testar as regras e rodar um simulador de balanceamento sem tela.

## Decisão

O código fica em três camadas, com dependência num sentido só: `src/game/` (Phaser) usa `src/core/` (TypeScript puro), que usa `src/config/` (constantes). Nada em `src/core/` importa Phaser ou APIs do navegador. Vite empacota e serve o projeto; Vitest testa o `core`.

## Alternativas consideradas

- **Regras dentro das cenas do Phaser:** mais rápido no começo, mas impede testes e simulador.
- **Webpack ou Parcel no lugar do Vite:** o Vite é o padrão dos templates do Phaser e é mais simples de configurar.
- **Jest no lugar do Vitest:** o Vitest usa a mesma configuração do Vite e roda TypeScript sem passo extra.

## Consequências

- O simulador da fase 3 reaproveita o `core` sem mudanças.
- Cada sistema novo tem duas partes: a regra no `core` e o desenho no `game`.
- A regra de importação pode ser garantida por lint mais tarde.

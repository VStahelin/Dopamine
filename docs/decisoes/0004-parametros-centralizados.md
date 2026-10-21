# 0004. Números de balanceamento num lugar só

- **Status:** proposta
- **Data:** 2026-10-21
- **Área:** técnica

## Contexto

As abas [Parâmetros](../parametros.md) e [Economia](../economia.md) têm dezenas de constantes que vão mudar muito durante os testes.

## Decisão

Todas as constantes de balanceamento ficam em `src/config/`, tipadas, com os mesmos nomes das abas. Nenhum número de balanceamento fica solto no `core` ou no `game`.

## Alternativas consideradas

- **Arquivo JSON:** fácil de editar, mas perde tipagem e comentários.
- **Constantes espalhadas no código:** cada ajuste vira uma caça ao valor.

## Consequências

- Ajustar o jogo é editar um lugar só.
- O simulador pode rodar com variações dos parâmetros para comparar curvas.

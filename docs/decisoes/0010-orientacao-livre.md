# 0010. Orientação livre no celular, pensada para vertical

- **Status:** proposta
- **Data:** 2026-10-21
- **Área:** técnica

## Contexto

A aba [Plataforma](../plataforma.md) pergunta se o celular joga em pé, deitado ou dos dois jeitos. O [conceito](../conceito.md) diz "vertical primeiro, adaptável a qualquer aspect ratio".

## Decisão

O jogo não trava a orientação: a run funciona em pé e deitado, porque o mundo aberto se adapta a qualquer proporção ([0009](0009-grade-16px-zoom-inteiro.md)). Telas e HUD são desenhadas primeiro para o celular em pé.

## Alternativas consideradas

- **Travar em vertical:** o PC e o tablet deitado ficariam com faixas laterais vazias; travar orientação na web também não funciona em todo navegador.
- **Travar em horizontal:** contraria o "vertical primeiro" do conceito.

## Consequências

- Cada tela nova precisa ser testada nas duas orientações.
- O campo longo (idle), que é vertical, pode precisar de layout próprio quando o celular estiver deitado.

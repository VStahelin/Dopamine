# 0024. Itens no mapa como fase 5.5, com o conjunto do Vampire Survivors

- **Status:** proposta
- **Data:** 2026-10-22
- **Área:** processo

## Contexto

O campo crônico só tem gemas de XP e moedas de ATP no chão. O Vitor pediu os itens que caem dos inimigos com o mesmo conjunto do Vampire Survivors e quer a adição de itens ao mapa antes da fase de polimento. Detalhes em [itens.md](../itens.md).

## Decisão

- Entra a **fase 5.5, Itens no mapa**, entre o organismo (fase 5) e o polimento (fase 6). A numeração das outras fases não muda.
- O conjunto de itens segue o do Vampire Survivors, um para um, com nomes da química do corpo: vesículas no lugar das fontes de luz, os dez itens delas, gemas de XP em três cores e a cápsula do chefe no lugar do baú.
- A Sorte mexe na quantidade e na raridade das recompensas da cápsula, com a regra de raridade do level up ([0013](0013-raridade-e-sorte.md)).
- A cápsula de prata passa a ser o caminho da evolução de arma, como a prancheta "Crônico" já mostra; se a evolução sai do level up fica em aberto em [itens.md](../itens.md).
- Os números ficam num `src/config/drops.json` novo ([0004](0004-parametros-centralizados.md)).

## Alternativas consideradas

- **Itens já na fase 2:** a run ganharia variedade antes, mas a fase 2 ainda está no ajuste dos números e os itens mexem na economia da fase 3.
- **Itens próprios, sem copiar o VS:** mais originais, mas o conjunto do VS já é conhecido e balanceado.

## Consequências

- O roadmap ganha a fase 5.5, e a evolução pelo baú do chefe que a fase 2.7 deixou para depois entra nela.
- Mexe na economia (ATP extra na run): o `npm run sim` precisa considerar os drops.
- Cada item novo pede um ícone em `src/assets/sprites/`.

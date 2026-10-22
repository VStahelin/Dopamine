# 0027. Level up só com armas e receptores

- **Status:** proposta
- **Data:** 2026-10-22
- **Área:** design

## Contexto

O level up sorteia entre 7 armas e 35 modificadores, o que dilui cada escolha. O Vitor pediu o modelo do Megabonk, em que o level up só oferece armas e tomos, um conjunto pequeno de atributos específicos. Detalhes em [megabonk.md](../megabonk.md#1-level-up-com-armas-e-receptores).

## Decisão

- O level up só oferece **arma nova, nível de arma, receptor novo e nível de receptor**, além da "Nova dose" e da Superdosagem quando tudo está no máximo.
- **Receptores** são os tomos do Megabonk: 16 atributos (10 liberados e 6 desbloqueáveis com ATP), 4 espaços com teto 6 pelo Laboratório, nível máximo 5. "Espaços de modificador" vira "Espaços de receptor", só no Laboratório.
- Os outros modificadores saem do level up e passam a vir de suplementos ([0028](0028-suplementos-e-ampolas.md)) e de sinapses ([0029](0029-sinapses-e-estruturas.md)). Rerrolar, Pular e Banir vêm do Laboratório, da saúde executiva e das sinapses.
- O **nível de arma** passa a ter raridade, que multiplica o ganho daquele nível, com a regra da [decisão 0013](0013-raridade-e-sorte.md). Arma nova e evolução continuam sem raridade.

## Alternativas consideradas

- **Manter os 35 modificadores e só cortar os espaços:** a escolha continua diluída e o mapa não ganha motivo para existir.
- **Receptores sem raridade:** mais simples, mas a Sorte perderia o efeito no level up.

## Consequências

- Muda em parte a [0013](0013-raridade-e-sorte.md): a arma ganha raridade no nível, e os espaços passam a ser de receptor.
- `passives.json` vira `receptors.json`; o sorteio em `src/core/run/upgrades.ts` muda; a tela de level up muda o título e a moldura da carta de arma ([ui-cronico.md](../ui-cronico.md#level-up)).
- A Superdosagem da [fase 5.6](../roadmap.md#fase-56-variedade-da-run) passa a contar receptores no lugar de modificadores.
- Fase 5.8 do [roadmap](../roadmap.md#fase-58-receptores-no-level-up).

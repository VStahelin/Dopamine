# 0028. Suplementos de ampola, XP com chance e agregados

- **Status:** proposta
- **Data:** 2026-10-22
- **Área:** design

## Contexto

Com o level up enxuto ([0027](0027-level-up-com-receptores.md)), os outros atributos precisam de outra fonte. O Vitor pediu o modelo do Megabonk: itens no mapa que melhoram atributos, nem todo inimigo soltando XP, chance de baú por inimigo e baú garantido no mini chefe. Detalhes em [megabonk.md](../megabonk.md#2-suplementos).

## Decisão

- **Suplementos:** passivos da run que não ocupam espaço e acumulam, em quatro raridades (Comum, Raro, Ultra raro, Lendário) sorteadas pela Sorte. Só saem de ampolas e de estruturas.
- **Ampola** é o baú: cai no chão e abre ao toque, de graça, com um suplemento. Chance por molécula comum 0,3%, forte 3%, sempre nos agregados (mínimo Raro) e no chefe (mínimo Ultra raro, além da cápsula). A Sorte multiplica a chance; há garantia contra seca e intervalo mínimo.
- **Gema de XP com chance:** 60% na molécula comum, 40% no fragmento de cascata, sempre na forte. A gema que cai vale o XP dividido pela chance, então o XP médio não muda.
- **Agregados (mini chefes):** um a cada 2 minutos, menos nos minutos de chefe; a molécula forte da onda com vida ×12, que sempre solta ampola.
- Os **reagentes** da evolução viram suplementos raros, com peso ×10 quando a arma deles está no MAX. A evolução continua pela cápsula de prata ([0024](0024-itens-no-mapa.md)).
- A **Vitamina** sai da tabela da vesícula e vira suplemento.

## Alternativas consideradas

- **Baús pagos com ATP da run, como no Megabonk:** mais tensão, mas o ATP da run é a moeda da meta ([0021](0021-meta-progressao.md)); fica em aberto.
- **Toda molécula continua soltando XP:** não muda nada no ritmo e não abre espaço para a ampola.
- **Itens como cartas no level up:** voltaria a diluir a escolha.

## Consequências

- Os itens de consumo da [fase 5.5](../itens.md) continuam; suplemento é outra categoria, que fica a run toda.
- Novos `supplements.json`, campos em `drops.json` (chances por tipo de molécula) e em `run.json` (agregados).
- O `npm run sim` precisa simular as ampolas, porque Mitocôndria e Estresse mexem no ATP.
- Fases 5.9 e 5.10 do [roadmap](../roadmap.md#fase-59-suplementos-e-ampolas).

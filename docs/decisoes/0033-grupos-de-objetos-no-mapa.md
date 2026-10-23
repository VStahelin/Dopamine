# 0033. Objetos do mapa em grupos com motivo biológico

- **Status:** proposta
- **Data:** 2026-10-23
- **Área:** design

## Contexto

Na [decisão 0026](0026-mapas-gerados.md), cada objeto do mapa era sorteado sozinho: pontos com distância mínima, 30% de chance de virar um aglomerado de cópias do mesmo sprite e decoração espalhada pelo bloco inteiro. Jogando, o Vitor achou o resultado aleatório demais: neurônios, astrócitos, sinapses e mielina misturados sem relação, sem um motivo para cada coisa estar ali ([mapas.md](../mapas.md#grupos)).

## Decisão

O gerador passa a montar **grupos**, cada um com um motivo biológico, definidos por ambiente em `src/config/map.json` (`environments.<id>.groups`). Um grupo é uma lista de partes (centro, anel com abertura, fileira, aglomerado ou dispersão), cada parte com um sprite do ambiente, e um texto `why` com o motivo. Exemplos: o lóbulo hepático (hepatócitos em anel em volta da veia central, bile por fora), a placa amiloide (astrócitos cercando a placa) e a colônia bacteriana (bactérias juntas no muco, presas às fibras). Cada bloco recebe alguns grupos e poucos objetos soltos. A decoração vem quase toda nos grupos. Entre dois grupos fica sempre uma passagem de 2 tiles, medida borda a borda, no lugar da distância mínima entre obstáculos.

## Alternativas consideradas

- **Só aumentar os aglomerados:** continua sem motivo; um grupo de cópias do mesmo objeto não conta nada.
- **Salas desenhadas à mão (prefabs fixos):** ficam bonitas, mas se repetem rápido e custam arte e trabalho por ambiente. As partes com formas sorteadas dão variedade com os mesmos dados.
- **Ruído por tipo de objeto (biomas dentro do ambiente):** agrupa por região, mas não cria as relações (anel em volta, fileira) que dão o motivo.

## Consequências

- `src/core/map/chunk.ts` monta os grupos (`layoutGroup`) e coloca cada um com a passagem; `MapObject` ganha `group`.
- `map.json`: `obstacleMinDistanceTiles` e `clusterChance` saem; entram `passageTiles`, `densities.*.groups` e os `groups` de cada ambiente.
- Ambiente novo precisa de pelo menos um grupo com motivo; um teste confere que as partes usam objetos do ambiente.
- Os pontos de interesse (câmara, corredor) podem virar grupos também, com o mesmo formato.

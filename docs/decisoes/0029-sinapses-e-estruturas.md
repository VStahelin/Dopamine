# 0029. Sinapses e estruturas no mapa

- **Status:** proposta
- **Data:** 2026-10-22
- **Área:** design

## Contexto

O Vitor pediu estruturas como os santuários do Megabonk, em que é preciso ficar dentro do alcance por um tempo para ganhar um bônus, para a run ficar mais dinâmica. Detalhes em [megabonk.md](../megabonk.md#4-sinapses-e-estruturas).

## Decisão

- **Sinapse** (santuário de carga): círculo de 48 px; dentro, a barra enche em 6 s; fora, esvazia devagar. Cheia, abre 3 cartões de bônus de atributo, entre todos os atributos, com raridade pela Sorte, sem ocupar espaço. A **Sinapse potenciada** (10%) enche em 10 s e só dá Lendário ou Especial.
- Estruturas da primeira leva: **Foco inflamatório** (desafio: cerco que dá ampola), **Coágulo** (chama um agregado extra com duas ampolas) e **Glândula adrenal** (ATP na hora por +5% de Estresse). **Ribossomo** (duplica suplemento) e **Farmácia** (vende suplementos) ficam para depois.
- Antes dos mapas gerados, as estruturas nascem num anel fora da tela; com eles ([0026](0026-mapas-gerados.md)), viram pontos de interesse dos blocos.

## Alternativas consideradas

- **Só sinapses:** mais simples, mas o mapa teria um tipo só de desvio.
- **Bônus da sinapse na hora, sem escolha:** mais rápido, mas a escolha entre 3 é o que torna a sinapse diferente de um item no chão.

## Consequências

- Novo `structures.json`; a sinapse reaproveita a tela do level up.
- [mapas.md](../mapas.md#pontos-de-interesse) ganha a sinapse e as outras estruturas como pontos de interesse.
- O Foco inflamatório depende do Cerco inflamatório da [fase 5.6](../roadmap.md#fase-56-variedade-da-run).
- Fase 5.11 do [roadmap](../roadmap.md#fase-511-sinapses-e-estruturas).

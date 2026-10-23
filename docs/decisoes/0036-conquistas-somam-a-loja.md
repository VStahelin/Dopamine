# 0036. Conquistas somam à loja, e a cápsula de agente liberta um agente por jogar

- **Status:** proposta
- **Data:** 2026-10-23
- **Área:** design

## Contexto

A [fase 5.16](../roadmap.md#fase-516-conquistas) pedia uma resposta: as conquistas substituem parte do desbloqueio por ATP, ou só somam? O [roadmap](../roadmap.md#depois-conquistas) e o [menu.md](../menu.md#o-que-falta-decidir) deixavam a pergunta em aberto. As estatísticas acumuladas da fase 5.13 já existem no save.

## Decisão

As conquistas **somam**: nada sai da loja. Cada conquista (lista em `src/config/meta.json`, `achievements`) dá ATP ou libera de graça um agente ou uma arma que também se compra. Se o jogador já comprou o que ela libera, recebe metade do preço em ATP.

As conquistas são lidas das estatísticas acumuladas e dos recordes (`src/core/meta/achievements.ts`). Elas são entregues no fim da run, na ALTA e ao entrar no hub (para saves antigos). Ficam guardadas em `save.achievements` e não voltam a zero na ALTA.

A cápsula de agente (`drops.json`, `agentCapsule`) é outro caminho por jogar. Ela é sorteada uma vez por run, depois do minuto da config, longe do agente e com seta na borda. Ela traz um agente ainda bloqueado, e tocar nela libera esse agente no fim da run.

Os casos curados ficam em `save.cases` (indivíduo, runs e melhor tempo no caso) e aparecem acima das estrelas no palco do hub.

## Alternativas consideradas

- **Conquistas substituem parte dos desbloqueios:** tiraria agentes da loja e prenderia quem joga pouco atrás de metas longas. Também apagaria o ATP que já foi gasto em saves antigos.
- **Só ATP, sem liberar nada:** não responde à pergunta da fase ("jogar libera conteúdo?").

## Consequências

- O save ganha `achievements`, `cases`, `records.caseRuns` e `records.caseBestSeconds`, com migração para os saves antigos.
- `RunResult` ganha `freedAgent`. `recordRun` libera o agente, e `RunRules.lockedAgents` diz quais agentes a cápsula pode trazer.
- Uma conquista nova é só uma entrada em `meta.json`. Um tipo de meta novo precisa de um caso em `achievementProgress` e no tipo `AchievementGoal`.

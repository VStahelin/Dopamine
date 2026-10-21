# 0014. Fase 1.5: esqueleto do menu principal antes da profundidade da run

- **Status:** proposta
- **Data:** 2026-10-21
- **Área:** processo

## Contexto

Com a v0.1 jogável, o Vitor quer definir já o menu principal inteiro, com um lugar para cada área do jogo (modos, agentes, árvores de upgrades, armas e outras), mesmo que a maioria ainda não exista.

## Decisão

Entra uma fase intermediária, a **1.5**, entre a v0.1 e a profundidade da run: montar o esqueleto do menu definido em [menu.md](../menu.md), com as áreas futuras como placeholder num formato comum ("EM BREVE · FASE N"). As fases seguintes preenchem a tela delas em vez de criar menus novos. A numeração das outras fases não muda.

Uma sessão paralela na web (branch `claude/project-thread-lodja9`) propôs o mesmo hub como "decisão 0009", número que já era da resolução nativa. Ela foi incorporada aqui no merge: as medidas, os estados, os selos e as proporções de tela entraram em [menu.md](../menu.md).

## Alternativas consideradas

- **Criar cada tela só na fase em que ela ganha conteúdo:** menos trabalho agora, mas a navegação é refeita a cada fase e o jogo não mostra para onde vai.

## Consequências

- A escolha de agente (fase 2) e o menu entre runs (fase 3) passam a ser "preencher o placeholder" no roadmap.
- O menu atual vira a tela de título.

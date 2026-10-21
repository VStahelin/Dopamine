# 0009. Menu principal em formato de hub, montado numa fase 1.5

- **Status:** proposta
- **Data:** 2026-10-21
- **Área:** design

## Contexto

O Vitor mandou o print do hub de um jogo mobile de campanha como inspiração para o menu. A [decisão 0008](0008-v01-menu-e-run.md) define um menu mínimo para a v0.1 (título, Jogar, Recordes e Opções), mas não diz como o menu cresce depois. A aba Menu do documento de conceito, agora em [menu.md](../menu.md), propõe o hub e cita uma "fase 1.5" que não existia no [roadmap](../roadmap.md).

## Decisão

O menu entre runs é um hub vertical: barra de status com ATP e saúde no topo, palco com o caso atual (o indivíduo como capítulo, com melhor tempo e 3 estrelas), linha de ação com Campo longo, JOGAR e Agente, e barra de 5 abas (Agentes, Arsenal, Caso, Laboratório, Organismo). Ficam de fora energia, segunda moeda, ofertas, chat, guilda e ranking online.

O hub completo entra numa fase 1.5, logo depois da v0.1: o layout inteiro com placeholders "EM BREVE · FASE N" e valores de exemplo. As fases seguintes enchem cada parte.

## Alternativas consideradas

- **Manter só o menu mínimo da v0.1 até a fase 3:** menos trabalho cedo, mas o menu seria refeito quando a loja e a escolha de agente chegassem.
- **Montar o hub já na v0.1:** atrasa a primeira versão jogável, que deve provar a run primeiro ([decisão 0007](0007-roadmap-run-primeiro.md)).
- **Copiar o print inteiro (energia, ofertas, selos em tudo):** não combina com um jogo pessoal, sem servidor e sem monetização.

## Consequências

- O roadmap ganha a fase 1.5, entre a fase 1 e a fase 2.
- A v0.1 continua como na decisão 0008; o hub substitui o menu mínimo na fase 1.5, reaproveitando Recordes e Opções.
- O protótipo visual está no [canvas de identidade visual](https://claude.ai/artifact/MPV17zZywrhhXBUdfnUs6F), prancheta "Menu principal (protótipo)".
- Cada fase seguinte sabe onde sua tela entra no menu (tabela em [menu.md](../menu.md#o-que-o-hub-mostra-em-cada-fase)).

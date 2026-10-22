# 0023. Organismo: setores com efeito no jogo, saúde vinda dos agentes e ALTA com herança

- **Status:** proposta
- **Data:** 2026-10-22
- **Área:** design

## Contexto

A fase 5 amarra o jogo no corpo do indivíduo ([mecanicas.md](../mecanicas.md)). Havia perguntas em aberto sobre o efeito dos setores, como os agentes mexem na saúde, como é o reset e quais moléculas cada doença traz. O Vitor escolheu as propostas.

## Decisão

- **Quatro setores de 0 a 100**, cada um com efeito que passa por zero em 50, bônus acima e penalidade abaixo: Física = interações no começo da run; Mental = recarga do especial; Executiva = rerrolagens e opções no level up; Social = ATP do campo longo. Setor em 0 só dá a penalidade máxima, sem derrota.
- **Saúde vinda dos agentes:** no fim da run, o agente aplica o efeito dele proporcional aos minutos (cheio em 10, até 2×), com um colateral em outro setor. Os agentes do idle na base empurram os setores deles por hora, também offline. Retorno decrescente: perto de 100 quase não sobe, perto de 0 cai menos.
- **A doença puxa as moléculas:** cada setor tem uma família (Física: açúcares e lipídios; Mental: estresse, com Adrenalina e Cortisol; Executiva: radicais livres, com Radical hidroxila e Peroxinitrito; Social: toxinas, com Etanol e Acetaldeído). Setor baixo aumenta o peso da família dele no sorteio da run e no campo longo.
- **Multiplicador de saúde** da aba Economia (1 + (média − 50)/100) no ATP do campo longo.
- **ALTA:** abre quando os quatro setores passam de 70. O próximo indivíduo tem outra doença, começa mais doente e é 1,25^(k − 1) mais difícil. Zera Laboratório, estrelas, baú, campo longo e ATP; mantém agentes e armas desbloqueados (run e idle) e os recordes. Os pontos herdados (raiz quadrada do ATP ganho no indivíduo / 1000) somam +10% de ATP cada, para sempre.
- Tudo em `src/config/organism.json`, os efeitos dos agentes em `agents.json` (`health`, `collateral`) e `idle.json` (`healthPerHour`); as regras em `src/core/organism/`.

## Alternativas consideradas

- **Só um multiplicador geral de saúde:** mais simples, mas os setores perderiam personalidade.
- **Só a run mexendo na saúde:** o idle ficaria só como fonte de ATP.
- **Alta sem zerar nada:** mais leve, mas sem sentido no "chegar 2 a 5 vezes mais rápido".
- **Doenças só mudando a mistura de açúcares e lipídios:** menos trabalho, mas as doenças ficariam parecidas.

## Consequências

- Agente novo precisa de `health` e `collateral` (run) ou `healthPerHour` (idle).
- Hoje só a Dopamina sobe a Executiva na run, e só a Dopamina e a Endorfina sobem a Social: os agentes futuros (Serotonina, Ocitocina, Cafeína...) completam o elenco.
- Falta medir no jogo se o segundo indivíduo chega no ponto do primeiro de 2 a 5 vezes mais rápido.

# 0032. Local do corpo escolhido pelo jogador, com sinergia agente × local na saúde

- **Status:** aceita (o Vitor mandou seguir com a fase 5.12 em 2026-10-23)
- **Data:** 2026-10-23
- **Área:** design

## Contexto

Na fase 5.7 ([0026](0026-mapas-gerados.md)) o ambiente do mapa (Corrente sanguínea, Fígado, Intestino, Pulmão, Cérebro) é sorteado pela semente da run, e a pergunta "quem escolhe o ambiente?" estava em aberto em [mapas.md](../mapas.md#o-que-falta-decidir) e em [lacunas-vs.md](../lacunas-vs.md#perguntas-em-aberto). O Vitor pediu que o jogador escolha onde vai agir e que o par agente × local dê sinergia em algum setor de saúde. Regras em [mapas.md](../mapas.md#escolha-do-local); tela em [menu.md](../menu.md#escolha-do-local).

## Decisão

- **O jogador escolhe o local** antes da run, numa faixa acima do JOGAR que abre a tela com o corpo. O sorteio continua como opção ("Qualquer lugar", +10% de ATP). A Corrente sanguínea é o local inicial; os outros quatro abrem na primeira estrela do primeiro caso.
- **Cada local tem uma família e um setor**, os mesmos pares da [0023](0023-organismo.md): Intestino = açúcares e lipídios / Física; Cérebro = estresse / Mental; Pulmão = radicais / Executiva; Fígado = toxinas / Social. A família do local tem peso ×2 no sorteio de moléculas e formações, e o ganho de saúde do agente no setor do local é ×1,5. A Corrente sanguínea é neutra (a run de hoje).
- **Cada agente tem um local de sinergia**, pela farmacologia real, que melhora um setor nomeado: +4 pontos nesse setor (na escala de minutos da 0023), colateral pela metade e receptor nativo começando no nível 1.
- **Barreira hematoencefálica:** agentes marcados como enzimas grandes (Lipase, Álcool desidrogenase) não podem ser escolhidos para o Cérebro.
- O caso não escolhe o local, só marca o **INDICADO** (o do setor mais baixo).
- Números em `src/config/map.json`, `agents.json` (`synergy`, `crossesBloodBrainBarrier`) e `organism.json`; regras em `src/core/organism/` e `src/core/map/`, sem Phaser ([0003](0003-camadas-core-game-config.md), [0004](0004-parametros-centralizados.md)).

## Alternativas consideradas

- **Continuar sorteado pela semente:** zero trabalho, mas o mapa não conversa com o organismo e o jogador não tem o que decidir.
- **O caso (a doença) escolhe o local:** liga ao organismo, mas tira a escolha e repete sempre o mesmo local até a ALTA.
- **Sinergia como bônus de combate grande:** mais sentido na hora, mas empurra todo mundo para o mesmo par e esvazia a matriz de efetividade. Na saúde, o efeito encurta o loop do organismo sem mexer no equilíbrio da run.
- **Vários locais de sinergia por agente:** mais combinações, mas a tabela fica difícil de lembrar e todo local vira "bom".

## Consequências

- O roadmap ganha a fase 5.12 (Locais do corpo e sinergias), depois da 5.7 e da 5.11; o item "escolha do local fica para depois" da 5.7 aponta para ela.
- O hub ganha a faixa do local e uma tela nova; fim de run, aba Organismo, escolha do agente e HUD mostram a sinergia ([menu.md](../menu.md#escolha-do-local)).
- Agente novo precisa de `synergy` (local e setor) e de `crossesBloodBrainBarrier`.
- O código do mapa passa a ter o local; jogar o mesmo mapa que um amigo pede local + semente.
- O `npm run sim` precisa medir se a sinergia não encurta demais o caminho até a ALTA (a meta continua de 2 a 5 vezes mais rápido no segundo indivíduo, não mais).
- Fecha a pergunta "Locais do corpo são escolhidos pelo jogador?" de [lacunas-vs.md](../lacunas-vs.md#perguntas-em-aberto).

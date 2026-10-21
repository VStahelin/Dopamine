# 0015. Ação própria do agente + armas do pool, com tipos de ataque em JSON

- **Status:** aceita
- **Data:** 2026-10-21
- **Área:** design

## Contexto

A aba [Personagens](../personagens.md) dá a cada agente uma ação própria (a Dopamina solta pulsos em anel, a Lipase dá golpes curtos). A aba [Armas](../armas.md) tem 7 armas que chegam pelo level up. Era preciso decidir como as duas coisas convivem. O Vitor escolheu ação própria + armas.

## Decisão

- Cada agente começa com a **sua ação**, que funciona como a primeira arma e só ele tem (`source: "agent"` em `weapons.json`).
- O level up oferece as **armas do pool** (`source: "pool"`) enquanto houver espaço: o atributo Espaços de arma (4, teto 6) conta a ação também.
- Toda arma tem um **tipo de ataque** (`kind`): disparo, cone, órbita, aura, poça, feixe, pulso ou golpe. O `core` implementa os tipos uma vez; arma nova é só JSON.
- **Evolução:** arma no nível máximo + o reagente certo aparece como opção de level up, na cor Especial, e vira a arma evoluída (`source: "evolution"`).
- **Cascata pela química real** (aba Personagens): triglicerídeo → glicerol + 3 ácidos graxos; amido → 3 maltoses → glicoses; sacarose → glicose + frutose. Os fragmentos nascem onde a molécula morreu e perseguem o agente.
- **Efetividade por tipo:** cada agente tem afinidade forte (×1,5), neutra (×1) ou fraca (×0,5) por tipo de molécula, aplicada a todas as armas dele.
- Agentes jogáveis nesta fase: Dopamina, Lipase e Insulina.

## Alternativas consideradas

- **Só armas do pool, agente sem ação própria:** os agentes ficariam parecidos entre si.
- **Cascata de 1 nível só:** mais simples de balancear, mas perde a química do jogo.

## Consequências

- Responde às perguntas da aba Armas: a arma é do jogador (qualquer agente usa qualquer arma do pool), com 4 espaços e nível máximo 8 por arma.
- Os atributos Área, Meia-vida, Dose e afins valem para todos os tipos de ataque onde fazem sentido.

# 0035. Comportamento por família de molécula e um chefe por local do corpo

- **Status:** proposta
- **Data:** 2026-10-23
- **Área:** design

## Contexto

Até a v0.17 todas as moléculas só perseguem o agente em linha reta, a família inflamação não tem molécula e o único chefe é a Partícula de LDL ([lacunas-desenvolvimento.md](../lacunas-desenvolvimento.md#inimigos-e-chefes)). A tabela de tipos de [personagens.md](../personagens.md#tipos-de-molécula-ofensora) já dizia como cada família devia se comportar, mas não havia regra nem chefe por local. A fase 5.14 do roadmap fecha isso; o Vitor mandou tocar as fases direto.

## Decisão

- **Comportamentos por molécula**, compostos em `behaviors` no `enemies.json` (sem Phaser, em `src/core/run/behaviors.ts`):
  - `erratic` (radicais): a direção para o agente gira um ângulo sorteado, trocado a cada fração de segundo; batem forte e são difíceis de prever.
  - `aura` (estresse): as moléculas num raio andam mais rápido e levam menos dano. O Cortisol fica longe (`keepAway`), o que faz dele o alvo prioritário.
  - `lifetime` (Adrenalina e Noradrenalina): somem sozinhas depois de alguns segundos, sem recompensa.
  - `pool` (toxinas): o Acetaldeído deixa uma **poça tóxica** ao ser decomposto; dentro dela o agente perde interações aos poucos e fica com **Lentidão**.
  - `spawner` (inflamação): a **Citocina** fica parada e solta **Bradicininas** de tempos em tempos, até um teto.
  - `burst` (Peróxido de hidrogênio): estoura ao encostar, com dano forte, e some sem recompensa.
- **Efeitos no agente**, na fila de efeitos da HUD: **Lentidão** (−20% de Mobilidade, da poça) e **Adrenalina** (+30% de Mobilidade por alguns segundos ao decompor Adrenalina ou Noradrenalina: o estresse que acelera os inimigos também acelera quem o vence).
- **Moléculas novas:** Superóxido e Peróxido de hidrogênio (radicais; o Superóxido vira peróxido), Noradrenalina (estresse), Amônia (toxina), Citocina e Bradicinina (inflamação, a família que faltava). O Cerco inflamatório passa a usar Citocinas e Bradicininas.
- **Um chefe por local**, ligado à família do local, no lugar do LDL a cada 5 minutos: Corrente sanguínea, Partícula de LDL (tanque); Fígado, **NAPQI** (o metabólito tóxico do paracetamol, deixa poças por onde passa); Intestino, **Amilopectina** (tanque que solta glicoses e se quebra em maltoses); Pulmão, **Benzopireno** (da fumaça, errático e soltando radicais); Cérebro, **CRH** (o hormônio que dispara o estresse, com uma aura grande). O chefe do local fica em `map.json` (`boss` de cada ambiente).
- **A Placa de ateroma** é o chefe de fim de caso: nasce uma vez aos 15 minutos, em qualquer local, parada, enorme e lipídica; vale a cápsula de prata.

## Alternativas consideradas

- **Comportamento por tipo, fixo no código:** mais simples, mas não deixa o chefe misturar comportamentos (o Benzopireno é errático e solta radicais) nem ajustar uma molécula sem mexer nas outras.
- **Chefe pela doença, e não pelo local:** a doença já puxa as moléculas; o local é a escolha do jogador, então o chefe diferente é o que faz duas runs em locais diferentes terminarem diferentes (critério de saída da fase 5.14).
- **Placa fechando parte do mapa como obstáculo:** mais fiel ao doc antigo, mas exige mexer no gerador do mapa; parada e enorme ela já bloqueia o caminho.

## Consequências

- `enemies.json` ganha `behaviors`; `run.json` ganha `agentEffects` (Lentidão, Adrenalina), a Placa em `bosses` e as poças; `map.json` ganha `boss` por ambiente.
- Moléculas novas precisam do desenho em átomos no `molecules.json`, vindo da prancheta "Famílias e chefes" do canvas.
- O campo longo recebe as moléculas novas de estresse, radical e toxina pelo sorteio da doença; os comportamentos ficam só no campo crônico por enquanto.
- [personagens.md](../personagens.md#tipos-de-molécula-ofensora) e a [wiki](../wiki.md) passam a descrever o que o jogo faz.

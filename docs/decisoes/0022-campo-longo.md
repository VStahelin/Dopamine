# 0022. Campo longo: defesa por ondas com pool de agentes, sempre rodando

- **Status:** proposta
- **Data:** 2026-10-21
- **Área:** design

## Contexto

A fase 4 cria o campo longo, o idle que farma sozinho ([conceito.md](../conceito.md), [mecanicas.md](../mecanicas.md)). A base visual é a prancheta "Tela de batalha (mockup)" do canvas de identidade visual: BASE com interações, ondas, pool de agentes embaixo, barra do progresso da onda e botão x2. O Vitor escolheu as regras que a prancheta não diz.

## Decisão

- **Ondas que sobem:** as moléculas descem do topo até a BASE (largura lógica fixa, igual em qualquer tela); cada onda vencida aumenta a vida, a quantidade e o ATP. A BASE tem 10 interações; se zerar, o campo volta 3 ondas com a BASE cheia. Nunca para de produzir, só produz menos.
- **Pool de agentes:** espaços na base (3 no começo, até 5 pela melhoria Espaços na base). O jogador escolhe quem fica em cada espaço e sobe o nível de cada agente com ATP. Os cinco agentes do idle de [personagens.md](../personagens.md): Ômega-3 começa liberado; Melatonina, Magnésio, Vitamina D e Endorfina se desbloqueiam com ATP. Melhorias próprias do campo: Ritmo de disparo, Espaços na base e Teto offline, com o custo mais suave da aba Economia (×1,08).
- **ATP das moléculas decompostas:** vai para um ATP a coletar. A tela do campo coleta sozinha; o botão Campo longo do Hub mostra o valor.
- **Sempre rodando:** o campo é simulado o tempo todo (Hub, run, a própria tela) em passos fixos. Com o jogo fechado ou em segundo plano, o progresso offline simula alguns minutos na onda atual para medir o ritmo e paga até o teto de horas (8 h no começo), com o painel "Enquanto você estava fora" no Hub. A Melatonina na base soma um bônus offline.
- **Tela própria:** o campo longo abre pelo Hub. O painel ao lado da run em tela larga fica para a fase 6.
- Tudo em `src/config/idle.json`; a simulação em `src/core/idle/`; o save guarda o progresso do campo.

## Alternativas consideradas

- **Onda fixa sem derrota:** mais simples, mas sem o avanço de ondas da prancheta.
- **Produção fixa por agente por hora:** o combate seria só visual.

## Consequências

- `npm run sim` mostra quanto uma noite rende (no começo, cerca de 440 ATP: um desbloqueio, sem substituir a run).
- Agente novo do idle: entrada em `idle.json` e uma molécula em `src/assets/sprites/molecules.json`.
- A ligação com os setores de saúde do organismo fica para a fase 5.

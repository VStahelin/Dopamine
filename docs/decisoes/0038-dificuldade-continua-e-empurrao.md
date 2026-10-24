# 0038. Dificuldade contínua no fim de jogo e empurrão com recarga

- **Status:** proposta
- **Data:** 2026-10-24
- **Área:** design

## Contexto

Playtest rodada 2 (BAL-1 a BAL-4): nas fases avançadas o jogador ficava imortal jogando parado. O empurrão de cada golpe, somado à velocidade das armas, segurava as moléculas longe; o dano de contato não crescia com o tempo; e o chefe fugia empurrado. O simulador confirmou: o robô com o Laboratório no máximo passava de 30 minutos sem perder uma interação depois dos 11. O Vitor pediu que as moléculas fiquem progressivamente mais fortes, "muito fortes ali pelos 20 minutos", com uma fórmula contínua fácil de prever.

## Decisão

- **Dano de contato** cresce com o tempo de run: × 2^(t / `damageDoublingMinutes`), fixado quando a molécula nasce.
- **Vida no fim de jogo:** a partir de `lateMinute`, × 2^((t − lateMinute) / `hpDoublingMinutes`), por cima do D(t) e da curva de vida que já existiam.
- **Velocidade:** × (1 + `speedPerMinute` × t), até `maxSpeedMultiplier`.
- **Empurrão:** cada molécula só é empurrada de novo depois de `knockbackCooldownSeconds`; o empurrão cai com o tempo (× 1 / (1 + t / `knockbackFalloffMinutes`)); fortes, agregados e chefe ignoram uma fração dele (`knockbackResist`; o chefe ignora tudo).
- Números em `economy.json` (`difficulty`) e `run.json` (`combat`). Valores de partida: dano dobra a cada 7 min, vida dobra a cada 4 min depois dos 12, velocidade até 1,4×, empurrão com recarga de 0,35 s e pela metade aos 8 min.
- A meta de balanceamento é medida com `node tools/sim/late.mjs`: build forte em movimento cai perto dos 20 minutos; parado, cai logo.

## Alternativas consideradas

- **Só subir o termo cúbico do D(t):** D(t) também multiplica a quantidade, e o campo já chega ao limite de 400 moléculas; mais quantidade não alcança uma build forte.
- **Tirar o empurrão:** a Repulsão e o Bicarbonato deixariam de fazer sentido; com recarga e queda ele continua útil no começo.

## Consequências

- A run tem um teto prático perto dos 20 a 25 minutos para builds fortes; o começo da run quase não muda (simulador de progressão com ATP médio parecido).
- Responde a BAL-4 do playtest; a fórmula está em [economia.md](../economia.md#2-dificuldade-da-run-e-o-limiar-programável) e o texto para o jogador na wiki.

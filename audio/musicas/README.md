# Músicas geradas

Pasta para as músicas que saem do app de geração de música, do jeito que foram exportadas, antes de qualquer corte. O tema, a lista de faixas e os prompts estão em [docs/sonoplastia.md](../../docs/sonoplastia.md).

Esta pasta fica fora de `public/`, então nada daqui entra no jogo nem no deploy. As versões finais, cortadas em loop e convertidas para OGG e M4A, ficam em `public/audio/music/`, geradas por `python3 tools/audio/music.py` a partir do campo `source` de cada faixa em `src/config/audio.json` (veja "Como entra no jogo" em [docs/sonoplastia.md](../../docs/sonoplastia.md)).

## Como nomear

`<id>-<versão>.<extensão>`, com o id da faixa da aba Sonoplastia e um número para cada geração. Exemplo: `title-1.wav`, `title-2.wav`, `run1-1.mp3`.

| Id | Faixa |
| --- | --- |
| `title` | Tema principal (tela de título) |
| `hub` | Hub e menus |
| `idle` | Campo longo |
| `run1` | Run, minuto 0 a 10 |
| `run2` | Run, minuto 10 a 20 |
| `run3` | Run, depois do minuto 20 |
| `crisis` | Pico de onda |
| `boss` | Chefe |
| `gameover` | Fim de run |
| `alta` | ALTA do organismo |
| `levelup` | Jingle de level up |
| `capsule` | Jingle da cápsula e da ampola |
| `bossIn` | Jingle do chefe chegando |
| `crisisIn` | Jingle do pico de onda |

Quando escolher a versão que vai para o jogo, anote aqui embaixo, com o app e o prompt usados.

## Escolhidas

| Id | Arquivo | App | Observação |
| --- | --- | --- | --- |
| `title` | Tittle - Gallop of the Chip.m4a | | |
| `hub` | Hub - 16-Bit Lab Menu.m4a | | |
| `idle` | Idle - Factory Arpeggios.m4a | | |
| `run1` | Run 1 - 16-Bit Battle.m4a | | |
| `run2` | Run 2 - Battle Loop.m4a | | |
| `run3` | Run 3 - 16-Bit Battle.m4a | | |
| `crisis` | Crisis - 16-Bit Doom.m4a | | |
| `boss` | Boss - 16-Bit Armageddon.m4a | | |
| `gameover` | Game Over Theme.m4a | | |
| `alta` | Victory Fanfare.m4a | | |
| `levelup` | Level Up.m4a | | |
| `capsule` | Arcade Reward.m4a | | |
| `bossIn` | (falta) | | |
| `crisisIn` | (falta) | | |

# Músicas geradas

Pasta para as músicas que saem do app de geração de música, do jeito que foram exportadas (WAV ou MP3), antes de qualquer corte. O tema, a lista de faixas e os prompts estão em [docs/sonoplastia.md](../../docs/sonoplastia.md).

Esta pasta fica fora de `public/`, então nada daqui entra no jogo nem no deploy. As versões finais, cortadas em loop e convertidas para OGG e M4A, vão para `public/audio/music/` quando o som entrar no código (fase 6 do [roadmap](../../docs/roadmap.md)).

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

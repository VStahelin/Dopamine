# 0037. Sprites carregados em atlas

- **Status:** proposta
- **Data:** 2026-10-24
- **Área:** técnica

## Contexto

Playtest rodada 2 (PERF-2): o carregamento inicial demorava muito. A abertura baixava cerca de 650 PNGs soltos (cada um vira dois pedidos no carregador do Phaser) e, na primeira visita, o service worker ainda baixava os 1.396 arquivos do precache ao mesmo tempo. A [0020](0020-sprites-em-png-por-tamanho.md) já deixava o atlas como "próximo passo se o desempenho pedir".

## Decisão

- `npm run sprites:build` continua gerando os PNGs soltos da [0020](0020-sprites-em-png-por-tamanho.md) e passa a gerar também **atlas** em `public/sprites/atlas/`: um por tamanho de ícone (`icons-<px>`), um por detail do mundo (`world-<d>x`) e um das molduras (`frames`), cada um com um JSON de chave → retângulo. O `sprites:check` confere os atlas também.
- O jogo baixa só os atlas (mesma regra de tamanhos da 0020) e recorta cada sprite numa textura com a mesma chave de antes; o resto do código não muda. A logo continua solta.
- O precache do PWA leva os atlas e deixa de fora os PNGs soltos de ícones, mundo e molduras.

## Alternativas consideradas

- **Usar o atlas como textura única, com frames:** menos texturas na placa de vídeo, mas mudaria todas as chamadas de textura do jogo. Fica para depois, se o desenho pedir.
- **Só atrasar o service worker:** ajudava na primeira visita, mas não nos 650 pedidos de cada abertura.

## Consequências

- No teste local, a abertura caiu de 3,0 s para 0,7 s e de 1.296 pedidos para 34; o precache, de 1.396 arquivos para 48.
- Os PNGs soltos continuam no repositório e publicados, para ver os sprites fora do jogo; o jogo não os carrega.
- Sprite novo: o mesmo de sempre (JSON + `npm run sprites:build`); o atlas sai junto.

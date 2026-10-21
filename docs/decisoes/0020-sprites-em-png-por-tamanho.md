# 0020. Sprites em PNG, gerados por tamanho a partir dos dados

- **Status:** proposta
- **Data:** 2026-10-21
- **Área:** técnica

## Contexto

A [decisão 0019](0019-sprites-numa-pasta.md) pôs toda a pixel art como dados em `src/assets/sprites/` e gerava as texturas no código quando o jogo abria. O Vitor sentiu peso no menu e na pausa e pediu PNGs prontos, em vários tamanhos, separados em pastas, com o jogo usando o tamanho de que precisa.

O peso do Arsenal e da pausa vinha de desenhos vetoriais (`Graphics`) redesenhados a cada quadro, e já foi corrigido. Mesmo assim, PNGs prontos tiram o trabalho de gerar tudo na abertura e deixam os sprites visíveis fora do jogo.

## Decisão

- Os JSON de `src/assets/sprites/` continuam sendo a fonte. `npm run sprites:build` gera os PNGs em **`public/sprites/`**, com o mesmo código de desenho (`src/game/render/spriteArt.ts`), e eles ficam no repositório:
  - `icons/<px>/<grupo>/<id>.png`: os ícones de 16×16 em cada tamanho de `iconSizesPx` (`display.json`: 16, 32, 48, 64, 80, 96, 112 e 128).
  - `frames/<px>/<tipo>.png`: as molduras dos espaços de ícone, em cada escala.
  - `world/<detail>x/`: moléculas, chão, gema, elétron, disparo e moeda, um conjunto por detail ([0009](0009-grade-16px-zoom-inteiro.md)).
- A lista dos arquivos fica num lugar só (`src/game/render/spriteFiles.ts`), lida pelo gerador e pelo jogo.
- O jogo carrega o mundo, as molduras e só os ícones dos tamanhos que o zoom da tela usa (ícones de 1× e 2×, e o de 16 de reserva). Se o zoom mudar, carrega os tamanhos novos em segundo plano e monta a tela de novo.
- `npm run sprites:check` (dentro do `npm run check`) falha se algum PNG estiver diferente dos dados: editou um JSON, rode `npm run sprites:build`.

## Alternativas consideradas

- **Gerar as texturas ao abrir o jogo (0019):** sem arquivos a manter, mas faz o trabalho a cada abertura e não deixa ver os sprites fora do jogo.
- **Um atlas único em 1×:** menos arquivos e menos chamadas de desenho; fica como próximo passo se o desempenho pedir.

## Consequências

- Mudou um sprite: edite o JSON e rode `npm run sprites:build`; o check barra PNG desatualizado.
- O PWA guarda os PNGs no cache (cerca de 650 KB).
- Substitui a parte de "gerador no início" da [0019](0019-sprites-numa-pasta.md); a pasta de dados continua valendo.

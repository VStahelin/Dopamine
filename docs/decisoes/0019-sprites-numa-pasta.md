# 0019. Todos os sprites como dados numa pasta única

- **Status:** proposta
- **Data:** 2026-10-21
- **Área:** técnica

## Contexto

Hoje a pixel art do jogo está espalhada pelo código: moléculas em `src/game/render/molecules.ts`, ícones de 8×8 da interface em `src/game/ui/icons.ts`, gema, elétron e chão em `src/game/render/textures.ts`. O canvas de identidade visual ganhou 52 ícones de 16×16 (prancheta "Ícones de armas e habilidades") desenhados como grades de caracteres com uma paleta. O Vitor quer todos os sprites numa pasta e os ícones do canvas aplicados no jogo.

## Decisão

- Todos os sprites ficam em **`src/assets/sprites/`**, como dados, sem desenho espalhado pelo código:
  - `palette.json`: as letras da paleta dos ícones (a mesma do canvas).
  - `icons/*.json`: os ícones de 16×16 do canvas (armas, ações, evoluções, reagentes, especiais, modificadores) e os de 8×8 da interface, como grades de caracteres.
  - `molecules/*.json`: as moléculas como átomos e ligações (as definições que hoje estão em código).
  - Um índice liga cada arma, modificador, especial e molécula ao seu sprite pelo id da configuração.
- **Um gerador só** transforma os dados em texturas para cada detalhe da escala do mundo ([0009](0009-grade-16px-zoom-inteiro.md)). Ícones de pixel crescem só em escala inteira.
- O desenho não depende do Phaser: pinta retângulos num `Painter` (`src/game/render/spriteArt.ts`). No jogo o pintor é um `Graphics`; no comando `npm run sprites:export` é um buffer que vira PNG e SVG. Assim dá para ver os sprites fora do jogo e comparar, com o mesmo desenho, textura gerada no início contra imagem pronta carregada.
- Ícone faltando não quebra o jogo: aparece um ícone padrão e o teste de configuração avisa.
- Os ícones vêm do canvas como estão; quando o canvas mudar, os dados são atualizados a partir dele.

## Alternativas consideradas

- **PNGs como fonte:** prático, mas perde o detalhe por escala e obriga a reexportar a cada ajuste de cor. Se o teste de desempenho mostrar que imagens prontas carregam mais rápido, o exportador já gera os PNGs a partir dos dados, e a fonte continua sendo o JSON.
- **Deixar a pixel art no código:** o que existe hoje; difícil de achar, revisar e trocar.

## Consequências

- A fase 2.6 do roadmap faz a mudança e aplica os ícones na HUD, no level up, na pausa e no menu.
- Arma, modificador ou especial novo pede um sprite em `src/assets/sprites/`; o teste de configuração confere que todos têm ícone.

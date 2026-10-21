# 0009. Resolução nativa com pixel art detalhado

- **Status:** proposta
- **Data:** 2026-10-21
- **Área:** técnica

## Contexto

A primeira versão desenhava o jogo na resolução "lógica" (390 px de largura num celular) e o navegador esticava a imagem para a tela de verdade (1170 px numa tela 3×). Os sprites tinham poucos pixels (átomo de 9 px). Resultado: tudo parecia de baixa resolução, inclusive os textos. O Vitor definiu a direção: **a resolução tem que ser alta; o pixelado é o conceito visual, não falta de resolução**.

## Decisão

- **Canvas na resolução real da tela.** O tamanho do canvas é o tamanho CSS × `devicePixelRatio` (até 4×), com `Phaser.Scale.FIT` encaixando no tamanho da página ([main.ts](../../src/main.ts)).
- **Textos desenhados na resolução final.** Cada texto nasce com `resolution` igual ao zoom da câmera, em vez de ser ampliado.
- **Sprites com mais pixels de arte.** Os sprites são gerados por código com 2 ou 3 pixels de arte por unidade do mundo (`spriteDetails` em `display.json`). Um átomo de 9 unidades sai com 18 ou 27 pixels, perto dos 26 px da aba Design, com contorno, sombra e brilho.
- **Pixel de arte sempre inteiro.** A escala do mundo ([pixelScale.ts](../../src/game/render/pixelScale.ts)) escolhe o detalhe e o zoom para cada pixel de arte ocupar um número inteiro de pixels da tela, mostrando perto de 360 unidades no lado menor. As telas de interface usam zoom inteiro, com molduras e botões em blocos nítidos.

## Alternativas consideradas

- **Só aumentar o zoom com sprites pequenos:** continua com cara de baixa resolução.
- **Escala livre com filtro suave:** a arte perde o conceito pixelado.
- **Escala livre com pixel não inteiro:** os pixels saem de tamanhos diferentes e a arte fica irregular.

## Consequências

- Sprites e ladrilhos ficam em unidades do mundo; o detalhe é escolhido pela tela, sem mudar a jogabilidade.
- Arte nova é desenhada em unidades do mundo e gerada para cada detalhe de `spriteDetails`.
- O custo de desenho sobe em telas de alta densidade; vale medir o FPS no celular.

# Identidade visual

O Farmaco Battle usa pixel art 2D com cara de HUD de RPG 16-bit: molduras de madeira laranja, contorno vermelho-escuro grosso e química de cores saturadas. As telas de referência estão no [canvas de identidade visual](https://claude.ai/artifact/MPV17zZywrhhXBUdfnUs6F).

## Direção de arte

O conceito de trabalho é **"cartucho de laboratório"**: um RPG pixelado de celular, quente e saturado, em que tudo o que luta é química. A referência é o print de RPG mobile que você mandou, com HUD em madeira, faixa de título com contorno grosso, chão de areia e rochas azuladas.

- **Mundo:** chão de areia em ladrilhos, paredes laterais de pedra azulada.
- **Interface:** painéis azul-noite com moldura de madeira laranja.
- **Personagens:** moléculas montadas com átomos pixelados, sem rosto nem membros.
- **Texto de impacto:** letras grossas com contorno escuro e sombra dura, sem degradê.

## Paleta

São 14 cores em três grupos. As cores de elemento seguem, de forma aproximada, a convenção de cores dos modelos moleculares (CPK).

| Grupo | Cor | Hex | Uso |
| --- | --- | --- | --- |
| Interface | Noite | #15172E | Fundo das telas e da HUD |
| Interface | Painel | #2A2E55 | Cards, botões secundários, barras vazias |
| Interface | Madeira | #E0702A | Molduras, botão principal (sombra #B5541C, brilho #F0913A) |
| Interface | Contorno | #3A0A0C | Bordas e contorno de texto de destaque |
| Mundo | Areia | #D8B47A | Chão do campo de batalha (rejunte #CDA56C) |
| Mundo | Pedra | #5B6E8E | Paredes laterais (juntas #3E4C68) |
| Mundo | Água | #39D3F0 | Nível do jogador, projéteis, destaques frios |
| Mundo | Ouro | #F2B233 | Moeda |
| Elementos | Carbono | #4A4F5C | Átomos C |
| Elementos | Hidrogênio | #EDEBDD | Átomos H |
| Elementos | Oxigênio | #E0433A | Átomos O |
| Elementos | Nitrogênio | #3F6FE0 | Átomos N |
| Elementos | Cloro | #5BC43A | Átomos Cl |
| Elementos | Enxofre | #F2C83A | Átomos S |

Cores de apoio: vermelho de interação #D83A3A, laranja do logo #FF9A1F, verde do logo #6CD43F, azul de progresso #2D7FD6.

## Tipografia

Duas fontes pixeladas gratuitas do Google Fonts, com papéis separados.

| Fonte | Peso | Uso | Exemplo |
| --- | --- | --- | --- |
| [Pixelify Sans](https://fonts.google.com/specimen/Pixelify+Sans) | 700 | Logo, títulos, números de impacto (onda, dano, nível), com contorno de 3 a 4 px | ONDA 7 |
| Pixelify Sans | 600 | Textos de interface e nomes | Metano decomposto em 3 partes |
| [Silkscreen](https://fonts.google.com/specimen/Silkscreen) | 400 | Rótulos curtos em caixa alta | INTERAÇÕES · OURO · NÍVEL |

O logo escreve FARMACO em laranja numa faixa vermelha inclinada e BATTLE em verde logo abaixo, como a faixa "EXPLORE MASSIVE WORLD" da referência.

## Sprites de moléculas

Cada molécula é montada com átomos e ligações, então uma nova molécula sai das mesmas peças sem desenhar do zero.

- **Átomo:** um "círculo" pixelado numa grade de 8×8, com cantos em degrau, contorno escuro de 3 px, cor do elemento por dentro e um quadradinho de brilho no canto superior esquerdo.
- **Tamanho por elemento:** H é o menor (16 px); C, O, N e Cl ficam entre 26 e 28 px; S é o maior (30 px).
- **Ligação:** uma barra escura de 5 px entre os centros. Ligação dupla são duas barras paralelas.
- **Escala:** o mesmo sprite é reduzido para caber no slot de agente (cerca de metade do tamanho).

Exemplos no canvas, só para testar o estilo: inimigos metano, gás carbônico, água, amônia e benzeno; agentes ozônio, cloro, peróxido e dióxido de enxofre. Quais moléculas entram no jogo continua em aberto.

## Componentes de UI e tela de batalha

A tela de batalha vertical (390×844) se divide em quatro faixas, de cima para baixo.

1. **HUD (104 px):** nível em ciano com contorno, barra de interações, moeda e o contador de onda em laranja.
2. **Campo (o resto da altura):** areia entre duas paredes de pedra. As moléculas descem, os projéteis são barrinhas ciano e o dano aparece em branco com contorno vermelho. Na base fica uma faixa vermelha escrito BASE.
3. **Pool de agentes (120 px):** bandeja de madeira com 5 slots de 62 px. Cada slot tem uma molécula e o nível (+1, +2, +3) no canto.
4. **Barra inferior (64 px):** botão de pausa, barra de progresso da onda em azul e botão de velocidade x2.

Componentes:

- **Barra de interações:** 10 pips vermelhos dentro de uma moldura de madeira, e cada batida na base apaga um.
- **Botão principal:** madeira laranja, contorno escuro de 4 px, brilho em cima e sombra embaixo, sem cantos arredondados.
- **Botão secundário:** azul-painel com o mesmo relevo.
- **Moeda:** ícone pixelado dourado mais o número com sombra dura.
- **Slot de agente:** moldura de madeira e fundo creme #F2D9A8.

## UI do modo crônico

A HUD da run em mundo aberto, a pausa com status e os tipos de ícone estão em [ui-cronico.md](ui-cronico.md), com pranchetas na linha "UI do modo crônico" do canvas. A prancheta "Tela de batalha (mockup)" acima mostra o campo vertical, que hoje é o campo longo (idle).

## Menu principal

O protótipo do hub está no canvas, na prancheta "Menu principal (protótipo)", na mesma base de 390×844 e com os mesmos componentes: barra de status, faixa de objetivo, palco com o organismo pixelado, linha de ação com o botão JOGAR em madeira e barra de 5 abas. As regras do menu estão em [menu.md](menu.md).

## Regras e decisões em aberto

Regras da v0:

- Sem degradê, sem sombra suave e sem cantos arredondados: relevo só com faixas de cor chapada (brilho em cima, sombra embaixo).
- Contorno escuro em tudo o que precisa se destacar do fundo.
- Texto sobre fundo escuro com contraste de pelo menos 4,5:1.
- Escala inteira (1×, 2×, 3×) para os pixels não borrarem em nenhuma tela.

O que você ainda precisa aprovar ou decidir:

- [ ] As fontes Pixelify Sans e Silkscreen ficam?
- [ ] Vida como 10 pips de interação, ou outro número, ou outra forma?
- [ ] Tamanho base do pixel do jogo (grade de 16 ou de 32 px)?
- [ ] O chão de areia combina com o tema químico, ou o campo vira uma bancada ou uma placa de Petri?
- [ ] Qual é a cara do campo longo?

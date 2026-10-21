# UI do modo crônico

Como a run (o campo crônico, mundo aberto) mostra as coisas na tela: HUD de batalha, ícones de armas e reagentes, efeitos, números de dano, botão do especial, tela de pausa com status e adaptação a qualquer proporção de tela. As pranchetas estão no [canvas de identidade visual](https://claude.ai/artifact/MPV17zZywrhhXBUdfnUs6F), na linha "UI do modo crônico": **HUD de batalha**, **Pausa e status** (interativa, com abas) e **Ícones, dano e paisagem**.

Tudo aqui é **proposta**. A base é o Vampire Survivors no celular, adaptada ao tema químico e à [identidade visual](design.md).

## O que o Vampire Survivors faz no celular

Os três prints de referência mostram o mesmo esqueleto:

- **Barra de XP** de ponta a ponta no topo, azul, com o nível à direita (LV 61).
- **Duas linhas de ícones** à esquerda, logo abaixo: armas em cima, passivos embaixo, até 6 de cada. Espaço bloqueado aparece com um X vermelho.
- **Tempo** grande no centro.
- **Ouro e abates** empilhados à direita, com ícone depois do número.
- **Pausa** pequena no canto direito, abaixo dos contadores.
- **Vida** só numa barrinha vermelha embaixo do personagem, sem número.
- **Números de dano** flutuando em cima dos inimigos, com cores diferentes para dano normal e crítico.
- **Faixa de baixo sem HUD**, livre para os polegares.
- A banda de cima é um retângulo escuro translúcido: o campo continua aparecendo por baixo.

O que funciona: tudo o que importa cabe numa faixa fina, o olho fica no personagem, e a vida fica onde o olho já está. O que não funciona tão bem para nós: os ícones são minúsculos e iguais entre si (arma e passivo só se distinguem pela linha), e não existe indicação de efeito temporário, arma pronta para evoluir ou especial.

## Layout na vertical (390×844)

De cima para baixo:

1. **Área segura** do notch, sem nada.
2. **Banda da HUD** (126 px a partir do topo, fundo noite translúcido, borda escura embaixo):
   - **Barra de XP** de ponta a ponta, moldura de madeira fina, recheio ciano (a cor de "nível do jogador" da aba Design) e `NV 12` dentro da barra, à direita.
   - **Ícones** à esquerda em duas linhas de 6 espaços de 24 px: armas em cima, reagentes embaixo.
   - **Tempo** no centro (Pixelify 24 px). Embaixo dele, a onda (`ONDA 3`), que vira `PICO DE ONDA` em laranja durante o pico do dente de serra (aba Economia), junto com o tempo.
   - **ATP e decompostas** à direita, número antes do ícone, como no VS.
3. **Logo abaixo da banda**, sobre o campo:
   - **Efeitos temporários** à esquerda, só enquanto duram.
   - **Barra do chefe** no centro, só quando há chefe: nome da molécula e vida em vermelho.
   - **Pausa** à direita, botão de 44 px (o mínimo para o toque).
4. **Campo**: o agente no centro, com a **barra de interações** embaixo dele.
5. **Faixa dos polegares**, sem HUD:
   - **Joystick** flutuante: aparece onde o dedo toca (o que já existe hoje).
   - **Botão do especial** no canto inferior direito, 76 px de madeira, com o ícone do especial, recarga escurecendo de cima para baixo com os segundos restantes, e as cargas (`x1`) no canto.

### Interações (a vida)

As interações ficam **embaixo do agente**, como a vida no VS: uma barra de 10 segmentos (cada um vale 10% das interações máximas), o mesmo desenho dos pips da aba Design. O segmento parcial fica vermelho claro. O número exato (`72/100`) aparece na pausa.

Quando as interações ficam abaixo de 25%, a tela ganha uma borda vermelha pulsando de leve. Assim o aviso chega mesmo com o olho longe do agente.

## Tipos de ícone

Cada tipo tem uma moldura própria, para que arma, reagente e efeito se separem pela forma e pela luminosidade, não só pela cor.

| Tipo | Onde | Moldura | Indicador |
| --- | --- | --- | --- |
| Arma | Linha de cima | Madeira, fundo creme (como o slot de agente) | Nível no canto (`3`) |
| Arma pronta para evoluir | Linha de cima | Madeira com borda dourada | `MAX` em dourado: o próximo baú de chefe evolui |
| Arma evoluída | Linha de cima | Dourada, fundo dourado claro | `EVO` em dourado |
| Reagente (passivo) | Linha de baixo | Noite com borda ciano | Nível no canto |
| Efeito temporário | Abaixo da banda | Noite com borda verde | Barra de tempo embaixo do ícone |
| Efeito negativo | Abaixo da banda | Vinho com borda vermelha | Barra de tempo, ou nada se for permanente (Estresse) |
| Espaço livre | Qualquer linha | Tracejado | — |
| Espaço bloqueado | Qualquer linha | Escuro com cadeado | Libera com Espaços de arma ou de modificador |

Os espaços de cada linha seguem a aba Parâmetros: 4 no começo, até 6. Os dois últimos aparecem com cadeado até serem liberados.

Os ícones são pixel art de 8×8 em escala inteira (2× na HUD, 3× na pausa, 4× nas telas grandes), com cores tiradas da paleta: radical em vermelho de oxigênio, elétrons em ciano e azul, UV em roxo, solvente em verde de cloro, e assim por diante.

## Números de dano e feedback

| Caso | Cor | Tamanho |
| --- | --- | --- |
| Dano normal | Branco com contorno escuro | Médio |
| Crítico (catálise) | Amarelo enxofre com `!`, contorno vinho | Grande |
| Afinidade forte (×1,5) | Ciano claro | Médio |
| Afinidade fraca (×0,5) | Cinza | Pequeno |
| Dano em área ou contínuo | Branco | Pequeno, somado a cada 0,5 s para não poluir |
| Interações perdidas | Vermelho claro sobre o agente (`-5`) | Grande, com piscada vermelha do agente |
| Recuperação | Verde (`+1`) | Pequeno |
| Sem afinidade | `IMUNE` em cinza | Pequeno |

Os números sobem e somem em cerca de 0,6 s. As Opções ganham um interruptor para esconder os números, como no VS.

A decomposição em cascata aparece como um estalo branco na molécula e os fragmentos saltando para fora, sem número extra.

## Pausa e status

O botão de pausa (e Esc ou P no PC) abre um painel sobre o campo escurecido:

- **Cabeçalho:** `PAUSADO`, agente, nível, tempo e onda.
- **Faixa de status:** barra de interações com o número (`72/100`), ATP e decompostas.
- **Três abas:**
  - **Arsenal:** cada arma com ícone, nome, nível em pips (até 8), números atuais (dano, disparos, recarga) e a dica de evolução (`NV 8 + OZÔNIO → LASER`). Depois os reagentes com pips (até 5) e o efeito somado (`+50% dano`), e por fim os efeitos ativos com o tempo restante. Espaços livres e bloqueados também aparecem, dizendo como liberar.
  - **Atributos:** todos os atributos da aba Parâmetros em quatro grupos (ofensivos, defensivos, mobilidade e coleta, level up e risco). Valor atual à direita, base em cinza ao lado; verde quando está melhor que a base, vermelho quando está pior.
  - **Run:** tempo, nível, decompostas, ATP na run, interações perdidas, críticos, dano por arma em barras e quanto falta para o recorde.
- **Botões:** `CONTINUAR` (madeira, o maior), `OPÇÕES` e `DESISTIR` (vinho, que leva à tela de fim de run).

## Qualquer proporção de tela

- **Ancorar, não esticar.** Só a barra de XP estica. Ícones presos à esquerda, tempo ao centro, contadores e pausa à direita, cada um a 8 px da área segura.
- **Banda de altura fixa.** 126 px em pé e 74 px deitado, com ícones do mesmo tamanho. Todo o resto da tela é campo.
- **Celular deitado (844×390):** a mesma HUD numa banda mais baixa, com as duas linhas de ícones lado a lado com o tempo; joystick à esquerda e especial à direita, respeitando as áreas seguras laterais.
- **Escala inteira.** A HUD usa zoom inteiro como o resto da interface ([0009](decisoes/0009-grade-16px-zoom-inteiro.md)).
- **Tela larga (PC, tablet deitado):** a pausa vira duas colunas, Arsenal à esquerda e Atributos à direita, com a aba Run embaixo.

## O que muda em relação ao jogo de hoje

A HUD atual (`src/game/scenes/HudScene.ts`) já tem barra de XP no topo, nível, tempo, decompostas, pips de interações e pausa. Para chegar nesta proposta faltam: as duas linhas de ícones, a moeda, os efeitos temporários, a barra do chefe, a barra de interações embaixo do agente, as cores de número de dano, o botão do especial e a pausa com abas. A maior parte depende da fase 2 (armas, reagentes, especial, chefe); a pausa com Arsenal e Atributos já pode ser feita com o que existe.

## Perguntas em aberto

- [ ] Interações só embaixo do agente (como o VS), ou também um número fixo na banda?
- [ ] Os reagentes que evoluem armas (Peróxido, Ozônio) são os mesmos modificadores de atributo da linha de baixo, ou um tipo de item separado?
- [ ] Os efeitos temporários existem? Quais (itens no chão, especial ativo, efeitos de inimigo)?
- [ ] O especial tem nome e ícone próprios por agente (a proposta usa "Pico" para a Dopamina)?
- [ ] Números de dano ligados por padrão, ou desligados como opção de desempenho no celular?

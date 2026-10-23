# UI do modo crônico

Como a run (o campo crônico, mundo aberto) mostra as coisas na tela: HUD de batalha, ícones de armas e reagentes, efeitos, números de dano, botão do especial, tela de pausa com status e adaptação a qualquer proporção de tela. As pranchetas estão no [canvas de identidade visual](https://claude.ai/artifact/MPV17zZywrhhXBUdfnUs6F), na linha "UI do modo crônico": **HUD de batalha**, **Pausa e status** (interativa, com abas), **Ícones, dano e paisagem**, **Level up** e **Level up no PC** (as duas interativas).

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

Os ícones são pixel art de 16×16 com contorno escuro de 1 pixel, em escala inteira (1× na HUD, 2× na pausa e no level up), com cores tiradas da paleta: radical em vermelho de oxigênio, elétrons em ciano e azul, UV em roxo, solvente em verde de cloro, e assim por diante. Começaram em 8×8, mas com 52 ícones (armas, evoluções, passivos e especiais) 8×8 não deixa cada um com forma própria. Todos estão na prancheta **Ícones de armas e habilidades** do canvas e em [src/assets/sprites/icons.json](../src/assets/sprites/icons.json) ([decisão 0019](decisoes/0019-sprites-numa-pasta.md)).

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
  - **Atributos:** todos os atributos da aba Parâmetros em quatro grupos (ofensivos, defensivos, mobilidade e coleta, level up e risco). Valor atual à direita, base do `stats.json` em cinza ao lado; verde quando está melhor que a base, vermelho quando está pior. Embaixo de cada atributo que mudou, uma linha de chips diz de onde vem cada parte (Laboratório, organismo, perfil, receptor, suplemento, sinapse, Mutação, estrutura), com uma legenda no topo; prancheta "Crônico: atributos e de onde vem".
  - **Run:** tempo, nível, decompostas, ATP na run, interações perdidas, críticos, dano por arma em barras e quanto falta para o recorde.
- **Botões:** `CONTINUAR` (madeira, o maior), `OPÇÕES` e `DESISTIR` (vinho, que leva à tela de fim de run).

## Level up

> **Mudança proposta (fase 5.8):** o level up passa a oferecer só armas e **receptores** ([megabonk.md](megabonk.md#1-level-up-com-armas-e-receptores)). O título vira `ESCOLHA UMA ARMA OU RECEPTOR`, a carta de nível de arma ganha a moldura de raridade, e a linha de reagentes da HUD mostra os receptores. A **sinapse** usa a mesma tela, com o título `SINAPSE` e sem a barra de ações.

A tela abre sobre o campo escurecido, com o jogo parado. As pranchetas **Level up** (celular) e **Level up no PC** são interativas: dá para escolher, rerrolar, pular e banir.

**No celular (390×844):**

- **Cabeçalho:** `NÍVEL 13!` em ciano e `ESCOLHA UM MODIFICADOR`. Logo abaixo, as duas linhas de espaços da HUD em miniatura (armas e reagentes, com o nível no canto), para o jogador ver o que já tem antes de escolher.
- **Cartões de opção** (3 a 5, conforme as Opções), um embaixo do outro, cada um com:
  - o ícone na moldura do tipo (madeira para arma, ciano para modificador, verde para cura);
  - o nome, e à direita a raridade e o passo (`RARO · NV 3 → 4`, `ARMA NOVA`, `REAGENTE NOVO`);
  - a descrição curta do efeito (`+20% de dano`);
  - a **prévia em verde** de como o atributo fica (`Reatividade 130% → 150%`, `Armas 4/6 → 5/6`);
  - a dica de evolução em dourado quando a escolha leva a uma (`MAX + COENZIMA → ENZIMA`).
  - A moldura e a faixa da esquerda têm a cor da raridade ([0013](decisoes/0013-raridade-e-sorte.md)); arma e cura, que não têm raridade, usam ciano e verde.
- **Barra de ações**, sempre visível embaixo, no lugar do polegar: **REROLAR**, **PULAR** e **BANIR**, cada um com o ícone e os usos restantes num selo (`×2`). Com zero usos, o botão continua lá, apagado e com `0`: o jogador fica sabendo que a mecânica existe e que libera no Laboratório.
- **Banir** é um modo: o botão vira `CANCELAR`, o título vira `BANIR` em vermelho, os cartões ganham a borda vermelha e o selo `BANIR`, e o toque num cartão tira a opção da run e sorteia outra no lugar. As opções banidas aparecem riscadas acima da barra (`BANIDOS NESTA RUN`).
- **Pular** recusa o level up sem escolher nada e volta para a run (ou para o próximo level up pendente).

**No PC (tela larga):** três colunas sobre o campo escurecido.

- **Centro:** o mesmo cabeçalho, os cartões mais largos com o número da tecla no canto e a barra de ações com a tecla de cada uma embaixo.
- **Esquerda, Atributos:** o resumo da aba Atributos da pausa, nos mesmos grupos. Passar o mouse num cartão destaca em verde a linha que ele muda, com o valor de agora e o novo (`130% → 150%`).
- **Direita, Arsenal:** as armas e os reagentes com o nível. A arma ou o reagente que o cartão melhora também fica em verde (`NV 4 → NV 5`, ou `NOVA` no espaço livre).
- **Teclas:** 1 a 5 escolhem, R rerrola, S pula, B entra e sai do modo banir.

Regras de interface:

- Ignorar toques nos primeiros 350 ms depois que a tela abre, para o dedo que estava no joystick não escolher sem querer (como já faz o jogo).
- Mais de um level up pendente abre a próxima tela direto, sem voltar para a run.

## Qualquer proporção de tela

- **Ancorar, não esticar.** Só a barra de XP estica. Ícones presos à esquerda, tempo ao centro, contadores e pausa à direita, cada um a 8 px da área segura.
- **Banda de altura fixa.** 126 px em pé e 74 px deitado, com ícones do mesmo tamanho. Todo o resto da tela é campo.
- **Celular deitado (844×390):** a mesma HUD numa banda mais baixa, com as duas linhas de ícones lado a lado com o tempo; joystick à esquerda e especial à direita, respeitando as áreas seguras laterais.
- **Escala inteira.** A HUD usa zoom inteiro como o resto da interface ([0009](decisoes/0009-grade-16px-zoom-inteiro.md)).
- **Tela larga (PC, tablet deitado):** a pausa vira duas colunas, Arsenal à esquerda e Atributos à direita, com a aba Run embaixo.

## O que muda em relação ao jogo de hoje

A HUD atual (`src/game/scenes/HudScene.ts`) já tem barra de XP no topo, nível, tempo, decompostas, pips de interações e pausa. Para chegar nesta proposta faltam: as duas linhas de ícones, a moeda, os efeitos temporários, a barra do chefe, a barra de interações embaixo do agente, as cores de número de dano, o botão do especial e a pausa com abas. A maior parte depende da fase 2 (armas, reagentes, especial, chefe); a pausa com Arsenal e Atributos já pode ser feita com o que existe.

Com a [fase 5.12](roadmap.md#fase-512-locais-do-corpo-e-sinergias), quando o par agente × local tem sinergia, um ícone ✚ pequeno aparece ao lado do retrato do agente, na cor do setor que ela melhora ([mapas.md](mapas.md#escolha-do-local)).

## Perguntas em aberto

- [ ] Interações só embaixo do agente (como o VS), ou também um número fixo na banda?
- [x] Os reagentes que evoluem armas (Peróxido, Ozônio) são os mesmos modificadores de atributo da linha de baixo, ou um tipo de item separado? → modificadores da linha de baixo marcados como reagente ([decisão 0015](decisoes/0015-acao-do-agente-e-armas.md)).
- [x] Os efeitos temporários existem? Quais (itens no chão, especial ativo, efeitos de inimigo)? Na HUD hoje: o especial ativo, a queda depois dele e os itens Gelo seco, Bico de Bunsen e Febre de ATP ([itens.md](itens.md), fase 5.5).
- [x] O especial tem nome e ícone próprios por agente (a proposta usa "Pico" para a Dopamina)? → sim: Pico de recompensa, Emulsão e Captação, com ícones no canvas.
- [x] Números de dano ligados por padrão, ou desligados como opção de desempenho no celular? → ligados, com o interruptor "Números de dano" nas Opções (fase 2.7).

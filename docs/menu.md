# Menu principal

Esqueleto do menu principal, inspirado no hub de jogos mobile de campanha: um botão de jogar dominante no centro, a moeda sempre visível no topo, as seções principais numa barra de abas embaixo e as secundárias em trilhos laterais. Na [fase 1.5 do roadmap](roadmap.md#fase-15-menu-principal-esqueleto) o esqueleto inteiro entra no jogo, com o que ainda não existe como **placeholder**: o lugar já está no menu, explica o que vai ter ali e em que fase chega. Cada fase seguinte preenche a sua parte, sem mexer na navegação.

Tudo aqui é **proposta**: nomes, ordem e agrupamento podem mudar.

## A referência

Print do hub de um jogo mobile de campanha que o Vitor mandou, lido de cima para baixo:

| Zona | O que tem na referência | Para que serve |
| --- | --- | --- |
| Barra de status (topo, fixa) | Avatar, nível e XP da conta; poder de combate; energia (196/30); ouro e gemas, cada um com "+" | Recursos e progresso sempre à vista |
| Faixa de destaque | Carrossel de eventos no centro, menu (≡) à esquerda, Ranking à direita | O que é novo agora |
| Trilho esquerdo | Ofertas pagas (Cartão de Privilégio, Melhor Preço, oferta com contador) | Monetização |
| Trilho direito, recolhível | Tarefas, Amigos, eventos, raide da guilda | Social e eventos, fora do caminho |
| Palco (centro) | Capítulo 26 "Território Carmesim", melhor resultado 49/50, ilustração, 3 estrelas; o capítulo 25 aparece embaixo | Onde o jogador está na campanha; os capítulos rolam como um mapa vertical |
| Atalhos do capítulo | Caça (patrulha ociosa), baú do capítulo (26–50), Guilda | Recompensas ligadas ao capítulo |
| Linha de ação | Acampamento (recompensa ociosa) à esquerda; INICIAR grande com custo de 5 de energia; Escada da Briga (PvP) à direita | O botão principal ao alcance do polegar, com os modos irmãos dos lados |
| Chat | Mensagens passando numa linha | Social |
| Barra de abas (rodapé) | 5 abas: Loja, Equipamento, Campanha (no centro, maior e destacada), Arena, Itens | As seções principais, sempre a um toque |
| Selos vermelhos "!" | Em quase todo botão | Puxar o jogador para o que tem novidade |

**O que vale copiar:**

- Um botão principal grande, logo acima do polegar, e nada competindo com ele.
- O modo principal no centro da tela e na aba do meio.
- O progresso visível no palco: onde estou, melhor marca, estrelas.
- Moeda sempre no topo.
- Seções principais na barra de abas; secundárias nos trilhos.
- O idle como botão vizinho do principal, mostrando o que acumulou.

**O que fica de fora:** energia para jogar, segunda moeda paga, ofertas e contadores, guilda, chat, amigos, ranking online e selos em tudo. É um jogo pessoal, para amigos e sem servidor ([conceito](conceito.md)). Selo só aparece quando há algo a fazer.

## O hub

O hub é a tela onde o jogador passa entre as runs. Pensado primeiro para o celular em pé:

```
┌─────────────────────────────────┐
│ [org] INDIVÍDUO 1   ⚡ATP 1.250  │  barra de status
│ ▮▮▯ ▮▮▮ ▮▯▯ ▮▮▯  saúde 58%      │  4 setores de saúde
├─────────────────────────────────┤
│ ≡                      [RECORD.]│  trilhos: Opções à esquerda,
│        PRÓXIMO: LIPASE          │  Recordes, Compêndio e
│        faltam 320 ATP  [COMPÊN.]│  Conquistas à direita
│                         [CONQ.] │
│     ┌─────────────────────┐     │
│     │ CASO 1 · FÍSICA BAIXA│    │  palco: o indivíduo como capítulo
│     │  [ilustração do      │    │
│     │   organismo]         │    │
│     │  MELHOR: 12:40       │    │
│     │  ★ ★ ☆  5·10·15 min  │    │  estrelas = metas de tempo
│     └─────────────────────┘     │
│        [baú das estrelas]       │
├─────────────────────────────────┤
│ [CAMPO   ] ┌───────────┐ [AGENTE]│  linha de ação
│ [LONGO   ] │   JOGAR   │ [DOPAM.]│
│ [+340 ATP] └───────────┘ [  ▸   ]│
├─────────────────────────────────┤
│ AGENTES ARSENAL [CASO] LAB. ORGAN.│  barra de abas
└─────────────────────────────────┘
```

### Barra de status

- **Indivíduo:** um retrato pixelado do organismo e o número do indivíduo atual (o "nível da conta" daqui).
- **Saúde:** os 4 setores (física, mental, social, executiva) em mini barras e a média. Faz o papel do "poder de combate" da referência: o número que diz como você está indo.
- **ATP:** a única moeda. Os pontos herdados entram ao lado quando o reset existir (fase 5).

Até as fases 3 e 5, saúde e ATP aparecem com valores de exemplo e o selo "EM BREVE".

### Faixa de objetivo

No lugar do carrossel de eventos, uma faixa com o **próximo objetivo**: o próximo desbloqueio e quanto falta ("PRÓXIMO: LIPASE · faltam 320 ATP"), ou a próxima estrela do caso. Tocar leva à tela certa.

### Trilhos laterais

- **Esquerdo:** só Opções (≡).
- **Direito:** Recordes, Compêndio e Conquistas (Conquistas é placeholder sem fase definida).

### Palco: o caso atual

O capítulo da referência vira o **caso**: o indivíduo que está sendo tratado.

- Título: "CASO 1" e a "doença" dele (o setor mais baixo, por exemplo "FÍSICA BAIXA").
- Ilustração do organismo em pixel art, com o setor doente destacado.
- **Melhor tempo** neste caso.
- **3 estrelas = metas de tempo** (por exemplo 5, 10 e 15 minutos). Cada estrela nova abre o baú logo abaixo, com ATP (fase 3).
- Rolando para baixo aparecem os casos anteriores, já curados, como os capítulos da referência. Cada reset (fase 5) acrescenta um caso.

### Linha de ação

- **JOGAR** (centro, o maior botão da tela): começa a run no campo crônico com o agente escolhido. Sem custo de energia, no local escolhido na faixa logo acima dele ([Escolha do local](#escolha-do-local), fase 5.12).
- **Campo longo** (esquerda, como o Acampamento): mostra o ATP acumulado no idle e abre o campo longo. Placeholder até a fase 4.
- **Agente** (direita, no lugar da Escada da Briga): o sprite do agente escolhido; tocar abre a escolha do agente.

### Barra de abas

Cinco abas, com a do meio maior e destacada, como na referência:

| Aba | O que tem | Ganha conteúdo na |
| --- | --- | --- |
| Agentes | Elenco da run e do idle, ficha de cada agente, desbloqueio | 2 e 3 |
| Arsenal | As armas, níveis, evoluções e reagentes ([Armas](armas.md)) | 2 e 3 |
| **Caso** (centro) | O hub | 1.5 |
| Laboratório | Árvores de upgrades permanentes: run e idle | 3 e 4 |
| Organismo | Os 4 setores de saúde, o efeito de cada um, o reset | 5 |

A barra fica visível em todas as abas; trocar de aba não precisa de Voltar.

### Tela larga (PC, celular deitado)

O palco fica no centro, os trilhos nas laterais, a linha de ação embaixo do palco e a barra de abas no rodapé, centralizada com largura máxima.

## As outras telas

| Tela | O que tem | Hoje | Ganha conteúdo na |
| --- | --- | --- | --- |
| Tela de título | Logo e "toque para começar" | Existe (o menu atual) | 1.5 |
| Escolha do agente | Agentes da run com ação, especial e efetividade; bloqueados com cadeado e custo | Placeholder (só a Dopamina) | 2 |
| Escolha do local | Corpo com os cinco locais, o que cada um muda e a sinergia com o agente ([detalhes](#escolha-do-local)) | Existe (`LocalScene`) | 5.12 |
| Campo longo | O idle | Placeholder | 4 |
| Compêndio | Moléculas inimigas (com a cascata), modificadores e raridades já vistos; o resto em silhueta | Placeholder | 2 em diante |
| Recordes | Melhor tempo, nível, decompostas, runs | Existe | — |
| Conquistas | Metas de longo prazo | Placeholder | a definir |
| Opções | Abas Som, Tela e Jogo (detalhes abaixo e na prancheta [Opções](identidade-visual/Opcoes.dc.html)) | Existe | — |

### Escolha do local

[Decisão 0032](decisoes/0032-local-escolhido-e-sinergia.md) (fase 5.12, prancheta [Escolha do local](identidade-visual/EscolhaLocal.dc.html)): antes da run, o jogador escolhe em que parte do corpo vai agir. As regras (família, setor, sinergia, barreira) estão em [mapas.md](mapas.md#escolha-do-local); aqui fica só a tela.

**No hub**, logo acima do JOGAR, entra uma faixa fina com o local escolhido e o que o par rende:

```
│     📍 INTESTINO · ✚ FÍSICA  ▸   │  faixa do local (toque abre a escolha)
│ [CAMPO   ] ┌───────────┐ [AGENTE]│
│ [LONGO   ] │   JOGAR   │ [LIPASE]│
```

O JOGAR continua com um toque só: usa o último local. A faixa mostra ✚ e o setor quando o par tem sinergia, ⊘ em cinza quando o agente não entra ali (e o JOGAR troca para a Corrente sanguínea com um aviso curto), e nada quando é neutro. Antes de os locais abrirem, a faixa não aparece.

**A tela**, no celular em pé:

```
┌─────────────────────────────────┐
│ ‹ VOLTAR      ONDE AGIR?        │
├─────────────────────────────────┤
│            ( ● )   CÉREBRO      │  corpo pixelado em pé,
│            /█ █\   PULMÃO       │  cada local é um ponto
│           / ███ \  FÍGADO       │  que brilha na cor do chão;
│             ███    INTESTINO    │  os vasos (Corrente
│             █ █    CORRENTE ↯   │  sanguínea) em linhas
├─────────────────────────────────┤
│ INTESTINO          [INDICADO]   │  cartão do local tocado
│ [tile] Açúcares e lipídios ×2   │
│        Setor do local: Física   │
│ Com a LIPASE: ✚ +4 Física,      │  linha do par com o agente
│   colateral pela metade         │  escolhido
│ Sinergia aqui: [Lip] [Ser]      │  agentes com ✚ neste local
│ Melhor aqui: 08:12              │
├─────────────────────────────────┤
│ [QUALQUER LUGAR +10% ATP]  [IR] │
└─────────────────────────────────┘
```

- **Corpo:** os cinco pontos (cérebro na cabeça, pulmão no peito, fígado à direita do abdome, intestino no meio do abdome, a corrente sanguínea nas linhas dos vasos e no coração). O ponto do local escolhido pulsa; o do setor mais baixo do caso tem o selo INDICADO. Como os quatro locais abrem juntos, a tela só aparece depois da primeira estrela; antes, a faixa nem existe. No jogo, o local tocado acende e o INDICADO tem um quadradinho dourado na lista.
- **Cartão:** o tile base do ambiente, a família que dobra com os ícones das moléculas, o setor do local, a linha do par com o agente atual, os retratos pequenos dos agentes que têm sinergia ali (bloqueados em silhueta, para o jogador saber o que procurar) e o melhor tempo naquele local.
- **Barreira:** com um agente que não atravessa, o cartão do Cérebro mostra ⊘ "NÃO ATRAVESSA A BARREIRA" e o IR fica apagado; tocar no retrato do agente abre a escolha do agente sem sair da tela.
- **IR** começa a run direto. **QUALQUER LUGAR** sorteia o local pela semente, com +10% de ATP.
- **Tela larga:** corpo à esquerda, cartão à direita, botões embaixo do cartão.
- **Controles:** setas ou direcional andam entre os pontos do corpo; Enter ou A vai; Esc ou B volta.

**Em outras telas:**

- **Escolha do agente:** cada agente mostra o ícone do local de sinergia dele (✚ com o mini tile) e ⊘ se não entra no Cérebro.
- **Fim de run:** a linha da saúde separa o que veio do agente, do setor do local e da sinergia ("Sinergia Lipase × Intestino: +4 Física").
- **Aba Organismo:** em "quem ajuda cada setor", os pares com sinergia aparecem ao lado dos agentes.
- **Palco do caso:** a ilustração do organismo destaca o local INDICADO junto com o setor doente.
- **HUD da run:** ícone ✚ pequeno embaixo dos contadores de ATP e decompostas quando o par tem sinergia (a HUD não tem retrato do agente) ([ui-cronico.md](ui-cronico.md)).

### Opções

Prancheta: [Opcoes.dc.html](identidade-visual/Opcoes.dc.html), no celular em pé, com a variante aberta pela pausa da run (fundo da run escurecido). Três abas no mesmo formato da pausa; tudo fica salvo no aparelho, junto com o save.

| Aba | Controles | Observação |
| --- | --- | --- |
| Som | **Mudo** (corta tudo sem mexer nos volumes); volume **Geral**, **Música** e **Efeitos sonoros**, de 0 a 100% em passos de 10%, com `−`, `+` e toque direto na barra de 10 pips; **Abafar na pausa** (sim por padrão) e **Tocar em segundo plano** (não por padrão) | O Geral multiplica os outros dois. Com Mudo, as barras ficam apagadas e o valor mostra MUDO. Regras de mixagem na aba [Sonoplastia](sonoplastia.md) |
| Tela | Mostrar FPS, Números de dano, Tela cheia, Debug (hitbox) | Os interruptores que já existem, no formato NÃO/SIM |
| Jogo | Verificar atualização (com os estados), Exportar e Importar save, Novidades | Só nas Opções do hub; aberta pela pausa, a aba mostra o aviso "Só nos menus" ([decisão 0016](decisoes/0016-offline-e-atualizacoes.md)) |

Embaixo de tudo, VOLTAR (ou Esc) e a linha de versão e build.

**No PC** ([OpcoesPC.dc.html](identidade-visual/OpcoesPC.dc.html), 1280×800): sem abas, as três seções lado a lado em painéis (Som mais largo, Tela e Jogo), e embaixo a versão à esquerda, VOLTAR no centro e "Esc volta" à direita. A tecla M alterna o mudo e a tela cheia também sai com F11. Aberta pela pausa, o painel Jogo mostra o mesmo aviso "Só nos menus".

## Placeholder

Toda tela ou botão que ainda não tem conteúdo segue o mesmo formato, para ninguém achar que é um bug:

- Título da seção e ícone.
- Uma frase sobre o que vai ter ali.
- Selo "EM BREVE · FASE N".
- Conteúdo de exemplo quando fizer sentido (a lista de agentes com todos bloqueados, as 7 armas com 6 bloqueadas).
- Botão Voltar, quando a tela não é uma aba.

## Navegação

- Tela de título → hub (aba Caso).
- As 5 abas trocam direto pela barra; telas abertas a partir delas (escolha do agente, Compêndio, Recordes, Opções) têm **Voltar** (botão e tecla Esc).
- JOGAR → run. Fim da run: **Jogar de novo** (mesmo agente) e **Menu** (volta ao hub). A pausa tem **Voltar ao menu**.
- No hub, Esc volta à tela de título.

## Medidas do hub (390×844)

O hub usa a mesma base de 390×844 da tela de batalha e se divide em cinco faixas. Só o palco estica; as outras têm altura fixa.

| Faixa | Altura | O que tem | Como é desenhada |
| --- | --- | --- | --- |
| Barra de status | 84 px | Retrato do organismo (48 px), "INDIVÍDUO 1", 4 mini barras de saúde com a média, ATP à direita | Fundo Noite #15172E, borda inferior de 4 px; ATP com o ícone de moeda Ouro #F2B233 e número com sombra dura |
| Faixa de objetivo | 64 px | Botão Opções (≡) à esquerda, faixa "PRÓXIMO: LIPASE" com barra de progresso, botão Recordes à direita | Faixa em Painel #2A2E55 com moldura de madeira; barra de progresso em azul #2D7FD6 |
| Palco | o resto (cerca de 476 px) | Escudo com o número do caso, nome do caso, MELHOR 12:40, ilustração do organismo com o setor doente piscando, 3 estrelas, baú das estrelas; trilho direito com Compêndio e Conquistas | Fundo Noite com grade de bancada; título em Pixelify 700 com contorno; setor doente em vermelho #D83A3A |
| Linha de ação | 136 px | Campo longo (88×104) · JOGAR (178×92) · Agente (88×104) | JOGAR é o botão principal em madeira #E0702A, texto de 40 px; as laterais são slots de agente (madeira e creme #F2D9A8) |
| Barra de abas | 84 px | 5 abas com ícone pixelado e rótulo; a do meio sobe 18 px e é mais larga | Fundo Painel; aba ativa em madeira; selo vermelho de 18 px com contorno |

Regras de medida: margem lateral de 12 px, todo alvo de toque com pelo menos 44 px, espaçamentos em múltiplos de 4 e escala inteira (1×, 2×, 3×), como em [design.md](design.md).

## Fluxo entre telas

- Tela de título → (toque) → Hub (aba Caso).
- Hub → JOGAR → Run (campo crônico) com o agente e o local escolhidos; o agente se troca pelo botão Agente, ao lado do JOGAR, e o local pela faixa acima dele (Hub → faixa do local → Escolha do local → IR → Run).
- Run ↔ Pausa; da Pausa dá para voltar ao menu (hub).
- Run → (interações acabam) → Fim de run → recompensas e recordes → Hub, ou Jogar de novo → Run.
- Do hub abrem as abas Agentes (fase 2), Arsenal (fase 2), Laboratório (fase 3) e Organismo (fase 5), o Campo longo (fase 4) e os trilhos Compêndio (fase 2), Recordes e Opções (fase 1). Todas voltam ao hub com Voltar ou Esc.

O hub é o único ponto de partida: a run sempre começa por JOGAR e sempre termina de volta nele, passando pela tela de fim. Jogar de novo pula o hub, mas não a tela de fim, para o jogador ver o que ganhou.

## Estados do hub

O hub não é uma tela parada: ele muda conforme de onde o jogador vem e o que aconteceu.

| Estado | Quando | O que muda na tela |
| --- | --- | --- |
| Primeira abertura | Save vazio | Só JOGAR e a aba Caso ficam ativos; o resto aparece em silhueta. Uma seta pixelada aponta para JOGAR. Sem selos. |
| Volta da run | Depois da tela de fim | O ATP ganho voa da linha de ação para o contador do topo (0,8 s); MELHOR pisca se bateu recorde; estrela nova acende e o baú ganha selo. |
| Desbloqueio disponível | ATP ≥ custo do próximo desbloqueio | A faixa de objetivo vira laranja com "PRONTO" e a aba Agentes ou Laboratório ganha selo. |
| Idle acumulado | Campo longo produziu desde a última visita (fase 4) | O botão Campo longo mostra "+340" e pulsa; ao abrir o jogo depois de horas, aparece antes o painel "Enquanto você estava fora". |
| Setor crítico | Algum setor de saúde abaixo de 25 (fase 5) | A mini barra fica vermelha e o organismo no palco pisca naquele ponto; o nome do caso diz a "doença". |
| Caso encerrado | Reset para o próximo indivíduo (fase 5) | O palco mostra o caso antigo com o selo "ALTA" e o novo caso entra por cima, rolando como capítulo. |

Nada nesses estados bloqueia o JOGAR: o botão funciona em qualquer um deles, inclusive durante animações (toque pula a animação).

## Selos e avisos

No print, quase todo botão tem um "!" vermelho, e por isso nenhum chama atenção. Aqui o selo só aparece quando há uma ação que o jogador pode fazer agora, e some assim que ele abre o lugar.

| Selo | Onde | Aparece quando | Some quando |
| --- | --- | --- | --- |
| "!" vermelho | Aba Agentes, Arsenal ou Laboratório | Tem ATP para comprar algo ali | Abre a aba |
| "!" vermelho | Baú das estrelas | Estrela nova sem resgatar | Resgata |
| Número ("+340") | Campo longo | Produção acumulada acima de 10% do próximo custo | Coleta |
| "NOVO" | Compêndio | Molécula ou modificador visto pela primeira vez | Abre o Compêndio |
| "RECORDE" | Recordes | Bateu recorde na última run | Abre Recordes |

No máximo três selos na tela ao mesmo tempo; se houver mais, valem as abas antes dos trilhos. O selo usa vermelho de interação #D83A3A com contorno #3A0A0C e não pisca.

## Proporções de tela e controles

O hub é desenhado para o celular em pé e se adapta esticando o palco ou abrindo colunas, nunca esticando os botões.

| Tela | Exemplo | Adaptação |
| --- | --- | --- |
| Celular padrão | 390×844 (19,5:9) | Layout base |
| Celular baixo | 375×667 (16:9) | Palco encolhe até 360 px; a ilustração do organismo diminui um degrau de escala e o baú vai para o lado das estrelas |
| Celular alto | 412×915 ou mais | Palco cresce; aparece a prévia do caso anterior embaixo, como o capítulo 25 do print |
| Tablet em pé | 820×1180 | Tudo em escala 2×, coluna central de 540 px; trilhos encostam na coluna |
| PC ou tablet deitado | 1280×720 ou mais | Coluna central de 480 px com status, palco, ação e abas; os trilhos viram painéis laterais abertos (Recordes e objetivo à direita, organismo e saúde à esquerda) |

**Controles**

| Ação | Toque | Teclado | Gamepad |
| --- | --- | --- | --- |
| Jogar | Toque em JOGAR | Enter ou Espaço | A |
| Trocar de aba | Toque na aba | 1 a 5, ou Q e E | LB e RB |
| Navegar entre botões | — | Setas ou Tab | Direcional |
| Voltar ou fechar | Botão Voltar | Esc | B |
| Opções | Botão ≡ | O | Start |

Com teclado ou gamepad, o botão focado ganha uma moldura ciano #39D3F0 de 3 px, e o foco começa sempre em JOGAR.

## O que o hub mostra em cada fase

O hub cresce junto com o roadmap. Cada fase acende uma parte; o que ainda não existe fica com o selo "EM BREVE · FASE N".

| Fase | O que acende no hub |
| --- | --- |
| 1 (v0.1) | Tela de título, JOGAR, Recordes e Opções; o resto do hub ainda não existe ([decisão 0008](decisoes/0008-v01-menu-e-run.md)) |
| 1.5 | O layout completo do hub: barra de status, palco, linha de ação e as 5 abas, com placeholders e valores de exemplo ([decisão 0014](decisoes/0014-fase-menu-principal.md)) |
| 2 | Botão Agente e tela de escolha; Compêndio; abas Agentes e Arsenal com conteúdo |
| 3 | ATP de verdade no topo, faixa de objetivo, baú das estrelas, aba Laboratório, selos de compra |
| 4 | Botão Campo longo com o acumulado e painel "Enquanto você estava fora" |
| 5 | Mini barras de saúde, organismo no palco com o setor doente, aba Organismo, troca de caso no reset |
| 5.12 | Faixa do local acima do JOGAR, tela de escolha do local, selo INDICADO e sinergia no fim de run |
| 6 | Arte final, animações de recompensa, som e os layouts de tela larga |

## O que falta decidir

- [x] As estrelas são metas de tempo (5, 10, 15 min), de decompostas, ou de nível? → tempo, e cada estrela nova enche o baú com ATP ([decisão 0021](decisoes/0021-meta-progressao.md)).
- Os nomes Caso, Laboratório, Compêndio e Arsenal funcionam, ou prefere nomes diretos (Campanha, Upgrades, Bestiário, Armas)?
- A tela de título continua existindo, ou o jogo abre direto no hub?
- Conquistas entram, e em que fase?
- O palco mostra o organismo inteiro (corpo pixelado, como no artboard) ou uma placa de Petri com as moléculas do caso?
- Limite de três selos na tela ao mesmo tempo está bom?
- A escolha do local fica numa faixa acima do JOGAR (um toque continua jogando), ou vira um passo obrigatório depois do JOGAR, como um mapa de fases?

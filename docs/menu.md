# Menu principal

O menu segue o hub de jogos mobile de campanha: JOGAR grande no centro, ATP no topo, as seções numa barra de 5 abas embaixo e as secundárias em trilhos laterais. O que ainda não existe entra como placeholder "EM BREVE · FASE N" na fase 1.5 do roadmap ([decisão 0009](decisoes/0009-menu-hub-fase-1-5.md)).

O protótipo navegável está no [canvas de identidade visual](https://claude.ai/artifact/MPV17zZywrhhXBUdfnUs6F), na prancheta "Menu principal (protótipo)".

## A referência

O print é o hub de um jogo mobile de campanha. Ele se organiza em zonas, de cima para baixo:

| Zona | O que tem no print | Para que serve |
| --- | --- | --- |
| Barra de status (topo, fixa) | Avatar, nível e XP da conta; poder de combate; energia (196/30); ouro e gemas, cada um com "+" | Recursos e progresso sempre à vista |
| Faixa de destaque | Carrossel de eventos, menu (≡) à esquerda, Ranking à direita | O que é novo agora |
| Trilho esquerdo | Ofertas pagas (Cartão de Privilégio, Melhor Preço, oferta com contador) | Monetização |
| Trilho direito, recolhível | Tarefas, Amigos, eventos, raide da guilda | Social e eventos, fora do caminho |
| Palco (centro) | Capítulo 26 "Território Carmesim", melhor resultado 49/50, ilustração, 3 estrelas; o capítulo 25 aparece embaixo | Onde o jogador está; os capítulos rolam como um mapa vertical |
| Atalhos do capítulo | Caça (patrulha ociosa), baú do capítulo (26–50), Guilda | Recompensas ligadas ao capítulo |
| Linha de ação | Acampamento (recompensa ociosa) à esquerda; INICIAR com custo de 5 de energia; Escada da Briga (PvP) à direita | O botão principal ao alcance do polegar, com os modos irmãos dos lados |
| Chat | Mensagens passando numa linha | Social |
| Barra de abas (rodapé) | 5 abas: Loja, Equipamento, Campanha (centro, maior e destacada), Arena, Itens | As seções principais a um toque |
| Selos vermelhos "!" | Em quase todo botão | Puxar para o que tem novidade |

## O que copiar e o que deixar de fora

**Copiar:**

- Um botão principal grande, logo acima do polegar, sem nada competindo com ele.
- O modo principal no centro da tela e na aba do meio.
- O progresso visível no palco: onde estou, melhor marca, estrelas.
- A moeda sempre no topo.
- Seções principais na barra de abas; secundárias nos trilhos.
- O idle como botão vizinho do principal, mostrando o que acumulou.

**Deixar de fora:** energia para jogar, segunda moeda paga, ofertas e contadores, guilda, chat, amigos, ranking online e selos em tudo. O jogo é pessoal, para amigos e sem servidor. Selo só aparece quando há algo a fazer.

## O hub proposto

O hub é a tela entre as runs, pensada primeiro para o celular em pé. Cada zona do print vira uma parte do Dopamina Blaster:

```
┌─────────────────────────────────┐
│ [org] INDIVÍDUO 1   ATP 1.250   │  barra de status
│ ▮▮▯ ▮▮▮ ▮▯▯ ▮▮▯  saúde 58%      │  4 setores de saúde
├─────────────────────────────────┤
│ ≡                      [RECORD.]│  trilhos: Opções à esquerda;
│        PRÓXIMO: LIPASE          │  Recordes, Compêndio e
│        faltam 320 ATP  [COMPÊN.]│  Conquistas à direita
│                         [CONQ.] │
│     ┌─────────────────────┐     │
│     │ CASO 1 · FÍSICA BAIXA │     │  palco: o indivíduo como capítulo
│     │ [ilustração do        │     │
│     │  organismo]           │     │
│     │ MELHOR: 12:40         │     │
│     │ ★ ★ ☆  5·10·15 min    │     │  estrelas = metas de tempo
│     └─────────────────────┘     │
│        [baú das estrelas]       │
├─────────────────────────────────┤
│ [CAMPO ] ┌───────────┐ [AGENTE ]│  linha de ação
│ [LONGO ] │   JOGAR   │ [DOPAM. ]│
│ [+340  ] └───────────┘ [   ▸   ]│
├─────────────────────────────────┤
│ AGENTES ARSENAL [CASO] LAB. ORG. │  barra de abas
└─────────────────────────────────┘
```

| Zona do print | No Dopamina Blaster |
| --- | --- |
| Avatar e nível da conta | Retrato do organismo e o número do indivíduo atual |
| Poder de combate | Saúde: os 4 setores em mini barras e a média |
| Ouro e gemas | ATP, a única moeda; pontos herdados ao lado quando o reset existir (fase 5) |
| Energia | Não tem: jogar é livre |
| Carrossel de eventos | Faixa de objetivo: o próximo desbloqueio e quanto falta, ou a próxima estrela |
| Trilhos laterais | Esquerdo: Opções. Direito: Recordes, Compêndio e Conquistas |
| Capítulo com estrelas | O caso: o indivíduo tratado, a "doença" (setor mais baixo), ilustração, melhor tempo e 3 estrelas de meta de tempo (5, 10 e 15 min); casos anteriores rolam embaixo |
| Baú do capítulo | Baú das estrelas: ATP a cada estrela nova (fase 3) |
| INICIAR | JOGAR: a run no campo crônico com o agente escolhido, sem custo |
| Acampamento | Campo longo: o ATP acumulado no idle e a entrada do modo (fase 4) |
| Escada da Briga | Agente: o sprite do agente escolhido; toque abre a escolha |

Até as fases 3 e 5, saúde e ATP aparecem com valores de exemplo e o selo "EM BREVE". Em tela larga, o palco fica no centro, os trilhos nas laterais e a barra de abas no rodapé com largura máxima.

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

> Diagrama "Tudo volta ao hub: JOGAR leva à run e o fim da run traz de volta" disponível no [documento original](https://claude.ai/code/artifact/931f649e-d98f-4019-a7fb-8643946bc1c5).

- Tela de título → (toque) → Hub (aba Caso).
- Hub → JOGAR → Escolha do agente → Run (campo crônico).
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
| 1.5 | O layout completo do hub: barra de status, palco, linha de ação e as 5 abas, com placeholders e valores de exemplo ([decisão 0009](decisoes/0009-menu-hub-fase-1-5.md)) |
| 2 | Botão Agente e tela de escolha; Compêndio; abas Agentes e Arsenal com conteúdo |
| 3 | ATP de verdade no topo, faixa de objetivo, baú das estrelas, aba Laboratório, selos de compra |
| 4 | Botão Campo longo com o acumulado e painel "Enquanto você estava fora" |
| 5 | Mini barras de saúde, organismo no palco com o setor doente, aba Organismo, troca de caso no reset |
| 6 | Arte final, animações de recompensa, som e os layouts de tela larga |

## Barra de abas e outras telas

Cinco abas, com a do meio maior e destacada, como no print. A barra fica visível em todas as abas; telas abertas a partir delas têm Voltar (botão e Esc).

| Tela | O que tem | Ganha conteúdo na |
| --- | --- | --- |
| Aba Agentes | Elenco da run e do idle, ficha de cada agente, desbloqueio | Fases 2 e 3 |
| Aba Arsenal | Armas, níveis, evoluções e reagentes | Fases 2 e 3 |
| Aba Caso (centro) | O hub | Fase 1.5 |
| Aba Laboratório | Árvores de upgrades permanentes da run e do idle | Fases 3 e 4 |
| Aba Organismo | Os 4 setores de saúde, o efeito de cada um, o reset | Fase 5 |
| Escolha do agente | Agentes da run; bloqueados com cadeado e custo | Fase 2 (hoje só a Dopamina) |
| Campo longo | O idle | Fase 4 |
| Compêndio | Moléculas, modificadores e raridades já vistos; o resto em silhueta | Fase 2 em diante |
| Conquistas | Metas de longo prazo | A definir |
| Recordes e Opções | O que já existe | Já existem |

Toda tela ainda vazia segue o mesmo placeholder: título e ícone, uma frase do que vai ter ali, o selo "EM BREVE · FASE N" e, quando fizer sentido, conteúdo de exemplo (as 7 armas com 6 bloqueadas, os agentes com todos bloqueados).

## O que falta decidir

- [ ] As estrelas são metas de tempo (5, 10, 15 min), de decompostas ou de nível?
- [ ] Os nomes Caso, Laboratório, Compêndio e Arsenal funcionam, ou prefere nomes diretos (Campanha, Upgrades, Bestiário, Armas)?
- [ ] A tela de título continua existindo, ou o jogo abre direto no hub?
- [ ] Conquistas entram, e em que fase?
- [ ] A fase 1.5 (hub completo com placeholders) entra no roadmap entre a v0.1 e a fase 2? ([decisão 0009](decisoes/0009-menu-hub-fase-1-5.md))
- [ ] O palco mostra o organismo inteiro (corpo pixelado) ou uma placa de Petri com as moléculas do caso?
- [ ] Limite de três selos na tela ao mesmo tempo está bom?

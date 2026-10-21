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

- **JOGAR** (centro, o maior botão da tela): começa a run no campo crônico com o agente escolhido. Sem custo de energia.
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
| Campo longo | O idle | Placeholder | 4 |
| Compêndio | Moléculas inimigas (com a cascata), modificadores e raridades já vistos; o resto em silhueta | Placeholder | 2 em diante |
| Recordes | Melhor tempo, nível, decompostas, runs | Existe | — |
| Conquistas | Metas de longo prazo | Placeholder | a definir |
| Opções | FPS, tela cheia; volume com o som | Existe | 6 (volume) |

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

## O que falta decidir

- As estrelas são metas de tempo (5, 10, 15 min), de decompostas, ou de nível?
- Os nomes Caso, Laboratório, Compêndio e Arsenal funcionam, ou prefere nomes diretos (Campanha, Upgrades, Bestiário, Armas)?
- A tela de título continua existindo, ou o jogo abre direto no hub?
- Conquistas entram, e em que fase?

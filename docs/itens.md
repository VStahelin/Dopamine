# Itens no mapa (drops)

O campo crônico usa o mesmo conjunto de itens de chão do Vampire Survivors (VS), com nomes e efeitos trocados pela química do corpo. Os itens saem de **vesículas** espalhadas pelo mapa, as moléculas soltam gemas de XP e ATP, e o chefe solta uma **cápsula** de upgrades. Entra na [fase 5.5 do roadmap](roadmap.md#fase-55-itens-no-mapa), antes do polimento ([decisão 0024](decisoes/0024-itens-no-mapa.md)).

Tudo aqui é **proposta**: nomes, pesos e valores são o primeiro chute para testar. Quando virar código, os números vão para `src/config/drops.json`.

## Como o Vampire Survivors faz

- **Fontes de luz.** Castiçais e braseiros espalhados pelo mapa. Um golpe quebra a fonte, que solta um item sorteado por peso. Alguns itens só aparecem depois de um nível mínimo na run, e a Sorte aumenta a chance de tudo, menos das moedas ([fonte de luz](https://vampire.survivors.wiki/w/Light_source)).
- **Gemas de XP.** Todo inimigo solta uma gema: azul até 2 XP, verde até 9, vermelha acima disso. Com mais de 400 gemas no chão, o XP novo se junta numa gema vermelha só ([Experience Gem](https://vampire-survivors.fandom.com/wiki/Experience_Gem)).
- **Baú do chefe.** Só chefes soltam baú. O baú sobe 1, 3 ou 5 armas ou passivos que o jogador já tem, dá ouro e, depois dos 10 minutos, pode evoluir uma arma pronta. A Sorte melhora a chance de 3 e 5. Os seis primeiros baús do save são fixos: 1, 1, 3, 1, 1 e 5 itens ([baú](https://vampire.survivors.wiki/w/Chest)).

Pesos das fontes de luz no VS (Mad Forest e fases parecidas):

| Item no VS | Peso | Nível mínimo | Efeito no VS |
| --- | --- | --- | --- |
| Gold Coin | 50 | — | +1 de ouro |
| Floor Chicken | 12 | — | Cura 30 de vida |
| Coin Bag | 10 | — | +10 de ouro |
| Orologion | 2 | 4 | Congela todos os inimigos por 10 s |
| Vacuum | 2 | 12 | Puxa todas as gemas de XP do mapa |
| Rich Coin Bag | 1 | 5 | +100 de ouro |
| Rosary | 1 | 8 | Destrói todos os inimigos na tela |
| Nduja Fritta Tanto | 1 | — | Cospe fogo para a frente por 10 s |
| Little Clover | 1 | — | +10% de Sorte, acumula |
| Gilded Clover | 1 | 30 | Puxa todo o ouro e começa a Febre do Ouro |

Fontes: [Light source](https://vampire.survivors.wiki/w/Light_source), [Pickups](https://vampire-survivors.fandom.com/wiki/Pickups), [Orologion](https://vampire.survivors.wiki/w/Orologion), [Chest](https://vampire.survivors.wiki/w/Chest).

## A fonte dos itens: vesículas

No neurônio, a **vesícula sináptica** é a bolsa que guarda a dopamina até ela ser liberada. No jogo, ela faz o papel do castiçal do VS: uma bolsa parada no chão que se rompe com qualquer golpe e solta um item.

- Nasce fora da tela, num anel em volta do agente: uma a cada 15 s, no máximo 6 ao mesmo tempo. A que fica a mais de duas telas de distância some.
- Tem 1 de vida: qualquer arma rompe. Não anda, não ataca e não bloqueia o caminho.
- Ao romper, sorteia 1 item da tabela abaixo pelo peso, respeitando o nível mínimo.
- A **Sorte** multiplica o peso de todos os itens, menos ATP e Glicose, como no VS.

## Os itens

| Item | No VS | Efeito | Peso | Nível mínimo |
| --- | --- | --- | --- | --- |
| **ATP** | Gold Coin | +1 moeda de ATP, com o valor atual (cresce com o tempo de run) × Rendimento | 50 | — |
| **Soro** | Floor Chicken | Recupera 30 interações | 12 | — |
| **Glicose** | Coin Bag | ATP igual a 5 moedas × Rendimento | 10 | — |
| **Gelo seco** | Orologion | Congela todas as moléculas por 10 s: elas não andam nem gastam interações, as que chegam nesse tempo já chegam congeladas, e o agente empurra as congeladas | 2 | 4 |
| **Osmose** | Vacuum | Todas as gemas de XP do mapa correm até o agente (ATP e itens ficam) | 2 | 12 |
| **Glicogênio** | Rich Coin Bag | ATP igual a 25 moedas × Rendimento | 1 | 5 |
| **Lisossomo** | Rosary | Decompõe todas as moléculas na tela, com cascata e gemas; o chefe não é afetado | 1 | 8 |
| **Bico de Bunsen** | Nduja Fritta Tanto | Lança-chamas na direção do movimento por 10 s, com Reatividade, Difusão e afinidades do agente | 1 | — |
| **Vitamina** | Little Clover | +10% de Sorte até o fim da run; acumula sem limite | 1 | — |
| **Glucagon** | Gilded Clover | Puxa todo o ATP do chão e começa a **Febre de ATP**: por 10 s toda molécula decomposta solta ATP, e cada ATP coletado soma 0,5 s à febre | 1 | 30 |

Com os pesos acima, uma vesícula solta ATP ou Glicose em cerca de 75% das vezes, Soro em 15% e um item especial no resto, como no VS.

**Valores de ATP.** O VS usa 10× e 100× para os sacos de moeda. Aqui ficam 5× e 25×, porque a economia do jogo é mais apertada (desbloqueios de 200 a 2000 ATP, [economia.md](economia.md)). Os números finais saem do `npm run sim`.

## O que as moléculas e o chefe soltam

| Drop | No VS | Quem solta | Efeito |
| --- | --- | --- | --- |
| **Gema de XP** | Experience Gem | Toda molécula decomposta | XP. Cor pelo valor: ciano até 2, verde até 9, vermelha acima. Acima do limite de gemas no chão, o excesso vai para uma gema vermelha só (como já pede a [aba Plataforma](plataforma.md)) |
| **ATP** | Gold Coin | Molécula comum (3%), elite e chefe (sempre) | Já existe desde a fase 2.7 (`runCurrency` em `economy.json`) |
| **Cápsula** | Treasure Chest | Chefe | Sobe 1, 3 ou 5 armas ou modificadores que o agente já tem, um nível cada, com raridade pela Sorte, e dá ATP. Precisa ser tocada (o raio de coleta não puxa) |
| **Fosfocreatina** | Big Coin Bag | Cápsula ou level up, quando tudo está no máximo | ATP igual a 10 moedas × Rendimento. A fosfocreatina é a reserva que o músculo usa para refazer ATP |

**A cápsula em detalhe:**

- **Bronze** (chefe antes dos 10 min): só sobe níveis.
- **Prata** (chefe depois dos 10 min): se houver arma em MAX com o reagente certo, evolui essa arma em vez de sortear (é o que a prancheta "Crônico" já diz: a arma em MAX evolui no próximo baú).
- **Quantos itens:** 5 itens com 3%, 3 itens com 10%, 1 item no resto; a Sorte multiplica as chances de 5 e 3.
- **Raridade:** cada modificador que a cápsula sobe sorteia uma raridade, com a mesma regra do level up ([decisão 0013](decisoes/0013-raridade-e-sorte.md)): a Sorte deixa as raridades altas mais prováveis e o valor somado sai multiplicado por ela. Assim a Sorte mexe na quantidade e na raridade das recompensas.
- **ATP:** 10 a 20 moedas (1 item), 30 a 60 (3 itens), 50 a 100 (5 itens), × Rendimento.
- **Sorte de principiante:** as seis primeiras cápsulas do save dão 1, 1, 3, 1, 1 e 5 itens.
- Item que já está no máximo e não evolui vira Fosfocreatina.

## Como aparece no modo crônico

- **No chão:** cada item é um ícone de 16×16 com contorno de 1 px (mesma regra dos ícones de [ui-cronico.md](ui-cronico.md)), com um brilho que pisca devagar. A vesícula é uma bolsa redonda e translúcida com pontinhos dentro.
- **Coleta:** o raio de coleta (Ímã) puxa ATP, gemas e os itens das vesículas. Só a cápsula precisa ser tocada.
- **Efeitos com tempo** (Gelo seco, Bico de Bunsen, Febre de ATP) aparecem na fila de efeitos da HUD, na moldura de efeito temporário, com o tempo que falta. Responde à pergunta de [ui-cronico.md](ui-cronico.md) sobre itens no chão.
- **Na tela:**
  - Lisossomo: clarão branco e todas as moléculas estalam juntas.
  - Gelo seco: anel azul em volta do agente e moléculas pintadas de azul.
  - Osmose: as gemas voam até o agente.
  - Febre de ATP: borda dourada na tela.
- **Cápsula:** pausa a run como o level up, gira os ícones e mostra o que subiu; a evolução usa a moldura EVO.
- **Compêndio:** os itens vistos entram numa seção "Itens", com silhueta para os que faltam.
- **Campo longo (idle):** sem itens no chão por enquanto.

## Parâmetros

Quando virar código, um `src/config/drops.json` com o tipo em `src/config/types.ts`:

- Vesículas: intervalo de nascimento, máximo ao mesmo tempo, distância do anel e distância para sumir.
- Por item: peso, nível mínimo, se a Sorte afeta, valor ou duração.
- Cápsula: chances de 1, 3 e 5 itens, faixa de ATP por tamanho, minuto em que vira prata, sequência de principiante.
- Gemas: limites de valor de cada cor e limite de gemas no chão.

## O que falta decidir

- [ ] Os nomes funcionam (Soro, Glicose, Glicogênio, Gelo seco, Osmose, Lisossomo, Bico de Bunsen, Vitamina, Glucagon, Cápsula, Fosfocreatina)?
- [ ] Vesículas nascendo sozinhas em volta do agente, ou pontos fixos no mapa como os castiçais do VS? Proposta em [mapas.md](mapas.md#relação-com-as-outras-fases): as duas (anel + ninhos de vesículas).
- [ ] Valores de ATP mais baixos que o VS (5× e 25×) ou os mesmos (10× e 100×)?
- [ ] A evolução sai do level up e passa a ser só pela cápsula de prata, como no VS, ou fica nos dois?
- [ ] O Lisossomo poupa elites também, ou só o chefe?
- [ ] Os itens de DLC do VS (torta, ovo dourado e outros) ficam de fora, como proposto?

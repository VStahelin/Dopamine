# Run estilo Megabonk

22 de outubro de 2026 · Vitor

Quatro mudanças inspiradas no Megabonk para a run ficar mais dinâmica: o level up passa a oferecer só **armas e receptores** (os tomos do Megabonk), os outros atributos vêm de **suplementos** que saem de **ampolas** (os baús), nem toda molécula solta XP e os **agregados** (mini chefes) sempre soltam ampola, e o mapa ganha **sinapses** e outras estruturas em que é preciso ficar um tempo para ganhar um bônus. Tudo aqui é **proposta**; as regras novas estão nas decisões [0027](decisoes/0027-level-up-com-receptores.md), [0028](decisoes/0028-suplementos-e-ampolas.md) e [0029](decisoes/0029-sinapses-e-estruturas.md), e os passos nas fases 5.8 a 5.11 do [roadmap](roadmap.md#fase-58-receptores-no-level-up).

## Resumo

| # | Mudança | No Megabonk | No Dopamina Blaster | Fase |
| --- | --- | --- | --- | --- |
| 1 | Level up enxuto | Level up só com armas e tomos, 4 espaços de cada | Level up só com **armas** e **receptores**; os 35 modificadores de hoje viram 16 receptores, e o resto sai do level up | [5.8](roadmap.md#fase-58-receptores-no-level-up) |
| 2 | Itens que melhoram atributos | Itens passivos sem limite de espaço, que acumulam, com 4 raridades | **Suplementos**: passivos sem espaço, que acumulam, com raridade; os reagentes da evolução viram suplementos | [5.9](roadmap.md#fase-59-suplementos-e-ampolas) |
| 3 | Drops com chance | Inimigos e elites soltam baús | Gema de XP com chance (maior quando cai), **ampola** com chance pequena, sempre nos agregados e no chefe | [5.9](roadmap.md#fase-59-suplementos-e-ampolas) e [5.10](roadmap.md#fase-510-agregados-mini-chefes) |
| 4 | Estruturas no mapa | Santuário de carga, de ganância, de maldição do chefe, de desafio, micro-ondas, mercador | **Sinapse** (ficar dentro até encher), **Sinapse potenciada**, **Foco inflamatório**, **Coágulo** e **Glândula adrenal**; Ribossomo e Farmácia depois | [5.11](roadmap.md#fase-511-sinapses-e-estruturas) |

O que não muda: ação própria do agente e armas do pool ([0015](decisoes/0015-acao-do-agente-e-armas.md)), raridade movida pela Sorte ([0013](decisoes/0013-raridade-e-sorte.md)), as vesículas e os itens de consumo da [fase 5.5](itens.md), a cápsula do chefe e a evolução, e o Laboratório.

## Como o Megabonk faz

O wiki do Fandom não abre no ambiente da nuvem; as regras abaixo vêm do [banco de dados de tomos](https://megabonk.org/database/tomes/), do [banco de itens](https://megabonk.org/database/items/), do [guia de santuários](https://megabonk.org/guides/mechanics/shrines/) e de [guias de interagíveis](https://megabonkwiki.net/articles/all-megabonk-interactables-explained). Os números exatos variam entre as fontes; o que importa aqui é a forma.

- **Tomos.** Livros que sobem um atributo por nível: Dano (+0,08×), Recarga (+7,5% de velocidade de ataque), Agilidade (+15% de movimento), Vida (+25), Regeneração, Escudo, Tamanho (+10%), Precisão (crítico), Velocidade do projétil, Esquiva, Repulsão, Ouro e Prata. Outros dez se desbloqueiam com metas: Armadura, Atração (+75% de coleta), Sangue (roubo de vida), Caos (um atributo sorteado por nível), Maldição (+3,5% de dificuldade), Duração, Sorte, Quantidade (+1 projétil), Espinhos e XP. O level up mistura armas e tomos, a raridade da carta aumenta o quanto sobe, e há rerrolar, pular e banir.
- **Itens.** 85 itens passivos em quatro raridades (27 comuns, 24 raros, 12 épicos, 22 lendários). Não ocupam espaço e acumulam: pegar o mesmo item de novo soma o efeito. Uns só sobem atributos (o Trevo dá Sorte, o Kit médico dá vida); outros mudam regras (o Cubo de gelo congela ao acertar, o Orbe de raio solta raios, o Ímã chupão puxa o XP).
- **Baús.** Saem de inimigos e de elites, ficam espalhados pelo mapa e dão um item com raridade pela Sorte. Os baús pagos ficam mais caros a cada um aberto; a Chave dá chance de abrir de graça.
- **Santuário de carga.** Um círculo no chão: o jogador fica dentro uns segundos até a barra encher, sem poder fugir das ondas, e escolhe 1 de 3 bônus de atributo. O **santuário dourado** é igual, mas dá bônus lendários. O item Farol soma santuários de carga às fases seguintes.
- **Outras estruturas.** O santuário da **ganância** dá ouro e +5% de dificuldade; o da **maldição do chefe** chama outro chefe, que solta outro baú; o de **desafio** invoca uma onda e dá um baú a quem vence; o **micro-ondas** duplica um item gastando outro da mesma raridade; o **mercador** vende itens; os **vasos** quebram e soltam ouro.

## 1. Level up com armas e receptores

O receptor é a proteína da célula onde o remédio se liga. Subir um receptor é aumentar a resposta do corpo a um efeito do agente, e cada um cuida de um atributo só, como os tomos.

**Regras:**

- O level up sorteia entre quatro tipos de carta: **arma nova** (se houver espaço), **nível de arma**, **receptor novo** (se houver espaço) e **nível de receptor**. Nada mais entra no sorteio, além da "Nova dose" e da Superdosagem quando tudo está no máximo.
- **Espaços:** 4 armas (a ação do agente conta) e 4 receptores, com teto de 6 cada pelo Laboratório. O atributo "Espaços de modificador" vira **Espaços de receptor** e só sobe no Laboratório.
- **Nível máximo:** 8 para armas, como hoje; 5 para receptores.
- **Raridade também na arma.** Hoje só o modificador tem raridade. Com receptores, a carta de nível de arma também sorteia raridade, que multiplica o ganho daquele nível (`{"damage": 3}` num nível Raro dá +6), com a mesma tabela e a mesma Sorte da [decisão 0013](decisoes/0013-raridade-e-sorte.md). Arma nova e evolução continuam sem raridade.
- **Rerrolar, Pular e Banir** ficam como estão, mas saem do sorteio como cartas: vêm do Laboratório, da saúde executiva e das sinapses.

**Os 16 receptores** (10 desde o começo e 6 desbloqueáveis com ATP no Arsenal, como as armas, até as conquistas existirem):

| Receptor | Atributo | Por nível (comum) | Tomo do Megabonk | Começo |
| --- | --- | --- | --- | --- |
| Reatividade | Dano | +10% | Dano | liberado |
| Metabolismo | Recarga | −8% | Recarga | liberado |
| Difusão | Área | +15% | Tamanho | liberado |
| Cinética | Velocidade do projétil e alcance | +15% | Velocidade do projétil | liberado |
| Catálise | Chance crítica | +5% | Precisão | liberado |
| Interações | Vida máxima | +20 | Vida | liberado |
| Homeostase | Regeneração | +0,2/s | Regeneração | liberado |
| Membrana | Armadura | +1 | Escudo e Armadura | liberado |
| Mobilidade | Movimento | +10% | Agilidade | liberado |
| Raio de coleta | Ímã | +25% | Atração | liberado |
| Dose | Projéteis | +1 (máx. 3 níveis) | Quantidade | 600 ATP |
| Meia-vida | Duração | +15% | Duração | 400 ATP |
| Aprendizado | XP | +8% | XP | 400 ATP |
| Sorte | Sorte | +7% | Sorte | 800 ATP |
| Estresse | Maldição: inimigos mais fortes, mais XP e ATP | +10% | Maldição | 300 ATP |
| Mutação | Um atributo sorteado a cada nível, entre todos do jogo | sorteado | Caos | 1000 ATP |

Os valores por nível são os de `passives.json` hoje; os preços são chute, para o `npm run sim` ajustar. A Cinética junta velocidade do projétil e alcance para não ter dois receptores fracos.

**O que acontece com os outros modificadores:**

| Hoje no level up | Para onde vai |
| --- | --- |
| Alcance, Penetração, Reação em cadeia, Força da catálise, Repulsão, Especificidade, Esquiva, Absorção, Tolerância, Segunda dose, Reflexo, Chance de efeito, Opções | Suplementos (seção 2) e recompensas de sinapse |
| Rerrolar, Pular, Banir | Laboratório, saúde executiva e recompensa de sinapse (+1 uso) |
| Espaços de modificador | Espaços de receptor, só no Laboratório |
| Peróxido, Cloro, Ozônio, Coenzima (reagentes da evolução) | Suplementos raros, com ajuda para aparecer quando a arma chega ao MAX |

Com isso o level up oferece no máximo 4 armas e 4 receptores de um pool de 7 armas e 16 receptores, contra 35 modificadores hoje. Escolher um receptor pesa mais, porque são só quatro.

## 2. Suplementos

Os suplementos são o equivalente aos itens do Megabonk: coisas que o agente toma durante a run e que mudam atributos ou regras. Diferente dos itens de consumo da [fase 5.5](itens.md) (Soro, Glicose, Gelo seco), que agem na hora e somem, o suplemento fica até o fim da run.

**Regras:**

- Saem só de **ampolas** (seção 3) e de algumas estruturas. Não ocupam espaço e **acumulam**: a segunda Creatina soma o mesmo bônus de novo, até o teto na run do atributo ([parametros.md](parametros.md)).
- Quatro raridades, com as cores da [decisão 0013](decisoes/0013-raridade-e-sorte.md): **Comum** (cinza), **Raro** (azul), **Ultra raro** (roxo) e **Lendário** (laranja). A ampola sorteia primeiro a raridade, pela Sorte, e depois o suplemento dentro dela.
- Um suplemento que já bateu o teto do atributo sai do sorteio.
- Aparecem na aba Arsenal da pausa numa grade com o número de cópias (`×3`), e o último pego aparece por 2 s embaixo da HUD.

**A lista inicial** (25, mais os 4 reagentes):

| Suplemento | Raridade | Efeito por cópia | Inspirado em |
| --- | --- | --- | --- |
| Creatina | Comum | +8% de Reatividade | Luvas de boxe |
| Vitamina | Comum | +10% de Sorte (sai da vesícula e vira suplemento) | Trevo |
| Ferro | Comum | +15 interações | Kit médico |
| Eletrólitos | Comum | +0,15/s de Homeostase | Aveia |
| Cafeína | Comum | +8% de Mobilidade | Meias turbo |
| Bicarbonato | Comum | +20% de Repulsão | Repulsão |
| Ácido fórmico | Comum | Reflexo +25% (devolve dano a quem encosta, como a urtiga) | Cacto |
| Mucina | Comum | +0,1 s de Tolerância | Cachecol |
| Glutamina | Comum | +2% de Absorção | Queijo mofado |
| Fluoresceína | Comum | +15% de Alcance | Óculos táticos |
| Ginseng | Comum | −8% de recarga do especial | Bateria |
| Surfactante | Raro | +1 de Penetração | Projétil perfurante |
| Cobre | Raro | +1 de Reação em cadeia | Ricochete |
| Anticorpo | Raro | +15% de dano em agregados e chefes | Destruidor de chefes |
| Mitocôndria | Raro | +15% de Rendimento (ATP) | Luva dourada |
| Quimiotaxia | Raro | Sinapses enchem 25% mais rápido e o mapa ganha uma sinapse a mais | Farol |
| Nitrogênio líquido | Raro | 5% de chance de congelar a molécula atingida por 1 s | Cubo de gelo |
| Enzima digestiva | Ultra raro | +25% de Força da catálise | Garra de águia |
| Platina | Ultra raro | +10% de Chance de efeito (lentidão, queimadura) | Barril tóxico |
| Aquaporina | Ultra raro | A cada 60 s, todas as gemas do mapa correm até o agente | Ímã chupão |
| Eletrodo | Ultra raro | Ao decompor, 10% de chance de uma faísca que atinge 3 moléculas perto | Orbe de raio |
| Nootrópico | Lendário | +1 opção no level up | Bigorna |
| Dose de reforço | Lendário | +1 Segunda dose | Reviver |
| Termita | Lendário | Molécula decomposta explode e queima as vizinhas | Fogo de dragão |
| Criopreservação | Lendário | Ao perder interações, congela tudo na tela por 2 s (recarga de 30 s) | Za Warudo |

**Reagentes** (Peróxido, Cloro, Ozônio, Coenzima): suplementos raros, uma cópia só. Para a evolução não depender só da sorte, quando uma arma chega ao MAX sem o reagente dela, o reagente passa a ter peso ×10 nas próximas ampolas até sair. A evolução continua pela cápsula de prata do chefe ([itens.md](itens.md#o-que-as-moléculas-e-o-chefe-soltam)).

## 3. Drops: XP com chance, ampolas e agregados

Hoje toda molécula solta uma gema de XP. Com a mudança, a decomposição vira um sorteio, e o mapa passa a ter coisas que valem um desvio.

**O que uma molécula solta ao ser decomposta** (cada linha é um sorteio separado):

| Drop | Molécula comum | Fragmento da cascata | Molécula forte | Agregado | Chefe |
| --- | --- | --- | --- | --- | --- |
| Gema de XP | 60% | 40% | 100% | 100% (gema vermelha) | 100% |
| ATP | 3% (como hoje) | 3% | sempre | sempre | sempre |
| Ampola | 0,3% | — | 3% | sempre, mínimo Raro | sempre, mínimo Ultra raro, além da cápsula |

- **A gema que cai vale mais.** O XP da molécula é dividido pela chance (60% → ×1,67), então o XP médio por minuto continua o mesmo e a curva da [economia.md](economia.md) não muda. Cai menos gema, cada uma vale mais, e a tela fica mais limpa: o limite de gemas no chão quase não é atingido.
- **Sorte** multiplica a chance de ampola (não a de gema).
- **Garantia:** se passar 90 s sem ampola de molécula comum, a chance dobra até sair uma. E no máximo uma ampola de molécula comum a cada 20 s, para não virar chuva com muita Sorte.
- **Estresse** já dá mais XP e ATP; passa a dar também mais chance de ampola.

**A ampola.** Uma ampola de vidro, do remédio injetável, no lugar do baú. Fica no chão até ser tocada (o raio de coleta não puxa, como a cápsula), com um brilho branco que não revela a raridade. Ao tocar, a run pausa por um instante, a ampola quebra, o suplemento aparece com a moldura da raridade e um toque (ou 1,5 s no PC) volta à run. As ampolas são grátis: quem paga é o desvio até elas no meio das moléculas.

**Agregados (mini chefes).** Moléculas fortes que se juntaram numa massa só, como uma placa:

- Um agregado nasce a cada 2 minutos, a partir do minuto 2, menos nos minutos de chefe (5, 10, 15...). É a molécula forte mais comum na onda do momento: Agregado de amido, de triglicerídeo ou de cortisol.
- Vida ×12 da molécula base (× dificuldade), tamanho ×1,5, um pouco mais lento, dano de contato "forte". Contorno vermelho e uma seta na borda da tela enquanto está fora de vista.
- Ao ser decomposto, se quebra na cascata normal (um Agregado de triglicerídeo solta vários triglicerídeos) e sempre solta uma ampola de raridade mínima Rara e uma gema vermelha.
- Conta para a Especificidade e o Anticorpo, como o chefe.

## 4. Sinapses e estruturas

A sinapse é onde a dopamina age: um neurônio solta o neurotransmissor e o outro responde. No mapa, é o santuário de carga do Megabonk: um círculo no chão em que o agente precisa ficar até a barra encher, enquanto as moléculas continuam vindo.

**Sinapse:**

- Círculo de 48 px de raio (3 tiles), com borda pontilhada ciano e um anel de progresso.
- Dentro do círculo, a barra enche em 6 s; fora, esvazia devagar (1/4 da velocidade), sem zerar. Cheia, a sinapse dispara e some.
- **Recompensa:** abre uma tela como a do level up com 3 cartões, cada um um bônus de atributo sorteado entre **todos** os atributos (inclusive os que não são receptores), com raridade pela Sorte. O valor é o de um nível de receptor da raridade sorteada. Às vezes um cartão vem com +1 Rerrolar, Pular ou Banir. Não ocupa espaço e não tem teto além do teto na run do atributo.
- **Sinapse potenciada** (10% das sinapses; o nome vem da potenciação de longo prazo, a base da memória): borda dourada, enche em 10 s e os três cartões são Lendários ou Especiais.

**Outras estruturas:**

| Estrutura | No Megabonk | Como funciona |
| --- | --- | --- |
| **Foco inflamatório** | Santuário de desafio | Ao entrar, nasce um Cerco inflamatório (formação da [fase 5.6](roadmap.md#fase-56-variedade-da-run)) em volta do agente. Decompor o cerco inteiro em 30 s dá uma ampola de raridade mínima Rara; falhar não custa nada além do risco |
| **Coágulo** | Maldição do chefe | Tocar chama um agregado extra na hora, 50% mais forte, que solta duas ampolas. Para quem quer arriscar cedo |
| **Glândula adrenal** | Santuário da ganância | Tocar dá ATP na hora (20 moedas × Rendimento) e +5% de Estresse até o fim da run. Pode ser tocada 3 vezes, cada vez mais estresse |
| **Ribossomo** (depois) | Micro-ondas | Duplica um suplemento à escolha, gastando outro da mesma raridade. Uma vez por ribossomo |
| **Farmácia** (depois) | Mercador | Vende 3 suplementos pelo ATP da run. Fica para depois, porque gastar ATP na run mexe na economia da [fase 3](decisoes/0021-meta-progressao.md) |

**Onde aparecem:**

- Antes dos mapas gerados ([fase 5.7](mapas.md)): nascem num anel fora da tela, como as vesículas. No começo da run há sempre uma sinapse a uns 300 px do agente; depois, uma estrutura nova a cada 45 s, no máximo 4 no mapa, sorteada por peso (Sinapse 60, Foco 15, Glândula 15, Coágulo 10).
- Com os mapas gerados: viram **pontos de interesse** dos blocos ([mapas.md](mapas.md#pontos-de-interesse)), em média 1 a cada 3 blocos, sempre numa clareira sem obstáculos no círculo.
- Uma seta pequena na borda da tela aponta a estrutura mais perto, na cor dela (ciano, dourado, vermelho).

## Como fica a run

Uma run de 10 minutos, com os números acima, tem mais ou menos: 20 level ups (armas e receptores), 4 agregados e um ou dois chefes, de 6 a 10 ampolas (uns 8 suplementos com as do chefe e as dos agregados) e de 5 a 8 estruturas no mapa, das quais umas 4 sinapses. O jogador para de só andar em círculo: sai atrás de uma sinapse, segura a posição enquanto a barra enche, volta para pegar a ampola do agregado. O build se monta em três camadas: as 4 armas e os 4 receptores, escolhidos; os suplementos, sorteados; e os bônus das sinapses, que preenchem o que faltou.

## Na interface

- **HUD:** a segunda linha de ícones passa a mostrar os receptores (4 espaços, borda ciano). Os suplementos não entram na HUD, só um aviso curto ao pegar.
- **Level up:** título `ESCOLHA UMA ARMA OU RECEPTOR`; a carta de nível de arma ganha a moldura e a faixa da raridade ([ui-cronico.md](ui-cronico.md#level-up)).
- **Sinapse:** a mesma tela do level up, com o título `SINAPSE` e sem Rerrolar, Pular e Banir.
- **Pausa:** aba Arsenal com armas, receptores e a grade de suplementos; aba Atributos mostra de onde vem cada bônus (receptor, suplemento, sinapse, Laboratório).
- **Compêndio:** seções "Receptores" e "Suplementos", com silhueta para os que faltam.
- **Sprites:** ícone de 16×16 de cada receptor (os 31 ícones de modificador já existem e cobrem quase todos), de cada suplemento, da ampola (fechada e quebrando), do agregado (contorno) e das estruturas (círculo da sinapse, foco, coágulo, glândula).

## Parâmetros

Quando virar código:

- `passives.json` vira `receptors.json` (16 receptores, com `unlockCost` dos desbloqueáveis); `rarities.json` não muda.
- `supplements.json`: raridade, atributo e valor ou efeito de cada suplemento, e o peso dos reagentes quando a arma está no MAX.
- `drops.json` ganha: chance de gema por tipo de molécula, chance de ampola por tipo, garantia e intervalo mínimo, raridade mínima por fonte.
- `run.json` ganha os agregados: intervalo, minuto inicial, multiplicadores de vida, tamanho e velocidade.
- `structures.json`: raio e tempo da sinapse, chance da potenciada, intervalo de nascimento, máximo no mapa, pesos, e os números do foco, do coágulo e da glândula.

## O que falta decidir

- [ ] Os nomes funcionam: Receptor, Suplemento, Ampola, Agregado, Sinapse, Sinapse potenciada, Foco inflamatório, Coágulo, Glândula adrenal?
- [ ] O nível de arma passa a ter raridade, como no Megabonk, ou continua sem?
- [ ] Os reagentes viram suplementos (com a ajuda quando a arma está no MAX), ou continuam como carta no level up ocupando um espaço de receptor?
- [ ] Os 6 receptores desbloqueáveis saem por ATP agora, ou esperam as conquistas?
- [ ] 60% de chance de gema é o ponto certo, ou a mudança deve ser mais forte (40%) para a ampola chamar mais atenção?
- [ ] As ampolas são grátis, ou parte delas fica no mapa custando ATP da run, como os baús pagos do Megabonk?
- [ ] 6 s para encher a sinapse é pouco ou muito no pico de 5 minutos?
- [ ] Ribossomo e Farmácia entram depois, ou nem entram?

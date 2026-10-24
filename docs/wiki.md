# Wiki do jogo (Compêndio)

Textos da wiki que o jogador lê dentro do jogo, no Compêndio. Cada seção `##` é uma página e cada `###` é um verbete. Escreva para quem joga: frases curtas, sem termos de programação, explicando o que acontece e como usar a seu favor.

> **Para quem mexe no jogo:** os números aqui vêm dos JSON de `src/config/` (indicados em cada página). Mudou uma mecânica ou um número que aparece no texto, atualize este arquivo no mesmo commit. O jogo lê este arquivo direto (Compêndio › Guia do jogo): `##` vira uma categoria do guia, `###` um verbete, e os verbetes com o nome de um agente, arma, item ou estrutura viram o texto da ficha dele no registro; listas e tabelas viram linhas, e a frase "Números de ..." do começo de cada página não aparece para o jogador.

---

## Como jogar

*Números de `run.json`, `economy.json` e `stats.json`.*

### O que é uma run
Você controla um agente dentro do organismo: uma molécula de remédio contra as moléculas que fazem mal. Você só anda; o agente ataca sozinho. A run acaba quando as interações do agente acabam.

### Primeira run
Na primeira run do save, cartões no terço de baixo da tela ensinam o básico sem pausar o jogo: mover, deixar o agente agir, pegar as gemas, soltar o especial e sobreviver. Cada cartão some quando você faz o que ele pede. O do especial só aparece com uma carga pronta, com uma seta em cima do botão. "Pular tutorial" fecha todos.

### Interações
São a vida do agente: o estoque de moléculas dele. Cada molécula inimiga que encosta se liga ao agente e gasta interações. A barra embaixo do agente mostra quanto sobrou; abaixo de 25% a tela pulsa em vermelho.

### Movimento
No celular, encoste o dedo em qualquer lugar e arraste: o joystick aparece onde você tocou. No PC, use as setas ou WASD. Esc ou P pausam.

### Especial
Cada agente tem um especial, disparado pelo botão grande no canto (ou Espaço no PC). Ele recarrega com o tempo; o número no botão diz quantos segundos faltam e o `x1` no canto mostra as cargas guardadas.

### Experiência e nível
Moléculas decompostas soltam gemas azuis. Passe perto para coletar. Com muitas gemas no chão, as novas se juntam à gema mais perto, que fica valendo mais. Encheu a barra do topo, você sobe de nível e escolhe uma arma ou um receptor.

### Ondas e chefes
A dificuldade sobe com o tempo: nascem mais moléculas e cada uma nasce com mais vida, mais dano e um pouco mais rápida. O dano de contato dobra a cada 7 minutos, a velocidade sobe 1,2% por minuto, sem parar, e depois dos 12 minutos, a vida também dobra a cada 4 minutos: por volta dos 20 minutos as moléculas ficam muito fortes, e só uma build boa e em movimento passa disso. Desde o começo elas aguentam mais de um golpe das armas iniciais, então ficar parado não segura a run. A cada 5 minutos vem um pico de onda (o tempo fica laranja), com mais moléculas, seguido de um respiro curto. A cada 5 minutos também aparece um chefe, que depende do local do corpo (veja Chefes, em Moléculas). Aos 15 minutos chega a Placa de ateroma, o chefe de fim de caso.

### Empurrão
Os golpes empurram as moléculas um pouco para trás (Repulsão), mas cada molécula só é empurrada de novo depois de um terço de segundo, e o empurrão fica mais fraco com o tempo de run: pela metade aos 8 minutos. Moléculas fortes recebem metade do empurrão, os agregados quase nada, e o chefe não é empurrado.

### Formações
A cada 90 segundos vem uma formação, com aviso no topo e uma seta do lado de onde ela vai entrar:
- **Pico glicêmico:** enxame de açúcares que atravessa a tela em linha reta.
- **Parede lipídica:** fileira lenta de lipídios que varre o mapa.
- **Surto de cortisol:** um cortisol no meio de um grupo acelerado de adrenalinas.
- **Surto oxidativo:** radicais em três diagonais, rápidos.
- **Maré tóxica:** fileira larga e lenta de toxinas.
- **Cerco inflamatório:** anel de moléculas que fecha em volta de você.

A doença do indivíduo escolhe qual vem: com a Física baixa, quase só açúcares e lipídios. As moléculas de formação soltam gema menos vezes.

### Crises
Em cada pico de onda (a cada 5 minutos) vem uma crise: a formação da doença em dobro, dos dois lados, com o nome no topo (Crise glicêmica, Crise de estresse...) e o mapa tingido enquanto dura.

### Agregados
Num momento sorteado, pelo menos um por minuto (de 20 a 60 segundos depois do anterior), nasce um agregado: a molécula forte mais comum no momento, grudada numa massa só. É gigante (2,2 vezes o tamanho), roxa, com um brilho dourado pulsando em volta, mais lenta e tem 12 vezes a vida, com uma seta na borda da tela quando está longe. Se você deixar o agregado muito para trás, ele reaparece na sua frente, logo fora da tela na direção em que você anda, com a vida que tinha. Decompor um agregado sempre solta uma ampola Rara ou melhor e uma gema vermelha, e ele se quebra em cascata como a molécula normal. A doença do indivíduo decide qual molécula vira agregado.

### Decomposição em cascata
Moléculas fortes não somem de uma vez: elas se quebram em moléculas menores, que continuam vindo. O Amido vira Maltose, que vira Glicose. Vale planejar a área de ataque para as cascatas.

### Afinidade
Cada agente quebra melhor alguns tipos de molécula. Contra o tipo forte, o dano é 1,5×; contra o tipo fraco, 0,5×. O número de dano mostra: ciano é afinidade forte, cinza é fraca.

### Números na tela
Branco é dano comum. Amarelo com "!" é catálise (crítico). Ciano é afinidade forte, cinza é fraca. Vermelho sobre o agente é interação perdida; verde é recuperação. Dá para esconder os números de dano nas Opções.

### ATP na run
Algumas moléculas decompostas soltam ATP, a moeda do jogo (moeda dourada no chão). Com tantas moléculas na tela, é poucas: uma em cada 60, mais ou menos. Moléculas fortes e o chefe sempre soltam, e quanto mais tempo de run, mais cada uma vale. O ATP fica com você no fim da run.

### Pausa
A pausa mostra suas armas e receptores (aba Arsenal), todos os atributos com o valor atual e a base, e embaixo de cada um de onde vem o bônus: Laboratório, organismo, local (o +10% de ATP do Qualquer lugar), perfil do agente, receptor, suplemento, sinapse, Mutação ou estrutura (aba Atributos) e os números da run (aba Run). Desistir encerra a run e leva para a tela de fim.

---

## Agentes da run

*Números de `agents.json`. A ação e o especial de cada um estão na aba Agentes do menu.*

### Dopamina
Neurotransmissor da recompensa. A generalista: efetividade média contra tudo.
- **Ação:** Pulso dopaminérgico, anéis que saem do agente e acertam tudo por onde passam.
- **Especial:** Pico de recompensa. Por alguns segundos, pulsos muito mais rápidos e maiores. Depois vem uma queda, com a ação mais lenta.
- **No organismo:** sobe Mental, Executiva e Social. Colateral: tira um pouco da Física.
- **Sinergia:** ✚ no Cérebro (Mental).
- **Perfil (receptor nativo):** Receptor D2, −8% de recarga por nível.

### Lipase
Enzima que quebra gordura. Forte contra lipídios, fraca contra o resto.
- **Ação:** Hidrólise, golpes curtos e fortes no inimigo mais próximo, com respingo em volta.
- **Especial:** Emulsão. Uma área no chão que deixa os lipídios dentro dela frágeis.
- **No organismo:** sobe muito a Física. Colateral: tira um pouco da Mental.
- **Sinergia:** ✚ no Intestino (Física). Não entra no Cérebro (⊘).
- **Perfil (receptor nativo):** Sítio ativo, +10% de dano contra lipídios por nível.
- **Desbloqueio:** 1.200 ATP.

### Insulina
Hormônio que tira o açúcar da circulação. Forte contra açúcares, fraca contra o resto.
- **Ação:** Campo de captação, que puxa os açúcares para perto e os absorve.
- **Especial:** Captação. Puxa todos os açúcares da tela de uma vez e causa dano neles.
- **No organismo:** sobe a Física e um pouco a Mental. Colateral: tira um pouco da Executiva.
- **Sinergia:** ✚ no Fígado (Física).
- **Perfil (receptor nativo):** Receptor de insulina, +25% de Raio de coleta por nível.
- **Desbloqueio:** 2.000 ATP.

### Vitamina C
Antioxidante. Forte contra radicais livres, média contra inflamação, fraca contra o resto.
- **Ação:** Disparo antioxidante, dois disparos que atravessam um inimigo.
- **Especial:** Escudo antioxidante. Por 6 segundos, o próximo golpe que você levaria é bloqueado (aparece BLOQUEADO).
- **No organismo:** sobe a Física e um pouco a Executiva. Sem colateral.
- **Sinergia:** ✚ no Pulmão (Física).
- **Perfil (receptor nativo):** Transportador SVCT, +1 de Membrana por nível.
- **Desbloqueio:** 1.200 ATP.

### Cafeína
Estimulante leve. Média contra açúcares e radicais, fraca contra o resto, e anda 30% mais rápido.
- **Ação:** Rajada, disparos rápidos e fracos divididos em volta do agente.
- **Especial:** Alerta. Um anel de 16 disparos e metade da recarga devolvida na hora.
- **No organismo:** sobe a Executiva. Colateral: tira Mental (ansiedade) e um pouco da Física (sono).
- **Sinergia:** ✚ no Pulmão (Executiva).
- **Perfil:** +30% de Mobilidade desde o começo. Receptor nativo: Receptor de adenosina, +5% de Mobilidade por nível.
- **Desbloqueio:** 1.800 ATP.

### Venvanse
Estimulante de foco. Média contra tudo; forte contra chefes e alvos isolados.
- **Ação:** Feixe de foco, um raio fino e muito forte que para no primeiro inimigo da linha.
- **Pró-fármaco:** começa a run com 40% do dano e chega ao dano cheio aos 3 minutos.
- **Especial:** Hiperfoco. Por 5 segundos, os inimigos ficam 65% mais lentos (a tela fica violeta).
- **No organismo:** sobe muito a Executiva. Colateral: tira Física e um pouco da Mental.
- **Sinergia:** ✚ na Corrente sanguínea (Executiva).
- **Perfil (receptor nativo):** Transportador de dopamina, +10% de dano contra chefes e moléculas fortes por nível.
- **Desbloqueio:** 2.500 ATP.

### Serotonina
Neurotransmissor do bem-estar. Forte contra hormônios do estresse, média contra inflamação, fraca contra o resto.
- **Ação:** Aura calmante, que desacelera os inimigos em volta e os deixa frágeis.
- **Especial:** Calmaria. Por 8 segundos, as auras do estresse ficam desligadas, e as moléculas de estresse levam dano.
- **No organismo:** sobe a Mental e um pouco a Social. Colateral: tira um pouco da Executiva.
- **Sinergia:** ✚ no Intestino (Mental), onde mora quase toda a serotonina do corpo.
- **Perfil (receptor nativo):** Receptor 5-HT1A, +8% de Difusão por nível.
- **Desbloqueio:** 1.500 ATP.

### Ocitocina
Hormônio do vínculo. Forte contra hormônios do estresse, fraca contra o resto.
- **Ação:** Aliados, três moléculas rosa que orbitam o agente e batem em quem encostam.
- **Especial:** Vínculo. Dobra os aliados por 6 segundos.
- **No organismo:** sobe a Social e um pouco a Mental. Sem colateral.
- **Sinergia:** ✚ no Cérebro (Social).
- **Perfil (receptor nativo):** Receptor de ocitocina, +10% de Sorte por nível.
- **Desbloqueio:** 2.200 ATP.

### Álcool desidrogenase
Enzima que quebra o álcool. Forte contra toxinas, fraca contra o resto.
- **Ação:** Golpes em sequência, rápidos, no inimigo mais próximo.
- **Termina a cascata:** toxina que ela decompõe não se quebra em outra nem deixa poça.
- **Especial:** Desintoxicação. Limpa todas as poças tóxicas e fere todas as toxinas da tela.
- **No organismo:** sobe a Social e um pouco a Executiva. Sem colateral.
- **Sinergia:** ✚ no Fígado (Social). Não entra no Cérebro (⊘).
- **Perfil (receptor nativo):** Sítio do zinco, +10% de dano contra toxinas por nível.
- **Desbloqueio:** 1.500 ATP.

---

## Armas e evoluções

*Números de `weapons.json` e `meta.json`.*

### Como as armas funcionam
Além da ação própria, o agente carrega até 4 armas (até 6 com melhorias). Elas aparecem nas opções de level up e sobem até o nível 8. Arma no nível máximo com o reagente certo pode evoluir: a opção de evolução aparece no próximo level up.

### Radical Livre
Dispara radicais OH• no inimigo mais próximo. **Evolui com Peróxido em Reação de Fenton**, uma rajada de radicais: o peróxido com ferro gera OH• em massa.

### Jato Ácido
Cone curto e forte na direção do inimigo mais próximo. **Evolui com Cloro em Água Régia**, um cone largo que corrói até inimigos fortes (a água régia dissolve até ouro).

### Nuvem de Elétrons
Elétrons giram em volta do agente e acertam o que passa. **Evolui com Argônio em Plasma**, seis cargas violetas que giram rápido e batem a cada 0,3 s (o argônio vira plasma numa descarga elétrica).

### Catalisador
Campo em volta do agente: dano baixo e contínuo, e quem está dentro recebe mais dano. **Evolui com Coenzima em Enzima**, uma aura que cresce a cada molécula decomposta.

### Poça de Solvente
Arremessa um frasco que vira uma poça: dano por segundo e lentidão. **Evolui com Éter em Solvente universal**, duas poças grandes que duram mais e prendem quem entra. **Desbloqueio:** 200 ATP.

### Reação em Cadeia
O disparo acerta um inimigo e salta para o próximo. **Evolui com Urânio em Fissão**, dois núcleos que se partem de molécula em molécula por até 8 saltos. **Desbloqueio:** 500 ATP.

### Raio UV
Feixe em linha reta que atravessa todos os inimigos no caminho. **Evolui com Ozônio em Laser**, um feixe quase contínuo que varre a tela. **Desbloqueio:** 800 ATP.

### Armas bloqueadas
Armas que você ainda não desbloqueou no Arsenal não aparecem no level up. Desbloqueie com ATP na aba Arsenal do menu.

---

## Level up e receptores

*Números de `passives.json`, `rarities.json`, `meta.json` e `stats.json`.*

### Escolher no level up
A cada nível você escolhe uma entre 3 cartas: uma arma nova, o próximo nível de uma arma, um receptor novo ou o próximo nível de um receptor. Os receptores ficam na linha de baixo da HUD.

### Receptores
O receptor é a proteína da célula onde o remédio se liga. Cada um sobe um atributo só, até o nível 5:
- **Ataque:** Reatividade (dano), Metabolismo (ataca mais rápido: recarga menor), Difusão (área), Cinética (velocidade dos disparos e alcance), Chance de catálise (crítico) e Dose (mais projéteis, até 3 níveis; só aparece com uma arma de disparos, órbita ou poça).
- **Defesa:** Interações (vida máxima), Membrana (menos dano por golpe) e Homeostase (recupera interações com o tempo).
- **Coleta e risco:** Mobilidade, Raio de coleta, Aprendizado (mais XP), Sorte e Estresse. **Estresse** deixa as moléculas mais fortes e mais rápidas, mas dá mais XP: risco por recompensa.
- **Mutação:** cada nível soma um atributo sorteado, de qualquer tipo.

### Receptores bloqueados
Dose, Meia-vida, Aprendizado, Sorte, Estresse e Mutação começam bloqueados e se compram com ATP no Arsenal. Bloqueado, o receptor não aparece no level up.

### Espaços
O agente tem 4 espaços de arma (a ação dele conta) e 4 de receptor. O Laboratório aumenta os dois, até 6.

### Raridade
Cada receptor e cada nível de arma vem com uma raridade, que multiplica o ganho: Comum (1×), Incomum (1,5×), Raro (2×), Ultra raro (2,5×), Lendário (3×) e Especial (4×). A cor da moldura da carta mostra a raridade. Arma nova e evolução não têm raridade.

### Sorte
Quanto mais Sorte, mais aparecem as raridades altas.

### Perfil do agente
Cada agente tem um receptor nativo, que não ocupa espaço e sobe sozinho: um nível a cada 10 níveis da run, até o nível 5 no nível 50. Ele aparece primeiro na linha dos receptores, com moldura dourada.

### Superdosagem
Quando todas as armas e todos os receptores estão no máximo, o level up passa a oferecer a Superdosagem: bônus pequenos de atributo, junto da Nova dose. Cada atributo para de aparecer quando chega ao teto da run; com todos no teto, sobram a Nova dose e a Fosfocreatina (ATP).

### Rerrolar, Pular e Banir
- **Rerrolar** sorteia outras cartas.
- **Pular** dispensa o level up.
- **Banir** tira uma carta da run inteira.

Começam em zero: vêm do Laboratório e do setor Executiva do organismo.

### Reagentes
Peróxido, Cloro, Ozônio, Coenzima, Argônio, Éter e Urânio liberam a evolução. Eles vêm das ampolas (veja Suplementos e ampolas).

### Os outros atributos
Penetração, Reação em cadeia, Força da catálise, Repulsão, Especificidade, Esquiva, Absorção, Tolerância, Segunda dose e Reflexo não saem mais no level up. Vêm dos suplementos, do Laboratório e da Mutação.

---

## Moléculas

*Números de `enemies.json` e `organism.json`. O Compêndio mostra cada molécula depois que você a encontra.*

### Tipos de molécula
Cada molécula tem um tipo: açúcar, lipídio, estresse, radical, toxina ou inflamação. O tipo decide a afinidade dos agentes, qual setor do organismo puxa aquela família e o jeito que ela se mexe.

### Açúcares
Glicose e Frutose são pequenas e chegam em grupos. Maltose e Sacarose se quebram em Glicose e Frutose. O Amido é forte e se quebra em Maltose.

### Lipídios
Ácido graxo é comum; o Triglicerídeo é forte e se quebra em Glicerol e Ácidos graxos. São lentos e resistentes.

### Estresse
Têm **aura**: as moléculas perto andam mais rápido e levam menos dano (o anel laranja tracejado). O Cortisol é forte, fica longe de você e se quebra em Adrenalina; decomponha ele primeiro. A Adrenalina é rápida e chega em grupos; a Noradrenalina tem uma aura curta. As duas somem sozinhas depois de alguns segundos, sem dar nada, e decompor uma delas te dá **Adrenalina**. Vêm muito quando a Mental está baixa.

### Radicais livres
São **erráticos**: mudam de direção o tempo todo. O Radical hidroxila é pequeno e muito rápido. O Peroxinitrito se quebra em radicais hidroxila e o Superóxido, em Peróxido de hidrogênio. O **Peróxido** estoura ao encostar em você, tira 15 interações e some sem dar nada. Vêm muito quando a Executiva está baixa.

### Toxinas
O Etanol e a Amônia chegam em grupos. O Acetaldeído se quebra em Etanol e deixa uma **poça tóxica** (verde) por 3 segundos. Vêm muito quando a Social está baixa.

### Inflamação
A **Citocina** fica parada e solta uma Bradicinina a cada 4 segundos, até 6 por vez. Decomponha a Citocina para parar o fluxo. As duas vêm no Cerco inflamatório.

### Poças e efeitos
Dentro de uma poça tóxica você perde 1 interação por segundo e fica com **Lentidão** (−20% de Mobilidade). A **Adrenalina** dá +30% de Mobilidade por 4 segundos. Os dois aparecem na fila de efeitos, embaixo do retrato.

### Chefes
A cada 5 minutos vem o chefe do local: **Partícula de LDL** na Corrente sanguínea (tanque, se quebra em Triglicerídeos e Ácidos graxos), **NAPQI** no Fígado (deixa poças por onde passa), **Amilopectina** no Intestino (solta Glicoses), **Benzopireno** no Pulmão (errático, solta Radicais hidroxila) e **CRH** no Cérebro (aura grande). Aos 15 minutos, em qualquer local, nasce uma vez a **Placa de ateroma**: parada, enorme, soltando Ácidos graxos. Todo chefe solta a cápsula. O chefe não é empurrado pelos golpes.

---

## Itens no mapa

*Números de `drops.json`. O Compêndio mostra cada item depois que você o coleta.*

### Vesículas
Bolsas translúcidas paradas no chão, com dopamina dentro. Aparecem fora da tela, uma a cada 15 segundos (no máximo 6). Qualquer golpe rompe a vesícula, que solta um item. As armas com mira atiram nela quando ela está mais perto que a molécula mais perto. Itens raros só começam a sair depois de certo nível da run.

### Coleta
O Raio de coleta puxa os itens como puxa as gemas. A Sorte deixa os itens raros mais comuns, menos o ATP e a Glicose.

### ATP, Glicose e Glicogênio
O ATP vale uma moeda; a Glicose, 5; o Glicogênio, 25 (a partir do nível 5). A moeda vale mais quanto mais tempo de run, e o Rendimento multiplica tudo.

### Soro
Recupera 30 interações.

### Gelo seco
A partir do nível 4. Congela todas as moléculas por 10 segundos: elas param e não gastam suas interações, e você as empurra ao passar.

### Osmose
A partir do nível 12. Todas as gemas de XP do mapa correm até você.

### Lisossomo
A partir do nível 8. Decompõe todas as moléculas na tela, com cascata e gemas. O chefe não é afetado.

### Bico de Bunsen
Lança-chamas enorme na direção em que você anda, por 10 segundos: derrete quase na hora qualquer molécula comum que encostar no leque. Chefes e agregados só levam o dano normal do fogo. Usa a sua Reatividade e a sua Difusão.

### Glucagon e Febre de ATP
A partir do nível 30. Puxa todo o ATP do chão e começa a Febre de ATP: por 10 segundos uma em cada quatro moléculas decompostas solta ATP, e cada ATP coletado soma um quarto de segundo à febre, até 15 segundos.

### Gemas de XP
Nem toda molécula solta gema: a comum solta em 60% das vezes, a que nasceu da cascata em 40%, e a forte e o chefe sempre. A gema que cai vale mais para compensar, então o XP no fim é o mesmo. A cor mostra o valor: ciano até 2 de XP, verde até 9, vermelha mais que isso. Com gemas demais no chão, o XP novo se junta numa gema só.

### Cápsula do chefe
Todo chefe solta uma cápsula, que você precisa tocar. Ela sobe um nível de 1, 3 ou 5 armas ou receptores que você já tem, com raridade pela Sorte, e dá ATP. A Sorte também aumenta a chance de 3 e 5. As seis primeiras cápsulas do save dão 1, 1, 3, 1, 1 e 5.

### Cápsula de prata
Depois dos 10 minutos a cápsula é de prata: se uma arma estiver no nível máximo com o reagente certo, ela evolui.

### Cápsula de agente
A partir dos 3 minutos, uma vez por run e com 35% de chance, nasce longe de você uma cápsula de vidro com um agente que você ainda não liberou. Uma seta dourada na borda da tela mostra o caminho. Toque nela para libertar o agente. Ele fica liberado de graça no fim da run, mesmo se a run acabar logo depois.

### Fosfocreatina
Quando a cápsula ou o level up não têm mais o que subir, você ganha Fosfocreatina: ATP igual a 10 moedas.

---

## O mapa

*Números de `map.json` (locais em `locals` e em cada ambiente) e de `organism.json` (`synergy`).*

### Mapas gerados
Cada run gera o próprio mapa, e duas runs nunca têm o mesmo chão. No começo aparece o nome do mapa: o ambiente, a densidade e um código (a semente), que também ficam na pausa e no fim da run.

### Ambientes
O mapa é um de cinco lugares do corpo, escolhido por você (veja Locais do corpo): Corrente sanguínea (plasma, hemácias e colesterol), Fígado (placas de hepatócitos), Intestino (vilosidades e fibra), Pulmão (alvéolos e brônquios) e Cérebro (neurônios e astrócitos).

### Obstáculos
Bloqueiam você e as moléculas: use para despistar e afunilar. Nunca fecham um beco, e o começo da run fica sempre livre. O chefe e as moléculas de formação passam por cima.

### Destrutíveis
Quebram com golpes e às vezes soltam algo: a Gota de gordura (Fígado) solta ATP, a Bactéria (Intestino) e a Fuligem (Pulmão) soltam gema, a Placa amiloide (Cérebro) solta uma vesícula. As armas com mira atiram neles quando estão mais perto que a molécula mais perto (até uns 8 tiles). O chefe quebra os que encosta.

### Locais do corpo
Antes da run, a faixa acima do JOGAR abre a tela **Onde agir?**, com o corpo e os cinco locais. Começa só a Corrente sanguínea; os outros quatro abrem na primeira estrela (5 minutos) do primeiro caso e ficam abertos para sempre. Cada local dobra uma família de molécula e multiplica por 1,5 o que o agente cura no setor do local:
- **Intestino:** açúcares e lipídios ×2, setor Física.
- **Cérebro:** estresse ×2, setor Mental.
- **Pulmão:** radicais livres ×2, setor Executiva.
- **Fígado:** toxinas ×2, setor Social.
- **Corrente sanguínea:** não dobra nem multiplica nada. É o local neutro.

O local cujo setor está mais baixo no caso ganha o selo INDICADO. **Qualquer lugar** sorteia o local e dá +10% de ATP na run. O código do mapa leva o local: para jogar o mesmo mapa que um amigo, combine o local e a semente.

### Sinergia
Cada agente age melhor num local (✚): Dopamina no Cérebro (Mental), Lipase no Intestino (Física), Insulina no Fígado (Física). No par com sinergia, o perfil do agente começa no nível 1, e no fim da run ele soma +4 no setor da sinergia (cheio em 10 minutos, até o dobro) e o colateral cai pela metade. A run fica mais dura, porque a família do local é a que a doença já puxa, mas cura bem mais. A Lipase é uma enzima grande e não atravessa a barreira hematoencefálica (⊘): não entra no Cérebro.

### Densidade
Aberto, Padrão ou Denso: quantos obstáculos o mapa tem. Dentro do mesmo mapa há clareiras e trechos fechados.

### Ninhos de vesículas
Às vezes um grupo de 3 a 5 vesículas espera numa clareira: vale o desvio.

### Câmaras e corredores
Uma **câmara** é um anel fechado de obstáculos com uma entrada só e um destrutível no meio: dá para respirar lá dentro no pico, mas quem vem atrás entra pelo mesmo lugar. Um **corredor** são duas fileiras de obstáculos com uma passagem larga no meio: as moléculas se afunilam, bom para armas que acertam em linha, como o Raio UV e o Jato Ácido.

---

## Sinapses e estruturas

*Números de `structures.json`. Uma seta na borda da tela aponta a estrutura mais perto, na cor dela.*

### Sinapse
Um círculo rosa no chão. Fique dentro e o anel enche em 6 segundos; fora, ele esvazia devagar, sem zerar. Cheio, abre 3 cartões de bônus de atributo, que valem até o fim da run e não ocupam espaço de receptor, com raridade pela Sorte, entre todos os atributos do jogo (Rerrolar, Pular e Banir também podem aparecer). A run começa sempre com uma sinapse perto.

### Sinapse potenciada
Violeta, mais rara. Enche em 10 segundos e só oferece bônus Lendários ou Especiais.

### Foco inflamatório
Vermelho. Entrar chama um cerco de moléculas em volta de você. Decomponha todas em 30 segundos e ganhe uma ampola Rara ou melhor.

### Coágulo
Vinho. Tocar chama um agregado mais forte, que solta duas ampolas.

### Glândula adrenal
Laranja. Cada entrada dá ATP na hora e +5% de Estresse até o fim da run. Funciona três vezes.

### Quando aparecem
Uma estrutura nova a cada 45 segundos, fora da tela, até 4 no mapa. A Quimiotaxia (suplemento) faz as sinapses encherem mais rápido e põe uma estrutura a mais.

---

## Suplementos e ampolas

*Números de `supplements.json` e `drops.json`. O Compêndio mostra cada suplemento depois que você o toma.*

### Ampolas
A ampola é uma ampola de vidro de remédio injetável, parada no chão. Para abrir é preciso encostar nela (o Raio de coleta não puxa). Ela quebra e você toma um suplemento.

### De onde vêm as ampolas
- Molécula comum: chance pequena; molécula forte: chance maior. A Sorte e o Estresse aumentam as duas.
- Se passar 90 segundos sem ampola de molécula comum, a chance dobra até sair uma; e sai no máximo uma a cada 20 segundos.
- O chefe sempre solta uma ampola Ultra rara ou melhor, além da cápsula.

### Suplementos
Ficam até o fim da run, não ocupam espaço e acumulam: a segunda Creatina soma o mesmo bônus de novo, até o teto do atributo. A pausa mostra todos, com o número de cópias.

### Raridades
Comum, Raro, Ultra raro e Lendário, pela cor da moldura. A Sorte deixa os raros mais comuns.

### Os que sobem atributos
Creatina (dano), Vitamina (Sorte), Ferro (interações), Quimiotaxia (sinapses), Eletrólitos (recuperação), Cafeína (velocidade), Bicarbonato (empurrão), Ácido fórmico (devolve dano), Mucina (tempo sem levar dano), Glutamina (recupera ao decompor), Fluoresceína (alcance), Ginseng (recarga do especial), Surfactante (atravessa moléculas), Cobre (saltos), Anticorpo (dano em fortes e chefes), Mitocôndria (ATP), Enzima digestiva (dano crítico), Platina (chance de efeito), Nootrópico (+1 opção no level up) e Dose de reforço (+1 Segunda dose).

### Os de efeito
- **Nitrogênio líquido:** chance de congelar a molécula atingida por 1 segundo.
- **Aquaporina:** a cada 60 segundos todas as gemas correm até você. Não acumula: depois da primeira, não sai mais.
- **Eletrodo:** ao decompor, chance de uma faísca que atinge 3 moléculas perto.
- **Termita:** a molécula decomposta explode e queima as vizinhas.
- **Criopreservação:** ao perder interações, congela tudo na tela por 2 segundos (uma vez a cada 30). Não acumula: depois da primeira, não sai mais.

### Reagentes
Peróxido, Cloro, Ozônio, Coenzima, Argônio, Éter e Urânio saem das ampolas, não mais do level up. Com a arma certa no nível máximo, o reagente dela sai muito mais vezes, e a cápsula de prata faz a evolução.

---

## Menu e progressão

*Números de `meta.json` e `economy.json`.*

### ATP
A moeda do jogo, a molécula de energia das células. Vem da run, das estrelas do caso e do campo longo, e é gasta no Laboratório e nos desbloqueios.

### Laboratório
Árvore de melhorias permanentes que valem em todas as runs. Começa pela raiz (Interações) e se abre em seis caminhos: Força, Química, Corpo, Coleta, Controle e Especial. Um nó abre quando os nós ligados a ele têm pelo menos um nível. Cada nível custa 15% mais que o anterior. Tocar num nó mostra o que o atributo faz e quanto cada nível soma.

### Desbloqueios
Você começa com a Dopamina e quatro armas. Os outros oito agentes e as armas Poça de Solvente, Reação em Cadeia e Raio UV se desbloqueiam com ATP nas abas Agentes e Arsenal, ou de graça por uma conquista ou pela cápsula de agente.

### Conquistas
O botão da medalha, no trilho direito do caso, abre as Conquistas: metas de longo prazo lidas de tudo o que você já fez. A tela mostra a próxima, a que está mais perto de sair, e a lista inteira com o progresso. Cada conquista dá ATP ou libera de graça um agente ou uma arma. Se você já tinha comprado o que ela libera, ganha metade do preço em ATP. Elas saem no fim da run e na ALTA, e a ALTA não apaga as que você já tem.

| Conquista | Meta | Recompensa |
| --- | --- | --- |
| Primeira reação | Decompor 100 moléculas | +50 ATP |
| Metabolismo basal | Decompor 1.000 moléculas | +150 ATP |
| Catabolismo | Decompor 10.000 moléculas | +600 ATP |
| Lipólise | Decompor 300 triglicerídeos | libera Lipase |
| Glicólise | Decompor 2.000 açúcares | libera Insulina |
| Antioxidante | Decompor 1.000 radicais livres | libera Vitamina C |
| Desintoxicação | Decompor 800 toxinas | libera Álcool desidrogenase |
| Calma | Decompor 600 moléculas de estresse | libera Serotonina |
| Anti-inflamatório | Decompor 300 moléculas de inflamação | +300 ATP |
| Caçador de chefes | Decompor 5 chefes | libera Reação em Cadeia |
| Fim do caso | Decompor a Placa de ateroma | +500 ATP |
| Agregados | Decompor 10 agregados | libera Poça de Solvente |
| Farmácia | Abrir 20 ampolas | +300 ATP |
| Plasticidade | Disparar 10 sinapses | +300 ATP |
| Fôlego | Durar 10 minutos numa run | libera Cafeína |
| Resistência | Durar 20 minutos numa run | libera Raio UV |
| Hiperfoco | Chegar ao nível 30 numa run | libera Venvanse |
| Vínculo | Jogar com 4 agentes diferentes | libera Ocitocina |
| Veterano | Jogar 50 runs | +1.000 ATP |
| Primeira ALTA | Dar ALTA a um indivíduo | +1.000 ATP |
| Clínico geral | Dar ALTA a três indivíduos | +2.000 ATP |

### Casos anteriores
Cada indivíduo que recebe ALTA vira um caso curado, com quantas runs levou e o melhor tempo nele. Os dois mais recentes aparecem acima das estrelas, no palco do caso.

### Estrelas e baú
Cada caso tem três estrelas: sobreviver 5, 10 e 15 minutos. Cada estrela nova enche o baú do menu com ATP (40, 80 e 160). Toque no baú para coletar.

### Selos
O "!" vermelho numa aba diz que tem algo para comprar ali agora.

### Backup do save
Nas Opções, Exportar copia um código e baixa um arquivo com o seu progresso; Importar aceita o código ou o arquivo, para continuar em outro aparelho.

---

## Campo longo

*Números de `idle.json`.*

### O que é
O campo que trabalha sozinho. Moléculas descem do topo até a BASE, e os agentes do pool, embaixo, disparam nelas. Cada molécula decomposta dá ATP. O campo roda o tempo todo, até durante a run e com o jogo fechado.

### Ondas e a BASE
Cada onda vencida traz a próxima, mais forte e mais valiosa. Cada molécula que chega na BASE gasta interações dela (10 no total). Se a BASE zerar, o campo volta 3 ondas e recomeça com a BASE cheia: nunca para de produzir.

### Pool de agentes
Toque num espaço para escolher quem fica ali, subir o nível ou desbloquear um agente. Começa com 3 espaços abertos (até 5 com melhoria).

### Agentes do campo longo
- **Ômega-3:** disparo médio e constante. Sobe Física e Mental. Começa liberado.
- **Melatonina:** disparo lento em área. Rende mais com o jogo fechado. Sobe Física e Mental. 500 ATP.
- **Magnésio:** aura perto da base que enfraquece e desacelera o que chega. Sobe a Mental. 900 ATP.
- **Vitamina D:** disparo forte e raro, que fica mais forte quanto mais tempo passa na base. Sobe Física e Mental. 1.400 ATP.
- **Endorfina:** rajadas curtas de disparos rápidos. Sobe Mental e Social. 2.000 ATP.

### Melhorias do campo
Ritmo de disparo, Espaços na base e Teto offline. Ficam no botão Melhorias, acima do pool.

### Com o jogo fechado
O campo continua produzindo por até 8 horas (mais com o Teto offline). Ao voltar, o menu mostra quanto ele produziu enquanto você estava fora.

### x2
O botão x2 acelera o campo enquanto você olha para ele.

---

## Organismo

*Números de `organism.json`, `agents.json` e `idle.json`.*

### O indivíduo
Você está tratando uma pessoa. Cada indivíduo começa com uma doença: um setor de saúde baixo. O objetivo é deixá-lo saudável.

### Setores de saúde
Quatro setores, de 0 a 100. Em 50 não fazem nada; acima ajudam, abaixo atrapalham:
- **Física:** interações no começo da run (até +30 em 100, até −40 em 0).
- **Mental:** recarga do especial (até 25% mais rápida, ou 40% mais lenta).
- **Executiva:** rerrolagens e opções no level up.
- **Social:** ATP do campo longo (até +50%, ou −40%).

### Doenças e moléculas
O setor baixo traz mais moléculas da família dele: Física baixa traz açúcares e lipídios; Mental baixa, hormônios do estresse; Executiva baixa, radicais livres; Social baixa, toxinas. Escolha agentes fortes contra o que a doença traz.

### Como a saúde muda
- **Run:** no fim, o agente aplica o efeito dele no organismo, proporcional a quanto você durou (efeito cheio em 10 minutos, até o dobro). Quase todo agente tem um colateral: tira um pouco de outro setor, como um remédio de verdade. O local soma: ×1,5 no setor do local e, no par com sinergia, +4 e colateral pela metade (veja O mapa). O fim da run mostra cada parte numa linha.
- **Campo longo:** os agentes da base empurram os setores deles um pouco por hora, também com o jogo fechado.
- **Retorno decrescente:** perto de 100 o setor quase não sobe; perto de 0 cai menos.

A aba Organismo mostra, em cada setor, quem sobe ele na run (pontos a cada 10 minutos), quem sobe no campo longo (pontos por hora) e quem derruba como colateral, com os números atuais, e os pares com sinergia (✚).

### Saúde e produção
A saúde geral multiplica o ATP do campo longo: com média 50, 1×; com média 90, 1,4×.

### ALTA
Com os quatro setores acima de 70, abre a ALTA na aba Organismo. O próximo indivíduo tem outra doença, começa mais doente e é 25% mais difícil (as moléculas têm mais vida). Zera o Laboratório, o campo longo e o ATP; agentes e armas desbloqueados continuam.

### Pontos herdados
Na ALTA, o ATP ganho no indivíduo vira pontos herdados (a raiz quadrada do ATP dividido por 1.000). Cada ponto dá +10% de ATP para sempre, na run e no campo longo.

---

## Glossário

### Agente
A molécula que você usa: um remédio ou substância real. Na run você controla um; no campo longo, eles ficam na base.

### Catálise
O crítico do jogo: um golpe com dano multiplicado.

### Cascata
Quando uma molécula forte se quebra em moléculas menores.

### Interações
A vida do agente na run e da BASE no campo longo.

### Reagente
Modificador que também libera a evolução de uma arma.

### Colateral
O que um agente tira de outro setor de saúde ao ajudar o seu.

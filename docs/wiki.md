# Wiki do jogo (Compêndio)

Textos da wiki que o jogador lê dentro do jogo, no Compêndio. Cada seção `##` é uma página e cada `###` é um verbete. Escreva para quem joga: frases curtas, sem termos de programação, explicando o que acontece e como usar a seu favor.

> **Para quem mexe no jogo:** os números aqui vêm dos JSON de `src/config/` (indicados em cada página). Mudou uma mecânica ou um número que aparece no texto, atualize este arquivo no mesmo commit. A wiki dentro do jogo vai ler estes textos (fase 6).

---

## Como jogar

*Números de `run.json`, `economy.json` e `stats.json`.*

### O que é uma run
Você controla um agente dentro do organismo: uma molécula de remédio contra as moléculas que fazem mal. Você só anda; o agente ataca sozinho. A run acaba quando as interações do agente acabam.

### Interações
São a vida do agente: o estoque de moléculas dele. Cada molécula inimiga que encosta se liga ao agente e gasta interações. A barra embaixo do agente mostra quanto sobrou; abaixo de 25% a tela pulsa em vermelho.

### Movimento
No celular, encoste o dedo em qualquer lugar e arraste: o joystick aparece onde você tocou. No PC, use as setas ou WASD. Esc ou P pausam.

### Especial
Cada agente tem um especial, disparado pelo botão grande no canto (ou Espaço no PC). Ele recarrega com o tempo; o número no botão diz quantos segundos faltam e o `x1` no canto mostra as cargas guardadas.

### Experiência e nível
Moléculas decompostas soltam gemas azuis. Passe perto para coletar. Encheu a barra do topo, você sobe de nível e escolhe uma arma ou um receptor.

### Ondas e chefes
A dificuldade sobe com o tempo. A cada 5 minutos vem um pico de onda (o tempo fica laranja), com mais moléculas, seguido de um respiro curto. A cada 5 minutos também aparece um chefe: a Partícula de LDL.

### Decomposição em cascata
Moléculas fortes não somem de uma vez: elas se quebram em moléculas menores, que continuam vindo. O Amido vira Maltose, que vira Glicose. Vale planejar a área de ataque para as cascatas.

### Afinidade
Cada agente quebra melhor alguns tipos de molécula. Contra o tipo forte, o dano é 1,5×; contra o tipo fraco, 0,5×. O número de dano mostra: ciano é afinidade forte, cinza é fraca.

### Números na tela
Branco é dano comum. Amarelo com "!" é catálise (crítico). Ciano é afinidade forte, cinza é fraca. Vermelho sobre o agente é interação perdida; verde é recuperação. Dá para esconder os números de dano nas Opções.

### ATP na run
Algumas moléculas decompostas soltam ATP, a moeda do jogo (moeda dourada no chão). Moléculas fortes e o chefe sempre soltam, e quanto mais tempo de run, mais cada uma vale. O ATP fica com você no fim da run.

### Pausa
A pausa mostra suas armas e receptores (aba Arsenal), todos os atributos com o valor atual e a base (aba Atributos) e os números da run (aba Run). Desistir encerra a run e leva para a tela de fim.

---

## Agentes da run

*Números de `agents.json`. A ação e o especial de cada um estão na aba Agentes do menu.*

### Dopamina
Neurotransmissor da recompensa. A generalista: efetividade média contra tudo.
- **Ação:** Pulso dopaminérgico, anéis que saem do agente e acertam tudo por onde passam.
- **Especial:** Pico de recompensa. Por alguns segundos, pulsos muito mais rápidos e maiores. Depois vem uma queda, com a ação mais lenta.
- **No organismo:** sobe Mental, Executiva e Social. Colateral: tira um pouco da Física.

### Lipase
Enzima que quebra gordura. Forte contra lipídios, fraca contra o resto.
- **Ação:** Hidrólise, golpes curtos e fortes no inimigo mais próximo, com respingo em volta.
- **Especial:** Emulsão. Uma área no chão que deixa os lipídios dentro dela frágeis.
- **No organismo:** sobe muito a Física. Colateral: tira um pouco da Mental.
- **Desbloqueio:** 1.200 ATP.

### Insulina
Hormônio que tira o açúcar da circulação. Forte contra açúcares, fraca contra o resto.
- **Ação:** Campo de captação, que puxa os açúcares para perto e os absorve.
- **Especial:** Captação. Puxa todos os açúcares da tela de uma vez e causa dano neles.
- **No organismo:** sobe a Física e um pouco a Mental. Colateral: tira um pouco da Executiva.
- **Desbloqueio:** 2.000 ATP.

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
Elétrons giram em volta do agente e acertam o que passa.

### Catalisador
Campo em volta do agente: dano baixo e contínuo, e quem está dentro recebe mais dano. **Evolui com Coenzima em Enzima**, uma aura que cresce a cada molécula decomposta.

### Poça de Solvente
Arremessa um frasco que vira uma poça: dano por segundo e lentidão. **Desbloqueio:** 200 ATP.

### Reação em Cadeia
O disparo acerta um inimigo e salta para o próximo. **Desbloqueio:** 500 ATP.

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
- **Ataque:** Reatividade (dano), Metabolismo (recarga menor), Difusão (área), Cinética (velocidade dos disparos e alcance), Chance de catálise (crítico) e Dose (mais projéteis, até 3 níveis).
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

### Rerrolar, Pular e Banir
- **Rerrolar** sorteia outras cartas.
- **Pular** dispensa o level up.
- **Banir** tira uma carta da run inteira.

Começam em zero: vêm do Laboratório e do setor Executiva do organismo.

### Reagentes
Peróxido, Cloro, Ozônio e Coenzima liberam a evolução. Eles vêm das ampolas (veja Suplementos e ampolas).

### Os outros atributos
Penetração, Reação em cadeia, Força da catálise, Repulsão, Especificidade, Esquiva, Absorção, Tolerância, Segunda dose e Reflexo não saem mais no level up. Vêm dos suplementos, do Laboratório e da Mutação.

---

## Moléculas

*Números de `enemies.json` e `organism.json`. O Compêndio mostra cada molécula depois que você a encontra.*

### Tipos de molécula
Cada molécula tem um tipo: açúcar, lipídio, estresse, radical ou toxina. O tipo decide a afinidade dos agentes e qual setor do organismo puxa aquela família.

### Açúcares
Glicose e Frutose são pequenas e chegam em grupos. Maltose e Sacarose se quebram em Glicose e Frutose. O Amido é forte e se quebra em Maltose.

### Lipídios
Ácido graxo é comum; o Triglicerídeo é forte e se quebra em Glicerol e Ácidos graxos. O chefe, a **Partícula de LDL**, aparece a cada 5 minutos e se quebra em Triglicerídeos e Ácidos graxos.

### Estresse
A Adrenalina é rápida e chega em grupos. O Cortisol é forte e se quebra em Adrenalina. Vêm muito quando a Mental está baixa.

### Radicais livres
O Radical hidroxila é pequeno e muito rápido. O Peroxinitrito se quebra em radicais hidroxila. Vêm muito quando a Executiva está baixa.

### Toxinas
O Etanol chega em grupos. O Acetaldeído se quebra em Etanol. Vêm muito quando a Social está baixa.

---

## Itens no mapa

*Números de `drops.json`. O Compêndio mostra cada item depois que você o coleta.*

### Vesículas
Bolsas translúcidas paradas no chão, com dopamina dentro. Aparecem fora da tela, uma a cada 15 segundos (no máximo 6). Qualquer golpe rompe a vesícula, que solta um item. Itens raros só começam a sair depois de certo nível da run.

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
Lança-chamas na direção em que você anda, por 10 segundos. Usa a sua Reatividade e a sua Difusão.

### Glucagon e Febre de ATP
A partir do nível 30. Puxa todo o ATP do chão e começa a Febre de ATP: por 10 segundos toda molécula decomposta solta ATP, e cada ATP coletado soma meio segundo à febre.

### Gemas de XP
Nem toda molécula solta gema: a comum solta em 60% das vezes, a que nasceu da cascata em 40%, e a forte e o chefe sempre. A gema que cai vale mais para compensar, então o XP no fim é o mesmo. A cor mostra o valor: ciano até 2 de XP, verde até 9, vermelha mais que isso. Com gemas demais no chão, o XP novo se junta numa gema só.

### Cápsula do chefe
Todo chefe solta uma cápsula, que você precisa tocar. Ela sobe um nível de 1, 3 ou 5 armas ou receptores que você já tem, com raridade pela Sorte, e dá ATP. A Sorte também aumenta a chance de 3 e 5. As seis primeiras cápsulas do save dão 1, 1, 3, 1, 1 e 5.

### Cápsula de prata
Depois dos 10 minutos a cápsula é de prata: se uma arma estiver no nível máximo com o reagente certo, ela evolui.

### Fosfocreatina
Quando a cápsula ou o level up não têm mais o que subir, você ganha Fosfocreatina: ATP igual a 10 moedas.

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
Creatina (dano), Vitamina (Sorte), Ferro (interações), Eletrólitos (recuperação), Cafeína (velocidade), Bicarbonato (empurrão), Ácido fórmico (devolve dano), Mucina (tempo sem levar dano), Glutamina (recupera ao decompor), Fluoresceína (alcance), Ginseng (recarga do especial), Surfactante (atravessa moléculas), Cobre (saltos), Anticorpo (dano em fortes e chefes), Mitocôndria (ATP), Enzima digestiva (dano crítico), Platina (chance de efeito), Nootrópico (+1 opção no level up) e Dose de reforço (+1 Segunda dose).

### Os de efeito
- **Nitrogênio líquido:** chance de congelar a molécula atingida por 1 segundo.
- **Aquaporina:** a cada 60 segundos todas as gemas correm até você.
- **Eletrodo:** ao decompor, chance de uma faísca que atinge 3 moléculas perto.
- **Termita:** a molécula decomposta explode e queima as vizinhas.
- **Criopreservação:** ao perder interações, congela tudo na tela por 2 segundos (uma vez a cada 30).

### Reagentes
Peróxido, Cloro, Ozônio e Coenzima saem das ampolas, não mais do level up. Com a arma certa no nível máximo, o reagente dela sai muito mais vezes, e a cápsula de prata faz a evolução.

---

## Menu e progressão

*Números de `meta.json` e `economy.json`.*

### ATP
A moeda do jogo, a molécula de energia das células. Vem da run, das estrelas do caso e do campo longo, e é gasta no Laboratório e nos desbloqueios.

### Laboratório
Árvore de melhorias permanentes que valem em todas as runs. Começa pela raiz (Interações) e se abre em seis caminhos: Força, Química, Corpo, Coleta, Controle e Especial. Um nó abre quando os nós ligados a ele têm pelo menos um nível. Cada nível custa 15% mais que o anterior. Tocar num nó mostra o que o atributo faz e quanto cada nível soma.

### Desbloqueios
Você começa com a Dopamina e quatro armas. Lipase, Insulina, Poça de Solvente, Reação em Cadeia e Raio UV se desbloqueiam com ATP nas abas Agentes e Arsenal.

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
- **Run:** no fim, o agente aplica o efeito dele no organismo, proporcional a quanto você durou (efeito cheio em 10 minutos, até o dobro). Quase todo agente tem um colateral: tira um pouco de outro setor, como um remédio de verdade.
- **Campo longo:** os agentes da base empurram os setores deles um pouco por hora, também com o jogo fechado.
- **Retorno decrescente:** perto de 100 o setor quase não sobe; perto de 0 cai menos.

A aba Organismo mostra, em cada setor, quem sobe ele na run (pontos a cada 10 minutos), quem sobe no campo longo (pontos por hora) e quem derruba como colateral, com os números atuais.

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

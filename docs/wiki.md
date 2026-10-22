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
Moléculas decompostas soltam gemas azuis. Passe perto para coletar. Encheu a barra do topo, você sobe de nível e escolhe um modificador ou uma arma.

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
A pausa mostra suas armas e modificadores (aba Arsenal), todos os atributos com o valor atual e a base (aba Atributos) e os números da run (aba Run). Desistir encerra a run e leva para a tela de fim.

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

## Level up e modificadores

*Números de `passives.json`, `rarities.json` e `stats.json`.*

### Escolher no level up
A cada nível você escolhe uma entre 3 opções: uma arma nova, o próximo nível de uma arma ou um modificador. Os modificadores ficam na linha de baixo da HUD.

### Raridade
Cada modificador vem com uma raridade, que multiplica o efeito: Comum (1×), Incomum (1,5×), Raro (2×), Ultra raro (2,5×), Lendário (3×) e Especial (4×). A cor da moldura do cartão mostra a raridade.

### Sorte
Quanto mais Sorte, mais aparecem as raridades altas.

### Rerrolar, Pular e Banir
- **Rerrolar** sorteia outras opções.
- **Pular** dispensa o level up.
- **Banir** tira uma opção da run inteira.

Começam em zero: vêm de modificadores, do Laboratório e do setor Executiva do organismo.

### Espaços
O agente tem 4 espaços de modificador no começo (até 6). O modificador Espaços de modificador não ocupa espaço.

### Reagentes
Peróxido, Cloro, Ozônio e Coenzima são modificadores que também servem de reagente: com a arma certa no nível máximo, liberam a evolução.

### Modificadores de ataque
Reatividade (dano), Dose (mais projéteis), Metabolismo (recarga menor), Difusão (área), Cinética (velocidade dos disparos), Alcance, Penetração (atravessa inimigos), Reação em cadeia (ricochetes), Chance de catálise (crítico), Força da catálise (dano crítico), Repulsão (empurrão), Especificidade (dano em inimigos fortes) e Meia-vida (duração).

### Modificadores de defesa
Interações (vida máxima), Membrana (menos dano por golpe), Esquiva, Homeostase (recupera interações com o tempo), Absorção (chance de recuperar ao decompor), Tolerância (invulnerável por mais tempo depois de um golpe), Segunda dose (volta uma vez com metade das interações) e Reflexo (devolve dano a quem encosta).

### Modificadores de coleta e risco
Mobilidade (velocidade), Raio de coleta, Aprendizado (mais XP), Sorte e Estresse. **Estresse** deixa as moléculas mais fortes e mais rápidas, mas dá mais XP: risco por recompensa.

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

## Menu e progressão

*Números de `meta.json` e `economy.json`.*

### ATP
A moeda do jogo, a molécula de energia das células. Vem da run, das estrelas do caso e do campo longo, e é gasta no Laboratório e nos desbloqueios.

### Laboratório
Árvore de melhorias permanentes que valem em todas as runs. Começa pela raiz (Interações) e se abre em seis caminhos: Força, Química, Corpo, Coleta, Controle e Especial. Um nó abre quando os nós ligados a ele têm pelo menos um nível. Cada nível custa 15% mais que o anterior.

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

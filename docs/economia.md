# Economia

Esta aba propõe as fórmulas que equilibram progressão e dificuldade, com base no que já foi estudado sobre jogos idle, roguelites e curvas de dificuldade. Todos os números são **valores iniciais para testar**, não decisões: o certo só aparece jogando. As referências estão no fim.

## O que a pesquisa diz

1. **Idle é uma gangorra entre custo e produção.** O padrão do gênero é custo crescendo de forma exponencial e produção crescendo de forma linear ou polinomial. Como a exponencial sempre alcança a polinomial, o progresso desacelera sozinho, e é aí que entra o prestígio para acelerar de novo.
2. **A taxa de custo costuma ficar entre 7% e 15% por compra.** Muitos jogos usam custo = base × 1,15^n; o Idle Idol trabalhou na faixa de 11% a 19%.
3. **Prestígio usa raiz, não logaritmo.** A moeda de prestígio costuma ser a raiz quadrada ou cúbica do que se ganhou. Com raiz cúbica, dobrar a recompensa exige ganhar cerca de 8 vezes mais.
4. **Depois do reset, o jogo precisa ficar bem mais rápido.** A recomendação comum é que a nova volta seja de 2 a 5 vezes mais rápida, senão o reset parece castigo.
5. **Level up do Vampire Survivors cresce por soma, não por multiplicação.** O XP exigido sobe um pouco a cada nível (total quadrático). Multiplicar por uma constante a cada nível faz o ritmo parecer sempre mais lento. Nos níveis 20 e 40 a exigência dá um salto, compensado por um bônus de ganho de XP.
6. **Dificuldade boa é dente de serra, não rampa.** Picos de tensão seguidos de respiros onde o jogador sente o poder novo mantêm a pessoa no "canal de flow", entre o tédio e a ansiedade.
7. **Meta-progressão demais mata a habilidade.** Se upgrades permanentes de poder bruto deixam qualquer um vencer, a derrota para de ensinar e o jogo vira grind. Desbloquear opções novas (personagens, armas, caminhos) envelhece melhor que "+X% de dano".

## Princípios para o Dopamina Blaster

- **Poder grande dentro da run, pequeno fora dela.** O level up da run é onde o jogador fica forte de verdade. A meta-progressão dá um empurrão com teto.
- **Meta-progressão abre opções.** A maior parte do que se compra no menu são agentes, especiais e escolhas novas, não números maiores.
- **Dente de serra na run.** Picos de horda e chefe, seguidos de respiros curtos.
- **Reset que acelera.** O próximo indivíduo é mais difícil, mas o jogador chega no mesmo ponto de 2 a 5 vezes mais rápido.
- **Organismo no centro.** A saúde multiplica a economia, então cuidar do corpo é a forma principal de crescer.

## A moeda

Proposta de nome: **ATP**, a molécula que é a moeda de energia das células de verdade. É a mesma moeda na run e no idle, como decidido.

- **Na run:** cada molécula decomposta dá ATP; moléculas de minutos mais avançados valem mais, para recompensar o risco de continuar. No jogo (fase 2.7), a molécula solta uma moeda de ATP no chão por chance (elites e chefe sempre, o chefe valendo bem mais), e o agente coleta como as gemas; os números ficam em `runCurrency` de `economy.json`.
- **No idle:** ATP por hora, multiplicado pela saúde do organismo.
- **Gasto:** upgrades das duas árvores e desbloqueio de agentes.

## As fórmulas

### 1. XP para subir de nível na run

XP(n) = 5 + 10 × (n − 1), onde n é o nível atual. A cada 20 níveis o incremento sobe (10 → 13 → 16), como no Vampire Survivors.

| Nível | XP para o próximo |
| --- | --- |
| 1 | 5 |
| 5 | 45 |
| 10 | 95 |
| 20 | 195 |
| 30 | 295 |

O XP cresce em linha reta por nível; como as moléculas também valem mais XP com o tempo, o ritmo de level up fica parecido do começo ao fim.

### 2. Dificuldade da run (e o limiar programável)

D(t) = 1 + 0,15 × t + 0,01 × t², com t em minutos. D multiplica a vida e a quantidade de inimigos.

| Minuto | Dificuldade |
| --- | --- |
| 0 | 1,0× |
| 5 | 2,0× |
| 10 | 3,5× |
| 20 | 8,0× |
| 30 | 14,5× |

O termo ao quadrado é o que garante que a run infinita acabe: o poder do jogador cresce mais devagar que a dificuldade, então em algum momento a curva passa por cima dele. O **limiar programável** é o minuto t\* a partir do qual entra um termo extra que acelera ainda mais (por exemplo, + 0,002 × (t − t\*)³ depois de t\* = 20). Mexer em t\* muda quanto tempo um jogador bom aguenta.

**Dente de serra:** a cada 5 minutos vem uma onda de pico (horda ou chefe, cerca de 1,5× a curva) seguida de 20 a 30 segundos com menos inimigos.

### 3. Custo dos upgrades (menu)

custo(n) = base × r^n, onde n é quantas vezes o upgrade já foi comprado.

- Árvore da run: r = 1,15, com poucos níveis por upgrade (5 a 10, como os PowerUps do Vampire Survivors).
- Árvore do idle: r = 1,08, com muitos níveis, porque o idle vive de compras frequentes.

| Compra nº | Custo (base 10, r = 1,15) |
| --- | --- |
| 0 | 10 |
| 5 | 20 |
| 10 | 40 |
| 20 | 164 |
| 30 | 662 |

O benefício de cada nível cresce em linha reta (+X por nível). Custo exponencial contra benefício linear é o que desacelera o progresso de forma natural.

### 4. Produção do idle

ATP por hora = soma de (produção base do agente × nível do agente) × multiplicador de saúde.

- **Offline:** mesma produção, com teto inicial de 8 horas, que pode subir com upgrades. A Melatonina rende mais nesse período.
- **Multiplicador de saúde:** 1 + (média dos 4 setores − 50) / 100. Um organismo com média 50 produz 1×; com média 90, 1,4×; com média 20, 0,7×.

### 5. Saúde (com retorno decrescente)

Ganho real = ganho do agente × (1 − setor atual / 100).

Perto de 0, cada ponto sobe rápido; perto de 100, quase não sobe. Isso deixa o começo de cada indivíduo animado e o fim mais lento, sem precisar de travas artificiais.

**Colateral:** colateral = c × dose². Dose dobrada dá colateral quatro vezes maior, o que faz exagerar ser uma escolha arriscada.

### 6. Reset para o próximo indivíduo

- **Gatilho:** a saúde do organismo (veja a aba Mecânicas).
- **Pontos herdados:** pontos = raiz quadrada (ATP ganho neste indivíduo / 1000). Com raiz cúbica o crescimento seria mais lento; a quadrada é mais generosa e combina com um jogo entre amigos.
- **Dificuldade do indivíduo k:** 1,25^k. Cada novo organismo é 25% mais difícil.
- **Regra de ouro:** os pontos herdados precisam fazer o jogador alcançar o ponto do indivíduo anterior de 2 a 5 vezes mais rápido. Se não, aumente o valor de cada ponto, não o número de pontos.

## Como não estragar a experiência

- **Teto no poder permanente.** A soma de bônus permanentes de dano e vida não passa de cerca de +50%. O resto da meta-progressão é opção nova.
- **A primeira run tem que ser divertida sem nada comprado.** O primeiro desbloqueio vem em 2 ou 3 runs.
- **Alerta de parede de grind:** se o próximo upgrade custa mais que 3 runs médias de ATP, alguma coisa está fora do lugar.
- **Derrota precisa ensinar.** Como a meta-progressão é pequena, perder ainda diz algo sobre o jeito de jogar.
- **Todos os números num lugar só.** Uma tabela ou arquivo de configuração com todas as constantes, para ajustar sem caçar valor no código. Dá para escrever um simulador que joga milhares de runs e desenha as curvas antes de testar à mão.

## Botões de ajuste

| Parâmetro | Valor inicial | O que muda |
| --- | --- | --- |
| XP: base e incremento | 5 e 10 | Ritmo de level up |
| Dificuldade: termos linear e quadrático | 0,15 e 0,01 | Quão rápido a run aperta |
| Limiar t\* | 20 min | Quanto um jogador bom aguenta |
| Intervalo do pico | 5 min | Ritmo de tensão e alívio |
| r da árvore da run | 1,15 | Velocidade do progresso permanente |
| r da árvore do idle | 1,08 | Frequência de compras no idle |
| Teto offline | 8 h | Recompensa por voltar ao jogo |
| Fator por indivíduo | 1,25 | Dificuldade de cada reset |
| Raiz do prestígio | quadrada | Generosidade do reset |
| Teto de poder permanente | +50% | Peso da meta-progressão na habilidade |

## O que falta decidir

- O nome ATP para a moeda funciona?
- Os pontos herdados no reset são uma segunda moeda, ou viram bônus direto?
- Qual a duração média que você quer para uma run (10, 20, 30 minutos)? Isso define t\* e os termos da dificuldade.
- Vale ter ajuste dinâmico (o jogo alivia um pouco depois de várias derrotas seguidas), ou o jogo fica igual para todo mundo?
- Teto de +50% de poder permanente parece certo?

## Referências

- [The Math of Idle Games, Part I](https://www.gamedeveloper.com/design/the-math-of-idle-games-part-i)
- [The Math of Idle Games, Part III](https://www.gamedeveloper.com/design/the-math-of-idle-games-part-iii)
- [Balancing Tips: How We Managed Math on Idle Idol](https://gamedeveloper.com/design/balancing-tips-how-we-managed-math-on-idle-idol)
- [Vampire Survivors Wiki: Growth](https://vampire.survivors.wiki/w/Growth)
- [Difficulty curves: how to get them right](https://bugnet.io/blog/difficulty-curves-how-to-get-them-right)
- [Getting Gamers in the Zone: Understanding Flow](https://www.gamedeveloper.com/design/getting-gamers-in-the-zone-understanding-flow)
- [How to design a roguelite meta progression](https://bugnet.io/blog/how-to-design-a-roguelite-meta-progression)

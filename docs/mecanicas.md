# Mecânica geral do mundo

Esta aba junta as peças do jogo num sistema só: o organismo, os dois campos, os agentes e a progressão. O que vem do documento de conceito está marcado como **decidido**; o resto é **proposta** para você validar. Agentes e inimigos em detalhe ficam na aba Personagens, e moedas e preços na aba Economia.

## O sistema em uma frase

O jogador trata um organismo doente: escolhe agentes (remédios e substâncias reais), luta na run e farma no idle, e cada agente mexe nos pontos de saúde do corpo. Quando o organismo está saudável o bastante, o jogador pode resetar para outro indivíduo, mais doente, levando alguma vantagem.

## O ciclo do mundo

1. **O organismo define o desafio.** O estado de saúde do indivíduo decide quais moléculas aparecem e com que força. *(proposta)*
2. **Run e idle rodam juntos.** A run é o mundo aberto estilo Vampire Survivors; o idle é o campo vertical que farma sozinho, inclusive offline. *(decidido)*
3. **Os agentes mexem na saúde.** Cada agente, na run ou no idle, ganha ou perde pontos em um ou mais setores de saúde. *(decidido)*
4. **Tudo gera a mesma moeda.** Run e idle alimentam a mesma moeda, gasta no menu entre runs. *(decidido)*
5. **Upgrades e desbloqueios.** A moeda melhora agentes (cada campo com sua árvore) e libera moléculas novas. *(decidido)*
6. **O organismo melhora.** Com agentes melhores, a saúde sobe e o organismo fica mais fácil de tratar. *(decidido)*
7. **Reset.** Num certo nível, abre a opção de passar para outro indivíduo, mais doente, com uma vantagem herdada. *(decidido)*

## O organismo

O mundo é o corpo de uma pessoa, e o objetivo de toda a progressão é deixá-la saudável. *(decidido)*

### Os quatro pontos de saúde

Os setores são decididos; o que cada um cobre e o efeito no jogo são proposta.

| Setor | O que representa | Efeito no jogo (proposta) |
| --- | --- | --- |
| Física | Corpo, energia, metabolismo | Mais interações (vida) no início da run |
| Mental | Humor, ansiedade, bem-estar | Recarga mais rápida do especial |
| Executiva | Foco, organização, decisão | Mais opções na tela de level up |
| Social | Relações, convívio | Mais produção do idle |

### Proposta de regra para a saúde

- Cada setor vai de 0 a 100. O indivíduo começa com alguns setores baixos: é a "doença" dele.
- Setor alto dá bônus no efeito da tabela; setor muito baixo dá uma penalidade no mesmo eixo.
- Os setores baixos também decidem quais moléculas inimigas são mais comuns. Um organismo com a física baixa, por exemplo, tem mais lipídios e glicose na run.
- A saúde muda devagar: é o resultado acumulado de várias runs e do idle, não de uma run só.

## Os dois campos

### Campo crônico (a run)

**Decidido:**

- Mundo aberto visto de cima; o jogador escolhe um agente e controla só o movimento.
- O agente ataca sozinho e tem um especial que o jogador dispara.
- Cada inimigo que encosta no agente se liga a ele e consome parte das suas interações (o estoque de moléculas do agente); sem interações, o agente foi consumido e a run acaba.
- Run infinita, com dificuldade que sobe até um limiar programável.
- Level up dentro da run, com escolha de modificador ou "arma".

**Proposta de ligação com o organismo:**

- Ao fim da run, o agente aplica o seu efeito de saúde proporcional ao quanto o jogador avançou.
- Os setores de saúde mudam o começo da run (vida, recarga do especial, opções de level up), conforme a tabela acima.

### Campo longo (o idle)

**Decidido:**

- Campo vertical: os inimigos descem e os agentes fixos na base atacam.
- Roda junto com a run e continua offline, com teto de horas.
- Agentes do idle são outros remédios, com árvore de upgrades própria.

**Proposta de ligação com o organismo:**

- O idle é a fonte constante e lenta de saúde: cada agente na base empurra seus setores um pouco por hora.
- A run dá saltos maiores de saúde; o idle segura o organismo entre uma run e outra.

## Agentes e efeito na saúde

**Decidido:** cada agente tem um tipo de ação, uma efetividade diferente contra cada tipo de molécula e um efeito em um ou mais setores de saúde, uns mais que outros. A progressão gira em torno de qualidade, dose e potência.

**Proposta para os três eixos:**

| Eixo | O que melhora | Risco |
| --- | --- | --- |
| Qualidade | Efetividade contra as moléculas e alcance de tipos que o agente quebra | Nenhum: é o upgrade "limpo" |
| Dose | Quantidade e frequência dos ataques | Dose alta aumenta os efeitos colaterais |
| Potência | Força do efeito na saúde | Potência alta aumenta os efeitos colaterais |

**Proposta de efeito colateral:** além dos setores que melhora, cada agente pode tirar pontos de outro setor, como um remédio real. Um estimulante sobe a executiva e pode baixar a física, por exemplo. Isso cria escolha: qual agente usar depende de quais setores o organismo aguenta perder agora.

## Decomposição

**Decidido:**

- Moléculas simples são "mortas" ao serem decompostas.
- Moléculas fortes se quebram em moléculas mais fracas (cascata).
- Um agente quebra melhor os tipos para os quais foi feito; para quebrar outros, precisa evoluir.

Quais moléculas geram quais fragmentos fica na aba Personagens.

## Progressão e reset

**Decidido:**

- Upgrades no modelo de Vampire Survivors, com meta-progressão entre runs.
- Molécula nova = moeda + nível de progressão da última molécula, como o médico que troca o remédio depois de ver a reação ao anterior.
- Reset para outro indivíduo, sempre mais doente, com uma vantagem herdada.

**Proposta de gatilho do reset:** o reset abre quando a soma dos quatro setores passa de um limite (por exemplo, todos acima de 70). O novo indivíduo começa com mais setores baixos e uma "doença" diferente, o que muda as moléculas mais comuns e obriga a usar outros agentes.

## O que falta decidir

- [x] Os efeitos de cada setor na tabela fazem sentido, ou cada setor deve mexer em outra coisa? → a tabela vale ([decisão 0023](decisoes/0023-organismo.md)).
- [x] Saúde de 0 a 100 por setor, ou outra escala? → 0 a 100 ([decisão 0023](decisoes/0023-organismo.md)).
- [x] Existe efeito colateral nos agentes, ou eles só somam? → existe ([decisão 0023](decisoes/0023-organismo.md)).
- [x] A run aplica saúde só no fim, ou durante? → no fim, proporcional aos minutos ([decisão 0023](decisoes/0023-organismo.md)).
- [x] Que vantagem passa para o próximo indivíduo no reset? → pontos herdados (+10% de ATP cada) e os desbloqueios ([decisão 0023](decisoes/0023-organismo.md)).
- [x] O que acontece se um setor chega a zero: penalidade, derrota do indivíduo, ou nada além do efeito negativo? → só a penalidade máxima ([decisão 0023](decisoes/0023-organismo.md)).

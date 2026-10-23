# Personagens

Primeira leva de agentes (os personagens jogáveis) e de moléculas ofensoras. Tudo aqui é **proposta**: nomes, papéis e efeitos são pontos de partida para você cortar, trocar ou aprofundar. A química segue a real sempre que possível, inclusive nas cascatas de decomposição. Os setores de saúde (física, mental, executiva, social) e os eixos qualidade, dose e potência vêm da aba Mecânicas.

## Tipos de molécula ofensora

Cada tipo tem um comportamento na run e pesa mais em certos setores de saúde. Os setores baixos do organismo decidem quais tipos aparecem mais.

| Tipo | Comportamento na run | Setores ligados |
| --- | --- | --- |
| Lipídios | Lentos e resistentes; tanques | Física |
| Açúcares | Rápidos e em enxame | Física, executiva |
| Radicais livres | Erráticos, ricocheteiam, batem forte | Física, mental |
| Hormônios do estresse | Fortalecem os inimigos ao redor (aura) | Mental, executiva |
| Toxinas | Ficam mais perigosas ao serem quebradas | Executiva, social |
| Inflamação | Geram outros inimigos (spawners) | Física, mental |

## Moléculas ofensoras

As cascatas seguem o metabolismo real.

### Lipídios

- **Triglicerídeo.** Tanque lento. Ao ser quebrado, vira 1 glicerol + 3 ácidos graxos.
- **Ácido graxo.** Fragmento médio, persegue o agente em linha reta.
- **Glicerol.** Fragmento fraco, morre com um ou dois golpes.

### Açúcares

- **Amido.** Cadeia longa e pesada. Quebra em várias maltoses.
- **Maltose.** Quebra em 2 glicoses.
- **Sacarose.** Quebra em 1 glicose + 1 frutose.
- **Glicose e frutose.** Fracas, rápidas, sempre em grupo.

### Radicais livres

- **Superóxido.** Rápido e errático. Ao ser quebrado, vira peróxido de hidrogênio.
- **Peróxido de hidrogênio.** Mais lento, explode numa área pequena se encostar no agente. Ao ser quebrado, vira água e oxigênio, inofensivos.

### Hormônios do estresse

- **Cortisol.** Não ataca: fica longe e dá velocidade e resistência aos inimigos perto dele. Prioridade de alvo.
- **Adrenalina.** Versão rápida e curta do cortisol: acelera muito os inimigos por alguns segundos e some.

### Toxinas

- **Etanol.** Fraco. Ao ser quebrado, vira acetaldeído.
- **Acetaldeído.** Mais tóxico que o etanol: dano maior e deixa uma poça que tira interações. Ao ser quebrado, vira acetato, inofensivo. Quebrar o etanol sem conseguir terminar o serviço piora a situação.

### Inflamação

- **Citocina.** Fica parada e solta pequenos inimigos de tempos em tempos até ser destruída.

### Chefes

- **Partícula de LDL.** Chefe tanque. Quebra em colesterol, triglicerídeos e proteína, que viram uma onda de fragmentos.
- **Placa.** Chefe de fim de indivíduo: um bloco que fecha parte do mapa e só cai com agentes fortes contra lipídios e inflamação.

## Agentes da run

O jogador escolhe um antes da run e joga com ele. O ataque é automático; o jogador só se move e dispara o especial.

Cada agente tem um **receptor nativo** (o perfil farmacológico, [decisão 0030](decisoes/0030-variedade-da-run-reformulada.md)): Dopamina, Receptor D2 (−8% de recarga por nível); Lipase, Sítio ativo (+10% de dano contra lipídios por nível); Insulina, Receptor de insulina (+25% de Raio de coleta por nível). Sobe 1 nível a cada 10 níveis da run, até o 5. Valores em `agents.json`.

### Dopamina

A protagonista e o agente inicial.

- **Ação:** pulsos em anel ao redor do agente.
- **Efetividade:** média contra todos os tipos. É a generalista.
- **Especial, Pico de recompensa:** por alguns segundos, pulsos muito mais rápidos e maiores.
- **Saúde:** sobe mental e executiva.
- **Colateral:** depois do Pico vem uma queda, com ataque mais lento por alguns segundos. Com dose alta, a queda é maior.

### Lipase

Enzima que quebra gordura.

- **Ação:** golpes curtos e fortes no inimigo mais próximo.
- **Efetividade:** forte contra lipídios, fraca contra o resto.
- **Especial, Emulsão:** espalha uma área no chão que deixa todos os lipídios dentro dela frágeis.
- **Saúde:** sobe física.
- **Colateral:** nenhum. É um agente "limpo" e simples de usar.

### Insulina

Hormônio que tira o açúcar da circulação.

- **Ação:** um campo que puxa os açúcares para perto e os absorve.
- **Efetividade:** forte contra açúcares, fraca contra o resto.
- **Especial, Captação:** puxa todos os açúcares da tela de uma vez.
- **Saúde:** sobe física.
- **Colateral:** com dose alta, o organismo fica sem açúcar e o agente perde interações aos poucos (hipoglicemia).

### Vitamina C

Antioxidante.

- **Ação:** disparos que neutralizam o que tocam.
- **Efetividade:** forte contra radicais livres, média contra inflamação.
- **Especial, Escudo antioxidante:** bloqueia o próximo dano por alguns segundos.
- **Saúde:** sobe física.
- **Colateral:** nenhum relevante.

### Venvanse (lisdexanfetamina)

Estimulante de foco. Na vida real é um pró-fármaco: chega inativo e é ativado aos poucos pelo corpo.

- **Ação:** um raio fino e muito forte num alvo só.
- **Efetividade:** média contra todos, forte contra chefes e alvos isolados.
- **Mecânica própria:** começa a run fraco e vai ficando mais forte nos primeiros minutos, como o pró-fármaco sendo ativado.
- **Especial, Hiperfoco:** desacelera o tempo para os inimigos.
- **Saúde:** sobe executiva.
- **Colateral:** baixa física; com dose alta, baixa mental também.

### Serotonina

Neurotransmissor do bem-estar.

- **Ação:** uma aura que desacelera e enfraquece os inimigos ao redor.
- **Efetividade:** forte contra hormônios do estresse, média contra inflamação.
- **Especial, Calmaria:** anula todas as auras de cortisol e adrenalina da tela.
- **Saúde:** sobe mental.
- **Colateral:** com potência alta, baixa executiva.

### Ocitocina

Hormônio do vínculo.

- **Ação:** cria pequenas moléculas aliadas que orbitam e atacam junto.
- **Efetividade:** forte contra hormônios do estresse, fraca contra o resto.
- **Especial, Vínculo:** dobra o número de aliados por alguns segundos.
- **Saúde:** sobe social.
- **Colateral:** nenhum relevante.

### Álcool desidrogenase

Enzima que quebra o álcool.

- **Ação:** golpes em sequência no mesmo alvo.
- **Efetividade:** forte contra toxinas, fraca contra o resto.
- **Mecânica própria:** termina a cascata de uma vez, levando o etanol direto até acetato sem deixar o acetaldeído escapar.
- **Especial, Desintoxicação:** limpa todas as poças de acetaldeído do mapa.
- **Saúde:** sobe executiva e social.
- **Colateral:** nenhum relevante.

### Cafeína

Estimulante leve.

- **Ação:** disparos rápidos e fracos em várias direções.
- **Efetividade:** média contra açúcares e radicais, fraca contra o resto.
- **Mecânica própria:** o agente se move bem mais rápido.
- **Especial, Alerta:** dispara em todas as direções e recupera parte do especial dos próximos usos.
- **Saúde:** sobe executiva.
- **Colateral:** baixa mental (ansiedade); com dose alta, baixa física (sono).

### Matriz de efetividade

| Agente | Lipídios | Açúcares | Radicais | Estresse | Toxinas | Inflamação |
| --- | --- | --- | --- | --- | --- | --- |
| Dopamina | Média | Média | Média | Média | Média | Média |
| Lipase | Forte | Fraca | Fraca | Fraca | Fraca | Fraca |
| Insulina | Fraca | Forte | Fraca | Fraca | Fraca | Fraca |
| Vitamina C | Fraca | Fraca | Forte | Fraca | Fraca | Média |
| Venvanse | Média | Média | Média | Média | Média | Média |
| Serotonina | Fraca | Fraca | Fraca | Forte | Fraca | Média |
| Ocitocina | Fraca | Fraca | Fraca | Forte | Fraca | Fraca |
| Álcool desidrogenase | Fraca | Fraca | Fraca | Fraca | Forte | Fraca |
| Cafeína | Fraca | Média | Média | Fraca | Fraca | Fraca |

Venvanse aparece como média em tudo, mas compensa com dano alto em alvo único e contra chefes.

## Agentes do idle

Remédios diferentes dos da run, mais lentos e constantes, fixos na base do campo vertical. Cada um empurra seus setores um pouco por hora.

| Agente | Ação na base | Saúde | Detalhe próprio |
| --- | --- | --- | --- |
| Melatonina | Disparo lento em área | Física, mental | Produz mais com o jogo fechado (o "sono" do organismo) |
| Ômega-3 | Disparo médio contínuo | Física, mental | O mais estável: nunca tem colateral |
| Magnésio | Aura que enfraquece hormônios do estresse | Mental | Reduz a frequência de cortisol também na run |
| Vitamina D | Disparo forte e raro | Física, mental | Fica mais forte quanto mais tempo passa sem ser trocada |
| Endorfina | Rajadas curtas | Mental, social | Rajada extra quando a run termina bem |

## Elenco inicial e desbloqueios

- **Começa liberado:** Dopamina na run e Ômega-3 no idle.
- **Primeiros desbloqueios:** Lipase e Insulina, porque os primeiros indivíduos têm a física baixa e muitos lipídios e açúcares.
- **Mais tarde:** Vitamina C, Serotonina, Ocitocina, Cafeína, Álcool desidrogenase.
- **Avançado:** Venvanse, pelo poder alto e pelos colaterais que exigem um organismo já mais estável.

Seguindo a regra do conceito, cada desbloqueio pede moeda + nível de progressão do agente anterior.

## O que falta decidir

- Os nove agentes da run e os cinco do idle são um bom tamanho para o primeiro protótipo, ou dá para começar com menos?
- Remédios de marca (como Venvanse) ficam com o nome real, ou com o nome da molécula?
- Agentes da run e do idle podem se repetir (a mesma molécula nos dois campos), ou ficam sempre separados?
- Os chefes aparecem por tempo de run, por indivíduo, ou pelos dois?

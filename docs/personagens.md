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

- **Radical hidroxila.** Pequeno, muito rápido e errático.
- **Peroxinitrito.** Errático. Ao ser quebrado, vira radicais hidroxila.
- **Superóxido.** Rápido e errático. Ao ser quebrado, vira peróxido de hidrogênio.
- **Peróxido de hidrogênio.** Estoura ao encostar no agente, com dano forte, e some sem recompensa.

### Hormônios do estresse

- **Cortisol.** Fica longe e dá velocidade e resistência aos inimigos perto dele (aura). Prioridade de alvo. Ao ser quebrado, vira adrenalina.
- **Adrenalina.** Rápida e em grupo; some sozinha depois de alguns segundos. Quem a decompõe ganha Adrenalina (mais Mobilidade por alguns segundos).
- **Noradrenalina.** Aura curta que acelera os vizinhos; some em 10 segundos e também dá Adrenalina.

### Toxinas

- **Etanol.** Fraco, chega em grupo.
- **Acetaldeído.** Ao ser quebrado, vira etanol e deixa uma poça tóxica: dentro dela o agente perde interações aos poucos e fica com Lentidão.
- **Amônia.** Fraca e comum, em grupo.

### Inflamação

- **Citocina.** Fica parada e solta bradicininas de tempos em tempos, até um teto, até ser destruída.
- **Bradicinina.** Pequena, nasce da citocina e do Cerco inflamatório.

### Chefes

Um chefe a cada 5 minutos, que depende do local do corpo ([decisão 0035](decisoes/0035-familias-e-chefes-por-local.md)):

- **Partícula de LDL** (Corrente sanguínea). Chefe tanque. Quebra em triglicerídeos e ácidos graxos.
- **NAPQI** (Fígado). O metabólito tóxico do paracetamol: deixa poças por onde passa e quebra em acetaldeídos.
- **Amilopectina** (Intestino). Tanque que solta glicoses e quebra em maltoses.
- **Benzopireno** (Pulmão). Da fumaça: errático, solta radicais hidroxila e quebra em superóxidos.
- **CRH** (Cérebro). O hormônio que dispara o estresse: aura grande que acelera e protege; quebra em cortisol e adrenalinas.
- **Placa de ateroma.** Chefe de fim de caso: nasce uma vez aos 15 minutos, em qualquer local, parada, enorme e soltando ácidos graxos. Vale a cápsula de prata.

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

### Locais de sinergia

Cada agente age melhor num local do corpo ([decisão 0032](decisoes/0032-local-escolhido-e-sinergia.md); regras e o porquê em [mapas.md](mapas.md#sinergia-agente--local)): Dopamina no Cérebro (Mental), Lipase no Intestino (Física), Insulina no Fígado (Física), Vitamina C no Pulmão (Física), Venvanse na Corrente sanguínea (Executiva), Serotonina no Intestino (Mental), Ocitocina no Cérebro (Social), Álcool desidrogenase no Fígado (Social) e Cafeína no Pulmão (Executiva). Lipase e Álcool desidrogenase não atravessam a barreira hematoencefálica e não entram no Cérebro.

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

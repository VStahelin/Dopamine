# Mapas gerados

22 de outubro de 2026 · Vitor

Cada run do campo crônico gera o próprio mapa a partir de uma semente: o chão, os obstáculos, as decorações, os destrutíveis e os pontos de interesse saem de blocos de 16×16 tiles criados em volta do agente, num de cinco **ambientes** do corpo, que o jogador escolhe antes da run ([Escolha do local](#escolha-do-local)). Assim duas runs nunca têm o mesmo chão, e a mesma semente sempre repete o mesmo mapa ([decisão 0012](decisoes/0012-passo-fixo-e-semente.md)). Entra na [fase 5.7 do roadmap](roadmap.md#fase-57-mapas-gerados) ([decisão 0026](decisoes/0026-mapas-gerados.md)).

Tudo aqui é **proposta**: quantidades, distâncias e pesos são o primeiro chute para testar. Quando virar código, os números vão para `src/config/map.json` e os desenhos para `src/assets/sprites/map.json`. A arte está na prancheta "Mapas: objetos e chão" do [canvas de identidade visual](https://claude.ai/artifact/MPV17zZywrhhXBUdfnUs6F).

## O que muda de uma run para outra

| Camada | O que varia | Quem decide |
| --- | --- | --- |
| Ambiente | Paleta do chão, objetos, moléculas mais comuns e a zona de terreno | O jogador, na [escolha do local](#escolha-do-local) (ver [Ambientes](#ambientes)) |
| Densidade | Quantos obstáculos por bloco: Aberto, Padrão ou Denso | Sorteada no início da run |
| Chão | Onde entram as variações de tile, em manchas | Ruído com a semente |
| Obstáculos e decoração | Posição, tipo e aglomerados | Semente do bloco |
| Destrutíveis e vesículas | Onde ficam e o que soltam | Semente do bloco e a tabela de [itens.md](itens.md) |
| Pontos de interesse | Ninho de vesículas, câmara, corredor, zona | Semente do bloco, 1 a cada 8 blocos em média |

No início da run aparece o nome do mapa por 2 s, como faixa de título: **CORRENTE SANGUÍNEA · DENSO · #A3F9**. O código no fim é a semente; ele também aparece na aba Run da pausa e na tela de fim de run.

## Como o mapa é gerado

O mundo continua infinito, como hoje. Ele é dividido em **blocos** (chunks) de 16×16 tiles; cada tile tem 16×16 pixels de arte, desenhado em 2×, ou seja, 32 unidades do mundo. Um bloco tem 512×512 unidades.

- **Semente do bloco:** `hash(sementeDaRun, bx, by)`. Gerar o mesmo bloco duas vezes dá o mesmo resultado, então o mapa não precisa ser guardado.
- **Blocos ativos:** os 3×3 em volta do agente ficam desenhados; o anel de fora é gerado um passo antes de entrar na tela. Bloco a mais de 2 de distância sai da memória.
- **Memória do que quebrou:** cada bloco guarda só a lista dos destrutíveis já quebrados. Ao voltar, o bloco é gerado de novo sem eles.
- **Onde fica o código:** a geração é lógica pura em `src/core/map/`, sem Phaser, com teste de "mesma semente, mesmo bloco". O `game` só desenha o que o `core` devolve ([decisão 0003](decisoes/0003-camadas-core-game-config.md)).

### Ordem dentro de um bloco

1. **Chão.** Todo tile começa no tile base do ambiente. Um ruído suave, com manchas de uns 6 tiles, troca o base pela variação 1 onde passa de 0,62; cada tile tem mais 4% de chance de virar a variação 2. As variações só mudam o miolo do tile, então qualquer vizinho casa.
2. **Densidade local.** Um segundo ruído, bem mais largo (cerca de 2 blocos), cria clareiras e trechos fechados dentro da mesma run.
3. **Grupos.** Alguns grupos com motivo do ambiente (veja [Grupos](#grupos)), sorteados pelo peso, conforme a densidade da run e a local ([decisão 0033](decisoes/0033-grupos-de-objetos-no-mapa.md), proposta).
4. **Objetos soltos.** Poucos obstáculos e destrutíveis sozinhos, para o espaço entre os grupos não ficar vazio.
5. **Lugar de cada um.** Cada grupo (ou objeto solto) vai para um ponto sorteado longe da borda do bloco e do começo da run, com uma passagem de 2 tiles, borda a borda, até o vizinho mais perto.
6. **Decoração solta.** 2 a 4 por bloco, em qualquer lugar; o resto da decoração vem nos grupos.
7. **Ponto de interesse.** 12% de chance por bloco, nunca no bloco inicial nem colado a outro ponto de interesse.

| Densidade | Chance na run | Grupos por bloco | Obstáculos soltos | Destrutíveis soltos |
| --- | --- | --- | --- | --- |
| Aberto | 25% | 0 a 1 | 1 a 2 | 0 a 1 |
| Padrão | 50% | 1 a 2 | 2 a 3 | 0 a 1 |
| Denso | 25% | 2 a 3 | 3 a 5 | 0 a 1 |

### Regras que nunca quebram

- **Começo livre:** nada com colisão num raio de 4 tiles do ponto de início.
- **Sempre passa:** entre dois grupos (ou objetos soltos) fica uma passagem de pelo menos 2 tiles, borda a borda, mais que o dobro do agente. Todo anel tem uma abertura. Assim nenhum beco fecha e não precisa de busca de caminho.
- **Colisão simples:** obstáculo é um círculo. Agente e moléculas deslizam pela borda; projéteis, gemas e ATP passam por cima.
- **Quem atravessa:** o chefe e as moléculas das formações da [fase 5.6](roadmap.md#fase-56-variedade-da-run) ignoram obstáculos; o chefe quebra os destrutíveis em que encosta.
- **Nada nasce dentro:** molécula, gema ou item que cairia dentro de um obstáculo é empurrado para o lugar livre mais perto.
- **Leitura primeiro:** o chão usa 4 tons próximos do ambiente, sem contorno. Obstáculos, destrutíveis e decoração têm o contorno escuro de 1 px dos ícones. Nada do mapa usa o ciano das gemas e dos disparos nem o dourado do ATP como cor principal.

## Os objetos

Cinco tipos de objeto, todos em pixel art de 16×16 com a paleta dos ícones.

| Tipo | Colisão | Vida | O que faz |
| --- | --- | --- | --- |
| **Obstáculo** | sim | — | Bloqueia agente e moléculas; serve para despistar e afunilar inimigos |
| **Destrutível** | sim, até quebrar | 1 a 3 golpes | Abre caminho e pode soltar algo; as armas com mira atiram nele quando está mais perto que a molécula mais perto |
| **Vesícula** | não | 1 golpe | A fonte de itens de [itens.md](itens.md); igual em todos os ambientes |
| **Decoração** | não | — | Só dá vida ao chão; nunca esconde gema ou molécula (fica embaixo delas) |
| **Zona de terreno** | não | — | Mancha no chão com efeito em quem está dentro (proposta, ver abaixo) |

## Ambientes

Os cinco ambientes são o lado visual e de geração dos **Locais do corpo** propostos em [lacunas-vs.md](lacunas-vs.md#locais-do-corpo-estágios); o que cada local muda na run e na saúde está em [Escolha do local](#escolha-do-local). O primeiro, Corrente sanguínea, é o mapa de hoje: o chão de areia vira o plasma, que de fato tem cor de palha.

| Ambiente | Chão (tiles) | Obstáculos | Destrutível | Decoração | Zona de terreno |
| --- | --- | --- | --- | --- | --- |
| **Corrente sanguínea** | Plasma: base com grão, estria de fluxo, proteínas | Hemácia, Cristal de colesterol | Coágulo de fibrina (3 golpes) | Plaqueta, Albumina | Correnteza: empurra tudo numa direção a 20% da velocidade |
| **Fígado** | Placas de hepatócitos: base, núcleos, gordura | Hepatócito, Veia central | Gota de gordura (1 golpe, solta 1 ATP) | Bile, Célula de Kupffer | Bile: lipídios dentro levam +20% de dano (emulsão) |
| **Intestino** | Dobras em diagonal: base, criptas, muco | Vilosidade, Bolo de fibra | Bactéria da flora (1 golpe, solta 1 gema ciano) | Muco, Enzimas | Muco: tudo anda 30% mais devagar |
| **Pulmão** | Alvéolos: base, alvéolos com ar, poeira | Alvéolo, Brônquio | Fuligem (2 golpes, solta 1 gema ciano) | Bolha de ar, Macrófago | Bolsa de ar: o agente anda 20% mais rápido |
| **Cérebro** | Giros: base, glia, axônio | Neurônio, Astrócito | Placa amiloide (2 golpes, solta 1 vesícula) | Sinapse, Mielina | Sinapse ativa: a recarga do especial corre 2× dentro |

Cores do chão (do mais escuro ao mais claro), num grupo próprio de paleta por ambiente:

| Ambiente | Tom 1 | Tom 2 | Tom 3 (base) | Tom 4 |
| --- | --- | --- | --- | --- |
| Corrente sanguínea | #B8935C | #CDA56C | #D8B47A | #E6C891 |
| Fígado | #8F5444 | #A86654 | #B87562 | #C98670 |
| Intestino | #BF7C5A | #D4916C | #E2A27E | #EDB894 |
| Pulmão | #C9A5A1 | #DDBDB9 | #E9CFCB | #F5E1DE |
| Cérebro | #8F7FA3 | #A897B9 | #B7A6C6 | #C8B9D5 |

O tom 3 da Corrente sanguínea é a areia de hoje (`world.json`), e o tom 2 é o rejunte, então o chão atual continua o mesmo de longe.

## Escolha do local

> **Proposta da [decisão 0032](decisoes/0032-local-escolhido-e-sinergia.md), pedido do Vitor:** o jogador escolhe em que parte do corpo a run acontece, em vez de o ambiente sair da semente. O par agente × local pode ter **sinergia**, que melhora um setor de saúde no fim da run. Entra na [fase 5.12 do roadmap](roadmap.md#fase-512-locais-do-corpo-e-sinergias). A tela está em [menu.md](menu.md#escolha-do-local).

A ideia é a de um remédio de verdade: o mesmo agente age melhor num lugar do que em outro. A Lipase digere gordura no intestino; a Insulina guarda glicose no fígado; a Lipase nem entra no cérebro. Escolher o local vira a segunda decisão antes da run, ao lado do agente, e as duas juntas respondem à doença do caso.

### O que cada local muda

Cada local é um dos cinco ambientes desta página (chão, objetos, zona) e traz uma família de molécula e um setor de saúde, os mesmos pares da [decisão 0023](decisoes/0023-organismo.md) (Física: açúcares e lipídios; Mental: estresse; Executiva: radicais; Social: toxinas).

| Local | Família que dobra | Setor do local | Por quê |
| --- | --- | --- | --- |
| **Corrente sanguínea** | nenhuma: a mistura da doença, como hoje | nenhum | O local neutro, por onde tudo passa. É a run de hoje |
| **Intestino** | Açúcares e lipídios | Física | É onde a comida é absorvida |
| **Cérebro** | Estresse | Mental | Cortisol e adrenalina agem no humor e na ansiedade |
| **Pulmão** | Radicais livres | Executiva | O oxigênio gera radicais; sem fôlego não há foco |
| **Fígado** | Toxinas | Social | O fígado desintoxica o etanol da noite com os amigos |

- **Família que dobra:** o peso da família do local no sorteio de moléculas e de formações é multiplicado por 2, por cima dos pesos da doença (`familyWeights` da fase 5). Uma doença de Física baixa no Intestino é a run mais cheia de açúcar e gordura do jogo.
- **Setor do local:** no fim da run, o ganho do agente nesse setor é multiplicado por 1,5. Só vale se o agente já sobe esse setor; o local não cria efeito que o agente não tem.
- **Corrente sanguínea** não dobra nada nem multiplica nada: é a referência, e continua sendo o primeiro local.
- **Indicado:** o local cujo setor é o mais baixo do caso ganha o selo INDICADO na tela de escolha. É só um aviso; o jogador pode ir a qualquer lugar.

### Sinergia agente × local

Cada agente tem **um** local de sinergia (✚), escolhido pela farmacologia real. No Cérebro há ainda a **barreira hematoencefálica** (⊘): enzimas grandes não entram.

| Agente | Corrente sanguínea | Intestino | Cérebro | Pulmão | Fígado |
| --- | --- | --- | --- | --- | --- |
| Dopamina | — | — | ✚ Mental | — | — |
| Lipase | — | ✚ Física | ⊘ | — | — |
| Insulina | — | — | — | — | ✚ Física |
| Vitamina C | — | — | — | ✚ Física | — |
| Venvanse | ✚ Executiva | — | — | — | — |
| Serotonina | — | ✚ Mental | — | — | — |
| Ocitocina | — | — | ✚ Social | — | — |
| Álcool desidrogenase | — | — | ⊘ | — | ✚ Social |
| Cafeína | — | — | — | ✚ Executiva | — |

O setor depois do ✚ é o que a sinergia melhora. O porquê de cada par:

- **Dopamina no Cérebro (Mental):** a via de recompensa. No jogo ela já nasce no cérebro; na vida real, quem atravessa a barreira é a L-DOPA.
- **Lipase no Intestino (Física):** a lipase do pâncreas digere a gordura no intestino delgado.
- **Insulina no Fígado (Física):** no fígado, a insulina guarda a glicose como glicogênio.
- **Vitamina C no Pulmão (Física):** é o principal antioxidante do líquido que reveste os alvéolos.
- **Venvanse na Corrente sanguínea (Executiva):** o pró-fármaco é ativado pelas hemácias, então chega mais rápido ao efeito. Extra só dele: a rampa de ativação do começo da run dura a metade.
- **Serotonina no Intestino (Mental):** cerca de 90% da serotonina do corpo é feita no intestino; é o eixo intestino-cérebro.
- **Ocitocina no Cérebro (Social):** é produzida no hipotálamo, onde age no vínculo.
- **Álcool desidrogenase no Fígado (Social):** é lá que o etanol vira acetaldeído e depois acetato.
- **Cafeína no Pulmão (Executiva):** é parente da teofilina, que abre os brônquios; mais ar, mais alerta.

Com o elenco de hoje (Dopamina, Lipase e Insulina), o Pulmão ainda não tem sinergia; ela chega com a Vitamina C e a Cafeína. Cada setor tem pelo menos dois agentes com sinergia (Física tem três), então toda doença tem resposta.

### Efeito da sinergia

| Onde | Sinergia ✚ | Neutro — | Barreira ⊘ |
| --- | --- | --- | --- |
| Na run | O receptor nativo começa no nível 1 em vez de 0; ícone ✚ ao lado do retrato do agente na HUD | Nada muda | O agente não pode ser escolhido para o Cérebro |
| No fim da run | +4 pontos no setor da sinergia (na mesma escala de minutos da fase 5: cheio em 10 min, até 2×) e o colateral do agente pela metade | Saúde como hoje | — |

Exemplo, caso com Física baixa, 10 minutos de run:

| Escolha | Física | Colateral | Run |
| --- | --- | --- | --- |
| Lipase na Corrente sanguínea | +10 | Mental −1 | Mistura da doença |
| Lipase no Fígado | +10 | Mental −1 | Toxinas dobradas, e a Lipase é fraca contra elas |
| Lipase no Intestino | +10 × 1,5 + 4 = **+19** | Mental −0,5 | Açúcares e lipídios dobrados; receptor nativo no nível 1 |

A sinergia deixa a run mais dura (a família dobrada é a que a doença já puxa) e paga em saúde. É o loop do organismo ficando mais curto: o jogador que entende o corpo cura mais rápido, sem precisar de mais ATP. O retorno decrescente da fase 5 continua valendo, então ninguém passa de 100.

### Efeito na meta

- **Desbloqueio:** a Corrente sanguínea é o único local no começo. Os outros quatro abrem juntos na primeira estrela (5 min) do primeiro caso, com um aviso no hub. Depois disso, ficam abertos para sempre, inclusive depois da ALTA.
- **Sorteio:** a tela de escolha tem um cartão "Qualquer lugar", que sorteia o local pela semente, como hoje, e dá +10% de ATP na run. Para quem prefere surpresa.
- **Recordes:** melhor tempo por local, além do geral. As estrelas e o baú continuam sendo do caso, valendo em qualquer local.
- **ALTA:** o próximo indivíduo tem outra doença, então o local INDICADO muda e o par que o jogador decorou deixa de ser o melhor.
- **Semente:** o código do mapa passa a dizer o local (**INTESTINO · DENSO · #A3F9**); para jogar o mesmo mapa que um amigo, o local e a semente vão juntos.
- **Campo longo:** continua sem local. Pode ganhar um depois, se o idle precisar de mais escolha.

### Parâmetros

Quando virar código, em `src/config/map.json` (por ambiente: `family`, `sector`, e as regras gerais `localFamilyWeight` 2, `localSectorMultiplier` 1,5, `randomLocalAtpBonus` 0,1, `unlockStar` 1) e em `src/config/agents.json` (por agente: `synergy` com o local e o setor, e `crossesBloodBrainBarrier`). A sinergia (`synergyHealth` 4, `synergyCollateralMultiplier` 0,5, `synergyNativeReceptorLevel` 1) fica em `src/config/organism.json`, junto com as outras regras de saúde. As contas ficam em `src/core/organism/`, sem Phaser.

## Grupos

Os objetos não nascem sozinhos: cada bloco recebe grupos que têm um motivo no corpo, como numa lâmina de histologia ([decisão 0033](decisoes/0033-grupos-de-objetos-no-mapa.md), proposta). Um grupo é feito de partes, e cada parte põe um objeto do ambiente numa forma em volta do centro do grupo:

| Forma | Como fica |
| --- | --- |
| Centro | Um objeto no meio do grupo |
| Anel | Objetos em volta, com uma posição vazia que serve de entrada |
| Fileira | Objetos em linha, numa direção sorteada |
| Aglomerado | Objetos juntos sem se sobrepor, dentro de um raio |
| Dispersão | Decoração espalhada dentro de um raio |

| Ambiente | Grupo | O que tem | Por que existe |
| --- | --- | --- | --- |
| Corrente sanguínea | Placa de ateroma | Colesterol no meio e em volta, às vezes um coágulo de fibrina, plaquetas | O colesterol gruda na parede e se acumula; em cima da placa, as plaquetas começam um coágulo |
| | Hemácias empilhadas | 3 ou 4 hemácias em fileira, albumina em volta | Em fluxo lento, as hemácias se empilham como moedas (rouleaux) |
| | Coágulo em formação | Coágulo de fibrina no meio, anel de hemácias, plaquetas | A fibrina prende as hemácias; as plaquetas chegam para fechar o buraco |
| Fígado | Lóbulo hepático | Veia central, anel de 6 ou 7 hepatócitos, Kupffer dentro, bile em volta | É a unidade do fígado: hepatócitos em volta da veia central, bile correndo por fora |
| | Esteatose | 2 ou 3 gotas de gordura cercadas de hepatócitos | Gordura acumulada dentro de um grupo de hepatócitos |
| | Cordão de hepatócitos | Fileira de hepatócitos com bile ao lado | Entre os lóbulos, os hepatócitos formam fileiras |
| Intestino | Fileira de vilosidades | 4 ou 5 vilosidades em linha, enzimas entre elas | As vilosidades crescem lado a lado na parede |
| | Colônia bacteriana | 2 a 4 bactérias juntas, às vezes uma fibra, muco | A flora cresce junta no muco, presa às fibras |
| | Bolo de fibras | 2 ou 3 fibras emboladas, às vezes uma bactéria | Fibra não digerida se embola |
| Pulmão | Cacho de alvéolos | Brônquio no meio, anel de alvéolos, bolhas de ar | Cada bronquíolo termina num cacho de alvéolos |
| | Depósito de fuligem | 2 ou 3 fuligens juntas, macrófagos em volta | A fuligem respirada se junta e os macrófagos chegam para limpar |
| | Ramo bronquial | Fileira de brônquios, bolhas de ar | Os brônquios se dividem em ramos |
| Cérebro | Rede de neurônios | 2 ou 3 neurônios, sinapses e mielina entre eles | Neurônios ligados por sinapses, com mielina nos axônios |
| | Placa amiloide | Placa no meio, anel de astrócitos | A proteína amiloide se acumula (como no Alzheimer) e os astrócitos cercam a placa |
| | Neurônio e astrócitos | Neurônio no meio, 2 ou 3 astrócitos, sinapses | Os astrócitos ficam em volta do neurônio, alimentando e protegendo |

Os grupos ficam em `src/config/map.json`, em `environments.<id>.groups`, com o peso de cada um e o texto do motivo. Para criar um grupo novo, basta juntar partes com sprites do ambiente; um teste confere que todo ambiente tem grupos e que as partes existem.

## Pontos de interesse

Pequenas montagens que quebram a repetição e dão um motivo para andar pelo mapa, como os castiçais agrupados e as salas do Vampire Survivors.

| Ponto | Como é | Por que existe |
| --- | --- | --- |
| **Ninho de vesículas** | 3 a 5 vesículas numa clareira | Recompensa por explorar; é onde a Sorte mais aparece |
| **Câmara** | Anel de obstáculos encostados, de 3 tiles de raio, com uma entrada de 2 posições e um destrutível do ambiente no meio; 8% dos blocos | Lugar seguro para respirar no pico, com uma saída só |
| **Corredor** | Duas fileiras de obstáculos encostados, de 6 a 8 tiles, com 4 tiles de passagem e as pontas abertas; 6% dos blocos | Afunila as moléculas para armas de linha (Raio UV, Jato Ácido) |
| **Sinapse e estruturas** | Círculo de 3 tiles numa clareira: sinapse, sinapse potenciada, foco inflamatório, coágulo ou glândula adrenal | Bônus para quem sai do lugar, como os santuários do Megabonk ([megabonk.md](megabonk.md#4-sinapses-e-estruturas)); 1 a cada 3 blocos em média |
| **Zona** | Mancha de 4 a 6 tiles da zona de terreno do ambiente | Muda a luta só naquele trecho |

## Relação com as outras fases

- **Fase 5.5 (itens no mapa):** as vesículas continuam nascendo num anel em volta do agente, como em [itens.md](itens.md), e passam a aparecer também nos ninhos. Proposta para a pergunta "vesículas sozinhas ou pontos fixos?": as duas coisas, o anel garante o ritmo e os ninhos premiam quem explora. Destrutíveis do mapa não entram na tabela de pesos da vesícula; cada um solta só o que a tabela de ambientes diz.
- **Fase 5.6 (variedade da run):** as formações atravessam obstáculos, para que um Cerco inflamatório não abra buracos ao bater numa hemácia.
- **Lacunas VS:** os ambientes desenham os Locais do corpo. As Cápsulas que liberam agentes e as Descobertas, também de [lacunas-vs.md](lacunas-vs.md#cápsulas-e-descobertas), podem virar pontos de interesse quando existirem.
- **Fase 6 (polimento):** o item "chão, paredes e efeitos" passa a ser o acabamento dos ambientes desta fase.
- **Campo longo (idle):** continua com o fundo atual; o mapa gerado é só do campo crônico.

## Parâmetros

Quando virar código, um `src/config/map.json`, com o tipo em `src/config/types.ts`:

- Tamanho do tile e do bloco, blocos ativos e distância para descartar.
- Ruídos: escala e limiar das manchas do chão e da densidade local; chance da variação 2.
- Densidades: chance na run, grupos, obstáculos e destrutíveis soltos por bloco.
- Passagem entre grupos, margem da borda do bloco, raio livre do início.
- Por ambiente: tiles, objetos de cada tipo com peso, raio de colisão, vida e drop dos destrutíveis, zona de terreno e o efeito dela.
- Pontos de interesse: chance por bloco, pesos e tamanhos.

## O que falta decidir

- [x] Quem escolhe o ambiente: o jogador, o caso (a doença do organismo) ou o sorteio? → o jogador, com o sorteio como opção e o caso só indicando ([Escolha do local](#escolha-do-local), [decisão 0032](decisoes/0032-local-escolhido-e-sinergia.md), proposta). No código, até a fase 5.12, continua o sorteio pela semente.
- [x] Entram os cinco ambientes de uma vez, ou a Corrente sanguínea primeiro e os outros um por fase? Os cinco de uma vez: a arte já estava pronta.
- [ ] Obstáculos bloqueiam as moléculas comuns, ou só o agente? No código, os dois (o chefe e as formações atravessam). Bloquear as duas deixa o mapa tático; bloquear só o agente deixa a run mais difícil.
- [ ] As zonas de terreno entram junto com os ambientes ou depois? Elas são mecânica nova. Ficaram para depois.
- [ ] Destrutível que solta ATP ou vesícula (Gota de gordura, Placa amiloide) mexe na economia: limitar por run ou deixar o `npm run sim` medir?
- [ ] Os números da sinergia (família ×2, setor do local ×1,5, +4 no setor do par, colateral pela metade) ficam bons, ou a sinergia precisa pesar mais (ou menos) que o agente certo na Corrente sanguínea? Medir no `npm run sim`.
- [ ] A sinergia também mexe na run (receptor nativo no nível 1), ou fica só na saúde?
- [ ] Os outros locais abrem todos na primeira estrela do primeiro caso, ou um por caso, ou com ATP?
- [ ] A barreira hematoencefálica bloqueia o agente no Cérebro, ou só tira o efeito de saúde dele lá?
- [ ] Cada local ganha um chefe próprio (hoje só a Partícula de LDL, em [lacunas-vs.md](lacunas-vs.md#locais-do-corpo-estágios))?
- [ ] Dá para digitar uma semente nas Opções e jogar o mesmo mapa que um amigo?
- [x] O tile do chão passa de 40 para 32 unidades (16 px em 2×). Passou, no `map.json`; o campo longo continua com o chão antigo. Isso muda o tamanho do rejunte de hoje; vale, ou o chão novo fica em 40 com arte de 20×20?

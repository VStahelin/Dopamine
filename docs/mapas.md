# Mapas gerados

22 de outubro de 2026 · Vitor

Cada run do campo crônico gera o próprio mapa a partir de uma semente: o chão, os obstáculos, as decorações, os destrutíveis e os pontos de interesse saem de blocos de 16×16 tiles criados em volta do agente, num de cinco **ambientes** do corpo. Assim duas runs nunca têm o mesmo chão, e a mesma semente sempre repete o mesmo mapa ([decisão 0012](decisoes/0012-passo-fixo-e-semente.md)). Entra na [fase 5.7 do roadmap](roadmap.md#fase-57-mapas-gerados) ([decisão 0026](decisoes/0026-mapas-gerados.md)).

Tudo aqui é **proposta**: quantidades, distâncias e pesos são o primeiro chute para testar. Quando virar código, os números vão para `src/config/map.json` e os desenhos para `src/assets/sprites/map.json`. A arte está na prancheta "Mapas: objetos e chão" do [canvas de identidade visual](https://claude.ai/artifact/MPV17zZywrhhXBUdfnUs6F).

## O que muda de uma run para outra

| Camada | O que varia | Quem decide |
| --- | --- | --- |
| Ambiente | Paleta do chão, objetos, moléculas mais comuns e a zona de terreno | O local do corpo da run (ver [Ambientes](#ambientes)) |
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
3. **Obstáculos.** Pontos sorteados com distância mínima de 3 tiles entre si (amostragem de Poisson). Cada ponto vira obstáculo se a densidade local deixar, até o limite da densidade da run. 30% dos obstáculos vêm em aglomerado de 2 ou 3 cópias encostadas.
4. **Destrutíveis.** 0 a 2 por bloco, nos pontos que sobraram.
5. **Decoração.** 6 a 12 por bloco, em qualquer lugar livre; não tem colisão.
6. **Ponto de interesse.** 12% de chance por bloco, nunca no bloco inicial nem colado a outro ponto de interesse.

| Densidade | Chance na run | Obstáculos por bloco | Destrutíveis por bloco |
| --- | --- | --- | --- |
| Aberto | 25% | 2 a 4 | 0 a 1 |
| Padrão | 50% | 5 a 8 | 1 a 2 |
| Denso | 25% | 9 a 12 | 1 a 2 |

### Regras que nunca quebram

- **Começo livre:** nada com colisão num raio de 4 tiles do ponto de início.
- **Sempre passa:** dois obstáculos (ou aglomerados) ficam a pelo menos 3 tiles um do outro, o triplo do agente. Assim nenhum beco fecha e não precisa de busca de caminho.
- **Colisão simples:** obstáculo é um círculo. Agente e moléculas deslizam pela borda; projéteis, gemas e ATP passam por cima.
- **Quem atravessa:** o chefe e as moléculas das formações da [fase 5.6](roadmap.md#fase-56-variedade-da-run) ignoram obstáculos; o chefe quebra os destrutíveis em que encosta.
- **Nada nasce dentro:** molécula, gema ou item que cairia dentro de um obstáculo é empurrado para o lugar livre mais perto.
- **Leitura primeiro:** o chão usa 4 tons próximos do ambiente, sem contorno. Obstáculos, destrutíveis e decoração têm o contorno escuro de 1 px dos ícones. Nada do mapa usa o ciano das gemas e dos disparos nem o dourado do ATP como cor principal.

## Os objetos

Cinco tipos de objeto, todos em pixel art de 16×16 com a paleta dos ícones.

| Tipo | Colisão | Vida | O que faz |
| --- | --- | --- | --- |
| **Obstáculo** | sim | — | Bloqueia agente e moléculas; serve para despistar e afunilar inimigos |
| **Destrutível** | sim, até quebrar | 1 a 3 golpes | Abre caminho e pode soltar algo |
| **Vesícula** | não | 1 golpe | A fonte de itens de [itens.md](itens.md); igual em todos os ambientes |
| **Decoração** | não | — | Só dá vida ao chão; nunca esconde gema ou molécula (fica embaixo delas) |
| **Zona de terreno** | não | — | Mancha no chão com efeito em quem está dentro (proposta, ver abaixo) |

## Ambientes

Os cinco ambientes são o lado visual e de geração dos **Locais do corpo** propostos em [lacunas-vs.md](lacunas-vs.md#locais-do-corpo-estágios). O primeiro, Corrente sanguínea, é o mapa de hoje: o chão de areia vira o plasma, que de fato tem cor de palha.

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

## Pontos de interesse

Pequenas montagens que quebram a repetição e dão um motivo para andar pelo mapa, como os castiçais agrupados e as salas do Vampire Survivors.

| Ponto | Como é | Por que existe |
| --- | --- | --- |
| **Ninho de vesículas** | 3 a 5 vesículas numa clareira | Recompensa por explorar; é onde a Sorte mais aparece |
| **Câmara** | Anel de obstáculos com uma abertura e um destrutível do ambiente no meio | Lugar seguro para respirar no pico, com uma saída só |
| **Corredor** | Duas fileiras de obstáculos com 4 tiles de passagem | Afunila as moléculas para armas de linha (Raio UV, Jato Ácido) |
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
- Densidades: chance na run, obstáculos e destrutíveis por bloco.
- Obstáculos: distância mínima, chance de aglomerado, raio livre do início.
- Por ambiente: tiles, objetos de cada tipo com peso, raio de colisão, vida e drop dos destrutíveis, zona de terreno e o efeito dela.
- Pontos de interesse: chance por bloco, pesos e tamanhos.

## O que falta decidir

- [ ] Quem escolhe o ambiente: o jogador, o caso (a doença do organismo) ou o sorteio? (Mesma pergunta dos Locais do corpo em [lacunas-vs.md](lacunas-vs.md#perguntas-em-aberto).)
- [ ] Entram os cinco ambientes de uma vez, ou a Corrente sanguínea primeiro e os outros um por fase?
- [ ] Obstáculos bloqueiam as moléculas comuns, ou só o agente? Bloquear as duas deixa o mapa tático; bloquear só o agente deixa a run mais difícil.
- [ ] As zonas de terreno entram junto com os ambientes ou depois? Elas são mecânica nova.
- [ ] Destrutível que solta ATP ou vesícula (Gota de gordura, Placa amiloide) mexe na economia: limitar por run ou deixar o `npm run sim` medir?
- [ ] Dá para digitar uma semente nas Opções e jogar o mesmo mapa que um amigo?
- [ ] O tile do chão passa de 40 para 32 unidades (16 px em 2×). Isso muda o tamanho do rejunte de hoje; vale, ou o chão novo fica em 40 com arte de 20×20?

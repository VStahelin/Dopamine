# Lacunas frente ao Vampire Survivors

22 de outubro de 2026 · Vitor

O Vampire Survivors (VS) tem pelo menos 20 sistemas que ainda não desenhamos; 6 deles valem entrar logo, porque deixam a run mais variada sem mexer na arquitetura. Tudo aqui é **proposta**: a lista compara o VS com o que já está nos docs e no código da `main` (v0.4), e sugere uma versão química de cada sistema. Itens que caem dos inimigos ficam de fora: estão em [itens.md](itens.md).

## Resumo

O Vitor aprovou cinco das seis recomendações em 22/10/2026 e deixou as Conquistas para depois:

| # | Recomendação | Decisão | Onde entra no roadmap |
| --- | --- | --- | --- |
| 1 | **Baú do chefe com evolução.** O chefe solta uma cápsula que abre com 1, 3 ou 5 recompensas, e é ali que a arma no máximo evolui. A **Sorte** melhora a quantidade e também a raridade das recompensas | aprovada | Fase 5.5 (cápsula do chefe, [itens.md](itens.md)) |
| 2 | **Ondas com formação.** Enxames que cruzam a tela e anéis que fecham em volta do agente, além do dente de serra que já existe | aprovada | [Fase 5.6](roadmap.md#fase-56-variedade-da-run) |
| 3 | **Perfil farmacológico.** Cada agente ganha um bônus próprio a cada 10 níveis, como os personagens do VS | aprovada | [Fase 5.6](roadmap.md#fase-56-variedade-da-run) |
| 4 | **Superdosagem (Limit Break).** Depois que tudo chega ao máximo, cada level up ainda sobe um pouco uma arma | aprovada | [Fase 5.6](roadmap.md#fase-56-variedade-da-run) |
| 5 | **Conquistas que liberam conteúdo.** Cada meta libera algo no pool ou dá ATP | para elaborar no futuro | [Depois](roadmap.md#depois-conquistas) |
| 6 | **Estruturas destrutíveis no mapa.** Bolsas no chão que, quebradas, soltam um item | aprovada | Fase 5.5 (vesículas, [itens.md](itens.md)) |

Esforço: **P** cabe em até um dia, **M** em alguns dias, **G** em uma semana ou mais. É estimativa, sem medir no código.

## O VS lado a lado com o Dopamina Blaster

| Sistema do VS | Como é no VS | Nós hoje | Versão química proposta | Esforço | Prioridade |
| --- | --- | --- | --- | --- | --- |
| Baú do chefe | Chefe solta baú com 1, 3 ou 5 itens; depois dos 10 min evolui uma arma no máximo | Evolução é opção do level up; a prancheta já previa o baú | **Cápsula do chefe**: roleta de 1, 3 ou 5 recompensas, quantidade e raridade pela Sorte, e faz a evolução | M | Alta (fase 5.5) |
| Formações de inimigos | Morcegos cruzando a tela, anéis e paredes que fecham | Só spawn em volta e o pico a cada 5 min | **Pico glicêmico** (enxame de açúcar atravessa), **Cerco inflamatório** (anel de citocinas) | P–M | Alta (fase 5.6) |
| Bônus do personagem | Cada personagem tem atributos base e um bônus que cresce por nível | Agente tem ação, especial e afinidade; sem bônus por nível | **Perfil farmacológico**: +X num atributo a cada 10 níveis, até um teto | P | Alta (fase 5.6) |
| Limit Break | Depois de tudo no máximo, o level up continua subindo armas | "Nova dose" recupera interações quando não sobra upgrade | **Superdosagem**: um aumento pequeno e aleatório numa arma por level up | P | Alta (fase 5.6) |
| Conquistas e desbloqueios | Quase todo o conteúdo libera por meta (nível 50 com X, minuto 31 em Y) | Desbloqueio só com ATP; Conquistas é placeholder | **Conquistas** que liberam itens do pool, protocolos e agentes, ou dão ATP | M | Futuro |
| Fontes de luz (destrutíveis) | Tochas espalhadas, 10 de vida, soltam um item | Não existe | **Células e lipossomos** no chão que soltam um item ao quebrar | P–M | Alta (fase 5.5) |
| Uniões | Duas armas viram uma, liberando um espaço | Só evolução arma + reagente | **Síntese**: duas armas do pool reagem e viram uma | M | Média |
| Arcanas | Cartas de tarô que mudam regras; 1 no início e mais 2 em baús aos 11 e 21 min | Não existe | **Protocolos** clínicos: 1 no início, mais 2 em vesículas especiais | G | Média |
| Estágios | Mapas com layout, inimigos, chefes e tempo próprios | Um mapa só; o organismo muda as moléculas | **Locais do corpo**: corrente sanguínea, fígado, intestino, pulmão, cérebro | G | Média |
| Modos do estágio | Hyper, Hurry, Inverse, Endless, eventos aleatórios | Run infinita e Estresse (Maldição) como atributo | **Dose de ataque**, **Liberação imediata**, **Recidiva** | P cada | Média |
| Itens fixos no mapa e caixões | Itens e relíquias no chão; caixões liberam personagens | Não existe | **Cápsulas** que liberam agentes e **Descobertas** que liberam funções | M | Média |
| Vitória e Ceifador | Sobreviver ao tempo do estágio vence; depois vem o Ceifador | Run infinita, estrelas aos 5, 10 e 15 min | **Alta** aos 30 min, depois a **Apoptose** (o Ceifador) | P | Média |
| Eventos aleatórios | Roleta sorteia um evento no minuto seguinte | Não existe | **Sintomas**: Febre, Jejum, Refeição, Insônia | M | Baixa |
| Mercador | Vende itens, rerrolagens e ovos na run | Não existe | **Farmácia** no mapa, paga com ATP da run | M | Baixa |
| Reembolso de PowerUps | Devolve todo o ouro gasto nos PowerUps | Laboratório sem reembolso | **Reembolso** no Laboratório | P | Baixa |
| Level up aleatório | Opção que escolhe sozinha no level up | Não existe | **Escolha automática**, nas Opções | P | Baixa |
| Transformação do personagem | Alguns personagens mudam de forma no nível 80 | Só a rampa do Venvanse | **Metabólito ativo**: o agente vira a forma ativa num nível alto | M | Baixa |
| Livro e mapa na pausa | Relíquias liberam evoluções vistas e mapa na pausa | Compêndio só com moléculas | **Livro de receitas** na pausa (evoluções e sínteses vistas) | P | Baixa |
| Segredos | Códigos que liberam extras | Não existe | **Receitas secretas**: códigos digitados nas Opções | P | Baixa |
| Coop local | Até 4 jogadores na mesma tela | Não existe | Coop local com 2 agentes | G | Baixa |

Já cobertos: ataque automático, level up com escolhas, armas com 8 níveis, passivos, evoluções, Rerrolar, Pular e Banir, Maldição (Estresse), reviver (Segunda dose), PowerUps (Laboratório), personagens desbloqueáveis, bestiário (Compêndio), recordes e chefes periódicos.

## As propostas em detalhe

### Cápsula do chefe (baú)

- O chefe solta uma cápsula no chão (o nome final está em [itens.md](itens.md)). Ao encostar, abre uma roleta curta e entrega 1, 3 ou 5 recompensas.
- A **Sorte** mexe nas duas coisas: aumenta a chance de 3 e 5 recompensas e melhora a raridade de cada uma, com a mesma regra de raridade do level up ([decisão 0013](decisoes/0013-raridade-e-sorte.md)).
- Recompensa = um nível numa arma ou passivo que o agente já tem. Se houver arma no máximo com o reagente certo, a primeira recompensa vira a evolução, como no VS.
- A evolução sai da tela de level up. Antes dos 10 minutos a vesícula só dá níveis.
- O drop da vesícula é do chefe; o conteúdo e a cerimônia de abrir ficam aqui.

### Ondas com formação

Além do spawn contínuo em volta, eventos programados em `run.json`:

| Formação | Como é | Molécula |
| --- | --- | --- |
| Pico glicêmico | Enxame rápido que atravessa a tela em linha reta e some | Glicose e frutose |
| Cerco inflamatório | Anel de inimigos parados que fecha devagar em volta do agente | Citocinas |
| Parede lipídica | Fileira lenta que varre o mapa de um lado ao outro | Triglicerídeos |
| Surto de cortisol | Um cortisol no centro de um grupo, todos acelerados | Cortisol e adrenalina |

### Perfil farmacológico

Cada agente ganha um atributo próprio a cada 10 níveis, até o nível 50, como no VS (o Antonio ganha +10% de dano a cada 10 níveis). Exemplos: Dopamina +5% de Metabolismo; Lipase +10% de Reatividade contra lipídios; Insulina +10% de Raio de coleta. Os valores vão em `agents.json`.

### Superdosagem (Limit Break)

Quando todas as armas e passivos estão no máximo, o level up passa a oferecer "Superdosagem": um aumento pequeno e sorteado (dano, área, recarga) numa arma. Fica junto com a "Nova dose", sem teto, e o banner avisa que a run entrou na fase de excesso.

### Conquistas

A aba Conquistas lista metas como "Decompor 1.000 triglicerídeos", "Chegar ao nível 50 com a Lipase" ou "Sobreviver 20 minutos com o Estresse ligado". Cada uma dá ATP ou libera algo: um protocolo, um reagente ou o direito de comprar um agente. Assim o desbloqueio vem por jogar, não só por juntar ATP.

### Estruturas destrutíveis

Viraram as **vesículas** da fase 5.5: bolsas paradas no chão que se rompem com um golpe e soltam um item sorteado, com mais chance de item raro pela Sorte, como as fontes de luz do VS. As regras estão em [itens.md](itens.md).

### Síntese (uniões)

Duas armas do pool, ambas no máximo, reagem e viram uma arma nova, liberando um espaço. Exemplos: Radical Livre + Raio UV → **Fotólise em cadeia**; Poça de Solvente + Catalisador → **Meio reacional**; Nuvem de Elétrons + Reação em Cadeia → **Eletrólise**. Vai em `weapons.json`, como as evoluções.

### Protocolos (arcanas)

Cartas que mudam regras da run. O jogador escolhe 1 antes da run, e duas vesículas especiais, aos 11 e 21 minutos, oferecem mais. Adaptações das arcanas do VS:

| Protocolo | Arcana do VS | Efeito |
| --- | --- | --- |
| Isômero | Gemini | Armas listadas ganham uma cópia espelhada |
| Combustão | Twilight Requiem | Projéteis explodem ao expirar |
| Metabolismo ativo | Tragic Princess | Recarga das armas cai enquanto o agente anda |
| Reforço | Awake | +3 Segundas doses; cada uma usada dá atributos |
| Homeostase | Sarabande of Healing | Cura dobrada; a cura fere quem está perto |
| Ressonância | Waltz of Pearls | Projéteis ganham até 3 ricochetes |
| Peristaltismo | Mad Groove | A cada 2 min, puxa todos os itens do mapa |
| Choque térmico | Out of Bounds | Inimigo congelado explode |
| Ciclo circadiano | Wicked Season | Aprendizado, Sorte, Rendimento e Estresse dobram em ciclos |
| Glicólise | Disco of Gold | Coletar ATP recupera interações |
| Clivagem | Slash | Armas listadas ganham catálise (crítico) dobrada |

Liberados por conquistas.

### Locais do corpo (estágios)

O caso escolhe onde a run acontece, ligando o mapa à fase 5. O chão, os objetos e a geração de cada local estão em [mapas.md](mapas.md#ambientes).

| Local | Moléculas mais comuns | Layout | Chefe |
| --- | --- | --- | --- |
| Corrente sanguínea | Todas (o mapa de hoje) | Aberto | Partícula de LDL |
| Fígado | Toxinas | Lóbulos com corredores | A definir |
| Intestino | Açúcares e lipídios | Faixa longa na horizontal | A definir |
| Pulmão | Radicais livres | Alvéolos (salas redondas) | A definir |
| Cérebro | Hormônios do estresse | Aberto; só alguns agentes entram (barreira hematoencefálica) | A definir |

### Modos

| Modo | Modo do VS | Efeito |
| --- | --- | --- |
| Dose de ataque | Hyper | Agente e projéteis mais rápidos, +50% de ATP |
| Liberação imediata | Hurry | O relógio corre 2× e o XP sobe 25%; runs curtas no celular |
| Recidiva | Inverse | Mapa escuro e invertido, inimigos mais fortes, mais ATP e Sorte |

### Cápsulas e Descobertas

- **Cápsula:** um agente bloqueado aparece preso numa cápsula num ponto do mapa; abrir libera o agente sem ATP. É a versão química do caixão do VS.
- **Descoberta:** objetos únicos no mapa que liberam funções para sempre, como as relíquias. Exemplos: Livro de receitas (evoluções vistas na pausa), Mapa (mapa na pausa), Protocolo inicial (liga os Protocolos).

### Alta e Apoptose (vitória e Ceifador)

A run continua infinita, mas aos 30 minutos o caso recebe **Alta**: conta como vitória, dá ATP extra e acende uma marca no palco. Depois vem a **Apoptose**, um inimigo quase invencível que faz o papel do Ceifador. Isso muda a decisão "run infinita", então precisa do seu sim.

## O que fica de fora

- **Itens que caem dos inimigos:** estão em [itens.md](itens.md).
- **Ovos de ouro:** bônus permanente sem teto, contra o teto de +50% de poder permanente da [economia](economia.md).
- **Aventuras:** campanhas separadas com progresso próprio; o caso e o reset do organismo já fazem esse papel.
- **Escolha de música e skins:** fica para a fase 6.
- **Fases de desafio:** só depois de existir mais de um local do corpo.

## Perguntas em aberto

- [x] As recomendações de prioridade alta entram no roadmap? → sim: 1 e 6 na fase 5.5, 2 a 4 na fase 5.6, Conquistas depois.
- [ ] A Alta aos 30 minutos e a Apoptose valem, ou a run continua infinita sem vitória?
- [ ] Locais do corpo são escolhidos pelo jogador, ou o caso decide o local?
- [ ] Conquistas substituem parte do desbloqueio por ATP, ou só somam?
- [ ] Os nomes (Protocolo, Síntese, Superdosagem, Apoptose) funcionam? A "Alta aos 30 minutos" precisa de outro nome, porque ALTA já é o reset do organismo na fase 5.
- [ ] Coop local interessa para jogar com os amigos, ou fica fora do escopo?

## Fontes

- [Arcanas](https://vampire.survivors.wiki/w/Arcana)
- [Estágios e modos](https://vampire-survivors.fandom.com/wiki/Stages)
- [Fontes de luz](https://vampire-survivors.fandom.com/wiki/Light_source)
- [Relíquias](https://vampire-survivors.fandom.com/wiki/Relic)
- [Evoluções, uniões e baús](https://vampire-survivors.fandom.com/wiki/Evolution)
- [PowerUps](https://vampire-survivors.fandom.com/wiki/PowerUp?oldid=5168)
- [Aventuras](https://vampire-survivors.fandom.com/wiki/Adventures)
- [Mercador e ovos de ouro](https://www.thegamer.com/vampire-survivors-unlock-merchant-golden-egg-glass-vizard/)

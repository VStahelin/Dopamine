# Lacunas de desenvolvimento

23 de outubro de 2026 · Vitor

Mapa do que ainda falta desenvolver no Farmaco Battle, feito comparando o código da `main` (v0.16.0) com os docs, o roadmap e as decisões. As fases 0 a 5.11 estão implementadas, mas o jogo ainda mostra que está pela metade: **3 dos 9 agentes da run existem**, a família **inflamação não tem nenhuma molécula**, **só há um chefe** (a Partícula de LDL), **todas as moléculas só perseguem o agente** (os comportamentos por família não existem), a aba **Conquistas é um "EM BREVE"**, **38 dos 47 efeitos sonoros faltam** e **nenhuma fase desde a 2.6 foi validada no celular**. Tudo aqui é **proposta**; a ordem de fases sugerida está na [decisão 0034](decisoes/0034-fases-para-fechar-lacunas.md).

## Como ler

- **Estado:** **Doc** = documentado e não implementado; **Metade** = implementado pela metade, placeholder ou "Em breve"; **Sem doc** = lacuna que nem está nos docs.
- **Impacto:** **Alto** muda o que o jogador sente em toda run ou trava o lançamento; **Médio** dá variedade ou profundidade; **Baixo** é acabamento.
- **Esforço:** **P** cabe em até um dia, **M** em alguns dias, **G** em uma semana ou mais. É estimativa a partir do código, sem medir.
- **Fonte:** o arquivo e a linha (ou a seção do doc) de onde veio o item.

## As 12 prioridades

Ordenadas por impacto dividido por esforço, com as dependências respeitadas.

| # | Lacuna | Área | Estado | Impacto | Esforço | Fase proposta |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Validar no celular as fases 2.6 a 5.11 (10 itens "falta validar") | Balanceamento | Metade | Alto | P–M | 5.13 |
| 2 | Ícones do PWA em PNG (192, 512, maskable) e `apple-touch-icon` | Plataforma | Doc | Alto | P | 5.13 |
| 3 | Efeitos sonoros P1 (armas, combate, coleta, level up, interface) | Áudio | Doc | Alto | M | 5.13 |
| 4 | Comportamento próprio de cada família de molécula (aura do cortisol, poça do acetaldeído, radical errático, spawner) | Inimigos | Metade | Alto | M–G | 5.14 |
| 5 | Família inflamação: a Citocina e as moléculas do Cerco inflamatório | Inimigos | Doc | Alto | M | 5.14 |
| 6 | Mais chefes: um por local do corpo e a Placa de fim de indivíduo | Inimigos | Doc / Sem doc | Alto | M–G | 5.14 |
| 7 | Locais do corpo e sinergias (fase 5.12 inteira) | Mapas | Doc | Alto | M–G | 5.12 |
| 8 | Os 6 agentes que faltam: Vitamina C, Serotonina, Álcool desidrogenase, Cafeína, Ocitocina, Venvanse | Agentes | Doc | Alto | G | 5.15 |
| 9 | Evolução para Nuvem de Elétrons, Poça de Solvente e Reação em Cadeia | Armas | Sem doc | Médio | M | 5.15 |
| 10 | Estatísticas acumuladas no save e Conquistas | Meta | Metade | Alto | M | 5.16 |
| 11 | Primeira run guiada (tutorial) | UI | Sem doc | Alto | M | 6 |
| 12 | UI de tela larga no PC (HUD, idle, menus) | UI | Metade | Médio | G | 6 |

## Ganhos rápidos e apostas grandes

**Ganhos rápidos** (impacto Médio ou Alto, esforço P):

- Ícones do PWA em PNG ([Plataforma](#plataforma-e-pwa)).
- Jingles `bossIn` e `crisisIn` ([Áudio](#áudio)).
- "De onde vem" cada bônus na aba Atributos ([Receptores](#receptores-suplementos-e-level-up)).
- Pontos de interesse câmara e corredor, e estruturas numa clareira dos blocos ([Mapas](#mapas-e-ambientes)).
- Maré tóxica deixando poças, quando a poça do acetaldeído existir ([Inimigos](#inimigos-e-chefes)).
- Limpar o conteúdo de placeholder que sobrou no código ([UI](#ui-e-telas)).
- Casos anteriores no palco do hub ([Meta](#meta-progressão-lab-organismo-e-caso)).

**Apostas grandes** (impacto Alto, esforço G): os 6 agentes, os comportamentos por família com os chefes novos, a fase 5.12 e a UI de tela larga.

## Agentes jogáveis

A escolha do agente mostra 6 agentes "EM BREVE" que não existem no código. A aba Agentes também lista os do idle numa seção com o selo da fase 4.

| Lacuna | Estado | Impacto | Esforço | Fonte |
| --- | --- | --- | --- | --- |
| **Vitamina C** (radicais): disparos que neutralizam, especial Escudo antioxidante | Doc | Alto | M | [personagens.md](personagens.md#vitamina-c); só 3 agentes em `src/config/agents.json` |
| **Serotonina** (estresse): aura que desacelera, especial Calmaria que anula auras de cortisol e adrenalina | Doc | Alto | M | [personagens.md](personagens.md#serotonina); a Calmaria depende da aura do cortisol, que não existe |
| **Álcool desidrogenase** (toxinas): golpes em sequência, termina a cascata do etanol, especial Desintoxicação que limpa poças | Doc | Alto | M | [personagens.md](personagens.md#álcool-desidrogenase); depende da poça do acetaldeído, que não existe |
| **Cafeína**: disparos rápidos em várias direções, anda mais rápido, especial Alerta | Doc | Médio | M | [personagens.md](personagens.md#cafeína) |
| **Ocitocina**: moléculas aliadas que orbitam e atacam (tipo de ação novo), especial Vínculo | Doc | Médio | M–G | [personagens.md](personagens.md#ocitocina) |
| **Venvanse**: raio fino em alvo único, pró-fármaco que fica mais forte nos primeiros minutos, especial Hiperfoco que desacelera o tempo | Doc | Médio | M–G | [personagens.md](personagens.md#venvanse-lisdexanfetamina); nome de marca ainda em aberto |
| Receptor nativo, custo de desbloqueio e ícones dos 6 agentes novos | Sem doc | Alto | P | Só os 3 atuais têm `nativeReceptor` (`agents.json`) e custo (`meta.json`, `unlockCost.agents`) |
| Sons dos especiais dos 6 agentes | Doc | Baixo | P | [efeitos-sonoros.md](efeitos-sonoros.md#especiais-dos-agentes) |
| Eixos **qualidade, dose e potência** por agente: não existe progressão por agente na run | Doc | Alto | G | [mecanicas.md](mecanicas.md#agentes-e-efeito-na-saúde); precisa de decisão nova antes |
| Colaterais que dependem da dose: queda maior do Pico da Dopamina, hipoglicemia da Insulina | Doc | Baixo | P | [personagens.md](personagens.md) linhas 73 e 93; dependem do eixo dose |
| Desbloqueio "moeda + nível do agente anterior": hoje é só ATP | Doc | Médio | P | [conceito.md](conceito.md#meta-progressão), [personagens.md](personagens.md#elenco-inicial-e-desbloqueios) |
| Evolução das ações dos agentes (Pulso, Hidrólise, Campo de captação) | Sem doc | Médio | M | `weapons.json`: só armas do pool têm `evolution` |
| Idle: Magnésio reduzindo o cortisol na run e Endorfina com rajada extra quando a run termina bem | Doc | Baixo | P | [personagens.md](personagens.md#agentes-do-idle) linhas 186 e 188 |

**Ordem sugerida dos agentes:** primeiro **Vitamina C, Serotonina e Álcool desidrogenase**, porque hoje radicais, estresse e toxinas não têm nenhum agente forte contra eles (a matriz só cobre lipídios e açúcares) e porque dão o motivo de jogo para as famílias novas. Depois **Cafeína, Ocitocina e Venvanse**, que trazem mecânicas novas (velocidade, aliados, tempo lento).

## Inimigos e chefes

Hoje são 15 moléculas e um chefe. Todas se comportam igual: perseguem o agente em linha reta, e a família só muda vida, velocidade e tamanho do grupo.

| Lacuna | Estado | Impacto | Esforço | Fonte |
| --- | --- | --- | --- | --- |
| **Família inflamação vazia**: nenhuma molécula com `type: "inflammation"`; o Cerco inflamatório usa as comuns | Doc | Alto | M | `src/config/enemies.json`; [roadmap 5.6](roadmap.md#fase-56-variedade-da-run); a **Citocina** (spawner parado) está em [personagens.md](personagens.md#inflamação) |
| **Comportamento por família**: radicais erráticos que ricocheteiam, estresse com aura que acelera e protege os vizinhos, toxinas que pioram ao quebrar (poça do acetaldeído), inflamação que gera inimigos | Metade | Alto | M–G | Tabela de tipos em [personagens.md](personagens.md#tipos-de-molécula-ofensora); `src/core/run/` não tem comportamento por tipo |
| Efeitos temporários de inimigo no agente (Lentidão, Adrenalina) que a prancheta já desenha | Metade | Médio | P | [roadmap 2.7](roadmap.md#fase-27-campo-crônico-com-a-cara-do-canvas) ("fica para quando a mecânica existir") |
| Maré tóxica ainda sem poças | Metade | Médio | P | [roadmap 5.6](roadmap.md#fase-56-variedade-da-run) |
| **Só um chefe** (LDL a cada 5 min, `run.json`, `bosses`) | Doc / Sem doc | Alto | M–G | Chefes por local "A definir" em [lacunas-vs.md](lacunas-vs.md#locais-do-corpo-estágios) |
| **Placa**, chefe de fim de indivíduo que fecha parte do mapa | Doc | Médio | M | [personagens.md](personagens.md#chefes) linha 57 |
| Chefe que muda com a doença ou o local (um por família) | Sem doc | Alto | M | Sem doc; liga com a fase 5.12 |
| Poucas moléculas por família: açúcares têm 5; estresse, radicais e toxinas têm 2 cada | Sem doc | Médio | M | `enemies.json`; sugestões: Noradrenalina, Superóxido, Peróxido de hidrogênio, Amônia, Ácido úrico, Interleucina |
| Docs e código com moléculas diferentes: o doc fala em Superóxido e Peróxido de hidrogênio, o código tem Radical hidroxila e Peroxinitrito; a cascata do LDL no doc tem colesterol e proteína | Metade | Baixo | P | [personagens.md](personagens.md#radicais-livres) linha 37 e linha 56; atualizar o doc |
| Inimigos de elite além dos agregados (a Especificidade fala em elite) | Sem doc | Baixo | P | `passives.json`, `specificity` |

## Armas, evoluções e reagentes

| Lacuna | Estado | Impacto | Esforço | Fonte |
| --- | --- | --- | --- | --- |
| **Nuvem de Elétrons, Poça de Solvente e Reação em Cadeia sem evolução** (só 4 das 7 evoluem) | Sem doc | Médio | M | `weapons.json`; [armas.md](armas.md#as-7-armas-iniciais) só lista 4 evoluções |
| O doc da Enzima ainda diz "passivo a definir"; o código usa a Coenzima | Metade | Baixo | P | [armas.md](armas.md) linha 51 |
| Armas de arquétipos que faltam: explosão (Combustão), aleatório, limpeza de tela (Fissão) | Doc | Médio | M cada | [armas.md](armas.md) linha 53 |
| **Síntese** (duas armas no máximo viram uma) | Doc | Médio | M | [lacunas-vs.md](lacunas-vs.md#síntese-uniões) |
| **Protocolos** (arcanas: regras da run) | Doc | Médio | G | [lacunas-vs.md](lacunas-vs.md#protocolos-arcanas) |
| Evolução pela cápsula de prata e pelo level up ao mesmo tempo (decidir se fica só na cápsula) | Doc | Baixo | P | [itens.md](itens.md) linha 107 |

## Receptores, suplementos e level up

| Lacuna | Estado | Impacto | Esforço | Fonte |
| --- | --- | --- | --- | --- |
| "De onde vem" cada bônus na aba Atributos (receptor, suplemento, Laboratório, perfil) | Metade | Médio | P | [roadmap 5.6 e 5.9](roadmap.md#fase-59-suplementos-e-ampolas) |
| **Ribossomo** (duplica suplemento) e **Farmácia** (vende suplementos com ATP da run) | Doc | Médio | M | [megabonk.md](megabonk.md#4-sinapses-e-estruturas) linhas 161 e 162 |
| Arsenal mostra todos os modificadores porque o save não guarda os vistos | Metade | Baixo | P | [roadmap 2.6](roadmap.md#fase-26-sprites-e-ícones-da-identidade-visual) |
| Escolha automática no level up e Livro de receitas na pausa | Doc | Baixo | P | [lacunas-vs.md](lacunas-vs.md#o-vs-lado-a-lado-com-o-farmaco-battle) |

## Mapas e ambientes

| Lacuna | Estado | Impacto | Esforço | Fonte |
| --- | --- | --- | --- | --- |
| **Fase 5.12 inteira**: local escolhido, família e setor por local, sinergia, barreira hematoencefálica, faixa do local no hub | Doc | Alto | M–G | [roadmap 5.12](roadmap.md#fase-512-locais-do-corpo-e-sinergias), [mapas.md](mapas.md#escolha-do-local), [decisão 0032](decisoes/0032-local-escolhido-e-sinergia.md) |
| Pontos de interesse **câmara** e **corredor** | Doc | Médio | P–M | [mapas.md](mapas.md#pontos-de-interesse) linhas 214 e 215 |
| **Zonas de terreno** (correnteza, bile, muco, bolsa de ar, sinapse ativa) | Doc | Médio | M | [mapas.md](mapas.md#ambientes); [roadmap 5.7](roadmap.md#fase-57-mapas-gerados) |
| Estruturas da 5.11 como pontos de interesse dos blocos | Metade | Baixo | P | [roadmap 5.11](roadmap.md#fase-511-sinapses-e-estruturas) |
| Layout próprio por local (lóbulos com corredores, faixa longa no intestino, alvéolos como salas): hoje só muda o chão e os objetos | Sem doc | Médio | M | Ideia em [lacunas-vs.md](lacunas-vs.md#locais-do-corpo-estágios); não está em [mapas.md](mapas.md) |
| Digitar uma semente e jogar o mesmo mapa que um amigo | Doc | Baixo | P | [mapas.md](mapas.md#o-que-falta-decidir) linha 250 |

## Campo longo (idle)

| Lacuna | Estado | Impacto | Esforço | Fonte |
| --- | --- | --- | --- | --- |
| Conteúdo curto: 5 agentes, 3 melhorias, 4 moléculas no sorteio das ondas e o LDL de chefe | Sem doc | Médio | M | `src/config/idle.json` (`waves.pool`, `upgrades`) |
| As famílias novas e os chefes da fase 5.14 também no idle | Sem doc | Médio | P | Depende da fase 5.14 |
| O jogador posiciona os agentes da base? | Doc | Baixo | M | [roadmap, decisões que travam](roadmap.md#decisões-que-travam-cada-fase) |
| Painel do idle ao lado da run em tela larga | Doc | Baixo | M | [roadmap fase 4](roadmap.md#fase-4-campo-longo-idle) |
| Ritmo das ondas e ATP validados no celular | Metade | Médio | P | [roadmap fase 4](roadmap.md#fase-4-campo-longo-idle) |

## Meta-progressão (Lab, Organismo e Caso)

| Lacuna | Estado | Impacto | Esforço | Fonte |
| --- | --- | --- | --- | --- |
| **Objetivo da run**: a run é infinita, sem vitória. A "Alta aos 30 min" com a Apoptose espera o seu sim e um nome novo | Doc | Alto | P | [lacunas-vs.md](lacunas-vs.md#alta-e-apoptose-vitória-e-ceifador) |
| Casos anteriores, já curados, rolando abaixo do palco | Doc | Médio | P | [menu.md](menu.md#palco-o-caso-atual) linha 90; o save não guarda o histórico de indivíduos |
| Só 4 doenças, uma por setor | Sem doc | Médio | P | `organism.json`, `illnesses`; doenças combinadas (dois setores baixos) dariam mais casos |
| Modos de run (Dose de ataque, Liberação imediata, Recidiva) | Doc | Médio | P cada | [lacunas-vs.md](lacunas-vs.md#modos) |
| Sintomas (eventos aleatórios) | Doc | Baixo | M | [lacunas-vs.md](lacunas-vs.md#o-vs-lado-a-lado-com-o-farmaco-battle) |
| Reembolso no Laboratório | Doc | Baixo | P | [lacunas-vs.md](lacunas-vs.md#o-vs-lado-a-lado-com-o-farmaco-battle) |
| Medir se o segundo indivíduo chega de 2 a 5 vezes mais rápido | Metade | Alto | P | [roadmap fase 5](roadmap.md#fase-5-organismo) |

## Conquistas e Compêndio

| Lacuna | Estado | Impacto | Esforço | Fonte |
| --- | --- | --- | --- | --- |
| **Conquistas**: o botão do hub abre um placeholder "EM BREVE" | Metade | Alto | M | `src/game/scenes/HubScene.ts:585-600`, `src/game/ui/menuContent.ts` (`achievements`); [roadmap, Depois](roadmap.md#depois-conquistas) |
| **Estatísticas acumuladas** no save (decompostas por molécula, minutos por agente, chefes vencidos): pré-requisito das conquistas | Sem doc | Alto | P | `src/core/save/saveData.ts:13-18` só guarda 4 recordes globais |
| Cápsulas que liberam agentes e Descobertas no mapa | Doc | Médio | M | [lacunas-vs.md](lacunas-vs.md#cápsulas-e-descobertas) |
| Recordes por agente e por local | Doc / Sem doc | Baixo | P | Por local na [fase 5.12](roadmap.md#fase-512-locais-do-corpo-e-sinergias); por agente sem doc |
| **Wiki dentro do jogo** (páginas de [wiki.md](wiki.md) no Compêndio) | Doc | Médio | M | [roadmap fase 6](roadmap.md#fase-6-arte-polimento-e-lançamento) |
| Compêndio sem seções de chefes, estruturas e locais (tem moléculas, itens, suplementos, agregados e formações) | Sem doc | Baixo | P | `src/game/ui/catalogViews.ts` |

## Áudio

| Lacuna | Estado | Impacto | Esforço | Fonte |
| --- | --- | --- | --- | --- |
| **38 efeitos sonoros faltam**; primeiro os P1 (armas, `enemyHit`, `decompose`, `gem`, `atp`, `cardPick`, toques de interface) | Doc | Alto | M | [efeitos-sonoros.md](efeitos-sonoros.md#resumo); `public/audio/sfx/` só tem os 9 do agente |
| As Opções ainda dizem que "armas, itens e botões chegam em breve" | Metade | Baixo | P | `src/game/scenes/OptionsScene.ts:35` |
| Jingles `bossIn` e `crisisIn` | Doc | Médio | P | [roadmap fase 6](roadmap.md#fase-6-arte-polimento-e-lançamento) |
| Música por ambiente (pergunta aberta) | Doc | Baixo | M | [sonoplastia.md](sonoplastia.md#o-que-falta-decidir) |
| Decomposição com som próprio por família | Doc | Baixo | P | [efeitos-sonoros.md](efeitos-sonoros.md) linha 218 |

## UI e telas

| Lacuna | Estado | Impacto | Esforço | Fonte |
| --- | --- | --- | --- | --- |
| **Primeira run guiada**: nenhum tutorial; o critério da fase 6 é "um amigo joga sem explicação" | Sem doc | Alto | M | Nenhuma ocorrência de tutorial em `src/` |
| **UI própria de tela larga** no PC (hoje estica a do celular) | Metade | Médio | G | [roadmap, bugs relatados](roadmap.md#bugs-relatados); [menu.md](menu.md#tela-larga-pc-celular-deitado) |
| Acabamento visual da HUD, molduras, botões e fontes | Doc | Médio | M | [roadmap fase 6](roadmap.md#fase-6-arte-polimento-e-lançamento) |
| Conteúdo de placeholder morto no código: `TAB_SECTIONS`, `AGENT_SELECT` e `SCREENS.idle` e `SCREENS.compendium` com "FASE 2/3/4" e exemplos que não batem com o jogo | Sem doc | Baixo | P | `src/game/ui/menuContent.ts:59-165`; só `SCREENS.achievements` é usado |
| Acessibilidade: raridade e afinidade só por cor, sem opção de texto maior | Sem doc | Baixo | M | Sem doc |
| Vibração no celular (dano, chefe, raridade) | Sem doc | Baixo | P | Nenhum `vibrate` em `src/` |

## Plataforma e PWA

| Lacuna | Estado | Impacto | Esforço | Fonte |
| --- | --- | --- | --- | --- |
| **Ícones do PWA**: o manifest só tem o `favicon.svg`; falta PNG 192 e 512, ícone maskable e `apple-touch-icon` (no iPhone, a tela inicial fica sem ícone bom) | Doc | Alto | P | `vite.config.ts:67`, `index.html:10`; [roadmap fase 6](roadmap.md#fase-6-arte-polimento-e-lançamento) |
| Fase 7 inteira (lojas) | Doc | Médio | G | [publicacao.md](publicacao.md) |
| Só português; as lojas pedem pelo menos inglês para alcance | Sem doc | Baixo | M | Sem doc; liga com a fase 7 |
| Save na nuvem e ranking | Doc | Baixo | G | [servidor.md](servidor.md) |

## Balanceamento e validação

| Lacuna | Estado | Impacto | Esforço | Fonte |
| --- | --- | --- | --- | --- |
| **10 fases "implementadas, falta validar no celular"** (2.6 a 5.11), incluindo 60 FPS com 400 moléculas e com o mapa Denso | Metade | Alto | P–M | [roadmap, visão geral](roadmap.md#visão-geral) |
| Ajustes por jogo: os três agentes (fase 2), custos do Lab (3), ritmo do idle (4), formações e crises (5.6), tempo da sinapse no pico (5.11) | Metade | Alto | M | Itens abertos de cada fase do [roadmap](roadmap.md) |
| O robô do `npm run sim` não procura sinapses nem estruturas, e não escolhe local | Sem doc | Médio | P | [roadmap 5.11](roadmap.md#fase-511-sinapses-e-estruturas) |
| Rodada de testes com 2 ou 3 amigos | Doc | Alto | P | [roadmap fase 6](roadmap.md#fase-6-arte-polimento-e-lançamento) |

## Decisões que esperam o Vitor

Nada disso é código, mas trava ou muda as fases acima.

- **Decisões 0020 a 0033 estão como `proposta`**, mesmo as já implementadas (receptores, suplementos, sinapses, mapas). Confirmar as que valem para passar a `aceita` ([índice](decisoes/README.md)).
- **Alta aos 30 min e Apoptose**: a run ganha vitória? Que nome, já que ALTA é o reset do organismo ([lacunas-vs.md](lacunas-vs.md#perguntas-em-aberto)).
- **Conquistas** substituem parte do desbloqueio por ATP, ou só somam?
- **Eixos qualidade, dose e potência**: entram como progressão por agente, ou saem do design?
- **Elenco**: os 9 agentes ficam? Venvanse com o nome de marca ou o da molécula ([personagens.md](personagens.md#o-que-falta-decidir))?
- **Evolução** só pela cápsula de prata, ou nos dois lugares ([itens.md](itens.md))?
- **Fase 5.12**: os números da sinergia e a barreira hematoencefálica ([decisão 0032](decisoes/0032-local-escolhido-e-sinergia.md)).

## Ordem de fases proposta

A proposta completa e o porquê estão na [decisão 0034](decisoes/0034-fases-para-fechar-lacunas.md) e no [roadmap](roadmap.md#visão-geral). Em resumo:

| Ordem | Fase | O que entra | Por que nessa ordem |
| --- | --- | --- | --- |
| 1 | **5.13 Validação e ganhos rápidos** | Validar no celular, ícones do PWA, SFX P1, jingles, "de onde vem", limpar placeholders, estatísticas no save | Barato, e tudo o que vem depois precisa de uma base validada e com som |
| 2 | **5.12 Locais do corpo e sinergias** | Como já está no roadmap | Já desenhada; define onde cada família e cada chefe moram |
| 3 | **5.14 Famílias e chefes** | Comportamento por família, Citocina e inflamação, poças, mais moléculas por família, um chefe por local e a Placa | Os agentes novos são feitos para enfrentar essas mecânicas (a Calmaria anula auras, a Desintoxicação limpa poças) |
| 4 | **5.15 Elenco completo** | Os 6 agentes em duas levas, receptores nativos, evolução das 3 armas que faltam | Depende das famílias da 5.14 para ter graça |
| 5 | **5.16 Conquistas** | Conquistas com as estatísticas, casos anteriores, desbloqueio por progresso, Cápsulas de agente | Precisa de conteúdo para liberar (agentes, locais, chefes) |
| 6 | **6 Arte, polimento e lançamento** | Primeira run guiada, SFX restantes, tela larga, wiki no Compêndio, teste com amigos | Como já está, com o tutorial somado |
| depois | Sem fase | Síntese, Protocolos, Modos, Ribossomo e Farmácia, Sintomas, eixos qualidade/dose/potência | Profundidade que só vale depois do lançamento para os amigos |

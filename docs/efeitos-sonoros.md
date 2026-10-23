# Efeitos sonoros

23 de outubro de 2026 · Vitor

A lista enxuta de efeitos sonoros (SFX) do jogo: **48 efeitos**, dos quais os 13 do agente já foram feitos pelo Vitor e **35 faltam gerar**. Cada um tem o id do arquivo, quando toca, duração, prioridade e um prompt pronto para colar num app de geração de efeitos. O tema, a música e a entrega dos arquivos estão em [sonoplastia.md](sonoplastia.md). Os arquivos brutos vão para [audio/efeitos/](../audio/efeitos/README.md). Nada de efeito entrou no código ainda.

## Resumo

| Categoria | Efeitos | Situação |
| --- | --- | --- |
| [Agente](#agente) | 4 | Feitos |
| [Especiais dos agentes](#especiais-dos-agentes) | 9 | Feitos |
| [Armas](#armas) | 8 | Faltam |
| [Combate](#combate) | 3 | Faltam |
| [Moléculas e chefes](#moléculas-e-chefes) | 4 | Faltam |
| [Coleta e itens](#coleta-e-itens) | 5 | Faltam |
| [Ampolas, cápsula e level up](#ampolas-cápsula-e-level-up) | 6 | Faltam |
| [Sinapses e estruturas](#sinapses-e-estruturas) | 3 | Faltam |
| [Interface](#interface) | 6 | Faltam |
| **Total** | **48** | **35 faltam** |

- **P1:** acontece toda run; sem ele o jogo parece mudo. **P2:** mais raro, mas dá peso a um momento grande.
- **Um arquivo, vários usos.** A lista caiu de 131 para 48 porque um mesmo efeito serve a várias coisas: o jogo muda a altura, o volume ou repete o som. A coluna "Também toca em" diz quem reaproveita cada arquivo. O que foi fundido ou cortado está em [O que saiu da lista](#o-que-saiu-da-lista).

## Como soa

Os efeitos seguem o tema da [sonoplastia](sonoplastia.md#o-tema): **chip na frente, metal por baixo**.

| Peso do evento | Como soa | Exemplos |
| --- | --- | --- |
| Pequeno e frequente | Chip puro: pulso, triângulo ou ruído, ataque seco, menos de 0,2 s | Disparo, impacto, gema |
| Médio | Chip com corpo: varredura de altura, um pouco de FM | Pegar item, carta do level up |
| Grande e raro | Chip mais um golpe de metal: power chord abafado, prato, caixa | Chefe, lendário, morte do agente |
| Interface | Chip puro, sem metal, sempre o mesmo timbre | Toque, voltar, comprar |

Cada família de arma tem um timbre ligado ao que faz: o ácido chia, a poça borbulha, a eletricidade estala, o feixe zune. Nenhum efeito tem voz, nem o chefe.

## Regras de mixagem

Valem para o player de efeitos quando ele for escrito; os números entram em `src/config/audio.json`.

- **Altura sorteada:** todo efeito toca com a altura sorteada em ±5%, para não soar como metralhadora.
- **Reaproveitar com outra altura:** um uso "mais grave" toca o mesmo arquivo a 80% da velocidade; "mais agudo", a 120%. É assim que uma evolução soa mais pesada que a arma base sem arquivo novo.
- **Sequência que sobe:** gema de XP, salto da Reação em Cadeia e decomposição em cascata sobem um semitom a cada repetição seguida (até 12) e voltam ao normal depois de 0,5 s.
- **Limites:** no máximo 4 cópias do mesmo id ao mesmo tempo e 40 ms entre duas; no máximo 24 efeitos no total, saindo o de menor prioridade.
- **Prioridade:** perder interações, morte, chefe, especial, raridade, coleta, decomposição, disparo e impacto.
- **Ducking:** `hurt`, `death`, `bossSpawn` e `revealLegendary` baixam os outros efeitos para 50% por 0,3 s.
- **Pausa:** os efeitos da run param na pausa, no level up e nas telas de ampola e cápsula.
- **Campo longo:** usa os mesmos arquivos da run (`decompose`, `atp`) a 40% do volume, no máximo uma vez a cada 150 ms.

## Como gerar

- **Prompt:** cada um já vem completo, em inglês, com `no voice, no music` no fim. Não ponha nome de jogo ou de artista.
- **Duração:** é o tamanho final no jogo. Se o app tiver duração mínima maior, gere com ela e corte no Audacity, tirando o silêncio do começo.
- **Muito curtos:** toques de interface, gemas e disparos às vezes saem melhores num gerador de chip como o [jsfxr](https://sfxr.me/) ou o [ChipTone](https://sfbgames.itch.io/chiptone).
- **Arquivos:** salve em [audio/efeitos/](../audio/efeitos/README.md) com o id como nome (`hurt.wav`); se gerar mais de uma versão, `hurt-1.wav`, `hurt-2.wav`. A entrega no jogo é `public/audio/sfx/<id>.ogg` e `.m4a`, até 2 MB no total ([sonoplastia.md](sonoplastia.md#entrega-dos-arquivos)).
- **Loop:** só `synapseCharge` é loop; peça `seamless loop` e corte sem fade.

**Ids.** Inglês, camelCase, como as músicas. Quando o efeito é de uma coisa só, o id começa com o id dela no código (`radicalFire`, `ampouleBreak`); quando é compartilhado, o id diz o tipo de som (`zap`, `beam`, `explosion`).

## Agente

**Feitos pelo Vitor** (falta subir os arquivos para [audio/efeitos/](../audio/efeitos/README.md)).

| Id | Quando toca | Também toca em | Duração | Prio. |
| --- | --- | --- | --- | --- |
| `hurt` | Uma molécula encosta e consome interações | Dano grande (mais grave) | 0,25 s | P1 |
| `heal` | Recupera interações | Soro, Segunda dose | 0,5 s | P1 |
| `death` | Interações zeram e a run acaba | | 1,5 s | P1 |
| `specialReady` | O especial terminou de recarregar | | 0,4 s | P1 |

## Especiais dos agentes

**Feitos pelo Vitor.** Um por especial, tocado ao apertar o botão. Os três primeiros já estão no jogo; os outros seis entram junto com os agentes de [personagens.md](personagens.md#agentes-da-run).

| Id | Agente e especial | Prio. |
| --- | --- | --- |
| `specialDopamine` | Dopamina, Pico de recompensa | P1 |
| `specialLipase` | Lipase, Emulsão | P1 |
| `specialInsulin` | Insulina, Captação | P1 |
| `specialVitaminC` | Vitamina C, Escudo antioxidante | P2 |
| `specialVenvanse` | Venvanse, Hiperfoco | P2 |
| `specialSerotonin` | Serotonina, Calmaria | P2 |
| `specialOxytocin` | Ocitocina, Vínculo | P2 |
| `specialAlcoholDehydrogenase` | Álcool desidrogenase, Desintoxicação | P2 |
| `specialCaffeine` | Cafeína, Alerta | P2 |

## Armas

Um disparo por família de arma. A evolução reaproveita o som da arma base, mais grave. Não há impacto próprio por arma: todas usam `enemyHit`.

| Id | Quando toca | Também toca em | Duração | Prio. | Prompt |
| --- | --- | --- | --- | --- | --- |
| `radicalFire` | Radical Livre dispara | Reação de Fenton (3 vezes seguidas) | 0,1 s | P1 | `retro 16-bit chiptune sound effect, small laser shot, very short high square wave zap with quick downward pitch, light and snappy, no voice, no music` |
| `acidFire` | Jato Ácido solta o cone | Água Régia (mais grave) | 0,3 s | P1 | `retro 16-bit chiptune sound effect, acid spray, short hissing noise burst with a sizzling fizz tail, corrosive splash, no voice, no music` |
| `zap` | Reação em Cadeia dispara e cada salto (sobe de tom) | Elétron da Nuvem acertando (mais agudo), faísca do Eletrodo | 0,12 s | P1 | `retro 16-bit chiptune sound effect, electric arc zap, very short crackling snappy zap with sharp attack, bright pulse wave, no voice, no music` |
| `beam` | Raio UV dispara o feixe | Laser (repetido), raio do Venvanse | 0,5 s | P1 | `retro 16-bit chiptune sound effect, piercing beam, bright humming laser charge then a sharp sustained zap, fluorescent tube buzz, no voice, no music` |
| `pulse` | Pulso dopaminérgico solta o anel | Catalisador e Enzima a cada pulso da aura (mais baixo) | 0,3 s | P1 | `retro 16-bit chiptune sound effect, shockwave pulse, round soft FM synth thump expanding outward with a short shimmering tail, no voice, no music` |
| `strike` | Hidrólise (Lipase) golpeia | Golpes da Álcool desidrogenase | 0,15 s | P1 | `retro 16-bit chiptune sound effect, strong melee hit, short punchy chop with a crunchy noise snap and a low thump, no voice, no music` |
| `splash` | O frasco da Poça de Solvente quebra e vira poça | Poça tóxica do acetaldeído (mais grave) | 0,4 s | P1 | `retro 16-bit chiptune sound effect, glass flask shatters into liquid, tiny glass crack then bubbly splash, chip noise, no voice, no music` |
| `absorb` | O Campo de captação absorve um açúcar | Captação da Insulina (em sequência) | 0,12 s | P1 | `retro 16-bit chiptune sound effect, absorb, tiny soft slurp blip with downward square wave pitch, cute, no voice, no music` |

## Combate

| Id | Quando toca | Também toca em | Duração | Prio. | Prompt |
| --- | --- | --- | --- | --- | --- |
| `crit` | Acerto crítico (catálise), junto com o impacto | | 0,2 s | P1 | `retro 16-bit chiptune sound effect, critical hit, sharp bright metallic ping with a punchy noise crack, satisfying, no voice, no music` |
| `freeze` | Gelo seco congela todas as moléculas | Nitrogênio líquido (mais agudo e curto), Criopreservação | 0,8 s | P2 | `retro 16-bit chiptune sound effect, freeze, icy hiss with crystalline crackling spreading out, cold wind, no voice, no music` |
| `explosion` | Termita: molécula decomposta explode | Peróxido explodindo perto do agente | 0,4 s | P2 | `retro 16-bit chiptune sound effect, small fiery explosion, punchy noise burst with crackling fire tail, no voice, no music` |

## Moléculas e chefes

A decomposição é o som que mais toca no jogo: precisa ser gostosa de ouvir mil vezes.

| Id | Quando toca | Também toca em | Duração | Prio. | Prompt |
| --- | --- | --- | --- | --- | --- |
| `enemyHit` | Qualquer arma acerta uma molécula | Golpe em destrutível, impacto no chefe (mais grave) | 0,08 s | P1 | `retro 16-bit chiptune sound effect, small hit, very short soft thud with a tiny noise tick, light impact, no voice, no music` |
| `decompose` | Molécula decomposta (sobe de tom na cascata) | Molécula forte (mais grave), campo longo (baixo) | 0,15 s | P1 | `retro 16-bit chiptune sound effect, molecule pops, short bubbly pop with a bright chip blip, satisfying and light, no voice, no music` |
| `bossSpawn` | O chefe entra no mapa | Agregado nascendo (mais agudo e baixo) | 1,5 s | P1 | `retro 16-bit chiptune sound effect, giant boss arrives, deep rumbling FM bass roar made of distorted noise, ground shaking thud, heavy guitar power chord, no voice, no music` |
| `bigBoom` | O chefe é decomposto | Agregado quebrando (mais curto), Lisossomo limpando a tela | 1,5 s | P1 | `retro 16-bit chiptune sound effect, huge crunchy explosion with scattering chip fragments, crash cymbal and a distorted guitar power chord ringing out, no voice, no music` |

## Coleta e itens

| Id | Quando toca | Também toca em | Duração | Prio. | Prompt |
| --- | --- | --- | --- | --- | --- |
| `gem` | Pega uma gema de XP (sobe de tom em sequência) | Gema vermelha (mais grave) | 0,08 s | P1 | `retro 16-bit chiptune sound effect, collect gem, tiny bright high square wave ping, crisp and sweet, no voice, no music` |
| `atp` | Pega uma moeda de ATP | Glicose, Glicogênio e Fosfocreatina (várias seguidas), coleta do campo longo, Glândula adrenal | 0,15 s | P1 | `retro 16-bit chiptune sound effect, coin pickup, two quick bright square wave notes rising, classic coin, no voice, no music` |
| `itemPickup` | Pega um item de consumo | Glucagon, Bico de Bunsen, todo item sem som próprio | 0,35 s | P1 | `retro 16-bit chiptune sound effect, item pickup, quick bright ascending three-note chip jingle, no voice, no music` |
| `vesicleBreak` | Uma vesícula é rompida | Destrutível do mapa quebrando | 0,3 s | P1 | `retro 16-bit chiptune sound effect, bubble burst, soft wet pop with a little crack, no voice, no music` |
| `whoosh` | Osmose: todas as gemas correm até o agente | Aquaporina | 0,8 s | P2 | `retro 16-bit chiptune sound effect, vacuum pull, rising whoosh with many tiny chip pings rushing in, no voice, no music` |

## Ampolas, cápsula e level up

Os jingles `levelup` e `capsule` da música abrem essas telas; os efeitos aqui são a quebra, a revelação e os botões.

| Id | Quando toca | Também toca em | Duração | Prio. | Prompt |
| --- | --- | --- | --- | --- | --- |
| `ampouleBreak` | Toca na ampola e o vidro quebra | Toque na cápsula do chefe (mais grave) | 0,4 s | P1 | `retro 16-bit chiptune sound effect, glass ampoule snaps open, crisp glass crack with a bright chip sparkle, no voice, no music` |
| `reveal` | Suplemento Comum, Incomum ou Raro aparece (mais agudo quanto mais raro) | Cada item que sobe na cápsula | 0,5 s | P1 | `retro 16-bit chiptune sound effect, item reveal, bright three-note ascending chip chord with sparkle, no voice, no music` |
| `revealLegendary` | Suplemento Ultra raro, Lendário ou Especial | Evolução de arma, sinapse potenciada, recorde novo | 1,5 s | P2 | `retro 16-bit chiptune sound effect, legendary item reveal, dramatic chip snare roll into a huge major chord with distorted guitar power chord, crash cymbal and long sparkling tail, no voice, no music` |
| `cardPick` | Escolhe uma carta no level up | Cartão da sinapse | 0,35 s | P1 | `retro 16-bit chiptune sound effect, select upgrade, punchy confirm blip with a short rising tail and a soft muted guitar chug, no voice, no music` |
| `reroll` | REROLAR | | 0,5 s | P1 | `retro 16-bit chiptune sound effect, shuffle cards, quick spinning chip ratchet of fast blips ending in a click, no voice, no music` |
| `banish` | BANIR | | 0,4 s | P2 | `retro 16-bit chiptune sound effect, banish, harsh descending noise zap with a dark low tone, item erased, no voice, no music` |

## Sinapses e estruturas

| Id | Quando toca | Também toca em | Duração | Prio. | Prompt |
| --- | --- | --- | --- | --- | --- |
| `synapseCharge` | A barra da sinapse enchendo (loop, a altura sobe com a carga) | | loop 1,0 s | P1 | `retro 16-bit chiptune sound effect, charging energy, steady humming square wave with soft pulsing tremolo, seamless loop, no voice, no music` |
| `synapseFire` | A sinapse enche e dispara | Foco inflamatório vencido | 1,0 s | P1 | `retro 16-bit chiptune sound effect, neuron fires, electric discharge zap into a bright rising chip chord, energizing, no voice, no music` |
| `alarm` | Entra no foco inflamatório e o cerco nasce | Toque no coágulo, formação chegando | 0,8 s | P2 | `retro 16-bit chiptune sound effect, trap triggered, alarm blip then a low rumbling swell closing in, danger, no voice, no music` |

## Interface

Todos em chip puro, sem metal, no mesmo timbre.

| Id | Quando toca | Também toca em | Duração | Prio. | Prompt |
| --- | --- | --- | --- | --- | --- |
| `uiTap` | Toque num botão | Troca de aba, interruptor, amostra do volume de Efeitos, pausa | 0,05 s | P1 | `retro 16-bit chiptune sound effect, UI click, extremely short clean square wave tick, no voice, no music` |
| `uiConfirm` | Confirmar, JOGAR, "toque para começar" | Voltar da pausa | 0,2 s | P1 | `retro 16-bit chiptune sound effect, UI confirm, quick bright two-note ascending blip, no voice, no music` |
| `uiBack` | Voltar, fechar, cancelar | PULAR no level up | 0,15 s | P1 | `retro 16-bit chiptune sound effect, UI back, quick soft two-note descending blip, no voice, no music` |
| `uiBuy` | Compra um upgrade com ATP | | 0,4 s | P1 | `retro 16-bit chiptune sound effect, purchase, coin clink followed by a bright rising chip chime, satisfying, no voice, no music` |
| `uiError` | Ação negada (falta ATP, bloqueado) | | 0,25 s | P1 | `retro 16-bit chiptune sound effect, UI error, short low buzzy double beep, denied, no voice, no music` |
| `uiUnlock` | Desbloqueia agente, arma ou molécula | Estrela resgatada, entrada nova do Compêndio, aviso de nova versão, "Enquanto você estava fora" | 0,8 s | P2 | `retro 16-bit chiptune sound effect, unlock, padlock click then a bright sparkling chip fanfare, no voice, no music` |

## O que saiu da lista

A primeira versão tinha 131 efeitos. Os 83 que saíram viraram reaproveitamento de outro arquivo ou foram cortados.

| Saiu | Como fica |
| --- | --- |
| Disparos das evoluções (Fenton, Água Régia, Laser, Enzima) e `weaponEvolve` | Som da arma base, mais grave ou repetido; a evolução toca `revealLegendary` |
| Impactos próprios (`acidJetHit`, `bossHit`, `destructibleHit`) | `enemyHit`, com altura diferente |
| Nuvem de Elétrons, Reação em Cadeia (disparo e salto), Eletrodo | Um só `zap` |
| Arremesso e borbulhar da poça, `toxicPool` | Só `splash` |
| Loops de aura, campo, laser, órbita, poça e Bunsen | Cortados: os loops cansam e pesam no orçamento. O Catalisador usa `pulse` baixo |
| `cascadeBreak`, `decomposeStrong`, `idleDecompose` | `decompose`, subindo de tom na cascata e mais grave na molécula forte |
| `aggregateSpawn`, `aggregateBreak`, `bossDefeat`, `lysosome` | `bossSpawn` e `bigBoom` |
| `gemBig`, `atpBag`, `idleCollect`, `serum`, `glucagon`, `bunsenStart` | `gem`, `atp`, `heal` e `itemPickup` |
| `dryIce`, `freezeHit`, `cryoFreezeAll`; `thermiteExplode`, `peroxideBlast` | `freeze` e `explosion` |
| Revelação por raridade (4 arquivos), `capsuleTouch`, `capsuleSlot` | `reveal` (altura pela raridade) e `revealLegendary`; a cápsula usa `ampouleBreak` grave |
| `skip`, `banishMode`, `pause`, `resume`, `uiTab`, `uiToggle`, `uiVolume`, `uiTitleStart` | Os toques de interface |
| `uiStar`, `uiNotice`, `uiCompendiumNew`, `offlineReport`, `newRecord` | `uiUnlock` ou `revealLegendary` |
| Estruturas (`synapseEnter`, potenciada, foco, coágulo, adrenal) | `synapseFire`, `alarm`, `atp` |
| Cortados sem substituto | `hurtHeavy` (é `hurt` grave), `lowHealth`, `dodge`, `shieldBlock`, `specialEnd`, `specialDopamineCrash`, `weaponNew`, `weaponMax`, `weaponReload`, `immune`, `thornsHit`, `stressBuff`, `cytokineSpawn`, `plaqueSlam`, `bossRage`, `dryIceEnd`, `feverEnd`, `ampouleDrop`, `focusFail`, `terrainZone`, `minuteMark`, `resultTally`, `runStart`, `idleFire` |

Se algum desses fizer falta quando o som estiver no jogo, ele volta como um arquivo próprio com o mesmo id.

## Configuração (quando virar código)

Um bloco `sfx` em `src/config/audio.json`, com o tipo em `src/config/types.ts`:

- Por efeito: arquivo, volume relativo, prioridade e se sobe de tom em sequência.
- Por uso: qual arquivo toca, com que velocidade (altura) e volume. É aqui que `fentonFire` vira `radicalFire` repetido, por exemplo.
- Geral: limite de cópias por id, intervalo mínimo, limite total, variação de altura, ducking.

## O que falta decidir

- [ ] Qual ferramenta gera os 35 que faltam: a mesma dos efeitos do agente, ou jsfxr/ChipTone para os curtos? (Mesma pergunta de [sonoplastia.md](sonoplastia.md#o-que-falta-decidir).)
- [ ] Cada tipo de molécula (lipídio, açúcar, radical...) ganha uma decomposição própria depois, ou fica uma só?
- [ ] Os toques de interface ficam ligados por padrão, ou com uma opção própria nas Opções?

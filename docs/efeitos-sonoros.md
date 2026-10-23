# Efeitos sonoros

23 de outubro de 2026 · Vitor

A lista completa de efeitos sonoros (SFX) que o jogo precisa, por categoria, com o id do arquivo, quando toca, duração, quantas variações gerar, prioridade e um prompt pronto para colar num app de geração de efeitos. O tema, a música e a entrega dos arquivos estão em [sonoplastia.md](sonoplastia.md); esta aba cuida só dos efeitos. Tudo aqui é **proposta**: nada de efeito entrou no código ainda.

## Resumo

| Categoria | Efeitos | P1 | P2 | P3 |
| --- | --- | --- | --- | --- |
| [Agente](#agente) | 10 | 5 | 4 | 1 |
| [Especiais](#especiais-dos-agentes) | 10 | 3 | 1 | 6 |
| [Armas](#armas) | 19 | 11 | 6 | 2 |
| [Evoluções](#evoluções) | 6 | 1 | 5 | 0 |
| [Efeitos de suplemento](#efeitos-de-suplemento-e-de-combate) | 7 | 1 | 4 | 2 |
| [Moléculas](#moléculas) | 9 | 4 | 2 | 3 |
| [Agregados e chefes](#agregados-e-chefes) | 7 | 3 | 3 | 1 |
| [Coleta e itens](#coleta-e-itens) | 15 | 7 | 6 | 2 |
| [Ampolas e cápsula](#ampolas-e-cápsula) | 8 | 2 | 6 | 0 |
| [Level up](#level-up) | 5 | 4 | 1 | 0 |
| [Sinapses e estruturas](#sinapses-e-estruturas) | 9 | 2 | 6 | 1 |
| [Mapa](#mapa) | 3 | 0 | 2 | 1 |
| [Eventos da run](#eventos-da-run) | 6 | 0 | 5 | 1 |
| [Campo longo](#campo-longo-idle) | 4 | 1 | 3 | 0 |
| [Interface](#interface) | 13 | 6 | 7 | 0 |
| **Total** | **131** | **50** | **61** | **20** |

- **P1, essencial:** o que já existe no jogo hoje e acontece toda run. Sem isso o jogo parece mudo. É a primeira leva.
- **P2, importante:** coisas que já existem mas são mais raras, ou que dão peso a momentos grandes. Segunda leva.
- **P3, depois:** agentes, inimigos e sistemas que ainda são proposta, ou polimento fino. Entram junto com o conteúdo.

## Como soa

Os efeitos seguem o tema da [sonoplastia](sonoplastia.md#o-tema): **chip na frente, metal por baixo**.

| Peso do evento | Como soa | Exemplos |
| --- | --- | --- |
| Pequeno e frequente | Chip puro: pulso, triângulo ou ruído, ataque seco, menos de 0,2 s | Disparo, impacto, gema |
| Médio | Chip com corpo: varredura de altura, um pouco de FM | Decomposição em cascata, pegar item, carta do level up |
| Grande e raro | Chip mais um golpe de metal: power chord abafado, prato, caixa, bumbo duplo curto | Chefe, evolução, lendário, morte do agente |
| Interface | Chip puro, sem metal, sempre o mesmo timbre | Toque, voltar, comprar |

**A química no som.** Cada arma tem um timbre ligado ao que ela faz: o ácido chia, o solvente borbulha, a reação em cadeia estala como eletricidade, o UV zune como um tubo de luz, o catalisador é um zumbido baixo. Assim dá para saber o que está acontecendo de olhos fechados.

**Sem voz.** Nenhum efeito tem voz, grito, risada ou fala, nem o chefe. Um "rugido" é feito com ruído grave e FM, não com garganta.

## Regras de mixagem

As regras valem para o player de efeitos quando ele for escrito; os números entram em `src/config/audio.json`, não no código.

- **Variação de altura:** todo efeito marcado com variações toca com a altura sorteada em ±5%, além de sortear qual arquivo toca. Isso evita o som de "metralhadora" quando o mesmo efeito toca 20 vezes por segundo.
- **Limite por efeito:** no máximo 4 cópias do mesmo id tocando ao mesmo tempo, e no mínimo 40 ms entre dois disparos do mesmo id. O excesso é descartado, não enfileirado.
- **Limite geral:** no máximo 24 efeitos ao mesmo tempo. Quando passa, sai o de menor prioridade.
- **Prioridade na mistura** (do que nunca pode sumir ao que pode): perder interações, morte do agente, chefe, especial, evolução e raridade, level up e coleta de item, decomposição, disparo e impacto, ambiente.
- **Abaixar os outros (ducking):** perder interações, morte, chefe nascendo, evolução e Lendário baixam os demais efeitos para 50% por 0,3 s. A música já baixa sozinha nos jingles ([sonoplastia.md](sonoplastia.md#música-dinâmica)).
- **Sequência que sobe:** gema de XP, salto da Reação em Cadeia e quebra em cascata sobem de altura a cada repetição seguida (um semitom por vez, até 12), e voltam ao normal depois de 0,5 s sem repetir. É o "combo" do jogo.
- **Loops:** efeitos contínuos (aura, campo, carga da sinapse, laser) são loops que entram e saem com fade de 0,1 s. Só toca um loop de cada id, mesmo com duas fontes.
- **Distância:** na run, efeitos de molécula fora da tela não tocam; os de dentro da tela ganham panorâmico leve (até 30% para o lado) conforme a posição na tela.
- **Pausa:** os efeitos da run param na pausa, no level up e nas telas de ampola e cápsula; só os efeitos dessas telas tocam.
- **Volume:** o volume de Efeitos das Opções multiplica tudo isto, e o Geral multiplica os dois ([sonoplastia.md](sonoplastia.md#configuração)).

## Como gerar

- **App:** os prompts abaixo são para um app que gera efeito a partir de texto. Eles estão em inglês porque os apps entendem melhor assim. Se o app tiver opção de "prompt influence" ou "fidelidade ao texto", deixe alta.
- **Prompt:** cada um já vem completo, com o pedido de chiptune e o `no voice, no music` no fim. Não ponha nome de jogo ou de artista.
- **Duração:** a coluna Duração é o tamanho final no jogo. Muitos apps têm duração mínima (0,5 s ou mais): gere com a duração mínima e corte no Audacity, tirando o silêncio do começo para o som sair no mesmo instante do toque.
- **Variações:** a coluna Var. diz quantas versões diferentes gerar do mesmo prompt. Escolha as que soam parecidas, mas não iguais.
- **Muito curtos:** toques de interface, gemas e disparos de 0,1 s às vezes saem melhores num gerador de chip como o [jsfxr](https://sfxr.me/) ou o [ChipTone](https://sfbgames.itch.io/chiptone). Vale testar os dois caminhos nos P1 antes de gerar o resto.
- **Arquivos:** exporte WAV mono, salve em `audio/sfx/` com o id como nome (`hurt.wav`, e `hurt-2.wav`, `hurt-3.wav` nas variações). A entrega no jogo é `public/audio/sfx/<id>.ogg` e `.m4a`, até 2 MB no total ([sonoplastia.md](sonoplastia.md#entrega-dos-arquivos)).
- **Loops:** os efeitos marcados como loop precisam começar e terminar no mesmo ponto, sem fade. Peça `seamless loop` (já está no prompt) e corte num ponto em que a onda passa pelo zero.

**Ids.** Mesma convenção das músicas: inglês, camelCase, e o começo do id é o id da coisa no código (`radical`, `acidJet`, `dryIce`...). O fim diz o evento: `Fire` (disparo), `Hit` (impacto), `Loop` (contínuo), `Break` (quebra), `Spawn` (aparece).

## Agente

O agente do jogador, qualquer que seja.

| Id | Quando toca | Duração | Var. | Prio. | Prompt |
| --- | --- | --- | --- | --- | --- |
| `hurt` | Uma molécula encosta e consome interações | 0,25 s | 3 | P1 | `retro 16-bit chiptune sound effect, player takes damage, low dry crunchy hit, short bitcrushed noise burst with a falling square wave blip, harsh and punchy, no voice, no music` |
| `hurtHeavy` | Dano grande de uma vez (chefe, agregado, explosão do peróxido) | 0,45 s | 2 | P2 | `retro 16-bit chiptune sound effect, heavy damage hit, deep distorted bass thud with a muted metal guitar chug and crunchy noise, painful impact, no voice, no music` |
| `lowHealth` | Interações abaixo de 25%, em loop até subir | loop 1,0 s | 1 | P2 | `retro 16-bit chiptune sound effect, low health warning, slow heartbeat made of two soft low triangle wave thumps, tense, seamless loop, no voice, no music` |
| `heal` | Recupera interações (Soro, Glutamina em sequência, fim de efeito) | 0,5 s | 1 | P1 | `retro 16-bit chiptune sound effect, healing, gentle rising square wave arpeggio with soft sparkle, warm and relieving, no voice, no music` |
| `revive` | Segunda dose: o agente volta com metade das interações | 1,2 s | 1 | P2 | `retro 16-bit chiptune sound effect, revive, deep heartbeat thump then a fast rising chip arpeggio ending in a bright major chord and a short distorted guitar power chord, no voice, no music` |
| `death` | Interações zeram: o agente é consumido e a run acaba | 1,5 s | 1 | P1 | `retro 16-bit chiptune sound effect, player death, long falling square wave pitch slide into a crumbling noise dissolve, final low muted guitar chug, dramatic, no voice, no music` |
| `dodge` | Esquiva evita um dano | 0,15 s | 2 | P3 | `retro 16-bit chiptune sound effect, quick dodge, short airy noise whoosh with a tiny high blip, light and fast, no voice, no music` |
| `shieldBlock` | Um dano é bloqueado (Tolerância, escudo da Vitamina C) | 0,2 s | 2 | P2 | `retro 16-bit chiptune sound effect, shield block, short metallic ping with a soft square wave shimmer, glassy deflect, no voice, no music` |
| `specialReady` | O especial terminou de recarregar | 0,4 s | 1 | P1 | `retro 16-bit chiptune sound effect, ability ready, two quick bright ascending square wave notes with a small sparkle, clear notification, no voice, no music` |
| `specialEnd` | O efeito do especial acaba | 0,35 s | 1 | P1 | `retro 16-bit chiptune sound effect, power down, short descending square wave sweep that fades out, soft and clear, no voice, no music` |

## Especiais dos agentes

Um efeito por especial, tocado ao apertar o botão. Os três primeiros agentes já estão no jogo; os outros seis ainda são proposta de [personagens.md](personagens.md#agentes-da-run) e entram junto com eles.

| Id | Agente e especial | Duração | Var. | Prio. | Prompt |
| --- | --- | --- | --- | --- | --- |
| `specialDopamine` | Dopamina, Pico de recompensa: pulsos mais rápidos e maiores | 1,0 s | 1 | P1 | `retro 16-bit chiptune sound effect, power up activation, fast rising FM synth sweep exploding into a bright chip chord and a distorted guitar power chord with crash cymbal, euphoric rush, no voice, no music` |
| `specialDopamineCrash` | Dopamina, a queda depois do Pico | 0,8 s | 1 | P2 | `retro 16-bit chiptune sound effect, energy crash, slow falling detuned square wave with a tape slowdown effect, tired and heavy, no voice, no music` |
| `specialLipase` | Lipase, Emulsão: área no chão que deixa lipídios frágeis | 0,8 s | 1 | P1 | `retro 16-bit chiptune sound effect, liquid area spell, thick bubbly splash spreading out, gurgling low FM bubbles and a soft noise swoosh, oily, no voice, no music` |
| `specialInsulin` | Insulina, Captação: puxa todos os açúcares da tela | 1,0 s | 1 | P1 | `retro 16-bit chiptune sound effect, magnetic pull, deep humming FM synth vacuum that rises in pitch, many tiny chip blips rushing inward, no voice, no music` |
| `specialVitaminC` | Vitamina C, Escudo antioxidante | 0,7 s | 1 | P3 | `retro 16-bit chiptune sound effect, shield up, bright crystalline square wave chord swelling with a shimmering sparkle, protective, no voice, no music` |
| `specialVenvanse` | Venvanse, Hiperfoco: o tempo dos inimigos desacelera | 1,2 s | 1 | P3 | `retro 16-bit chiptune sound effect, slow motion activation, pitch dropping tape stop effect, deep reverberant FM tone, time slowing down, no voice, no music` |
| `specialSerotonin` | Serotonina, Calmaria: anula as auras de estresse | 1,0 s | 1 | P3 | `retro 16-bit chiptune sound effect, calming wave, soft warm triangle wave chord spreading out like a ripple with gentle chime, peaceful, no voice, no music` |
| `specialOxytocin` | Ocitocina, Vínculo: dobra os aliados | 0,8 s | 1 | P3 | `retro 16-bit chiptune sound effect, summon allies, several quick friendly ascending chip blips in harmony, cheerful, no voice, no music` |
| `specialAlcoholDehydrogenase` | Álcool desidrogenase, Desintoxicação: limpa as poças | 0,9 s | 1 | P3 | `retro 16-bit chiptune sound effect, cleansing, fizzy noise wash that sweeps across and evaporates with a bright rising tone, clean, no voice, no music` |
| `specialCaffeine` | Cafeína, Alerta: disparos em todas as direções | 0,7 s | 1 | P3 | `retro 16-bit chiptune sound effect, rapid burst, very fast stutter of square wave shots spreading out with a snare roll, jittery energy, no voice, no music` |

## Armas

Disparo e impacto das armas de [weapons.json](../src/config/weapons.json). Quando uma arma não tem impacto próprio, ela usa o impacto genérico `enemyHit` de [Moléculas](#moléculas).

| Id | Quando toca | Duração | Var. | Prio. | Prompt |
| --- | --- | --- | --- | --- | --- |
| `radicalFire` | Radical Livre dispara um OH• na molécula mais perto | 0,1 s | 3 | P1 | `retro 16-bit chiptune sound effect, small laser shot, very short high square wave zap with quick downward pitch, light and snappy, no voice, no music` |
| `acidJetFire` | Jato Ácido solta o cone para a frente | 0,3 s | 3 | P1 | `retro 16-bit chiptune sound effect, acid spray, short hissing noise burst with a sizzling fizz tail, corrosive splash, no voice, no music` |
| `acidJetHit` | O ácido acerta (chiado curto na molécula) | 0,15 s | 2 | P2 | `retro 16-bit chiptune sound effect, acid burn impact, tiny sizzling noise crackle, quick and wet, no voice, no music` |
| `electronCloudHit` | Um elétron em órbita acerta uma molécula | 0,08 s | 3 | P1 | `retro 16-bit chiptune sound effect, electric tick, extremely short bright pulse wave click with a tiny zap, no voice, no music` |
| `electronCloudLoop` | Zumbido das órbitas enquanto a arma existe | loop 2,0 s | 1 | P3 | `retro 16-bit chiptune sound effect, orbiting electrons hum, soft fast warbling square wave tremolo, quiet electric buzz, seamless loop, no voice, no music` |
| `catalystLoop` | Aura do Catalisador ativa (o dano contínuo não tem som por tique) | loop 2,0 s | 1 | P2 | `retro 16-bit chiptune sound effect, magic aura hum, low pulsing FM synth drone with slow wobble, subtle and warm, seamless loop, no voice, no music` |
| `solventPoolThrow` | Poça de Solvente arremessa o frasco | 0,25 s | 2 | P1 | `retro 16-bit chiptune sound effect, throw flask, short whoosh with a rising square wave whistle, no voice, no music` |
| `solventPoolSplash` | O frasco quebra e vira poça | 0,4 s | 2 | P1 | `retro 16-bit chiptune sound effect, glass flask shatters into liquid, tiny glass crack then bubbly splash, chip noise, no voice, no music` |
| `solventPoolLoop` | Borbulhar da poça enquanto ela dura | loop 2,0 s | 1 | P3 | `retro 16-bit chiptune sound effect, bubbling liquid, soft low FM bubbles popping randomly, quiet, seamless loop, no voice, no music` |
| `chainReactionFire` | Reação em Cadeia solta o primeiro disparo | 0,2 s | 2 | P1 | `retro 16-bit chiptune sound effect, electric bolt, short crackling zap with sharp attack, bright pulse wave, no voice, no music` |
| `chainReactionJump` | O disparo salta para a próxima molécula (sobe de tom a cada salto) | 0,12 s | 3 | P1 | `retro 16-bit chiptune sound effect, electric arc jump, very short snappy zap blip, crisp, no voice, no music` |
| `uvRayFire` | Raio UV dispara o feixe que atravessa a linha | 0,5 s | 2 | P1 | `retro 16-bit chiptune sound effect, piercing beam, bright humming laser charge then a sharp sustained zap, fluorescent tube buzz, no voice, no music` |
| `dopaminePulseFire` | Pulso dopaminérgico (arma da Dopamina) solta o anel | 0,3 s | 3 | P1 | `retro 16-bit chiptune sound effect, shockwave pulse, round soft FM synth thump expanding outward with a short shimmering tail, no voice, no music` |
| `lipaseStrikeFire` | Hidrólise (arma da Lipase) golpeia a molécula mais perto | 0,15 s | 3 | P1 | `retro 16-bit chiptune sound effect, strong melee hit, short punchy chop with a crunchy noise snap and a low thump, no voice, no music` |
| `insulinFieldLoop` | Campo de captação (arma da Insulina) ativo | loop 2,0 s | 1 | P2 | `retro 16-bit chiptune sound effect, gravity field hum, low steady FM synth drone with soft pulsing, magnetic, seamless loop, no voice, no music` |
| `insulinFieldAbsorb` | Um açúcar é absorvido pelo campo | 0,12 s | 3 | P1 | `retro 16-bit chiptune sound effect, absorb, tiny soft slurp blip with downward square wave pitch, cute, no voice, no music` |
| `weaponNew` | Pegou uma arma nova no level up (toca no lugar do `cardPick`) | 0,6 s | 1 | P2 | `retro 16-bit chiptune sound effect, new weapon acquired, quick bright chip arpeggio and a short muted guitar chug, satisfying, no voice, no music` |
| `weaponMax` | Uma arma chegou ao nível máximo | 0,6 s | 1 | P2 | `retro 16-bit chiptune sound effect, max level reached, three rising square wave notes ending in a shiny chord, no voice, no music` |
| `weaponReload` | Uma arma de cadência baixa termina a recarga (Raio UV, evoluções) | 0,1 s | 1 | P2 | `retro 16-bit chiptune sound effect, reload click, tiny mechanical chip click with a short high blip, no voice, no music` |

## Evoluções

Evolução = arma no máximo + reagente, liberada na cápsula do chefe ([armas.md](armas.md#as-7-armas-iniciais)). O efeito de evolução toca na cápsula; as armas evoluídas ganham disparo próprio, mais pesado que o da arma base.

| Id | Quando toca | Duração | Var. | Prio. | Prompt |
| --- | --- | --- | --- | --- | --- |
| `weaponEvolve` | A arma evolui na cápsula | 2,0 s | 1 | P1 | `retro 16-bit chiptune sound effect, weapon evolution, rising FM synth swirl and chip snare roll building into a huge major chord with distorted guitar power chord and crash cymbal, epic transformation, no voice, no music` |
| `fentonFire` | Reação de Fenton: rajada de radicais | 0,25 s | 3 | P2 | `retro 16-bit chiptune sound effect, rapid triple laser burst, three fast high square wave zaps with a crunchy noise edge, aggressive, no voice, no music` |
| `aquaRegiaFire` | Água Régia: cone maior que corrói tudo | 0,45 s | 2 | P2 | `retro 16-bit chiptune sound effect, powerful acid blast, big hissing noise wave with deep sizzle and a low distorted thump, violent corrosion, no voice, no music` |
| `laserStart` | Laser: o feixe contínuo liga | 0,4 s | 1 | P2 | `retro 16-bit chiptune sound effect, laser beam power on, fast rising FM synth charge into a bright sustained buzz, no voice, no music` |
| `laserLoop` | Laser: o feixe varrendo a tela | loop 1,5 s | 1 | P2 | `retro 16-bit chiptune sound effect, continuous laser beam, intense bright buzzing square wave with fast vibrato, steady, seamless loop, no voice, no music` |
| `enzymeGrow` | Enzima: a aura cresce a cada decomposição | 0,15 s | 3 | P2 | `retro 16-bit chiptune sound effect, power absorb, tiny warm rising FM blip, organic, no voice, no music` |

## Efeitos de suplemento e de combate

Efeitos que nascem dos [suplementos](megabonk.md#2-suplementos) e dos atributos, por cima do disparo da arma.

| Id | Quando toca | Duração | Var. | Prio. | Prompt |
| --- | --- | --- | --- | --- | --- |
| `crit` | Acerto crítico (catálise); toca junto com o impacto | 0,2 s | 3 | P1 | `retro 16-bit chiptune sound effect, critical hit, sharp bright metallic ping with a punchy noise crack, satisfying, no voice, no music` |
| `freezeHit` | Nitrogênio líquido congela a molécula atingida | 0,3 s | 2 | P2 | `retro 16-bit chiptune sound effect, freeze, quick crystalline crackle with a high icy shimmer, no voice, no music` |
| `electrodeSpark` | Eletrodo: faísca que atinge 3 moléculas perto | 0,3 s | 2 | P2 | `retro 16-bit chiptune sound effect, electric spark discharge, crackling short zap with fast stutter, no voice, no music` |
| `thermiteExplode` | Termita: molécula decomposta explode e queima as vizinhas | 0,4 s | 3 | P2 | `retro 16-bit chiptune sound effect, small fiery explosion, punchy noise burst with crackling fire tail, no voice, no music` |
| `thornsHit` | Ácido fórmico ou Reflexo devolve dano a quem encosta | 0,12 s | 2 | P3 | `retro 16-bit chiptune sound effect, sting, tiny sharp prick with a quick high zap, no voice, no music` |
| `immune` | A molécula não sofre dano (sem afinidade, `IMUNE`) | 0,15 s | 1 | P3 | `retro 16-bit chiptune sound effect, blocked hit, dull hollow clunk, low muted square wave, ineffective, no voice, no music` |
| `cryoFreezeAll` | Criopreservação congela tudo ao perder interações | 0,9 s | 1 | P2 | `retro 16-bit chiptune sound effect, mass freeze, icy wind sweep with spreading crystalline crackles, time stops, no voice, no music` |

## Moléculas

As moléculas inimigas. A decomposição é o som que mais toca no jogo: precisa ser gostosa de ouvir mil vezes.

| Id | Quando toca | Duração | Var. | Prio. | Prompt |
| --- | --- | --- | --- | --- | --- |
| `enemyHit` | Impacto genérico de qualquer arma numa molécula | 0,08 s | 4 | P1 | `retro 16-bit chiptune sound effect, small hit, very short soft thud with a tiny noise tick, light impact, no voice, no music` |
| `decompose` | Molécula simples decomposta (o estalo) | 0,15 s | 4 | P1 | `retro 16-bit chiptune sound effect, molecule pops, short bubbly pop with a bright chip blip, satisfying and light, no voice, no music` |
| `cascadeBreak` | Molécula se quebra em fragmentos (sobe de tom a cada nível da cascata) | 0,3 s | 3 | P1 | `retro 16-bit chiptune sound effect, molecule splits apart, crunchy snap followed by two quick scattering blips, chemical breaking, no voice, no music` |
| `decomposeStrong` | Molécula forte decomposta (amido, triglicerídeo, cortisol) | 0,4 s | 2 | P1 | `retro 16-bit chiptune sound effect, big molecule breaks, heavy crunchy snap with low thump and scattering chip fragments, no voice, no music` |
| `peroxideBlast` | Peróxido de hidrogênio explode perto do agente | 0,4 s | 2 | P2 | `retro 16-bit chiptune sound effect, small chemical explosion, fizzy pop burst with low boom, no voice, no music` |
| `toxicPool` | O acetaldeído deixa uma poça tóxica | 0,4 s | 1 | P2 | `retro 16-bit chiptune sound effect, toxic splash, thick wet gloopy plop with a sour detuned tone, no voice, no music` |
| `stressBuff` | Cortisol ou adrenalina acelera as moléculas perto | 0,5 s | 1 | P3 | `retro 16-bit chiptune sound effect, enemy buff, tense rising detuned FM tone with a quick warble, ominous, no voice, no music` |
| `cytokineSpawn` | A citocina solta pequenos inimigos | 0,3 s | 2 | P3 | `retro 16-bit chiptune sound effect, spawn, short squishy pop with a low bubbling blip, no voice, no music` |
| `formationSpawn` | Uma formação aparece (Cerco inflamatório, enxame em linha) | 0,8 s | 1 | P3 | `retro 16-bit chiptune sound effect, enemy wave incoming, low rumbling noise swell with a short alarm blip, threatening, no voice, no music` |

## Agregados e chefes

Os mini chefes ([agregados](megabonk.md#3-drops-xp-com-chance-ampolas-e-agregados)) e os chefes. O jingle `bossIn` da música avisa que o chefe vem; os efeitos daqui são o corpo dele.

| Id | Quando toca | Duração | Var. | Prio. | Prompt |
| --- | --- | --- | --- | --- | --- |
| `aggregateSpawn` | Um agregado nasce | 0,8 s | 1 | P1 | `retro 16-bit chiptune sound effect, mini boss appears, heavy squelchy thud with low FM growl made of noise and a muted guitar chug, no voice, no music` |
| `aggregateBreak` | O agregado é decomposto e solta a cascata | 1,0 s | 1 | P1 | `retro 16-bit chiptune sound effect, big enemy shatters, crunchy explosion with scattering chip fragments and a distorted guitar hit, no voice, no music` |
| `bossSpawn` | O chefe entra no mapa (Partícula de LDL) | 1,5 s | 1 | P1 | `retro 16-bit chiptune sound effect, giant boss arrives, deep rumbling FM bass roar made of distorted noise, ground shaking thud, heavy guitar power chord, no voice, no music` |
| `bossHit` | Impacto no chefe (no lugar do `enemyHit`) | 0,12 s | 3 | P2 | `retro 16-bit chiptune sound effect, hitting armor, short dull metallic thunk with a low noise thump, no voice, no music` |
| `bossRage` | O chefe fica mais forte ou muda de fase | 0,9 s | 1 | P2 | `retro 16-bit chiptune sound effect, boss enrage, low distorted FM roar rising in pitch with fast double kick drums, no voice, no music` |
| `bossDefeat` | O chefe é decomposto e vira uma onda de fragmentos | 2,5 s | 1 | P2 | `retro 16-bit chiptune sound effect, boss defeated, huge crunchy explosion chain with falling chip fragments, crash cymbal and a long distorted guitar power chord ringing out, no voice, no music` |
| `plaqueSlam` | A Placa fecha parte do mapa | 1,0 s | 1 | P3 | `retro 16-bit chiptune sound effect, massive wall slams down, deep heavy stone thud with rumbling noise and a low guitar chug, no voice, no music` |

## Coleta e itens

Drops do mapa ([itens.md](itens.md)). As gemas sobem de tom em sequência, como um combo.

| Id | Quando toca | Duração | Var. | Prio. | Prompt |
| --- | --- | --- | --- | --- | --- |
| `gem` | Pega uma gema de XP (sobe de tom em sequência) | 0,08 s | 2 | P1 | `retro 16-bit chiptune sound effect, collect gem, tiny bright high square wave ping, crisp and sweet, no voice, no music` |
| `gemBig` | Pega a gema vermelha (soma de muitas gemas) | 0,4 s | 1 | P2 | `retro 16-bit chiptune sound effect, collect big gem, bright sparkling chip arpeggio with a shiny chime, rewarding, no voice, no music` |
| `atp` | Pega uma moeda de ATP | 0,15 s | 2 | P1 | `retro 16-bit chiptune sound effect, coin pickup, two quick bright square wave notes rising, classic coin, no voice, no music` |
| `atpBag` | Glicose, Glicogênio ou Fosfocreatina: muito ATP de uma vez | 0,6 s | 1 | P2 | `retro 16-bit chiptune sound effect, treasure pile pickup, rapid cascade of coin blips with a sparkle, rich, no voice, no music` |
| `vesicleBreak` | Uma vesícula é rompida | 0,3 s | 2 | P1 | `retro 16-bit chiptune sound effect, bubble burst, soft wet pop with a little glassy crack, no voice, no music` |
| `itemPickup` | Pega um item de consumo (genérico, quando o item não tem som próprio) | 0,35 s | 1 | P1 | `retro 16-bit chiptune sound effect, item pickup, quick bright ascending three-note chip jingle, no voice, no music` |
| `serum` | Soro: recupera 30 interações | 0,6 s | 1 | P2 | `retro 16-bit chiptune sound effect, health potion, bubbly gulp then a warm rising square wave chord, no voice, no music` |
| `dryIce` | Gelo seco: congela todas as moléculas | 1,0 s | 1 | P1 | `retro 16-bit chiptune sound effect, freeze everything, icy hiss with crystalline crackling spreading wide, cold wind, time freezes, no voice, no music` |
| `dryIceEnd` | O congelamento acaba | 0,4 s | 1 | P3 | `retro 16-bit chiptune sound effect, ice cracking, short crackle and shatter, thaw, no voice, no music` |
| `osmosis` | Osmose (e Aquaporina): todas as gemas correm até o agente | 1,0 s | 1 | P1 | `retro 16-bit chiptune sound effect, vacuum pull, rising whoosh with many tiny chip pings rushing in, no voice, no music` |
| `lysosome` | Lisossomo: decompõe todas as moléculas da tela | 1,2 s | 1 | P1 | `retro 16-bit chiptune sound effect, screen clear bomb, bright flash tone then massive crunchy explosion with crash cymbal and distorted guitar hit, no voice, no music` |
| `bunsenStart` | Bico de Bunsen: o lança-chamas acende | 0,5 s | 1 | P2 | `retro 16-bit chiptune sound effect, gas burner ignites, click then a whooshing noise flame burst, no voice, no music` |
| `bunsenLoop` | O lança-chamas queimando por 10 s | loop 1,5 s | 1 | P2 | `retro 16-bit chiptune sound effect, flamethrower, roaring crackling noise flame, steady, seamless loop, no voice, no music` |
| `glucagon` | Glucagon: puxa todo o ATP e começa a Febre de ATP | 1,0 s | 1 | P2 | `retro 16-bit chiptune sound effect, golden frenzy begins, fast shimmering chip arpeggio rising with a coin cascade and a snare roll, no voice, no music` |
| `feverEnd` | A Febre de ATP acaba | 0,5 s | 1 | P3 | `retro 16-bit chiptune sound effect, bonus ends, short descending sparkle arpeggio fading out, no voice, no music` |

## Ampolas e cápsula

A ampola é o baú dos suplementos ([megabonk.md](megabonk.md#3-drops-xp-com-chance-ampolas-e-agregados)); a cápsula é o baú do chefe ([itens.md](itens.md)). O jingle `capsule` da música toca na abertura; os efeitos aqui são a quebra e a revelação.

| Id | Quando toca | Duração | Var. | Prio. | Prompt |
| --- | --- | --- | --- | --- | --- |
| `ampouleDrop` | Uma ampola cai no chão (brilho branco) | 0,5 s | 1 | P2 | `retro 16-bit chiptune sound effect, glass vial drops, small glassy clink with a soft magical shimmer, no voice, no music` |
| `ampouleBreak` | Toca na ampola: o vidro quebra | 0,4 s | 2 | P1 | `retro 16-bit chiptune sound effect, glass ampoule snaps open, crisp glass crack with a bright chip sparkle, no voice, no music` |
| `revealCommon` | Suplemento ou carta Comum (ou Incomum) aparece | 0,4 s | 1 | P2 | `retro 16-bit chiptune sound effect, item reveal, simple two-note chip chime, plain and friendly, no voice, no music` |
| `revealRare` | Raridade Rara | 0,6 s | 1 | P2 | `retro 16-bit chiptune sound effect, rare item reveal, bright three-note ascending chip chord with sparkle, no voice, no music` |
| `revealUltraRare` | Raridade Ultra rara | 0,9 s | 1 | P2 | `retro 16-bit chiptune sound effect, epic item reveal, fast shimmering FM arpeggio rising into a rich chord and a muted guitar chug, no voice, no music` |
| `revealLegendary` | Raridade Lendária ou Especial | 1,5 s | 1 | P2 | `retro 16-bit chiptune sound effect, legendary item reveal, dramatic chip snare roll into a huge major chord with distorted guitar power chord, crash cymbal and long sparkling tail, no voice, no music` |
| `capsuleTouch` | Toca na cápsula do chefe | 0,5 s | 1 | P1 | `retro 16-bit chiptune sound effect, treasure capsule opens, heavy mechanical clunk then a bright hiss of light, no voice, no music` |
| `capsuleSlot` | Cada arma ou receptor que sobe dentro da cápsula (1, 3 ou 5 vezes) | 0,3 s | 2 | P2 | `retro 16-bit chiptune sound effect, slot reveal, quick rising square wave blip with a click, like a slot machine stopping, no voice, no music` |

## Level up

O jingle `levelup` da música abre a tela; os efeitos são das cartas e dos botões ([ui-cronico.md](ui-cronico.md#level-up)).

| Id | Quando toca | Duração | Var. | Prio. | Prompt |
| --- | --- | --- | --- | --- | --- |
| `cardPick` | Escolhe uma carta (arma ou receptor) | 0,35 s | 1 | P1 | `retro 16-bit chiptune sound effect, select upgrade, punchy confirm blip with a short rising tail and a soft muted guitar chug, no voice, no music` |
| `reroll` | REROLAR: as cartas são sorteadas de novo | 0,5 s | 1 | P1 | `retro 16-bit chiptune sound effect, shuffle cards, quick spinning chip ratchet of fast blips ending in a click, no voice, no music` |
| `skip` | PULAR: recusa o level up | 0,3 s | 1 | P1 | `retro 16-bit chiptune sound effect, skip, quick soft whoosh with a short downward blip, no voice, no music` |
| `banish` | BANIR: a carta sai da run | 0,4 s | 1 | P1 | `retro 16-bit chiptune sound effect, banish, harsh descending noise zap with a dark low tone, item erased, no voice, no music` |
| `banishMode` | Entra ou sai do modo banir | 0,2 s | 1 | P2 | `retro 16-bit chiptune sound effect, mode switch, short low warning blip with a click, no voice, no music` |

## Sinapses e estruturas

As estruturas do mapa, os santuários do Megabonk ([megabonk.md](megabonk.md#4-sinapses-e-estruturas)).

| Id | Quando toca | Duração | Var. | Prio. | Prompt |
| --- | --- | --- | --- | --- | --- |
| `synapseEnter` | O agente entra no círculo da sinapse | 0,3 s | 1 | P2 | `retro 16-bit chiptune sound effect, enter zone, soft rising FM tone with a gentle click, no voice, no music` |
| `synapseChargeLoop` | A barra enchendo (a altura sobe com a carga) | loop 1,0 s | 1 | P1 | `retro 16-bit chiptune sound effect, charging energy, steady humming square wave with soft pulsing tremolo, seamless loop, no voice, no music` |
| `synapseFire` | A sinapse enche e dispara | 1,0 s | 1 | P1 | `retro 16-bit chiptune sound effect, neuron fires, electric discharge zap into a bright rising chip chord, energizing, no voice, no music` |
| `synapsePotentiatedFire` | A sinapse potenciada (dourada) dispara | 1,5 s | 1 | P2 | `retro 16-bit chiptune sound effect, powerful neuron fires, big electric discharge into a golden shimmering FM chord with a distorted guitar power chord, no voice, no music` |
| `focusTrigger` | Entra no foco inflamatório: o cerco nasce | 1,0 s | 1 | P2 | `retro 16-bit chiptune sound effect, trap triggered, alarm blip then a low rumbling swell closing in, danger, no voice, no music` |
| `focusWin` | O cerco foi decomposto a tempo | 1,0 s | 1 | P2 | `retro 16-bit chiptune sound effect, challenge complete, triumphant quick chip fanfare with snare hit, no voice, no music` |
| `focusFail` | Os 30 s do cerco acabam sem vencer | 0,6 s | 1 | P3 | `retro 16-bit chiptune sound effect, challenge failed, two descending flat square wave notes, disappointed, no voice, no music` |
| `clotTouch` | Toca no coágulo: um agregado extra é chamado | 0,8 s | 1 | P2 | `retro 16-bit chiptune sound effect, dark curse, thick wet low thud with an ominous detuned FM tone, no voice, no music` |
| `adrenalTouch` | Toca na glândula adrenal: ATP na hora e mais Estresse | 0,7 s | 1 | P2 | `retro 16-bit chiptune sound effect, greedy deal, coin cascade mixed with a tense rising heartbeat thump, no voice, no music` |

## Mapa

Objetos dos [mapas gerados](mapas.md). Bater em obstáculo não tem som: o agente desliza pela borda.

| Id | Quando toca | Duração | Var. | Prio. | Prompt |
| --- | --- | --- | --- | --- | --- |
| `destructibleHit` | Golpe num destrutível que ainda não quebrou | 0,12 s | 2 | P2 | `retro 16-bit chiptune sound effect, hitting soft tissue object, short squishy thud with a small crack, no voice, no music` |
| `destructibleBreak` | O destrutível quebra e solta o que tem | 0,4 s | 2 | P2 | `retro 16-bit chiptune sound effect, object breaks, crunchy squishy crack with falling bits, no voice, no music` |
| `terrainZone` | O agente entra numa zona de terreno do ambiente | 0,4 s | 1 | P3 | `retro 16-bit chiptune sound effect, area change, soft swelling FM tone with a subtle wobble, no voice, no music` |

## Eventos da run

| Id | Quando toca | Duração | Var. | Prio. | Prompt |
| --- | --- | --- | --- | --- | --- |
| `runStart` | Começa a run (o agente é aplicado) | 0,8 s | 1 | P2 | `retro 16-bit chiptune sound effect, injection start, quick syringe hiss then a punchy chip hit and a muted guitar chug, ready to fight, no voice, no music` |
| `pause` | Abre a pausa | 0,2 s | 1 | P2 | `retro 16-bit chiptune sound effect, pause, short soft descending two-note blip, no voice, no music` |
| `resume` | Volta da pausa | 0,2 s | 1 | P2 | `retro 16-bit chiptune sound effect, resume, short soft ascending two-note blip, no voice, no music` |
| `minuteMark` | Passa uma marca de tempo da run (5, 10, 15... min) | 0,5 s | 1 | P3 | `retro 16-bit chiptune sound effect, milestone, clock tick then a bright short chime, no voice, no music` |
| `resultTally` | Os números contando na tela de fim de run (ATP, decompostas) | loop 0,5 s | 1 | P2 | `retro 16-bit chiptune sound effect, score counting, fast repeating tiny square wave ticks, seamless loop, no voice, no music` |
| `newRecord` | Bateu um recorde na tela de fim de run | 1,2 s | 1 | P2 | `retro 16-bit chiptune sound effect, new high score, bright triumphant chip arpeggio with sparkle and a distorted guitar power chord, no voice, no music` |

## Campo longo (idle)

O idle fica muito tempo na tela, então os sons são baixos e macios, e os disparos tocam no máximo uma vez a cada 150 ms.

| Id | Quando toca | Duração | Var. | Prio. | Prompt |
| --- | --- | --- | --- | --- | --- |
| `idleFire` | Um agente da base dispara | 0,1 s | 3 | P2 | `retro 16-bit chiptune sound effect, soft distant shot, very short muffled triangle wave pew, quiet, no voice, no music` |
| `idleDecompose` | Molécula decomposta no campo longo | 0,12 s | 3 | P2 | `retro 16-bit chiptune sound effect, soft pop, short muffled bubble pop, gentle, no voice, no music` |
| `idleCollect` | Coleta a produção acumulada | 0,7 s | 1 | P1 | `retro 16-bit chiptune sound effect, collect earnings, cascade of soft coin blips ending in a warm chime, no voice, no music` |
| `offlineReport` | Abre o painel "Enquanto você estava fora" | 0,8 s | 1 | P2 | `retro 16-bit chiptune sound effect, welcome back, gentle rising chip arpeggio with a soft bell, friendly, no voice, no music` |

## Interface

Hub, Laboratório, Organismo, Agentes, Arsenal, Compêndio e Opções ([menu.md](menu.md)). Todos em chip puro, sem metal, no mesmo timbre.

| Id | Quando toca | Duração | Var. | Prio. | Prompt |
| --- | --- | --- | --- | --- | --- |
| `uiTap` | Toque num botão qualquer | 0,05 s | 2 | P1 | `retro 16-bit chiptune sound effect, UI click, extremely short clean square wave tick, no voice, no music` |
| `uiConfirm` | Confirmar, JOGAR, aceitar | 0,2 s | 1 | P1 | `retro 16-bit chiptune sound effect, UI confirm, quick bright two-note ascending blip, no voice, no music` |
| `uiBack` | Voltar, fechar, cancelar | 0,15 s | 1 | P1 | `retro 16-bit chiptune sound effect, UI back, quick soft two-note descending blip, no voice, no music` |
| `uiTab` | Troca de aba (barra de abas, abas da pausa e das Opções) | 0,08 s | 1 | P2 | `retro 16-bit chiptune sound effect, UI tab switch, short soft pulse wave click with a tiny pitch bend, no voice, no music` |
| `uiToggle` | Liga ou desliga um interruptor | 0,1 s | 1 | P2 | `retro 16-bit chiptune sound effect, toggle switch, short mechanical chip click, no voice, no music` |
| `uiVolume` | Muda o volume de Efeitos (serve de amostra do volume) | 0,1 s | 1 | P2 | `retro 16-bit chiptune sound effect, volume tick, short clear square wave beep, no voice, no music` |
| `uiBuy` | Compra um upgrade com ATP | 0,4 s | 1 | P1 | `retro 16-bit chiptune sound effect, purchase, coin clink followed by a bright rising chip chime, satisfying, no voice, no music` |
| `uiError` | Ação negada (falta ATP, bloqueado) | 0,25 s | 1 | P1 | `retro 16-bit chiptune sound effect, UI error, short low buzzy double beep, denied, no voice, no music` |
| `uiUnlock` | Desbloqueia um agente, arma ou molécula | 1,0 s | 1 | P2 | `retro 16-bit chiptune sound effect, unlock, padlock click then a bright sparkling chip fanfare, no voice, no music` |
| `uiStar` | Resgata uma estrela do caso | 0,6 s | 1 | P2 | `retro 16-bit chiptune sound effect, star reward, twinkling high chip arpeggio with a bell, no voice, no music` |
| `uiTitleStart` | "Toque para começar" na tela de título | 0,6 s | 1 | P1 | `retro 16-bit chiptune sound effect, game start, punchy chip chord stab with a short distorted guitar hit, no voice, no music` |
| `uiNotice` | Aparece um aviso (nova versão pronta, selo novo) | 0,3 s | 1 | P2 | `retro 16-bit chiptune sound effect, notification, soft two-note bell ping, no voice, no music` |
| `uiCompendiumNew` | Abre uma entrada nova do Compêndio | 0,4 s | 1 | P2 | `retro 16-bit chiptune sound effect, discovery, short curious rising FM blip with sparkle, no voice, no music` |

## Ordem sugerida

1. **Testar o caminho:** gerar `hurt`, `decompose`, `gem`, `radicalFire` e `uiTap` no app e no jsfxr, ouvir no jogo e escolher a ferramenta.
2. **P1 (50 efeitos):** o jogo deixa de ser mudo. Junto, o player de efeitos com as [regras de mixagem](#regras-de-mixagem) e o volume de Efeitos das Opções passando a valer.
3. **P2 (61 efeitos):** os momentos grandes (chefe, evolução, raridade, sinapses) e o campo longo.
4. **P3 (20 efeitos):** junto com cada agente, inimigo ou sistema novo quando ele entrar no jogo.

## Configuração (quando virar código)

Um bloco `sfx` em `src/config/audio.json`, com o tipo em `src/config/types.ts`:

- Por efeito: arquivo de origem, número de variações, volume relativo, prioridade, se é loop e se sobe de tom em sequência.
- Geral: limite de cópias por id, intervalo mínimo entre disparos, limite total, faixa de variação de altura, quanto o ducking abaixa e por quanto tempo, e o panorâmico máximo.

## O que falta decidir

- [ ] Qual app gera os efeitos: o mesmo da música, um app de efeitos por texto, ou jsfxr/ChipTone para os curtos? (É a mesma pergunta de [sonoplastia.md](sonoplastia.md#o-que-falta-decidir).)
- [ ] Cada arma ganha um impacto próprio, ou só o disparo é próprio e o impacto é sempre o `enemyHit`? A lista propõe impacto próprio só no ácido.
- [ ] Cada tipo de molécula (lipídio, açúcar, radical...) ganha uma decomposição própria, ou uma só para todas? Própria ajuda a ler a tela; uma só pesa menos no orçamento.
- [ ] O chefe tem algum som parecido com voz (rugido de monstro), ou fica no ruído e no FM, como proposto?
- [ ] Os toques de interface ficam ligados por padrão, ou com uma opção própria nas Opções?

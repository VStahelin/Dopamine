# Sonoplastia

23 de outubro de 2026 · Vitor

O som do Dopamina Blaster é **chiptune metal**: os canais de um console 8/16-bit (pulso, triângulo, ruído e o FM do Mega Drive) tocando riffs de metal, com guitarra distorcida e bateria de bumbo duplo por cima. As músicas são feitas num app de geração de música, fora do repositório; esta aba define o tema, a lista de faixas, como o jogo troca de música e o formato de entrega, com um prompt pronto para cada faixa.

Tudo aqui é **proposta**. Volumes, tempos de troca e nomes de arquivo vão para `src/config/audio.json` quando o som entrar no código (fase 6 do [roadmap](roadmap.md#fase-6-arte-polimento-e-lançamento)).

## O tema

| Pilar | Como soa | Por quê |
| --- | --- | --- |
| **Chip na frente** | Melodia e arpejos em onda de pulso e FM, como um cartucho de Mega Drive | Casa com o pixel art e a cara de "cartucho de laboratório" da aba Design |
| **Metal por baixo** | Guitarra com palm mute, baixo grosso, bumbo duplo, afinação baixa (Drop D) | Dá peso à horda de moléculas e à pressão que sobe com o tempo |
| **Reação química** | Arpejos muito rápidos que sobem como uma reação em cadeia; bleeps de aparelho de laboratório nas viradas | É o "som" das decomposições em cascata |
| **Tensão que cresce** | A mesma ideia fica mais rápida e mais pesada conforme a run avança | Acompanha a dificuldade D(t) e o dente de serra dos picos |
| **Sem voz** | Só instrumental: trilhas sem letra, sem vocal e sem coro cantado | Não briga com os números de dano e o texto da tela |

**O motivo.** Todas as faixas reaproveitam uma frase curta de 4 notas, o motivo da Dopamina, tocada na escala menor. O tema principal apresenta o motivo inteiro; o hub toca devagar e limpo; a run toca acelerado; o chefe toca em tom mais grave. Quem joga reconhece o jogo pela frase. Nos apps de geração não dá para escrever as notas, então o caminho é gerar o tema principal primeiro e usar o recurso de continuar ou "cover" do app a partir dele nas outras faixas.

**Tonalidade e ritmo.** Mi menor ou Ré menor (as cordas soltas de uma guitarra em Drop D), entre 90 e 180 BPM conforme a tensão. Escalas frígia e menor harmônica para o chefe e as crises. Os prompts usam Mi menor até essa escolha fechar.

## As faixas

Energia vai de 1 (calmo) a 5 (máximo). Loop = a faixa recomeça sem emenda audível.

| Id | Onde toca | Tipo | Duração | BPM | Energia | Como é |
| --- | --- | --- | --- | --- | --- | --- |
| `title` | Tela de título | loop | 1:30 a 2:00 | 150 | 4 | O hino do jogo: riff de abertura forte, o motivo inteiro no chip, refrão de guitarra |
| `hub` | Hub, Laboratório, Organismo, Agentes, Arsenal, Compêndio | loop | 2:00 a 2:30 | 100 | 2 | O motivo devagar, guitarra limpa com chorus, chip suave; o jogador fica muito tempo aqui |
| `idle` | Tela do campo longo | loop | 2:30 a 3:00 | 110 | 2 | Groove constante com palm mute baixinho e arpejos que lembram uma linha de produção; não pode cansar |
| `run1` | Run, do minuto 0 ao 10 | loop | 2:00 | 140 | 3 | Entrada da run: riff galopante, chip na melodia, espaço para os efeitos |
| `run2` | Run, do minuto 10 ao 20 | loop | 2:00 | 160 | 4 | Mesma ideia mais pesada: bumbo duplo, guitarras dobradas |
| `run3` | Run, depois do minuto 20 | loop | 2:00 | 180 | 5 | Thrash: blast beats, arpejos em velocidade máxima, sensação de sobrecarga |
| `crisis` | Pico de onda (crise da doença) | loop | 0:30 | 170 | 5 | Sirene de chip, riff em escala menor harmônica, entra por cima da run |
| `boss` | Chefe vivo (Partícula de LDL), **opcional, fica para depois** | loop | 1:30 | 165 | 5 | Órgão em FM, riff lento e esmagador que vira rápido no meio; o motivo em tom grave |
| `gameover` | Fim de run | jingle + loop | 0:06 + 1:00 | 90 | 1 | Jingle curto descendente e depois um loop calmo, só chip e baixo, para a tela de resultado |
| `alta` | ALTA do organismo (troca de indivíduo) | jingle | 0:10 a 0:15 | 150 | 4 | Fanfarra de vitória em chip com acorde final de guitarra |

**Jingles curtos (stingers)**, gerados ou montados a partir das faixas:

| Id | Quando | Duração | Como é |
| --- | --- | --- | --- |
| `levelup` | Abre o level up | 1 a 2 s | Arpejo de chip subindo e um power chord |
| `capsule` | Abre a cápsula do chefe ou uma ampola | 2 a 3 s | Rufar de caixa em chip e um acorde que se abre |
| `bossIn` | O chefe aparece | 2 s | Alarme grave e golpe de guitarra |
| `crisisIn` | Começa o pico de onda | 1,5 s | Sirene curta subindo |

**Por ambiente (depois).** Os cinco ambientes de [mapas.md](mapas.md#ambientes) podem ganhar uma versão própria de `run1`, com o mesmo BPM: plasma mais limpo, fígado mais grave, intestino com groove, pulmão com mais ar e reverb, cérebro com sintetizador. Fica para quando os ambientes estiverem no jogo.

## Música dinâmica

O jogo não mistura camadas da mesma faixa: troca de faixa com crossfade, o que funciona com qualquer música gerada.

- **Troca na run:** `run1` → `run2` aos 10 min e `run2` → `run3` aos 20 min, com crossfade de 2 s.
- **Pico de onda:** `crisisIn` toca, a run cai para 30% do volume e `crisis` entra por cima enquanto o pico durar; no respiro, `crisis` sai em 1,5 s.
- **Chefe:** só `bossIn` toca por cima, e a música da run continua. O chefe aparece a cada 5 minutos, então uma faixa própria trocando a música toda hora seria demais. A faixa `boss` fica para depois, se o chefe precisar de mais peso.
- **Pausa, level up, cápsula:** a música continua, a 50% do volume e com um filtro que corta os agudos (soa "abafada"). O jingle toca por cima, em volume cheio.
- **Fim de run:** a música da run para na hora, toca `gameover` e depois o loop de resultado.
- **Fundo:** com o app em segundo plano (o campo longo continua rodando), o som para; volta onde estava ao retornar.
- **Menus:** `title` só na tela de título; todas as telas do hub dividem `hub`, sem recomeçar ao trocar de aba.

## Efeitos sonoros

Os efeitos seguem o mesmo tema: ruído e pulso de chip com ataque curto, e um golpe de metal (prato, caixa, corda abafada) nos eventos grandes. Muitos tocam dezenas de vezes por segundo, então precisam ser curtos e variar um pouco de altura a cada vez.

| Grupo | Efeitos | Regra |
| --- | --- | --- |
| Armas | Disparo de cada arma (Radical Livre, Jato Ácido, Nuvem de Elétrons, Catalisador, Poça, Reação em Cadeia, Raio UV), especial de cada agente | No máximo 4 iguais ao mesmo tempo; altura sorteada ±5% |
| Moléculas | Impacto, decomposição (estalo), cascata, agregado nasce, agregado quebra | A cascata sobe de tom a cada nível de quebra |
| Coleta | Gema de XP, ATP, item da vesícula, vesícula rompendo | Gemas coletadas em sequência sobem de tom, como um combo |
| Agente | Interação perdida, Soro (cura), Segunda dose | Interação perdida é o som mais grave e seco do jogo |
| Interface | Toque, confirmar, voltar, comprar, erro, nova versão pronta | Todos em chip puro, sem metal |

Os apps de geração de música não fazem bem efeitos curtos. Para eles, a proposta é um gerador de efeitos de chip gratuito ([jsfxr](https://sfxr.me/) ou [ChipTone](https://sfbgames.itch.io/chiptone)), com as configurações salvas em `tools/sfx/` para refazer depois.

## Entrega dos arquivos

| Item | Música | Efeitos |
| --- | --- | --- |
| O que exportar do app | WAV 44,1 kHz, estéreo | WAV 44,1 kHz, mono |
| Formato no jogo | OGG Vorbis (~128 kbps) e M4A/AAC (~128 kbps) | OGG e M4A, curtos |
| Volume | Cerca de −16 LUFS integrado, pico abaixo de −1 dBTP | Pico abaixo de −1 dBTP |
| Pasta | `public/audio/music/<id>.ogg` e `.m4a` | `public/audio/sfx/<id>.ogg` e `.m4a` |
| Orçamento | Até 15 MB somando tudo | Até 2 MB somando tudo |

- **Dois formatos:** o Phaser recebe os dois e carrega o que o navegador toca; o M4A garante o Safari do iPhone e o OGG os outros.
- **Loops:** os apps quase sempre geram introdução e final com fade. Antes de entrar no jogo, cada loop é cortado no começo de um compasso, sem fade, e testado tocando duas vezes seguidas (o [Audacity](https://www.audacityteam.org/) resolve). Se o app tiver opção de loop ou de "instrumental sem intro", use.
- **Offline:** as músicas entram no precache da build ([decisão 0016](decisoes/0016-offline-e-atualizacoes.md)), por isso o orçamento. Se passar de 15 MB, as faixas de `run2` e `run3` podem baixar depois da primeira run.
- **Licença:** o jogo vai para lojas pagas ([decisão 0031](decisoes/0031-lancar-em-todas-as-plataformas.md)). Confira se o plano do app permite uso comercial das faixas geradas; nos planos gratuitos dos apps mais conhecidos, em geral não permite.

## Prompts para o app

Um prompt completo por faixa, pronto para colar no campo de estilo do app. Todos pedem só instrumental, sem voz e sem coro. Estão em inglês porque os apps entendem melhor os gêneros assim. Não ponha nome de artista ou de jogo: os apps costumam recusar.

- **Ordem:** gere `title` primeiro. Nas outras faixas, use a opção de continuar, cover ou referência de áudio do app a partir dele, para o motivo de 4 notas voltar em todas.
- **Letra:** se o app tiver campo de letra, deixe vazio ou marque "instrumental".
- **Campo curto:** se o app limitar o estilo a 200 caracteres, tire `NES pulse lead` e `no choir`.
- **Jingles:** os quatro últimos são curtos; se o app não acertar a duração, corte o melhor trecho de 1 a 3 s de uma geração maior.

### 1. Tema principal (tela de título) (`title`)

```text
chiptune metal, 16-bit Sega Genesis FM synth, NES pulse lead, distorted drop D guitars, instrumental, no vocals, no choir, epic main theme, 150 bpm, E minor, memorable 4-note chip hook, galloping riff, heroic guitar chorus, double kick drums, strong opening riff
```

### 2. Hub e menus (`hub`)

```text
chiptune metal, 16-bit Sega Genesis FM synth, NES pulse lead, distorted drop D guitars, instrumental, no vocals, no choir, calm menu loop, 100 bpm, E minor, clean chorus guitar, soft square wave arpeggios, mellow bass, light drums, relaxed lab mood, seamless loop, no intro, no fade out
```

### 3. Campo longo (idle) (`idle`)

```text
chiptune metal, 16-bit Sega Genesis FM synth, NES pulse lead, distorted drop D guitars, instrumental, no vocals, no choir, steady background groove, 110 bpm, E minor, quiet palm muted guitar, hypnotic factory-like chip arpeggios, repetitive, low energy, seamless loop, no intro, no fade out
```

### 4. Run, minuto 0 a 10 (`run1`)

```text
chiptune metal, 16-bit Sega Genesis FM synth, NES pulse lead, distorted drop D guitars, instrumental, no vocals, no choir, action battle loop, 140 bpm, E minor, galloping palm mute riff, chip lead melody, driving drums, room for sound effects, seamless loop, no intro, no fade out
```

### 5. Run, minuto 10 a 20 (`run2`)

```text
chiptune metal, 16-bit Sega Genesis FM synth, NES pulse lead, distorted drop D guitars, instrumental, no vocals, no choir, intense battle loop, 160 bpm, E minor, heavy double kick drums, doubled guitars, fast chip arpeggios, rising pressure, seamless loop, no intro, no fade out
```

### 6. Run, depois do minuto 20 (`run3`)

```text
chiptune metal, 16-bit Sega Genesis FM synth, NES pulse lead, distorted drop D guitars, instrumental, no vocals, no choir, thrash metal battle, 180 bpm, E minor, blast beats, shredding chip arpeggios, chaotic overload, maximum intensity, seamless loop, no intro, no fade out
```

### 7. Pico de onda (crise) (`crisis`)

```text
chiptune metal, 16-bit Sega Genesis FM synth, NES pulse lead, distorted drop D guitars, instrumental, no vocals, no choir, alarm siren chip lead, 170 bpm, E harmonic minor, urgent frantic riff, pounding drums, short 30 second loop, no intro, no fade out
```

### 8. Chefe (`boss`, opcional, para depois)

```text
chiptune metal, 16-bit Sega Genesis FM synth, NES pulse lead, distorted drop D guitars, instrumental, no vocals, no choir, boss battle, 165 bpm, E phrygian, FM church organ, crushing slow riff then fast breakdown, dark dramatic, double kick drums, seamless loop, no intro
```

### 9. Fim de run (`gameover`)

```text
chiptune metal, 16-bit Sega Genesis FM synth, NES pulse lead, distorted drop D guitars, instrumental, no vocals, no choir, game over theme, 90 bpm, E minor, short sad descending chip melody, then calm loop with slow bass and soft chip pads, melancholic, no drums
```

### 10. ALTA do organismo (`alta`)

```text
chiptune metal, 16-bit Sega Genesis FM synth, NES pulse lead, distorted drop D guitars, instrumental, no vocals, no choir, victory fanfare, 150 bpm, E major, triumphant chip brass, rolling snare, big final guitar power chord, short 12 second jingle, no loop
```

### 11. Jingle de level up (`levelup`)

```text
chiptune metal, 16-bit Sega Genesis FM synth, NES pulse lead, distorted drop D guitars, instrumental, no vocals, no choir, short level up jingle, 1 second, rising chip arpeggio ending on one guitar power chord
```

### 12. Jingle da cápsula e da ampola (`capsule`)

```text
chiptune metal, 16-bit Sega Genesis FM synth, NES pulse lead, distorted drop D guitars, instrumental, no vocals, no choir, short reward jingle, 3 seconds, chip snare roll building up to an opening major chord with sparkle arpeggio
```

### 13. Jingle do chefe chegando (`bossIn`)

```text
chiptune metal, 16-bit Sega Genesis FM synth, NES pulse lead, distorted drop D guitars, instrumental, no vocals, no choir, short boss alarm stinger, 2 seconds, low chip alarm and one heavy guitar hit
```

### 14. Jingle do pico de onda (`crisisIn`)

```text
chiptune metal, 16-bit Sega Genesis FM synth, NES pulse lead, distorted drop D guitars, instrumental, no vocals, no choir, short warning stinger, 1.5 seconds, rising chip siren
```

## Configuração

Quando o som entrar no código, um `src/config/audio.json`, com o tipo em `src/config/types.ts`:

- Volume padrão de música e de efeitos, e o volume da música na pausa e no pico.
- Tempo de crossfade de cada troca e os minutos de `run2` e `run3`.
- Por efeito: limite de cópias ao mesmo tempo e a variação de altura.
- Lista de faixas e efeitos com o nome do arquivo.

Nas **Opções**, entram dois controles: Música e Efeitos, de 0 a 100%, guardados no save. Hoje a tela diz que o volume chega com o som.

## O que falta decidir

- [ ] Qual app de geração de música, e o plano permite uso comercial?
- [ ] Mi menor ou Ré menor como tom do jogo inteiro?
- [ ] Três faixas de run por tempo (como proposto), ou uma por ambiente do mapa?
- [x] O chefe ganha música própria? → por enquanto não: só o jingle `bossIn` por cima da run (Vitor, 23/10/2026).
- [ ] Os efeitos saem de jsfxr ou ChipTone, ou o app de música também faz efeitos bons o bastante?
- [ ] O campo longo toca `idle` também no Hub (já que ele roda o tempo todo), ou cada tela com a sua?
- [ ] Música e efeitos ligados por padrão no celular, ou o jogo começa mudo até o primeiro toque em Opções?

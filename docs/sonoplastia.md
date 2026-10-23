# Sonoplastia

23 de outubro de 2026 · Vitor

O som do Farmaco Battle é **chiptune metal**: os canais de um console 8/16-bit (pulso, triângulo, ruído e o FM do Mega Drive) tocando riffs de metal, com guitarra distorcida e bateria de bumbo duplo por cima. As músicas são feitas num app de geração de música, fora do repositório; esta aba define o tema, a lista de faixas, como o jogo troca de música e o formato de entrega, com um prompt pronto para cada faixa.

**A música já está no jogo** (v0.14.0): todas as faixas e jingles abaixo, menos `bossIn` e `crisisIn`, que ainda não foram gerados. Os efeitos sonoros ainda são proposta. Volumes, tempos de troca e a lista de faixas ficam em `src/config/audio.json`; o player está em `src/game/audio/` (veja [Como entra no jogo](#como-entra-no-jogo)).

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
| `boss` | Chefe vivo (Partícula de LDL) | loop | 1:30 | 165 | 5 | Órgão em FM, riff lento e esmagador que vira rápido no meio; o motivo em tom grave |
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

- **Troca na run:** `run1` → `run2` aos 10 min e `run2` → `run3` aos 20 min, com crossfade de 1,5 s.
- **Pico de onda:** `crisisIn` toca (quando existir), a run cai para 30% do volume e `crisis` entra por cima enquanto o pico durar; no respiro, `crisis` sai em 1,5 s.
- **Chefe:** enquanto um chefe está vivo, `boss` substitui a música da run (e ganha da crise); quando ele morre, a faixa da run volta com crossfade. `bossIn` tocará por cima quando for gerado.
- **Pausa, level up, cápsula:** a música continua, a 50% do volume e com um filtro que corta os agudos (soa "abafada"). O jingle toca por cima, em volume cheio, e a música baixa enquanto ele toca. A ALTA no Hub toca `alta` do mesmo jeito.
- **Fim de run:** a música da run some na hora e `gameover` entra com a tela de resultado: a abertura toca uma vez e o resto fica em loop.
- **Fundo:** com o app em segundo plano (o campo longo continua rodando), o som para; volta onde estava ao retornar.
- **Menus:** `title` só na tela de título; todas as telas do hub dividem `hub`, sem recomeçar ao trocar de aba.

## Efeitos sonoros

A lista completa está em [efeitos-sonoros.md](efeitos-sonoros.md): 131 efeitos em 15 categorias (agente, especiais, armas, evoluções, moléculas, chefes, coleta, ampolas, level up, sinapses, mapa, run, campo longo e interface), cada um com id, quando toca, duração, variações, prioridade e um prompt pronto para o app, além das regras de mixagem.

Em resumo: os efeitos seguem o mesmo tema, chip na frente e um golpe de metal (power chord abafado, prato, caixa) só nos eventos grandes. Os frequentes são curtos, variam de altura a cada vez e têm limite de cópias ao mesmo tempo; gemas, saltos da Reação em Cadeia e quebras em cascata sobem de tom em sequência, como um combo. A interface é chip puro, sem metal.

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
- **Offline:** as músicas ficam fora do precache da build ([decisão 0016](decisoes/0016-offline-e-atualizacoes.md)) para a atualização continuar leve. O jogo baixa as faixas em segundo plano ao abrir, e o service worker guarda cada uma no cache `dopamina-audio` na primeira vez; depois disso tocam offline.
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

### 8. Chefe (`boss`)

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

## Como entra no jogo

As faixas que o Vitor gerou ficam em `audio/musicas/` com o nome que saíram do app; [tools/audio/music.py](../tools/audio/music.py) transforma cada uma no arquivo do jogo:

| Id | Arquivo em `audio/musicas/` | Loop (s) |
| --- | --- | --- |
| `title` | Tittle - Gallop of the Chip | 12,93 a 78,52 |
| `hub` | Hub - 16-Bit Lab Menu | 15,36 a 147,61 |
| `idle` | Idle - Factory Arpeggios | 12,44 a 121,37 |
| `run1` | Run 1 - 16-Bit Battle | 14,85 a 110,57 |
| `run2` | Run 2 - Battle Loop | 14,72 a 111,49 |
| `run3` | Run 3 - 16-Bit Battle | 13,08 a 136,21 |
| `crisis` | Crisis - 16-Bit Doom | 2,92 a 19,80 |
| `boss` | Boss - 16-Bit Armageddon | 8,21 a 77,78 |
| `gameover` | Game Over Theme | 1,22 a 155,42 |
| `alta` | Victory Fanfare | jingle |
| `levelup` | Level Up | jingle |
| `capsule` | Arcade Reward | jingle |

- **Loop sem emenda:** o script acha onde a música se repete (harmonia e batidas parecidas), corta o arquivo no fim do loop com um crossfade de 0,25 s para o começo dele e grava os pontos em `loopFrom` e `loopTo`. O jogo toca a introdução uma vez e repete só o trecho do loop (Web Audio, `loopStart`/`loopEnd`). Se uma emenda soar mal, ajuste os dois números no JSON e rode o script de novo.
- **Volume:** tudo normalizado para −16 LUFS.
- **Arquivos:** `public/audio/music/<id>.ogg` (Vorbis) e `.m4a` (AAC), cerca de 11 MB cada conjunto; o navegador baixa só um dos dois.
- **Faixa nova ou trocada:** coloque o arquivo em `audio/musicas/`, aponte `source` no `audio.json`, apague `loopFrom`/`loopTo` para o script procurar, rode `python3 tools/audio/music.py`, depois `npm run format`, e suba o `rev` da faixa para o cache dos jogadores baixar a nova.

## Configuração

`src/config/audio.json`, com o tipo em `src/config/types.ts`:

- Volume padrão da música, os passos do botão nas Opções, o volume abafado e a frequência do filtro, o volume da run durante a crise e durante um jingle.
- Tempo de crossfade e os minutos de `run2` e `run3`.
- Lista de faixas, na ordem em que são baixadas, com o arquivo de origem, os pontos de loop e o `rev`.
- Efeitos: ainda não entraram.

Nas **Opções**, a aba Som ([menu.md](menu.md#opções)) tem Mudo, os volumes Geral, Música e Efeitos em passos de 10% (o Geral multiplica os outros), Abafar na pausa e Tocar em segundo plano, tudo no save (`options.sound`). O volume de Efeitos já fica guardado e passa a valer quando os efeitos entrarem.

## O que falta decidir

- [ ] Qual app de geração de música, e o plano permite uso comercial?
- [ ] Mi menor ou Ré menor como tom do jogo inteiro?
- [ ] Três faixas de run por tempo (como proposto), ou uma por ambiente do mapa?
- [x] O chefe ganha música própria? → sim: o Vitor gerou `boss`, que toca enquanto o chefe está vivo (23/10/2026).
- [ ] Os efeitos saem de jsfxr ou ChipTone, ou o app de música também faz efeitos bons o bastante?
- [x] O campo longo toca `idle` também no Hub? → não, cada tela com a sua: `hub` nos menus, `idle` na tela do campo.
- [ ] Música e efeitos ligados por padrão no celular, ou o jogo começa mudo até o primeiro toque em Opções?

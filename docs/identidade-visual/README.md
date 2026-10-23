# Identidade visual (canvas)

Cópia das pranchetas do canvas [Dopamina Blaster — Identidade visual](https://claude.ai/artifact/MPV17zZywrhhXBUdfnUs6F), trazida em 22 de outubro de 2026. O canvas continua sendo onde a arte é desenhada; esta pasta guarda o fonte de cada prancheta no repositório, para qualquer sessão consultar sem acesso ao canvas.

Cada arquivo `.dc.html` é uma prancheta inteira (HTML com a lógica no fim, em `class Component`). A arte em pixel fica em tabelas de texto dentro do script (`ART`, `OBJ`, `TILES`, `I`): é daí que saem os JSON de `src/assets/sprites/`. O `canvas.json` é o índice do canvas, com a posição e o título de cada prancheta. Os arquivos não abrem sozinhos no navegador: dependem do `support.js` do canvas.

Ao mudar uma prancheta no canvas, copie o arquivo novo para cá no mesmo commit que leva a arte para o código.

| Prancheta | Arquivo | O que tem | No código |
| --- | --- | --- | --- |
| Guia de estilo | [Main.dc.html](Main.dc.html) | Logo, paleta, tipografia, barra de interações, botões, slot de agente | `src/assets/sprites/palette.json`, `src/game/ui/` |
| Tela de batalha (mockup) | [Batalha.dc.html](Batalha.dc.html) | Campo longo no celular em pé: interações, onda, base, pool de agentes, progresso | `src/game/scenes/IdleScene.ts` |
| Menu principal (protótipo) | [Menu.dc.html](Menu.dc.html) | Hub com status, caso, JOGAR e barra de abas | `src/game/scenes/HubScene.ts` |
| Opções | [Opcoes.dc.html](Opcoes.dc.html) | Opções com as abas Som (mudo, volumes geral, música e efeitos), Tela e Jogo, do hub e da pausa ([menu.md](../menu.md#opções)) | `src/game/scenes/OptionsScene.ts` |
| Opções no PC | [OpcoesPC.dc.html](OpcoesPC.dc.html) | As mesmas opções em tela larga, com Som, Tela e Jogo lado a lado e atalhos M (mudo) e Esc | `src/game/scenes/OptionsScene.ts` |
| Compêndio | [Compendio.dc.html](Compendio.dc.html) | Conceito do Compêndio com a wiki: índice com Registro e Guia, lista da categoria e verbete com ficha, texto, ligações e histórico ([menu.md](../menu.md#compêndio)) | `src/game/scenes/CatalogScene.ts` |
| Compêndio no PC | [CompendioPC.dc.html](CompendioPC.dc.html) | O mesmo Compêndio em tela larga: categorias, grade de verbetes e verbete lado a lado, com busca e atalhos | `src/game/scenes/CatalogScene.ts` |
| Sprites de moléculas | [Moleculas.dc.html](Moleculas.dc.html) | Átomos por elemento e moléculas montadas | `src/assets/sprites/molecules.json` |
| Crônico: HUD de batalha | [CronicoBatalha.dc.html](CronicoBatalha.dc.html) | HUD da run em pé | `src/game/ui/` (HUD da run) |
| Crônico: pausa e status | [CronicoPausa.dc.html](CronicoPausa.dc.html) | Pausa com arsenal e atributos | `src/game/scenes/PauseScene.ts` |
| Crônico: ícones, dano e paisagem | [CronicoGuia.dc.html](CronicoGuia.dc.html) | Molduras de ícone, números de dano, HUD deitada, regras de layout | `src/assets/sprites/frames.json` |
| Ícones de armas e habilidades | [Icones.dc.html](Icones.dc.html) | Ícones de armas, passivos, especiais e atributos | `src/assets/sprites/icons.json` |
| Crônico: level up | [CronicoLevelUp.dc.html](CronicoLevelUp.dc.html) | Tela de level up no celular | `src/game/scenes/LevelUpScene.ts` |
| Crônico: level up no PC | [CronicoLevelUpPC.dc.html](CronicoLevelUpPC.dc.html) | Tela de level up em tela larga | `src/game/scenes/LevelUpScene.ts` |
| Itens do mapa (drops) | [Itens.dc.html](Itens.dc.html) | Itens das vesículas, gemas, cápsulas, vesícula e fosfocreatina ([itens.md](../itens.md)) | `icons.json`, grupo `items` |
| Mapas: objetos e chão | [Mapas.dc.html](Mapas.dc.html) | Cinco ambientes: chão em tiles, obstáculos, destrutíveis e decoração ([mapas.md](../mapas.md)) | `src/assets/sprites/map.json` |
| Estruturas de interação (sinapses) | [Estruturas.dc.html](Estruturas.dc.html) | Sinapse, sinapse potenciada, foco inflamatório, coágulo e glândula adrenal, a sinapse enchendo e a seta na borda ([megabonk.md](../megabonk.md)) | `icons.json`, grupo `structures` (a seta "X" vira branca e o jogo tinge) |
| Suplementos e ampolas | [Suplementos.dc.html](Suplementos.dc.html) | Ampola (fechada e quebrando), o receptor Mutação e os 29 suplementos com a cor da raridade | `icons.json`, grupos `supplements` e `items` |

Falta no canvas: telas próprias para o PC (campo crônico, campo longo e menus em tela larga). Hoje só o level up, as Opções e o Compêndio têm versão de PC.

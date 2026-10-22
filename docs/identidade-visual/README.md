# Identidade visual (canvas)

Cópia das pranchetas do canvas [Dopamina Blaster — Identidade visual](https://claude.ai/artifact/MPV17zZywrhhXBUdfnUs6F), trazida em 22 de outubro de 2026. O canvas continua sendo onde a arte é desenhada; esta pasta guarda o fonte de cada prancheta no repositório, para qualquer sessão consultar sem acesso ao canvas.

Cada arquivo `.dc.html` é uma prancheta inteira (HTML com a lógica no fim, em `class Component`). A arte em pixel fica em tabelas de texto dentro do script (`ART`, `OBJ`, `TILES`, `I`): é daí que saem os JSON de `src/assets/sprites/`. O `canvas.json` é o índice do canvas, com a posição e o título de cada prancheta. Os arquivos não abrem sozinhos no navegador: dependem do `support.js` do canvas.

Ao mudar uma prancheta no canvas, copie o arquivo novo para cá no mesmo commit que leva a arte para o código.

| Prancheta | Arquivo | O que tem | No código |
| --- | --- | --- | --- |
| Guia de estilo | [Main.dc.html](Main.dc.html) | Logo, paleta, tipografia, barra de interações, botões, slot de agente | `src/assets/sprites/palette.json`, `src/game/ui/` |
| Tela de batalha (mockup) | [Batalha.dc.html](Batalha.dc.html) | Campo longo no celular em pé: interações, onda, base, pool de agentes, progresso | `src/game/scenes/IdleScene.ts` |
| Menu principal (protótipo) | [Menu.dc.html](Menu.dc.html) | Hub com status, caso, JOGAR e barra de abas | `src/game/scenes/HubScene.ts` |
| Sprites de moléculas | [Moleculas.dc.html](Moleculas.dc.html) | Átomos por elemento e moléculas montadas | `src/assets/sprites/molecules.json` |
| Crônico: HUD de batalha | [CronicoBatalha.dc.html](CronicoBatalha.dc.html) | HUD da run em pé | `src/game/ui/` (HUD da run) |
| Crônico: pausa e status | [CronicoPausa.dc.html](CronicoPausa.dc.html) | Pausa com arsenal e atributos | `src/game/scenes/PauseScene.ts` |
| Crônico: ícones, dano e paisagem | [CronicoGuia.dc.html](CronicoGuia.dc.html) | Molduras de ícone, números de dano, HUD deitada, regras de layout | `src/assets/sprites/frames.json` |
| Ícones de armas e habilidades | [Icones.dc.html](Icones.dc.html) | Ícones de armas, passivos, especiais e atributos | `src/assets/sprites/icons.json` |
| Crônico: level up | [CronicoLevelUp.dc.html](CronicoLevelUp.dc.html) | Tela de level up no celular | `src/game/scenes/LevelUpScene.ts` |
| Crônico: level up no PC | [CronicoLevelUpPC.dc.html](CronicoLevelUpPC.dc.html) | Tela de level up em tela larga | `src/game/scenes/LevelUpScene.ts` |
| Itens do mapa (drops) | [Itens.dc.html](Itens.dc.html) | Itens das vesículas, gemas, cápsulas, vesícula e fosfocreatina ([itens.md](../itens.md)) | `icons.json`, grupo `items` |
| Mapas: objetos e chão | [Mapas.dc.html](Mapas.dc.html) | Cinco ambientes: chão em tiles, obstáculos, destrutíveis e decoração ([mapas.md](../mapas.md)) | `src/assets/sprites/map.json` |

Falta no canvas: telas próprias para o PC (campo crônico, campo longo e menus em tela larga). Hoje só o level up tem versão de PC.

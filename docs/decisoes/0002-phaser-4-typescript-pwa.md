# 0002. Phaser 4 + TypeScript, jogo web instalável (PWA)

- **Status:** aceita
- **Data:** 2026-10-20
- **Área:** técnica

## Contexto

O jogo precisa rodar no PC, no celular e no tablet com um projeto só, feito por uma pessoa com Claude Code. Comparação completa na aba [Plataforma](../plataforma.md).

## Decisão

Jogo web em Phaser 4 com TypeScript, instalável como PWA.

## Alternativas consideradas

- **Godot 4:** editor visual bom, mas a exportação web é menos confiável no iPhone e no iPad, e C# não roda na web.
- **Defold:** forte na web, mas usa Lua e tem menos material para IA.
- **PixiJS:** só renderização; física, cenas e áudio teriam que ser montados à mão.
- **Unity:** builds web pesados e lentos no celular; exagero para um jogo 2D.

## Consequências

- Um link abre em qualquer aparelho, sem loja de apps.
- Tudo é código, o que favorece o trabalho com agentes.
- UI e ferramentas de editor precisam ser montadas no código.

# Plataforma

Objetivo: jogar no celular, no tablet e no computador com um projeto só, feito por você com Claude Code. A engine está decidida; o resto é **proposta**.

## Engine escolhida

**Decidido: jogo web, instalável como app (PWA), feito em Phaser 4 com TypeScript.**

- **Navegador roda em tudo.** Um link abre no PC, no celular e no tablet, sem loja de apps e sem build separado para cada aparelho.
- **PWA vira "app".** O jogo pode ser instalado na tela inicial, abre em tela cheia e funciona offline. No iPhone e iPad, a instalação é pelo menu Compartilhar → Adicionar à Tela de Início; desde o iOS 26, o que é adicionado assim já abre como app por padrão.
- **Phaser 4 combina com o jeito que você vai trabalhar.** É tudo código, sem editor visual obrigatório, o que é o cenário onde o Claude Code rende mais. O próprio repositório do Phaser 4 já vem com arquivos de skill para agentes de IA.
- **Aguenta a quantidade de inimigos.** O Phaser costuma desenhar dezenas de milhares de sprites com bom desempenho, e o renderizador novo recupera sozinho o contexto WebGL quando o celular manda o jogo para o fundo.

## Engines comparadas

| Engine | Linguagem | Web e celular | Prós | Contras |
| --- | --- | --- | --- | --- |
| **Phaser 4** | TypeScript / JavaScript | Nativo do navegador | Só código, ótimo com Claude Code; renderizador WebGL novo; gratuito e open source; sem passo de exportação | Sem editor visual; UI e ferramentas você monta |
| Godot 4 | GDScript | Exporta para web | Editor visual completo; gratuito; ótimo também para builds nativos no futuro | Web só com o renderizador Compatibility; C# não roda na web; Safari tem problemas de WebGL 2; navegador do iOS ainda é ponto fraco |
| Defold | Lua | Exporta para web | Engine minúscula na web (cerca de 1 MB); forte em web e celular | Lua e editor próprio; menos material e exemplos para IA que Phaser |
| PixiJS | TypeScript | Nativo do navegador | Renderizador muito rápido | É só renderização: física, cenas e áudio você monta |
| Unity | C# | Exporta para web | Ferramenta grande e conhecida | Builds web pesados e lentos no celular; exagero para um 2D |

**Por que não Godot:** ele faz sentido para quem quer editor visual ou builds nativos, mas a web no iPhone e no iPad é menos confiável. O Phaser é feito para 2D, nativo do navegador e só código, que é exatamente o caso deste jogo.

## Arquitetura proposta

- **Lógica separada do desenho.** Regras de combate, economia, saúde e idle ficam em TypeScript puro, sem depender do Phaser. O Phaser só desenha e lê o controle.
- **O simulador sai de graça.** Com a lógica separada, o mesmo código roda sem tela num script que joga milhares de runs e gera as curvas da aba Economia.
- **Parâmetros num arquivo só.** Todos os números da aba Parâmetros e da Economia num arquivo de configuração, para ajustar sem caçar valor no código.
- **Ferramentas:** Vite para rodar e empacotar; testes automatizados para a lógica.

## Controles

| Aparelho | Movimento | Especial |
| --- | --- | --- |
| Computador | WASD ou setas | Espaço |
| Celular e tablet | Joystick virtual que aparece onde o dedo toca | Botão grande no canto oposto |
| Controle (gamepad) | Analógico esquerdo | Botão A |

## Salvamento e progresso offline

- **Salvar no aparelho:** IndexedDB, o banco do navegador, com cópia de segurança exportável (um arquivo ou código para copiar).
- **Idle offline:** o jogo guarda a hora em que foi fechado e, ao abrir, calcula a produção do período, respeitando o teto de horas.
- **Sincronizar entre aparelhos:** opcional. Exige uma conta e um servidor simples (por exemplo, Supabase ou Firebase, que têm plano gratuito). Sem isso, cada aparelho tem o seu save.

## Desempenho no celular

- **Reaproveitar objetos.** Inimigos, disparos e gemas de XP saem de um "estoque" reaproveitado, sem criar e destruir a cada quadro.
- **Limite de objetos na tela.** O Vampire Survivors limita as gemas de XP no chão e junta o excedente numa gema só; vale fazer o mesmo com XP e ATP.
- **Meta:** 60 quadros por segundo num celular intermediário e download abaixo de 20 MB.
- **Testar no celular cedo.** Principalmente no Safari do iPhone, que costuma ser o mais chato.

## Onde publicar

Como o jogo é para você e para amigos, qualquer hospedagem estática gratuita resolve: GitHub Pages, Cloudflare Pages ou itch.io. Basta mandar o link. Se um dia quiser loja de apps, dá para empacotar o mesmo jogo web como app nativo sem reescrever.

## O que falta decidir

- O primeiro protótipo jogável é só o campo crônico (a run), como sugerido no conceito?
- O save precisa sincronizar entre celular e PC, ou cada aparelho com o seu está bom no começo?
- Orientação no celular: vertical, horizontal ou as duas?

## Referências

- [Phaser v4.0.0 (GitHub)](https://github.com/phaserjs/phaser/releases/tag/v4.0.0)
- [Phaser 4 renderer: faster, cleaner](https://phaser.io/news/2026/04/phaser-4-renderer-faster-cleaner-and-built-for-modern-games)
- [Phaser 4 rendering concepts](https://phaser.io/tutorials/phaser-4-rendering-concepts)
- [Godot: Exporting for the Web](https://docs.godotengine.org/fr/stable/tutorials/export/exporting_for_web.html)
- [Godot 4 für Web-Spiele (2026)](https://dev.to/ziva/godot-4-fur-web-spiele-export-wasm-und-browser-performance-4315)
- [Defold at Digital Dragons 2026](https://defold.com/digital-dragons-2026)
- [PWA for offline web games](https://app.cinevva.com/tutorials/pwa-offline-games.html)

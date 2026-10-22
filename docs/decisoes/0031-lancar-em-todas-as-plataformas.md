# 0031. Lançar o jogo em todas as plataformas, empacotando a mesma build web

- **Status:** proposta
- **Data:** 2026-10-22
- **Área:** processo

## Contexto

A [0002](0002-phaser-4-typescript-pwa.md) escolheu um jogo web instalável e a [0018](0018-jogo-no-pages-servidor-futuro.md) fixou o GitHub Pages como único host do jogo web. O Vitor quer lançar também nas lojas: Android, iOS, Steam e Microsoft Store. A 0018 será revista no futuro, mas o objetivo de estar em todas as plataformas já vale. O mapa técnico está em [publicacao.md](../publicacao.md).

## Decisão

- O objetivo do projeto passa a incluir **lançar em todas as plataformas**: web/PWA, Android, iOS, Steam (Windows, Mac, Linux) e Microsoft Store.
- Existe **um só código do jogo**. Cada loja recebe a mesma build web (`dist/`) dentro de um wrapper: Capacitor (celular), Electron (Steam) e PWABuilder (Microsoft Store). Nada de fork por plataforma.
- O GitHub Pages continua sendo a versão web e o canal de testes. A 0018 não muda: esta decisão a complementa e não a substitui.
- O trabalho entra no roadmap como **fase 7**, depois da fase 6. A ordem das plataformas fica em [publicacao.md](../publicacao.md#ordem-sugerida).
- Diferenças entre plataformas (base do Vite, service worker, local do save) ficam numa flag de build, não em ramificações no código do jogo.

## Alternativas consideradas

- **Ficar só no PWA:** não chega à Steam nem às lojas, que é o que o Vitor quer.
- **Reescrever em engine nativa (Unity, Godot):** joga fora o trabalho feito e contradiz a 0002.
- **Tauri em vez de Electron na Steam:** menor, mas o WebView do sistema varia entre máquinas e o jogo depende de WebGL. Fica como opção se o tamanho virar problema.

## Consequências

- Nova fase 7 no [roadmap](../roadmap.md); [publicacao.md](../publicacao.md) deixa de ser só ideia futura.
- O save ([0005](0005-save-local-indexeddb.md)) e o aviso de atualização ([0016](0016-offline-e-atualizacoes.md)) precisam de variação por plataforma: no app nativo a atualização é a da loja e o save pode ir para arquivo.
- Contas de desenvolvedor, taxas, política de privacidade, classificação etária e as regras de conteúdo sobre remédios e substâncias reais viram trabalho de lançamento.
- Quando a 0018 for revista, a hospedagem do servidor de contas e save na nuvem ([servidor.md](../servidor.md)) conversa com esta decisão, porque o save precisa funcionar entre plataformas.

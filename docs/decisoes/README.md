# Registro de decisões

Cada decisão importante do projeto, técnica ou de design, fica num arquivo próprio e numerado. Assim o motivo de cada escolha sobrevive entre sessões e entre agentes. As regras de quando e como registrar estão no [AGENTS.md](../AGENTS.md#registrar-decisões-obrigatório); o formato está em [_modelo.md](_modelo.md).

As decisões de design tomadas antes deste registro continuam marcadas como "decidido" nos docs de cada aba. A partir de agora, decisões novas entram aqui.

| Nº | Decisão | Área | Status |
| --- | --- | --- | --- |
| [0001](0001-registrar-decisoes.md) | Registrar decisões em arquivos numerados | processo | aceita |
| [0002](0002-phaser-4-typescript-pwa.md) | Phaser 4 + TypeScript, jogo web instalável (PWA) | técnica | aceita |
| [0003](0003-camadas-core-game-config.md) | Camadas config, core e game, com Vite e Vitest | técnica | proposta |
| [0004](0004-parametros-centralizados.md) | Parâmetros em arquivos JSON tipados | técnica | proposta |
| [0005](0005-save-local-indexeddb.md) | Save local no IndexedDB, sem sincronização por enquanto | técnica | proposta |
| [0006](0006-deploy-github-pages.md) | Deploy no GitHub Pages pelo GitHub Actions | técnica | substituída por 0011 |
| [0007](0007-roadmap-run-primeiro.md) | Desenvolver a run primeiro, depois o resto | processo | proposta |
| [0008](0008-v01-menu-e-run.md) | A primeira versão (v0.1) tem menu e uma run jogável | processo | proposta |
| [0009](0009-grade-16px-zoom-inteiro.md) | Resolução nativa com pixel art detalhado | técnica | proposta |
| [0010](0010-orientacao-livre.md) | Orientação livre no celular, pensada para vertical | técnica | proposta |
| [0011](0011-rodar-localmente.md) | Rodar localmente durante o desenvolvimento | técnica | substituída por 0017 |
| [0012](0012-passo-fixo-e-semente.md) | Simulação em passo fixo, com aleatoriedade por semente | técnica | proposta |
| [0013](0013-raridade-e-sorte.md) | Raridade dos modificadores, movida pela Sorte | design | proposta |
| [0014](0014-fase-menu-principal.md) | Fase 1.5: esqueleto do menu principal antes da profundidade da run | processo | proposta |
| [0015](0015-acao-do-agente-e-armas.md) | Ação própria do agente + armas do pool, com tipos de ataque em JSON | design | aceita |
| [0016](0016-offline-e-atualizacoes.md) | Jogo offline, com atualização só por build completa e aviso só nos menus | técnica | proposta |
| [0017](0017-deploy-por-versao.md) | Deploy no GitHub Pages e no Render só ao gerar uma versão | técnica | substituída por 0018 (Render) |
| [0018](0018-jogo-no-pages-servidor-futuro.md) | O jogo roda só no GitHub Pages; o servidor fica para contas e ranking | técnica | aceita |
| [0019](0019-sprites-numa-pasta.md) | Todos os sprites como dados numa pasta única | técnica | substituída em parte por 0020 |
| [0020](0020-sprites-em-png-por-tamanho.md) | Sprites em PNG, gerados por tamanho a partir dos dados | técnica | proposta |

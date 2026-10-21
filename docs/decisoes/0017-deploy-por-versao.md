# 0017. Deploy no GitHub Pages e no Render só ao gerar uma versão

- **Status:** aceita
- **Data:** 2026-10-21
- **Área:** técnica

## Contexto

A [0011](0011-rodar-localmente.md) deixava o jogo só local até decidir a distribuição. O Vitor configurou o GitHub Pages para publicar por Action e criou um Web Service no Render. Ele quer deploy só quando uma versão for gerada, não a cada commit.

## Decisão

- **Gerar uma versão** = criar uma tag `vX.Y.Z` com `npm version patch|minor|major` (sobe o `package.json`, faz o commit e cria a tag) e enviar com `git push --follow-tags`.
- A tag dispara o workflow [deploy.yml](../../.github/workflows/deploy.yml): check completo, build e publicação no **GitHub Pages** (`https://vstahelin.github.io/Dopamine/`, com `BASE_PATH=/Dopamine/`) e, em seguida, o deploy no **Render** pelo deploy hook, apontando para o mesmo commit da tag.
- No Render, o jogo roda como Web Service Node: build `npm ci && npm run build`, start `npm start` ([server/index.mjs](../../server/index.mjs)), servindo `dist/` com os cabeçalhos de cache de [atualizacoes.md](../atualizacoes.md). O deploy automático do Render fica desligado; só o hook publica.
- Commits comuns na `main` continuam só com o CI (lint, formatação, testes e build).
- Substitui a [0011](0011-rodar-localmente.md). O `npm run dev` segue para programar; o `npm run release` + `npm run serve` seguem para testar a publicação no PC.

## Alternativas consideradas

- **Deploy a cada push na `main`** ([0006](0006-deploy-github-pages.md)): publica estados intermediários, que o jogador veria como versão nova.
- **Só o Render ou só o Pages:** o Pages é estático e gratuito; o Render abre espaço para um servidor de verdade no futuro (por exemplo, sincronizar o save entre aparelhos).

## Consequências

- Cada versão publicada tem tag, `version.json` e `buildId`; o gestor de atualização do jogo ([0016](0016-offline-e-atualizacoes.md)) avisa os jogadores nos menus.
- O ambiente `github-pages` do repositório precisa aceitar deploy a partir de tags `v*`.
- O segredo `RENDER_DEPLOY_HOOK_URL` precisa estar nos segredos do repositório; sem ele, o passo do Render é pulado.
- Com HTTPS de verdade nos dois hosts, o service worker funciona no celular sem certificado local.

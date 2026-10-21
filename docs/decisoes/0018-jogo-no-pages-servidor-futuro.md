# 0018. O jogo roda só no GitHub Pages; o servidor fica para contas e ranking

- **Status:** aceita
- **Data:** 2026-10-21
- **Área:** técnica

## Contexto

A [0017](0017-deploy-por-versao.md) publicava o mesmo jogo no GitHub Pages e no Render. O jogo é estático e roda inteiro no navegador, então o Render só repetia o Pages, com a desvantagem de "dormir" no plano gratuito. O Vitor quer o jogo direto no Pages e um servidor só quando houver o que ele faça.

## Decisão

- O jogo é publicado **só no GitHub Pages**, por versão (tag `vX.Y.Z`), como na 0017.
- O deploy no Render e o servidor Node que só entregava os arquivos (`npm start`) saem do projeto.
- O servidor volta no futuro, para **contas opcionais, save na nuvem e ranking** ([servidor.md](../servidor.md)). Ele será uma API, não um host do jogo. O Render é o candidato.

## Alternativas consideradas

- **Manter os dois hosts com o mesmo jogo:** duas URLs para o mesmo conteúdo e cold start no Render, sem ganho.

## Consequências

- Substitui a 0017 só na parte do Render; o deploy por versão no Pages continua igual.
- O aviso de versão nova pode chegar com até 10 minutos de atraso, por causa do cache do Pages ([atualizacoes.md](../atualizacoes.md)).

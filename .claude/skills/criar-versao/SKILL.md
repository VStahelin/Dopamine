---
name: criar-versao
description: Cria uma versão nova do Dopamina Blaster (tag vX.Y.Z) a partir da main, depois de conferir que tudo passa. Use quando o Vitor pedir para "criar versão", "gerar versão", "fechar versão" ou "criar build". Não publica: para isso existe a skill publicar-versao.
---

# Criar versão

Uma versão é uma tag `vX.Y.Z` na `main` ([decisão 0017](../../../docs/decisoes/0017-deploy-por-versao.md)). Esta skill só cria a versão localmente. Publicar (enviar a tag e acompanhar o deploy no GitHub Pages) é a skill `publicar-versao`.

## Passos

1. **Main limpa e em dia.**
   - `git status --short` precisa estar vazio. Se houver mudanças, pergunte se é para commitar antes (ou commite, se o Vitor já pediu).
   - `git branch --show-current` precisa ser `main`.
   - `git fetch origin` e confira `git log main..origin/main --oneline`. Se a `main` remota tiver commits novos, junte (`git merge origin/main`), resolva conflitos mantendo o trabalho dos dois lados e rode o check de novo.
2. **Tudo passa.** Rode `npm run check` (lint, formatação, testes e build). Se falhar, pare e mostre o erro: versão não sai com check vermelho.
3. **O que muda desde a última versão.** `git describe --tags --abbrev=0` dá a última tag; `git log <última tag>..HEAD --oneline` lista os commits. Resuma em uma linha o que a versão traz (é a mensagem da tag).
4. **Changelog.** Em [CHANGELOG.md](../../../CHANGELOG.md), confira se a seção "Em desenvolvimento" cobre os commits do passo 3 (novidades, ajustes e correções que o jogador percebe) e complete o que faltar. Depois do passo 5 você vai trocar o título dela pelo número e pela data.
5. **Escolha o número** (versionamento semântico, com o jogo ainda em 0.x):
   - `patch` (0.2.0 → 0.2.1): ajuste de números, correção de bug, texto.
   - `minor` (0.2.0 → 0.3.0): fase do roadmap concluída ou recurso novo (arma, agente, tela).
   - `major` (0.x → 1.0.0): só quando o Vitor disser que o jogo está pronto para os amigos.
   Na dúvida entre patch e minor, mostre os commits e pergunte.
6. **Crie a versão:**
   ```
   npm version <patch|minor|major> -m "v%s: <resumo de uma linha>"
   ```
   Antes de rodar, troque no CHANGELOG.md o título `## Em desenvolvimento` por `## vX.Y.Z · DD/MM/AAAA` com o número que vai sair, abra uma seção `## Em desenvolvimento` vazia em cima e commite (`Changelog da vX.Y.Z`): o `npm version` exige a árvore limpa. Ele sobe o `package.json` e o `package-lock.json`, faz o commit e cria a tag anotada. O `version.json` da build e a tela de Opções passam a mostrar o número novo, e a tela Novidades mostra o changelog.
7. **Opcional: teste da publicação no PC.** `npm run release` publica a build em `releases/` e `npm run serve` serve em `https://localhost:4443/` (docs/atualizacoes.md). Use quando a versão mexer no gestor de atualização ou no service worker.
8. **Avise o Vitor:** número da versão, o resumo, e que ela ainda não está no ar. Ofereça rodar `publicar-versao`.

## Não faça

- Não envie a tag (`git push`) aqui: isso publica no ar.
- Não crie versão com check falhando ou com a árvore suja.
- Não reaproveite um número de versão que já existe (`git tag -l`).

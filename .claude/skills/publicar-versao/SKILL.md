---
name: publicar-versao
description: Publica no GitHub Pages uma versão já criada do Dopamina Blaster, enviando a main e a tag vX.Y.Z e acompanhando o deploy até o jogo estar no ar. Use quando o Vitor pedir para "publicar", "subir a versão", "fazer o deploy" ou "colocar no ar". Se a versão ainda não existe, rode antes a skill criar-versao.
---

# Publicar versão

Enviar uma tag `vX.Y.Z` dispara o workflow [deploy.yml](../../../.github/workflows/deploy.yml): check completo, build e publicação no GitHub Pages ([decisões 0017 e 0018](../../../docs/decisoes/0018-jogo-no-pages-servidor-futuro.md)). Os jogadores recebem o aviso "Nova versão pronta" nos menus (docs/atualizacoes.md).

## Passos

1. **Qual versão.** `git describe --tags --abbrev=0` dá a última tag local. Confira que ela aponta para o `HEAD` da `main` (`git rev-parse <tag>^{} HEAD`) e que ainda não está no GitHub (`git ls-remote --tags origin <tag>` vazio). Se não houver versão nova, rode antes a skill `criar-versao`.
2. **Envie a main e a tag juntas:**
   ```
   git push origin main --follow-tags
   ```
   Se o push da `main` for recusado por commits novos no GitHub, faça `git fetch` e `git merge origin/main`, rode `npm run check`, e como a tag ficaria apontando para um commit antigo, pergunte ao Vitor se recria a versão em cima do merge.
3. **Acompanhe o deploy:**
   ```
   gh run list --workflow deploy.yml --limit 1 --json databaseId,status,headBranch
   gh run watch <id> --exit-status
   ```
   Se falhar, mostre o erro com `gh run view <id> --log-failed`. Não apague nem mova a tag sem o Vitor pedir.
   - Erro "not allowed to deploy to github-pages due to environment protection rules": o ambiente `github-pages` precisa aceitar tags `v*` (Settings → Environments → github-pages).
4. **Confira no ar:**
   ```
   curl -s "https://vstahelin.github.io/Dopamine/version.json?t=$(date +%s)"
   ```
   O `version` precisa ser o da tag. O Pages guarda cache por até 10 minutos; se vier a versão antiga, espere e confira de novo.
5. **Avise o Vitor:** versão no ar, o link `https://vstahelin.github.io/Dopamine/`, e que quem já tem o jogo vai ver o aviso de versão nova nos menus (com até 10 minutos de atraso por causa do cache do Pages).

## Não faça

- Não use `--force` em push de tag ou da `main`.
- Não publique uma tag que não passou pelo `criar-versao` (check verde e árvore limpa).

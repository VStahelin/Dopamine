# 0016. Jogo offline, com atualização só por build completa e aviso só nos menus

- **Status:** proposta
- **Data:** 2026-10-21
- **Área:** técnica

## Contexto

O jogo carrega do servidor a cada acesso e o `npm run dev` recarrega a tela sozinho quando o código muda. O Vitor quer o contrário: o jogo descarregado no aparelho, imune a quedas e oscilações de internet, sem atualizar no meio da partida, trocando de versão só por build completa e só quando o jogador aceitar, com um aviso nos menus e um botão para procurar atualização. Detalhes em [atualizacoes.md](../atualizacoes.md).

## Decisão

- **PWA offline-first agora**, não na fase 6: service worker com precache de toda a build (`vite-plugin-pwa`/Workbox, modo `prompt`). Antecipa a parte de PWA da [0002](0002-phaser-4-typescript-pwa.md).
- **Build como unidade de atualização:** cada build tem `version.json` (versão, `buildId`, lista de arquivos). O aparelho só troca de versão quando a build nova inteira está baixada.
- **Troca só com o jogador:** a versão nova espera; entra quando o jogador aceita o aviso ou recarrega o site. O aviso só aparece nos menus; descoberto durante a run, espera a volta ao hub.
- **Botão VERIFICAR ATUALIZAÇÃO** nas Opções, com a versão e o `buildId` na tela.
- **Publicação atômica** (`npm run release`): arquivos com hash primeiro, `sw.js`/`index.html`/`version.json` por último; as 3 builds anteriores ficam disponíveis.
- **Fontes locais** (`@fontsource`), sem Google Fonts.
- **Teste no celular** com a build de produção em HTTPS na rede local (`npm run serve`); o `npm run dev` fica só para programar.

## Alternativas consideradas

- **Recarregar sozinho quando houver versão nova:** simples, mas interrompe a partida, que é justamente o que se quer evitar.
- **Service worker escrito à mão:** menos dependência, mas reimplementa precache, versões e limpeza que o Workbox já faz.
- **Sem service worker, só cache HTTP:** não garante o jogo offline nem a troca atômica de versão.

## Consequências

- Entra uma fase 2.5 no roadmap, antes da fase 3.
- A [0011](0011-rodar-localmente.md) continua valendo: tudo segue local, mas o teste como jogador passa a ser pelo `npm run serve`.
- Toda mudança de formato do save precisa de migração (já previsto na [0005](0005-save-local-indexeddb.md)), porque versões novas abrem saves antigos.

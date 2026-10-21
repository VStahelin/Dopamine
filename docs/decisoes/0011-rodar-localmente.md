# 0011. Rodar localmente durante o desenvolvimento

- **Status:** substituída por [0017](0017-deploy-por-versao.md)
- **Data:** 2026-10-21
- **Área:** técnica

## Contexto

A [0006](0006-deploy-github-pages.md) propunha publicar no GitHub Pages a cada push. Ainda é cedo para isso: o projeto está em desenvolvimento, e como o jogo vai chegar aos jogadores (provavelmente pelo navegador) é uma conversa para mais à frente.

## Decisão

Enquanto o jogo estiver em desenvolvimento, ele roda só localmente: `npm run dev` no PC, e o celular abre pelo IP do PC na mesma rede Wi-Fi. O GitHub Actions só roda as verificações (lint, formatação, testes e build), sem publicar nada. Substitui a 0006.

Esta decisão **não** define a distribuição do jogo. Isso fica para uma decisão própria, quando chegar a hora (no máximo na fase 6 do [roadmap](../roadmap.md)).

## Alternativas consideradas

- **GitHub Pages a cada push (0006):** dá um link fixo, mas publicar agora é antecipar uma decisão que ainda não foi pensada.

## Consequências

- O `base` do Vite fica na raiz (`/`).
- Testar no celular exige o PC ligado, na mesma rede. Na primeira vez, o Windows pode pedir para liberar o Node no firewall.
- Pelo IP local, sem HTTPS, alguns recursos do navegador (instalar como PWA, por exemplo) não funcionam no celular. Não atrapalha o desenvolvimento até a fase 6.

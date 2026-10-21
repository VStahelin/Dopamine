# 0006. Deploy no GitHub Pages pelo GitHub Actions

- **Status:** proposta
- **Data:** 2026-10-21
- **Área:** técnica

## Contexto

O jogo precisa ser testado no celular desde a fase 0 e, no fim, compartilhado com amigos por um link. O repositório já está no GitHub.

## Decisão

Cada push na `main` dispara um workflow do GitHub Actions que roda testes, gera o build e publica no GitHub Pages.

## Alternativas consideradas

- **Cloudflare Pages:** igualmente bom, mas é mais uma conta para configurar.
- **itch.io:** bom para o lançamento, ruim para deploy contínuo.

## Consequências

- Todo commit na `main` vira uma versão jogável no celular.
- O Vite precisa do `base` configurado com o nome do repositório.

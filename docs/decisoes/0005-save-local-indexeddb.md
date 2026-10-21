# 0005. Save local no IndexedDB, sem sincronização por enquanto

- **Status:** proposta
- **Data:** 2026-10-21
- **Área:** técnica

## Contexto

O jogo precisa guardar meta-progressão e o horário de saída para o idle offline. A aba [Plataforma](../plataforma.md) deixa em aberto se o save sincroniza entre aparelhos.

## Decisão

O save fica no IndexedDB do navegador, com um número de versão e migrações, e pode ser exportado e importado como arquivo ou código. A sincronização entre aparelhos fica para depois.

## Alternativas consideradas

- **localStorage:** limite pequeno e síncrono.
- **Servidor com conta (Supabase, Firebase):** resolve a sincronização, mas exige login e backend antes de o jogo existir.

## Consequências

- Cada aparelho tem seu próprio save; o backup exportável cobre a troca de aparelho.
- O formato versionado permite adicionar sincronização depois sem perder saves.

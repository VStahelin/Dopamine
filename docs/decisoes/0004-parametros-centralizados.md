# 0004. Parâmetros em arquivos JSON tipados

- **Status:** proposta
- **Data:** 2026-10-21
- **Área:** técnica

## Contexto

As abas [Parâmetros](../parametros.md) e [Economia](../economia.md) têm dezenas de constantes que vão mudar muito durante os testes. O Vitor quer todas elas em arquivos de configuração, no formato mais rápido de ler.

## Decisão

Todos os parâmetros ficam em arquivos **JSON** em `src/config/`, um por assunto:

| Arquivo | Conteúdo |
| --- | --- |
| `stats.json` | Atributos do agente (aba Parâmetros): base, teto na run e teto meta |
| `run.json` | Mapa, velocidade e coleta do agente, dano por contato, afinidade |
| `economy.json` | XP, dificuldade, custo de upgrades, saúde, reset, teto de poder permanente |
| `idle.json` | Ritmo de disparo, espaços na base, teto offline |
| `display.json` | Grade de pixel, área visível mínima, FPS |

Cada arquivo tem um tipo em `src/config/types.ts`, e `src/config/index.ts` é o único ponto de acesso (`STATS`, `RUN`, `ECONOMY`, `IDLE`, `DISPLAY`). Se um JSON sair do formato, o build falha. Nenhum número de balanceamento fica solto no `core` ou no `game`.

Convenções: percentuais como frações (1 = 100%, 0,25 = +25%), unidade no nome da chave quando não é óbvia (`Px`, `Seconds`, `Hours`), e `null` para "sem teto".

## Alternativas consideradas

- **YAML:** aceita comentários, mas precisa de uma biblioteca de parsing, mais lenta e que aumenta o bundle. JSON é lido nativamente pelo navegador e importado pelo Vite sem plugin.
- **Constantes em TypeScript:** tipagem e comentários de graça, mas mistura dados com código e não serve para ferramentas externas.
- **Constantes espalhadas no código:** cada ajuste vira uma caça ao valor.

## Consequências

- Ajustar o jogo é editar um JSON.
- JSON não aceita comentários: a explicação de cada campo fica nos tipos em `types.ts` e nas abas de `docs/`.
- O simulador pode carregar variações dos JSON para comparar curvas.

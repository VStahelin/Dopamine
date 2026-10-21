# 0001. Registrar decisões em arquivos numerados

- **Status:** aceita
- **Data:** 2026-10-21
- **Área:** processo

## Contexto

O projeto é feito com agentes de IA em várias sessões. O que é decidido numa conversa se perde quando a sessão acaba, e a próxima sessão pode refazer ou contradizer a escolha.

## Decisão

Toda decisão que muda o rumo do projeto vira um arquivo em `docs/decisoes/`, numerado, com contexto, decisão, alternativas e consequências. O [AGENTS.md](../../AGENTS.md) obriga qualquer agente a ler esse registro antes de trabalhar e a escrever nele ao decidir algo. O `CLAUDE.md` só importa o `AGENTS.md`, para que todas as ferramentas leiam as mesmas regras.

## Alternativas consideradas

- **Um único arquivo de decisões:** fica longo e gera conflito quando duas decisões mudam ao mesmo tempo.
- **Só a memória do agente:** fica fora do repositório, presa a uma ferramenta e a uma máquina.

## Consequências

- Decisões novas começam como `proposta` e só viram `aceita` com a confirmação do Vitor.
- Decisões aceitas não são editadas: uma nova decisão substitui a antiga.
- [docs/arquitetura.md](../arquitetura.md) descreve o estado atual e aponta para as decisões que o justificam.

# AGENTS.md

Instruções para qualquer agente de IA (Claude Code, Codex, Cursor e outros) que trabalhe neste repositório. Leia este arquivo inteiro antes de começar.

## O projeto

Dopamina Blaster: roguelike incremental de auto-battle idle, em que agentes (remédios e substâncias reais) decompõem moléculas inimigas dentro de um organismo. Jogo web instalável (PWA) em Phaser 4 + TypeScript. Projeto solo, pessoal, para jogar com amigos.

## Onde está cada coisa

| Arquivo | Para que serve |
| --- | --- |
| [docs/README.md](docs/README.md) | Índice da documentação de design do jogo |
| [docs/roadmap.md](docs/roadmap.md) | Fases de desenvolvimento, status e próximos itens |
| [docs/arquitetura.md](docs/arquitetura.md) | Como o código está organizado hoje: stack, camadas, pastas e convenções |
| [docs/decisoes/](docs/decisoes/README.md) | Registro de decisões, um arquivo por decisão |

## Antes de começar uma tarefa

1. Leia [docs/roadmap.md](docs/roadmap.md) para saber em que fase o projeto está.
2. Leia [docs/arquitetura.md](docs/arquitetura.md) e o índice de [docs/decisoes/](docs/decisoes/README.md).
3. Leia a aba de design ligada à tarefa (por exemplo, [docs/armas.md](docs/armas.md) ao mexer em armas).
4. Não contradiga uma decisão com status `aceita`. Se a tarefa pede algo diferente, avise e proponha uma decisão nova que substitua a anterior.

## Registrar decisões (obrigatório)

Só as decisões **importantes**, que têm impacto na construção do jogo, viram um arquivo em `docs/decisoes/`, mesmo que tenham sido tomadas numa conversa. A memória da sessão se perde; o repositório não. O registro tem que continuar curto: decisão pequena não entra.

- **Teste:** se uma sessão nova não souber disso, ela vai construir algo errado ou desfazer trabalho? Se não, não registre.
- **Entra:** tecnologia ou biblioteca central, arquitetura e camadas, formato de dados e de save, mecânica central que o código precisa seguir, escopo ou ordem das fases do roadmap.
- **Não entra:** valores de balanceamento (ficam nos JSON de `src/config/`; mudar número não é decisão), respostas de design que cabem no próprio doc da aba, detalhe de implementação, nomes, estilo de código, correção de bug, escolha que se desfaz em minutos.
- **Na dúvida:** pergunte ao Vitor antes de criar o arquivo.
- **Como:** copie [docs/decisoes/_modelo.md](docs/decisoes/_modelo.md) para o próximo número livre (`NNNN-titulo-curto.md`), preencha e adicione uma linha no índice [docs/decisoes/README.md](docs/decisoes/README.md).
- **Status:** `proposta` (sugerida, falta o Vitor aprovar), `em aberto` (o Vitor ainda não decidiu; o código usa um valor provisório), `aceita`, `substituída por NNNN`. Agentes criam decisões como `proposta`; só passam para `aceita` quando o Vitor confirmar.
- **Nunca apague nem reescreva** uma decisão aceita. Para mudar, crie uma nova e marque a antiga como `substituída por NNNN`.
- **Propague:** se a decisão muda a arquitetura, atualize [docs/arquitetura.md](docs/arquitetura.md); se responde uma pergunta em aberto de um doc de design, marque a pergunta no doc com o link da decisão.

## Ao terminar uma tarefa

- Marque os itens concluídos no [roadmap](docs/roadmap.md) e atualize o status da fase.
- Registre as decisões tomadas durante a tarefa.
- Rode os testes e o lint antes de dizer que terminou (os comandos estão em [docs/arquitetura.md](docs/arquitetura.md) quando o projeto existir).

## Convenções

- **Idioma:** documentação, mensagens de commit e textos do jogo em português do Brasil. Código (nomes de variáveis, funções, tipos) em inglês.
- **Lógica separada do desenho:** nada em `src/core/` importa Phaser. Veja [docs/arquitetura.md](docs/arquitetura.md).
- **Parâmetros** ficam só nos JSON de `src/config/`, lidos por `src/config/index.ts`, nunca soltos no código. Parâmetro novo: adicione no JSON e no tipo em `src/config/types.ts`.
- **Commits** pequenos, um assunto por commit. Trabalhe em branch e abra PR para a `main`.

# 0039. Modo admin para testar o jogo sem jogar horas

- **Status:** proposta
- **Data:** 2026-10-24
- **Área:** técnica

## Contexto

Para testar o fim de jogo, a progressão do caso ou uma arma no máximo, o Vitor precisa jogar 20 a 30 minutos. O `globalThis.dopamina` só existe no `npm run dev` e é manual; o simulador (`src/core/sim/`) joga sozinho, mas fora do jogo.

## Decisão

- **Comandos no `core`**, em `src/core/admin/`, sem Phaser: cada comando recebe a run (quando houver) e o save e devolve o save novo e uma mensagem. O texto do comando (`time 20`, `give radical 8`) é lido por um parser no mesmo lugar. Assim os comandos têm teste e rodam no painel, no console e no simulador.
- **Painel no jogo** (`AdminScene`) por cima da run e do hub, com botões para o mais usado e uma linha de comando. No PC abre com a crase; no celular, por um botão na pausa e no hub.
- **Vai na build publicada**, escondido: liga com `?admin=1` na URL ou tocando 7 vezes na versão em Opções, e fica salvo em `options.admin`. Quando houver contas ([servidor.md](../servidor.md)), a permissão passa a vir do usuário.
- **A run admin conta no save normalmente**, para dar para testar estrelas, caso e ALTA. O que protege o save de verdade é uma cópia guardada ao ligar o modo, com um botão para voltar a ela.
- **Avançar no tempo** tem dois comandos: `time` pula o relógio (dificuldade, ondas e chefes do minuto, com a build de agora, sem os chefes perdidos nascerem de uma vez) e `ff` avança com o robô do simulador jogando, sem desenhar, até o minuto pedido.

## Alternativas consideradas

- **Só no `npm run dev`:** não dá para testar no celular nem no jogo publicado.
- **Run admin sem contar para nada:** protege o save, mas impede justamente testar a progressão.
- **Só console:** ruim de usar no celular.

## Consequências

- `src/core/admin/` novo; o robô do simulador passa a ter um passo reaproveitável (`botAdvance`) usado pelo `ff`.
- `RunState` ganha `admin` (comandos usados e o modo sem dano); `hurtAgent` respeita o modo sem dano.
- `SaveData.options` ganha `admin`.
- [arquitetura.md](../arquitetura.md) descreve o modo admin.

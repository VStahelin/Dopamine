# 0021. Meta-progressão: Laboratório em árvore, desbloqueios com ATP e baú das estrelas

- **Status:** proposta
- **Data:** 2026-10-21
- **Área:** design

## Contexto

A fase 3 faz cada run deixar algo para a próxima. O Vitor escolheu: começar só com a Dopamina e quatro armas, um Laboratório em árvore com caminhos (e não uma lista de upgrades) e estrelas do caso que dão ATP pelo baú. A [aba Economia](../economia.md) pede custo exponencial, teto de +50% de poder permanente, primeiro desbloqueio em 2 ou 3 runs e nenhuma parede de grind.

## Decisão

- **Tudo em `src/config/meta.json`:** o que começa liberado, o custo de cada desbloqueio, o ATP de cada estrela e a árvore do Laboratório. O carregador confere ids, tetos (`metaCap` de `stats.json`) e o teto de poder permanente (dano + interações) da aba Economia.
- **Começo:** Dopamina e as armas Radical Livre, Jato Ácido, Nuvem de Elétrons e Catalisador. Lipase, Insulina, Poça de Solvente, Reação em Cadeia e Raio UV se desbloqueiam com ATP nas abas Agentes e Arsenal. Arma bloqueada não aparece no level up.
- **Laboratório em árvore:** uma raiz (Interações) e seis caminhos (Força, Química, Corpo, Coleta, Controle, Especial). Cada nó é um atributo de `stats.json` com nível máximo; um nó abre quando os nós pedidos têm pelo menos um nível. Custo do nível n: `baseCost × runCostRate^n` (1,15). Os níveis somam à base do atributo antes da run (`rulesWithProgress`).
- **Estrelas:** sobreviver 5, 10 e 15 minutos acende as estrelas do caso; cada estrela nova põe ATP no baú do Hub, que o jogador abre tocando.
- **Save:** o progresso (`meta`: Laboratório, liberados, estrelas, baú) entra no save, com migração; um save antigo começa com só o que é liberado no início.
- **Simulador:** `npm run sim` joga runs com um robô (`src/core/sim/`), gastando o ATP entre elas, e mostra quando chega o primeiro desbloqueio e se alguma compra custa mais que 3 runs médias.

## Alternativas consideradas

- **Um upgrade por atributo em lista:** mais simples, mas sem escolhas de caminho.
- **Tudo liberado desde o começo:** o ATP só serviria para números maiores, o que a aba Economia desaconselha.

## Consequências

- Atributo novo no Laboratório: um nó em `meta.json`, respeitando o `metaCap`; o teste de sprites confere que ele tem ícone.
- Mudou custo ou queda de ATP: rode `npm run sim` para ver a curva.
- A árvore foi desenhada no código; vale levar uma prancheta dela para o canvas de identidade visual.

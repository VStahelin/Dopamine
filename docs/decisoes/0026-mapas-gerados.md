# 0026. Mapas gerados por semente em blocos, em ambientes do corpo

- **Status:** proposta
- **Data:** 2026-10-22
- **Área:** design

## Contexto

O campo crônico é um chão de areia liso e infinito, igual em toda run. O Vitor pediu padrões de geração de mapa para as runs não serem sempre iguais, com objetos no mapa e texturas de fundo. Detalhes em [mapas.md](../mapas.md).

## Decisão

- Nova fase **5.7, Mapas gerados**, depois da 5.6 e antes do polimento.
- O mundo continua infinito, dividido em blocos de 16×16 tiles (tile de 16 px de arte, 32 unidades do mundo). Cada bloco é gerado pela semente da run e pela posição, com o `Rng` da [decisão 0012](0012-passo-fixo-e-semente.md); o mapa não é guardado, só os destrutíveis quebrados de cada bloco.
- A geração é lógica pura em `src/core/map/` ([0003](0003-camadas-core-game-config.md)); números em `src/config/map.json` ([0004](0004-parametros-centralizados.md)); arte em `src/assets/sprites/map.json` ([0019](0019-sprites-numa-pasta.md)).
- Obstáculos são círculos de colisão a pelo menos 3 tiles um do outro, para nunca fechar um beco e dispensar busca de caminho.
- Cada mapa é de um **ambiente** do corpo (Corrente sanguínea, Fígado, Intestino, Pulmão, Cérebro), com chão, objetos e zona próprios. A Corrente sanguínea é o chão de hoje.

## Alternativas consideradas

- **Mapas fixos desenhados à mão:** mais controle, mas cada run fica igual e cada ambiente custa um mapa inteiro.
- **Mapa inteiro gerado no início da run:** simples, mas limita o tamanho do mundo e gasta memória no celular.
- **Só trocar a cor do chão:** barato, mas não muda o jeito de jogar.

## Consequências

- O roadmap ganha a fase 5.7; o item "chão, paredes e efeitos" da fase 6 passa a ser o acabamento dos ambientes.
- O tile do chão passa de 40 para 32 unidades (`display.json`), em aberto em [mapas.md](../mapas.md#o-que-falta-decidir).
- Agente e moléculas ganham colisão com obstáculos no `core`; o chefe e as formações da fase 5.6 atravessam.
- [arquitetura.md](../arquitetura.md) ganha `src/core/map/` quando a fase for implementada.

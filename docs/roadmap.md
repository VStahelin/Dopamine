# Roadmap

Plano de desenvolvimento do Dopamina Blaster, da primeira linha de código até o link para os amigos. A ordem segue a sugestão do conceito: **provar primeiro que a run é divertida** e só depois montar idle, organismo e economia em volta dela. Cada fase tem um critério de saída; não vale começar a próxima sem cumpri-lo.

Tudo aqui é **proposta**: as fases podem mudar de ordem conforme o jogo for testado. Mudanças de ordem ou de escopo de uma fase viram uma decisão em [decisoes/](decisoes/README.md).

## Como manter este arquivo

- Ao concluir um item, marque o checkbox no mesmo commit que entrega o código.
- Ao começar ou terminar uma fase, atualize a coluna Status abaixo (`não iniciada`, `em andamento`, `concluída`).
- Quando uma pergunta de "Decisões que travam cada fase" for respondida, marque-a e registre a resposta em [decisoes/](decisoes/README.md).

## Visão geral

| Fase | Nome | Pergunta que responde | Depende de | Status |
| --- | --- | --- | --- | --- |
| 0 | Fundação | O projeto roda no PC e no celular? | — | não iniciada |
| 1 | Primeira versão jogável (v0.1) | Dá para abrir, ir do menu à run e voltar, e a batalha é divertida? | 0 | não iniciada |
| 1.5 | Hub do menu principal | O menu já mostra onde cada parte do jogo vai entrar? | 1 | não iniciada (proposta) |
| 2 | Profundidade da run | A run aguenta 20 minutos sem ficar repetitiva? | 1.5 | não iniciada |
| 3 | Meta-progressão e save | Dá vontade de jogar mais uma run? | 2 | não iniciada |
| 4 | Campo longo (idle) | O idle ajuda a run sem substituí-la? | 3 | não iniciada |
| 5 | Organismo | Cuidar do corpo muda o jeito de jogar? | 3, 4 | não iniciada |
| 6 | Arte, polimento e lançamento | Dá para mandar o link para os amigos? | 1 a 5 | não iniciada |

A arte não espera a fase 6: os sprites de molécula são montados por código a partir dos átomos (aba Design), então entram já na fase 1. A fase 6 cuida do resto: HUD final, som, telas e acabamento.

## Fase 0: Fundação

Montar o esqueleto do projeto com a arquitetura da aba Plataforma, antes de qualquer gameplay.

- [ ] Projeto Vite + Phaser 4 + TypeScript, com scripts de `dev`, `build` e `test`.
- [ ] Separação de pastas: `src/core/` (lógica em TypeScript puro, sem Phaser) e `src/game/` (cenas, desenho e entrada).
- [ ] `src/config/params.ts` com as constantes das abas Parâmetros e Economia, num lugar só.
- [ ] Testes automatizados da lógica (Vitest), lint e formatação.
- [ ] Escala inteira de pixel (1×, 2×, 3×) e redimensionamento para qualquer tela.
- [ ] Deploy automático no GitHub Pages a cada push na `main`, para abrir no celular desde o primeiro dia.

**Critério de saída:** uma cena vazia com um quadrado que anda com WASD no PC e com joystick virtual no celular, publicada num link.

## Fase 1: Primeira versão jogável (v0.1)

A primeira versão que parece um jogo: abre num menu, entra numa run jogável e volta ao menu no fim. A run é o menor jogo possível do campo crônico, para testar se a batalha é divertida. Arte simples, mas com os sprites de átomos ([decisão 0008](decisoes/0008-v01-menu-e-run.md)).

**Menu**

- [ ] Tela de título com o logo (DOPAMINA / BLASTER) e o fundo do jogo.
- [ ] Botão Jogar, que leva direto à run.
- [ ] Recordes: melhor tempo, maior nível e mais inimigos decompostos.
- [ ] Opções: volume, tela cheia e mostrar FPS.
- [ ] Save mínimo para guardar recordes e opções entre sessões (começo do save da [decisão 0005](decisoes/0005-save-local-indexeddb.md)).
- [ ] Pausa na run, com Continuar e Voltar ao menu.

**Run**

- [ ] Mapa aberto visto de cima, câmera seguindo o agente.
- [ ] Um agente jogável, só com movimento.
- [ ] Uma arma: Radical Livre (mira automática).
- [ ] Três inimigos simples que perseguem o agente, sem cascata.
- [ ] Vida como interações: cada inimigo que encosta consome interações; quando acabam, a run termina.
- [ ] Gemas de XP, level up com a fórmula da aba Economia e tela com 3 opções (upgrades da única arma e 2 ou 3 passivos).
- [ ] Dificuldade D(t) da aba Economia controlando vida e quantidade de inimigos.
- [ ] Reaproveitamento de objetos (inimigos, disparos e gemas) e limite de gemas na tela.
- [ ] Gerador de sprite de molécula: átomos, ligações e escala, como na aba Design.
- [ ] Tela de fim de run com tempo, nível e inimigos decompostos, avisando se bateu recorde, com Jogar de novo e Menu.

**Critério de saída:** o ciclo menu → run → fim → menu funciona no PC e no celular, e uma run de 10 minutos é jogada até o fim por vontade própria, a 60 FPS num celular intermediário (testar no Safari do iPhone).

## Fase 1.5: Hub do menu principal

Proposta da [decisão 0009](decisoes/0009-menu-hub-fase-1-5.md). Troca o menu mínimo da v0.1 pelo hub descrito em [menu.md](menu.md), com o layout inteiro e placeholders para o que ainda não existe. Base visual: prancheta "Menu principal (protótipo)" no [canvas de identidade visual](https://claude.ai/artifact/MPV17zZywrhhXBUdfnUs6F).

- [ ] Barra de status com retrato do organismo, indivíduo, mini barras de saúde e ATP (valores de exemplo).
- [ ] Faixa de objetivo com botão Opções e botão Recordes.
- [ ] Palco com o caso atual, melhor tempo e 3 estrelas de meta de tempo.
- [ ] Linha de ação com Campo longo, JOGAR e Agente (os laterais com "EM BREVE").
- [ ] Barra de 5 abas, com a do meio destacada, e telas de placeholder "EM BREVE · FASE N".
- [ ] Regras de selo de [menu.md](menu.md#selos-e-avisos) e navegação por teclado (Enter, 1 a 5, Esc).
- [ ] Layout em 390×844, em celular baixo (375×667) e em tela larga com coluna central.

**Critério de saída:** abrindo no celular, dá para tocar em cada aba e em cada botão do hub e entender o que vai existir ali, e JOGAR continua levando à run em um toque.

## Fase 2: Profundidade da run

Transformar o protótipo numa run com escolhas de verdade.

- [ ] As 7 armas iniciais da aba Armas, com níveis.
- [ ] Itens passivos (reagentes) e as evoluções de arma.
- [ ] Especial ativado pelo jogador, com recarga e botão no celular.
- [ ] Decomposição em cascata: moléculas fortes se quebram em mais fracas.
- [ ] Efetividade por tipo entre agente e molécula (matriz da aba Personagens).
- [ ] Dente de serra: onda de pico a cada 5 minutos, respiro em seguida e um chefe.
- [ ] 2 ou 3 agentes jogáveis, cada um com arma inicial e especial próprios, incluindo a Dopamina.
- [ ] Tela de escolha de agente antes da run.

**Critério de saída:** duas runs com agentes ou armas diferentes que pedem estratégias diferentes, e uma run boa que passa dos 20 minutos.

## Fase 3: Meta-progressão e save

Fazer cada run deixar algo para a próxima.

- [ ] Moeda (ATP) ganha na run.
- [ ] Menu principal entre runs.
- [ ] Árvore de upgrades da run, com custo exponencial e teto de poder permanente.
- [ ] Desbloqueio de agentes e armas com ATP.
- [ ] Save no IndexedDB, com backup exportável por arquivo ou código.
- [ ] Simulador sem tela que roda milhares de runs com o código de `src/core/` e gera as curvas de progressão.

**Critério de saída:** o primeiro desbloqueio chega em 2 ou 3 runs, e o simulador não mostra nenhuma parede de grind (upgrade custando mais que 3 runs médias).

## Fase 4: Campo longo (idle)

O lado que farma sozinho.

- [ ] Campo vertical: inimigos descem e agentes fixos na base atacam.
- [ ] Agentes próprios do idle e árvore de upgrades com custo mais suave.
- [ ] Produção de ATP por hora.
- [ ] Progresso offline, com teto inicial de 8 horas e tela de "enquanto você estava fora".
- [ ] Idle rodando ao mesmo tempo que a run, onde ele aparecer na tela.

**Critério de saída:** abrir o jogo depois de uma noite rende o suficiente para um upgrade, sem tornar a run desnecessária.

## Fase 5: Organismo

A camada que amarra tudo: a saúde do corpo.

- [ ] Os quatro setores de saúde (física, mental, social e executiva), de 0 a 100, com retorno decrescente.
- [ ] Efeito de cada setor no jogo (vida inicial, recarga do especial, opções de level up, produção do idle).
- [ ] Agentes da run e do idle mexendo nos setores, com efeito colateral.
- [ ] Multiplicador de saúde na produção do idle.
- [ ] Setores baixos decidindo quais moléculas aparecem mais.
- [ ] Reset para o próximo indivíduo, com pontos herdados e dificuldade 1,25^k.

**Critério de saída:** dois indivíduos com "doenças" diferentes fazem você escolher agentes diferentes, e o segundo indivíduo chega no ponto do primeiro de 2 a 5 vezes mais rápido.

## Fase 6: Arte, polimento e lançamento

Deixar o jogo com a cara do canvas de identidade visual e pronto para outras pessoas.

- [ ] HUD, molduras, botões e fontes da aba Design.
- [ ] Chão, paredes e efeitos (dano com contorno, projéteis).
- [ ] Som e música.
- [ ] PWA: instalação na tela inicial e funcionamento offline.
- [ ] Layout em telas largas e altas (painéis laterais, mais pista).
- [ ] Rodada de testes com 2 ou 3 amigos e ajuste dos números.
- [ ] Publicação final (GitHub Pages, Cloudflare Pages ou itch.io).

**Critério de saída:** um amigo instala pelo link, joga sem explicação e volta no dia seguinte.

## Primeiros passos

O que dá para começar já, em ordem:

1. Criar o projeto Vite + Phaser 4 + TypeScript e a estrutura `src/core/`, `src/game/`, `src/config/`.
2. Configurar testes, lint e o deploy no GitHub Pages.
3. Fazer o agente andar com teclado e joystick virtual, e abrir no celular.
4. Escrever o gerador de sprite de molécula e desenhar o primeiro inimigo.
5. Implementar spawn, perseguição e interações.
6. Implementar o Radical Livre, gemas de XP e o level up.

## Decisões que travam cada fase

Perguntas em aberto das outras abas que precisam de resposta antes da fase indicada.

- [ ] **Fase 0:** tamanho base do pixel (grade de 16 ou de 32 px)?
- [ ] **Fase 0:** orientação no celular para a run (vertical, horizontal ou as duas)?
- [ ] **Fase 1:** quantas interações o agente tem no início, e existe forma de recuperar na run?
- [ ] **Fase 1:** qual agente e quais três inimigos entram no protótipo?
- [ ] **Fase 2:** a arma é do agente ou do jogador? Quantas armas e qual nível máximo por run?
- [ ] **Fase 2:** quais moléculas fortes geram quais fragmentos na cascata?
- [ ] **Fase 2:** um agente por run, ou dá para trocar durante a run?
- [ ] **Fase 3:** o save precisa sincronizar entre aparelhos, ou cada um com o seu basta no começo?
- [ ] **Fase 4:** o idle aparece na mesma tela da run ou numa tela própria? O jogador posiciona os agentes da base?
- [ ] **Fase 5:** os efeitos de cada setor, o efeito colateral e o que acontece quando um setor chega a zero.
- [ ] **Fase 5:** que vantagem passa para o próximo indivíduo no reset?

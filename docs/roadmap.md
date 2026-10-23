# Roadmap

Plano de desenvolvimento do Farmaco Battle, da primeira linha de código até o link para os amigos. A ordem segue a sugestão do conceito: **provar primeiro que a run é divertida** e só depois montar idle, organismo e economia em volta dela. Cada fase tem um critério de saída; não vale começar a próxima sem cumpri-lo.

Tudo aqui é **proposta**: as fases podem mudar de ordem conforme o jogo for testado. Mudanças de ordem ou de escopo de uma fase viram uma decisão em [decisoes/](decisoes/README.md).

## Como manter este arquivo

- Ao concluir um item, marque o checkbox no mesmo commit que entrega o código.
- Ao começar ou terminar uma fase, atualize a coluna Status abaixo (`não iniciada`, `em andamento`, `concluída`).
- Quando uma pergunta de "Decisões que travam cada fase" for respondida, marque-a e anote a resposta no doc da aba. Só vira arquivo em [decisoes/](decisoes/README.md) se passar no teste do [AGENTS.md](../AGENTS.md#registrar-decisões-obrigatório).

## Visão geral

| Fase | Nome | Pergunta que responde | Depende de | Status |
| --- | --- | --- | --- | --- |
| 0 | Fundação | O projeto roda no PC e no celular? | — | concluída |
| 1 | Primeira versão jogável (v0.1) | Dá para abrir, ir do menu à run e voltar, e a batalha é divertida? | 0 | concluída |
| 1.5 | Menu principal (esqueleto) | Todas as áreas do jogo já têm um lugar no menu? | 1 | concluída |
| 2 | Profundidade da run | A run aguenta 20 minutos sem ficar repetitiva? | 1 | em andamento |
| 2.5 | Jogo offline e atualizações controladas | O jogo roda sem internet e só muda de versão quando o jogador aceita? | 2 | concluída |
| 2.6 | Sprites e ícones da identidade visual | Todo sprite está numa pasta e cada arma, modificador e especial aparece com o ícone do canvas? | 2 | implementada, falta validar no celular |
| 2.7 | Campo crônico com a cara do canvas | A run, do chão aos efeitos, parece com as pranchetas do modo crônico? | 2.6 | implementada, falta validar no celular |
| 3 | Meta-progressão e save | Dá vontade de jogar mais uma run? | 2, 2.5, 2.6, 2.7 | implementada, falta validar no celular |
| 4 | Campo longo (idle) | O idle ajuda a run sem substituí-la? | 3 | implementada, falta validar no celular |
| 5 | Organismo | Cuidar do corpo muda o jeito de jogar? | 3, 4 | implementada, falta validar no celular |
| 5.5 | Itens no mapa | Os itens do chão deixam a run mais variada sem quebrar a economia? | 2, 3 | implementada, falta validar no celular |
| 5.6 | Variedade da run | A run muda de cara a cada pico, e cada agente cresce do seu jeito? | 5, 5.8 | implementada, falta validar no celular |
| 5.7 | Mapas gerados | Cada run tem um mapa diferente, sem deixar o agente preso? | 2, 5.5 | implementada, falta validar no celular |
| 5.8 | Receptores no level up | O level up fica mais curto e cada escolha pesa mais? | 2, 3 | implementada, falta validar no celular |
| 5.9 | Suplementos e ampolas | Os suplementos dão motivo para andar pelo mapa e montam um build diferente a cada run? | 5.5, 5.8 | implementada, falta validar no celular |
| 5.10 | Agregados (mini chefes) | Entre um chefe e outro sempre tem um alvo que vale o risco? | 5.9 | implementada, falta validar no celular |
| 5.11 | Sinapses e estruturas | O jogador sai do lugar para buscar bônus no mapa? | 5.6, 5.9, 5.10 | implementada, falta validar no celular |
| 5.12 | Locais do corpo e sinergias | Escolher onde agir muda a run e cura o organismo mais rápido? | 5, 5.7 | não iniciada |
| 6 | Arte, polimento e lançamento | Dá para mandar o link para os amigos? | 1 a 5.12 | não iniciada |
| 7 | Lojas e plataformas | O mesmo jogo roda e é publicado em Android, iOS, Steam e Microsoft Store? | 6 | não iniciada |

## Bugs relatados

Bugs que o Vitor achou jogando. Marque ao corrigir, com o commit da correção.

- [x] PC: interface enorme na run (HUD ocupa um terço da tela), nas Opções (os botões não cabem) e no campo longo. Corrigido: as telas de interface usam a regra de tela grande da run (`uiMinShortSidePxLarge`).
- [ ] PC: falta uma UI própria de tela larga, desenhada no canvas (HUD da run, campo longo e menus), em vez de esticar a do celular.
- [x] PC: campo longo deitado espreme o campo numa faixa fina entre a HUD e o pool. Corrigido: o campo estica entre as paredes com proporção limitada.
- [x] Celular: campo longo longe da prancheta "Tela de batalha (mockup)": paredes largas demais, campo estreito, pool com espaços pequenos.
- [x] Celular: o dedo que movia o agente escolhia uma carta do level up ao soltar. Corrigido: a carta só responde a um toque que começou nela.
- [x] Balanceamento: a run estava fácil demais. Agora nascem mais moléculas (2,6 por segundo, até 400 na tela), 25% mais lentas, e a vida cresce numa curva própria (hpLinear e hpQuadratic em economy.json). No simulador, sem Laboratório, o robô morre entre 7 e 15 minutos em boa parte das runs. Falta conferir no celular a 60 FPS com 400 moléculas.
- [x] Hitboxes desafinados dos sprites: os raios de enemies.json eram cerca de metade do desenho, e o do agente era 7 para um sprite de uns 40. Agora o raio de cada molécula é o "corpo" do sprite (a distância média dos átomos mais o átomo) e o do agente é 13. Modo debug nas Opções para conferir.
- [x] Run fácil demais (de novo): com os hitboxes certos e 3 moléculas por segundo, o robô sem Laboratório morre em média aos 8 minutos.
- [x] Pausa: o botão Opções não fazia nada. A tela abria escondida atrás da run e da HUD; agora vem para cima.

**Ordem sugerida das fases 5.x:** 5.5 → 5.8 → 5.9 → 5.10 → 5.6 → 5.11 → 5.7. As fases 5.8 a 5.11 trazem as mecânicas do Megabonk ([megabonk.md](megabonk.md)) e mexem no level up e nos drops. A 5.6 vem depois dos receptores (5.8, de onde saem o receptor nativo e os cartões da Superdosagem) e antes das sinapses (5.11, cujo Foco inflamatório usa o Cerco inflamatório), e a 5.7 vem por último porque os mapas passam a hospedar as estruturas como pontos de interesse. Os números das fases não mudam para não quebrar as decisões que citam cada uma.

A arte não espera a fase 6: os sprites de molécula são montados por código a partir dos átomos (aba Design), então entram já na fase 1. A fase 6 cuida do resto: HUD final, som, telas e acabamento.

## Fase 0: Fundação

Montar o esqueleto do projeto com a arquitetura da aba Plataforma, antes de qualquer gameplay.

- [x] Projeto Vite + Phaser 4 + TypeScript, com scripts de `dev`, `build` e `test`.
- [x] Separação de pastas: `src/core/` (lógica em TypeScript puro, sem Phaser) e `src/game/` (cenas, desenho e entrada).
- [x] `src/config/params.ts` com as constantes das abas Parâmetros e Economia, num lugar só.
- [x] Testes automatizados da lógica (Vitest), lint e formatação.
- [x] Escala inteira de pixel (1×, 2×, 3×) e redimensionamento para qualquer tela.
- [x] Rodar localmente no PC e abrir no celular pela rede local (`npm run dev`), desde o primeiro dia ([0011](decisoes/0011-rodar-localmente.md)).

**Critério de saída:** uma cena vazia com um quadrado que anda com WASD no PC e com joystick virtual no celular, rodando localmente.

## Fase 1: Primeira versão jogável (v0.1)

A primeira versão que parece um jogo: abre num menu, entra numa run jogável e volta ao menu no fim. A run é o menor jogo possível do campo crônico, para testar se a batalha é divertida. Arte simples, mas com os sprites de átomos ([decisão 0008](decisoes/0008-v01-menu-e-run.md)).

**Menu**

- [x] Tela de título com o logo (FARMACO / BATTLE) e o fundo do jogo.
- [x] Botão Jogar, que leva direto à run.
- [x] Recordes: melhor tempo, maior nível e mais inimigos decompostos.
- [x] Opções: tela cheia e mostrar FPS. O volume de Música entrou na fase 6; o de Efeitos entra com os efeitos.
- [x] Save mínimo para guardar recordes e opções entre sessões (começo do save da [decisão 0005](decisoes/0005-save-local-indexeddb.md)).
- [x] Pausa na run, com Continuar e Voltar ao menu.

**Run**

- [x] Mapa aberto visto de cima, câmera seguindo o agente.
- [x] Um agente jogável, só com movimento: a Dopamina.
- [x] Uma arma: Radical Livre (mira automática).
- [x] Três inimigos simples que perseguem o agente, sem cascata: glicose, ácido graxo e triglicerídeo.
- [x] Vida como interações: cada inimigo que encosta consome interações; quando acabam, a run termina.
- [x] Gemas de XP, level up com a fórmula da aba Economia e tela com 3 opções (upgrades da única arma e 2 ou 3 passivos).
- [x] Dificuldade D(t) da aba Economia controlando vida e quantidade de inimigos.
- [x] Reaproveitamento de objetos (inimigos, disparos e gemas) e limite de gemas na tela.
- [x] Gerador de sprite de molécula: átomos, ligações e escala, como na aba Design.
- [x] Tela de fim de run com tempo, nível e inimigos decompostos, avisando se bateu recorde, com Jogar de novo e Menu.

- [x] Todos os modificadores da aba Parâmetros que já têm mecânica, com raridades movidas pela Sorte, Rerrolar, Pular e Banir ([decisão 0013](decisoes/0013-raridade-e-sorte.md)).
- [x] Jogar e ajustar os números até a run ficar divertida (os valores estão nos JSON de `src/config/`). O Vitor aprovou a diversão; o ajuste fino continua nas próximas fases.

**Critério de saída:** o ciclo menu → run → fim → menu funciona no PC e no celular, e uma run de 10 minutos é jogada até o fim por vontade própria, a 60 FPS num celular intermediário (testar no Safari do iPhone).

## Fase 1.5: Menu principal (esqueleto)

Montar o menu principal inteiro, definido em [menu.md](menu.md), antes de aprofundar a run. O modelo é o hub de jogos mobile de campanha: JOGAR dominante no centro, moeda no topo, seções numa barra de abas e secundárias em trilhos laterais. O que ainda não existe entra como placeholder: o lugar já está no menu, explica o que vai ter ali e em que fase chega. Assim cada fase seguinte só preenche a sua parte.

- [x] Tela de título (o menu atual) levando ao hub.
- [x] Barra de status: indivíduo, 4 setores de saúde e ATP (valores de exemplo até as fases 3 e 5).
- [x] Faixa de objetivo (próximo desbloqueio ou próxima estrela).
- [x] Palco com o caso atual: ilustração do organismo, melhor tempo e 3 estrelas de meta de tempo.
- [x] Linha de ação: JOGAR (campo crônico), Campo longo (placeholder) e Agente (abre a escolha do agente).
- [x] Barra de abas: Agentes, Arsenal, Caso (o hub), Laboratório e Organismo, com placeholders no formato comum.
- [x] Trilhos: Opções à esquerda; Recordes, Compêndio e Conquistas à direita.
- [x] Escolha do agente com a Dopamina liberada e os outros agentes bloqueados.
- [x] Navegação: abas trocam direto, telas abertas por elas têm Voltar (botão e Esc); fim da run e pausa voltam ao hub.
- [x] Layout do hub em tela larga (PC, celular deitado).

**Critério de saída:** dá para visitar todas as seções do menu no PC e no celular, e cada uma deixa claro o que vai ter ali.

## Fase 2: Profundidade da run

Transformar o protótipo numa run com escolhas de verdade.

- [x] As 7 armas iniciais da aba Armas, com níveis.
- [x] Itens passivos (reagentes) e as evoluções de arma.
- [x] Especial ativado pelo jogador, com recarga e botão no celular.
- [x] Decomposição em cascata: moléculas fortes se quebram em mais fracas.
- [x] Efetividade por tipo entre agente e molécula (matriz da aba Personagens).
- [x] Dente de serra: onda de pico a cada 5 minutos, respiro em seguida e um chefe (Partícula de LDL, [decisão 0015](decisoes/0015-acao-do-agente-e-armas.md)).
- [x] 2 ou 3 agentes jogáveis, cada um com arma inicial e especial próprios, incluindo a Dopamina.
- [x] Preencher a escolha do agente e o placeholder de Agentes com os agentes novos ([menu.md](menu.md)).
- [x] Começar o Compêndio com as moléculas vistas (os modificadores entram depois).
- [ ] Jogar com os três agentes e ajustar os números (ritmo de armas, vida do chefe, Lipase contra açúcares).

**Critério de saída:** duas runs com agentes ou armas diferentes que pedem estratégias diferentes, e uma run boa que passa dos 20 minutos.

## Fase 2.5: Jogo offline e atualizações controladas

O jogo inteiro passa a ficar no aparelho e só troca de versão por build completa, quando o jogador aceitar, com o aviso só nos menus. Arquitetura em [atualizacoes.md](atualizacoes.md) ([decisão 0016](decisoes/0016-offline-e-atualizacoes.md)).

- [x] Fontes locais (`@fontsource`), sem depender do Google Fonts.
- [x] Service worker com precache da build inteira (`vite-plugin-pwa`, modo `prompt`) e manifest do PWA.
- [x] `version.json` na build, com versão, `buildId` e lista de arquivos.
- [x] Gestor de atualização (`src/game/update/`): verifica ao entrar no hub, a cada 15 minutos nos menus e pelo botão; acompanha o download; nunca recarrega sozinho.
- [x] Aviso "Nova versão pronta" no hub, com ATUALIZAR (grava o save e recarrega) e DEPOIS; descoberto na run, espera a volta ao hub.
- [x] Opções: versão, `buildId` e o botão VERIFICAR ATUALIZAÇÃO com os estados.
- [x] `npm run release`: check completo, build e publicação atômica em `releases/<buildId>` com `current` apontando para a última; mantém as 3 anteriores.
- [x] `npm run serve`: serve a build publicada em HTTPS local, para testar o ciclo de atualização no PC (no celular, pelo GitHub Pages).
- [x] Pedir armazenamento persistente (`navigator.storage.persist()`).
- [x] Testes: o gestor de atualização (estados e quando avisar) no `core` ou em lógica pura testável; teste no navegador offline.
- [x] Gerar versão por tag (`npm version`) e deploy no GitHub Pages só nas tags ([decisões 0017](decisoes/0017-deploy-por-versao.md) e [0018](decisoes/0018-jogo-no-pages-servidor-futuro.md)).

**Critério de saída:** com a internet desligada, o jogo abre e roda; publicar uma build nova durante uma run não muda nada até a volta ao hub, onde aparece o aviso; aceitar leva à versão nova com o save intacto; uma publicação interrompida no meio nunca chega ao aparelho.

## Fase 2.6: Sprites e ícones da identidade visual

Juntar toda a pixel art numa pasta de dados e aplicar os ícones que o Vitor desenhou no [canvas de identidade visual](https://claude.ai/artifact/MPV17zZywrhhXBUdfnUs6F) (pranchetas "Ícones de armas e habilidades" e "Crônico: ícones, dano e paisagem"). A HUD e a pausa seguem [ui-cronico.md](ui-cronico.md) ([decisão 0019](decisoes/0019-sprites-numa-pasta.md)).

**Pasta de sprites**

- [x] `src/assets/sprites/` com a paleta, os ícones e as moléculas como dados; um gerador único de texturas (`textures.ts`, que pinta com `spriteArt.ts`) no lugar de `molecules.ts` e dos padrões de `icons.ts`.
- [x] Importar os 52 ícones de 16×16 do canvas: 7 armas do pool, 3 ações de agente, 4 evoluções, 4 reagentes, 3 especiais e 31 modificadores.
- [x] Índice ligando cada id da configuração (arma, modificador, especial, molécula) ao sprite, com ícone padrão quando faltar e um teste que confere que todos têm ícone.

**Onde os ícones aparecem**

- [x] Molduras dos ícones da prancheta "Crônico: ícones, dano e paisagem": arma, arma pronta para evoluir (MAX), arma evoluída (EVO), reagente/passivo, efeito temporário, efeito negativo, espaço livre e espaço bloqueado.
- [x] Cartões do level up com o ícone da arma ou do modificador, na moldura do tipo.
- [x] HUD da run como em [ui-cronico.md](ui-cronico.md): banda fixa (126 px em pé, 74 px deitado), duas linhas de ícones (armas em cima, passivos embaixo), tempo e onda no centro, ATP e decompostas à direita, barra do chefe abaixo da banda, interações em barra embaixo do agente e botão do especial de 76 px com o ícone do especial e a recarga.
- [x] Números na tela com as cores do guia: dano, crítico (catálise), afinidade forte e fraca, interações perdidas, recuperação e imune.
- [x] Pausa com status: cabeçalho, faixa de interações, abas Arsenal, Atributos e Run, e os botões Continuar, Opções e Desistir.
- [x] Menu: abas Agentes e Arsenal com os ícones das armas, das ações e dos especiais; os modificadores aparecem com ícone no fim do Arsenal (todos, já que ainda não guardamos quais o jogador viu). As listas longas do menu rolam.
- [x] PNGs dos sprites em `public/sprites/`, em pastas por tamanho, gerados por `npm run sprites:build` a partir dos dados ([decisão 0020](decisoes/0020-sprites-em-png-por-tamanho.md)).
- [ ] Validar no celular, em pé e deitado.

**Critério de saída:** nenhuma pixel art fica fora de `src/assets/sprites/`; toda arma, modificador, reagente, evolução e especial aparece com o seu ícone do canvas no level up, na HUD, na pausa e no menu, no celular em pé e deitado.

## Fase 2.7: Campo crônico com a cara do canvas

A fase 2.6 trouxe os ícones, a HUD e a pausa das pranchetas "Crônico". Esta fase leva o resto do [canvas de identidade visual](https://claude.ai/artifact/MPV17zZywrhhXBUdfnUs6F) para o que já existe no jogo, comparando item por item com as pranchetas "Crônico: HUD de batalha", "Crônico: pausa e status", "Crônico: ícones, dano e paisagem" e "Sprites de moléculas". Tudo continua como dados em `src/assets/sprites/` ([decisão 0019](decisoes/0019-sprites-numa-pasta.md)).

**Campo**

- [x] Moléculas no estilo da prancheta "Sprites de moléculas": átomo octogonal ("pixel redondo"), com borda escura e brilho próprios de cada elemento (C, H, O, N, S e Cl) e ligações grossas. Vale para agentes, inimigos, chefe e projéteis.
- [x] Chão de areia com o rejunte da prancheta: linhas de 3 px a cada 40 px.
- [x] Gema de XP em losango ciano com borda, elétrons brancos com borda azul e disparos ciano, como na prancheta.
- [x] Efeitos das armas pixelados e nas cores da paleta: poça octogonal com borda, feixe com bordas e miolo branco, aura, pulso, cone e golpe.
- [x] Decomposição em cascata: estalo branco na molécula e fragmentos saltando para fora.
- [x] Joystick octogonal com o miolo quadrado da prancheta.
- [x] Interações embaixo do agente no tamanho da prancheta (56 px, segmentos de 5 px).
- [x] Números de dano nos tamanhos da prancheta de batalha, e um interruptor nas Opções para escondê-los.

**ATP na run**

- [x] Cada molécula decomposta pode soltar ATP no chão (moeda dourada), que vale mais com o tempo de run ([economia.md](economia.md)); o agente coleta com o mesmo raio das gemas. Os números ficam em `economy.json`.
- [x] ATP na HUD (número antes da moeda, acima das decompostas), na faixa de status e na aba Run da pausa, e no fim de run.
- [x] O ATP ganho vai para o save e aparece no menu. Gastar ATP continua na fase 3.

**HUD**

- [x] Botão do especial com o nome curto do especial embaixo e as cargas (`x1`) no canto; as cargas vêm do atributo Cargas de `stats.json`.
- [x] Celular deitado: banda baixa, com armas e reagentes numa linha só ao lado do tempo, ATP e decompostas à direita e a pausa dentro da banda.

**Pausa**

- [x] Abas de 44 px, ATP na faixa de status, aba Run com "ATP NA RUN", espaço bloqueado dizendo que libera no Laboratório e atributos de level up e risco num grupo só, como na prancheta.

**Telas**

- [x] Fim de run com o ícone de cada arma, o dano que ela causou e o ATP ganho.
- [x] Recordes com os ícones da identidade visual e o ATP guardado. O Compêndio e o Título já usavam as molduras e as moléculas do canvas.
- [x] Level up como nas pranchetas "Level up" e "Level up no PC" ([ui-cronico.md](ui-cronico.md#level-up)): prévia do atributo em cada cartão, Rerrolar, Pular e Banir sempre visíveis (apagados sem usos), modo banir, teclas S e B, e no PC os atributos e o arsenal nas laterais.
- [ ] Validar no celular, em pé e deitado, junto com a fase 2.6.

Fica para quando a mecânica existir: efeitos temporários de inimigos e itens (Lentidão, Adrenalina da prancheta) e a evolução de arma pelo baú do chefe (a prancheta diz que a arma em MAX evolui no próximo baú; hoje a evolução é uma opção do level up). Os efeitos dos itens e a evolução pela cápsula do chefe entram na [fase 5.5](#fase-55-itens-no-mapa).

**Critério de saída:** um print da run no celular, em pé e deitado, fica igual às pranchetas do modo crônico do canvas: chão, moléculas, efeitos, HUD, joystick e pausa.

## Fase 3: Meta-progressão e save

Fazer cada run deixar algo para a próxima.

Decisões: [0021](decisoes/0021-meta-progressao.md). Tudo em `src/config/meta.json`.

- [x] Moeda (ATP) ganha na run (fase 2.7) e guardada no save.
- [x] Laboratório em árvore: raiz e seis caminhos (Força, Química, Corpo, Coleta, Controle, Especial), com painel do nó, custo exponencial (×1,15 por nível) e teto de poder permanente conferido ao carregar.
- [x] Desbloqueio de agentes (Lipase, Insulina) e armas (Poça, Reação em Cadeia, Raio UV) com ATP; começa com a Dopamina e 4 armas; arma bloqueada não aparece no level up.
- [x] Estrelas do caso (5, 10 e 15 min) enchem o baú do Hub com ATP; selos "!" nas abas quando dá para comprar algo.
- [x] Save no IndexedDB com o progresso da meta, e backup nas Opções: exportar copia um código e baixa um arquivo, importar aceita os dois.
- [x] Simulador sem tela (`npm run sim`): um robô joga runs seguidas com o código de `src/core/`, compra entre elas e mostra a curva. No perfil casual (runs de até 6 min), o primeiro desbloqueio chega na run 2 e nenhuma compra passa de 3 runs médias.
- [ ] Validar no celular e jogar algumas runs para ajustar custos e a queda de ATP.

**Critério de saída:** o primeiro desbloqueio chega em 2 ou 3 runs, e o simulador não mostra nenhuma parede de grind (upgrade custando mais que 3 runs médias).

## Fase 4: Campo longo (idle)

O lado que farma sozinho.

Decisão: [0022](decisoes/0022-campo-longo.md). Layout da prancheta "Tela de batalha (mockup)" do canvas; números em `src/config/idle.json`.

- [x] Campo vertical: moléculas descem até a BASE (10 interações) e os agentes do pool, embaixo, disparam nelas. Ondas sobem de dificuldade; se a BASE zera, o campo volta 3 ondas.
- [x] Agentes próprios do idle: Ômega-3 (começa liberado), Melatonina, Magnésio, Vitamina D e Endorfina, desbloqueados com ATP, com nível por agente. Melhorias do campo (Ritmo de disparo, Espaços na base, Teto offline) com custo mais suave (×1,08).
- [x] ATP das moléculas decompostas, a coletar; a tela do campo coleta sozinha e o botão do Hub mostra o valor.
- [x] Progresso offline com teto inicial de 8 horas e o painel "Enquanto você estava fora" no Hub.
- [x] Idle rodando o tempo todo (Hub, run e a própria tela), também em segundo plano; botão x2 na tela do campo. O painel ao lado da run em tela larga fica para a fase 6.
- [ ] Validar no celular e ajustar o ritmo das ondas e o ATP.

**Critério de saída:** abrir o jogo depois de uma noite rende o suficiente para um upgrade, sem tornar a run desnecessária.

## Fase 5: Organismo

A camada que amarra tudo: a saúde do corpo.

Decisão: [0023](decisoes/0023-organismo.md). Números em `src/config/organism.json`.

- [x] Os quatro setores de saúde (física, mental, social e executiva), de 0 a 100, com retorno decrescente.
- [x] Efeito de cada setor no jogo: Física = interações; Mental = recarga do especial; Executiva = rerrolar e opções no level up; Social = ATP do campo longo.
- [x] Agentes da run (no fim, pelos minutos) e do idle (por hora, também offline) mexendo nos setores, com efeito colateral.
- [x] Multiplicador de saúde na produção do idle.
- [x] Setores baixos decidindo quais moléculas aparecem mais, com três famílias novas: estresse (Adrenalina, Cortisol), radicais (Radical hidroxila, Peroxinitrito) e toxinas (Etanol, Acetaldeído).
- [x] ALTA para o próximo indivíduo: abre com os quatro setores acima de 70; nova doença, dificuldade 1,25^(k − 1) e pontos herdados (+10% de ATP cada); zera Laboratório, campo longo e ATP, mantém desbloqueios.
- [x] Hub com o indivíduo, a doença e os setores reais; aba Organismo com setores, efeitos, quem ajuda cada setor e a ALTA; fim de run com a saúde que mudou.
- [ ] Validar no celular e medir se o segundo indivíduo chega no ponto do primeiro de 2 a 5 vezes mais rápido.

**Critério de saída:** dois indivíduos com "doenças" diferentes fazem você escolher agentes diferentes, e o segundo indivíduo chega no ponto do primeiro de 2 a 5 vezes mais rápido.

## Fase 5.5: Itens no mapa

Os itens que caem no chão da run, com o mesmo conjunto do Vampire Survivors adaptado à química: vesículas que soltam itens, gemas de XP em três cores e a cápsula do chefe. Regras em [itens.md](itens.md) ([decisão 0024](decisoes/0024-itens-no-mapa.md)); números em `src/config/drops.json`.

- [x] Vesículas: nascem em volta do agente, rompem com um golpe e sorteiam um item por peso, com nível mínimo e Sorte.
- [x] Itens de ATP: Glicose e Glicogênio, além da moeda que já existe.
- [x] Soro (recupera interações) e Vitamina (+10% de Sorte, acumula).
- [x] Itens de tela: Lisossomo, Gelo seco, Osmose, Bico de Bunsen e Glucagon (Febre de ATP), com os efeitos com tempo na fila de efeitos da HUD.
- [x] Gemas de XP em ciano, verde e vermelha pelo valor, juntando o excesso numa gema só.
- [x] Cápsula do chefe: bronze e prata, 1, 3 ou 5 upgrades com raridade (a Sorte mexe na quantidade e na raridade, regra da [decisão 0013](decisoes/0013-raridade-e-sorte.md)), ATP, sorte de principiante e a evolução de arma pela cápsula de prata.
- [x] Fosfocreatina quando a cápsula ou o level up não têm mais o que subir.
- [x] Ícones de 16×16 de cada item e da vesícula em `src/assets/sprites/`, e a seção "Itens" no Compêndio.
- [x] Rodar o `npm run sim` com os drops e ajustar os valores de ATP. Com a cápsula pela metade da proposta (5 a 10, 15 a 30 e 25 a 50 moedas), os drops somam cerca de 16% de ATP por run (média de três sementes).

**Critério de saída:** numa run de 15 minutos aparecem itens de quase todos os tipos, pelo menos um muda o rumo da run (um Lisossomo num pico, um Gelo seco no chefe), e o simulador não mostra a economia acelerando mais que 20%.

## Fase 5.6: Variedade da run

A fase reformulada pela [decisão 0030](decisoes/0030-variedade-da-run-reformulada.md). As três ideias do Vampire Survivors da [decisão 0025](decisoes/0025-variedade-da-run.md) (formações, perfil do personagem e Limit Break) são refeitas em cima do que veio do Megabonk (receptores, suplementos, sinapses) e do tema do jogo: **o organismo**. A pergunta continua a mesma: a run muda de cara a cada pico, e cada agente cresce do seu jeito? A cápsula do chefe e as vesículas ficam na fase 5.5.

**A run muda de cara: crises pela doença do indivíduo**

- [x] Formações programadas em `run.json`, cada uma ligada a uma família de molécula: **Pico glicêmico** (açúcares: enxame rápido que atravessa a tela), **Cerco inflamatório** (inflamação: anel de citocinas que fecha; o Foco inflamatório da fase 5.11 usa este), **Parede lipídica** (lipídios: fileira lenta que varre o mapa), **Surto de cortisol** (estresse: um cortisol no meio de um grupo acelerado), **Surto oxidativo** (radicais: raios diagonais e erráticos) e **Maré tóxica** (toxinas: fileira larga e lenta que deixa poças).
- [x] A doença escolhe a formação: o peso de cada uma é o peso da família dela no organismo (`familyWeights`), então Física baixa traz Picos glicêmicos e Paredes lipídicas, Mental baixa traz Surtos de cortisol, e assim por diante. Outro indivíduo, outras formações.
- [x] Agenda: uma formação a cada 90 s, e a cada pico do dente de serra (5 minutos) vem uma **crise**: a formação mais puxada pela doença vem dupla, com o nome no banner (Crise glicêmica, inflamatória, oxidativa...) e o mapa levemente tingido.
- [x] Aviso de 3 s antes, com seta piscando do lado de onde vem e o nome no topo; a formação nunca nasce dentro da tela. (Atravessar obstáculos fica para a fase 5.7, quando eles existirem.) A Maré tóxica ainda não deixa poças. Como a família inflamação não tem moléculas, o Cerco inflamatório é feito das comuns mais puxadas pela doença.
- [x] Os números das formações e da agenda em `run.json`; as formações entram no Compêndio e na [wiki.md](wiki.md). As moléculas de formação soltam gema com 40% da chance normal: no simulador, o XP de graça deixava a run fácil.

**Cada agente cresce do seu jeito: receptor nativo**

- [x] Cada agente nasce com um **receptor nativo**, num espaço extra que não se troca nem se tira, que sobe 1 nível a cada 10 níveis de run, até o nível 5 no nível 50. Soma com o receptor de mesmo atributo, se o jogador também o escolher no level up. Valores em `agents.json`.
- [x] Primeiro chute: Dopamina, **Receptor D2** (−8% de recarga por nível); Lipase, **Sítio ativo** (+10% de Reatividade contra lipídios por nível); Insulina, **Receptor de insulina** (+25% de Raio de coleta por nível).
- [x] Borda dourada na HUD (na frente da linha dos receptores) e o perfil na ficha do agente.
- [ ] Pausa e aba Atributos mostrando "perfil" como origem do bônus (junto com o "de onde vem" da fase 5.9).

**Excesso: Superdosagem de atributos**

- [x] Com as armas e os receptores no máximo, o level up oferece **Superdosagem**: três cartões pequenos de bônus de atributo Comum (os mesmos cartões do level up e da sinapse), sorteados entre os atributos abaixo do teto na run, mais a "Nova dose". Sem teto de quantidade; o banner avisa que a run entrou na fase de excesso.

**Para fechar**

- [ ] Jogar runs de 20 minutos com os três agentes e com uma doença de cada setor, e ajustar a frequência das formações e das crises.
- [x] Atualizar [wiki.md](wiki.md), [personagens.md](personagens.md) e rodar o `npm run sim`. Sem Laboratório, o robô morre mais ou menos tanto quanto sem formações (4 de 8 runs contra 5 de 8).

**Depende de:** o organismo (fase 5, a doença escolhe as formações) e os receptores (fase 5.8, que dão o receptor nativo e os cartões do level up). Vem antes da 5.11, que usa o Cerco inflamatório.

**Critério de saída:** numa run de 20 minutos com Física baixa aparecem pelo menos três formações, quase todas de açúcares e lipídios; com outra doença, as formações mudam; dá para dizer qual agente é qual só pelo jeito que ele cresce; e, com tudo no máximo, o level up ainda dá alguma coisa.

## Fase 5.7: Mapas gerados

O mapa do campo crônico passa a ser gerado por semente, em blocos de 16×16 tiles, com chão variado, obstáculos, decoração, destrutíveis e pontos de interesse, num de cinco ambientes do corpo. Regras em [mapas.md](mapas.md) ([decisão 0026](decisoes/0026-mapas-gerados.md)); números em `src/config/map.json` e arte em `src/assets/sprites/map.json` (prancheta "Mapas: objetos e chão" do canvas).

- [x] Gerador de blocos em `src/core/map/`, com semente por bloco e teste de "mesma semente, mesmo bloco".
- [x] Chão em tiles de 16×16 (32 unidades) com manchas de variação por ruído. O tile base repete na tela toda e só os de variação viram imagens.
- [x] Obstáculos com colisão circular para o agente e as moléculas, com distância mínima e começo livre; chefe e formações atravessam. A grade dos sólidos só é refeita quando o agente troca de bloco ou um destrutível quebra.
- [x] Decoração sem colisão e destrutíveis com vida (golpes) e drop pelo ambiente; o chefe quebra os que encosta.
- [x] Densidade sorteada por run (Aberto, Padrão, Denso) e o nome do mapa com a semente no início, na pausa e no fim da run.
- [x] Ninho de vesículas (12% dos blocos). As estruturas da fase 5.11 nascem numa clareira, sem obstáculo dentro do círculo.
- [ ] Pontos de interesse câmara e corredor.
- [ ] Zonas de terreno (correnteza, bile, muco, bolsa de ar, sinapse ativa): mecânica nova, ficou para depois.
- [x] Os cinco ambientes de uma vez, sorteados pela semente da run (a escolha do local é a [fase 5.12](#fase-512-locais-do-corpo-e-sinergias)).
- [ ] Validar no celular a 60 FPS com o mapa Denso.

**Critério de saída:** duas runs seguidas dão mapas que dá para distinguir num print, nenhuma run prende o agente num beco, e o mapa Denso roda a 60 FPS no celular.

## Fase 5.8: Receptores no level up

O level up passa a oferecer só armas e **receptores**, os tomos do Megabonk: 16 atributos, 4 espaços. Os outros modificadores saem do sorteio. Regras em [megabonk.md](megabonk.md#1-level-up-com-armas-e-receptores) ([decisão 0027](decisoes/0027-level-up-com-receptores.md)).

- [x] Os 16 receptores (Cinética junta velocidade do projétil e alcance) e o custo dos 6 desbloqueáveis. Ficaram em `passives.json`, cada passivo com um papel (`receptor`, `reagent` ou `off`), em vez de um `receptors.json` novo; os custos estão em `meta.json`.
- [x] Sorteio do level up só com arma nova, nível de arma, receptor novo e nível de receptor; "Nova dose" e Fosfocreatina quando nada sobe.
- [x] Raridade no nível de arma, multiplicando o ganho daquele nível (inteiros arredondados, nunca abaixo do comum). Vale também para o nível de arma da cápsula.
- [x] "Espaços de modificador" vira "Espaços de receptor", só no Laboratório; Rerrolar, Pular e Banir saem das cartas e ficam no Laboratório e na saúde executiva.
- [x] Enquanto a fase 5.9 não chega, os reagentes continuam como carta (sem ocupar espaço) e os modificadores que saíram ficam só no Laboratório e na Mutação.
- [x] Desbloqueio dos receptores com ATP no Arsenal, como as armas, e o "!" na aba quando dá para comprar.
- [x] Level up com o título `ESCOLHA UMA ARMA OU RECEPTOR` e moldura de raridade na carta de arma; HUD e pausa com "Receptores" no lugar de "Modificadores".
- [x] Atualizar [wiki.md](wiki.md) (modificadores viram receptores) e rodar o `npm run sim`.

**Critério de saída:** uma run de 10 minutos chega com 4 armas e 4 receptores escolhidos, o level up nunca mostra mais de 8 tipos de carta diferentes, e o Vitor acha cada escolha mais pesada que antes.

## Fase 5.9: Suplementos e ampolas

Os atributos que saíram do level up voltam como **suplementos**, passivos que acumulam e saem de **ampolas** no chão. Nem toda molécula solta XP. Regras em [megabonk.md](megabonk.md#2-suplementos) ([decisão 0028](decisoes/0028-suplementos-e-ampolas.md)).

- [x] `supplements.json` com os suplementos e os 4 reagentes, em quatro raridades; sorteio de raridade pela Sorte e depois do suplemento. São 24 por enquanto: a Quimiotaxia entra com as sinapses.
- [x] Suplementos que mudam atributo (somam até o teto na run) e os de efeito: Nitrogênio líquido, Aquaporina, Eletrodo, Termita e Criopreservação. A faísca e a explosão não disparam outra faísca nem explosão.
- [x] Quimiotaxia, junto com as sinapses (fase 5.11).
- [x] Reagentes como suplemento, com peso ×10 quando a arma deles está no MAX; tirar os reagentes das cartas do level up.
- [x] Vitamina sai da vesícula e vira suplemento.
- [x] Gema de XP com chance por tipo de molécula (60% comum, 40% fragmento, 100% forte), valendo o XP dividido pela chance.
- [x] Ampola: chance por molécula, multiplicada pela Sorte e pelo Estresse, com garantia aos 90 s e intervalo mínimo de 20 s; chefe solta uma ampola de mínimo Ultra raro junto da cápsula. As chances subiram para 0,5% (comum) e 4% (forte) para chegar a cerca de 10 ampolas em 10 minutos.
- [x] Abrir a ampola: pausa curta, quebra, suplemento com a moldura da raridade, toque para voltar (no PC fecha sozinha em 1,5 s).
- [x] Pausa com a grade de suplementos (`×N`). O aviso de 2 s ficou dispensável: a tela da ampola já mostra o suplemento.
- [ ] "De onde vem" cada bônus na aba Atributos (receptor, suplemento, Laboratório).
- [x] Sprites de 16×16 da ampola (fechada e quebrando) e seção "Suplementos" no Compêndio.
- [x] Um ícone próprio por suplemento, na prancheta "Suplementos e ampolas" do canvas e no grupo `supplements` de icons.json.
- [x] Atualizar [wiki.md](wiki.md) e rodar o `npm run sim` com as ampolas. O nível médio numa run de 10 minutos fica 6% acima (25,7 contra 24,2), e o ATP por run sobe cerca de 20% (parte vem do robô, que agora pega os itens).

**Critério de saída:** numa run de 10 minutos saem de 6 a 10 ampolas, duas runs seguidas terminam com suplementos bem diferentes, e o XP por minuto fica a menos de 10% do de antes.

## Fase 5.10: Agregados (mini chefes)

Um mini chefe a cada 2 minutos, que sempre solta ampola. Regras em [megabonk.md](megabonk.md#3-drops-xp-com-chance-ampolas-e-agregados) ([decisão 0028](decisoes/0028-suplementos-e-ampolas.md)).

- [x] Agregado da molécula forte mais comum na onda (amido, triglicerídeo, cortisol): vida ×12, tamanho ×2,2, mais lento, cor própria e brilho pulsante (o contorno vermelho saiu); números em `run.json`. "Mais comum" é o maior peso de nascimento, que já vem puxado pela doença; antes de qualquer molécula forte liberar (minuto 2), vem a que libera primeiro.
- [x] Nasce num momento sorteado, de 20 a 60 s depois do anterior (pelo menos um por minuto), a pedido do Vitor; antes era a cada 2 minutos. Não é reposicionado quando fica longe, como o chefe.
- [x] Cascata ao decompor, gema vermelha e ampola de mínimo Raro, com 15% de chance (vezes a Sorte): com um agregado por minuto, sempre soltar daria ampolas demais. No simulador, uma run de 10 minutos tem de 10 a 20 ampolas.
- [x] Seta na borda da tela enquanto está fora de vista; conta para Especificidade e Anticorpo.
- [x] Agregados no Compêndio e na wiki.

**Critério de saída:** entre dois chefes sempre aparecem dois agregados, e decompor um deles é uma decisão de risco, não um passeio.

## Fase 5.11: Sinapses e estruturas

Estruturas no mapa em que é preciso ficar um tempo ou arriscar algo para ganhar um bônus, como os santuários do Megabonk. Regras em [megabonk.md](megabonk.md#4-sinapses-e-estruturas) ([decisão 0029](decisoes/0029-sinapses-e-estruturas.md)).

- [x] Sinapse: círculo de 48 px, barra que enche em 6 s dentro e esvazia devagar fora, e a tela de 3 cartões de bônus de atributo com raridade (reaproveitando a do level up).
- [x] Sinapse potenciada: 10% das sinapses, 10 s, só Lendário ou Especial.
- [x] Nascimento num anel fora da tela (uma sinapse perto no começo, depois uma estrutura a cada 45 s, no máximo 4), com pesos em `structures.json`.
- [x] Glândula adrenal (ATP por +5% de Estresse) e Coágulo (agregado extra com duas ampolas).
- [x] Foco inflamatório, depois do Cerco inflamatório da fase 5.6. O tempo do desafio aparece na fila de efeitos da HUD.
- [x] Seta na borda da tela para a estrutura mais perto; sprites das estruturas (da prancheta "Estruturas de interação" do canvas). O agregado passou a usar a mesma seta, em vermelho.
- [ ] Com a fase 5.7: estruturas viram pontos de interesse dos blocos, numa clareira.
- [x] Atualizar [wiki.md](wiki.md). A Quimiotaxia (suplemento da fase 5.9) entrou junto.
- [ ] Jogar runs de 15 minutos para ajustar o tempo da sinapse no pico (o robô do simulador não procura sinapses).

**Critério de saída:** numa run de 10 minutos o jogador completa pelo menos 3 sinapses por vontade própria, e pelo menos uma delas no meio de uma onda.

**Depois:** Ribossomo (duplica um suplemento) e Farmácia (vende suplementos pelo ATP da run), quando a economia da run com ampolas estiver medida.

## Fase 5.12: Locais do corpo e sinergias

O jogador escolhe em que parte do corpo vai agir, em vez de o ambiente da fase 5.7 sair da semente, e o par agente × local pode ter sinergia que melhora um setor de saúde. Regras em [mapas.md](mapas.md#escolha-do-local), tela em [menu.md](menu.md#escolha-do-local) ([decisão 0032](decisoes/0032-local-escolhido-e-sinergia.md), proposta).

- [ ] Local escolhido no lugar do sorteio: o gerador recebe o ambiente de fora e a semente decide só densidade e blocos; o nome do mapa e o código levam o local.
- [ ] Família e setor por local em `map.json`: família do local com peso ×2 (moléculas e formações) e ganho do agente no setor do local ×1,5; Corrente sanguínea neutra.
- [ ] Sinergia em `agents.json` (`synergy`) e `organism.json`: +4 no setor do par na escala de minutos, colateral pela metade, receptor nativo no nível 1. Com o elenco de hoje: Dopamina no Cérebro, Lipase no Intestino, Insulina no Fígado.
- [ ] Barreira hematoencefálica (`crossesBloodBrainBarrier`): a Lipase não entra no Cérebro.
- [ ] Hub: faixa do local acima do JOGAR; tela de escolha com o corpo, o cartão do local, o selo INDICADO e "Qualquer lugar" (+10% de ATP).
- [ ] Desbloqueio dos quatro locais na primeira estrela do primeiro caso, com aviso no hub.
- [ ] Sinergia na escolha do agente, na HUD (✚), no fim de run (linha separada na saúde) e na aba Organismo; melhor tempo por local em Recordes.
- [ ] Wiki ([wiki.md](wiki.md)) e Compêndio com os locais e as sinergias; linha no [CHANGELOG](../CHANGELOG.md).
- [ ] Rodar o `npm run sim` com cada doença no local indicado e na Corrente sanguínea, e ajustar os números para o segundo indivíduo não chegar na ALTA mais de 5 vezes mais rápido.

**Depende de:** o organismo (fase 5, setores, famílias e efeito de saúde no fim da run) e os mapas gerados (fase 5.7, os ambientes).

**Critério de saída:** com uma doença de cada setor, o jogador consegue dizer para onde ir e com quem; o par com sinergia cura visivelmente mais que o mesmo agente na Corrente sanguínea; e ninguém prefere sempre o "Qualquer lugar" ou sempre o mesmo local.

## Fase 6: Arte, polimento e lançamento

Deixar o jogo com a cara do canvas de identidade visual e pronto para outras pessoas.

- [ ] Acabamento visual de HUD, molduras, botões e fontes da aba Design (a HUD e a pausa de [ui-cronico.md](ui-cronico.md) entram na fase 2.6).
- [ ] Chão, paredes e efeitos (dano com contorno, projéteis); o chão e os objetos dos ambientes vêm da fase 5.7.
- [ ] Wiki dentro do jogo: o Compêndio ganha as páginas de [wiki.md](wiki.md) (como jogar, agentes, armas, modificadores, moléculas, progressão, campo longo, organismo e glossário).
- [ ] Som e música: as faixas chiptune metal e os efeitos de [sonoplastia.md](sonoplastia.md), com troca de música na run, volume de Música e Efeitos nas Opções e `src/config/audio.json`.
  - [x] Música: 9 faixas em loop e 3 jingles, troca na run (tempo, crise, chefe), abafada nas telas por cima, aba Som nas Opções (mudo, Geral, Música, Efeitos, abafar, segundo plano).
  - [ ] Jingles `bossIn` e `crisisIn` (faltam gerar).
  - [ ] Efeitos sonoros e volume de Efeitos: a lista de [efeitos-sonoros.md](efeitos-sonoros.md), primeiro os P1.
- [ ] PWA: ícones e polimento da instalação na tela inicial (o offline vem da fase 2.5).
- [ ] Layout em telas largas e altas (painéis laterais, mais pista).
- [ ] Rodada de testes com 2 ou 3 amigos e ajuste dos números.
- [x] Decidir como o jogo chega aos jogadores: GitHub Pages, publicado por versão ([0018](decisoes/0018-jogo-no-pages-servidor-futuro.md)).

**Critério de saída:** um amigo instala pelo link, joga sem explicação e volta no dia seguinte.

## Depois: conquistas

Ideia aprovada para elaborar no futuro, sem fase definida: a aba Conquistas ganha metas ("Decompor 1.000 triglicerídeos", "Nível 50 com a Lipase") que dão ATP ou liberam conteúdo, como os desbloqueios do Vampire Survivors ([lacunas-vs.md](lacunas-vs.md#conquistas)). Falta decidir se substituem parte do desbloqueio por ATP ou só somam.

## Fase 7: Lojas e plataformas

Lançar o jogo em todas as plataformas ([0031](decisoes/0031-lancar-em-todas-as-plataformas.md)), empacotando a mesma build web. Passo a passo, cuidados e ordem em [publicacao.md](publicacao.md).

- [ ] Flag de build (`TARGET`) para `base`, service worker e local do save; camada de save com implementações trocáveis.
- [ ] Microsoft Store pelo PWABuilder.
- [ ] Android com Capacitor (Google Play).
- [ ] Steam com Electron: save em arquivo, controles de PC, tela cheia e Steamworks.
- [ ] iOS com Capacitor (App Store).
- [ ] Política de privacidade, classificação etária, ícones e capturas de cada loja; conferir as regras de conteúdo sobre remédios e substâncias reais.

**Critério de saída:** o jogo está publicado e instalável em cada plataforma escolhida, com o mesmo código e o mesmo fluxo de versão.

## Depois: servidor (não prioritário)

Ideia anotada, sem fase definida: contas opcionais, save na nuvem e ranking por organismo e geral, numa API separada do jogo ([servidor.md](servidor.md)). Entra no máximo depois da fase 5, quando existirem indivíduos para ranquear.

## Primeiros passos

O que dá para começar já, em ordem:

1. Criar o projeto Vite + Phaser 4 + TypeScript e a estrutura `src/core/`, `src/game/`, `src/config/`.
2. Configurar testes, lint e CI.
3. Fazer o agente andar com teclado e joystick virtual, e abrir no celular.
4. Escrever o gerador de sprite de molécula e desenhar o primeiro inimigo.
5. Implementar spawn, perseguição e interações.
6. Implementar o Radical Livre, gemas de XP e o level up.

## Decisões que travam cada fase

Perguntas em aberto das outras abas que precisam de resposta antes da fase indicada.

- [x] **Fase 1:** tamanho base do pixel? → resolução nativa com pixel art detalhado ([0009](decisoes/0009-grade-16px-zoom-inteiro.md)).
- [x] **Fase 0:** orientação no celular para a run (vertical, horizontal ou as duas)? → as duas ([0010](decisoes/0010-orientacao-livre.md), proposta)
- [x] **Fase 1:** quantas interações o agente tem no início, e existe forma de recuperar na run? → 100 (aba Parâmetros); recupera pelo modificador Interações e pela opção "Nova dose" quando não sobra upgrade.
- [x] **Fase 1:** qual agente e quais três inimigos entram no protótipo? → Dopamina; glicose, ácido graxo e triglicerídeo.
- [x] **Fase 2:** a arma é do agente ou do jogador? Quantas armas e qual nível máximo por run? → ação própria + armas do pool, 4 espaços, nível 8 ([0015](decisoes/0015-acao-do-agente-e-armas.md)).
- [x] **Fase 2:** quais moléculas fortes geram quais fragmentos na cascata? → química real da aba Personagens ([0015](decisoes/0015-acao-do-agente-e-armas.md)).
- [x] **Fase 2:** um agente por run, ou dá para trocar durante a run? → um agente por run, escolhido no hub.
- [ ] **Fase 3:** o save precisa sincronizar entre aparelhos, ou cada um com o seu basta no começo?
- [ ] **Fase 4:** o idle aparece na mesma tela da run ou numa tela própria? O jogador posiciona os agentes da base?
- [ ] **Fase 5:** os efeitos de cada setor, o efeito colateral e o que acontece quando um setor chega a zero.
- [ ] **Fase 5:** que vantagem passa para o próximo indivíduo no reset?

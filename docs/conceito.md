# Dopamina Blaster — Documento de conceito

20 de outubro de 2026 · Vitor

## Visão geral

Dopamina Blaster é um roguelike incremental de auto-battle idle em que o jogador decompõe moléculas químicas inimigas usando outras moléculas como agentes. Na proposta atual, a run acontece num mundo aberto visto de cima, no estilo Vampire Survivors, e o idle usa o campo vertical, com inimigos descendo até os agentes na base.

O jogo tem dois campos. O **campo crônico** é a run de batalha, que termina quando acabam as interações do jogador. O **campo longo** é um incremental que roda sozinho, mais devagar, e gera recursos o tempo todo. Entre as runs, a moeda acumulada compra upgrades e desbloqueia novas moléculas, para chegar mais longe na próxima.

Tudo acontece dentro de um organismo, o corpo de uma pessoa. As moléculas inimigas são a química desse corpo, e os agentes são remédios e substâncias reais que tratam o organismo. O objetivo de toda a progressão é deixar esse indivíduo saudável.

- **Gênero:** roguelike incremental, auto-battle, idle
- **Tema:** química real do corpo humano, moléculas e remédios
- **Orientação:** vertical primeiro, adaptável a qualquer aspect ratio
- **Referência principal:** Vampire Survivors (base direta da run e do level up)
- **Plataforma alvo:** navegador no PC, celular e tablet, instalável como app; feito em Phaser 4 (aba Plataforma)

## Pilares de design

Os cinco pilares abaixo foram extraídos das suas notas. São uma proposta para validar, não decisões fechadas.

1. **Química como linguagem do jogo.** Inimigos são moléculas reais do corpo e agentes são remédios e substâncias que agem nelas; o objetivo é decompor. O tema precisa aparecer na mecânica, não só na arte.
2. **Progresso que nunca para.** O campo longo farma sozinho e a meta-progressão faz cada run deixar algo para a próxima.
3. **Batalha automática, decisão estratégica.** Os agentes disparam sozinhos; na run o jogador escolhe o agente, controla o movimento e o especial, e escolhe modificadores a cada level up.
4. **Uma tela, qualquer tela.** Pensado para vertical, mas o layout se adapta a qualquer proporção sem quebrar a leitura do campo.
5. **Cuidar do organismo.** Tudo serve para deixar o indivíduo saudável: os agentes da run e do idle mexem nos pontos de saúde do corpo.

## Loop de gameplay

O jogador entra numa run no campo crônico, luta até as interações acabarem, volta ao menu e gasta a moeda para ficar mais forte. Em paralelo, o campo longo gera recurso sozinho.

> Diagrama "Loop principal (run, menu e campo longo)" disponível no [documento original](https://claude.ai/code/artifact/931f649e-d98f-4019-a7fb-8643946bc1c5).

O laço de cima é o roguelike (run, derrota, upgrade); a caixa de baixo é o lado idle que alimenta o menu.

## Campo crônico (a run)

O campo crônico é a batalha: o agente escolhido luta contra ondas de moléculas cada vez mais difíceis até o jogador ficar sem interações, e então ele volta ao menu.

**O que está definido**

- **Mundo aberto, como Vampire Survivors.** A run acontece num mapa aberto visto de cima: o agente anda livremente e as moléculas inimigas chegam de todos os lados. Formato misto definido: o campo vertical fica com o idle, e a run é o "mundo aberto".
- **O agente é o personagem.** Os agentes são as moléculas que o jogador escolhe antes da run e controla (remédios e substâncias reais). Existem vários agentes jogáveis, cada um com sua própria ação.
- **Vida = limite de interações.** Cada inimigo que encosta no agente se liga a ele e consome parte das suas interações, o estoque de moléculas do agente (detalhes na aba Parâmetros). Quando as interações acabam, o agente foi consumido e a run termina.
- **Ataque automático, controle só do movimento.** Os agentes atacam sozinhos, como em Vampire Survivors; o jogador controla apenas a movimentação do agente.
- **Especial ativado pelo jogador.** Além de se mover, o jogador tem um especial que ele mesmo dispara. Cada agente tem o seu, e o especial pode ser melhorado.
- **Decomposição em cascata.** Moléculas simples são "mortas" ao serem decompostas. Moléculas mais fortes, quando decompostas, podem se quebrar em moléculas mais fracas.
- **Efetividade por tipo.** Cada agente tem um tipo de ação e uma efetividade diferente contra cada tipo de molécula. Ele pode ser melhorado, mas tem limites: para quebrar moléculas para as quais não foi feito, precisa evoluir.
- **Level up dentro da run.** Como em Vampire Survivors: o agente ganha níveis durante a run, e cada level up abre uma tela para escolher um modificador ou uma "arma".
- **Run infinita.** Dura enquanto o jogador sobreviver. A dificuldade sobe ao longo da run, seguindo um limiar programável a definir.

**O que falta decidir**

- Decomposição em cascata: quais moléculas fortes geram quais fracas, quantas, e os fragmentos continuam perseguindo o personagem?
- Quantas interações o jogador tem no início, e existe forma de recuperar durante a run?
- Especial de cada agente: o que faz, como recarrega e como melhora. Vai para o doc de estratégia e balanceamento.
- O que é uma "arma" neste universo de química? O conceito ainda precisa ser criado.
- O jogador pode trocar de agente durante a run, ou é um agente por run?

## Campo longo (o idle)

O campo longo é um incremental que roda sozinho e bem mais devagar que a run, sempre farmando e gerando recurso. É aqui que fica o campo vertical visto de cima.

**O que está definido**

- Campo vertical visto de cima: as moléculas inimigas descem do topo e os agentes, fixos na base, disparam contra elas.
- Roda sem intervenção do jogador.
- É mais lento que o campo crônico.
- Gera recursos continuamente.
- Roda ao mesmo tempo que a run.
- Continua gerando com o jogo fechado (progresso offline), com um teto de horas.
- Gera a mesma moeda da run: os dois campos trabalham juntos nos macros do organismo.
- Tem árvore de upgrades própria, porque os agentes (remédios) do idle são diferentes dos da run.

**O que falta decidir**

- O jogador mexe nos agentes da base do idle (posição, composição) ou só melhora com upgrades?

## Organismo (os macros)

O mundo do jogo é um organismo, o corpo de uma pessoa. Toda a química da run e do idle acontece dentro dele, e a progressão serve para deixá-lo saudável.

**O que está definido**

- **Quatro pontos de saúde:** mental, física, social e executiva.
- **Agentes mexem na saúde.** Cada agente, no idle ou na run, pode ganhar ou perder pontos em um ou mais desses setores, uns mais que outros.
- **Mecânica central.** A meta-progressão gira em torno da saúde do organismo, junto com a qualidade, a dose e a potência dos agentes. Conforme os dois evoluem, o organismo melhora.

**O que falta decidir**

- Como cada ponto de saúde afeta o jogo (bônus, penalidades, desbloqueios)?
- O que acontece se um ponto de saúde cai muito?

## Meta-progressão

No menu principal, o jogador gasta pontos, ouro ou moeda para comprar upgrades e liberar novas moléculas, e assim chegar mais longe na próxima run.

**O que está definido**

- A moeda é gasta no menu principal, entre runs.
- Dois usos: upgrades e desbloqueio de novas moléculas-agente.
- O objetivo é permitir runs cada vez mais longas.
- Os upgrades seguem o modelo de Vampire Survivors, com meta-progressão entre runs.
- Desbloqueio de molécula nova: moeda + nível de progressão da última molécula. A analogia é o médico que troca o remédio depois de ver como o paciente reagiu ao anterior.
- Prestígio: ao chegar a certo nível, abre a opção de reset para outro indivíduo, sempre mais doente (mais difícil), com alguma vantagem herdada.

**O que falta decidir**

- Quantas moedas existem e de onde vem cada uma (run, campo longo, conquistas)?
- Que vantagem passa para o próximo indivíduo no reset?

## UI e aspect ratio

*Fica para bem mais à frente: o foco agora é refinar a mecânica e a ideia do jogo. O que está abaixo é só rascunho.*

O jogo é pensado primeiro para tela vertical, mas precisa se adaptar a qualquer proporção. Um caminho comum para isso, a validar com você:

- **Campo de batalha com largura lógica fixa.** No idle, a coluna onde os inimigos descem mantém a mesma proporção; na run, a área visível ao redor do personagem é a mesma em qualquer tela. Assim a dificuldade não muda com o aparelho.
- **Espaço extra vira painéis.** Em tela larga (desktop, tablet deitado), as sobras laterais podem mostrar o campo longo, os status ou a loja, em vez de esticar o campo.
- **Em tela alta, mais pista.** Em telas mais altas, o espaço a mais pode ir para a distância que o inimigo percorre ou para a HUD.

**O que falta decidir**

- Orientação no celular: vertical, horizontal ou as duas? (aba Plataforma)
- Controle da run: joystick virtual ou toque para mover no celular, teclado no PC? Onde fica o botão do especial?
- O campo longo aparece na mesma tela da run ou numa tela própria?

## Inspirações

A única referência citada até agora é Vampire Survivors, como base direta da run.

| Referência | O que pegar | O que deixar |
| --- | --- | --- |
| Vampire Survivors | Level up com escolha de modificador, ataque automático, movimentação livre num mapa aberto, sensação de poder crescente, meta-progressão entre runs | A definir (o especial ativado pelo jogador já é uma diferença) |

Outros jogos de defesa vertical e incrementais idle podem entrar aqui como referência de layout e economia, se fizer sentido para você.

## Decisões gerais

- **Química real do corpo.** As moléculas existem no corpo e os agentes agem como agem de verdade: um lipídio (gordura) é quebrado por um agente que quebra gordura; Venvanse pode ser um agente que age no cérebro.
- **Sem lado educativo.** A química é a estética e o mundo do jogo.
- **Dopamina é um agente** jogável.
- **O personagem é o agente** que o jogador escolhe e controla na run.
- **Equipe:** projeto solo, com Claude Code e ferramentas de geração.
- **Objetivo:** jogo pessoal, para amigos, sem fins lucrativos.

## Questões em aberto

Além das lacunas de cada seção acima, estas perguntas atravessam o jogo inteiro.

- **Estilo visual.** Pixel art, vetorial minimalista, modelos de bolas e varetas?
- **Tecnologia.** Decidido: Phaser 4 com TypeScript, jogo web instalável como app (aba Plataforma).

## Próximos passos

O próximo passo é você responder as perguntas abaixo, que destravam o resto do design. Elas estão em ordem de impacto.

- [x] O que é "decompor" na mecânica: o inimigo perde vida até sumir, ou se quebra em moléculas menores?
- [x] Química real ou estilizada? E existe intenção educativa?
- [x] Além de mover e usar o especial, o jogador faz escolhas na run (upgrades por nível, cartas)?
- [x] Os dois campos rodam ao mesmo tempo, e o campo longo gera com o jogo fechado?
- [x] Ouro da run e recurso do campo longo são a mesma moeda?
- [x] Qual é a plataforma principal: celular, PC ou as duas?
- [x] O que o nome "Dopamina" representa no jogo?

Depois das respostas, a sugestão é:

1. Criar o doc de personagens, habilidades e moléculas ofensoras (agentes, inimigos e o que cada um faz).
2. Criar o doc de estratégia e balanceamento (especiais, efetividade por tipo, curva de dificuldade).
3. Definir os macros do organismo e, a partir deles, as moedas.
4. Fechar o loop de uma run em uma página (duração, ondas, escolhas, fim).
5. Listar de 5 a 10 moléculas iniciais, inimigas e agentes, com o que cada uma faz.
6. Definir a economia mínima: uma moeda, três upgrades, duas moléculas para desbloquear.
7. Fazer um protótipo jogável só do campo crônico para testar se a batalha é divertida.

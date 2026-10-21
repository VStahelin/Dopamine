# Armas

Proposta de 7 armas iniciais para o modo aberto, cada uma com uma mecânica diferente e um análogo químico.

## Como o Vampire Survivors organiza as armas

No Vampire Survivors as armas se diferenciam pelo **padrão de ataque**, não pelo dano: todas atacam sozinhas, e o que muda é para onde, a que distância e em quantos inimigos. O jogo tem mais de 100 armas, mas elas caem em poucos arquétipos ([wiki](https://vampire-survivors.fandom.com/wiki/Weapons)).

| Arquétipo | Como ataca | Exemplo no VS |
| --- | --- | --- |
| Golpe direcional | Corte curto para a frente ou para os lados | Whip |
| Mira automática | Projétil no inimigo mais próximo | Magic Wand |
| Aleatório | Atinge inimigos sorteados na tela | Lightning Ring |
| Órbita | Objetos girando em volta do personagem | King Bible |
| Aura | Dano contínuo num raio em volta do personagem | Garlic |
| Zona no chão | Cria uma poça que causa dano por um tempo | Santa Water |
| Ricochete | Projétil que quica entre inimigos e paredes | Runetracer |
| Perfuração | Atravessa vários inimigos em linha | Javelin, C-U-Laser |
| Explosão | Bomba com dano em área, às vezes com atraso | Cherry Bomb |
| Controle | Congela ou desacelera | Clock Lancet |

**Como o jogador ganha armas no VS:** a cada level-up escolhe entre armas novas, upgrades de arma e itens passivos. São até 6 armas por run, cada uma vai até o nível 8 (na maioria). Uma arma no nível máximo, junto com o passivo certo, evolui ao abrir um baú de chefe depois dos 10 minutos ([evoluções](https://rogueranker.com/vampire-survivors-evolution/)). Exemplo: Garlic + Pummarola vira Soul Eater, uma aura que cresce e rouba vida.

## Mapa das armas

As 7 armas propostas se espalham pelos dois eixos que mais mudam o jeito de jogar: a que distância atacam e quantos inimigos atingem.

> Diagrama "Mapa das armas (alcance × alvos)" disponível no [documento original](https://claude.ai/code/artifact/931f649e-d98f-4019-a7fb-8643946bc1c5).

Os dois lados ficam equilibrados: três armas de perto (Catalisador, Nuvem, Ácido) e quatro de média ou longa distância. Radical Livre e Jato Ácido são as de alvo único.

## As 7 armas iniciais

Cada arma usa um arquétipo diferente do VS e se apoia num fenômeno químico real que quebra ou enfraquece moléculas. Os nomes e números são proposta para discutir.

| Arma | Arquétipo | Alcance | Mecânica | Análogo químico |
| --- | --- | --- | --- | --- |
| Radical Livre | Mira automática | Longe | Dispara um radical (OH•) na molécula mais próxima. Dano médio, cadência alta. A arma inicial padrão. | Radicais hidroxila arrancam elétrons e quebram ligações. |
| Jato Ácido | Golpe direcional | Perto | Cone curto para a frente, alterna esquerda e direita. Dano alto, só de perto. | Ácidos quebram ligações por hidrólise. |
| Nuvem de Elétrons | Órbita | Perto | 2 a 4 elétrons giram em volta do agente e acertam o que passa. Upgrades adicionam elétrons. | O orbital eletrônico em volta do núcleo. |
| Catalisador | Aura | Perto | Campo em volta do agente: dano baixo e contínuo, e inimigos dentro dele recebem mais dano de todas as armas. | Catalisadores baixam a energia de ativação da reação. |
| Poça de Solvente | Zona no chão | Médio | Arremessa um frasco que vira uma poça por alguns segundos. Dano por segundo e lentidão. | Um solvente dissolve o que entra nele. |
| Reação em Cadeia | Ricochete | Médio | O disparo acerta um inimigo e pula para o próximo, até N saltos. Cada salto pode causar menos dano. | Reações em cadeia: cada radical gera outro, que ataca a molécula vizinha. |
| Raio UV | Perfuração | Longe | Feixe em linha reta que atravessa todos os inimigos no caminho. Cadência baixa, dano alto. | Fotólise: a luz UV quebra ligações químicas. |

Ideias de evolução, no modelo do VS (arma no máximo + item passivo):

- **Radical Livre + Peróxido → Reação de Fenton:** uma rajada de radicais. Na reação de Fenton real, o peróxido com ferro gera radicais OH em massa.
- **Jato Ácido + Cloro → Água Régia:** cone maior que corrói até inimigos de elite. A água régia real dissolve até ouro.
- **Raio UV + Ozônio → Laser:** feixe contínuo que varre a tela.
- **Catalisador + \[passivo a definir\] → Enzima:** aura que cresce a cada molécula decomposta, como a Soul Eater do VS.

Outros arquétipos que podem virar armas depois: explosão (Combustão), controle (Nitrogênio Líquido, que congela) e limpeza de tela (Fissão).

## Como a arma chega ao jogador

A proposta copia o modelo do VS, que já é conhecido pelo público do gênero:

1. A run começa com uma arma (o Radical Livre, ou a arma do agente escolhido).
2. Cada level-up oferece 3 opções: arma nova, upgrade de arma ou item passivo (reagente).
3. Limite de armas por run e nível máximo por arma a definir. No VS são 6 armas e nível 8.
4. Arma no máximo + reagente certo evolui.
5. Armas novas entram no sorteio só depois de desbloqueadas na meta-progressão, com ouro.

## Perguntas em aberto

- [ ] O "modo aberto" é um terceiro modo com movimento livre, ou é o próprio campo crônico? No campo crônico os agentes ficam fixos na base, então "perto" quer dizer perto da base.
- [ ] A arma é do agente (cada molécula tem a sua) ou do jogador (qualquer agente usa qualquer arma)?
- [ ] Armas diferentes decompõem de jeitos diferentes? Por exemplo, o Ácido quebra só ligações simples e o UV só duplas.
- [ ] Existe afinidade entre arma e inimigo (o Ácido é forte contra bases, por exemplo)?
- [ ] Quantas armas e qual nível máximo por run?

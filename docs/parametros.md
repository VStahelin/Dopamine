# Parâmetros

Mapa de todos os atributos do jogo, montado a partir dos stats de Vampire Survivors, Brotato e Halls of Torment e adaptado ao tema químico. Os nomes no jogo, os valores base e os tetos são **proposta para testar**. Os tetos de meta-progressão de Vampire Survivors entram como referência de escala; os demais tetos são chute inicial.

- **Base:** valor com que todo agente começa, antes de upgrades.
- **Teto na run:** o máximo que dá para chegar somando level ups dentro da run.
- **Teto meta:** o máximo que os upgrades permanentes do menu dão. Segue a regra da aba Economia: pouco poder bruto fora da run.

## Como os atributos se combinam

- Bônus percentuais do mesmo atributo **somam entre si** e o total multiplica a base, como em Vampire Survivors. Dois bônus de +10% dão +20%, não +21%.
- **Dano final** = dano base do agente × Reatividade × Afinidade com o tipo × Força da catálise (se for crítico) × Especificidade (se for chefe).
- **Dano recebido** = dano do inimigo − Membrana, nunca abaixo de 1.
- Chance crítica acima de 100% não faz nada; esquiva para em 60%.

Os eixos de upgrade da aba Mecânicas agrupam os atributos: **Qualidade** mexe em Reatividade, Afinidade e Penetração; **Dose** mexe em Dose (quantidade) e Metabolismo (recarga); **Potência** mexe no efeito na saúde e na Força do especial.

## Interações (a vida)

Na vida real, um remédio só age enquanto tem molécula livre para se ligar ao que precisa tratar, e cada ligação gasta parte da dose. Aqui é igual: as **interações** são o estoque de moléculas do agente, as ligações que ele ainda consegue fazer.

- **Dose inicial:** o agente começa a run com 100 interações.
- **Cada contato gasta interações.** A molécula ofensora que encosta se liga ao agente e consome parte do estoque: inimigos comuns gastam 5, fortes de 10 a 20, chefes cerca de 30.
- **Zero interações = agente consumido.** O efeito acaba e a run termina.

Os atributos defensivos seguem a mesma lógica:

- **Membrana:** um envoltório que protege parte das moléculas, como um lipossoma.
- **Esquiva:** a molécula ofensora passa sem conseguir se ligar.
- **Homeostase e Absorção:** o corpo repondo o agente aos poucos.
- **Segunda dose:** literalmente uma nova dose quando o estoque zera.

## Ofensivos

| Atributo | Nome no jogo | O que faz | Base | Teto na run | Teto meta |
| --- | --- | --- | --- | --- | --- |
| Dano | Reatividade | Multiplica o dano de todos os ataques | 100% | sem teto | +25% |
| Quantidade de projéteis | Dose | Projéteis extras por disparo | +0 | +5 | +1 |
| Recarga (velocidade de ataque) | Metabolismo | Tempo entre ataques; menor é mais rápido | 100% | −60% | −5% |
| Área | Difusão | Tamanho de áreas, auras e explosões | 100% | +150% | +10% |
| Duração | Meia-vida | Quanto duram efeitos, auras e poças | 100% | +200% | +30% |
| Velocidade do projétil | Cinética | Velocidade com que o disparo viaja | 100% | +100% | +20% |
| Alcance | Alcance | Distância até onde o agente mira | 100% | +100% | +20% |
| Perfuração | Penetração | Quantos inimigos um disparo atravessa | 0 | +5 | +1 |
| Ricochete | Reação em cadeia | Quantas vezes o disparo pula para outro inimigo | 0 | +5 | — |
| Chance crítica | Chance de catálise | Chance de um golpe ser crítico | 5% | 100% | +10% |
| Dano crítico | Força da catálise | Multiplicador do golpe crítico | 200% | 500% | +25% |
| Repulsão (knockback) | Repulsão | Quanto o golpe empurra o inimigo | 100% | +100% | — |
| Dano em chefes e elites | Especificidade | Dano extra contra chefes e inimigos fortes | 100% | +100% | +10% |
| Chance de efeito | Chance de efeito | Chance de aplicar lentidão, queimadura e afins | 0% | 100% | +10% |
| Afinidade por tipo | Afinidade | Multiplicador contra cada tipo de molécula: forte ×1,5, média ×1, fraca ×0,5 | por agente | muda só com evolução | — |

## Defensivos

| Atributo | Nome no jogo | O que faz | Base | Teto na run | Teto meta |
| --- | --- | --- | --- | --- | --- |
| Vida máxima | Interações | Estoque de ligações que o agente ainda consegue fazer; a run acaba no zero | 100 | sem teto | +30% |
| Armadura | Membrana | Reduz um valor fixo de cada golpe recebido (mínimo 1) | 0 | 10 | +3 |
| Esquiva | Esquiva | Chance de não perder interações num golpe | 0% | 60% | +10% |
| Regeneração | Homeostase | Interações recuperadas por segundo | 0 | 2/s | +0,5/s |
| Roubo de vida | Absorção | Chance de recuperar 1 interação ao decompor uma molécula | 0% | 20% | +3% |
| Invulnerabilidade após dano | Tolerância | Tempo sem levar dano depois de um golpe | 0,5 s | 1,5 s | +0,2 s |
| Reviver | Segunda dose | Volta com metade das interações ao morrer | 0 | 2 | +1 |
| Espinhos | Reflexo | Devolve parte do dano a quem encostou | 0% | 200% | — |

## Mobilidade e coleta

| Atributo | Nome no jogo | O que faz | Base | Teto na run | Teto meta |
| --- | --- | --- | --- | --- | --- |
| Velocidade de movimento | Mobilidade | Velocidade do agente no mapa | 100% | +100% | +10% |
| Ímã | Raio de coleta | Distância de onde XP e ATP são puxados | 100% | +300% | +50% |
| Ganho de XP | Aprendizado | Multiplica o XP recebido | 100% | +200% | +15% |
| Ganho de moeda | Rendimento | Multiplica o ATP recebido na run | 100% | +200% | +25% |
| Sorte | Sorte | Melhora crítico de alguns agentes, raridade das escolhas no level up e drops | 100% | +200% | +30% |

## Escolhas no level up

| Atributo | Nome no jogo | O que faz | Base | Teto na run | Teto meta |
| --- | --- | --- | --- | --- | --- |
| Opções por level up | Opções | Quantas escolhas aparecem na tela | 3 | 5 | +1 |
| Rerrolar | Rerrolar | Sorteia as opções de novo | 0 | sem teto | +3 |
| Pular | Pular | Recusa o level up em troca de um pouco de ATP | 0 | sem teto | +3 |
| Banir | Banir | Tira uma opção do sorteio pelo resto da run | 0 | sem teto | +3 |
| Espaços de arma | Espaços de arma | Quantas "armas" o agente carrega | 4 | 6 | +1 |
| Espaços de modificador | Espaços de modificador | Quantos modificadores passivos o agente carrega | 4 | 6 | +1 |

A saúde executiva pode somar uma opção extra por level up, como proposto na aba Mecânicas.

## Risco e recompensa

| Atributo | Nome no jogo | O que faz | Base | Teto na run | Teto meta |
| --- | --- | --- | --- | --- | --- |
| Maldição | Estresse | Aumenta vida, velocidade e quantidade dos inimigos; em troca, mais XP e ATP | 0% | +100% | +50% (opcional, o jogador escolhe ligar) |

## Especial

| Atributo | Nome no jogo | O que faz | Base | Teto na run | Teto meta |
| --- | --- | --- | --- | --- | --- |
| Recarga do especial | Recarga do especial | Tempo até o especial ficar pronto de novo | 100% | −50% | −10% |
| Força do especial | Força do especial | Multiplica o efeito do especial | 100% | +100% | +20% |
| Duração do especial | Duração do especial | Quanto o efeito dura | 100% | +100% | +20% |
| Cargas | Cargas | Quantos usos guardados de uma vez | 1 | 3 | +1 |

## De onde vem cada atributo (proposta)

Com as mudanças do Megabonk ([megabonk.md](megabonk.md), decisões [0027](decisoes/0027-level-up-com-receptores.md) e [0028](decisoes/0028-suplementos-e-ampolas.md)), só 16 atributos sobem no level up, como **receptores**: Reatividade, Metabolismo, Difusão, Cinética (com Alcance), Chance de catálise, Interações, Homeostase, Membrana, Mobilidade, Raio de coleta, e os desbloqueáveis Dose, Meia-vida, Aprendizado, Sorte, Estresse e Mutação. Os outros vêm de **suplementos** (ampolas) e de **sinapses**; Rerrolar, Pular, Banir e os espaços vêm do Laboratório. Os tetos desta aba continuam valendo para a soma de todas as fontes.

## Raridades e Sorte

Cada modificador do level up sorteia uma raridade, que multiplica o valor dele. A **Sorte** deixa as raridades altas mais prováveis. Detalhes e fórmula na [decisão 0013](decisoes/0013-raridade-e-sorte.md); os números ficam em `src/config/rarities.json`.

| Raridade | Cor | Multiplicador |
| --- | --- | --- |
| Comum | cinza | ×1 |
| Incomum | verde | ×1,5 |
| Raro | azul | ×2 |
| Ultra raro | roxo | ×2,5 |
| Lendário | laranja | ×3 |
| Especial | dourado claro | ×4 |

**No jogo hoje:** todos os atributos ofensivos, defensivos, de mobilidade, de level up e o Estresse viram modificadores (`src/config/passives.json`), menos Meia-vida, Chance de efeito, Rendimento, Espaços de arma e os do especial, que esperam a mecânica existir.

## Saúde do organismo (por agente)

| Atributo | O que faz | Base |
| --- | --- | --- |
| Efeito por setor | Pontos que o agente dá em física, mental, executiva e social | por agente |
| Potência | Multiplica o efeito na saúde | 100% |
| Colateral | Pontos que o agente tira de outros setores; cresce com o quadrado da dose | por agente |

## Campo longo (idle)

| Atributo | O que faz | Base | Teto |
| --- | --- | --- | --- |
| Produção | ATP por hora de cada agente na base | por agente | sem teto |
| Ritmo de disparo | Velocidade de ataque dos agentes na base | 100% | +200% |
| Espaços na base | Quantos agentes cabem no idle | 3 | 5 (o pool da prancheta) |
| Teto offline | Horas de produção com o jogo fechado | 8 h | 24 h |

## Inimigos

Atributos que cada molécula ofensora da aba Personagens precisa ter definidos.

| Atributo | O que faz |
| --- | --- |
| Vida | Quanto dano aguenta; multiplicada pela dificuldade D(t) |
| Velocidade | Quão rápido persegue o agente |
| Dano | Quantas interações tira por golpe |
| Membrana | Redução fixa no dano recebido |
| Tipo | Lipídio, açúcar, radical, estresse, toxina ou inflamação |
| XP | Quanto XP deixa ao ser decomposta |
| ATP | Quanto ATP deixa |
| Fragmentos | Em quais moléculas se quebra e quantas (cascata) |
| Aura | Bônus que dá a inimigos próximos (ex.: cortisol) |
| Peso de spawn | Chance de aparecer, ajustada pelos setores baixos do organismo |

## O que falta decidir

- O consumo por contato (comum 5, forte 10 a 20, chefe 30) faz sentido para 100 interações iniciais?
- Os nomes químicos ajudam ou atrapalham a leitura? Dá para mostrar o nome comum (Dano, Área) junto.
- Quais atributos ficam fora do primeiro protótipo? Uma sugestão é começar com Reatividade, Dose, Metabolismo, Difusão, Interações, Mobilidade, Raio de coleta e Sorte.
- Estresse (maldição) entra como escolha do jogador, ou só aumenta com o tempo?

## Referências

- [Vampire Survivors Wiki: PowerUp](https://vampire-survivors.fandom.com/wiki/PowerUp?oldid=2256)
- [Brotato Wiki: Crit Chance](https://brotato.wiki.spellsandguns.com/Crit_Chance)
- [Brotato Wiki: Dodge](https://brotato.wiki.spellsandguns.com/Dodge)
- [Halls of Torment: Swordsman Build Guide](https://en.number13.de/halls-of-torment-swordsman-build-guide)

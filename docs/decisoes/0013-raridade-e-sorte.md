# 0013. Raridade dos modificadores, movida pela Sorte

- **Status:** proposta
- **Data:** 2026-10-21
- **Área:** design

## Contexto

O Vitor pediu todos os modificadores da aba [Parâmetros](../parametros.md) no level up e que a Sorte decida a raridade deles, com cores no padrão dos RPGs.

## Decisão

- Cada modificador oferecido no level up sorteia uma **raridade**, que multiplica o valor dele. São seis, em `src/config/rarities.json`:

  | Raridade | Cor | Peso | Multiplicador |
  | --- | --- | --- | --- |
  | Comum | cinza `#C8C8C8` | 100 | ×1 |
  | Incomum | verde `#1EFF00` | 45 | ×1,5 |
  | Raro | azul `#2F8CFF` | 20 | ×2 |
  | Ultra raro | roxo `#A335EE` | 8 | ×2,5 |
  | Lendário | laranja `#FF8000` | 3 | ×3 |
  | Especial | dourado claro `#E6CC80` | 1 | ×4 |

  As cores seguem o padrão popularizado por World of Warcraft e Diablo (cinza, verde, azul, roxo, laranja), com o dourado claro dos itens de artefato no topo. O azul é um pouco mais claro que o do WoW (`#0070DD`) para ser legível no painel azul-noite.
- **Sorte** move o sorteio: com Sorte `s`, o peso da raridade de índice `i` vira peso × s^(0,6 × i). Com Sorte 100% vale a tabela; com 300% (o teto), Especial fica cerca de 7× mais provável.
- Atributos inteiros (projéteis, perfuração, usos...) arredondam o valor com raridade, sem ficar abaixo do comum.
- A arma e a cura ("Nova dose") não têm raridade; o cartão delas tem moldura ciano.
- Todo modificador conta para os **Espaços de modificador** (4, teto 6), menos o próprio "Espaços de modificador". Com os espaços cheios, só aparecem melhorias do que já foi escolhido.

## Alternativas consideradas

- **Raridade só como cor, sem mudar o valor:** a Sorte não teria efeito real.
- **Modificadores diferentes por raridade (efeitos únicos):** mais rico, mas exige desenhar muitos efeitos; dá para somar depois na raridade Especial.

## Consequências

- Cada escolha guarda quanto somou (`bonus`), não só o nível.
- Ficam fora do level up por enquanto, até a mecânica existir: Meia-vida (duração), Chance de efeito, Rendimento (ATP), Espaços de arma e os atributos do especial.

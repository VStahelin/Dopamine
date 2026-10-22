# 0030. Fase 5.6 reformulada: crises pela doença, receptor nativo e Superdosagem de atributos

- **Status:** proposta
- **Data:** 2026-10-22
- **Área:** design

## Contexto

A [0025](0025-variedade-da-run.md) criou a fase 5.6 com três ideias do Vampire Survivors: ondas com formação, perfil farmacológico (um bônus por agente a cada 10 níveis) e Superdosagem (o Limit Break, que sobe uma arma sorteada). Depois vieram as decisões do Megabonk ([0027](0027-level-up-com-receptores.md), [0028](0028-suplementos-e-ampolas.md) e [0029](0029-sinapses-e-estruturas.md)), e a fase ficou em parte repetida e em parte sem encaixe: a Superdosagem contava modificadores que deixaram de existir, o perfil era um bônus solto ao lado dos receptores e as formações não tinham ligação com o organismo da fase 5 nem com as estruturas. O Vitor pediu para reformular a fase com as mecânicas novas e o tema do jogo.

## Decisão

- A fase 5.6 continua com o mesmo nome e a mesma pergunta (a run muda de cara a cada pico, e cada agente cresce do seu jeito?), com o conteúdo refeito em [roadmap.md](../roadmap.md#fase-56-variedade-da-run).
- **Crises:** as formações viram seis, uma para cada família de molécula, e a **doença do indivíduo** escolhe qual vem (o peso é o da família no organismo). Uma formação a cada 90 s, e a cada pico de 5 minutos uma **crise** com a formação mais puxada pela doença em dobro, nome no banner e aviso de 3 s.
- **Receptor nativo:** o perfil farmacológico passa a ser um receptor próprio de cada agente, num espaço extra, que sobe 1 nível a cada 10 níveis até o 5 no nível 50.
- **Superdosagem de atributos:** com armas e receptores no máximo, o level up oferece três cartões pequenos de bônus de atributo Comum, em vez de subir uma arma sorteada.
- A fase passa a depender do organismo (fase 5) e dos receptores (fase 5.8), e entra antes da 5.11 na ordem de execução, porque o Foco inflamatório usa o Cerco inflamatório.

## Alternativas consideradas

- **Manter a 5.6 como estava:** a Superdosagem e o perfil ficariam em conflito com os receptores, e as formações seriam um sorteio sem relação com a doença.
- **Juntar a 5.6 nas fases do Megabonk (5.8 a 5.11):** as fases ficariam grandes e a pergunta de variedade se perderia.
- **Só as formações, sem perfil nem Superdosagem:** menos trabalho, mas o agente continuaria sem crescer de jeito próprio.

## Consequências

- Substitui em parte a [0025](0025-variedade-da-run.md): a fase 5.6 e a ordem continuam, mas formações, perfil e Superdosagem mudam como acima. A cápsula e as conquistas da 0025 não mudam.
- Formações em `run.json`, receptor nativo em `agents.json`, e o sorteio do level up ganha a Superdosagem em `src/core/run/upgrades.ts`.
- Dopamina, Lipase e Insulina ganham um receptor nativo; [personagens.md](../personagens.md) fala dele quando for implementado.
- A ordem sugerida das fases 5.x passa a ser 5.5 → 5.8 → 5.9 → 5.10 → 5.6 → 5.11 → 5.7.

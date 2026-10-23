# Documentação do Farmaco Battle

Documento de conceito do jogo, um arquivo por aba do [documento original](https://claude.ai/code/artifact/931f649e-d98f-4019-a7fb-8643946bc1c5). Tudo aqui ainda é proposta em evolução; cada arquivo termina com o que falta decidir.

| Arquivo | Conteúdo |
| --- | --- |
| [conceito.md](conceito.md) | Visão geral, pilares de design, loop de gameplay, campo crônico (run), campo longo (idle), organismo, meta-progressão e próximos passos |
| [personagens.md](personagens.md) | Tipos de molécula ofensora, inimigos e chefes, agentes da run e do idle, matriz de efetividade e desbloqueios |
| [mecanicas.md](mecanicas.md) | Mecânica geral do mundo: ciclo, os quatro pontos de saúde, os dois campos, eixos qualidade/dose/potência, decomposição e reset |
| [economia.md](economia.md) | Moeda (ATP), fórmulas de XP, dificuldade, custo de upgrades, produção do idle, saúde e reset, botões de ajuste |
| [parametros.md](parametros.md) | Todos os atributos do jogo com base, teto na run e teto meta (ofensivos, defensivos, mobilidade, level up, especial, idle, inimigos) |
| [plataforma.md](plataforma.md) | Engine (Phaser 4 + TypeScript, PWA), comparação de engines, arquitetura, controles, salvamento e desempenho |
| [design.md](design.md) | Identidade visual: direção de arte, paleta, tipografia, sprites de moléculas e componentes da tela de batalha |
| [armas.md](armas.md) | Arquétipos de arma do Vampire Survivors, as 7 armas iniciais, evoluções e como a arma chega ao jogador |
| [identidade-visual/](identidade-visual/README.md) | Cópia das pranchetas do canvas de identidade visual: guia de estilo, telas, ícones, itens e mapas, com o que cada uma virou no código |
| [itens.md](itens.md) | Itens no mapa (drops): vesículas, os itens do conjunto do Vampire Survivors com nomes químicos, gemas de XP, cápsula do chefe e como aparecem na run |
| [sonoplastia.md](sonoplastia.md) | Som do jogo: tema chiptune metal, lista de faixas, música dinâmica, efeitos, entrega dos arquivos e os prompts para o app de música |
| [efeitos-sonoros.md](efeitos-sonoros.md) | Lista enxuta de efeitos sonoros (47), com id, quando toca, reaproveitamento, prioridade, regras de mixagem e o prompt de cada um para o app |
| [mapas.md](mapas.md) | Mapas gerados do campo crônico: blocos com semente, ambientes do corpo, chão em tiles, obstáculos, destrutíveis e pontos de interesse |
| [ui-cronico.md](ui-cronico.md) | UI da run (campo crônico): HUD de batalha, tipos de ícone, números de dano, especial, pausa com status e adaptação a qualquer tela |
| [menu.md](menu.md) | Menu principal: análise da referência mobile, hub (status, caso, JOGAR, barra de abas), telas de cada área, placeholders e navegação |
| [atualizacoes.md](atualizacoes.md) | Jogo offline e atualizações: build completa, service worker, aviso só nos menus, publicação atômica |
| [publicacao.md](publicacao.md) | Fase 7: empacotar o jogo web para Android, iOS, Steam e Microsoft Store (Capacitor, Electron, PWABuilder), com cuidados e ordem sugerida |
| [servidor.md](servidor.md) | Ideia futura e não prioritária: contas opcionais, save na nuvem e ranking por organismo e geral |
| [wiki.md](wiki.md) | Textos da wiki dentro do jogo (Compêndio), escritos para o jogador: como jogar, agentes, armas, modificadores, moléculas, progressão, campo longo, organismo e glossário |
| [megabonk.md](megabonk.md) | Run estilo Megabonk: level up só com armas e receptores (tomos), suplementos de ampola, XP com chance, agregados (mini chefes) e sinapses no mapa |
| [lacunas-vs.md](lacunas-vs.md) | O que o Vampire Survivors tem que ainda não desenhamos: lista priorizada com versão química, esforço e perguntas |
| [roadmap.md](roadmap.md) | Fases de desenvolvimento, do protótipo da run ao lançamento, com status, critérios de saída e decisões que travam cada fase |
| [arquitetura.md](arquitetura.md) | Estado atual do código: stack, camadas, estrutura de pastas e princípios |
| [decisoes/](decisoes/README.md) | Registro de decisões técnicas e de design, um arquivo por decisão |

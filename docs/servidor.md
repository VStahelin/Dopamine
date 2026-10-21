# Servidor (ideia para o futuro)

Nota curta de uma ideia **não prioritária**: hoje o jogo roda inteiro no navegador e é publicado no GitHub Pages ([decisão 0018](decisoes/0018-jogo-no-pages-servidor-futuro.md)). Um servidor só entra quando houver algo que o navegador sozinho não faz.

## O que o servidor faria

- **Conta opcional.** O jogador pode jogar sem conta, como hoje. Se quiser, faz login para guardar o progresso fora do aparelho.
- **Save na nuvem.** Com conta, o save (o mesmo formato versionado da [decisão 0005](decisoes/0005-save-local-indexeddb.md)) sobe para o servidor e pode ser continuado em outro aparelho. Sem conta, nada muda: o save segue local.
- **Ranking por organismo e ranking geral.** Cada indivíduo (organismo) tem o seu ranking (melhor tempo, decompostas); um ranking geral junta todos.

## Princípios

- O jogo continua funcionando sem servidor e sem internet ([atualizacoes.md](atualizacoes.md)). O servidor só soma recursos.
- O servidor é uma API, não um host do jogo: o jogo continua no GitHub Pages.
- Ranking aceita resultado do cliente; como o jogo é entre amigos, a validação anti-trapaça pode ser simples no começo.

## Candidatos e perguntas para quando chegar a hora

- Host da API: Render (Web Service já criado) ou um backend pronto (Supabase, Firebase), que traz login e banco de graça.
- Login: com conta Google ou GitHub, ou só um código de amigo, sem e-mail?
- O que conta no ranking por organismo: melhor tempo, decompostas, nível?
- Em que fase entra: depois do organismo (fase 5), quando existirem indivíduos para ranquear.

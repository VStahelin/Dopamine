# Publicação nas plataformas

Como levar o Farmaco Battle além do link do GitHub Pages: lojas de celular, Steam e Microsoft Store. O objetivo de lançar em todas as plataformas está na decisão [0031](decisoes/0031-lancar-em-todas-as-plataformas.md) (proposta) e o trabalho é a fase 7 do [roadmap](roadmap.md). Hoje o jogo é só web/PWA ([0002](decisoes/0002-phaser-4-typescript-pwa.md), [0018](decisoes/0018-jogo-no-pages-servidor-futuro.md)), e o GitHub Pages continua como versão web mesmo depois das lojas. Este arquivo é o mapa técnico, o que combina com a nota de [plataforma.md](plataforma.md) de que dá para empacotar o mesmo jogo web como app nativo sem reescrever.

Valores de taxas e requisitos de loja mudam: conferir nas páginas oficiais antes de pagar ou submeter qualquer coisa.

## Ideia central

O jogo é HTML, JavaScript e WebGL. Cada loja nativa pede um executável ou pacote, então o jogo entra dentro de um **wrapper**: um navegador embutido que abre só o jogo. A mesma pasta `dist/` (saída de `npm run build`) alimenta todos os wrappers; não existe um código por plataforma.

```
src/ ──npm run build──▶ dist/ ──┬─ Capacitor ─▶ Android (.aab) e iOS (.ipa)
                                ├─ Electron ou Tauri ─▶ Windows, Mac e Linux (Steam)
                                └─ PWABuilder ou MSIX ─▶ Microsoft Store (.msix)
```

## Resumo por plataforma

| Destino | Ferramenta | Saída | Esforço | Observação |
| --- | --- | --- | --- | --- |
| Android (Google Play) | Capacitor | `.aab` | baixo | Conta de desenvolvedor com taxa única |
| iPhone e iPad (App Store) | Capacitor | `.ipa` | médio | Exige Mac com Xcode e conta Apple paga por ano |
| Steam (Windows, Mac, Linux) | Electron (ou Tauri) | `.exe`, `.app`, binário Linux | médio | Taxa por app na Steam; integração com Steamworks é opcional |
| Microsoft Store | PWABuilder (a partir do PWA) | `.msix` | baixo | O PWA já existe; precisa ser instalável e offline |
| itch.io | nenhum (zip do `dist/`) | HTML5 | muito baixo | Alternativa barata para testar fora do GitHub Pages |

## Mobile: Capacitor

Capacitor (da equipe do Ionic) pega a pasta `dist/` e a coloca dentro de projetos nativos do Android Studio e do Xcode. É o sucessor do Cordova e o caminho que o blog do Phaser recomenda.

Passo a passo resumido:

1. `npm i -D @capacitor/cli` e `npm i @capacitor/core`, depois `npx cap init` com o id do app (por exemplo `dev.stahelin.dopamina`) e `webDir: "dist"`.
2. `npx cap add android` e `npx cap add ios`.
3. A cada versão: `npm run build`, `npx cap sync`.
4. Android: abrir no Android Studio, gerar o `.aab` assinado e subir no Google Play Console.
5. iOS: abrir no Xcode (só em Mac), assinar e enviar pelo App Store Connect.

Pontos de atenção:

- **Service worker e atualização.** O jogo já é offline pelo service worker ([atualizacoes.md](atualizacoes.md)). Dentro do app nativo os arquivos já vão no pacote, então o aviso de "nova versão" do PWA não faz sentido: a atualização vira a da loja. Desligar o registro do service worker na build nativa (por exemplo, por uma variável de ambiente lida em `vite.config.ts`, como já acontece com `BASE_PATH`).
- **`base` do Vite.** O GitHub Pages usa um subcaminho (`BASE_PATH`); o app nativo carrega da raiz. A build nativa deve usar `base: './'` ou `/`.
- **Save.** O save web fica no armazenamento do navegador do WebView. Ao reinstalar o app ele some, e não é o mesmo save do PWA. Se isso importar, ver [servidor.md](servidor.md) (save na nuvem) ou exportar/importar o save.
- **Tela.** Fixar a orientação, esconder a barra de status, respeitar a área segura (notch) e bloquear zoom e seleção de texto.
- **Desempenho.** O WebView do Android antigo é mais lento que o Chrome atual; testar em um aparelho modesto.
- **Políticas das lojas.** Classificação etária, política de privacidade (mesmo sem coleta de dados) e a questão de o jogo falar de remédios e substâncias reais: usar o tom educativo/químico do jogo e conferir as regras de conteúdo de cada loja antes de submeter.
- **Capturas e ícones.** As lojas pedem ícones em vários tamanhos e capturas de tela por tipo de aparelho. Os ícones do PWA da fase 6 podem ser a base.

## PC e Mac: Steam

A Steam não aceita HTML; pede um executável. Duas opções:

| | Electron | Tauri |
| --- | --- | --- |
| Navegador | Chromium embutido (igual em todo sistema) | WebView do sistema (Edge WebView2, WebKit) |
| Tamanho | cerca de 100 MB a mais | poucos MB |
| Memória | maior | menor |
| Risco de WebGL | baixo | maior: o WebView do sistema varia de máquina para máquina |
| Steamworks | bibliotecas maduras (`steamworks.js`) | menos opções |
| Referência | Vampire Survivors começou assim | mais novo, exige Rust |

**Recomendação: Electron.** Para um jogo WebGL, ter o mesmo Chromium em toda máquina vale mais que economizar tamanho. Tauri só se o tamanho virar problema real.

Passo a passo resumido (Electron):

1. Pasta `desktop/` (ou similar) com `main.js` que abre uma janela carregando o `dist/` (de preferência por um protocolo próprio, não `file://`, para o service worker e o `fetch` funcionarem).
2. Empacotar com `electron-builder` ou Electron Forge: `.exe` (Windows), `.app`/`.dmg` (Mac), AppImage (Linux).
3. Criar o app no Steamworks (taxa por app), configurar depots e subir o build com o SteamCmd.
4. Opcional: conquistas e nuvem da Steam via `steamworks.js` (a aba Conquistas é só uma ideia futura no [roadmap](roadmap.md)).

Pontos de atenção:

- **Teclado e mouse.** O jogo nasceu para toque e joystick virtual; no PC já há controles de teclado ([plataforma.md](plataforma.md)). Para a Steam, revisar menus com mouse, tela cheia (F11/Alt+Enter), atalhos e suporte a controle (Gamepad API).
- **Layout em telas largas.** Item da fase 6 que passa a ser exigência prática na Steam.
- **Save.** Gravar em arquivo na pasta de dados do usuário, não no `localStorage`, para sobreviver a limpezas e permitir a nuvem da Steam.
- **Mac.** Distribuir fora da Mac App Store exige assinatura e notarização (conta Apple paga).
- **Página da loja.** Trailer, capturas, descrição e classificação etária dão mais trabalho que o empacotamento.

## Microsoft Store

Dois caminhos:

1. **PWA direto (preferido).** O PWABuilder (oficial da Microsoft) lê a URL publicada do jogo e gera o pacote `.msix`. Exige manifest completo, ícones e service worker funcionando, que o jogo já tem em boa parte. Só falta o polimento de instalação do item da fase 6.
2. **Pelo Electron.** Se já existir a build da Steam, a MSIX Packaging Tool (ou o próprio `electron-builder`, alvo `appx`) converte para `.msix`.

A conta de desenvolvedor da Microsoft para pessoa física tem taxa única baixa.

## Ordem sugerida

1. **Terminar a fase 6** (ícones do PWA, layout largo, som). Serve a todas as plataformas.
2. **itch.io** (opcional): teste barato com desconhecidos, sem wrapper.
3. **Microsoft Store via PWABuilder**: quase de graça, aproveita o PWA.
4. **Android via Capacitor**: o mais barato das lojas de celular.
5. **Steam via Electron**: mais trabalho (loja, save em arquivo, controles), maior alcance.
6. **iOS**: por último, por exigir Mac e conta anual; o PWA já cobre o iPhone via "Adicionar à Tela de Início".

## O que preparar no código antes (sem custo)

- Uma flag de build (`TARGET=web|native|desktop`) que controla `base`, service worker e o caminho do save, em vez de ramificar o código do jogo.
- Camada de save atrás de uma interface em `src/core/save/` com implementações trocáveis (navegador, arquivo, nuvem). A lógica já está separada do Phaser, o que ajuda.
- Nada de depender de `window.location` ou de URLs absolutas para assets.

## Perguntas em aberto

- [ ] Qual plataforma primeiro: Microsoft Store, Android ou Steam?
- [ ] Preço: gratuito, pago ou gratuito com apoio? Muda as contas de loja e os formulários fiscais.
- [ ] O tema de remédios e substâncias reais passa nas regras de conteúdo de cada loja?
- [ ] Save na nuvem entre PWA, celular e Steam entra antes ou depois do lançamento nas lojas?
- [ ] Nome e id do app (`dev.stahelin.dopamina`?) e conta de desenvolvedor em nome do Vitor ou de uma empresa.

## Fontes

- [Phaser: Capacitor para mobile](https://phaser.io/news) (tutoriais do blog oficial)
- [Capacitor](https://capacitorjs.com/docs)
- [Electron](https://www.electronjs.org/docs/latest/) e [electron-builder](https://www.electron.build/)
- [Tauri](https://tauri.app/)
- [PWABuilder](https://docs.pwabuilder.com/)
- [Steamworks](https://partner.steamgames.com/doc/home)

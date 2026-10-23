# Logo

A logo do Farmaco Battle em pixel art, com as variantes, os ícones do app e as artes de loja. Ela parte da FARMACO / BATTLE que a tela de título já usava (faixa vermelha inclinada, laranja e verde, contorno grosso e sombra dura; veja [design.md](design.md)) e a redesenha inteira em pixels.

- Prancheta: "Logo e ícones" no [canvas de identidade visual](https://claude.ai/artifact/MPV17zZywrhhXBUdfnUs6F), cópia em [identidade-visual/Logo.dc.html](identidade-visual/Logo.dc.html).
- Dados: [src/assets/sprites/logo.json](../src/assets/sprites/logo.json) (nome, fonte, emblemas e paleta).
- Desenho: [src/game/render/logoArt.ts](../src/game/render/logoArt.ts), que monta todas as variantes a partir dos dados.
- Arquivos: `npm run sprites:build` gera os PNGs em `public/sprites/` junto com os outros sprites ([decisão 0020](decisoes/0020-sprites-em-png-por-tamanho.md)), e o `npm run check` confere se estão em dia.

## Trocar o nome

O nome não é imagem: é texto escrito por uma fonte em pixel que mora em `logo.json`. Para trocar a grafia (por exemplo, FÁRMACO com acento), mude `name` em `logo.json` e rode `npm run sprites:build`. Todas as variantes, os ícones e as artes de loja saem de novo. Na prancheta, o mesmo vale pelos Tweaks (linha 1 e linha 2), menos o banner e a abertura, que são os PNGs do jogo.

A fonte tem as 26 letras maiúsculas e o espaço, mais Á, À, Â, Ã, É, Ê, Í, Ó, Ô, Õ, Ú e Ç. O acento fica 1 pixel acima da letra e a faixa cresce para caber; a cedilha fica embaixo.

## Construção

| Peça | Como é |
| --- | --- |
| Fonte | Maiúsculas de 5×7 (o I tem 3 de largura), 1 pixel entre letras. Na logo grande cada pixel vira 2×2 e o traço vertical ganha mais 1 pixel (negrito), então o traço tem 3 pixels e a letra, 14 de altura. |
| Pintura das letras | Linha de cima de cada traço clara, linha de baixo escura, miolo na cor cheia; contorno de 1 pixel em volta (diagonais também) e sombra dura de 2 pixels para baixo na cor do contorno. |
| Cores | FARMACO: #FFD08A, #FF9A1F, #C25E14, contorno #3A0A0C. BATTLE: #B4F58A, #6CD43F, #3A9A24, contorno #123A0C. Faixa: #E0433A, #B8262A, #7A1416, contorno #3A0A0C. |
| Inclinação | No lugar da rotação de −5°, cada letra sobe 1 pixel em relação à anterior. A faixa acompanha os degraus. |
| Faixa | Retângulo em degraus atrás de FARMACO, com 6 pixels de folga dos lados e 4 em cima e embaixo, e cortes em V nas pontas, como fita. |
| Emblema | Cápsula laranja e verde (as cores do nome) na diagonal, acertando uma molécula: um átomo de oxigênio (vermelho) e um de nitrogênio (azul) se soltam com dois brilhos. Contorno #3A0A0C e costura escura entre as metades. |

## Variantes

Tamanhos em pixels de arte (1×). Use sempre em escala inteira (2×, 3×, 4×...), nunca entre elas, para não borrar.

| Variante | Tamanho | Uso | Arquivo |
| --- | --- | --- | --- |
| Principal (empilhada) | 112×55 | Tela de título (2× ou 3×), carregamento (2×), artes de loja | `logo/stacked.png`, `logo/4x/stacked.png` |
| Horizontal | 193×18 | Faixas largas, cabeçalhos, rodapés, a página do jogo | `logo/horizontal.png`, `logo/4x/horizontal.png` |
| Pequena (legível) | 82×10 | Onde só cabe uma linha baixa: créditos, selo, rodapé de tela | `logo/small.png`, `logo/4x/small.png` |
| Emblema 32 | 32×32 | Ícone do app, avatar, carimbo | dentro dos ícones do PWA |
| Emblema 16 | 16×16 | Favicon e ícones minúsculos; é um desenho próprio, não o de 32 reduzido | `pwa/favicon-16.png`, `pwa/favicon-32.png` |

Com acento na primeira linha, a empilhada passa a 112×61 e a pequena a 82×13.

### Fundo claro e escuro

A versão colorida é a mesma nos dois fundos: o contorno grosso vermelho-escuro separa a logo do fundo noite (#15172E) e do creme (#F4EFE0). A prancheta mostra as duas lado a lado.

### Monocromáticas

Uma tinta só, para marca-d'água, carimbo e impressão: creme (#F4EFE0) sobre fundo escuro e noite (#15172E) sobre fundo claro. As letras e o emblema viram a tinta, o contorno e a sombra somem (a costura da cápsula vira um vão) e a faixa fica só com o contorno, vazada. Arquivos `logo/4x/<variante>-mono-creme.png` e `-mono-noite.png`.

## Ícones do app

| Arquivo | Tamanho | Como é | Onde |
| --- | --- | --- | --- |
| `pwa/icon-192.png`, `pwa/icon-512.png` | 192, 512 | Emblema de 32 numa placa com moldura de madeira (como os espaços de ícone do jogo) e um disco do painel atrás | manifest, `purpose: any` |
| `pwa/maskable-192.png`, `pwa/maskable-512.png` | 192, 512 | Fundo noite até a borda, emblema dentro do círculo seguro (80% do lado) | manifest, `purpose: maskable` |
| `pwa/apple-touch-icon.png` | 180 | Igual ao maskable, sem transparência (o iOS arredonda os cantos) | `index.html` |
| `pwa/favicon-16.png`, `pwa/favicon-32.png` | 16, 32 | Emblema de 16, fundo transparente | `index.html` |

## Artes de loja

| Arquivo | Tamanho | Uso |
| --- | --- | --- |
| `store/banner-1024x500.png` | 1024×500 | Banner de loja (o "feature graphic" do Google Play), cabeçalho de página |
| `store/splash-1080x1920.png` | 1080×1920 | Tela de abertura em pé, divulgação no celular |

Fundo noite com o pontilhado dos painéis e átomos soltos; a logo empilhada no centro em escala inteira. As artes de loja e a logo em 4× ficam fora do precache do PWA: o jogo não precisa delas.

## Em aberto

- A grafia com ou sem acento (FARMACO ou FÁRMACO): o Vitor ainda não decidiu. Hoje está sem acento.

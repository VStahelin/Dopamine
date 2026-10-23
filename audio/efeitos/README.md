# Efeitos sonoros gerados

Pasta para os efeitos sonoros que saem do app de geração, do jeito que foram exportados, antes de qualquer corte. A lista de efeitos, com o id e o prompt de cada um, está em [docs/efeitos-sonoros.md](../../docs/efeitos-sonoros.md).

Esta pasta fica fora de `public/`, então nada daqui entra no jogo nem no deploy. As versões finais, cortadas e convertidas para OGG e M4A, vão para `public/audio/sfx/`.

## Como nomear

`<id>.<extensão>`, com o id da lista de efeitos. Se gerar mais de uma versão, `<id>-<versão>.<extensão>`. Exemplo: `hurt.wav`, `specialDopamine-1.mp3`, `specialDopamine-2.mp3`.

Pode subir em qualquer formato que o app exportar (WAV, MP3, M4A); o corte e a conversão são feitos depois.

## Escolhidos

Quando escolher a versão que vai para o jogo, anote aqui, com o app usado.

| Id | Arquivo | App | Observação |
| --- | --- | --- | --- |

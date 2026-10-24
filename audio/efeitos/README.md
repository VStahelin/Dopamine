# Efeitos sonoros gerados

Pasta para os efeitos sonoros que saem do app de geração, do jeito que foram exportados, antes de qualquer corte. A lista de efeitos, com o id e o prompt de cada um, está em [docs/efeitos-sonoros.md](../../docs/efeitos-sonoros.md).

Esta pasta fica fora de `public/`, então nada daqui entra no jogo nem no deploy. As versões finais, cortadas e convertidas para OGG e M4A, vão para `public/audio/sfx/`, geradas por `python3 tools/audio/sfx.py` a partir do campo `source` de cada efeito em `src/config/audio.json`.

## Como nomear

`<id>.<extensão>`, com o id da lista de efeitos. Se gerar mais de uma versão, `<id>-<versão>.<extensão>`. Exemplo: `hurt.wav`, `specialDopamine-1.mp3`, `specialDopamine-2.mp3`.

Pode subir em qualquer formato que o app exportar (WAV, MP3, M4A); o corte e a conversão são feitos depois.

## Escolhidos

Quando escolher a versão que vai para o jogo, anote aqui, com o app usado.

| Id | Arquivo | App | Observação |
| --- | --- | --- | --- |
| `hurt` | Hurt.mp3 | | |
| `hurtHeavy` | hurtHeavy.mp3 | | |
| `heal` | heal.mp3 | | |
| `lowHealth` | lowHealth.mp3 | | |
| `revive` | revive.mp3 | | |
| `death` | death.mp3 | | |
| `dodge` | dodge.mp3 | | |
| `shieldBlock` | shieldBlock.mp3 | | |
| `specialReady` | specialReady.mp3 | | |
| `absorb` | absorb.mp3 | | |
| `acidFire` | acidFire.mp3 | | |
| `alarm` | alarm.mp3 | | |
| `ampouleBreak` | ampouleBreak.mp3 | | |
| `atp` | atp.mp3 | | |
| `banish` | banish.mp3 | | |
| `beam` | beam.mp3 | | |
| `bigBoom` | bigBoom.mp3 | | |
| `bossSpawn` | bossSpawn.mp3 | | |
| `cardPick` | cardPick.mp3 | | |
| `crit` | crit.mp3 | | |
| `explosion` | explosion.mp3 | | |
| `freeze` | freeze.mp3 | | |
| `gem` | gem.mp3 | | |
| `itemPickup` | itemPickup.mp3 | | |
| `pulse` | pulse.mp3 | | |
| `radicalFire` | radicalFire.mp3 | | |
| `reroll` | reroll.mp3 | | |
| `reveal` | reveal.mp3 | | |
| `revealLegendary` | revealLegendary.mp3 | | |
| `specialAlcoholDehydrogenase` | specialAlcoholDehydrogenase.mp3 | | |
| `specialCaffeine` | specialCaffeine.mp3 | | |
| `specialDopamine` | specialDopamine.mp3 | | |
| `specialInsulin` | specialInsulin.mp3 | | |
| `specialLipase` | specialLipase.mp3 | | |
| `specialOxytocin` | specialOxytocin.mp3 | | |
| `specialSerotonin` | specialSerotonin.mp3 | | |
| `specialVenvanse` | specialVenvanse.mp3 | | |
| `specialVitaminC` | specialVitaminC.mp3 | | |
| `splash` | splash.mp3 | | |
| `strike` | strike.mp3 | | |
| `synapseCharge` | synapseCharge.mp3 | | |
| `synapseFire` | synapseFire.mp3 | | |
| `uiBack` | uiBack.mp3 | | |
| `uiBuy` | uiBuy.mp3 | | |
| `uiConfirm` | uiConfirm.mp3 | | |
| `uiError` | uiError.mp3 | | |
| `uiTap` | uiTap.mp3 | | |
| `uiUnlock` | uiUnlock.mp3 | | |
| `vesicleBreak` | vesicleBreak.mp3 | | |
| `whoosh` | whoosh.mp3 | | |
| `zap` | zap.mp3 | | |

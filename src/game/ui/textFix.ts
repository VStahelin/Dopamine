import * as Phaser from 'phaser';

/**
 * A Pixelify Sans troca "fi" e "fl" por ligaduras que saem erradas no canvas ("ficha" vira
 * "Acha"). O canvas não deixa desligar ligaduras, então todo texto do jogo ganha um separador
 * invisível (U+200C) depois do "f".
 */
export function breakLigatures(text: string): string {
  return text.replace(/f(?=[il])/g, 'f‌');
}

const originalSetText = Phaser.GameObjects.Text.prototype.setText;
Phaser.GameObjects.Text.prototype.setText = function (value: string | string[]) {
  const fixed = Array.isArray(value) ? value.map(breakLigatures) : breakLigatures(String(value));
  return originalSetText.call(this, fixed);
};

/**
 * Telas 1× (PC com densidade 1): o texto nasce com o dobro da resolução (setTextResolution) e é
 * reduzido de forma suave. Sem isso, letras de 10 px saem pixel a pixel e o 2, o 5 e o 8 se
 * confundem. No celular a resolução já é igual ao zoom e o texto continua nítido.
 */
const setTextWithLigatures = Phaser.GameObjects.Text.prototype.setText;
Phaser.GameObjects.Text.prototype.setText = function (value: string | string[]) {
  const result = setTextWithLigatures.call(this, value);
  const zoom = this.scene?.cameras?.main?.zoom ?? 1;
  if (this.style.resolution > zoom) this.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
  return result;
};

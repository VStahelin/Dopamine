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

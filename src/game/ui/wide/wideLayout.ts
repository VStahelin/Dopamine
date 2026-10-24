import type * as Phaser from 'phaser';
import { PALETTE } from '../../render/palette';
import { drawIcon, type IconName } from '../icons';

/**
 * Medidas do menu no PC (pranchetas "Menu no PC" do canvas, docs/menu.md, Tela larga): barra
 * de status no topo, trilho de abas à esquerda e o conteúdo da aba em colunas ao lado.
 */
export const WIDE = {
  /** Largura e altura lógicas mínimas para trocar para o layout de PC. */
  minWidth: 1100,
  minHeight: 600,
  topH: 76,
  railW: 208,
  pad: 20,
  gap: 20,
} as const;

/** Tela larga o bastante para o menu de PC (deitada, com pelo menos 1100×600 lógicos). */
export function isWideMenu(w: number, h: number): boolean {
  return w > h && w >= WIDE.minWidth && h >= WIDE.minHeight;
}

export type Obj = Phaser.GameObjects.GameObject;

/** Área clicável invisível que dispara ao soltar. */
export function addZone(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  onClick: () => void,
): Obj {
  const zone = scene.add.zone(x + w / 2, y + h / 2, w, h).setInteractive({ useHandCursor: true });
  zone.on('pointerup', onClick);
  return zone;
}

/** Botão azul secundário (sem texto): contorno, painel, brilho em cima e sombra embaixo. */
export function drawBlueButton(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  g.fillStyle(PALETTE.ink).fillRect(x, y, w, h);
  g.fillStyle(PALETTE.panel).fillRect(x + 3, y + 3, w - 6, h - 6);
  g.fillStyle(PALETTE.panelHi).fillRect(x + 3, y + 3, w - 6, 3);
  g.fillStyle(PALETTE.panelShade).fillRect(x + 3, y + h - 6, w - 6, 3);
}

/** Botão de madeira (aba ativa, JOGAR compacto). `dark` usa a madeira escura da aba Caso. */
export function drawWoodButton(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  dark = false,
): void {
  g.fillStyle(PALETTE.outline).fillRect(x, y, w, h);
  g.fillStyle(dark ? PALETTE.woodDark : PALETTE.wood).fillRect(x + 3, y + 3, w - 6, h - 6);
  g.fillStyle(dark ? PALETTE.wood : PALETTE.woodHi).fillRect(x + 3, y + 3, w - 6, 3);
  g.fillStyle(dark ? 0x7a3510 : PALETTE.woodShade).fillRect(x + 3, y + h - 7, w - 6, 4);
}

/** Painel com moldura de madeira por dentro (ficha, detalhe, cartão em destaque). */
export function drawFramedPanel(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  g.fillStyle(PALETTE.outline).fillRect(x, y, w, h);
  g.fillStyle(PALETTE.wood).fillRect(x + 3, y + 3, w - 6, h - 6);
  g.fillStyle(PALETTE.ink).fillRect(x + 6, y + 6, w - 12, h - 12);
  g.fillStyle(PALETTE.night).fillRect(x + 8, y + 8, w - 16, h - 16);
}

/** Moldura de foco (o item aberto na ficha), em ciano, por fora da caixa. */
export function drawFocus(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  color: number = PALETTE.water,
): void {
  g.fillStyle(color);
  g.fillRect(x, y, w, 3)
    .fillRect(x, y + h - 3, w, 3)
    .fillRect(x, y, 3, h)
    .fillRect(x + w - 3, y, 3, h);
}

/** Ícone de 8×8 centrado numa caixa. */
export function drawIconCentered(
  g: Phaser.GameObjects.Graphics,
  name: IconName,
  x: number,
  y: number,
  size: number,
  color: number,
  pixel: number,
): void {
  const off = Math.floor((size - 8 * pixel) / 2);
  drawIcon(g, name, x + off, y + off, color, pixel);
}

/** Tela de referência do menu no PC: o zoom é o maior inteiro que ainda deixa 1280×720. */
const WIDE_BASE = { width: 1280, height: 720 };

/**
 * Tamanho mínimo para `setupUiLayout` das telas de menu: o do PC quando a tela (em pixels do
 * aparelho) cabe o layout largo; senão o do celular em pé, `portrait`.
 */
export function menuMinSize(portrait: { width: number; height: number }) {
  return (width: number, height: number) => {
    const zoom = Math.max(
      1,
      Math.floor(Math.min(width / WIDE_BASE.width, height / WIDE_BASE.height)),
    );
    return isWideMenu(width / zoom, height / zoom) ? WIDE_BASE : portrait;
  };
}

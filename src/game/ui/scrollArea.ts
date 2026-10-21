import * as Phaser from 'phaser';

/** Onde o conteúdo rolável mora no mundo da cena, longe de tudo o que a câmera principal vê. */
const FAR_X = 100_000;

export interface ScrollArea {
  /**
   * Separa as câmeras: a principal deixa de desenhar o conteúdo rolável e a da área deixa de
   * desenhar o resto da tela. Chame depois de montar a tela inteira.
   */
  isolate(): void;
  destroy(): void;
}

/**
 * Área com rolagem vertical (roda do mouse ou arrastar) para listas maiores que a tela. Usa uma
 * câmera própria do tamanho da área: ela recorta o conteúdo sem máscara e mantém o zoom inteiro
 * da tela. `objects` vêm em coordenadas lógicas normais, como se não houvesse rolagem.
 */
export function addScrollArea(
  scene: Phaser.Scene,
  objects: Phaser.GameObjects.GameObject[],
  area: { x: number; y: number; width: number; height: number },
): ScrollArea {
  const zoom = scene.cameras.main.zoom;
  const container = scene.add.container(FAR_X, 0, objects);
  const bounds = container.getBounds();
  // Folga no fim para o último item não ficar embaixo de botões que invadem a área.
  const max = Math.max(0, bounds.bottom - area.y - area.height + 48);
  const cam = scene.cameras
    .add(area.x * zoom, area.y * zoom, area.width * zoom, area.height * zoom)
    .setOrigin(0, 0)
    .setZoom(zoom);
  let offset = 0;
  const apply = () => cam.setScroll(FAR_X + area.x, area.y + offset);
  apply();

  const inside = (p: Phaser.Input.Pointer) => {
    const x = p.x / zoom;
    const y = p.y / zoom;
    return x >= area.x && x <= area.x + area.width && y >= area.y && y <= area.y + area.height;
  };
  const scroll = (dy: number) => {
    offset = Phaser.Math.Clamp(offset + dy, 0, max);
    apply();
  };
  const onWheel = (p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => {
    if (inside(p)) scroll(dy * 0.5);
  };
  let lastY: number | undefined;
  const onDown = (p: Phaser.Input.Pointer) => {
    lastY = inside(p) ? p.y : undefined;
  };
  const onMove = (p: Phaser.Input.Pointer) => {
    if (lastY === undefined || !p.isDown) return;
    scroll((lastY - p.y) / zoom);
    lastY = p.y;
  };
  const onUp = () => (lastY = undefined);
  if (max > 0) {
    scene.input.on('wheel', onWheel);
    scene.input.on('pointerdown', onDown);
    scene.input.on('pointermove', onMove);
    scene.input.on('pointerup', onUp);
  }

  return {
    isolate() {
      scene.cameras.main.ignore(container);
      const others = scene.children.list.filter((o) => o !== container);
      cam.ignore(others);
    },
    destroy() {
      scene.input.off('wheel', onWheel);
      scene.input.off('pointerdown', onDown);
      scene.input.off('pointermove', onMove);
      scene.input.off('pointerup', onUp);
      scene.cameras.remove(cam);
      container.destroy();
    },
  };
}

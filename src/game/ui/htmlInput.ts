import * as Phaser from 'phaser';
import { PALETTE_CSS } from '../render/palette';
import { FONT_MAIN } from './theme';

export interface HtmlInput {
  el: HTMLInputElement;
  /** Muda a caixa lógica (depois de um novo layout). */
  move: (area: Area) => void;
}

type Area = { x: number; y: number; width: number; height: number };

/**
 * Campo de texto de verdade (um `<input>` da página) por cima de uma caixa desenhada no canvas,
 * para a busca do Compêndio: abre o teclado no celular e aceita colar. Some quando a cena fecha.
 */
export function addHtmlInput(
  scene: Phaser.Scene,
  start: Area,
  o: { placeholder: string; value: string; fontSize: number; onInput: (value: string) => void },
): HtmlInput {
  let area = start;
  const input = document.createElement('input');
  input.type = 'search';
  input.placeholder = o.placeholder;
  input.value = o.value;
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.setAttribute('aria-label', o.placeholder);
  Object.assign(input.style, {
    position: 'fixed',
    margin: '0',
    padding: '0',
    border: '0',
    outline: 'none',
    background: 'transparent',
    color: PALETTE_CSS.text,
    fontFamily: FONT_MAIN,
    fontWeight: '600',
    zIndex: '5',
  } satisfies Partial<CSSStyleDeclaration>);
  document.body.appendChild(input);

  // O canvas é escalado pelo FIT e a câmera tem zoom inteiro: converte a caixa lógica em CSS.
  const place = () => {
    const rect = scene.game.canvas.getBoundingClientRect();
    const k = (rect.width / scene.scale.width) * scene.cameras.main.zoom;
    Object.assign(input.style, {
      left: `${rect.left + area.x * k}px`,
      top: `${rect.top + area.y * k}px`,
      width: `${area.width * k}px`,
      height: `${area.height * k}px`,
      fontSize: `${o.fontSize * k}px`,
    });
  };
  place();
  input.addEventListener('input', () => o.onInput(input.value));
  // Teclas digitadas no campo não chegam aos atalhos do jogo (Esc ainda fecha o campo).
  input.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Escape') input.blur();
  });
  scene.scale.on(Phaser.Scale.Events.RESIZE, place);
  const remove = () => {
    scene.scale.off(Phaser.Scale.Events.RESIZE, place);
    input.remove();
  };
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, remove);
  scene.events.once(Phaser.Scenes.Events.DESTROY, remove);
  return {
    el: input,
    move: (next) => {
      area = next;
      place();
    },
  };
}

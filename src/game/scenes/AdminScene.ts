import * as Phaser from 'phaser';
import { runCommand } from '../../core/admin/commands';
import { activeRun, disableAdmin, restoreRealSave } from '../admin/admin';
import { PALETTE, PALETTE_CSS } from '../render/palette';
import { getSave, setSave } from '../storage/saveStore';
import { addButton } from '../ui/button';
import { addHtmlInput, type HtmlInput } from '../ui/htmlInput';
import { drawFramedPanel } from '../ui/wide/wideLayout';
import { bodyText, formatTime, impactText, labelText } from '../ui/theme';
import { addDim, setupUiLayout } from '../ui/uiLayout';
import { SCENES } from './keys';

type Obj = Phaser.GameObjects.GameObject;

/** Botões rápidos: rótulo e o comando que rodam. */
const RUN_BUTTONS: [string, string][] = [
  ['FF 5', 'ff 5'],
  ['FF 10', 'ff 10'],
  ['FF 20', 'ff 20'],
  ['TIME 15', 'time 15'],
  ['SEM DANO', 'god'],
  ['+5 NÍVEIS', 'level 5'],
  ['CURAR', 'heal'],
  ['LIMPAR', 'clear'],
  ['AGREGADO', 'aggregate'],
  ['1×', 'speed 1'],
  ['2×', 'speed 2'],
  ['4×', 'speed 4'],
  ['8×', 'speed 8'],
];
const SAVE_BUTTONS: [string, string][] = [
  ['+10K ATP', 'atp 10000'],
  ['3 ESTRELAS', 'stars 3'],
  ['LIBERAR TUDO', 'unlock'],
  ['LAB MÁXIMO', 'lab'],
];
const SPEEDS = [1, 2, 4, 8];
const LOG_LINES = 7;
const BUTTON_H = 32;
const BUTTON_MIN_W = 96;

/**
 * Painel do modo admin (decisão 0039): botões para os comandos mais usados, uma linha de
 * comando e o registro do que rodou. Abre por cima de qualquer tela; por cima da run, a run
 * para enquanto ele estiver aberto.
 */
export class AdminScene extends Phaser.Scene {
  private root?: Phaser.GameObjects.Container;
  private log: string[] = [];
  private input_?: HtmlInput;
  private command = '';
  /** A run estava rodando quando o painel abriu e foi pausada por ele. */
  private pausedRun = false;
  private size = { w: 0, h: 0 };
  /** Teclados das telas de baixo, desligados enquanto o painel está aberto (Esc, Enter). */
  private muted: Phaser.Input.Keyboard.KeyboardPlugin[] = [];

  constructor() {
    super(SCENES.admin);
  }

  create(): void {
    this.log = ['Modo admin. "help" lista os comandos.'];
    this.command = '';
    this.input_ = undefined;
    this.pausedRun = false;
    if (this.scene.isActive(SCENES.run)) {
      this.scene.pause(SCENES.run);
      this.scene.pause(SCENES.hud);
      this.pausedRun = true;
    }
    this.muted = this.scene.manager
      .getScenes(true)
      .filter((s) => s !== this && s.input.keyboard?.enabled)
      .map((s) => s.input.keyboard!);
    for (const k of this.muted) k.enabled = false;
    this.input.keyboard?.on('keydown-ESC', () => this.close());
    this.events.on('admin-close', () => this.close());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.events.off('admin-close'));
    setupUiLayout(this, (w, h) => {
      this.size = { w, h };
      this.build();
    });
  }

  private close(): void {
    for (const k of this.muted) k.enabled = true;
    this.muted = [];
    if (this.pausedRun) {
      this.scene.resume(SCENES.run);
      this.scene.resume(SCENES.hud);
    }
    // O hub mostra ATP, estrelas e desbloqueios: monta de novo com o save novo.
    if (this.scene.isActive(SCENES.hub)) this.scene.get(SCENES.hub).scene.restart();
    this.scene.stop();
  }

  private exec(text: string): void {
    const t = text.trim();
    if (!t) return;
    this.push(`> ${t}`);
    const runScene = activeRun(this.game);
    const [name, arg] = t.split(/\s+/);
    if (name?.toLowerCase() === 'speed') {
      const speed = Number(arg);
      if (!runScene) this.push('speed só funciona durante uma run.');
      else if (!SPEEDS.includes(speed)) this.push(`Uso: speed <${SPEEDS.join('|')}>`);
      else {
        runScene.timeScale = speed;
        this.push(`Velocidade ${speed}×.`);
      }
    } else {
      const result = runCommand({ save: getSave(this), run: runScene?.run }, t);
      if (result.save !== getSave(this)) setSave(this, result.save);
      for (const line of result.message.split('\n')) this.push(line);
    }
    this.build();
  }

  private push(line: string): void {
    this.log.push(line);
    if (this.log.length > 60) this.log.splice(0, this.log.length - 60);
  }

  private build(): void {
    this.root?.destroy();
    const { w, h } = this.size;
    const runScene = activeRun(this.game);
    const run = runScene?.run;
    const save = getSave(this);
    const panelW = Math.min(w - 16, 620);
    const left = Math.floor((w - panelW) / 2);
    const top = 8;
    const inner = panelW - 32;
    const x = left + 16;
    // A moldura vai num desenho embaixo e é feita no fim, quando a altura do painel é conhecida.
    const frame = this.add.graphics();
    const g = this.add.graphics();
    const children: Obj[] = [addDim(this, w, h, 0.8), frame, g];
    let y = top + 16;

    children.push(this.add.text(x, y, 'MODO ADMIN', impactText(18, PALETTE_CSS.gold)));
    const status = run
      ? `RUN ${formatTime(run.time)} · NÍVEL ${run.level} · ${run.enemies.length} MOLÉCULAS · ${
          runScene.timeScale
        }× · ${run.admin.god ? 'SEM DANO · ' : ''}${run.admin.commands} COMANDOS`
      : `SEM RUN · ${Math.floor(save.atp)} ATP · ${save.meta.stars} ESTRELAS`;
    children.push(this.add.text(x, y + 24, status, labelText(8, PALETTE_CSS.textSoft)));
    y += 44;

    const grid = (title: string, buttons: [string, string][]) => {
      children.push(this.add.text(x, y, title, labelText(8, PALETTE_CSS.cyan)));
      y += 14;
      const cols = Math.max(2, Math.floor((inner + 6) / (BUTTON_MIN_W + 6)));
      const bw = Math.floor((inner - 6 * (cols - 1)) / cols);
      buttons.forEach(([label, cmd], i) => {
        children.push(
          addButton(this, {
            x: x + (i % cols) * (bw + 6),
            y: y + Math.floor(i / cols) * (BUTTON_H + 6),
            width: bw,
            height: BUTTON_H,
            label,
            fontSize: 10,
            variant: 'secondary',
            onClick: () => this.exec(cmd),
          }),
        );
      });
      y += Math.ceil(buttons.length / cols) * (BUTTON_H + 6) + 6;
    };
    if (run) grid('RUN', RUN_BUTTONS);
    grid('SAVE', SAVE_BUTTONS);

    // Linha de comando: um <input> da página por cima da caixa, com Enter para rodar.
    children.push(this.add.text(x, y, 'COMANDO', labelText(8, PALETTE_CSS.cyan)));
    y += 14;
    const runW = 96;
    const box = { x, y, width: inner - runW - 6, height: BUTTON_H - 4 };
    g.fillStyle(PALETTE.ink).fillRect(box.x, box.y, box.width, box.height);
    g.fillStyle(PALETTE.panelDeep).fillRect(box.x + 2, box.y + 2, box.width - 4, box.height - 4);
    const field = { x: box.x + 8, y: box.y + 4, width: box.width - 16, height: box.height - 8 };
    if (!this.input_) {
      this.input_ = addHtmlInput(this, field, {
        placeholder: 'give radical 8 · spawn acidograxo 50 · help',
        value: this.command,
        fontSize: 12,
        onInput: (v) => (this.command = v),
        onEnter: (v) => {
          this.exec(v);
          this.command = '';
          if (this.input_) this.input_.el.value = '';
        },
      });
    } else this.input_.move(field);
    children.push(
      addButton(this, {
        x: x + inner - runW,
        y: y - 2,
        width: runW,
        height: BUTTON_H,
        label: 'RODAR',
        fontSize: 11,
        onClick: () => {
          this.exec(this.command);
          this.command = '';
          if (this.input_) this.input_.el.value = '';
        },
      }),
    );
    y += BUTTON_H + 8;

    // Registro: as últimas linhas.
    const logH = LOG_LINES * 14 + 12;
    g.fillStyle(PALETTE.ink).fillRect(x, y, inner, logH);
    children.push(
      this.add.text(x + 8, y + 6, this.log.slice(-LOG_LINES).join('\n'), {
        ...bodyText(10, PALETTE_CSS.cream),
        wordWrap: { width: inner - 16 },
        maxLines: LOG_LINES,
      }),
    );
    y += logH + 10;

    // Pé: voltar ao save real, desligar e fechar.
    const third = Math.floor((inner - 12) / 3);
    children.push(
      addButton(this, {
        x,
        y,
        width: third,
        height: 40,
        label: 'SAVE REAL',
        fontSize: 10,
        variant: 'danger',
        onClick: () => {
          this.push('Voltando ao save de quando o modo foi ligado...');
          this.build();
          void restoreRealSave(this).then((ok) => {
            if (!ok) {
              this.push('Não há cópia do save guardada.');
              this.build();
            }
          });
        },
      }),
      addButton(this, {
        x: x + third + 6,
        y,
        width: third,
        height: 40,
        label: 'DESLIGAR',
        fontSize: 10,
        variant: 'secondary',
        onClick: () => {
          disableAdmin(this);
          this.close();
        },
      }),
      addButton(this, {
        x: x + 2 * (third + 6),
        y,
        width: inner - 2 * (third + 6),
        height: 40,
        label: 'FECHAR',
        fontSize: 11,
        onClick: () => this.close(),
      }),
    );
    y += 40 + 16;

    drawFramedPanel(frame, left, top, panelW, Math.min(h - 16, y - top));
    this.root = this.add.container(0, 0, children);
  }
}

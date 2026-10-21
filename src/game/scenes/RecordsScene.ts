import * as Phaser from 'phaser';
import { PALETTE_CSS } from '../render/palette';
import { getSave } from '../storage/saveStore';
import { drawPanel } from '../ui/button';
import { addButtonColumn } from '../ui/menuLayout';
import { formatTime, impactText, labelText } from '../ui/theme';
import { setupUiLayout } from '../ui/uiLayout';
import { SCENES } from './keys';

export class RecordsScene extends Phaser.Scene {
  private root?: Phaser.GameObjects.Container;

  constructor() {
    super(SCENES.records);
  }

  create(): void {
    const back = () => this.scene.start(SCENES.hub);
    this.input.keyboard?.on('keydown-ESC', back);

    setupUiLayout(this, (w, h) => {
      this.root?.destroy();
      const r = getSave(this).records;
      const rows: [string, string][] = [
        ['MELHOR TEMPO', formatTime(r.bestTimeSeconds)],
        ['MAIOR NÍVEL', String(r.bestLevel)],
        ['MAIS DECOMPOSTAS', String(r.mostKills)],
        ['RUNS JOGADAS', String(r.runs)],
      ];
      const pw = Math.min(w - 32, 260);
      const ph = 24 + rows.length * 26;
      const top = Math.max(16, Math.floor((h - ph - 110) / 2));
      const left = Math.floor((w - pw) / 2);

      const children: Phaser.GameObjects.GameObject[] = [
        this.add.text(w / 2, top, 'RECORDES', impactText(24)).setOrigin(0.5, 0),
        drawPanel(this.add.graphics(), left, top + 40, pw, ph),
      ];
      rows.forEach(([label, value], i) => {
        const y = top + 56 + i * 26;
        children.push(
          this.add.text(left + 14, y + 4, label, labelText(8, PALETTE_CSS.cream)),
          this.add.text(left + pw - 14, y, value, impactText(14)).setOrigin(1, 0),
        );
      });
      const { buttons } = addButtonColumn(this, w, top + 56 + ph, [
        { label: 'VOLTAR', onClick: back, variant: 'secondary' },
      ]);
      children.push(...buttons);
      this.root = this.add.container(0, 0, children);
    });
  }
}

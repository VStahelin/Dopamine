import * as Phaser from 'phaser';
import type { RunResult } from '../../core/run/state';
import type { RecordKind } from '../../core/save/saveData';
import { PALETTE_CSS } from '../render/palette';
import { addButtonColumn } from '../ui/menuLayout';
import { bodyText, formatTime, impactText, labelText } from '../ui/theme';
import { addDim, setupUiLayout } from '../ui/uiLayout';
import { SCENES } from './keys';
import type { RunScene } from './RunScene';

interface GameOverData {
  result: RunResult;
  newRecords: RecordKind[];
}

/** Fim de run: resumo, recordes batidos, jogar de novo ou voltar ao menu. */
export class GameOverScene extends Phaser.Scene {
  private root?: Phaser.GameObjects.Container;

  constructor() {
    super(SCENES.gameOver);
  }

  create(data: GameOverData): void {
    const run = () => this.scene.get(SCENES.run) as RunScene;
    this.input.keyboard?.on('keydown-ENTER', () => run().restartRun());

    setupUiLayout(this, (w, h) => {
      this.root?.destroy();
      const top = Math.max(16, Math.floor(h / 2) - 130);
      const rows: [string, string, RecordKind][] = [
        ['TEMPO', formatTime(data.result.timeSeconds), 'time'],
        ['NÍVEL', String(data.result.level), 'level'],
        ['DECOMPOSTAS', String(data.result.kills), 'kills'],
      ];
      const children: Phaser.GameObjects.GameObject[] = [
        addDim(this, w, h, 0.8),
        this.add
          .text(w / 2, top, 'AGENTE CONSUMIDO', impactText(20, PALETTE_CSS.interaction))
          .setOrigin(0.5, 0),
        this.add
          .text(w / 2, top + 28, 'As interações acabaram.', bodyText(10, PALETTE_CSS.cream))
          .setOrigin(0.5, 0),
      ];
      const colL = Math.floor(w / 2) - 90;
      const colR = Math.floor(w / 2) + 90;
      rows.forEach(([label, value, kind], i) => {
        const y = top + 54 + i * 24;
        children.push(
          this.add.text(colL, y + 4, label, labelText(8, PALETTE_CSS.cream)),
          this.add.text(colR, y, value, impactText(14)).setOrigin(1, 0),
        );
        if (data.newRecords.includes(kind)) {
          children.push(
            this.add
              .text(colR + 6, y + 4, 'RECORDE!', labelText(8, PALETTE_CSS.gold))
              .setOrigin(0, 0),
          );
        }
      });
      const { buttons } = addButtonColumn(this, w, top + 140, [
        { label: 'JOGAR DE NOVO', onClick: () => run().restartRun() },
        { label: 'MENU', onClick: () => run().exitToMenu() },
      ]);
      children.push(...buttons);
      this.root = this.add.container(0, 0, children);
    });
  }
}

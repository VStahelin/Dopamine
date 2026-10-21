import * as Phaser from 'phaser';
import { PALETTE, PALETTE_CSS } from '../render/palette';
import { updates } from '../update/updateManager';
import { addButton } from '../ui/button';
import { drawWoodFrame } from '../ui/icons';
import { bodyText, impactText, withShadow } from '../ui/theme';
import { addDim, setupUiLayout } from '../ui/uiLayout';
import { SCENES } from './keys';

/**
 * Aviso "Nova versão pronta" por cima do hub (docs/atualizacoes.md). Só abre nos menus, com a
 * build nova inteira já no aparelho.
 */
export class UpdatePromptScene extends Phaser.Scene {
  private root?: Phaser.GameObjects.Container;

  constructor() {
    super(SCENES.updatePrompt);
  }

  create(): void {
    updates.markPrompted();
    this.input.keyboard?.on('keydown-ESC', () => this.later());
    setupUiLayout(this, (w, h) => {
      this.root?.destroy();
      const pw = Math.min(w - 32, 320);
      const ph = 210;
      const x = Math.floor((w - pw) / 2);
      const y = Math.floor((h - ph) / 2);
      const g = this.add.graphics();
      drawWoodFrame(g, x, y, pw, ph);
      g.fillStyle(PALETTE.panel).fillRect(x + 7, y + 7, pw - 14, ph - 14);
      const version = updates.state.remoteVersion ? `v${updates.state.remoteVersion}` : '';
      const bw = Math.floor((pw - 48) / 2);
      this.root = this.add.container(0, 0, [
        addDim(this, w, h),
        g,
        this.add
          .text(
            w / 2,
            y + 22,
            'NOVA VERSÃO PRONTA',
            withShadow(impactText(20, PALETTE_CSS.logoOrange), PALETTE_CSS.outline, 2),
          )
          .setOrigin(0.5, 0),
        this.add.text(w / 2, y + 54, version, impactText(14, PALETTE_CSS.cyan)).setOrigin(0.5, 0),
        this.add
          .text(w / 2, y + 82, 'Sua partida e seus recordes continuam salvos.', {
            ...bodyText(12, PALETTE_CSS.textSoft),
            align: 'center',
            wordWrap: { width: pw - 48 },
          })
          .setOrigin(0.5, 0),
        addButton(this, {
          x: x + 16,
          y: y + ph - 66,
          width: bw,
          height: 48,
          label: 'DEPOIS',
          variant: 'secondary',
          fontSize: 13,
          onClick: () => this.later(),
        }),
        addButton(this, {
          x: x + 32 + bw,
          y: y + ph - 66,
          width: bw,
          height: 48,
          label: 'ATUALIZAR',
          fontSize: 13,
          onClick: () => void updates.apply(),
        }),
      ]);
    });
  }

  private later(): void {
    this.scene.stop();
  }
}

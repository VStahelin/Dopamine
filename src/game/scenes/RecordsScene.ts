import * as Phaser from 'phaser';
import { PALETTE, PALETTE_CSS } from '../render/palette';
import { getSave } from '../storage/saveStore';
import { MAP_ENVIRONMENTS, type PassiveId } from '../../config';
import { localsUnlocked } from '../../core/organism/local';
import { floorColor, LOCAL_SHORT } from '../ui/locals';
import { iconTexture } from '../render/textures';
import { drawPanel } from '../ui/button';
import { addIconSlot } from '../ui/iconSlot';
import { addButtonColumn } from '../ui/menuLayout';
import { bodyText, formatTime, impactText, labelText } from '../ui/theme';
import { setupUiLayout } from '../ui/uiLayout';
import { SCENES } from './keys';
import { music } from '../audio/music';

export class RecordsScene extends Phaser.Scene {
  private root?: Phaser.GameObjects.Container;

  constructor() {
    super(SCENES.records);
  }

  create(): void {
    music.setMain('hub');
    const back = () => this.scene.start(SCENES.hub);
    this.input.keyboard?.on('keydown-ESC', back);

    setupUiLayout(this, (w, h) => {
      this.root?.destroy();
      const save = getSave(this);
      const r = save.records;
      // Cada recorde com um ícone da identidade visual (tempo, nível, decompostas, runs, ATP).
      const rows: [string, string, PassiveId][] = [
        ['MELHOR TEMPO', formatTime(r.bestTimeSeconds), 'halfLife'],
        ['MAIOR NÍVEL', String(r.bestLevel), 'learning'],
        ['MAIS DECOMPOSTAS', r.mostKills.toLocaleString('pt-BR'), 'catalysisPower'],
        ['RUNS JOGADAS', String(r.runs), 'reroll'],
        ['ATP GUARDADO', save.atp.toLocaleString('pt-BR'), 'luck'],
      ];
      // Melhor tempo por local do corpo (fase 5.12), depois que os locais abrem.
      const locals = localsUnlocked(save.meta.stars, save.organism) ? MAP_ENVIRONMENTS : [];
      const pw = Math.min(w - 32, 260);
      const ph = 24 + rows.length * 30 + (locals.length > 0 ? 22 + locals.length * 20 : 0);
      const top = Math.max(16, Math.floor((h - ph - 110) / 2));
      const left = Math.floor((w - pw) / 2);

      const children: Phaser.GameObjects.GameObject[] = [
        this.add.text(w / 2, top, 'RECORDES', impactText(24)).setOrigin(0.5, 0),
        drawPanel(this.add.graphics(), left, top + 40, pw, ph),
      ];
      rows.forEach(([label, value, icon], i) => {
        const y = top + 54 + i * 30;
        const slot = addIconSlot(this, left + 12, y, 1, {
          frame: 'passive',
          icon: iconTexture('passives', icon),
        });
        children.push(
          ...slot.objects,
          this.add.text(left + 12 + slot.size + 8, y + 7, label, labelText(8, PALETTE_CSS.cream)),
          this.add.text(left + pw - 14, y + 3, value, impactText(14)).setOrigin(1, 0),
        );
      });
      if (locals.length > 0) {
        const ly = top + 54 + rows.length * 30 + 4;
        children.push(
          this.add.text(left + 14, ly, 'MELHOR POR LOCAL', labelText(8, PALETTE_CSS.sectionOrange)),
        );
        const g = this.add.graphics();
        children.push(g);
        locals.forEach((env, i) => {
          const y = ly + 20 + i * 20;
          g.fillStyle(PALETTE.ink).fillRect(left + 14, y + 1, 12, 12);
          g.fillStyle(env === 'blood' ? PALETTE.interaction : floorColor(env, 3)).fillRect(
            left + 16,
            y + 3,
            8,
            8,
          );
          const best = r.bestTimeByLocal[env] ?? 0;
          children.push(
            this.add.text(left + 32, y + 2, LOCAL_SHORT[env], labelText(8, PALETTE_CSS.cream)),
            this.add
              .text(left + pw - 14, y, best > 0 ? formatTime(best) : '--:--', bodyText(11))
              .setOrigin(1, 0),
          );
        });
      }
      const { buttons } = addButtonColumn(this, w, top + 56 + ph, [
        { label: 'VOLTAR', onClick: back, variant: 'secondary' },
      ]);
      children.push(...buttons);
      this.root = this.add.container(0, 0, children);
    });
  }
}

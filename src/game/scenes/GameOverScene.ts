import * as Phaser from 'phaser';
import { ORGANISM, WEAPONS, type Sector, type WeaponId } from '../../config';
import type { RunResult } from '../../core/run/state';
import type { RecordKind } from '../../core/save/saveData';
import { PALETTE, PALETTE_CSS } from '../render/palette';
import { addIconSlot, slotSize, weaponIcon } from '../ui/iconSlot';
import { addButtonColumn } from '../ui/menuLayout';
import { bodyText, formatTime, impactText, labelText } from '../ui/theme';
import { addDim, setupUiLayout } from '../ui/uiLayout';
import { SCENES } from './keys';
import type { RunScene } from './RunScene';

export interface GameOverData {
  result: RunResult;
  newRecords: RecordKind[];
  /** Dano de cada arma na run, do maior para o menor. */
  damage: { id: WeaponId; value: number }[];
  /** A run acabou pelo Desistir da pausa, e não pelas interações. */
  gaveUp: boolean;
  /** Estrelas do caso conquistadas nesta run e o ATP que elas puseram no baú. */
  newStars: number;
  starReward: number;
  /** Quanto cada setor de saúde mudou com esta run. */
  healthChange: { sector: Sector; delta: number }[];
}

const ROW_H = 24;
const DAMAGE_ROWS = 6;

/** Fim de run: resumo, ATP ganho, dano por arma com os ícones, recordes, jogar de novo ou menu. */
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
      const rows: [string, string, RecordKind | null][] = [
        ['TEMPO', formatTime(data.result.timeSeconds), 'time'],
        ['NÍVEL', String(data.result.level), 'level'],
        ['DECOMPOSTAS', data.result.kills.toLocaleString('pt-BR'), 'kills'],
        ['ATP GANHO', data.result.atp.toLocaleString('pt-BR'), null],
        ['MAPA', data.result.mapName.split(' · ')[0]!.toUpperCase(), null],
        ...(data.newStars > 0
          ? ([
              [
                data.newStars > 1 ? `${data.newStars} ESTRELAS NOVAS` : 'ESTRELA NOVA',
                `+${data.starReward} NO BAÚ`,
                null,
              ],
            ] as [string, string, RecordKind | null][])
          : []),
      ];
      const damage = data.damage.slice(0, DAMAGE_ROWS);
      const icon = slotSize(1);
      const total = 54 + rows.length * ROW_H + 22 + damage.length * (icon + 4) + 16 + 2 * 50;
      const top = Math.max(16, Math.floor((h - total) / 2));
      const width = Math.min(300, w - 32);
      const left = Math.floor((w - width) / 2);
      const right = left + width;

      const children: Phaser.GameObjects.GameObject[] = [
        addDim(this, w, h, 0.85),
        this.add
          .text(
            w / 2,
            top,
            data.gaveUp ? 'RUN ENCERRADA' : 'AGENTE CONSUMIDO',
            impactText(20, PALETTE_CSS.interaction),
          )
          .setOrigin(0.5, 0),
        this.add
          .text(
            w / 2,
            top + 28,
            data.gaveUp ? 'Você desistiu desta run.' : 'As interações acabaram.',
            bodyText(10, PALETTE_CSS.cream),
          )
          .setOrigin(0.5, 0),
      ];
      rows.forEach(([label, value, kind], i) => {
        const y = top + 54 + i * ROW_H;
        children.push(
          this.add.text(left, y + 4, label, labelText(8, PALETTE_CSS.cream)),
          this.add
            .text(right, y, value, impactText(14, kind ? PALETTE_CSS.hydrogen : PALETTE_CSS.gold))
            .setOrigin(1, 0),
        );
        if (kind && data.newRecords.includes(kind)) {
          children.push(
            this.add
              .text(right - 70, y + 4, 'RECORDE!', labelText(8, PALETTE_CSS.gold))
              .setOrigin(1, 0),
          );
        }
      });

      // Dano por arma: ícone, nome, barra e o número.
      let y = top + 54 + rows.length * ROW_H + 6;
      children.push(
        this.add.text(left, y, 'DANO POR ARMA', labelText(9, PALETTE_CSS.sectionOrange)),
      );
      y += 16;
      const best = Math.max(1, damage[0]?.value ?? 0);
      const g = this.add.graphics();
      children.push(g);
      for (const d of damage) {
        children.push(...addIconSlot(this, left, y, 1, weaponIcon(d.id)).objects);
        const tx = left + icon + 6;
        children.push(
          this.add.text(tx, y, WEAPONS[d.id].name, bodyText(10, PALETTE_CSS.text)),
          this.add
            .text(
              right,
              y,
              Math.round(d.value).toLocaleString('pt-BR'),
              bodyText(10, PALETTE_CSS.text),
            )
            .setOrigin(1, 0),
        );
        const bw = right - tx;
        g.fillStyle(PALETTE.ink).fillRect(tx, y + 15, bw, 7);
        g.fillStyle(PALETTE.panelDeep).fillRect(tx + 1, y + 16, bw - 2, 5);
        g.fillStyle(PALETTE.water).fillRect(
          tx + 1,
          y + 16,
          Math.round(((bw - 2) * d.value) / best),
          5,
        );
        y += icon + 4;
      }

      // Saúde: o que o agente fez no organismo nesta run.
      if (data.healthChange.length > 0) {
        const text = data.healthChange
          .map(
            (c) =>
              `${c.delta > 0 ? '+' : '−'}${Math.abs(c.delta).toFixed(1).replace('.', ',')} ${ORGANISM.sectors[c.sector].name.toUpperCase()}`,
          )
          .join('  ·  ');
        children.push(
          this.add.text(left, y + 4, 'SAÚDE', labelText(9, PALETTE_CSS.sectionOrange)),
          this.add.text(left, y + 18, text, {
            ...bodyText(10, PALETTE_CSS.numberHeal),
            wordWrap: { width },
          }),
        );
        y += 40;
      }
      const { buttons } = addButtonColumn(this, w, y + 12, [
        { label: 'JOGAR DE NOVO', onClick: () => run().restartRun() },
        { label: 'MENU', onClick: () => run().exitToMenu() },
      ]);
      children.push(...buttons);
      this.root = this.add.container(0, 0, children);
    });
  }
}

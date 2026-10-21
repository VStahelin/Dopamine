import * as Phaser from 'phaser';
import { getSave, setSave } from '../storage/saveStore';
import { addButtonColumn } from '../ui/menuLayout';
import { impactText, labelText } from '../ui/theme';
import { PALETTE_CSS } from '../render/palette';
import { updates } from '../update/updateManager';
import type { UpdateStatus } from '../update/updateLogic';
import { setupUiLayout } from '../ui/uiLayout';
import { SCENES } from './keys';

const yesNo = (value: boolean) => (value ? 'SIM' : 'NÃO');

/** Texto do botão de atualização para cada estado do gestor. */
const UPDATE_LABEL: Record<UpdateStatus, string> = {
  upToDate: 'VERIFICAR ATUALIZAÇÃO',
  checking: 'PROCURANDO...',
  downloading: 'BAIXANDO VERSÃO NOVA...',
  ready: 'ATUALIZAR AGORA',
  offline: 'SEM INTERNET · TENTAR',
  unavailable: 'VERIFICAR ATUALIZAÇÃO',
};

const UPDATE_NOTE: Record<UpdateStatus, string> = {
  upToDate: 'EM DIA',
  checking: 'PROCURANDO VERSÃO NOVA',
  downloading: 'BAIXANDO EM SEGUNDO PLANO',
  ready: 'VERSÃO NOVA PRONTA',
  offline: 'SEM INTERNET · O JOGO CONTINUA FUNCIONANDO',
  unavailable: 'ATUALIZAÇÃO INDISPONÍVEL AQUI',
};

/**
 * Opções: mostrar FPS (salvo), tela cheia, versão e verificar atualização (decisão 0016).
 * Volume entra quando o jogo tiver som.
 */
export class OptionsScene extends Phaser.Scene {
  private root?: Phaser.GameObjects.Container;
  private size = { w: 0, h: 0 };

  constructor() {
    super(SCENES.options);
  }

  create(): void {
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start(SCENES.hub));
    setupUiLayout(this, (w, h) => {
      this.size = { w, h };
      this.build();
    });
    const unsubscribe = updates.subscribe(() => this.build());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, unsubscribe);
    this.scale.on(Phaser.Scale.Events.ENTER_FULLSCREEN, this.build, this);
    this.scale.on(Phaser.Scale.Events.LEAVE_FULLSCREEN, this.build, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.ENTER_FULLSCREEN, this.build, this);
      this.scale.off(Phaser.Scale.Events.LEAVE_FULLSCREEN, this.build, this);
    });
  }

  private build(): void {
    this.root?.destroy();
    const { w, h } = this.size;
    const save = getSave(this);
    const top = Math.max(16, Math.floor(h / 2) - 110);

    const { buttons } = addButtonColumn(this, w, top + 44, [
      {
        label: `MOSTRAR FPS: ${yesNo(save.options.showFps)}`,
        variant: 'secondary',
        onClick: () => {
          setSave(this, { ...save, options: { ...save.options, showFps: !save.options.showFps } });
          this.build();
        },
      },
      {
        label: `TELA CHEIA: ${yesNo(this.scale.isFullscreen)}`,
        variant: 'secondary',
        onClick: () => this.scale.toggleFullscreen(),
      },
      {
        label: UPDATE_LABEL[updates.state.status],
        variant: updates.state.status === 'ready' ? 'primary' : 'secondary',
        onClick: () => {
          if (updates.state.status === 'ready') void updates.apply();
          else void updates.check();
        },
      },
      { label: 'VOLTAR', onClick: () => this.scene.start(SCENES.hub) },
    ]);
    const s = updates.state;
    const info = [
      `VERSÃO ${s.currentVersion} · BUILD ${s.currentBuild}`,
      UPDATE_NOTE[s.status] +
        (s.remoteVersion && s.status !== 'upToDate' ? ` · ${s.remoteVersion}` : ''),
    ];
    this.root = this.add.container(0, 0, [
      this.add.text(w / 2, top, 'OPÇÕES', impactText(24)).setOrigin(0.5, 0),
      ...buttons,
      ...info.map((line, i) =>
        this.add
          .text(w / 2, top + 44 + 4 * 50 + 6 + i * 14, line, labelText(8, PALETTE_CSS.textSoft))
          .setOrigin(0.5, 0),
      ),
    ]);
  }
}

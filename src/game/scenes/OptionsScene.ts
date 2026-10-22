import * as Phaser from 'phaser';
import { getSave, setSave } from '../storage/saveStore';
import { addButtonColumn } from '../ui/menuLayout';
import { impactText, labelText } from '../ui/theme';
import { PALETTE_CSS } from '../render/palette';
import { updates } from '../update/updateManager';
import type { UpdateStatus } from '../update/updateLogic';
import { addDim, setupUiLayout } from '../ui/uiLayout';
import { downloadBackup, exportCode, importBackup, pickBackupFile } from '../storage/backup';
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
 * Opções: mostrar FPS e números de dano (salvos), tela cheia, versão e verificar atualização
 * (decisão 0016).
 * Volume entra quando o jogo tiver som. Aberta pela pausa da run, fica por cima dela e volta para
 * ela, sem o botão de atualização (só nos menus, decisão 0016).
 */
export class OptionsScene extends Phaser.Scene {
  private root?: Phaser.GameObjects.Container;
  private size = { w: 0, h: 0 };
  private fromRun = false;
  /** Aviso do backup (exportado, importado, código inválido). */
  private note = '';

  constructor() {
    super(SCENES.options);
  }

  create(data?: { fromRun?: boolean }): void {
    this.fromRun = data?.fromRun ?? false;
    this.input.keyboard?.on('keydown-ESC', () => this.back());
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

  private back(): void {
    if (!this.fromRun) {
      this.scene.start(SCENES.hub);
      return;
    }
    this.scene.stop();
    this.scene.wake(SCENES.pause);
  }

  /** Exportar: copia o código e baixa o arquivo. Importar: cola o código ou escolhe o arquivo. */
  private backupButtons() {
    return [
      {
        label: 'EXPORTAR SAVE',
        variant: 'secondary' as const,
        onClick: () => {
          const save = getSave(this);
          downloadBackup(save);
          void navigator.clipboard
            ?.writeText(exportCode(save))
            .then(() => this.setNote('CÓDIGO COPIADO E ARQUIVO BAIXADO'))
            .catch(() => this.setNote('ARQUIVO DO SAVE BAIXADO'));
          this.setNote('ARQUIVO DO SAVE BAIXADO');
        },
      },
      {
        label: 'IMPORTAR SAVE',
        variant: 'secondary' as const,
        onClick: () => void this.importSave(),
      },
    ];
  }

  private async importSave(): Promise<void> {
    const code = window.prompt('Cole o código do save (ou deixe vazio para escolher o arquivo):');
    const text = code?.trim() ? code : await pickBackupFile();
    if (!text) return;
    const save = importBackup(text);
    if (!save) {
      this.setNote('ESSE CÓDIGO NÃO É UM SAVE DO JOGO');
      return;
    }
    setSave(this, save);
    this.setNote('SAVE IMPORTADO');
  }

  private setNote(note: string): void {
    this.note = note;
    this.build();
  }

  private updateButton() {
    return {
      label: UPDATE_LABEL[updates.state.status],
      variant: updates.state.status === 'ready' ? ('primary' as const) : ('secondary' as const),
      onClick: () => {
        void updates.checkAndApply();
      },
    };
  }

  private build(): void {
    this.root?.destroy();
    const { w, h } = this.size;
    const save = getSave(this);
    const options = [
      {
        label: `MOSTRAR FPS: ${yesNo(save.options.showFps)}`,
        variant: 'secondary' as const,
        onClick: () => {
          const now = getSave(this);
          setSave(this, { ...now, options: { ...now.options, showFps: !now.options.showFps } });
          this.build();
        },
      },
      {
        label: `NÚMEROS DE DANO: ${yesNo(save.options.showDamageNumbers)}`,
        variant: 'secondary' as const,
        onClick: () => {
          const now = getSave(this);
          setSave(this, {
            ...now,
            options: { ...now.options, showDamageNumbers: !now.options.showDamageNumbers },
          });
          this.build();
        },
      },
      {
        label: `TELA CHEIA: ${yesNo(this.scale.isFullscreen)}`,
        variant: 'secondary' as const,
        onClick: () => this.scale.toggleFullscreen(),
      },
      ...(this.fromRun ? [] : [this.updateButton(), ...this.backupButtons()]),
      { label: 'VOLTAR', onClick: () => this.back() },
    ];
    const top = Math.max(16, Math.floor((h - (44 + options.length * 50 + 44)) / 2));
    const { buttons } = addButtonColumn(this, w, top + 44, options);
    const s = updates.state;
    const info = [
      ...(this.note ? [this.note] : []),
      `VERSÃO ${s.currentVersion} · BUILD ${s.currentBuild}`,
      this.fromRun
        ? 'ATUALIZAÇÕES SÓ NOS MENUS'
        : UPDATE_NOTE[s.status] +
          (s.remoteVersion && s.status !== 'upToDate' ? ` · ${s.remoteVersion}` : ''),
    ];
    this.root = this.add.container(0, 0, [
      ...(this.fromRun ? [addDim(this, w, h, 0.85)] : []),
      this.add.text(w / 2, top, 'OPÇÕES', impactText(24)).setOrigin(0.5, 0),
      ...buttons,
      ...info.map((line, i) =>
        this.add
          .text(
            w / 2,
            top + 44 + options.length * 50 + 6 + i * 14,
            line,
            labelText(8, PALETTE_CSS.textSoft),
          )
          .setOrigin(0.5, 0),
      ),
    ]);
  }
}

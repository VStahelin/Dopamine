import * as Phaser from 'phaser';
import { getSave, setSave } from '../storage/saveStore';
import { addButton } from '../ui/button';
import { addScrollArea, type ScrollArea } from '../ui/scrollArea';
import { safeAreaUi } from '../ui/safeArea';
import { bodyText, impactText, labelText, withShadow } from '../ui/theme';
import { PALETTE, PALETTE_CSS } from '../render/palette';
import { updates } from '../update/updateManager';
import type { UpdateStatus } from '../update/updateLogic';
import { addDim, setupUiLayout } from '../ui/uiLayout';
import { downloadBackup, exportCode, importBackup, pickBackupFile } from '../storage/backup';
import { SCENES } from './keys';
import type { SoundOptions } from '../../config';
import type { Options } from '../../core/save/saveData';
import { music } from '../audio/music';
import { stepVolume } from '../audio/musicLogic';

type Tab = 'sound' | 'screen' | 'game';

const TABS: [Tab, string][] = [
  ['sound', 'SOM'],
  ['screen', 'TELA'],
  ['game', 'JOGO'],
];

type Obj = Phaser.GameObjects.GameObject;

const VOLUMES: [keyof SoundOptions & `${string}Volume`, string, string][] = [
  ['masterVolume', 'Geral', 'Multiplica música e efeitos'],
  ['musicVolume', 'Música', 'Trilhas do título, hub, run e jingles'],
  ['sfxVolume', 'Efeitos sonoros', 'Armas, moléculas, itens e botões (chegam em breve)'],
];

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
 * Opções (docs/menu.md, prancheta "Opções"): abas Som, Tela e Jogo, tudo salvo no aparelho.
 * Som: mudo, volumes Geral, Música e Efeitos em 10 passos, abafar na pausa e tocar em segundo
 * plano. Tela: FPS, números de dano, tela cheia e debug. Jogo: atualização, backup do save e
 * Novidades (decisão 0016). Aberta pela pausa da run, fica por cima dela e volta para ela, e a aba
 * Jogo só avisa que essas coisas ficam nos menus.
 */
export class OptionsScene extends Phaser.Scene {
  private root?: Phaser.GameObjects.Container;
  private scroll?: ScrollArea;
  private size = { w: 0, h: 0 };
  private fromRun = false;
  private tab: Tab = 'sound';
  /** Aviso do backup (exportado, importado, código inválido). */
  private note = '';

  constructor() {
    super(SCENES.options);
  }

  create(data?: { fromRun?: boolean }): void {
    this.fromRun = data?.fromRun ?? false;
    this.tab = 'sound';
    this.note = '';
    if (!this.fromRun) music.setMain('hub');
    this.input.keyboard?.on('keydown-ESC', () => this.back());
    setupUiLayout(this, (w, h) => {
      this.size = { w, h };
      this.build(true);
    });
    const unsubscribe = updates.subscribe(() => this.build());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      unsubscribe();
      this.scroll?.destroy();
      this.scroll = undefined;
    });
    this.scale.on(Phaser.Scale.Events.ENTER_FULLSCREEN, this.rebuild, this);
    this.scale.on(Phaser.Scale.Events.LEAVE_FULLSCREEN, this.rebuild, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.ENTER_FULLSCREEN, this.rebuild, this);
      this.scale.off(Phaser.Scale.Events.LEAVE_FULLSCREEN, this.rebuild, this);
    });
  }

  private rebuild(): void {
    this.build();
  }

  private back(): void {
    if (!this.fromRun) {
      this.scene.start(SCENES.hub);
      return;
    }
    this.scene.stop();
    this.scene.wake(SCENES.pause);
  }

  private setOptions(change: (o: Options) => Options): void {
    const now = getSave(this);
    const options = change(now.options);
    setSave(this, { ...now, options });
    music.applySound(options.sound);
    this.build();
  }

  private setSound(change: Partial<SoundOptions>): void {
    this.setOptions((o) => ({ ...o, sound: { ...o.sound, ...change } }));
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
    music.applySound(save.options.sound);
    this.setNote('SAVE IMPORTADO');
  }

  private exportSave(): void {
    const save = getSave(this);
    downloadBackup(save);
    void navigator.clipboard
      ?.writeText(exportCode(save))
      .then(() => this.setNote('CÓDIGO COPIADO E ARQUIVO BAIXADO'))
      .catch(() => this.setNote('ARQUIVO DO SAVE BAIXADO'));
    this.setNote('ARQUIVO DO SAVE BAIXADO');
  }

  private setNote(note: string): void {
    this.note = note;
    this.build();
  }

  /** Monta a tela; `resetScroll` volta a lista para o topo (troca de aba ou de tamanho). */
  private build(resetScroll = false): void {
    const offset = resetScroll ? 0 : (this.scroll?.offset() ?? 0);
    this.scroll?.destroy();
    this.root?.destroy();
    const { w, h } = this.size;
    const safe = safeAreaUi(this.cameras.main.zoom);
    const width = Math.min(420, w - safe.left - safe.right - 24);
    const left = Math.floor((w - width) / 2);
    const top = safe.top + 14;
    const children: Obj[] = [];
    if (this.fromRun) children.push(addDim(this, w, h, 0.85));
    else children.push(this.add.rectangle(0, 0, w, h, PALETTE.night).setOrigin(0));

    children.push(
      this.add
        .text(
          w / 2,
          top,
          'OPÇÕES',
          withShadow(impactText(28, PALETTE_CSS.logoOrange), PALETTE_CSS.outline, 3),
        )
        .setOrigin(0.5, 0),
      this.add
        .text(
          w / 2,
          top + 36,
          this.fromRun ? 'ABERTA DA PAUSA · A RUN ESPERA' : 'SALVO NO APARELHO',
          labelText(8, PALETTE_CSS.textSoft),
        )
        .setOrigin(0.5, 0),
    );

    const tabsY = top + 54;
    const tw = Math.floor((width - 12) / 3);
    TABS.forEach(([id, label], i) => {
      children.push(
        addButton(this, {
          x: left + i * (tw + 6),
          y: tabsY,
          width: i === 2 ? width - 2 * (tw + 6) : tw,
          height: 44,
          label,
          fontSize: 11,
          variant: id === this.tab ? 'primary' : 'secondary',
          onClick: () => {
            if (this.tab === id) return;
            this.tab = id;
            this.note = '';
            this.build(true);
          },
        }),
      );
    });

    // Embaixo: VOLTAR e a linha de versão.
    const s = updates.state;
    const bottom = h - safe.bottom - 10;
    const versionY = bottom - 10;
    const backY = versionY - 8 - 48;
    const bw = Math.min(width, 260);
    children.push(
      addButton(this, {
        x: Math.floor((w - bw) / 2),
        y: backY,
        width: bw,
        height: 48,
        label: 'VOLTAR',
        variant: 'secondary',
        onClick: () => this.back(),
      }),
      this.add
        .text(
          w / 2,
          versionY,
          `VERSÃO ${s.currentVersion} · BUILD ${s.currentBuild}`,
          labelText(8, PALETTE_CSS.textMuted),
        )
        .setOrigin(0.5, 0),
    );

    // Painel com moldura de madeira e o conteúdo da aba, rolável.
    const panelY = tabsY + 54;
    const panelH = backY - 10 - panelY;
    const g = this.add.graphics();
    g.fillStyle(PALETTE.outline).fillRect(left, panelY, width, panelH);
    g.fillStyle(PALETTE.wood).fillRect(left + 3, panelY + 3, width - 6, panelH - 6);
    g.fillStyle(PALETTE.ink).fillRect(left + 5, panelY + 5, width - 10, panelH - 10);
    g.fillStyle(PALETTE.night).fillRect(left + 7, panelY + 7, width - 14, panelH - 14);
    children.push(g);
    this.root = this.add.container(0, 0, children);

    const inner = { x: left + 14, y: panelY + 14, width: width - 28 };
    const rows =
      this.tab === 'sound'
        ? this.soundRows(inner)
        : this.tab === 'screen'
          ? this.screenRows(inner)
          : this.gameRows(inner);
    this.scroll = addScrollArea(
      this,
      rows,
      { x: left + 7, y: panelY + 7, width: width - 14, height: panelH - 14 },
      offset,
    );
    this.scroll.isolate();
  }

  // ---- Peças da prancheta ----

  /** Título de seção em laranja com um traço embaixo. */
  private section(out: Obj[], x: number, y: number, width: number, label: string): number {
    out.push(this.add.text(x, y, label, labelText(8, PALETTE_CSS.sectionOrange)));
    const g = this.add.graphics();
    g.fillStyle(PALETTE.panel).fillRect(x, y + 13, width, 2);
    out.push(g);
    return y + 22;
  }

  /** Interruptor NÃO/SIM de 64×26, com o lado ligado aceso. */
  private switch(out: Obj[], x: number, y: number, on: boolean, fill: number): void {
    const g = this.add.graphics();
    g.fillStyle(PALETTE.ink).fillRect(x, y, 64, 26);
    g.fillStyle(fill).fillRect(x + 3, y + 3, 58, 20);
    if (on) {
      g.fillStyle(PALETTE.buff).fillRect(x + 32, y + 3, 29, 20);
      g.fillStyle(0x2e7a1c).fillRect(x + 32, y + 20, 29, 3);
    } else {
      g.fillStyle(PALETTE.wine).fillRect(x + 3, y + 3, 29, 20);
      g.fillStyle(PALETTE.outline).fillRect(x + 3, y + 20, 29, 3);
    }
    out.push(
      g,
      this.add
        .text(x + 17, y + 12, 'NÃO', labelText(7, on ? '#474C85' : PALETTE_CSS.white))
        .setOrigin(0.5),
      this.add
        .text(x + 47, y + 12, 'SIM', labelText(7, on ? PALETTE_CSS.white : '#474C85'))
        .setOrigin(0.5),
    );
  }

  /** Área de toque transparente (dispara ao soltar em cima, como os botões). */
  private hit(out: Obj[], x: number, y: number, w: number, h: number, onClick: () => void): void {
    const zone = this.add.zone(x, y, w, h).setOrigin(0).setInteractive({ useHandCursor: true });
    let armed = false;
    zone.on('pointerdown', () => (armed = true));
    zone.on('pointerout', () => (armed = false));
    zone.on('pointerup', () => {
      if (armed) onClick();
      armed = false;
    });
    out.push(zone);
  }

  /** Linha com nome, dica e interruptor; tocar em qualquer lugar dela troca o valor. */
  private toggleRow(
    out: Obj[],
    x: number,
    y: number,
    width: number,
    name: string,
    hint: string,
    on: boolean,
    onToggle: () => void,
  ): number {
    const text = this.add.text(x + 10, y + 7, name, { ...impactText(13), fontStyle: '600' });
    const sub = this.add.text(x + 10, y + 25, hint, {
      ...bodyText(10, PALETTE_CSS.textMuted),
      wordWrap: { width: width - 96 },
    });
    const h = Math.max(48, 25 + sub.height + 8);
    const g = this.add.graphics();
    g.fillStyle(PALETTE.ink).fillRect(x, y, width, h);
    g.fillStyle(PALETTE.panelDeep).fillRect(x + 2, y + 2, width - 4, h - 4);
    out.push(g, text, sub);
    this.switch(out, x + width - 74, y + Math.floor((h - 26) / 2), on, PALETTE.night);
    this.hit(out, x, y, width, h, onToggle);
    return y + h + 8;
  }

  private soundRows(area: { x: number; y: number; width: number }): Obj[] {
    const out: Obj[] = [];
    const { x, width } = area;
    const sound = getSave(this).options.sound;
    let y = area.y;

    // Mudo: caixa grande, vermelha com o som desligado.
    const mg = this.add.graphics();
    mg.fillStyle(PALETTE.ink).fillRect(x, y, width, 56);
    mg.fillStyle(sound.muted ? PALETTE.outline : PALETTE.panel).fillRect(
      x + 3,
      y + 3,
      width - 6,
      50,
    );
    mg.fillStyle(sound.muted ? PALETTE.darkRed : PALETTE.panelHi).fillRect(
      x + 3,
      y + 3,
      width - 6,
      3,
    );
    out.push(
      mg,
      this.add.text(x + 12, y + 10, sound.muted ? 'SOM DESLIGADO' : 'SOM LIGADO', impactText(15)),
      this.add.text(
        x + 12,
        y + 31,
        sound.muted ? 'Os volumes ficam guardados' : 'Mudo corta tudo de uma vez',
        bodyText(10, PALETTE_CSS.textSoft),
      ),
    );
    this.switch(out, x + width - 76, y + 15, sound.muted, PALETTE.panelDeep);
    this.hit(out, x, y, width, 56, () => this.setSound({ muted: !sound.muted }));
    y += 56 + 12;

    y = this.section(out, x, y, width, 'VOLUME');
    for (const [key, name, hint] of VOLUMES) {
      y = this.volumeRow(out, x, y, width, name, hint, sound[key], sound.muted, (v) =>
        this.setSound({ [key]: v }),
      );
    }

    y = this.section(out, x, y + 4, width, 'COMPORTAMENTO');
    y = this.toggleRow(
      out,
      x,
      y,
      width,
      'Abafar na pausa',
      'Música a 50% e sem agudos na pausa, no level up e na cápsula',
      sound.muffleOnPause,
      () => this.setSound({ muffleOnPause: !sound.muffleOnPause }),
    );
    this.toggleRow(
      out,
      x,
      y,
      width,
      'Tocar em segundo plano',
      'Com o app escondido, o campo longo segue com som',
      sound.playInBackground,
      () => this.setSound({ playInBackground: !sound.playInBackground }),
    );
    return out;
  }

  /** Volume: nome, dica e valor; `−`, barra de 10 pips (toque direto) e `+`. */
  private volumeRow(
    out: Obj[],
    x: number,
    y: number,
    width: number,
    name: string,
    hint: string,
    value: number,
    muted: boolean,
    onChange: (v: number) => void,
  ): number {
    const n = Math.round(value * 10);
    const alpha = muted ? 0.45 : 1;
    const h = 100;
    const g = this.add.graphics();
    g.fillStyle(PALETTE.ink).fillRect(x, y, width, h);
    g.fillStyle(PALETTE.panelDeep).fillRect(x + 2, y + 2, width - 4, h - 4);
    const silent = muted || n === 0;
    const parts: Obj[] = [
      this.add.text(x + 10, y + 7, name, { ...impactText(14), fontStyle: '600' }),
      this.add.text(x + 10, y + 26, hint, bodyText(10, PALETTE_CSS.textMuted)),
      this.add
        .text(
          x + width - 10,
          y + 8,
          muted ? 'MUDO' : `${n * 10}%`,
          withShadow(
            impactText(17, silent ? PALETTE_CSS.alert : PALETTE_CSS.cyan),
            PALETTE_CSS.ink,
            2,
          ),
        )
        .setOrigin(1, 0),
    ];
    const rowY = y + 46;
    const minus = addButton(this, {
      x: x + 8,
      y: rowY,
      width: 44,
      height: 46,
      label: '−',
      fontSize: 20,
      variant: 'secondary',
      onClick: () => onChange(stepVolume(value, -1)),
    });
    const plus = addButton(this, {
      x: x + width - 52,
      y: rowY,
      width: 44,
      height: 46,
      label: '+',
      fontSize: 20,
      variant: 'secondary',
      onClick: () => onChange(stepVolume(value, 1)),
    });
    // Barra: moldura de madeira, fundo escuro e 10 pips.
    const bx = x + 58;
    const bw = width - 116;
    const bar = this.add.graphics();
    bar.fillStyle(PALETTE.outline).fillRect(bx, rowY + 3, bw, 36);
    bar.fillStyle(PALETTE.woodLight).fillRect(bx + 3, rowY + 6, bw - 6, 30);
    bar.fillStyle(PALETTE.woodDark).fillRect(bx + 5, rowY + 8, bw - 10, 26);
    bar.fillStyle(PALETTE.panelDeep).fillRect(bx + 8, rowY + 11, bw - 16, 20);
    const pipW = (bw - 22 - 9 * 2) / 10;
    const pipsX = bx + 11;
    for (let i = 0; i < 10; i++) {
      const px = Math.round(pipsX + i * (pipW + 2));
      const pw = Math.round(pipsX + (i + 1) * (pipW + 2) - 2) - px;
      bar.fillStyle(i < n ? PALETTE.water : PALETTE.panel).fillRect(px, rowY + 14, pw, 14);
      bar.fillStyle(i < n ? 0x1c7fa0 : PALETTE.panelDeep).fillRect(px, rowY + 24, pw, 4);
    }
    parts.push(bar);
    for (const p of parts) (p as unknown as Phaser.GameObjects.Components.Alpha).setAlpha(alpha);
    minus.setAlpha(alpha);
    plus.setAlpha(alpha);
    out.push(g, ...parts, minus, plus);
    // Tocar num pip escolhe o valor; tocar no pip do valor atual desce um.
    for (let i = 0; i < 10; i++) {
      const px = pipsX + i * (pipW + 2) - 1;
      this.hit(out, px, rowY, pipW + 2, 42, () => onChange(n === i + 1 ? i / 10 : (i + 1) / 10));
    }
    return y + h + 8;
  }

  private screenRows(area: { x: number; y: number; width: number }): Obj[] {
    const out: Obj[] = [];
    const { x, width } = area;
    const o = getSave(this).options;
    let y = this.section(out, x, area.y, width, 'TELA E DESEMPENHO');
    const rows: [string, string, boolean, () => void][] = [
      [
        'Mostrar FPS',
        'Contador no canto da HUD',
        o.showFps,
        () => this.setOptions((v) => ({ ...v, showFps: !v.showFps })),
      ],
      [
        'Números de dano',
        'Desligar ajuda celulares mais fracos',
        o.showDamageNumbers,
        () => this.setOptions((v) => ({ ...v, showDamageNumbers: !v.showDamageNumbers })),
      ],
      [
        'Tela cheia',
        'Sem a barra do navegador',
        this.scale.isFullscreen,
        () => this.scale.toggleFullscreen(),
      ],
      [
        'Debug (hitbox)',
        'Mostra os círculos de colisão',
        o.debug === true,
        () => this.setOptions((v) => ({ ...v, debug: !v.debug })),
      ],
    ];
    for (const [name, hint, on, toggle] of rows) {
      y = this.toggleRow(out, x, y, width, name, hint, on, toggle);
    }
    return out;
  }

  private gameRows(area: { x: number; y: number; width: number }): Obj[] {
    const out: Obj[] = [];
    const { x, width } = area;
    let y = area.y;
    if (this.fromRun) {
      const text = this.add.text(
        x + 12,
        y + 30,
        'Atualização, backup do save e Novidades ficam nas Opções do hub, para não mexer no save no meio da run.',
        { ...bodyText(11, PALETTE_CSS.textSoft), wordWrap: { width: width - 24 } },
      );
      const h = 30 + text.height + 12;
      const g = this.add.graphics();
      g.fillStyle(PALETTE.panelHi).fillRect(x, y, width, h);
      g.fillStyle(PALETTE.panelDeep).fillRect(x + 2, y + 2, width - 4, h - 4);
      out.push(
        g,
        this.add.text(x + 12, y + 12, 'SÓ NOS MENUS', labelText(8, PALETTE_CSS.sectionOrange)),
        text,
      );
      return out;
    }

    const s = updates.state;
    y = this.section(out, x, y, width, 'VERSÃO');
    out.push(
      addButton(this, {
        x,
        y,
        width,
        height: 46,
        label: UPDATE_LABEL[s.status],
        fontSize: 13,
        variant: s.status === 'ready' ? 'primary' : 'secondary',
        onClick: () => void updates.checkAndApply(),
      }),
      this.add
        .text(
          x + width / 2,
          y + 52,
          UPDATE_NOTE[s.status] +
            (s.remoteVersion && s.status !== 'upToDate' ? ` · ${s.remoteVersion}` : ''),
          labelText(8, PALETTE_CSS.textSoft),
        )
        .setOrigin(0.5, 0),
    );
    y += 74;

    y = this.section(out, x, y, width, 'SAVE');
    const half = Math.floor((width - 8) / 2);
    out.push(
      addButton(this, {
        x,
        y,
        width: half,
        height: 46,
        label: 'EXPORTAR',
        fontSize: 13,
        variant: 'secondary',
        onClick: () => this.exportSave(),
      }),
      addButton(this, {
        x: x + half + 8,
        y,
        width: width - half - 8,
        height: 46,
        label: 'IMPORTAR',
        fontSize: 13,
        variant: 'secondary',
        onClick: () => void this.importSave(),
      }),
    );
    y += 52;
    const hint = this.add.text(
      x,
      y,
      this.note || 'Exportar copia um código e baixa um arquivo; importar aceita os dois.',
      {
        ...bodyText(10, this.note ? PALETTE_CSS.cyan : PALETTE_CSS.textMuted),
        wordWrap: { width },
      },
    );
    out.push(hint);
    y += hint.height + 14;

    y = this.section(out, x, y, width, 'SOBRE');
    out.push(
      addButton(this, {
        x,
        y,
        width,
        height: 46,
        label: 'NOVIDADES',
        fontSize: 13,
        variant: 'secondary',
        onClick: () => this.scene.start(SCENES.changelog),
      }),
    );
    return out;
  }
}

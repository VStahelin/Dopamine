import type * as Phaser from 'phaser';
import type { RunState } from '../../core/run/state';
import { SCENES } from '../scenes/keys';
import {
  flushSave,
  getSave,
  loadAdminBackup,
  saveAdminBackup,
  setSave,
} from '../storage/saveStore';

/** Cena da run, vista de fora (o painel lê a run e a velocidade dela). */
interface RunSceneLike extends Phaser.Scene {
  run?: RunState;
  timeScale: number;
}

type HasGame = { game: Phaser.Game; registry: Phaser.Data.DataManager };

/**
 * Liga o modo admin (decisão 0039): guarda uma cópia do save de agora, para o botão "voltar ao
 * save real", e marca `options.admin`.
 */
export async function enableAdmin(scene: HasGame): Promise<void> {
  const save = getSave(scene);
  if (save.options.admin) return;
  await saveAdminBackup(save);
  setSave(scene, { ...save, options: { ...save.options, admin: true } });
}

export function disableAdmin(scene: HasGame): void {
  const save = getSave(scene);
  setSave(scene, { ...save, options: { ...save.options, admin: false } });
}

/** Volta ao save guardado quando o modo foi ligado e recarrega o jogo. Falso se não há cópia. */
export async function restoreRealSave(scene: HasGame): Promise<boolean> {
  const backup = await loadAdminBackup();
  if (!backup) return false;
  setSave(scene, { ...backup, options: { ...backup.options, admin: true } });
  await flushSave();
  location.reload();
  return true;
}

/** `?admin=1` na URL liga o modo. */
export function adminRequestedByUrl(): boolean {
  return new URLSearchParams(location.search).get('admin') === '1';
}

/** A cena da run, se há uma run em andamento (rodando, pausada ou dormindo). */
export function activeRun(game: Phaser.Game): RunSceneLike | null {
  const plugin = game.scene;
  const scene = plugin.getScene(SCENES.run) as RunSceneLike | null;
  if (!scene) return null;
  const alive =
    plugin.isActive(SCENES.run) || plugin.isPaused(SCENES.run) || plugin.isSleeping(SCENES.run);
  return alive && scene.run && !scene.run.over ? scene : null;
}

/** Abre ou fecha o painel por cima da cena de agora, se o modo estiver ligado. */
export function toggleAdminPanel(game: Phaser.Game): void {
  const plugin = game.scene;
  if (plugin.isActive(SCENES.admin)) {
    plugin.getScene(SCENES.admin).events.emit('admin-close');
    return;
  }
  const boot = plugin.getScene(SCENES.boot);
  const save = boot ? getSave(boot) : undefined;
  if (!save?.options.admin) return;
  plugin.run(SCENES.admin);
  plugin.bringToTop(SCENES.admin);
}

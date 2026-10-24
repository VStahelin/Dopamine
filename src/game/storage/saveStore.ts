import type * as Phaser from 'phaser';
import { AUDIO, DISPLAY } from '../../config';
import { migrateSave, type SaveData } from '../../core/save/saveData';

/** Uma cena ou o jogo: os dois dividem o mesmo registro. */
type HasRegistry = { registry: Phaser.Data.DataManager };

/** Save no IndexedDB do navegador (decisão 0005). */
// Nome antigo do jogo, mantido de propósito: trocar o banco apagaria os saves de quem já joga.
const DB_NAME = 'dopamina-blaster';
const STORE = 'save';
const KEY = 'main';
const REGISTRY_KEY = 'save';

const defaults = () => ({
  showFps: DISPLAY.showFps,
  showDamageNumbers: true,
  sound: AUDIO.sound,
});

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const req = fn(db.transaction(STORE, mode).objectStore(STORE));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

/** Carrega o save; sem IndexedDB (aba anônima, bloqueio) começa um save novo em memória. */
export async function loadSave(): Promise<SaveData> {
  try {
    return migrateSave(await withStore('readonly', (s) => s.get(KEY)), defaults());
  } catch {
    return migrateSave(undefined, defaults());
  }
}

async function writeSave(save: SaveData): Promise<void> {
  try {
    await withStore('readwrite', (s) => s.put(save, KEY));
  } catch (err) {
    console.warn('Não foi possível salvar o jogo:', err);
  }
}

/** Save em uso, guardado no registro do jogo para todas as cenas lerem. */
export function getSave(scene: HasRegistry): SaveData {
  return scene.registry.get(REGISTRY_KEY) as SaveData;
}

/** Última gravação em andamento, para esperar antes de recarregar o jogo. */
let lastWrite: Promise<void> = Promise.resolve();

export function setSave(scene: HasRegistry, save: SaveData): void {
  scene.registry.set(REGISTRY_KEY, save);
  lastWrite = lastWrite.then(() => writeSave(save));
}

/** Cópia do save guardada ao ligar o modo admin (decisão 0039), para voltar ao save real. */
const ADMIN_BACKUP_KEY = 'adminBackup';

export async function saveAdminBackup(save: SaveData): Promise<void> {
  try {
    await withStore('readwrite', (s) => s.put(save, ADMIN_BACKUP_KEY));
  } catch (err) {
    console.warn('Não foi possível guardar a cópia do save:', err);
  }
}

export async function loadAdminBackup(): Promise<SaveData | null> {
  try {
    const raw: unknown = await withStore('readonly', (s) => s.get(ADMIN_BACKUP_KEY));
    return raw === undefined ? null : migrateSave(raw, defaults());
  } catch {
    return null;
  }
}

/** Espera todas as gravações pendentes (antes de trocar de versão). */
export function flushSave(): Promise<void> {
  return lastWrite;
}

export function initSave(scene: HasRegistry, save: SaveData): void {
  scene.registry.set(REGISTRY_KEY, save);
}

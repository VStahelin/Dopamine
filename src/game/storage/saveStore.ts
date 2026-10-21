import type * as Phaser from 'phaser';
import { DISPLAY } from '../../config';
import { migrateSave, type SaveData } from '../../core/save/saveData';

/** Save no IndexedDB do navegador (decisão 0005). */
const DB_NAME = 'dopamina-blaster';
const STORE = 'save';
const KEY = 'main';
const REGISTRY_KEY = 'save';

const defaults = () => ({ showFps: DISPLAY.showFps });

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
export function getSave(scene: Phaser.Scene): SaveData {
  return scene.registry.get(REGISTRY_KEY) as SaveData;
}

export function setSave(scene: Phaser.Scene, save: SaveData): void {
  scene.registry.set(REGISTRY_KEY, save);
  void writeSave(save);
}

export function initSave(scene: Phaser.Scene, save: SaveData): void {
  scene.registry.set(REGISTRY_KEY, save);
}

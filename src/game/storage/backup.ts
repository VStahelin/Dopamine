import { AUDIO, DISPLAY } from '../../config';
import { migrateSave, type SaveData } from '../../core/save/saveData';

/**
 * Backup do save (decisão 0005): um código de texto para copiar e colar em outro aparelho, e um
 * arquivo .json para guardar. Importar passa pela mesma migração do save, então um backup velho
 * ou mexido à mão volta ao formato atual e o que estiver errado cai no padrão.
 */
const GAME = 'farmaco-battle';
/** Nomes antigos do jogo: backups feitos antes da troca de nome continuam valendo. */
const LEGACY_GAMES = ['dopamina-blaster'];

interface Backup {
  game: string;
  exportedAt: string;
  save: SaveData;
}

function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function fromBase64(code: string): string {
  const binary = atob(code.replace(/\s+/g, ''));
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
}

function backupJson(save: SaveData): string {
  const backup: Backup = { game: GAME, exportedAt: new Date().toISOString(), save };
  return JSON.stringify(backup);
}

/** Código do save em base64, para colar em outro aparelho. */
export function exportCode(save: SaveData): string {
  return toBase64(backupJson(save));
}

/** Lê um backup (código em base64 ou o JSON do arquivo); `null` se não for um save do jogo. */
export function importBackup(text: string): SaveData | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  try {
    const json = trimmed.startsWith('{') ? trimmed : fromBase64(trimmed);
    const data = JSON.parse(json) as Partial<Backup>;
    const game = data.game ?? '';
    if ((game !== GAME && !LEGACY_GAMES.includes(game)) || !data.save) return null;
    return migrateSave(data.save, {
      showFps: DISPLAY.showFps,
      showDamageNumbers: true,
      sound: AUDIO.sound,
    });
  } catch {
    return null;
  }
}

/** Baixa o save como arquivo .json. */
export function downloadBackup(save: SaveData): void {
  const blob = new Blob([backupJson(save)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dopamina-save-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Abre o seletor de arquivo e devolve o texto do arquivo escolhido. */
export function pickBackupFile(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json,.txt';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      void file.text().then(resolve, () => resolve(null));
    };
    input.click();
  });
}

import { describe, expect, it } from 'vitest';
import { defaultSave } from '../../core/save/saveData';
import { exportCode, importBackup } from './backup';
import { AUDIO } from '../../config';

describe('backup do save', () => {
  const save = {
    ...defaultSave({ showFps: false, showDamageNumbers: true, sound: AUDIO.sound }),
    atp: 1234,
    selectedAgent: 'dopamine',
  };

  it('o código volta ao mesmo save, com acentos', () => {
    const back = importBackup(exportCode({ ...save, seen: ['glucose'] }));
    expect(back?.atp).toBe(1234);
    expect(back?.seen).toEqual(['glucose']);
    expect(back?.meta.weapons).toEqual(save.meta.weapons);
  });

  it('aceita o JSON do arquivo e recusa o que não é save do jogo', () => {
    const json = JSON.stringify({ game: 'farmaco-battle', save });
    expect(importBackup(json)?.atp).toBe(1234);
    expect(importBackup('{"game":"outro","save":{}}')).toBeNull();
    expect(importBackup('não é base64 ###')).toBeNull();
    expect(importBackup('')).toBeNull();
  });

  it('aceita backup feito com o nome antigo do jogo', () => {
    const json = JSON.stringify({ game: 'dopamina-blaster', save });
    expect(importBackup(json)?.atp).toBe(1234);
  });
});

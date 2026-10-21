import { describe, expect, it } from 'vitest';
import {
  CHECK_INTERVAL_MS,
  enterHub,
  initialState,
  onRemoteVersion,
  shouldAutoCheck,
  shouldPrompt,
} from './updateLogic';

const base = initialState('0.2.0', 'abc-1');

describe('verificação automática', () => {
  it('não verifica durante a run', () => {
    expect(shouldAutoCheck({ ...base, inMenu: false }, CHECK_INTERVAL_MS * 2)).toBe(false);
  });

  it('nos menus, verifica a cada intervalo', () => {
    const menu = { ...base, inMenu: true, lastCheck: 1000 };
    expect(shouldAutoCheck(menu, 1000 + CHECK_INTERVAL_MS - 1)).toBe(false);
    expect(shouldAutoCheck(menu, 1000 + CHECK_INTERVAL_MS)).toBe(true);
  });

  it('com uma build já baixando ou pronta, não verifica de novo', () => {
    const later = CHECK_INTERVAL_MS * 3;
    expect(shouldAutoCheck({ ...base, inMenu: true, status: 'downloading' }, later)).toBe(false);
    expect(shouldAutoCheck({ ...base, inMenu: true, status: 'ready' }, later)).toBe(false);
  });
});

describe('resultado do version.json', () => {
  it('mesma build: em dia', () => {
    expect(onRemoteVersion(base, { version: '0.2.0', buildId: 'abc-1' }).status).toBe('upToDate');
  });

  it('build nova: o service worker começa a baixar', () => {
    const s = onRemoteVersion(base, { version: '0.3.0', buildId: 'def-2' });
    expect(s).toMatchObject({
      status: 'downloading',
      remoteBuild: 'def-2',
      remoteVersion: '0.3.0',
    });
  });

  it('uma build pronta continua pronta', () => {
    const ready = { ...base, status: 'ready' as const };
    expect(onRemoteVersion(ready, { version: '0.3.0', buildId: 'def-2' }).status).toBe('ready');
  });
});

describe('aviso de versão nova', () => {
  const ready = { ...base, status: 'ready' as const };

  it('nunca aparece durante a run', () => {
    expect(shouldPrompt({ ...ready, inMenu: false })).toBe(false);
  });

  it('aparece nos menus só com a build inteira pronta', () => {
    expect(shouldPrompt({ ...ready, inMenu: true })).toBe(true);
    expect(shouldPrompt({ ...base, inMenu: true, status: 'downloading' })).toBe(false);
  });

  it('depois de DEPOIS, volta só na próxima entrada no hub', () => {
    const dismissed = { ...ready, inMenu: true, promptedThisVisit: true };
    expect(shouldPrompt(dismissed)).toBe(false);
    expect(shouldPrompt(enterHub(dismissed))).toBe(true);
  });

  it('descoberta durante a run, a build pronta espera a volta ao hub', () => {
    const inRun = { ...ready, inMenu: false };
    expect(shouldPrompt(inRun)).toBe(false);
    expect(shouldPrompt(enterHub(inRun))).toBe(true);
  });
});

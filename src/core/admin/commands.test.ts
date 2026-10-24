import { describe, expect, it } from 'vitest';
import { createRun } from '../run/state';
import { stepRun } from '../run/step';
import { hurtAgent } from '../run/hurt';
import { defaultSave } from '../save/saveData';
import { findId, parseCommand, runCommand } from './commands';
import { AUDIO, WEAPONS } from '../../config';

const newSave = () => defaultSave({ showFps: false, showDamageNumbers: true, sound: AUDIO.sound });

const ctx = () => ({ save: newSave(), run: createRun(1) });

describe('modo admin (decisão 0039)', () => {
  it('lê o comando e os argumentos', () => {
    expect(parseCommand('  GIVE radical   8 ')).toEqual({ name: 'give', args: ['radical', '8'] });
  });

  it('acha o id pelo nome, sem acento nem espaço', () => {
    expect(findId(WEAPONS, 'radical')).toBe('radical');
    expect(findId(WEAPONS, WEAPONS.radical.name.toUpperCase())).toBe('radical');
  });

  it('comando de run sem run aberta falha sem mexer no save', () => {
    const save = newSave();
    const r = runCommand({ save }, 'god');
    expect(r.ok).toBe(false);
    expect(r.save).toBe(save);
  });

  it('time pula o relógio sem os chefes perdidos nascerem de uma vez', () => {
    const c = ctx();
    expect(runCommand(c, 'time 20').ok).toBe(true);
    expect(c.run.time).toBe(1200);
    stepRun(c.run, { move: { x: 0, y: 0 }, viewRadius: 300 }, 1 / 60);
    expect(c.run.enemies.filter((e) => e.boss).length).toBeLessThanOrEqual(1);
    expect(c.run.admin.commands).toBe(1);
  });

  it('ff avança com o robô até o minuto, sem morrer', () => {
    const c = ctx();
    const r = runCommand(c, 'ff 2');
    expect(r.ok).toBe(true);
    expect(c.run.time).toBeGreaterThanOrEqual(120);
    expect(c.run.over).toBe(false);
    expect(c.run.admin.god).toBe(false);
  }, 30000);

  it('god: nada tira interações', () => {
    const c = ctx();
    runCommand(c, 'god on');
    const before = c.run.agent.interactions;
    hurtAgent(c.run, 999);
    expect(c.run.agent.interactions).toBe(before);
  });

  it('give põe a arma no nível pedido, e no máximo sem nível', () => {
    const c = ctx();
    runCommand(c, 'give radical 3');
    expect(c.run.weapons.find((w) => w.id === 'radical')?.level).toBe(3);
    runCommand(c, 'give radical');
    const w = c.run.weapons.find((x) => x.id === 'radical')!;
    expect(w.level).toBeGreaterThan(3);
    expect(w.boosts).toHaveLength(w.level - 1);
  });

  it('spawn e clear', () => {
    const c = ctx();
    runCommand(c, 'spawn fattyAcid 10');
    expect(c.run.enemies.filter((e) => e.kind === 'fattyAcid')).toHaveLength(10);
    runCommand(c, 'clear');
    expect(c.run.enemies.every((e) => e.hp <= 0)).toBe(true);
  });

  it('comandos de meta devolvem um save novo', () => {
    const { save } = ctx();
    const atp = runCommand({ save }, 'atp 5000');
    expect(atp.save.atp).toBe(save.atp + 5000);
    expect(save.atp).not.toBe(atp.save.atp);
    expect(runCommand({ save }, 'stars 3').save.meta.stars).toBe(3);
    const unlocked = runCommand({ save }, 'unlock').save.meta;
    expect(unlocked.weapons.length).toBeGreaterThan(save.meta.weapons.length);
  });

  it('comando desconhecido avisa', () => {
    expect(runCommand(ctx(), 'voar').ok).toBe(false);
  });
});

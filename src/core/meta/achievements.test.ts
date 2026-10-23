import { describe, expect, it } from 'vitest';
import { AUDIO, META } from '../../config';
import { defaultSave, type SaveData } from '../save/saveData';
import { addEnemy, createRun, runResult } from '../run/state';
import { stepRun } from '../run/step';
import { DT, STILL, rulesWithoutSpawn } from '../run/testRules';
import { recordRun } from '../save/saveData';
import { achievementFraction, claimAchievements, nextAchievement } from './achievements';

const base = (): SaveData =>
  defaultSave({ showFps: false, showDamageNumbers: true, sound: AUDIO.sound });

const def = (id: string) => META.achievements.find((a) => a.id === id)!;

describe('conquistas (fase 5.16)', () => {
  it('lê o progresso das estatísticas acumuladas', () => {
    const save = base();
    save.stats.kills = { triglyceride: 150, glucose: 50 };
    expect(achievementFraction(def('lipolysis'), save)).toBeCloseTo(0.5);
    expect(achievementFraction(def('firstReaction'), save)).toBe(1);
  });

  it('dá o ATP e libera o agente uma vez só', () => {
    const save = base();
    save.stats.kills = { triglyceride: 300 };
    const { save: next, earned } = claimAchievements(save);
    expect(earned.map((a) => a.id)).toEqual(['firstReaction', 'lipolysis']);
    expect(next.meta.agents).toContain('lipase');
    expect(next.atp).toBe(def('firstReaction').reward.atp);
    expect(claimAchievements(next).earned).toHaveLength(0);
  });

  it('soma com a loja: já comprado, devolve metade do preço em ATP', () => {
    const save = base();
    save.meta.agents = [...save.meta.agents, 'caffeine'];
    save.records.bestTimeSeconds = 600;
    const { save: next } = claimAchievements(save);
    expect(next.atp).toBe(Math.round(META.unlockCost.agents.caffeine! / 2));
    expect(next.meta.agents.filter((a) => a === 'caffeine')).toHaveLength(1);
  });

  it('a próxima é a mais perto de sair', () => {
    const save = base();
    save.stats.bosses = 4;
    expect(nextAchievement(save)?.id).toBe('bossHunter');
  });
});

describe('cápsula de agente (fase 5.16)', () => {
  it('nasce uma vez depois do minuto da config e liberta o agente no save', () => {
    const rules = {
      ...rulesWithoutSpawn(),
      lockedAgents: ['caffeine' as const],
    };
    rules.drops = { ...rules.drops, agentCapsule: { ...rules.drops.agentCapsule, chance: 1 } };
    const r = createRun(1, rules, 'dopamine');
    r.weapons = [];
    r.time = rules.drops.agentCapsule.fromMinute * 60;
    stepRun(r, STILL, DT);
    const capsules = r.pickups.filter((p) => p.kind === 'agentCapsule');
    expect(capsules).toHaveLength(1);
    expect(capsules[0]!.agent).toBe('caffeine');
    // Tocar na cápsula.
    r.agent.x = capsules[0]!.x;
    r.agent.y = capsules[0]!.y;
    addEnemy(r, 'glucose', r.agent.x + 900, r.agent.y);
    stepRun(r, STILL, DT);
    expect(r.freedAgent).toBe('caffeine');
    expect(r.pickups.some((p) => p.kind === 'agentCapsule')).toBe(false);
    const saved = recordRun(base(), runResult(r)).save;
    expect(saved.meta.agents).toContain('caffeine');
  });

  it('sem agente preso, não nasce', () => {
    const rules = { ...rulesWithoutSpawn(), lockedAgents: [] };
    const r = createRun(1, rules, 'dopamine');
    r.time = rules.drops.agentCapsule.fromMinute * 60;
    stepRun(r, STILL, DT);
    expect(r.pickups.some((p) => p.kind === 'agentCapsule')).toBe(false);
  });
});

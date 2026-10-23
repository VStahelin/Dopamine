import { describe, expect, it } from 'vitest';
import { AGENTS, MAP } from '../../config';
import { rulesWithLocal } from '../organism/local';
import { agentFxSpeed } from './behaviors';
import { damageEnemy } from './combat';
import { DEFAULT_RULES } from './rules';
import { addEnemy, createRun, type RunState } from './state';
import { stepRun } from './step';
import { DT, STILL, rulesWithoutSpawn } from './testRules';

function run(): RunState {
  const r = createRun(1, rulesWithoutSpawn());
  r.weapons = [];
  return r;
}

/** Avança a run; o agente não morre nem para em escolhas. */
function advance(r: RunState, seconds: number) {
  const steps = Math.ceil(seconds / DT);
  for (let i = 0; i < steps; i++) {
    r.pendingLevelUps = 0;
    r.capsule = null;
    r.ampoule = null;
    r.agent.interactions = r.stats.maxInteractions;
    stepRun(r, STILL, DT);
    expect(r.over).toBe(false);
  }
}

describe('comportamento por família (fase 5.14)', () => {
  it('o Peróxido estoura ao encostar: tira interações e some', () => {
    const r = run();
    const before = r.agent.interactions;
    const e = addEnemy(r, 'hydrogenPeroxide', r.agent.x + 5, r.agent.y);
    stepRun(r, STILL, DT);
    stepRun(r, STILL, DT);
    expect(r.enemies).not.toContain(e);
    expect(r.agent.interactions).toBeLessThan(before);
    expect(r.kills).toBe(0);
  });

  it('a Adrenalina some sozinha, sem recompensa', () => {
    const r = run();
    const e = addEnemy(r, 'adrenaline', r.agent.x + 2000, r.agent.y);
    e.speed = 0;
    advance(r, 13);
    expect(r.enemies).not.toContain(e);
    expect(r.kills).toBe(0);
  });

  it('decompor a Adrenalina acelera o agente por alguns segundos', () => {
    const r = run();
    const e = addEnemy(r, 'adrenaline', r.agent.x + 300, r.agent.y);
    damageEnemy(r, e, e.hp * 2);
    expect(agentFxSpeed(r)).toBeCloseTo(1 + r.rules.run.agentEffects.adrenaline.mobility);
    advance(r, r.rules.run.agentEffects.adrenaline.seconds + 0.5);
    expect(agentFxSpeed(r)).toBe(1);
  });

  it('o Acetaldeído deixa uma poça que deixa o agente lento e tira interações', () => {
    const r = run();
    const e = addEnemy(r, 'acetaldehyde', r.agent.x, r.agent.y);
    damageEnemy(r, e, e.hp * 2);
    expect(r.hazards).toHaveLength(1);
    r.agent.invulnerableFor = 0;
    const before = r.agent.interactions;
    for (let i = 0; i < 1.2 / DT; i++) stepRun(r, STILL, DT);
    expect(agentFxSpeed(r)).toBeCloseTo(1 + r.rules.run.agentEffects.slow.mobility);
    expect(r.agent.interactions).toBeLessThan(before);
    advance(r, 3);
    expect(r.hazards).toHaveLength(0);
  });

  it('a Citocina solta Bradicininas até o teto', () => {
    const r = run();
    const c = addEnemy(r, 'cytokine', r.agent.x + 2000, r.agent.y);
    advance(r, 60);
    const kids = r.enemies.filter((e) => e.parent === c.id);
    const spawner = r.rules.enemies.cytokine.behaviors?.find((b) => b.kind === 'spawner');
    expect(kids.length).toBe(spawner?.kind === 'spawner' ? spawner.max : -1);
    expect(kids.every((k) => k.kind === 'bradykinin')).toBe(true);
  });

  it('o Cortisol acelera e protege quem está na aura, e fica longe do agente', () => {
    const r = run();
    const cortisol = addEnemy(r, 'cortisol', r.agent.x + 400, r.agent.y);
    const near = addEnemy(r, 'glucose', r.agent.x + 440, r.agent.y);
    const far = addEnemy(r, 'glucose', r.agent.x - 400, r.agent.y);
    stepRun(r, STILL, DT);
    expect(near.slow).toBeGreaterThan(1);
    expect(near.vulnerability).toBeLessThan(0);
    expect(far.slow).toBe(1);
    r.enemies = [cortisol];
    advance(r, 15);
    const d = Math.hypot(cortisol.x - r.agent.x, cortisol.y - r.agent.y);
    expect(d).toBeGreaterThan(150);
  });
});

describe('chefe por local', () => {
  function bossRun(env: keyof typeof MAP.environments) {
    const base = rulesWithoutSpawn();
    const rules = rulesWithLocal(
      { ...base, run: { ...base.run, bosses: DEFAULT_RULES.run.bosses } },
      { env, random: false },
      AGENTS.insulin,
    );
    const r = createRun(1, rules, 'insulin');
    r.weapons = [];
    return r;
  }

  it('no Fígado, o chefe dos 5 minutos é o NAPQI', () => {
    const r = bossRun('liver');
    advance(r, 5 * 60 + 1);
    expect(r.enemies.some((e) => e.kind === 'napqi')).toBe(true);
    expect(r.enemies.some((e) => e.kind === 'ldl')).toBe(false);
  });
});

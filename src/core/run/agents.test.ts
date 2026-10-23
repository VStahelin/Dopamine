import { describe, expect, it } from 'vitest';
import { AGENTS, type AgentId } from '../../config';
import { damageEnemy } from './combat';
import { hurtAgent } from './hurt';
import { actionMods, prodrugMultiplier, updateSpecial } from './specials';
import { addEnemy, createRun, type RunState } from './state';
import { stepRun } from './step';
import { DT, STILL, rulesWithoutSpawn } from './testRules';
import { paramsOf } from './weapons';
import { statSources } from './upgrades';

function run(agent: AgentId): RunState {
  return createRun(1, rulesWithoutSpawn(), agent);
}

/** Dispara o especial com uma carga pronta. */
function useSpecial(r: RunState) {
  r.special.charges = 1;
  updateSpecial(r, true, DT);
}

describe('elenco completo (fase 5.15)', () => {
  it('os nove agentes rodam um minuto sem quebrar', () => {
    for (const id of Object.keys(AGENTS) as AgentId[]) {
      const r = createRun(3, rulesWithoutSpawn(), id);
      for (let i = 0; i < 12; i++) addEnemy(r, 'glucose', r.agent.x + 60 + i * 10, r.agent.y);
      for (let t = 0; t < 60 / DT; t++) {
        r.pendingLevelUps = 0;
        r.agent.interactions = r.stats.maxInteractions;
        stepRun(r, { ...STILL, special: t === 30 }, DT);
      }
      expect(r.over).toBe(false);
      expect(r.kills).toBeGreaterThan(0);
    }
  });

  it('Vitamina C: o escudo bloqueia o próximo golpe', () => {
    const r = run('vitaminC');
    useSpecial(r);
    const before = r.agent.interactions;
    hurtAgent(r, 15);
    expect(r.agent.interactions).toBe(before);
    expect(r.events.some((e) => e.type === 'shielded')).toBe(true);
    expect(r.special.active).toBe(0);
    hurtAgent(r, 15);
    expect(r.agent.interactions).toBeLessThan(before);
  });

  it('Cafeína: anda mais rápido (PERFIL) e o Alerta dispara em anel e devolve recarga', () => {
    const r = run('caffeine');
    const profile = AGENTS.caffeine.profile!.moveSpeed!;
    expect(r.stats.moveSpeed).toBeCloseTo(1 + profile);
    expect(statSources(r, 'moveSpeed')).toContainEqual({ source: 'native', amount: profile });
    const def = AGENTS.caffeine.special;
    useSpecial(r);
    expect(r.projectiles).toHaveLength(def.count!);
    expect(r.special.cooldown).toBeCloseTo(def.cooldownSeconds * (1 - def.refund!));
  });

  it('Cafeína: a Rajada sai dividida em volta do agente', () => {
    const r = run('caffeine');
    addEnemy(r, 'glucose', r.agent.x + 80, r.agent.y);
    stepRun(r, STILL, DT);
    const angles = r.projectiles.map((p) => Math.atan2(p.vy, p.vx)).sort((a, b) => a - b);
    expect(angles).toHaveLength(4);
    for (let i = 1; i < angles.length; i++) {
      expect(angles[i]! - angles[i - 1]!).toBeCloseTo(Math.PI / 2);
    }
  });

  it('Venvanse: pró-fármaco começa em 40% e o feixe acerta só o primeiro', () => {
    const r = run('venvanse');
    const p = AGENTS.venvanse.prodrug!;
    expect(prodrugMultiplier(r)).toBeCloseTo(p.startMultiplier);
    expect(actionMods(r).damage).toBeCloseTo(p.startMultiplier);
    r.time = p.fullMinutes * 60;
    expect(prodrugMultiplier(r)).toBe(1);
    const near = addEnemy(r, 'starch', r.agent.x + 40, r.agent.y);
    const far = addEnemy(r, 'starch', r.agent.x + 120, r.agent.y);
    stepRun(r, STILL, DT);
    expect(near.hp).toBeLessThan(near.maxHp);
    expect(far.hp).toBe(far.maxHp);
  });

  it('Venvanse: o Hiperfoco desacelera os inimigos', () => {
    const r = run('venvanse');
    const e = addEnemy(r, 'glucose', r.agent.x + 300, r.agent.y);
    useSpecial(r);
    stepRun(r, STILL, DT);
    expect(e.slow).toBeCloseTo(1 - AGENTS.venvanse.special.slow!);
  });

  it('Serotonina: a Calmaria desliga a aura do Cortisol e fere o estresse', () => {
    const r = run('serotonin');
    r.weapons = [];
    const cortisol = addEnemy(r, 'cortisol', r.agent.x + 400, r.agent.y);
    const near = addEnemy(r, 'glucose', r.agent.x + 440, r.agent.y);
    stepRun(r, STILL, DT);
    expect(near.slow).toBeGreaterThan(1);
    useSpecial(r);
    expect(cortisol.hp).toBeLessThan(cortisol.maxHp);
    stepRun(r, STILL, DT);
    expect(near.slow).toBe(1);
  });

  it('Ocitocina: o Vínculo dobra os aliados', () => {
    const r = run('oxytocin');
    const base = paramsOf(r, r.weapons[0]!, 0).count;
    useSpecial(r);
    expect(paramsOf(r, r.weapons[0]!, 0).count).toBe(base * 2);
  });

  it('Álcool desidrogenase: termina a cascata e a Desintoxicação limpa as poças', () => {
    const r = run('alcoholDehydrogenase');
    const e = addEnemy(r, 'acetaldehyde', r.agent.x + 300, r.agent.y);
    damageEnemy(r, e, e.hp * 2);
    expect(r.enemies.filter((x) => x.hp > 0 && x.kind === 'ethanol')).toHaveLength(0);
    expect(r.hazards).toHaveLength(0);
    r.hazards.push({ x: 0, y: 0, radius: 30, life: 3, maxLife: 3 });
    const toxin = addEnemy(r, 'ethanol', r.agent.x + 300, r.agent.y);
    useSpecial(r);
    expect(r.hazards).toHaveLength(0);
    expect(toxin.hp).toBeLessThan(toxin.maxHp);
  });
});

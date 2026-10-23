import { describe, expect, it } from 'vitest';
import type { AgentId, WeaponId } from '../../config';
import { DEFAULT_RULES, type RunRules } from './rules';
import { addEnemy, createRun, drainEvents, newWeapon, type RunState } from './state';
import { stepRun } from './step';
import { DT, rulesWithoutSpawn, STILL } from './testRules';
import { applyChoice, levelUpOffer } from './upgrades';
import { weaponMaxLevel } from './weaponParams';

/** Regras sem nascimentos, com as ações reais dos agentes. */
function quietRules(): RunRules {
  const r = rulesWithoutSpawn();
  return { ...r, agents: DEFAULT_RULES.agents };
}

/** Run só com a arma dada (no lugar da ação do agente). */
function runWith(weapon: WeaponId, agent: AgentId = 'dopamine'): RunState {
  const run = createRun(1, quietRules(), agent);
  run.weapons = [newWeapon(weapon)];
  return run;
}

function steps(run: RunState, n: number, input = STILL) {
  for (let i = 0; i < n; i++) stepRun(run, input, DT);
}

function still(run: RunState, kind: Parameters<typeof addEnemy>[1], x: number, y: number) {
  const e = addEnemy(run, kind, x, y);
  e.speed = 0;
  return e;
}

describe('cascata', () => {
  it('triglicerídeo decomposto vira 1 glicerol + 3 ácidos graxos', () => {
    const run = runWith('radical');
    const e = still(run, 'triglyceride', 300, 0);
    e.hp = 0.1;
    run.weapons = [];
    run.agent.x = 290;
    // Um golpe qualquer mata e solta os fragmentos.
    run.weapons = [newWeapon('lipaseStrike')];
    steps(run, 2);
    const kinds = run.enemies.map((x) => x.kind).sort();
    expect(kinds).toEqual(['fattyAcid', 'fattyAcid', 'fattyAcid', 'glycerol']);
  });

  it('amido vira maltoses, que viram glicoses', () => {
    expect(DEFAULT_RULES.enemies.starch.fragments).toEqual([{ kind: 'maltose', count: 3 }]);
    expect(DEFAULT_RULES.enemies.maltose.fragments).toEqual([{ kind: 'glucose', count: 2 }]);
  });
});

describe('efetividade por tipo', () => {
  it('Lipase é forte contra lipídios e fraca contra açúcares', () => {
    const run = runWith('lipaseStrike', 'lipase');
    run.stats.critChance = 0;
    const fat = still(run, 'triglyceride', 30, 0);
    steps(run, 1);
    const sugar = still(run, 'starch', -30, 0);
    run.weapons[0]!.cooldown = 0;
    steps(run, 1);
    const dmg = run.rules.weapons.lipaseStrike.base.damage;
    expect(fat.maxHp - fat.hp).toBeCloseTo(dmg * 1.5 * run.stats.eliteDamage);
    expect(sugar.maxHp - sugar.hp).toBeCloseTo(dmg * 0.5 * run.stats.eliteDamage);
  });
});

describe('tipos de arma', () => {
  it('pulso: o anel cresce e acerta quem está no caminho', () => {
    const run = runWith('dopaminePulse');
    const e = still(run, 'starch', 40, 0);
    steps(run, 30);
    expect(e.hp).toBeLessThan(e.maxHp);
  });

  it('cone: acerta na direção do alvo, não atrás', () => {
    const run = runWith('acidJet');
    const front = still(run, 'starch', 40, 0);
    const back = still(run, 'starch', -40, 0);
    front.radius = back.radius = 4;
    steps(run, 1);
    expect(front.hp).toBeLessThan(front.maxHp);
    expect(back.hp).toBe(back.maxHp);
  });

  it('órbita: os elétrons acertam quem passa', () => {
    const run = runWith('electronCloud');
    const e = still(run, 'starch', 34, 0);
    steps(run, 120);
    expect(e.hp).toBeLessThan(e.maxHp);
  });

  it('aura: dano contínuo e vulnerabilidade de quem está dentro', () => {
    const run = runWith('catalyst');
    const e = still(run, 'starch', 30, 0);
    steps(run, 2);
    expect(e.hp).toBeLessThan(e.maxHp);
    expect(e.vulnerability).toBeCloseTo(DEFAULT_RULES.weapons.catalyst.vulnerability!);
  });

  it('campo da Insulina puxa açúcares e não puxa lipídios', () => {
    const run = runWith('insulinField', 'insulin');
    const sugar = still(run, 'starch', 60, 0);
    const fat = still(run, 'triglyceride', -60, 0);
    sugar.hp = fat.hp = 1e6;
    steps(run, 30);
    expect(sugar.x).toBeLessThan(60);
    expect(fat.x).toBe(-60);
  });

  it('poça: deixa mais lento e causa dano', () => {
    const run = runWith('solventPool');
    const e = still(run, 'starch', 80, 0);
    steps(run, 40);
    expect(run.zones.length).toBe(1);
    expect(e.slow).toBeCloseTo(1 - DEFAULT_RULES.weapons.solventPool.slow!);
    expect(e.hp).toBeLessThan(e.maxHp);
  });

  it('feixe: atravessa todos na linha', () => {
    const run = runWith('uvRay');
    const a = still(run, 'starch', 60, 0);
    const b = still(run, 'starch', 150, 0);
    steps(run, 1);
    expect(a.hp).toBeLessThan(a.maxHp);
    expect(b.hp).toBeLessThan(b.maxHp);
    expect(drainEvents(run).some((ev) => ev.type === 'beam')).toBe(true);
  });
});

describe('level up com armas', () => {
  it('oferece armas novas enquanto houver espaço', () => {
    const run = createRun(3, quietRules());
    run.pendingLevelUps = 1;
    run.stats.choices = 5;
    const kinds = new Set<string>();
    for (let i = 0; i < 40; i++) {
      run.offer = null;
      for (const c of levelUpOffer(run)) if (c.kind === 'weapon' && c.level === 1) kinds.add(c.id);
    }
    expect(kinds.size).toBeGreaterThan(3);
  });

  it('com os espaços de arma cheios, não oferece armas novas', () => {
    const run = createRun(3, quietRules());
    run.weapons.push(newWeapon('radical'), newWeapon('acidJet'), newWeapon('uvRay'));
    run.pendingLevelUps = 1;
    for (let i = 0; i < 30; i++) {
      run.offer = null;
      for (const c of levelUpOffer(run)) {
        if (c.kind === 'weapon') expect(run.weapons.some((w) => w.id === c.id)).toBe(true);
      }
    }
  });

  it('arma no máximo + reagente aparece como evolução e vira a arma evoluída', () => {
    const run = createRun(3, quietRules());
    const radical = newWeapon('radical');
    radical.level = weaponMaxLevel(DEFAULT_RULES.weapons.radical);
    run.weapons.push(radical);
    run.passives.peroxide = { level: 1, bonus: 0.05 };
    run.pendingLevelUps = 1;
    const evo = levelUpOffer(run).find((c) => c.kind === 'evolve');
    expect(evo).toEqual({ kind: 'evolve', id: 'radical', into: 'fenton' });
    applyChoice(run, evo!);
    expect(run.weapons.map((w) => w.id)).toContain('fenton');
    expect(run.weapons.map((w) => w.id)).not.toContain('radical');
  });

  it('as evoluções da fase 5.15: Plasma, Solvente universal e Fissão', () => {
    const pairs = [
      ['electronCloud', 'argon', 'plasma'],
      ['solventPool', 'ether', 'universalSolvent'],
      ['chainReaction', 'uranium', 'fission'],
    ] as const;
    for (const [weapon, reagent, into] of pairs) {
      const run = createRun(3, quietRules());
      const w = newWeapon(weapon);
      w.level = weaponMaxLevel(DEFAULT_RULES.weapons[weapon]);
      run.weapons.push(w);
      run.passives[reagent] = { level: 1, bonus: 0 };
      run.pendingLevelUps = 1;
      const evo = levelUpOffer(run).find((c) => c.kind === 'evolve');
      expect(evo).toEqual({ kind: 'evolve', id: weapon, into });
      applyChoice(run, evo!);
      expect(run.weapons.map((x) => x.id)).toContain(into);
      for (let i = 0; i < 120; i++) {
        addEnemy(run, 'glucose', run.agent.x + 40 + i, run.agent.y);
        stepRun(run, STILL, DT);
      }
      expect(run.kills).toBeGreaterThan(0);
    }
  });
});

describe('especiais', () => {
  it('Pico de recompensa acelera a ação e depois vem a queda', () => {
    const run = createRun(1, quietRules(), 'dopamine');
    stepRun(run, { ...STILL, special: true }, DT);
    expect(run.special.active).toBeGreaterThan(0);
    steps(run, 60 * 6);
    expect(run.special.active).toBe(0);
    expect(run.special.crash).toBeGreaterThan(0);
    // Em recarga: apertar de novo não faz nada.
    stepRun(run, { ...STILL, special: true }, DT);
    expect(run.special.active).toBe(0);
  });

  it('Emulsão deixa os lipídios dentro dela frágeis', () => {
    const run = createRun(1, quietRules(), 'lipase');
    run.weapons = [];
    const fat = still(run, 'triglyceride', 30, 0);
    const sugar = still(run, 'starch', -30, 0);
    stepRun(run, { ...STILL, special: true }, DT);
    stepRun(run, STILL, DT);
    expect(fat.vulnerability).toBeGreaterThan(0);
    expect(sugar.vulnerability).toBe(0);
  });

  it('Captação puxa e machuca os açúcares da tela', () => {
    const run = createRun(1, quietRules(), 'insulin');
    run.weapons = [];
    const sugar = still(run, 'starch', 200, 0);
    const fat = still(run, 'triglyceride', -200, 0);
    stepRun(run, { ...STILL, special: true }, DT);
    expect(sugar.x).toBeLessThan(200);
    expect(sugar.hp).toBeLessThan(sugar.maxHp);
    expect(fat.hp).toBe(fat.maxHp);
  });
});

describe('chefe', () => {
  it('a Partícula de LDL nasce no minuto 5', () => {
    const rules = quietRules();
    const run = createRun(1, { ...rules, run: { ...rules.run, bosses: DEFAULT_RULES.run.bosses } });
    run.weapons = [];
    run.time = 5 * 60 - DT / 2;
    stepRun(run, STILL, DT);
    expect(run.enemies.some((e) => e.kind === 'ldl' && e.boss)).toBe(true);
    expect(drainEvents(run).some((ev) => ev.type === 'boss')).toBe(true);
  });
});

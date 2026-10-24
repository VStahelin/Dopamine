import { META, SECTORS, type EnemyKind, type PassiveId, type WeaponId } from '../../config';
import { damageEnemy } from '../run/combat';
import { addAggregate } from '../run/aggregates';
import { enemyHpAt } from '../run/progression';
import { addEnemy, newWeapon, type RunState } from '../run/state';
import { applySupplement } from '../run/supplements';
import { passiveAmount, applyUpgrade, refreshStats } from '../run/upgrades';
import { weaponMaxLevel } from '../run/weaponParams';
import { botAdvance, maxedProgress } from '../sim/simulate';
import type { SaveData } from '../save/saveData';

/**
 * Modo admin (decisão 0039): comandos para testar sem jogar horas. Cada comando recebe a run
 * (quando há uma aberta) e o save, e devolve o save novo e uma mensagem. Sem Phaser: os mesmos
 * comandos rodam no painel, no console e nos testes.
 */
export interface AdminContext {
  save: SaveData;
  run?: RunState;
}

export interface AdminResult {
  ok: boolean;
  message: string;
  save: SaveData;
}

interface Command {
  args: string;
  help: string;
  /** Só faz sentido com uma run aberta. */
  run?: boolean;
  exec(ctx: AdminContext, args: string[]): AdminResult | string;
}

/** Distância em que `spawn` põe as moléculas em volta do agente. */
const SPAWN_DISTANCE = 140;

const fail = (ctx: AdminContext, message: string): AdminResult => ({
  ok: false,
  message,
  save: ctx.save,
});
const done = (ctx: AdminContext, message: string, save = ctx.save): AdminResult => ({
  ok: true,
  message,
  save,
});

/** Tira acento, espaço e caixa, para "Ácido graxo" bater com "acidograxo". */
function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase();
}

/** Acha o id pelo próprio id ou pelo nome, sem acento nem espaço. */
export function findId<T extends string>(
  defs: Record<T, { name: string }>,
  query: string | undefined,
): T | undefined {
  if (!query) return undefined;
  const q = normalize(query);
  const ids = Object.keys(defs) as T[];
  return (
    ids.find((id) => normalize(id) === q) ??
    ids.find((id) => normalize(defs[id].name) === q) ??
    ids.find((id) => normalize(defs[id].name).startsWith(q))
  );
}

function int(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.floor(n) : fallback;
}

/** Pula o relógio da run, sem os chefes e agregados perdidos nascerem de uma vez. */
function jumpTo(run: RunState, seconds: number): void {
  run.time = seconds;
  run.rules.run.bosses.forEach((b, i) => {
    const passed = Math.floor(seconds / (b.everyMinutes * 60));
    run.bossesSpawned[i] = b.max !== undefined ? Math.min(b.max, passed) : passed;
  });
  run.nextAggregateAt = -1;
}

function giveWeapon(run: RunState, id: WeaponId, level: number): number {
  const max = weaponMaxLevel(run.rules.weapons[id]);
  const target = Math.max(1, Math.min(max, level));
  let w = run.weapons.find((x) => x.id === id);
  if (!w) {
    w = newWeapon(id);
    run.weapons.push(w);
  }
  w.level = target;
  w.boosts = Array.from({ length: target - 1 }, (_, i) => w.boosts[i] ?? 1);
  return target;
}

const COMMANDS: Record<string, Command> = {
  help: {
    args: '',
    help: 'lista os comandos',
    exec: (ctx) =>
      done(
        ctx,
        Object.entries(COMMANDS)
          .map(([name, c]) => `${name} ${c.args}`.trim() + ` — ${c.help}`)
          .join('\n'),
      ),
  },
  time: {
    args: '<minuto>',
    help: 'pula o relógio da run (a build fica a mesma)',
    run: true,
    exec: (ctx, [m]) => {
      const minute = Number(m);
      if (!Number.isFinite(minute) || minute < 0) return 'Uso: time <minuto>';
      jumpTo(ctx.run!, minute * 60);
      return done(ctx, `Relógio em ${minute} min.`);
    },
  },
  ff: {
    args: '<minuto>',
    help: 'avança a run com o robô jogando, sem dano, até o minuto',
    run: true,
    exec: (ctx, [m]) => {
      const run = ctx.run!;
      const minute = Number(m);
      if (!Number.isFinite(minute) || minute * 60 <= run.time) return 'Uso: ff <minuto futuro>';
      const god = run.admin.god;
      run.admin.god = true;
      botAdvance(run, minute * 60);
      run.admin.god = god;
      return done(ctx, `Run avançada até ${Math.floor(run.time / 60)} min, nível ${run.level}.`);
    },
  },
  god: {
    args: '[on|off]',
    help: 'agente sem dano',
    run: true,
    exec: (ctx, [v]) => {
      const run = ctx.run!;
      run.admin.god = v === 'on' ? true : v === 'off' ? false : !run.admin.god;
      return done(ctx, `Sem dano: ${run.admin.god ? 'ligado' : 'desligado'}.`);
    },
  },
  give: {
    args: '<arma> [nível]',
    help: 'dá a arma no nível (padrão: o máximo)',
    run: true,
    exec: (ctx, [name, lv]) => {
      const run = ctx.run!;
      const id = findId(run.rules.weapons, name);
      if (!id) return `Arma não encontrada: ${name ?? ''}`;
      const level = giveWeapon(run, id, int(lv, Infinity));
      refreshStats(run);
      return done(ctx, `${run.rules.weapons[id].name} no nível ${level}.`);
    },
  },
  receptor: {
    args: '<receptor> [nível]',
    help: 'põe o receptor no nível (padrão: o máximo)',
    run: true,
    exec: (ctx, [name, lv]) => {
      const run = ctx.run!;
      const id = findId(run.rules.passives, name) as PassiveId | undefined;
      if (!id) return `Receptor não encontrado: ${name ?? ''}`;
      const def = run.rules.passives[id];
      const target = Math.max(0, Math.min(def.maxLevel, int(lv, def.maxLevel)));
      const amount = passiveAmount(def, 1);
      run.passives[id] = { level: target, bonus: amount * target };
      refreshStats(run);
      return done(ctx, `${def.name} no nível ${target}.`);
    },
  },
  supl: {
    args: '<suplemento> [cópias]',
    help: 'toma o suplemento',
    run: true,
    exec: (ctx, [name, n]) => {
      const run = ctx.run!;
      const id = findId(run.rules.supplements.items, name);
      if (!id) return `Suplemento não encontrado: ${name ?? ''}`;
      const copies = Math.max(1, int(n, 1));
      for (let i = 0; i < copies; i++) applySupplement(run, id);
      return done(ctx, `${run.rules.supplements.items[id]!.name} ×${copies}.`);
    },
  },
  level: {
    args: '<n>',
    help: 'ganha n level ups (as cartas aparecem)',
    run: true,
    exec: (ctx, [n]) => {
      const count = Math.max(1, int(n, 1));
      ctx.run!.pendingLevelUps += count;
      return done(ctx, `+${count} level ups.`);
    },
  },
  heal: {
    args: '',
    help: 'enche as interações',
    run: true,
    exec: (ctx) => {
      const run = ctx.run!;
      applyUpgrade(run, { kind: 'heal', amount: run.stats.maxInteractions });
      return done(ctx, 'Interações cheias.');
    },
  },
  spawn: {
    args: '<molécula> [n]',
    help: 'põe moléculas em volta do agente (chefes também)',
    run: true,
    exec: (ctx, [name, n]) => {
      const run = ctx.run!;
      const kind = findId(run.rules.enemies, name) as EnemyKind | undefined;
      if (!kind) return `Molécula não encontrada: ${name ?? ''}`;
      const count = Math.max(1, Math.min(200, int(n, 1)));
      const hp = enemyHpAt(run.time, run.rules.economy.difficulty);
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        addEnemy(
          run,
          kind,
          run.agent.x + Math.cos(a) * SPAWN_DISTANCE,
          run.agent.y + Math.sin(a) * SPAWN_DISTANCE,
          hp,
        );
      }
      return done(ctx, `${run.rules.enemies[kind].name} ×${count}.`);
    },
  },
  aggregate: {
    args: '',
    help: 'chama um agregado agora',
    run: true,
    exec: (ctx) => {
      const run = ctx.run!;
      const hp = enemyHpAt(run.time, run.rules.economy.difficulty);
      const e = addAggregate(run, run.agent.x + SPAWN_DISTANCE, run.agent.y, hp);
      return e ? done(ctx, 'Agregado chamado.') : 'Nenhuma molécula pode virar agregado agora.';
    },
  },
  clear: {
    args: '',
    help: 'decompõe todas as moléculas do campo (com gema e ATP)',
    run: true,
    exec: (ctx) => {
      const run = ctx.run!;
      const alive = run.enemies.filter((e) => e.hp > 0);
      for (const e of alive) damageEnemy(run, e, e.hp);
      return done(ctx, `${alive.length} moléculas decompostas.`);
    },
  },
  atp: {
    args: '<n>',
    help: 'soma ATP ao save',
    exec: (ctx, [n]) => {
      const amount = int(n, NaN);
      if (!Number.isFinite(amount)) return 'Uso: atp <n>';
      const save = { ...ctx.save, atp: Math.max(0, ctx.save.atp + amount) };
      return done(ctx, `ATP: ${save.atp}.`, save);
    },
  },
  stars: {
    args: '<0-3>',
    help: 'estrelas do caso atual',
    exec: (ctx, [n]) => {
      const stars = Math.max(0, Math.min(3, int(n, NaN)));
      if (!Number.isFinite(stars)) return 'Uso: stars <0-3>';
      const save = { ...ctx.save, meta: { ...ctx.save.meta, stars } };
      return done(ctx, `Estrelas: ${stars}.`, save);
    },
  },
  unlock: {
    args: '',
    help: 'libera todos os agentes, armas e receptores',
    exec: (ctx) => {
      const all = maxedProgress(META);
      const save = {
        ...ctx.save,
        meta: {
          ...ctx.save.meta,
          agents: all.agents,
          weapons: all.weapons,
          receptors: all.receptors,
        },
      };
      return done(ctx, 'Tudo liberado.', save);
    },
  },
  lab: {
    args: '',
    help: 'Laboratório no máximo',
    exec: (ctx) => {
      const save = { ...ctx.save, meta: { ...ctx.save.meta, lab: maxedProgress(META).lab } };
      return done(ctx, 'Laboratório no máximo.', save);
    },
  },
  organism: {
    args: '<setor> <valor>',
    help: 'muda um setor de saúde (0 a 100)',
    exec: (ctx, [sector, v]) => {
      const s = SECTORS.find((x) => normalize(x) === normalize(sector ?? ''));
      const value = Number(v);
      if (!s || !Number.isFinite(value)) return `Uso: organism <${SECTORS.join('|')}> <0-100>`;
      const organism = {
        ...ctx.save.organism,
        sectors: { ...ctx.save.organism.sectors, [s]: Math.max(0, Math.min(100, value)) },
      };
      return done(ctx, `${s}: ${organism.sectors[s]}.`, { ...ctx.save, organism });
    },
  },
};

/** Separa o texto em comando e argumentos: "give radical 8" → ["give", ["radical", "8"]]. */
export function parseCommand(text: string): { name: string; args: string[] } {
  const [name = '', ...args] = text.trim().split(/\s+/);
  return { name: name.toLowerCase(), args };
}

/** Nomes dos comandos, para o painel e o autocompletar. */
export const COMMAND_NAMES = Object.keys(COMMANDS);

/** Roda um comando escrito. Comandos de run sem run aberta não fazem nada. */
export function runCommand(ctx: AdminContext, text: string): AdminResult {
  const { name, args } = parseCommand(text);
  const command = COMMANDS[name];
  if (!command) return fail(ctx, `Comando desconhecido: ${name}. Use help.`);
  if (command.run && !ctx.run) return fail(ctx, `${name} só funciona durante uma run.`);
  const result = command.exec(ctx, args);
  if (typeof result === 'string') return fail(ctx, result);
  if (ctx.run && result.ok) ctx.run.admin.commands++;
  return result;
}

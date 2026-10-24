import wikiText from '../../../../docs/wiki.md?raw';
import {
  AGENTS,
  DROPS,
  ENEMIES,
  ITEM_IDS,
  MAP,
  MAP_ENVIRONMENTS,
  ORGANISM,
  PASSIVES,
  RARITIES,
  RUN,
  SUPPLEMENTS,
  WEAPONS,
  type AgentId,
  type EnemyKind,
  type MapEnvironment,
  type MoleculeType,
  type PassiveId,
  type WeaponId,
} from '../../../config';
import { isUnlocked } from '../../../core/meta/progress';
import { weaponMaxLevel } from '../../../core/run/weaponParams';
import type { SaveData } from '../../../core/save/saveData';
import { parseWiki } from '../../../core/wiki';
import { PALETTE, PALETTE_CSS } from '../../render/palette';
import { AGENT_TEXTURES, ENEMY_TEXTURES, iconTexture, type IconRef } from '../../render/textures';
import { KIND_NAMES, TYPE_NAMES } from '../catalogViews';
import { familyText, floorColor } from '../locals';
import { formatTime } from '../theme';
import { receptorGain } from '../upgradeText';

/** As páginas do docs/wiki.md, que viram o Guia do jogo e o texto dos verbetes do registro. */
export const WIKI = parseWiki(wikiText);

/** Desenho do verbete: molécula, ícone 16×16, pedaço de chão ou o livro da wiki. */
export type EntryArt =
  | { kind: 'molecule'; key: string }
  | { kind: 'icon'; ref: IconRef }
  | { kind: 'tile'; env: MapEnvironment }
  | { kind: 'book' };

export interface EntryLink {
  label: string;
  cat: string;
  id: string;
}

/** Um verbete do Compêndio (prancheta "Compêndio"): o que aparece na lista e na ficha. */
export interface CompendiumEntry {
  id: string;
  name: string;
  /** Já encontrado; senão a ficha mostra "???" e a dica de onde achar. */
  seen: boolean;
  /** Encontrado e ainda não aberto no Compêndio. */
  isNew: boolean;
  tag: string;
  tagColor: string;
  /** Linha curta da lista. */
  sub: string;
  /** Onde achar, para quem ainda não encontrou. */
  hint: string;
  text: string;
  /** Ficha: números do jogo. */
  stats: [string, string][];
  /** Números do jogador (decompostas, runs, melhor tempo). */
  mine: [string, string][];
  links: EntryLink[];
  art: EntryArt;
  /** Cor do anel de dentro da moldura do desenho. */
  ring: number;
}

export interface CompendiumCategory {
  id: string;
  name: string;
  group: 'reg' | 'guide';
  blurb: string;
  art: EntryArt;
  entries: CompendiumEntry[];
}

const fmt = (n: number) => Math.round(n).toLocaleString('pt-BR');
const dec = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 2 });

/** Tipo no singular, para a etiqueta de cada molécula. */
const TYPE_NAME: Record<MoleculeType, string> = {
  lipid: 'LIPÍDIO',
  sugar: 'AÇÚCAR',
  radical: 'RADICAL',
  stress: 'ESTRESSE',
  toxin: 'TOXINA',
  inflammation: 'INFLAMAÇÃO',
};

/** Cor da família de molécula (etiquetas e anéis). */
const TYPE_COLOR: Record<MoleculeType, string> = {
  sugar: '#F2C83A',
  lipid: '#E0A060',
  radical: '#7EF0FF',
  stress: '#FF6FA8',
  toxin: '#A6C83A',
  inflammation: '#FF8A7A',
};

/** Verbete da wiki pelo título, para o texto do registro ("Dopamina", "Sinapse"). */
function wikiEntry(title: string): string {
  const t = title.toLowerCase();
  for (const page of WIKI) {
    const e = page.entries.find((x) => x.title.toLowerCase() === t);
    if (e) return e.lines.join('\n');
  }
  return '';
}

/** Primeira frase, para a linha curta da lista. */
function firstLine(text: string): string {
  const line = text.split('\n')[0] ?? '';
  const dot = line.indexOf('. ');
  return dot > 0 ? line.slice(0, dot + 1) : line;
}

/** Monta as categorias com o que o save já encontrou e o que já foi aberto. */
export function buildCompendium(save: SaveData): CompendiumCategory[] {
  const read = new Set(save.compendiumRead ?? []);
  const fresh = (cat: string, id: string, seen: boolean) =>
    seen && save.compendiumRead !== null && !read.has(`${cat}:${id}`);
  const cats: CompendiumCategory[] = [
    molecules(save, fresh),
    formations(save, fresh),
    agents(save, fresh),
    weapons(save, fresh),
    receptors(save, fresh),
    supplements(save, fresh),
    items(save, fresh),
    structures(save, fresh),
    maps(save, fresh),
    ...guide(),
  ];
  return cats;
}

/** Chaves "categoria:id" de tudo que já foi encontrado (para não marcar NOVO num save antigo). */
export function seenKeys(cats: CompendiumCategory[]): string[] {
  return cats.flatMap((c) => c.entries.filter((e) => e.seen).map((e) => `${c.id}:${e.id}`));
}

type Fresh = (cat: string, id: string, seen: boolean) => boolean;

function molecules(save: SaveData, fresh: Fresh): CompendiumCategory {
  const kinds = Object.keys(ENEMIES) as EnemyKind[];
  const entries = kinds.map((kind): CompendiumEntry => {
    const def = ENEMIES[kind];
    const seen = save.seen.includes(kind);
    const frags = def.fragments ?? [];
    const parents = kinds.filter((k) => ENEMIES[k].fragments?.some((f) => f.kind === kind));
    const strong = (Object.keys(AGENTS) as AgentId[]).filter(
      (a) => AGENTS[a].affinity[def.type] === 'strong',
    );
    const tags = [TYPE_NAME[def.type]];
    if (def.contactDamage === 'strong') tags.push('FORTE');
    if (def.boss) tags.push('CHEFE');
    const family = wikiEntry(
      TYPE_NAMES[def.type].toLowerCase().replace(/^./, (c) => c.toUpperCase()),
    );
    return {
      id: kind,
      name: def.name,
      seen,
      isNew: fresh('molecules', kind, seen),
      tag: tags.join(' · '),
      tagColor: TYPE_COLOR[def.type],
      sub: frags.length
        ? `Quebra em ${frags.map((f) => `${f.count} ${ENEMIES[f.kind as EnemyKind].name}`).join(' + ')}`
        : 'Decomposta por completo',
      hint: parents.length
        ? `Sai da cascata: ${parents.map((p) => ENEMIES[p].name).join(', ')}`
        : def.boss
          ? 'Chefe: vem pelo calendário da run'
          : `Aparece a partir do minuto ${def.unlockMinute}`,
      text: family,
      stats: [
        ['VIDA', fmt(def.hp)],
        ['VELOCIDADE', fmt(def.speedPxPerSecond)],
        ['XP', fmt(def.xp)],
        ['APARECE', `minuto ${def.unlockMinute}`],
        ['GRUPO', fmt(def.groupSize)],
        ['CONTATO', def.contactDamage === 'strong' ? 'forte' : 'comum'],
      ],
      mine: [
        ['DECOMPOSTAS', fmt(save.stats.kills[kind] ?? 0)],
        ['AGREGADO', save.seenAggregates.includes(kind) ? 'já veio' : '—'],
      ],
      links: [
        ...frags.map((f) => ({ label: `QUEBRA EM ${f.count}×`, cat: 'molecules', id: f.kind })),
        ...parents.map((p) => ({ label: 'VEM DE', cat: 'molecules', id: p })),
        ...strong.map((a) => ({ label: 'FORTE CONTRA', cat: 'agents', id: a })),
      ],
      art: { kind: 'molecule', key: ENEMY_TEXTURES[kind] },
      ring: PALETTE.wood,
    };
  });
  return {
    id: 'molecules',
    name: 'Moléculas',
    group: 'reg',
    blurb: 'Moléculas inimigas, com a cascata. Aparecem quando você encontra.',
    art: { kind: 'molecule', key: ENEMY_TEXTURES[kinds[0]!] },
    entries,
  };
}

function formations(save: SaveData, fresh: Fresh): CompendiumCategory {
  const list = RUN.formations.list;
  const entries = Object.entries(list).map(([id, def]): CompendiumEntry => {
    const seen = save.seenFormations.includes(id);
    const kinds = [...new Set(def.kinds)].filter((k): k is EnemyKind => k in ENEMIES);
    const first =
      kinds[0] ?? (Object.keys(ENEMIES) as EnemyKind[]).find((k) => ENEMIES[k].type === def.family);
    return {
      id,
      name: def.name,
      seen,
      isNew: fresh('formations', id, seen),
      tag: TYPE_NAME[def.family],
      tagColor: TYPE_COLOR[def.family],
      sub: RUN.formations.crisisNames[def.family] ?? def.description,
      hint: 'Vem quando o setor ligado está baixo',
      text: `${def.description}\n${wikiEntry('Formações')}`,
      stats: [
        ['MOLÉCULAS', fmt(def.count)],
        ['VELOCIDADE', `${dec(def.speedMultiplier)}×`],
        ['NA CRISE', RUN.formations.crisisNames[def.family] ?? '—'],
        ['GEMA', `${Math.round(RUN.formations.gemChanceFactor * 100)}% da chance`],
      ],
      mine: [],
      links: kinds.map((k) => ({ label: 'TRAZ', cat: 'molecules', id: k })),
      art: first ? { kind: 'molecule', key: ENEMY_TEXTURES[first] } : { kind: 'book' },
      ring: PALETTE.wood,
    };
  });
  return {
    id: 'formations',
    name: 'Formações',
    group: 'reg',
    blurb: 'Ondas com desenho próprio e as crises de cada pico.',
    art: entries[0]?.art ?? { kind: 'book' },
    entries,
  };
}

function agents(save: SaveData, fresh: Fresh): CompendiumCategory {
  const ids = Object.keys(AGENTS) as AgentId[];
  const entries = ids.map((id): CompendiumEntry => {
    const a = AGENTS[id];
    const seen = isUnlocked(save.meta, 'agents', id);
    const strong = Object.entries(a.affinity)
      .filter(([, v]) => v === 'strong')
      .map(([t]) => TYPE_NAME[t as MoleculeType].toLowerCase());
    const seconds = save.stats.agentSeconds[id] ?? 0;
    return {
      id,
      name: a.name,
      seen,
      isNew: fresh('agents', id, seen),
      tag: 'AGENTE DA RUN',
      tagColor: PALETTE_CSS.cyan,
      sub: firstLine(a.description),
      hint: 'Desbloqueie na aba Agentes ou numa cápsula de agente',
      text: wikiEntry(a.name) || a.description,
      stats: [
        ['AÇÃO', WEAPONS[a.action as WeaponId].name],
        ['ESPECIAL', a.special.name],
        ['FORTE CONTRA', strong.join(', ') || 'tudo igual'],
        ['RECEPTOR', a.nativeReceptor.name],
      ],
      mine: [
        ['RUNS', fmt(save.stats.agentRuns[id] ?? 0)],
        ['TEMPO', formatTime(seconds)],
      ],
      links: [{ label: 'AÇÃO', cat: 'weapons', id: a.action }],
      art: { kind: 'molecule', key: AGENT_TEXTURES[id] },
      ring: PALETTE.water,
    };
  });
  return {
    id: 'agents',
    name: 'Agentes',
    group: 'reg',
    blurb: 'Os remédios que você controla na run.',
    art: { kind: 'molecule', key: AGENT_TEXTURES.dopamine },
    entries,
  };
}

function weapons(save: SaveData, fresh: Fresh): CompendiumCategory {
  const ids = Object.keys(WEAPONS) as WeaponId[];
  const owner = (id: WeaponId) =>
    (Object.keys(AGENTS) as AgentId[]).find((a) => AGENTS[a].action === id);
  const base = (id: WeaponId) => ids.find((w) => WEAPONS[w].evolution?.into === id);
  const seenOf = (id: WeaponId): boolean => {
    const def = WEAPONS[id];
    if (def.source === 'pool') return isUnlocked(save.meta, 'weapons', id);
    if (def.source === 'agent') {
      const a = owner(id);
      return a ? isUnlocked(save.meta, 'agents', a) : false;
    }
    const b = base(id);
    return b ? seenOf(b) : false;
  };
  const entries = ids.map((id): CompendiumEntry => {
    const def = WEAPONS[id];
    const seen = seenOf(id);
    const a = owner(id);
    const b = base(id);
    const origin =
      def.source === 'pool'
        ? 'sorteio do level up'
        : def.source === 'agent'
          ? `ação ${a ? `da ${AGENTS[a].name}` : 'de agente'}`
          : 'evolução';
    const links: EntryLink[] = [];
    if (def.evolution) {
      links.push(
        { label: 'REAGENTE', cat: 'supplements', id: def.evolution.reagent },
        { label: 'EVOLUI EM', cat: 'weapons', id: def.evolution.into },
      );
    }
    if (b) links.push({ label: 'VEM DE', cat: 'weapons', id: b });
    if (a) links.push({ label: 'AGENTE', cat: 'agents', id: a });
    return {
      id,
      name: def.name,
      seen,
      isNew: fresh('weapons', id, seen),
      tag: KIND_NAMES[def.kind],
      tagColor: def.source === 'evolution' ? PALETTE_CSS.gold : PALETTE_CSS.sectionOrange,
      sub: firstLine(def.description),
      hint:
        def.source === 'pool'
          ? 'Desbloqueie no Arsenal'
          : def.source === 'agent'
            ? 'Vem com o agente'
            : 'Arma no máximo + reagente',
      text: wikiEntry(def.name) || def.description,
      stats: [
        ['DANO', dec(def.base.damage)],
        ['RECARGA', `${dec(def.base.cooldownSeconds)} s`],
        ['NÍVEL MÁX.', String(weaponMaxLevel(def))],
        ['ORIGEM', origin],
      ],
      mine: [],
      links,
      art: { kind: 'icon', ref: iconTexture('weapons', id) },
      ring: def.source === 'evolution' ? PALETTE.sulfur : PALETTE.wood,
    };
  });
  return {
    id: 'weapons',
    name: 'Armas',
    group: 'reg',
    blurb: 'As do sorteio, a ação de cada agente e as evoluções.',
    art: { kind: 'icon', ref: iconTexture('weapons', 'radical') },
    entries,
  };
}

function receptors(save: SaveData, fresh: Fresh): CompendiumCategory {
  const ids = (Object.keys(PASSIVES) as PassiveId[]).filter((p) => PASSIVES[p].kind === 'receptor');
  const intro = wikiEntry('Receptores');
  const entries = ids.map((id): CompendiumEntry => {
    const def = PASSIVES[id];
    const seen = isUnlocked(save.meta, 'receptors', id);
    const gain = receptorGain(def, def.perLevel);
    return {
      id,
      name: def.name,
      seen,
      isNew: fresh('receptors', id, seen),
      tag: def.stat === 'curse' ? 'RISCO' : 'RECEPTOR',
      tagColor: def.stat === 'curse' ? PALETTE_CSS.alert : PALETTE_CSS.cyan,
      sub: `${gain} por nível`,
      hint: 'Desbloqueie no Arsenal',
      text: `${gain} por nível.\n${intro}`,
      stats: [
        ['POR NÍVEL', gain],
        ['NÍVEL MÁX.', String(def.maxLevel)],
      ],
      mine: [],
      links: [],
      art: { kind: 'icon', ref: iconTexture('passives', id) },
      ring: PALETTE.water,
    };
  });
  return {
    id: 'receptors',
    name: 'Receptores',
    group: 'reg',
    blurb: 'O que sobe no level up: um atributo por receptor.',
    art: { kind: 'icon', ref: iconTexture('passives', 'reactivity') },
    entries,
  };
}

function supplements(save: SaveData, fresh: Fresh): CompendiumCategory {
  const evolves = (id: string) =>
    (Object.keys(WEAPONS) as WeaponId[]).filter((w) => WEAPONS[w].evolution?.reagent === id);
  const entries = Object.entries(SUPPLEMENTS.items).map(([id, def]): CompendiumEntry => {
    const seen = save.seenSupplements.includes(id);
    const tier = RARITIES.tiers.find((r) => r.id === SUPPLEMENTS.rarities[def.rarity].tier);
    const color = tier?.color ?? PALETTE_CSS.textSoft;
    return {
      id,
      name: def.name,
      seen,
      isNew: fresh('supplements', id, seen),
      tag: (tier?.name ?? '').toUpperCase(),
      tagColor: color,
      sub: def.description,
      hint: `Cai das ampolas · ${tier?.name ?? ''}`,
      text: `${def.description}\n${wikiEntry('Suplementos')}`,
      stats: [
        ['RARIDADE', tier?.name ?? '—'],
        ['ORIGEM', 'ampola'],
      ],
      mine: [],
      links: evolves(id).map((w) => ({ label: 'EVOLUI', cat: 'weapons', id: w })),
      art: { kind: 'icon', ref: iconTexture('supplements', id) },
      ring: Number.parseInt(color.slice(1), 16),
    };
  });
  return {
    id: 'supplements',
    name: 'Suplementos',
    group: 'reg',
    blurb: 'Saem das ampolas, ficam a run toda e acumulam.',
    art: { kind: 'icon', ref: iconTexture('items', 'ampoule') },
    entries,
  };
}

function items(save: SaveData, fresh: Fresh): CompendiumCategory {
  const entries = ITEM_IDS.map((id): CompendiumEntry => {
    const def = DROPS.items[id];
    const seen = save.seenItems.includes(id);
    return {
      id,
      name: def.name,
      seen,
      isNew: fresh('items', id, seen),
      tag: 'ITEM',
      tagColor: PALETTE_CSS.gold,
      sub: def.description,
      hint: 'Cai das vesículas',
      text: wikiEntry(def.name) || def.description,
      stats: [['ORIGEM', 'vesícula']],
      mine: [],
      links: [],
      art: { kind: 'icon', ref: iconTexture('items', id) },
      ring: PALETTE.gold,
    };
  });
  return {
    id: 'items',
    name: 'Itens do mapa',
    group: 'reg',
    blurb: 'O que cai das vesículas quebradas.',
    art: { kind: 'icon', ref: iconTexture('items', 'vesicle') },
    entries,
  };
}

const STRUCTURES: [string, string, number][] = [
  ['synapse', 'Sinapse', PALETTE.dopaminePink],
  ['synapseLTP', 'Sinapse potenciada', PALETTE.uv],
  ['focus', 'Foco inflamatório', PALETTE.interaction],
  ['clot', 'Coágulo', PALETTE.darkRed],
  ['adrenal', 'Glândula adrenal', PALETTE.stress],
];

function structures(save: SaveData, fresh: Fresh): CompendiumCategory {
  const seen = save.stats.synapses > 0 || save.records.runs > 0;
  const entries = STRUCTURES.map(([id, name, ring]): CompendiumEntry => {
    const text = wikiEntry(name);
    return {
      id,
      name,
      seen,
      isNew: fresh('structures', id, seen),
      tag: 'ESTRUTURA',
      tagColor: PALETTE_CSS.text,
      sub: firstLine(text),
      hint: 'Aparece no mapa durante a run',
      text,
      stats: [],
      mine: id === 'synapse' ? [['ATIVADAS', fmt(save.stats.synapses)]] : [],
      links: [],
      art: { kind: 'icon', ref: iconTexture('structures', id) },
      ring,
    };
  });
  return {
    id: 'structures',
    name: 'Estruturas',
    group: 'reg',
    blurb: 'Sinapses e as outras estruturas de interação do mapa.',
    art: { kind: 'icon', ref: iconTexture('structures', 'synapse') },
    entries,
  };
}

function maps(save: SaveData, fresh: Fresh): CompendiumCategory {
  const best = save.records.bestTimeByLocal;
  const entries = MAP_ENVIRONMENTS.map((env): CompendiumEntry => {
    const def = MAP.environments[env];
    const seen = (best[env] ?? 0) > 0 || (env === 'blood' && save.records.runs > 0);
    const owners = (Object.keys(AGENTS) as AgentId[]).filter((a) => AGENTS[a].synergy?.env === env);
    const sector = def.sector
      ? `${ORGANISM.sectors[def.sector].name} ×${dec(MAP.locals.sectorMultiplier)}`
      : 'nenhum';
    return {
      id: env,
      name: def.name,
      seen,
      isNew: fresh('maps', env, seen),
      tag: 'LOCAL DO CORPO',
      tagColor: PALETTE_CSS.textSoft,
      sub: familyText(env),
      hint: 'Escolha em "Onde agir?" ou caia nele por sorteio',
      text: wikiEntry('Locais do corpo'),
      stats: [
        ['FAMÍLIAS', familyText(env)],
        ['SETOR', sector],
      ],
      mine: [['MELHOR TEMPO', (best[env] ?? 0) > 0 ? formatTime(best[env]!) : '--:--']],
      links: owners.map((a) => ({ label: 'SINERGIA', cat: 'agents', id: a })),
      art: { kind: 'tile', env },
      ring: env === 'blood' ? PALETTE.interaction : floorColor(env, 4),
    };
  });
  return {
    id: 'maps',
    name: 'Ambientes',
    group: 'reg',
    blurb: 'Os cinco lugares do corpo onde a run acontece.',
    art: { kind: 'tile', env: 'liver' },
    entries,
  };
}

/** Guia do jogo: cada página da wiki é uma categoria e cada verbete, uma ficha só de texto. */
function guide(): CompendiumCategory[] {
  return WIKI.map((page, i) => {
    const id = `guide${i}`;
    const entries = page.entries.map((e, j): CompendiumEntry => ({
      id: String(j),
      name: e.title,
      seen: true,
      isNew: false,
      tag: page.title.toUpperCase(),
      tagColor: PALETTE_CSS.sectionOrange,
      sub: e.lines[0] ?? '',
      hint: '',
      text: e.lines.join('\n'),
      stats: [],
      mine: [],
      links: [],
      art: { kind: 'book' },
      ring: PALETTE.woodHi,
    }));
    if (page.intro.length > 0 || page.note) {
      entries.unshift({
        id: 'intro',
        name: page.title,
        seen: true,
        isNew: false,
        tag: page.title.toUpperCase(),
        tagColor: PALETTE_CSS.sectionOrange,
        sub: page.note ?? page.intro[0] ?? '',
        hint: '',
        text: [page.note, ...page.intro].filter(Boolean).join('\n'),
        stats: [],
        mine: [],
        links: [],
        art: { kind: 'book' },
        ring: PALETTE.woodHi,
      });
    }
    return {
      id,
      name: page.title,
      group: 'guide' as const,
      blurb: `${entries.length} verbetes da wiki`,
      art: { kind: 'book' as const },
      entries,
    };
  });
}

/** Contagem do registro: encontrados, total e novos. */
export function registryTotals(cats: CompendiumCategory[]): {
  seen: number;
  total: number;
  fresh: number;
} {
  const reg = cats.filter((c) => c.group === 'reg');
  return {
    seen: reg.reduce((n, c) => n + c.entries.filter((e) => e.seen).length, 0),
    total: reg.reduce((n, c) => n + c.entries.length, 0),
    fresh: reg.reduce((n, c) => n + c.entries.filter((e) => e.isNew).length, 0),
  };
}

/** Busca: só o que já foi encontrado, pelo nome (e pelo texto, no Guia). */
export function searchCompendium(
  cats: CompendiumCategory[],
  query: string,
): { cat: CompendiumCategory; entry: CompendiumEntry }[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return cats.flatMap((cat) =>
    cat.entries
      .filter(
        (e) =>
          e.seen &&
          (e.name.toLowerCase().includes(q) ||
            (cat.group === 'guide' && e.text.toLowerCase().includes(q))),
      )
      .map((entry) => ({ cat, entry })),
  );
}

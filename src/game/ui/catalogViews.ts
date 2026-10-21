import type * as Phaser from 'phaser';
import {
  AGENTS,
  ENEMIES,
  PASSIVES,
  WEAPONS,
  type AgentId,
  type EnemyKind,
  type MoleculeType,
  type PassiveId,
  type WeaponId,
  type WeaponKind,
} from '../../config';
import { PALETTE, PALETTE_CSS } from '../render/palette';
import { AGENT_TEXTURES, ENEMY_TEXTURES, textureKey } from '../render/textures';
import { drawCreamSlot, drawInkBox, drawLock, drawWoodFrame } from './icons';
import { IDLE_AGENTS, RUN_AGENTS } from './menuContent';
import { bodyText, impactText, labelText, withShadow } from './theme';

type Obj = Phaser.GameObjects.GameObject;

const TYPE_NAMES: Record<MoleculeType, string> = {
  lipid: 'LIPÍDIOS',
  sugar: 'AÇÚCARES',
  radical: 'RADICAIS',
  stress: 'ESTRESSE',
  toxin: 'TOXINAS',
  inflammation: 'INFLAMAÇÃO',
};

const KIND_NAMES: Record<WeaponKind, string> = {
  projectile: 'MIRA AUTOMÁTICA',
  cone: 'GOLPE EM CONE',
  orbit: 'ÓRBITA',
  aura: 'AURA',
  zone: 'POÇA NO CHÃO',
  beam: 'FEIXE',
  pulse: 'PULSO EM ANEL',
  strike: 'GOLPE',
};

/** Sprite de molécula encaixado numa caixa de `size` (textura de detalhe 3). */
function sprite(scene: Phaser.Scene, key: string, x: number, y: number, size: number) {
  const img = scene.add.image(x, y, textureKey(key, 3));
  img.setScale(Math.min(size / img.width, size / img.height, 2 / 3));
  return img;
}

function header(scene: Phaser.Scene, x: number, y: number, text: string): Obj {
  return scene.add.text(x, y, text, labelText(9, PALETTE_CSS.water));
}

/** Coluna centralizada com largura máxima, dentro da área. */
function column(x: number, w: number, max = 360) {
  const width = Math.min(w - 24, max);
  return { left: Math.floor(x + (w - width) / 2), width };
}

/**
 * Agentes jogáveis com a ficha (ação, especial, efetividade); tocar escolhe. Embaixo, os agentes
 * que chegam depois, com cadeado.
 */
export function renderAgents(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  selected: string,
  onSelect: (id: AgentId) => void,
  showIdle = true,
): Obj[] {
  const { left, width } = column(x, w);
  const g = scene.add.graphics();
  const out: Obj[] = [g, header(scene, left, y, 'AGENTES DA RUN')];
  let cy = y + 16;
  for (const id of Object.keys(AGENTS) as AgentId[]) {
    const a = AGENTS[id];
    const on = id === selected;
    const h = 78;
    if (on) drawWoodFrame(g, left, cy, width, h);
    else drawInkBox(g, left, cy, width, h);
    g.fillStyle(PALETTE.panel).fillRect(left + 6, cy + 6, width - 12, h - 12);
    drawCreamSlot(g, left + 10, cy + 10, 58, 58);
    out.push(sprite(scene, AGENT_TEXTURES[id], left + 39, cy + 39, 50));
    out.push(scene.add.text(left + 78, cy + 9, a.name, impactText(15)));
    if (on) {
      out.push(
        scene.add
          .text(left + width - 12, cy + 12, 'ESCOLHIDO', labelText(8, PALETTE_CSS.gold))
          .setOrigin(1, 0),
      );
    }
    const action = WEAPONS[a.action as WeaponId].name;
    out.push(
      scene.add.text(left + 78, cy + 30, `Ação: ${action}`, bodyText(10, PALETTE_CSS.text)),
      scene.add.text(
        left + 78,
        cy + 44,
        `Especial: ${a.special.name}`,
        bodyText(10, PALETTE_CSS.text),
      ),
    );
    const strong = Object.entries(a.affinity)
      .filter(([, v]) => v === 'strong')
      .map(([t]) => TYPE_NAMES[t as MoleculeType]);
    const tag = strong.length ? `FORTE CONTRA ${strong.join(', ')}` : 'MÉDIA CONTRA TUDO';
    out.push(scene.add.text(left + 78, cy + 60, tag, labelText(7, PALETTE_CSS.cyan)));
    const zone = scene.add
      .zone(left + width / 2, cy + h / 2, width, h)
      .setInteractive({ useHandCursor: true });
    zone.on('pointerup', () => onSelect(id));
    out.push(zone);
    cy += h + 8;
  }

  // Agentes que ainda não existem no jogo.
  const playable = new Set(Object.values(AGENTS).map((a) => a.name));
  const locked = [
    { label: 'EM BREVE · FASE 3', items: RUN_AGENTS.filter((i) => !playable.has(i.name)) },
    ...(showIdle ? [{ label: 'AGENTES DO IDLE · FASE 4', items: IDLE_AGENTS }] : []),
  ];
  for (const group of locked) {
    out.push(header(scene, left, cy + 4, group.label));
    cy += 20;
    const h = 8 + group.items.length * 18;
    drawInkBox(g, left, cy, width, h);
    group.items.forEach((item, i) => {
      const ry = cy + 6 + i * 18;
      drawLock(g, left + 12, ry + 3);
      out.push(scene.add.text(left + 24, ry, item.name, bodyText(11, PALETTE_CSS.textMuted)));
      if (item.note) {
        out.push(
          scene.add
            .text(left + width - 12, ry + 2, item.note, labelText(8, PALETTE_CSS.textMuted))
            .setOrigin(1, 0),
        );
      }
    });
    cy += h + 6;
  }
  return out;
}

/** Armas do pool com o tipo de ataque e a receita de evolução; depois, as evoluções. */
export function renderArsenal(scene: Phaser.Scene, x: number, y: number, w: number): Obj[] {
  const { left, width } = column(x, w);
  const g = scene.add.graphics();
  const out: Obj[] = [g, header(scene, left, y, 'ARMAS · CHEGAM PELO LEVEL UP')];
  let cy = y + 16;
  const ids = Object.keys(WEAPONS) as WeaponId[];
  const row = (id: WeaponId, sub: string, color: string) => {
    const def = WEAPONS[id];
    const h = 40;
    drawInkBox(g, left, cy, width, h, PALETTE.panel);
    out.push(
      scene.add.text(
        left + 12,
        cy + 6,
        def.name,
        withShadow(bodyText(12, PALETTE_CSS.text), PALETTE_CSS.ink, 1),
      ),
      scene.add
        .text(left + width - 12, cy + 8, KIND_NAMES[def.kind], labelText(7, PALETTE_CSS.textSoft))
        .setOrigin(1, 0),
      scene.add.text(left + 12, cy + 23, sub, labelText(7, color)),
    );
    cy += h + 4;
  };
  for (const id of ids.filter((i) => WEAPONS[i].source === 'pool')) {
    const evo = WEAPONS[id].evolution;
    const sub = evo
      ? `NO MÁXIMO + ${PASSIVES[evo.reagent as PassiveId].name.toUpperCase()} → ${WEAPONS[evo.into as WeaponId].name.toUpperCase()}`
      : 'SEM EVOLUÇÃO AINDA';
    row(id, sub, evo ? PALETTE_CSS.gold : PALETTE_CSS.textMuted);
  }
  out.push(header(scene, left, cy + 6, 'EVOLUÇÕES'));
  cy += 22;
  for (const id of ids.filter((i) => WEAPONS[i].source === 'evolution')) {
    row(id, WEAPONS[id].description.toUpperCase().slice(0, 48), '#E6CC80');
  }
  return out;
}

/** Moléculas já vistas, com tipo e cascata; as outras em silhueta. */
export function renderCompendium(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  seen: readonly string[],
): Obj[] {
  const { left, width } = column(x, w);
  const g = scene.add.graphics();
  const kinds = Object.keys(ENEMIES) as EnemyKind[];
  const known = kinds.filter((k) => seen.includes(k)).length;
  const out: Obj[] = [g, header(scene, left, y, `MOLÉCULAS VISTAS · ${known}/${kinds.length}`)];
  let cy = y + 16;
  for (const kind of kinds) {
    const def = ENEMIES[kind];
    const isSeen = seen.includes(kind);
    const h = 46;
    drawInkBox(g, left, cy, width, h, PALETTE.panel);
    drawCreamSlot(g, left + 6, cy + 6, 34, 34);
    const img = sprite(scene, ENEMY_TEXTURES[kind], left + 23, cy + 23, 30);
    if (!isSeen) img.setTint(0x15172e).setTintMode(2);
    out.push(img);
    if (!isSeen) {
      out.push(scene.add.text(left + 50, cy + 14, '???', impactText(13, PALETTE_CSS.textMuted)));
    } else {
      const name = def.boss ? `${def.name} · CHEFE` : def.name;
      out.push(
        scene.add.text(
          left + 50,
          cy + 6,
          name,
          withShadow(bodyText(12, PALETTE_CSS.text), PALETTE_CSS.ink, 1),
        ),
        scene.add
          .text(
            left + width - 12,
            cy + 8,
            TYPE_NAMES[def.type].replace(/S$/, ''),
            labelText(7, PALETTE_CSS.cyan),
          )
          .setOrigin(1, 0),
      );
      const frag = (def.fragments ?? [])
        .map((f) => `${f.count} ${ENEMIES[f.kind as EnemyKind].name.toUpperCase()}`)
        .join(' + ');
      out.push(
        scene.add.text(
          left + 50,
          cy + 26,
          frag ? `QUEBRA EM ${frag}` : 'DECOMPOSTA POR COMPLETO',
          labelText(7, frag ? PALETTE_CSS.gold : PALETTE_CSS.textMuted),
        ),
      );
    }
    cy += h + 4;
  }
  return out;
}

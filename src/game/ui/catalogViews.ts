import * as Phaser from 'phaser';
import {
  AGENTS,
  IDLE,
  MAP,
  ORGANISM,
  PASSIVES,
  WEAPONS,
  type AgentId,
  type MoleculeType,
  type PassiveId,
  type WeaponId,
  type WeaponKind,
} from '../../config';
import { PALETTE, PALETTE_CSS } from '../render/palette';
import { addIcon, AGENT_TEXTURES, iconTexture, textureKey } from '../render/textures';
import {
  isUnlocked,
  unlockCost,
  type MetaProgress,
  type UnlockKind,
} from '../../core/meta/progress';
import { addButton, isTap } from './button';
import { addIconSlot, passiveSlot, slotSize, weaponIcon } from './iconSlot';
import { nativeGain, receptorGain } from './upgradeText';
import { drawCreamSlot, drawInkBox, drawLock, drawWoodFrame } from './icons';
import { RUN_AGENTS, type ExampleItem } from './menuContent';
import { bodyText, impactText, labelText, withShadow } from './theme';
import { sfx } from '../audio/sfx';

type Obj = Phaser.GameObjects.GameObject;

/** Loja do menu (fase 3): o que está liberado, o ATP do jogador e a compra. */
export interface Shop {
  progress: MetaProgress;
  atp: number;
  onBuy: (kind: UnlockKind, id: string) => void;
}

/** Botão de desbloquear com o custo; apagado e sem ação se faltar ATP. */
export function buyButton(
  scene: Phaser.Scene,
  shop: Shop,
  kind: UnlockKind,
  id: string,
  x: number,
  y: number,
  width: number,
  height = 26,
): Obj {
  const cost = unlockCost(kind, id);
  const can = shop.atp >= cost;
  return addButton(scene, {
    x,
    y,
    width,
    height,
    label: `${cost} ATP`,
    fontSize: 10,
    variant: can ? 'primary' : 'secondary',
    sound: can ? 'uiUnlock' : 'uiError',
    onClick: () => {
      if (can) shop.onBuy(kind, id);
    },
  });
}

export const TYPE_NAMES: Record<MoleculeType, string> = {
  lipid: 'LIPÍDIOS',
  sugar: 'AÇÚCARES',
  radical: 'RADICAIS',
  stress: 'ESTRESSE',
  toxin: 'TOXINAS',
  inflammation: 'INFLAMAÇÃO',
};

export const KIND_NAMES: Record<WeaponKind, string> = {
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
  return scene.add.text(x, y, text, labelText(10, PALETTE_CSS.water));
}

/** Coluna centralizada com largura máxima, dentro da área. */
function column(x: number, w: number, max = 420) {
  const width = Math.min(w - 24, max);
  return { left: Math.floor(x + (w - width) / 2), width };
}

/**
 * Agentes jogáveis com a ficha (ação, especial, efetividade); tocar escolhe. Embaixo, os agentes
 * que chegam depois, com cadeado, e os do campo longo (liberados lá), quando `idleUnlocked` vem.
 */
export function renderAgents(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  selected: string,
  onSelect: (id: AgentId) => void,
  idleUnlocked?: string[],
  shop?: Shop,
): Obj[] {
  const { left, width } = column(x, w);
  const g = scene.add.graphics();
  const out: Obj[] = [g, header(scene, left, y, 'AGENTES DA RUN')];
  let cy = y + 16;
  for (const id of Object.keys(AGENTS) as AgentId[]) {
    const a = AGENTS[id];
    const locked = shop ? !isUnlocked(shop.progress, 'agents', id) : false;
    const on = id === selected && !locked;
    // Textos à direita do retrato quebram linha dentro do cartão; a altura segue o texto.
    const tx = left + 78;
    const textW = left + width - 12 - tx;
    out.push(sprite(scene, AGENT_TEXTURES[id], left + 39, cy + 39, 50).setAlpha(locked ? 0.4 : 1));
    const badge = locked && shop ? 'BLOQUEADO' : on ? 'ESCOLHIDO' : '';
    const badgeText = badge
      ? scene.add
          .text(
            left + width - 12,
            cy + 12,
            badge,
            labelText(8, locked ? PALETTE_CSS.textMuted : PALETTE_CSS.gold),
          )
          .setOrigin(1, 0)
      : undefined;
    const name = scene.add.text(tx, cy + 9, a.name, {
      ...impactText(15),
      wordWrap: { width: textW - (badgeText ? badgeText.width + 8 : 0) },
    });
    out.push(name);
    if (badgeText) out.push(badgeText);
    let ty = Math.max(cy + 28, name.y + name.height);
    const line = (icon: ReturnType<typeof iconTexture>, text: string, size: number) => {
      const t = scene.add.text(tx + 20, ty + 2, text, {
        ...bodyText(size, PALETTE_CSS.text),
        wordWrap: { width: textW - 20 },
      });
      out.push(addIcon(scene, tx, ty, icon), t);
      ty = Math.max(ty + 18, t.y + t.height + 3);
    };
    line(
      iconTexture('weapons', a.action as WeaponId),
      `Ação: ${WEAPONS[a.action as WeaponId].name}`,
      11,
    );
    line(iconTexture('specials', a.special.kind), `Especial: ${a.special.name}`, 10);
    const strong = Object.entries(a.affinity)
      .filter(([, v]) => v === 'strong')
      .map(([t]) => TYPE_NAMES[t as MoleculeType]);
    const tag = strong.length ? `FORTE CONTRA ${strong.join(', ')}` : 'MÉDIA CONTRA TUDO';
    const tagText = scene.add.text(tx, ty + 2, tag, {
      ...labelText(8, PALETTE_CSS.cyan),
      wordWrap: { width: textW },
    });
    out.push(tagText);
    ty = tagText.y + tagText.height + 2;
    // Perfil: o receptor nativo, que sobe 1 nível a cada 10 níveis da run (fase 5.6).
    const native = a.nativeReceptor;
    const gain = nativeGain(native, native.type ? TYPE_NAMES[native.type].toLowerCase() : '');
    const profile = scene.add.text(
      tx,
      ty,
      `PERFIL: ${native.name.toUpperCase()} · ${gain.toUpperCase()} A CADA 10 NÍVEIS`,
      { ...labelText(8, PALETTE_CSS.gold), wordWrap: { width: textW }, lineSpacing: 2 },
    );
    out.push(profile);
    ty = profile.y + profile.height;
    // Local de sinergia (✚) e a barreira hematoencefálica (⊘), da fase 5.12.
    if (a.synergy) {
      const env = MAP.environments[a.synergy.env].name.toUpperCase();
      const sector = ORGANISM.sectors[a.synergy.sector].name.toUpperCase();
      const barrier = a.crossesBloodBrainBarrier === false ? ' · ⊘ NÃO ENTRA NO CÉREBRO' : '';
      const syn = scene.add.text(tx, ty + 2, `✚ ${env}: ${sector}${barrier}`, {
        ...labelText(8, PALETTE_CSS.numberHeal),
        wordWrap: { width: textW },
        lineSpacing: 2,
      });
      out.push(syn);
      ty = syn.y + syn.height;
    }
    if (locked && shop) {
      // Bloqueado: no lugar de escolher, o botão de desbloquear com o custo, numa linha própria.
      out.push(buyButton(scene, shop, 'agents', id, left + width - 96, ty + 8, 84));
      ty += 8 + 26;
    }
    const h = Math.max(100, Math.ceil(ty - cy) + 12);
    if (on) drawWoodFrame(g, left, cy, width, h);
    else drawInkBox(g, left, cy, width, h);
    g.fillStyle(PALETTE.panel).fillRect(left + 6, cy + 6, width - 12, h - 12);
    drawCreamSlot(g, left + 10, cy + 10, 58, 58);
    if (!locked || !shop) {
      const zone = scene.add
        .zone(left + width / 2, cy + h / 2, width, h)
        .setInteractive({ useHandCursor: true });
      // Na lista rolável, arrastar para rolar não escolhe o agente.
      zone.on('pointerup', (p: Phaser.Input.Pointer) => {
        if (!isTap(p)) return;
        sfx.play('uiConfirm');
        onSelect(id);
      });
      out.push(zone);
    }
    cy += h + 8;
  }

  // Agentes que ainda não existem no jogo.
  const playable = new Set(Object.values(AGENTS).map((a) => a.name));
  const idleItems: ExampleItem[] = Object.entries(IDLE.agents).map(([id, a]) => {
    const unlocked = idleUnlocked?.includes(id) ?? false;
    const cost = IDLE.unlockCost[id];
    return {
      name: a.name,
      unlocked,
      note: unlocked ? 'LIBERADO' : cost ? `${cost} ATP` : undefined,
    };
  });
  const locked = [
    { label: 'EM BREVE', items: RUN_AGENTS.filter((i) => !playable.has(i.name)) },
    ...(idleUnlocked ? [{ label: 'AGENTES DO IDLE · NO CAMPO LONGO', items: idleItems }] : []),
  ];
  for (const group of locked.filter((l) => l.items.length > 0)) {
    out.push(header(scene, left, cy + 4, group.label));
    cy += 20;
    const h = 8 + group.items.length * 18;
    drawInkBox(g, left, cy, width, h);
    group.items.forEach((item, i) => {
      const ry = cy + 6 + i * 18;
      if (!item.unlocked) drawLock(g, left + 12, ry + 3);
      const color = item.unlocked ? PALETTE_CSS.text : PALETTE_CSS.textMuted;
      out.push(scene.add.text(left + 24, ry, item.name, bodyText(11, color)));
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
export function renderArsenal(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  shop?: Shop,
): Obj[] {
  const { left, width } = column(x, w);
  const g = scene.add.graphics();
  const out: Obj[] = [g, header(scene, left, y, 'ARMAS · CHEGAM PELO LEVEL UP')];
  let cy = y + 16;
  const ids = Object.keys(WEAPONS) as WeaponId[];
  const row = (id: WeaponId, sub: string, color: string, locked = false) => {
    const def = WEAPONS[id];
    const icon = addIconSlot(scene, left + 8, cy + 12, 1, { ...weaponIcon(id), dim: locked });
    const tx = left + 8 + icon.size + 8;
    const right =
      locked && shop
        ? buyButton(scene, shop, 'weapons', id, left + width - 80, cy + 11, 70)
        : scene.add
            .text(
              left + width - 12,
              cy + 8,
              KIND_NAMES[def.kind],
              labelText(8, PALETTE_CSS.textSoft),
            )
            .setOrigin(1, 0);
    const rightW = locked && shop ? 80 : (right as Phaser.GameObjects.Text).width + 12;
    const name = scene.add.text(tx, cy + 6, def.name, {
      ...withShadow(bodyText(14, PALETTE_CSS.text), PALETTE_CSS.ink, 1),
      wordWrap: { width: left + width - rightW - 6 - tx },
    });
    const subText = scene.add.text(tx, Math.max(cy + 28, name.y + name.height + 4), sub, {
      ...labelText(8, color),
      wordWrap: { width: left + width - 12 - tx },
      lineSpacing: 2,
    });
    out.push(...icon.objects, name, right, subText);
    const h = Math.max(48, Math.ceil(subText.y + subText.height - cy) + 10);
    drawInkBox(g, left, cy, width, h, PALETTE.panel);
    cy += h + 4;
  };
  for (const id of ids.filter((i) => WEAPONS[i].source === 'pool')) {
    const evo = WEAPONS[id].evolution;
    const sub = evo
      ? `NO MÁXIMO + ${PASSIVES[evo.reagent as PassiveId].name.toUpperCase()} → ${WEAPONS[evo.into as WeaponId].name.toUpperCase()}`
      : 'SEM EVOLUÇÃO AINDA';
    const locked = shop ? !isUnlocked(shop.progress, 'weapons', id) : false;
    if (locked) row(id, 'BLOQUEADA: NÃO APARECE NO LEVEL UP', PALETTE_CSS.textMuted, true);
    else row(id, sub, evo ? PALETTE_CSS.gold : PALETTE_CSS.textMuted);
  }
  out.push(header(scene, left, cy + 6, 'EVOLUÇÕES'));
  cy += 22;
  for (const id of ids.filter((i) => WEAPONS[i].source === 'evolution')) {
    row(id, WEAPONS[id].description.toUpperCase(), '#E6CC80');
  }

  // Receptores (os tomos do Megabonk, decisão 0027): o que sobe por nível e os bloqueados.
  out.push(header(scene, left, cy + 6, 'RECEPTORES · CHEGAM PELO LEVEL UP'));
  cy += 22;
  const passives = Object.keys(PASSIVES) as PassiveId[];
  for (const id of passives.filter((p) => PASSIVES[p].kind === 'receptor')) {
    const def = PASSIVES[id];
    const locked = shop ? !isUnlocked(shop.progress, 'receptors', id) : false;
    const slot = addIconSlot(scene, left + 8, cy + 6, 1, {
      ...passiveSlot(id, 0),
      label: undefined,
      dim: locked,
    });
    const tx = left + 8 + slot.size + 8;
    const rightW = locked && shop ? 86 : 12;
    const gain = `${receptorGain(def, def.perLevel)} por nível`.toUpperCase();
    const name = scene.add.text(tx, cy + 5, def.name, {
      ...withShadow(bodyText(13, PALETTE_CSS.text), PALETTE_CSS.ink, 1),
      wordWrap: { width: left + width - rightW - tx },
    });
    const sub = scene.add.text(
      tx,
      Math.max(cy + 23, name.y + name.height + 3),
      locked ? 'BLOQUEADO: NÃO APARECE NO LEVEL UP' : gain,
      {
        ...labelText(8, locked ? PALETTE_CSS.textMuted : PALETTE_CSS.cyan),
        wordWrap: { width: left + width - 12 - tx },
        lineSpacing: 2,
      },
    );
    out.push(...slot.objects, name, sub);
    if (locked && shop)
      out.push(buyButton(scene, shop, 'receptors', id, left + width - 80, cy + 7, 70));
    const h = Math.max(40, Math.ceil(sub.y + sub.height - cy) + 7);
    drawInkBox(g, left, cy, width, h, PALETTE.panel);
    cy += h + 4;
  }

  // Reagentes: cartas do level up que liberam a evolução, sem ocupar espaço.
  out.push(header(scene, left, cy + 6, 'REAGENTES · LIBERAM A EVOLUÇÃO'));
  cy += 22;
  const reagents = passives.filter((p) => PASSIVES[p].kind === 'reagent');
  const cols = width >= 300 ? 2 : 1;
  const cellW = Math.floor((width - (cols - 1) * 6) / cols);
  const cellH = slotSize(1) + 10;
  const rows = Math.ceil(reagents.length / cols);
  drawInkBox(g, left, cy, width, rows * cellH + 8, PALETTE.panel);
  reagents.forEach((id, i) => {
    const cx = left + 6 + (i % cols) * (cellW + 6);
    const ry = cy + 7 + Math.floor(i / cols) * cellH;
    const slot = addIconSlot(scene, cx, ry, 1, { ...passiveSlot(id, 0), label: undefined });
    out.push(
      ...slot.objects,
      scene.add.text(cx + slot.size + 6, ry + 5, PASSIVES[id].name, bodyText(12, PALETTE_CSS.text)),
    );
  });
  return out;
}

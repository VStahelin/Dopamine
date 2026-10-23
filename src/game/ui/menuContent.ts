import type { IconName } from './icons';

/**
 * Textos do menu principal e dos placeholders que sobram (docs/menu.md). `RUN_AGENTS` lista o
 * elenco da aba Personagens; os que ainda não estão em agents.json aparecem como "EM BREVE"
 * (fase 5.15).
 */

export interface ExampleItem {
  name: string;
  /** Liberado hoje; o resto aparece com cadeado. */
  unlocked?: boolean;
  /** Rótulo à direita (fase, tipo...). */
  note?: string;
}

export interface SectionDef {
  title: string;
  /** Ícone grande do placeholder. */
  icon?: IconName;
  /** Uma frase sobre o que vai ter ali. */
  text: string;
  /** Fase em que ganha conteúdo; ausente quando ainda não há fase. */
  phase?: string;
  /** Grupos de itens de exemplo, cada um com um subtítulo. */
  examples?: { label: string; items: ExampleItem[] }[];
}

export const RUN_AGENTS: ExampleItem[] = [
  { name: 'Dopamina', unlocked: true, note: 'GENERALISTA' },
  { name: 'Lipase', note: 'LIPÍDIOS' },
  { name: 'Insulina', note: 'AÇÚCARES' },
  { name: 'Vitamina C', note: 'RADICAIS' },
  { name: 'Serotonina', note: 'ESTRESSE' },
  { name: 'Ocitocina', note: 'ESTRESSE' },
  { name: 'Cafeína', note: 'AÇÚCARES' },
  { name: 'Álcool desidrogenase', note: 'TOXINAS' },
  { name: 'Venvanse', note: 'CHEFES' },
];

export type TabId = 'agents' | 'arsenal' | 'case' | 'lab' | 'organism';

export const TABS: { id: TabId; label: string }[] = [
  { id: 'agents', label: 'AGENTES' },
  { id: 'arsenal', label: 'ARSENAL' },
  { id: 'case', label: 'CASO' },
  { id: 'lab', label: 'LAB.' },
  { id: 'organism', label: 'ORGANISMO' },
];

/** Telas abertas pelo hub que ainda são placeholder. */
export const SCREENS = {
  achievements: {
    title: 'CONQUISTAS',
    icon: 'medal',
    text: 'Metas de longo prazo, como curar um indivíduo ou decompor 10 mil moléculas.',
    phase: 'FASE 5.16',
  },
} satisfies Record<string, SectionDef>;

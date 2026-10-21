/**
 * Textos do menu principal e conteúdo de exemplo dos placeholders (docs/menu.md). Os nomes de
 * agentes e armas vêm das abas Personagens e Armas; viram configuração de verdade quando a fase
 * de cada um chegar.
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

export const IDLE_AGENTS: ExampleItem[] = [
  { name: 'Ômega-3', note: 'ESTÁVEL' },
  { name: 'Melatonina', note: 'OFFLINE' },
  { name: 'Magnésio', note: 'ESTRESSE' },
  { name: 'Vitamina D', note: 'ACUMULA' },
  { name: 'Endorfina', note: 'RAJADAS' },
];

export type TabId = 'agents' | 'arsenal' | 'case' | 'lab' | 'organism';

export const TABS: { id: TabId; label: string }[] = [
  { id: 'agents', label: 'AGENTES' },
  { id: 'arsenal', label: 'ARSENAL' },
  { id: 'case', label: 'CASO' },
  { id: 'lab', label: 'LAB.' },
  { id: 'organism', label: 'ORGAN.' },
];

/** Conteúdo das abas que ainda são placeholder (a aba Caso é o hub). */
export const TAB_SECTIONS: Record<Exclude<TabId, 'case'>, SectionDef> = {
  agents: {
    title: 'AGENTES',
    text: 'O elenco da run e do idle, com a ficha de cada agente e o desbloqueio.',
    phase: 'FASES 2 E 3',
    examples: [
      { label: 'RUN', items: RUN_AGENTS },
      { label: 'IDLE', items: IDLE_AGENTS },
    ],
  },
  arsenal: {
    title: 'ARSENAL',
    text: 'As armas, seus níveis, as evoluções e o reagente que cada evolução pede.',
    phase: 'FASES 2 E 3',
    examples: [
      {
        label: 'ARMAS',
        items: [
          { name: 'Radical Livre', unlocked: true, note: 'MIRA AUTOMÁTICA' },
          { name: 'Jato Ácido', note: 'GOLPE' },
          { name: 'Nuvem de Elétrons', note: 'ÓRBITA' },
          { name: 'Catalisador', note: 'AURA' },
          { name: 'Poça de Solvente', note: 'ZONA' },
          { name: 'Reação em Cadeia', note: 'RICOCHETE' },
          { name: 'Raio UV', note: 'PERFURAÇÃO' },
        ],
      },
    ],
  },
  lab: {
    title: 'LABORATÓRIO',
    text: 'As árvores de upgrades permanentes, compradas com ATP entre as runs.',
    phase: 'FASES 3 E 4',
    examples: [
      {
        label: 'ÁRVORES',
        items: [
          { name: 'Árvore da run', note: 'FASE 3' },
          { name: 'Árvore do idle', note: 'FASE 4' },
        ],
      },
    ],
  },
  organism: {
    title: 'ORGANISMO',
    text: 'O indivíduo em tratamento: os 4 setores de saúde, o efeito de cada um e o reset.',
    phase: 'FASE 5',
    examples: [
      {
        label: 'SETORES',
        items: [
          { name: 'Física', note: 'VIDA NO INÍCIO' },
          { name: 'Mental', note: 'RECARGA DO ESPECIAL' },
          { name: 'Social', note: 'PRODUÇÃO DO IDLE' },
          { name: 'Executiva', note: 'OPÇÕES NO LEVEL UP' },
        ],
      },
    ],
  },
};

/** Telas abertas pelo hub que ainda são placeholder. */
export const SCREENS = {
  idle: {
    title: 'CAMPO LONGO',
    text: 'O idle: agentes fixos na base disparam nas moléculas que descem e geram ATP, inclusive com o jogo fechado.',
    phase: 'FASE 4',
    examples: [{ label: 'AGENTES DO IDLE', items: IDLE_AGENTS }],
  },
  compendium: {
    title: 'COMPÊNDIO',
    text: 'Tudo o que você já encontrou: moléculas inimigas, modificadores e raridades.',
    phase: 'FASE 2',
    examples: [
      {
        label: 'MOLÉCULAS VISTAS',
        items: [
          { name: 'Glicose', unlocked: true, note: 'AÇÚCAR' },
          { name: 'Ácido graxo', unlocked: true, note: 'LIPÍDIO' },
          { name: 'Triglicerídeo', unlocked: true, note: 'LIPÍDIO' },
          { name: '???' },
          { name: '???' },
        ],
      },
    ],
  },
  achievements: {
    title: 'CONQUISTAS',
    text: 'Metas de longo prazo, como curar um indivíduo ou decompor 10 mil moléculas.',
  },
} satisfies Record<string, SectionDef>;

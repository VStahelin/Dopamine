/** Paleta da aba Design (docs/design.md) e do canvas de identidade visual. */
export const PALETTE = {
  night: 0x15172e,
  /** Texto principal, como número (para ícones da cor do texto). */
  textLight: 0xf4efe0,
  textSoft: 0xc9cce6,
  panel: 0x2a2e55,
  panelLight: 0x3a3f70,
  panelDark: 0x1c1f3d,
  /** Fundo de caixas e trilhos, mais escuro que o painel. */
  panelDeep: 0x1b1e3a,
  /** Faixa de brilho em cima dos botões azuis. */
  panelHi: 0x474c85,
  /** Faixa de sombra embaixo dos botões azuis. */
  panelShade: 0x171a36,
  /** Contorno quase preto dos elementos azuis. */
  ink: 0x07080f,
  wood: 0xe0702a,
  woodLight: 0xf0913a,
  woodDark: 0xb5541c,
  /** Brilho e sombra do botão principal de madeira. */
  woodHi: 0xffb347,
  woodShade: 0x9c3f12,
  outline: 0x3a0a0c,
  darkRed: 0x8e1616,
  cream: 0xf2d9a8,
  creamShade: 0xc9a066,
  sand: 0xd8b47a,
  sandGrout: 0xcda56c,
  stone: 0x5b6e8e,
  water: 0x39d3f0,
  cyan: 0x7ef0ff,
  gold: 0xf2b233,
  goldDark: 0x8a5a0c,
  goldHi: 0xffe08a,
  interaction: 0xd83a3a,
  progress: 0x2d7fd6,
  progressShade: 0x1a4e8e,
  /** Tela do scanner do organismo. */
  scanBg: 0x101226,
  scanLine: 0x141936,
  scanEdge: 0x2a3a6e,
  bodyFill: 0x1e4e8c,
  carbon: 0x4a4f5c,
  hydrogen: 0xedebdd,
  oxygen: 0xe0433a,
  nitrogen: 0x3f6fe0,
  chlorine: 0x5bc43a,
  sulfur: 0xf2c83a,
  /** Efeito temporário bom (moldura e barra de tempo). */
  buff: 0x6cd43f,
  /** Segmento parcial das interações. */
  interactionLight: 0xff8a80,
  /** Efeitos das armas (prancheta Crônico: HUD de batalha). */
  chlorineDark: 0x1a4e12,
  dopaminePink: 0xff6fa8,
  uv: 0xb072f0,
  uvDark: 0x4a1e7a,
  /** Poça tóxica e aura do estresse (prancheta "Famílias e chefes"). */
  toxicPool: 0xa6c83a,
  toxicPoolDark: 0x6e8a1c,
  stress: 0xff9a1f,
  /** Botão de desistir. */
  wine: 0x5a1416,
  wineHi: 0x7a2a2c,
} as const;

export const PALETTE_CSS = {
  night: '#15172E',
  hydrogen: '#EDEBDD',
  /** Texto principal da interface. */
  text: '#F4EFE0',
  /** Texto secundário e rótulos. */
  textSoft: '#C9CCE6',
  textMuted: '#A9AED0',
  ink: '#07080F',
  outline: '#3A0A0C',
  water: '#39D3F0',
  cyan: '#7EF0FF',
  cyanOutline: '#0A2A3A',
  gold: '#F2B233',
  interaction: '#D83A3A',
  alert: '#FF8A80',
  tagText: '#FFE0D0',
  woodText: '#FFF2DC',
  woodOutline: '#6E1E0A',
  logoOrange: '#FF9A1F',
  logoGreen: '#6CD43F',
  cream: '#F2D9A8',
  white: '#FFFFFF',
  /** Rótulos MAX e EVO, crítico. */
  goldIcon: '#F2C83A',
  /** Números na tela (prancheta Crônico: ícones, dano e paisagem). */
  numberStrong: '#7EF0FF',
  numberWeak: '#A9ACC2',
  numberHurt: '#FF6A5A',
  numberHeal: '#8CF06A',
  numberHealOutline: '#1A4E12',
  critOutline: '#6E1E0A',
  /** Títulos de seção da pausa. */
  sectionOrange: '#FFB347',
  muted: '#8A8EB8',
  goldHi: '#FFE08A',
  /** Origem de cada bônus na aba Atributos (prancheta "Crônico: atributos e de onde vem"). */
  sourceLab: '#E0702A',
  sourceOrganism: '#FF8AB4',
  sourceNative: '#F2C83A',
  sourceReceptor: '#39D3F0',
  sourceSupplement: '#B072F0',
  sourceCard: '#5B8CFF',
  sourceMutation: '#E0433A',
  sourceStructure: '#C9CCE6',
  sourceLocal: '#5BC43A',
} as const;

/**
 * Cor dos dados de sprite (src/assets/sprites): um nome de `PALETTE` ou `#RRGGBB`. Nome
 * desconhecido vira magenta, para o erro aparecer na tela.
 */
export function paletteColor(name: string): number {
  if (name.startsWith('#')) return parseInt(name.slice(1), 16);
  return (PALETTE as Record<string, number>)[name] ?? 0xff00ff;
}

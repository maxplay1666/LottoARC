export type Theme = 'light' | 'dark'

// ── Dark luxury gold (default — matches the LOTTO ARC logo) ──────────────────
export const dark = {
  bg: '#0D0D0D',
  bgGrad: 'radial-gradient(ellipse 80% 60% at 50% 0%, #1a1400 0%, #0D0D0D 60%)',
  surface: 'rgba(255,255,255,0.035)',
  surfaceInner: 'rgba(255,255,255,0.055)',
  surfaceCard: 'rgba(20,16,0,0.6)',
  border: 'rgba(201,168,76,0.18)',
  borderGold: 'rgba(201,168,76,0.45)',
  ink: '#F5E6C0',
  inkDim: '#C9B890',
  muted: '#7A6840',
  navy: '#C9A84C',
  accent: '#C9A84C',
  accentBright: '#E5C566',
  green: '#4ADE80',
  amber: '#F59E0B',
  red: '#F87171',
  purple: '#C9A84C',
  tabActive: 'rgba(201,168,76,0.12)',
  tabBg: 'rgba(255,255,255,0.03)',
  shadow: '0 8px 40px rgba(0,0,0,0.6)',
  shadowGold: '0 0 24px rgba(201,168,76,0.15)',
  glow: 'rgba(201,168,76,0.08)',
}

// ── Light mode (cream + gold) ─────────────────────────────────────────────────
export const light = {
  bg: '#F5EDD6',
  bgGrad: 'radial-gradient(ellipse 80% 60% at 50% 0%, #FDF8EC 0%, #F0E4C0 60%)',
  surface: 'rgba(255,255,255,0.75)',
  surfaceInner: 'rgba(255,250,235,0.85)',
  surfaceCard: 'rgba(255,250,235,0.9)',
  border: 'rgba(165,120,40,0.18)',
  borderGold: 'rgba(165,120,40,0.4)',
  ink: '#1A1200',
  inkDim: '#3D2E00',
  muted: '#8C7040',
  navy: '#7A5C1E',
  accent: '#A07820',
  accentBright: '#C9A84C',
  green: '#059669',
  amber: '#B45309',
  red: '#DC2626',
  purple: '#A07820',
  tabActive: 'rgba(160,120,32,0.12)',
  tabBg: 'rgba(0,0,0,0.04)',
  shadow: '0 4px 24px rgba(100,70,0,0.12)',
  shadowGold: '0 0 20px rgba(160,120,32,0.12)',
  glow: 'rgba(160,120,32,0.06)',
}

export const goldGradient = 'linear-gradient(135deg, #C9A84C 0%, #E5C566 40%, #C9A84C 70%, #A07820 100%)'
export const goldGradientHoriz = 'linear-gradient(90deg, #A07820 0%, #C9A84C 35%, #E5C566 60%, #C9A84C 100%)'
export const spectral = goldGradient

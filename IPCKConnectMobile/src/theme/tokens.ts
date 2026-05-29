// IPCK design tokens — single source of truth.
export const tokens = {
  primary: '#1F6FEB',
  primaryTint: '#DCEAFF',
  accent: '#FFB020',
  accentTint: '#FFF1D6',
  editorialInk: '#14181F',

  bg: '#F7F5F0',
  surface: '#EFEDE6',
  surface2: '#F0EDE6',
  surfaceTint: '#E8EEFB',

  text: '#14181F',
  textSecondary: '#6A7384',
  textTertiary: '#9CA4B3',

  border: '#DCE0E7',
  borderSoft: '#E8E4DC',

  success: '#1FB36A',
  successTint: '#D8F5E6',
  warning: '#FFB020',
  warningTint: '#FFF1D6',
  error: '#E5484D',
  errorTint: '#FBE0E1',

  radiusSm: 6,
  radiusMd: 10,
  radiusLg: 14,
  radiusXl: 18,
  radiusPill: 999,

  s1: 4, s2: 8, s3: 12, s4: 16, s5: 20, s6: 24, s7: 28, s8: 32,
} as const;

export type Tokens = typeof tokens;

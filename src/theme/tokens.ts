// Design tokens do FinCasal — dark-first fintech palette
export const Colors = {
  // Backgrounds
  bg:          '#080D1A',
  surface:     '#0E1525',
  card:        '#15202E',
  cardRaised:  '#1C2A3A',
  border:      '#1E2D42',
  borderLight: '#243550',

  // Brand (teal-green financeiro)
  primary:       '#00D4A0',
  primaryDark:   '#00AA82',
  primaryLight:  '#33DDB3',
  primaryFaint:  'rgba(0, 212, 160, 0.12)',

  // Semânticas
  positive: '#00D4A0',
  negative: '#FF5C7D',
  warning:  '#FFB347',
  info:     '#4FC3F7',

  // Texto
  textPrimary:     '#FFFFFF',
  textSecondary:   '#94A3B8',
  textMuted:       '#4E6180',
  textPlaceholder: '#2A3F5C',

  // Categorias padrão
  categoryColors: [
    '#6C63FF', '#FF8C42', '#4FC3F7', '#FF5C7D',
    '#AB47BC', '#26A69A', '#42A5F5', '#78909C',
  ],
} as const;

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
} as const;

export const Radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  full: 9999,
} as const;

export const FontSize = {
  xs:    12,
  sm:    14,
  base:  16,
  lg:    18,
  xl:    20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
} as const;

export const FontWeight = {
  regular:  '400' as const,
  medium:   '500' as const,
  semibold: '600' as const,
  bold:     '700' as const,
  extrabold:'800' as const,
} as const;

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
} as const;

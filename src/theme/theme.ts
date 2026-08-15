import { Platform } from 'react-native';

// Dark-first "ledger at night" palette -- continues the identity of the
// Market Ledger web report, adapted for a glassmorphic phone UI where
// frosted panels need a rich, deep ground to read well against.
export const colors = {
  bg0: '#0B0D10', // deepest background
  bg1: '#12151A', // base
  bg2: '#171B21', // panel ground beneath glass
  hairline: 'rgba(233, 231, 223, 0.10)',
  hairlineStrong: 'rgba(233, 231, 223, 0.18)',
  text: '#ECEAE2',
  textDim: '#9298A0',
  textFaint: '#6B7078',
  accent: '#D6A855', // warm gold, matches web report
  accentDim: 'rgba(214, 168, 85, 0.16)',
  buy: '#5AC28A',
  buyDim: 'rgba(90, 194, 138, 0.16)',
  sell: '#E17A6B',
  sellDim: 'rgba(225, 122, 107, 0.16)',
  glassFillDark: 'rgba(255,255,255,0.06)',
  glassStrokeDark: 'rgba(255,255,255,0.14)',
};

export const gradient = {
  backdrop: ['#0B0D10', '#151A22', '#0E1013'] as const,
  gold: ['#E8C57E', '#B4842F'] as const,
  buy: ['#6BD79E', '#2E8F63'] as const,
  sell: ['#EE9587', '#B94D3E'] as const,
};

export const font = {
  display: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' }),
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  // body uses the platform system font (San Francisco on iOS) by leaving fontFamily undefined
};

export const radius = { sm: 10, md: 16, lg: 22, xl: 28, pill: 999 };

export const spacing = (n: number) => n * 4;

export const type = {
  display: { fontFamily: font.display, fontSize: 30, fontWeight: '700' as const, letterSpacing: 0.1 },
  h1: { fontFamily: font.display, fontSize: 22, fontWeight: '700' as const },
  h2: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodyStrong: { fontSize: 15, fontWeight: '600' as const },
  caption: { fontSize: 12, fontWeight: '500' as const, letterSpacing: 0.4 },
  mono: { fontFamily: font.mono, fontSize: 15, fontWeight: '600' as const },
  monoLg: { fontFamily: font.mono, fontSize: 26, fontWeight: '700' as const },
};

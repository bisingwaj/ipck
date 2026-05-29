import { Platform, TextStyle } from 'react-native';
import { tokens } from './tokens';

export const fonts = {
  ui:        Platform.select({ ios: 'IBMPlexSans',        android: 'IBMPlexSans',        default: 'System' }) as string,
  uiMedium:  Platform.select({ ios: 'IBMPlexSans-Medium', android: 'IBMPlexSans-Medium', default: 'System' }) as string,
  uiBold:    Platform.select({ ios: 'IBMPlexSans-Bold',   android: 'IBMPlexSans-Bold',   default: 'System' }) as string,
  serif:     Platform.select({ ios: 'IBMPlexSerif',          android: 'IBMPlexSerif',          default: 'serif' }) as string,
  serifMed:  Platform.select({ ios: 'IBMPlexSerif-Medium',   android: 'IBMPlexSerif-Medium',   default: 'serif' }) as string,
  serifBold: Platform.select({ ios: 'IBMPlexSerif-SemiBold', android: 'IBMPlexSerif-SemiBold', default: 'serif' }) as string,
  serifItalic: Platform.select({ ios: 'IBMPlexSerif-Italic', android: 'IBMPlexSerif-Italic',   default: 'serif' }) as string,
  mono:      Platform.select({ ios: 'IBMPlexMono', android: 'IBMPlexMono', default: 'monospace' }) as string,
};

export const text: Record<string, TextStyle> = {
  h1: { fontFamily: fonts.serifBold, fontSize: 32, lineHeight: 36, color: tokens.editorialInk, letterSpacing: -0.5 },
  h2: { fontFamily: fonts.serifBold, fontSize: 26, lineHeight: 32, color: tokens.editorialInk, letterSpacing: -0.4 },
  h3: { fontFamily: fonts.serifMed,  fontSize: 22, lineHeight: 28, color: tokens.editorialInk, letterSpacing: -0.3 },
  serif18: { fontFamily: fonts.serifMed, fontSize: 18, lineHeight: 25, color: tokens.editorialInk },
  serifLead: { fontFamily: fonts.serifMed, fontSize: 21, lineHeight: 30, color: tokens.editorialInk, letterSpacing: -0.2 },
  title: { fontFamily: fonts.uiBold, fontSize: 17, lineHeight: 22, color: tokens.text },
  body: { fontFamily: fonts.ui, fontSize: 15, lineHeight: 22, color: tokens.text },
  bodyStrong: { fontFamily: fonts.uiMedium, fontSize: 15, lineHeight: 22, color: tokens.text },
  caption: { fontFamily: fonts.ui, fontSize: 13, lineHeight: 18, color: tokens.textSecondary },
  small: { fontFamily: fonts.ui, fontSize: 12, lineHeight: 16, color: tokens.textSecondary },
  micro: { fontFamily: fonts.uiMedium, fontSize: 11, lineHeight: 14, color: tokens.textSecondary, letterSpacing: 0.5 },
  eyebrow: { fontFamily: fonts.uiBold, fontSize: 11, lineHeight: 14, color: tokens.textSecondary, letterSpacing: 1.5 },
  mono: { fontFamily: fonts.mono, fontSize: 13, color: tokens.textSecondary },
};

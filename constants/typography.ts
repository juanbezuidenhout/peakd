import { TextStyle } from 'react-native';

export const Typography: Record<string, TextStyle> = {
  displayLarge: { fontSize: 34, fontWeight: '800', letterSpacing: -0.5 },
  displayMedium: { fontSize: 28, fontWeight: '700', letterSpacing: -0.3 },
  heading: { fontSize: 22, fontWeight: '700' },
  subheading: { fontSize: 17, fontWeight: '600' },
  body: { fontSize: 15, fontWeight: '400' },
  caption: { fontSize: 13, fontWeight: '400' },
  label: { fontSize: 12, fontWeight: '500', letterSpacing: 0.5 },
} as const;

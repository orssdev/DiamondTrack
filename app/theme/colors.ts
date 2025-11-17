// File: app/theme/colors.ts



export const colors = {
 
  background: '#071524',
  surface: '#0f1720',   

 
  textPrimary: '#E6EEF7',
  textMuted: '#9CA3AF',
  textSubtle: '#Cbd5e1',

 
  green: '#34D399',     
  blue: '#1D4ED8',      

 
  borderSubtle: 'rgba(255,255,255,0.03)',
  borderMuted: 'rgba(255,255,255,0.06)'
} as const;

export type ColorKey = keyof typeof colors;

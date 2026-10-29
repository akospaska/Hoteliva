// Centralize brand changes here; feature components use semantic design tokens.
export const palettes = {
  light: {
    background: '#F5F6F2',
    surface: '#FFFFFF',
    ink: '#193D35',
    muted: '#65766D',
    line: '#DFE6DD',
    soft: '#EDF2E8',
    primary: '#246752',
    onPrimary: '#FFFFFF',
    accent: '#D5EBAA',
    onAccent: '#193D35',
    rail: '#153C32',
    onRail: '#EEF4E7',
    railMuted: '#B7CABB',
    danger: '#A24331',
    dangerSoft: '#FBE9E3',
    warning: '#805B21',
    warningSoft: '#FCF0D7',
  },
  dark: {
    background: '#11231F',
    surface: '#1A3029',
    ink: '#EEF3E8',
    muted: '#B1C1B4',
    line: '#344C40',
    soft: '#253D32',
    primary: '#C5E19F',
    onPrimary: '#193D35',
    accent: '#C5E19F',
    onAccent: '#193D35',
    rail: '#0C1D18',
    onRail: '#EEF3E8',
    railMuted: '#A8BFAE',
    danger: '#F0AF9B',
    dangerSoft: '#482C29',
    warning: '#E7CB86',
    warningSoft: '#423B25',
  },
};
export type ThemeName = keyof typeof palettes;
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, page: 40 };
export const radii = { control: 8, panel: 14, chip: 6, round: 999 };
export const typography = {
  regular: 'Manrope',
  strong: 'ManropeBold',
  small: 11,
  body: 14,
  label: 12,
  heading: 30,
  title: 23,
  metric: 38,
};
export const layout = { desktop: 960, sidebar: 224, maxContent: 1400, touch: 44 };

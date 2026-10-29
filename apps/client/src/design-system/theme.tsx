import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { palettes, type ThemeName } from './tokens';

const ThemeContext = createContext({
  mode: 'light' as ThemeName,
  colors: palettes.light,
  toggle: () => {},
});
export function DesignProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeName>('light');
  useEffect(() => {
    void AsyncStorage.getItem('hoteliva-theme')
      .then((value) => {
        if (value === 'dark' || value === 'light') setMode(value);
      })
      .catch(() => {});
  }, []);
  const toggle = () => {
    const next = mode === 'light' ? 'dark' : 'light';
    setMode(next);
    void AsyncStorage.setItem('hoteliva-theme', next).catch(() => {});
  };
  return (
    <ThemeContext.Provider value={{ mode, colors: palettes[mode], toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
export const useDesign = () => useContext(ThemeContext);

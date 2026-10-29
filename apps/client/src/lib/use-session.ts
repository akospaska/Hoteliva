import { useCallback, useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, clearToken, saveToken, type Profile } from './api';
import { translations, type Locale } from './translations';

export function useSession() {
  const [user, setUser] = useState<Profile | null>(null);
  const [locale, setLocale] = useState<Locale>('hu');
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const userId = user?.id;
  const refresh = useCallback(async () => {
    try {
      const result = await api<{ user: Profile }>('/auth/me');
      setUser(result.user);
      setLocale(result.user.locale);
      setNotice('');
    } catch (error) {
      const code = error instanceof Error ? error.message : 'SERVER_ERROR';
      if (code === 'UNAUTHORIZED' || code === 'SUSPENDED') {
        await clearToken();
        setUser(null);
        setNotice(code === 'SUSPENDED' ? code : '');
      } else setNotice(code);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void (async () => {
      const saved = await AsyncStorage.getItem('hoteliva-locale').catch(() => null);
      if (saved === 'hu' || saved === 'en') setLocale(saved);
      await refresh();
    })();
  }, [refresh]);
  useEffect(() => {
    if (!userId) return;
    const timer = setInterval(() => void refresh(), 30000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [userId, refresh]);
  useEffect(() => {
    if (Platform.OS === 'web') document.documentElement.lang = locale;
  }, [locale]);
  async function changeLocale(next: Locale) {
    try {
      if (user) await api('/auth/locale', 'PATCH', { locale: next });
      setLocale(next);
      await AsyncStorage.setItem('hoteliva-locale', next);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'SERVER_ERROR');
    }
  }
  async function login(email: string, password: string) {
    const result = await api<{ user: Profile; token?: string }>('/auth/login', 'POST', {
      email: email.trim().toLowerCase(),
      password,
    });
    await saveToken(result.token);
    setUser(result.user);
    setLocale(result.user.locale);
    setNotice('');
  }
  async function logout() {
    try {
      await api('/auth/logout', 'POST');
      await clearToken();
      setUser(null);
      setNotice('');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'SERVER_ERROR');
    }
  }
  return {
    user,
    locale,
    copy: translations[locale],
    loading,
    notice,
    login,
    logout,
    changeLocale,
    refresh,
  };
}
export type SessionState = ReturnType<typeof useSession>;

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export type Profile = {
  id: string;
  name: string;
  email: string;
  locale: 'hu' | 'en';
  role: 'platform_admin' | 'group_admin' | 'hotel_admin' | 'member';
  groupId: string | null;
  groupName: string | null;
  hotelIds: string[];
};
const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';
const native = Platform.OS !== 'web';
const key = 'hoteliva-session';
export async function clearToken() {
  if (native) await SecureStore.deleteItemAsync(key);
}
export async function saveToken(token?: string) {
  if (native && token) await SecureStore.setItemAsync(key, token);
}
export async function api<T = undefined>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const token = native ? await SecureStore.getItemAsync(key) : null;
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      credentials: native ? 'omit' : 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(native ? { 'X-Hoteliva-Client': 'native' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(
        path.includes('/translate') || path.includes('/ops/ask') ? 35000 : 15000,
      ),
    });
  } catch {
    throw new Error('NETWORK_ERROR');
  }
  if (!response.ok) {
    const data = await response.json().catch(() => ({ code: 'SERVER_ERROR' }));
    throw new Error(data.code ?? 'SERVER_ERROR');
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

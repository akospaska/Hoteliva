import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import type { Snapshot, Item, ItemInput } from './types';

export function useWorkspace(groupId: string) {
  const [snapshot, setSnapshot] = useState<Snapshot>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const generation = useRef(0);
  const pending = useRef(false);
  const path = useCallback(
    (suffix: string) => `/ops${suffix}${groupId ? `?groupId=${encodeURIComponent(groupId)}` : ''}`,
    [groupId],
  );
  const request = useCallback(
    <T>(suffix: string, method = 'GET', body?: unknown) => api<T>(path(suffix), method, body),
    [path],
  );
  const refresh = useCallback(async () => {
    const current = ++generation.current;
    try {
      const data = await request<Snapshot>('/bootstrap');
      while (data.cursor && current === generation.current) {
        const page = await request<{ records: Item[]; cursor: string }>('/page', 'POST', {
          cursor: data.cursor,
        });
        data.records.push(...page.records);
        data.cursor = page.cursor;
      }
      data.records.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      if (current === generation.current) {
        setSnapshot(data);
        setError('');
      }
    } catch (e) {
      if (current === generation.current) setError(e instanceof Error ? e.message : 'SERVER_ERROR');
    }
  }, [request]);
  useEffect(() => {
    const initial = setTimeout(() => void refresh(), 0);
    const timer = setInterval(() => void refresh(), 30000);
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
    };
  }, [refresh]);
  async function run<T>(work: () => Promise<T>): Promise<T | undefined> {
    if (pending.current) return undefined;
    pending.current = true;
    setBusy(true);
    setError('');
    try {
      const value = await work();
      await refresh();
      return value;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'SERVER_ERROR');
      return undefined;
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  const save = (input: ItemInput, item?: Item) =>
    run(() =>
      request<Item>(
        item ? `/records/${item._id}` : '/records',
        item ? 'PUT' : 'POST',
        item ? { ...input, version: item.version } : input,
      ),
    );
  const act = (item: Item, action: string, extra: object = {}) =>
    run(() =>
      request<Item>(`/records/${item._id}/actions`, 'POST', {
        version: item.version,
        action,
        ...extra,
      }),
    );
  return { snapshot, error, setError, busy, refresh, request, run, save, act };
}
export type WorkspaceState = ReturnType<typeof useWorkspace>;
export const message = (code: string, en: boolean) => {
  const messages: Record<string, [string, string]> = {
    PACKAGE_INCOMPLETE: [
      'Előbb zárd le a rendezvény kapcsolódó munkáit.',
      'Complete the event’s linked work first.',
    ],
    PARENT_CLOSED: [
      'A rendezvény már lezárás alatt áll. Új munka felvételéhez nyisd újra.',
      'The event is closing. Reopen it before adding work.',
    ],
    NO_ROOMS: ['Ehhez a hotelhez még nincs aktív szoba.', 'This hotel has no active rooms yet.'],
    PACKAGE_TOO_LARGE: [
      'A csomag túl nagy. Bontsd kisebb munkacsoportokra.',
      'This package is too large. Split it into smaller groups.',
    ],
    AI_RATE_LIMIT: [
      'Túl sok AI-kérés. Próbáld újra egy perc múlva.',
      'Too many AI requests. Try again in a minute.',
    ],
    PRINT_UNAVAILABLE: [
      'A nyomtatási dokumentum nem nyitható meg.',
      'The print document could not be opened.',
    ],
    ALREADY_EXISTS: [
      'Ez a bejegyzés vagy szabály már létezik.',
      'This entry or rule already exists.',
    ],
    ROOM_SERVICE_BLOCKED: [
      'A szobán „Ne zavarjanak” vagy „Nem kér takarítást” jelzés van.',
      'The room is marked Do not disturb or Cleaning declined.',
    ],
    HOTEL_UNAVAILABLE: [
      'Válassz egy aktív, hozzáférhető hotelt.',
      'Select an active hotel you can access.',
    ],
    INVALID_ASSIGNEE: [
      'A kijelölt munkatárs nem fér hozzá ehhez a munkához.',
      'The selected colleague cannot access this work.',
    ],
    INVALID_ATTACHMENT: [
      'A csatolmány nem megfelelő kép, vagy nagyobb 4 MB-nál.',
      'The attachment is not a supported image or exceeds 4 MB.',
    ],
    IMAGE_TOO_LARGE: ['A kép legfeljebb 4 MB lehet.', 'Images must be at most 4 MB.'],
    IDEMPOTENCY_CONFLICT: [
      'Ez a mentési kísérlet már más tartalommal szerepel. Frissítsd az oldalt és ellenőrizd a korábbi mentést.',
      'This save attempt already exists with different content. Refresh and check the previous result.',
    ],
    CHECKLIST_LOCKED: [
      'A már megkezdett ellenőrzőlista szerkezete nem módosítható.',
      'The structure of a checklist already in progress cannot be changed.',
    ],
    INVALID_VALUE: ['Ellenőrizd a megadott értéket.', 'Check the entered value.'],
    CONFLICT: [
      'Közben módosult az adat. Frissíts, majd próbáld újra.',
      'This item changed. Refresh and try again.',
    ],
    FORBIDDEN: ['Ehhez nincs jogosultságod.', 'You do not have permission.'],
    NOT_FOUND: ['Nem található vagy nem hozzáférhető.', 'Not found or unavailable.'],
    CHECKLIST_INCOMPLETE: [
      'Előbb végezd el a kötelező ellenőrzéseket.',
      'Complete all required checks first.',
    ],
    SCAN_REQUIRED: ['Olvasd be az ellenőrzőpont QR-kódját.', 'Scan the checkpoint QR code.'],
    INVALID_QR: [
      'Ez nem az ellenőrzőpont QR-kódja.',
      'This QR code does not match the checkpoint.',
    ],
    AI_NOT_CONFIGURED: [
      'A DeepSeek-kapcsolat még nincs beállítva.',
      'DeepSeek is not configured yet.',
    ],
    AI_UNAVAILABLE: [
      'A fordítószolgáltatás most nem elérhető.',
      'The translation service is unavailable.',
    ],
    ROOM_LIMIT: [
      'Elérted a szerződéses szobakeretet.',
      'The contracted room limit has been reached.',
    ],
    INSUFFICIENT_STOCK: ['Nincs elegendő készlet.', 'Insufficient stock.'],
    NETWORK_ERROR: [
      'Nem érhető el a szerver. Az adatot nem mentettük.',
      'The server is unavailable. Changes were not saved.',
    ],
    INVALID_INPUT: ['Ellenőrizd a mezőket és a dátumokat.', 'Check the fields and dates.'],
    REASON_REQUIRED: ['Indoklás szükséges.', 'A reason is required.'],
    INVALID_TRANSITION: [
      'Ez a művelet ebben az állapotban nem végezhető el.',
      'This action is unavailable in the current status.',
    ],
  };
  return (
    messages[code]?.[en ? 1 : 0] ||
    (en ? `Could not save (${code}).` : `Nem sikerült menteni (${code}).`)
  );
};

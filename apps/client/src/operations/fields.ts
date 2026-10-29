export type DataField = {
  key: string;
  hu: string;
  en: string;
  type?: 'number' | 'array';
  options?: string[];
};
const field = (
  key: string,
  hu: string,
  en: string,
  options?: string[],
  type?: DataField['type'],
): DataField => ({ key, hu, en, options, type });
// Field definitions describe business data; presentation belongs to the design system.
export const fields: Record<string, DataField[]> = {
  policy: [
    field('targetKind', 'Érintett munkatípus', 'Work type', [
      'task',
      'request',
      'cleaning',
      'round',
      'complaint',
      'audit',
    ]),
    field('minutes', 'Jelzés ennyi perc után', 'Escalate after minutes', undefined, 'number'),
  ],
  hotel: [
    field('address', 'Cím', 'Address'),
    field('timezone', 'Időzóna', 'Time zone', [
      'Europe/Budapest',
      'Europe/London',
      'Europe/Berlin',
      'America/New_York',
    ]),
  ],
  location: [
    field('type', 'Helyszín típusa', 'Location type', ['room', 'public', 'storage', 'technical']),
    field('building', 'Épület', 'Building'),
    field('floor', 'Emelet', 'Floor'),
    field('category', 'Szobakategória', 'Room category'),
    field(
      'linenEveryDays',
      'Ágyneműcsere gyakorisága (nap)',
      'Linen change interval (days)',
      undefined,
      'number',
    ),
  ],
  cleaning: [
    field('cleaningType', 'Takarítás típusa', 'Cleaning type', ['stayover', 'departure', 'deep']),
    field('linenChange', 'Ágyneműcsere', 'Linen change', ['yes', 'no']),
    field('estimatedMinutes', 'Tervezett idő (perc)', 'Estimated minutes', undefined, 'number'),
  ],
  template: [
    field('roomCategory', 'Szobakategória (üres: bármelyik)', 'Room category (empty: any)'),
    field('cleaningType', 'Takarítás típusa', 'Cleaning type', ['stayover', 'departure', 'deep']),
    field('vipOnly', 'Csak VIP-szobákhoz', 'VIP rooms only', ['yes', 'no']),
    field(
      'estimatedMinutes',
      'Tervezett munkaidő (perc)',
      'Estimated minutes',
      undefined,
      'number',
    ),
    field('purpose', 'Sablon célja', 'Template purpose', ['routine', 'quick']),
    field('targetKind', 'Létrehozott munka típusa', 'Work type', [
      'task',
      'cleaning',
      'round',
      'audit',
      'onboarding',
      'request',
      'event',
    ]),
    field('repeat', 'Ismétlődés', 'Repeat', ['none', 'daily', 'weekly', 'monthly']),
    field('nextRunAt', 'Következő indulás (ISO dátum)', 'Next run (ISO date)'),
    field('timezone', 'Időzóna', 'Time zone', [
      'Europe/Budapest',
      'Europe/London',
      'Europe/Berlin',
    ]),
  ],
  product: [
    field('price', 'Egységár', 'Unit price', undefined, 'number'),
    field('currency', 'Pénznem', 'Currency', ['HUF', 'EUR', 'USD']),
    field('quantity', 'Nyitókészlet', 'Opening stock', undefined, 'number'),
  ],
  consumption: [
    field('quantity', 'Mennyiség', 'Quantity', undefined, 'number'),
    field('price', 'Egységár', 'Unit price', undefined, 'number'),
    field('currency', 'Pénznem', 'Currency', ['HUF', 'EUR']),
    field('productId', 'Termék', 'Product'),
  ],
  vendor: [
    field('contact', 'Kapcsolattartó', 'Contact'),
    field('email', 'Email', 'Email'),
    field('phone', 'Telefon', 'Phone'),
  ],
  handover: [field('shift', 'Műszak', 'Shift', ['morning', 'afternoon', 'night'])],
  request: [
    field('guestReference', 'Vendégazonosító', 'Guest reference'),
    field('channel', 'Forrás', 'Channel', ['reception', 'phone', 'email']),
  ],
  article: [
    field('category', 'Témakör', 'Category'),
    field('videoUrl', 'Oktatóvideó HTTPS-linkje', 'Training video HTTPS link'),
  ],
  complaint: [
    field('guestReference', 'Vendégazonosító', 'Guest reference'),
    field('category', 'Panasz típusa', 'Complaint category'),
  ],
  event: [
    field('startsAt', 'Kezdés (ISO dátum)', 'Starts at (ISO date)'),
    field('endsAt', 'Befejezés (ISO dátum)', 'Ends at (ISO date)'),
    field('attendees', 'Létszám', 'Attendees', undefined, 'number'),
  ],
  onboarding: [
    field('process', 'Folyamat', 'Process', ['onboarding', 'offboarding', 'hr_request']),
    field('employeeId', 'Munkatárs', 'Employee'),
  ],
  purchase: [
    field('quantity', 'Mennyiség', 'Quantity', undefined, 'number'),
    field('estimatedCost', 'Becsült összeg', 'Estimated cost', undefined, 'number'),
    field('currency', 'Pénznem', 'Currency', ['HUF', 'EUR']),
    field('supplier', 'Szállító', 'Supplier'),
  ],
  incident: [
    field('category', 'Kategória', 'Category'),
    field('occurredAt', 'Esemény ideje (ISO dátum)', 'Occurred at (ISO date)'),
  ],
  audit: [field('standard', 'Standard', 'Standard')],
  asset: [
    field('manufacturer', 'Gyártó', 'Manufacturer'),
    field('supplier', 'Szállító', 'Supplier'),
    field('purchasedAt', 'Beszerzés dátuma', 'Purchase date'),
    field('serialNumber', 'Gyári szám', 'Serial number'),
    field('category', 'Típus', 'Category'),
    field('warrantyUntil', 'Garancia vége', 'Warranty until'),
    field('meterUnit', 'Mérőóra egysége', 'Meter unit'),
  ],
  conversation: [field('members', 'Résztvevők', 'Members', undefined, 'array')],
  poll: [
    field('options', 'Válaszok (soronként egy)', 'Options (one per line)', undefined, 'array'),
  ],
  found: [
    field('foundAt', 'Megtalálás ideje', 'Found at'),
    field('storage', 'Őrzési hely', 'Storage location'),
    field('retentionUntil', 'Őrzési határidő', 'Retention until'),
  ],
  stock: [
    field('quantity', 'Nyitókészlet', 'Opening stock', undefined, 'number'),
    field('minimum', 'Minimumkészlet', 'Minimum stock', undefined, 'number'),
    field('unit', 'Mértékegység', 'Unit'),
    field('category', 'Kategória', 'Category', ['linen', 'supplies', 'other']),
  ],
  integration: [
    field('provider', 'Szolgáltató', 'Provider'),
    field('category', 'Kapcsolat típusa', 'Connection type', ['pms', 'guest', 'hr', 'sso']),
    field('contact', 'Technikai kapcsolattartó', 'Technical contact'),
  ],
};
export const defaults = (kind: string) =>
  kind === 'location'
    ? { type: 'room' }
    : kind === 'template'
      ? { targetKind: 'task', repeat: 'none', timezone: 'Europe/Budapest' }
      : kind === 'hotel'
        ? { timezone: 'Europe/Budapest' }
        : {};

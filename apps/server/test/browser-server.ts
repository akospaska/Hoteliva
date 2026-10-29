import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { readConfig } from '../src/config.js';
import { openDatabase } from '../src/dals/database.js';
import { createApp } from '../src/app.js';
import { operationsFixture, operationInput } from './operations-fixture.js';

const mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
const database = await openDatabase(mongo.getUri('hoteliva_browser_test'));
const config = readConfig({ NODE_ENV: 'test', MONGODB_URI: mongo.getUri('hoteliva_browser_test') });
const { auth, admin, ops, ctx, hotel, room } = await operationsFixture(
  database,
  config,
  'browser@example.test',
);
for (const number of ['201', '202', '203', '205', '206', '207', '208'])
  await ops.create(
    ctx,
    operationInput('location', `${number} · Superior`, hotel._id, {
      data: { type: 'room', floor: '2', category: 'Superior' },
    }),
  );
await ops.create(
  ctx,
  operationInput('task', 'Csöpög a mosdó csapja', hotel._id, {
    locationId: room._id,
    department: 'maintenance',
    priority: 'urgent',
    description: 'A mosdó alatti csatlakozásnál ellenőrizni kell a tömítést.',
  }),
);
for (const [kind, title, data] of [
  ['product', 'Ásványvíz 0,5 l', { price: 900, currency: 'HUF', quantity: 24 }],
  [
    'template',
    'Napi szobaellenőrzés',
    { targetKind: 'cleaning', repeat: 'none', purpose: 'routine' },
  ],
  ['template', 'Nem működik a lámpa', { targetKind: 'task', repeat: 'none', purpose: 'quick' }],
  ['round', 'Esti biztonsági körjárat', {}],
  ['vendor', 'Tiszta Szobák Partner', { contact: 'Teszt kapcsolattartó' }],
  ['handover', 'Délutáni műszakátadás', { shift: 'afternoon' }],
  ['request', 'Két extra törölköző', { channel: 'reception' }],
  ['article', 'Kímélő vegyszerhasználat', { category: 'Takarítás' }],
  ['complaint', 'Zaj a folyosón', { category: 'Zaj' }],
  [
    'event',
    'Konferencia előkészítése',
    {
      startsAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + 7200000).toISOString(),
      attendees: 24,
    },
  ],
  ['onboarding', 'Új munkatárs betanítása', { process: 'onboarding' }],
  ['purchase', 'Új porszívó beszerzése', { quantity: 1, estimatedCost: 65000, currency: 'HUF' }],
  ['incident', 'Csúszásveszély a bejáratnál', { category: 'Munkabiztonság' }],
  ['audit', 'Havi minőségi audit', { standard: 'Belső szobastandard' }],
  ['asset', 'Központi vízmérő', { serialNumber: 'DEMO-104', meterUnit: 'm³' }],
  ['conversation', 'Mai operatív egyeztetés', { members: [] }],
  ['announcement', 'Új reggelizési rend', {}],
  ['poll', 'Következő csapatprogram', { options: ['Kirándulás', 'Közös vacsora'] }],
  ['idea', 'Vendégváró üdvözlőkártya', {}],
  ['found', 'Talált napszemüveg', { storage: 'Recepciós széf' }],
  ['stock', 'Fürdőlepedő', { quantity: 80, minimum: 20, unit: 'db', category: 'linen' }],
  [
    'integration',
    'PMS-adatkapcsolat tervezése',
    { category: 'pms', provider: 'Kiválasztás alatt' },
  ],
] as const) {
  const record = await ops.create(
    ctx,
    operationInput(kind, title, hotel._id, {
      description: 'Elkülönített tesztadat a munkafolyamat ellenőrzéséhez.',
      data: JSON.parse(JSON.stringify(data)),
      locationId: ['task', 'cleaning', 'request', 'found', 'asset'].includes(kind) ? room._id : '',
    }),
  );
  if (['article', 'announcement', 'poll', 'idea'].includes(kind))
    await ops.act(ctx, record._id, {
      version: record.version,
      action: 'publish',
      text: '',
      checkId: '',
      qrToken: '',
      data: {},
    });
}
await ops.create(
  ctx,
  operationInput('cleaning', '204 · Távozó takarítás', hotel._id, {
    locationId: room._id,
    department: 'housekeeping',
    checks: [{ id: 'bed', label: 'Ágynemű cseréje', type: 'check', required: true }],
  }),
);
const server = createApp(config, auth, admin, ops).listen(3001, '127.0.0.1');
async function stop() {
  server.close();
  await database.client.close();
  await mongo.stop();
  process.exit(0);
}
process.on('SIGTERM', stop);
process.on('SIGINT', stop);

import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { openDatabase, type Database } from '../src/dals/database.js';
import { createOperationsDal } from '../src/dals/operations.dal.js';
import { createOperationsWorker, nextOccurrence } from '../src/facades/operations-worker.facade.js';
import { createOperationsFacade } from '../src/facades/operations.facade.js';
import { createApp } from '../src/app.js';
import { readConfig } from '../src/config.js';
import { operationsFixture, operationInput } from './operations-fixture.js';
import type { ActionInput, Operation } from '../src/operations.js';

let mongo: MongoMemoryReplSet;
let db: Database;
let f: Awaited<ReturnType<typeof operationsFixture>>;
const action = (item: Operation, name: string, extra: Partial<ActionInput> = {}): ActionInput => ({
  version: item.version,
  action: name,
  text: '',
  checkId: '',
  qrToken: '',
  data: {},
  ...extra,
});
before(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  db = await openDatabase(mongo.getUri('operations'));
  f = await operationsFixture(
    db,
    readConfig({ NODE_ENV: 'test', MONGODB_URI: mongo.getUri('operations') }),
  );
});
after(async () => {
  await db?.client.close();
  await mongo?.stop();
});

test('tenant, location and revoked membership boundaries apply to details and QR', async () => {
  const member = await f.member('scope@example.test', 'Scope', [
    'location:read',
    'task:read',
    'task:create',
  ]);
  const other = await f.ops.create(
    f.ctx,
    operationInput('location', 'Restricted room', f.hotel._id, { data: { type: 'room' } }),
  );
  assert.equal((await f.ops.resolveQr(member.ctx, f.room.qrToken!))._id, f.room._id);
  await assert.rejects(f.ops.resolveQr(member.ctx, other.qrToken!), /INVALID_QR/);
  await assert.rejects(f.ops.details({ ...member.ctx, groupId: 'other' }, f.room._id), /NOT_FOUND/);
  const labels = await f.ops.qr(f.ctx, [f.room._id]);
  assert.match(labels[0]!.image, /^data:image\/png;base64,/);
  const rotated = await f.ops.act(f.ctx, f.room._id, action(f.room, 'rotate-qr'));
  await assert.rejects(f.ops.resolveQr(member.ctx, f.room.qrToken!), /INVALID_QR/);
  f.room = rotated;
  await f.ops.saveMembership(f.ctx, {
    userId: member.ctx.userId,
    hotelIds: [],
    locationIds: [],
    departments: [],
    permissions: [],
    vendorId: '',
  });
  await assert.rejects(f.ops.details(await f.ops.context(member.token), f.room._id), /NOT_FOUND/);
});

test('two instances cannot claim one task or overwrite a newer version', async () => {
  const a = await f.member('claim-a@example.test', 'A', [
    'task:read',
    'task:create',
    'location:read',
  ]);
  const b = await f.member('claim-b@example.test', 'B', [
    'task:read',
    'task:create',
    'location:read',
  ]);
  const task = await f.ops.create(
    f.ctx,
    operationInput('task', 'Concurrent', f.hotel._id, { locationId: f.room._id }),
  );
  const second = createOperationsFacade(
    createOperationsDal(db),
    f.auth,
    readConfig({ NODE_ENV: 'test', MONGODB_URI: mongo.getUri('operations') }),
  );
  const results = await Promise.allSettled([
    f.ops.act(a.ctx, task._id, action(task, 'claim')),
    second.act(b.ctx, task._id, action(task, 'claim')),
  ]);
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
  assert.equal(results.filter((r) => r.status === 'rejected').length, 1);
  await assert.rejects(
    f.ops.edit(f.ctx, task._id, 1, operationInput('task', 'Stale', f.hotel._id)),
    /CONFLICT/,
  );
});

test('walkthrough requires matching scan and completed required checks before review', async () => {
  let round = await f.ops.create(
    f.ctx,
    operationInput('round', 'Night patrol', f.hotel._id, {
      checks: [
        {
          id: 'point',
          label: 'Door locked',
          type: 'check',
          required: true,
          locationId: f.room._id,
        },
      ],
    }),
  );
  await assert.rejects(
    f.ops.act(f.ctx, round._id, action(round, 'complete')),
    /CHECKLIST_INCOMPLETE/,
  );
  await assert.rejects(
    f.ops.act(f.ctx, round._id, action(round, 'check', { checkId: 'point', value: true })),
    /SCAN_REQUIRED/,
  );
  await assert.rejects(
    f.ops.act(f.ctx, round._id, action(round, 'scan', { checkId: 'point', qrToken: 'wrong' })),
    /INVALID_QR/,
  );
  round = await f.ops.act(
    f.ctx,
    round._id,
    action(round, 'scan', { checkId: 'point', qrToken: f.room.qrToken }),
  );
  assert.equal(round.checks[0]!.completedAt, undefined);
  round = await f.ops.act(
    f.ctx,
    round._id,
    action(round, 'check', { checkId: 'point', value: true }),
  );
  round = await f.ops.act(f.ctx, round._id, action(round, 'complete'));
  assert.equal(round.status, 'review');
  round = await f.ops.act(f.ctx, round._id, action(round, 'approve'));
  assert.equal(round.status, 'done');
});

test('stock and checkout use atomic version checks and keep history', async () => {
  let stock = await f.ops.create(
    f.ctx,
    operationInput('stock', 'Towels', f.hotel._id, { data: { quantity: 5 } }),
  );
  await assert.rejects(
    f.ops.act(f.ctx, stock._id, action(stock, 'stock', { value: -6, text: 'Issue' })),
    /INSUFFICIENT_STOCK/,
  );
  stock = await f.ops.act(f.ctx, stock._id, action(stock, 'stock', { value: -3, text: 'Issue' }));
  assert.equal(stock.data.quantity, 2);
  assert.equal((await f.ops.details(f.ctx, stock._id)).activities.length, 2);
  const member = await f.member('holder@example.test', 'Holder', ['asset:read']);
  const unavailable = await f.ops.create(
    f.ctx,
    operationInput('asset', 'Office radio', f.hotel._id),
  );
  await assert.rejects(
    f.ops.act(
      f.ctx,
      unavailable._id,
      action(unavailable, 'checkout', { data: { holderId: member.ctx.userId } }),
    ),
    /INVALID_ASSIGNEE/,
  );
  const asset = await f.ops.create(
    f.ctx,
    operationInput('asset', 'Radio', f.hotel._id, {
      locationId: f.room._id,
    }),
  );
  const results = await Promise.allSettled([
    f.ops.act(
      f.ctx,
      asset._id,
      action(asset, 'checkout', { data: { holderId: member.ctx.userId } }),
    ),
    f.ops.act(
      f.ctx,
      asset._id,
      action(asset, 'checkout', { data: { holderId: member.ctx.userId } }),
    ),
  ]);
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
});

test('parallel room inserts respect group contract capacity', async () => {
  const count = await db.db
    .collection('operations')
    .countDocuments({ groupId: f.group._id, kind: 'location', 'data.type': 'room' });
  await db.groups.updateOne({ _id: f.group._id }, { $set: { maxRooms: count + 1 } });
  const results = await Promise.allSettled(
    ['Last A', 'Last B'].map((title) =>
      f.ops.create(
        f.ctx,
        operationInput('location', title, f.hotel._id, { data: { type: 'room' } }),
      ),
    ),
  );
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
  await db.groups.updateOne({ _id: f.group._id }, { $set: { maxRooms: 100 } });
});

test('recurring jobs are durable and deduplicated across worker instances', async () => {
  const template = await f.ops.create(
    f.ctx,
    operationInput('template', 'Daily opening', f.hotel._id, {
      data: {
        targetKind: 'task',
        repeat: 'daily',
        timezone: 'Europe/Budapest',
        nextRunAt: new Date(Date.now() - 1000).toISOString(),
      },
      checks: [{ id: 'door', label: 'Open door', type: 'check', required: true }],
    }),
  );
  await Promise.all([
    createOperationsWorker(createOperationsDal(db)).tick(),
    createOperationsWorker(createOperationsDal(db)).tick(),
  ]);
  const instances = await f.dal.list({ parentId: template._id });
  assert.equal(instances.length, 1);
  assert.equal(instances[0]!.checks[0]!.completedAt, undefined);
  assert.equal(
    nextOccurrence(new Date('2026-03-28T08:00:00Z'), 'daily', 'Europe/Budapest').toISOString(),
    '2026-03-29T07:00:00.000Z',
  );
});

test('published knowledge is versioned and AI rechecks access after provider returns', async () => {
  let article = await f.ops.create(
    f.ctx,
    operationInput('article', 'Door procedure', f.hotel._id, {
      description: 'Close the door after inspection.',
    }),
  );
  const member = await f.member('reader@example.test', 'Reader', ['article:read']);
  await assert.rejects(f.ops.details(member.ctx, article._id), /NOT_FOUND/);
  article = await f.ops.act(f.ctx, article._id, action(article, 'publish'));
  const answer = await f.ops.ask(member.ctx, 'Door procedure');
  assert.equal(answer.sources.length, 1);
  const provider = createOperationsFacade(
    f.dal,
    f.auth,
    readConfig({ NODE_ENV: 'test', MONGODB_URI: mongo.getUri('operations') }),
    async () => {
      await f.ops.saveMembership(f.ctx, {
        userId: member.ctx.userId,
        hotelIds: [],
        locationIds: [],
        departments: [],
        permissions: [],
        vendorId: '',
      });
      return 'Must not leak';
    },
  );
  await assert.rejects(provider.translate(member.ctx, article._id, 'de'), /NOT_FOUND/);
});

test('HTTP validates unknown fields and requires authenticated access', async () => {
  const app = createApp(
    readConfig({ NODE_ENV: 'test', MONGODB_URI: mongo.getUri('operations') }),
    f.auth,
    f.admin,
    f.ops,
  );
  assert.equal((await request(app).get('/ops/bootstrap')).status, 401);
  const response = await request(app)
    .post(`/ops/records?groupId=${f.group._id}`)
    .auth(f.login.token, { type: 'bearer' })
    .send({ kind: 'task', title: 'Injected', hotelId: f.hotel._id, status: 'done' });
  assert.equal(response.status, 400);
});

test('cleaning respects DND and updates room states atomically without lifting maintenance block', async () => {
  let room = await f.ops.get(f.ctx, f.room._id);
  room = await f.ops.act(
    f.ctx,
    room._id,
    action(room, 'room-state', { data: { service: 'dnd', maintenance: 'blocked' } }),
  );
  let cleaning = await f.ops.create(
    f.ctx,
    operationInput('cleaning', 'Protected cleaning', f.hotel._id, { locationId: room._id }),
  );
  await assert.rejects(
    f.ops.act(f.ctx, cleaning._id, action(cleaning, 'start')),
    /ROOM_SERVICE_BLOCKED/,
  );
  room = await f.ops.act(
    f.ctx,
    room._id,
    action(room, 'room-state', { data: { service: 'normal' } }),
  );
  cleaning = await f.ops.act(f.ctx, cleaning._id, action(cleaning, 'start'));
  assert.equal((await f.ops.get(f.ctx, room._id)).data.cleanliness, 'cleaning');
  cleaning = await f.ops.act(f.ctx, cleaning._id, action(cleaning, 'complete'));
  assert.equal((await f.ops.get(f.ctx, room._id)).data.cleanliness, 'review');
  await f.ops.act(f.ctx, cleaning._id, action(cleaning, 'approve'));
  room = await f.ops.get(f.ctx, room._id);
  assert.equal(room.data.cleanliness, 'clean');
  assert.equal(room.data.maintenance, 'blocked');
});

test('minibar batch retries are idempotent and price snapshots do not subtract stock', async () => {
  const product = await f.ops.create(
    f.ctx,
    operationInput('product', 'Mineral water', f.hotel._id, {
      data: { quantity: 20, price: 900, currency: 'HUF' },
    }),
  );
  const lines = [{ productId: product._id, quantity: 2 }];
  const result = await Promise.all([
    f.ops.minibar(f.ctx, f.room._id, lines, 'retry-safe-1', 'stay-17'),
    f.ops.minibar(f.ctx, f.room._id, lines, 'retry-safe-1', 'stay-17'),
  ]);
  assert.deepEqual(result[0], result[1]);
  const consumption = await f.ops.get(f.ctx, result[0]![0]!);
  assert.equal(consumption.data.price, 900);
  assert.equal(consumption.data.quantity, 2);
  assert.equal((await f.ops.get(f.ctx, product._id)).data.quantity, 20);
  await assert.rejects(
    f.ops.minibar(
      f.ctx,
      f.room._id,
      [{ productId: product._id, quantity: 3 }],
      'retry-safe-1',
      'stay-17',
    ),
    /IDEMPOTENCY_CONFLICT/,
  );
});

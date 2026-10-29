import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { openDatabase, type Database } from '../src/dals/database.js';
import { readConfig } from '../src/config.js';
import { operationsFixture, operationInput } from './operations-fixture.js';
import type { Operation, ActionInput } from '../src/operations.js';
import { hotelDeadline } from '../src/facades/cleaning-plan.facade.js';

let mongo: MongoMemoryReplSet;
let db: Database;
let f: Awaited<ReturnType<typeof operationsFixture>>;
const action = (r: Operation, name: string, extra: Partial<ActionInput> = {}): ActionInput => ({
  version: r.version,
  action: name,
  text: '',
  checkId: '',
  qrToken: '',
  data: {},
  ...extra,
});
before(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  db = await openDatabase(mongo.getUri('planning'));
  f = await operationsFixture(
    db,
    readConfig({ NODE_ENV: 'test', MONGODB_URI: mongo.getUri('planning') }),
  );
});
after(async () => {
  await db?.client.close();
  await mongo?.stop();
});

test('daily cleaning uses category checklists, linen interval, DND and hotel-local deadlines', async () => {
  let room = await f.ops.edit(
    f.ctx,
    f.room._id,
    f.room.version,
    operationInput('location', f.room.title, f.hotel._id, {
      data: { type: 'room', category: 'Deluxe', linenEveryDays: 2 },
    }),
  );
  room = await f.ops.act(
    f.ctx,
    room._id,
    action(room, 'room-state', { data: { occupancy: 'occupied', service: 'dnd' } }),
  );
  await f.ops.create(
    f.ctx,
    operationInput('template', 'Deluxe standard', f.hotel._id, {
      data: {
        targetKind: 'cleaning',
        repeat: 'none',
        roomCategory: 'Deluxe',
        cleaningType: 'stayover',
      },
      checks: [{ id: 'bed', label: 'Linen', type: 'check', required: true }],
    }),
  );
  const ids = await f.ops.cleaningPlan(f.ctx, f.hotel._id, '2026-10-30');
  assert.deepEqual(await f.ops.cleaningPlan(f.ctx, f.hotel._id, '2026-10-30'), ids);
  const cleaning = await f.ops.get(f.ctx, ids[0]!);
  assert.equal(cleaning.status, 'blocked');
  assert.equal(cleaning.data.blockReason, 'dnd');
  assert.equal(cleaning.data.cleaningType, 'stayover');
  assert.equal(cleaning.data.linenChange, 'yes');
  assert.equal(cleaning.checks[0]!.label, 'Linen');
  assert.equal(cleaning.dueAt, '2026-10-30T14:00:00.000Z');
  assert.equal(hotelDeadline('2026-07-01', 'Europe/Budapest'), '2026-07-01T13:00:00.000Z');
});

test('event package copies work atomically, shifts deadlines and blocks premature completion', async () => {
  let event = await f.ops.create(
    f.ctx,
    operationInput('event', 'Conference', f.hotel._id, {
      data: { startsAt: '2026-11-01T10:00:00Z', endsAt: '2026-11-01T12:00:00Z' },
    }),
  );
  let task = await f.ops.create(
    f.ctx,
    operationInput('task', 'Prepare room', f.hotel._id, {
      parentId: event._id,
      dueAt: '2026-11-01T09:00:00Z',
    }),
  );
  event = await f.ops.get(f.ctx, event._id);
  await assert.rejects(
    f.ops.act(f.ctx, event._id, action(event, 'complete')),
    /PACKAGE_INCOMPLETE/,
  );
  const ids = await f.ops.copyPackage(
    f.ctx,
    event._id,
    'December conference',
    '2026-12-01T10:00:00Z',
    'package-once',
  );
  assert.equal(ids.length, 2);
  assert.deepEqual(
    await f.ops.copyPackage(
      f.ctx,
      event._id,
      'December conference',
      '2026-12-01T10:00:00Z',
      'package-once',
    ),
    ids,
  );
  const child = await f.ops.get(f.ctx, ids[1]!);
  assert.equal(child.parentId, ids[0]);
  assert.equal(child.dueAt, '2026-12-01T09:00:00.000Z');
  task = await f.ops.act(f.ctx, task._id, action(task, 'complete'));
  await f.ops.act(f.ctx, task._id, action(task, 'approve'));
  event = await f.ops.act(f.ctx, event._id, action(event, 'complete'));
  await assert.rejects(
    f.ops.create(f.ctx, operationInput('task', 'Too late', f.hotel._id, { parentId: event._id })),
    /PARENT_CLOSED/,
  );
});

test('escalation defaults are scoped by hotel, type and priority, with explicit due dates preserved', async () => {
  await f.ops.create(
    f.ctx,
    operationInput('policy', 'Urgent requests', f.hotel._id, {
      priority: 'urgent',
      data: { targetKind: 'request', minutes: 15 },
    }),
  );
  const request = await f.ops.create(
    f.ctx,
    operationInput('request', 'Extra pillow', f.hotel._id, { priority: 'urgent' }),
  );
  assert.ok(Date.parse(request.dueAt) - Date.now() > 14 * 60000);
  const explicit = await f.ops.create(
    f.ctx,
    operationInput('request', 'Scheduled request', f.hotel._id, {
      priority: 'urgent',
      dueAt: '2030-01-01T12:00:00Z',
    }),
  );
  assert.equal(explicit.dueAt, '2030-01-01T12:00:00Z');
  const normal = await f.ops.create(
    f.ctx,
    operationInput('request', 'Normal request', f.hotel._id),
  );
  assert.equal(normal.dueAt, '');
});

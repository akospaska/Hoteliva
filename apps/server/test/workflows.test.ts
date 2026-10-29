import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { openDatabase, type Database } from '../src/dals/database.js';
import { readConfig } from '../src/config.js';
import { operationsFixture, operationInput } from './operations-fixture.js';
import type { Operation, ActionInput } from '../src/operations.js';

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
  db = await openDatabase(mongo.getUri('workflows'));
  f = await operationsFixture(
    db,
    readConfig({ NODE_ENV: 'test', MONGODB_URI: mongo.getUri('workflows') }),
  );
});
after(async () => {
  await db?.client.close();
  await mongo?.stop();
});

test('purchase approval is distinct from receipt; compensation cannot bypass approval permission', async () => {
  let purchase = await f.ops.create(
    f.ctx,
    operationInput('purchase', 'Vacuum', f.hotel._id, {
      data: { quantity: 1, estimatedCost: 50000, currency: 'HUF' },
    }),
  );
  await assert.rejects(
    f.ops.act(f.ctx, purchase._id, action(purchase, 'receive')),
    /INVALID_TRANSITION/,
  );
  purchase = await f.ops.act(f.ctx, purchase._id, action(purchase, 'complete'));
  purchase = await f.ops.act(f.ctx, purchase._id, action(purchase, 'approve'));
  assert.equal(purchase.status, 'approved');
  purchase = await f.ops.act(f.ctx, purchase._id, action(purchase, 'receive'));
  assert.equal(purchase.status, 'done');
  const member = await f.member('complaint-reader@example.test', 'Reception', [
    'complaint:read',
    'location:read',
  ]);
  let complaint = await f.ops.create(
    f.ctx,
    operationInput('complaint', 'Noise complaint', f.hotel._id, { locationId: f.room._id }),
  );
  await assert.rejects(
    f.ops.act(
      member.ctx,
      complaint._id,
      action(complaint, 'compensate', { value: 2000, text: 'Breakfast' }),
    ),
    /FORBIDDEN/,
  );
  complaint = await f.ops.act(
    f.ctx,
    complaint._id,
    action(complaint, 'compensate', { value: 2000, text: 'Breakfast' }),
  );
  assert.equal(complaint.data.compensation, 2000);
});

test('polls keep one current vote per user and published articles require version-specific receipt', async () => {
  const reader = await f.member('reader@example.test', 'Reader', ['article:read']);
  const outsider = await f.member('no-reader@example.test', 'No access', ['task:read']);
  let poll = await f.ops.create(
    f.ctx,
    operationInput('poll', 'Team day', f.hotel._id, { data: { options: ['Walk', 'Dinner'] } }),
  );
  poll = await f.ops.act(f.ctx, poll._id, action(poll, 'publish'));
  poll = await f.ops.act(f.ctx, poll._id, action(poll, 'vote', { value: 'Walk' }));
  poll = await f.ops.act(f.ctx, poll._id, action(poll, 'vote', { value: 'Dinner' }));
  assert.deepEqual(poll.data.votes, [`${f.ctx.userId}:Dinner`]);
  let article = await f.ops.create(
    f.ctx,
    operationInput('article', 'Safety standard', f.hotel._id, { description: 'Original' }),
  );
  article = await f.ops.act(f.ctx, article._id, action(article, 'publish'));
  assert.equal(
    (await f.dal.notifications(f.ctx.groupId, reader.ctx.userId)).filter(
      (n) => n.recordId === article._id,
    ).length,
    1,
  );
  assert.equal(
    (await f.dal.notifications(f.ctx.groupId, outsider.ctx.userId)).filter(
      (n) => n.recordId === article._id,
    ).length,
    0,
  );
  article = await f.ops.act(f.ctx, article._id, action(article, 'acknowledge'));
  assert.equal((article.data.receipts as string[]).length, 1);
  article = await f.ops.edit(
    f.ctx,
    article._id,
    article.version,
    operationInput('article', 'Safety standard', f.hotel._id, { description: 'Revised' }),
  );
  assert.equal(article.status, 'draft');
  assert.deepEqual(article.data.receipts, []);
  const versions = (await f.ops.details(f.ctx, article._id)).activities;
  assert.ok(versions.some((v) => v.snapshot?.description === 'Original'));
  assert.equal(versions.at(-1)?.snapshot?.description, 'Revised');
});

test('distributed routines are independent immutable copies and retries create no extra work', async () => {
  const room = await f.ops.create(
    f.ctx,
    operationInput('location', 'Second room', f.hotel._id, { data: { type: 'room' } }),
  );
  const template = await f.ops.create(
    f.ctx,
    operationInput('template', 'Room audit', f.hotel._id, {
      data: { targetKind: 'audit', repeat: 'none' },
      checks: [{ id: 'standard', label: 'Standard met', type: 'check', required: true }],
    }),
  );
  const ids = await f.ops.distribute(
    f.ctx,
    template._id,
    [f.room._id, room._id],
    '',
    'distribution-1',
  );
  assert.equal(ids.length, 2);
  assert.deepEqual(
    await f.ops.distribute(f.ctx, template._id, [room._id, f.room._id], '', 'distribution-1'),
    ids,
  );
  let first = await f.ops.get(f.ctx, ids[0]!);
  first = await f.ops.act(
    f.ctx,
    first._id,
    action(first, 'check', { checkId: 'standard', value: true }),
  );
  assert.equal((await f.ops.get(f.ctx, ids[1]!)).checks[0]!.completedAt, undefined);
  await f.ops.edit(
    f.ctx,
    template._id,
    template.version,
    operationInput('template', 'New standard', f.hotel._id, {
      data: { targetKind: 'audit', repeat: 'none' },
      checks: [{ id: 'standard', label: 'Updated standard', type: 'check', required: true }],
    }),
  );
  assert.equal(first.checks[0]!.label, 'Standard met');
});

test('deactivation transfers open work and revokes sessions in the same transaction', async () => {
  const old = await f.member('leaving@example.test', 'Leaving', [
    'task:read',
    'task:create',
    'location:read',
  ]);
  const replacement = await f.member('replacement@example.test', 'Replacement', [
    'task:read',
    'task:create',
    'location:read',
  ]);
  const task = await f.ops.create(
    f.ctx,
    operationInput('task', 'Transfer work', f.hotel._id, {
      locationId: f.room._id,
      assigneeId: old.ctx.userId,
    }),
  );
  await f.ops.disable(f.ctx, old.ctx.userId, replacement.ctx.userId);
  assert.equal((await f.ops.get(f.ctx, task._id)).assigneeId, replacement.ctx.userId);
  await assert.rejects(f.auth.authenticate(old.token), /UNAUTHORIZED/);
  assert.equal((await f.ops.details(f.ctx, task._id)).activities.at(-1)?.type, 'reassigned');
  const reassigned = await f.ops.get(f.ctx, task._id);
  await f.ops.act(f.ctx, task._id, action(reassigned, 'start'));
  await f.ops.disable(f.ctx, replacement.ctx.userId);
  const unassigned = await f.ops.get(f.ctx, task._id);
  assert.equal(unassigned.status, 'blocked');
  assert.equal(unassigned.data.activeSince, '');
  assert.ok(unassigned.data.waitingSince);
  assert.ok(Number(unassigned.data.activeMilliseconds) >= 0);
});

test('photo evidence is fetched separately and cannot be reused from an inaccessible task', async () => {
  const photo = {
    name: 'evidence.png',
    mime: 'image/png',
    base64:
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aT9sAAAAASUVORK5CYII=',
  };
  let task = await f.ops.create(
    f.ctx,
    operationInput('task', 'Photo check', f.hotel._id, {
      locationId: f.room._id,
      checks: [{ id: 'photo', label: 'Photo', type: 'photo', required: true }],
    }),
  );
  const activity = await f.ops.comment(f.ctx, task._id, 'Evidence', [], photo);
  assert.equal('base64' in activity.attachment!, false);
  assert.equal((await f.ops.photo(f.ctx, activity._id)).base64, photo.base64);
  task = await f.ops.act(
    f.ctx,
    task._id,
    action(task, 'check', { checkId: 'photo', value: activity._id }),
  );
  const other = await f.ops.create(
    f.ctx,
    operationInput('task', 'Other check', f.hotel._id, {
      checks: [{ id: 'photo', label: 'Photo', type: 'photo', required: true }],
    }),
  );
  await assert.rejects(
    f.ops.act(f.ctx, other._id, action(other, 'check', { checkId: 'photo', value: activity._id })),
    /INVALID_ATTACHMENT/,
  );
  const outsider = await f.member('no-photos@example.test', 'Outsider', ['article:read']);
  await assert.rejects(f.ops.photo(outsider.ctx, activity._id), /NOT_FOUND/);
});

test('meter rollbacks require a reason', async () => {
  let asset = await f.ops.create(f.ctx, operationInput('asset', 'Water meter', f.hotel._id));
  asset = await f.ops.act(f.ctx, asset._id, action(asset, 'reading', { value: 120 }));
  await assert.rejects(
    f.ops.act(f.ctx, asset._id, action(asset, 'reading', { value: 2 })),
    /REASON_REQUIRED/,
  );
  asset = await f.ops.act(
    f.ctx,
    asset._id,
    action(asset, 'reading', { value: 2, text: 'Meter replaced' }),
  );
  assert.equal(asset.data.meterValue, 2);
});

test('custom role updates and removal affect already logged-in members immediately', async () => {
  const member = await f.member('role-member@example.test', 'Role member', []);
  let role = await f.ops.create(
    f.ctx,
    operationInput('role', 'Cleaner', '', {
      data: { permissions: ['hotel:read', 'location:read', 'task:read', 'task:create'] },
    }),
  );
  await f.ops.saveMembership(f.ctx, {
    userId: member.ctx.userId,
    hotelIds: [f.hotel._id],
    locationIds: [f.room._id],
    departments: [],
    permissions: [],
    vendorId: '',
    roleIds: [role._id],
  });
  assert.equal((await f.ops.context(member.token)).permissions.includes('task:create'), true);
  role = await f.ops.edit(
    f.ctx,
    role._id,
    role.version,
    operationInput('role', 'Cleaner', '', {
      data: { permissions: ['hotel:read', 'location:read'] },
    }),
  );
  assert.equal((await f.ops.context(member.token)).permissions.includes('task:create'), false);
  await assert.rejects(f.ops.get(await f.ops.context(member.token), role._id), /NOT_FOUND/);
});

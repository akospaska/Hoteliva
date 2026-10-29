import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { randomUUID } from 'node:crypto';
import { openDatabase, type Database } from '../src/dals/database.js';
import { createAuthDal } from '../src/dals/auth.dal.js';
import { createAdminDal } from '../src/dals/admin.dal.js';
import { createJobsDal } from '../src/dals/jobs.dal.js';
import { createAuthFacade } from '../src/facades/auth.facade.js';
import { createAdminFacade } from '../src/facades/admin.facade.js';
import { createApp } from '../src/app.js';
import { readConfig } from '../src/config.js';

let mongo: MongoMemoryReplSet;
let db: Database;
let app: ReturnType<typeof createApp>;
let secondApp: ReturnType<typeof createApp>;
let adminToken: string;
let groupId: string;
const emails = new Map<string, string>();
const password = 'Local-test-password-849!';

before(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  db = await openDatabase(mongo.getUri('hoteliva_test'));
  const config = readConfig({ NODE_ENV: 'test', MONGODB_URI: mongo.getUri('hoteliva_test') });
  const dal = createAuthDal(db);
  const auth = createAuthFacade(dal, config);
  const admin = createAdminFacade(createAdminDal(db), dal, auth, async (email, token) => {
    emails.set(email, token);
  });
  app = createApp(config, auth, admin);
  const secondAuth = createAuthFacade(createAuthDal(db), config);
  secondApp = createApp(config, secondAuth, admin);
  await admin.bootstrap('platform@example.test', password);
  const login = await request(app)
    .post('/auth/login')
    .set('X-Hoteliva-Client', 'native')
    .send({ email: 'platform@example.test', password });
  assert.equal(login.status, 200);
  adminToken = login.body.token;
  const group = await request(app)
    .post('/platform/groups')
    .auth(adminToken, { type: 'bearer' })
    .send({ name: 'Test hotel group', maxUsers: 4, maxRooms: 100 });
  assert.equal(group.status, 201);
  groupId = group.body._id;
});
after(async () => {
  await db?.client.close();
  await mongo?.stop();
});

async function invite(email: string, targetGroup = groupId) {
  return request(app)
    .post('/platform/users')
    .auth(adminToken, { type: 'bearer' })
    .send({ email, name: 'Test user', groupId: targetGroup, role: 'group_admin' });
}
async function activateAndLogin(email: string) {
  await invite(email);
  const activated = await request(app)
    .post('/auth/activate')
    .send({ token: emails.get(email), password });
  assert.equal(activated.status, 204);
  return request(app)
    .post('/auth/login')
    .set('X-Hoteliva-Client', 'native')
    .send({ email, password });
}

test('registration is private and platform-only; failed login is generic', async () => {
  assert.equal((await request(app).post('/auth/register').send({})).status, 404);
  assert.equal(
    (await request(app).post('/platform/groups').send({ name: 'Denied', maxUsers: 1, maxRooms: 0 }))
      .status,
    401,
  );
  const login = await request(app)
    .post('/auth/login')
    .send({ email: 'missing@example.test', password });
  assert.equal(login.status, 401);
  assert.equal(login.body.code, 'INVALID_CREDENTIALS');
});

test('invitation works once and tenant admin cannot provision accounts', async () => {
  const login = await activateAndLogin('member@example.test');
  assert.equal(login.status, 200);
  assert.equal(login.body.user.groupId, groupId);
  assert.equal(
    (
      await request(app)
        .post('/auth/activate')
        .send({ token: emails.get('member@example.test'), password })
    ).status,
    400,
  );
  assert.equal(
    (
      await request(app)
        .post('/platform/groups')
        .auth(login.body.token, { type: 'bearer' })
        .send({ name: 'Denied', maxUsers: 1, maxRooms: 0 })
    ).status,
    403,
  );
});

test('web sessions use HttpOnly cookies; CSRF is rejected and logout revokes across web instances', async () => {
  const login = await request(app)
    .post('/auth/login')
    .send({ email: 'member@example.test', password });
  assert.equal(login.body.token, undefined);
  const cookies = login.headers['set-cookie'];
  assert.ok(Array.isArray(cookies));
  const cookie = cookies[0];
  assert.equal(typeof cookie, 'string');
  assert.ok(cookie);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
  assert.equal((await request(secondApp).get('/auth/me').set('Cookie', cookie)).status, 200);
  assert.equal(
    (
      await request(app)
        .post('/auth/logout')
        .set('Cookie', cookie)
        .set('Origin', 'https://other.test')
    ).status,
    403,
  );
  assert.equal(
    (
      await request(app)
        .post('/auth/logout')
        .set('Cookie', cookie)
        .set('Origin', 'http://localhost:8081')
    ).status,
    204,
  );
  assert.equal((await request(secondApp).get('/auth/me').set('Cookie', cookie)).status, 401);
});

test('existing session loses access immediately when group is suspended', async () => {
  const login = await activateAndLogin('suspended@example.test');
  await db.groups.updateOne({ _id: groupId }, { $set: { status: 'suspended' } });
  const response = await request(secondApp)
    .get('/auth/me')
    .auth(login.body.token, { type: 'bearer' });
  assert.equal(response.status, 403);
  assert.equal(response.body.code, 'SUSPENDED');
  await db.groups.updateOne({ _id: groupId }, { $set: { status: 'active' } });
});

test('parallel invitations cannot exceed group seats; duplicates do not consume capacity', async () => {
  const group = await request(app)
    .post('/platform/groups')
    .auth(adminToken, { type: 'bearer' })
    .send({ name: 'One seat', maxUsers: 1, maxRooms: 1 });
  const results = await Promise.all([
    invite('parallel-a@example.test', group.body._id),
    invite('parallel-b@example.test', group.body._id),
  ]);
  assert.deepEqual(results.map((result) => result.status).sort(), [201, 409]);
  assert.equal(await db.users.countDocuments({ groupId: group.body._id }), 1);
  const duplicate = await invite('member@example.test');
  assert.equal(duplicate.status, 409);
  assert.equal((await db.groups.findOne({ _id: groupId }))!.seats, 2);
});

test('multiple workers claim distinct jobs; expired leases recover and old owners cannot complete', async () => {
  const jobs = createJobsDal(db);
  await jobs.ensure();
  const first = await Promise.all([jobs.claim('worker-a'), jobs.claim('worker-b')]);
  assert.equal(first.filter(Boolean).length, 1);
  const id = randomUUID();
  await db.jobs.insertOne({
    _id: id,
    type: 'maintenance',
    owner: null,
    leaseUntil: new Date(0),
    nextRunAt: new Date(0),
  });
  assert.equal((await jobs.claim('worker-c'))!._id, id);
  await db.jobs.updateOne({ _id: id }, { $set: { leaseUntil: new Date(0) } });
  assert.equal((await jobs.claim('worker-d'))!.owner, 'worker-d');
  assert.equal((await jobs.complete(id, 'worker-c')).modifiedCount, 0);
  assert.equal((await jobs.complete(id, 'worker-d')).modifiedCount, 1);
});

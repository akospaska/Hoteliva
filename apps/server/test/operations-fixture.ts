import { createAuthDal } from '../src/dals/auth.dal.js';
import { createAdminDal } from '../src/dals/admin.dal.js';
import { createOperationsDal } from '../src/dals/operations.dal.js';
import { createAuthFacade } from '../src/facades/auth.facade.js';
import { createAdminFacade } from '../src/facades/admin.facade.js';
import { createOperationsFacade } from '../src/facades/operations.facade.js';
import type { Database } from '../src/dals/database.js';
import type { Config } from '../src/config.js';
import type { Kind, RecordInput } from '../src/operations.js';

export const operationInput = (
  kind: Kind,
  title: string,
  hotelId = '',
  extra: Partial<RecordInput> = {},
): RecordInput => ({
  kind,
  title,
  hotelId,
  description: '',
  locationId: '',
  department: '',
  assigneeId: '',
  dueAt: '',
  parentId: '',
  priority: 'normal',
  data: {},
  checks: [],
  ...extra,
});
export async function operationsFixture(
  db: Database,
  config: Config,
  email = 'operations@example.test',
) {
  const password = 'Browser-test-password-849!';
  const authDal = createAuthDal(db);
  const auth = createAuthFacade(authDal, config);
  const invitations = new Map<string, string>();
  const admin = createAdminFacade(createAdminDal(db), authDal, auth, async (email, token) => {
    invitations.set(email, token);
  });
  await admin.bootstrap(email, password);
  const login = await auth.login(email, password, 'fixture');
  const group = await admin.createGroup(login.token, {
    name: 'Hoteliva Demo Collection',
    maxUsers: 100,
    maxRooms: 100,
  });
  const dal = createOperationsDal(db);
  const ops = createOperationsFacade(
    dal,
    auth,
    config,
    async (_system, content) => `Test translation: ${content}`,
  );
  await ops.prepare();
  const ctx = await ops.context(login.token, group._id);
  let hotel = await ops.create(ctx, operationInput('hotel', 'Hotel Aurora Budapest'));
  hotel = await ops.act(ctx, hotel._id, {
    version: hotel.version,
    action: 'approve',
    text: '',
    data: {},
    checkId: '',
    qrToken: '',
  });
  const room = await ops.create(
    ctx,
    operationInput('location', '204 · Deluxe', hotel._id, {
      data: { type: 'room', floor: '2', category: 'Deluxe' },
    }),
  );
  async function member(email: string, name: string, permissions: string[]) {
    const user = await admin.invite(login.token, {
      email,
      name,
      locale: 'hu',
      groupId: group._id,
      role: 'member',
      hotelIds: [hotel._id],
    });
    await auth.activate(invitations.get(email)!, password);
    await ops.saveMembership(ctx, {
      userId: user.id,
      hotelIds: [hotel._id],
      locationIds: [room._id],
      departments: [],
      permissions,
      vendorId: '',
    });
    const result = await auth.login(email, password, 'fixture');
    return { ...result, ctx: await ops.context(result.token) };
  }
  return { auth, admin, ops, dal, login, group, ctx, hotel, room, member, password };
}

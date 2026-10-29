import { canRead, type Context, type Operation } from '../operations.js';
import type { OperationsDal } from '../dals/operations.dal.js';

/**
 * Finds active colleagues who can read the published record under their current scopes and
 * role permissions, excluding the publisher. Does not send notifications itself.
 */
export async function publicationAudience(dal: OperationsDal, ctx: Context, record: Operation) {
  const people = await dal.people(ctx.groupId);
  const ids: string[] = [];
  for (const person of people) {
    if (person.status !== 'active' || person._id === ctx.userId) continue;
    const member = await dal.membership(ctx.groupId, String(person._id));
    // Recipient targeting uses the same visibility rules as subsequent record reads.
    const target: Context = {
      ...ctx,
      userId: String(person._id),
      role: String(person.role),
      manager: person.role !== 'member',
      hotelIds:
        person.role === 'hotel_admin' ? person.hotelIds : member?.hotelIds || person.hotelIds,
      locationIds: member?.locationIds || [],
      departments: member?.departments || [],
      permissions: member?.permissions || [],
      vendorId: member?.vendorId || '',
    };
    if (canRead(target, record)) ids.push(target.userId);
  }
  return ids;
}

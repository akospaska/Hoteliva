import { fail } from '../domain.js';
import { canRead, type Context, type Membership } from '../operations.js';
import type { OperationsDal } from '../dals/operations.dal.js';
import type { OperationsContext } from './operations-context.js';
/**
 * Builds group-scoped membership management and offboarding workflows with persistent session
 * revocation.
 */
export function createOperationsMembers(dal: OperationsDal, access: OperationsContext) {
  return {
    /**
     * Lets platform or group admins update an active member’s role and location scopes after
     * validating every reference within the group.
     */
    async saveMembership(ctx: Context, input: Omit<Membership, '_id' | 'groupId'>) {
      if (!['platform_admin', 'group_admin'].includes(ctx.role)) fail('FORBIDDEN', 403);
      const user = await dal.person(ctx.groupId, input.userId);
      if (!user || user.role !== 'member') fail('INVALID_INPUT');
      for (const id of input.roleIds || []) {
        const role = await access.get(ctx, id);
        if (role.kind !== 'role' || role.status !== 'active') fail('INVALID_INPUT');
      }
      for (const id of input.hotelIds) {
        const hotel = await access.get(ctx, id);
        if (hotel.kind !== 'hotel') fail('INVALID_INPUT');
      }
      for (const id of input.locationIds) {
        const location = await access.get(ctx, id);
        if (location.kind !== 'location' || !input.hotelIds.includes(location.hotelId))
          fail('INVALID_INPUT');
      }
      if (input.vendorId) {
        const vendor = await access.get(ctx, input.vendorId);
        if (vendor.kind !== 'vendor') fail('INVALID_INPUT');
      }
      const member = { ...input, _id: `${ctx.groupId}:${input.userId}`, groupId: ctx.groupId };
      await dal.saveMembership(member);
      return member;
    },
    /**
     * Lets platform or group admins deactivate another user, transfer or unassign open work,
     * release the seat and revoke sessions atomically. Historical authorship remains
     * unchanged.
     */
    async disable(ctx: Context, userId: string, replacementId = '') {
      if (!['platform_admin', 'group_admin'].includes(ctx.role) || userId === ctx.userId)
        fail('FORBIDDEN', 403);
      const person = await dal.person(ctx.groupId, userId);
      if (!person) fail('NOT_FOUND', 404);
      if (replacementId === userId) fail('INVALID_ASSIGNEE');
      const replacement = replacementId ? await dal.person(ctx.groupId, replacementId) : null;
      if (replacementId && !replacement) fail('INVALID_ASSIGNEE');
      const membership = replacement ? await dal.membership(ctx.groupId, replacement._id) : null;
      const assigned = await dal.list({
        groupId: ctx.groupId,
        assigneeId: userId,
        status: { $nin: ['done', 'cancelled', 'archived'] },
      });
      const reassigned = assigned.map((before) => {
        if (
          replacement &&
          !canRead(
            {
              ...ctx,
              userId: replacement._id,
              role: replacement.role,
              manager: replacement.role !== 'member',
              hotelIds:
                replacement.role === 'hotel_admin'
                  ? replacement.hotelIds
                  : membership?.hotelIds || replacement.hotelIds,
              locationIds: membership?.locationIds || [],
              departments: membership?.departments || [],
              permissions: membership?.permissions || [],
            },
            before,
          )
        )
          fail('INVALID_ASSIGNEE');
        const next = {
          ...before,
          data: { ...before.data },
          assigneeId: replacementId,
          status:
            !replacementId && before.status === 'assigned'
              ? 'open'
              : !replacementId && before.status === 'in_progress'
                ? 'blocked'
                : before.status,
          updatedAt: new Date().toISOString(),
          version: before.version + 1,
        };
        if (!replacementId && before.status === 'in_progress') {
          // Stop measuring active work after the assigned user loses access.
          if (next.data.activeSince)
            next.data.activeMilliseconds =
              Number(next.data.activeMilliseconds || 0) +
              Math.max(0, Date.parse(next.updatedAt) - Date.parse(String(next.data.activeSince)));
          next.data.activeSince = '';
          next.data.waitingSince = next.updatedAt;
          next.data.blockReason = 'UNASSIGNED_AFTER_DEACTIVATION';
        }
        return {
          previous: before,
          next,
          activity: access.activity(
            ctx,
            next,
            'reassigned',
            replacement ? replacement.name : 'UNASSIGNED_AFTER_DEACTIVATION',
          ),
        };
      });
      await dal.disable(ctx.groupId, userId, reassigned);
    },
  };
}

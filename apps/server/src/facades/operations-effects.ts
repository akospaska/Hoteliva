import { fail } from '../domain.js';
import type { Context, Operation, ActionInput } from '../operations.js';
import type { OperationsContext } from './operations-context.js';

/**
 * Prepares the room change that must commit with a cleaning transition. Enforces DND and
 * competing-cleaning guards, preserves maintenance restrictions and records approved linen
 * changes; does not write directly.
 */
export async function cleaningEffect(
  access: OperationsContext,
  ctx: Context,
  before: Operation,
  input: ActionInput,
) {
  const states: Record<string, string> = {
    start: 'cleaning',
    complete: 'review',
    approve: 'clean',
    reject: 'dirty',
    cancel: 'dirty',
  };
  if (before.kind !== 'cleaning' || !before.locationId || !states[input.action]) return undefined;
  const room = await access.get(ctx, before.locationId);
  if (input.action === 'start' && ['dnd', 'skip'].includes(String(room.data.service)))
    fail('ROOM_SERVICE_BLOCKED', 409);
  if (room.data.currentCleaningId && room.data.currentCleaningId !== before._id)
    fail('CONFLICT', 409);
  const next: Operation = {
    ...room,
    data: {
      ...room.data,
      cleanliness: states[input.action]!,
      currentCleaningId: ['approve', 'cancel', 'reject'].includes(input.action) ? '' : before._id,
    },
    version: room.version + 1,
    updatedAt: new Date().toISOString(),
  };
  if (input.action === 'approve' && before.data.linenChange === 'yes')
    next.data.linenChangedAt = new Date().toISOString();
  return {
    previous: room,
    next,
    activity: access.activity(ctx, next, `cleaning-${input.action}`, before.title),
  };
}

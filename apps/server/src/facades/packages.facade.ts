import { createHash } from 'node:crypto';
import { fail } from '../domain.js';
import {
  canRead,
  canManage,
  type Context,
  type Operation,
  type RecordInput,
} from '../operations.js';
import type { OperationsDal } from '../dals/operations.dal.js';
import type { OperationsContext } from './operations-context.js';

/**
 * Builds event package copying with scoped source access and transactional batch
 * deduplication.
 */
export function createPackageFacade(
  dal: OperationsDal,
  access: OperationsContext,
  prepare: (ctx: Context, input: RecordInput) => Promise<Operation>,
) {
  /**
   * Requires event management access and copies the event plus accessible child work with
   * shifted deadlines and reset completion data. Identical retries return the saved batch;
   * changed retry inputs are rejected.
   */
  return async (ctx: Context, id: string, title: string, startsAt: string, requestId: string) => {
    const original = await access.get(ctx, id);
    if (original.kind !== 'event' || !canManage(ctx, 'event')) fail('FORBIDDEN', 403);
    const key = `${ctx.groupId}:${ctx.userId}:package:${requestId}`;
    const fingerprint = createHash('sha256')
      .update(JSON.stringify([id, title, startsAt]))
      .digest('hex');
    const receipt = await dal.batchReceipt(key);
    if (receipt) {
      if (receipt.fingerprint !== fingerprint) fail('IDEMPOTENCY_CONFLICT', 409);
      return receipt.recordIds;
    }
    const start = Date.parse(startsAt);
    const previousStart = Date.parse(String(original.data.startsAt || original.createdAt));
    const offset = start - previousStart;
    const children = (await dal.list({ groupId: ctx.groupId, parentId: id })).filter(
      (r) => canRead(ctx, r) && ['task', 'cleaning', 'request', 'round', 'audit'].includes(r.kind),
    );
    if (children.length > 200) fail('PACKAGE_TOO_LARGE');
    const items: Operation[] = [];
    for (const source of [original, ...children]) {
      const root = source._id === original._id;
      const data = root
        ? {
            ...original.data,
            startsAt,
            endsAt: original.data.endsAt
              ? new Date(Date.parse(String(original.data.endsAt)) + offset).toISOString()
              : '',
          }
        : Object.fromEntries(
            Object.entries(source.data).filter(([key]) =>
              ['estimatedMinutes', 'category', 'cleaningType', 'linenChange', 'standard'].includes(
                key,
              ),
            ),
          );
      const input: RecordInput = {
        kind: source.kind,
        title: root ? title : source.title,
        description: source.description,
        hotelId: source.hotelId,
        locationId: source.locationId,
        department: source.department,
        assigneeId: source.assigneeId,
        dueAt: source.dueAt ? new Date(Date.parse(source.dueAt) + offset).toISOString() : '',
        priority: source.priority,
        parentId: root ? '' : original._id,
        data,
        checks: source.checks.map(({ id, label, type, required, locationId, guideId }) => ({
          id,
          label,
          type,
          required,
          locationId,
          guideId,
        })),
      };
      if (root) {
        for (const key of [
          'receipts',
          'votes',
          'approvedBy',
          'approvedAt',
          'publishedVersion',
          'completedAt',
          'startedAt',
          'activeSince',
          'waitingSince',
          'activeMilliseconds',
          'waitingMilliseconds',
          'blockReason',
        ])
          delete input.data[key];
      }
      const item = await prepare(ctx, input);
      if (!root) item.parentId = items[0]!._id;
      items.push(item);
    }
    return dal.insertBatch(
      key,
      fingerprint,
      items,
      items.map((r) => access.activity(ctx, r, 'created')),
    );
  };
}

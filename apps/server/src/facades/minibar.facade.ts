import { fail } from '../domain.js';
import { createHash } from 'node:crypto';
import type { OperationsDal } from '../dals/operations.dal.js';
import type { OperationsContext } from './operations-context.js';
import type { Context, Operation } from '../operations.js';

/**
 * Builds minibar consumption recording with scoped product access and idempotent batch
 * persistence.
 */
export function createMinibarFacade(dal: OperationsDal, access: OperationsContext) {
  /**
   * Requires consumption creation permission and accessible products in the same hotel. Saves
   * quantity and price snapshots once per request without changing stock or billing a PMS.
   */
  return async (
    ctx: Context,
    locationId: string,
    lines: { productId: string; quantity: number }[],
    requestId: string,
    stayReference: string,
  ) => {
    if (!ctx.manager && !ctx.permissions.includes('consumption:create')) fail('FORBIDDEN', 403);
    const room = await access.get(ctx, locationId);
    if (room.kind !== 'location') fail('INVALID_INPUT');
    const key = `${ctx.groupId}:${ctx.userId}:minibar:${requestId}`;
    const fingerprint = createHash('sha256')
      .update(
        JSON.stringify([
          locationId,
          lines.slice().sort((a, b) => a.productId.localeCompare(b.productId)),
          stayReference,
        ]),
      )
      .digest('hex');
    const existing = await dal.batchReceipt(key);
    if (existing) {
      if (existing.fingerprint !== fingerprint) fail('IDEMPOTENCY_CONFLICT', 409);
      return existing.recordIds;
    }
    if (new Set(lines.map((l) => l.productId)).size !== lines.length) fail('INVALID_INPUT');
    const records: Operation[] = [];
    for (const line of lines) {
      const product = await access.get(ctx, line.productId);
      if (
        product.kind !== 'product' ||
        product.hotelId !== room.hotelId ||
        product.status !== 'active'
      )
        fail('INVALID_INPUT');
      const now = new Date().toISOString();
      const input = {
        kind: 'consumption' as const,
        title: `${room.title} · ${product.title}`,
        description: '',
        hotelId: room.hotelId,
        locationId,
        department: '',
        assigneeId: '',
        dueAt: '',
        priority: 'normal' as const,
        parentId: '',
        checks: [],
        data: {
          productId: product._id,
          quantity: line.quantity,
          price: Number(product.data.price || 0),
          currency: String(product.data.currency || 'HUF'),
          stayReference,
        },
      };
      await access.validate(ctx, input);
      records.push({
        ...input,
        _id: dal.id(),
        groupId: ctx.groupId,
        status: 'open',
        version: 1,
        createdBy: ctx.userId,
        createdAt: now,
        updatedAt: now,
      });
    }
    // Consumption recording neither changes stock nor bills a PMS; retries return the same batch.
    return dal.insertBatch(
      key,
      fingerprint,
      records,
      records.map((record) => access.activity(ctx, record, 'created')),
    );
  };
}

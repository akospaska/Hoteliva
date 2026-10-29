import { createHash } from 'node:crypto';
import { fail } from '../domain.js';
import { canRead, type Context, type Operation, type RecordInput } from '../operations.js';
import type { OperationsDal } from '../dals/operations.dal.js';
import type { OperationsContext } from './operations-context.js';

/**
 * Converts the planning date at 15:00 in the hotel time zone to UTC, accounting for daylight
 * saving offsets.
 */
export function hotelDeadline(date: string, zone: string) {
  const target = Date.parse(`${date}T15:00:00Z`);
  let candidate = target;
  for (let i = 0; i < 3; i++) {
    const p = Object.fromEntries(
      new Intl.DateTimeFormat('en-GB', {
        timeZone: zone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
      })
        .formatToParts(new Date(candidate))
        .map((v) => [v.type, v.value]),
    );
    candidate +=
      target -
      Date.UTC(
        Number(p.year),
        Number(p.month) - 1,
        Number(p.day),
        Number(p.hour),
        Number(p.minute),
        Number(p.second),
      );
  }
  return new Date(candidate).toISOString();
}
/**
 * Builds daily housekeeping planning with scoped room access, reusable templates and durable
 * batch deduplication.
 */
export function createCleaningPlan(
  dal: OperationsDal,
  access: OperationsContext,
  prepare: (ctx: Context, input: RecordInput) => Promise<Operation>,
) {
  /**
   * Requires a manager and an active hotel, then creates one daily batch from room category,
   * occupancy, VIP and linen rules. DND and declined rooms start blocked; retries return the
   * existing plan.
   */
  return async (ctx: Context, hotelId: string, date: string) => {
    if (!ctx.manager) fail('FORBIDDEN', 403);
    const hotel = await access.get(ctx, hotelId);
    if (hotel.kind !== 'hotel' || hotel.status !== 'active') fail('HOTEL_UNAVAILABLE', 403);
    const key = `${ctx.groupId}:cleaning-plan:${hotelId}:${date}`;
    const existing = await dal.batchReceipt(key);
    if (existing) return existing.recordIds;
    const rooms = (
      await dal.list({
        groupId: ctx.groupId,
        hotelId,
        kind: 'location',
        'data.type': 'room',
        status: 'active',
      })
    ).filter((r) => canRead(ctx, r));
    if (!rooms.length) fail('NO_ROOMS');
    if (rooms.length > 500) fail('PACKAGE_TOO_LARGE');
    const templates = (
      await dal.list({
        groupId: ctx.groupId,
        hotelId,
        kind: 'template',
        status: 'active',
        'data.targetKind': 'cleaning',
      })
    ).filter((r) => canRead(ctx, r) && r.data.purpose !== 'quick');
    const dueAt = hotelDeadline(date, String(hotel.data.timezone || 'Europe/Budapest'));
    const items: Operation[] = [];
    for (const room of rooms) {
      const cleaningType = room.data.occupancy === 'occupied' ? 'stayover' : 'departure';
      const candidates = templates.filter(
        (r) =>
          (!r.data.roomCategory || r.data.roomCategory === room.data.category) &&
          (!r.data.cleaningType || r.data.cleaningType === cleaningType) &&
          (r.data.vipOnly !== 'yes' || room.data.service === 'vip'),
      );
      candidates.sort(
        (a, b) =>
          Number(!!b.data.roomCategory) +
          Number(b.data.vipOnly === 'yes') -
          Number(!!a.data.roomCategory) -
          Number(a.data.vipOnly === 'yes'),
      );
      const template = candidates[0];
      const interval = Number(room.data.linenEveryDays || 0);
      const linen =
        cleaningType === 'departure' ||
        (interval > 0 &&
          (!room.data.linenChangedAt ||
            Date.parse(dueAt) - Date.parse(String(room.data.linenChangedAt)) >=
              interval * 86400000));
      const record = await prepare(ctx, {
        kind: 'cleaning',
        title: `${room.title} · ${date}`,
        description: template?.description || '',
        hotelId,
        locationId: room._id,
        department: 'housekeeping',
        assigneeId: '',
        dueAt,
        priority: room.data.service === 'vip' ? 'high' : 'normal',
        parentId: template?._id || '',
        data: {
          cleaningType,
          linenChange: linen ? 'yes' : 'no',
          planDate: date,
          sourceVersion: template?.version || 0,
          estimatedMinutes: Number(template?.data.estimatedMinutes || 30),
        },
        checks:
          template?.checks.map(({ id, label, type, required, locationId, guideId }) => ({
            id,
            label,
            type,
            required,
            locationId,
            guideId,
          })) || [],
      });
      if (['dnd', 'skip'].includes(String(room.data.service))) {
        record.status = 'blocked';
        record.data.blockReason = String(room.data.service);
      }
      items.push(record);
    }
    return dal.insertBatch(
      key,
      createHash('sha256').update(key).digest('hex'),
      items,
      items.map((r) => access.activity(ctx, r, 'planned')),
    );
  };
}

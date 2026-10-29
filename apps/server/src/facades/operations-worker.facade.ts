import { randomUUID } from 'node:crypto';
import type { OperationsDal } from '../dals/operations.dal.js';
import type { Operation } from '../operations.js';

/**
 * Calculates the next local daily, weekly or monthly occurrence, adjusting for time zone
 * offsets and clamping short months.
 */
export function nextOccurrence(date: Date, repeat: string, zone: string) {
  /**
   * Extracts calendar and clock components in the hotel time zone for recurrence
   * calculations.
   */
  const parts = (d: Date) =>
    Object.fromEntries(
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
        .formatToParts(d)
        .map((p) => [p.type, p.value]),
    );
  const p = parts(date);
  const target = new Date(
    Date.UTC(
      Number(p.year),
      Number(p.month) - 1,
      Number(p.day),
      Number(p.hour),
      Number(p.minute),
      Number(p.second),
    ),
  );
  if (repeat === 'monthly') {
    const day = target.getUTCDate();
    target.setUTCDate(1);
    target.setUTCMonth(target.getUTCMonth() + 1);
    const last = new Date(
      Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
    ).getUTCDate();
    target.setUTCDate(Math.min(day, last));
  } else target.setUTCDate(target.getUTCDate() + (repeat === 'weekly' ? 7 : 1));
  let candidate = target.getTime();
  for (let i = 0; i < 3; i++) {
    const q = parts(new Date(candidate));
    const local = Date.UTC(
      Number(q.year),
      Number(q.month) - 1,
      Number(q.day),
      Number(q.hour),
      Number(q.minute),
      Number(q.second),
    );
    candidate += target.getTime() - local;
  }
  return new Date(candidate);
}
/**
 * Builds recurring work creation, overdue escalation and personal reminder processing on
 * durable DAL state.
 */
export function createOperationsWorker(dal: OperationsDal) {
  return {
    /**
     * Claims individual routine leases and creates deduplicated work instances, then
     * processes overdue alerts and reminders. Skips suspended groups and uses stable
     * notification keys for retries.
     */
    async tick() {
      const owner = randomUUID();
      for (let i = 0; i < 25; i++) {
        const template = await dal.claimSchedule(owner);
        if (!template) break;
        const group = await dal.group(template.groupId);
        if (group?.status !== 'active') continue;
        const now = new Date().toISOString();
        const due = template.nextRunAt!;
        const key = `${template._id}:${due.toISOString()}`;
        const instance: Operation = {
          ...template,
          _id: key,
          recurrenceKey: key,
          kind: String(template.data.targetKind || 'task') as Operation['kind'],
          data: { templateVersion: template.version },
          status: 'open',
          parentId: template._id,
          dueAt: due.toISOString(),
          nextRunAt: undefined,
          leaseUntil: undefined,
          leaseOwner: undefined,
          createdAt: now,
          updatedAt: now,
          version: 1,
          checks: template.checks.map(({ id, label, type, required, locationId, guideId }) => ({
            id,
            label,
            type,
            required,
            locationId,
            guideId,
          })),
        };
        // Each scheduled occurrence creates one instance; insertion and lease completion share a transaction.
        await dal.finishSchedule(
          template,
          owner,
          instance,
          nextOccurrence(
            due,
            String(template.data.repeat),
            String(template.data.timezone || 'Europe/Budapest'),
          ),
        );
      }
      const overdue = dal.scan({
        dueAt: { $gt: '', $lt: new Date().toISOString() },
        status: { $in: ['open', 'assigned', 'in_progress', 'blocked'] },
      });
      for await (const record of overdue) {
        if ((await dal.group(record.groupId))?.status !== 'active') continue;
        const leaders = (await dal.people(record.groupId)).filter(
          (u) =>
            u.status === 'active' &&
            (u.role === 'group_admin' ||
              (u.role === 'hotel_admin' && u.hotelIds.includes(record.hotelId))),
        );
        for (const leader of leaders)
          await dal.notify({
            _id: `overdue:${record._id}:${record.dueAt}:${leader._id}`,
            userId: leader._id,
            groupId: record.groupId,
            recordId: record._id,
            text: record.title,
            createdAt: new Date().toISOString(),
            readAt: null,
          });
      }
      for (const item of await dal.duePreferences()) {
        const record = await dal.get(item.groupId, item.recordId);
        if (
          !record ||
          ['done', 'cancelled', 'archived'].includes(record.status) ||
          !(await dal.person(item.groupId, item.userId)) ||
          (await dal.group(item.groupId))?.status !== 'active'
        ) {
          await dal.finishReminder(item._id, item.remindAt);
          continue;
        }
        await dal.notify({
          _id: `reminder:${item._id}:${item.remindAt?.toISOString()}`,
          userId: item.userId,
          groupId: item.groupId,
          recordId: item.recordId,
          text: record.title,
          createdAt: new Date().toISOString(),
          readAt: null,
        });
        await dal.finishReminder(item._id, item.remindAt);
      }
    },
  };
}

import { randomUUID } from 'node:crypto';
import type { Filter } from 'mongodb';
import type { Database } from './database.js';
import type { Operation, Activity, Membership, Notification, Preference } from '../operations.js';
import { fail } from '../domain.js';

export function createOperationsDal(database: Database) {
  const { db, client, users, groups } = database;
  const records = db.collection<Operation>('operations');
  const activities = db.collection<Activity>('activities');
  const memberships = db.collection<Membership>('memberships');
  const notifications = db.collection<Notification>('notifications');
  const preferences = db.collection<Preference>('preferences');
  const translations = db.collection<{ _id: string; text: string }>('translations');
  const settings = db.collection<{
    _id: string;
    filter: { department: string; assignee: string; from: string; to: string };
  }>('user_operation_settings');
  const photos = db.collection<{
    _id: string;
    groupId: string;
    recordId: string;
    mime: string;
    base64: string;
  }>('operation_photos');
  const aiBudgets = db.collection<{ _id: string; count: number; expiresAt: Date }>('ai_budgets');
  const batches = db.collection<{ _id: string; fingerprint: string; recordIds: string[] }>(
    'operation_batches',
  );
  return {
    async prepare() {
      await Promise.all([
        records.createIndex({ groupId: 1, hotelId: 1, kind: 1, updatedAt: -1 }),
        records.createIndex({ recurrenceKey: 1 }, { unique: true, sparse: true }),
        records.createIndex({ qrToken: 1 }, { unique: true, sparse: true }),
        records.createIndex({ nextRunAt: 1, leaseUntil: 1 }),
        records.createIndex(
          { groupId: 1, hotelId: 1, 'data.targetKind': 1, priority: 1 },
          {
            unique: true,
            partialFilterExpression: { kind: 'policy', status: 'active' },
            name: 'unique_active_escalation_policy',
          },
        ),
        activities.createIndex({ groupId: 1, recordId: 1, createdAt: 1 }),
        memberships.createIndex({ groupId: 1, userId: 1 }, { unique: true }),
        notifications.createIndex({ userId: 1, createdAt: -1 }),
        preferences.createIndex({ remindAt: 1, notifiedAt: 1 }),
        aiBudgets.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      ]);
    },
    batchReceipt: (id: string) => batches.findOne({ _id: id }),
    settings: (groupId: string, userId: string) =>
      settings.findOne({ _id: `${groupId}:${userId}` }),
    saveFilter: (
      groupId: string,
      userId: string,
      filter: { department: string; assignee: string; from: string; to: string },
    ) =>
      settings.updateOne({ _id: `${groupId}:${userId}` }, { $set: { filter } }, { upsert: true }),
    async takeAiSlot(id: string, limit: number) {
      try {
        await aiBudgets.findOneAndUpdate(
          { _id: id, count: { $lt: limit } },
          { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(Date.now() + 120000) } },
          { upsert: true },
        );
        return true;
      } catch (error) {
        if ((error as { code?: number }).code === 11000) return false;
        throw error;
      }
    },
    async insertBatch(id: string, fingerprint: string, items: Operation[], history: Activity[]) {
      const session = client.startSession();
      try {
        return await session.withTransaction(async () => {
          const previous = await batches.findOne({ _id: id }, { session });
          if (previous) {
            if (previous.fingerprint !== fingerprint) fail('IDEMPOTENCY_CONFLICT', 409);
            return previous.recordIds;
          }
          const recordIds = items.map((r) => r._id);
          await batches.insertOne({ _id: id, fingerprint, recordIds }, { session });
          await records.insertMany(items, { session });
          await activities.insertMany(history, { session });
          return recordIds;
        });
      } finally {
        await session.endSession();
      }
    },
    list: (filter: Filter<Operation>) =>
      records.find(filter).sort({ updatedAt: -1, _id: 1 }).toArray(),
    page: (groupId: string, after = '') =>
      records
        .find({ groupId, ...(after ? { _id: { $gt: after } } : {}) })
        .sort({ _id: 1 })
        .limit(500)
        .toArray(),
    byIds: (groupId: string, ids: string[]) =>
      records.find({ groupId, _id: { $in: ids } }).toArray(),
    async *scan(filter: Filter<Operation>) {
      for await (const record of records.find(filter).sort({ _id: 1 }).batchSize(200)) yield record;
    },
    get: (groupId: string, id: string) => records.findOne({ _id: id, groupId }),
    byQr: (groupId: string, qrToken: string) => records.findOne({ groupId, qrToken }),
    group: (id: string) => groups.findOne({ _id: id }),
    groups: () =>
      groups
        .find()
        .project({ _id: 1, name: 1, status: 1, maxRooms: 1, maxUsers: 1, seats: 1 })
        .toArray(),
    people: (groupId: string) =>
      users
        .find({ groupId })
        .project({ _id: 1, name: 1, email: 1, status: 1, role: 1, hotelIds: 1 })
        .toArray(),
    person: (groupId: string, id: string) => users.findOne({ _id: id, groupId, status: 'active' }),
    actor: (id: string) => users.findOne({ _id: id, status: 'active' }),
    async membership(groupId: string, userId: string) {
      const member = await memberships.findOne({ groupId, userId });
      if (!member) return null;
      const roles = await records
        .find({ groupId, kind: 'role', status: 'active', _id: { $in: member.roleIds || [] } })
        .toArray();
      return {
        ...member,
        permissions: [
          ...new Set([
            ...member.permissions,
            ...roles.flatMap((r) => (Array.isArray(r.data.permissions) ? r.data.permissions : [])),
          ]),
        ],
      };
    },
    memberships: (groupId: string) => memberships.find({ groupId }).toArray(),
    saveMembership: (member: Membership) =>
      memberships.replaceOne({ _id: member._id }, member, { upsert: true }),
    history: async (
      groupId: string,
      recordId: string,
      before?: { createdAt: string; id: string },
    ) =>
      (
        await activities
          .find({
            groupId,
            recordId,
            ...(before
              ? {
                  $or: [
                    { createdAt: { $lt: before.createdAt } },
                    { createdAt: before.createdAt, _id: { $lt: before.id } },
                  ],
                }
              : {}),
          })
          .sort({ createdAt: -1, _id: -1 })
          .limit(100)
          .toArray()
      ).reverse(),
    activity: (groupId: string, id: string) => activities.findOne({ groupId, _id: id }),
    async insert(
      record: Operation,
      activity: Activity,
      notices: Notification[] = [],
      related?: { previous: Operation; next: Operation; activity: Activity },
    ) {
      const session = client.startSession();
      try {
        await session.withTransaction(async () => {
          // Reserve room capacity and insert the location in one transaction across all web processes.
          if (record.kind === 'location' && record.data.type === 'room') {
            const group = await groups.findOne({ _id: record.groupId }, { session });
            if (!group) fail('NOT_FOUND', 404);
            const count = await records.countDocuments(
              {
                groupId: record.groupId,
                kind: 'location',
                'data.type': 'room',
                status: { $ne: 'archived' },
              },
              { session },
            );
            if (count >= group.maxRooms) fail('ROOM_LIMIT', 409);
            await groups.updateOne(
              { _id: record.groupId },
              { $inc: { roomRevision: 1 } } as never,
              { session },
            );
          }
          await records.insertOne(record, { session });
          if (related) {
            const changed = await records.replaceOne(
              {
                _id: related.previous._id,
                groupId: related.previous.groupId,
                version: related.previous.version,
              },
              related.next,
              { session },
            );
            if (!changed.modifiedCount) fail('CONFLICT', 409);
            await activities.insertOne(related.activity, { session });
          }
          await activities.insertOne(activity, { session });
          if (notices.length) await notifications.insertMany(notices, { session });
        });
      } finally {
        await session.endSession();
      }
      return record;
    },
    async change(
      previous: Operation,
      next: Operation,
      activity: Activity,
      notices: Notification[] = [],
      related?: { previous: Operation; next: Operation; activity: Activity },
    ) {
      const session = client.startSession();
      try {
        await session.withTransaction(async () => {
          const result = await records.replaceOne(
            { _id: previous._id, groupId: previous.groupId, version: previous.version },
            next,
            { session },
          );
          if (!result.modifiedCount) fail('CONFLICT', 409);
          if (related) {
            const updated = await records.replaceOne(
              {
                _id: related.previous._id,
                groupId: related.previous.groupId,
                version: related.previous.version,
              },
              related.next,
              { session },
            );
            if (!updated.modifiedCount) fail('CONFLICT', 409);
            await activities.insertOne(related.activity, { session });
          }
          await activities.insertOne(activity, { session });
          if (notices.length) await notifications.insertMany(notices, { session });
        });
      } finally {
        await session.endSession();
      }
      return next;
    },
    photo: (groupId: string, id: string) => photos.findOne({ groupId, _id: id }),
    async comment(
      activity: Activity,
      notices: Notification[],
      photo?: { mime: string; base64: string },
    ) {
      const session = client.startSession();
      try {
        await session.withTransaction(async () => {
          await activities.insertOne(activity, { session });
          if (photo)
            await photos.insertOne(
              {
                _id: activity._id,
                groupId: activity.groupId,
                recordId: activity.recordId,
                ...photo,
              },
              { session },
            );
          if (notices.length) await notifications.insertMany(notices, { session });
        });
      } finally {
        await session.endSession();
      }
      return activity;
    },
    notify: (notice: Notification) =>
      notifications.updateOne({ _id: notice._id }, { $setOnInsert: notice }, { upsert: true }),
    notifications: (groupId: string, userId: string) =>
      notifications.find({ groupId, userId }).sort({ createdAt: -1 }).limit(200).toArray(),
    readNotification: (groupId: string, userId: string, id: string) =>
      notifications.updateOne(
        { _id: id, groupId, userId },
        { $set: { readAt: new Date().toISOString() } },
      ),
    preference: (item: Preference) =>
      preferences.replaceOne({ _id: item._id }, item, { upsert: true }),
    preferences: (groupId: string, userId: string) =>
      preferences.find({ groupId, userId }).toArray(),
    duePreferences: () =>
      preferences
        .find({ remindAt: { $lte: new Date() }, notifiedAt: null })
        .limit(100)
        .toArray(),
    finishReminder: (id: string, remindAt: Date | null) =>
      preferences.updateOne(
        { _id: id, remindAt, notifiedAt: null },
        { $set: { notifiedAt: new Date() } },
      ),
    translation: (id: string) => translations.findOne({ _id: id }),
    cacheTranslation: (id: string, text: string) =>
      translations.updateOne({ _id: id }, { $set: { text } }, { upsert: true }),
    claimSchedule: (owner: string) =>
      records.findOneAndUpdate(
        {
          kind: 'template',
          status: 'active',
          nextRunAt: { $lte: new Date() },
          leaseUntil: { $lte: new Date() },
        },
        { $set: { leaseOwner: owner, leaseUntil: new Date(Date.now() + 60000) } },
        { returnDocument: 'after' },
      ),
    async finishSchedule(template: Operation, owner: string, instance: Operation, nextRunAt: Date) {
      const session = client.startSession();
      try {
        await session.withTransaction(async () => {
          const updated = await records.updateOne(
            { _id: template._id, leaseOwner: owner, leaseUntil: { $gt: new Date() } },
            { $set: { nextRunAt, leaseUntil: new Date(0), leaseOwner: '' } },
            { session },
          );
          if (!updated.modifiedCount) fail('CONFLICT', 409);
          await records.updateOne(
            { recurrenceKey: instance.recurrenceKey },
            { $setOnInsert: instance },
            { upsert: true, session },
          );
          await activities.updateOne(
            { _id: instance._id },
            {
              $setOnInsert: {
                _id: instance._id,
                groupId: instance.groupId,
                recordId: instance._id,
                actorId: 'worker',
                actorName: 'Hoteliva',
                type: 'scheduled',
                text: '',
                createdAt: instance.createdAt,
                version: 1,
              },
            },
            { upsert: true, session },
          );
        });
      } finally {
        await session.endSession();
      }
    },
    async disable(
      groupId: string,
      userId: string,
      reassigned: { previous: Operation; next: Operation; activity: Activity }[],
    ) {
      const session = client.startSession();
      try {
        await session.withTransaction(async () => {
          for (const entry of reassigned) {
            const updated = await records.replaceOne(
              { _id: entry.previous._id, groupId, version: entry.previous.version },
              entry.next,
              { session },
            );
            if (!updated.modifiedCount) fail('CONFLICT', 409);
            await activities.insertOne(entry.activity, { session });
          }
          const user = await users.findOneAndUpdate(
            { _id: userId, groupId, status: { $ne: 'disabled' } },
            { $set: { status: 'disabled' } },
            { session },
          );
          if (user) await groups.updateOne({ _id: groupId }, { $inc: { seats: -1 } }, { session });
          await database.sessions.deleteMany({ userId }, { session });
        });
      } finally {
        await session.endSession();
      }
    },
    id: randomUUID,
  };
}
export type OperationsDal = ReturnType<typeof createOperationsDal>;

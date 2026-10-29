import type { Database } from './database.js';

export function createJobsDal({ jobs, sessions }: Database) {
  return {
    ensure: () =>
      jobs.updateOne(
        { _id: 'expired-sessions' },
        {
          $setOnInsert: {
            type: 'maintenance',
            nextRunAt: new Date(),
            leaseUntil: new Date(0),
            owner: null,
          },
        },
        { upsert: true },
      ),
    claim: (owner: string, now = new Date()) =>
      jobs.findOneAndUpdate(
        { nextRunAt: { $lte: now }, leaseUntil: { $lte: now } },
        { $set: { owner, leaseUntil: new Date(now.getTime() + 60000) } },
        { returnDocument: 'after', sort: { nextRunAt: 1 } },
      ),
    complete: (id: string, owner: string) =>
      jobs.updateOne(
        { _id: id, owner, leaseUntil: { $gt: new Date() } },
        {
          $set: { owner: null, leaseUntil: new Date(0), nextRunAt: new Date(Date.now() + 3600000) },
        },
      ),
    cleanup: () => sessions.deleteMany({ expiresAt: { $lte: new Date() } }, { maxTimeMS: 10000 }),
  };
}

import type { Database } from './database.js';
import type { Session, User } from '../domain.js';

export function createAuthDal(database: Database) {
  const { users, groups, sessions, attempts, client } = database;
  return {
    userByEmail: (email: string) => users.findOne({ email }),
    userById: (id: string) => users.findOne({ _id: id }),
    groupById: (id: string) => groups.findOne({ _id: id }),
    insertSession: (session: Session) => sessions.insertOne(session),
    findSession: (hash: string) => sessions.findOne({ _id: hash, expiresAt: { $gt: new Date() } }),
    deleteSession: (hash: string) => sessions.deleteOne({ _id: hash }),
    async attempt(key: string) {
      const now = Date.now();
      const bucket = Math.floor(now / 900000);
      const record = await attempts.findOneAndUpdate(
        { _id: `${key}:${bucket}` },
        {
          $inc: { count: 1 },
          $setOnInsert: { expiresAt: new Date((bucket + 1) * 900000) },
        },
        { upsert: true, returnDocument: 'after' },
      );
      return record!.count;
    },
    async activate(hash: string, passwordHash: string) {
      return client.withSession((session) =>
        session.withTransaction(async () => {
          const user = await users.findOneAndUpdate(
            { activationHash: hash, activationExpires: { $gt: new Date() }, status: 'pending' },
            {
              $set: { passwordHash, status: 'active' },
              $unset: { activationHash: '', activationExpires: '' },
            },
            { session, returnDocument: 'after' },
          );
          return user;
        }),
      );
    },
    setLocale: (id: string, locale: User['locale']) =>
      users.updateOne({ _id: id }, { $set: { locale } }),
    ping: () => database.db.command({ ping: 1 }),
  };
}
export type AuthDal = ReturnType<typeof createAuthDal>;

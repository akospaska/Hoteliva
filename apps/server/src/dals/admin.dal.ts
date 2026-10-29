import type { Database } from './database.js';
import type { Group, User } from '../domain.js';

export function createAdminDal({ users, groups, client }: Database) {
  return {
    insertGroup: (group: Group) => groups.insertOne(group),
    updateGroup: (id: string, input: Pick<Group, 'name' | 'maxUsers' | 'maxRooms' | 'status'>) =>
      groups.findOneAndUpdate({ _id: id }, { $set: input }, { returnDocument: 'after' }),
    async insertMember(user: User) {
      return client.withSession((session) =>
        session.withTransaction(async () => {
          // Seat reservation and account creation commit together even across multiple web processes.
          const group = await groups.findOneAndUpdate(
            { _id: user.groupId!, status: 'active', $expr: { $lt: ['$seats', '$maxUsers'] } },
            { $inc: { seats: 1 } },
            { session, returnDocument: 'after' },
          );
          if (!group) return false;
          await users.insertOne(user, { session });
          return true;
        }),
      );
    },
    setActivation: (id: string, hash: string, expires: Date) =>
      users.updateOne(
        { _id: id, status: 'pending' },
        { $set: { activationHash: hash, activationExpires: expires } },
      ),
    bootstrap: (user: User) => users.insertOne(user),
  };
}

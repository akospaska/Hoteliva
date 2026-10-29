import { MongoClient } from 'mongodb';
import type { Group, Job, Session, User } from '../domain.js';

export async function openDatabase(uri: string) {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  await client.connect();
  const db = client.db();
  const users = db.collection<User>('users');
  const groups = db.collection<Group>('groups');
  const sessions = db.collection<Session>('sessions');
  const jobs = db.collection<Job>('jobs');
  const attempts = db.collection<{ _id: string; count: number; expiresAt: Date }>('attempts');
  await Promise.all([
    users.createIndex({ email: 1 }, { unique: true }),
    users.createIndex({ activationHash: 1 }, { unique: true, sparse: true }),
    users.createIndex({ groupId: 1 }),
    sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    sessions.createIndex({ userId: 1 }),
    jobs.createIndex({ nextRunAt: 1, leaseUntil: 1 }),
    attempts.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ]);
  return { client, db, users, groups, sessions, jobs, attempts };
}
export type Database = Awaited<ReturnType<typeof openDatabase>>;

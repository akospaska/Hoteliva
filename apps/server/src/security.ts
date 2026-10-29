import { randomBytes, scrypt as derive, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt = promisify(derive);
export const newToken = () => randomBytes(32).toString('base64url');
export const digest = (value: string) => createHash('sha256').update(value).digest('hex');
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const key = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${key.toString('hex')}`;
}
export async function verifyPassword(password: string, stored?: string) {
  const [salt, expected] = (stored ?? '').split(':');
  const key = (await scrypt(password, salt || 'missing-user-timing-salt', 64)) as Buffer;
  const compare = Buffer.from(expected || '00'.repeat(64), 'hex');
  return Boolean(stored) && compare.length === key.length && timingSafeEqual(key, compare);
}

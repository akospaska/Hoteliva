import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { fail, type Locale, type Role } from '../domain.js';
import { digest, hashPassword, newToken } from '../security.js';
import type { createAdminDal } from '../dals/admin.dal.js';
import type { AuthDal } from '../dals/auth.dal.js';
import type { AuthFacade } from './auth.facade.js';

type InviteInput = {
  email: string;
  name: string;
  locale: Locale;
  groupId: string;
  role: Exclude<Role, 'platform_admin'>;
  hotelIds: string[];
};
type Mailer = (email: string, token: string, locale: Locale) => Promise<void>;

/**
 * Builds platform administration workflows using authentication, persistence and email
 * adapters.
 */
export function createAdminFacade(
  dal: ReturnType<typeof createAdminDal>,
  authDal: AuthDal,
  auth: AuthFacade,
  sendEmail: Mailer,
) {
  /**
   * Authenticates the caller and rejects customer roles before any platform administration
   * action.
   */
  async function requirePlatform(token?: string) {
    const actor = await auth.authenticate(token);
    if (actor.role !== 'platform_admin') fail('FORBIDDEN', 403);
    return actor;
  }
  /**
   * Replaces the activation token for a pending account and sends a new invitation. Email
   * failure leaves the account pending and the new token stored.
   */
  async function deliver(id: string) {
    const user = await authDal.userById(id);
    if (!user || user.status !== 'pending') fail('INVALID_INVITATION');
    const token = newToken();
    await dal.setActivation(id, digest(token), new Date(Date.now() + 86400000));
    await sendEmail(user.email, token, user.locale);
  }
  return {
    /**
     * Lets a platform admin change group limits and suspension status without revoking
     * existing seats when limits decrease.
     */
    async updateGroup(
      token: string | undefined,
      id: string,
      input: { name: string; maxUsers: number; maxRooms: number; status: 'active' | 'suspended' },
    ) {
      await requirePlatform(token);
      const group = await dal.updateGroup(id, input);
      if (!group) fail('NOT_FOUND', 404);
      return group;
    },
    /**
     * Creates an active hotel group with contract limits and no occupied seats; requires a
     * platform admin.
     */
    async createGroup(
      token: string | undefined,
      input: { name: string; maxUsers: number; maxRooms: number },
    ) {
      await requirePlatform(token);
      const group = { ...input, _id: randomUUID(), status: 'active' as const, seats: 0 };
      await dal.insertGroup(group);
      return group;
    },
    /**
     * Creates a pending customer account and reserves a seat atomically. Only platform admins
     * may invite; failed email delivery preserves the account for retry.
     */
    async invite(token: string | undefined, input: InviteInput) {
      await requirePlatform(token);
      if (input.role === 'hotel_admin' && input.hotelIds.length === 0) fail('HOTEL_REQUIRED');
      const user = { ...input, _id: randomUUID(), status: 'pending' as const };
      // Pending invitations reserve seats; the atomic DAL operation prevents exceeding capacity.
      if (!(await dal.insertMember(user))) fail('GROUP_UNAVAILABLE_OR_FULL', 409);
      // Email failure preserves the pending account for resending without creating a duplicate.
      try {
        await deliver(user._id);
      } catch {
        return { id: user._id, emailSent: false };
      }
      return { id: user._id, emailSent: true };
    },
    /**
     * Requires a platform admin and replaces a pending account’s invitation token before
     * sending another email.
     */
    async resend(token: string | undefined, id: string) {
      await requirePlatform(token);
      await deliver(id);
    },
    /**
     * Creates the initial platform administrator from the local admin command. Existing
     * accounts are neither overwritten nor promoted.
     */
    async bootstrap(email: string, password: string) {
      const input = z
        .object({
          email: z.email().transform((v) => v.toLowerCase()),
          password: z.string().min(12).max(128),
        })
        .parse({ email, password });
      // Local admin command only: never promote or overwrite an existing account.
      await dal.bootstrap({
        _id: randomUUID(),
        email: input.email,
        name: 'Platform admin',
        role: 'platform_admin',
        groupId: null,
        hotelIds: [],
        locale: 'hu',
        status: 'active',
        passwordHash: await hashPassword(input.password),
      });
    },
  };
}
export type AdminFacade = ReturnType<typeof createAdminFacade>;

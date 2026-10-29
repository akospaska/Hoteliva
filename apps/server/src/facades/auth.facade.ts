import { digest, newToken, verifyPassword, hashPassword } from '../security.js';
import { fail, publicUser, type User } from '../domain.js';
import type { AuthDal } from '../dals/auth.dal.js';
import type { Config } from '../config.js';

/**
 * Builds authentication workflows with persistent sessions and current account and group
 * access checks.
 */
export function createAuthFacade(dal: AuthDal, config: Config) {
  /**
   * Rejects inactive accounts and suspended customer groups, returning only the public
   * profile for an allowed user.
   */
  async function checkAccess(user: User | null) {
    if (!user || user.status !== 'active') fail('UNAUTHORIZED', 401);
    if (user.role === 'platform_admin') return publicUser(user, null);
    if (!user.groupId) fail('UNAUTHORIZED', 401);
    const group = await dal.groupById(user.groupId);
    if (!group) fail('UNAUTHORIZED', 401);
    if (group.status === 'suspended') fail('SUSPENDED', 403);
    return publicUser(user, group);
  }
  /**
   * Resolves a stored session token and rechecks current account and group access on every
   * request.
   */
  async function authenticate(token?: string) {
    if (!token) fail('UNAUTHORIZED', 401);
    const session = await dal.findSession(digest(token));
    if (!session) fail('UNAUTHORIZED', 401);
    // Recheck current access on every request; long sessions must not bypass suspension.
    return checkAccess(await dal.userById(session.userId));
  }
  return {
    authenticate,
    /**
     * Applies shared email/IP attempt limits, verifies credentials and access, then stores a
     * new expiring session and returns its token.
     */
    async login(email: string, password: string, address: string) {
      const counts = await Promise.all([
        dal.attempt(`email:${digest(email)}`),
        dal.attempt(`ip:${digest(address)}`),
      ]);
      if (counts[0]! > 20 || counts[1]! > 100) fail('RATE_LIMITED', 429);
      const user = await dal.userByEmail(email);
      if (!(await verifyPassword(password, user?.passwordHash))) fail('INVALID_CREDENTIALS', 401);
      const profile = await checkAccess(user);
      const token = newToken();
      const expiresAt = new Date(Date.now() + config.SESSION_DAYS * 86400000);
      await dal.insertSession({ _id: digest(token), userId: profile.id, expiresAt });
      return { user: profile, token, expiresAt };
    },
    /**
     * Activates only a pending account with an unused, unexpired invitation and stores the
     * hashed password.
     */
    async activate(token: string, password: string) {
      // Only invited accounts can activate; invitation links expire and are single-use.
      const user = await dal.activate(digest(token), await hashPassword(password));
      if (!user) fail('INVALID_INVITATION');
    },
    /**
     * Revokes the supplied session in persistent storage; a missing token is a harmless
     * no-op.
     */
    async logout(token?: string) {
      if (token) await dal.deleteSession(digest(token));
    },
    /**
     * Changes the preferred UI language of the authenticated user after checking current
     * access.
     */
    async locale(token: string | undefined, locale: User['locale']) {
      const user = await authenticate(token);
      await dal.setLocale(user.id, locale);
    },
    /**
     * Checks database connectivity for readiness without creating or changing a session.
     */
    ready: () => dal.ping(),
  };
}
export type AuthFacade = ReturnType<typeof createAuthFacade>;

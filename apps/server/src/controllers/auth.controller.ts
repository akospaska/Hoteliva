import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import type { AuthFacade } from '../facades/auth.facade.js';
import type { Config } from '../config.js';

export function tokenFrom(req: Request): string | undefined {
  const bearer = req.headers.authorization;
  return bearer?.startsWith('Bearer ') ? bearer.slice(7) : req.cookies?.hoteliva_session;
}
export function createAuthController(facade: AuthFacade, config: Config) {
  const router = Router();
  const cookieOptions = {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  };
  const email = z
    .email()
    .max(254)
    .transform((value) => value.trim().toLowerCase());
  const password = z.string().min(12).max(128);
  router.post('/login', async (req, res) => {
    const input = z.object({ email, password: z.string().min(1).max(128) }).parse(req.body);
    const result = await facade.login(input.email, input.password, req.ip ?? 'unknown');
    if (req.headers['x-hoteliva-client'] === 'native')
      res.json({ user: result.user, token: result.token });
    else
      res
        .cookie('hoteliva_session', result.token, { ...cookieOptions, expires: result.expiresAt })
        .json({ user: result.user });
  });
  router.get('/me', async (req, res) =>
    res.json({ user: await facade.authenticate(tokenFrom(req)) }),
  );
  router.post('/logout', async (req, res) => {
    await facade.logout(tokenFrom(req));
    res.clearCookie('hoteliva_session', cookieOptions).status(204).end();
  });
  router.post('/activate', async (req, res) => {
    const input = z.object({ token: z.string().min(32).max(128), password }).parse(req.body);
    await facade.activate(input.token, input.password);
    res.status(204).end();
  });
  router.patch('/locale', async (req, res) => {
    const { locale } = z.object({ locale: z.enum(['hu', 'en']) }).parse(req.body);
    await facade.locale(tokenFrom(req), locale);
    res.status(204).end();
  });
  return router;
}

import express, { type ErrorRequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { ZodError } from 'zod';
import { randomUUID } from 'node:crypto';
import type { Config } from './config.js';
import type { AuthFacade } from './facades/auth.facade.js';
import type { AdminFacade } from './facades/admin.facade.js';
import { createAuthController } from './controllers/auth.controller.js';
import { createAdminController } from './controllers/admin.controller.js';
import { createOperationsController } from './controllers/operations.controller.js';
import type { OperationsFacade } from './facades/operations.facade.js';

export function createApp(
  config: Config,
  auth: AuthFacade,
  admin: AdminFacade,
  operations?: OperationsFacade,
) {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: config.WEB_ORIGIN, credentials: true }));
  app.use(cookieParser());
  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    res.set('X-Request-ID', randomUUID());
    // Cookie-authenticated writes must originate from the configured web client origin.
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      if (req.headers.origin && req.headers.origin !== config.WEB_ORIGIN) {
        res.status(403).json({ code: 'FORBIDDEN' });
        return;
      }
      if (req.cookies?.hoteliva_session && req.headers.origin !== config.WEB_ORIGIN) {
        res.status(403).json({ code: 'FORBIDDEN' });
        return;
      }
    }
    next();
  });
  app.get('/health/live', (_req, res) => res.json({ status: 'ok' }));
  app.get('/health/ready', async (_req, res) => {
    await auth.ready();
    res.json({ status: 'ok' });
  });
  if (operations) app.use('/ops', createOperationsController(operations));
  app.use(express.json({ limit: '16kb' }));
  app.use('/auth', createAuthController(auth, config));
  app.use('/platform', createAdminController(admin));
  app.use((_req, res) => res.status(404).json({ code: 'NOT_FOUND' }));
  const errors: ErrorRequestHandler = (error, _req, res, _next) => {
    const status =
      error instanceof ZodError ? 400 : error.code === 11000 ? 409 : (error.status ?? 500);
    const code =
      error instanceof ZodError
        ? 'INVALID_INPUT'
        : error.code === 11000
          ? 'ALREADY_EXISTS'
          : status >= 500 && !['AI_NOT_CONFIGURED', 'AI_UNAVAILABLE'].includes(error.code)
            ? 'SERVER_ERROR'
            : (error.code ?? 'INVALID_INPUT');
    if (status >= 500)
      console.error(
        JSON.stringify({ event: 'request_failed', requestId: res.get('X-Request-ID') }),
      );
    res.status(status).json({ code });
  };
  app.use(errors);
  return app;
}

import { Router } from 'express';
import { z } from 'zod';
import type { AdminFacade } from '../facades/admin.facade.js';
import { tokenFrom } from './auth.controller.js';

export function createAdminController(facade: AdminFacade) {
  const router = Router();
  router.put('/groups/:id', async (req, res) => {
    const input = z
      .object({
        name: z.string().trim().min(1).max(120),
        maxUsers: z.number().int().min(1),
        maxRooms: z.number().int().min(0),
        status: z.enum(['active', 'suspended']),
      })
      .strict()
      .parse(req.body);
    res.json(await facade.updateGroup(tokenFrom(req), z.uuid().parse(req.params.id), input));
  });
  router.post('/groups', async (req, res) => {
    const input = z
      .object({
        name: z.string().trim().min(1).max(120),
        maxUsers: z.number().int().min(1),
        maxRooms: z.number().int().min(0),
      })
      .parse(req.body);
    res.status(201).json(await facade.createGroup(tokenFrom(req), input));
  });
  router.post('/users', async (req, res) => {
    const input = z
      .object({
        email: z
          .email()
          .max(254)
          .transform((v) => v.toLowerCase()),
        name: z.string().trim().min(1).max(120),
        locale: z.enum(['hu', 'en']).default('hu'),
        groupId: z.uuid(),
        hotelIds: z.array(z.uuid()).default([]),
        role: z.enum(['group_admin', 'hotel_admin', 'member']),
      })
      .parse(req.body);
    res.status(201).json(await facade.invite(tokenFrom(req), input));
  });
  router.post('/users/:id/resend', async (req, res) => {
    await facade.resend(tokenFrom(req), z.uuid().parse(req.params.id));
    res.status(204).end();
  });
  return router;
}

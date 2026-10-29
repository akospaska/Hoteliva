import { Router, json } from 'express';
import { z } from 'zod';
import type { OperationsFacade } from '../facades/operations.facade.js';
import { tokenFrom } from './auth.controller.js';
import {
  actionSchema,
  commentSchema,
  inputSchema,
  membershipSchema,
} from './operations.schemas.js';

export function createOperationsController(facade: OperationsFacade) {
  const router = Router();
  const id = z.string().min(1).max(200);
  const group = z.string().max(128).optional();
  router.use(json({ limit: '6mb' }));
  router.get('/bootstrap', async (req, res) =>
    res.json(await facade.bootstrap(tokenFrom(req), group.parse(req.query.groupId))),
  );
  router.use(async (req, res, next) => {
    res.locals.ctx = await facade.context(tokenFrom(req), group.parse(req.query.groupId));
    next();
  });
  router.post('/records', async (req, res) =>
    res.status(201).json(await facade.create(res.locals.ctx, inputSchema.parse(req.body))),
  );
  router.put('/report-filter', async (req, res) => {
    const input = z
      .object({
        department: z.string().max(100),
        assignee: z.string().max(128),
        from: z.union([z.iso.date(), z.literal('')]),
        to: z.union([z.iso.date(), z.literal('')]),
      })
      .strict()
      .parse(req.body);
    await facade.saveFilter(res.locals.ctx, input);
    res.status(204).end();
  });
  router.post('/page', async (req, res) =>
    res.json(await facade.page(res.locals.ctx, z.string().max(128).parse(req.body.cursor))),
  );
  router.post('/minibar', async (req, res) => {
    const input = z
      .object({
        locationId: id,
        requestId: z.string().min(8).max(128),
        stayReference: z.string().max(200).default(''),
        lines: z
          .array(z.object({ productId: id, quantity: z.number().int().min(1).max(100) }))
          .min(1)
          .max(100),
      })
      .parse(req.body);
    res
      .status(201)
      .json(
        await facade.minibar(
          res.locals.ctx,
          input.locationId,
          input.lines,
          input.requestId,
          input.stayReference,
        ),
      );
  });
  router.post('/cleaning-plan', async (req, res) => {
    const input = z.object({ hotelId: id, date: z.iso.date() }).parse(req.body);
    res.status(201).json(await facade.cleaningPlan(res.locals.ctx, input.hotelId, input.date));
  });
  router.get('/records/:id', async (req, res) =>
    res.json(await facade.details(res.locals.ctx, id.parse(req.params.id))),
  );
  router.post('/records/:id/history', async (req, res) => {
    const input = z
      .object({ before: z.object({ createdAt: z.iso.datetime(), id }).optional() })
      .parse(req.body);
    res.json(await facade.history(res.locals.ctx, id.parse(req.params.id), input.before));
  });
  router.get('/photos/:id', async (req, res) =>
    res.json(await facade.photo(res.locals.ctx, id.parse(req.params.id))),
  );
  router.put('/records/:id', async (req, res) => {
    const version = z.number().int().min(1).parse(req.body.version);
    const { version: _version, ...input } = req.body;
    res.json(
      await facade.edit(res.locals.ctx, id.parse(req.params.id), version, inputSchema.parse(input)),
    );
  });
  router.post('/records/:id/actions', async (req, res) =>
    res.json(
      await facade.act(res.locals.ctx, id.parse(req.params.id), actionSchema.parse(req.body)),
    ),
  );
  router.post('/records/:id/comments', async (req, res) => {
    const input = commentSchema.parse(req.body);
    res
      .status(201)
      .json(
        await facade.comment(
          res.locals.ctx,
          id.parse(req.params.id),
          input.text,
          input.mentions,
          input.attachment,
        ),
      );
  });
  router.post('/records/:id/instantiate', async (req, res) => {
    const input = z.object({ dueAt: z.union([z.iso.datetime(), z.literal('')]) }).parse(req.body);
    res
      .status(201)
      .json(await facade.instantiate(res.locals.ctx, id.parse(req.params.id), input.dueAt));
  });
  router.post('/records/:id/copy-package', async (req, res) => {
    const input = z
      .object({
        title: z.string().trim().min(1).max(160),
        startsAt: z.iso.datetime(),
        requestId: z.string().min(8).max(128),
      })
      .parse(req.body);
    res
      .status(201)
      .json(
        await facade.copyPackage(
          res.locals.ctx,
          id.parse(req.params.id),
          input.title,
          input.startsAt,
          input.requestId,
        ),
      );
  });
  router.post('/records/:id/distribute', async (req, res) => {
    const input = z
      .object({
        locationIds: z.array(id).min(1).max(200),
        dueAt: z.union([z.iso.datetime(), z.literal('')]),
        requestId: z.string().min(8).max(128),
      })
      .parse(req.body);
    res
      .status(201)
      .json(
        await facade.distribute(
          res.locals.ctx,
          id.parse(req.params.id),
          input.locationIds,
          input.dueAt,
          input.requestId,
        ),
      );
  });
  router.post('/records/:id/translate', async (req, res) => {
    const { target, activityId } = z
      .object({
        target: z.enum(['hu', 'en', 'de', 'ro', 'uk', 'pl', 'es', 'fr']),
        activityId: id.optional(),
      })
      .parse(req.body);
    res.json(await facade.translate(res.locals.ctx, id.parse(req.params.id), target, activityId));
  });
  router.post('/records/:id/preference', async (req, res) => {
    const input = z
      .object({ bookmarked: z.boolean(), remindAt: z.iso.datetime().nullable() })
      .parse(req.body);
    await facade.preference(
      res.locals.ctx,
      id.parse(req.params.id),
      input.bookmarked,
      input.remindAt,
    );
    res.status(204).end();
  });
  router.post('/memberships', async (req, res) =>
    res.json(await facade.saveMembership(res.locals.ctx, membershipSchema.parse(req.body))),
  );
  router.post('/people/:id/disable', async (req, res) => {
    const { replacementId } = z
      .object({ replacementId: z.string().max(128).default('') })
      .parse(req.body || {});
    await facade.disable(res.locals.ctx, id.parse(req.params.id), replacementId);
    res.status(204).end();
  });
  router.post('/import-locations', async (req, res) => {
    const input = z
      .object({
        hotelId: id,
        rows: z
          .array(
            z.object({
              title: z.string().trim().min(1).max(160),
              floor: z.string().max(100),
              category: z.string().max(100),
            }),
          )
          .min(1)
          .max(100),
      })
      .parse(req.body);
    res.json(await facade.importLocations(res.locals.ctx, input.hotelId, input.rows));
  });
  router.post('/qr', async (req, res) =>
    res.json(await facade.qr(res.locals.ctx, z.array(id).min(1).max(100).parse(req.body.ids))),
  );
  router.get('/qr/:token', async (req, res) =>
    res.json(await facade.resolveQr(res.locals.ctx, id.parse(req.params.token))),
  );
  router.post('/ask', async (req, res) =>
    res.json(
      await facade.ask(res.locals.ctx, z.string().trim().min(3).max(2000).parse(req.body.question)),
    ),
  );
  router.post('/notifications/:id/read', async (req, res) => {
    await facade.readNotification(res.locals.ctx, id.parse(req.params.id));
    res.status(204).end();
  });
  return router;
}

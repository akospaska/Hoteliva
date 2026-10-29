import { z } from 'zod';
import { kinds } from '../operations.js';

const text = z.string().trim().max(10000);
const id = z.string().max(128);
const date = z.union([z.iso.datetime(), z.literal('')]);
const check = z.object({
  id: z.string().min(1).max(128),
  label: z.string().trim().min(1).max(300),
  type: z.enum(['check', 'number', 'text', 'photo']),
  required: z.boolean(),
  locationId: id.optional(),
  guideId: id.optional(),
});
export const inputSchema = z
  .object({
    kind: z.enum(kinds),
    title: z.string().trim().min(1).max(160),
    description: text.default(''),
    hotelId: id.default(''),
    locationId: id.default(''),
    department: z.string().max(100).default(''),
    assigneeId: id.default(''),
    dueAt: date.default(''),
    parentId: id.default(''),
    priority: z.enum(['normal', 'high', 'urgent']).default('normal'),
    data: z
      .record(
        z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]{0,40}$/),
        z.union([text, z.number().finite(), z.boolean(), z.array(z.string().max(128)).max(100)]),
      )
      .default({}),
    checks: z.array(check).max(100).default([]),
  })
  .strict();
export const actionSchema = z
  .object({
    version: z.number().int().min(1),
    action: z.enum([
      'claim',
      'start',
      'block',
      'complete',
      'approve',
      'reject',
      'reopen',
      'cancel',
      'acknowledge',
      'publish',
      'check',
      'scan',
      'rotate-qr',
      'room-state',
      'stock',
      'checkout',
      'return',
      'vote',
      'compensate',
      'process',
      'receive',
      'reading',
      'react',
    ]),
    text: text.default(''),
    checkId: id.default(''),
    qrToken: id.default(''),
    value: z.union([z.string().max(10000), z.number().finite(), z.boolean()]).optional(),
    data: z
      .record(
        z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]{0,40}$/),
        z.union([text, z.number().finite(), z.boolean(), z.array(id)]),
      )
      .default({}),
  })
  .strict();
export const commentSchema = z
  .object({
    text: z.string().trim().max(10000),
    mentions: z.array(id).max(30).default([]),
    attachment: z
      .object({
        name: z.string().max(200),
        mime: z.enum(['image/jpeg', 'image/png', 'image/webp']),
        base64: z.string().max(5500000),
      })
      .optional(),
  })
  .refine((v) => v.text.length > 0 || !!v.attachment);
export const membershipSchema = z
  .object({
    userId: id,
    hotelIds: z.array(id).max(100),
    locationIds: z.array(id).max(500),
    departments: z.array(z.string().max(100)).max(50),
    permissions: z.array(z.string().regex(/^[a-z]+:(read|create|manage|approve)$/)).max(120),
    vendorId: id.default(''),
    roleIds: z.array(id).max(30).default([]),
  })
  .strict();
export type ActionInput = z.infer<typeof actionSchema>;

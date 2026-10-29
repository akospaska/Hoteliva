import { fail } from '../domain.js';
import type { AuthFacade } from './auth.facade.js';
import type { OperationsDal } from '../dals/operations.dal.js';
import { validateData } from './operations-validation.js';
import {
  allowedHotel,
  canRead,
  type Context,
  type Operation,
  type RecordInput,
  kinds,
} from '../operations.js';

/**
 * Builds shared tenant authorization, record validation and audit/notification payload
 * helpers for operation workflows.
 */
export function createOperationsContext(dal: OperationsDal, auth: AuthFacade) {
  /**
   * Authenticates a session and resolves current group, hotel and membership permissions.
   * Only platform admins may select another group; suspended customer groups are rejected.
   */
  async function context(token?: string, requestedGroup?: string): Promise<Context> {
    const user = await auth.authenticate(token);
    const groupId = user.role === 'platform_admin' ? requestedGroup : user.groupId;
    if (requestedGroup && user.role !== 'platform_admin' && requestedGroup !== user.groupId)
      fail('FORBIDDEN', 403);
    if (!groupId) fail('GROUP_REQUIRED');
    const group = await dal.group(groupId);
    if (!group) fail('NOT_FOUND', 404);
    if (group.status !== 'active' && user.role !== 'platform_admin') fail('SUSPENDED', 403);
    const membership = await dal.membership(groupId, user.id);
    return {
      userId: user.id,
      name: user.name,
      groupId,
      role: user.role,
      manager: user.role !== 'member',
      hotelIds: user.role === 'hotel_admin' ? user.hotelIds : membership?.hotelIds || user.hotelIds,
      locationIds: membership?.locationIds || [],
      departments: membership?.departments || [],
      permissions: membership?.permissions || [],
      vendorId: membership?.vendorId || '',
    };
  }
  /**
   * Returns a record only within the caller’s readable scope; missing and inaccessible
   * records both produce NOT_FOUND.
   */
  async function get(ctx: Context, id: string) {
    const record = await dal.get(ctx.groupId, id);
    if (!record || !canRead(ctx, record)) fail('NOT_FOUND', 404);
    return record;
  }
  /**
   * Checks business fields, relationships, assignees and scopes before a write. Rejects
   * client attempts to set server-managed workflow data; does not persist changes.
   */
  async function validate(ctx: Context, input: RecordInput) {
    validateData(input);
    if (input.data.relatedIds !== undefined) {
      if (!Array.isArray(input.data.relatedIds)) fail('INVALID_INPUT');
      for (const id of input.data.relatedIds) await get(ctx, id);
    }
    if (input.kind === 'role') {
      if (
        !['platform_admin', 'group_admin'].includes(ctx.role) ||
        input.hotelId ||
        input.locationId
      )
        fail('FORBIDDEN', 403);
      if (
        !Array.isArray(input.data.permissions) ||
        input.data.permissions.some((p) => {
          const [kind, action] = p.split(':');
          return (
            !kinds.includes(kind as RecordInput['kind']) ||
            !['read', 'create', 'manage', 'approve'].includes(action || '')
          );
        })
      )
        fail('INVALID_INPUT');
    }
    if (input.kind === 'consumption') {
      const product = await get(ctx, String(input.data.productId));
      if (
        product.kind !== 'product' ||
        product.hotelId !== input.hotelId ||
        product.status !== 'active'
      )
        fail('INVALID_INPUT');
    }
    if (!['hotel', 'role'].includes(input.kind)) {
      const hotel = await dal.get(ctx.groupId, input.hotelId);
      if (
        !hotel ||
        hotel.kind !== 'hotel' ||
        hotel.status !== 'active' ||
        !allowedHotel(ctx, hotel._id)
      )
        fail('HOTEL_UNAVAILABLE', 403);
    }
    for (const id of [
      input.locationId,
      input.parentId,
      ...input.checks.map((c) => c.locationId || ''),
    ].filter(Boolean)) {
      const related = await get(ctx, id);
      if (related.hotelId !== input.hotelId) fail('FORBIDDEN', 403);
      if (
        (id === input.locationId || input.checks.some((c) => c.locationId === id)) &&
        related.kind !== 'location'
      )
        fail('INVALID_INPUT');
    }
    if (new Set(input.checks.map((c) => c.id)).size !== input.checks.length) fail('INVALID_INPUT');
    for (const check of input.checks)
      if (check.guideId) {
        const guide = await get(ctx, check.guideId);
        if (guide.kind !== 'article' || guide.status !== 'published') fail('INVALID_INPUT');
      }
    if (Object.keys(input.data).length > 40) fail('INVALID_INPUT');
    const forbidden = [
      'receipts',
      'votes',
      'holderId',
      'approvedBy',
      'approvedAt',
      'publishedVersion',
      'completedAt',
      'startedAt',
      'compensationBy',
      'compensation',
      'compensationType',
      'checkedOutAt',
      'returnedAt',
      'blockReason',
      'receivedBy',
      'currentCleaningId',
      'reactions',
      'meterValue',
      'meterReadAt',
      'processedAt',
      'processedBy',
      'receivedAt',
      'activeSince',
      'waitingSince',
      'activeMilliseconds',
      'waitingMilliseconds',
      'linenChangedAt',
      'checkoutConfirmedAt',
      'checkoutConfirmedBy',
      'lastReads',
    ];
    if (forbidden.some((key) => key in input.data)) fail('INVALID_INPUT');
    for (const key of [
      'quantity',
      'price',
      'estimatedMinutes',
      'estimatedCost',
      'minimum',
      'linenEveryDays',
      'attendees',
    ]) {
      if (
        key in input.data &&
        (typeof input.data[key] !== 'number' ||
          Number(input.data[key]) < 0 ||
          Number(input.data[key]) > 100000000)
      )
        fail('INVALID_INPUT');
    }
    if (
      input.data.videoUrl &&
      (typeof input.data.videoUrl !== 'string' || !input.data.videoUrl.startsWith('https://'))
    )
      fail('INVALID_INPUT');
    if (input.kind === 'template') {
      try {
        new Intl.DateTimeFormat('en', {
          timeZone: String(input.data.timezone || 'Europe/Budapest'),
        }).format();
      } catch {
        fail('INVALID_INPUT');
      }
      if (
        !['task', 'cleaning', 'round', 'onboarding', 'audit', 'event', 'request'].includes(
          String(input.data.targetKind || 'task'),
        )
      )
        fail('INVALID_INPUT');
      if (
        input.data.repeat &&
        !['none', 'daily', 'weekly', 'monthly'].includes(String(input.data.repeat))
      )
        fail('INVALID_INPUT');
      if (input.data.nextRunAt && !Number.isFinite(Date.parse(String(input.data.nextRunAt))))
        fail('INVALID_INPUT');
    }
    if (input.assigneeId) {
      const person = await dal.person(ctx.groupId, input.assigneeId);
      if (!person) fail('INVALID_ASSIGNEE');
      const membership = await dal.membership(ctx.groupId, person._id);
      if (
        person.role !== 'group_admin' &&
        ![...person.hotelIds, ...(membership?.hotelIds || [])].includes(input.hotelId)
      )
        fail('INVALID_ASSIGNEE');
      if (
        person.role === 'member' &&
        (!membership?.permissions.includes(`${input.kind}:read`) ||
          (membership.locationIds.length &&
            input.locationId &&
            !membership.locationIds.includes(input.locationId)))
      )
        fail('INVALID_ASSIGNEE');
      if (!ctx.manager && input.assigneeId !== ctx.userId) fail('FORBIDDEN', 403);
    }
    if (Array.isArray(input.data.members)) {
      for (const id of input.data.members)
        if (!(await dal.person(ctx.groupId, id))) fail('INVALID_INPUT');
    }
  }
  /**
   * Builds an audit entry with the actor, vendor and record snapshot so later edits do not
   * replace historical evidence. Does not persist it.
   */
  const activity = (ctx: Context, record: Operation, type: string, text = '') => ({
    _id: dal.id(),
    groupId: ctx.groupId,
    recordId: record._id,
    actorId: ctx.userId,
    actorName: ctx.name,
    type,
    text,
    createdAt: new Date().toISOString(),
    version: record.version,
    vendorId: ctx.vendorId,
    snapshot: {
      title: record.title,
      description: record.description,
      data: record.data,
      checks: record.checks,
      assigneeId: record.assigneeId,
      dueAt: record.dueAt,
      status: record.status,
      locationId: record.locationId,
    },
  });
  /**
   * Builds deduplicated notification payloads for the supplied recipients, excluding the
   * actor. Visibility is checked when notifications are read; this helper does not persist
   * them.
   */
  const notices = (ctx: Context, record: Operation, recipients: string[]) =>
    [...new Set(recipients)]
      .filter((id) => id && id !== ctx.userId)
      .map((userId) => ({
        _id: dal.id(),
        groupId: ctx.groupId,
        userId,
        recordId: record._id,
        text: record.title,
        createdAt: record.updatedAt,
        readAt: null,
      }));
  return { context, get, validate, activity, notices };
}
export type OperationsContext = ReturnType<typeof createOperationsContext>;

import { createOperationsMembers } from './operations-members.facade.js';
import { fail } from '../domain.js';
import { createHash } from 'node:crypto';
import { newToken } from '../security.js';
import {
  canRead,
  canManage,
  configurationKinds,
  type RecordInput,
  type Operation,
  type Context,
  type ActionInput,
} from '../operations.js';
import type { OperationsDal } from '../dals/operations.dal.js';
import type { AuthFacade } from './auth.facade.js';
import type { Config } from '../config.js';
import { createOperationsContext } from './operations-context.js';
import { transition } from './operations-policy.js';
import { createOperationsExtras } from './operations-extras.js';
import { cleaningEffect } from './operations-effects.js';
import { createMinibarFacade } from './minibar.facade.js';
import { createPackageFacade } from './packages.facade.js';
import { createCleaningPlan } from './cleaning-plan.facade.js';
import { publicationAudience } from './operations-audience.js';
import type { Intelligence } from '../adapters/intelligence.js';

/**
 * Composes operation workflows with tenant access checks, transactional persistence and
 * external service adapters.
 */
export function createOperationsFacade(
  dal: OperationsDal,
  auth: AuthFacade,
  config: Config,
  intelligence?: Intelligence,
) {
  const access = createOperationsContext(dal, auth);
  /**
   * Validates creation permissions and relationships, then builds an unsaved record with
   * workflow defaults, QR token and scheduling/escalation metadata.
   */
  async function prepare(ctx: Context, input: RecordInput) {
    if (!ctx.manager && !ctx.permissions.includes(`${input.kind}:create`)) fail('FORBIDDEN', 403);
    if (configurationKinds.includes(input.kind) && !canManage(ctx, input.kind))
      fail('FORBIDDEN', 403);
    if (input.kind === 'hotel' && !['platform_admin', 'group_admin'].includes(ctx.role))
      fail('FORBIDDEN', 403);
    await access.validate(ctx, input);
    const now = new Date().toISOString();
    const record: Operation = {
      ...input,
      _id: dal.id(),
      groupId: ctx.groupId,
      createdBy: ctx.userId,
      version: 1,
      createdAt: now,
      updatedAt: now,
      status:
        input.kind === 'hotel'
          ? 'pending'
          : ['article', 'announcement', 'poll', 'idea'].includes(input.kind)
            ? 'draft'
            : configurationKinds.includes(input.kind)
              ? 'active'
              : 'open',
    };
    if (['location', 'asset'].includes(input.kind)) record.qrToken = newToken();
    if (input.kind === 'location')
      record.data = {
        occupancy: 'vacant',
        cleanliness: 'dirty',
        maintenance: 'available',
        service: 'normal',
        ...input.data,
      };
    if (
      !record.dueAt &&
      ['task', 'request', 'cleaning', 'round', 'complaint', 'audit'].includes(record.kind)
    ) {
      const policy = (
        await dal.list({
          groupId: ctx.groupId,
          hotelId: record.hotelId,
          kind: 'policy',
          status: 'active',
          'data.targetKind': record.kind,
          priority: record.priority,
        })
      )[0];
      if (policy) {
        record.dueAt = new Date(Date.now() + Number(policy.data.minutes) * 60000).toISOString();
        record.data.escalationPolicyId = policy._id;
      }
    }
    if (input.kind === 'template' && input.data.repeat && input.data.repeat !== 'none') {
      record.nextRunAt = new Date(String(input.data.nextRunAt || now));
      record.leaseUntil = new Date(0);
    }
    if (!ctx.manager && !canRead(ctx, record)) fail('FORBIDDEN', 403);
    return record;
  }
  /**
   * Creates an authorized record with its audit and assignee notifications. Event children
   * also update the parent version atomically and cannot be added to a closed package.
   */
  async function create(ctx: Context, input: RecordInput) {
    const record = await prepare(ctx, input);
    const parent = record.parentId ? await access.get(ctx, record.parentId) : null;
    if (parent?.kind === 'event' && ['review', 'done', 'cancelled'].includes(parent.status))
      fail('PARENT_CLOSED', 409);
    const nextParent =
      parent?.kind === 'event'
        ? { ...parent, version: parent.version + 1, updatedAt: record.createdAt }
        : null;
    return dal.insert(
      record,
      access.activity(ctx, record, 'created'),
      access.notices(ctx, record, [record.assigneeId]),
      parent && nextParent
        ? {
            previous: parent,
            next: nextParent,
            activity: access.activity(ctx, nextParent, 'child-created', record.title),
          }
        : undefined,
    );
  }
  return {
    ...access,
    ...createOperationsMembers(dal, access),
    minibar: createMinibarFacade(dal, access),
    copyPackage: createPackageFacade(dal, access, prepare),
    cleaningPlan: createCleaningPlan(dal, access, prepare),
    ...createOperationsExtras(dal, access, config, intelligence),
    prepare: dal.prepare,
    /**
     * Returns the next readable records from a group page; advances the cursor across
     * inaccessible entries without exposing them.
     */
    async page(ctx: Context, after: string) {
      const raw = await dal.page(ctx.groupId, after);
      return {
        records: raw.filter((r) => canRead(ctx, r)),
        cursor: raw.length === 500 ? raw.at(-1)!._id : '',
      };
    },
    /**
     * Loads the authenticated workspace, scoped people, records and readable
     * notifications/preferences. Platform admins without a selected group receive only the
     * group selector data.
     */
    async bootstrap(token?: string, groupId?: string) {
      const user = await auth.authenticate(token);
      if (user.role === 'platform_admin' && !groupId)
        return {
          groups: await dal.groups(),
          records: [],
          people: [],
          memberships: [],
          notifications: [],
          preferences: [],
          context: null,
        };
      const ctx = await access.context(token, groupId);
      const raw = await dal.page(ctx.groupId);
      const records = raw.filter((r) => canRead(ctx, r));
      const people = await dal.people(ctx.groupId);
      const allMemberships = await dal.memberships(ctx.groupId);
      const scopedPeople = people.filter(
        (p) =>
          ['platform_admin', 'group_admin'].includes(ctx.role) ||
          p._id === ctx.userId ||
          [...p.hotelIds, ...(allMemberships.find((m) => m.userId === p._id)?.hotelIds || [])].some(
            (id) => ctx.hotelIds.includes(id),
          ),
      );
      const memberships = ctx.manager
        ? allMemberships.filter(
            (m) =>
              ['platform_admin', 'group_admin'].includes(ctx.role) ||
              m.hotelIds.some((id) => ctx.hotelIds.includes(id)),
          )
        : [];
      const notices = await dal.notifications(ctx.groupId, ctx.userId);
      // Revoked access must also hide business data in notification titles.
      const preferences = await dal.preferences(ctx.groupId, ctx.userId);
      const referenced = await dal.byIds(ctx.groupId, [
        ...new Set([...notices.map((n) => n.recordId), ...preferences.map((p) => p.recordId)]),
      ]);
      const visibleIds = new Set(referenced.filter((r) => canRead(ctx, r)).map((r) => r._id));
      return {
        context: ctx,
        groups: user.role === 'platform_admin' ? await dal.groups() : [],
        records,
        cursor: raw.length === 500 ? raw.at(-1)!._id : '',
        people: ctx.manager
          ? scopedPeople
          : scopedPeople
              .filter((p) => p.status === 'active')
              .map((p) => ({ _id: p._id, name: p.name })),
        memberships,
        notifications: notices.filter((n) => visibleIds.has(n.recordId)),
        preferences: preferences.filter((p) => visibleIds.has(p.recordId)),
        services: {
          translation: Boolean(config.DEEPSEEK_API_KEY && config.DEEPSEEK_TRANSLATION_MODEL),
          assistant: Boolean(config.DEEPSEEK_API_KEY && config.DEEPSEEK_ASSISTANT_MODEL),
        },
        reportFilter: (await dal.settings(ctx.groupId, ctx.userId))?.filter,
      };
    },
    create,
    /**
     * Copies an active template to authorized locations as independent work instances. Saves
     * the batch atomically and rejects retries whose inputs differ from the original request.
     */
    async distribute(
      ctx: Context,
      templateId: string,
      locationIds: string[],
      dueAt: string,
      requestId: string,
    ) {
      const template = await access.get(ctx, templateId);
      if (template.kind !== 'template' || template.status !== 'active') fail('INVALID_INPUT');
      const key = `${ctx.groupId}:${ctx.userId}:distribute:${requestId}`;
      const fingerprint = createHash('sha256')
        .update(JSON.stringify([templateId, [...new Set(locationIds)].sort(), dueAt]))
        .digest('hex');
      const receipt = await dal.batchReceipt(key);
      if (receipt) {
        if (receipt.fingerprint !== fingerprint) fail('IDEMPOTENCY_CONFLICT', 409);
        return receipt.recordIds;
      }
      const items: Operation[] = [];
      for (const locationId of [...new Set(locationIds)]) {
        const location = await access.get(ctx, locationId);
        if (location.kind !== 'location') fail('INVALID_INPUT');
        items.push(
          await prepare(ctx, {
            kind: String(template.data.targetKind || 'task') as RecordInput['kind'],
            title: `${template.title} · ${location.title}`.slice(0, 160),
            description: template.description,
            hotelId: location.hotelId,
            locationId,
            department: template.department,
            assigneeId: '',
            dueAt,
            priority: template.priority,
            parentId: location.hotelId === template.hotelId ? template._id : '',
            data: {
              sourceTemplateId: template._id,
              sourceVersion: template.version,
              estimatedMinutes: Number(template.data.estimatedMinutes || 0),
            },
            checks: template.checks.map(({ id, label, type, required, locationId, guideId }) => ({
              id,
              label,
              type,
              required,
              locationId,
              guideId,
            })),
          }),
        );
      }
      return dal.insertBatch(
        key,
        fingerprint,
        items,
        items.map((r) => access.activity(ctx, r, 'created')),
      );
    },
    /**
     * Requires management permission and a matching version, preserves completed checklist
     * evidence and server-owned fields, then persists the edit with audit and notifications.
     */
    async edit(ctx: Context, id: string, version: number, input: RecordInput) {
      const before = await access.get(ctx, id);
      if (!canManage(ctx, before.kind)) fail('FORBIDDEN', 403);
      if (before.version !== version) fail('CONFLICT', 409);
      if (
        before.status === 'done' &&
        (before.kind === 'consumption' || before.assigneeId !== input.assigneeId)
      )
        fail('INVALID_TRANSITION', 409);
      if (
        before.kind !== input.kind ||
        before.hotelId !== input.hotelId ||
        (before.kind === 'location' && before.data.type !== input.data.type)
      )
        fail('INVALID_INPUT');
      await access.validate(ctx, input);
      // Editing must preserve evidence from checks that have already been completed.
      if (
        before.checks.some((c) => c.completedAt) &&
        JSON.stringify(
          input.checks.map((c) => [c.id, c.label, c.type, c.required, c.locationId, c.guideId]),
        ) !==
          JSON.stringify(
            before.checks.map((c) => [c.id, c.label, c.type, c.required, c.locationId, c.guideId]),
          )
      )
        fail('CHECKLIST_LOCKED', 409);
      const next = {
        ...before,
        ...input,
        checks: input.checks.map((c) => ({
          ...before.checks.find((old) => old.id === c.id),
          ...c,
        })),
        data: { ...before.data, ...input.data },
        updatedAt: new Date().toISOString(),
        version: before.version + 1,
      };
      if (['stock', 'product'].includes(before.kind))
        next.data.quantity = before.data.quantity || 0;
      if (
        ['article', 'announcement', 'poll', 'idea'].includes(before.kind) &&
        before.status === 'published'
      ) {
        next.status = 'draft';
        next.data.receipts = [];
        if (before.kind === 'poll') next.data.votes = [];
        next.data.reactions = [];
      }
      if (before.kind === 'template') {
        next.nextRunAt =
          !input.data.repeat || input.data.repeat === 'none'
            ? undefined
            : new Date(String(input.data.nextRunAt || new Date().toISOString()));
        next.leaseUntil = new Date(0);
      }
      return dal.change(
        before,
        next,
        access.activity(ctx, next, 'edited'),
        access.notices(ctx, next, [before.assigneeId, next.assigneeId]),
      );
    },
    /**
     * Validates related evidence and workflow permissions, then commits the versioned
     * transition, audit, notifications and any related room change together.
     */
    async act(ctx: Context, id: string, input: ActionInput) {
      const before = await access.get(ctx, id);
      if (
        before.kind === 'event' &&
        input.action === 'complete' &&
        (
          await dal.list({
            groupId: ctx.groupId,
            parentId: id,
            kind: { $in: ['task', 'cleaning', 'request', 'round', 'audit'] },
            status: { $nin: ['done', 'cancelled'] },
          })
        ).length
      )
        fail('PACKAGE_INCOMPLETE', 409);
      if (input.action === 'scan') {
        const location = await dal.byQr(ctx.groupId, input.qrToken);
        const check = before.checks.find((c) => c.id === input.checkId);
        if (!location || !canRead(ctx, location) || check?.locationId !== location._id)
          fail('INVALID_QR');
      }
      if (
        input.action === 'check' &&
        !input.text &&
        before.checks.find((c) => c.id === input.checkId)?.type === 'photo'
      ) {
        const photo = await dal.activity(ctx.groupId, String(input.value));
        if (!photo?.attachment || photo.recordId !== id) fail('INVALID_ATTACHMENT');
      }
      if (input.action === 'checkout') {
        const person = await dal.person(ctx.groupId, String(input.data.holderId));
        if (!person) fail('INVALID_ASSIGNEE');
        const member = await dal.membership(ctx.groupId, person._id);
        // The recipient must be able to read the asset within their own scope.
        if (
          !canRead(
            {
              ...ctx,
              userId: person._id,
              role: person.role,
              manager: person.role !== 'member',
              hotelIds:
                person.role === 'hotel_admin'
                  ? person.hotelIds
                  : member?.hotelIds || person.hotelIds,
              locationIds: member?.locationIds || [],
              departments: member?.departments || [],
              permissions: member?.permissions || [],
            },
            before,
          )
        )
          fail('INVALID_ASSIGNEE');
      }
      const next = transition(ctx, before, input);
      const related = await cleaningEffect(access, ctx, before, input);
      const audience = input.action === 'publish' ? await publicationAudience(dal, ctx, next) : [];
      const recipients = [...new Set([before.createdBy, before.assigneeId, ...audience])].filter(
        (id) => id && id !== ctx.userId,
      );
      const notices = recipients.map((userId) => ({
        _id: dal.id(),
        groupId: ctx.groupId,
        userId,
        recordId: id,
        text: before.title,
        createdAt: next.updatedAt,
        readAt: null,
      }));
      return dal.change(
        before,
        next,
        access.activity(ctx, next, input.action, input.text),
        notices,
        related,
      );
    },
    /**
     * Creates one independent work instance from an accessible active template, retaining its
     * source version and resetting check completion.
     */
    async instantiate(ctx: Context, id: string, dueAt: string) {
      const template = await access.get(ctx, id);
      if (template.kind !== 'template' || template.status !== 'active') fail('INVALID_INPUT');
      const kind = String(template.data.targetKind || 'task') as RecordInput['kind'];
      return create(ctx, {
        title: template.title,
        description: template.description,
        hotelId: template.hotelId,
        locationId: template.locationId,
        department: template.department,
        assigneeId: template.assigneeId,
        priority: template.priority,
        kind,
        data: { sourceVersion: template.version },
        parentId: template._id,
        dueAt,
        checks: template.checks.map(({ id, label, type, required, locationId, guideId }) => ({
          id,
          label,
          type,
          required,
          locationId,
          guideId,
        })),
      });
    },
    /**
     * Lets managers create rooms row by row under normal scope and capacity checks. Returns
     * successes and errors separately; successful rows remain saved if later rows fail.
     */
    async importLocations(
      ctx: Context,
      hotelId: string,
      rows: { title: string; floor: string; category: string }[],
    ) {
      if (!ctx.manager) fail('FORBIDDEN', 403);
      const results: { title: string; id?: string; error?: string }[] = [];
      for (const row of rows) {
        try {
          const result = await create(ctx, {
            kind: 'location',
            title: row.title,
            hotelId,
            description: '',
            locationId: '',
            department: '',
            assigneeId: '',
            dueAt: '',
            priority: 'normal',
            parentId: '',
            checks: [],
            data: { type: 'room', floor: row.floor, category: row.category },
          });
          results.push({ title: row.title, id: result._id });
        } catch (error) {
          results.push({
            title: row.title,
            error: error instanceof Error ? error.message : 'SERVER_ERROR',
          });
        }
      }
      return results;
    },
  };
}
export type OperationsFacade = ReturnType<typeof createOperationsFacade>;

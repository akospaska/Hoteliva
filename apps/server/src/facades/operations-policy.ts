import { fail } from '../domain.js';
import {
  canManage,
  configurationKinds,
  type Context,
  type Operation,
  type ActionInput,
} from '../operations.js';
import { newToken } from '../security.js';

/**
 * Validates an action’s version, permissions and workflow preconditions, then returns a
 * changed clone with timestamps. Persistence and related record updates belong to the calling
 * facade.
 */
export function transition(ctx: Context, previous: Operation, action: ActionInput): Operation {
  if (previous.version !== action.version) fail('CONFLICT', 409);
  const next = structuredClone(previous);
  const now = new Date().toISOString();
  /**
   * Adds the elapsed active or waiting interval to the cloned record’s total and clears its
   * running timer.
   */
  const settle = (
    key: 'activeSince' | 'waitingSince',
    total: 'activeMilliseconds' | 'waitingMilliseconds',
  ) => {
    if (next.data[key])
      next.data[total] =
        Number(next.data[total] || 0) +
        Math.max(0, Date.parse(now) - Date.parse(String(next.data[key])));
    next.data[key] = '';
  };
  const manager = canManage(ctx, previous.kind);
  const worker = previous.assigneeId === ctx.userId || manager;
  const approver = ctx.manager || ctx.permissions.includes(`${previous.kind}:approve`);
  /**
   * Rejects a failed workflow precondition with a forbidden or conflict error before the
   * transition can be persisted.
   */
  const demand = (condition: boolean, code = 'FORBIDDEN') => {
    if (!condition) fail(code, code === 'FORBIDDEN' ? 403 : 409);
  };
  // Only workflow actions may change status; ordinary editing cannot bypass transitions.
  switch (action.action) {
    case 'reading':
      demand(manager || ctx.permissions.includes('asset:create'));
      demand(previous.kind === 'asset');
      demand(previous.status === 'active', 'INVALID_TRANSITION');
      demand(typeof action.value === 'number' && action.value >= 0, 'INVALID_VALUE');
      if (Number(action.value) < Number(previous.data.meterValue || 0))
        demand(Boolean(action.text.trim()), 'REASON_REQUIRED');
      next.data.meterValue = action.value!;
      next.data.meterReadAt = now;
      break;
    case 'react': {
      demand(['announcement', 'idea', 'conversation'].includes(previous.kind));
      demand(['like', 'thanks', 'idea'].includes(String(action.value)), 'INVALID_VALUE');
      const reactions = Array.isArray(next.data.reactions) ? next.data.reactions : [];
      next.data.reactions = [
        ...reactions.filter((v) => !v.startsWith(`${ctx.userId}:`)),
        `${ctx.userId}:${String(action.value)}`,
      ];
      break;
    }
    case 'receive':
      demand(manager);
      demand(previous.kind === 'purchase' && previous.status === 'approved', 'INVALID_TRANSITION');
      next.status = 'done';
      next.data.receivedAt = now;
      break;
    case 'process':
      demand(manager);
      demand(previous.kind === 'consumption' && previous.status === 'open', 'INVALID_TRANSITION');
      next.status = 'done';
      next.data.processedAt = now;
      next.data.processedBy = ctx.userId;
      break;
    case 'claim':
      demand(!previous.assigneeId && ['open', 'blocked'].includes(previous.status), 'CONFLICT');
      demand(
        ctx.manager ||
          ctx.permissions.includes(`${previous.kind}:create`) ||
          ctx.permissions.includes(`${previous.kind}:manage`),
      );
      next.assigneeId = ctx.userId;
      next.status = 'assigned';
      break;
    case 'start':
      demand(worker);
      demand(['open', 'assigned', 'blocked'].includes(previous.status), 'INVALID_TRANSITION');
      next.status = 'in_progress';
      settle('waitingSince', 'waitingMilliseconds');
      if (!next.data.startedAt) next.data.startedAt = now;
      next.data.activeSince = now;
      break;
    case 'block':
      demand(worker);
      demand(['open', 'assigned', 'in_progress'].includes(previous.status), 'INVALID_TRANSITION');
      demand(Boolean(action.text.trim()), 'REASON_REQUIRED');
      next.status = 'blocked';
      next.data.blockReason = action.text;
      settle('activeSince', 'activeMilliseconds');
      next.data.waitingSince = now;
      break;
    case 'complete':
      demand(worker);
      demand(
        ['open', 'assigned', 'in_progress', 'blocked'].includes(previous.status),
        'INVALID_TRANSITION',
      );
      demand(
        previous.checks.every((c) => !c.required || (c.completedAt && !c.reason)),
        'CHECKLIST_INCOMPLETE',
      );
      next.status = 'review';
      settle('activeSince', 'activeMilliseconds');
      settle('waitingSince', 'waitingMilliseconds');
      next.data.completedAt = now;
      break;
    case 'approve':
      demand(approver);
      demand(['review', 'pending', 'draft'].includes(previous.status), 'INVALID_TRANSITION');
      if (previous.kind === 'hotel') demand(ctx.role === 'platform_admin');
      next.status = configurationKinds.includes(previous.kind)
        ? 'active'
        : previous.kind === 'purchase'
          ? 'approved'
          : 'done';
      next.data.approvedBy = ctx.userId;
      next.data.approvedAt = now;
      break;
    case 'reject':
      demand(approver);
      demand(['review', 'pending'].includes(previous.status), 'INVALID_TRANSITION');
      demand(Boolean(action.text.trim()), 'REASON_REQUIRED');
      next.status = 'blocked';
      next.data.blockReason = action.text;
      break;
    case 'reopen':
      demand(manager);
      demand(['done', 'cancelled'].includes(previous.status), 'INVALID_TRANSITION');
      next.status = 'open';
      break;
    case 'cancel':
      demand(manager);
      demand(!['done', 'archived'].includes(previous.status), 'INVALID_TRANSITION');
      demand(Boolean(action.text.trim()), 'REASON_REQUIRED');
      next.status = 'cancelled';
      settle('activeSince', 'activeMilliseconds');
      settle('waitingSince', 'waitingMilliseconds');
      break;
    case 'publish':
      demand(manager);
      demand(['article', 'announcement', 'poll', 'idea'].includes(previous.kind));
      demand(previous.status === 'draft', 'INVALID_TRANSITION');
      next.status = 'published';
      next.data.publishedVersion = next.version + 1;
      break;
    case 'acknowledge': {
      if (['article', 'announcement'].includes(previous.kind))
        demand(previous.status === 'published', 'INVALID_TRANSITION');
      demand(
        ['handover', 'article', 'announcement', 'onboarding', 'asset', 'conversation'].includes(
          previous.kind,
        ),
      );
      if (previous.kind === 'asset') {
        demand(previous.data.holderId === ctx.userId);
        next.data.checkoutConfirmedAt = now;
        next.data.checkoutConfirmedBy = ctx.userId;
      }
      if (previous.kind === 'conversation') {
        const reads = Array.isArray(next.data.lastReads) ? next.data.lastReads : [];
        next.data.lastReads = [
          ...reads.filter((r) => !r.startsWith(`${ctx.userId}:`)),
          `${ctx.userId}:${now}`,
        ];
      }
      const receipts = Array.isArray(next.data.receipts) ? next.data.receipts : [];
      const receipt = `${ctx.userId}:${String(next.data.publishedVersion || 1)}`;
      if (!receipts.includes(receipt)) next.data.receipts = [...receipts, receipt];
      if (previous.kind === 'handover') {
        next.status = 'done';
        next.data.receivedBy = ctx.userId;
      }
      break;
    }
    case 'check': {
      demand(worker);
      demand(!['done', 'cancelled'].includes(previous.status), 'INVALID_TRANSITION');
      const check = next.checks.find((c) => c.id === action.checkId);
      if (!check) fail('NOT_FOUND', 404);
      if (check.locationId) demand(Boolean(check.scannedAt), 'SCAN_REQUIRED');
      if (!action.text) {
        demand(
          check.type === 'number'
            ? typeof action.value === 'number'
            : check.type === 'check'
              ? action.value === true
              : typeof action.value === 'string' && !!action.value.trim(),
          'INVALID_VALUE',
        );
      }
      check.value = action.value;
      check.reason = action.text;
      check.completedBy = ctx.userId;
      check.completedAt = now;
      break;
    }
    case 'scan': {
      demand(worker);
      demand(!['done', 'cancelled'].includes(previous.status), 'INVALID_TRANSITION');
      const check = next.checks.find((c) => c.id === action.checkId);
      if (!check || !check.locationId) fail('NOT_FOUND', 404);
      check.scannedAt = now;
      break;
    }
    case 'rotate-qr':
      demand(manager);
      demand(['location', 'asset'].includes(previous.kind));
      next.qrToken = newToken();
      break;
    case 'room-state': {
      demand(manager);
      demand(previous.kind === 'location');
      const options: Record<string, string[]> = {
        occupancy: ['vacant', 'occupied'],
        cleanliness: ['dirty', 'cleaning', 'review', 'clean'],
        maintenance: ['available', 'blocked'],
        service: ['normal', 'dnd', 'skip', 'vip'],
      };
      for (const [key, value] of Object.entries(action.data)) {
        demand(Boolean(options[key]?.includes(String(value))), 'INVALID_VALUE');
        next.data[key] = value;
      }
      break;
    }
    case 'stock': {
      demand(manager);
      demand(['stock', 'product'].includes(previous.kind));
      const delta = Number(action.value);
      demand(Number.isInteger(delta) && delta !== 0 && Math.abs(delta) <= 100000, 'INVALID_VALUE');
      const quantity = Number(previous.data.quantity || 0) + delta;
      demand(quantity >= 0, 'INSUFFICIENT_STOCK');
      demand(Boolean(action.text.trim()), 'REASON_REQUIRED');
      next.data.quantity = quantity;
      break;
    }
    case 'checkout':
      demand(manager);
      demand(previous.kind === 'asset');
      demand(previous.status === 'active', 'INVALID_TRANSITION');
      demand(!previous.data.holderId, 'CONFLICT');
      demand(typeof action.data.holderId === 'string' && !!action.data.holderId, 'INVALID_VALUE');
      next.data.holderId = String(action.data.holderId);
      next.data.checkedOutAt = now;
      next.data.checkoutConfirmedAt = '';
      next.data.checkoutConfirmedBy = '';
      next.data.receipts = [];
      break;
    case 'return':
      demand(manager);
      demand(['asset', 'found'].includes(previous.kind));
      demand(Boolean(action.text.trim()), 'REASON_REQUIRED');
      if (previous.kind === 'asset') {
        demand(Boolean(previous.data.holderId), 'INVALID_TRANSITION');
        next.data.holderId = '';
        next.data.returnedAt = now;
      } else next.status = 'done';
      break;
    case 'vote': {
      demand(previous.kind === 'poll');
      demand(previous.status === 'published', 'INVALID_TRANSITION');
      demand(!previous.dueAt || Date.parse(previous.dueAt) > Date.now(), 'POLL_CLOSED');
      const options = previous.data.options;
      demand(Array.isArray(options) && options.includes(String(action.value)), 'INVALID_VALUE');
      const votes = Array.isArray(previous.data.votes) ? previous.data.votes : [];
      next.data.votes = [
        ...votes.filter((v) => !v.startsWith(`${ctx.userId}:`)),
        `${ctx.userId}:${String(action.value)}`,
      ];
      break;
    }
    case 'compensate':
      demand(approver);
      demand(previous.kind === 'complaint');
      demand(
        typeof action.value === 'number' && action.value >= 0 && !!action.text.trim(),
        'INVALID_VALUE',
      );
      next.data.compensation = action.value!;
      next.data.compensationType = action.text;
      next.data.compensationBy = ctx.userId;
      break;
    default:
      fail('INVALID_INPUT');
  }
  next.version++;
  next.updatedAt = now;
  return next;
}

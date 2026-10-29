import { fail } from '../domain.js';
import type { RecordInput } from '../operations.js';

/**
 * Rejects invalid kind-specific business values, dates and combinations before record
 * creation or editing; performs no writes.
 */
export function validateData(input: RecordInput) {
  const { data, kind } = input;
  if (kind === 'policy') {
    if (
      !['task', 'request', 'cleaning', 'round', 'complaint', 'audit'].includes(
        String(data.targetKind),
      ) ||
      !Number.isInteger(data.minutes) ||
      Number(data.minutes) < 1 ||
      Number(data.minutes) > 10080
    )
      fail('INVALID_INPUT');
  }
  /**
   * Checks a supplied or required field against its business vocabulary, rejecting
   * unsupported values.
   */
  const enumValue = (key: string, options: string[], required = false) => {
    if ((required || data[key] !== undefined) && !options.includes(String(data[key])))
      fail('INVALID_INPUT');
  };
  if (kind === 'hotel' && (input.hotelId || input.locationId || input.parentId))
    fail('INVALID_INPUT');
  if (kind === 'location') {
    enumValue('type', ['room', 'public', 'storage', 'technical'], true);
    enumValue('occupancy', ['vacant', 'occupied']);
    enumValue('cleanliness', ['dirty', 'cleaning', 'review', 'clean']);
    enumValue('maintenance', ['available', 'blocked']);
    enumValue('service', ['normal', 'dnd', 'skip', 'vip']);
  }
  if (kind === 'cleaning') enumValue('cleaningType', ['stayover', 'departure', 'deep']);
  if (
    ['product', 'stock', 'purchase', 'consumption'].includes(kind) &&
    data.quantity !== undefined &&
    (!Number.isInteger(data.quantity) || Number(data.quantity) < 0)
  )
    fail('INVALID_INPUT');
  if (
    kind === 'consumption' &&
    (!input.locationId ||
      typeof data.productId !== 'string' ||
      !data.productId ||
      !Number.isInteger(data.quantity) ||
      Number(data.quantity) <= 0)
  )
    fail('INVALID_INPUT');
  if (kind === 'poll') {
    const options = data.options;
    if (
      !Array.isArray(options) ||
      options.length < 2 ||
      options.length > 12 ||
      options.some((v) => !v.trim()) ||
      new Set(options).size !== options.length
    )
      fail('INVALID_INPUT');
  }
  for (const key of ['startsAt', 'endsAt', 'occurredAt', 'nextRunAt'])
    if (data[key] && !Number.isFinite(Date.parse(String(data[key])))) fail('INVALID_INPUT');
  if (
    data.startsAt &&
    data.endsAt &&
    Date.parse(String(data.endsAt)) <= Date.parse(String(data.startsAt))
  )
    fail('INVALID_INPUT');
  if (kind === 'conversation' && data.members !== undefined && !Array.isArray(data.members))
    fail('INVALID_INPUT');
}

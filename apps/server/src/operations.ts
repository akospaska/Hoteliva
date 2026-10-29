export const kinds = [
  'role',
  'policy',
  'hotel',
  'location',
  'task',
  'cleaning',
  'template',
  'round',
  'product',
  'consumption',
  'vendor',
  'handover',
  'request',
  'article',
  'complaint',
  'event',
  'onboarding',
  'purchase',
  'incident',
  'audit',
  'asset',
  'checkout',
  'announcement',
  'conversation',
  'poll',
  'idea',
  'found',
  'stock',
  'integration',
] as const;
export type Kind = (typeof kinds)[number];
export type Value = string | number | boolean | string[];
export type Check = {
  id: string;
  label: string;
  type: 'check' | 'number' | 'text' | 'photo';
  required: boolean;
  locationId?: string;
  guideId?: string;
  value?: string | number | boolean;
  reason?: string;
  completedBy?: string;
  completedAt?: string;
  scannedAt?: string;
};
export type RecordInput = {
  kind: Kind;
  title: string;
  description: string;
  hotelId: string;
  locationId: string;
  department: string;
  assigneeId: string;
  dueAt: string;
  priority: 'normal' | 'high' | 'urgent';
  parentId: string;
  data: Record<string, Value>;
  checks: Check[];
};
export type Operation = RecordInput & {
  _id: string;
  groupId: string;
  status: string;
  version: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  qrToken?: string;
  recurrenceKey?: string;
  leaseUntil?: Date;
  leaseOwner?: string;
  nextRunAt?: Date;
};
export type Membership = {
  _id: string;
  groupId: string;
  userId: string;
  hotelIds: string[];
  locationIds: string[];
  departments: string[];
  permissions: string[];
  vendorId: string;
  roleIds?: string[];
};
export type Activity = {
  _id: string;
  groupId: string;
  recordId: string;
  actorId: string;
  actorName: string;
  type: string;
  text: string;
  createdAt: string;
  version: number;
  attachment?: { id: string; name: string; mime: string };
  snapshot?: Pick<
    Operation,
    'title' | 'description' | 'data' | 'checks' | 'assigneeId' | 'dueAt' | 'status' | 'locationId'
  >;
  vendorId?: string;
};
export type Notification = {
  _id: string;
  groupId: string;
  userId: string;
  recordId: string;
  text: string;
  createdAt: string;
  readAt: string | null;
};
export type Preference = {
  _id: string;
  groupId: string;
  userId: string;
  recordId: string;
  bookmarked: boolean;
  remindAt: Date | null;
  notifiedAt: Date | null;
};
export type Context = {
  userId: string;
  name: string;
  groupId: string;
  role: string;
  hotelIds: string[];
  locationIds: string[];
  departments: string[];
  permissions: string[];
  vendorId: string;
  manager: boolean;
};
export type ActionInput = {
  version: number;
  action: string;
  text: string;
  checkId: string;
  qrToken: string;
  value?: string | number | boolean;
  data: Record<string, Value>;
};
export const privateKinds: Kind[] = ['incident', 'purchase', 'onboarding', 'integration'];
export const configurationKinds: Kind[] = [
  'policy',
  'role',
  'hotel',
  'location',
  'template',
  'product',
  'vendor',
  'asset',
  'stock',
  'integration',
];
export const workKinds: Kind[] = [
  'task',
  'cleaning',
  'round',
  'request',
  'complaint',
  'event',
  'onboarding',
  'audit',
];

export function allowedHotel(ctx: Context, hotelId: string) {
  return ['platform_admin', 'group_admin'].includes(ctx.role) || ctx.hotelIds.includes(hotelId);
}
export function canRead(ctx: Context, record: Operation) {
  if (record.groupId !== ctx.groupId) return false;
  if (record.kind === 'role') return ['platform_admin', 'group_admin'].includes(ctx.role);
  if (!allowedHotel(ctx, record.kind === 'hotel' ? record._id : record.hotelId)) return false;
  if (ctx.manager) return true;
  if (
    ctx.locationIds.length &&
    [
      'task',
      'cleaning',
      'consumption',
      'request',
      'complaint',
      'incident',
      'found',
      'asset',
    ].includes(record.kind) &&
    !ctx.locationIds.includes(record.locationId)
  )
    return false;
  if (
    ctx.locationIds.length &&
    record.checks.some((c) => c.locationId && !ctx.locationIds.includes(c.locationId))
  )
    return false;
  if (
    ['article', 'announcement', 'poll', 'idea'].includes(record.kind) &&
    record.status === 'draft' &&
    record.createdBy !== ctx.userId
  )
    return false;
  if (
    ctx.locationIds.length &&
    record.kind !== 'hotel' &&
    record.kind !== 'location' &&
    record.locationId &&
    !ctx.locationIds.includes(record.locationId)
  )
    return false;
  if (record.kind === 'location' && ctx.locationIds.length && !ctx.locationIds.includes(record._id))
    return false;
  if (privateKinds.includes(record.kind) && !ctx.permissions.includes(`${record.kind}:read`))
    return false;
  if (
    record.department &&
    ctx.departments.length > 0 &&
    !ctx.departments.includes(record.department) &&
    record.assigneeId !== ctx.userId
  )
    return false;
  if (record.kind === 'conversation') {
    const members = record.data.members;
    if (Array.isArray(members) && members.length && !members.includes(ctx.userId)) return false;
  }
  return ctx.permissions.includes(`${record.kind}:read`);
}
export function canManage(ctx: Context, kind: Kind) {
  return ctx.manager || ctx.permissions.includes(`${kind}:manage`);
}

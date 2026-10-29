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
  completedAt?: string;
  completedBy?: string;
  scannedAt?: string;
};
export type Item = {
  _id: string;
  groupId: string;
  kind: string;
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
  status: string;
  version: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  qrToken?: string;
};
export type ItemInput = Pick<
  Item,
  | 'kind'
  | 'title'
  | 'description'
  | 'hotelId'
  | 'locationId'
  | 'department'
  | 'assigneeId'
  | 'dueAt'
  | 'priority'
  | 'parentId'
  | 'data'
  | 'checks'
>;
export type Member = {
  userId: string;
  hotelIds: string[];
  locationIds: string[];
  departments: string[];
  permissions: string[];
  vendorId: string;
  roleIds?: string[];
};
export type Snapshot = {
  reportFilter?: { department: string; assignee: string; from: string; to: string };
  cursor?: string;
  groups: {
    _id: string;
    name: string;
    status: string;
    maxUsers: number;
    maxRooms: number;
    seats: number;
  }[];
  context: {
    userId: string;
    groupId: string;
    role: string;
    manager: boolean;
    permissions: string[];
    hotelIds: string[];
  } | null;
  records: Item[];
  people: {
    _id: string;
    name: string;
    email?: string;
    role?: string;
    status?: string;
    hotelIds?: string[];
  }[];
  memberships: Member[];
  notifications: {
    _id: string;
    recordId: string;
    text: string;
    readAt: string | null;
    createdAt: string;
  }[];
  preferences: { recordId: string; bookmarked: boolean; remindAt: string | null }[];
  services?: { translation: boolean; assistant: boolean };
};
export type Activity = {
  _id: string;
  recordId: string;
  actorName: string;
  type: string;
  text: string;
  createdAt: string;
  version: number;
  snapshot?: Pick<Item, 'title' | 'description' | 'status' | 'data' | 'checks'>;
  attachment?: { id: string; mime: string; name: string };
};
export type Detail = { record: Item; activities: Activity[] };
export type Module = {
  id: string;
  hu: string;
  en: string;
  kind: string;
  view: string;
  icon: string;
  group: string;
};

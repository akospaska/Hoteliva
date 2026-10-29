export type Locale = 'hu' | 'en';
export type Role = 'platform_admin' | 'group_admin' | 'hotel_admin' | 'member';
export type User = {
  _id: string;
  email: string;
  name: string;
  locale: Locale;
  role: Role;
  groupId: string | null;
  hotelIds: string[];
  status: 'pending' | 'active' | 'disabled';
  passwordHash?: string;
  activationHash?: string;
  activationExpires?: Date;
};
export type Group = {
  _id: string;
  name: string;
  status: 'active' | 'suspended';
  maxUsers: number;
  maxRooms: number;
  seats: number;
};
export type Session = { _id: string; userId: string; expiresAt: Date };
export type Job = {
  _id: string;
  type: 'maintenance';
  nextRunAt: Date;
  leaseUntil: Date;
  owner: string | null;
};
export type PublicUser = Pick<
  User,
  'email' | 'name' | 'locale' | 'role' | 'groupId' | 'hotelIds'
> & { id: string; groupName: string | null };

export function fail(code: string, status = 400): never {
  throw Object.assign(new Error(code), { code, status });
}
export function publicUser(user: User, group: Group | null): PublicUser {
  return {
    id: user._id,
    email: user.email,
    name: user.name,
    locale: user.locale,
    role: user.role,
    groupId: user.groupId,
    hotelIds: user.hotelIds,
    groupName: group?.name ?? null,
  };
}

import type { UserRole } from "../../../lib/roles";
import { toIso } from "../../../lib/time";
import type { UserDocument } from "../schemas/user.schema";

export type PublicUser = {
  id: string;
  phone: string;
  firstName?: string;
  lastName?: string;
  birthdate?: string;
  roles: UserRole[];
  status: "active" | "suspended" | "deleted";
  hasPassword: boolean;
  createdAt: string;
  updatedAt: string;
};

export function toPublicUser(user: UserDocument): PublicUser {
  return {
    id: String(user._id),
    phone: user.phone,
    ...(user.firstName === undefined || user.firstName === null
      ? {}
      : { firstName: user.firstName }),
    ...(user.lastName === undefined || user.lastName === null
      ? {}
      : { lastName: user.lastName }),
    ...(user.birthdate === undefined || user.birthdate === null
      ? {}
      : { birthdate: user.birthdate }),
    roles: user.roles ?? [],
    status: user.status,
    hasPassword: Boolean(user.passwordHash),
    createdAt: toIso(user.createdAt),
    updatedAt: toIso(user.updatedAt),
  };
}

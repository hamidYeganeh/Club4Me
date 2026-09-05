import type { UserRole } from "../../../lib/roles";
import { toIso } from "../../../lib/time";
import type {
  UserActivityLevel,
  UserDocument,
  UserGender,
} from "../schemas/user.schema";

export type PublicUser = {
  id: string;
  phone: string;
  firstName?: string;
  lastName?: string;
  birthdate?: string;
  gender?: UserGender;
  genderDescription?: string;
  activityLevel?: UserActivityLevel;
  idCard?: string;
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
    ...(user.gender === undefined || user.gender === null
      ? {}
      : { gender: user.gender }),
    ...(user.genderDescription === undefined || user.genderDescription === null
      ? {}
      : { genderDescription: user.genderDescription }),
    ...(user.activityLevel === undefined || user.activityLevel === null
      ? {}
      : { activityLevel: user.activityLevel }),
    ...(user.idCard === undefined || user.idCard === null
      ? {}
      : { idCard: user.idCard }),
    roles: user.roles ?? [],
    status: user.status,
    hasPassword: Boolean(user.passwordHash),
    createdAt: toIso(user.createdAt),
    updatedAt: toIso(user.updatedAt),
  };
}

import type { RequestableRole } from "../../../lib/roles";
import { toIso } from "../../../lib/time";
import type {
  RoleRequestDocument,
  RoleRequestStatus,
} from "../schemas/role-request.schema";

export type PublicRoleRequest = {
  id: string;
  userId: string;
  phone: string;
  role: RequestableRole;
  status: RoleRequestStatus;
  createdAt: string;
  updatedAt: string;
};

export function toPublicRoleRequest(
  request: RoleRequestDocument,
): PublicRoleRequest {
  return {
    id: String(request._id),
    userId: String(request.userId),
    phone: request.phone,
    role: request.role,
    status: request.status,
    createdAt: toIso(request.createdAt),
    updatedAt: toIso(request.updatedAt),
  };
}

import { Injectable } from "@nestjs/common";

import { AppError } from "../../common/errors/app.exception";
import { isRequestableRole, type UserRole } from "../../lib/roles";
import { UsersRepository } from "../users/users.repository";
import type { RoleRequestDetails } from "./dto/create-role-request.dto";
import type { PublicRoleRequest } from "./mappers/role-request.mapper";
import { RoleRequestsRepository } from "./role-requests.repository";
import type { RoleRequestStatus } from "./schemas/role-request.schema";

type RoleRequestDecision = Exclude<RoleRequestStatus, "pending">;

@Injectable()
export class RoleRequestsService {
  constructor(
    private readonly roleRequestsRepository: RoleRequestsRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async requestRole(
    userId: string,
    role: string,
    details: RoleRequestDetails,
  ): Promise<PublicRoleRequest> {
    if (!isRequestableRole(role)) {
      throw new AppError(
        400,
        "ROLE_REQUEST_INVALID",
        "This role cannot be requested",
      );
    }

    const user = await this.usersRepository.findDocumentById(userId);

    if (user.roles?.includes(role)) {
      throw new AppError(
        409,
        "ROLE_ALREADY_GRANTED",
        "This role is already granted",
      );
    }

    if (
      role === "coach" &&
      (!details.specialty || details.experienceYears === undefined)
    ) {
      throw new AppError(
        400,
        "ROLE_REQUEST_DETAILS_INVALID",
        "Coach experience and specialty are required",
      );
    }
    if (role === "owner" && (!details.businessName || !details.businessType)) {
      throw new AppError(
        400,
        "ROLE_REQUEST_DETAILS_INVALID",
        "Business name and type are required",
      );
    }

    return this.roleRequestsRepository.createForUser({
      userId: String(user._id),
      phone: user.phone,
      role,
      details,
    });
  }

  async listForUser(userId: string): Promise<{ items: PublicRoleRequest[] }> {
    return { items: await this.roleRequestsRepository.listForUser(userId) };
  }

  async listForAdmin(actorRoles: UserRole[]): Promise<{
    items: PublicRoleRequest[];
  }> {
    if (!actorRoles.includes("admin")) {
      throw new AppError(403, "FORBIDDEN", "Admin access required");
    }

    return {
      items: await this.roleRequestsRepository.listRecent(),
    };
  }

  async decideForAdmin(
    actorRoles: UserRole[],
    requestId: string,
    status: RoleRequestDecision,
  ): Promise<PublicRoleRequest> {
    if (!actorRoles.includes("admin")) {
      throw new AppError(403, "FORBIDDEN", "Admin access required");
    }

    const request = await this.roleRequestsRepository.decidePending(
      requestId,
      status,
    );

    if (status === "approved") {
      try {
        await this.usersRepository.grantRole(request.userId, request.role);
      } catch (error) {
        await this.roleRequestsRepository.restorePending(request.id, status);
        throw error;
      }
    }

    return request;
  }
}

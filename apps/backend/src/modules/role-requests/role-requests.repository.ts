import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";

import { AppError } from "../../common/errors/app.exception";
import type { RequestableRole } from "../../lib/roles";
import {
  toPublicRoleRequest,
  type PublicRoleRequest,
} from "./mappers/role-request.mapper";
import {
  RoleRequest,
  type RoleRequestDocument,
  type RoleRequestStatus,
} from "./schemas/role-request.schema";

type CreateRoleRequestInput = {
  userId: string;
  phone: string;
  role: RequestableRole;
};

@Injectable()
export class RoleRequestsRepository {
  constructor(
    @InjectModel(RoleRequest.name)
    private readonly roleRequestModel: Model<RoleRequestDocument>,
  ) {}

  async createForUser(
    input: CreateRoleRequestInput,
  ): Promise<PublicRoleRequest> {
    const userId = toObjectId(input.userId);
    const existing = await this.roleRequestModel
      .findOne({
        userId,
        role: input.role,
        status: "pending",
      })
      .exec();

    if (existing) {
      return toPublicRoleRequest(existing);
    }

    try {
      const created = await this.roleRequestModel.create({
        userId,
        phone: input.phone,
        role: input.role,
        status: "pending",
      });
      return toPublicRoleRequest(created);
    } catch (error) {
      if (!isDuplicateKey(error)) {
        throw error;
      }

      const raced = await this.roleRequestModel
        .findOne({
          userId,
          role: input.role,
          status: "pending",
        })
        .exec();

      if (!raced) {
        throw new AppError(
          500,
          "ROLE_REQUEST_FAILED",
          "Failed to create role request",
        );
      }

      return toPublicRoleRequest(raced);
    }
  }

  async listRecent(limit = 100): Promise<PublicRoleRequest[]> {
    const requests = await this.roleRequestModel
      .find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();

    return requests.map(toPublicRoleRequest);
  }

  async decidePending(
    id: string,
    status: Exclude<RoleRequestStatus, "pending">,
  ): Promise<PublicRoleRequest> {
    const requestId = toRequestObjectId(id);
    const updated = await this.roleRequestModel
      .findOneAndUpdate(
        { _id: requestId, status: "pending" },
        { $set: { status } },
        { new: true },
      )
      .exec();

    if (updated) {
      return toPublicRoleRequest(updated);
    }

    const existing = await this.roleRequestModel.findById(requestId).exec();

    if (!existing) {
      throw new AppError(
        404,
        "ROLE_REQUEST_NOT_FOUND",
        "Role request not found",
      );
    }

    throw new AppError(
      409,
      "ROLE_REQUEST_ALREADY_REVIEWED",
      "Role request has already been reviewed",
      { status: existing.status },
    );
  }

  async restorePending(
    id: string,
    currentStatus: Exclude<RoleRequestStatus, "pending">,
  ): Promise<void> {
    await this.roleRequestModel
      .updateOne(
        { _id: toRequestObjectId(id), status: currentStatus },
        { $set: { status: "pending" } },
      )
      .exec();
  }
}

function toObjectId(id: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(404, "USER_NOT_FOUND", "User not found");
  }

  return new Types.ObjectId(id);
}

function toRequestObjectId(id: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(404, "ROLE_REQUEST_NOT_FOUND", "Role request not found");
  }

  return new Types.ObjectId(id);
}

function isDuplicateKey(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === 11000
  );
}

import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Connection, Model, Types } from "mongoose";
import { InjectConnection } from "@nestjs/mongoose";

import { AppError } from "../../common/errors/app.exception";
import { hashPassword, verifyPassword } from "../../common/utils/password.util";
import { toLocalIranianPhone } from "../../common/utils/phone.util";
import type { UserRole } from "../../lib/roles";
import { toPublicUser, type PublicUser } from "./mappers/user.mapper";
import {
  User,
  type UserActivityLevel,
  type UserDocument,
  type UserGender,
} from "./schemas/user.schema";

const PASSWORD_HASH_SELECT = "+passwordHash";

@Injectable()
export class UsersRepository {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async findDocumentById(id: string): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError(404, "USER_NOT_FOUND", "User not found");
    }

    const user = await this.userModel
      .findById(id)
      .select(PASSWORD_HASH_SELECT)
      .exec();

    if (!user) {
      throw new AppError(404, "USER_NOT_FOUND", "User not found");
    }

    return user;
  }

  async findById(id: string): Promise<PublicUser> {
    return toPublicUser(await this.findDocumentById(id));
  }

  async findManyByIds(
    ids: Array<string | Types.ObjectId>,
  ): Promise<PublicUser[]> {
    const validIds = ids
      .map(String)
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    if (!validIds.length) return [];
    const users = await this.userModel.find({ _id: { $in: validIds } }).exec();
    return users.map(toPublicUser);
  }

  async list(query?: string): Promise<PublicUser[]> {
    const pattern = query?.trim()
      ? new RegExp(escapeRegex(query.trim()), "i")
      : undefined;
    const users = await this.userModel
      .find(
        pattern
          ? {
              $or: [
                { phone: pattern },
                { firstName: pattern },
                { lastName: pattern },
              ],
            }
          : {},
      )
      .sort({ updatedAt: -1 })
      .limit(500)
      .exec();
    return users.map(toPublicUser);
  }

  async findIdsByRole(role: UserRole): Promise<Types.ObjectId[]> {
    return this.userModel.distinct("_id", { roles: role, status: "active" });
  }

  async updateStatus(
    userId: string,
    status: "active" | "suspended",
  ): Promise<PublicUser> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new AppError(404, "USER_NOT_FOUND", "User not found");
    }
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: { status } },
      { new: true },
    );
    if (!user) throw new AppError(404, "USER_NOT_FOUND", "User not found");
    return toPublicUser(user);
  }

  async updateProfile(
    userId: string,
    profile: {
      firstName?: string;
      lastName?: string;
      birthdate?: string;
      gender?: UserGender;
      genderDescription?: string;
      activityLevel?: UserActivityLevel;
      idCard?: string;
      avatarUrl?: string;
    },
  ): Promise<PublicUser> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new AppError(404, "USER_NOT_FOUND", "User not found");
    }
    const update =
      profile.gender && profile.gender !== "other"
        ? { $set: profile, $unset: { genderDescription: 1 } }
        : { $set: profile };
    const user = await this.userModel.findByIdAndUpdate(userId, update, {
      new: true,
    });
    if (!user) throw new AppError(404, "USER_NOT_FOUND", "User not found");
    return toPublicUser(user);
  }

  async deleteAccount(userId: string): Promise<void> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new AppError(404, "USER_NOT_FOUND", "User not found");
    }
    const id = new Types.ObjectId(userId);
    const cleanup: Array<[string, Record<string, unknown>]> = [
      ["user_locations", { userId: id }],
      ["favorites", { userId: id }],
      ["notifications", { userId: id }],
      ["push_devices", { userId: id }],
      ["notification_preferences", { userId: id }],
      ["role_requests", { userId: id }],
      ["club_reviews", { userId: id }],
      ["media", { ownerId: id }],
      ["club_memberships", { userId: id }],
    ];
    await Promise.all(
      cleanup.map(([collection, filter]) =>
        this.connection.collection(collection).deleteMany(filter),
      ),
    );
    const result = await this.userModel.updateOne(
      { _id: id },
      {
        $set: {
          phone: `deleted-${userId}@gym4me.invalid`,
          roles: [],
          status: "deleted",
          deletedAt: new Date(),
        },
        $unset: {
          firstName: 1,
          lastName: 1,
          birthdate: 1,
          gender: 1,
          genderDescription: 1,
          activityLevel: 1,
          idCard: 1,
          passwordHash: 1,
        },
      },
    );
    if (result.matchedCount === 0) {
      throw new AppError(404, "USER_NOT_FOUND", "User not found");
    }
  }

  async grantRole(userId: string, role: UserRole): Promise<PublicUser> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new AppError(404, "USER_NOT_FOUND", "User not found");
    }

    const user = await this.userModel
      .findByIdAndUpdate(userId, { $addToSet: { roles: role } }, { new: true })
      .exec();

    if (!user) {
      throw new AppError(404, "USER_NOT_FOUND", "User not found");
    }

    return toPublicUser(user);
  }

  async findDocumentByPhone(phone: string): Promise<UserDocument | null> {
    const existing = await this.userModel
      .findOne({
        $or: [{ phone }, { phone: toLocalIranianPhone(phone) }],
      })
      .select(PASSWORD_HASH_SELECT)
      .exec();

    if (!existing) {
      return null;
    }

    if (existing.phone !== phone) {
      existing.phone = phone;
      await existing.save();
    }

    return existing;
  }

  async findOrCreateByPhone(phone: string): Promise<PublicUser> {
    const existing = await this.findDocumentByPhone(phone);

    if (existing) {
      return toPublicUser(existing);
    }

    try {
      const created = await this.userModel.create({
        phone,
        roles: ["athlete"],
        status: "active",
      });
      created.passwordHash = undefined;
      return toPublicUser(created);
    } catch (error) {
      if (!isDuplicateKey(error)) {
        throw error;
      }

      const raced = await this.findDocumentByPhone(phone);

      if (!raced) {
        throw new AppError(500, "USER_CREATE_FAILED", "Failed to create user");
      }

      return toPublicUser(raced);
    }
  }

  async setPassword(
    userId: string,
    password: string,
    currentPassword?: string,
  ): Promise<PublicUser> {
    const user = await this.findDocumentById(userId);

    if (user.passwordHash) {
      if (!currentPassword) {
        throw new AppError(
          400,
          "CURRENT_PASSWORD_REQUIRED",
          "Current password is required",
        );
      }

      const matches = await verifyPassword(currentPassword, user.passwordHash);

      if (!matches) {
        throw new AppError(
          400,
          "INVALID_PASSWORD",
          "Current password is incorrect",
        );
      }
    }

    user.passwordHash = await hashPassword(password);
    await user.save();
    return toPublicUser(user);
  }

  async resetPassword(phone: string, password: string): Promise<PublicUser> {
    const user = await this.findDocumentByPhone(phone);

    if (!user) {
      throw new AppError(404, "USER_NOT_FOUND", "User not found");
    }

    user.passwordHash = await hashPassword(password);
    await user.save();
    return toPublicUser(user);
  }

  async authenticate(phone: string, password: string): Promise<PublicUser> {
    const user = await this.findDocumentByPhone(phone);

    if (!user) {
      throw new AppError(
        401,
        "INVALID_CREDENTIALS",
        "Invalid phone number or password",
      );
    }

    if (!user.passwordHash) {
      throw new AppError(
        400,
        "PASSWORD_NOT_SET",
        "Password is not set. Sign in with OTP first.",
      );
    }

    const matches = await verifyPassword(password, user.passwordHash);

    if (!matches) {
      throw new AppError(
        401,
        "INVALID_CREDENTIALS",
        "Invalid phone number or password",
      );
    }

    return toPublicUser(user);
  }
}

function isDuplicateKey(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === 11000
  );
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

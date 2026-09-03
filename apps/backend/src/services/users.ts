import type { Document, WithId } from "mongodb";
import { ObjectId } from "mongodb";

import { getDb } from "../db/mongodb.js";
import { AppError } from "../lib/errors.js";
import { idOf } from "../lib/http.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { toLocalIranianPhone } from "../lib/phone.js";
import type { UserRole } from "../lib/roles.js";
import { nowIso, toIso } from "../lib/time.js";

export type UserRecord = {
  phone: string;
  firstName?: string;
  lastName?: string;
  birthdate?: string;
  roles: UserRole[];
  passwordHash?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type PublicUser = {
  id: string;
  phone: string;
  firstName?: string;
  lastName?: string;
  birthdate?: string;
  roles: UserRole[];
  hasPassword: boolean;
  createdAt: string;
  updatedAt: string;
};

function users() {
  return getDb().collection<UserRecord>("users");
}

function isDuplicateKey(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === 11000
  );
}

export function serializeUser(user: WithId<UserRecord>): PublicUser {
  return {
    id: idOf(user._id),
    phone: user.phone,
    ...(user.firstName === undefined ? {} : { firstName: user.firstName }),
    ...(user.lastName === undefined ? {} : { lastName: user.lastName }),
    ...(user.birthdate === undefined ? {} : { birthdate: user.birthdate }),
    roles: user.roles?.length ? user.roles : ["athlete"],
    hasPassword: Boolean(user.passwordHash),
    createdAt: toIso(user.createdAt),
    updatedAt: toIso(user.updatedAt),
  };
}

export async function ensureUserIndexes(): Promise<void> {
  await users().createIndex({ phone: 1 }, { unique: true });
}

export async function findUserById(id: string): Promise<PublicUser> {
  const user = await getUserDocumentById(id);
  return serializeUser(user);
}

export async function getUserDocumentById(
  id: string,
): Promise<WithId<UserRecord>> {
  const user = await users().findOne({ _id: new ObjectId(id) });

  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "User not found");
  }

  return user;
}

export async function findUserDocumentByPhone(
  phone: string,
): Promise<WithId<UserRecord> | null> {
  const existing = await users().findOne({
    $or: [{ phone }, { phone: toLocalIranianPhone(phone) }],
  });

  if (!existing) {
    return null;
  }

  if (existing.phone !== phone) {
    const updatedAt = nowIso();
    await users().updateOne(
      { _id: existing._id },
      { $set: { phone, updatedAt } },
    );
    existing.phone = phone;
    existing.updatedAt = updatedAt;
  }

  return existing;
}

export async function findOrCreateUserByPhone(phone: string): Promise<PublicUser> {
  const existing = await findUserDocumentByPhone(phone);

  if (existing) {
    return serializeUser(existing);
  }

  const now = nowIso();
  const record: UserRecord = {
    phone,
    roles: ["athlete"],
    createdAt: now,
    updatedAt: now,
  };

  try {
    const result = await users().insertOne(record as UserRecord & Document);
    return serializeUser({ _id: result.insertedId, ...record });
  } catch (error) {
    if (!isDuplicateKey(error)) {
      throw error;
    }

    const raced = await findUserDocumentByPhone(phone);

    if (!raced) {
      throw new AppError(500, "USER_CREATE_FAILED", "Failed to create user");
    }

    return serializeUser(raced);
  }
}

export async function setUserPassword(
  userId: string,
  password: string,
  currentPassword?: string,
): Promise<PublicUser> {
  const user = await getUserDocumentById(userId);

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
      throw new AppError(400, "INVALID_PASSWORD", "Current password is incorrect");
    }
  }

  const passwordHash = await hashPassword(password);
  const updatedAt = nowIso();

  await users().updateOne(
    { _id: user._id },
    { $set: { passwordHash, updatedAt } },
  );

  return serializeUser({
    ...user,
    passwordHash,
    updatedAt,
  });
}

export async function resetUserPassword(
  phone: string,
  password: string,
): Promise<PublicUser> {
  const user = await findUserDocumentByPhone(phone);

  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "User not found");
  }

  const passwordHash = await hashPassword(password);
  const updatedAt = nowIso();

  await users().updateOne(
    { _id: user._id },
    { $set: { passwordHash, updatedAt } },
  );

  return serializeUser({
    ...user,
    passwordHash,
    updatedAt,
  });
}

export async function authenticateWithPassword(
  phone: string,
  password: string,
): Promise<PublicUser> {
  const user = await findUserDocumentByPhone(phone);

  if (!user) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid phone number or password");
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
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid phone number or password");
  }

  return serializeUser(user);
}

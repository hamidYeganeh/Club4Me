import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

import type { UserRole } from "../../../lib/roles";

export const USER_STATUSES = ["active", "suspended", "deleted"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

@Schema({
  collection: "users",
  timestamps: true,
})
export class User {
  @Prop({ required: true, unique: true, index: true })
  phone: string;

  @Prop()
  firstName?: string;

  @Prop()
  lastName?: string;

  @Prop()
  birthdate?: string;

  @Prop({ type: [String], default: ["athlete"] })
  roles: UserRole[];

  @Prop({ select: false })
  passwordHash?: string;

  @Prop({ type: String, enum: USER_STATUSES, default: "active" })
  status: UserStatus;

  @Prop({ type: Date })
  deletedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);

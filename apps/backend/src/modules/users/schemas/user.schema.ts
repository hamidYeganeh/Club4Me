import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

import type { UserRole } from "../../../lib/roles";

export const USER_STATUSES = ["active", "suspended", "deleted"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];
export const USER_GENDERS = ["female", "male", "other"] as const;
export type UserGender = (typeof USER_GENDERS)[number];
export const USER_ACTIVITY_LEVELS = [
  "very-active",
  "normal",
  "very-lazy",
] as const;
export type UserActivityLevel = (typeof USER_ACTIVITY_LEVELS)[number];

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

  @Prop({ type: String, enum: USER_GENDERS })
  gender?: UserGender;

  @Prop({ trim: true, maxlength: 300 })
  genderDescription?: string;

  @Prop({ type: String, enum: USER_ACTIVITY_LEVELS })
  activityLevel?: UserActivityLevel;

  @Prop({ trim: true, maxlength: 10 })
  idCard?: string;

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

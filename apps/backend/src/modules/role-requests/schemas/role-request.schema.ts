import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

import type { RequestableRole } from "../../../lib/roles";

export const ROLE_REQUEST_STATUSES = [
  "pending",
  "approved",
  "rejected",
] as const;
export type RoleRequestStatus = (typeof ROLE_REQUEST_STATUSES)[number];

@Schema({
  collection: "role_requests",
  timestamps: true,
})
export class RoleRequest {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: ["coach", "owner"], required: true })
  role: RequestableRole;

  @Prop({
    type: String,
    enum: ROLE_REQUEST_STATUSES,
    default: "pending",
    index: true,
  })
  status: RoleRequestStatus;

  @Prop({ required: true })
  phone: string;

  createdAt: Date;
  updatedAt: Date;
}

export type RoleRequestDocument = HydratedDocument<RoleRequest>;
export const RoleRequestSchema = SchemaFactory.createForClass(RoleRequest);

RoleRequestSchema.index(
  { userId: 1, role: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } },
);

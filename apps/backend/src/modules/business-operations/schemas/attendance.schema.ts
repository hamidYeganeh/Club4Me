import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

@Schema({ collection: "club_attendance", timestamps: true })
export class ClubAttendance {
  @Prop({ type: Types.ObjectId, ref: "Club", required: true, index: true })
  clubId: Types.ObjectId;
  @Prop({
    type: Types.ObjectId,
    ref: "ClubStudent",
    required: true,
    index: true,
  })
  studentId: Types.ObjectId;
  @Prop({ type: Date, required: true, index: true }) date: Date;
  @Prop({ required: true, trim: true, maxlength: 120 }) sessionTitle: string;
  @Prop({
    type: String,
    enum: ["present", "absent", "excused"],
    required: true,
  })
  status: "present" | "absent" | "excused";
  @Prop({ trim: true, maxlength: 500, default: "" }) notes: string;
  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  recordedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type ClubAttendanceDocument = HydratedDocument<ClubAttendance>;
export const ClubAttendanceSchema =
  SchemaFactory.createForClass(ClubAttendance);
ClubAttendanceSchema.index(
  { clubId: 1, studentId: 1, date: 1, sessionTitle: 1 },
  { unique: true },
);

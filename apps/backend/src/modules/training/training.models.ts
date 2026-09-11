import { Schema, Types } from "mongoose";
import type { Plan, SetLog } from "./training.contracts";

export interface WorkoutPlanRecord {
  coachId: Types.ObjectId;
  version: number;
  versions: Array<{
    version: number;
    mutationId: string;
    createdAt: Date;
    plan: Plan;
  }>;
}
export interface WorkoutAssignmentRecord {
  coachId: Types.ObjectId;
  athleteId: Types.ObjectId;
  planId: Types.ObjectId;
  version: number;
  snapshot: Plan;
  startsAt: Date;
  endsAt: Date;
  status: "active" | "revoked";
  consentAt: Date | null;
  consentVersion: string | null;
  mutationId: string;
  relationship: { type: "booking" | "package" | "class"; id: string };
}
export interface WorkoutSessionRecord {
  athleteId: Types.ObjectId;
  clientId: string;
  assignmentId: Types.ObjectId;
  dayId: string;
  snapshot: Plan;
  revision: number;
  mutations: string[];
  startedAt: Date;
  finishedAt: Date | null;
  status: "active" | "completed" | "discarded";
  sets: SetLog[];
  note: string;
  effort?: "easy" | "balanced" | "hard" | null;
  followUpRequested?: boolean;
  coachReview?: { text: string; reviewedAt: Date; revision: number };
}
const oid = Schema.Types.ObjectId;
export const WorkoutPlanSchema = new Schema<WorkoutPlanRecord>(
  {
    coachId: { type: oid, required: true, index: true },
    version: { type: Number, required: true },
    versions: {
      type: [
        new Schema(
          {
            version: Number,
            mutationId: String,
            createdAt: Date,
            plan: Schema.Types.Mixed,
          },
          { _id: false },
        ),
      ],
      required: true,
    },
  },
  { collection: "workout_plans", timestamps: true },
);
export const WorkoutAssignmentSchema = new Schema<WorkoutAssignmentRecord>(
  {
    coachId: { type: oid, required: true, index: true },
    athleteId: { type: oid, required: true, index: true },
    planId: { type: oid, required: true },
    version: { type: Number, required: true },
    snapshot: { type: Schema.Types.Mixed, required: true },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    status: { type: String, enum: ["active", "revoked"], default: "active" },
    consentAt: { type: Date, default: null },
    consentVersion: { type: String, default: null },
    mutationId: { type: String, required: true },
    relationship: { type: Schema.Types.Mixed, required: true },
  },
  { collection: "workout_assignments", timestamps: true },
);
WorkoutAssignmentSchema.index(
  { coachId: 1, athleteId: 1, mutationId: 1 },
  { unique: true },
);
export const WorkoutSessionSchema = new Schema<WorkoutSessionRecord>(
  {
    athleteId: { type: oid, required: true, index: true },
    clientId: { type: String, required: true },
    assignmentId: { type: oid, required: true },
    dayId: { type: String, required: true },
    snapshot: { type: Schema.Types.Mixed, required: true },
    revision: { type: Number, required: true },
    mutations: { type: [String], default: [] },
    startedAt: { type: Date, required: true },
    finishedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["active", "completed", "discarded"],
      required: true,
    },
    sets: {
      type: [
        new Schema(
          {
            exerciseIndex: Number,
            setIndex: Number,
            reps: Number,
            weight: Number,
            done: Boolean,
          },
          { _id: false },
        ),
      ],
      default: [],
    },
    note: { type: String, default: "" },
    effort: {
      type: String,
      enum: ["easy", "balanced", "hard", null],
      default: null,
    },
    followUpRequested: { type: Boolean, default: false },
    coachReview: {
      type: new Schema(
        { text: String, reviewedAt: Date, revision: Number },
        { _id: false },
      ),
      default: undefined,
    },
  },
  { collection: "workout_sessions", timestamps: true },
);
WorkoutSessionSchema.index({ athleteId: 1, clientId: 1 }, { unique: true });
WorkoutSessionSchema.index({ athleteId: 1, startedAt: -1 });

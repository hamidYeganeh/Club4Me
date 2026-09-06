import { Schema } from "mongoose";

export const ProfessionalProfileSchema = new Schema(
  {
    audience: { type: String, default: "", maxlength: 1500 },
    goals: { type: [String], default: [] },
    levels: {
      type: [String],
      enum: ["beginner", "intermediate", "advanced", "competitive"],
      default: [],
    },
    prerequisites: { type: String, default: "", maxlength: 1500 },
    firstSession: { type: String, default: "", maxlength: 1500 },
    planning: { type: String, default: "", maxlength: 1500 },
    followUp: { type: String, default: "", maxlength: 1500 },
    progressTracking: { type: String, default: "", maxlength: 1500 },
    introductionVideoUrl: { type: String, default: "", maxlength: 1000 },
    credentials: {
      type: [
        new Schema(
          {
            title: { type: String, required: true, maxlength: 160 },
            issuer: { type: String, required: true, maxlength: 160 },
            year: { type: String, default: "", maxlength: 30 },
            expiresOn: { type: String, default: "" },
            mediaId: String,
          },
          { _id: false },
        ),
      ],
      default: [],
    },
    achievements: {
      type: [
        new Schema(
          {
            title: { type: String, required: true, maxlength: 200 },
            organization: { type: String, default: "", maxlength: 160 },
            year: { type: String, default: "", maxlength: 30 },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
    successStories: {
      type: [
        new Schema(
          {
            title: { type: String, required: true, maxlength: 160 },
            goal: { type: String, required: true, maxlength: 500 },
            duration: { type: String, required: true, maxlength: 100 },
            outcome: { type: String, required: true, maxlength: 1500 },
            consent: { type: Boolean, required: true, default: false },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
  },
  { _id: false },
);

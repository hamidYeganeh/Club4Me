export const coachLevelLabels = {
  beginner: "مبتدی",
  intermediate: "متوسط",
  advanced: "پیشرفته",
  competitive: "مسابقه‌ای",
} as const;

export type CoachProfessionalProfile = {
  audience: string;
  goals: string[];
  levels: Array<keyof typeof coachLevelLabels>;
  prerequisites: string;
  firstSession: string;
  planning: string;
  followUp: string;
  progressTracking: string;
  introductionVideoUrl: string;
  credentials: Array<{
    title: string;
    issuer: string;
    year: string;
    expiresOn: string;
    mediaId?: string;
  }>;
  achievements: Array<{ title: string; organization: string; year: string }>;
  successStories: Array<{
    title: string;
    goal: string;
    duration: string;
    outcome: string;
    consent: boolean;
  }>;
};

export function emptyCoachProfessionalProfile(): CoachProfessionalProfile {
  return {
    audience: "",
    goals: [],
    levels: [],
    prerequisites: "",
    firstSession: "",
    planning: "",
    followUp: "",
    progressTracking: "",
    introductionVideoUrl: "",
    credentials: [],
    achievements: [],
    successStories: [],
  };
}

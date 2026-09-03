import type { IconName } from "@theme/icon";

export type LandingPathStepId = "plan" | "meet" | "train";

export type LandingPathStep = {
  id: LandingPathStepId;
  icon: IconName;
};

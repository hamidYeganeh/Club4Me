import type { IconName } from "@theme/icon";

import { media } from "@/lib/media";

export type LandingProgramId = "strength" | "hiit" | "boxing" | "yoga";

export type LandingProgram = {
  id: LandingProgramId;
  icon: IconName;
  image: (typeof media.programs)[keyof typeof media.programs];
  span: string;
};

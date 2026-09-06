import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader";

import type { AthleteScreenHeaderSectionProps } from "./AthleteScreenHeaderSection.types";

export function AthleteScreenHeaderSection({
  title,
}: AthleteScreenHeaderSectionProps) {
  return (
    <SecondaryHeader
      title={title}
      showBack={false}
      showFilter={false}
    />
  );
}

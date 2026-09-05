import { ThemeToggle } from "@theme/theme-toggle";
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
      action={<ThemeToggle className="border-0 bg-transparent" />}
    />
  );
}

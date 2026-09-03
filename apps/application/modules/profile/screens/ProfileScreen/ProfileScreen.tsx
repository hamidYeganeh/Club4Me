import { Typography } from "@heroui/react";
import { AthletePlaceholderFeedSection } from "@modules/athlete/sections/AthletePlaceholderFeedSection";
import { ProfileHeroSection } from "@modules/profile/sections/ProfileHeroSection";

import type { ProfileScreenProps } from "./ProfileScreen.types";

export function ProfileScreen({ role }: ProfileScreenProps) {
  return (
    <main className="flex flex-1 flex-col bg-background">
      <ProfileHeroSection role={role} />
      <div className="px-5 pt-6">
        <Link
          href={`/${role}/profile/locations`}
          className="mb-5 flex items-center gap-3 rounded-2xl border border-border bg-surface p-4"
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-surface-secondary">
            <Icon name="map-pin-1" size={20} />
          </span>
          <Typography type="body" weight="bold" className="flex-1">لوکیشن‌های من</Typography>
          <Icon name="chevron-left" size={18} className="text-muted" />
        </Link>
        <AthletePlaceholderFeedSection />
      </div>
    </main>
  );
}
import Link from "next/link";
import { Icon } from "@theme/icon";

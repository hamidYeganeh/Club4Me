import { ProfileEditGeneralSection } from "@modules/profile/sections/ProfileEditGeneralSection";
import { ProfileEditHeroSection } from "@modules/profile/sections/ProfileEditHeroSection";

import type { ProfileEditScreenProps } from "./ProfileEditScreen.types";

export function ProfileEditScreen({ role }: ProfileEditScreenProps) {
  return (
    <main className="flex min-h-0 flex-1 flex-col bg-surface">
      <ProfileEditHeroSection role={role} />
      <ProfileEditGeneralSection role={role} />
    </main>
  );
}

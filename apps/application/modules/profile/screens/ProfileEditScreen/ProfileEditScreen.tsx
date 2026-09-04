import { ProfileEditGeneralSection } from "@modules/profile/sections/ProfileEditGeneralSection";
import { ProfileEditHeroSection } from "@modules/profile/sections/ProfileEditHeroSection";

import type { ProfileEditScreenProps } from "./ProfileEditScreen.types";

export function ProfileEditScreen({ role }: ProfileEditScreenProps) {
  return (
    <main className="flex min-h-0 w-full max-w-full flex-1 flex-col overflow-x-hidden bg-transparent">
      <ProfileEditHeroSection role={role} />
      <ProfileEditGeneralSection role={role} />
    </main>
  );
}

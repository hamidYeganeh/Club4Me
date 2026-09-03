import { AccountAuthOtpHeaderSection } from "@modules/account/sections/AccountAuthOtpHeaderSection";
import { Typography } from "@heroui/react";
import { getTranslations } from "next-intl/server";

import { getProfileEditFieldLabelKey } from "../../profile.utils";
import type { ProfileEditFieldScreenProps } from "./ProfileEditFieldScreen.types";

export async function ProfileEditFieldScreen({
  role,
  field,
}: ProfileEditFieldScreenProps) {
  const t = await getTranslations("profile");
  const tCommon = await getTranslations("common");
  const label = t(getProfileEditFieldLabelKey(field));

  return (
    <main className="flex min-h-0 flex-1 flex-col bg-background px-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <AccountAuthOtpHeaderSection
        backLabel={tCommon("back")}
        href={`/${role}/profile/edit`}
      />
      <div className="flex flex-1 flex-col items-center px-4 pt-10 text-center">
        <Typography type="h2">{label}</Typography>
        <Typography type="body-sm" color="muted" className="mt-3 max-w-xs">{t("editFieldHint")}</Typography>
      </div>
    </main>
  );
}

import { AccountAuthOtpHeaderSection } from "@modules/account/sections/AccountAuthOtpHeaderSection";
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
    <main className="flex min-h-0 w-full max-w-full flex-1 flex-col overflow-x-hidden bg-transparent px-5">
      <AccountAuthOtpHeaderSection
        backLabel={tCommon("back")}
        href={`/${role}/profile/edit`}
      />
      <div className="app-reveal flex flex-1 flex-col items-center px-4 pt-10 text-center">
        <h1 className="text-2xl font-bold">{label}</h1>
        <p className="mt-3 max-w-xs text-sm text-muted">{t("editFieldHint")}</p>
      </div>
    </main>
  );
}

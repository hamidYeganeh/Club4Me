"use client";

import { useRouter } from "next/navigation";
import { AccountAuthRolesCopySection } from "@modules/account/sections/AccountAuthRolesCopySection";
import { AccountAuthRolesOptionsSection } from "@modules/account/sections/AccountAuthRolesOptionsSection";
import { useTranslations } from "next-intl";

import { AuthScreen } from "@/components/auth-screen";

export function AccountAuthRolesScreen() {
  const router = useRouter();
  const t = useTranslations("auth.roles");

  return (
    <AuthScreen>
      <AccountAuthRolesCopySection title={t("title")} subtitle={t("subtitle")} />
      <AccountAuthRolesOptionsSection
        athleteLabel={t("athlete")}
        coachLabel={t("coach")}
        ownerLabel={t("owner")}
        onAthlete={() => {
          router.replace("/athlete");
        }}
      />
    </AuthScreen>
  );
}

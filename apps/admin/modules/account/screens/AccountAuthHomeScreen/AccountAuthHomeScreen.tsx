"use client";

import { AccountAuthHomeActionsSection } from "@modules/account/sections/AccountAuthHomeActionsSection";
import { AccountAuthOtpCopySection } from "@modules/account/sections/AccountAuthOtpCopySection";
import { useTranslations } from "next-intl";

import { AuthScreen } from "@/components/auth-screen";

export function AccountAuthHomeScreen() {
  const t = useTranslations("auth.home");
  const tPanel = useTranslations("auth.panel");
  const tApps = useTranslations("apps");

  return (
    <AuthScreen title={tPanel("adminTitle")} subtitle={tPanel("adminTagline")}>
      <AccountAuthOtpCopySection
        titleId="account-auth-home-title"
        title={tApps("admin")}
        subtitle={tPanel("adminTagline")}
      />
      <AccountAuthHomeActionsSection
        otpLabel={t("loginWithOtp")}
        passwordLabel={t("loginWithPassword")}
      />
    </AuthScreen>
  );
}

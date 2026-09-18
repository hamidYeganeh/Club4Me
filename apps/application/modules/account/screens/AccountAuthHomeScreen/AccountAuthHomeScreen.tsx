"use client";

import { AccountAuthHomeActionsSection } from "@modules/account/sections/AccountAuthHomeActionsSection";
import { AccountAuthOtpHeaderSection } from "@modules/account/sections/AccountAuthOtpHeaderSection";
import { AuthPageIntro } from "@/components/auth-page-intro";
import { AuthScreen } from "@/components/auth-screen";
import { useTranslations } from "next-intl";

export function AccountAuthHomeScreen() {
  const t = useTranslations("auth.home");
  const common = useTranslations("common");

  return (
    <AuthScreen>
      <AccountAuthOtpHeaderSection
        backLabel={common("back")}
        href="/welcome"
        overlay
        transparent
      />
      <AuthPageIntro
        title="خوش آمدید"
        subtitle="روش ورود به حساب خود را انتخاب کنید."
        titleId="account-auth-home-title"
      />
      <AccountAuthHomeActionsSection
        otpLabel={t("loginWithOtp")}
        passwordLabel={t("loginWithPassword")}
      />
    </AuthScreen>
  );
}

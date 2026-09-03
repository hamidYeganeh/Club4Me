"use client";

import { useRouter } from "next/navigation";
import { AccountAuthOtpForm } from "@modules/account/forms/AccountAuthOtpForm";
import { AccountAuthOtpCopySection } from "@modules/account/sections/AccountAuthOtpCopySection";
import { AccountAuthOtpHeaderSection } from "@modules/account/sections/AccountAuthOtpHeaderSection";
import { useTranslations } from "next-intl";

import { AuthScreen } from "@/components/auth-screen";

export function AccountAuthOtpScreen() {
  const router = useRouter();
  const t = useTranslations("auth.otp");
  const tPanel = useTranslations("auth.panel");
  const tCommon = useTranslations("common");

  return (
    <AuthScreen title={tPanel("adminTitle")} subtitle={tPanel("adminTagline")}>
      <AccountAuthOtpHeaderSection backLabel={tCommon("back")} href="/auth" />
      <AccountAuthOtpCopySection title={t("title")} subtitle={t("subtitle")} />
      <AccountAuthOtpForm
        phoneLabel={t("phoneLabel")}
        phonePlaceholder={t("phonePlaceholder")}
        countryLabel={t("countryLabel")}
        iranLabel={t("iran")}
        continueLabel={t("continue")}
        legend={t("legend")}
        phoneRequired={t("phoneRequired")}
        phoneInvalid={t("phoneInvalid")}
        onSuccess={(phone) => {
          router.push(`/auth/otp/confirm?phone=${encodeURIComponent(phone)}`);
        }}
      />
    </AuthScreen>
  );
}

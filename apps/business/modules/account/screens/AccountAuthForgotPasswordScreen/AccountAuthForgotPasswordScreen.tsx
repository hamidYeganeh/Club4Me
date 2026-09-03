"use client";

import { useRouter } from "next/navigation";
import { AccountAuthForgotPasswordForm } from "@modules/account/forms/AccountAuthForgotPasswordForm";
import { AccountAuthForgotPasswordSupportSection } from "@modules/account/sections/AccountAuthForgotPasswordSupportSection";
import { AccountAuthOtpCopySection } from "@modules/account/sections/AccountAuthOtpCopySection";
import { AccountAuthOtpHeaderSection } from "@modules/account/sections/AccountAuthOtpHeaderSection";
import { useTranslations } from "next-intl";

import { AuthScreen } from "@/components/auth-screen";

export function AccountAuthForgotPasswordScreen() {
  const router = useRouter();
  const t = useTranslations("auth.forgot");
  const tPanel = useTranslations("auth.panel");
  const tCommon = useTranslations("common");

  return (
    <AuthScreen title={tPanel("businessTitle")} subtitle={tPanel("businessTagline")}>
      <AccountAuthOtpHeaderSection
        backLabel={tCommon("back")}
        href="/auth/login"
      />
      <AccountAuthOtpCopySection
        titleId="account-auth-forgot-title"
        title={t("title")}
        subtitle={t("subtitle")}
      />
      <AccountAuthForgotPasswordForm
        phoneLabel={t("phoneLabel")}
        phonePlaceholder={t("phonePlaceholder")}
        submitLabel={t("submit")}
        legend={t("legend")}
        phoneRequired={t("phoneRequired")}
        phoneInvalid={t("phoneInvalid")}
        onSuccess={(phone) => {
          router.push(
            `/auth/forgot-password/confirm?phone=${encodeURIComponent(phone)}`,
          );
        }}
      />
      <AccountAuthForgotPasswordSupportSection
        hint={t("noPhoneHint")}
        contactPrefix={t("contactPrefix")}
        supportEmail={t("supportEmail")}
      />
    </AuthScreen>
  );
}

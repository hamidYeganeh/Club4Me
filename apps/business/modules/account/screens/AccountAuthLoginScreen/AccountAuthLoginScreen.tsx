"use client";

import { useRouter } from "next/navigation";
import { AccountAuthLoginForm } from "@modules/account/forms/AccountAuthLoginForm";
import { AccountAuthOtpCopySection } from "@modules/account/sections/AccountAuthOtpCopySection";
import { AccountAuthOtpHeaderSection } from "@modules/account/sections/AccountAuthOtpHeaderSection";
import { useTranslations } from "next-intl";

import { AuthScreen } from "@/components/auth-screen";

export function AccountAuthLoginScreen() {
  const router = useRouter();
  const t = useTranslations("auth.login");
  const tPanel = useTranslations("auth.panel");
  const tCommon = useTranslations("common");

  return (
    <AuthScreen title={tPanel("businessTitle")} subtitle={tPanel("businessTagline")}>
      <AccountAuthOtpHeaderSection backLabel={tCommon("back")} href="/auth" />
      <AccountAuthOtpCopySection
        titleId="account-auth-login-title"
        title={t("title")}
        subtitle={tPanel("businessTagline")}
      />
      <AccountAuthLoginForm
        phoneLabel={t("phoneLabel")}
        phonePlaceholder={t("phonePlaceholder")}
        passwordLabel={t("passwordLabel")}
        passwordPlaceholder={t("passwordPlaceholder")}
        showPassword={t("showPassword")}
        hidePassword={t("hidePassword")}
        rememberLabel={t("remember")}
        forgotLabel={t("forgot")}
        submitLabel={t("submit")}
        legend={t("legend")}
        phoneRequired={t("phoneRequired")}
        phoneInvalid={t("phoneInvalid")}
        passwordRequired={t("passwordRequired")}
        passwordMin={t("passwordMin")}
        onSuccess={() => {
          router.replace("/");
        }}
      />
    </AuthScreen>
  );
}

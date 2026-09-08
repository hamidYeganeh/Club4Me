"use client";

import { useRouter } from "next/navigation";
import { AccountAuthForgotPasswordForm } from "@modules/account/forms/AccountAuthForgotPasswordForm";
import { AccountAuthForgotPasswordSupportSection } from "@modules/account/sections/AccountAuthForgotPasswordSupportSection";
import { AccountAuthOtpHeaderSection } from "@modules/account/sections/AccountAuthOtpHeaderSection";
import { AuthPageIntro } from "@/components/auth-page-intro";
import { useTranslations } from "next-intl";

import { AuthScreen } from "@/components/auth-screen";
import { useKeyboardOpen } from "@/hooks/use-keyboard-inset";

const ACCOUNT_AUTH_FORGOT_FORM_ID = "account-auth-forgot-form";

export function AccountAuthForgotPasswordScreen() {
  const router = useRouter();
  const t = useTranslations("auth.forgot");
  const tCommon = useTranslations("common");
  const isKeyboardOpen = useKeyboardOpen();

  return (
    <AuthScreen>
      <AccountAuthOtpHeaderSection
        backLabel={tCommon("back")}
        href="/auth/login"
        overlay
        transparent
      />
      <AuthPageIntro
        titleId="account-auth-forgot-title"
        title={t("title")}
        subtitle={t("subtitle")}
        keyboardOpen={isKeyboardOpen}
      />
      <AccountAuthForgotPasswordForm
        formId={ACCOUNT_AUTH_FORGOT_FORM_ID}
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
      {!isKeyboardOpen ? (
        <AccountAuthForgotPasswordSupportSection
          hint={t("noPhoneHint")}
          contactPrefix={t("contactPrefix")}
          supportEmail={t("supportEmail")}
        />
      ) : null}
    </AuthScreen>
  );
}

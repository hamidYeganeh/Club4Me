"use client";

import { useRouter } from "next/navigation";
import { AccountAuthForgotPasswordForm } from "@modules/account/forms/AccountAuthForgotPasswordForm";
import { AccountAuthForgotPasswordSupportSection } from "@modules/account/sections/AccountAuthForgotPasswordSupportSection";
import { AccountAuthOtpCopySection } from "@modules/account/sections/AccountAuthOtpCopySection";
import { AccountAuthOtpHeaderSection } from "@modules/account/sections/AccountAuthOtpHeaderSection";
import { AccountAuthOtpHeroSection } from "@modules/account/sections/AccountAuthOtpHeroSection";
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
      <AccountAuthOtpHeroSection
        alt={t("illustrationAlt")}
        src="/auth/club-access-iran-v2.png"
        width={1086}
        height={1448}
        size={isKeyboardOpen ? "compact" : "default"}
      />
      <AccountAuthOtpCopySection
        titleId="account-auth-forgot-title"
        title={t("title")}
        subtitle={t("subtitle")}
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

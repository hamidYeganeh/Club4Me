"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { AccountAuthLoginForm } from "@modules/account/forms/AccountAuthLoginForm";
import { AccountAuthMethodActionsSection } from "@modules/account/sections/AccountAuthMethodActionsSection";
import { AccountAuthOtpHeaderSection } from "@modules/account/sections/AccountAuthOtpHeaderSection";
import { AuthPageIntro } from "@/components/auth-page-intro";
import { useTranslations } from "next-intl";

import { AuthScreen } from "@/components/auth-screen";
import { useKeyboardOpen } from "@/hooks/use-keyboard-inset";
import { completeAuthenticationPath } from "@/lib/auth-return-path";

const ACCOUNT_AUTH_LOGIN_FORM_ID = "account-auth-login-form";

export function AccountAuthLoginScreen() {
  const router = useRouter();
  const t = useTranslations("auth.login");
  const tHome = useTranslations("auth.home");
  const tCommon = useTranslations("common");
  const isKeyboardOpen = useKeyboardOpen();
  const [submitState, setSubmitState] = useState({
    isBusy: false,
    isPending: false,
  });

  const handleSubmitStateChange = useCallback(
    (state: { isBusy: boolean; isPending: boolean }) => {
      setSubmitState(state);
    },
    [],
  );

  return (
    <AuthScreen>
      <AccountAuthOtpHeaderSection
        backLabel={tCommon("back")}
        href="/auth"
        overlay
        transparent
      />
      <AuthPageIntro
        title={t("title")}
        subtitle={t("subtitle")}
        titleId="account-auth-login-title"
        keyboardOpen={isKeyboardOpen}
      />
      <AccountAuthLoginForm
        formId={ACCOUNT_AUTH_LOGIN_FORM_ID}
        phoneLabel={t("phoneLabel")}
        phonePlaceholder={t("phonePlaceholder")}
        passwordLabel={t("passwordLabel")}
        passwordPlaceholder={t("passwordPlaceholder")}
        showPassword={t("showPassword")}
        hidePassword={t("hidePassword")}
        rememberLabel={t("remember")}
        forgotLabel={t("forgot")}
        legend={t("legend")}
        phoneRequired={t("phoneRequired")}
        phoneInvalid={t("phoneInvalid")}
        passwordRequired={t("passwordRequired")}
        passwordMin={t("passwordMin")}
        onSubmitStateChange={handleSubmitStateChange}
        onSuccess={(user) => {
          router.replace(completeAuthenticationPath(user));
        }}
      />
      <AccountAuthMethodActionsSection
        formId={ACCOUNT_AUTH_LOGIN_FORM_ID}
        submitLabel={t("submit")}
        alternateLabel={tHome("loginWithOtp")}
        orLabel={tHome("or")}
        isBusy={submitState.isBusy}
        isPending={submitState.isPending}
        showAlternate={!isKeyboardOpen}
        onAlternatePress={() => router.push("/auth/otp")}
      />
    </AuthScreen>
  );
}

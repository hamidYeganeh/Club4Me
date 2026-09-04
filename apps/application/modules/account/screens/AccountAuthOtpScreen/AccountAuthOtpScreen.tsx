"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { AccountAuthOtpForm } from "@modules/account/forms/AccountAuthOtpForm";
import { AccountAuthMethodActionsSection } from "@modules/account/sections/AccountAuthMethodActionsSection";
import { AccountAuthOtpCopySection } from "@modules/account/sections/AccountAuthOtpCopySection";
import { AccountAuthOtpHeaderSection } from "@modules/account/sections/AccountAuthOtpHeaderSection";
import { AccountAuthOtpHeroSection } from "@modules/account/sections/AccountAuthOtpHeroSection";
import { useTranslations } from "next-intl";

import { AuthScreen } from "@/components/auth-screen";
import { useKeyboardOpen } from "@/hooks/use-keyboard-inset";

const ACCOUNT_AUTH_OTP_FORM_ID = "account-auth-otp-form";

export function AccountAuthOtpScreen() {
  const router = useRouter();
  const t = useTranslations("auth.otp");
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
      <AccountAuthOtpHeroSection
        alt={t("illustrationAlt")}
        size={isKeyboardOpen ? "compact" : "default"}
      />
      <AccountAuthOtpCopySection
        title={t("title")}
        subtitle={t("subtitle")}
        titleId="account-auth-otp-title"
      />
      <AccountAuthOtpForm
        formId={ACCOUNT_AUTH_OTP_FORM_ID}
        phoneLabel={t("phoneLabel")}
        phonePlaceholder={t("phonePlaceholder")}
        legend={t("legend")}
        phoneRequired={t("phoneRequired")}
        phoneInvalid={t("phoneInvalid")}
        onSubmitStateChange={handleSubmitStateChange}
        onSuccess={(phone) => {
          router.push(`/auth/otp/confirm?phone=${encodeURIComponent(phone)}`);
        }}
      />
      <AccountAuthMethodActionsSection
        formId={ACCOUNT_AUTH_OTP_FORM_ID}
        submitLabel={t("continue")}
        alternateLabel={tHome("loginWithPassword")}
        orLabel={tHome("or")}
        isBusy={submitState.isBusy}
        isPending={submitState.isPending}
        showAlternate={!isKeyboardOpen}
        onAlternatePress={() => router.push("/auth/login")}
      />
    </AuthScreen>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AccountAuthForgotPasswordConfirmForm } from "@modules/account/forms/AccountAuthForgotPasswordConfirmForm";
import { AccountAuthOtpCopySection } from "@modules/account/sections/AccountAuthOtpCopySection";
import { AccountAuthOtpHeaderSection } from "@modules/account/sections/AccountAuthOtpHeaderSection";
import { AccountAuthOtpHeroSection } from "@modules/account/sections/AccountAuthOtpHeroSection";
import { useTranslations } from "next-intl";

import { AuthScreen } from "@/components/auth-screen";
import { useKeyboardOpen } from "@/hooks/use-keyboard-inset";
import {
  isValidIranianPhone,
  maskIranianPhone,
  toE164IranianPhone,
} from "@/lib/phone";

export function AccountAuthForgotPasswordConfirmScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("auth.forgot");
  const tConfirm = useTranslations("auth.forgot.confirm");
  const tCommon = useTranslations("common");
  const isKeyboardOpen = useKeyboardOpen();

  const phoneParam = searchParams.get("phone") ?? "";
  const phone = isValidIranianPhone(phoneParam)
    ? toE164IranianPhone(phoneParam)
    : null;

  useEffect(() => {
    if (!phone) {
      router.replace("/auth/forgot-password");
    }
  }, [phone, router]);

  if (!phone) {
    return null;
  }

  return (
    <AuthScreen>
      <AccountAuthOtpHeaderSection
        backLabel={tCommon("back")}
        href="/auth/forgot-password"
        transparent
      />
      <AccountAuthOtpHeroSection
        alt={t("illustrationAlt")}
        src="/auth/forgot-password-illustration.png"
        width={208}
        height={266}
        size={isKeyboardOpen ? "compact" : "default"}
      />
      <AccountAuthOtpCopySection
        titleId="account-auth-forgot-confirm-title"
        title={tConfirm("title")}
        subtitle={tConfirm("subtitle", { phone: maskIranianPhone(phone) })}
      />
      <AccountAuthForgotPasswordConfirmForm
        phone={phone}
        codeLabel={tConfirm("codeLabel")}
        legend={tConfirm("legend")}
        passwordLabel={tConfirm("passwordLabel")}
        passwordPlaceholder={tConfirm("passwordPlaceholder")}
        passwordConfirmLabel={tConfirm("passwordConfirmLabel")}
        passwordConfirmPlaceholder={tConfirm("passwordConfirmPlaceholder")}
        showPassword={tConfirm("showPassword")}
        hidePassword={tConfirm("hidePassword")}
        submitLabel={tConfirm("submit")}
        resendLabel={tConfirm("resend")}
        resendInPrefix={tConfirm("resendInPrefix")}
        resendInSuffix={tConfirm("resendInSuffix")}
        codeRequired={tConfirm("codeRequired")}
        codeInvalid={tConfirm("codeInvalid")}
        passwordRequired={tConfirm("passwordRequired")}
        passwordMin={tConfirm("passwordMin")}
        passwordMismatch={tConfirm("passwordMismatch")}
        sent={t("sent")}
        onSuccess={() => {
          router.replace("/auth/roles");
        }}
      />
    </AuthScreen>
  );
}

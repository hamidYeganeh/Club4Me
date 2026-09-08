"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@heroui/react";
import { AccountAuthForgotPasswordConfirmForm } from "@modules/account/forms/AccountAuthForgotPasswordConfirmForm";
import { AccountAuthOtpCopySection } from "@modules/account/sections/AccountAuthOtpCopySection";
import { AccountAuthOtpHeaderSection } from "@modules/account/sections/AccountAuthOtpHeaderSection";
import { AuthPageIntro } from "@/components/auth-page-intro";
import { Icon } from "@theme/icon";
import { useTranslations } from "next-intl";

import { AuthScreen } from "@/components/auth-screen";
import { useKeyboardOpen } from "@/hooks/use-keyboard-inset";
import {
  formatIranianPhoneDisplay,
  isValidIranianPhone,
  normalizeIranianPhone,
  toE164IranianPhone,
} from "@/lib/phone";
import { completeAuthenticationPath } from "@/lib/auth-return-path";

const ACCOUNT_AUTH_FORGOT_CONFIRM_FORM_ID = "account-auth-forgot-confirm-form";

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

  const phoneDisplay = formatIranianPhoneDisplay(
    `0${normalizeIranianPhone(phone)}`,
  );

  return (
    <AuthScreen>
      <AccountAuthOtpHeaderSection
        backLabel={tCommon("back")}
        href="/auth/forgot-password"
        overlay
        transparent
      />
      <AuthPageIntro
        titleId="account-auth-forgot-confirm-title"
        title={tConfirm("title")}
        keyboardOpen={isKeyboardOpen}
      />
      <div className="mt-1 mb-4 flex items-center justify-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5">
        <span
          dir="ltr"
          className="text-sm font-medium tracking-wide text-foreground tabular-nums"
        >
          {phoneDisplay}
        </span>
        <span aria-hidden className="h-3 w-px bg-separator" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={tConfirm("editPhone")}
          className="h-auto min-h-0 gap-1 px-1 py-0.5 text-accent"
          onPress={() => router.push("/auth/forgot-password")}
        >
          <Icon name="pencil-1" size={14} />
          {tConfirm("editPhone")}
        </Button>
      </div>
      <AccountAuthOtpCopySection subtitle={tConfirm("subtitle")} />
      <AccountAuthForgotPasswordConfirmForm
        formId={ACCOUNT_AUTH_FORGOT_CONFIRM_FORM_ID}
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
        onSuccess={(user) => {
          router.replace(completeAuthenticationPath(user));
        }}
        sent={t("sent")}
      />
    </AuthScreen>
  );
}

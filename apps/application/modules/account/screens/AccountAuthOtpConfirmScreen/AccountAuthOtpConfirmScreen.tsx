"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@heroui/react";
import { AccountAuthOtpConfirmForm } from "@modules/account/forms/AccountAuthOtpConfirmForm";
import { AccountAuthOtpCopySection } from "@modules/account/sections/AccountAuthOtpCopySection";
import { AccountAuthOtpHeroSection } from "@modules/account/sections/AccountAuthOtpHeroSection";
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

const ACCOUNT_AUTH_OTP_CONFIRM_FORM_ID = "account-auth-otp-confirm-form";

export function AccountAuthOtpConfirmScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("auth.otp");
  const tConfirm = useTranslations("auth.otp.confirm");
  const isKeyboardOpen = useKeyboardOpen();

  const phoneParam = searchParams.get("phone") ?? "";
  const phone = isValidIranianPhone(phoneParam)
    ? toE164IranianPhone(phoneParam)
    : null;

  useEffect(() => {
    if (!phone) {
      router.replace("/auth/otp");
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
      <AccountAuthOtpHeroSection
        alt={t("illustrationAlt")}
        size={isKeyboardOpen ? "compact" : "default"}
      />
      <AccountAuthOtpCopySection
        titleId="account-auth-otp-confirm-title"
        title={tConfirm("title")}
        cue={false}
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
          onPress={() => router.push("/auth/otp")}
        >
          <Icon name="pencil-1" size={14} />
          {tConfirm("editPhone")}
        </Button>
      </div>
      <AccountAuthOtpCopySection subtitle={tConfirm("subtitle")} />
      <AccountAuthOtpConfirmForm
        formId={ACCOUNT_AUTH_OTP_CONFIRM_FORM_ID}
        phone={phone}
        codeLabel={tConfirm("codeLabel")}
        legend={tConfirm("legend")}
        resendLabel={tConfirm("resend")}
        resendInPrefix={tConfirm("resendInPrefix")}
        resendInSuffix={tConfirm("resendInSuffix")}
        continueLabel={t("continue")}
        codeRequired={tConfirm("codeRequired")}
        codeInvalid={tConfirm("codeInvalid")}
        sent={t("sent")}
        onSuccess={() => {
          router.replace("/auth/roles");
        }}
      />
    </AuthScreen>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AccountAuthOtpConfirmForm } from "@modules/account/forms/AccountAuthOtpConfirmForm";
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

export function AccountAuthOtpConfirmScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("auth.otp");
  const tConfirm = useTranslations("auth.otp.confirm");
  const tCommon = useTranslations("common");
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

  return (
    <AuthScreen>
      <AccountAuthOtpHeaderSection backLabel={tCommon("back")} href="/auth/otp" />
      <AccountAuthOtpCopySection
        titleId="account-auth-otp-confirm-title"
        title={tConfirm("title")}
        subtitle={tConfirm("sentTo", { phone: maskIranianPhone(phone) })}
      />
      <AccountAuthOtpHeroSection
        alt={t("illustrationAlt")}
        size={isKeyboardOpen ? "compact" : "default"}
      />
      <AccountAuthOtpConfirmForm
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

"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AccountAuthOtpConfirmForm } from "@modules/account/forms/AccountAuthOtpConfirmForm";
import { AccountAuthOtpCopySection } from "@modules/account/sections/AccountAuthOtpCopySection";
import { AccountAuthOtpHeaderSection } from "@modules/account/sections/AccountAuthOtpHeaderSection";
import { useTranslations } from "next-intl";

import { AuthScreen } from "@/components/auth-screen";
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
  const tPanel = useTranslations("auth.panel");
  const tCommon = useTranslations("common");

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
    <AuthScreen title={tPanel("adminTitle")} subtitle={tPanel("adminTagline")}>
      <AccountAuthOtpHeaderSection
        backLabel={tCommon("back")}
        href="/auth/otp"
      />
      <AccountAuthOtpCopySection
        titleId="account-auth-otp-confirm-title"
        title={tConfirm("title")}
        subtitle={tConfirm("sentTo", { phone: maskIranianPhone(phone) })}
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
          router.replace("/");
        }}
      />
    </AuthScreen>
  );
}

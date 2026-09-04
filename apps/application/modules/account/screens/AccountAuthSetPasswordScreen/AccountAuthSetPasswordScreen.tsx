"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@heroui/react";
import { tokenStore } from "@api";
import { useAccountMe } from "@api/account";
import { AccountAuthSetPasswordForm } from "@modules/account/forms/AccountAuthSetPasswordForm";
import { AccountAuthOtpCopySection } from "@modules/account/sections/AccountAuthOtpCopySection";
import { AccountAuthOtpHeroSection } from "@modules/account/sections/AccountAuthOtpHeroSection";
import { useTranslations } from "next-intl";

import { AuthScreen } from "@/components/auth-screen";
import { useKeyboardOpen } from "@/hooks/use-keyboard-inset";
import { ROLES_PATH } from "@/lib/post-auth-path";
import { AUTH_PATH } from "@/lib/welcome-onboarding";

const ACCOUNT_AUTH_SET_PASSWORD_FORM_ID = "account-auth-set-password-form";

export function AccountAuthSetPasswordScreen() {
  const router = useRouter();
  const t = useTranslations("auth.setPassword");
  const tCommon = useTranslations("common");
  const isKeyboardOpen = useKeyboardOpen();
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  const me = useAccountMe(hasToken === true);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setHasToken(Boolean(tokenStore.get()));
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (hasToken === false || me.isError) {
      tokenStore.clear();
      router.replace(AUTH_PATH);
    }
  }, [hasToken, me.isError, router]);

  useEffect(() => {
    if (me.data?.hasPassword) {
      router.replace(ROLES_PATH);
    }
  }, [me.data?.hasPassword, router]);

  if (
    hasToken === null ||
    hasToken === false ||
    me.isError ||
    me.isLoading ||
    !me.data ||
    me.data.hasPassword
  ) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center">
        <Spinner size="lg" aria-label={tCommon("loading")} />
      </div>
    );
  }

  return (
    <AuthScreen>
      <AccountAuthOtpHeroSection
        alt={t("illustrationAlt")}
        src="/auth/club-access-iran-v2.png"
        width={1086}
        height={1448}
        size={isKeyboardOpen ? "compact" : "default"}
      />
      <AccountAuthOtpCopySection
        titleId="account-auth-set-password-title"
        title={t("title")}
        subtitle={t("subtitle")}
      />
      <AccountAuthSetPasswordForm
        formId={ACCOUNT_AUTH_SET_PASSWORD_FORM_ID}
        legend={t("legend")}
        passwordLabel={t("passwordLabel")}
        passwordPlaceholder={t("passwordPlaceholder")}
        passwordConfirmLabel={t("passwordConfirmLabel")}
        passwordConfirmPlaceholder={t("passwordConfirmPlaceholder")}
        showPassword={t("showPassword")}
        hidePassword={t("hidePassword")}
        submitLabel={t("submit")}
        passwordRequired={t("passwordRequired")}
        passwordMin={t("passwordMin")}
        passwordMismatch={t("passwordMismatch")}
        strengthLabels={{
          empty: t("strength.empty"),
          weak: t("strength.weak"),
          fair: t("strength.fair"),
          good: t("strength.good"),
          strong: t("strength.strong"),
        }}
        onSuccess={() => {
          router.replace(ROLES_PATH);
        }}
      />
    </AuthScreen>
  );
}

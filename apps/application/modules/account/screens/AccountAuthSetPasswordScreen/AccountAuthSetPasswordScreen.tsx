"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, tokenStore } from "@api";
import { useAccountMe } from "@api/account";
import { AccountAuthSetPasswordForm } from "@modules/account/forms/AccountAuthSetPasswordForm";
import { AuthPageIntro } from "@/components/auth-page-intro";
import { useTranslations } from "next-intl";

import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader";
import { AuthScreen } from "@/components/auth-screen";
import { useKeyboardOpen } from "@/hooks/use-keyboard-inset";
import { FIRST_TIME_ROLES_PATH } from "@/lib/post-auth-path";
import { completeAuthenticationPath } from "@/lib/auth-return-path";
import { AUTH_PATH } from "@/lib/welcome-onboarding";
import { AuthScreenSkeleton } from "@/components/loading-skeletons";
import { RequestFailureState } from "@/components/request-failure-state";
import { getQueryFailure } from "@/lib/request-failure";

const ACCOUNT_AUTH_SET_PASSWORD_FORM_ID = "account-auth-set-password-form";

export function AccountAuthSetPasswordScreen() {
  const router = useRouter();
  const t = useTranslations("auth.setPassword");
  const isKeyboardOpen = useKeyboardOpen();
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  const me = useAccountMe(hasToken === true);
  const sessionExpired =
    me.error instanceof ApiError && me.error.status === 401;
  const failure = getQueryFailure(me.error, me.fetchStatus);
  const observedMissingPassword = useRef(false);
  const navigated = useRef(false);
  const finish = useCallback(
    (firstTime: boolean) => {
      if (!me.data || navigated.current) return;
      navigated.current = true;
      router.replace(
        completeAuthenticationPath(
          { ...me.data, hasPassword: true },
          firstTime ? FIRST_TIME_ROLES_PATH : undefined,
        ),
      );
    },
    [me.data, router],
  );

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setHasToken(Boolean(tokenStore.get()));
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (hasToken === false || sessionExpired) {
      tokenStore.clear();
      router.replace(AUTH_PATH);
    }
  }, [hasToken, sessionExpired, router]);

  useEffect(() => {
    if (!me.data) {
      return;
    }

    if (!me.data.hasPassword) {
      observedMissingPassword.current = true;
    } else {
      finish(observedMissingPassword.current);
    }
  }, [me.data, finish]);

  if (failure && !sessionExpired && !me.data)
    return (
      <main className="app-page justify-center">
        <RequestFailureState
          error={failure}
          onRetry={() => void me.refetch()}
        />
      </main>
    );

  if (
    hasToken === null ||
    hasToken === false ||
    sessionExpired ||
    me.isLoading ||
    !me.data ||
    me.data.hasPassword
  ) {
    return <AuthScreenSkeleton />;
  }

  return (
    <AuthScreen>
      <SecondaryHeader
        title="تعیین رمز عبور"
        showFilter={false}
        showBack={false}
      />
      <AuthPageIntro
        titleId="account-auth-set-password-title"
        title={t("title")}
        subtitle={t("subtitle")}
        keyboardOpen={isKeyboardOpen}
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
          finish(true);
        }}
      />
    </AuthScreen>
  );
}

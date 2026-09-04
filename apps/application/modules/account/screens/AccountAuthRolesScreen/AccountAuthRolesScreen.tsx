"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@heroui/react";
import { tokenStore } from "@api";
import { useAccountMe } from "@api/account";
import { AccountAuthOtpHeaderSection } from "@modules/account/sections/AccountAuthOtpHeaderSection";
import { AccountAuthRolesCopySection } from "@modules/account/sections/AccountAuthRolesCopySection";
import { AccountAuthRolesOptionsSection } from "@modules/account/sections/AccountAuthRolesOptionsSection";
import { useTranslations } from "next-intl";

import { AuthScreen } from "@/components/auth-screen";
import { SET_PASSWORD_PATH } from "@/lib/post-auth-path";
import { AUTH_PATH } from "@/lib/welcome-onboarding";

export function AccountAuthRolesScreen() {
  const router = useRouter();
  const t = useTranslations("auth.roles");
  const tCommon = useTranslations("common");
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
    if (me.data && !me.data.hasPassword) {
      router.replace(SET_PASSWORD_PATH);
    }
  }, [me.data, router]);

  if (
    hasToken === null ||
    hasToken === false ||
    me.isError ||
    me.isLoading ||
    !me.data ||
    !me.data.hasPassword
  ) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center">
        <Spinner size="lg" aria-label={tCommon("loading")} />
      </div>
    );
  }

  return (
    <AuthScreen>
      <AccountAuthOtpHeaderSection
        backLabel={tCommon("back")}
        href="/auth"
        overlay
        transparent
      />
      <AccountAuthRolesCopySection title={t("title")} subtitle={t("subtitle")} />
      <AccountAuthRolesOptionsSection
        athleteLabel={t("athlete")}
        coachLabel={t("coach")}
        ownerLabel={t("owner")}
        onAthlete={() => {
          router.replace("/athlete");
        }}
      />
    </AuthScreen>
  );
}

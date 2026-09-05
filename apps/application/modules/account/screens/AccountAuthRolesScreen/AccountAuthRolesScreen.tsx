"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { tokenStore } from "@api";
import { useAccountMe } from "@api/account";
import { AccountAuthOtpHeaderSection } from "@modules/account/sections/AccountAuthOtpHeaderSection";
import { AccountAuthRolesCopySection } from "@modules/account/sections/AccountAuthRolesCopySection";
import { AccountAuthRolesOptionsSection } from "@modules/account/sections/AccountAuthRolesOptionsSection";
import { useTranslations } from "next-intl";

import { AuthScreen } from "@/components/auth-screen";
import {
  getApplicationRoles,
  getRolePath,
  SET_PASSWORD_PATH,
} from "@/lib/post-auth-path";
import { AUTH_PATH } from "@/lib/welcome-onboarding";
import { AuthScreenSkeleton } from "@/components/loading-skeletons";

export function AccountAuthRolesScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("auth.roles");
  const tCommon = useTranslations("common");
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  const me = useAccountMe(hasToken === true);
  const isFirstTime = searchParams.get("firstTime") === "1";
  const isManaging = searchParams.get("manage") === "1";
  const roles = useMemo(
    () => (me.data ? getApplicationRoles(me.data.roles) : []),
    [me.data],
  );

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
    } else if (
      me.data?.hasPassword &&
      !isFirstTime &&
      !isManaging &&
      roles.length === 1
    ) {
      router.replace(getRolePath(roles[0]));
    }
  }, [isFirstTime, isManaging, me.data, roles, router]);

  if (
    hasToken === null ||
    hasToken === false ||
    me.isError ||
    me.isLoading ||
    !me.data ||
    !me.data.hasPassword ||
    (!isFirstTime && !isManaging && roles.length === 1)
  ) {
    return <AuthScreenSkeleton />;
  }

  return (
    <AuthScreen>
      <AccountAuthOtpHeaderSection
        backLabel={tCommon("back")}
        href={isManaging ? `/${roles[0] ?? "athlete"}/profile` : "/auth"}
        overlay
        transparent
      />
      <AccountAuthRolesCopySection
        title={isManaging ? "نقش‌های من" : t("title")}
        subtitle={
          isManaging
            ? "نقش فعال خود را ببینید یا برای نقش تازه درخواست ثبت کنید."
            : t("subtitle")
        }
      />
      <AccountAuthRolesOptionsSection
        athleteLabel={t("athlete")}
        coachLabel={t("coach")}
        ownerLabel={t("owner")}
        grantedRoles={roles}
        isFirstTime={isFirstTime}
        onSelectRole={(role) => {
          const path = getRolePath(role);
          if (path.startsWith("http")) {
            window.location.assign(path);
            return;
          }
          router.replace(path);
        }}
      />
    </AuthScreen>
  );
}

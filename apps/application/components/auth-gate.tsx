"use client";

import { type ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { tokenStore } from "@api/http";
import { useAccountMe } from "@api/account";

import { SET_PASSWORD_PATH } from "@/lib/post-auth-path";
import { AUTH_PATH, markWelcomeSeen } from "@/lib/welcome-onboarding";
import { DashboardPageSkeleton } from "@/components/loading-skeletons";

type AuthGateProps = {
  children: ReactNode;
};

export function AuthGate({ children }: AuthGateProps) {
  const router = useRouter();
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
    if (me.data) {
      markWelcomeSeen();
    }
  }, [me.data]);

  useEffect(() => {
    if (me.data && !me.data.hasPassword) {
      router.replace(SET_PASSWORD_PATH);
    }
  }, [me.data, router]);

  if (hasToken === null || hasToken === false || me.isError) {
    return <DashboardPageSkeleton />;
  }

  if (me.isLoading || !me.data || !me.data.hasPassword) {
    return <DashboardPageSkeleton />;
  }

  return children;
}

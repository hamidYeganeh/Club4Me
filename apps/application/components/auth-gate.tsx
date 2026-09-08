"use client";

import { type ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { tokenStore } from "@api/http";
import { useAccountMe } from "@api/account";

import { rememberAuthReturnPath } from "@/lib/auth-return-path";
import { SET_PASSWORD_PATH } from "@/lib/post-auth-path";
import { AUTH_PATH, markWelcomeSeen } from "@/lib/welcome-onboarding";
import { DashboardPageSkeleton } from "@/components/loading-skeletons";
import { ApiError } from "@api";
import { RequestFailureState } from "@/components/request-failure-state";
import { getQueryFailure } from "@/lib/request-failure";

type AuthGateProps = {
  children: ReactNode;
};

export function AuthGate({ children }: AuthGateProps) {
  const router = useRouter();
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  const me = useAccountMe(hasToken === true);
  const sessionExpired =
    me.error instanceof ApiError && me.error.status === 401;
  const needsPassword =
    me.data && !me.data.hasPassword && !me.data.roles.includes("athlete");
  const failure = getQueryFailure(me.error, me.fetchStatus);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setHasToken(Boolean(tokenStore.get()));
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (hasToken === false || sessionExpired) {
      rememberAuthReturnPath(window.location.pathname + window.location.search);
      tokenStore.clear();
      router.replace(AUTH_PATH);
    }
  }, [hasToken, sessionExpired, router]);

  useEffect(() => {
    if (me.data) {
      markWelcomeSeen();
    }
  }, [me.data]);

  useEffect(() => {
    if (needsPassword) {
      rememberAuthReturnPath(window.location.pathname + window.location.search);
      router.replace(SET_PASSWORD_PATH);
    }
  }, [needsPassword, router]);

  if (hasToken === null || hasToken === false || sessionExpired) {
    return <DashboardPageSkeleton />;
  }

  if (failure && !me.data) {
    return (
      <main className="app-page justify-center">
        <RequestFailureState
          error={failure}
          onRetry={() => void me.refetch()}
        />
      </main>
    );
  }

  if (me.isLoading || !me.data || needsPassword) {
    return <DashboardPageSkeleton />;
  }

  return children;
}

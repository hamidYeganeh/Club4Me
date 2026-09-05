"use client";

import { type ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { tokenStore } from "@api/http";
import { useAccountMe } from "@api/account";

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
  const failure = getQueryFailure(me.error, me.fetchStatus);

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
    if (me.data) {
      markWelcomeSeen();
    }
  }, [me.data]);

  useEffect(() => {
    if (me.data && !me.data.hasPassword) {
      router.replace(SET_PASSWORD_PATH);
    }
  }, [me.data, router]);

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

  if (me.isLoading || !me.data || !me.data.hasPassword) {
    return <DashboardPageSkeleton />;
  }

  return children;
}

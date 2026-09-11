"use client";

import { type ReactNode, useEffect, useSyncExternalStore } from "react";
import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { tokenStore } from "@api/http";
import { useAccountMe } from "@api/account";

import { rememberAuthReturnPath } from "@/lib/auth-return-path";
import { SET_PASSWORD_PATH } from "@/lib/post-auth-path";
import { AUTH_PATH, markWelcomeSeen } from "@/lib/welcome-onboarding";
import { ApiError } from "@api";
import { RequestFailureState } from "@/components/request-failure-state";
import { getQueryFailure } from "@/lib/request-failure";

type AuthGateProps = {
  children: ReactNode;
};

export function AuthGate({ children }: AuthGateProps) {
  const router = useRouter();
  const hasToken = useSyncExternalStore(
    tokenStore.subscribe,
    () => Boolean(tokenStore.get()),
    () => null,
  );
  const me = useAccountMe(hasToken === true);
  const sessionExpired =
    me.error instanceof ApiError && me.error.status === 401;
  const needsPassword =
    me.data && !me.data.hasPassword && !me.data.roles.includes("athlete");
  const failure = getQueryFailure(me.error, me.fetchStatus);

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
    return null;
  }

  if (failure && !me.data) {
    return (
      <main className="app-page justify-center">
        <RequestFailureState
          error={failure}
          onRetry={() => void me.refetch()}
        />
        <Button
          variant="secondary"
          onPress={() => {
            tokenStore.clear();
            router.replace(AUTH_PATH);
          }}
        >
          ورود دوباره به حساب
        </Button>
      </main>
    );
  }

  if (me.isLoading || !me.data || needsPassword) {
    return null;
  }

  return children;
}

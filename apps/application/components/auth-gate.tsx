"use client";

import { type ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@heroui/react";
import { tokenStore } from "@api";
import { useAccountMe } from "@api/account";
import { useTranslations } from "next-intl";

import { AUTH_PATH, markWelcomeSeen } from "@/lib/welcome-onboarding";

type AuthGateProps = {
  children: ReactNode;
};

export function AuthGate({ children }: AuthGateProps) {
  const router = useRouter();
  const t = useTranslations("common");
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

  if (hasToken === null || hasToken === false || me.isError) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center">
        <Spinner size="lg" aria-label={t("loading")} />
      </div>
    );
  }

  if (me.isLoading || !me.data) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center">
        <Spinner size="lg" aria-label={t("loading")} />
      </div>
    );
  }

  return children;
}

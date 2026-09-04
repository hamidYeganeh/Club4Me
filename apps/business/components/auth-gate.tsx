"use client";

import { type ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@heroui/react";
import { tokenStore } from "@api";
import { useBusinessMe } from "@api/business";
import { useTranslations } from "next-intl";

type AuthGateProps = {
  children: ReactNode;
};

export function AuthGate({ children }: AuthGateProps) {
  const router = useRouter();
  const t = useTranslations("common");
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  const me = useBusinessMe(hasToken === true);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setHasToken(Boolean(tokenStore.get()));
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (hasToken === false || (me.isError && !me.isFetching)) {
      tokenStore.clear();
      router.replace("/auth");
    }
  }, [hasToken, me.isError, me.isFetching, router]);

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

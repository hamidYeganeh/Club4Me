"use client";

import { type ReactNode, useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@heroui/react";
import { tokenStore } from "@api";
import { useBusinessMe } from "@api/business";
import { useTranslations } from "next-intl";

type GuestGateProps = {
  children: ReactNode;
};

export function GuestGate({ children }: GuestGateProps) {
  const router = useRouter();
  const t = useTranslations("common");
  const hasToken = useSyncExternalStore(
    tokenStore.subscribe,
    () => Boolean(tokenStore.get()),
    () => null,
  );
  const me = useBusinessMe(hasToken === true);

  useEffect(() => {
    if (!hasToken) return;
    if (
      me.isError &&
      !me.isFetching &&
      [401, 403].includes((me.error as { status?: number }).status ?? 0)
    ) {
      tokenStore.clear();
      return;
    }

    if (hasToken && me.data) {
      router.replace("/");
    }
  }, [hasToken, me.data, me.error, me.isError, me.isFetching, router]);

  if (hasToken === null || (hasToken && me.isLoading && !me.isError)) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center">
        <Spinner size="lg" aria-label={t("loading")} />
      </div>
    );
  }

  if (hasToken && me.data) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center">
        <Spinner size="lg" aria-label={t("loading")} />
      </div>
    );
  }

  return children;
}

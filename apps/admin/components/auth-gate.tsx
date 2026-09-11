"use client";

import { type ReactNode, useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Button, Spinner } from "@heroui/react";
import { tokenStore } from "@api";
import { useAdminMe } from "@api/admin";
import { useTranslations } from "next-intl";

type AuthGateProps = {
  children: ReactNode;
};

export function AuthGate({ children }: AuthGateProps) {
  const router = useRouter();
  const t = useTranslations("common");
  const hasToken = useSyncExternalStore(
    tokenStore.subscribe,
    () => Boolean(tokenStore.get()),
    () => null,
  );
  const me = useAdminMe(hasToken === true);
  const expired =
    me.isError &&
    [401, 403].includes((me.error as { status?: number }).status ?? 0);

  useEffect(() => {
    if (hasToken === false || (expired && !me.isFetching)) {
      tokenStore.clear();
      router.replace("/auth");
    }
  }, [hasToken, expired, me.isFetching, router]);

  if (hasToken === null || hasToken === false || expired) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center">
        <Spinner size="lg" aria-label={t("loading")} />
      </div>
    );
  }

  if (me.isError)
    return (
      <main className="p-6">
        <p role="alert">دریافت حساب انجام نشد. دوباره تلاش کنید.</p>
        <Button onPress={() => void me.refetch()}>تلاش دوباره</Button>
      </main>
    );

  if (me.isLoading || !me.data) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center">
        <Spinner size="lg" aria-label={t("loading")} />
      </div>
    );
  }

  return children;
}

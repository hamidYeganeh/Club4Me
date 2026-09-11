"use client";

import { type ReactNode, useEffect, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { StaffWorkspace } from "./staff-workspace";
import { Button, Spinner } from "@heroui/react";
import { tokenStore } from "@api";
import { useBusinessMe } from "@api/business";
import { useTranslations } from "next-intl";

type AuthGateProps = {
  children: ReactNode;
};

export function AuthGate({ children }: AuthGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("common");
  const hasToken = useSyncExternalStore(
    tokenStore.subscribe,
    () => Boolean(tokenStore.get()),
    () => null,
  );
  const me = useBusinessMe(hasToken === true);
  const expired =
    me.isError && (me.error as { status?: number }).status === 401;

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

  if (me.isError) {
    return (
      <main className="mx-auto grid min-h-dvh max-w-lg content-center gap-4 p-6">
        <h1 className="text-xl font-bold">دریافت حساب انجام نشد</h1>
        <p role="alert" className="text-sm leading-7 text-muted">
          اتصال یا دسترسی به پنل را بررسی کنید. اطلاعات ورود شما حفظ شده است.
        </p>
        <Button onPress={() => void me.refetch()} isPending={me.isFetching}>
          تلاش دوباره
        </Button>
      </main>
    );
  }

  if (me.isLoading || !me.data) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center">
        <Spinner size="lg" aria-label={t("loading")} />
      </div>
    );
  }

  if (!me.data.roles.includes("owner"))
    return (
      <StaffWorkspace
        key={pathname}
        initialClubId={pathname.match(/^\/clubs\/([^/]+)/)?.[1]}
        initialClassId={pathname.match(/\/classes\/([^/]+)/)?.[1]}
      />
    );
  return children;
}

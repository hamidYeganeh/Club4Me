"use client";

import { type ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@heroui/react";
import { tokenStore } from "@api";
import { useAdminMe } from "@api/admin";
import { useTranslations } from "next-intl";

type GuestGateProps = {
  children: ReactNode;
};

export function GuestGate({ children }: GuestGateProps) {
  const router = useRouter();
  const t = useTranslations("common");
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  const me = useAdminMe(hasToken === true);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setHasToken(Boolean(tokenStore.get()));
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (me.isError) {
      tokenStore.clear();
      return;
    }

    if (me.data) {
      router.replace("/");
    }
  }, [me.data, me.isError, router]);

  if (hasToken === null || (hasToken && me.isLoading && !me.isError)) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center">
        <Spinner size="lg" aria-label={t("loading")} />
      </div>
    );
  }

  if (me.data) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center">
        <Spinner size="lg" aria-label={t("loading")} />
      </div>
    );
  }

  return children;
}

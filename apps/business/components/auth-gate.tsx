"use client";

import { type ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { StaffWorkspace } from "./staff-workspace";
import { Spinner } from "@heroui/react";
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

"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export function WelcomeSignInScreen() {
  const t = useTranslations("welcome");
  const tCommon = useTranslations("common");

  return (
    <main className="flex min-h-dvh flex-col gap-6 bg-background px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <Link
        href="/welcome"
        className="text-sm font-medium text-muted no-underline"
      >
        {tCommon("back")}
      </Link>
      <h1 className="text-3xl font-bold">{t("signIn")}</h1>
    </main>
  );
}

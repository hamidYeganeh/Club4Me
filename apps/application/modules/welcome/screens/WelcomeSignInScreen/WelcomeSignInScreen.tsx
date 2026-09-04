import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function WelcomeSignInScreen() {
  const t = await getTranslations("welcome");
  const tCommon = await getTranslations("common");

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

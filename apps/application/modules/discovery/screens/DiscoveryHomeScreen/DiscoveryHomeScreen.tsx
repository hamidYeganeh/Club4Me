import { DiscoveryHomeFeedSection } from "@modules/discovery/sections/DiscoveryHomeFeedSection";
import { DiscoveryHomeHeaderSection } from "@modules/discovery/sections/DiscoveryHomeHeaderSection";
import { getTranslations } from "next-intl/server";

export async function DiscoveryHomeScreen() {
  const t = await getTranslations("nav");

  return (
    <main className="flex min-h-dvh flex-1 flex-col gap-6 px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[calc(5.75rem+env(safe-area-inset-bottom))]">
      <DiscoveryHomeHeaderSection title={t("discover")} />
      <DiscoveryHomeFeedSection />
    </main>
  );
}

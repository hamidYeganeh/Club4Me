import { SecondaryHeader } from "@modules/discovery/components/SecondaryHeader";
import { DISCOVERY_PROVINCES } from "@modules/discovery/discovery.constants";
import { DiscoveryCitiesProvinceSection } from "@modules/discovery/sections/DiscoveryCitiesProvinceSection";
import { getTranslations } from "next-intl/server";

import type { DiscoveryCitiesScreenProps } from "./DiscoveryCitiesScreen.types";

export async function DiscoveryCitiesScreen({
  provinces = DISCOVERY_PROVINCES,
}: DiscoveryCitiesScreenProps) {
  const t = await getTranslations("discovery.cities");

  return (
    <main className="app-page gap-8">
      <SecondaryHeader title={t("title")} />

      <div className="app-reveal flex flex-col gap-8">
        {provinces.map((province) => (
          <DiscoveryCitiesProvinceSection
            key={province.id}
            province={province}
          />
        ))}
      </div>
    </main>
  );
}

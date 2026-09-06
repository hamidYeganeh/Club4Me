"use client";

import { DiscoveryIranMapSkeleton } from "../../components/skeletons/DiscoveryIranMapSkeleton";
import type { CSSProperties, KeyboardEvent } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@theme/icon";
import { usePublicCatalogResource } from "@api/discovery";

import { DiscoverySectionHeader } from "@modules/discovery/components/DiscoverySectionHeader";
import {
  IRAN_MAP_VIEWBOX,
  IRAN_PROVINCES,
  type IranProvinceShape,
} from "@modules/discovery/data/iran-provinces";

import { discoveryIranMapSectionStyles } from "./DiscoveryIranMapSection.styles";

type ProvinceResource = {
  id: string;
  name: string;
  slug?: string;
  clubsCount?: number;
};

function normalizeProvinceName(value: string) {
  return value
    .replace(/[\u200c-\u200f\u202a-\u202e\u2066-\u2069]/g, "")
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/^استان\s+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function provinceValue(item: ProvinceResource | undefined) {
  return typeof item?.clubsCount === "number" ? item.clubsCount : 0;
}

export function DiscoveryIranMapSection() {
  const styles = discoveryIranMapSectionStyles();
  const provinces = usePublicCatalogResource("location", "province", {
    limit: 100,
  });
  const [selectedId, setSelectedId] = useState("IR-07");

  const resourcesByName = useMemo(
    () =>
      new Map(
        (provinces.data?.items ?? []).map((item) => [
          normalizeProvinceName(item.name),
          item as ProvinceResource,
        ]),
      ),
    [provinces.data?.items],
  );
  const selectedShape =
    IRAN_PROVINCES.find((province) => province.id === selectedId) ??
    IRAN_PROVINCES[0]!;
  const selectedResource = resourcesByName.get(
    normalizeProvinceName(selectedShape.nameFa),
  );
  const maxClubs = Math.max(
    1,
    ...IRAN_PROVINCES.map((province) =>
      provinceValue(
        resourcesByName.get(normalizeProvinceName(province.nameFa)),
      ),
    ),
  );
  const selectedCount = provinceValue(selectedResource);
  const selectedHref = selectedResource
    ? `/discovery/province/${String(selectedResource.slug ?? selectedResource.id)}`
    : "/discovery/cities";

  function selectWithKeyboard(
    event: KeyboardEvent<SVGPathElement>,
    province: IranProvinceShape,
  ) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    setSelectedId(province.id);
  }

  if (provinces.isPending) return <DiscoveryIranMapSkeleton />;

  return (
    <section className={styles.root()} aria-labelledby="iran-map-title">
      <div className={styles.header()}>
        <DiscoverySectionHeader
          id="iran-map-title"
          title="ورزش در سراسر ایران"
          subtitle="استان را روی نقشه انتخاب کن و باشگاه‌های آن منطقه را ببین"
          icon="map-trifold"
          viewAllLabel="همه شهرها"
          viewAllUrl="/discovery/cities"
        />
      </div>

      <div className={styles.card()}>
        <div className={styles.content()}>
          <div className={styles.mapWrap()}>
            <svg
              viewBox={IRAN_MAP_VIEWBOX}
              role="group"
              aria-label="نقشه ایران با مرزبندی ۳۱ استان"
              className={styles.map()}
            >
              {IRAN_PROVINCES.map((province) => {
                const resource = resourcesByName.get(
                  normalizeProvinceName(province.nameFa),
                );
                const value = provinceValue(resource);
                const isSelected = province.id === selectedId;
                const fillOpacity = isSelected
                  ? 1
                  : 0.2 + (value / maxClubs) * 0.58;
                const style = {
                  fill: "var(--accent)",
                  fillOpacity,
                  strokeWidth: isSelected ? 2.4 : 1.15,
                } as CSSProperties;

                return (
                  <path
                    key={province.id}
                    d={province.path}
                    role="button"
                    tabIndex={0}
                    aria-label={`${province.nameFa}، ${value.toLocaleString("fa-IR")} باشگاه`}
                    aria-pressed={isSelected}
                    className={styles.province()}
                    style={style}
                    onClick={() => setSelectedId(province.id)}
                    onMouseEnter={() => setSelectedId(province.id)}
                    onFocus={() => setSelectedId(province.id)}
                    onKeyDown={(event) => selectWithKeyboard(event, province)}
                  >
                    <title>{province.nameFa}</title>
                  </path>
                );
              })}
            </svg>
          </div>

          <div className={styles.detail()} aria-live="polite">
            <div className={styles.detailCopy()}>
              <p className={styles.detailLabel()}>استان انتخاب‌شده</p>
              <h3 className={styles.detailTitle()}>{selectedShape.nameFa}</h3>
              <p className={styles.detailValue()}>
                {provinces.isPending
                  ? "در حال دریافت اطلاعات باشگاه‌ها"
                  : `${selectedCount.toLocaleString("fa-IR")} باشگاه ثبت‌شده`}
              </p>
            </div>
            <Link href={selectedHref} className={styles.action()}>
              مشاهده استان
              <Icon name="chevron-left" size={16} />
            </Link>
          </div>
        </div>

        <div className={styles.source()}>
          <span>مرزهای ۳۱ استان ایران</span>
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
            className="underline decoration-foreground/25 underline-offset-4 transition-colors hover:text-foreground"
          >
            © مشارکت‌کنندگان OpenStreetMap
          </a>
        </div>
      </div>
    </section>
  );
}

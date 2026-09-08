"use client";

import { MinimalCarousel } from "@/components/ui/minimal-carousel";
import { ClubEmptyState } from "@modules/discovery/components/ClubEmptyState";

import { useState } from "react";
import { Button, Typography } from "@heroui/react";
import { Icon } from "@theme/icon";
import { useLocale, useTranslations } from "next-intl";
import { FreeMode, Thumbs } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { FallbackImage } from "@/components/FallbackImage";
import { NeshanMap } from "@/components/maps/neshan-map";
import { BottomSheet } from "@/components/motion/bottom-sheet";
import { getLocaleDirection } from "@/lib/locale-direction";

import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/thumbs";

import { AmenityCard } from "@ui/amenity-card";
import { CoachCard } from "@ui/coach-card";
import { SportCard } from "@ui/sport-card";
import type { DiscoveryFacilityItem } from "@modules/discovery/discovery.types";

import { discoveryClubsDetailBodySectionStyles } from "./DiscoveryClubsDetailBodySection.styles";
import type { DiscoveryClubsDetailBodySectionProps } from "./DiscoveryClubsDetailBodySection.types";

const statIcons = {
  clock: ({ size }: { size?: number }) => <Icon name="clock" size={size} />,
  compass: ({ size }: { size?: number }) => <Icon name="compass" size={size} />,
  "star-full": ({ size }: { size?: number }) => (
    <Icon name="star-full" size={size} />
  ),
};

type FacilityListKind = "amenities" | "equipment";

export function DiscoveryClubsDetailBodySection({
  name,
  images,
  about,
  amenities,
  equipment,
  sports,
  coaches,
  location,
  stats,
  onThumbsSwiper,
  onThumbClick,
}: DiscoveryClubsDetailBodySectionProps) {
  const t = useTranslations("discovery.clubDetail");
  const direction = getLocaleDirection(useLocale());
  const [listKind, setListKind] = useState<FacilityListKind | null>(null);
  const [detailItem, setDetailItem] = useState<DiscoveryFacilityItem | null>(
    null,
  );
  const styles = discoveryClubsDetailBodySectionStyles();

  const listItems =
    listKind === "equipment"
      ? equipment
      : listKind === "amenities"
        ? amenities
        : [];
  const listTitle =
    listKind === "equipment"
      ? t("equipmentTitle")
      : listKind === "amenities"
        ? t("amenitiesTitle")
        : "";

  return (
    <section className={styles.root()}>
      {images.length > 1 ? (
        <div dir={direction} className="w-full">
          <Swiper
            dir={direction}
            modules={[FreeMode, Thumbs]}
            onSwiper={onThumbsSwiper}
            onClick={(swiper) => {
              if (typeof swiper.clickedIndex === "number") {
                onThumbClick(swiper.clickedIndex);
              }
            }}
            spaceBetween={12}
            slidesPerView={3}
            watchSlidesProgress
            slideToClickedSlide
            watchOverflow
            className={styles.thumbsSwiper()}
          >
            {images.map((src) => (
              <SwiperSlide key={src} className={styles.thumbSlide()}>
                <FallbackImage
                  src={src}
                  alt=""
                  fill
                  unoptimized
                  sizes="33vw"
                  className={styles.image()}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      ) : null}

      <MinimalCarousel
        cards={stats.map((stat) => ({
          id: stat.label,
          title: stat.label,
          value: stat.value,
          icon: statIcons[stat.icon],
          description: stat.description,
        }))}
      />

      <details className="group rounded-3xl bg-transparent py-3">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl py-2 focus-visible:outline-2 focus-visible:outline-focus">
          <span className="text-lg font-bold">{t("aboutTitle")}</span>
          <span className="flex items-center gap-2 text-sm text-accent">
            <span className="group-open:hidden">{t("seeMore")}</span>
            <span className="hidden group-open:inline">{t("seeLess")}</span>
            <Icon
              name="chevron-down"
              className="transition-transform group-open:rotate-180"
            />
          </span>
        </summary>
        <p className="mt-3 whitespace-pre-line text-sm leading-8 text-muted">
          {about.trim() || "هنوز توضیحی درباره باشگاه ثبت نشده است"}
        </p>
      </details>

      {sports.length > 0 ? (
        <div className={styles.sports()}>
          <Typography type="h5" className={styles.sportsTitle()}>
            {t("sportsTitle")}
          </Typography>
          <div className={styles.sportsList()}>
            {sports.map((sport) => (
              <SportCard
                key={sport.id}
                value={sport.name}
                supportingText={sport.category}
                icon={sport.icon}
                backgroundImage={sport.backgroundImage}
              />
            ))}
          </div>
        </div>
      ) : null}

      {coaches.length > 0 ? (
        <div className={styles.coaches()}>
          <Typography type="h5" className={styles.coachesTitle()}>
            {t("coachesTitle")}
          </Typography>
          <div className={styles.coachesList()}>
            {coaches.map((coach) => (
              <CoachCard
                key={coach.id}
                type="normal"
                title={coach.name}
                supportingText={coach.specialty}
                imageUrl={coach.imageUrl}
                imageAlt={coach.name}
                badge={coach.badge}
                rating={coach.rating}
                reviewsCount={coach.reviewsCount}
                stats={[
                  { id: "location", icon: "map-pin-1", label: coach.location },
                  { id: "mode", icon: "whistle", label: coach.mode },
                ]}
              />
            ))}
          </div>
        </div>
      ) : null}

      <FacilityCarousel
        title={t("equipmentTitle")}
        seeAllLabel={t("seeAll")}
        items={equipment}
        styles={styles}
        direction={direction}
        onSeeAll={() => setListKind("equipment")}
        onItemPress={setDetailItem}
      />

      <FacilityCarousel
        title={t("amenitiesTitle")}
        seeAllLabel={t("seeAll")}
        items={amenities}
        styles={styles}
        direction={direction}
        onSeeAll={() => setListKind("amenities")}
        onItemPress={setDetailItem}
      />

      <div className={styles.location()}>
        <div className={styles.locationHeader()}>
          <Icon name="map-pin-1" size="lg" />
          <Typography type="h5" className={styles.locationTitle()}>
            {t("locationTitle")}
          </Typography>
        </div>
        {location ? (
          <div className={styles.locationCard()}>
            <NeshanMap
              center={location}
              markers={[
                {
                  id: "club-location",
                  ...location,
                  imageUrl: images[0],
                  label: name,
                },
              ]}
              selectedMarkerId="club-location"
              className={styles.locationMap()}
            />
            <div className={styles.locationDetails()}>
              <div className={styles.locationInfo()}>
                <span className={styles.locationVenueIcon()}>
                  <Icon name="building-1" size="lg" />
                </span>
                <div className={styles.locationText()}>
                  <Typography
                    type="body"
                    weight="semibold"
                    className={styles.locationName()}
                  >
                    {name}
                  </Typography>
                  <Typography
                    type="body-sm"
                    color="muted"
                    className={styles.locationAddress()}
                  >
                    {location.address}
                  </Typography>
                </div>
              </div>
              <div className={styles.locationDivider()} />
              <a
                href={`https://nshn.ir/?lat=${location.latitude}&lng=${location.longitude}`}
                target="_blank"
                rel="noreferrer"
                className={styles.locationLink()}
              >
                {t("openInNeshan")}
                <Icon name="map-pin-1" size="md" />
              </a>
            </div>
          </div>
        ) : (
          <p className="rounded-2xl border border-border p-4 text-sm text-muted">
            موقعیت دقیق ثبت نشده؛ پیش از مراجعه نشانی را با باشگاه هماهنگ کنید.
          </p>
        )}
      </div>

      <BottomSheet
        open={listKind !== null}
        onOpenChange={(open) => !open && setListKind(null)}
        snapPoints={[0.85]}
        title={listTitle}
      >
        <div className={styles.facilityList()}>
          {listItems.map((item) => (
            <AmenityCard
              key={item.id}
              title={item.title}
              icon={item.icon}
              backgroundImage={item.backgroundImage}
              className="w-full!"
              onPress={() => {
                setListKind(null);
                setDetailItem(item);
              }}
            />
          ))}
        </div>
      </BottomSheet>

      <BottomSheet
        open={detailItem !== null}
        onOpenChange={(open) => !open && setDetailItem(null)}
        snapPoints={[0.85]}
        title={detailItem?.title ?? ""}
      >
        {detailItem?.backgroundImage ? (
          <div className={styles.facilityDetailImage()}>
            <FallbackImage
              src={detailItem.backgroundImage}
              alt={detailItem.title}
              fill
              unoptimized
              sizes="100vw"
              className={styles.facilityDetailImageSrc()}
            />
          </div>
        ) : detailItem?.icon ? (
          <div className="mb-4 flex size-16 items-center justify-center rounded-[18px] bg-surface-secondary">
            <Icon name={detailItem.icon} size={32} />
          </div>
        ) : null}
        {detailItem?.count != null ? (
          <Typography
            type="body-sm"
            color="muted"
            className={styles.facilityDetailMeta()}
          >
            {t("facilityCount", { count: detailItem.count })}
          </Typography>
        ) : null}
        {detailItem?.description ? (
          <Typography
            type="body-sm"
            className={styles.facilityDetailDescription()}
          >
            {detailItem.description}
          </Typography>
        ) : null}
      </BottomSheet>
    </section>
  );
}

function FacilityCarousel({
  title,
  seeAllLabel,
  items,
  styles,
  direction,
  onSeeAll,
  onItemPress,
}: {
  title: string;
  seeAllLabel: string;
  items: DiscoveryFacilityItem[];
  styles: ReturnType<typeof discoveryClubsDetailBodySectionStyles>;
  direction: "ltr" | "rtl";
  onSeeAll: () => void;
  onItemPress: (item: DiscoveryFacilityItem) => void;
}) {
  if (items.length === 0) {
    return (
      <div className={styles.facilitySection()}>
        <Typography type="h5" className={styles.facilityTitle()}>
          {title}
        </Typography>
        <ClubEmptyState
          title={`هنوز ${title} ثبت نشده است`}
          description="اطلاعات این بخش پس از تکمیل توسط باشگاه اینجا نمایش داده می‌شود."
        />
      </div>
    );
  }

  return (
    <div className={styles.facilitySection()}>
      <div className={styles.facilityHeader()}>
        <Typography type="h5" className={styles.facilityTitle()}>
          {title}
        </Typography>
        <button
          type="button"
          className={styles.facilitySeeAll()}
          onClick={onSeeAll}
        >
          {seeAllLabel}
        </button>
      </div>
      <div dir={direction} className={styles.facilityCarousel()}>
        <Swiper
          dir={direction}
          modules={[FreeMode]}
          freeMode
          spaceBetween={10}
          slidesPerView="auto"
          watchOverflow
        >
          {items.map((item) => (
            <SwiperSlide key={item.id} className={styles.facilitySlide()}>
              <AmenityCard
                title={item.title}
                icon={item.icon}
                backgroundImage={item.backgroundImage}
                onPress={() => onItemPress(item)}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
}

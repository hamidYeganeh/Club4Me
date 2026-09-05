"use client";

import Image from "next/image";
import Link from "next/link";
import { useAccountMe } from "@api/account";
import { Avatar, Badge, Chip, Skeleton, Typography } from "@heroui/react";
import { Icon } from "@theme/icon";
import { ThemeToggle } from "@theme/theme-toggle";
import { useFormatter, useTranslations } from "next-intl";

import { ButtonLink } from "@/components/button-link";
import { PROFILE_AVATAR_SRC, PROFILE_COVER_SRC } from "../../profile.constants";
import { getProfileDisplayName } from "../../profile.utils";
import { profileHeroSectionStyles } from "./ProfileHeroSection.styles";
import type { ProfileHeroSectionProps } from "./ProfileHeroSection.types";

export function ProfileHeroSection({ role }: ProfileHeroSectionProps) {
  const styles = profileHeroSectionStyles();
  const t = useTranslations("profile");
  const format = useFormatter();
  const me = useAccountMe();

  const name = getProfileDisplayName(me.data, t("fallbackName"));
  const joinedAt = me.data?.createdAt
    ? format.dateTime(new Date(me.data.createdAt), {
        month: "short",
        year: "numeric",
      })
    : null;
  const imageHref = `/${role}/profile/image`;
  const editHref = `/${role}/profile/edit`;

  return (
    <section className={styles.root()}>
      <div className={styles.banner()}>
        <Image
          src={PROFILE_COVER_SRC}
          alt={t("coverAlt")}
          fill
          priority
          sizes="100vw"
          className={styles.cover()}
        />
        <div aria-hidden className={styles.notch()} />
      </div>

      <div className={styles.overlap()} dir="ltr">
        <ThemeToggle className={styles.sideButton()} />

        <Link
          href={imageHref}
          scroll={false}
          aria-label={t("changeImage")}
          className={styles.avatarLink()}
        >
          <Badge.Anchor>
            <Avatar className={styles.avatar()}>
              <Avatar.Image
                alt={t("avatarAlt", { name })}
                src={me.data?.avatarUrl ?? PROFILE_AVATAR_SRC}
              />
              <Avatar.Fallback className="overflow-hidden p-0">
                {/* Avatar fallback supports runtime and local asset URLs. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={me.data?.avatarUrl ?? PROFILE_AVATAR_SRC}
                  alt=""
                  className="size-full object-cover"
                />
              </Avatar.Fallback>
            </Avatar>
            <Badge
              aria-hidden
              color="default"
              placement="bottom-right"
              size="sm"
              className={styles.avatarBadge()}
            >
              <Icon name="pencil-1" size={13} />
            </Badge>
          </Badge.Anchor>
        </Link>

        <ButtonLink
          href={editHref}
          scroll={false}
          isIconOnly
          variant="secondary"
          aria-label={t("edit")}
          className={styles.sideButton()}
        >
          <Icon name="pencil-1" size={18} />
        </ButtonLink>
      </div>

      <div className={styles.identity()}>
        <Chip color="accent" size="sm" variant="soft">
          <Icon name="sparkle-1" className={styles.badgeIcon()} />
          <Chip.Label>{t("plusBadge")}</Chip.Label>
        </Chip>
        {me.isPending ? (
          <div
            className="mt-3 flex flex-col items-center gap-2"
            aria-busy="true"
            aria-label="در حال بارگذاری پروفایل"
          >
            <Skeleton className="h-3.5 w-32 rounded-lg" />
            <Skeleton className="h-7 w-40 rounded-xl" />
          </div>
        ) : joinedAt ? (
          <Typography type="body-sm" color="muted" className={styles.joined()}>
            {t("memberSince", { date: joinedAt })}
          </Typography>
        ) : (
          <Typography type="body-sm" color="muted" className={styles.joined()}>
            {t("memberSinceFallback")}
          </Typography>
        )}
        {!me.isPending ? (
          <Typography type="h2" className={styles.name()}>
            {name}
          </Typography>
        ) : null}
      </div>
    </section>
  );
}

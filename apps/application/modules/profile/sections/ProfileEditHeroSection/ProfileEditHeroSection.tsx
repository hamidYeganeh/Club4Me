"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAccountMe } from "@api/account";
import { Avatar, Badge, Button, Typography } from "@heroui/react";
import { Icon } from "@theme/icon";
import { useTranslations } from "next-intl";

import { PROFILE_AVATAR_SRC } from "../../profile.constants";
import {
  getProfileDisplayName,
  getProfileInitials,
} from "../../profile.utils";
import { profileEditHeroSectionStyles } from "./ProfileEditHeroSection.styles";
import type { ProfileEditHeroSectionProps } from "./ProfileEditHeroSection.types";

export function ProfileEditHeroSection({ role }: ProfileEditHeroSectionProps) {
  const styles = profileEditHeroSectionStyles();
  const router = useRouter();
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const me = useAccountMe();

  const name = getProfileDisplayName(me.data, t("fallbackName"));
  const initials = getProfileInitials(name);
  const imageHref = `/${role}/profile/image`;

  return (
    <section className={styles.root()}>
      <Button
        isIconOnly
        variant="ghost"
        size="lg"
        aria-label={tCommon("back")}
        className={styles.back()}
        onPress={() => router.push(`/${role}/profile`)}
      >
        <Icon name="chevron-right" size={22} />
      </Button>

      <Typography type="h2" align="center" className={styles.title()}>{t("editHeadline")}</Typography>

      <div className={styles.avatarWrap()}>
        <Link
          href={imageHref}
          scroll={false}
          aria-label={t("changeImage")}
          className={styles.avatarLink()}
        >
          <Badge.Anchor>
            <Avatar className={styles.avatar()}>
              <Avatar.Image alt={t("avatarAlt", { name })} src={PROFILE_AVATAR_SRC} />
              <Avatar.Fallback className={styles.avatarFallback()}>
                {PROFILE_AVATAR_SRC ? (
                  initials
                ) : (
                  <Icon name="user" size={36} />
                )}
              </Avatar.Fallback>
            </Avatar>
            <Badge
              aria-hidden
              color="default"
              placement="bottom-right"
              size="sm"
              className={styles.avatarBadge()}
            >
              <Icon name="pencil-1" size={12} />
            </Badge>
          </Badge.Anchor>
        </Link>
      </div>
    </section>
  );
}

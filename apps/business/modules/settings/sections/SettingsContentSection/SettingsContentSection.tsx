"use client";

import { useEffect, useState } from "react";
import { Avatar, Button, Card, Chip, Input, Switch, toast } from "@heroui/react";
import { useLogout } from "@api/business";
import { useCreateMedia } from "@api";
import { Icon, type IconName } from "@theme/icon";
import {
  imageUploaderAccept,
  Uploader,
  type UploaderLabels,
} from "@ui/uploader";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { ButtonLink } from "@/components/button-link";
import { cn } from "@theme/cn";

import { settingsContentSectionStyles } from "./SettingsContentSection.styles";
import type { SettingsContentSectionProps } from "./SettingsContentSection.types";

const defaultAvatar = "https://picsum.photos/seed/gym4me-business/240/240";

type NavItem = {
  id: string;
  label: string;
  icon: IconName;
  href?: string;
  badge?: string;
  active?: boolean;
};

export function SettingsContentSection({
  name,
  email,
  phone,
  proLabel,
  shareLabel,
  viewProfileLabel,
  personalTitle,
  personalHint,
  fullName,
  emailLabel,
  phoneLabel,
  accountType,
  regular,
  changeAvatar,
  paymentsTitle,
  paymentsHint,
  autoPayout,
  searchPlaceholder,
  navHome,
  navHealth,
  navAssistant,
  navAppointment,
  navRecommendation,
  navSettings,
  navHelp,
  proPromo,
  goProNow,
  memberBasic,
  logoutLabel,
}: SettingsContentSectionProps) {
  const styles = settingsContentSectionStyles();
  const logout = useLogout();
  const createMedia = useCreateMedia();
  const router = useRouter();
  const t = useTranslations("uploader");
  const [avatarSrc, setAvatarSrc] = useState(defaultAvatar);
  const [promoOpen, setPromoOpen] = useState(true);
  const labels: UploaderLabels = {
    clickToUpload: t("clickToUpload"),
    dropHint: t("dropHint"),
    formats: t("formats"),
    progress: t("progress"),
    success: t("success"),
    error: t("error"),
    retry: t("retry"),
    remove: t("remove"),
    dropzoneAria: t("dropzoneAria"),
  };

  const navItems: NavItem[] = [
    { id: "home", label: navHome, icon: "house-1", href: "/", badge: "1" },
    { id: "health", label: navHealth, icon: "heart-wellness-1", href: "/" },
    {
      id: "assistant",
      label: navAssistant,
      icon: "chat",
      href: "/coach",
      badge: "4",
    },
    {
      id: "appointment",
      label: navAppointment,
      icon: "calendar-1",
      href: "/classes",
    },
    {
      id: "recommendation",
      label: navRecommendation,
      icon: "sparkle-1",
      href: "/memberships",
    },
    {
      id: "settings",
      label: navSettings,
      icon: "gear-1",
      href: "/settings",
      active: true,
    },
    { id: "help", label: navHelp, icon: "question-mark-circle", href: "/coach" },
  ];

  useEffect(() => {
    return () => {
      if (avatarSrc.startsWith("blob:")) {
        URL.revokeObjectURL(avatarSrc);
      }
    };
  }, [avatarSrc]);

  return (
    <main className={styles.root()}>
      <aside className={styles.rail()}>
        <div className={styles.brand()}>
          <span className={styles.brandMark()}>
            <Icon name="plus-fat" size={18} />
          </span>
          Gym4Me
        </div>

        <label className={styles.search()}>
          <Icon name="magnifying-glass" className="text-muted" size={16} />
          <input
            aria-label={searchPlaceholder}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
            placeholder={searchPlaceholder}
          />
        </label>

        <nav className={styles.nav()} aria-label={navSettings}>
          {navItems.map((item) => (
            <ButtonLink
              key={item.id}
              href={item.href ?? "/settings"}
              className={cn(
                styles.navItem(),
                item.active && styles.navItemActive(),
              )}
              variant="ghost"
            >
              <Icon name={item.icon} size={18} />
              <span className="min-w-0 flex-1 truncate text-start">
                {item.label}
              </span>
              {item.badge ? (
                <span className={styles.navBadge()}>{item.badge}</span>
              ) : null}
            </ButtonLink>
          ))}
        </nav>

        {promoOpen ? (
          <div className={styles.promo()}>
            <Button
              isIconOnly
              size="sm"
              aria-label={logoutLabel}
              className={styles.promoClose()}
              variant="ghost"
              onPress={() => setPromoOpen(false)}
            >
              <Icon name="close-x" size={14} />
            </Button>
            <div className="flex items-start gap-2 pe-6">
              <Icon name="star-full" className="text-danger" size={18} />
              <div>
                <p className="font-medium">{proPromo}</p>
                <ButtonLink
                  href="/memberships"
                  className="mt-2 text-sm font-semibold text-danger"
                  variant="ghost"
                >
                  {goProNow}
                </ButtonLink>
              </div>
            </div>
          </div>
        ) : null}

        <div className={styles.userRow()}>
          <Avatar className="size-10">
            <Avatar.Image alt={name} src={avatarSrc} />
            <Avatar.Fallback>{name.slice(0, 1)}</Avatar.Fallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="truncate text-xs text-muted">{memberBasic}</p>
          </div>
          <Button
            isIconOnly
            aria-label={logoutLabel}
            variant="ghost"
            isPending={logout.isPending}
            onPress={() =>
              void logout
                .mutateAsync()
                .then(() => router.replace("/auth"))
                .catch(() => toast.danger(logoutLabel))
            }
          >
            <Icon name="power" className="text-danger" />
          </Button>
        </div>
      </aside>

      <section className={styles.stage()}>
        <div className={styles.panel()}>
          <div className={styles.cover()}>
            {/* Remote demo artwork is intentionally rendered without Next image optimization. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt=""
              src="https://picsum.photos/seed/gym4me-cover/1400/420"
              className={styles.coverImage()}
            />
            <Button
              isIconOnly
              aria-label={changeAvatar}
              className={styles.edit()}
              variant="secondary"
            >
              <Icon name="pencil-1" />
            </Button>
          </div>

          <div className={styles.identity()}>
            <div className={styles.person()}>
              <Avatar className="size-24 ring-4 ring-background">
                <Avatar.Image alt={name} src={avatarSrc} />
                <Avatar.Fallback>{name.slice(0, 1)}</Avatar.Fallback>
              </Avatar>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className={styles.name()}>{name}</h1>
                  <Chip color="accent" size="sm" variant="soft">
                    {proLabel}
                  </Chip>
                </div>
                <p className={styles.email()}>{email}</p>
              </div>
            </div>
            <div className={styles.actions()}>
              <Button variant="secondary">
                <Icon name="share-1" />
                {shareLabel}
              </Button>
              <Button variant="primary">
                <Icon name="user" />
                {viewProfileLabel}
              </Button>
            </div>
          </div>

          <div className={styles.body()}>
            <Card className={styles.card()}>
              <h2 className="text-lg font-semibold">{personalTitle}</h2>
              <p className="mt-1 text-sm text-muted">{personalHint}</p>
              <div className={styles.grid()}>
                <label className={styles.field()}>
                  <Icon name="user" className="text-muted" />
                  <Input
                    aria-label={fullName}
                    defaultValue={name}
                    variant="secondary"
                  />
                </label>
                <label className={styles.field()}>
                  <Icon name="email-at" className="text-muted" />
                  <Input
                    aria-label={emailLabel}
                    defaultValue={email}
                    variant="secondary"
                  />
                </label>
                <label className={styles.field()}>
                  <Icon name="telephone-1" className="text-muted" />
                  <Input
                    aria-label={phoneLabel}
                    defaultValue={phone}
                    variant="secondary"
                  />
                </label>
                <label className={styles.field()}>
                  <Icon name="identity-card-1" className="text-muted" />
                  <Input
                    aria-label={accountType}
                    defaultValue={regular}
                    variant="secondary"
                  />
                </label>
              </div>
              <div className="mt-5">
                <Uploader
                  multiple={false}
                  disabled={createMedia.isPending}
                  accept={imageUploaderAccept}
                  labels={labels}
                  onUpload={async (file) => {
                    try {
                      const media = await createMedia.mutateAsync(file);
                      setAvatarSrc(media.url);
                    } catch {
                      toast.danger(t("error"));
                      throw new Error(t("error"));
                    }
                  }}
                />
              </div>
            </Card>

            <Card className={styles.card()}>
              <h2 className="text-lg font-semibold">{paymentsTitle}</h2>
              <p className="mt-1 text-sm text-muted">{paymentsHint}</p>
              <div className={styles.payout()}>
                <span>{autoPayout}</span>
                <Switch defaultSelected aria-label={autoPayout} />
              </div>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}

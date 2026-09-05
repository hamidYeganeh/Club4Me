"use client";

import { useEffect, useState } from "react";
import { Avatar, Button, Card, Chip, Input, Switch } from "@heroui/react";
import { Icon } from "@theme/icon";
import {
  imageUploaderAccept,
  Uploader,
  type UploaderLabels,
} from "@ui/uploader";
import { useTranslations } from "next-intl";

import { settingsContentSectionStyles } from "./SettingsContentSection.styles";
import type { SettingsContentSectionProps } from "./SettingsContentSection.types";

const defaultAvatar = "https://picsum.photos/seed/gym4me-business/240/240";

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
}: SettingsContentSectionProps) {
  const styles = settingsContentSectionStyles();
  const t = useTranslations("uploader");
  const [avatarSrc, setAvatarSrc] = useState(defaultAvatar);
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

  useEffect(() => {
    return () => {
      if (avatarSrc.startsWith("blob:")) {
        URL.revokeObjectURL(avatarSrc);
      }
    };
  }, [avatarSrc]);

  return (
    <main className={styles.root()}>
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
              <Chip color="accent" size="sm">
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

      <Card variant="transparent" className={styles.card()}>
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
            <Icon name="paper-plane-horizontal" className="text-muted" />
            <Input
              aria-label={emailLabel}
              defaultValue={email}
              variant="secondary"
            />
          </label>
          <label className={styles.field()}>
            <Icon name="flag-1" className="text-muted" />
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
            accept={imageUploaderAccept}
            labels={labels}
            onDrop={(files) => {
              const file = files[0];
              if (!file) {
                return;
              }
              const nextSrc = URL.createObjectURL(file);
              setAvatarSrc((current) => {
                if (current.startsWith("blob:")) {
                  URL.revokeObjectURL(current);
                }
                return nextSrc;
              });
            }}
          />
        </div>
      </Card>

      <Card variant="transparent" className={styles.card()}>
        <h2 className="text-lg font-semibold">{paymentsTitle}</h2>
        <p className="mt-1 text-sm text-muted">{paymentsHint}</p>
        <div className={styles.payout()}>
          <span>{autoPayout}</span>
          <Switch defaultSelected aria-label={autoPayout} />
        </div>
      </Card>
    </main>
  );
}

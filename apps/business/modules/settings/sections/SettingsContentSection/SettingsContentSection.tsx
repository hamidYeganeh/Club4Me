"use client";

import { Avatar, Button, Card, Chip, Input, Switch } from "@heroui/react";
import { Icon } from "@theme/icon";

import { settingsContentSectionStyles } from "./SettingsContentSection.styles";
import type { SettingsContentSectionProps } from "./SettingsContentSection.types";

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
  uploadHint,
  paymentsTitle,
  paymentsHint,
  autoPayout,
}: SettingsContentSectionProps) {
  const styles = settingsContentSectionStyles();

  return (
    <main className={styles.root()}>
      <div className={styles.cover()}>
        <img
          alt=""
          src="https://picsum.photos/seed/club4me-cover/1400/420"
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
            <Avatar.Image
              alt={name}
              src="https://picsum.photos/seed/club4me-business/240/240"
            />
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
        <div className="mt-5 grid gap-4 md:grid-cols-[auto_1fr] md:items-center">
          <Avatar className="size-16">
            <Avatar.Image
              alt={name}
              src="https://picsum.photos/seed/club4me-business/240/240"
            />
            <Avatar.Fallback>{name.slice(0, 1)}</Avatar.Fallback>
          </Avatar>
          <div className={styles.upload()}>
            <Icon name="arrow-upload" size="lg" />
            <span>{uploadHint}</span>
          </div>
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

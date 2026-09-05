"use client";

import { Avatar, Button, Card, Chip, Input, toast } from "@heroui/react";
import { useAdminMe, useLogout } from "@api/admin";
import { Icon } from "@theme/icon";
import { useRouter } from "next/navigation";

import { settingsContentSectionStyles } from "./SettingsContentSection.styles";
import type { SettingsContentSectionProps } from "./SettingsContentSection.types";

export function SettingsContentSection({
  proLabel,
  personalTitle,
  personalHint,
  fullName,
  phoneLabel,
  accountType,
}: SettingsContentSectionProps) {
  const styles = settingsContentSectionStyles();
  const me = useAdminMe();
  const logout = useLogout();
  const router = useRouter();
  const user = me.data;
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.phone || "—";
  const roles = user?.roles.map((role) => role === "admin" ? "مدیر" : role).join("، ") || "—";
  const createdAt = user?.createdAt
    ? new Intl.DateTimeFormat("fa-IR", { dateStyle: "long" }).format(new Date(user.createdAt))
    : "—";

  return (
    <main className={styles.root()}>
      <div className={styles.cover()}>
        <div className="size-full bg-gradient-to-l from-accent/30 via-surface-secondary to-surface" />
      </div>

      <div className={styles.identity()}>
        <div className={styles.person()}>
          <Avatar className="size-24 ring-4 ring-background">
            <Avatar.Fallback>{name.slice(0, 1)}</Avatar.Fallback>
          </Avatar>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className={styles.name()}>{name}</h1>
              <Chip color="accent" size="sm">
                {proLabel}
              </Chip>
            </div>
            <p className={styles.email()}>{user?.phone ?? "—"}</p>
          </div>
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
              value={name}
              readOnly
              variant="secondary"
            />
          </label>
          <label className={styles.field()}>
            <Icon name="calendar-1" className="text-muted" />
            <Input
              aria-label="تاریخ عضویت"
              value={createdAt}
              readOnly
              variant="secondary"
            />
          </label>
          <label className={styles.field()}>
            <Icon name="flag-1" className="text-muted" />
            <Input
              aria-label={phoneLabel}
              value={user?.phone ?? "—"}
              readOnly
              variant="secondary"
            />
          </label>
          <label className={styles.field()}>
            <Icon name="identity-card-1" className="text-muted" />
            <Input
              aria-label={accountType}
              value={roles}
              readOnly
              variant="secondary"
            />
          </label>
        </div>
      </Card>
      <Button variant="danger-soft" isPending={logout.isPending} onPress={() => void logout.mutateAsync().then(() => router.replace("/auth")).catch(() => toast.danger("خروج از حساب انجام نشد"))}>خروج از حساب</Button>
    </main>
  );
}

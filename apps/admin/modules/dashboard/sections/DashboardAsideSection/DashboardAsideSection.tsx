"use client";

import { Avatar, Card } from "@heroui/react";
import { useAdminClasses, useAdminClubs, useAdminMe } from "@api/admin";
import { Icon } from "@theme/icon";
import { ButtonLink } from "@/components/button-link";
import { useState } from "react";

import { dashboardAsideSectionStyles } from "./DashboardAsideSection.styles";
import type { DashboardAsideSectionProps } from "./DashboardAsideSection.types";

const date = new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" });
const number = new Intl.NumberFormat("fa-IR");

export function DashboardAsideSection({ upcomingTitle, addLabel }: DashboardAsideSectionProps) {
  const styles = dashboardAsideSectionStyles();
  const me = useAdminMe();
  const clubs = useAdminClubs();
  const classes = useAdminClasses();
  const [now] = useState(() => Date.now());
  const user = me.data;
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.phone || "مدیر";
  const upcoming = (classes.data?.items ?? []).filter((item) => new Date(item.courseStartAt).getTime() >= now).sort((a, b) => a.courseStartAt.localeCompare(b.courseStartAt)).slice(0, 4);

  return (
    <Card variant="transparent" className={styles.root()}>
      <div className={styles.profile()}>
        <Avatar className="size-20"><Avatar.Fallback>{name.slice(0, 1)}</Avatar.Fallback></Avatar>
        <h2 className={styles.name()}>{name} <Icon name="check-circle" className="text-accent" /></h2>
        <p className={styles.role()}>مدیر پلتفرم</p>
        <div className={styles.stats()}><span>{user?.phone ?? "—"}</span><span>{number.format(clubs.data?.items.length ?? 0)} باشگاه</span></div>
      </div>
      <p className="text-sm font-medium">{upcomingTitle}</p>
      <div className={styles.list()}>
        {upcoming.map((item) => <div key={item.id} className={styles.item()}><span className={styles.itemIcon()}><Icon name="calendar-1" /></span><div><p className={styles.itemTitle()}>{item.title}</p><p className={styles.itemMeta()}>{date.format(new Date(item.courseStartAt))} · {number.format(item.enrollmentCount)}/{number.format(item.capacity)} نفر</p></div></div>)}
        {!classes.isLoading && upcoming.length === 0 ? <p className="text-sm text-muted">کلاس پیش رویی وجود ندارد.</p> : null}
      </div>
      <ButtonLink variant="tertiary" className={styles.add()} href="/clubs"><Icon name="plus" />{addLabel}</ButtonLink>
    </Card>
  );
}

"use client";

import { Card } from "@heroui/react";
import { useAdminAuditLogs, useAdminClasses, useAdminClubs, useAdminUsers } from "@api/admin";
import { Icon } from "@theme/icon";
import { cn } from "@theme/cn";
import { Bar, BarChart, Grid, Line, LineChart, XAxis } from "@ui/charts";
import { ButtonLink } from "@/components/button-link";

import { dashboardWorkspaceSectionStyles } from "./DashboardWorkspaceSection.styles";
import type { DashboardWorkspaceSectionProps } from "./DashboardWorkspaceSection.types";

const number = new Intl.NumberFormat("fa-IR");
const weekday = new Intl.DateTimeFormat("fa-IR", { weekday: "narrow" });

function lastSevenDays(items: Array<{ createdAt: string }>, dataKey: string) {
  return Array.from({ length: 7 }, (_, offset) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - 6 + offset);
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    const count = items.filter((item) => {
      const createdAt = new Date(item.createdAt);
      return createdAt >= date && createdAt < next;
    }).length;
    return { label: weekday.format(date), [dataKey]: count };
  });
}

export function DashboardWorkspaceSection({ scoreTitle, activityTitle, seeAll, suggestionLabel, hoursTitle, checkinsTitle, bookingsTitle }: DashboardWorkspaceSectionProps) {
  const styles = dashboardWorkspaceSectionStyles();
  const users = useAdminUsers();
  const clubs = useAdminClubs();
  const classes = useAdminClasses();
  const auditLogs = useAdminAuditLogs(50);
  const userItems = users.data?.items ?? [];
  const clubItems = clubs.data?.items ?? [];
  const classItems = classes.data?.items ?? [];
  const scoreData = lastSevenDays(userItems, "users");
  const activityData = [
    { label: "تأییدشده", value: clubItems.filter((club) => club.reviewStatus === "approved").length, color: "var(--chart-2)" },
    { label: "در انتظار", value: clubItems.filter((club) => club.reviewStatus === "pending").length, color: "var(--chart-1)" },
    { label: "سایر", value: clubItems.filter((club) => club.reviewStatus === "draft" || club.reviewStatus === "rejected").length, color: "var(--chart-3)" },
  ];
  const pendingClubs = activityData[1]?.value ?? 0;
  const activeClasses = classItems.filter((item) => ["published", "registration_closed", "in_progress"].includes(item.status)).length;
  const loading = users.isLoading || clubs.isLoading || classes.isLoading;
  const value = (count: number) => loading ? "—" : number.format(count);
  const auditData = lastSevenDays(auditLogs.data?.items ?? [], "value");

  return (
    <section className={styles.root()}>
      <Card variant="transparent" className={cn(styles.card(), styles.score())}>
        <p className={styles.cardTitle()}>{scoreTitle}</p>
        <p className={styles.cardValue()}>{value(userItems.length)}</p>
        <div className="mt-3 h-40"><LineChart data={scoreData}><Grid /><Line dataKey="users" stroke="var(--chart-1)" curve="step" fill /><XAxis /></LineChart></div>
        <p className="mt-3 text-xs text-muted">کاربران جدید در ۷ روز گذشته</p>
      </Card>
      <Card variant="transparent" className={cn(styles.card(), styles.activity())}>
        <div className="flex items-center justify-between"><p className={styles.cardTitle()}>{activityTitle}</p><ButtonLink size="sm" variant="ghost" className="text-accent" href="/clubs">{seeAll}</ButtonLink></div>
        <div className="mt-4 h-52"><BarChart data={activityData}><Bar dataKey="value" /></BarChart></div>
      </Card>
      <Card variant="transparent" className={cn(styles.card(), styles.suggestion())}>
        <div><p className={styles.cardValue()}>{value(pendingClubs)}</p><p className={styles.cardTitle()}>{suggestionLabel}</p></div>
        <ButtonLink isIconOnly aria-label={suggestionLabel} className={styles.suggestionBtn()} variant="secondary" href="/clubs"><Icon name="arrow-left" /></ButtonLink>
      </Card>
      <Card variant="transparent" className={cn(styles.card(), styles.hours())}><p className={styles.cardTitle()}>{hoursTitle}</p><p className={styles.cardValue()}>{value(clubItems.length)}</p></Card>
      <Card variant="transparent" className={cn(styles.card(), styles.checkins())}>
        <p className={styles.cardTitle()}>{checkinsTitle}</p><p className={styles.cardValue()}>{value(activeClasses)}</p>
        <div className={styles.dots()}>{Array.from({ length: Math.min(classItems.length, 40) }, (_, index) => <span key={index} className={cn(styles.dot(), index < activeClasses && styles.dotOn())} />)}</div>
      </Card>
      <Card variant="transparent" className={cn(styles.card(), styles.bookings())}>
        <p className={styles.cardTitle()}>{bookingsTitle}</p><p className={styles.cardValue()}>{auditLogs.isLoading ? "—" : number.format(auditLogs.data?.items.length ?? 0)}</p>
        <div className="mt-3 h-24"><BarChart data={auditData}><Bar dataKey="value" fill="var(--chart-2)" radius={6} /></BarChart></div>
      </Card>
    </section>
  );
}

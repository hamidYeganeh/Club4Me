"use client";

import { Button } from "@heroui/react";
import { Icon } from "@theme/icon";
import { cn } from "@theme/cn";
import { Grid, Line, LineChart, RingChart, XAxis } from "@ui/charts";
import { useState } from "react";

import { ButtonLink } from "@/components/button-link";

import { dashboardWorkspaceSectionStyles } from "./DashboardWorkspaceSection.styles";
import type { DashboardWorkspaceSectionProps } from "./DashboardWorkspaceSection.types";

const occupancyData = [
  { label: "ش", value: 62 },
  { label: "ی", value: 71 },
  { label: "د", value: 68 },
  { label: "س", value: 84 },
  { label: "چ", value: 79 },
  { label: "پ", value: 91 },
  { label: "ج", value: 74 },
];

const checkinData = [
  { label: "ش", value: 820 },
  { label: "ی", value: 940 },
  { label: "د", value: 880 },
  { label: "س", value: 1100 },
  { label: "چ", value: 1020 },
  { label: "پ", value: 1250 },
  { label: "ج", value: 990 },
];

const scoreData = [
  { label: "ش", present: 88, prediction: 90 },
  { label: "ی", present: 91, prediction: 93 },
  { label: "د", present: 86, prediction: 92 },
  { label: "س", present: 94, prediction: 95 },
  { label: "چ", present: 90, prediction: 96 },
  { label: "پ", present: 97, prediction: 98 },
  { label: "ج", present: 93, prediction: 99 },
];

export function DashboardWorkspaceSection({
  workouts,
  metrics,
  nutrition,
  coaches,
  featuredTitle,
  featuredSubtitle,
  occupancyTitle,
  occupancyValue,
  checkinsTitle,
  checkinsValue,
  scoreTitle,
  scoreValue,
  scoreUnit,
  downtrend,
  present,
  prediction,
  aiMessages,
  aiName,
  mixTitle,
  mixValue,
  mixUnit,
  mixStrength,
  mixCardio,
  mixRecovery,
  ranges,
}: DashboardWorkspaceSectionProps) {
  const styles = dashboardWorkspaceSectionStyles();
  const [range, setRange] = useState("1w");

  return (
    <section className={styles.root()}>
      <div className={styles.tabs()}>
        <div className="flex gap-5">
          <span className={cn(styles.tab(), styles.tabActive())}>{workouts}</span>
          <span className={styles.tab()}>{metrics}</span>
          <span className={styles.tab()}>{nutrition}</span>
          <span className={styles.tab()}>{coaches}</span>
        </div>
      </div>

      <article className={styles.featured()}>
        <img
          alt={featuredTitle}
          src="https://picsum.photos/seed/club4me-muay/900/1200"
          className={styles.featuredImage()}
        />
        <div className={styles.featuredScrim()} />
        <div className={styles.featuredBody()}>
          <h2 className={styles.featuredTitle()}>{featuredTitle}</h2>
          <p className={styles.featuredMeta()}>{featuredSubtitle}</p>
          <div className={styles.featuredActions()}>
            <Button isIconOnly variant="secondary" className="rounded-full">
              <Icon name="gear-1" />
            </Button>
            <Button isIconOnly variant="secondary" className="rounded-full">
              <Icon name="calendar-1" />
            </Button>
            <Button isIconOnly variant="primary" className="rounded-full">
              <Icon name="plus-fat" />
            </Button>
          </div>
        </div>
      </article>

      <article className={cn(styles.card(), styles.occupancy())}>
        <p className={styles.cardTitle()}>{occupancyTitle}</p>
        <p className={styles.cardValue()}>{occupancyValue}</p>
        <div className="mt-2 h-20">
          <LineChart data={occupancyData}>
            <Line dataKey="value" stroke="var(--chart-2)" fill />
          </LineChart>
        </div>
      </article>

      <article className={cn(styles.card(), styles.checkins())}>
        <p className={styles.cardTitle()}>{checkinsTitle}</p>
        <p className={styles.cardValue()}>{checkinsValue}</p>
        <div className="mt-2 h-20">
          <LineChart data={checkinData}>
            <Line dataKey="value" stroke="var(--chart-1)" fill />
          </LineChart>
        </div>
      </article>

      <article className={cn(styles.card(), styles.score())}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={styles.cardTitle()}>{scoreTitle}</p>
            <p className={styles.cardValue()}>
              {scoreValue}{" "}
              <span className="text-base font-medium text-muted">{scoreUnit}</span>
            </p>
            <p className="mt-1 text-xs text-danger">{downtrend}</p>
          </div>
          <div className="flex flex-wrap gap-1">
            {ranges.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setRange(item.id)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs text-muted",
                  range === item.id && "bg-accent text-accent-foreground",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 h-40">
          <LineChart data={scoreData}>
            <Grid />
            <Line dataKey="prediction" stroke="var(--chart-3)" curve="step" />
            <Line dataKey="present" stroke="var(--chart-1)" curve="step" fill />
            <XAxis />
          </LineChart>
        </div>
        <div className={styles.legend()}>
          <span>{present}</span>
          <span>{prediction}</span>
        </div>
      </article>

      <article className={cn(styles.card(), styles.mix())}>
        <p className={styles.cardTitle()}>{mixTitle}</p>
        <div className="mt-2 h-40">
          <RingChart
            centerValue={mixValue}
            centerLabel={mixUnit}
            segments={[
              {
                key: "strength",
                label: mixStrength,
                value: 46,
                color: "var(--chart-1)",
              },
              {
                key: "cardio",
                label: mixCardio,
                value: 32,
                color: "var(--chart-2)",
              },
              {
                key: "recovery",
                label: mixRecovery,
                value: 22,
                color: "var(--chart-3)",
              },
            ]}
          />
        </div>
      </article>

      <ButtonLink
        href="/coach"
        className={cn(styles.card(), styles.ai())}
      >
        <div>
          <p className="text-sm opacity-80">{aiMessages}</p>
          <p className="text-lg font-semibold">{aiName}</p>
        </div>
        <span className="flex size-11 items-center justify-center rounded-full bg-accent-foreground text-accent">
          <Icon name="arrow-left" />
        </span>
      </ButtonLink>
    </section>
  );
}

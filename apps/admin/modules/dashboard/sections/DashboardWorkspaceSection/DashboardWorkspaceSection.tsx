"use client";

import {
  Button,
  Card,
  ToggleButton,
  ToggleButtonGroup,
} from "@heroui/react";
import { Icon } from "@theme/icon";
import { cn } from "@theme/cn";
import { Bar, BarChart, Grid, Line, LineChart, XAxis } from "@ui/charts";
import { useState } from "react";

import { dashboardWorkspaceSectionStyles } from "./DashboardWorkspaceSection.styles";
import type { DashboardWorkspaceSectionProps } from "./DashboardWorkspaceSection.types";

const scoreData = [
  { label: "ش", score: 62, predicted: 58 },
  { label: "ی", score: 70, predicted: 64 },
  { label: "د", score: 66, predicted: 71 },
  { label: "س", score: 78, predicted: 74 },
  { label: "چ", score: 73, predicted: 80 },
  { label: "پ", score: 84, predicted: 79 },
  { label: "ج", score: 81, predicted: 86 },
];

const hoursData = [
  { label: "ش", hours: 18 },
  { label: "ی", hours: 22 },
  { label: "د", hours: 16 },
  { label: "س", hours: 28 },
  { label: "چ", hours: 24 },
  { label: "پ", hours: 31 },
  { label: "ج", hours: 21 },
];

const bookingsData = [
  { label: "۱", value: 42 },
  { label: "۲", value: 58 },
  { label: "۳", value: 36 },
  { label: "۴", value: 71 },
  { label: "۵", value: 48 },
  { label: "۶", value: 64 },
  { label: "۷", value: 52 },
  { label: "۸", value: 77 },
  { label: "۹", value: 45 },
  { label: "۱۰", value: 69 },
];

export function DashboardWorkspaceSection({
  scoreTitle,
  scoreValue,
  scoreUnit,
  activityTitle,
  seeAll,
  suggestionValue,
  suggestionLabel,
  hoursTitle,
  hoursValue,
  checkinsTitle,
  checkinsValue,
  bookingsTitle,
  bookingsValue,
  ranges,
  strength,
  hiit,
  boxing,
}: DashboardWorkspaceSectionProps) {
  const styles = dashboardWorkspaceSectionStyles();
  const [range, setRange] = useState(ranges[0]?.id ?? "1d");
  const activityData = [
    { label: strength, value: 195, color: "var(--chart-2)" },
    { label: hiit, value: 77, color: "var(--chart-1)" },
    { label: boxing, value: 33, color: "var(--chart-3)" },
  ];

  return (
    <section className={styles.root()}>
      <Card variant="transparent" className={cn(styles.card(), styles.score())}>
        <p className={styles.cardTitle()}>{scoreTitle}</p>
        <p className={styles.cardValue()}>
          {scoreValue}{" "}
          <span className="text-base font-medium text-muted">{scoreUnit}</span>
        </p>
        <div className="mt-3 h-40">
          <LineChart data={scoreData}>
            <Grid />
            <Line dataKey="predicted" stroke="var(--chart-3)" curve="step" />
            <Line dataKey="score" stroke="var(--chart-1)" curve="step" fill />
            <XAxis />
          </LineChart>
        </div>
        <ToggleButtonGroup
          className={styles.range()}
          disallowEmptySelection
          selectedKeys={new Set([range])}
          selectionMode="single"
          size="sm"
          onSelectionChange={(keys) => {
            const next = [...keys][0];
            if (typeof next === "string") setRange(next);
          }}
        >
          {ranges.map((item) => (
            <ToggleButton
              key={item.id}
              className={cn(
                styles.rangeBtn(),
                range === item.id && styles.rangeActive(),
              )}
              id={item.id}
              size="sm"
            >
              {item.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Card>

      <Card variant="transparent" className={cn(styles.card(), styles.activity())}>
        <div className="flex items-center justify-between">
          <p className={styles.cardTitle()}>{activityTitle}</p>
          <Button size="sm" variant="ghost" className="text-accent">
            {seeAll}
          </Button>
        </div>
        <div className="mt-4 h-52">
          <BarChart data={activityData}>
            <Bar dataKey="value" />
          </BarChart>
        </div>
      </Card>

      <Card variant="transparent" className={cn(styles.card(), styles.suggestion())}>
        <div>
          <p className={styles.cardValue()}>{suggestionValue}</p>
          <p className={styles.cardTitle()}>{suggestionLabel}</p>
        </div>
        <Button
          isIconOnly
          aria-label={suggestionLabel}
          className={styles.suggestionBtn()}
          variant="secondary"
        >
          <Icon name="arrow-left" />
        </Button>
      </Card>

      <Card variant="transparent" className={cn(styles.card(), styles.hours())}>
        <p className={styles.cardTitle()}>{hoursTitle}</p>
        <p className={styles.cardValue()}>{hoursValue}</p>
        <div className="mt-3 h-24">
          <LineChart data={hoursData}>
            <Line dataKey="hours" stroke="var(--chart-2)" fill />
          </LineChart>
        </div>
      </Card>

      <Card variant="transparent" className={cn(styles.card(), styles.checkins())}>
        <p className={styles.cardTitle()}>{checkinsTitle}</p>
        <p className={styles.cardValue()}>{checkinsValue}</p>
        <div className={styles.dots()}>
          {Array.from({ length: 40 }, (_, index) => (
            <span
              key={index}
              className={cn(styles.dot(), index >= 26 && styles.dotOn())}
            />
          ))}
        </div>
      </Card>

      <Card variant="transparent" className={cn(styles.card(), styles.bookings())}>
        <p className={styles.cardTitle()}>{bookingsTitle}</p>
        <p className={styles.cardValue()}>{bookingsValue}</p>
        <div className="mt-3 h-24">
          <BarChart data={bookingsData}>
            <Bar dataKey="value" fill="var(--chart-2)" radius={6} />
          </BarChart>
        </div>
      </Card>
    </section>
  );
}

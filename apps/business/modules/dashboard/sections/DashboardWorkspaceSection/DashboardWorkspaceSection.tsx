"use client";

import { Card, ToggleButton, ToggleButtonGroup } from "@heroui/react";
import { Icon } from "@theme/icon";
import { cn } from "@theme/cn";
import { Bar, BarChart, Grid, Line, LineChart, RingChart, XAxis } from "@ui/charts";
import { useState } from "react";

import { ButtonLink } from "@/components/button-link";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/motion/tabs";

import { dashboardWorkspaceSectionStyles } from "./DashboardWorkspaceSection.styles";
import type { DashboardWorkspaceSectionProps } from "./DashboardWorkspaceSection.types";

const stepsData = [
  { label: "ش", value: 42 },
  { label: "ی", value: 58 },
  { label: "د", value: 51 },
  { label: "س", value: 73 },
  { label: "چ", value: 66 },
  { label: "پ", value: 88 },
  { label: "ج", value: 61 },
];

const hydrationData = [
  { label: "ش", value: 38 },
  { label: "ی", value: 55 },
  { label: "د", value: 47 },
  { label: "س", value: 62 },
  { label: "چ", value: 70 },
  { label: "پ", value: 81 },
  { label: "ج", value: 54 },
];

const scoreData = [
  { label: "ش", present: 78, prediction: 80 },
  { label: "ی", present: 81, prediction: 84 },
  { label: "د", present: 76, prediction: 86 },
  { label: "س", present: 85, prediction: 88 },
  { label: "چ", present: 83, prediction: 90 },
  { label: "پ", present: 89, prediction: 92 },
  { label: "ج", present: 87, prediction: 94 },
];

export function DashboardWorkspaceSection({
  workouts,
  metrics,
  nutrition,
  coaches,
  welcomeTitle,
  welcomeSubtitle,
  stepsTitle,
  stepsValue,
  hydrationTitle,
  hydrationValue,
  calorieTitle,
  calorieValue,
  calorieUnit,
  protein,
  carbs,
  macro,
  upcomingTitle,
  upcomingName,
  scoreTitle,
  scoreValue,
  scoreUnit,
  scoreTrend,
  present,
  prediction,
  ranges,
  movementsTitle,
  difficulty,
  gain,
  easy,
  hard,
  normal,
  edit,
  deleteLabel,
  suggestionLabel,
  aiMessages,
  aiName,
  featuredHref = "/classes",
  coachHref = "/coach",
}: DashboardWorkspaceSectionProps) {
  const styles = dashboardWorkspaceSectionStyles();
  const [range, setRange] = useState(ranges[0]?.id ?? "1d");
  const [tab, setTab] = useState("workouts");

  const movements = [
    {
      name: "Maximum Plank",
      hint: "پایداری مرکزی",
      level: "normal" as const,
      gain: 62,
    },
    {
      name: "Ultra Plank Walk",
      hint: "قدرت عملکردی",
      level: "hard" as const,
      gain: 84,
    },
    {
      name: "Airwalk 3.0",
      hint: "تعادل و هماهنگی",
      level: "easy" as const,
      gain: 41,
    },
  ];

  return (
    <section className={styles.root()}>
      <div className={styles.tabsRow()}>
        <Tabs
          value={tab}
          onValueChange={setTab}
          variant="underline"
          className="min-w-0"
        >
          <TabsList className="border-transparent bg-transparent">
            <TabsTrigger value="workouts">{workouts}</TabsTrigger>
            <TabsTrigger value="nutrition">{nutrition}</TabsTrigger>
            <TabsTrigger value="coaches">{coaches}</TabsTrigger>
            <TabsTrigger value="metrics">{metrics}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card className={styles.welcome()}>
        <div className={styles.welcomeCopy()}>
          <h2 className={styles.welcomeTitle()}>{welcomeTitle}</h2>
          <p className={styles.welcomeSubtitle()}>{welcomeSubtitle}</p>
        </div>
        <ButtonLink
          href={coachHref}
          isIconOnly
          aria-label={coaches}
          className={styles.welcomeAction()}
          variant="secondary"
        >
          <Icon name="arrow-left" />
        </ButtonLink>
      </Card>

      <Card className={styles.calorie()}>
        <p className={styles.cardTitle()}>{calorieTitle}</p>
        <div className="mt-2 h-36 flex-1">
          <RingChart
            centerValue={calorieValue}
            centerLabel={calorieUnit}
            thickness={16}
            segments={[
              {
                key: "protein",
                label: protein,
                value: 42,
                color: "var(--chart-1)",
              },
              {
                key: "carbs",
                label: carbs,
                value: 34,
                color: "var(--chart-2)",
              },
              {
                key: "macro",
                label: macro,
                value: 24,
                color: "var(--muted)",
              },
            ]}
          />
        </div>
        <div className={styles.legend()}>
          <span className="inline-flex items-center gap-2">
            <span className={cn(styles.legendDot(), "bg-accent")} />
            {protein}
          </span>
          <span className="inline-flex items-center gap-2">
            <span
              className={cn(styles.legendDot(), "bg-[var(--chart-2)]")}
            />
            {carbs}
          </span>
          <span className="inline-flex items-center gap-2">
            <span className={cn(styles.legendDot(), "bg-muted")} />
            {macro}
          </span>
        </div>
      </Card>

      <Card className={styles.steps()}>
        <p className={styles.cardTitle()}>{stepsTitle}</p>
        <div className="mt-3 h-24">
          <BarChart data={stepsData}>
            <Bar dataKey="value" fill="var(--chart-1)" radius={8} />
          </BarChart>
        </div>
        <p className={styles.cardValue()}>{stepsValue}</p>
      </Card>

      <Card className={styles.hydration()}>
        <p className={styles.cardTitle()}>{hydrationTitle}</p>
        <div className="mt-3 h-24">
          <BarChart data={hydrationData}>
            <Bar dataKey="value" fill="var(--chart-2)" radius={8} />
          </BarChart>
        </div>
        <p className={styles.cardValue()}>{hydrationValue}</p>
      </Card>

      <Card className={styles.upcoming()}>
        <div>
          <span className="inline-flex size-10 items-center justify-center rounded-full bg-background/20">
            <Icon name="kettlebell" />
          </span>
          <p className="mt-4 text-sm opacity-80">{upcomingTitle}</p>
          <p className="mt-1 text-2xl font-semibold">{upcomingName}</p>
        </div>
        <ButtonLink
          href={featuredHref}
          isIconOnly
          aria-label={upcomingName}
          className="ms-auto size-11 rounded-full bg-foreground text-background"
          variant="secondary"
        >
          <Icon name="arrow-left" />
        </ButtonLink>
      </Card>

      <Card className={styles.score()}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className={styles.cardTitle()}>{scoreTitle}</p>
            <p className={styles.cardValue()}>
              {scoreValue}{" "}
              <span className="text-base font-medium text-muted">
                {scoreUnit}
              </span>
            </p>
            <p className="mt-1 text-xs text-success">{scoreTrend}</p>
          </div>
          <ToggleButtonGroup
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
                  "rounded-full px-3 py-1 text-xs text-muted",
                  range === item.id && "bg-accent text-accent-foreground",
                )}
                id={item.id}
                size="sm"
              >
                {item.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </div>
        <div className="mt-3 h-44">
          <LineChart data={scoreData}>
            <Grid />
            <Line dataKey="prediction" stroke="var(--chart-2)" />
            <Line dataKey="present" stroke="var(--chart-1)" fill />
            <XAxis />
          </LineChart>
        </div>
        <div className={styles.legend()}>
          <span className="inline-flex items-center gap-2">
            <span className={cn(styles.legendDot(), "bg-accent")} />
            {present}
          </span>
          <span className="inline-flex items-center gap-2">
            <span
              className={cn(styles.legendDot(), "bg-[var(--chart-2)]")}
            />
            {prediction}
          </span>
        </div>
      </Card>

      <Card className={styles.suggestion()}>
        <div>
          <p className="text-sm opacity-80">{suggestionLabel}</p>
          <p className="mt-1 text-xl font-semibold">{aiMessages}</p>
        </div>
        <ButtonLink
          href={coachHref}
          isIconOnly
          aria-label={aiName}
          className="size-12 rounded-full bg-accent-foreground text-accent"
          variant="secondary"
        >
          <Icon name="arrow-left" />
        </ButtonLink>
      </Card>

      <Card className={styles.movements()}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-semibold">{movementsTitle}</h2>
            <p className="mt-1 text-sm text-muted">
              {difficulty} · {gain}
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className={styles.table()}>
            <thead>
              <tr className="text-start text-xs text-muted">
                <th className="px-2 py-1 font-medium">{movementsTitle}</th>
                <th className="px-2 py-1 font-medium">{difficulty}</th>
                <th className="px-2 py-1 font-medium">{gain}</th>
                <th className="px-2 py-1 font-medium" />
              </tr>
            </thead>
            <tbody>
              {movements.map((row) => (
                <tr key={row.name} className="rounded-2xl bg-surface/60">
                  <td className="rounded-s-2xl px-3 py-3">
                    <p className="font-medium">{row.name}</p>
                    <p className="text-xs text-muted">{row.hint}</p>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={
                        row.level === "easy"
                          ? styles.chipEasy()
                          : row.level === "hard"
                            ? styles.chipHard()
                            : styles.chipNormal()
                      }
                    >
                      {row.level === "easy"
                        ? easy
                        : row.level === "hard"
                          ? hard
                          : normal}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <div className={styles.progressTrack()}>
                        <div
                          className={cn(
                            styles.progressFill(),
                            row.level === "easy"
                              ? "bg-[var(--chart-2)]"
                              : row.level === "hard"
                                ? "bg-accent"
                                : "bg-muted",
                          )}
                          style={{ width: `${row.gain}%` }}
                        />
                      </div>
                      <span className="tabular-nums text-xs text-muted">
                        {row.gain}٪
                      </span>
                    </div>
                  </td>
                  <td className="rounded-e-2xl px-3 py-3 text-end">
                    <div className="flex justify-end gap-3 text-xs">
                      <button type="button" className="text-danger">
                        {deleteLabel}
                      </button>
                      <button type="button" className="text-warning">
                        {edit}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className={styles.aiBanner()}>
        <div>
          <p className="text-sm opacity-85">{aiMessages}</p>
          <p className="mt-1 text-xl font-semibold">{aiName}</p>
        </div>
        <ButtonLink
          href={coachHref}
          isIconOnly
          aria-label={aiName}
          className="size-12 rounded-full bg-white text-[var(--chart-2)]"
          variant="secondary"
        >
          <Icon name="arrow-left" />
        </ButtonLink>
      </Card>
    </section>
  );
}

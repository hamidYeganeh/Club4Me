"use client";

import {
  Button,
  Card,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
} from "@heroui/react";
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
      <Tabs className={styles.tabs()} defaultSelectedKey="workouts">
        <Tabs.ListContainer className="rounded-none bg-transparent">
          <Tabs.List aria-label={workouts}>
            <Tabs.Tab className="text-muted data-[selected=true]:text-foreground" id="workouts">
              {workouts}
              <Tabs.Indicator className="bg-accent" />
            </Tabs.Tab>
            <Tabs.Tab className="text-muted data-[selected=true]:text-foreground" id="metrics">
              {metrics}
              <Tabs.Indicator className="bg-accent" />
            </Tabs.Tab>
            <Tabs.Tab className="text-muted data-[selected=true]:text-foreground" id="nutrition">
              {nutrition}
              <Tabs.Indicator className="bg-accent" />
            </Tabs.Tab>
            <Tabs.Tab className="text-muted data-[selected=true]:text-foreground" id="coaches">
              {coaches}
              <Tabs.Indicator className="bg-accent" />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>

      <Card variant="transparent" className={styles.featured()}>
        <img
          alt={featuredTitle}
          src="https://picsum.photos/seed/gym4me-muay/900/1200"
          className={styles.featuredImage()}
        />
        <div className={styles.featuredScrim()} />
        <div className={styles.featuredBody()}>
          <h2 className={styles.featuredTitle()}>{featuredTitle}</h2>
          <p className={styles.featuredMeta()}>{featuredSubtitle}</p>
          <div className={styles.featuredActions()}>
            <Button isIconOnly className="rounded-full" variant="secondary">
              <Icon name="gear-1" />
            </Button>
            <Button isIconOnly className="rounded-full" variant="secondary">
              <Icon name="calendar-1" />
            </Button>
            <Button isIconOnly className="rounded-full" variant="primary">
              <Icon name="plus-fat" />
            </Button>
          </div>
        </div>
      </Card>

      <Card variant="transparent" className={cn(styles.card(), styles.occupancy())}>
        <p className={styles.cardTitle()}>{occupancyTitle}</p>
        <p className={styles.cardValue()}>{occupancyValue}</p>
        <div className="mt-2 h-20">
          <LineChart data={occupancyData}>
            <Line dataKey="value" stroke="var(--chart-2)" fill />
          </LineChart>
        </div>
      </Card>

      <Card variant="transparent" className={cn(styles.card(), styles.checkins())}>
        <p className={styles.cardTitle()}>{checkinsTitle}</p>
        <p className={styles.cardValue()}>{checkinsValue}</p>
        <div className="mt-2 h-20">
          <LineChart data={checkinData}>
            <Line dataKey="value" stroke="var(--chart-1)" fill />
          </LineChart>
        </div>
      </Card>

      <Card variant="transparent" className={cn(styles.card(), styles.score())}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={styles.cardTitle()}>{scoreTitle}</p>
            <p className={styles.cardValue()}>
              {scoreValue}{" "}
              <span className="text-base font-medium text-muted">{scoreUnit}</span>
            </p>
            <p className="mt-1 text-xs text-danger">{downtrend}</p>
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
      </Card>

      <Card variant="transparent" className={cn(styles.card(), styles.mix())}>
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
      </Card>

      <ButtonLink href="/coach" className={cn(styles.card(), styles.ai())}>
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

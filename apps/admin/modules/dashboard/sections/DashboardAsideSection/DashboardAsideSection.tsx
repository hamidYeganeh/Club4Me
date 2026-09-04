"use client";

import { Avatar, Button, Card } from "@heroui/react";
import { Icon } from "@theme/icon";

import { dashboardAsideSectionStyles } from "./DashboardAsideSection.styles";
import type { DashboardAsideSectionProps } from "./DashboardAsideSection.types";

export function DashboardAsideSection({
  name,
  role,
  location,
  age,
  clubs,
  upcomingTitle,
  items,
  addLabel,
}: DashboardAsideSectionProps) {
  const styles = dashboardAsideSectionStyles();

  return (
    <Card variant="transparent" className={styles.root()}>
      <div className={styles.profile()}>
        <Avatar className="size-20">
          <Avatar.Image
            alt={name}
            src="https://picsum.photos/seed/gym4me-admin/240/240"
          />
          <Avatar.Fallback>{name.slice(0, 1)}</Avatar.Fallback>
        </Avatar>
        <h2 className={styles.name()}>
          {name} <Icon name="check-circle" className="text-accent" />
        </h2>
        <p className={styles.role()}>{role}</p>
        <div className={styles.stats()}>
          <span>{location}</span>
          <span>{age}</span>
          <span>{clubs}</span>
        </div>
      </div>
      <p className="text-sm font-medium">{upcomingTitle}</p>
      <div className={styles.list()}>
        {items.map((item) => (
          <div key={item.title} className={styles.item()}>
            <span className={styles.itemIcon()}>
              <Icon name={item.icon} />
            </span>
            <div>
              <p className={styles.itemTitle()}>{item.title}</p>
              <p className={styles.itemMeta()}>{item.meta}</p>
            </div>
          </div>
        ))}
      </div>
      <Button variant="tertiary" className={styles.add()}>
        <Icon name="plus" />
        {addLabel}
      </Button>
    </Card>
  );
}

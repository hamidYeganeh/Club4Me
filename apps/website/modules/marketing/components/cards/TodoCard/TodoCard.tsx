"use client";

import { Button } from "@heroui/react/button";
import { Card } from "@heroui/react/card";
import { Separator } from "@heroui/react/separator";
import { Typography } from "@heroui/react/typography";
import { Check } from "@modules/marketing/icons/icons/Check";
import { todoCardVariants } from "./TodoCard.styles";
import type { TodoCardItem, TodoCardProps } from "./TodoCard.types";

const CHECK_SIZE = 14;

function completedCount(items: TodoCardItem[]): number {
  return items.filter((item) => item.status === "completed").length;
}

export function TodoCard({
  stepLabel,
  title,
  items,
  progressLabel,
  className,
  ...props
}: TodoCardProps) {
  if (items.length === 0) {
    return null;
  }

  const slots = todoCardVariants();
  const done = completedCount(items);

  return (
    <Card
      aria-label={typeof title === "string" ? title : undefined}
      className={slots.root({ className })}
      variant="default"
      {...props}
    >
      <div className={slots.header()}>
        <Typography
          className={slots.stepLabel()}
          type="body-xs"
          weight="semibold"
        >
          {stepLabel}
        </Typography>
        <Typography className={slots.title()} type="h4" weight="bold">
          {title}
        </Typography>
        <div
          aria-label={progressLabel}
          aria-valuemax={items.length}
          aria-valuemin={0}
          aria-valuenow={done}
          className={slots.progress()}
          role="progressbar"
        >
          {items.map((item, index) => (
            <span
              aria-hidden
              className={todoCardVariants({
                segmentFilled: index < done,
              }).progressSegment()}
              key={item.id}
            />
          ))}
        </div>
      </div>

      <div className={slots.list()} role="list">
        {items.map((item, index) => {
          const isCompleted = item.status === "completed";
          const interactive = !isCompleted && item.onPress != null;
          const rowSlots = todoCardVariants({
            itemStatus: item.status,
            interactive,
          });

          const body = (
            <>
              <span aria-hidden className={rowSlots.index()}>
                {index + 1}
              </span>
              <Typography
                className={rowSlots.label()}
                type="body-sm"
                weight="medium"
              >
                {item.label}
              </Typography>
              <span
                aria-hidden
                className={rowSlots.check()}
                data-status={item.status}
              >
                {isCompleted ? <Check size={CHECK_SIZE} /> : null}
              </span>
            </>
          );

          return (
            <div key={item.id} role="listitem">
              {index > 0 ? <Separator className={slots.divider()} /> : null}
              {interactive ? (
                <Button
                  aria-label={
                    typeof item.label === "string" ? item.label : undefined
                  }
                  className={rowSlots.row()}
                  onPress={item.onPress}
                  variant="ghost"
                >
                  {body}
                </Button>
              ) : (
                <div className={rowSlots.row()}>{body}</div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

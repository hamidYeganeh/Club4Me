"use client";

import { Button } from "@heroui/react/button";
import { Typography } from "@heroui/react/typography";
import { LightningBolt2 } from "@modules/marketing/icons/icons/LightningBolt2";
import { brandAwareText } from "../../kit/LineShadowText";
import { spotlightCardVariants } from "./SpotlightCard.styles";
import type { SpotlightCardProps } from "./SpotlightCard.types";

function clampProgress(value: number | undefined) {
  if (value == null || Number.isNaN(value)) return null;
  return Math.min(100, Math.max(0, value));
}

export function SpotlightCard({
  eyebrow,
  title,
  description,
  value,
  unit,
  progress,
  progressLabel,
  actionLabel,
  actionAriaLabel,
  onAction,
  icon,
  className,
  ...props
}: SpotlightCardProps) {
  const slots = spotlightCardVariants();
  const progressValue = clampProgress(progress);

  return (
    <div className={slots.root({ className })} {...props}>
      <div className={slots.header()}>
        {eyebrow != null ? (
          <span className={slots.eyebrow()}>{brandAwareText(eyebrow)}</span>
        ) : (
          <span />
        )}
        <span aria-hidden className={slots.icon()}>
          {icon ?? <LightningBolt2 size={20} />}
        </span>
      </div>

      <div className={slots.content()}>
        <Typography className={slots.title()} type="h3" weight="bold">
          {title}
        </Typography>
        {description != null ? (
          <Typography className={slots.description()} type="body-sm">
            {brandAwareText(description)}
          </Typography>
        ) : null}
      </div>

      <div className={slots.footer()}>
        {value != null || progressValue != null ? (
          <div className={slots.metric()}>
            {value != null ? (
              <div className={slots.valueRow()}>
                <span className={slots.value()}>{value}</span>
                {unit != null ? (
                  <span className={slots.unit()}>{unit}</span>
                ) : null}
              </div>
            ) : null}
            {progressValue != null ? (
              <div
                aria-label={progressLabel}
                aria-valuemax={100}
                aria-valuemin={0}
                aria-valuenow={progressValue}
                className={slots.progressTrack()}
                role="progressbar"
              >
                <div
                  className={slots.progressBar()}
                  style={{ width: `${progressValue}%` }}
                />
              </div>
            ) : null}
          </div>
        ) : (
          <span />
        )}

        {actionLabel != null && onAction ? (
          <Button
            aria-label={actionAriaLabel}
            className={slots.action()}
            onPress={onAction}
            variant="ghost"
          >
            {actionLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

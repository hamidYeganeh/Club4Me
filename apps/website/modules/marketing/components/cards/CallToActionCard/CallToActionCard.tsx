"use client";

import { Button } from "@heroui/react/button";
import { Chip } from "@heroui/react/chip";
import { Typography } from "@heroui/react/typography";
import { ChatLine } from "@modules/marketing/icons/icons/ChatLine";
import { Hourglass1 } from "@modules/marketing/icons/icons/Hourglass1";
import { Plus } from "@modules/marketing/icons/icons/Plus";
import { callToActionCardVariants } from "./CallToActionCard.styles";
import type { CallToActionCardProps } from "./CallToActionCard.types";

export function CallToActionCard({
  variant = "primary",
  actionType = "plus",
  subtitle,
  title,
  meta,
  badge,
  icon,
  actionLabel,
  onAction,
  actionClassName,
  className,
  ...props
}: CallToActionCardProps) {
  const isSoft = variant === "soft";
  const isLabeledButton = actionType === "button";
  const isPending = actionType === "pending";
  const slots = callToActionCardVariants({ variant, actionType });
  const iconSize = isSoft ? 18 : 22;
  const actionIcon = isPending ? (
    <Hourglass1 size={iconSize} />
  ) : actionType === "icon" && !isSoft ? (
    (icon ?? <ChatLine size={28} />)
  ) : (
    <Plus size={iconSize} />
  );
  const hasBadge = badge != null && badge !== "";
  const hasMeta = meta != null && meta !== "";

  const actionButton = isLabeledButton ? (
    <Button
      aria-label={actionLabel}
      className={slots.action({ className: actionClassName })}
      onPress={onAction}
      size="lg"
      variant="secondary"
    >
      {actionLabel}
    </Button>
  ) : (
    <Button
      aria-label={actionLabel}
      className={slots.action({ className: actionClassName })}
      isDisabled={isPending}
      isIconOnly
      onPress={isPending ? undefined : onAction}
      size="lg"
      variant="ghost"
    >
      {actionIcon}
    </Button>
  );

  return (
    <div
      className={slots.root({ className })}
      data-action-type={actionType}
      data-variant={variant}
      {...props}
    >
      <div className={slots.content()}>
        {isSoft ? (
          <>
            <Typography className={slots.title()} type="body" weight="bold">
              {title}
            </Typography>
            <Typography
              className={slots.subtitle()}
              type="body"
              weight="semibold"
            >
              {subtitle}
              {hasMeta ? <span className={slots.meta()}>{meta}</span> : null}
            </Typography>
            {hasBadge ? (
              <Chip
                className={slots.badge()}
                color="accent"
                size="sm"
                variant="primary"
              >
                <Chip.Label>{badge}</Chip.Label>
              </Chip>
            ) : null}
          </>
        ) : (
          <>
            <Typography
              className={slots.subtitle()}
              type="body"
              weight="medium"
            >
              {subtitle}
            </Typography>
            <Typography className={slots.title()} type="h3" weight="bold">
              {title}
            </Typography>
          </>
        )}
      </div>

      {isSoft && !isLabeledButton ? (
        <div className={slots.actionRing()}>{actionButton}</div>
      ) : (
        actionButton
      )}
    </div>
  );
}

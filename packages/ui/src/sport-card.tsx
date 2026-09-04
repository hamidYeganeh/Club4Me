import { Card, Typography } from "@heroui/react";
import { Icon, type IconName } from "@repo/theme/icon";
import { tv } from "tailwind-variants";

export type SportCardProps = {
  value: string | number;
  unit?: string;
  supportingText: string;
  icon?: IconName;
  iconLabel?: string;
  backgroundImage?: string;
  backgroundImageAlt?: string;
  className?: string;
};

const sportCardStyles = tv({
  slots: {
    root: "relative isolate h-[220px] w-full gap-0 overflow-hidden rounded-[20px] p-4 shadow-none",
    image: "absolute inset-0 size-full object-cover",
    overlay:
      "absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10",
    content: "relative z-10 flex h-full flex-col justify-between",
    icon: "size-8 shrink-0",
    iconFallback:
      "block size-8 shrink-0 rounded-full border-[1.5px] border-current bg-transparent",
    metric: "flex min-w-0 flex-wrap items-baseline gap-1.5",
    value: "leading-none font-bold tracking-tight",
    unit: "leading-none font-normal",
    supporting: "mt-1 leading-5",
  },
  variants: {
    hasBackground: {
      true: {
        root: "border border-white/10 bg-surface-secondary",
        icon: "text-white",
        iconFallback: "text-white",
        value: "text-white",
        unit: "text-white/70",
        supporting: "text-white/70",
      },
      false: {
        root: "border border-border bg-surface text-surface-foreground",
        icon: "text-foreground",
        iconFallback: "text-foreground",
        value: "text-foreground",
        unit: "text-muted",
        supporting: "text-muted",
      },
    },
  },
  defaultVariants: {
    hasBackground: false,
  },
});

export function SportCard({
  value,
  unit,
  supportingText,
  icon,
  iconLabel,
  backgroundImage,
  backgroundImageAlt,
  className,
}: SportCardProps) {
  const hasBackground = Boolean(backgroundImage);
  const styles = sportCardStyles({ hasBackground });
  const label = unit
    ? `${value} ${unit}. ${supportingText}`
    : `${value}. ${supportingText}`;

  return (
    <Card
      variant="transparent"
      className={styles.root({ className })}
      aria-label={label}
    >
      {backgroundImage ? (
        <>
          <img
            src={backgroundImage}
            alt={backgroundImageAlt ?? ""}
            className={styles.image()}
          />
          <div aria-hidden className={styles.overlay()} />
        </>
      ) : null}

      <div className={styles.content()}>
        {icon ? (
          <Icon
            name={icon}
            size={32}
            label={iconLabel}
            className={styles.icon()}
          />
        ) : (
          <span aria-hidden className={styles.iconFallback()} />
        )}

        <div>
          <div className={styles.metric()}>
            <Typography type="h3" className={styles.value()}>
              {value}
            </Typography>
            {unit ? (
              <Typography type="h4" className={styles.unit()}>
                {unit}
              </Typography>
            ) : null}
          </div>
          <Typography type="body-sm" className={styles.supporting()}>
            {supportingText}
          </Typography>
        </div>
      </div>
    </Card>
  );
}

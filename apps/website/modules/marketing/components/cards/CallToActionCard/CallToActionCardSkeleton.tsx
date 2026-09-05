"use client";

import { Skeleton } from "@heroui/react/skeleton";
import { callToActionCardVariants } from "./CallToActionCard.styles";
import type {
  CallToActionCardActionType,
  CallToActionCardVariant,
} from "./CallToActionCard.types";

export type CallToActionCardSkeletonProps = {
  variant?: CallToActionCardVariant;
  actionType?: CallToActionCardActionType;
  className?: string;
};

/** Layout-faithful skeleton for {@link CallToActionCard}. */
export function CallToActionCardSkeleton({
  variant = "primary",
  actionType = "plus",
  className,
}: CallToActionCardSkeletonProps) {
  const slots = callToActionCardVariants({ variant, actionType });
  const isLabeledButton = actionType === "button";
  const isSoft = variant === "soft";

  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className={slots.root({ className })}
      data-action-type={actionType}
      data-variant={variant}
      role="status"
    >
      <div className={slots.content()}>
        {isSoft ? (
          <>
            <Skeleton aria-hidden className="h-5 w-28 rounded-md" />
            <Skeleton aria-hidden className="h-4 w-36 rounded-md" />
            <Skeleton aria-hidden className="mt-2 h-7 w-20 rounded-full" />
          </>
        ) : (
          <>
            <Skeleton aria-hidden className="h-4 w-32 rounded-md" />
            <Skeleton
              aria-hidden
              className={
                isLabeledButton ? "h-8 w-48 rounded-lg" : "h-6 w-40 rounded-lg"
              }
            />
          </>
        )}
      </div>
      {isLabeledButton ? (
        <Skeleton aria-hidden className="h-14 w-28 shrink-0 rounded-2xl" />
      ) : isSoft ? (
        <div className={slots.actionRing()}>
          <Skeleton aria-hidden className="size-11 rounded-full" />
        </div>
      ) : (
        <Skeleton
          aria-hidden
          className={
            actionType === "icon"
              ? "size-12 shrink-0 rounded-2xl"
              : "size-11 shrink-0 rounded-[0.875rem]"
          }
        />
      )}
    </div>
  );
}

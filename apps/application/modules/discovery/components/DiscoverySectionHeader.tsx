"use client";

import { SkeletonBlock, SkeletonText } from "./skeletons/primitives";
import { SectionHeading } from "@ui/section-heading";
import { Icon, type IconName } from "@theme/icon";

import { ButtonLink } from "@/components/button-link";

type DiscoverySectionHeaderProps = {
  isLoading?: boolean;
  title: string;
  subtitle?: string;
  icon?: IconName;
  id?: string;
  accent?: boolean;
  className?: string;
  viewAllLabel?: string;
  viewAllUrl?: string;
};

export function DiscoverySectionHeader({
  isLoading = false,
  title,
  subtitle,
  icon,
  id,
  accent = false,
  className,
  viewAllLabel,
  viewAllUrl,
}: DiscoverySectionHeaderProps) {
  return (
    <SectionHeading
      id={id}
      className={`${accent ? "text-[#24272c]" : "text-foreground"} ${className ?? ""}`}
      title={isLoading ? <SkeletonText>{title}</SkeletonText> : title}
      icon={
        icon ? (
          isLoading ? (
            <SkeletonBlock className="size-[18px] rounded-md" />
          ) : (
            <Icon
              name={icon}
              size={18}
              className={accent ? "text-[#24272c]" : "text-accent"}
            />
          )
        ) : undefined
      }
      description={
        subtitle ? (
          <span className={accent ? "text-[#66591f]" : undefined}>
            {isLoading ? <SkeletonText>{subtitle}</SkeletonText> : subtitle}
          </span>
        ) : undefined
      }
      action={
        viewAllLabel && viewAllUrl ? (
          <ButtonLink
            href={viewAllUrl}
            variant="ghost"
            size="sm"
          >
            {isLoading ? (
              <SkeletonText>{viewAllLabel}</SkeletonText>
            ) : (
              viewAllLabel
            )}
          </ButtonLink>
        ) : undefined
      }
    />
  );
}

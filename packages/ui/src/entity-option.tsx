"use client";
import { Avatar, Description, Label } from "@heroui/react";
import {
  CalendarDays,
  Dumbbell,
  MapPin,
  Layers,
  UserRound,
} from "lucide-react";
import { entityOptionDetails } from "./entity-option-details";
export { entityOptionDetails } from "./entity-option-details";
export function entityOptionText(entity: unknown, title: string) {
  const details = entityOptionDetails(entity, title);
  return [details.title, details.description].filter(Boolean).join(" ");
}
export function EntityOptionContent({
  entity,
  title,
  compact = false,
}: {
  entity?: unknown;
  title: string;
  compact?: boolean;
}) {
  const detail = entityOptionDetails(entity, title);
  const Icon =
    detail.kind === "person"
      ? UserRound
      : detail.kind === "place"
        ? MapPin
        : detail.kind === "class"
          ? CalendarDays
          : detail.kind === "sport"
            ? Dumbbell
            : Layers;
  return (
    <span className="flex min-w-0 flex-1 items-center gap-3" dir="rtl">
      {entity ? (
        <Avatar
          aria-hidden="true"
          className={`${compact ? "size-6" : "size-10"} shrink-0 ${detail.kind === "person" ? "" : "rounded-lg"}`}
        >
          {detail.image ? <Avatar.Image src={detail.image} alt="" /> : null}
          <Avatar.Fallback>
            {detail.kind === "person" && detail.initials ? (
              detail.initials
            ) : (
              <Icon size={compact ? 14 : 18} />
            )}
          </Avatar.Fallback>
        </Avatar>
      ) : null}
      <span className="min-w-0 flex-1 text-start">
        <Label className="block truncate font-medium">{detail.title}</Label>
        {!compact && detail.description ? (
          <Description
            dir={detail.phoneOnly ? "ltr" : "rtl"}
            className="mt-0.5 block truncate text-right text-xs text-muted"
          >
            {detail.description}
          </Description>
        ) : null}
      </span>
    </span>
  );
}

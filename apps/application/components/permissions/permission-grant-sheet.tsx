"use client";

import Image from "next/image";
import { Button } from "@heroui/react";
import { Icon } from "@theme/icon";

import { BottomSheet } from "@/components/motion/bottom-sheet";

export type PermissionKind = "notifications" | "location" | "camera";

const COPY: Record<
  PermissionKind,
  { title: string; description: string; note: string; image: string; alt: string }
> = {
  notifications: {
    title: "اعلان‌ها را فعال کنید",
    description: "از تغییرات رزرو، زمان کلاس و یادآوری‌های مهم جا نمانید.",
    note: "هر زمان بخواهید می‌توانید این دسترسی را از تنظیمات دستگاه تغییر دهید.",
    image: "/permissions/notifications.png",
    alt: "نمایش اعلان جیم فور می روی موبایل",
  },
  location: {
    title: "دسترسی به موقعیت مکانی",
    description: "برای نمایش باشگاه‌ها و کلاس‌های نزدیک، موقعیت فعلی شما را لازم داریم.",
    note: "موقعیت شما فقط هنگام استفاده از این قابلیت دریافت می‌شود.",
    image: "/permissions/location.png",
    alt: "نمایش موقعیت روی نقشه موبایل",
  },
  camera: {
    title: "دسترسی به دوربین",
    description: "برای ثبت یا انتخاب تصویر پروفایل، اجازه دسترسی به دوربین و تصاویر را بدهید.",
    note: "تصویر فقط پس از تأیید شما انتخاب و بارگذاری می‌شود.",
    image: "/permissions/camera-man.png",
    alt: "ثبت تصویر ورزشکار با دوربین موبایل",
  },
};

type PermissionGrantSheetProps = {
  kind: PermissionKind;
  open: boolean;
  pending?: boolean;
  onOpenChange: (open: boolean) => void;
  onGrant: () => void | Promise<void>;
};

export function PermissionGrantSheet({
  kind,
  open,
  pending = false,
  onOpenChange,
  onGrant,
}: PermissionGrantSheetProps) {
  const copy = COPY[kind];

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={["auto"]}
      className="max-h-[92dvh]"
      contentClassName="overflow-hidden"
    >
      <div className="flex flex-col items-center text-center">
        <div className="relative -mt-3 h-[min(38dvh,19rem)] w-full overflow-hidden">
          <div aria-hidden className="absolute inset-x-12 bottom-5 h-20 rounded-full bg-accent/18 blur-3xl" />
          <Image
            src={copy.image}
            alt={copy.alt}
            fill
            sizes="(max-width: 576px) 100vw, 576px"
            className="object-contain"
          />
        </div>

        <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">
          {copy.title}
        </h2>
        <p className="mt-3 max-w-md text-sm leading-7 text-muted">
          {copy.description}
        </p>

        <div className="mt-5 flex w-full items-start gap-3 border-t border-border/70 px-1 pt-5 text-start">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-accent/12 text-accent">
            <Icon name="info-circle" size={18} />
          </span>
          <p className="text-xs leading-6 text-muted">{copy.note}</p>
        </div>

        <Button
          className="mt-6 w-full bg-accent font-bold text-accent-foreground shadow-[0_12px_30px_color-mix(in_oklch,var(--accent)_25%,transparent)]"
          isDisabled={pending}
          onPress={() => void onGrant()}
        >
          {pending ? "در حال بررسی…" : "ادامه و دادن دسترسی"}
        </Button>
        <button
          type="button"
          className="mt-2 min-h-12 px-6 text-sm font-semibold text-muted transition-colors hover:text-foreground"
          onClick={() => onOpenChange(false)}
        >
          فعلاً نه
        </button>
      </div>
    </BottomSheet>
  );
}

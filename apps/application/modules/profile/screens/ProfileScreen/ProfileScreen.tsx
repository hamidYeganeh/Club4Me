"use client";

import Link from "next/link";
import { Chip, Typography } from "@heroui/react";
import { useAccountMe } from "@api/account";
import { Icon } from "@theme/icon";
import { ProfileActivitySection } from "@modules/profile/sections/ProfileActivitySection";
import { ProfileCompletionSection } from "@modules/profile/sections/ProfileCompletionSection";
import { ProfileHeroSection } from "@modules/profile/sections/ProfileHeroSection";

import type { ProfileScreenProps } from "./ProfileScreen.types";

export function ProfileScreen({ role }: ProfileScreenProps) {
  const account = useAccountMe();
  const roleLabels = {
    athlete: "ورزشکار",
    coach: "مربی",
    owner: "مالک",
    admin: "مدیر",
  } as const;
  return (
    <main className="flex min-h-dvh w-full max-w-full flex-1 flex-col overflow-x-hidden bg-transparent pb-[calc(7rem+env(safe-area-inset-bottom))]">
      <ProfileHeroSection role={role} />
      <div className="flex flex-col gap-7 px-5 pt-6">
        <ProfileCompletionSection role={role} />
        <ProfileActivitySection role={role} />
        <section aria-labelledby="profile-account-title">
          <div className="mb-3">
            <Typography id="profile-account-title" type="h4" weight="bold">
              حساب و تنظیمات
            </Typography>
            <p className="mt-1 text-xs text-muted">
              اطلاعات شخصی، اعلان‌ها و حریم خصوصی
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Link
              href="/auth/roles?manage=1"
              className="app-card app-reveal flex items-center gap-3 p-4"
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-surface-secondary">
                <Icon name="users-two" size={20} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-2">
                <Typography type="body" weight="bold">
                  نقش‌های من
                </Typography>
                <span className="flex flex-wrap gap-1.5">
                  {account.data?.roles.map((item) => (
                    <Chip
                      key={item}
                      size="sm"
                      color={item === role ? "accent" : "default"}
                    >
                      {roleLabels[item]}
                    </Chip>
                  ))}
                </span>
              </span>
              <Icon name="chevron-left" size={18} className="text-muted" />
            </Link>
            {[
              {
                href: `/${role}/profile/locations`,
                icon: "map-pin-1" as const,
                label: "لوکیشن‌های من",
              },
              {
                href: `/${role}/favorites`,
                icon: "bookmark" as const,
                label: "مقالات، باشگاه‌ها، مربی‌ها و کلاس‌های ذخیره‌شده",
              },
              ...(role === "athlete"
                ? [
                    {
                      href: "/athlete/notifications",
                      icon: "bell-1" as const,
                      label: "اعلان‌ها",
                    },
                  ]
                : [
                    {
                      href: "/coach/profile/professional",
                      icon: "whistle" as const,
                      label: "پروفایل حرفه‌ای مربی",
                    },
                  ]),
              {
                href: `/${role}/settings`,
                icon: "shield-check" as const,
                label: "تنظیمات و حریم خصوصی",
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="app-card app-reveal flex items-center gap-3 p-4"
              >
                <span className="flex size-10 items-center justify-center rounded-full bg-surface-secondary">
                  <Icon name={item.icon} size={20} />
                </span>
                <Typography type="body" weight="bold" className="flex-1">
                  {item.label}
                </Typography>
                <Icon name="chevron-left" size={18} className="text-muted" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

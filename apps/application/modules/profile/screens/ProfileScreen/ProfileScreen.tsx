"use client";

import Link from "next/link";
import { Typography } from "@heroui/react";
import { Icon } from "@theme/icon";
import { ProfileActivitySection } from "@modules/profile/sections/ProfileActivitySection";
import { ProfileCompletionSection } from "@modules/profile/sections/ProfileCompletionSection";
import { ProfileHeroSection } from "@modules/profile/sections/ProfileHeroSection";

import type { ProfileScreenProps } from "./ProfileScreen.types";

export function ProfileScreen({ role }: ProfileScreenProps) {
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
            {[
              {
                href: `/${role}/profile/locations`,
                icon: "map-pin-1" as const,
                label: "لوکیشن‌های من",
              },
              ...(role === "athlete"
                ? [
                    {
                      href: "/athlete/favorites",
                      icon: "heart" as const,
                      label: "علاقه‌مندی‌ها",
                    },
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

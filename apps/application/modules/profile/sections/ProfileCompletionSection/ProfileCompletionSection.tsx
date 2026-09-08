"use client";

import { OnboardingChecklist } from "@/components/ui/onboarding-checklist";
import { useAccountMe } from "@api/account";
import { Skeleton } from "@heroui/react";

import type { ProfileRole } from "../../profile.types";

const profileFieldCount = 6;

export function ProfileCompletionSection({ role }: { role: ProfileRole }) {
  const me = useAccountMe();
  if (me.isError) {
    return null;
  }

  if (me.isPending) {
    return (
      <section
        className="app-reveal overflow-hidden rounded-3xl bg-surface p-5"
        aria-busy="true"
        aria-label="در حال بارگذاری وضعیت پروفایل"
      >
        <div className="flex items-start gap-4">
          <Skeleton className="size-12 shrink-0 rounded-[1rem]" />
          <div className="min-w-0 flex-1 space-y-2.5">
            <Skeleton className="h-5 w-36 rounded-lg" />
            <Skeleton className="h-3 w-48 max-w-full rounded-lg" />
          </div>
          <Skeleton className="h-9 w-16 shrink-0 rounded-xl" />
        </div>
        <div className="mt-5 grid grid-cols-6 gap-2">
          {Array.from({ length: profileFieldCount }).map((_, index) => (
            <Skeleton key={index} className="h-1.5 rounded-full" />
          ))}
        </div>
      </section>
    );
  }

  const fields = [
    ["firstName", "نام", me.data?.firstName?.trim()],
    ["lastName", "نام خانوادگی", me.data?.lastName?.trim()],
    ["birthdate", "تاریخ تولد", me.data?.birthdate],
    ["gender", "جنسیت", me.data?.gender],
    ["activityLevel", "سطح فعالیت", me.data?.activityLevel],
    ["idCard", "کد ملی", me.data?.idCard?.trim()],
  ];
  return (
    <OnboardingChecklist
      steps={fields.map(([id, title, value]) => ({
        id: String(id),
        title: String(title),
        isCompleted: Boolean(value),
        href: `/${role}/profile/edit?field=${id}`,
      }))}
    />
  );
}

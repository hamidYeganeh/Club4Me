"use client";

import Link from "@/components/app-link";
import { useAccountMe } from "@api/account";
import { Skeleton, Typography } from "@heroui/react";
import { Icon } from "@theme/icon";

import type { ProfileRole } from "../../profile.types";

const profileFieldCount = 6;

export function ProfileCompletionSection({ role }: { role: ProfileRole }) {
  const me = useAccountMe();
  const completedFields = [
    me.data?.firstName?.trim(),
    me.data?.lastName?.trim(),
    me.data?.birthdate,
    me.data?.gender,
    me.data?.activityLevel,
    me.data?.idCard?.trim(),
  ].filter(Boolean).length;
  const remainingFields = profileFieldCount - completedFields;
  const isComplete = completedFields === profileFieldCount;

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

  return (
    <section
      className="app-reveal overflow-hidden rounded-3xl bg-surface p-5"
      aria-labelledby="profile-completion-title"
    >
      <div className="flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-[1rem] bg-accent text-accent-foreground">
          <Icon name={isComplete ? "check-circle" : "user"} size={23} />
        </span>
        <div className="min-w-0 flex-1">
          <Typography id="profile-completion-title" type="h5" weight="bold">
            {isComplete ? "پروفایل کامل است" : "پروفایلت را کامل کن"}
          </Typography>
          <p className="mt-1 text-xs leading-5 text-muted">
            {isComplete
              ? "اطلاعات اصلی حسابت ثبت شده است."
              : `${remainingFields.toLocaleString("fa-IR")} مورد دیگر باقی مانده است.`}
          </p>
        </div>
        <Link
          href={`/${role}/profile/edit`}
          scroll={false}
          className="inline-flex min-h-11 items-center shrink-0 rounded-2xl bg-accent px-3 py-2 text-xs font-bold whitespace-nowrap text-accent-foreground transition-transform active:scale-95"
        >
          {isComplete ? "ویرایش" : "تکمیل"}
        </Link>
      </div>

      <div
        className="mt-5 grid grid-cols-6 gap-2"
        role="progressbar"
        aria-label="میزان تکمیل پروفایل"
        aria-valuemin={0}
        aria-valuemax={profileFieldCount}
        aria-valuenow={completedFields}
      >
        {Array.from({ length: profileFieldCount }).map((_, index) => (
          <span
            key={index}
            className={`h-1.5 rounded-full transition-colors ${
              index < completedFields ? "bg-accent" : "bg-surface-tertiary"
            }`}
          />
        ))}
      </div>
    </section>
  );
}

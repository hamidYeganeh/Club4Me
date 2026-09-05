"use client";

import { Button, Card, Chip, toast, Typography } from "@heroui/react";
import {
  useCoachClasses,
  useCoachProfile,
  useSubmitCoachProfile,
  useUpdateCoachClassStatus,
} from "@api";

import { AthleteScreenHeaderSection } from "@modules/athlete/sections/AthleteScreenHeaderSection";
import { CoachClubClassesSection } from "@modules/coach/sections/CoachClubClassesSection";
import { DashboardPageSkeleton } from "@/components/loading-skeletons";

const statusLabel: Record<string, string> = {
  draft: "پیش‌نویس",
  pending_review: "در انتظار بررسی",
  approved: "تأییدشده",
  rejected: "نیازمند اصلاح",
  published: "منتشرشده",
  registration_closed: "ثبت‌نام بسته",
  in_progress: "در حال برگزاری",
  completed: "تمام‌شده",
  cancelled: "لغوشده",
  archived: "بایگانی‌شده",
};

export function CoachHomeScreen() {
  const profile = useCoachProfile();
  const classes = useCoachClasses();
  const submit = useSubmitCoachProfile();
  const updateStatus = useUpdateCoachClassStatus();

  const submitProfile = async () => {
    try {
      await submit.mutateAsync();
      toast.success("پروفایل برای بررسی ارسال شد");
    } catch {
      toast.danger("پروفایل هنوز کامل نیست یا امکان ارسال ندارد");
    }
  };

  const publish = async (classId: string) => {
    try {
      await updateStatus.mutateAsync({ classId, status: "published" });
      toast.success("کلاس منتشر شد");
    } catch {
      toast.danger("پیش‌نیازهای انتشار کلاس کامل نیست");
    }
  };

  if (profile.isLoading || classes.isLoading) {
    return <DashboardPageSkeleton />;
  }

  return (
    <main className="app-page gap-6">
      <AthleteScreenHeaderSection title="پنل مربی" />
      <Card className="rounded-3xl bg-surface p-5 shadow-none">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Typography type="h4" weight="bold">
              {profile.data?.displayName || "پروفایل مربی"}
            </Typography>
            <Typography type="body-sm" color="muted" className="mt-2">
              {profile.data?.shortBio || "اطلاعات حرفه‌ای خود را تکمیل کنید."}
            </Typography>
          </div>
          <Chip
            size="sm"
            color={
              profile.data?.reviewStatus === "approved"
                ? "success"
                : profile.data?.reviewStatus === "rejected"
                  ? "danger"
                  : "warning"
            }
          >
            {statusLabel[profile.data?.reviewStatus ?? "draft"]}
          </Chip>
        </div>
        {profile.data?.rejectionReason ? (
          <p className="mt-4 rounded-xl bg-danger/10 p-3 text-sm text-danger">
            {profile.data.rejectionReason}
          </p>
        ) : null}
        {profile.data &&
        ["draft", "rejected"].includes(profile.data.reviewStatus) ? (
          <Button
            className="mt-5"
            variant="primary"
            isPending={submit.isPending}
            onPress={() => void submitProfile()}
          >
            ارسال برای تأیید
          </Button>
        ) : null}
      </Card>
      <CoachClubClassesSection />
      <section>
        <div className="mb-3 flex items-center justify-between">
          <Typography type="h4" weight="bold">
            کلاس‌های من
          </Typography>
          <span className="text-sm text-muted">
            {(classes.data?.items.length ?? 0).toLocaleString("fa-IR")}
          </span>
        </div>
        <div className="flex flex-col gap-3">
          {(classes.data?.items ?? []).map((item) => (
            <Card key={item.id} className="rounded-2xl bg-surface p-4 shadow-none">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Typography type="body" weight="bold">
                    {item.title}
                  </Typography>
                  <p className="mt-1 text-xs text-muted">
                    {item.enrollmentCount.toLocaleString("fa-IR")} از{" "}
                    {item.capacity.toLocaleString("fa-IR")} شاگرد ·{" "}
                    {statusLabel[item.status] ?? item.status}
                  </p>
                </div>
                {item.status === "draft" ? (
                  <Button
                    size="sm"
                    variant="primary"
                    isDisabled={updateStatus.isPending}
                    onPress={() => void publish(item.id)}
                  >
                    انتشار
                  </Button>
                ) : null}
              </div>
            </Card>
          ))}
          {!classes.data?.items.length ? (
            <p className="py-10 text-center text-sm text-muted">
              هنوز کلاسی ساخته نشده است.
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}

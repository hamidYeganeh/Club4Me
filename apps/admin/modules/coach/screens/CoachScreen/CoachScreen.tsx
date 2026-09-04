"use client";

import { useState } from "react";
import { Button, Card, Chip, Spinner, Table, toast } from "@heroui/react";
import { useAdminCoaches, useReviewCoach } from "@api/admin";

const labels = {
  draft: "پیش‌نویس",
  pending_review: "در انتظار بررسی",
  approved: "تأییدشده",
  rejected: "ردشده",
} as const;

export function CoachScreen() {
  const coaches = useAdminCoaches();
  const review = useReviewCoach();
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const decide = async (coachId: string, status: "approved" | "rejected") => {
    const reason =
      status === "rejected"
        ? window.prompt("دلیل رد پروفایل مربی را وارد کنید")?.trim()
        : undefined;
    if (status === "rejected" && !reason) return;
    if (status === "approved" && !window.confirm("این مربی تأیید شود؟")) return;
    setReviewingId(coachId);
    try {
      await review.mutateAsync({ coachId, status, reason });
      toast.success(status === "approved" ? "مربی تأیید شد" : "پروفایل مربی رد شد");
    } catch {
      toast.danger("ثبت نتیجه بررسی ناموفق بود");
    } finally {
      setReviewingId(null);
    }
  };

  const items = coaches.data?.items ?? [];
  return (
    <main className="flex-1 overflow-auto p-4 lg:p-6">
      <h1 className="text-2xl font-semibold">مدیریت مربی‌ها</h1>
      <Card variant="transparent" className="mt-5 overflow-hidden rounded-[1.75rem] border border-border bg-surface">
        {coaches.isPending ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : coaches.isError ? (
          <div className="px-6 py-12 text-center text-muted">
            <p>دریافت مربی‌ها ناموفق بود.</p>
            <Button className="mt-4" size="sm" variant="secondary" onPress={() => coaches.refetch()}>تلاش دوباره</Button>
          </div>
        ) : items.length === 0 ? (
          <p className="px-6 py-12 text-center text-muted">هنوز مربی‌ای ثبت نشده است.</p>
        ) : (
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="مدیریت مربی‌ها">
                <Table.Header>
                  <Table.Column isRowHeader>نام</Table.Column>
                  <Table.Column>شیوه ارائه</Table.Column>
                  <Table.Column>وضعیت</Table.Column>
                  <Table.Column>آخرین تغییر</Table.Column>
                  <Table.Column>عملیات</Table.Column>
                </Table.Header>
                <Table.Body>
                  {items.map((coach) => (
                    <Table.Row key={coach.id} id={coach.id}>
                      <Table.Cell className="font-medium">{coach.displayName || "بدون نام"}</Table.Cell>
                      <Table.Cell className="text-muted">{coach.serviceModes.join("، ") || "—"}</Table.Cell>
                      <Table.Cell>
                        <Chip color={coach.reviewStatus === "approved" ? "success" : coach.reviewStatus === "rejected" ? "danger" : coach.reviewStatus === "pending_review" ? "warning" : "default"} size="sm">
                          {labels[coach.reviewStatus]}
                        </Chip>
                      </Table.Cell>
                      <Table.Cell className="text-muted tabular-nums">
                        {new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(coach.updatedAt))}
                      </Table.Cell>
                      <Table.Cell>
                        {coach.reviewStatus === "pending_review" ? (
                          <div className="flex gap-2">
                            <Button size="sm" variant="primary" isDisabled={review.isPending} isPending={reviewingId === coach.id && review.isPending} onPress={() => void decide(coach.id, "approved")}>تأیید</Button>
                            <Button size="sm" variant="secondary" isDisabled={review.isPending} onPress={() => void decide(coach.id, "rejected")}>رد</Button>
                          </div>
                        ) : <span className="text-muted">—</span>}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        )}
      </Card>
    </main>
  );
}

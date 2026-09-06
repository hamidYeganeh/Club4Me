"use client";

import { useState } from "react";
import { Button, Card, Chip, Spinner, Table, toast } from "@heroui/react";
import { type AdminCoach, useAdminCoaches, useReviewCoach } from "@api/admin";
import { coachLevelLabels } from "@api";
import { EntityDetailsModal } from "@ui/entity-details-modal";

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
  const [selected, setSelected] = useState<AdminCoach | null>(null);

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
      toast.success(
        status === "approved" ? "مربی تأیید شد" : "پروفایل مربی رد شد",
      );
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
      <Card
        variant="transparent"
        className="mt-5 overflow-hidden rounded-[1.75rem] border border-border bg-surface"
      >
        {coaches.isPending ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : coaches.isError ? (
          <div className="px-6 py-12 text-center text-muted">
            <p>دریافت مربی‌ها ناموفق بود.</p>
            <Button
              className="mt-4"
              size="sm"
              variant="secondary"
              onPress={() => coaches.refetch()}
            >
              تلاش دوباره
            </Button>
          </div>
        ) : items.length === 0 ? (
          <p className="px-6 py-12 text-center text-muted">
            هنوز مربی‌ای ثبت نشده است.
          </p>
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
                      <Table.Cell className="font-medium">
                        {coach.displayName || "بدون نام"}
                      </Table.Cell>
                      <Table.Cell className="text-muted">
                        {coach.serviceModes.join("، ") || "—"}
                      </Table.Cell>
                      <Table.Cell>
                        <Chip
                          color={
                            coach.reviewStatus === "approved"
                              ? "success"
                              : coach.reviewStatus === "rejected"
                                ? "danger"
                                : coach.reviewStatus === "pending_review"
                                  ? "warning"
                                  : "default"
                          }
                          size="sm"
                        >
                          {labels[coach.reviewStatus]}
                        </Chip>
                      </Table.Cell>
                      <Table.Cell className="text-muted tabular-nums">
                        {new Intl.DateTimeFormat("fa-IR", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(coach.updatedAt))}
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onPress={() => setSelected(coach)}
                          >
                            جزئیات
                          </Button>
                          {coach.reviewStatus === "pending_review" ? (
                            <>
                              <Button
                                size="sm"
                                variant="primary"
                                isDisabled={review.isPending}
                                isPending={
                                  reviewingId === coach.id && review.isPending
                                }
                                onPress={() =>
                                  void decide(coach.id, "approved")
                                }
                              >
                                تأیید
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                isDisabled={review.isPending}
                                onPress={() =>
                                  void decide(coach.id, "rejected")
                                }
                              >
                                رد
                              </Button>
                            </>
                          ) : null}
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        )}
      </Card>
      <EntityDetailsModal
        isOpen={Boolean(selected)}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSelected(null);
        }}
        title={selected?.displayName || "جزئیات مربی"}
        description="پروفایل کامل مربی برای بررسی و تصمیم‌گیری"
        sections={
          selected
            ? [
                {
                  title: "هویت و وضعیت",
                  items: [
                    { label: "شناسه مربی", value: selected.id, dir: "ltr" },
                    {
                      label: "شناسه کاربر",
                      value: selected.userId,
                      dir: "ltr",
                    },
                    { label: "نامک", value: selected.slug, dir: "ltr" },
                    {
                      label: "وضعیت بررسی",
                      value: labels[selected.reviewStatus],
                    },
                    { label: "نمایش عمومی", value: selected.visibility },
                    {
                      label: "دلیل رد",
                      value: selected.rejectionReason,
                      wide: true,
                    },
                  ],
                },
                {
                  title: "تجربه و معرفی",
                  items: [
                    {
                      label: "معرفی کوتاه",
                      value: selected.shortBio,
                      wide: true,
                    },
                    { label: "زندگی‌نامه", value: selected.bio, wide: true },
                    {
                      label: "سابقه",
                      value: `${selected.experienceYears.toLocaleString("fa-IR")} سال`,
                    },
                    { label: "زبان‌ها", value: selected.languages.join("، ") },
                    {
                      label: "شیوه ارائه",
                      value: selected.serviceModes.join("، "),
                    },
                    {
                      label: "بازه سنی پذیرفته‌شده",
                      value:
                        selected.minAcceptedAge == null &&
                        selected.maxAcceptedAge == null
                          ? null
                          : `${selected.minAcceptedAge ?? "—"} تا ${selected.maxAcceptedAge ?? "—"}`,
                    },
                    {
                      label: "شعاع رفت‌وآمد",
                      value: `${selected.travelRadiusKm.toLocaleString("fa-IR")} کیلومتر`,
                    },
                    {
                      label: "امتیاز و نظرها",
                      value: `${selected.averageRating.toLocaleString("fa-IR")} از ۵ (${selected.reviewsCount.toLocaleString("fa-IR")} نظر)`,
                    },
                  ],
                },
                {
                  title: "معرفی تخصصی و روش همکاری",
                  items: [
                    {
                      label: "مخاطب مناسب",
                      value: selected.professionalProfile?.audience,
                      wide: true,
                    },
                    {
                      label: "هدف‌ها",
                      value: selected.professionalProfile?.goals.join("، "),
                    },
                    {
                      label: "سطح شاگرد",
                      value: selected.professionalProfile?.levels
                        .map((level) => coachLevelLabels[level])
                        .join("، "),
                    },
                    {
                      label: "شرایط پذیرش",
                      value: selected.professionalProfile?.prerequisites,
                      wide: true,
                    },
                    {
                      label: "جلسه اول",
                      value: selected.professionalProfile?.firstSession,
                      wide: true,
                    },
                    {
                      label: "شخصی‌سازی برنامه",
                      value: selected.professionalProfile?.planning,
                      wide: true,
                    },
                    {
                      label: "پشتیبانی",
                      value: selected.professionalProfile?.followUp,
                      wide: true,
                    },
                    {
                      label: "ارزیابی پیشرفت",
                      value: selected.professionalProfile?.progressTracking,
                      wide: true,
                    },
                    {
                      label: "ویدئوی معرفی",
                      value: selected.professionalProfile?.introductionVideoUrl,
                      wide: true,
                      dir: "ltr",
                    },
                  ],
                },
                {
                  title: "مدارک و نمونه‌های حرفه‌ای",
                  items: [
                    ...(selected.professionalProfile?.credentials ?? []).map(
                      (credential, index) => {
                        const attachment = selected.credentialAttachments?.find(
                          (item) => item.id === credential.mediaId,
                        );
                        return {
                          label: `مدرک ${index + 1}`,
                          wide: true,
                          value: (
                            <div className="space-y-2">
                              <p>
                                {[
                                  credential.title,
                                  credential.issuer,
                                  credential.year,
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </p>
                              {credential.expiresOn ? (
                                <p>تاریخ انقضا: {credential.expiresOn}</p>
                              ) : null}
                              {attachment ? (
                                <a
                                  href={attachment.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-accent underline"
                                >
                                  مشاهده تصویر مدرک
                                </a>
                              ) : null}
                              <p className="text-xs text-muted">
                                تأیید پروفایل به معنی تأیید اصالت این مدرک نیست.
                              </p>
                            </div>
                          ),
                        };
                      },
                    ),
                    ...(selected.professionalProfile?.achievements ?? []).map(
                      (item, index) => ({
                        label: `افتخار ${index + 1}`,
                        wide: true,
                        value: [item.title, item.organization, item.year]
                          .filter(Boolean)
                          .join(" · "),
                      }),
                    ),
                    ...(selected.professionalProfile?.successStories ?? []).map(
                      (item, index) => ({
                        label: `نمونه پیشرفت ${index + 1}`,
                        wide: true,
                        value: (
                          <div className="space-y-2">
                            <p>
                              {item.title} · {item.duration}
                            </p>
                            <p>هدف: {item.goal}</p>
                            <p>{item.outcome}</p>
                            <p>
                              {item.consent
                                ? "رضایت انتشار توسط مربی اعلام شده"
                                : "بدون رضایت انتشار"}
                            </p>
                          </div>
                        ),
                      }),
                    ),
                  ],
                },
                {
                  title: "اطلاعات تکمیلی",
                  items: [
                    {
                      label: "اطلاعات تماس",
                      value: JSON.stringify(selected.contact, null, 2),
                      dir: "ltr",
                      wide: true,
                    },
                    {
                      label: "محدوده جغرافیایی",
                      value: selected.geo
                        ? JSON.stringify(selected.geo, null, 2)
                        : null,
                      dir: "ltr",
                      wide: true,
                    },
                    {
                      label: "تعداد رسانه‌ها",
                      value:
                        selected.galleryMediaIds.length.toLocaleString("fa-IR"),
                    },
                    {
                      label: "زمان ثبت",
                      value: new Intl.DateTimeFormat("fa-IR", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(selected.createdAt)),
                    },
                    {
                      label: "آخرین تغییر",
                      value: new Intl.DateTimeFormat("fa-IR", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(selected.updatedAt)),
                    },
                  ],
                },
              ]
            : []
        }
      />
    </main>
  );
}

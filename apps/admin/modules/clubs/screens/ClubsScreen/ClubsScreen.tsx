"use client";

import { useState } from "react";
import { Button, Card, Chip, Spinner, Table, toast } from "@heroui/react";
import { useAdminClubs, useReviewClub, useVerifyClub } from "@api/admin";
import type { BusinessClub } from "@api/business";
import { EntityDetailsModal } from "@ui/entity-details-modal";
import { useTranslations } from "next-intl";

export function ClubsScreen() {
  const t = useTranslations("clubsPage");
  const clubs = useAdminClubs();
  const review = useReviewClub();
  const verification = useVerifyClub();
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<BusinessClub | null>(null);

  const decide = async (clubId: string, status: "approved" | "rejected") => {
    if (review.isPending) return;
    const reason =
      status === "rejected"
        ? window.prompt(t("rejectionReasonPrompt"))?.trim()
        : undefined;
    if (status === "rejected" && !reason) return;
    if (status === "approved" && !window.confirm(t("approveConfirm"))) return;
    setReviewingId(clubId);
    try {
      await review.mutateAsync({ clubId, status, reason });
      toast.success(
        t(status === "approved" ? "approveSuccess" : "rejectSuccess"),
      );
    } catch {
      toast.danger(t("reviewError"));
    } finally {
      setReviewingId(null);
    }
  };

  const items = clubs.data?.items ?? [];
  return (
    <main className="flex-1 overflow-auto p-4 lg:p-6">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <Card
        variant="transparent"
        className="mt-5 overflow-hidden rounded-[1.75rem] border border-border bg-surface"
      >
        {clubs.isPending ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : clubs.isError ? (
          <p className="px-6 py-12 text-center text-muted">{t("error")}</p>
        ) : items.length === 0 ? (
          <p className="px-6 py-12 text-center text-muted">{t("empty")}</p>
        ) : (
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label={t("title")}>
                <Table.Header>
                  <Table.Column isRowHeader>{t("name")}</Table.Column>
                  <Table.Column>{t("owner")}</Table.Column>
                  <Table.Column>{t("status")}</Table.Column>
                  <Table.Column>{t("updatedAt")}</Table.Column>
                  <Table.Column>{t("actions")}</Table.Column>
                </Table.Header>
                <Table.Body>
                  {items.map((club) => (
                    <Table.Row key={club.id} id={club.id}>
                      <Table.Cell className="font-medium">
                        {club.name}
                      </Table.Cell>
                      <Table.Cell className="text-muted" dir="ltr">
                        {club.ownerId}
                      </Table.Cell>
                      <Table.Cell>
                        <Chip
                          color={
                            club.reviewStatus === "approved"
                              ? "success"
                              : club.reviewStatus === "rejected"
                                ? "danger"
                                : club.reviewStatus === "pending"
                                  ? "warning"
                                  : "default"
                          }
                          size="sm"
                        >
                          {t(club.reviewStatus)}
                        </Chip>
                      </Table.Cell>
                      <Table.Cell className="text-muted tabular-nums">
                        {new Intl.DateTimeFormat("fa-IR", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(club.updatedAt))}
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onPress={() => setSelected(club)}
                          >
                            جزئیات
                          </Button>
                          {(
                            [
                              ["identity", "هویت"],
                              ["documents", "مدارک"],
                              ["on_site", "بازدید حضوری"],
                            ] as const
                          ).map(([kind, label]) => (
                            <Button
                              key={kind}
                              size="sm"
                              variant="secondary"
                              isDisabled={verification.isPending}
                              onPress={async () => {
                                try {
                                  await verification.mutateAsync({
                                    clubId: club.id,
                                    kind,
                                    verified: !club.verifications?.[kind],
                                  });
                                  toast.success("نشان تأیید به‌روزرسانی شد");
                                } catch {
                                  toast.danger("به‌روزرسانی نشان انجام نشد");
                                }
                              }}
                            >
                              {club.verifications?.[kind]
                                ? "لغو تأیید"
                                : "تأیید"}{" "}
                              {label}
                            </Button>
                          ))}
                          {club.reviewStatus === "pending" ? (
                            <>
                              <Button
                                size="sm"
                                variant="primary"
                                isDisabled={review.isPending}
                                isPending={
                                  reviewingId === club.id && review.isPending
                                }
                                onPress={() => void decide(club.id, "approved")}
                              >
                                {t("approve")}
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                isDisabled={review.isPending}
                                onPress={() => void decide(club.id, "rejected")}
                              >
                                {t("reject")}
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
        title={selected?.name ?? "جزئیات باشگاه"}
        description="اطلاعات کامل ثبت‌شده برای بررسی و تصمیم‌گیری"
        sections={
          selected
            ? [
                {
                  title: "شناسه و وضعیت",
                  items: [
                    { label: "شناسه باشگاه", value: selected.id, dir: "ltr" },
                    {
                      label: "شناسه مالک",
                      value: selected.ownerId,
                      dir: "ltr",
                    },
                    { label: "نامک", value: selected.slug, dir: "ltr" },
                    { label: "وضعیت بررسی", value: t(selected.reviewStatus) },
                    { label: "نمایش عمومی", value: selected.visibility },
                    {
                      label: "وضعیت عملیاتی",
                      value: selected.operationalStatus,
                    },
                    {
                      label: "علت رد",
                      value: selected.rejectionReason,
                      wide: true,
                    },
                  ],
                },
                {
                  title: "معرفی",
                  items: [
                    {
                      label: "توضیح کوتاه",
                      value: selected.shortDescription,
                      wide: true,
                    },
                    {
                      label: "توضیحات",
                      value: selected.description,
                      wide: true,
                    },
                    {
                      label: "گروه مخاطب",
                      value: selected.audience.join("، "),
                    },
                    {
                      label: "بازه سنی",
                      value:
                        selected.minAge == null && selected.maxAge == null
                          ? null
                          : `${selected.minAge ?? "—"} تا ${selected.maxAge ?? "—"} سال`,
                    },
                    { label: "تگ‌ها", value: selected.tags.join("، ") },
                    {
                      label: "قوانین",
                      value: selected.rules.join(" | "),
                      wide: true,
                    },
                  ],
                },
                {
                  title: "مکان و امکانات",
                  items: [
                    {
                      label: "نشانی",
                      value: selected.location?.address,
                      wide: true,
                    },
                    {
                      label: "منطقه زمانی",
                      value: selected.location?.timezone,
                      dir: "ltr",
                    },
                    {
                      label: "مختصات",
                      value: selected.location
                        ? `${selected.location.latitude}, ${selected.location.longitude}`
                        : null,
                      dir: "ltr",
                    },
                    {
                      label: "رشته‌ها",
                      value: selected.sportIds.length.toLocaleString("fa-IR"),
                    },
                    {
                      label: "امکانات",
                      value: selected.amenities.length.toLocaleString("fa-IR"),
                    },
                    {
                      label: "تجهیزات",
                      value: selected.equipment.length.toLocaleString("fa-IR"),
                    },
                    {
                      label: "رسانه‌ها",
                      value: selected.gallery.length.toLocaleString("fa-IR"),
                    },
                  ],
                },
                {
                  title: "زمان‌ها",
                  items: [
                    {
                      label: "ایجاد",
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

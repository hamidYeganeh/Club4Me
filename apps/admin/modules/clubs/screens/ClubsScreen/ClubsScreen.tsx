"use client";

import { Card, Chip, Spinner, Table } from "@heroui/react";
import { useAdminClubs, useAdminSupplyQuality } from "@api/admin";
import { useTranslations } from "next-intl";

import { ButtonLink } from "@/components/button-link";

export function ClubsScreen() {
  const t = useTranslations("clubsPage");
  const clubs = useAdminClubs();
  const qualityQueue = useAdminSupplyQuality();
  const items = clubs.data?.items ?? [];

  return (
    <main className="flex-1 overflow-auto p-4 lg:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted">
            فهرست باشگاه‌ها؛ اقدامات بررسی داخل صفحه جزئیات هر باشگاه است.
          </p>
        </div>
        <ButtonLink href="/clubs/new" variant="primary">
          ساخت باشگاه برای کاربر
        </ButtonLink>
      </div>

      {qualityQueue.data?.items.length ? (
        <Card className="mt-5 rounded-2xl bg-warning/8 p-4 shadow-none">
          <strong>
            صف کنترل کیفیت عرضه:{" "}
            {qualityQueue.data.items.length.toLocaleString("fa-IR")}
          </strong>
          <p className="mt-1 text-sm text-muted">
            موعد بررسی، تازگی برنامه یا علت توقف این باشگاه‌ها نیاز به اقدام
            دارد. از صفحه جزئیات اقدام کنید.
          </p>
        </Card>
      ) : null}

      <Card
        variant="transparent"
        className="mt-5 overflow-hidden rounded-[1.75rem] bg-surface shadow-none"
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
          <>
            <div className="grid gap-3 p-3 md:hidden" aria-label="باشگاه‌ها">
              {items.map((club) => (
                <article
                  key={club.id}
                  className="space-y-3 rounded-2xl border border-border p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-bold">{club.name}</h2>
                      <p className="mt-1 text-sm text-muted" dir="ltr">
                        {[club.owner?.firstName, club.owner?.lastName]
                          .filter(Boolean)
                          .join(" ") ||
                          club.owner?.phone ||
                          "مالک در دسترس نیست"}
                      </p>
                    </div>
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
                  </div>
                  <p className="text-xs text-muted tabular-nums">
                    آخرین تغییر:{" "}
                    {new Intl.DateTimeFormat("fa-IR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(club.updatedAt))}
                  </p>
                  <ButtonLink
                    href={`/clubs/${club.id}`}
                    variant="secondary"
                    className="w-full"
                  >
                    مشاهده پرونده
                  </ButtonLink>
                </article>
              ))}
            </div>

            <div className="hidden md:block">
              <Table>
                <Table.ScrollContainer>
                  <Table.Content aria-label={t("title")}>
                    <Table.Header>
                      <Table.Column isRowHeader>{t("name")}</Table.Column>
                      <Table.Column>{t("owner")}</Table.Column>
                      <Table.Column>{t("status")}</Table.Column>
                      <Table.Column>کیفیت</Table.Column>
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
                            {[club.owner?.firstName, club.owner?.lastName]
                              .filter(Boolean)
                              .join(" ") ||
                              club.owner?.phone ||
                              "مالک در دسترس نیست"}
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
                          <Table.Cell>
                            <Chip
                              size="sm"
                              variant="soft"
                              color={
                                club.qualityStatus === "suspended"
                                  ? "danger"
                                  : club.qualityStatus === "review_required"
                                    ? "warning"
                                    : "success"
                              }
                            >
                              {club.qualityStatus === "active"
                                ? "فعال"
                                : club.qualityStatus === "review_required"
                                  ? "نیاز به بررسی"
                                  : "متوقف"}
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
                              <ButtonLink
                                href={`/clubs/${club.id}`}
                                size="sm"
                                variant="primary"
                              >
                                جزئیات
                              </ButtonLink>
                              <ButtonLink
                                href={`/clubs/${club.id}/edit`}
                                size="sm"
                                variant="ghost"
                              >
                                ویرایش
                              </ButtonLink>
                            </div>
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Content>
                </Table.ScrollContainer>
              </Table>
            </div>
          </>
        )}
      </Card>
    </main>
  );
}

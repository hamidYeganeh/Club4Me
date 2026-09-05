"use client";

import { useState } from "react";
import { Button, Card, Chip, Spinner, Table, toast } from "@heroui/react";
import {
  type AccountRoleRequest,
  useAdminRoleRequests,
  useReviewRoleRequest,
  type RoleRequestStatus,
} from "@api/account";
import { EntityDetailsModal } from "@ui/entity-details-modal";
import { useTranslations } from "next-intl";

export function RoleRequestsScreen() {
  const t = useTranslations("roleRequestsPage");
  const requests = useAdminRoleRequests();
  const review = useReviewRoleRequest();
  const [selected, setSelected] = useState<AccountRoleRequest | null>(null);
  const [reviewing, setReviewing] = useState<{
    id: string;
    status: Exclude<RoleRequestStatus, "pending">;
  } | null>(null);
  const items = requests.data?.items ?? [];

  const handleReview = async (
    requestId: string,
    status: Exclude<RoleRequestStatus, "pending">,
  ) => {
    if (review.isPending || !window.confirm(t(`${status}Confirm`))) {
      return;
    }

    setReviewing({ id: requestId, status });

    try {
      await review.mutateAsync({ requestId, status });
      toast.success(t(`${status}Success`));
    } catch {
      toast.danger(t("reviewError"));
    } finally {
      setReviewing(null);
    }
  };

  return (
    <main className="flex-1 overflow-auto p-4 lg:p-6">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <Card
        variant="transparent"
        className="mt-5 overflow-hidden rounded-[1.75rem] border border-border bg-surface"
      >
        {requests.isPending ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : requests.isError ? (
          <p className="px-6 py-12 text-center text-muted">{t("error")}</p>
        ) : items.length === 0 ? (
          <p className="px-6 py-12 text-center text-muted">{t("empty")}</p>
        ) : (
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label={t("title")}>
                <Table.Header>
                  <Table.Column isRowHeader>{t("phone")}</Table.Column>
                  <Table.Column>{t("role")}</Table.Column>
                  <Table.Column>{t("status")}</Table.Column>
                  <Table.Column>{t("createdAt")}</Table.Column>
                  <Table.Column>{t("actions")}</Table.Column>
                </Table.Header>
                <Table.Body>
                  {items.map((item) => (
                    <Table.Row key={item.id} id={item.id}>
                      <Table.Cell className="font-medium" dir="ltr">
                        {item.phone}
                      </Table.Cell>
                      <Table.Cell>{t(item.role)}</Table.Cell>
                      <Table.Cell>
                        <Chip
                          color={
                            item.status === "approved"
                              ? "success"
                              : item.status === "rejected"
                                ? "danger"
                                : "warning"
                          }
                          size="sm"
                        >
                          {t(item.status)}
                        </Chip>
                      </Table.Cell>
                      <Table.Cell className="text-muted tabular-nums">
                        {new Intl.DateTimeFormat("fa-IR", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(item.createdAt))}
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onPress={() => setSelected(item)}
                          >
                            جزئیات
                          </Button>
                          {item.status === "pending" ? (
                            <>
                              <Button
                                size="sm"
                                variant="primary"
                                isDisabled={review.isPending}
                                isPending={
                                  reviewing?.id === item.id &&
                                  reviewing.status === "approved"
                                }
                                onPress={() =>
                                  void handleReview(item.id, "approved")
                                }
                              >
                                {t("approve")}
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                isDisabled={review.isPending}
                                isPending={
                                  reviewing?.id === item.id &&
                                  reviewing.status === "rejected"
                                }
                                onPress={() =>
                                  void handleReview(item.id, "rejected")
                                }
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
        title="جزئیات درخواست نقش"
        description="اطلاعات درخواست‌دهنده و سابقه تصمیم"
        sections={
          selected
            ? [
                {
                  items: [
                    { label: "شناسه درخواست", value: selected.id, dir: "ltr" },
                    {
                      label: "شناسه کاربر",
                      value: selected.userId,
                      dir: "ltr",
                    },
                    {
                      label: "شماره موبایل",
                      value: selected.phone,
                      dir: "ltr",
                    },
                    { label: "نقش درخواستی", value: t(selected.role) },
                    {
                      label: "نام متقاضی",
                      value: selected.details.displayName,
                    },
                    { label: "شهر فعالیت", value: selected.details.city },
                    ...(selected.role === "coach"
                      ? [
                          {
                            label: "تخصص ورزشی",
                            value: selected.details.specialty ?? "—",
                          },
                          {
                            label: "سابقه مربیگری",
                            value:
                              selected.details.experienceYears === undefined
                                ? "—"
                                : `${selected.details.experienceYears.toLocaleString("fa-IR")} سال`,
                          },
                          {
                            label: "مدارک و گواهی‌ها",
                            value: selected.details.credentials || "—",
                          },
                        ]
                      : [
                          {
                            label: "نام مجموعه",
                            value: selected.details.businessName ?? "—",
                          },
                          {
                            label: "نوع مجموعه",
                            value: selected.details.businessType ?? "—",
                          },
                        ]),
                    { label: "توضیحات", value: selected.details.description },
                    { label: "وضعیت", value: t(selected.status) },
                    {
                      label: "زمان درخواست",
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

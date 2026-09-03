"use client";

import { useState } from "react";
import { Button, Card, Chip, Spinner, Table, toast } from "@heroui/react";
import {
  useAdminRoleRequests,
  useReviewRoleRequest,
  type RoleRequestStatus,
} from "@api/account";
import { useTranslations } from "next-intl";

export function RoleRequestsScreen() {
  const t = useTranslations("roleRequestsPage");
  const requests = useAdminRoleRequests();
  const review = useReviewRoleRequest();
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
                        {item.status === "pending" ? (
                          <div className="flex gap-2">
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
                          </div>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
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

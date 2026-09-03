"use client";

import { useState } from "react";
import { Button, Card, Chip, Spinner, Table, toast } from "@heroui/react";
import { useAdminClubs, useReviewClub } from "@api/admin";
import { useTranslations } from "next-intl";

export function ClubsScreen() {
  const t = useTranslations("clubsPage");
  const clubs = useAdminClubs();
  const review = useReviewClub();
  const [reviewingId, setReviewingId] = useState<string | null>(null);

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
                        {club.reviewStatus === "pending" ? (
                          <div className="flex gap-2">
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

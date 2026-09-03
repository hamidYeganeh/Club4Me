"use client";

import { Button, Card, Chip, Spinner } from "@heroui/react";
import { useBusinessClubs } from "@api/business";
import Link from "next/link";
import { useTranslations } from "next-intl";

export function ClubsScreen() {
  const t = useTranslations("businessClubs");
  const clubs = useBusinessClubs();
  if (clubs.isPending)
    return (
      <div className="flex flex-1 justify-center py-20">
        <Spinner />
      </div>
    );
  return (
    <main className="flex-1 overflow-auto p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("listTitle")}</h1>
        <Button variant="primary">
          <Link href="/clubs/new">{t("create")}</Link>
        </Button>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(clubs.data?.items ?? []).map((club) => (
          <Link key={club.id} href={`/clubs/${club.id}`}>
            <Card
              variant="transparent"
              className="rounded-2xl border border-border bg-surface p-5 transition hover:border-accent"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-semibold">{club.name}</h2>
                <Chip
                  size="sm"
                  color={
                    club.reviewStatus === "approved"
                      ? "success"
                      : club.reviewStatus === "rejected"
                        ? "danger"
                        : club.reviewStatus === "pending"
                          ? "warning"
                          : "default"
                  }
                >
                  {t(`statuses.${club.reviewStatus}`)}
                </Chip>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-muted">
                {club.description || t("noDescription")}
              </p>
            </Card>
          </Link>
        ))}
      </div>
      {clubs.data?.items.length === 0 && (
        <div className="mt-12 text-center">
          <p className="text-muted">{t("empty")}</p>
          <Button variant="primary" className="mt-4">
            <Link href="/clubs/new">{t("create")}</Link>
          </Button>
        </div>
      )}
    </main>
  );
}

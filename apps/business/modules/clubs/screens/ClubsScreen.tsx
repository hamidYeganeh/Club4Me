"use client";

import { Button, Chip, Spinner } from "@heroui/react";
import { useBusinessClubs, type BusinessClub } from "@api/business";
import {
  createListColumnHelper,
  DataTable,
  ListPagePanel,
} from "@/components/data-table";
import { Icon } from "@theme/icon";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

const columnHelper = createListColumnHelper<BusinessClub>();

const inputClass =
  "h-11 w-full rounded-[1.15rem] border border-white/10 bg-surface/80 px-3 text-sm outline-none transition focus:border-accent";

type ClubFilters = {
  query: string;
  reviewStatus: "" | BusinessClub["reviewStatus"];
};

const emptyFilters: ClubFilters = { query: "", reviewStatus: "" };

export function ClubsScreen() {
  const t = useTranslations("businessClubs");
  const clubs = useBusinessClubs();
  const [draftFilters, setDraftFilters] = useState<ClubFilters>(emptyFilters);
  const [filters, setFilters] = useState<ClubFilters>(emptyFilters);

  const items = useMemo(() => clubs.data?.items ?? [], [clubs.data?.items]);
  const filtered = useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    return items.filter((club) => {
      if (filters.reviewStatus && club.reviewStatus !== filters.reviewStatus) {
        return false;
      }
      if (!query) return true;
      return (
        club.name.toLowerCase().includes(query) ||
        club.shortDescription.toLowerCase().includes(query) ||
        club.description.toLowerCase().includes(query)
      );
    });
  }, [filters, items]);

  const filterActiveCount =
    (filters.query.trim() ? 1 : 0) + (filters.reviewStatus ? 1 : 0);

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor("name", {
          header: "نام باشگاه",
          cell: (info) => {
            const club = info.row.original;
            return (
              <div className="min-w-0">
                <p className="font-medium text-foreground">{club.name}</p>
                <p className="mt-0.5 line-clamp-1 text-xs text-muted">
                  {club.shortDescription ||
                    club.description ||
                    t("noDescription")}
                </p>
              </div>
            );
          },
        }),
        columnHelper.accessor("tags", {
          enableSorting: false,
          header: "تگ‌ها",
          cell: (info) => {
            const tags = info.getValue();
            if (!tags.length) {
              return <span className="text-muted">—</span>;
            }
            return (
              <div className="flex max-w-56 flex-wrap gap-1">
                {tags.slice(0, 3).map((tag) => (
                  <Chip key={tag} size="sm" variant="soft">
                    {tag}
                  </Chip>
                ))}
                {tags.length > 3 ? (
                  <Chip size="sm" variant="soft">
                    +{tags.length - 3}
                  </Chip>
                ) : null}
              </div>
            );
          },
        }),
        columnHelper.accessor("reviewStatus", {
          header: "وضعیت بررسی",
          cell: (info) => {
            const status = info.getValue();
            return (
              <Chip
                size="sm"
                color={
                  status === "approved"
                    ? "success"
                    : status === "rejected"
                      ? "danger"
                      : status === "pending"
                        ? "warning"
                        : "default"
                }
                variant="soft"
              >
                {t(`statuses.${status}`)}
              </Chip>
            );
          },
        }),
        columnHelper.accessor("averageRating", {
          header: "امتیاز",
          cell: (info) => (
            <span className="tabular-nums">
              {info.getValue().toLocaleString("fa-IR")}
              <span className="ms-1 text-xs text-muted">
                ({info.row.original.reviewsCount.toLocaleString("fa-IR")})
              </span>
            </span>
          ),
        }),
        columnHelper.display({
          id: "actions",
          header: "عملیات",
          cell: (info) => (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="ghost">
                <Link href={`/clubs/${info.row.original.id}`}>ویرایش</Link>
              </Button>
              <Button size="sm" variant="secondary">
                <Link href={`/clubs/${info.row.original.id}/reservations`}>
                  رزروها
                </Link>
              </Button>
            </div>
          ),
        }),
      ]),
    [t],
  );

  if (clubs.isPending) {
    return (
      <div className="flex flex-1 justify-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <main className="min-w-0 flex-1 overflow-auto p-4 lg:p-6">
      <div className="mx-auto max-w-7xl">
        <div>
          <h1 className="text-2xl font-semibold">{t("listTitle")}</h1>
          <p className="mt-1 text-sm text-muted">{t("hint")}</p>
        </div>

        <ListPagePanel
          title={t("listTitle")}
          badgeLabel={
            items.some((club) => club.reviewStatus === "draft")
              ? "جدید"
              : undefined
          }
          description={`${filtered.length.toLocaleString("fa-IR")} باشگاه`}
          filterActiveCount={filterActiveCount}
          filterTitle="فیلتر باشگاه‌ها"
          onFilterApply={() => setFilters(draftFilters)}
          onFilterReset={() => {
            setDraftFilters(emptyFilters);
            setFilters(emptyFilters);
          }}
          filterContent={
            <>
              <label className="grid gap-1.5 text-sm">
                <span className="text-muted">جست‌وجو</span>
                <input
                  className={inputClass}
                  value={draftFilters.query}
                  onChange={(event) =>
                    setDraftFilters((current) => ({
                      ...current,
                      query: event.target.value,
                    }))
                  }
                  placeholder="نام یا توضیح باشگاه"
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="text-muted">وضعیت بررسی</span>
                <select
                  className={inputClass}
                  value={draftFilters.reviewStatus}
                  onChange={(event) =>
                    setDraftFilters((current) => ({
                      ...current,
                      reviewStatus: event.target
                        .value as ClubFilters["reviewStatus"],
                    }))
                  }
                >
                  <option value="">همه</option>
                  <option value="draft">{t("statuses.draft")}</option>
                  <option value="pending">{t("statuses.pending")}</option>
                  <option value="approved">{t("statuses.approved")}</option>
                  <option value="rejected">{t("statuses.rejected")}</option>
                </select>
              </label>
            </>
          }
          primaryAction={
            <Button variant="primary">
              <Link href="/clubs/new" className="flex items-center gap-2">
                <Icon name="plus" />
                {t("create")}
              </Link>
            </Button>
          }
        >
          <DataTable
            ariaLabel={t("listTitle")}
            data={filtered}
            columns={columns}
            getRowId={(club) => club.id}
            rowHeaderColumnId="name"
            emptyContent={
              <div className="grid min-h-48 place-items-center p-8 text-center">
                <p className="text-muted">{t("empty")}</p>
                <Button variant="primary" className="mt-4">
                  <Link href="/clubs/new">{t("create")}</Link>
                </Button>
              </div>
            }
          />
        </ListPagePanel>
      </div>
    </main>
  );
}

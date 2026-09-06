"use client";

import { Button, Chip, toast } from "@heroui/react";
import { useBusinessClubs } from "@api/business";
import { type ClubReview, useClubReviews, useRespondToClubReview } from "@api";
import Image from "next/image";
import { useMemo, useState } from "react";

import {
  createListColumnHelper,
  DataTable,
  ListPagePanel,
} from "@/components/data-table";

const input =
  "h-11 w-full rounded-[1.15rem] border border-white/10 bg-surface/80 px-3 text-sm outline-none focus:border-accent";

const reviewColumnHelper = createListColumnHelper<ClubReview>();

export function BusinessReviewsScreen() {
  const clubs = useBusinessClubs();
  const [picked, setPicked] = useState("");
  const clubId = picked || clubs.data?.items[0]?.id || "";
  const reviews = useClubReviews(clubId);
  const respond = useRespondToClubReview(clubId);
  const [draftFilters, setDraftFilters] = useState({
    query: "",
    hasResponse: "" as "" | "yes" | "no",
  });
  const [filters, setFilters] = useState({
    query: "",
    hasResponse: "" as "" | "yes" | "no",
  });

  const items = reviews.data?.items ?? [];
  const filtered = useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    return items.filter((review) => {
      if (filters.hasResponse === "yes" && !review.ownerResponse) return false;
      if (filters.hasResponse === "no" && review.ownerResponse) return false;
      if (!query) return true;
      return (
        (review.title ?? "").toLowerCase().includes(query) ||
        review.body.toLowerCase().includes(query)
      );
    });
  }, [filters, items]);

  const filterActiveCount =
    (filters.query.trim() ? 1 : 0) + (filters.hasResponse ? 1 : 0);

  const columns = useMemo(
    () =>
      reviewColumnHelper.columns([
        reviewColumnHelper.display({
          id: "title",
          header: "عنوان",
          cell: (info) => (
            <span className="font-medium">
              {info.row.original.title || "نظر ورزشکار"}
            </span>
          ),
        }),
        reviewColumnHelper.accessor("rating", {
          header: "امتیاز",
          cell: (info) => (
            <span className="text-warning">{"★".repeat(info.getValue())}</span>
          ),
        }),
        reviewColumnHelper.accessor("body", {
          enableSorting: false,
          header: "متن",
          cell: (info) => (
            <p className="line-clamp-2 max-w-md text-sm text-muted">
              {info.getValue()}
            </p>
          ),
        }),
        reviewColumnHelper.display({
          id: "response",
          header: "پاسخ باشگاه",
          cell: (info) => (
            <Chip
              size="sm"
              color={info.row.original.ownerResponse ? "success" : "warning"}
              variant="soft"
            >
              {info.row.original.ownerResponse ? "پاسخ داده شده" : "بدون پاسخ"}
            </Chip>
          ),
        }),
        reviewColumnHelper.display({
          id: "actions",
          header: "عملیات",
          cell: (info) => {
            const review = info.row.original;
            if (review.ownerResponse) {
              return (
                <span className="text-xs text-muted">
                  {review.ownerResponse.body.slice(0, 40)}
                  {review.ownerResponse.body.length > 40 ? "…" : ""}
                </span>
              );
            }
            return (
              <Button
                size="sm"
                variant="secondary"
                isPending={respond.isPending}
                onPress={() => {
                  const body = window
                    .prompt("پاسخ باشگاه را بنویسید:")
                    ?.trim();
                  if (!body) return;
                  void respond
                    .mutateAsync({ reviewId: review.id, body })
                    .then(() => toast.success("پاسخ ثبت شد"))
                    .catch(() => toast.danger("ثبت پاسخ انجام نشد"));
                }}
              >
                ثبت پاسخ
              </Button>
            );
          },
        }),
      ]),
    [respond.isPending],
  );

  return (
    <main className="min-w-0 flex-1 overflow-auto p-4 lg:p-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">نظرهای باشگاه</h1>
            <p className="mt-1 text-sm text-muted">
              مشاهده بازخورد ورزشکاران و پاسخ رسمی باشگاه
            </p>
          </div>
          <select
            className="h-11 rounded-[1.15rem] border border-white/10 bg-surface/80 px-3 text-sm"
            value={clubId}
            onChange={(event) => setPicked(event.target.value)}
          >
            {clubs.data?.items.map((club) => (
              <option key={club.id} value={club.id}>
                {club.name}
              </option>
            ))}
          </select>
        </div>
        <ListPagePanel
          title="فهرست نظرها"
          description={`${filtered.length.toLocaleString("fa-IR")} نظر`}
          filterActiveCount={filterActiveCount}
          filterTitle="فیلتر نظرها"
          onFilterApply={() => setFilters(draftFilters)}
          onFilterReset={() => {
            const empty = { query: "", hasResponse: "" as const };
            setDraftFilters(empty);
            setFilters(empty);
          }}
          filterContent={
            <>
              <label className="grid gap-1.5 text-sm">
                <span className="text-muted">جست‌وجو</span>
                <input
                  className={input}
                  value={draftFilters.query}
                  onChange={(event) =>
                    setDraftFilters((current) => ({
                      ...current,
                      query: event.target.value,
                    }))
                  }
                  placeholder="عنوان یا متن نظر"
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="text-muted">وضعیت پاسخ</span>
                <select
                  className={input}
                  value={draftFilters.hasResponse}
                  onChange={(event) =>
                    setDraftFilters((current) => ({
                      ...current,
                      hasResponse: event.target.value as "" | "yes" | "no",
                    }))
                  }
                >
                  <option value="">همه</option>
                  <option value="yes">پاسخ داده شده</option>
                  <option value="no">بدون پاسخ</option>
                </select>
              </label>
            </>
          }
        >
          <DataTable
            ariaLabel="فهرست نظرهای باشگاه"
            data={filtered}
            columns={columns}
            getRowId={(row) => row.id}
            rowHeaderColumnId="title"
            isLoading={reviews.isPending}
            emptyContent={
              <div className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
                <Image
                  src="/reviews/empty.png"
                  alt=""
                  width={750}
                  height={516}
                  className="h-auto w-48 max-w-[70%] object-contain drop-shadow-xl"
                />
                <p className="mt-4 font-semibold text-foreground">
                  هنوز نظری ثبت نشده است.
                </p>
                <p className="mt-2 text-sm text-muted">
                  نظرهای ورزشکاران پس از ثبت، اینجا نمایش داده می‌شوند.
                </p>
              </div>
            }
          />
        </ListPagePanel>
      </div>
    </main>
  );
}

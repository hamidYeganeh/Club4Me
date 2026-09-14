"use client";

import { FormSelect, FormOption } from "@repo/ui/form-select";
import { useTextActionDialog } from "@repo/ui/text-action-dialog";
import { Input as HeroInput } from "@heroui/react";
import { useSelectedClub } from "@/lib/use-selected-club";

import { Button, Chip, toast } from "@heroui/react";
import {
  type ClubReview,
  useBusinessClubReviews,
  useRespondToClubReview,
} from "@api";
import Image from "next/image";
import { useMemo, useState } from "react";

import {
  createListColumnHelper,
  DataTable,
  ListPagePanel,
} from "@/components/data-table";

const input = "w-full min-w-0";

const reviewColumnHelper = createListColumnHelper<ClubReview>();

export function BusinessReviewsScreen() {
  const { clubs, clubId, setClubId: setPicked } = useSelectedClub();
  const responseDialog = useTextActionDialog();
  const [pagination, setPagination] = useState({ clubId: "", page: 1 });
  const page = pagination.clubId === clubId ? pagination.page : 1;
  const respond = useRespondToClubReview(clubId);
  const [draftFilters, setDraftFilters] = useState({
    query: "",
    hasResponse: "" as "" | "yes" | "no",
  });
  const [filters, setFilters] = useState({
    query: "",
    hasResponse: "" as "" | "yes" | "no",
  });

  const reviews = useBusinessClubReviews(clubId, {
    page,
    limit: 20,
    q: filters.query,
    hasResponse: filters.hasResponse,
  });
  const filtered = reviews.data?.items ?? [];

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
                  responseDialog.open({
                    title: "پاسخ باشگاه",
                    description: review.body,
                    onSubmit: async (body) => {
                      await respond.mutateAsync({ reviewId: review.id, body });
                      setPagination({ clubId, page: 1 });
                      toast.success("پاسخ ثبت شد");
                    },
                  });
                }}
              >
                ثبت پاسخ
              </Button>
            );
          },
        }),
      ]),
    [respond, responseDialog, clubId],
  );

  return (
    <main className="min-w-0 flex-1 overflow-auto p-4 lg:p-6">
      {responseDialog.dialog}
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">نظرهای باشگاه</h1>
            <p className="mt-1 text-sm text-muted">
              مشاهده بازخورد ورزشکاران و پاسخ رسمی باشگاه
            </p>
          </div>
          <FormSelect
            aria-label="انتخاب گزینه"
            className="h-11 rounded-[1.15rem] border border-white/10 bg-surface/80 px-3 text-sm"
            value={clubId}
            onChange={(event) => setPicked(event)}
          >
            {clubs.data?.items.map((club) => (
              <FormOption entity={club} key={club.id} value={club.id}>
                {club.name}
              </FormOption>
            ))}
          </FormSelect>
        </div>
        <ListPagePanel
          title="فهرست نظرها"
          description={`${(reviews.data?.total ?? 0).toLocaleString("fa-IR")} نظر`}
          filterActiveCount={filterActiveCount}
          filterTitle="فیلتر نظرها"
          onFilterApply={() => {
            setFilters(draftFilters);
            setPagination({ clubId, page: 1 });
          }}
          onFilterReset={() => {
            const empty = { query: "", hasResponse: "" as const };
            setDraftFilters(empty);
            setFilters(empty);
            setPagination({ clubId, page: 1 });
          }}
          filterContent={
            <>
              <label className="grid gap-1.5 text-sm">
                <span className="text-muted">جست‌وجو</span>
                <HeroInput
                  variant="secondary"
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
                <FormSelect
                  aria-label="انتخاب گزینه"
                  className={input}
                  value={draftFilters.hasResponse}
                  onChange={(event) =>
                    setDraftFilters((current) => ({
                      ...current,
                      hasResponse: event as "" | "yes" | "no",
                    }))
                  }
                >
                  <FormOption value="">همه</FormOption>
                  <FormOption value="yes">پاسخ داده شده</FormOption>
                  <FormOption value="no">بدون پاسخ</FormOption>
                </FormSelect>
              </label>
            </>
          }
        >
          {reviews.isError || clubs.isError ? (
            <div role="alert" className="p-6 text-center space-y-3">
              <p>دریافت نظرها انجام نشد. دوباره تلاش کنید.</p>
              <Button
                onPress={() => {
                  void reviews.refetch();
                  void clubs.refetch();
                }}
              >
                تلاش دوباره
              </Button>
            </div>
          ) : (
            <DataTable
              ariaLabel="فهرست نظرهای باشگاه"
              pageSize={20}
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
                    {filterActiveCount
                      ? "نظری مطابق فیلترها پیدا نشد."
                      : "هنوز نظری ثبت نشده است."}
                  </p>
                  <p className="mt-2 text-sm text-muted">
                    نظرهای ورزشکاران پس از ثبت، اینجا نمایش داده می‌شوند.
                  </p>
                </div>
              }
            />
          )}
          {!reviews.isError && (reviews.data?.totalPages ?? 0) > 1 ? (
            <nav
              aria-label="صفحه‌های نظرها"
              className="flex items-center justify-center gap-4 p-4"
            >
              <Button
                variant="secondary"
                isDisabled={page <= 1 || reviews.isFetching}
                onPress={() => setPagination({ clubId, page: page - 1 })}
              >
                صفحه قبل
              </Button>
              <span>
                {page.toLocaleString("fa-IR")} از{" "}
                {(reviews.data?.totalPages ?? 1).toLocaleString("fa-IR")}
              </span>
              <Button
                variant="secondary"
                isDisabled={
                  page >= (reviews.data?.totalPages ?? 1) || reviews.isFetching
                }
                onPress={() => setPagination({ clubId, page: page + 1 })}
              >
                صفحه بعد
              </Button>
            </nav>
          ) : null}
        </ListPagePanel>
      </div>
    </main>
  );
}

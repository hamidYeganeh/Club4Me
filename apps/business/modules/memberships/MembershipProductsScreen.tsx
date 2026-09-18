"use client";
import Link from "next/link";

import { FormSelect, FormOption } from "@repo/ui/form-select";
import { Input as HeroInput } from "@heroui/react";
import { useSelectedClub } from "@/lib/use-selected-club";

import {
  type BenefitProduct,
  useBusinessBenefitProducts,
  useUpdateBenefitProduct,
} from "@api";
import {
  useBusinessClubMemberships,
  useRevokeBusinessClubMember,
} from "@api/business";
import { Button, Card, Chip, toast } from "@heroui/react";
import { useMemo, useState } from "react";

import {
  createListColumnHelper,
  DataTable,
  ListPagePanel,
} from "@/components/data-table";

const input = "w-full min-w-0";

const productColumnHelper = createListColumnHelper<BenefitProduct>();

export function MembershipProductsScreen() {
  const { clubs, clubId, setClubId: setPicked } = useSelectedClub();
  const products = useBusinessBenefitProducts(clubId);
  const update = useUpdateBenefitProduct(clubId);
  const team = useBusinessClubMemberships(clubId);
  const revokeMember = useRevokeBusinessClubMember(clubId);
  const [draftFilters, setDraftFilters] = useState({
    query: "",
    type: "" as "" | BenefitProduct["type"],
    status: "" as "" | BenefitProduct["status"],
  });
  const [filters, setFilters] = useState({
    query: "",
    type: "" as "" | BenefitProduct["type"],
    status: "" as "" | BenefitProduct["status"],
  });

  const items = useMemo(
    () => products.data?.items ?? [],
    [products.data?.items],
  );
  const filtered = useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    return items.filter((item) => {
      if (filters.type && item.type !== filters.type) return false;
      if (filters.status && item.status !== filters.status) return false;
      if (!query) return true;
      return (
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
      );
    });
  }, [filters, items]);

  const filterActiveCount =
    (filters.query.trim() ? 1 : 0) +
    (filters.type ? 1 : 0) +
    (filters.status ? 1 : 0);

  const columns = useMemo(
    () =>
      productColumnHelper.columns([
        productColumnHelper.accessor("title", {
          header: "عنوان",
          cell: (info) => (
            <span className="font-medium">{info.getValue()}</span>
          ),
        }),
        productColumnHelper.accessor("type", {
          header: "نوع",
          cell: (info) => (
            <Chip size="sm" variant="soft">
              {info.getValue() === "session_pack" ? "بسته جلسه" : "عضویت زمانی"}
            </Chip>
          ),
        }),
        productColumnHelper.display({
          id: "limits",
          header: "محدودیت‌ها",
          cell: (info) => {
            const item = info.row.original;
            return (
              <span className="text-sm text-muted">
                {item.type === "session_pack"
                  ? `${item.sessionCount} جلسه`
                  : `هفته‌ای ${item.weeklyLimit} بار`}{" "}
                · {item.validityDays} روز
                <span className="mt-1 block">
                  {item.maxPauseDays
                    ? `تا ${item.maxPauseDays.toLocaleString("fa-IR")} روز توقف`
                    : "بدون توقف"}
                </span>
              </span>
            );
          },
        }),
        productColumnHelper.accessor("price", {
          header: "قیمت",
          cell: (info) => (
            <span className="font-semibold tabular-nums">
              {info.getValue().toLocaleString("fa-IR")} ریال
            </span>
          ),
        }),
        productColumnHelper.accessor("status", {
          header: "وضعیت",
          cell: (info) => (
            <Chip
              size="sm"
              color={info.getValue() === "active" ? "success" : "default"}
            >
              {info.getValue() === "active" ? "فعال" : "غیرفعال"}
            </Chip>
          ),
        }),
        productColumnHelper.display({
          id: "actions",
          header: "عملیات",
          cell: (info) => {
            const item = info.row.original;
            return (
              <Button
                size="sm"
                variant="secondary"
                onPress={() =>
                  update.mutate({
                    productId: item.id,
                    status: item.status === "active" ? "inactive" : "active",
                  })
                }
              >
                {item.status === "active" ? "غیرفعال‌کردن" : "فعال‌کردن"}
              </Button>
            );
          },
        }),
      ]),
    [update],
  );

  return (
    <main className="min-w-0 flex-1 overflow-auto p-4 lg:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">بسته‌ها و عضویت</h1>
            <p className="mt-1 text-sm text-muted">
              فقط دو مدل ساده برای خرید و مصرف خودکار در رزرو
            </p>
          </div>
          <div className="flex items-end gap-2">
            <label className="grid gap-1 text-xs text-muted">
              باشگاه
              <FormSelect
                aria-label="باشگاه"
                className={input}
                value={clubId}
                onChange={(e) => setPicked(e)}
              >
                {clubs.data?.items.map((club) => (
                  <FormOption entity={club} key={club.id} value={club.id}>
                    {club.name}
                  </FormOption>
                ))}
              </FormSelect>
            </label>
            <Button variant="primary">
              <Link href={`/memberships/new?clubId=${clubId}`}>محصول جدید</Link>
            </Button>
          </div>
        </div>
        <Card className="mt-5 app-card shadow-none active:scale-100 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">اعضای تیم باشگاه</h2>
            <Button variant="secondary" isDisabled={!clubId}>
              <Link href={`/memberships/invite?clubId=${clubId}`}>
                دعوت عضو
              </Link>
            </Button>
          </div>
          <div className="mt-4 grid gap-2">
            {(team.data?.items ?? []).map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-xl bg-surface-secondary p-3 text-sm"
              >
                <span dir="ltr">
                  {member.name || member.phone || member.userId}
                </span>
                <div className="flex gap-2">
                  <Chip size="sm">
                    {
                      {
                        owner: "مالک",
                        manager: "مدیر",
                        receptionist: "پذیرش",
                        finance: "مالی",
                        coach: "مربی",
                      }[member.role]
                    }
                  </Chip>
                  <Chip
                    size="sm"
                    color={
                      member.status === "accepted"
                        ? "success"
                        : member.status === "invited"
                          ? "warning"
                          : "default"
                    }
                  >
                    {
                      {
                        accepted: "فعال",
                        invited: "منتظر پذیرش",
                        rejected: "رد شده",
                        suspended: "لغو شده",
                      }[member.status]
                    }
                  </Chip>
                  {member.status === "invited" && (
                    <Button
                      size="sm"
                      onPress={() =>
                        void navigator.clipboard
                          .writeText(
                            `https://app.gym4me.ir/club-memberships/${member.id}`,
                          )
                          .then(() => toast.success("لینک دعوت کپی شد"))
                          .catch(() => toast.danger("کپی لینک انجام نشد"))
                      }
                    >
                      کپی دعوت
                    </Button>
                  )}
                  {member.role !== "owner" && member.status !== "suspended" && (
                    <Button
                      size="sm"
                      variant="danger-soft"
                      isPending={revokeMember.isPending}
                      onPress={() =>
                        void revokeMember
                          .mutateAsync(member.id)
                          .then(() => toast.success("دسترسی لغو شد"))
                          .catch(() => toast.danger("لغو دسترسی انجام نشد"))
                      }
                    >
                      لغو دسترسی
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {!team.isPending && !team.data?.items.length ? (
              <p className="text-sm text-muted">عضوی ثبت نشده است.</p>
            ) : null}
          </div>
        </Card>
        <ListPagePanel
          title="فهرست محصولات"
          description={`${filtered.length.toLocaleString("fa-IR")} محصول`}
          filterActiveCount={filterActiveCount}
          filterTitle="فیلتر محصولات"
          onFilterApply={() => setFilters(draftFilters)}
          onFilterReset={() => {
            const empty = {
              query: "",
              type: "" as const,
              status: "" as const,
            };
            setDraftFilters(empty);
            setFilters(empty);
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
                  placeholder="عنوان یا توضیح"
                />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="text-muted">نوع</span>
                <FormSelect
                  aria-label="انتخاب گزینه"
                  className={input}
                  value={draftFilters.type}
                  onChange={(event) =>
                    setDraftFilters((current) => ({
                      ...current,
                      type: event as "" | BenefitProduct["type"],
                    }))
                  }
                >
                  <FormOption value="">همه</FormOption>
                  <FormOption value="session_pack">بسته جلسه</FormOption>
                  <FormOption value="time_membership">عضویت زمانی</FormOption>
                </FormSelect>
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="text-muted">وضعیت</span>
                <FormSelect
                  aria-label="انتخاب گزینه"
                  className={input}
                  value={draftFilters.status}
                  onChange={(event) =>
                    setDraftFilters((current) => ({
                      ...current,
                      status: event as "" | BenefitProduct["status"],
                    }))
                  }
                >
                  <FormOption value="">همه</FormOption>
                  <FormOption value="active">فعال</FormOption>
                  <FormOption value="inactive">غیرفعال</FormOption>
                </FormSelect>
              </label>
            </>
          }
        >
          <DataTable
            ariaLabel="فهرست محصولات عضویت"
            data={filtered}
            columns={columns}
            getRowId={(row) => row.id}
            rowHeaderColumnId="title"
            isLoading={products.isPending}
            emptyContent={
              <p className="grid min-h-48 place-items-center p-8 text-center text-muted">
                محصولی تعریف نشده است.
              </p>
            }
          />
        </ListPagePanel>
      </div>
    </main>
  );
}

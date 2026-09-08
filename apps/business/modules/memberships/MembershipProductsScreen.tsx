"use client";

import {
  type BenefitProduct,
  useBusinessBenefitProducts,
  useCreateBenefitProduct,
  useUpdateBenefitProduct,
} from "@api";
import {
  useBusinessClubMemberships,
  useBusinessClubs,
  useInviteBusinessClubMember,
  useRevokeBusinessClubMember,
} from "@api/business";
import { Button, Card, Chip, toast } from "@heroui/react";
import { type FormEvent, useMemo, useState } from "react";

import {
  createListColumnHelper,
  DataTable,
  ListPagePanel,
} from "@/components/data-table";
import { PanelNumberField } from "@/components/form/PanelNumberField";

const input =
  "h-11 rounded-[1.15rem] border border-white/10 bg-surface/80 px-3 text-sm outline-none focus:border-accent";

const productColumnHelper = createListColumnHelper<BenefitProduct>();

export function MembershipProductsScreen() {
  const clubs = useBusinessClubs();
  const [picked, setPicked] = useState("");
  const clubId = picked || clubs.data?.items[0]?.id || "";
  const products = useBusinessBenefitProducts(clubId);
  const create = useCreateBenefitProduct(clubId);
  const update = useUpdateBenefitProduct(clubId);
  const team = useBusinessClubMemberships(clubId);
  const revokeMember = useRevokeBusinessClubMember(clubId);
  const inviteMember = useInviteBusinessClubMember(clubId);
  const [type, setType] = useState<BenefitProduct["type"]>("session_pack");
  const [open, setOpen] = useState(false);
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

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      await create.mutateAsync({
        title: String(data.get("title")),
        description: String(data.get("description") ?? ""),
        type,
        price: Number(data.get("price")),
        validityDays: Number(data.get("validityDays")),
        maxPauseDays: Number(data.get("maxPauseDays")),
        sessionCount:
          type === "session_pack" ? Number(data.get("limit")) : null,
        weeklyLimit:
          type === "time_membership" ? Number(data.get("limit")) : null,
        sessionTypes: data.getAll(
          "sessionTypes",
        ) as BenefitProduct["sessionTypes"],
      });
      form.reset();
      setOpen(false);
      toast.success("محصول عضویت ساخته شد");
    } catch {
      toast.danger("ساخت محصول انجام نشد");
    }
  };

  const invite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      await inviteMember.mutateAsync({
        phone: String(data.get("phone")),
        role: String(data.get("role")) as
          "manager" | "receptionist" | "finance" | "coach",
        permissions: [],
      });
      form.reset();
      toast.success("دعوت همکاری ثبت شد");
    } catch {
      toast.danger("ثبت دعوت انجام نشد؛ شناسه کاربر را بررسی کنید");
    }
  };

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
              <select
                className={input}
                value={clubId}
                onChange={(e) => setPicked(e.target.value)}
              >
                {clubs.data?.items.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.name}
                  </option>
                ))}
              </select>
            </label>
            <Button variant="primary" onPress={() => setOpen(!open)}>
              محصول جدید
            </Button>
          </div>
        </div>
        {open ? (
          <Card className="mt-5 app-card shadow-none active:scale-100 p-5">
            <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
              <label className="grid gap-1 text-sm text-muted">
                عنوان
                <input required name="title" minLength={3} className={input} />
              </label>
              <label className="grid gap-1 text-sm text-muted">
                نوع
                <select
                  className={input}
                  value={type}
                  onChange={(e) =>
                    setType(e.target.value as BenefitProduct["type"])
                  }
                >
                  <option value="session_pack">بسته تعدادجلسه</option>
                  <option value="time_membership">عضویت زمانی</option>
                </select>
              </label>
              <PanelNumberField
                label="قیمت (ریال)"
                name="price"
                minValue={1}
                isRequired
              />
              <PanelNumberField
                label="مدت اعتبار (روز)"
                name="validityDays"
                minValue={1}
                maxValue={730}
                defaultValue={30}
                isRequired
              />
              <PanelNumberField
                label="سقف توقف در طول قرارداد (روز؛ صفر یعنی بدون توقف)"
                name="maxPauseDays"
                minValue={0}
                maxValue={90}
                defaultValue={0}
              />
              <PanelNumberField
                label={
                  type === "session_pack"
                    ? "تعداد جلسه"
                    : "حداکثر استفاده هفتگی"
                }
                name="limit"
                minValue={1}
                isRequired
              />
              <label className="grid gap-2 text-sm text-muted">
                قابل استفاده برای
                <div className="flex flex-wrap gap-3 text-foreground">
                  {[
                    ["court", "زمین"],
                    ["class", "کلاس"],
                    ["coached_session", "جلسه مربی"],
                  ].map(([value, label]) => (
                    <label key={value} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="sessionTypes"
                        value={value}
                        defaultChecked
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </label>
              <label className="grid gap-1 text-sm text-muted md:col-span-2">
                توضیح
                <textarea name="description" className={`${input} h-24 py-3`} />
              </label>
              <div className="flex gap-2 md:col-span-2">
                <Button
                  type="submit"
                  variant="primary"
                  isPending={create.isPending}
                >
                  ذخیره
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onPress={() => setOpen(false)}
                >
                  انصراف
                </Button>
              </div>
            </form>
          </Card>
        ) : null}
        <Card className="mt-5 app-card shadow-none active:scale-100 p-5">
          <h2 className="text-lg font-semibold">اعضای تیم باشگاه</h2>
          <form
            className="mt-4 grid gap-3 md:grid-cols-[1fr_12rem_auto]"
            onSubmit={invite}
          >
            <input
              required
              name="phone"
              inputMode="tel"
              aria-label="موبایل عضو تیم"
              className={input}
              placeholder="۰۹۱۲۱۲۳۴۵۶۷"
              dir="ltr"
            />
            <select name="role" className={input} defaultValue="manager">
              <option value="manager">مدیر</option>
              <option value="receptionist">پذیرش</option>
              <option value="finance">مالی</option>
              <option value="coach">مربی</option>
            </select>
            <Button
              type="submit"
              variant="secondary"
              isPending={inviteMember.isPending}
              isDisabled={!clubId}
            >
              ارسال دعوت
            </Button>
            <p className="text-xs leading-6 text-muted md:col-span-3">
              مدیر: عملیات باشگاه؛ پذیرش: شاگردان، ثبت‌نام و حضور؛ مالی: پرداخت
              و فهرست شاگردان؛ مربی: کلاس، ثبت‌نام و حضور. دعوت تا پذیرش کاربر
              دسترسی نمی‌دهد. کاربر باید حساب داشته باشد.
            </p>
          </form>
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
                <input
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
                <select
                  className={input}
                  value={draftFilters.type}
                  onChange={(event) =>
                    setDraftFilters((current) => ({
                      ...current,
                      type: event.target.value as "" | BenefitProduct["type"],
                    }))
                  }
                >
                  <option value="">همه</option>
                  <option value="session_pack">بسته جلسه</option>
                  <option value="time_membership">عضویت زمانی</option>
                </select>
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="text-muted">وضعیت</span>
                <select
                  className={input}
                  value={draftFilters.status}
                  onChange={(event) =>
                    setDraftFilters((current) => ({
                      ...current,
                      status: event.target.value as
                        "" | BenefitProduct["status"],
                    }))
                  }
                >
                  <option value="">همه</option>
                  <option value="active">فعال</option>
                  <option value="inactive">غیرفعال</option>
                </select>
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

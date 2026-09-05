"use client";

import {
  type BenefitProduct,
  useBusinessBenefitProducts,
  useCreateBenefitProduct,
  useUpdateBenefitProduct,
} from "@api";
import { useBusinessClubs } from "@api/business";
import { Button, Card, Chip, Spinner, toast } from "@heroui/react";
import { type FormEvent, useState } from "react";

const input =
  "h-11 rounded-xl border border-border bg-surface px-3 text-sm outline-none focus:border-accent";

export function MembershipProductsScreen() {
  const clubs = useBusinessClubs();
  const [picked, setPicked] = useState("");
  const clubId = picked || clubs.data?.items[0]?.id || "";
  const products = useBusinessBenefitProducts(clubId);
  const create = useCreateBenefitProduct(clubId);
  const update = useUpdateBenefitProduct(clubId);
  const [type, setType] = useState<BenefitProduct["type"]>("session_pack");
  const [open, setOpen] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      await create.mutateAsync({
        title: String(data.get("title")),
        description: String(data.get("description") ?? ""),
        type,
        price: Number(data.get("price")),
        validityDays: Number(data.get("validityDays")),
        sessionCount:
          type === "session_pack" ? Number(data.get("limit")) : null,
        weeklyLimit:
          type === "time_membership" ? Number(data.get("limit")) : null,
        sessionTypes: data.getAll(
          "sessionTypes",
        ) as BenefitProduct["sessionTypes"],
      });
      event.currentTarget.reset();
      setOpen(false);
      toast.success("محصول عضویت ساخته شد");
    } catch {
      toast.danger("ساخت محصول انجام نشد");
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
          <Card className="mt-5 rounded-2xl border border-border bg-surface p-5">
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
              <label className="grid gap-1 text-sm text-muted">
                قیمت (ریال)
                <input
                  required
                  name="price"
                  type="number"
                  min={1}
                  className={input}
                />
              </label>
              <label className="grid gap-1 text-sm text-muted">
                مدت اعتبار (روز)
                <input
                  required
                  name="validityDays"
                  type="number"
                  min={1}
                  max={730}
                  defaultValue={30}
                  className={input}
                />
              </label>
              <label className="grid gap-1 text-sm text-muted">
                {type === "session_pack"
                  ? "تعداد جلسه"
                  : "حداکثر استفاده هفتگی"}
                <input
                  required
                  name="limit"
                  type="number"
                  min={1}
                  className={input}
                />
              </label>
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
        <div className="mt-5">
          {products.isPending ? (
            <div className="flex justify-center py-16">
              <Spinner />
            </div>
          ) : !products.data?.items.length ? (
            <p className="rounded-2xl border border-dashed border-border p-12 text-center text-muted">
              محصولی تعریف نشده است.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {products.data.items.map((item) => (
                <Card
                  key={item.id}
                  className="rounded-2xl border border-border bg-surface p-5"
                >
                  <div className="flex justify-between gap-3">
                    <Chip size="sm">
                      {item.type === "session_pack"
                        ? "بسته جلسه"
                        : "عضویت زمانی"}
                    </Chip>
                    <Chip
                      size="sm"
                      color={item.status === "active" ? "success" : "default"}
                    >
                      {item.status === "active" ? "فعال" : "غیرفعال"}
                    </Chip>
                  </div>
                  <h2 className="mt-4 font-semibold">{item.title}</h2>
                  <p className="mt-2 text-sm text-muted">
                    {item.type === "session_pack"
                      ? `${item.sessionCount} جلسه`
                      : `هفته‌ای ${item.weeklyLimit} بار`}{" "}
                    · {item.validityDays} روز
                  </p>
                  <p className="mt-3 text-lg font-bold">
                    {item.price.toLocaleString("fa-IR")} ریال
                  </p>
                  <Button
                    className="mt-4 w-full"
                    size="sm"
                    variant="secondary"
                    onPress={() =>
                      update.mutate({
                        productId: item.id,
                        status:
                          item.status === "active" ? "inactive" : "active",
                      })
                    }
                  >
                    {item.status === "active" ? "غیرفعال‌کردن" : "فعال‌کردن"}
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

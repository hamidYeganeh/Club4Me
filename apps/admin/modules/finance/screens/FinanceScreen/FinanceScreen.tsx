"use client";

import {
  useAdminPayouts,
  useCreateDiscountCampaign,
  useCreditWallet,
  useReviewPayout,
  useRunReconciliation,
} from "@api";
import { Button, Card, Chip, Spinner, Table, toast } from "@heroui/react";
import { FormEvent, useState } from "react";

const money = new Intl.NumberFormat("fa-IR");
const inputClass =
  "h-11 rounded-xl border border-border bg-surface px-3 text-sm outline-none focus:border-primary";

export function FinanceScreen() {
  const [status, setStatus] = useState("requested");
  const payouts = useAdminPayouts(status || undefined);
  const review = useReviewPayout();
  const reconciliation = useRunReconciliation();
  const credit = useCreditWallet();
  const discount = useCreateDiscountCampaign();

  const decide = async (id: string, decision: "paid" | "rejected") => {
    const bankReference =
      decision === "paid"
        ? window.prompt("شماره پیگیری بانکی را وارد کنید")?.trim()
        : undefined;
    if (decision === "paid" && !bankReference) return;
    const note = window.prompt("یادداشت ادمین (اختیاری)")?.trim() ?? "";
    try {
      await review.mutateAsync({
        payoutId: id,
        status: decision,
        note,
        bankReference,
      });
      toast.success("درخواست تسویه به‌روزرسانی شد");
    } catch {
      toast.danger("ثبت نتیجه تسویه ناموفق بود");
    }
  };

  const submitCredit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      await credit.mutateAsync({
        userId: String(data.get("userId")),
        amount: Number(data.get("amount")),
        source: "admin",
        idempotencyKey: crypto.randomUUID(),
        note: String(data.get("note") ?? ""),
        expiresAt: null,
      });
      event.currentTarget.reset();
      toast.success("اعتبار کیف پول ثبت شد");
    } catch {
      toast.danger("ثبت اعتبار ناموفق بود");
    }
  };

  const submitDiscount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    try {
      await discount.mutateAsync({
        code: String(data.get("code")),
        title: String(data.get("title")),
        kind: String(data.get("kind")) as "percent" | "fixed",
        value: Number(data.get("value")),
        maxDiscount: data.get("maxDiscount")
          ? Number(data.get("maxDiscount"))
          : null,
        minOrderAmount: Number(data.get("minOrderAmount") || 0),
        budget: Number(data.get("budget")),
        perUserLimit: Number(data.get("perUserLimit") || 1),
        clubIds: [],
        startsAt: now.toISOString(),
        endsAt: nextMonth.toISOString(),
      });
      event.currentTarget.reset();
      toast.success("کمپین تخفیف ساخته شد");
    } catch {
      toast.danger("ساخت کمپین ناموفق بود");
    }
  };

  return (
    <main className="flex-1 space-y-6 overflow-auto p-4 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">مالی، تسویه و مزایا</h1>
          <p className="mt-1 text-sm text-muted">
            تأیید دستی پرداخت بانکی، تطبیق تراکنش‌ها و مدیریت اعتبار
          </p>
        </div>
        <Button
          variant="secondary"
          isPending={reconciliation.isPending}
          onPress={async () => {
            try {
              const result = await reconciliation.mutateAsync();
              toast.success(
                `${money.format(result.matched)} تراکنش با موفقیت تطبیق داده شد`,
              );
            } catch {
              toast.danger("اجرای تطبیق ناموفق بود");
            }
          }}
        >
          اجرای Reconciliation
        </Button>
      </div>

      <Card className="rounded-[1.75rem] border border-border bg-surface p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">درخواست‌های تسویه</h2>
          <select
            className={inputClass}
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            aria-label="فیلتر وضعیت تسویه"
          >
            <option value="">همه</option>
            <option value="requested">در انتظار</option>
            <option value="paid">پرداخت‌شده</option>
            <option value="rejected">ردشده</option>
          </select>
        </div>
        {payouts.isPending ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : !payouts.data?.items.length ? (
          <p className="py-10 text-center text-muted">درخواستی وجود ندارد.</p>
        ) : (
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="درخواست‌های تسویه">
                <Table.Header>
                  <Table.Column isRowHeader>ذی‌نفع</Table.Column>
                  <Table.Column>مبلغ</Table.Column>
                  <Table.Column>شبا</Table.Column>
                  <Table.Column>وضعیت</Table.Column>
                  <Table.Column>عملیات</Table.Column>
                </Table.Header>
                <Table.Body>
                  {payouts.data.items.map((item) => (
                    <Table.Row key={item.id} id={item.id}>
                      <Table.Cell>
                        {item.providerType === "club" ? "باشگاه" : "مربی"}
                      </Table.Cell>
                      <Table.Cell>{money.format(item.amount)} ریال</Table.Cell>
                      <Table.Cell dir="ltr">{item.iban}</Table.Cell>
                      <Table.Cell>
                        <Chip size="sm">{item.status}</Chip>
                      </Table.Cell>
                      <Table.Cell>
                        {item.status === "requested" ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="primary"
                              onPress={() => void decide(item.id, "paid")}
                            >
                              پرداخت شد
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onPress={() => void decide(item.id, "rejected")}
                            >
                              رد
                            </Button>
                          </div>
                        ) : (
                          item.bankReference || "—"
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

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="rounded-[1.75rem] border border-border bg-surface p-5">
          <h2 className="text-lg font-semibold">افزایش اعتبار کیف پول</h2>
          <form className="mt-4 grid gap-3" onSubmit={submitCredit}>
            <input
              required
              name="userId"
              minLength={24}
              maxLength={24}
              className={inputClass}
              placeholder="شناسه کاربر"
            />
            <input
              required
              name="amount"
              type="number"
              min={1}
              className={inputClass}
              placeholder="مبلغ (ریال)"
            />
            <input
              name="note"
              className={inputClass}
              placeholder="علت افزایش اعتبار"
            />
            <Button
              type="submit"
              variant="primary"
              isPending={credit.isPending}
            >
              ثبت اعتبار
            </Button>
          </form>
        </Card>
        <Card className="rounded-[1.75rem] border border-border bg-surface p-5">
          <h2 className="text-lg font-semibold">کمپین تخفیف یک‌ماهه</h2>
          <form
            className="mt-4 grid gap-3 sm:grid-cols-2"
            onSubmit={submitDiscount}
          >
            <input
              required
              name="code"
              className={inputClass}
              placeholder="کد (مثلاً START20)"
            />
            <input
              required
              name="title"
              className={inputClass}
              placeholder="عنوان کمپین"
            />
            <select name="kind" className={inputClass}>
              <option value="percent">درصدی</option>
              <option value="fixed">مبلغ ثابت</option>
            </select>
            <input
              required
              name="value"
              type="number"
              min={1}
              className={inputClass}
              placeholder="مقدار"
            />
            <input
              name="maxDiscount"
              type="number"
              min={1}
              className={inputClass}
              placeholder="سقف تخفیف"
            />
            <input
              name="minOrderAmount"
              type="number"
              min={0}
              className={inputClass}
              placeholder="حداقل خرید"
            />
            <input
              required
              name="budget"
              type="number"
              min={1}
              className={inputClass}
              placeholder="بودجه کل"
            />
            <input
              name="perUserLimit"
              type="number"
              min={1}
              defaultValue={1}
              className={inputClass}
              placeholder="سقف هر کاربر"
            />
            <Button
              type="submit"
              variant="primary"
              isPending={discount.isPending}
              className="sm:col-span-2"
            >
              ساخت کمپین
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}

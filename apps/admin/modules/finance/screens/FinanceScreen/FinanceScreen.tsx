"use client";

import { FormSelect, FormOption } from "@repo/ui/form-select";
import { Input as HeroInput } from "@heroui/react";
import {
  type Payout,
  useAdminPayouts,
  useCreateDiscountCampaign,
  useCreditWallet,
  useReviewPayout,
  useRunReconciliation,
} from "@api";
import {
  Button,
  Card,
  Chip,
  Label,
  Modal,
  Spinner,
  Table,
  TextArea,
  toast,
} from "@heroui/react";
import { EntityDetailsModal } from "@ui/entity-details-modal";
import { FormEvent, useState } from "react";

const money = new Intl.NumberFormat("fa-IR");
const inputClass =
  "h-11 rounded-xl border border-border bg-surface px-3 text-sm outline-none focus:border-primary";

export function FinanceScreen() {
  const [status, setStatus] = useState("requested");
  const [selected, setSelected] = useState<Payout | null>(null);
  const [payoutAction, setPayoutAction] = useState<{
    item: Payout;
    status: "paid" | "rejected";
  } | null>(null);
  const [bankReference, setBankReference] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [discountKind, setDiscountKind] = useState<"percent" | "fixed">(
    "percent",
  );
  const payouts = useAdminPayouts(status || undefined);
  const review = useReviewPayout();
  const reconciliation = useRunReconciliation();
  const credit = useCreditWallet();
  const discount = useCreateDiscountCampaign();

  const decide = async () => {
    if (!payoutAction || review.isPending) return;
    const reference = bankReference.trim();
    const note = reviewNote.trim();
    if (payoutAction.status === "paid" && reference.length < 3) {
      setReviewError("شماره پیگیری بانکی باید حداقل ۳ نویسه باشد.");
      return;
    }
    if (note.length < 3) {
      setReviewError("یادداشت تصمیم باید حداقل ۳ نویسه باشد.");
      return;
    }
    try {
      await review.mutateAsync({
        payoutId: payoutAction.item.id,
        status: payoutAction.status,
        note,
        bankReference: payoutAction.status === "paid" ? reference : undefined,
      });
      toast.success("درخواست تسویه به‌روزرسانی شد");
      setPayoutAction(null);
      setBankReference("");
      setReviewNote("");
      setReviewError("");
    } catch {
      toast.danger("ثبت نتیجه تسویه ناموفق بود");
    }
  };

  const openPayoutAction = (item: Payout, decision: "paid" | "rejected") => {
    setPayoutAction({ item, status: decision });
    setBankReference("");
    setReviewNote("");
    setReviewError("");
  };

  const markUnderReview = async (item: Payout) => {
    try {
      await review.mutateAsync({
        payoutId: item.id,
        status: "under_review",
        note: "بررسی مدارک و اطلاعات بانکی آغاز شد.",
      });
      toast.success("درخواست وارد مرحله بررسی شد");
    } catch {
      toast.danger("تغییر وضعیت تسویه ناموفق بود");
    }
  };

  const submitCredit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      await credit.mutateAsync({
        userId: String(data.get("userId")).trim(),
        amount: Number(data.get("amount")),
        source: "admin",
        idempotencyKey: crypto.randomUUID(),
        note: String(data.get("note") ?? "").trim(),
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
        code: String(data.get("code")).trim().toUpperCase(),
        title: String(data.get("title")).trim(),
        kind: discountKind,
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
          <FormSelect
            className={inputClass}
            value={status}
            onChange={(event) => setStatus(event)}
            aria-label="فیلتر وضعیت تسویه"
          >
            <FormOption value="">همه</FormOption>
            <FormOption value="requested">در انتظار</FormOption>
            <FormOption value="under_review">در حال بررسی</FormOption>
            <FormOption value="paid">پرداخت‌شده</FormOption>
            <FormOption value="rejected">ردشده</FormOption>
          </FormSelect>
        </div>
        {payouts.isPending ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : payouts.isError ? (
          <div className="py-10 text-center">
            <p className="text-muted">دریافت درخواست‌های تسویه ناموفق بود.</p>
            <Button
              className="mt-4"
              size="sm"
              variant="secondary"
              onPress={() => payouts.refetch()}
            >
              تلاش دوباره
            </Button>
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
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onPress={() => setSelected(item)}
                          >
                            جزئیات
                          </Button>
                          {item.status === "requested" ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              onPress={() => void markUnderReview(item)}
                            >
                              شروع بررسی
                            </Button>
                          ) : null}
                          {["requested", "under_review"].includes(
                            item.status,
                          ) ? (
                            <>
                              <Button
                                size="sm"
                                variant="primary"
                                onPress={() => openPayoutAction(item, "paid")}
                              >
                                پرداخت شد
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onPress={() =>
                                  openPayoutAction(item, "rejected")
                                }
                              >
                                رد
                              </Button>
                            </>
                          ) : null}
                        </div>
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
            <div className="grid gap-1.5">
              <label htmlFor="wallet-user-id" className="text-sm font-medium">
                شناسه کاربر
              </label>
              <HeroInput
                id="wallet-user-id"
                required
                name="userId"
                minLength={24}
                maxLength={24}
                pattern="[a-fA-F0-9]{24}"
                title="شناسه کاربر باید ۲۴ نویسه و شامل اعداد یا حروف انگلیسی A تا F باشد."
                dir="ltr"
                autoComplete="off"
                className={inputClass}
                placeholder="مثلاً 64f..."
              />
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="wallet-amount" className="text-sm font-medium">
                مبلغ (ریال)
              </label>
              <HeroInput
                id="wallet-amount"
                required
                name="amount"
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                className={inputClass}
                placeholder="مبلغ مثبت"
              />
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="wallet-note" className="text-sm font-medium">
                علت افزایش اعتبار
              </label>
              <HeroInput
                id="wallet-note"
                required
                name="note"
                minLength={3}
                maxLength={500}
                className={inputClass}
                placeholder="حداقل ۳ نویسه"
              />
            </div>
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
            <div className="grid gap-1.5">
              <label htmlFor="discount-code" className="text-sm font-medium">
                کد تخفیف
              </label>
              <HeroInput
                id="discount-code"
                required
                name="code"
                minLength={3}
                maxLength={32}
                pattern="[A-Za-z0-9_-]{3,32}"
                title="کد باید ۳ تا ۳۲ نویسه و فقط شامل حروف انگلیسی، عدد، خط تیره یا زیرخط باشد."
                dir="ltr"
                autoComplete="off"
                className={inputClass}
                placeholder="START20"
              />
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="discount-title" className="text-sm font-medium">
                عنوان کمپین
              </label>
              <HeroInput
                id="discount-title"
                required
                name="title"
                minLength={3}
                maxLength={120}
                className={inputClass}
                placeholder="عنوان قابل تشخیص"
              />
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="discount-kind" className="text-sm font-medium">
                نوع تخفیف
              </label>
              <FormSelect
                aria-label="kind"
                id="discount-kind"
                name="kind"
                className={inputClass}
                value={discountKind}
                onChange={(event) =>
                  setDiscountKind(event as "percent" | "fixed")
                }
              >
                <FormOption value="percent">درصدی</FormOption>
                <FormOption value="fixed">مبلغ ثابت</FormOption>
              </FormSelect>
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="discount-value" className="text-sm font-medium">
                {discountKind === "percent" ? "درصد تخفیف" : "مبلغ تخفیف"}
              </label>
              <HeroInput
                id="discount-value"
                required
                name="value"
                type="number"
                min={1}
                max={discountKind === "percent" ? 100 : undefined}
                step={1}
                inputMode="numeric"
                className={inputClass}
                placeholder={
                  discountKind === "percent" ? "۱ تا ۱۰۰" : "مبلغ مثبت"
                }
              />
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="discount-max" className="text-sm font-medium">
                سقف مبلغ تخفیف
              </label>
              <HeroInput
                id="discount-max"
                name="maxDiscount"
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                className={inputClass}
                placeholder="اختیاری"
              />
            </div>
            <div className="grid gap-1.5">
              <label
                htmlFor="discount-min-order"
                className="text-sm font-medium"
              >
                حداقل خرید
              </label>
              <HeroInput
                id="discount-min-order"
                name="minOrderAmount"
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                className={inputClass}
                placeholder="پیش‌فرض: صفر"
              />
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="discount-budget" className="text-sm font-medium">
                بودجه کل
              </label>
              <HeroInput
                id="discount-budget"
                required
                name="budget"
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                className={inputClass}
                placeholder="مبلغ مثبت"
              />
            </div>
            <div className="grid gap-1.5">
              <label
                htmlFor="discount-user-limit"
                className="text-sm font-medium"
              >
                سقف استفاده هر کاربر
              </label>
              <HeroInput
                id="discount-user-limit"
                name="perUserLimit"
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                defaultValue={1}
                className={inputClass}
                placeholder="حداقل ۱"
              />
            </div>
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
      <EntityDetailsModal
        isOpen={Boolean(selected)}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSelected(null);
        }}
        title="جزئیات درخواست تسویه"
        description="اطلاعات ذی‌نفع، حساب مقصد و نتیجه بررسی مالی"
        sections={
          selected
            ? [
                {
                  title: "درخواست",
                  items: [
                    { label: "شناسه تسویه", value: selected.id, dir: "ltr" },
                    {
                      label: "نوع ذی‌نفع",
                      value:
                        selected.providerType === "club" ? "باشگاه" : "مربی",
                    },
                    {
                      label: "شناسه ذی‌نفع",
                      value: selected.providerId,
                      dir: "ltr",
                    },
                    {
                      label: "مبلغ",
                      value: `${money.format(selected.amount)} ریال`,
                    },
                    { label: "شماره شبا", value: selected.iban, dir: "ltr" },
                    { label: "وضعیت", value: selected.status },
                    {
                      label: "زمان درخواست",
                      value: new Intl.DateTimeFormat("fa-IR", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(selected.createdAt)),
                    },
                  ],
                },
                {
                  title: "بررسی بانکی",
                  items: [
                    {
                      label: "یادداشت بررسی",
                      value: selected.reviewNote,
                      wide: true,
                    },
                    {
                      label: "شماره پیگیری بانکی",
                      value: selected.bankReference,
                      dir: "ltr",
                    },
                    {
                      label: "زمان بررسی",
                      value: selected.reviewedAt
                        ? new Intl.DateTimeFormat("fa-IR", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(new Date(selected.reviewedAt))
                        : null,
                    },
                    {
                      label: "زمان پرداخت",
                      value: selected.paidAt
                        ? new Intl.DateTimeFormat("fa-IR", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(new Date(selected.paidAt))
                        : null,
                    },
                  ],
                },
              ]
            : []
        }
      />
      <Modal.Backdrop
        isOpen={Boolean(payoutAction)}
        onOpenChange={(isOpen) => {
          if (!isOpen) setPayoutAction(null);
        }}
        variant="blur"
      >
        <Modal.Container size="md">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>
                {payoutAction?.status === "paid"
                  ? "ثبت پرداخت تسویه"
                  : "رد درخواست تسویه"}
              </Modal.Heading>
              <p className="mt-1 text-sm leading-6 text-muted">
                این تصمیم در سابقه مالی و رویدادهای مدیریتی ثبت می‌شود.
              </p>
            </Modal.Header>
            <Modal.Body>
              <form
                id="payout-review-form"
                className="grid gap-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  void decide();
                }}
              >
                {payoutAction?.status === "paid" ? (
                  <div className="grid gap-1.5">
                    <Label
                      htmlFor="payout-bank-reference"
                      className="text-sm font-medium"
                    >
                      شماره پیگیری بانکی
                    </Label>
                    <HeroInput
                      id="payout-bank-reference"
                      required
                      minLength={3}
                      maxLength={120}
                      value={bankReference}
                      onChange={(event) => {
                        setBankReference(event.target.value);
                        if (reviewError) setReviewError("");
                      }}
                      dir="ltr"
                      autoComplete="off"
                      className={inputClass}
                    />
                  </div>
                ) : null}
                <div className="grid gap-1.5">
                  <Label
                    htmlFor="payout-review-note"
                    className="text-sm font-medium"
                  >
                    یادداشت تصمیم
                  </Label>
                  <TextArea
                    id="payout-review-note"
                    required
                    minLength={3}
                    maxLength={1000}
                    value={reviewNote}
                    onChange={(event) => {
                      setReviewNote(event.target.value);
                      if (reviewError) setReviewError("");
                    }}
                    rows={4}
                    className="rounded-xl border border-border bg-surface-secondary px-3 py-2 text-sm"
                    aria-describedby={
                      reviewError ? "payout-review-error" : undefined
                    }
                  />
                </div>
                {reviewError ? (
                  <p
                    id="payout-review-error"
                    role="alert"
                    className="text-sm text-danger"
                  >
                    {reviewError}
                  </p>
                ) : null}
              </form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onPress={() => setPayoutAction(null)}>
                انصراف
              </Button>
              <Button
                type="submit"
                form="payout-review-form"
                isPending={review.isPending}
              >
                ثبت تصمیم
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </main>
  );
}

"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent } from "react";
import { Button, Card, Input, toast } from "@heroui/react";
import { FormOption, FormSelect } from "@repo/ui/form-select";
import { IranDateInput } from "@repo/ui/iran-date-input";
import { PanelPriceField } from "@/components/form/PanelPriceField";
import { usePayoutBalance, useRequestPayout } from "@api";
import { useClubStudents, useCreateClubPayment } from "@api/business";
import { useSelectedClub } from "@/lib/use-selected-club";

export function PaymentFormScreen({
  requestedClubId,
  mode = "receipt",
}: {
  requestedClubId?: string;
  mode?: "receipt" | "payout";
}) {
  const router = useRouter();
  const { clubs, clubId: defaultClubId } = useSelectedClub();
  const clubId = clubs.data?.items.some((club) => club.id === requestedClubId)
    ? requestedClubId!
    : defaultClubId;
  const students = useClubStudents(clubId);
  const create = useCreateClubPayment(clubId);
  const balance = usePayoutBalance("club", clubId);
  const payout = useRequestPayout();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      if (mode === "payout")
        await payout.mutateAsync({
          providerType: "club",
          providerId: clubId,
          amount: Number(data.get("amount")),
          iban: String(data.get("iban"))
            .replaceAll(" ", "")
            .trim()
            .toUpperCase(),
        });
      else
        await create.mutateAsync({
          studentId: String(data.get("studentId")),
          type: String(data.get("type")) as "tuition" | "session" | "other",
          title: String(data.get("title")),
          amount: Number(data.get("amount")),
          currency: "IRR",
          paidAt: new Date(String(data.get("paidAt"))).toISOString(),
          method: String(data.get("method")) as
            "cash" | "card" | "transfer" | "other",
          notes: String(data.get("notes") ?? ""),
        });
      toast.success(
        mode === "payout" ? "درخواست تسویه ثبت شد" : "پرداخت ثبت شد",
      );
      router.push("/payments");
    } catch {
      toast.danger("ثبت انجام نشد؛ اطلاعات را بررسی کنید");
    }
  }
  return (
    <main className="flex-1 p-4 lg:p-6">
      <div className="mx-auto max-w-3xl">
        <Link href="/payments" className="text-sm text-accent">
          بازگشت به پرداخت‌ها
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">
          {mode === "payout" ? "درخواست تسویه" : "ثبت پرداخت"}
        </h1>
        <Card className="mt-6 app-card p-5 shadow-none active:scale-100">
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <p className="text-sm text-muted sm:col-span-2">
              باشگاه:{" "}
              {clubs.data?.items.find((club) => club.id === clubId)?.name ??
                "—"}
            </p>
            {mode === "receipt" ? (
              <>
                <label className="grid gap-2 text-sm">
                  شاگرد
                  <FormSelect aria-label="شاگرد" name="studentId" required>
                    <FormOption value="">انتخاب کنید</FormOption>
                    {students.data?.items.map((student) => (
                      <FormOption key={student.id} value={student.id}>
                        {student.firstName} {student.lastName}
                      </FormOption>
                    ))}
                  </FormSelect>
                </label>
                <label className="grid gap-2 text-sm">
                  نوع پرداخت
                  <FormSelect
                    aria-label="نوع پرداخت"
                    name="type"
                    defaultValue="tuition"
                  >
                    <FormOption value="tuition">شهریه</FormOption>
                    <FormOption value="session">سانس</FormOption>
                    <FormOption value="other">سایر</FormOption>
                  </FormSelect>
                </label>
                <label className="grid gap-2 text-sm">
                  عنوان
                  <Input variant="secondary" name="title" required />
                </label>
                <label className="grid gap-2 text-sm">
                  تاریخ پرداخت
                  <IranDateInput
                    name="paidAt"
                    required
                    defaultValue={new Date().toISOString().slice(0, 10)}
                  />
                </label>
                <label className="grid gap-2 text-sm">
                  روش پرداخت
                  <FormSelect
                    aria-label="روش پرداخت"
                    name="method"
                    defaultValue="card"
                  >
                    <FormOption value="card">کارتخوان</FormOption>
                    <FormOption value="cash">نقدی</FormOption>
                    <FormOption value="transfer">انتقال</FormOption>
                    <FormOption value="other">سایر</FormOption>
                  </FormSelect>
                </label>
                <label className="grid gap-2 text-sm sm:col-span-2">
                  یادداشت
                  <textarea
                    name="notes"
                    rows={3}
                    className="rounded-xl border border-default p-3"
                  />
                </label>
              </>
            ) : (
              <>
                <p className="text-sm text-muted sm:col-span-2">
                  موجودی قابل برداشت:{" "}
                  {(balance.data?.availableAmount ?? 0).toLocaleString("fa-IR")}{" "}
                  ریال
                </p>
                <label className="grid gap-2 text-sm">
                  شماره شبا
                  <Input
                    variant="secondary"
                    name="iban"
                    required
                    dir="ltr"
                    pattern="IR\\d{24}"
                    placeholder="IR000000000000000000000000"
                  />
                </label>
              </>
            )}
            <PanelPriceField
              label="مبلغ (ریال)"
              name="amount"
              minValue={1}
              maxValue={
                mode === "payout" ? balance.data?.availableAmount : undefined
              }
              isRequired
            />
            <div className="flex gap-2 sm:col-span-2">
              <Button
                type="submit"
                variant="primary"
                isDisabled={!clubId}
                isPending={create.isPending || payout.isPending}
              >
                ثبت
              </Button>
              <Button variant="ghost">
                <Link href="/payments">انصراف</Link>
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </main>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import { Button, Card, Spinner, toast } from "@heroui/react";
import {
  useClubStudents,
  useStudentAccounts,
  useCreateClubPayment,
  useAllocateClubReceipt,
  useVoidClubReceipt,
  useRefundClubReceipt,
  useReconcileStudentAccount,
  type StudentClassAccount,
  type ClubManualPayment,
} from "@api/business";
import { IranDateInput } from "@repo/ui/iran-date-input";
import {
  asciiDigits,
  tehranLocalDate,
  tehranLocalValue,
} from "@repo/ui/iran-date";

const field =
  "mt-1 min-h-11 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm";
const money = (value: number | null, currency = "IRR") =>
  value === null
    ? "نیازمند تطبیق"
    : `${value.toLocaleString("fa-IR")} ${currency === "IRR" ? "ریال" : currency}`;
const amount = (data: FormData, name: string) =>
  Number(asciiDigits(String(data.get(name))).replaceAll(",", ""));
const when = (date: string) =>
  new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Tehran",
  }).format(new Date(date));
const failure = (error: unknown) => {
  const value = error as {
    response?: { data?: { error?: { message?: string }; message?: string } };
    message?: string;
  };
  toast.danger(
    value.response?.data?.error?.message ??
      value.response?.data?.message ??
      "تغییر ثبت نشد؛ مانده و اطلاعات را دوباره بررسی کنید",
  );
};

export function StudentAccounts({
  clubId,
  writable = true,
}: {
  clubId: string;
  writable?: boolean;
}) {
  const students = useClubStudents(clubId);
  const [studentId, setStudentId] = useState(() =>
    typeof window === "undefined"
      ? ""
      : (new URLSearchParams(window.location.search).get("studentId") ?? ""),
  );
  const query = useStudentAccounts(clubId, studentId);
  return (
    <Card className="mt-5 space-y-4 p-5" aria-label="حساب شهریه شاگرد">
      <div>
        <h2 className="font-bold">حساب شهریه و رسیدها</h2>
        <p className="mt-1 text-sm text-muted">
          ماندهٔ هر ثبت‌نام، رسیدهای مرتبط و اصلاحات حساب در یک جا.
        </p>
      </div>
      <label>
        حساب شاگرد
        <select
          className={field}
          value={studentId}
          onChange={(event) => setStudentId(event.target.value)}
        >
          <option value="">انتخاب شاگرد</option>
          {students.data?.items.map((student) => (
            <option key={student.id} value={student.id}>
              {student.firstName} {student.lastName} · {student.phone}
            </option>
          ))}
        </select>
      </label>
      {studentId &&
        (query.isPending ? (
          <Spinner />
        ) : query.isError ? (
          <div role="alert">
            حساب دریافت نشد.{" "}
            <Button variant="ghost" onPress={() => query.refetch()}>
              تلاش دوباره
            </Button>
          </div>
        ) : (
          <>
            {!query.data?.items.length && (
              <p className="text-sm text-muted">
                این شاگرد ثبت‌نام کلاسی ندارد.
              </p>
            )}
            {query.data?.items.map((account) => (
              <ClassAccount
                key={`${account.enrollmentId}:${account.revision}`}
                clubId={clubId}
                account={account}
                writable={writable}
              />
            ))}
            <h3 className="font-semibold">رسیدهای این شاگرد</h3>
            {query.data?.receipts?.length ? (
              query.data.receipts.map((receipt) => (
                <Receipt
                  key={`${receipt.id}:${receipt.updatedAt}`}
                  clubId={clubId}
                  receipt={receipt}
                  accounts={query.data.items}
                  writable={writable}
                />
              ))
            ) : (
              <p className="text-sm text-muted">رسیدی ثبت نشده است.</p>
            )}
          </>
        ))}
    </Card>
  );
}

function ClassAccount({
  clubId,
  account,
  writable,
}: {
  clubId: string;
  account: StudentClassAccount;
  writable: boolean;
}) {
  const create = useCreateClubPayment(clubId);
  const reconcile = useReconcileStudentAccount(clubId);
  const submitReceipt = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      await create.mutateAsync({
        studentId: account.studentId,
        enrollmentId: account.enrollmentId,
        type: "tuition",
        title: `شهریه ${account.title}`.slice(0, 120),
        amount: amount(data, "amount"),
        currency: account.currency,
        paidAt: tehranLocalDate(`${data.get("paidAt")}T12:00`).toISOString(),
        method: String(data.get("method")) as "cash",
        notes: String(data.get("notes")),
      });
      form.reset();
      toast.success("رسید به ثبت‌نام وصل شد و مانده به‌روز شد");
    } catch (error) {
      failure(error);
    }
  };
  const submitReconciliation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      await reconcile.mutateAsync({
        enrollmentId: account.enrollmentId,
        expectedRevision: account.revision,
        openingPaidAmount: amount(data, "openingPaidAmount"),
        waivedAmount: amount(data, "waivedAmount"),
        reason: String(data.get("reason")),
      });
      toast.success("ماندهٔ قدیمی تطبیق داده شد");
    } catch (error) {
      failure(error);
    }
  };
  return (
    <section
      className="space-y-3 rounded-xl border border-border p-4"
      aria-label={`حساب ${account.title}`}
    >
      <h3 className="font-semibold">{account.title}</h3>
      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-muted">شهریه قرارداد</dt>
          <dd>{money(account.agreedPrice, account.currency)}</dd>
        </div>
        <div>
          <dt className="text-muted">وصول‌شده</dt>
          <dd>{money(account.paidAmount, account.currency)}</dd>
        </div>
        <div>
          <dt className="text-muted">بخشودگی</dt>
          <dd>{money(account.waivedAmount, account.currency)}</dd>
        </div>
        <div>
          <dt className="text-muted">ماندهٔ شهریه</dt>
          <dd>{money(account.outstandingAmount, account.currency)}</dd>
        </div>
      </dl>
      {(account.creditAmount ?? 0) > 0 && (
        <p className="text-sm text-warning">
          بستانکاری شاگرد: {money(account.creditAmount, account.currency)}؛
          بازگشت وجه باید جداگانه ثبت و پیگیری شود.
        </p>
      )}
      {account.mode === "online" ? (
        <p className="text-sm text-muted">
          پرداخت این ثبت‌نام در اپ، به‌صورت شبیه‌سازی مدیریت می‌شود. رسید دستی
          برای آن ثبت نمی‌شود.
        </p>
      ) : account.mode === "legacy" ? (
        <>
          <p className="text-sm text-warning">
            این قرارداد قدیمی است. جمع وصول‌شده مشخص نیست؛ مانده حدس زده
            نمی‌شود.
          </p>
          {writable && (
            <details>
              <summary className="cursor-pointer py-2 font-medium">
                تطبیق ماندهٔ قدیمی
              </summary>
              <form
                className="mt-3 grid gap-3 sm:grid-cols-2"
                onSubmit={submitReconciliation}
              >
                <p className="text-sm text-muted sm:col-span-2">
                  فقط پرداخت‌هایی را در «وصول‌شدهٔ قبل» وارد کنید که هیچ رسیدی
                  در این سامانه ندارند. رسیدهای موجود را پس از تطبیق، از بخش
                  پایین به قرارداد وصل کنید؛ آن‌ها را دوباره جمع نزنید.
                </p>
                <label>
                  وصول‌شدهٔ قبل بدون رسید (ریال)
                  <input
                    name="openingPaidAmount"
                    inputMode="numeric"
                    defaultValue="0"
                    required
                    className={field}
                  />
                </label>
                <label>
                  بخشودگی قبلی (ریال)
                  <input
                    name="waivedAmount"
                    inputMode="numeric"
                    defaultValue="0"
                    required
                    className={field}
                  />
                </label>
                <label className="sm:col-span-2">
                  دلیل و مستند تطبیق
                  <input
                    name="reason"
                    required
                    minLength={5}
                    maxLength={500}
                    className={field}
                  />
                </label>
                <Button type="submit" isPending={reconcile.isPending}>
                  ثبت تطبیق حساب
                </Button>
              </form>
            </details>
          )}
        </>
      ) : (
        writable &&
        ["active", "completed"].includes(account.status) &&
        (account.outstandingAmount ?? 0) > 0 && (
          <details>
            <summary className="cursor-pointer py-2 font-medium">
              ثبت قسط یا تسویهٔ شهریه
            </summary>
            <form
              className="mt-3 grid gap-3 sm:grid-cols-2"
              onSubmit={submitReceipt}
            >
              <label>
                مبلغ رسید شهریه (ریال)
                <input
                  name="amount"
                  required
                  inputMode="numeric"
                  className={field}
                />
              </label>
              <label>
                تاریخ دریافت شهریه
                <IranDateInput
                  name="paidAt"
                  required
                  defaultValue={tehranLocalValue(
                    new Date().toISOString(),
                  ).slice(0, 10)}
                  className={field}
                />
              </label>
              <label>
                روش دریافت
                <select name="method" className={field}>
                  <option value="card">کارتخوان</option>
                  <option value="cash">نقدی</option>
                  <option value="transfer">کارت‌به‌کارت</option>
                </select>
              </label>
              <label>
                شماره پیگیری یا توضیح
                <input name="notes" maxLength={500} className={field} />
              </label>
              <p className="text-xs text-muted sm:col-span-2">
                این فرم رسیدِ وجه دریافت‌شده را ثبت می‌کند. انتقال بانکی انجام
                نمی‌دهد.
              </p>
              <Button type="submit" isPending={create.isPending}>
                ثبت رسید شهریه
              </Button>
            </form>
          </details>
        )
      )}
      {account.changes.length > 0 && (
        <details>
          <summary className="cursor-pointer text-sm text-muted">
            تاریخچهٔ حساب
          </summary>
          <ul className="mt-2 space-y-2 text-xs">
            {account.changes.map((change, index) => (
              <li key={`${change.at}:${index}`}>
                {when(change.at)} · {change.reason}
                <span className="block break-all text-muted">
                  ثبت‌کننده: {change.actorId}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

function Receipt({
  clubId,
  receipt,
  accounts,
  writable,
}: {
  clubId: string;
  receipt: ClubManualPayment;
  accounts: StudentClassAccount[];
  writable: boolean;
}) {
  const allocate = useAllocateClubReceipt(clubId);
  const voidReceipt = useVoidClubReceipt(clubId);
  const account = accounts.find(
    (item) => item.enrollmentId === receipt.enrollmentId,
  );
  const submit = async (
    event: FormEvent<HTMLFormElement>,
    action: "allocate" | "void",
  ) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      if (action === "allocate")
        await allocate.mutateAsync({
          receiptId: receipt.id,
          enrollmentId: String(data.get("enrollmentId")),
          reason: String(data.get("reason")),
        });
      else
        await voidReceipt.mutateAsync({
          receiptId: receipt.id,
          reason: String(data.get("reason")),
        });
      toast.success(
        action === "allocate"
          ? "رسید به قرارداد وصل شد"
          : "رسید باطل شد؛ سابقه حفظ شد",
      );
    } catch (error) {
      failure(error);
    }
  };
  return (
    <article className="space-y-2 rounded-xl border border-border p-4 text-sm">
      <p className="font-medium">
        {receipt.title} · {money(receipt.amount, receipt.currency)}
      </p>
      <p className="text-xs text-muted">
        {when(receipt.paidAt)} · شناسهٔ رسید: {receipt.id}
      </p>
      <p>
        {receipt.voidedAt
          ? `باطل‌شده: ${receipt.voidReason}`
          : account
            ? `بابت ${account.title}`
            : "رسید تخصیص‌نیافته؛ از ماندهٔ هیچ کلاسی کم نشده است"}
      </p>
      {writable && !receipt.voidedAt && (
        <div className="space-y-3">
          {!receipt.enrollmentId && (
            <details>
              <summary className="cursor-pointer">
                اتصال رسید موجود به ثبت‌نام
              </summary>
              <form
                className="mt-2 grid gap-2 sm:grid-cols-2"
                onSubmit={(event) => submit(event, "allocate")}
              >
                <label>
                  قرارداد مقصد
                  <select name="enrollmentId" required className={field}>
                    <option value="">انتخاب قرارداد</option>
                    {accounts
                      .filter(
                        (item) =>
                          item.mode === "ledger" &&
                          ["active", "completed"].includes(item.status) &&
                          (item.outstandingAmount ?? 0) >=
                            receipt.amount - (receipt.refundedAmount ?? 0),
                      )
                      .map((item) => (
                        <option
                          key={item.enrollmentId}
                          value={item.enrollmentId}
                        >
                          {item.title} · مانده {money(item.outstandingAmount)}
                        </option>
                      ))}
                  </select>
                </label>
                <label>
                  دلیل تخصیص
                  <input
                    name="reason"
                    required
                    minLength={5}
                    maxLength={500}
                    className={field}
                  />
                </label>
                <Button type="submit" isPending={allocate.isPending}>
                  اتصال رسید
                </Button>
              </form>
            </details>
          )}
          {(receipt.refundedAmount ?? 0) === 0 && (
            <details>
              <summary className="cursor-pointer text-danger">
                ابطال رسید اشتباه
              </summary>
              <form
                className="mt-2 space-y-2"
                onSubmit={(event) => submit(event, "void")}
              >
                <p className="text-xs text-muted">
                  فقط برای اصلاح ثبت اشتباه است. این کار بازپرداخت بانکی نیست و
                  ماندهٔ شهریه را برمی‌گرداند.
                </p>
                <label>
                  دلیل ابطال
                  <input
                    name="reason"
                    required
                    minLength={5}
                    maxLength={500}
                    className={field}
                  />
                </label>
                <Button
                  type="submit"
                  variant="danger"
                  isPending={voidReceipt.isPending}
                >
                  ثبت ابطال رسید
                </Button>
              </form>
            </details>
          )}
          <RefundReceipt clubId={clubId} receipt={receipt} />
        </div>
      )}
      {(receipt.refundedAmount ?? 0) > 0 && (
        <p>جمع برگشت وجه: {money(receipt.refundedAmount ?? 0)}</p>
      )}
      {receipt.refunds?.map((refund, index) => (
        <p key={`refund:${index}`} className="text-xs text-muted">
          {when(refund.paidAt)} · برگشت {money(refund.amount)} · {refund.reason}{" "}
          · ثبت‌کننده: {refund.actorId}
        </p>
      ))}
      {receipt.allocationChanges?.map((change, index) => (
        <p key={index} className="text-xs text-muted">
          {when(change.at)} · {change.reason} · ثبت‌کننده: {change.actorId}
        </p>
      ))}
    </article>
  );
}

function RefundReceipt({
  clubId,
  receipt,
}: {
  clubId: string;
  receipt: ClubManualPayment;
}) {
  const refund = useRefundClubReceipt(clubId);
  const remaining = receipt.amount - (receipt.refundedAmount ?? 0);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      await refund.mutateAsync({
        receiptId: receipt.id,
        amount: amount(data, "amount"),
        paidAt: tehranLocalDate(`${data.get("paidAt")}T12:00`).toISOString(),
        method: String(data.get("method")),
        reason: String(data.get("reason")),
      });
      toast.success("بازگشت وجه در حساب ثبت شد");
    } catch (error) {
      failure(error);
    }
  };
  if (remaining <= 0) return null;
  return (
    <details>
      <summary className="cursor-pointer">ثبت وجه برگشت‌داده‌شده</summary>
      <form className="mt-3 grid gap-3 sm:grid-cols-2" onSubmit={submit}>
        <p className="text-xs text-muted sm:col-span-2">
          فقط وجهی را ثبت کنید که قبلاً به شاگرد برگردانده‌اید. این فرم انتقال
          بانکی انجام نمی‌دهد. ماندهٔ قابل برگشت: {money(remaining)}
        </p>
        <label>
          مبلغ وجه برگشتی (ریال)
          <input name="amount" required inputMode="numeric" className={field} />
        </label>
        <label>
          تاریخ برگشت وجه
          <IranDateInput
            name="paidAt"
            required
            defaultValue={tehranLocalValue(new Date().toISOString()).slice(
              0,
              10,
            )}
            className={field}
          />
        </label>
        <label>
          روش برگشت وجه
          <select name="method" className={field}>
            <option value="transfer">انتقال بانکی</option>
            <option value="cash">نقدی</option>
            <option value="card">کارت</option>
          </select>
        </label>
        <label>
          دلیل و پیگیری بازگشت
          <input
            name="reason"
            required
            minLength={5}
            maxLength={500}
            className={field}
          />
        </label>
        <Button type="submit" isPending={refund.isPending}>
          ثبت بازگشت وجه
        </Button>
      </form>
    </details>
  );
}

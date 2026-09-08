import { test, expect } from "@playwright/test";
import {
  publicClubFixture,
  setBrowserSession,
} from "../../application/e2e/support/mock-api";

test("finance reconciles a legacy account, retries an uncertain receipt once, allocates old receipts and voids mistakes", async ({
  page,
}) => {
  const club = {
    ...publicClubFixture(),
    isOwner: false,
    permissions: [
      "club.read",
      "students.read",
      "payments.read",
      "payments.write",
    ],
  };
  let revision = 0;
  let mode = "legacy";
  let opening = 0;
  let failedReply = false;
  const requests: Record<string, unknown>[] = [];
  type Receipt = {
    id: string;
    studentId: string;
    enrollmentId: string | null;
    title: string;
    amount: number;
    currency: string;
    paidAt: string;
    method: string;
    notes: string;
    voidedAt: string | null;
    updatedAt: string;
    idempotencyKey?: string;
    refundedAmount?: number;
    refunds?: Array<Record<string, unknown>>;
    voidReason?: string;
  };
  const receipts: Receipt[] = [
    {
      id: "old-receipt",
      studentId: "student",
      enrollmentId: null,
      title: "رسید دفتر",
      amount: 300,
      currency: "IRR",
      paidAt: "2026-09-07T08:30:00.000Z",
      method: "cash",
      notes: "",
      voidedAt: null,
      updatedAt: "2026-09-07T08:30:00.000Z",
    },
  ];
  const account = () => {
    const paid =
      opening +
      receipts
        .filter((item) => item.enrollmentId === "contract" && !item.voidedAt)
        .reduce(
          (sum, item) => sum + item.amount - (item.refundedAmount ?? 0),
          0,
        );
    return {
      enrollmentId: "contract",
      studentId: "student",
      classId: "class",
      title: "کلاس شهریه",
      agreedPrice: 1000,
      currency: "IRR",
      mode,
      status: "active",
      paymentStatus: paid ? "partial" : "pending",
      paidAmount: mode === "legacy" ? null : paid,
      receiptAmount: paid - opening,
      openingPaidAmount: mode === "legacy" ? null : opening,
      waivedAmount: mode === "legacy" ? null : 0,
      outstandingAmount: mode === "legacy" ? null : 1000 - paid,
      creditAmount: 0,
      revision,
      changes: [],
    };
  };
  await setBrowserSession(page, true);
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    let data: unknown = { items: [] };
    if (path.endsWith("/business/me") || path.endsWith("/account/me"))
      data = {
        id: "finance",
        roles: ["athlete"],
        status: "active",
        hasPassword: true,
      };
    else if (path === "/api/v1/business/clubs") data = { items: [club] };
    else if (path.endsWith("/students"))
      data = {
        items: [
          {
            id: "student",
            firstName: "سارا",
            lastName: "مالی",
            phone: "09121111111",
          },
        ],
      };
    else if (path.endsWith("/students/student/accounts"))
      data = { items: [account()], receipts };
    else if (path.endsWith("/accounts/contract/reconcile")) {
      const body = route.request().postDataJSON();
      expect(body).toMatchObject({
        expectedRevision: 0,
        openingPaidAmount: 100,
        waivedAmount: 0,
        reason: "تطبیق با دفتر قدیمی",
      });
      opening = 100;
      mode = "ledger";
      revision++;
      data = account();
    } else if (
      path.endsWith("/payments") &&
      route.request().method() === "POST"
    ) {
      const body = route.request().postDataJSON();
      requests.push(body);
      data = receipts.find(
        (item) => item.idempotencyKey === body.idempotencyKey,
      );
      if (!data) {
        const receipt: Receipt = {
          id: "new-receipt",
          ...body,
          voidedAt: null,
          updatedAt: new Date().toISOString(),
        } as Receipt;
        data = receipt;
        receipts.push(receipt);
        revision++;
      }
      if (!failedReply) {
        failedReply = true;
        await route.abort("failed");
        return;
      }
    } else if (path.endsWith("/payments")) data = { items: receipts };
    else if (path.endsWith("/payments/new-receipt/void")) {
      expect(route.request().postDataJSON().reason).toBe(
        "رسید اشتباه ثبت شده بود",
      );
      const row = receipts.find((item) => item.id === "new-receipt");
      if (!row) throw new Error("Expected the newly created receipt");
      row.voidedAt = new Date().toISOString();
      row.voidReason = route.request().postDataJSON().reason;
      row.updatedAt = row.voidedAt;
      revision++;
      data = row;
    } else if (path.endsWith("/payments/old-receipt/refunds")) {
      const body = route.request().postDataJSON();
      expect(body).toMatchObject({
        amount: 100,
        method: "transfer",
        reason: "وجه بابت لغو برگشت داده شد",
      });
      receipts[0].refundedAmount = 100;
      receipts[0].refunds = [
        { ...body, actorId: "finance", at: new Date().toISOString() },
      ];
      receipts[0].updatedAt = new Date().toISOString();
      revision++;
      data = receipts[0];
    } else if (path.endsWith("/payments/old-receipt/allocate")) {
      expect(route.request().postDataJSON()).toEqual({
        enrollmentId: "contract",
        reason: "این رسید بابت همین کلاس است",
      });
      receipts[0].enrollmentId = "contract";
      receipts[0].updatedAt = new Date().toISOString();
      revision++;
      data = receipts[0];
    }
    await route.fulfill({ json: { data } });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "پرداخت‌ها", exact: true }).click();
  // Card may render a div, so use the accessible selector shared by either host element.
  const accounts = page.locator('[aria-label="حساب شهریه شاگرد"]');
  await accounts
    .getByRole("combobox", { name: "حساب شاگرد" })
    .selectOption("student");
  const contract = accounts.getByRole("region", { name: "حساب کلاس شهریه" });
  await expect(
    contract.getByText("نیازمند تطبیق", { exact: true }),
  ).toHaveCount(3);
  await contract.getByText("تطبیق ماندهٔ قدیمی", { exact: true }).click();
  await contract.getByLabel("وصول‌شدهٔ قبل بدون رسید (ریال)").fill("۱۰۰");
  await contract.getByLabel("دلیل و مستند تطبیق").fill("تطبیق با دفتر قدیمی");
  await contract.getByRole("button", { name: "ثبت تطبیق حساب" }).click();
  await expect(contract.getByText("۹۰۰ ریال", { exact: true })).toBeVisible();
  await contract.getByText("ثبت قسط یا تسویهٔ شهریه", { exact: true }).click();
  await contract.getByLabel("مبلغ رسید شهریه (ریال)").fill("۴۰۰");
  await contract.getByLabel("تاریخ دریافت شهریه").fill("۱۴۰۵/۰۶/۲۱");
  await contract
    .getByRole("button", { name: "ثبت رسید شهریه", exact: true })
    .click();
  await expect.poll(() => requests.length).toBe(1);
  await expect(
    contract.getByRole("button", { name: "ثبت رسید شهریه", exact: true }),
  ).toBeEnabled();
  await contract
    .getByRole("button", { name: "ثبت رسید شهریه", exact: true })
    .click();
  await expect.poll(() => requests.length).toBe(2);
  expect(requests[0]!.idempotencyKey).toBe(requests[1]!.idempotencyKey);
  expect(requests[0]).toMatchObject({
    amount: 400,
    enrollmentId: "contract",
    paidAt: "2026-09-12T08:30:00.000Z",
  });
  expect(receipts).toHaveLength(2);
  await expect(contract.getByText("۵۰۰ ریال", { exact: true })).toHaveCount(2);
  const newReceipt = accounts
    .locator("article")
    .filter({ hasText: "شهریه کلاس شهریه" });
  await newReceipt.getByText("ابطال رسید اشتباه", { exact: true }).click();
  await newReceipt.getByLabel("دلیل ابطال").fill("رسید اشتباه ثبت شده بود");
  await newReceipt.getByRole("button", { name: "ثبت ابطال رسید" }).click();
  await expect(newReceipt.getByText(/باطل‌شده:/)).toBeVisible();
  await expect(contract.getByText("۹۰۰ ریال", { exact: true })).toBeVisible();
  const oldReceipt = accounts
    .locator("article")
    .filter({ hasText: "رسید دفتر" });
  await oldReceipt
    .getByText("اتصال رسید موجود به ثبت‌نام", { exact: true })
    .click();
  await oldReceipt
    .getByRole("combobox", { name: "قرارداد مقصد" })
    .selectOption("contract");
  await oldReceipt.getByLabel("دلیل تخصیص").fill("این رسید بابت همین کلاس است");
  await oldReceipt
    .getByRole("button", { name: "اتصال رسید", exact: true })
    .click();
  await expect(contract.getByText("۶۰۰ ریال", { exact: true })).toBeVisible();
  await oldReceipt.getByText("ثبت وجه برگشت‌داده‌شده", { exact: true }).click();
  await oldReceipt.getByLabel("مبلغ وجه برگشتی (ریال)").fill("۱۰۰");
  await oldReceipt
    .getByLabel("دلیل و پیگیری بازگشت")
    .fill("وجه بابت لغو برگشت داده شد");
  await oldReceipt
    .getByRole("button", { name: "ثبت بازگشت وجه", exact: true })
    .click();
  await expect(contract.getByText("۷۰۰ ریال", { exact: true })).toBeVisible();
  await expect(
    oldReceipt.getByText("ابطال رسید اشتباه", { exact: true }),
  ).toHaveCount(0);
  await page.reload();
  await page.getByRole("button", { name: "پرداخت‌ها", exact: true }).click();
  await accounts
    .getByRole("combobox", { name: "حساب شاگرد" })
    .selectOption("student");
  await expect(contract.getByText("۷۰۰ ریال", { exact: true })).toBeVisible();
  await expect(newReceipt.getByText(/باطل‌شده:/)).toBeVisible();
});
